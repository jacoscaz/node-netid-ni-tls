
'use strict';

var _ = require('lodash');
var ni = require('ni-uri');
var errors = require('./errors');

function extractNetId(certInfo) {
  if (certInfo.subjectaltname) {
    var SANs = certInfo.subjectaltname.split(/, ?/g), SAN, i = 0;
    do {
      SAN = SANs[i];
      if (SAN.indexOf('URI:') === 0) {
        return SAN.slice(4).trim();
      }
    } while (++i < SANs.length);
  }
  return null;
}

module.exports.extractNetId = extractNetId;

function findMatchingNiUri(certInfo, niUris) {
  var matchingNiUri = _.find(niUris, function (niUri) {
    var parts = ni.parse(niUri);
    return ni.isAlgorithmSupported(parts.algorithm)
      && ni.digest(parts.algorithm, certInfo.raw) === parts.value;
  });
  return matchingNiUri;
}

module.exports.findMatchingNiUri = findMatchingNiUri;
