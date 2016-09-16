
'use strict';

var NI = require('./ni');
var crypto = require('crypto');

function getNetid(cert) {
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

module.exports.getNetid = getNetid;

function fill(cert, algorithm) {
  cert.uri = NI.digest(algorithm, cert.raw);
  cert.netid = getNetid(cert);
  cert.obtainedAt = Date.now();
  cert.toJSON = function() {
    return {
      uri: this.uri,
      netid: this.netid,
      obtainedAt: this.obtainedAt
    };
  };
  return cert;
}

module.exports.fill = fill;
