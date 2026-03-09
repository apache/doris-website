---
{
  "title": "ALTER STORAGE VAULT",
  "language": "ja",
  "description": "Storage Vaultのmutableプロパティを変更する。"
}
---
## 説明

Storage Vaultの変更可能なプロパティを修正します。

## 構文

```sql
ALTER STORAGE VAULT <storage_vault_name>
PROPERTIES (<storage_vault_property>)
```
## 必須パラメータ

**<storage_vault_property>**

> - type: 候補値は s3、hdfs です。このフィールドは 3.0.8 以降でオプションです

>type が s3 の場合、許可されるプロパティフィールドは以下の通りです：
>
>- s3.access_key: s3 vault の ak
>- s3.secret_key: s3 vault の sk
>- vault_name: vault の名前。vault が `SET <original_vault_name> DEFAULT STORAGE VAULT` ステートメントを使用してデフォルトストレージ vault として設定されている場合、その名前は変更できません。vault の名前を変更するには、まず `UNSET DEFAULT STORAGE VAULT` コマンドを実行してデフォルトストレージ vault の設定を解除し、その後名前を変更する必要があります。最後に、名前を変更した vault をデフォルトストレージ vault として設定する必要がある場合は、`SET <new_vault_name> DEFAULT STORAGE VAULT` ステートメントを使用できます。
>- use_path_style: パススタイル url を許可するかどうか、オプション値は true、false です。デフォルト値は false です。

>type が hdfs の場合、以下のフィールドは禁止されています：
>
>- path_prefix: ストレージパスプレフィックス
>- fs.defaultFS: hdfs 名

## 権限制御

この SQL コマンドを実行するユーザーは、少なくとも ADMIN_PRIV 権限を持っている必要があります。

## 例

s3 ストレージ vault ak を変更

```sql
ALTER STORAGE VAULT old_vault_name
PROPERTIES (
  "type"="S3",
  "VAULT_NAME" = "new_vault_name",
   "s3.access_key" = "new_ak"
);
```
hdfs storage vault を変更する

```sql
ALTER STORAGE VAULT old_vault_name
PROPERTIES (
  "type"="hdfs",
  "VAULT_NAME" = "new_vault_name",
  "hadoop.username" = "hdfs"
);
```
