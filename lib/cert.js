
'use strict';

var NI = require('./ni');
var crypto = require('crypto');

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

module.exports.getWebid = getWebid;

function fill(cert) {
  cert.uri = NI.digest('sha-256', cert.raw);
  cert.webid = getWebid(cert);
  cert.obtainedAt = Date.now();
  return cert;
}

module.exports.fill = fill;
