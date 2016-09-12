
var _ = require('underscore');
var url = require('url');
var https = require('https');
var request = require('request');
var Promise = require('./promise');

function getCertificate(uri) {
  var opts = url.parse(uri);
  opts.method = 'HEAD';
  opts.agent = false;
  return new Promise(function (resolve, reject) {
    https.request(opts, function (res) {
      var certificate = res.connection.encrypted
        && res.connection.getPeerCertificate();
      if (!certificate || _.isEmpty(certificate)) {
        throw new Error('Invalid certificate.');
      }
      resolve(certificate);
    })
      .on('error', reject)
      .end();
  });
}

module.exports.getCertificate = getCertificate;

function requestRDFData(uri) {
  var opts = {
    url: uri,
    gzip: true,
    // agent: false,
    method: 'GET',
    headers: {
      'accept': 'text/turtle,text/n3,application/ld+json,application/xml,application/xhtml+xml,text/html',
      'accept-encoding': 'UTF-8'
    },
    encoding: 'utf8'
  };
  return new Promise(function (resolve, reject) {
    request(opts, function (err, res, body) {
      err ? reject(err) : resolve([res, body]);
    });
  });
}

module.exports.requestRDFData = requestRDFData;