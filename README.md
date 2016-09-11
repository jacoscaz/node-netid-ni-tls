
Express-WebID-Auth
==================

Express middleware for fingerprint-based WebID authentication.

Why fingerprints?
-----------------

The current WebID specs mandate the use of RSA as they focus on modulus
and exponent comparison. I'd like something more flexible.

RDFa example
------------

    <div about="https://example.com/cert" typeof="cert:X509Certificate" prefix="cert: http://www.w3.org/ns/auth/cert#">
        <div rel="cert:identity" href="https://example.com/me"></div>
        <div rel="cert:fingerprint">
            <div property="cert:alg" content="SHA-1"></div>
            <div property="cert:hex" content="DB:C1:9F:F6:0F:4C:E8:89:1A:E1:24:1E:12:1E:CB:40:D9:4A:52:B8"></div>
        </div>
    </div>

Todo
----

1. Add caching to middleware (through adaptors)
2. Complete error handling of all error cases
3. Custom dictionary? Extend `cert`?
3. Better README
4. Publish on NPM