
var _ = require('lodash');
var url = require('url');
var zlib = require('zlib');
var https = require('follow-redirects').https;
var debug = require('debug')('netid-ni-tls:http');
var ERRORS = require('./errors');
var Promise = require('./promise');

function getCertAndRDFData(netID, opts) {

  var _opts = _.defaults(url.parse(netID), {
    port: 443,
    agent: false,
    method: 'HEAD',
    headers: {
      'accept': 'text/turtle,text/n3,application/ld+json,application/xml,application/xhtml+xml,text/html',
      'accept-encoding': 'gzip,deflate'
    }
  }, opts);

  return new Promise(function (resolve, reject) {
    https.request(_opts, function (res) {
      if (res.statusCode != 200 && res.statusCode != 304) {
        reject(new ERRORS.HTTPError('Unexpected status code %s.', res.statusCode));
      }
      var cert = res.connection.encrypted
        && res.connection.getPeerCertificate();
      if (!cert || _.isEmpty(cert)) {
        res.destroy();
        reject(new ERRORS.ServerCertificateError('Missing or invalid server certificate.'));
        return;
      }
      var out, buf;
      switch(res.headers['content-encoding']) {
        case 'gzip':
        case 'deflate':
          out = res.pipe(zlib.createUnzip());
          break;
        default:
          out = res;
          break;
      }
      out.on('data', function (chunk) {
        buf += chunk;
        if (buf.length > 5 * 1024 * 1024) {
          res.destroy();
          reject(new ERRORS.HTTPError('Payload too long.'));
        }
      });
      out.on('end', function () {
        resolve([cert, buf.toString(), res.headers['content-type']]);
      });
    }).on('error', reject).end();
  })
}

module.exports.getCertAndRDFData = getCertAndRDFData;
