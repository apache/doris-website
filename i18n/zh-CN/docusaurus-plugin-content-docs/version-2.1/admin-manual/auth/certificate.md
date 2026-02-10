---
{
    "title": "MySQL 安全传输",
    "language": "zh-CN",
    "description": "Doris支持基于SSL的加密连接，当前支持TLS1.2，TLS1.3协议，可以通过以下配置开启Doris的SSL模式： 修改FE配置文件conf/fe.conf，添加enablessl = true即可。"
}
---

## 加密连接 FE

Doris支持基于SSL的加密连接，当前支持TLS1.2，TLS1.3协议，可以通过以下配置开启Doris的SSL模式：
修改FE配置文件`conf/fe.conf`，添加`enable_ssl = true`即可。

接下来通过`mysql`客户端连接Doris，mysql支持三种SSL模式：

1.`mysql -uroot -P9030 -h127.0.0.1`与`mysql --ssl-mode=PREFERRED -uroot -P9030 -h127.0.0.1`一样，都是一开始试图建立SSL加密连接，如果失败，则尝试使用普通连接。

2.`mysql --ssl-mode=DISABLE -uroot -P9030 -h127.0.0.1`，不使用SSL加密连接，直接使用普通连接。

3.`mysql --ssl-mode=REQUIRED -uroot -P9030 -h127.0.0.1`，强制使用SSL加密连接。

>注意：
>`--ssl-mode`参数是mysql5.7.11版本引入的，低于此版本的mysql客户端请参考[这里](https://dev.mysql.com/doc/connector-j/8.0/en/connector-j-connp-props-security.html)。
Doris开启SSL加密连接需要密钥证书文件验证，默认的密钥证书文件位于`Doris/fe/mysql_ssl_default_certificate/certificate.p12`，默认密码为`doris`，您可以通过修改FE配置文件`conf/fe.conf`，添加`mysql_ssl_default_certificate = /path/to/your/certificate`修改密钥证书文件，同时也可以通过`mysql_ssl_default_certificate_password = your_password`添加对应您自定义密钥书文件的密码。

Doris还支持mTLS：
修改FE配置文件`conf/fe.conf`，添加`ssl_force_client_auth=true`即可。

接下来可以通过`mysql`客户端连接Doris：

`mysql -ssl-mode=VERIFY_CA -uroot -P9030 -h127.0.0.1 --tls-version=TLSv1.2 --ssl-ca=/path/to/your/ca --ssl-cert=/path/to/your/cert --ssl-key=/path/to/your/key`

默认的ca，cert，key文件位于`Doris/conf/mysql_ssl_default_certificate/client_certificate/`，分别叫做`ca.pem`，`client-cert.pem`，`client-key.pem`。

你也可以通过openssl或者keytool生成自己的证书文件。

## SSL密钥证书配置

Doris 开启 SSL 功能需要配置 CA 密钥证书和 Server 端密钥证书，如需开启双向认证，还需生成 Client 端密钥证书：

* 默认的 CA 密钥证书文件位于`Doris/fe/mysql_ssl_default_certificate/ca_certificate.p12`，默认密码为`doris`，您可以通过修改 FE 配置文件`conf/fe.conf`，添加`mysql_ssl_default_ca_certificate = /path/to/your/certificate`修改 CA 密钥证书文件，同时也可以通过`mysql_ssl_default_ca_certificate_password = your_password`添加对应您自定义密钥证书文件的密码。

* 默认的 Server 端密钥证书文件位于`Doris/fe/mysql_ssl_default_certificate/server_certificate.p12`，默认密码为`doris`，您可以通过修改 FE 配置文件`conf/fe.conf`，添加`mysql_ssl_default_server_certificate = /path/to/your/certificate`修改 Server 端密钥证书文件，同时也可以通过`mysql_ssl_default_server_certificate_password = your_password`添加对应您自定义密钥证书文件的密码。

* 默认生成了一份 Client 端的密钥证书，分别存放在`Doris/fe/mysql_ssl_default_certificate/client-key.pem`和`Doris/fe/mysql_ssl_default_certificate/client_certificate/`。

## 自定义密钥证书文件

除了 Doris 默认的证书文件，您也可以通过`openssl`生成自定义的证书文件。步骤参考[MySQL 生成 SSL 证书](https://dev.mysql.com/doc/refman/8.0/en/creating-ssl-files-using-openssl.html)
具体如下：

1. 生成 CA、Server 端和 Client 端的密钥和证书

```shell
# 生成 CA certificate
openssl genrsa 2048 > ca-key.pem
openssl req -new -x509 -nodes -days 3600 \
        -key ca-key.pem -out ca.pem

# 生成 server certificate, 并用上述 CA 签名
# server-cert.pem = public key, server-key.pem = private key
openssl req -newkey rsa:2048 -days 3600 \
        -nodes -keyout server-key.pem -out server-req.pem
openssl rsa -in server-key.pem -out server-key.pem
openssl x509 -req -in server-req.pem -days 3600 \
        -CA ca.pem -CAkey ca-key.pem -set_serial 01 -out server-cert.pem

# 生成 client certificate, 并用上述 CA 签名
# client-cert.pem = public key, client-key.pem = private key
openssl req -newkey rsa:2048 -days 3600 \
        -nodes -keyout client-key.pem -out client-req.pem
openssl rsa -in client-key.pem -out client-key.pem
openssl x509 -req -in client-req.pem -days 3600 \
        -CA ca.pem -CAkey ca-key.pem -set_serial 01 -out client-cert.pem
```

2. 验证创建的证书。

```shell
openssl verify -CAfile ca.pem server-cert.pem client-cert.pem
```

3. 将您的 CA 密钥和证书和 Server 端密钥和证书分别合并到 PKCS#12 (P12) 包中。您也可以指定某个证书格式，默认 PKCS12，可以通过修改 conf/fe.conf 配置文件，添加参数 ssl_trust_store_type 指定证书格式

```shell
# 打包 CA 密钥和证书
openssl pkcs12 -inkey ca-key.pem -in ca.pem -export -out ca_certificate.p12

# 打包 Server 端密钥和证书
openssl pkcs12 -inkey server-key.pem -in server-cert.pem -export -out server_certificate.p12
```

:::info Note
[参考文档](https://www.ibm.com/docs/en/api-connect/2018.x?topic=overview-generating-self-signed-certificate-using-openssl)
:::
