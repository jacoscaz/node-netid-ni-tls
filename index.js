
'use strict';

var AUTH = require('./lib/auth');
var CACHE = require('./lib/cache');
var STORE = require('./lib/store');

function factory () {

  var store = null;

  STORE.createStore()
    .then(function (_store) {
      store = _store;
    })
    .catch(function (err) {
      throw err;
    });

  var cache = CACHE.create();

  return function (req, res, next) {

    var clientCertificate = req.connection.encrypted
      && req.connection.getPeerCertificate();

    AUTH.authenticate(clientCertificate, {cache: cache, store: store})
      .then(function (auth) {
        req.auth = auth;
        next();
      })
      .catch(next);

  };
}

module.exports = factory;


























