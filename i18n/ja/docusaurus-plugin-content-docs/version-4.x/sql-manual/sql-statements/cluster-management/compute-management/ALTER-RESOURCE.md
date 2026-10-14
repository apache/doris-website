---
{
    "title": "ALTER RESOURCE",
    "language": "ja",
    "description": "このステートメントは、既存のリソースを変更するために使用します。リソースを変更できるのは root ユーザーまたは admin ユーザーのみです。"
}
---

## 説明

このステートメントは、既存のリソースを変更するために使用します。リソースを変更できるのは root ユーザーまたは admin ユーザーのみです。

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

`<property>` の形式は `<key>` = `<value>` です。`<value>` の変更は、`<key>` が 'type' の場合にはサポートされていません。

変更可能なプロパティのパラメータについては、[CREATE-RESOURCE](./CREATE-RESOURCE.md) を参照してください。


## 例

1. spark0 という名前の Spark リソースの作業ディレクトリを変更します。

```sql
ALTER RESOURCE 'spark0' PROPERTIES ("working_dir" = "hdfs://127.0.0.1:10000/tmp/doris_new");
```

2. remote_s3 という名前の S3 リソースの最大接続数を変更します。

```sql
ALTER RESOURCE 'remote_s3' PROPERTIES ("s3.connection.maximum" = "100");
```

3. 温冷分離用の S3 リソースに関連する情報を変更します。

- サポート対象
  - `s3.access_key`  S3 アクセスキー
  - `s3.secret_key`  S3 シークレットキー
  - `s3.session_token` S3 セッショントークン
  - `s3.connection.maximum` デフォルト: 50
  - `s3.connection.timeout` デフォルト: 1000ms
  - `s3.connection.request.timeout` デフォルト: 3000ms
- サポート対象外
  - `s3.region`
  - `s3.bucket"`
  - `s3.root.path`
  - `s3.endpoint`

```sql
  ALTER RESOURCE "showPolicy_1_resource" PROPERTIES("s3.connection.maximum" = "1111");
```
