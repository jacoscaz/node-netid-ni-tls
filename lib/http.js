
'use strict';

const _ = require('lodash');
const url = require('url');
const zlib = require('zlib');
const https = require('follow-redirects').https;
const errors = require('./errors');
const Promise = require('./promise');

function getCertInfoAndRdfData(netId, opts) {
  const _opts = _.defaults(url.parse(netId), {
    port: 443,
    agent: false,
    method: 'HEAD',
    headers: {
      accept: 'text/turtle,text/n3,application/ld+json,application/xml,application/xhtml+xml,text/html',
      'accept-encoding': 'gzip,deflate',
    },
  }, opts);

  return new Promise((resolve, reject) => {
    const req = https.request(_opts, (res) => {
      const serverCertInfo = res.connection.encrypted
        && res.connection.getPeerCertificate();

      if (!serverCertInfo || _.isEmpty(serverCertInfo)) {
        res.destroy();
        reject(new errors.InvalidServerResponseError('Missing or invalid server certificate.'));
        return;
      }

      if (res.statusCode !== 200 && res.statusCode !== 304) {
        res.destroy();
        reject(new errors.InvalidServerResponseError('Unexpected status code %s.', res.statusCode));
        return;
      }

      let out;
      let buf;

      switch (res.headers['content-encoding']) {
        case 'gzip':
        case 'deflate':
          out = res.pipe(zlib.createUnzip());
          break;
        default:
          out = res;
          break;
      }

      out.on('data', (chunk) => {
        buf += chunk;
        if (buf.length > 5 * 1024 * 1024) {
          res.destroy();
          reject(new errors.InvalidServerResponseError('Payload too long.'));
        }
      });

      out.on('end', () => {
        resolve([serverCertInfo, buf.toString(), res.headers['content-type']]);
      });
    });

    req.on('error', (err) => {
      reject(new errors.InternalAuthenticationError(err, 'Could not retrieve data for NetID %s.', netId));
    });

    req.end();
  });
}

module.exports.getCertInfoAndRdfData = getCertInfoAndRdfData;
