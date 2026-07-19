---
{
    "title": "MySQL 安全传输",
    "language": "zh-CN",
    "description": "Apache Doris SSL/TLS 加密连接配置指南：MySQL 客户端安全传输、单向认证与 mTLS 双向认证、证书生成与配置详解。"
}
---

<!-- 知识类型: 操作步骤 / 配置参数 -->
<!-- 适用场景: 数据传输加密 / 客户端身份认证 / 安全合规 -->

本文档介绍如何为 Apache Doris 与 MySQL 客户端之间的通信启用 SSL/TLS 加密，包含快速启用、客户端连接方式、mTLS 双向认证、自定义证书配置以及证书生成等完整流程。

## 适用场景

| 场景 | 推荐方案 |
|------|----------|
| 一般业务的数据传输加密 | 启用单向认证（默认） |
| 金融、政企等合规场景 | 启用 mTLS 双向认证 |
| 需要使用企业内部 CA 颁发的证书 | 配置自定义证书 |
| 仅在 PoC 或开发环境快速验证 | 使用 Doris 内置默认证书 |

## 前置条件

- Apache Doris 集群已部署并正常运行
- MySQL 客户端版本 ≥ 5.7.11（低版本客户端 SSL 参数语法不同）
- 当前支持的 TLS 协议版本：TLS 1.2 和 TLS 1.3
- 拥有 FE 节点 `conf/fe.conf` 的修改权限以及重启 FE 的运维权限

## 流程总览

1. 在 FE 配置中启用 SSL（如需更高安全级别，再启用 mTLS）
2. 重启 FE 使配置生效
3. 使用 MySQL 客户端通过指定的 `--ssl-mode` 参数发起加密连接
4. （可选）替换默认证书为自定义证书

## SSL 认证模式对比

<!-- 知识类型: 架构选型决策 -->

Doris 提供两种 SSL 认证模式，可按安全需求选择：

| 认证模式 | 说明 | 适用场景 |
|----------|------|----------|
| 单向认证（默认） | 仅验证服务端证书 | 一般安全需求场景 |
| 双向认证（mTLS） | 同时验证服务端和客户端证书 | 高安全需求场景 |

## 快速开始：启用 SSL 加密连接

<!-- 知识类型: 操作步骤 -->
<!-- 适用场景: 首次启用 SSL / 默认证书快速验证 -->

Doris 内置了默认的密钥证书文件，无需额外生成证书即可启用 SSL。整体只需两步：

### 步骤 1：开启 FE 的 SSL 功能

修改 FE 配置文件 `conf/fe.conf`，添加以下配置后重启 FE：

```properties
enable_ssl = true
```

### 步骤 2：使用 MySQL 客户端连接

```shell
mysql --ssl-mode=REQUIRED -uroot -P9030 -h127.0.0.1
```

## 客户端 SSL 连接模式

<!-- 知识类型: 配置参数 -->

MySQL 客户端通过 `--ssl-mode` 参数控制连接行为，可选模式如下：

