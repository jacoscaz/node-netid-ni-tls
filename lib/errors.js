
var util = require('util');
var Erratum = require('erratum');

//
// Generic class for non-breaking error
//

function FailedAuthenticationError() {
  Erratum.apply(this, arguments);
}

util.inherits(FailedAuthenticationError, Erratum);

module.exports.FailedAuthenticationError = FailedAuthenticationError;

//
// Certificate errors
//

function CertificateError() {
  FailedAuthenticationError.apply(this, arguments);
}

util.inherits(CertificateError, FailedAuthenticationError);

module.exports.CertificateError = CertificateError;

function ClientCertificateError() {
  Erratum.apply(this, arguments);
}

util.inherits(ClientCertificateError, CertificateError);

module.exports.ClientCertificateError = ClientCertificateError;

function ServerCertificateError() {
  Erratum.apply(this, arguments);
}

util.inherits(ServerCertificateError, CertificateError);

module.exports.ServerCertificateError = ServerCertificateError;

//
// RDF errors
//

function RDFError() {
  FailedAuthenticationError.apply(this, arguments);
}

util.inherits(RDFError, FailedAuthenticationError);

module.exports.RDFError = RDFError;

//
// HTTP errors
//

function HTTPError() {
  FailedAuthenticationError.apply(this, arguments);
}

util.inherits(HTTPError, FailedAuthenticationError);

module.exports.HTTPError = HTTPError;

//
// Store errors
//

function StoreError() {
  FailedAuthenticationError.apply(this, arguments);
}

util.inherits(StoreError, FailedAuthenticationError);

module.exports.StoreError = StoreError;

