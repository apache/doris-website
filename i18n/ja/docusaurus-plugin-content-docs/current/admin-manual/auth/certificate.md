---
{
    "title": "MySQL クライアントとの安全な通信",
    "language": "ja",
    "description": "Apache Doris の SSL/TLS 暗号化接続の設定ガイド。MySQL クライアントとの安全な通信、片方向認証と mTLS 相互認証、証明書の生成および設定について説明します。"
}
---

<!-- Knowledge type: Operation steps / Configuration parameters -->
<!-- Applicable scenarios: Data transport encryption / Client identity authentication / Security compliance -->

このドキュメントでは、Apache Doris と MySQL クライアント間の通信を SSL/TLS で暗号化する方法を説明します。SSL をすぐに有効にする方法、クライアントの接続方法、mTLS 相互認証、カスタム証明書の設定、証明書の生成を扱います。

## 適用シナリオ

| シナリオ | 推奨される方法 |
|------|----------|
| 一般的な業務でデータ転送を暗号化する | 片方向認証（デフォルト）を有効にする |
| 金融、行政、企業などのコンプライアンス要件に対応する | mTLS 相互認証を有効にする |
| 企業内の CA が発行した証明書を使用する | カスタム証明書を設定する |
| PoC または開発環境でのみ簡単に検証する | Doris に組み込まれているデフォルトの証明書を使用する |

## 前提条件

- Apache Doris クラスターがデプロイされ、正常に稼働していること
- MySQL クライアントのバージョンが 5.7.11 以上であること（それより古いバージョンでは SSL パラメーターの構文が異なります）
- 現在サポートされている TLS プロトコルのバージョンは TLS 1.2 と TLS 1.3
- FE ノードの `conf/fe.conf` を変更する権限と、FE を再起動するための操作権限があること

## 手順の概要

1. FE の設定で SSL を有効にする（より高いセキュリティレベルが必要な場合は mTLS も有効にする）
2. FE を再起動して設定を反映する
3. MySQL クライアントで `--ssl-mode` パラメーターを指定し、暗号化された接続を開始する
4. （任意）デフォルトの証明書をカスタム証明書に置き換える

## SSL 認証モードの比較

<!-- Knowledge type: Architecture selection decision -->

Doris には二つの SSL 認証モードがあります。セキュリティ要件に応じて選択してください。

| 認証モード | 説明 | 適用シナリオ |
|----------|------|----------|
| 片方向認証（デフォルト） | サーバー証明書のみを検証する | 一般的なセキュリティ要件がある場合 |
| 相互認証（mTLS） | サーバー証明書とクライアント証明書の両方を検証する | 高度なセキュリティが必要な場合 |

## クイックスタート：SSL 暗号化接続を有効にする

<!-- Knowledge type: Operation steps -->
<!-- Applicable scenarios: First-time SSL enablement / Quick verification with default certificates -->

Doris にはデフォルトの鍵ファイルと証明書ファイルが付属しているため、追加の証明書を生成せずに SSL を有効にできます。手順は次の二つです。

### ステップ 1：FE で SSL を有効にする

FE の設定ファイル `conf/fe.conf` に次の設定を追加し、FE を再起動します。

```properties
enable_ssl = true
```

### ステップ 2：MySQL クライアントで接続する

```shell
mysql --ssl-mode=REQUIRED -uroot -P9030 -h127.0.0.1
```

## クライアントの SSL 接続モード

<!-- Knowledge type: Configuration parameters -->

MySQL クライアントでは、`--ssl-mode` パラメーターで接続時の動作を制御します。使用できるモードは次のとおりです。

