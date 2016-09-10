
var debug = require('debug')('express:webid-auth');
var rdfstore = require('rdfstore');

function factory() {

  var store = null;

  rdfstore.create(function(err, _store) {

    if (err) {
      throw err;
    }

    store = _store;

    store.setPrefix('rdf', 'http://www.w3.org/1999/02/22-rdf-syntax-ns#');
    store.setPrefix('rsa', 'http://www.w3.org/ns/auth/rsa#');
    store.setPrefix('cert', 'http://www.w3.org/ns/auth/cert#');
    store.setPrefix('rdfs', 'http://www.w3.org/2000/01/rdf-schema#');
    store.setPrefix('foaf', 'http://xmlns.com/foaf/0.1/');
    store.setPrefix('schema', 'http://schema.org/');

  });

  return function(req, res, next) {

    if (!store) {
      debug('RDF store hasn\'t been initialized yet.');
      next();
    }

    var certificate = req.net.

    store.execute('SELECT ?s FROM NAMED :people { GRAPH ?g { ?s rdf:type foaf:Person } }',
                     function(err, results) {

                       console.log(peopleGraph.toArray()[0].subject.valueOf() === results[0].s.value);

                     });
    }
  };

}

module.exports = factory;