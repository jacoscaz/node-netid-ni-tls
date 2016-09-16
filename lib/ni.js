
var crypto = require('crypto');
var ERRORS = require('./errors');

var ALGORITHMS = {
  'sha-256': 'sha256',
  'sha-384': 'sha384',
  'sha-512': 'sha512'
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
  return 'ni://'
  + algorithm
  + ';'
  + crypto.createHash(ALGORITHMS[algorithm])
    .update(data, enc)
    .digest('base64')
    .replace(/\=+$/, '');
}

module.exports.digest = digest;
