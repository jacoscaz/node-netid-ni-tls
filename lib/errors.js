
'use strict';

const Erratum = require('erratum');

/*
 * NON BREAKING ERRORS
 */

const FailedAuthenticationError = Erratum.extend('FailedAuthenticationError');
module.exports.FailedAuthenticationError = FailedAuthenticationError;

const ClientCertificateError = FailedAuthenticationError.extend('ClientCertificateError');
module.exports.ClientCertificateError = ClientCertificateError;

const InvalidServerResponseError = FailedAuthenticationError.extend('InvalidServerResponseError');
module.exports.InvalidServerResponseError = InvalidServerResponseError;

/*
 * BREAKING ERRORS
 */

const InternalAuthenticationError = Erratum.extend('InternalAuthenticationError');
module.exports.InternalAuthenticationError = InternalAuthenticationError;
