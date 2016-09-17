
'use strict';

var NI = require('./ni');
var HTTP = require('./http');
var CERT = require('./cert');
var STORE = require('./store');
var JSONLD = require('./jsonld');
var ERRORS = require('./errors');

var _ = require('lodash');
var util = require('util');
var debug = require('debug')('netid-ni-tls:auth');
var events = require('events');
var Promise = require('./promise');

function Authenticator(opts) {

  var authenticator = this;

  if (!(authenticator instanceof Authenticator)) {
    return new Authenticator(opts);
  }

  events.EventEmitter.call(authenticator);

  authenticator._opts = _.defaultsDeep({}, opts, {
    request: {
      rejectUnauthorized: true
    },
    fetch: null,
    check: null,
    internalAlgorithm: 'sha-256',
    supportedAlgorithms: ['sha-256', 'sha-384', 'sha-512']
  });

  debug('Options', authenticator._opts);

  STORE.create().then(function (store) {
    authenticator._store = store;
    debug('Store created. Authenticator ready.');
    authenticator.emit('ready');
  });

  if (authenticator._opts.supportedAlgorithms.indexOf('sha-256') < 0) {
    throw new Error('Algorithm sha-256 *must* be supported.');
  }

}

util.inherits(Authenticator, events.EventEmitter);
module.exports = Authenticator;

Authenticator.prototype._queryRDFData = function (clientCert, data, format) {
  var authenticator = this;
  var graph = STORE.graph(clientCert.netID);
  return STORE.insert(authenticator._store, graph, data, format)
    .then(function () {
      var query = [
        'PREFIX  ex:    <http://example.org/>',
        'PREFIX  cert:  <http://www.w3.org/ns/auth/cert#>',
        'SELECT ?uri',
        'FROM NAMED ' + graph,
        'WHERE {',
        '  GRAPH ?g {',
        '    ?uri  cert:identity  <' + clientCert.netID + '> ;',
        '          a              cert:X509Certificate .',
        '  }',
        '}'
      ].join('\n');
      return STORE.query(authenticator._store, query)
    })
    .map(function (result) {
      return NI.stripQuery(result.uri.value);
    })
    .finally(function () {
      setImmediate(function () {
        STORE.delete(authenticator._store, graph)
          .catch(function (err) {
            authenticator.emit('error', err);
          });
      });
    });
};

Authenticator.prototype._verifyNetID = function (clientCert) {
  var authenticator = this;
  return HTTP.getCertAndRDFData(clientCert.netID, authenticator._opts.request)
    .spread(function (serverCert, data, format) {
      CERT.fill(serverCert, authenticator._opts.internalAlgorithm);
      return [serverCert, JSONLD.parseRDF(data, format)];
    })
    .spread(function (serverCert, json) {
      return [serverCert, authenticator._queryRDFData(clientCert, json, 'application/ld+json')];
    })
    .spread(function (serverCert, uris) {
      var match = _.find(uris, function (uri) {
        var algorithm = NI.parseAlgorithm(uri);
        return authenticator._opts.supportedAlgorithms.indexOf(algorithm) > -1
          && algorithm === authenticator._opts.internalAlgorithm
            ? uri === clientCert.uri
            : uri === NI.digest(algorithm, clientCert.raw)
      });
      return [serverCert, match];
    });
};

Authenticator.prototype.authenticate = function (clientCert) {
  var authenticator = this;
  if (!authenticator._store) {
    throw new ERRORS.StoreError('Store not ready.');
  }
  if (!clientCert || _.isEmpty(clientCert)) {
    throw new ERRORS.ClientCertificateError('Invalid client certificate.');
  }
  clientCert = CERT.fill(clientCert, authenticator._opts.internalAlgorithm);
  if (!clientCert.netID) {
    throw new ERRORS.ClientCertificateError('No WebID found in client certificate.');
  }
  return authenticator.fetch(clientCert.netID, clientCert.uri)
    .then(function (auth) {
      return auth || authenticator._verifyNetID(clientCert)
        .spread(function (serverCert, match) {
          if (!match) {
            throw new ERRORS.FailedAuthenticationError('No match found in RDF data.');
          }
          var auth = {
            netID: clientCert.netID,
            clientCert: clientCert.uri,
            serverCert: serverCert.uri,
            createdAt: Date.now()
          };
          return authenticator.check(auth)
            .return(auth);
        });
    })
    .then(function (auth) {
      setImmediate(authenticator.emit.bind(authenticator, 'authenticated', auth));
      return auth;
    })
    .catch(ERRORS.FailedAuthenticationError, function (err) {
      return {error: err.message};
    });
};

Authenticator.prototype.fetch = function (netID, clientCert) {
  var authenticator = this;
  return _.isFunction(authenticator._opts.fetch)
    ? authenticator._opts.fetch(netID, clientCert)
    : Promise.resolve();
};

Authenticator.prototype.check = function (auth) {
  var authenticator = this;
  return _.isFunction(authenticator._opts.check)
    ? authenticator._opts.check(auth)
    : Promise.resolve();
};

Authenticator.prototype.middleware = function () {
  var authenticator = this;
  return function (req, res, next) {
    var clientCert = req.connection.encrypted
      && req.connection.getPeerCertificate();
    authenticator.authenticate(clientCert)
      .then(function (auth) {
        req.auth = auth;
        next();
      })
      .catch(next);
  };
};
