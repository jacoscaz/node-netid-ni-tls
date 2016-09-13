
var Promise = require('./promise');
var rdfstore = require('rdfstore');

var debug = require('debug')('express:webid:store');


function genGraphUri(webid) {
  return 'ex:' + encodeURIComponent(webid);
}

function insertGraph(store, webid, graph, format) {
  var graphUri = genGraphUri(webid);
  return new Promise(function (resolve, reject) {
    store.load(format, graph, graphUri, function(err) {
      err ? reject(err) : resolve();
    });
  });
}

module.exports.insertGraph = insertGraph;

function deleteGraph(store, webid) {
  var graphUri = genGraphUri(webid);
  return new Promise(function (resolve, reject) {
    store.clear(graphUri, function (err) {
      err ? reject(err) : resolve();
    });
  });
}

module.exports.deleteGraph = deleteGraph;

function queryGraph(store, webid, fingerprint) {
  var graphUri = genGraphUri(webid);
  var query = [
    'PREFIX  ex:    <http://example.org/>',
    'PREFIX  cert:  <http://www.w3.org/ns/auth/cert#>',
    'SELECT ?c',
    'FROM NAMED ' + graphUri,
    'WHERE {',
    '  GRAPH ?g {',
    '    ?f  cert:hex             "' + fingerprint + '"@en ;',
    '        cert:alg             "SHA-256"@en .',
    '    ?c  cert:identity        <' + webid + '> ;',
    '        a                    cert:X509Certificate ;',
    '        cert:fingerprint     ?f .',
    '  }',
    '}'
  ].join('\n');
  return new Promise(function (resolve, reject) {
    store.execute(query, function(err, results) {
      err ? reject(err) : resolve(results.length > 0);
    });
  });
}

module.exports.queryGraph = queryGraph;

function create() {
  return new Promise(function (resolve, reject) {
    rdfstore.create(function (err, store) {
      if (err) {
        reject(err);
        return;
      }
      store.setPrefix('ex', 'http://example.org/');
      store.setPrefix('cert', 'http://www.w3.org/ns/auth/cert#');
      resolve(store);
    });
  });
}

module.exports.create = create;