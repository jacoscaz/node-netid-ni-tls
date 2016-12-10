
'use strict';

var Erratum = require('erratum');

/*
 * NON BREAKING ERRORS
 */

var FailedAuthenticationError = Erratum.extend('FailedAuthenticationError');
module.exports.FailedAuthenticationError = FailedAuthenticationError;

var CertificateError = FailedAuthenticationError.extend('CertificateError');
module.exports.CertificateError = CertificateError;

var InvalidResponseError = FailedAuthenticationError.extend('InvalidResponseError');
module.exports.InvalidResponseError = InvalidResponseError;

/*
 * BREAKING ERRORS
 */

var InternalError = Erratum.extend('InternalError');
module.exports.InternalError = InternalError;

var HttpError = InternalError.extend('HttpError');
module.exports.HttpError = HttpError;

var StoreError = InternalError.extend('StoreError');
module.exports.StoreError = StoreError;

var CryptoError = InternalError.extend('CryptoError');
module.exports.CryptoError = CryptoError;
