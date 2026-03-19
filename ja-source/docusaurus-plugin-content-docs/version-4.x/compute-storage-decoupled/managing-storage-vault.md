---
{
  "title": "ストレージVaultの管理",
  "language": "ja",
  "description": "Storage Vaultは、Dorisが分離されたストレージ・コンピュート モデルで使用するリモート共有ストレージです。"
}
---
Storage Vaultは、Dorisが分離されたストレージ・コンピュートモデルで使用するリモート共有ストレージです。1つ以上のStorage Vaultを設定して、異なるテーブルを異なるStorage Vaultに格納することができます。

## Storage Vaultの作成

**構文**

```sql
CREATE STORAGE VAULT [IF NOT EXISTS] <vault_name>
PROPERTIES
("key" = "value",...)
```
<vault_name> は Storage Vault のユーザー定義名で、Storage Vault へのアクセス時の識別子として機能します。


### HDFS Storage Vault の作成

HDFS ベースの分離ストレージ・コンピュート Doris クラスターを作成するには、すべてのノード（FE/BE ノード、Meta Service を含む）が指定された HDFS へのアクセス権限を持つことを確認してください。これには、事前に Kerberos 認証設定と接続性チェックの完了が含まれます（対応する各ノードで Hadoop Client を使用してテストできます）。

```sql
CREATE STORAGE VAULT IF NOT EXISTS hdfs_vault_demo
    PROPERTIES (
        "type"="hdfs",                                     -- required
        "fs.defaultFS"="hdfs://127.0.0.1:8020",            -- required
        "path_prefix"="big/data",                          -- optional, generally filled in according to business name
        "hadoop.username"="user"                           -- optional
        "hadoop.security.authentication"="kerberos"        -- optional
        "hadoop.kerberos.principal"="hadoop/127.0.0.1@XXX" -- optional
        "hadoop.kerberos.keytab"="/etc/emr.keytab"         -- optional
    );
```
### S3 Storage Vault を作成する

```sql
CREATE STORAGE VAULT IF NOT EXISTS s3_vault_demo
PROPERTIES (
    "type" = "S3",                                 -- required
    "s3.endpoint" = "oss-cn-beijing.aliyuncs.com", -- required
    "s3.region" = "cn-beijing",                    -- required
    "s3.bucket" = "bucket",                        -- required
    "s3.root.path" = "big/data/prefix",            -- required
    "s3.access_key" = "ak",                        -- required
    "s3.secret_key" = "sk",                        -- required
    "provider" = "OSS",                            -- required
    "use_path_style" = "false"                     -- optional
);
```
より詳細なパラメータの説明と例は [CREATE-STORAGE-VAULT](../sql-manual/sql-statements/cluster-management/storage-management/CREATE-STORAGE-VAULT) を参照してください。

**注意**
提供されたオブジェクトストレージパスは、head/get/list/put/multipartUpload/delete のアクセス権限を持っている必要があります。

## Storage Vault の表示

**構文**

```
SHOW STORAGE VAULTS
```
返される結果には4つの列が含まれます：Storage Vault名、Storage Vault ID、プロパティ、およびデフォルトのStorage Vaultかどうかです。

## デフォルトのStorage Vaultを設定する

**構文**

```sql
SET <vault_name> AS DEFAULT STORAGE VAULT
```
## テーブル作成時にStorage Vaultを指定する

テーブルを作成する際、`PROPERTIES`で`storage_vault_name`を指定すると、指定した`vault name`に対応するStorage Vaultにデータが保存されます。テーブルが正常に作成された後は、`storage_vault`を変更することはできません。つまり、Storage Vaultの変更はサポートされていません。

**例**

```sql
CREATE TABLE IF NOT EXISTS supplier (
  s_suppkey int(11) NOT NULL COMMENT "",
  s_name varchar(26) NOT NULL COMMENT "",
  s_address varchar(26) NOT NULL COMMENT "",
  s_city varchar(11) NOT NULL COMMENT "",
  s_nation varchar(16) NOT NULL COMMENT "",
  s_region varchar(13) NOT NULL COMMENT "",
  s_phone varchar(16) NOT NULL COMMENT ""
)
UNIQUE KEY (s_suppkey)
DISTRIBUTED BY HASH(s_suppkey) BUCKETS 1
PROPERTIES (
"replication_num" = "1",
"storage_vault_name" = "hdfs_demo_vault"
);
```
## データベース作成時のStorage Vaultの指定

データベースを作成する際は、`PROPERTIES`で`storage_vault_name`を指定します。データベース配下でテーブルを作成する際に`storage_vault_name`が指定されていない場合、テーブルはデータストレージにデータベースの`vault name`に対応するStorage Vaultを使用します。ユーザーは[ALTER-DATABASE](../sql-manual/sql-statements/database/ALTER-DATABASE.md)を使用してデータベースの`storage_vault_name`を変更できます。ただし、この操作はデータベース配下で既に作成されているテーブルの`storage_vault`には影響せず、新しく作成されるテーブルのみが更新された`storage_vault`を使用します。

