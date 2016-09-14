
'use strict';

var pem = require('pem');
var ERRORS = require('./errors');
var openssl = require('openssl-wrapper');
var Promise = require('./promise');

function extractWebid(cert) {
  var SANs, SAN, i = 0;
  if (cert && cert.subjectaltname) {
    SANs = cert.subjectaltname.split(/, ?/g);
    do {
      SAN = SANs[i];
      if (SAN.indexOf('URI:') === 0) {
        return Promise.resolve(SAN.slice(4));
      }
    } while (++i < SANs.length);
  }
  return Promise.reject(new ERRORS.CertificateError('No SAN in certificate.'));
}

module.exports.extractWebid = extractWebid;

function DER2PEM(derBuffer) {
  return new Promise(function (resolve, reject) {
    var opts = {inform: 'der', outform: 'pem'};
    openssl.exec('x509', derBuffer, opts, function (err, pemBuffer) {
      err ? reject(err) : resolve(pemBuffer);
    });
  });
}

function getSHA256FingerprintFromPemBuffer(pemBuffer) {
  return new Promise(function (resolve, reject) {
    pem.getFingerprint(pemBuffer, 'sha256', function (err, data) {
      err ? reject(err) : resolve(data.fingerprint);
    });
  });
}

function getSHA256Fingeprint(cert) {
  return DER2PEM(cert.raw)
    .then(getSHA256FingerprintFromPemBuffer)
    .catch(function (err) {
      throw ERRORS.CertificateError({err: err}, 'Failed to calculate the SHA-256 fingerprint.');
    });
}

module.exports.getSHA256Fingeprint = getSHA256Fingeprint;
