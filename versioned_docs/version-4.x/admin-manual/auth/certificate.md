---
{
    "title": "MySQL Secure Transport",
    "language": "en",
    "description": "Learn how to configure SSL/TLS encrypted connections for Apache Doris to protect data transmission security between MySQL clients and Doris. Supports TLS1.2/1.3 protocols with two modes: one-way authentication and mTLS mutual authentication."
}
---

This document describes how to configure SSL/TLS encryption for communication between Doris and MySQL clients to protect data transmission security.

## Overview

Doris supports SSL-based encrypted connections, currently supporting TLS1.2 and TLS1.3 protocols. By enabling SSL, you can ensure that data transmission between clients and Doris FE is encrypted, preventing data from being intercepted or tampered with during transmission.

Doris provides two SSL authentication modes:

| Authentication Mode | Description | Use Case |
|---------|------|---------|
| One-way authentication (default) | Only validates server certificate | General security requirements |
| Mutual authentication (mTLS) | Validates both server and client certificates | High security requirements |

## Quick Start

Enable SSL encrypted connections in just two steps:

**1. Enable SSL functionality in FE**

Modify the FE configuration file `conf/fe.conf`, add the following configuration, and restart FE:

```properties
enable_ssl = true
```

**2. Connect using MySQL client**

```shell
mysql --ssl-mode=REQUIRED -uroot -P9030 -h127.0.0.1
```

Doris has built-in default key certificate files, so SSL functionality can be used without additional configuration.

## Client Connection Methods

When connecting to Doris via MySQL client, you can choose the following SSL modes:

| SSL Mode | Description | Command Example |
|---------|------|---------|
| PREFERRED (default) | Attempts SSL connection first, falls back to regular connection if failed | `mysql -uroot -P9030 -h127.0.0.1` |
| DISABLE | Disables SSL, uses regular connection | `mysql --ssl-mode=DISABLE -uroot -P9030 -h127.0.0.1` |
| REQUIRED | Forces SSL connection | `mysql --ssl-mode=REQUIRED -uroot -P9030 -h127.0.0.1` |

:::note Note
The `--ssl-mode` parameter was introduced in MySQL 5.7.11. For MySQL clients below this version, please refer to the [MySQL official documentation](https://dev.mysql.com/doc/connector-j/8.0/en/connector-j-connp-props-security.html).
:::

## Configuring Mutual Authentication (mTLS)

If you need a higher level of security, you can enable mTLS mutual authentication, which requires clients to also provide certificates for identity verification.

### Enable mTLS

Modify the FE configuration file `conf/fe.conf`, add the following configuration, and restart FE:

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

Enabling SSL functionality in Doris requires configuring CA key certificates and Server-side key certificates. If mutual authentication is enabled, Client-side key certificates must also be configured.

### Default Certificates

Doris has built-in default certificate files that can be used directly:

| Certificate Type | Default Path | Default Password |
|---------|---------|---------|
| CA Certificate | `Doris/fe/mysql_ssl_default_certificate/ca_certificate.p12` | `doris` |
| Server-side Certificate | `Doris/fe/mysql_ssl_default_certificate/server_certificate.p12` | `doris` |
| Client-side Certificate | `Doris/fe/mysql_ssl_default_certificate/client_certificate/` | - |

### Custom Certificates

To use custom certificates, add the following configuration to the FE configuration file `conf/fe.conf`:

**CA Certificate Configuration**

```properties
mysql_ssl_default_ca_certificate = /path/to/your/ca_certificate.p12
mysql_ssl_default_ca_certificate_password = your_password
```

**Server-side Certificate Configuration**

```properties
mysql_ssl_default_server_certificate = /path/to/your/server_certificate.p12
mysql_ssl_default_server_certificate_password = your_password
```

## Generating Custom Certificates

If you need to use your own certificates, you can generate them using OpenSSL. For detailed steps, please refer to the [MySQL official documentation: Creating SSL Certificates Using OpenSSL](https://dev.mysql.com/doc/refman/8.0/en/creating-ssl-files-using-openssl.html).

### Step 1: Generate CA, Server-side, and Client-side Keys and Certificates

```shell
# Generate CA certificate
openssl genrsa 2048 > ca-key.pem
openssl req -new -x509 -nodes -days 3600 \
        -key ca-key.pem -out ca.pem

# Generate Server-side certificate and sign with the above CA
# server-cert.pem = public key, server-key.pem = private key
openssl req -newkey rsa:2048 -days 3600 \
        -nodes -keyout server-key.pem -out server-req.pem
openssl rsa -in server-key.pem -out server-key.pem
openssl x509 -req -in server-req.pem -days 3600 \
        -CA ca.pem -CAkey ca-key.pem -set_serial 01 -out server-cert.pem

# Generate Client-side certificate and sign with the above CA
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

### Step 3: Package into PKCS#12 Format

Merge the CA key and certificate, and Server-side key and certificate separately into PKCS#12 (P12) format for use by Doris:

```shell
# Package CA key and certificate
openssl pkcs12 -inkey ca-key.pem -in ca.pem -export -out ca_certificate.p12

# Package Server-side key and certificate
openssl pkcs12 -inkey server-key.pem -in server-cert.pem -export -out server_certificate.p12
```

:::tip Tip
You can also modify the `conf/fe.conf` configuration file and add the parameter `ssl_trust_store_type` to specify other certificate formats. The default is PKCS12.
:::

:::info More Information
For more information on generating self-signed certificates using OpenSSL, please refer to the [IBM official documentation](https://www.ibm.com/docs/en/api-connect/2018.x?topic=overview-generating-self-signed-certificate-using-openssl).
:::