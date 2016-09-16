
'use strict';

var NI = require('./ni');
var HTTP = require('./http');
var CERT = require('./cert');
var STORE = require('./store');
var JSONLD = require('./jsonld');
var ERRORS = require('./errors');

var _ = require('underscore');
var util = require('util');
var debug = require('debug')('express:webid:auth');
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
  
}

util.inherits(Authenticator, events.EventEmitter);
module.exports = Authenticator;

Authenticator.prototype._checkWebid = function (clientCert) {
  var authenticator = this;
  return HTTP.requestRDFData(clientCert.webid)
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
      for (var i = 0, uri, stripped, algorithm; i < results.length; i++) {
        uri = results[i].uri.value;
        stripped = NI.stripQuery(uri);
        algorithm = NI.parseAlgorithm(uri);
        if ((algorithm === 'sha-256' && stripped === clientCert.uri)
          || (stripped === NI.digest(algorithm, clientCert.raw))) {
          debug('Found matching certificate URI: %s %s', uri, clientCert.uri);
          return uri;
        }
      }
      throw new ERRORS.FailedAuthenticationError('No matching certificate in RDF data.');
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
  return HTTP.getCertificate(clientCert.webid)
    .then(function (serverCert) {
      return CERT.fill(serverCert);
    });
};

Authenticator.prototype.authenticate = function (clientCert) {
  var authenticator = this;
  if (!authenticator._store) {
    throw new ERRORS.StoreError('Store not ready.');
  }
  clientCert = CERT.fill(clientCert);
  if (!clientCert.webid) {
    throw new ERRORS.ClientCertificateError('No WebID found in client certificate.');
  }
  return authenticator.fetch(clientCert)
    .then(function (serverCert) {
      return serverCert || authenticator._checkWebid(clientCert)
        .return(authenticator._retrieveCert(clientCert));
    })
    .then(function (serverCert) {
      return authenticator.check(clientCert, serverCert)
        .return(serverCert);
    })
    .then(function (serverCert) {
      var auth = {
        webid: clientCert.webid,
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
