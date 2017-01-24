
'use strict';

const n3 = require('n3');
const jsonld = require('jsonld');
const errors = require('./errors');
const Promise = require('./promise');

jsonld.registerRDFParser('text/html', require('jsonld-rdfa-parser'));

const RDF_NS = 'http://www.w3.org/1999/02/22-rdf-syntax-ns#';
const CERT_NS = 'http://www.w3.org/ns/auth/cert#';

function jsonldFromRdf(data, format) {
  return Promise.fromCallback((cb) => {
    jsonld.fromRDF(data, { format }, cb);
  });
}

function jsonldToNQuads(data) {
  return Promise.fromCallback((cb) => {
    jsonld.toRDF(data, { format: 'application/nquads' }, cb);
  });
}

function rdfToNQuads(data, format) {
  return jsonldFromRdf(data, format)
    .then(jsonldToNQuads);
}

const PARSERS = {
  'application/ld+json': data => rdfToNQuads(data, 'application/ld+json'),
  'application/turtle': data => data,
  'text/n3': data => data,
  'text/html': data => rdfToNQuads(data, 'text/html'),
};

function nquadsToTriples(data) {
  return new Promise((resolve, reject) => {
    const parser = n3.Parser({ format: 'application/nquads' });
    const triples = [];
    parser.parse(data, (err, triple) => {
      if (err) {
        reject(err);
        return;
      }
      if (!triple) {
        resolve(triples);
        return;
      }
      triples.push(triple);
    });
  });
}

function queryRdfData(rdfData, rdfFormat, netId) {
  const parser = PARSERS[rdfFormat];
  if (!parser) {
    return Promise.reject(new errors.FailedAuthenticationError('Unsupported RDF format.'));
  }
  return parser(rdfData)
    .then(nquadsToTriples)
    .then((triples) => {
      const store = n3.Store();
      store.addTriples(triples);
      const niUris = store.find(null, `${CERT_NS}identity`, netId)
        .map(triple => triple.subject);
      return niUris.filter((niUri) => {
        const matches = store.find(niUri, `${RDF_NS}type`, `${CERT_NS}X509Certificate`);
        return matches.length > 0;
      });
    });
}

module.exports.queryRdfData = queryRdfData;
