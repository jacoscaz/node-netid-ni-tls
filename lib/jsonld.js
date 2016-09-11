
'use strict';

var jsonld = require('jsonld');
var Promise = require('bluebird');

jsonld.registerRDFParser('text/html', require('jsonld-rdfa-parser'));

function parseRDF(data, format) {
  return new Promise(function (resolve, reject) {
    jsonld.fromRDF(data, {format: format}, function (err, parsed) {
      err ? reject(err) : resolve(parsed);
    });
  });
}

module.exports.parseRDF = parseRDF;


