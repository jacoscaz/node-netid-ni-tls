
'use strict';

const fs = require('fs');
const path = require('path');
const netid = require('../');
const https = require('https');
const Promise = require('../lib/promise');
const express = require('express');

//
// Authenticator
//

const authenticator = netid({
  request: {
    rejectUnauthorized: false,
  },
});

//
// Caching
//

const cache = {};

authenticator._retrieve = function (netId, clientCertInfo) {
  const cachedAuth = cache[clientCertInfo.fingerprint];
  return (cachedAuth && cachedAuth.cachedAt > (Date.now() - (1000 * 10)))
    ? Promise.resolve(cachedAuth)
    : Promise.resolve();
};

/* eslint no-param-reassign: off */
authenticator.on('authentication', (auth) => {
  if (auth.success && !auth.cachedAt) {
    auth.cachedAt = Date.now();
    cache[auth.clientCertInfo.fingerprint] = auth;
  }
});

//
// Express app
//

const ADDR = '0.0.0.0';
const PORT = 8080;

const app = express();

app.use('/', authenticator.getMiddleware());

app.use('/', (req, res) => {
  res.set('Content-Type', 'text/plain');
  res.send(JSON.stringify(req.auth, null, 4));
});

const opts = {
  requestCert: true,
  rejectUnauthorized: false,
  key: fs.readFileSync(path.join(__dirname, 'cert', 'example.com.key')),
  cert: fs.readFileSync(path.join(__dirname, 'cert', 'example.com.crt')),
};

const server = https.createServer(opts, app);

server.listen(PORT, ADDR, () => {
  console.log('Listening on %s:%s!', ADDR, PORT);
});
