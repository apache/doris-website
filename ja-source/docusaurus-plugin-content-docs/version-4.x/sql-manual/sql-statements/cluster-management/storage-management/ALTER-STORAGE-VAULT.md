---
{
  "title": "ALTER STORAGE VAULT",
  "description": "Storage Vaultの可変プロパティを変更します。",
  "language": "ja"
}
---
## 説明

Storage Vaultの可変プロパティを変更します。

## 構文

```sql
ALTER STORAGE VAULT <storage_vault_name>
PROPERTIES (<storage_vault_property>)
```
## 必須パラメータ

**<storage_vault_property>**

> - type: 候補値はs3、hdfsです。このフィールドは3.0.8以降ではオプションです

>typeがs3の場合、許可されるプロパティフィールドは以下の通りです：
>
>- s3.access_key: s3 vaultのak
>- s3.secret_key: s3 vaultのsk
>- vault_name: vaultの名前。vaultが`SET <original_vault_name> DEFAULT STORAGE VAULT`文を使用してデフォルトストレージvaultに設定されている場合、その名前は変更できません。vaultの名前を変更するには、まず`UNSET DEFAULT STORAGE VAULT`コマンドを実行してデフォルトストレージvaultの設定を解除し、その後名前を変更する必要があります。最後に、名前を変更したvaultをデフォルトストレージvaultとして設定する必要がある場合は、`SET <new_vault_name> DEFAULT STORAGE VAULT`文を使用できます。
>- use_path_style: パススタイルURLを許可するかどうか、オプション値はtrue、falseです。デフォルト値はfalseです。

>typeがhdfsの場合、以下のフィールドは禁止されています：
>
>- path_prefix: ストレージパスプレフィックス
>- fs.defaultFS: hdfs名

## 権限制御

このSQLコマンドを実行するユーザーは、少なくともADMIN_PRIV権限を持つ必要があります。

## 例

s3ストレージvault akを変更

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
