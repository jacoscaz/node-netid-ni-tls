
'use strict';

var debug = require('debug')('webid:middleware');
var Authenticator = require('./lib/auth');

function createMiddleware() {

  var authenticator = new Authenticator();

  function middleware(req, res, next) {

    debug('Begin.');

    var clientCert = req.connection.encrypted
      && req.connection.getPeerCertificate();

    authenticator.authenticate(clientCert)
      .then(function (auth) {
        req.auth = auth;
        debug('End.');
        next();
      })
      .catch(next);
  }

  middleware.authenticator = authenticator;

  return middleware;
}

module.exports = createMiddleware;
module.exports.createAuthenticator = Authenticator;
