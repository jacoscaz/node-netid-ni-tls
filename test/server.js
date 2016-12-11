
var fs = require('fs');
var path = require('path');
var http = require('http');
var netid = require('../');
var https = require('https');
var Promise = require('../lib/promise');
var express = require('express');

//
// Authenticator
//

var authenticator = netid({
  request: {
    rejectUnauthorized: false
  }
});

//
// Caching
//

var cache = {};

authenticator._retrieve = function (netId, clientCertInfo) {
  var cachedAuth = cache[clientCertInfo.fingerprint];
  return (cachedAuth && cachedAuth.cachedAt > Date.now() - 1000 * 10)
    ? Promise.resolve(cachedAuth)
    : Promise.resolve();
};

authenticator.on('authentication', function (auth) {
  if (auth.success && !auth.cachedAt) {
    auth.cachedAt = Date.now();
    cache[auth.clientCertInfo.fingerprint] = auth;
  }
});

//
// Express app
//

var ADDR = '0.0.0.0';
var PORT = 8080;

var app = express();

app.use('/', authenticator.getMiddleware());

app.use('/', function(req, res, next) {
  res.set('Content-Type', 'text/plain');
  res.send(JSON.stringify(req.auth, null, 4));
});

var opts = {
  requestCert: true,
  rejectUnauthorized: false,
  key: fs.readFileSync(path.join(__dirname, 'cert', 'example.com.key')),
  cert: fs.readFileSync(path.join(__dirname, 'cert', 'example.com.crt'))
};

var server = https.createServer(opts, app);

server.listen(PORT, ADDR, function() {
  console.log('Listening on %s:%s!', ADDR, PORT);
});
