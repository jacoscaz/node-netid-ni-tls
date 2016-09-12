
var Promise = require('bluebird');

Promise.config({
  cancellation: true
});

module.exports = Promise;