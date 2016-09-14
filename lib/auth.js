
'use strict';

var HTTP = require('./http');
var CERT = require('./cert');
var STORE = require('./store');
var CACHE = require('./cache');
var JSONLD = require('./jsonld');
var ERRORS = require('./errors');

var debug = require('debug')('express:webid:auth');

function _authenticate(clientCertificate, webid, store) {

  debug('Attempting authentication...');

  var clientFingerprint, serverCertificate, serverFingerprint;
  return CERT.getSHA256Fingeprint(clientCertificate)
    .then(function (_clientFingerprint) {
      clientFingerprint = _clientFingerprint;
      return HTTP.getCertificate(webid);
    })
    .then(function (_serverCertificate) {
      serverCertificate = _serverCertificate;
      return CERT.getSHA256Fingeprint(serverCertificate);
    })
    .then(function (_serverFingerprint) {
      serverFingerprint = _serverFingerprint;
      return HTTP.requestRDFData(webid)
    })
    .spread(function (res, body) {
      var format = res.headers['content-type'];
      return JSONLD.parseRDF(body, format);
    })
    .then(function (data) {
      return STORE.insertGraph(store, webid, data, 'application/ld+json');
    })
    .then(function () {
      return STORE.queryGraph(store, webid, clientFingerprint);
    })
    .then(function (success) {
      if (!success) {
        throw new ERRORS.ClientCertificateError('Fingerprint mismatch or no fingerprint found in RDF data.');
      }
      debug('Authentication succeeded for webid %s', webid);
      var auth = {
        webid: webid,
        clientCertificate: clientFingerprint,
        serverCertificate: serverFingerprint
      };
      return auth;
    })
    .catch(
      ERRORS.CertificateError,
      ERRORS.ClientCertificateError,
      ERRORS.ServerCertificateError,
      ERRORS.HTTPError,
      ERRORS.RDFError,
      function (err) {
        debug('Authentication failed due to error: %s', err.message);
        debug(err.stack);
        return {error: err.message};
      }
    )
    .finally(function () {
      return STORE.deleteGraph(store, webid)
        .catch(function (err) {
          console.error(err);
        });
    });
}

function authenticate(clientCertificate, store, cache) {

  return CERT.extractWebid(clientCertificate)
    .then(function (webid) {
      var auth = CACHE.get(cache, webid);
      if (auth) {
        debug('Found cached auth.');
        return auth;
      }
      return _authenticate(clientCertificate, webid, store)
        .then(function (auth) {
          CACHE.set(cache, webid, auth);
          return auth;
        });
    });
}

module.exports.authenticate = authenticate;
