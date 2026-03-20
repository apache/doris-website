---
{
  "title": "MinIO | ストレージ",
  "language": "ja",
  "description": "この文書では、以下のシナリオに適用されるMinIOにアクセスするために必要なパラメータについて説明します。",
  "sidebar_label": "MinIO"
}
---
# MinIO

このドキュメントでは、以下のシナリオに適用されるMinIOにアクセスするために必要なパラメータについて説明します：

- カタログプロパティ
- table Valued Functionプロパティ
- Broker Loadプロパティ
- Exportプロパティ
- Outfileプロパティ

**DorisはS3互換プロトコルを通じてMinIOにアクセスするためにS3 Clientを使用します。**

## パラメータ概要

| プロパティ名                     | 旧名                      | 説明                                                        | デフォルト値   | 必須     |
| ------------------------------ | ------------------------ | ------------------------------------------------------------ | ------------- | -------- |
| minio.endpoint                 | s3.endpoint              | MinIOエンドポイント、MinIOのアクセスエンドポイント              |               | Yes      |
| minio.access_key               | s3.access_key            | MinIOアクセスキー、認証に使用されるMinIOアクセスキー             |               | Yes      |
| minio.secret_key               | s3.secret_key            | MinIOシークレットキー、アクセスキーと併用するシークレットキー      |               | Yes      |
| minio.connection.maximum       | s3.connection.maximum    | S3最大接続数、MinIOサービスとの最大接続数を指定               | 50            | No       |
| minio.connection.request.timeout | s3.connection.timeout    | S3リクエストタイムアウト、ミリ秒単位、MinIOサービスに接続する際のリクエストタイムアウトを指定 | 3000          | No       |
| minio.connection.timeout       | s3.connection.timeout    | S3接続タイムアウト、ミリ秒単位、MinIOサービスとの接続確立時のタイムアウトを指定 | 1000          | No       |
| minio.use_path_style           | s3.use_path_style        | パススタイルアクセスを使用するかどうか。MinIOおよびその他の非AWS S3サービスとの互換性のためにtrueに設定することを推奨 | FALSE         | No       |

### パススタイルアクセスの使用

MinIOはデフォルトでホストスタイルアクセスを使用しますが、パススタイルアクセスもサポートしています。`minio.use_path_style`パラメータを設定することで切り替えることができます。

- ホストスタイルアクセス（デフォルト）：`https://bucket.minio.example.com`
- パススタイルアクセス（有効時）：`https://minio.example.com/bucket`

## 設定例

```properties
"minio.access_key" = "your-access-key",
"minio.secret_key" = "your-secret-key",
"minio.endpoint" = "http://minio.example.com:9000"
```
バージョン3.1より前の場合:

```properties
"s3.access_key" = "your-access-key",
"s3.secret_key" = "your-secret-key",
"s3.endpoint" = "http://minio.example.com:9000"
```
## 使用推奨事項

* MinIOとの一貫性と明確性を確保するために、設定パラメータには`minio.`プレフィックスを使用することを推奨します。
* バージョン3.1より前では、プレフィックスとしてレガシー名`s3.`を使用してください。
* コネクションプールパラメータは、コネクションを回避するために同時実行要件に応じて調整できます
