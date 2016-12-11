
'use strict';

var Erratum = require('erratum');

/*
 * NON BREAKING ERRORS
 */

var FailedAuthenticationError = Erratum.extend('FailedAuthenticationError');
module.exports.FailedAuthenticationError = FailedAuthenticationError;

var ClientCertificateError = FailedAuthenticationError.extend('ClientCertificateError');
module.exports.ClientCertificateError = ClientCertificateError;

var InvalidServerResponseError = FailedAuthenticationError.extend('InvalidServerResponseError');
module.exports.InvalidServerResponseError = InvalidServerResponseError;

/*
 * BREAKING ERRORS
 */

var InternalAuthenticationError = Erratum.extend('InternalAuthenticationError');
module.exports.InternalAuthenticationError = InternalAuthenticationError;
