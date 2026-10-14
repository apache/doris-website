---
{
    "title": "ALTER STORAGE VAULT",
    "language": "ja",
    "description": "Storage Vault の変更可能なプロパティを変更します。"
}
---

## 説明

Storage Vault の変更可能なプロパティを変更します。

## 構文

```sql
ALTER STORAGE VAULT <storage_vault_name>
PROPERTIES (<storage_vault_property>)
```

## 必須パラメータ

**<storage_vault_property>**

> - type: 指定できる値は s3、hdfs です。3.0.8 以降、この項目は省略できます。

>type が s3 の場合、指定できるプロパティは以下のとおりです。
>
>- s3.access_key: S3 Vault のアクセスキー（ak）
>- s3.secret_key: S3 Vault のシークレットキー（sk）
>- vault_name: Vault の名前です。`SET <original_vault_name> DEFAULT STORAGE VAULT` ステートメントで Vault をデフォルトの Storage Vault に設定している場合、その名前は変更できません。名前を変更するには、まず `UNSET DEFAULT STORAGE VAULT` コマンドを実行してデフォルトの Storage Vault 設定を解除し、その後で名前を変更します。名前を変更した Vault を再びデフォルトの Storage Vault に設定する場合は、`SET <new_vault_name> DEFAULT STORAGE VAULT` ステートメントを使用できます。
>- use_path_style: パス形式の URL を許可するかどうかを指定します。指定できる値は true、false です。デフォルト値は false です。

>type が hdfs の場合、指定できるプロパティは以下のとおりです。
>
>- path_prefix: ストレージパスのプレフィックス
>- fs.defaultFS: HDFS の名前

## 権限

この SQL コマンドを実行するユーザーには、少なくとも ADMIN_PRIV 権限が必要です。

## 例

S3 Storage Vault のアクセスキー（ak）を変更する

```sql
ALTER STORAGE VAULT old_vault_name
PROPERTIES (
  "type"="S3",
  "VAULT_NAME" = "new_vault_name",
   "s3.access_key" = "new_ak"
);
```

HDFS Storage Vault を変更する

```sql
ALTER STORAGE VAULT old_vault_name
PROPERTIES (
  "type"="hdfs",
  "VAULT_NAME" = "new_vault_name",
  "hadoop.username" = "hdfs"
);
```
