---
{
    "title": "MySQL Secure Transport",
    "language": "en",
    "description": "Apache Doris SSL/TLS encrypted connection configuration guide: supports MySQL client secure transport, provides one-way authentication and mTLS mutual authentication, includes certificate generation, configuration details, and best practices."
}
---

This document describes how to configure SSL/TLS encryption for communication between Doris and MySQL clients to protect data transmission security.

## Overview

Doris supports SSL-based encrypted connections and currently supports TLS1.2 and TLS1.3 protocols. By enabling SSL, you can ensure that data transmission between clients and Doris FE is encrypted, preventing data from being intercepted or tampered with during transmission.

Doris provides two SSL authentication modes:

| Authentication Mode | Description | Use Case |
|---------|------|---------|
| One-way Authentication (Default) | Verify server certificate only | General security requirement scenarios |
| Mutual Authentication (mTLS) | Verify both server and client certificates | High security requirement scenarios |

## Quick Start

Enable SSL encrypted connection in just two steps:

**1. Enable SSL on FE**

Modify the FE configuration file `conf/fe.conf`, add the following configuration and restart FE:

```properties
enable_ssl = true
```

**2. Connect Using MySQL Client**

```shell
mysql --ssl-mode=REQUIRED -uroot -P9030 -h127.0.0.1
```

Doris has built-in default key certificate files, so SSL can be used without additional configuration.

## Client Connection Methods

When connecting to Doris through MySQL client, you can choose the following SSL modes:

| SSL Mode | Description | Command Example |
|---------|------|---------|
| PREFERRED (Default) | Attempt SSL connection first, fall back to normal connection if failed | `mysql -uroot -P9030 -h127.0.0.1` |
| DISABLE | Disable SSL, use normal connection | `mysql --ssl-mode=DISABLE -uroot -P9030 -h127.0.0.1` |
| REQUIRED | Force SSL connection | `mysql --ssl-mode=REQUIRED -uroot -P9030 -h127.0.0.1` |

:::note Note
The `--ssl-mode` parameter was introduced in MySQL 5.7.11. For MySQL clients lower than this version, please refer to [MySQL official documentation](https://dev.mysql.com/doc/connector-j/en/connector-j-connp-props-security.html).
:::

## Configure Mutual Authentication (mTLS)

If you need a higher security level, you can enable mTLS mutual authentication, which requires the client to provide a certificate for authentication as well.

### Enable mTLS

Modify the FE configuration file `conf/fe.conf`, add the following configuration and restart FE:

```properties
enable_ssl = true
ssl_force_client_auth = true
```

### Client Connection

When connecting with mTLS, the client needs to specify the CA certificate, client certificate, and private key:

```shell
mysql --ssl-mode=VERIFY_CA -uroot -P9030 -h127.0.0.1 \
    --tls-version=TLSv1.2 \
    --ssl-ca=/path/to/your/ca.pem \
    --ssl-cert=/path/to/your/client-cert.pem \
    --ssl-key=/path/to/your/client-key.pem
```

Doris provides default client certificate files located in the `Doris/conf/mysql_ssl_default_certificate/client_certificate/` directory:

| File Name | Description |
|-------|------|
| `ca.pem` | CA certificate |
| `client-cert.pem` | Client certificate |
| `client-key.pem` | Client private key |

## Certificate Configuration Details

To enable SSL functionality in Doris, you need to configure CA key certificates and Server-side key certificates. If mutual authentication is enabled, Client-side key certificates are also required.

### Default Certificates

Doris has built-in default certificate files that can be used directly:

| Certificate Type | Default Path | Default Password |
|---------|---------|---------|
| CA Certificate | `Doris/fe/mysql_ssl_default_certificate/ca_certificate.p12` | `doris` |
| Server Certificate | `Doris/fe/mysql_ssl_default_certificate/server_certificate.p12` | `doris` |
| Client Certificate | `Doris/fe/mysql_ssl_default_certificate/client_certificate/` | - |

### Custom Certificates

If you need to use custom certificates, you can add the following configuration in the FE configuration file `conf/fe.conf`:

**CA Certificate Configuration**

```properties
mysql_ssl_default_ca_certificate = /path/to/your/ca_certificate.p12
mysql_ssl_default_ca_certificate_password = your_password
```

**Server Certificate Configuration**

```properties
mysql_ssl_default_server_certificate = /path/to/your/server_certificate.p12
mysql_ssl_default_server_certificate_password = your_password
```

## Generate Custom Certificates

If you need to use your own certificates, you can generate them using OpenSSL. For detailed steps, please refer to [MySQL Official Documentation: Creating SSL Certificates Using OpenSSL](https://dev.mysql.com/doc/refman/8.0/en/creating-ssl-files-using-openssl.html).

### Step 1: Generate CA, Server, and Client Keys and Certificates

```shell
# Generate CA certificate
openssl genrsa 2048 > ca-key.pem
openssl req -new -x509 -nodes -days 3600 \
    -key ca-key.pem -out ca.pem

# Generate Server certificate and sign with the above CA
# server-cert.pem = public key, server-key.pem = private key
openssl req -newkey rsa:2048 -days 3600 \
    -nodes -keyout server-key.pem -out server-req.pem
openssl rsa -in server-key.pem -out server-key.pem
openssl x509 -req -in server-req.pem -days 3600 \
    -CA ca.pem -CAkey ca-key.pem -set_serial 01 -out server-cert.pem

# Generate Client certificate and sign with the above CA
# client-cert.pem = public key, client-key.pem = private key
openssl req -newkey rsa:2048 -days 3600 \
    -nodes -keyout client-key.pem -out client-req.pem
openssl rsa -in client-key.pem -out client-key.pem
openssl x509 -req -in client-req.pem -days 3600 \
    -CA ca.pem -CAkey ca-key.pem -set_serial 01 -out client-cert.pem
```

### Step 2: Verify Certificates

```shell
openssl verify -CAfile ca.pem server-cert.pem client-cert.pem
```

### Step 3: Package to PKCS#12 Format

Merge the CA key and certificate, Server key and certificate separately into PKCS#12 (P12) format for use by Doris:

```shell
# Package CA key and certificate
openssl pkcs12 -inkey ca-key.pem -in ca.pem -export -out ca_certificate.p12

# Package Server key and certificate
openssl pkcs12 -inkey server-key.pem -in server-cert.pem -export -out server_certificate.p12
```

:::tip Tip
You can also specify other certificate formats by modifying the `conf/fe.conf` configuration file and adding the `ssl_trust_store_type` parameter. The default is PKCS12.
:::

:::info More Information
For more information about generating self-signed certificates using OpenSSL, please refer to [IBM Official Documentation](https://www.ibm.com/docs/en/api-connect/2018.x?topic=overview-generating-self-signed-certificate-using-openssl).
:::
