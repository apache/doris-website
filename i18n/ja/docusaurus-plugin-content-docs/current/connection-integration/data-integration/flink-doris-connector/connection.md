---
{
    "title": "接続オプションと TLS",
    "language": "ja",
    "description": "Flink Doris Connector から Doris に接続するための一般的なオプションと、HTTP、JDBC、Thrift、Arrow Flight SQL 接続で TLS を有効にする方法を説明します。"
}
---

# 接続オプションと TLS

このページでは、Flink Doris Connector が Doris への接続に使用する一般的なオプションと、TLS を有効にする方法を説明します。これらのオプションは Source、Sink、Lookup Join のいずれにも適用されます。

## 一般的なオプション {#common-options}

| キー | デフォルト値 | 必須 | 説明 |
| --- | --- | --- | --- |
| fenodes | -- | Y | Doris FE の HTTP アドレス。複数のアドレスをカンマで区切って指定できます。 |
| benodes | -- | N | Doris BE の HTTP アドレス。複数のアドレスをカンマで区切って指定できます。 |
| jdbc-url | -- | N | JDBC 接続情報。例: `jdbc:mysql://127.0.0.1:9030` |
| table.identifier | -- | Y | Doris のテーブル名。例: `db.tbl` |
| username | -- | Y | Doris にアクセスするためのユーザー名。 |
| password | -- | Y | Doris にアクセスするためのパスワード。 |
| auto-redirect | TRUE | N | Stream Load リクエストをリダイレクトするかどうか。有効にすると、BE の情報を明示的に取得せずに、FE 経由で Stream Load を書き込みます。 |
| doris.request.retries | 3 | N | Doris へのリクエスト送信を再試行する回数。 |
| doris.request.connect.timeout | 30s | N | Doris へのリクエスト送信時の接続タイムアウト。 |
| doris.request.read.timeout | 30s | N | Doris へのリクエスト送信時の読み取りタイムアウト。 |
| doris.enable.tls | FALSE | N | Doris の HTTP、MySQL/JDBC、BE Thrift、Arrow Flight SQL 接続で TLS を有効にするかどうか。 |
| doris.tls.ca-certificate-path | -- | N | PEM 形式の CA 証明書チェーンのローカルパス。空の場合、Connector はカスタム CA を読み込まず、対応するクライアントのデフォルトのトラストストアを使用します。 |
| doris.tls.skip-hostname-verification | FALSE | N | CA 検証を維持したまま、サーバーのホスト名検証をスキップするかどうか。 |
| doris.tls.excluded-protocols | -- | N | TLS を有効にしても平文通信のままにするプロトコルをカンマで区切って指定します。指定できる値は `http`、`mysql`、`thrift`、`arrowflight` です。 |

## TLS の有効化 {#tls}

Connector は、Doris の HTTP と Stream Load、MySQL/JDBC、BE Thrift、Arrow Flight SQL 接続で TLS を有効にできます。TLS はデフォルトで無効です。TLS を有効にすると、Connector は Doris サーバーの証明書を検証します。

Doris の Source、Sink、または Catalog の設定に、次のオプションを追加します。

```sql
'doris.enable.tls' = 'true',
'doris.tls.ca-certificate-path' = '/etc/doris-tls/ca-chain.pem'
```

`doris.tls.ca-certificate-path` で CA ファイルを指定する場合は、PEM 形式の証明書チェーンを使用し、Doris に接続するすべての Flink プロセスがローカルファイルシステムからそのファイルを読み取れるようにしてください。このパスを設定しない場合、Connector はカスタム CA を読み込まず、対応するクライアントのデフォルトのトラストストアを使用します。本番環境ではホスト名検証を有効のままにしてください。

Doris の特定のプロトコルを意図的に平文通信のままにする場合は、そのプロトコルだけを除外してください。指定できる値は `http`、`mysql`、`thrift`、`arrowflight` です。

```sql
'doris.tls.excluded-protocols' = 'arrowflight'
```

Connector はプロトコルを探査せず、TLS の失敗後に平文通信へ切り替えることもありません。

`doris.enable.tls` を有効にすると、Connector は `jdbc-url` を変更せず、JDBC 接続プロパティを通じて TLS 設定を渡します。そのため、`jdbc-url` には接続先アドレスのみを指定してください。`sslMode`、`useSSL`、トラストストアの設定などの TLS パラメータは追加しないでください。

Arrow Flight SQL は TLS に対応していますが、ホスト名検証だけをスキップすることには対応していません。`doris.tls.skip-hostname-verification` を `true` に設定する場合は、`arrowflight` を `doris.tls.excluded-protocols` で除外してください。

Flink のデプロイモードに応じて CA ファイルを配布します。

- **Standalone**: Doris に接続するすべての JobManager、TaskManager、SQL Gateway ホストの同じパスにファイルを配置します。
- **YARN**: `yarn.ship-files: /local/path/ca.pem` を使用してファイルをローカライズし、`doris.tls.ca-certificate-path` には `ca.pem` のようなコンテナ内にローカライズされたファイル名を指定します。
- **Kubernetes**: 関連する JobManager と TaskManager の Pod の同じパスに ConfigMap または Secret をマウントします。
