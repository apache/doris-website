---
{
    "title": "MySQL Client Certificate",
    "language": "en",
    "description": "Doris supports SSL-based encrypted connections. It currently supports TLS1.2 and TLS1.3 protocols."
}
---

## Communicate with the server over an encrypted connection

Doris supports SSL-based encrypted connections. It currently supports TLS1.2 and TLS1.3 protocols. Doris' SSL mode can be enabled through the following configuration:
Modify the FE configuration file `conf/fe.conf` and add `enable_ssl = true`.

Next, connect to Doris through `mysql` client, mysql supports three SSL modes:

1. `mysql -uroot -P9030 -h127.0.0.1` is the same as `mysql --ssl-mode=PREFERRED -uroot -P9030 -h127.0.0.1`, both try to establish an SSL encrypted connection at the beginning, if it fails , a normal connection is attempted.

2. `mysql --ssl-mode=DISABLE -uroot -P9030 -h127.0.0.1`, do not use SSL encrypted connection, use normal connection directly.

3. `mysql --ssl-mode=REQUIRED -uroot -P9030 -h127.0.0.1`, force the use of SSL encrypted connections.

>Note:
>`--ssl-mode` parameter is introduced by mysql5.7.11 version, please refer to [here](https://dev.mysql.com/doc/connector-j/8.0/en/connector-j-connp-props-security.html) for mysql client version lower than this version。
Doris needs a key certificate file to verify the SSL encrypted connection. The default key certificate file is located at `Doris/fe/mysql_ssl_default_certificate/certificate.p12`, and the default password is `doris`. You can modify the FE configuration file `conf/fe. conf`, add `mysql_ssl_default_certificate = /path/to/your/certificate` to modify the key certificate file, and you can also add the password corresponding to your custom key book file through `mysql_ssl_default_certificate_password = your_password`.

Doris also supports mTLS:
Modify the FE configuration file `conf/fe.conf` and add `ssl_force_client_auth=true`.

Then you can connect to Doris via the `mysql` client:

`mysql -ssl-mode=VERIFY_CA -uroot -P9030 -h127.0.0.1 --tls-version=TLSv1.2 --ssl-ca=/path/to/your/ca --ssl-cert=/path/to/your/cert --ssl-key=/path/to/your/key`

The default ca, cert, and key files are located in `Doris/conf/mysql_ssl_default_certificate/client_certificate/`, named `ca.pem`, `client-cert.pem`, and `client-key.pem` respectively.

You can also generate your own certificate files using openssl or keytool.

## Key Certificate Configuration

Enabling SSL functionality in Doris requires configuring both a CA key certificate and a server-side key certificate. To enable mutual authentication, a client-side key certificate must also be generated:

* The default CA key certificate file is located at `Doris/fe/mysql_ssl_default_certificate/ca_certificate.p12`, with a default password of `doris`. You can modify the FE configuration file `conf/fe.conf` to add `mysql_ssl_default_ca_certificate = /path/to/your/certificate` to change the CA key certificate file. You can also add `mysql_ssl_default_ca_certificate_password = your_password` to specify the password for your custom key certificate file.

* The default server-side key certificate file is located at `Doris/fe/mysql_ssl_default_certificate/server_certificate.p12`, with a default password of `doris`. You can modify the FE configuration file `conf/fe.conf` to add `mysql_ssl_default_server_certificate = /path/to/your/certificate` to change the server-side key certificate file. You can also add `mysql_ssl_default_server_certificate_password = your_password` to specify the password for your custom key certificate file.

* By default, a client-side key certificate is also generated and stored in `Doris/fe/mysql_ssl_default_certificate/client-key.pem` and `Doris/fe/mysql_ssl_default_certificate/client_certificate/`.

## Custom key certificate file

In addition to the Doris default certificate file, you can also generate a custom certificate file through `openssl`. Here are the steps (refer to [Creating SSL Certificates and Keys Using OpenSSL](https://dev.mysql.com/doc/refman/8.0/en/creating-ssl-files-using-openssl.html)):

1. Generate the CA, server-side, and client-side keys and certificates:

```shell
# Generate the CA certificate
openssl genrsa 2048 > ca-key.pem
openssl req -new -x509 -nodes -days 3600 \
        -key ca-key.pem -out ca.pem

# Generate the server certificate and sign it with the above CA
# server-cert.pem = public key, server-key.pem = private key
openssl req -newkey rsa:2048 -days 3600 \
        -nodes -keyout server-key.pem -out server-req.pem
openssl rsa -in server-key.pem -out server-key.pem
openssl x509 -req -in server-req.pem -days 3600 \
        -CA ca.pem -CAkey ca-key.pem -set_serial 01 -out server-cert.pem

# Generate the client certificate and sign it with the above CA
# client-cert.pem = public key, client-key.pem = private key
openssl req -newkey rsa:2048 -days 3600 \
        -nodes -keyout client-key.pem -out client-req.pem
openssl rsa -in client-key.pem -out client-key.pem
openssl x509 -req -in client-req.pem -days 3600 \
        -CA ca.pem -CAkey ca-key.pem -set_serial 01 -out client-cert.pem
```

2. Verify the created certificates:

```shell
openssl verify -CAfile ca.pem server-cert.pem client-cert.pem
```

3. Combine your key and certificate in a PKCS#12 (P12) bundle. You can also specify a certificate format (PKCS12 by default). You can modify the conf/fe.conf configuration file and add parameter ssl_trust_store_type to specify the certificate format.

```shell
# Package the CA key and certificate
openssl pkcs12 -inkey ca-key.pem -in ca.pem -export -out ca_certificate.p12

# Package the server-side key and certificate
openssl pkcs12 -inkey server-key.pem -in server-cert.pem -export -out server_certificate.p12
```

:::info Note
[reference documents](https://www.ibm.com/docs/en/api-connect/2018.x?topic=overview-generating-self-signed-certificate-using-openssl)
:::