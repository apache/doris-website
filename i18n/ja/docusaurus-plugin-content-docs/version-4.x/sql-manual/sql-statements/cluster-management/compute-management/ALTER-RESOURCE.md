---
{
    "title": "ALTER RESOURCE",
    "language": "ja",
    "description": "この文は既存のリソースを変更するために使用します。root または admin ユーザーのみがリソースを変更できます。"
}
---

## 説明 {#description}

この文は既存のリソースを変更するために使用します。root または admin ユーザーのみがリソースを変更できます。

4.1.5 以降、新しく作成され、root が作成者としてマークされた AI Resource は、root のみが変更または削除できます。他の `ADMIN` ユーザーはこれらの操作を実行できません。アップグレード前に作成され、このマーカーが付いていないリソースには、遡及的な制限は適用されません。詳しくは [AI Resource の権限](../../../sql-functions/ai-functions/overview.md) を参照してください。

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

`<property>` の形式は `<key>` = `<value>` であり、`<value>` のうち `<key>` が 'type' に等しいものの変更はサポートされません。

変更可能な properties パラメータについては、[CREATE-RESOURCE](./CREATE-RESOURCE.md) セクションを参照してください。


## 例 {#examples}

1. spark0 という名前の Spark リソースの作業ディレクトリを変更します。

```sql
ALTER RESOURCE 'spark0' PROPERTIES ("working_dir" = "hdfs://127.0.0.1:10000/tmp/doris_new");
```

2. remote_s3 という名前の S3 リソースの最大接続数を変更します。

```sql
ALTER RESOURCE 'remote_s3' PROPERTIES ("s3.connection.maximum" = "100");
```

3. コールド/ホット分離 S3 リソースに関連する情報を変更します。

- サポート対象
  - `s3.access_key`  s3 の ak
  - `s3.secret_key`  s3 の sk
  - `s3.session_token` s3 トークン
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
