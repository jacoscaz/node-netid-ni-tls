
var fs = require('fs');
var auth = require('../');
var path = require('path');
var http = require('http');
var https = require('https');
var express = require('express');

var ADDR = '0.0.0.0';
var PORT = 8080;

var app = express();

app.use('/', auth());

app.use('/', function(req, res, next) {
  res.send({webid: req.webid});
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