**例**

```sql
CREATE DATABASE IF NOT EXIST `db_test`
PROPERTIES (
    "storage_vault_name" = "hdfs_demo_vault"
);
```
:::info Note

この機能はバージョン3.0.5以降でサポートされています。

テーブル作成時にStorage Vaultを使用する際の優先順位は次の通りです：テーブル -> データベース -> デフォルトStorage Vault。テーブルのPROPERTYでStorage Vaultが指定されていない場合、データベースでStorage Vaultが指定されているかチェックします。データベースでも指定されていない場合、さらにデフォルトStorage Vaultがあるかチェックします。

Storage Vaultの`VAULT_NAME`属性が変更されると、データベースに設定されたStorage Vaultが無効になり、エラーが発生する可能性があります。ユーザーは実際の状況に基づいて、データベースに有効な`storage_vault_name`を設定する必要があります。

:::


## Alter Storage Vault

Storage Vault設定の変更可能なプロパティを変更するために使用されます。

S3 Storage Vaultで許可されているプロパティ：
- `VAULT_NAME`
- `s3.access_key`
- `s3.secret_key`
- `use_path_style`

HDFS Storage Vaultで禁止されているプロパティ：
- `path_prefix`
- `fs.defaultFS`

プロパティの説明は[CREATE-STORAGE-VAULT](../sql-manual/sql-statements/cluster-management/storage-management/CREATE-STORAGE-VAULT)で確認できます。

**例**

```sql
ALTER STORAGE VAULT old_s3_vault
PROPERTIES (
    "type" = "S3",
    "VAULT_NAME" = "new_s3_vault",
    "s3.access_key" = "new_ak"
    "s3.secret_key" = "new_sk"
);
```
```sql
ALTER STORAGE VAULT old_hdfs_vault
PROPERTIES (
    "type" = "hdfs",
    "VAULT_NAME" = "new_hdfs_vault",
    "hadoop.username" = "hdfs"
);
```
## Storage Vaultの削除

サポートされていません

## Storage Vaultの権限

指定されたMySQLユーザーに特定のStorage Vaultの使用権限を付与し、テーブルの作成やStorage Vaultの表示時にそのStorage Vaultを指定できるようにします。

### 付与

```sql
GRANT
    USAGE_PRIV
    ON STORAGE VAULT <vault_name>
    TO { ROLE | USER } {<role> | <user>}
```
Admin ユーザーのみが `GRANT` ステートメントを実行する権限を持ちます。これは指定された Storage Vault 権限を User/Role に付与するために使用されます。特定の Storage Vault に対して `USAGE_PRIV` 権限を持つ Users/Roles は以下の操作を実行できます：

- `SHOW STORAGE VAULTS` を通じてその Storage Vault の情報を表示する
- テーブル作成時に `PROPERTIES` でその Storage Vault の使用を指定する

**例**

```sql
grant usage_priv on storage vault my_storage_vault to user1
```
### Revoke

指定されたMySQLユーザーのStorage Vault権限を取り消します。

**構文**

```sql
REVOKE 
    USAGE_PRIV
    ON STORAGE VAULT <vault_name>
    FROM { ROLE | USER } {<role> | <user>}
```
Admin ユーザーのみが `REVOKE` ステートメントを実行する権限を持ちます。このステートメントは、指定された Storage Vault に対する User/Role の権限を取り消すために使用されます。

**例**

```sql
revoke usage_priv on storage vault my_storage_vault from user1
```
## FAQ

#### Q1. 特定のstorage vaultがどのテーブルによって参照されているかを確認するには？

1. `show storage vault`を使用して、storage vault名に対応するstorage vault idを見つけます。

2. 以下のSQL文を実行します：

```sql
mysql> select * from information_schema.table_properties where PROPERTY_NAME = "storage_vault_id" and PROPERTY_VALUE=3;
+---------------+---------------------------------+-------------------------------------+------------------+----------------+
| TABLE_CATALOG | TABLE_SCHEMA                    | TABLE_NAME                          | PROPERTY_NAME    | PROPERTY_VALUE |
+---------------+---------------------------------+-------------------------------------+------------------+----------------+
| internal      | regression_test_vault_p0_create | s3_92ba28c209154d968e680e58dd54d0cc | storage_vault_id | 3              |
+---------------+---------------------------------+-------------------------------------+------------------+----------------+
1 row in set (0.04 sec)
```
`PROPERTY_VALUE=3`を対応するstorage vault id値に置き換えます。
