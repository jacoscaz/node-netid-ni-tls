
WebIDentity
===========

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
            <div property="cert:alg" content="SHA-256"></div>
            <div property="cert:hex" content="55:87:D9:F8:F3:AF:EA:A2:D9:1B:12:81:5F:10:C2:9A:D0:11:C3:32:34:98:4E:C0:ED:7C:B4:86:A1:07:37:94"></div>
        </div>
    </div>

Todo
----

1. Custom dictionary? Extend `cert`?
2. Better README
3. Automated tests
4. Publish on NPM
