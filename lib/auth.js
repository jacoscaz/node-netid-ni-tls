
'use strict';

var _ = require('lodash');
var ni = require('ni-uri');
var rdf = require('./rdf');
var cert = require('./cert');
var http = require('./http');
var util = require('util');
var debug = require('debug')('netid-ni-tls:auth');
var errors = require('./errors');
var Promise = require('./promise');

function Authenticator(opts) {

  var authenticator = this;

  if (!(authenticator instanceof Authenticator)) {
    return new Authenticator(opts);
  }

  authenticator._opts = _.defaultsDeep({}, opts, {
    request: {
      rejectUnauthorized: true
    }
  });

  debug('Options', authenticator._opts);

  rdf.createRdfStore().then(function (rdfStore) {
    authenticator._rdfStore = rdfStore;
    debug('Store created. Authenticator ready.');
  });

}

module.exports = Authenticator;

Authenticator.prototype._retrieve = function (netId, clientCertInfo) {
  return Promise.resolve(null);
};

Authenticator.prototype._authenticate = function (netId, clientCertInfo) {

  var authenticator = this;

  var requestOpts = authenticator._opts.request;
  var rdfStore = authenticator._rdfStore;

  return http.getCertInfoAndRdfData(netId, requestOpts)

    .spread(function (serverCertInfo, rdfData, rdfFormat) {
      return rdf.queryRdfData(rdfStore, rdfData, rdfFormat, netId)

        .then(function (niUris) {
          return cert.findMatchingNiUri(clientCertInfo, niUris);
        })

        .then(function (matchingNiUri) {
          return {
            success: true,
            netId: netId,
            clientCertInfo: clientCertInfo,
            serverCertInfo: serverCertInfo,
            createdAt: Date.now()
          };
        });

    });
};

Authenticator.prototype.authenticate = function (clientCertInfo) {

  var netId = cert.extractNetId(clientCertInfo);
  var authenticator = this;

  return (netId
    ? authenticator._retrieve(netId, clientCertInfo)
    : Promise.reject(new errors.FailedAuthenticationError('Missing NetID in client certificate.'))
  )

    .then(function (auth) {
      return auth || authenticator._authenticate(netId, clientCertInfo);
    })

    .catch(errors.FailedAuthenticationError, function (err) {
      return {
        success: false,
        netId: netId,
        clientCert: clientCertInfo,
        error: err,
        createdAt: Date.now()
      };
    });

};

/**
 * Returns an authentication middleware for
 * Express-compatible application frameworks.
 *
 * @returns {middleware}
 */
Authenticator.prototype.getMiddleware = function () {

  var authenticator = this;

  var middleware = function (req, res, next) {

    var clientCertInfo = req.connection.encrypted
      && req.connection.getPeerCertificate();

    authenticator.authenticate(clientCertInfo)

      .then(function (auth) {
        req.auth = auth;
        next();
      })

      .catch(function (err) {
        next(err);
      });

  };

  middleware.authenticator = authenticator;

  return middleware;
};
