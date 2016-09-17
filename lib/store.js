
var Promise = require('./promise');
var rdfstore = require('rdfstore');

var debug = require('debug')('netid-ni-tls:store');


function graph(netID) {
  return 'ex:' + encodeURIComponent(netID);
}

module.exports.graph = graph;

function insert(store, graph, data, format) {
  return new Promise(function (resolve, reject) {
    store.load(format, data, graph, function (err) {
      err ? reject(err) : resolve();
    });
  });
}

module.exports.insert = insert;

function delete_(store, graph) {
  return new Promise(function (resolve, reject) {
    store.clear(graph, function (err) {
      err ? reject(err) : resolve();
    });
  });
}

module.exports.delete = delete_;

function query(store, query) {
  return new Promise(function (resolve, reject) {
    store.execute(query, function (err, results) {
      err ? reject(err) : resolve(results);
    });
  });
}

module.exports.query = query;

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