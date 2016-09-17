
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

Authenticator.prototype._findMatch = function (clientCert, results) {
  var authenticator = this;
  for (var i = 0, uri, stripped, algorithm; i < results.length; i++) {
    uri = results[i].uri.value;
    stripped = NI.stripQuery(uri);
    algorithm = NI.parseAlgorithm(uri);
    if (authenticator._opts.supportedAlgorithms.indexOf(algorithm) > -1) {
      if (algorithm === authenticator._opts.internalAlgorithm && stripped === clientCert.uri) {
        debug('Found match (internal algorthm: %s) %s', algorithm, uri);
        return uri;
      } else if (stripped === NI.digest(algorithm, clientCert.raw)) {
        debug('Found match (supported algorithm: %s) %s', algorithm, uri);
        return uri;
      } else {
        debug('Certificate URI %s does not match.', uri);
      }
    } else {
      debug('Certificate URI %s is not supported.', uri);
    }
  }
  throw new ERRORS.FailedAuthenticationError('No matching or supported certificate URI in RDF data.');
};

Authenticator.prototype._verifyNetID = function (clientCert, data, format) {
  var authenticator = this;
  return JSONLD.parseRDF(data, format)
    .then(function (data) {
      return STORE.insertGraph(authenticator._store, clientCert, data, 'application/ld+json');
    })
    .then(function () {
      return STORE.queryGraph(authenticator._store, clientCert)
    })
    .then(function (results) {
      return authenticator._findMatch(clientCert, results);
    })
    .finally(function () {
      setImmediate(function() {
        STORE.deleteGraph(authenticator._store, clientCert)
          .catch(function (err) {
            authenticator.emit('error', err);
          });
      });
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
  return authenticator.fetch(clientCert.netID, clientCert)
    .then(function (serverCert) {
      return serverCert || HTTP.getCertAndRDFData(clientCert.netID, authenticator._opts.request)
        .spread(function (serverCert, data, format) {
          serverCert = CERT.fill(serverCert, authenticator._opts.internalAlgorithm);
          return authenticator._verifyNetID(clientCert, data, format)
            .return(serverCert);
        });
    })
    .then(function (serverCert) {
      return authenticator.check(clientCert.netID, clientCert, serverCert)
        .return(serverCert);
    })
    .then(function (serverCert) {
      var auth = {
        netID: clientCert.netID,
        clientCert: clientCert,
        serverCert: serverCert
      };
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
    ? authenticator._opts.fetch.call(authenticator, netID, clientCert)
    : Promise.resolve();
};

Authenticator.prototype.check = function (netID, clientCert, serverCert) {
  var authenticator = this;
  return _.isFunction(authenticator._opts.check)
    ? authenticator._opts.check.call(authenticator, netID, clientCert, serverCert)
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
