
'use strict';

var Promise = require('bluebird');

Promise.config({
  cancellation: true
});

try {
  require('longjohn');
} catch (err) {}

module.exports = Promise;
