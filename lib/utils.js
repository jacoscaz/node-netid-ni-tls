
function getFingerprintSPARQL(URI, graph) {
  return [
    'PREFIX  ex:    <http://example.org/>',
    'PREFIX  eid:   <https://eidolon.io/ns/>',
    'PREFIX  rsa:   <http://www.w3.org/ns/auth/rsa#>',
    'PREFIX  cert:  <http://www.w3.org/ns/auth/cert#>',
    'SELECT ?fingerprint ',
    'FROM NAMED ' + graph,
    'WHERE {',
    '  GRAPH ?g {',
    '    ?f  cert:hex             ?fingerprint ;',
    '        cert:alg             "SHA-1"@en .',
    '    ?c  cert:identity        <' + URI + '> ;',
    '        a                    cert:X509Certificate ;',
    '        cert:fingerprint     ?f .',
    '  }',
    '}'
  ].join('\n');
}

module.exports.getFingerprintSPARQL = getFingerprintSPARQL;

function getHeaders() {
  return {
    'accept': 'text/turtle,text/n3,application/ld+json,application/xml,application/xhtml+xml,text/html',
    'accept-encoding': 'UTF-8'
  };
}

module.exports.getHeaders = getHeaders;
