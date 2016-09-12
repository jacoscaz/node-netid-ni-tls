
'use strict';

var ERRORS = require('./errors');
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
  return Promise.reject(new ERRORS.ClientCertificateSANError());
}

module.exports.extractWebid = extractWebid;