| SSL 模式 | 说明 | 命令示例 |
|----------|------|----------|
| PREFERRED（默认） | 优先尝试 SSL 连接，失败则回退到普通连接 | `mysql -uroot -P9030 -h127.0.0.1` |
| DISABLE | 禁用 SSL，使用普通连接 | `mysql --ssl-mode=DISABLE -uroot -P9030 -h127.0.0.1` |
| REQUIRED | 强制使用 SSL 连接 | `mysql --ssl-mode=REQUIRED -uroot -P9030 -h127.0.0.1` |
| VERIFY_CA | 强制 SSL 并校验服务端证书的 CA（mTLS 场景使用） | 参考 [配置双向认证（mTLS）](#配置双向认证-mtls) |

:::note 注意
`--ssl-mode` 参数是 MySQL 5.7.11 版本引入的，低于此版本的 MySQL 客户端请参考 [MySQL 官方文档](https://dev.mysql.com/doc/connector-j/en/connector-j-connp-props-security.html)。
:::

## 配置双向认证（mTLS）

<!-- 知识类型: 操作步骤 -->
<!-- 适用场景: 高安全需求 / 客户端身份强校验 -->

mTLS 在服务端验证客户端身份的同时，要求客户端也校验服务端证书，适用于对接入方有严格身份要求的场景。

### 步骤 1：开启 mTLS

修改 FE 配置文件 `conf/fe.conf`，添加以下配置后重启 FE：

```properties
enable_ssl = true
ssl_force_client_auth = true
```

### 步骤 2：客户端使用证书连接

使用 mTLS 连接时，客户端需要指定 CA 证书、客户端证书和私钥：

```shell
mysql --ssl-mode=VERIFY_CA -uroot -P9030 -h127.0.0.1 \
    --tls-version=TLSv1.2 \
    --ssl-ca=/path/to/your/ca.pem \
    --ssl-cert=/path/to/your/client-cert.pem \
    --ssl-key=/path/to/your/client-key.pem
```

### 默认客户端证书

Doris 提供了默认的客户端证书文件，位于 `Doris/conf/mysql_ssl_default_certificate/client_certificate/` 目录下：

| 文件名 | 说明 |
|--------|------|
| `ca.pem` | CA 证书 |
| `client-cert.pem` | 客户端证书 |
| `client-key.pem` | 客户端私钥 |

## 证书配置详解

<!-- 知识类型: 配置参数 -->

Doris 开启 SSL 功能需要配置 CA 密钥证书和 Server 端密钥证书；如需开启双向认证，还需配置 Client 端密钥证书。

### 默认证书

Doris 内置了默认的证书文件，可直接使用：

| 证书类型 | 默认路径 | 默认密码 |
|----------|----------|----------|
| CA 证书 | `Doris/fe/mysql_ssl_default_certificate/ca_certificate.p12` | `doris` |
| Server 端证书 | `Doris/fe/mysql_ssl_default_certificate/server_certificate.p12` | `doris` |
| Client 端证书 | `Doris/fe/mysql_ssl_default_certificate/client_certificate/` | - |

### 自定义证书

如需使用自定义证书，可在 FE 配置文件 `conf/fe.conf` 中添加以下配置。

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

:::tip 提示
通过修改 `conf/fe.conf` 中的 `ssl_trust_store_type` 参数可以指定其他证书格式，默认为 `PKCS12`。
:::

## 生成自定义证书

<!-- 知识类型: 操作步骤 -->
<!-- 适用场景: 使用企业 CA / 自签名证书替换默认证书 -->

如果需要使用自己的证书，可通过 OpenSSL 生成。完整命令参考 [MySQL 官方文档：生成 SSL 证书](https://dev.mysql.com/doc/refman/8.0/en/creating-ssl-files-using-openssl.html)。

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

:::info 更多信息
关于使用 OpenSSL 生成自签名证书的更多信息，请参考 [IBM 官方文档](https://www.ibm.com/docs/en/api-connect/2018.x?topic=overview-generating-self-signed-certificate-using-openssl)。
:::

## 常见问题

<!-- 知识类型: 故障排查 -->
<!-- 适用场景: SSL 连接失败 / 证书配置错误 -->

### Q: 客户端连接报 `--ssl-mode` 参数不识别？

MySQL 客户端版本低于 5.7.11。升级 MySQL 客户端，或参考 MySQL Connector/J 文档使用对应连接参数。

### Q: 启用 `enable_ssl=true` 后客户端仍以普通连接接入？

客户端默认使用 `PREFERRED` 模式，未强制要求 SSL。客户端使用 `--ssl-mode=REQUIRED` 或 `VERIFY_CA`。

### Q: mTLS 模式下连接失败？

未提供客户端证书 / CA 证书 / 私钥，或路径错误。确认 `--ssl-ca`、`--ssl-cert`、`--ssl-key` 三个参数均已正确指向证书文件。

### Q: 自定义证书加载失败？

证书格式与 `ssl_trust_store_type` 不一致，或密码错误。检查证书是否为 PKCS12 格式，或显式设置 `ssl_trust_store_type` 并核对密码。
