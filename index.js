'use strict';

var find = require('lodash.find');
var async = require('async');
var debug = require('debug')('express:webid-auth');
var utils = require('./lib/utils');
var jsonld = require('jsonld');
var request = require('request');
var shortid = require('shortid');
var Erratum = require('erratum');
var rdfstore = require('rdfstore');

jsonld.registerRDFParser('text/html', require('jsonld-rdfa-parser'));

function factory() {

  var store = null;

  rdfstore.create(function(err, _store) {

    if (err) {
      throw err;
    }

    _store.setPrefix('ex', 'http://example.org/');
    _store.setPrefix('cert', 'http://www.w3.org/ns/auth/cert#');

    store = _store;

    debug('RDF store has been initialized.');

  });

  return function(req, res, next) {
    
    req.webid = false;

    var start = Date.now(), uri, graph, stop, certificate, time;

    debug('Attempting authentication...');

    async.waterfall(
      [
        function(cb) {
          if (!store) {
            cb(Erratum('RDF store not yet loaded.'));
            return;
          }
          if (!req.connection.encrypted) {
            cb(Erratum('SSL/TLS not in use.'));
            return;
          }
          certificate = req.connection.getPeerCertificate(false);
          if (!certificate || Object.keys(certificate).length < 1) {
            cb(Erratum('No client certificate.'));
            return;
          }
          if (!certificate.subjectaltname) {
            cb(Erratum('No SAN(s) in client certificate.'));
            return;
          }
          var san = find(certificate.subjectaltname.split(', '), function (san) {
            return san.indexOf('URI:') === 0;
          });
          if (!san) {
            cb(Erratum('No SAN in client certificate.'));
            return;
          }
          uri = san.slice(4);
          graph = 'ex:' + shortid.generate();
          cb();
        },

        function(cb) {
          var opts = {
            url: uri,
            gzip: true,
            agent: false,
            method: 'GET',
            encoding: 'utf8',
            headers: utils.getHeaders()
          };
          request(opts, cb);
        },

        function(res, body, cb) {
          jsonld.fromRDF(body, {format: res.headers['content-type']}, cb);
        },

        function(data, cb) {
          store.load('application/ld+json', data, graph, cb);
        },

        function (results, cb) {
          var query = utils.getFingerprintSPARQL(uri, graph);
          store.execute(query, cb);
        },

        function(results, cb) {
          var result = results[0];
          if (!result) {
            cb(Erratum('0 query results.'));
            return;
          }
          if (result.fingerprint.value != certificate.fingerprint) {
            cb(Erratum('Different fingerprints.'));
            return;
          }
          cb(null, {
            uri: uri,
            fingerprint: certificate.fingerprint,
            authenticated: true
          });
        }

      ],

      function(err, webid) {

        stop = Date.now();
        time = (stop - start) / 1000;

        if (err) {
          req.webid = {
            error: err.message,
            authenticated: false
          };
          debug('Authentication failed: %s (%ss).', err.message, time);
        }

        if (webid) {
          req.webid = webid;
          debug('URI: %s', webid.uri);
          debug('Fingeprint: %s', webid.fingerprint);
          debug('Authentication completed! (%ss).', time);
        }

        store.clear(graph, function(err) {
          err
            ? debug('Clean-up failed: %s.', err.message)
            : debug('Clean-up completed.');
        });

        next();
      }
    );
  };
}

module.exports = factory;