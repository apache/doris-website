---
{
    "title": "MySQL 安全传输",
    "language": "zh-CN",
    "description": "了解如何为 Apache Doris 配置 SSL/TLS 加密连接，保护 MySQL 客户端与 Doris 之间的数据传输安全。支持 TLS1.2/1.3 协议，提供单向认证和 mTLS 双向认证两种模式。"
}
---

本文档介绍如何为 Doris 与 MySQL 客户端之间的通信配置 SSL/TLS 加密，以保护数据传输安全。

## 概述

Doris 支持基于 SSL 的加密连接，当前支持 TLS1.2 和 TLS1.3 协议。通过启用 SSL，可以确保客户端与 Doris FE 之间的数据传输经过加密，防止数据在传输过程中被窃取或篡改。

Doris 提供两种 SSL 认证模式：

| 认证模式 | 说明 | 适用场景 |
|---------|------|---------|
| 单向认证（默认） | 仅验证服务端证书 | 一般安全需求场景 |
| 双向认证（mTLS） | 同时验证服务端和客户端证书 | 高安全需求场景 |

## 快速开始

只需两步即可启用 SSL 加密连接：

**1. 开启 FE 的 SSL 功能**

修改 FE 配置文件 `conf/fe.conf`，添加以下配置后重启 FE：

```properties
enable_ssl = true
```

**2. 使用 MySQL 客户端连接**

```shell
mysql --ssl-mode=REQUIRED -uroot -P9030 -h127.0.0.1
```

Doris 内置了默认的密钥证书文件，因此无需额外配置即可使用 SSL 功能。

## 客户端连接方式

通过 MySQL 客户端连接 Doris 时，可以选择以下 SSL 模式：

| SSL 模式 | 说明 | 命令示例 |
|---------|------|---------|
| PREFERRED（默认） | 优先尝试 SSL 连接，失败则回退到普通连接 | `mysql -uroot -P9030 -h127.0.0.1` |
| DISABLE | 禁用 SSL，使用普通连接 | `mysql --ssl-mode=DISABLE -uroot -P9030 -h127.0.0.1` |
| REQUIRED | 强制使用 SSL 连接 | `mysql --ssl-mode=REQUIRED -uroot -P9030 -h127.0.0.1` |

:::note 注意
`--ssl-mode` 参数是 MySQL 5.7.11 版本引入的，低于此版本的 MySQL 客户端请参考 [MySQL 官方文档](https://dev.mysql.com/doc/connector-j/8.0/en/connector-j-connp-props-security.html)。
:::

## 配置双向认证（mTLS）

如果您需要更高的安全级别，可以启用 mTLS 双向认证，要求客户端也提供证书进行身份验证。

### 开启 mTLS

修改 FE 配置文件 `conf/fe.conf`，添加以下配置后重启 FE：

```properties
enable_ssl = true
ssl_force_client_auth = true
```

### 客户端连接

使用 mTLS 连接时，客户端需要指定 CA 证书、客户端证书和私钥：

```shell
mysql --ssl-mode=VERIFY_CA -uroot -P9030 -h127.0.0.1 \
      --tls-version=TLSv1.2 \
      --ssl-ca=/path/to/your/ca.pem \
      --ssl-cert=/path/to/your/client-cert.pem \
      --ssl-key=/path/to/your/client-key.pem
```

Doris 提供了默认的客户端证书文件，位于 `Doris/conf/mysql_ssl_default_certificate/client_certificate/` 目录下：

| 文件名 | 说明 |
|-------|------|
| `ca.pem` | CA 证书 |
| `client-cert.pem` | 客户端证书 |
| `client-key.pem` | 客户端私钥 |

## 证书配置详解

Doris 开启 SSL 功能需要配置 CA 密钥证书和 Server 端密钥证书。如需开启双向认证，还需配置 Client 端密钥证书。

### 默认证书

Doris 内置了默认的证书文件，可直接使用：

| 证书类型 | 默认路径 | 默认密码 |
|---------|---------|---------|
| CA 证书 | `Doris/fe/mysql_ssl_default_certificate/ca_certificate.p12` | `doris` |
| Server 端证书 | `Doris/fe/mysql_ssl_default_certificate/server_certificate.p12` | `doris` |
| Client 端证书 | `Doris/fe/mysql_ssl_default_certificate/client_certificate/` | - |

### 自定义证书

如需使用自定义证书，可在 FE 配置文件 `conf/fe.conf` 中添加以下配置：

**CA 证书配置**

```properties
mysql_ssl_default_ca_certificate = /path/to/your/ca_certificate.p12
mysql_ssl_default_ca_certificate_password = your_password
```

**Server 端证书配置**

```properties
mysql_ssl_default_server_certificate = /path/to/your/server_certificate.p12
mysql_ssl_default_server_certificate_password = your_password
```

## 生成自定义证书

如果您需要使用自己的证书，可以通过 OpenSSL 生成。具体步骤请参考 [MySQL 官方文档：生成 SSL 证书](https://dev.mysql.com/doc/refman/8.0/en/creating-ssl-files-using-openssl.html)。

### 步骤 1：生成 CA、Server 端和 Client 端的密钥和证书

```shell
# 生成 CA 证书
openssl genrsa 2048 > ca-key.pem
openssl req -new -x509 -nodes -days 3600 \
        -key ca-key.pem -out ca.pem

# 生成 Server 端证书，并用上述 CA 签名
# server-cert.pem = public key, server-key.pem = private key
openssl req -newkey rsa:2048 -days 3600 \
        -nodes -keyout server-key.pem -out server-req.pem
openssl rsa -in server-key.pem -out server-key.pem
openssl x509 -req -in server-req.pem -days 3600 \
        -CA ca.pem -CAkey ca-key.pem -set_serial 01 -out server-cert.pem

# 生成 Client 端证书，并用上述 CA 签名
# client-cert.pem = public key, client-key.pem = private key
openssl req -newkey rsa:2048 -days 3600 \
        -nodes -keyout client-key.pem -out client-req.pem
openssl rsa -in client-key.pem -out client-key.pem
openssl x509 -req -in client-req.pem -days 3600 \
        -CA ca.pem -CAkey ca-key.pem -set_serial 01 -out client-cert.pem
```

### 步骤 2：验证证书

```shell
openssl verify -CAfile ca.pem server-cert.pem client-cert.pem
```

### 步骤 3：打包为 PKCS#12 格式

将 CA 密钥和证书、Server 端密钥和证书分别合并为 PKCS#12（P12）格式，以便 Doris 使用：

```shell
# 打包 CA 密钥和证书
openssl pkcs12 -inkey ca-key.pem -in ca.pem -export -out ca_certificate.p12

# 打包 Server 端密钥和证书
openssl pkcs12 -inkey server-key.pem -in server-cert.pem -export -out server_certificate.p12
```

:::tip 提示
您也可以通过修改 `conf/fe.conf` 配置文件，添加参数 `ssl_trust_store_type` 来指定其他证书格式，默认为 PKCS12。
:::

:::info 更多信息
关于使用 OpenSSL 生成自签名证书的更多信息，请参考 [IBM 官方文档](https://www.ibm.com/docs/en/api-connect/2018.x?topic=overview-generating-self-signed-certificate-using-openssl)。
:::
