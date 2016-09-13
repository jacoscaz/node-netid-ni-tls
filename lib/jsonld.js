
'use strict';

var jsonld = require('jsonld');
var ERRORS = require('./errors');
var Promise = require('./promise');

jsonld.registerRDFParser('text/html', require('jsonld-rdfa-parser'));

function parseRDF(data, format) {
  return new Promise(function (resolve, reject) {
    jsonld.fromRDF(data, {format: format}, function (err, parsed) {
      err ? reject(err) : resolve(parsed);
    });
  })
    .catch(function (err) {
      throw new ERRORS.RDFError({err: err}, 'Could not parse RDF data (%s).', format);
    });
}

module.exports.parseRDF = parseRDF;


