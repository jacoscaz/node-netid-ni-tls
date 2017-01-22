
'use strict';

var n3 = require('n3');
var jsonld = require('jsonld');
var shortid = require('shortid');
var Promise = require('./promise');
var rdfstore = require('rdfstore');

//
// Additional RDF parsers for the jsonld module
//
jsonld.registerRDFParser('text/html', require('jsonld-rdfa-parser'));

function getUniqueExUrl() {
  return 'ex:' + shortid.generate();
}

function createRdfStore() {

  return Promise.fromCallback(function (cb) {
    rdfstore.create(cb);
  })

    .then(function (rdfStore) {
      rdfStore.setPrefix('ex', 'http://example.org/');
      rdfStore.setPrefix('cert', 'http://www.w3.org/ns/auth/cert#');
      return rdfStore;
    });
}

module.exports.createRdfStore = createRdfStore;

/**
 *
 * @param rdfStore
 * @param rdfData
 * @param rdfFormat
 * @param netId
 */
function queryRdfData(rdfStore, rdfData, rdfFormat, netId) {

  var graphUrl = getUniqueExUrl();

  var query = [
    'PREFIX  ex:    <http://example.org/>',
    'PREFIX  cert:  <http://www.w3.org/ns/auth/cert#>',
    'SELECT ?uri',
    'FROM NAMED ' + graphUrl,
    'WHERE {',
    '  GRAPH ?g {',
    '    ?uri  cert:identity  <' + netId + '> ;',
    '          a              cert:X509Certificate .',
    '  }',
    '}'
  ].join('\n');

  return Promise.fromCallback(function (cb) {
    jsonld.fromRDF(rdfData, {format: rdfFormat}, cb);
  })

    .then(function (jsonldData) {
      return Promise.fromCallback(function (cb) {
        rdfStore.load('application/ld+json', jsonldData, graphUrl, cb);
      });
    })

    .then(function () {
      return Promise.fromCallback(function (cb) {
        rdfStore.execute(query, cb);
      })
        .then(function (results) {
          return results.map(function (result) {
            return result.uri.value;
          });
        });
    })

    .tap(function () {
      setImmediate(function () {
        rdfStore.clear(graphUrl, function (err) {
          if (err) { throw err; }
        });
      });
    });
}

module.exports.queryRdfData = queryRdfData;