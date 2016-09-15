
'use strict';

var crypto = require('crypto');
var ERRORS = require('./errors');
var Promise = require('./promise');

function getWebid(cert) {
  var SANs, SAN, i = 0;
  if (cert && cert.subjectaltname) {
    SANs = cert.subjectaltname.split(/, ?/g);
    do {
      SAN = SANs[i];
      if (SAN.indexOf('URI:') === 0) {
        return SAN.slice(4);
      }
    } while (++i < SANs.length);
  }
}

function getBase64SHA256Fingerprint(cert) {
  console.log(cert);
  var hash = crypto.createHash('sha256');
  hash.update(cert.raw);
  return hash.digest('base64');
}

// Get fingerprint in base64 via openssl:
// $ openssl x509 -in example.crt -inform pem -outform der | openssl dgst -sha256 -binary | openssl base64
// Remove all padding '=' characters at the end.

function fillCertificate(cert) {
  return Promise.resolve({
    uri: 'ni://sha-256;' + getBase64SHA256Fingerprint(cert).replace(/\=+$/, ''),
    webid: getWebid(cert),
    obtainedAt: Date.now()
  });
}

module.exports.fillCertificate = fillCertificate;
