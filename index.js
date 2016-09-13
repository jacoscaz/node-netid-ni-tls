
'use strict';

var AUTH = require('./lib/auth');
var CACHE = require('./lib/cache');
var STORE = require('./lib/store');
var ERRORS = require('./lib/errors');

var Promise = require('./lib/promise');

var debug = require('debug')('express:webid:mware');

function createAuthenticator() {

  var authenticator = {
    authenticate: function(clientCertificate) {
      if (!this.store) {
        return Promise.reject(new ERRORS.StoreError('Store not ready yet.'));
      }
      return AUTH.authenticate(clientCertificate, this.store, this.cache);
    },
    store: null,
    cache: CACHE.create()
  };

  STORE.create()
    .then(function (store) {
      authenticator.store = store;
    })
    .catch(function (err) {
      throw err;
    });

  return authenticator;

}

function createMiddleware() {

  var authenticator = createAuthenticator();

  return function (req, res, next) {

    debug('Begin.');

    var clientCertificate = req.connection.encrypted
      && req.connection.getPeerCertificate();

    authenticator.authenticate(clientCertificate)
      .then(function (auth) {
        req.auth = auth;
        debug('End.');
        next();
      })
      .catch(next);

  };
}

module.exports = createMiddleware;
module.exports.createAuthenticator = createAuthenticator;
