
'use strict';

var AUTH = require('./lib/auth');
var CACHE = require('./lib/cache');
var STORE = require('./lib/store');

var debug = require('debug')('express:webid:mware');

function factory () {

  var store = null;

  STORE.create()
    .then(function (_store) {
      store = _store;
    })
    .catch(function (err) {
      throw err;
    });

  var cache = CACHE.create();

  return function (req, res, next) {

    debug('Begin.');

    if (!store) {
      debug('Store not yet ready.');
      next();
      return;
    }

    var clientCertificate = req.connection.encrypted
      && req.connection.getPeerCertificate();

    AUTH.authenticate(clientCertificate, store, cache)
      .then(function (auth) {
        req.auth = auth;
        debug('End.');
        next();
      })
      .catch(next);

  };
}

module.exports = factory;
