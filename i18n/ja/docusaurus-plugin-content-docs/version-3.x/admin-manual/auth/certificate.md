---
{
  "title": "MySQL セキュア転送",
  "language": "ja",
  "description": "Apache Doris SSL/TLS暗号化接続設定ガイド：MySQLクライアントのセキュア転送をサポートし、一方向認証とmTLS相互認証を提供し、証明書生成、設定詳細、ベストプラクティスを含みます。"
}
---
この文書では、データ送信のセキュリティを保護するために、DorisとMySQLクライアント間の通信にSSL/TLS暗号化を設定する方法について説明します。

## 概要

DorisはSSLベースの暗号化接続をサポートしており、現在TLS1.2およびTLS1.3プロトコルをサポートしています。SSLを有効にすることで、クライアントとDoris FE間のデータ送信が暗号化され、送信中にデータが傍受や改ざんされることを防ぐことができます。

Dorisは2つのSSL認証モードを提供しています：

| 認証モード | 説明 | 使用場面 |
|---------|------|---------|
| 一方向認証（デフォルト） | サーバー証明書のみを検証 | 一般的なセキュリティ要件のシナリオ |
| 相互認証（mTLS） | サーバーとクライアントの両方の証明書を検証 | 高いセキュリティ要件のシナリオ |

## クイックスタート

わずか2つのステップでSSL暗号化接続を有効にします：

**1. FEでSSLを有効化**

FE設定ファイル`conf/fe.conf`を変更し、以下の設定を追加してFEを再起動します：

```properties
enable_ssl = true
```
**2. MySQL Clientを使用した接続**

```shell
mysql --ssl-mode=REQUIRED -uroot -P9030 -h127.0.0.1
```
Dorisには組み込みのデフォルトキー証明書ファイルがあるため、追加の設定なしにSSLを使用できます。

## クライアント接続方法

MySQL clientを通じてDorisに接続する際、以下のSSLモードを選択できます：

| SSLモード | 説明 | コマンド例 |
|---------|------|---------|
| PREFERRED (デフォルト) | まずSSL接続を試行し、失敗した場合は通常の接続にフォールバック | `mysql -uroot -P9030 -h127.0.0.1` |
| DISABLE | SSLを無効にし、通常の接続を使用 | `mysql --ssl-mode=DISABLE -uroot -P9030 -h127.0.0.1` |
| REQUIRED | SSL接続を強制 | `mysql --ssl-mode=REQUIRED -uroot -P9030 -h127.0.0.1` |

:::note Note
`--ssl-mode`パラメータはMySQL 5.7.11で導入されました。このバージョンより古いMySQLクライアントについては、[MySQL公式ドキュメント](https://dev.mysql.com/doc/connector-j/en/connector-j-connp-props-security.html)を参照してください。
:::

## 相互認証（mTLS）の設定

より高いセキュリティレベルが必要な場合、mTLS相互認証を有効にできます。これにより、クライアントも認証のための証明書の提供が必要になります。

### mTLSの有効化

FE設定ファイル`conf/fe.conf`を変更し、以下の設定を追加してFEを再起動します：

```properties
enable_ssl = true
ssl_force_client_auth = true
```
### クライアント接続

mTLSで接続する場合、クライアントはCA証明書、クライアント証明書、および秘密鍵を指定する必要があります：

```shell
mysql --ssl-mode=VERIFY_CA -uroot -P9030 -h127.0.0.1 \
    --tls-version=TLSv1.2 \
    --ssl-ca=/path/to/your/ca.pem \
    --ssl-cert=/path/to/your/client-cert.pem \
    --ssl-key=/path/to/your/client-key.pem
```
Dorisは、`Doris/conf/mysql_ssl_default_certificate/client_certificate/`ディレクトリにあるデフォルトのクライアント証明書ファイルを提供します：

| ファイル名 | 説明 |
|-------|------|
| `ca.pem` | CA証明書 |
| `client-cert.pem` | クライアント証明書 |
| `client-key.pem` | クライアント秘密鍵 |

## 証明書設定の詳細

DorisでSSL機能を有効にするには、CA鍵証明書とサーバー側鍵証明書を設定する必要があります。相互認証が有効な場合は、クライアント側鍵証明書も必要です。

### デフォルト証明書

Dorisには直接使用できる組み込みのデフォルト証明書ファイルがあります：

| 証明書タイプ | デフォルトパス | デフォルトパスワード |
|---------|---------|---------|
| CA証明書 | `Doris/fe/mysql_ssl_default_certificate/ca_certificate.p12` | `doris` |
| サーバー証明書 | `Doris/fe/mysql_ssl_default_certificate/server_certificate.p12` | `doris` |
| クライアント証明書 | `Doris/fe/mysql_ssl_default_certificate/client_certificate/` | - |

### カスタム証明書

カスタム証明書を使用する必要がある場合は、FE設定ファイル`conf/fe.conf`に以下の設定を追加できます：

**CA証明書設定**

```properties
mysql_ssl_default_ca_certificate = /path/to/your/ca_certificate.p12
mysql_ssl_default_ca_certificate_password = your_password
```
**サーバー証明書設定**

```properties
mysql_ssl_default_server_certificate = /path/to/your/server_certificate.p12
mysql_ssl_default_server_certificate_password = your_password
```
## カスタム証明書の生成

独自の証明書を使用する必要がある場合は、OpenSSLを使用して生成できます。詳細な手順については、[MySQL Official Documentation: Creating SSL Certificates Using OpenSSL](https://dev.mysql.com/doc/refman/8.0/en/creating-ssl-files-using-openssl.html)を参照してください。

### ステップ1: CA、サーバー、およびクライアントキーと証明書の生成

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
### ステップ2: 証明書の検証

```shell
openssl verify -CAfile ca.pem server-cert.pem client-cert.pem
```
### Step 3: PKCS#12形式へのパッケージ

CAキーと証明書、Serverキーと証明書をそれぞれ別々にPKCS#12（P12）形式にマージして、Dorisで使用できるようにします：

```shell
# Package CA key and certificate
openssl pkcs12 -inkey ca-key.pem -in ca.pem -export -out ca_certificate.p12

# Package Server key and certificate
openssl pkcs12 -inkey server-key.pem -in server-cert.pem -export -out server_certificate.p12
```
:::tip Tip
`conf/fe.conf`設定ファイルを変更し、`ssl_trust_store_type`パラメータを追加することで、他の証明書形式を指定することもできます。デフォルトはPKCS12です。
:::

:::info More Information
OpenSSLを使用した自己署名証明書の生成に関する詳細情報については、[IBM Official Documentation](https://www.ibm.com/docs/en/api-connect/2018.x?topic=overview-generating-self-signed-certificate-using-openssl)を参照してください。
:::
