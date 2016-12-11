
'use strict';

var _ = require('lodash');
var url = require('url');
var zlib = require('zlib');
var https = require('follow-redirects').https;
var debug = require('debug')('netid-ni-tls:http');
var errors = require('./errors');
var Promise = require('./promise');

function getCertInfoAndRdfData(netId, opts) {

  opts = _.defaults(url.parse(netId), {
    port: 443,
    agent: false,
    method: 'HEAD',
    headers: {
      'accept': 'text/turtle,text/n3,application/ld+json,application/xml,application/xhtml+xml,text/html',
      'accept-encoding': 'gzip,deflate'
    }
  }, opts);

  return new Promise(function (resolve, reject) {

    var req = https.request(opts, function (res) {

      var serverCertInfo = res.connection.encrypted
        && res.connection.getPeerCertificate();

      if (!serverCertInfo || _.isEmpty(serverCertInfo)) {
        res.destroy();
        reject(new errors.InvalidServerResponseError('Missing or invalid server certificate.'));
        return;
      }

      if (res.statusCode != 200 && res.statusCode != 304) {
        res.destroy();
        reject(new errors.InvalidServerResponseError('Unexpected status code %s.', res.statusCode));
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
          reject(new errors.InvalidServerResponseError('Payload too long.'));
        }
      });

      out.on('end', function () {
        resolve([serverCertInfo, buf.toString(), res.headers['content-type']]);
      });

    });

    req.on('error', function (err) {
      reject(new errors.InternalAuthenticationError(err, 'Could not retrieve data for NetID %s.', netId));
    });

    req.end();

  });
}

module.exports.getCertInfoAndRdfData = getCertInfoAndRdfData;
