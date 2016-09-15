
WebIDentity
===========

Express middleware for fingerprint-based WebID authentication.

Why fingerprints?
-----------------

The current WebID specs mandate the use of RSA as they focus on modulus
and exponent comparison. I'd like something more flexible.

RDFa example
------------

    <div about="ni://sha-256;Mub5jcxUlUz6SG0oWKmHtIYGNgATBmPdRdlXiKxRBWw" typeof="cert:X509Certificate" prefix="cert: http://www.w3.org/ns/auth/cert#">
        <div rel="cert:identity" href="https://example.com/me"></div>
    </div>

The certificate's URI follows the [Named Information](https://tools.ietf.org/html/rfc6920)
URI format.

Todo
----

1. Custom dictionary? Extend `cert`?
2. Better README
3. Automated tests
4. Publish on NPM
