
'use strict';

const _ = require('lodash');
const rdf = require('./lib/rdf');
const cert = require('./lib/cert');
const http = require('./lib/http');
const util = require('util');
const debug = require('debug')('netid-ni-tls');
const errors = require('./lib/errors');
const events = require('events');
const Promise = require('./lib/promise');

function Authenticator(opts) {
  const authenticator = this;
  if (!(authenticator instanceof Authenticator)) {
    return new Authenticator(opts);
  }
  events.EventEmitter.call(authenticator);
  authenticator._opts = _.defaultsDeep({}, opts, {});
  debug('authenticator options: %j', authenticator._opts);
}

module.exports = Authenticator;

util.inherits(Authenticator, events.EventEmitter);

Authenticator.createAuthenticator = function (opts) {
  return new Authenticator(opts);
};

Authenticator.FailedAuthenticationError = errors.FailedAuthenticationError;

/**
 * @param netId
 * @param clientCertInfo
 * @returns {Promise.<T>}
 * @private
 */
Authenticator.prototype._retrieve = function () {
  return Promise.resolve();
};

Authenticator.prototype._authenticate = function (netId, clientCertInfo) {
  const authenticator = this;
  return http.getCertInfoAndRdfData(netId)
    .spread((serverCertInfo, rdfData, rdfFormat) => {
      return [serverCertInfo, rdf.queryRdfData(rdfData, rdfFormat, netId)];
    })
    .spread((serverCertInfo, niUris) => {
      if (!cert.findMatchingNiUri(clientCertInfo, niUris)) {
        throw new errors.FailedAuthenticationError('No matching certificate found in NetID data for client certificate.');
      }
      return {
        success: true,
        netId,
        clientCertInfo,
        serverCertInfo,
        createdAt: Date.now(),
      };
    });
};

Authenticator.prototype.authenticate = function (clientCertInfo) {
  const authenticator = this;
  const netId = _.isObject(clientCertInfo)
    && clientCertInfo.raw
    && cert.extractNetId(clientCertInfo);
  if (!netId) return Promise.reject(new errors.FailedAuthenticationError('Missing NetID or invalid client certificate.'));
  return authenticator._retrieve(netId, clientCertInfo)
    .then(auth => auth || authenticator._authenticate(netId, clientCertInfo))
    .catch(errors.FailedAuthenticationError, err => ({
      success: false,
      netId,
      clientCert: clientCertInfo,
      error: err,
      createdAt: Date.now(),
    }))
    .tap((auth) => {
      setImmediate(authenticator.emit.bind(authenticator, 'authentication', auth));
    });
};

/**
 * Returns an authentication middleware for
 * Express-compatible application frameworks.
 *
 * @returns {middleware}
 */
/* eslint no-param-reassign: off */
Authenticator.prototype.getMiddleware = function () {
  const authenticator = this;
  const middleware = function netidMiddleware(req, res, next) {
    const clientCertInfo = req.connection.encrypted
      && req.connection.getPeerCertificate();
    authenticator.authenticate(clientCertInfo)
      .then((auth) => {
        req.auth = auth;
        next();
      })
      .catch((err) => {
        next(err);
      });
  };
  middleware.authenticator = authenticator;
  return middleware;
};
