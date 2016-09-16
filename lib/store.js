
var Promise = require('./promise');
var rdfstore = require('rdfstore');

var debug = require('debug')('webid:store');


function genGraphUri(netid) {
  return 'ex:' + encodeURIComponent(netid);
}

function insertGraph(store, clientCert, graph, format) {
  var graphUri = genGraphUri(clientCert.netid);
  debug('Inserting graph %s...', graphUri);
  return new Promise(function (resolve, reject) {
    store.load(format, graph, graphUri, function (err) {
      err ? reject(err) : resolve();
    });
  });
}

module.exports.insertGraph = insertGraph;

function deleteGraph(store, clientCert) {
  var graphUri = genGraphUri(clientCert.netid);
  debug('Deleting graph %s...', graphUri);
  return new Promise(function (resolve, reject) {
    store.clear(graphUri, function (err) {
      err ? reject(err) : resolve();
    });
  });
}

module.exports.deleteGraph = deleteGraph;

function queryGraph(store, clientCert) {
  var graphUri = genGraphUri(clientCert.netid);
  var query = [
    'PREFIX  ex:    <http://example.org/>',
    'PREFIX  cert:  <http://www.w3.org/ns/auth/cert#>',
    'SELECT ?uri',
    'FROM NAMED ' + graphUri,
    'WHERE {',
    '  GRAPH ?g {',
    '    ?uri  cert:identity  <' + clientCert.netid + '> ;',
    '          a              cert:X509Certificate .',
    '  }',
    '}'
  ].join('\n');
  debug('Querying graph %s...', graphUri);
  return new Promise(function (resolve, reject) {
    store.execute(query, function (err, results) {
      err ? reject(err) : resolve(results);
    });
  });
}

module.exports.queryGraph = queryGraph;

function create() {
  debug('Creating new RDF store...');
  return new Promise(function (resolve, reject) {
    rdfstore.create(function (err, store) {
      if (err) {
        reject(err);
        return;
      }
      store.setPrefix('ex', 'http://example.org/');
      store.setPrefix('cert', 'http://www.w3.org/ns/auth/cert#');
      debug('RDF store created and configured.');
      resolve(store);
    });
  });
}

module.exports.create = create;