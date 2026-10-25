---
{
    "title": "ALTER RESOURCE",
    "language": "ja",
    "description": "この文は既存のリソースを変更するために使用します。リソースを変更できるのは root ユーザーまたは admin ユーザーだけです。"
}
---

## 説明 {#description}

この文は既存のリソースを変更するために使用します。リソースを変更できるのは root ユーザーまたは admin ユーザーだけです。

4.1.5 以降、root が作成したことを示すマーカーが付いた新規の AI Resource を変更または削除できるのは root だけです。他の `ADMIN` ユーザーは変更も削除もできません。アップグレード前に作成され、このマーカーがないリソースには、この制限は遡及適用されません。詳しくは [AI Resource の権限](../../../sql-functions/ai-functions/overview.md)を参照してください。

## 構文 {#syntax}

```sql
ALTER RESOURCE '<resource_name>'
PROPERTIES (
  `<property>`,
  [ , ... ]
);
```

## パラメータ {#parameters}

1.`<property>`

`<property>` の形式は `<key>` = `<value>` です。`<key>` が 'type' の場合、その `<value>` は変更できません。

変更可能なプロパティのパラメータについては、[CREATE-RESOURCE](./CREATE-RESOURCE.md) のセクションを参照してください。


## 例 {#examples}

1. spark0 という名前の Spark リソースの作業ディレクトリを変更します。

```sql
ALTER RESOURCE 'spark0' PROPERTIES ("working_dir" = "hdfs://127.0.0.1:10000/tmp/doris_new");
```

2. remote_s3 という名前の S3 リソースの最大接続数を変更します。

```sql
ALTER RESOURCE 'remote_s3' PROPERTIES ("s3.connection.maximum" = "100");
```

3. データの冷熱分離に使用する S3 リソースに関する情報を変更します。

- 対応
  - `s3.access_key` S3 のアクセスキー
  - `s3.secret_key` S3 のシークレットキー
  - `s3.session_token` S3 のトークン
  - `s3.connection.maximum` デフォルトは 50
  - `s3.connection.timeout` デフォルトは 1000ms
  - `s3.connection.request.timeout` デフォルトは 3000ms
- 非対応
  - `s3.region`
  - `s3.bucket"`
  - `s3.root.path`
  - `s3.endpoint`

```sql
  ALTER RESOURCE "showPolicy_1_resource" PROPERTIES("s3.connection.maximum" = "1111");
```
