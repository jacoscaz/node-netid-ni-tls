
netid-ni-tls
============

Nodejs module implementing a variant of the WebID-TLS authentication 
protocol based on using Named Information URIs to identify X509 
certificates.  

Useful reading
--------------

- [WebID spec](https://www.w3.org/2005/Incubator/webid/spec/)
- [WebID on Wikipedia](https://en.wikipedia.org/wiki/WebID)
- [Naming Things with Hashes RFC](https://tools.ietf.org/html/rfc6920)

Why NI URIs?
------------

The current WebID spec mandates the use of RSA due to the focus on 
`(modulus,exponent)` comparison. I'd like something more flexible that
would allow me to use other kinds of keys without breaking the semantics
of the existing vocabularies.

RDF example
-----------

Assume the identity `https://example.com/me`. In order for this module
to be able to authenticate a user with this identity, such a user has
to provide a TLS client certificate with the following `Subject 
Alternative Name:

    URI:https://example.com

Dereferencing this identity must lead to a RDF document in one of the 
following formats: `application/ld+json`, `text/turtle`, `text/n3`, 
`text/html` (HTML5+RDFa).  

The RDF document should contain triples equivalent to those shown in the following 
RDFa snippet:

    <div about="ni:///sha-256;Mub5jcxUlUz6SG0oWKmHtIYGNgATBmPdRdlXiKxRBWw" typeof="cert:X509Certificate" prefix="cert: http://www.w3.org/ns/auth/cert#">
        <div rel="cert:identity" href="https://example.com/me"></div>
    </div>

The certificate's URI must follow the Named Information URI format. Use 
the following command to generate the required base64-encoded SHA256
certificate fingerprint:

    $ openssl x509 -in example.crt -inform pem -outform der | openssl dgst -sha256 -binary | openssl base64

Remove all padding `=` characters at the end of the fingerprint, as per 
the Named Information RFC.

API
---

    var netid = require('netid-ni-tls');

### `Authenticator` class

    var authenticator = netid.createAuthenticator([opts]);
    
### `Authenticator.prototype.authenticate(clientCertInfo)`

    var clientCertInfo = req.connection.getPeerCertificate();

    authenticator.authenticate(clientCertInfo)
        .then(function (auth) { ... });
        
This method expects the client TLS certificate of the user being authenticated 
in the form of the native nodejs object obtained through `req.connection.getPeerCertificate()`.

This method returns an authentication object with the following properties:

    {
        "success": true,                        // Whether the authentication has succeeded
        "netId": "https://example.com/john",    // The NetID that has been authenticated
        "clientCertInfo": { ... },              // Native getPeerCertificate() for the client used by the NetID
        "serverCertInfo": { ... },              // Native getPeerCertificate() for the server hosting the NetID
        "error": { ...}                         // The error that prevented a succeessful authentication, if any
        "createdAt": 1481458587406              // Operation timestamp
    }
    
### `Authenticator.prototype.getMiddleware()`

    app.use(authenticator.getMiddleware());

This method returns an express-compatible authentication middleware which stores the
resulting authentication object in `req.auth` .
 
### `Authenticator.prototype._retrieve(netId, clientCertInfo)`

On its own, an authenticator goes through the authentication process every time the 
`authenticate(clientCertInfo)` method is called (every request if using the middleware).

However, implementors can opt to override the `authenticator._retrieve(netId, clientCertInfo)`
to return a previously cached authentication object to be used by the authenticator.

    authenticator._retrieve = function (netId, clientCertInfo) {
        return Promise.resolve(cachedAuthenticationObject);
    };
    
Tests
-----

A test server that echoes the authentication object to the client can be fired up
 using the following:

    $ node test/server.js

License
-------

[MIT](./LICENSE)

Acknowledgements
----------------

Big thanks to the awesome folks at the 
[public-webid](https://lists.w3.org/Archives/Public/public-webid/)
mailing list for their wonderful suggestions.

Todo
----

1. Automated tests
