
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
to provide a TLS client certificate with the following Subject 
Alternative Name:

    URI:https://example.com

Dereferencing this identity must lead to a RDF document in one of the 
following formats: `application/ld+json`, `text/turtle`, `text/n3`, 
`text/html` (HTML5+RDFa).  

The RDF document should contain the triples shown in the following 
RDFa snippet:

    <div about="ni://sha-256;Mub5jcxUlUz6SG0oWKmHtIYGNgATBmPdRdlXiKxRBWw" typeof="cert:X509Certificate" prefix="cert: http://www.w3.org/ns/auth/cert#">
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
    var express = require('express');
    
    TODO

Acknowledgements
----------------

Big thanks to the awesome folks at the 
[public-webid](https://lists.w3.org/Archives/Public/public-webid/)
mailing list for their wonderful suggestions.

Todo
----

1. Better README
2. Automated tests
3. Publish on NPM
