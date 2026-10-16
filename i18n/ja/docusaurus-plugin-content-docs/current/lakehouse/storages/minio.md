---
{
    "title": "MinIO | ストレージ",
    "language": "ja",
    "description": "このドキュメントでは、MinIO へのアクセスに必要なパラメーターを説明します。これらは以下の用途に適用されます。",
    "sidebar_label": "MinIO"
}
---

# MinIO

このドキュメントでは、MinIO へのアクセスに必要なパラメーターを説明します。これらは以下の用途に適用されます。

- Catalog のプロパティ
- テーブル値関数のプロパティ
- Broker Load のプロパティ
- Export のプロパティ
- Outfile のプロパティ

**Doris は S3 クライアントを使用し、S3 互換プロトコルを介して MinIO にアクセスします。**

## パラメーター一覧

| プロパティ名 | 旧名称 | 説明 | デフォルト値 | 必須 |
| ------------ | ------ | ---- | ------------ | ---- |
| minio.endpoint | s3.endpoint | MinIO へのアクセスに使用するエンドポイント | | はい |
| minio.access_key | s3.access_key | 認証に使用する MinIO のアクセスキー | | はい |
| minio.secret_key | s3.secret_key | アクセスキーと組み合わせて使用する MinIO のシークレットキー | | はい |
| minio.connection.maximum | s3.connection.maximum | S3 の最大接続数。MinIO サービスとの間に確立する接続の最大数を指定します | 50 | いいえ |
| minio.connection.request.timeout | s3.connection.request.timeout | S3 のリクエストタイムアウト。MinIO サービスへの接続時のリクエストタイムアウトをミリ秒単位で指定します | 3000 | いいえ |
| minio.connection.timeout | s3.connection.timeout | S3 の接続タイムアウト。MinIO サービスとの接続確立時のタイムアウトをミリ秒単位で指定します | 1000 | いいえ |
| minio.use_path_style | s3.use_path_style | パス形式でアクセスするかどうか。MinIO やその他の AWS 以外の S3 サービスとの互換性のために、true に設定することを推奨します | FALSE | いいえ |

### パス形式でのアクセス

MinIO はデフォルトでホスト形式のアクセスを使用しますが、パス形式のアクセスもサポートしています。`minio.use_path_style` パラメーターを設定すると切り替えられます。

- ホスト形式のアクセス（デフォルト）：`https://bucket.minio.example.com`
- パス形式のアクセス（有効化した場合）：`https://minio.example.com/bucket`

## 設定例

```properties
"minio.access_key" = "your-access-key",
"minio.secret_key" = "your-secret-key",
"minio.endpoint" = "http://minio.example.com:9000"
```

3.1 より前のバージョンでは、以下を使用します。

```properties
"s3.access_key" = "your-access-key",
"s3.secret_key" = "your-secret-key",
"s3.endpoint" = "http://minio.example.com:9000"
```

## 使用上の推奨事項

* MinIO の設定で一貫性と明確さを保つため、パラメーターには `minio.` プレフィックスを使用することを推奨します。
* 3.1 より前のバージョンでは、旧名称の `s3.` プレフィックスを使用してください。
* 接続プールのパラメーターは、同時実行の要件に応じて調整することで、接続を…
