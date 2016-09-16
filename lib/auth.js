
'use strict';

var NI = require('./ni');
var HTTP = require('./http');
var CERT = require('./cert');
var STORE = require('./store');
var JSONLD = require('./jsonld');
var ERRORS = require('./errors');

var _ = require('underscore');
var util = require('util');
var debug = require('debug')('netid-ni-tls:auth');
var events = require('events');
var Promise = require('./promise');

function Authenticator(opts) {

  var authenticator = this;

  if (!(authenticator instanceof Authenticator)) {
    return new Authenticator(opts);
  }

  opts = opts || {};
  
  events.EventEmitter.call(authenticator);

  STORE.create().then(function (store) {
    authenticator._store = store;
    authenticator.emit('ready');
  });

  if (!Array.isArray(authenticator.algorithms)) {
    authenticator.algorithms = ['sha-256'];
  }

  if (authenticator.algorithms.indexOf('sha-256') < 0) {
    throw new Error('Algorithm sha-256 must be supported.');
  }

  authenticator._algorithm = authenticator.algorithms[0];
}

util.inherits(Authenticator, events.EventEmitter);
module.exports = Authenticator;

Authenticator.prototype.algorithms = ['sha-256', 'sha-384', 'sha-512'];

Authenticator.prototype._findMatch = function (clientCert, results) {
  var authenticator = this;
  for (var i = 0, uri, stripped, algorithm; i < results.length; i++) {
    uri = results[i].uri.value;
    stripped = NI.stripQuery(uri);
    algorithm = NI.parseAlgorithm(uri);
    if (authenticator.algorithms.indexOf(algorithm) > -1) {
      if (algorithm === authenticator._algorithm && stripped === clientCert.uri) {
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

Authenticator.prototype._checkNetid = function (clientCert) {
  var authenticator = this;
  return HTTP.requestRDFData(clientCert.netid)
    .spread(function (res, body) {
      var format = res.headers['content-type'];
      return JSONLD.parseRDF(body, format);
    })
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

Authenticator.prototype._retrieveCert = function (clientCert) {
  var authenticator = this;
  return HTTP.getCertificate(clientCert.netid)
    .then(function (serverCert) {
      return CERT.fill(serverCert, authenticator._algorithm);
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
  clientCert = CERT.fill(clientCert, authenticator._algorithm);
  if (!clientCert.netid) {
    throw new ERRORS.ClientCertificateError('No WebID found in client certificate.');
  }
  return authenticator.fetch(clientCert)
    .then(function (serverCert) {
      return serverCert || authenticator._checkNetid(clientCert)
        .return(authenticator._retrieveCert(clientCert));
    })
    .then(function (serverCert) {
      return authenticator.check(clientCert, serverCert)
        .return(serverCert);
    })
    .then(function (serverCert) {
      var auth = {
        netid: clientCert.netid,
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

Authenticator.prototype.fetch = function (clientCert) {
  return Promise.resolve();
};

Authenticator.prototype.check = function (clientCert, serverCert) {
  return Promise.resolve();
};
