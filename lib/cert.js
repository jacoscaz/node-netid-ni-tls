
'use strict';

var NI = require('./ni');
var crypto = require('crypto');

function getNetID(cert) {
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

module.exports.getNetID = getNetID;

function fill(cert, algorithm) {
  cert.uri = NI.digest(algorithm, cert.raw);
  cert.netID = getNetID(cert);
  return cert;
}

module.exports.fill = fill;
