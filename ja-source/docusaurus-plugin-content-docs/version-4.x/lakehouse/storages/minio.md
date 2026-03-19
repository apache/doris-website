---
{
  "title": "MinIO | ストレージ",
  "language": "ja",
  "description": "この文書では、以下のシナリオに適用されるMinIOにアクセスするために必要なパラメータについて説明します：",
  "sidebar_label": "MinIO"
}
---
# MinIO

この文書では、以下のシナリオに適用される、MinIOにアクセスするために必要なパラメータについて説明します：

- Catalogプロパティ
- Table Valued Functionプロパティ
- Broker Loadプロパティ
- Exportプロパティ
- Outfileプロパティ

**DorisはS3互換プロトコルを通じてMinIOにアクセスするためにS3 Clientを使用します。**

## パラメータ概要

| Property Name                  | Legacy Name              | Description                                                  | Default Value | Required |
| ------------------------------ | ------------------------ | ------------------------------------------------------------ | ------------- | -------- |
| minio.endpoint                 | s3.endpoint              | MinIOエンドポイント、MinIOのアクセスエンドポイント               |               | Yes      |
| minio.access_key               | s3.access_key            | MinIOアクセスキー、認証に使用されるMinIOアクセスキー |               | Yes      |
| minio.secret_key               | s3.secret_key            | MinIOシークレットキー、アクセスキーと一緒に使用されるシークレットキー |               | Yes      |
| minio.connection.maximum       | s3.connection.maximum    | S3最大接続数、MinIOサービスとの最大接続数を指定 | 50            | No       |
| minio.connection.request.timeout | s3.connection.timeout    | S3リクエストタイムアウト、ミリ秒単位、MinIOサービスに接続する際のリクエストタイムアウトを指定 | 3000          | No       |
| minio.connection.timeout       | s3.connection.timeout    | S3接続タイムアウト、ミリ秒単位、MinIOサービスとの接続確立時のタイムアウトを指定 | 1000          | No       |
| minio.connection.timeout       | s3.use_path_style        | パススタイルアクセスを使用するかどうか。MinIOおよびその他の非AWS S3サービスとの互換性のためにtrueに設定することを推奨 | FALSE         | No       |

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
バージョン3.1より前の場合：

```properties
"s3.access_key" = "your-access-key",
"s3.secret_key" = "your-secret-key",
"s3.endpoint" = "http://minio.example.com:9000"
```
## 使用推奨事項

* 設定パラメータには `minio.` プレフィックスを使用して、MinIOとの一貫性と明確性を確保することを推奨します。
* バージョン3.1より前では、プレフィックスとして従来の名前 `s3.` を使用してください。
* 接続プールパラメータは、接続の問題を回避するために同時実行要件に応じて調整できます
