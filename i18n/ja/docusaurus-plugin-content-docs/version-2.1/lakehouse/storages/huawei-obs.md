---
{
  "title": "Huawei OBS",
  "language": "ja",
  "description": "この資料では、以下のシナリオに適用される、Huawei Cloud OBSにアクセスするために必要なパラメータについて説明します："
}
---
この文書では、Huawei Cloud OBSへのアクセスに必要なパラメータについて説明します。これらは以下のシナリオに適用されます：

- Catalog properties
- Table Valued Function properties
- Broker Load properties
- Export properties
- Outfile properties

**DorisはS3互換プロトコルを通じてHuawei Cloud OBSにアクセスするためにS3 Clientを使用します。**

## パラメータ概要

| プロパティ名                | 旧名                      | 説明                                                  | デフォルト値 | 必須 |
| ---------------------------- | ------------------------ | ------------------------------------------------------------ | ------------- | -------- |
| obs.endpoint                 | s3.endpoint              | OBSエンドポイント、Huawei Cloud OBSのアクセスエンドポイントを指定 |               | Yes      |
| obs.access_key               | s3.access_key            | OBSアクセスキー、認証に使用                     |               | Yes      |
| obs.secret_key               | s3.secret_key            | OBSシークレットキー、アクセスキーと組み合わせて認証に使用 |               | Yes      |
| obs.region                   | s3.region                | OBSリージョン、Huawei Cloud OBSのリージョンを指定        |               | No       |
| obs.use_path_style           | s3.use_path_style        | パススタイルアクセスを使用するかどうか。MinIO/CephなどのAWS以外のS3サービスとの互換性のためtrueに設定することを推奨 | FALSE         | No       |
| obs.connection.maximum       | s3.connection.maximum    | OBSサービスへの最大接続数                | 50            | No       |
| obs.connection.request.timeout | s3.connection.request.timeout | OBSサービスへの接続リクエストタイムアウト（ミリ秒） | 3000          | No       |
| obs.connection.timeout       | s3.connection.timeout    | OBSサービスへの接続確立時の接続タイムアウト（ミリ秒） | 1000          | No       |

> バージョン3.1以前では、旧名を使用してください

## 設定例

```properties
"obs.access_key" = "your-access-key",
"obs.secret_key" = "your-secret-key",
"obs.endpoint" = "obs.cn-north-4.myhuaweicloud.com",
"obs.region" = "cn-north-4"
```
バージョン3.1より前の場合:

```properties
"s3.access_key" = "your-access-key",
"s3.secret_key" = "your-secret-key",
"s3.endpoint" = "obs.cn-north-4.myhuaweicloud.com",
"s3.region" = "cn-north-4",
```
## 使用推奨事項

* 設定パラメータには`obs.`プレフィックスを使用することを推奨します。これによりHuawei Cloud OBSとの一貫性と明確性が確保されます。
* バージョン3.1より前では、`s3.`プレフィックスを使用した従来の名前を使用してください。
* `obs.region`を設定することでアクセス精度とパフォーマンスが向上するため、設定することを推奨します。
* コネクションプールパラメータは同時実行要件に応じて調整し、コネクションブロッキングを回避できます。
