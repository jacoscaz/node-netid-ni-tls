
var fs = require('fs');
var auth = require('../');
var path = require('path');
var http = require('http');
var https = require('https');
var express = require('express');

var ADDR = '0.0.0.0';
var PORT = 8080;

var app = express();

var middleware = auth();
app.use('/', middleware);

middleware.authenticator.on('authenticated', function(data) {
  console.log(data);
});

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
