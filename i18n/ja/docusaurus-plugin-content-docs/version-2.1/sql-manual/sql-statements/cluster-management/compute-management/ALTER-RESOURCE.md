---
{
  "title": "ALTER RESOURCE",
  "language": "ja",
  "description": "このステートメントは既存のリソースを変更するために使用されます。rootまたはadminユーザーのみがリソースを変更できます。"
}
---
## 説明

このステートメントは既存のリソースを変更するために使用されます。rootユーザーまたはadminユーザーのみがリソースを変更できます。

## 構文

```sql
ALTER RESOURCE '<resource_name>'
PROPERTIES (
  `<property>`, 
  [ , ... ]
);
```
## パラメータ

1.`<property>`

`<property>`の形式は`<key>` = `<value>`であり、`<key>`が'type'と等しい場合の`<value>`の変更はサポートされていません。

変更されたpropertiesパラメータは[CREATE-RESOURCE](./CREATE-RESOURCE.md)セクションで参照できます。


## 例

1. spark0という名前のSparkリソースの作業ディレクトリを変更する：

```sql
ALTER RESOURCE 'spark0' PROPERTIES ("working_dir" = "hdfs://127.0.0.1:10000/tmp/doris_new");
```
2. remote_s3という名前のS3リソースへの最大接続数を変更します：

```sql
ALTER RESOURCE 'remote_s3' PROPERTIES ("s3.connection.maximum" = "100");
```
3. コールド・ホット分離S3リソースに関連する情報の変更

- サポート対象
  - `s3.access_key`  s3 ak
  - `s3.secret_key`  s3 sk
  - `s3.session_token` s3 token
  - `s3.connection.maximum` デフォルト 50
  - `s3.connection.timeout` デフォルト 1000ms
  - `s3.connection.request.timeout` デフォルト 3000ms
- サポート対象外
  - `s3.region`
  - `s3.bucket"`
  - `s3.root.path`
  - `s3.endpoint`

```sql
  ALTER RESOURCE "showPolicy_1_resource" PROPERTIES("s3.connection.maximum" = "1111");
```
