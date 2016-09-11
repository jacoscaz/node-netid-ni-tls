
var util = require('util');
var Erratum = require('Erratum');

function ClientCertificateSANError() {
  Erratum.call(this, 'Invalid SAN in client certificate.');
}

util.inherits(ClientCertificateSANError, Erratum);

module.exports.ClientCertificateSANError = ClientCertificateSANError;

function ClientCertificateError() {
  Erratum.call(this, 'Client certificate check against RDF document failed.');
}

util.inherits(ClientCertificateError, Erratum);

module.exports.ClientCertificateError = ClientCertificateError;

function ServerCertificateError() {
  Erratum.call(this, 'Could not retrieve server certificate.');
}

util.inherits(ServerCertificateError, Erratum);

module.exports.ServerCertificateError = ServerCertificateError;

