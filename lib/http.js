
var _ = require('underscore');
var url = require('url');
var https = require('https');
var ERRORS = require('./errors');
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
      resolve(certificate);
    })
      .on('error', reject)
      .end();
  })
    .then(function (certificate) {
      if (!certificate || _.isEmpty(certificate)) {
        throw new ERRORS.ServerCertificateError('Missing or invalid server certificate.');
      }
      return certificate;
    })
    .catch(function (err) {
      throw new ERRORS.ServerCertificateError({err: err}, 'Could not retrieve server certificate.');
    });
}

module.exports.getCertificate = getCertificate;

function requestRDFData(uri) {
  var opts = {
    url: uri,
    gzip: true,
    agent: false,
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
  })
    .spread(function (res, body) {
      if (res.statusCode != 200 && res.statusCode != 304) {
        throw new ERRORS.HTTPError('Wrong status code %s. Could not retrieve RDF data.', res.statusCode);
      }
      return [res, body];
    })
    .catch(function (err) {
      throw new ERRORS.HTTPError({err: err}, 'Could not retrieve RDF data.');
    });
}

module.exports.requestRDFData = requestRDFData;