| SSL モード | 説明 | コマンド例 |
|----------|------|----------|
| PREFERRED（デフォルト） | 最初に SSL 接続を試み、失敗した場合は暗号化されていない接続に切り替える | `mysql -uroot -P9030 -h127.0.0.1` |
| DISABLE | SSL を無効にし、暗号化されていない接続を使用する | `mysql --ssl-mode=DISABLE -uroot -P9030 -h127.0.0.1` |
| REQUIRED | SSL 接続を必須にする | `mysql --ssl-mode=REQUIRED -uroot -P9030 -h127.0.0.1` |
| VERIFY_CA | SSL 接続を必須にし、サーバー証明書の CA を検証する（mTLS のシナリオで使用） | [相互認証（mTLS）を設定する](#configure-mutual-authentication-mtls)を参照 |

:::note 注意
`--ssl-mode` パラメーターは MySQL 5.7.11 で導入されました。それより古いバージョンの MySQL クライアントについては、[MySQL の公式ドキュメント](https://dev.mysql.com/doc/connector-j/en/connector-j-connp-props-security.html)を参照してください。
:::

## 相互認証（mTLS）を設定する {#configure-mutual-authentication-mtls}

<!-- Knowledge type: Operation steps -->
<!-- Applicable scenarios: High security requirements / Strong client identity verification -->

mTLS では、サーバーがクライアントの ID を検証するとともに、クライアントもサーバー証明書を検証します。接続する相手の ID に厳格な要件がある場合に適しています。

### ステップ 1：mTLS を有効にする

FE の設定ファイル `conf/fe.conf` に次の設定を追加し、FE を再起動します。

```properties
enable_ssl = true
ssl_force_client_auth = true
```

### ステップ 2：証明書を使用してクライアントから接続する

mTLS で接続する場合、クライアントは CA 証明書、クライアント証明書、秘密鍵を指定する必要があります。

```shell
mysql --ssl-mode=VERIFY_CA -uroot -P9030 -h127.0.0.1 \
    --tls-version=TLSv1.2 \
    --ssl-ca=/path/to/your/ca.pem \
    --ssl-cert=/path/to/your/client-cert.pem \
    --ssl-key=/path/to/your/client-key.pem
```

### デフォルトのクライアント証明書

Doris はデフォルトのクライアント証明書ファイルを `Doris/conf/mysql_ssl_default_certificate/client_certificate/` ディレクトリに用意しています。

| ファイル名 | 説明 |
|--------|------|
| `ca.pem` | CA 証明書 |
| `client-cert.pem` | クライアント証明書 |
| `client-key.pem` | クライアントの秘密鍵 |

## 証明書の設定の詳細

<!-- Knowledge type: Configuration parameters -->

Doris で SSL を有効にするには、CA の鍵と証明書、およびサーバー側の鍵と証明書を設定する必要があります。相互認証を有効にするには、クライアント側の鍵と証明書も設定する必要があります。

### デフォルトの証明書

Doris には、そのまま使用できるデフォルトの証明書ファイルが付属しています。

| 証明書の種類 | デフォルトのパス | デフォルトのパスワード |
|----------|----------|----------|
| CA 証明書 | `Doris/fe/mysql_ssl_default_certificate/ca_certificate.p12` | `doris` |
| サーバー側の証明書 | `Doris/fe/mysql_ssl_default_certificate/server_certificate.p12` | `doris` |
| クライアント側の証明書 | `Doris/fe/mysql_ssl_default_certificate/client_certificate/` | - |

### カスタム証明書

カスタム証明書を使用するには、FE の設定ファイル `conf/fe.conf` に次の設定を追加します。

**CA 証明書の設定**

```properties
mysql_ssl_default_ca_certificate = /path/to/your/ca_certificate.p12
mysql_ssl_default_ca_certificate_password = your_password
```

**サーバー側の証明書の設定**

```properties
mysql_ssl_default_server_certificate = /path/to/your/server_certificate.p12
mysql_ssl_default_server_certificate_password = your_password
```

:::tip ヒント
`ssl_trust_store_type` パラメーターを `conf/fe.conf` で変更すると、ほかの証明書形式も指定できます。デフォルトは `PKCS12` です。
:::

## カスタム証明書を生成する

<!-- Knowledge type: Operation steps -->
<!-- Applicable scenarios: Use enterprise CA / Replace default certificates with self-signed certificates -->

独自の証明書を使用する場合は、OpenSSL で生成できます。コマンドの詳細については、[MySQL の公式ドキュメント：SSL 証明書の作成](https://dev.mysql.com/doc/refman/8.0/en/creating-ssl-files-using-openssl.html)を参照してください。

### ステップ 1：CA、サーバー、クライアントの鍵と証明書を生成する

```shell
# Generate the CA certificate
openssl genrsa 2048 > ca-key.pem
openssl req -new -x509 -nodes -days 3600 \
    -key ca-key.pem -out ca.pem

# Generate the server-side certificate and sign it with the CA above
# server-cert.pem = public key, server-key.pem = private key
openssl req -newkey rsa:2048 -days 3600 \
    -nodes -keyout server-key.pem -out server-req.pem
openssl rsa -in server-key.pem -out server-key.pem
openssl x509 -req -in server-req.pem -days 3600 \
    -CA ca.pem -CAkey ca-key.pem -set_serial 01 -out server-cert.pem

# Generate the client-side certificate and sign it with the CA above
# client-cert.pem = public key, client-key.pem = private key
openssl req -newkey rsa:2048 -days 3600 \
    -nodes -keyout client-key.pem -out client-req.pem
openssl rsa -in client-key.pem -out client-key.pem
openssl x509 -req -in client-req.pem -days 3600 \
    -CA ca.pem -CAkey ca-key.pem -set_serial 01 -out client-cert.pem
```

### ステップ 2：証明書を検証する

```shell
openssl verify -CAfile ca.pem server-cert.pem client-cert.pem
```

### ステップ 3：PKCS#12 形式にパッケージ化する

CA の鍵と証明書、およびサーバー側の鍵と証明書を、それぞれ Doris で使用できる PKCS#12（P12）形式にまとめます。

```shell
# Package the CA key and certificate
openssl pkcs12 -inkey ca-key.pem -in ca.pem -export -out ca_certificate.p12

# Package the server-side key and certificate
openssl pkcs12 -inkey server-key.pem -in server-cert.pem -export -out server_certificate.p12
```

:::info 詳細情報
OpenSSL による自己署名証明書の生成については、[IBM の公式ドキュメント](https://www.ibm.com/docs/en/api-connect/2018.x?topic=overview-generating-self-signed-certificate-using-openssl)を参照してください。
:::

## よくある質問

<!-- Knowledge type: Troubleshooting -->
<!-- Applicable scenarios: SSL connection failure / Certificate configuration errors -->

### Q：クライアントで `--ssl-mode` パラメーターが認識されないと表示されます。

MySQL クライアントのバージョンが 5.7.11 より古い場合に発生します。MySQL クライアントをアップグレードするか、対応する接続パラメーターについて MySQL Connector/J のドキュメントを参照してください。

### Q：`enable_ssl=true` を有効にした後も、クライアントが暗号化されていない接続を使用します。

クライアントはデフォルトで `PREFERRED` モードを使用し、このモードでは SSL が必須になりません。クライアント側で `--ssl-mode=REQUIRED` または `VERIFY_CA` を使用してください。

### Q：mTLS モードで接続に失敗します。

クライアント証明書、CA 証明書、または秘密鍵が指定されていないか、パスが間違っています。`--ssl-ca`、`--ssl-cert`、`--ssl-key` がいずれも正しい証明書ファイルを指しているか確認してください。

### Q：カスタム証明書を読み込めません。

証明書の形式が `ssl_trust_store_type` と一致していないか、パスワードが間違っています。証明書が PKCS12 形式であることを確認するか、`ssl_trust_store_type` を明示的に設定してパスワードを確認してください。
