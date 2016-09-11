
var Cache = require('node-cache');

function key(webid) {
  return webid;
}

function get(cache, webid) {
  return cache.get(key(webid));
}

module.exports.get = get;

function set(cache, webid, data) {
  cache.set(key(webid), data);
}

module.exports.set = set;

function create(opts) {
  return new Cache(opts);
}

module.exports.create = create;