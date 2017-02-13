
'use strict';

const _ = require('lodash');
const url = require('url');
const https = require('follow-redirects').https;
const errors = require('./errors');
const Promise = require('./promise');
const request = require('request');

function getCertInfo(netId) {
  const opts = url.parse(netId);
  opts.agent = false;
  opts.method = 'HEAD';
  opts.rejectUnauthorized = false;
  return new Promise((resolve, reject) => {
    const req = https.request(opts, (res) => {
      const serverCertInfo = res.connection.encrypted
        && res.connection.getPeerCertificate();
      if (!serverCertInfo) {
        reject(new errors.InvalidServerResponseError('Missing or invalid server certificate.'));
        return;
      }
      resolve(serverCertInfo);
    })
      .on('error', (err) => { reject(err); })
      .end();
  });
}

function getRdfData(netId) {
  const opts = {};
  opts.url = netId;
  opts.method = 'GET';
  opts.headers = {
    accept: 'text/turtle,text/n3,application/ld+json,application/xml,application/xhtml+xml,text/html'
  };
  opts.followRedirect = true;
  opts.rejectUnauthorized = false;
  return new Promise((resolve, reject) => {
    request(opts, (err, res, rdfData) => {
      if (err) {
        reject(err);
        return;
      }
      if (res.statusCode !== 200 && res.statusCode !== 304) {
        reject(new errors.InvalidServerResponseError('Unexpected status code %s.', res.statusCode));
        return;
      }
      const rdfFormat = res.headers['content-type'].split(';')[0];
      resolve([rdfData, rdfFormat]);
    });
  });
}



function getCertInfoAndRdfData(netId) {
  return getCertInfo(netId)
    .then((certInfo) => {
      return getRdfData(netId)
        .spread((rdfData, rdfFormat) => {
          return [certInfo, rdfData, rdfFormat];
        });
    });
}

module.exports.getCertInfoAndRdfData = getCertInfoAndRdfData;
