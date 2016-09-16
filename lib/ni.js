
var crypto = require('crypto');
var ERRORS = require('./errors');

var ALGORITHMS = {
  'sha-256': 'sha256'
};

function parseAlgorithm(uri) {
  return uri.slice(5).split(';')[0];
}

module.exports.parseAlgorithm = parseAlgorithm;

function stripQuery(uri) {
  return uri.split('?')[0];
}

module.exports.stripQuery = stripQuery;

function digest(algorithm, data, enc) {
  if (!ALGORITHMS[algorithm]) {
    throw new ERRORS.CryptoError('Unsupported algorithm %s.', algorithm);
  }
  return 'ni://'
  + algorithm
  + ';'
  + crypto.createHash(ALGORITHMS[algorithm])
    .update(data, enc)
    .digest('base64')
    .replace(/\=+$/, '');
}

module.exports.digest = digest;
