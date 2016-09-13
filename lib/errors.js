
var util = require('util');
var Erratum = require('erratum');

function ClientCertificateError() {
  Erratum.apply(this, arguments);
}

util.inherits(ClientCertificateError, Erratum);

module.exports.ClientCertificateError = ClientCertificateError;

function ServerCertificateError() {
  Erratum.apply(this, arguments);
}

util.inherits(ServerCertificateError, Erratum);

module.exports.ServerCertificateError = ServerCertificateError;

function RDFError() {
  Erratum.apply(this, arguments);
}

util.inherits(RDFError, Erratum);

module.exports.RDFError = RDFError;

function HTTPError() {
  Erratum.apply(this, arguments);
}

util.inherits(HTTPError, Erratum);

module.exports.HTTPError = HTTPError;

function StoreError() {
  Erratum.apply(this, arguments);
}

util.inherits(StoreError, Erratum);

module.exports.StoreError = StoreError;

