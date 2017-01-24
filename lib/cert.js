
'use strict';

const _ = require('lodash');
const ni = require('ni-uri');

/* eslint no-plusplus: off */
function extractNetId(certInfo) {
  if (certInfo.subjectaltname) {
    const SANs = certInfo.subjectaltname.split(/, ?/g);
    let SAN;
    let i = 0;
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
  const matchingNiUri = _.find(niUris, (niUri) => {
    const parts = ni.parse(niUri);
    return ni.isAlgorithmSupported(parts.algorithm)
      && ni.digest(parts.algorithm, certInfo.raw) === parts.value;
  });
  return matchingNiUri;
}

module.exports.findMatchingNiUri = findMatchingNiUri;
