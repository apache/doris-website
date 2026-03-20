---
{
  "title": "Tencent COS",
  "description": "この文書では、Tencent Cloud COSにアクセスするために必要なパラメータについて説明します。これらのパラメータは以下のシナリオに適用されます：",
  "language": "ja"
}
---
この文書では、Tencent Cloud COSへのアクセスに必要なパラメータについて説明します。これらのパラメータは以下のシナリオに適用されます：

- カタログプロパティ
- table Valued Functionプロパティ
- Broker Loadプロパティ
- Exportプロパティ
- Outfileプロパティ

**DorisはS3 Clientを使用して、S3互換プロトコル経由でTencent Cloud COSにアクセスします。**

## パラメータ概要

| Property Name                  | Legacy Name              | デスクリプション                                                  | デフォルト値 | Required |
| ------------------------------ | ------------------------ | ------------------------------------------------------------ | ------------- | -------- |
| cos.endpoint                   | s3.endpoint              | COSエンドポイント、Tencent Cloud COSのアクセスエンドポイントを指定 |               | Yes      |
| cos.access_key                 | s3.access_key            | COSアクセスキー、COSへのアクセス認証に使用                   |               | Yes      |
| cos.secret_key                 | s3.secret_key            | COSシークレットキー、アクセスキーと組み合わせて認証に使用     |               | Yes      |
| cos.region                     | s3.region                | COSリージョン、Tencent Cloud COSのリージョンを指定          |               | No       |
| cos.connection.maximum         | s3.connection.maximum    | S3最大接続数、COSサービスへの最大接続数を指定               | 50            | No       |
| cos.connection.request.timeout | s3.connection.timeout    | S3リクエストタイムアウト（ミリ秒）、COSサービスへの接続時のリクエストタイムアウトを指定 | 3000          | No       |
| cos.connection.timeout         | s3.connection.timeout    | S3接続タイムアウト（ミリ秒）、COSサービスへの接続確立時のタイムアウトを指定 | 1000          | No       |

> バージョン3.1より前では、legacy nameを使用してください

## 設定例

```properties
"cos.access_key" = "your-access-key",
"cos.secret_key" = "your-secret-key",
"cos.endpoint" = "cos.ap-beijing.myqcloud.com",
"cos.region" = "ap-beijing"
```
バージョン3.1より前の場合:

```properties
"s3.access_key" = "ak",
"s3.secret_key" = "sk",
"s3.endpoint" = "cos.ap-beijing.myqcloud.com",
"s3.region" = "ap-beijing"
```
## 使用推奨事項

* 設定パラメータには`cos.`プレフィックスを使用することを推奨します。これによりTencent Cloud COSとの一貫性と明確性が確保されます。
* バージョン3.1より前では、従来の`s3.`プレフィックスを使用してください。
* `cos.region`を設定することでアクセス精度とパフォーマンスが向上するため、設定することを推奨します。
* コネクションプールパラメータは、コネクションブロッキングを回避するために同時実行要件に応じて調整できます。
