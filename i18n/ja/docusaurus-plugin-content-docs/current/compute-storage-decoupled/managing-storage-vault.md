---
{
    "title": "Storage Vault の管理：作成、設定、アクセス制御",
    "sidebar_label": "Storage Vault の管理",
    "language": "ja",
    "description": "コンピュートとストレージを分離したモードでの Storage Vault の作成、表示、変更方法、テーブルやデータベースの保存先の指定方法、ユーザーのアクセス権限の管理方法を説明します。",
    "keywords": ["Storage Vault", "コンピュートとストレージの分離", "オブジェクトストレージ", "HDFS", "S3", "ストレージ管理", "Doris"]
}
---

<!-- Knowledge type: Operational steps -->
<!-- Applicable scenarios: Storage configuration and management for compute-storage decoupled clusters -->

Storage Vault は、コンピュートとストレージを分離したモードで Doris が使用するリモート共有ストレージの抽象化です。一つ以上の Storage Vault を設定し、テーブルごとに異なる Storage Vault にデータを保存することで、ストレージを柔軟に管理できます。

## Storage Vault を作成する

<!-- Knowledge type: Operational steps -->

**構文**

```sql
CREATE STORAGE VAULT [IF NOT EXISTS] <vault_name>
PROPERTIES
("key" = "value", ...)
```

`<vault_name>` は Storage Vault に付ける任意の名前で、以降の操作で使用する一意の識別子です。

### HDFS Storage Vault を作成する

<!-- Applicable scenarios: Using HDFS as shared storage -->

HDFS ベースの Storage Vault を作成する前に、FE、BE、Meta Service を含むすべてのノードから対象の HDFS にアクセスできることを確認してください。Kerberos 認証の設定と接続確認も行います（各ノードで Hadoop Client を使用してテストできます）。

```sql
CREATE STORAGE VAULT IF NOT EXISTS hdfs_vault_demo
PROPERTIES (
    "type"                          = "hdfs",                      -- required
    "fs.defaultFS"                  = "hdfs://127.0.0.1:8020",     -- required
    "path_prefix"                   = "big/data",                  -- optional, typically filled with the business name
    "hadoop.username"               = "user",                      -- optional
    "hadoop.security.authentication" = "kerberos",                 -- optional
    "hadoop.kerberos.principal"     = "hadoop/127.0.0.1@XXX",     -- optional
    "hadoop.kerberos.keytab"        = "/etc/emr.keytab"            -- optional
);
```

### S3 Storage Vault を作成する

<!-- Applicable scenarios: Using object storage (OSS/S3/COS, etc.) as shared storage -->

```sql
CREATE STORAGE VAULT IF NOT EXISTS s3_vault_demo
PROPERTIES (
    "type"           = "S3",                                -- required
    "s3.endpoint"    = "oss-cn-beijing.aliyuncs.com",       -- required
    "s3.region"      = "cn-beijing",                        -- required
    "s3.bucket"      = "bucket",                            -- required
    "s3.root.path"   = "big/data/prefix",                   -- required
    "s3.access_key"  = "ak",                                -- required
    "s3.secret_key"  = "sk",                                -- required
    "provider"       = "OSS",                               -- required
    "use_path_style" = "false"                              -- optional
);
```

:::caution 必要な権限
オブジェクトストレージのパスには、`head`、`get`、`list`、`put`、`multipartUpload`、`delete` のアクセス権限が必要です。
:::

クラウドプロバイダー別の例やパラメータの説明については、[CREATE-STORAGE-VAULT](../sql-manual/sql-statements/cluster-management/storage-management/CREATE-STORAGE-VAULT)を参照してください。

## Storage Vault を表示する

<!-- Knowledge type: Operational steps -->

**構文**

```sql
SHOW STORAGE VAULTS
```

結果には次の 4 列が含まれます。

| 列 | 説明 |
|--------|-------------|
| Storage Vault Name | ユーザーが定義した Vault の識別子 |
| Storage Vault ID | システムが割り当てた一意の ID |
| Properties | Vault の設定プロパティ |
| IsDefault | デフォルトの Storage Vault かどうか |

## デフォルトの Storage Vault を設定する

<!-- Knowledge type: Operational steps -->

**構文**

```sql
SET <vault_name> AS DEFAULT STORAGE VAULT
```

設定後、テーブルの作成時に Storage Vault を明示的に指定しなければ、このデフォルトの Vault が自動的に使用されます。

## テーブルの作成時に Storage Vault を指定する

<!-- Knowledge type: Operational steps -->
<!-- Applicable scenarios: Binding a storage location to a specific table -->

テーブルを作成するときは、`storage_vault_name` を `PROPERTIES` 句に指定した `CREATE TABLE` 文を使用します。テーブルのデータは、対応する Storage Vault に保存されます。

:::warning 注意
テーブルの作成に成功した後、そのテーブルの `storage_vault` は**変更できません**。作成後に Storage Vault を変更することはサポートされていません。
:::

**例**

```sql
CREATE TABLE IF NOT EXISTS supplier (
    s_suppkey int(11)      NOT NULL COMMENT "",
    s_name    varchar(26)  NOT NULL COMMENT "",
    s_address varchar(26)  NOT NULL COMMENT "",
    s_city    varchar(11)  NOT NULL COMMENT "",
    s_nation  varchar(16)  NOT NULL COMMENT "",
    s_region  varchar(13)  NOT NULL COMMENT "",
    s_phone   varchar(16)  NOT NULL COMMENT ""
)
UNIQUE KEY (s_suppkey)
DISTRIBUTED BY HASH(s_suppkey) BUCKETS 1
PROPERTIES (
    "replication_num"    = "1",
    "storage_vault_name" = "hdfs_demo_vault"
);
```

## データベースの作成時に Storage Vault を指定する

<!-- Knowledge type: Operational steps -->
<!-- Applicable scenarios: Setting a default storage location for a database -->

データベースを作成するときは、`storage_vault_name` を `PROPERTIES` 句に指定した `CREATE DATABASE` 文を使用します。データベース内で新しく作成するテーブルに Storage Vault を個別に指定しなかった場合、データベースの Storage Vault 設定が継承されます。

**例**

```sql
CREATE DATABASE IF NOT EXISTS `db_test`
PROPERTIES (
    "storage_vault_name" = "hdfs_demo_vault"
);
```

データベースの `storage_vault_name` は [ALTER-DATABASE](../sql-manual/sql-statements/database/ALTER-DATABASE.md) で変更できます。**変更は新しく作成するテーブルにのみ適用され、既存のテーブルには影響しません。**

:::info バージョンに関する注意事項と優先順位

- データベース作成時の Storage Vault の指定は、**バージョン 3.0.5** 以降でサポートされています。
- テーブル作成時に使用する Storage Vault の優先順位は、高い順に **テーブル** > **データベース** > **デフォルトの Storage Vault** です。
- Storage Vault の `VAULT_NAME` を変更すると、データベース単位で設定された Vault が無効になり、エラーが発生する場合があります。その場合は、データベースに有効な `storage_vault_name` を再設定する必要があります。

:::

## Storage Vault を変更する

<!-- Knowledge type: Configuration parameters -->
<!-- Applicable scenarios: Updating storage credentials or renaming a Vault -->

`ALTER STORAGE VAULT` を使用して、Storage Vault の変更可能なプロパティを更新します。

### 変更可能なプロパティ

**S3 Storage Vault** で変更できるプロパティは次のとおりです。

| プロパティ | 説明 |
|----------|-------------|
| `VAULT_NAME` | Vault 名（名前の変更） |
| `s3.access_key` | アクセスキー ID |
| `s3.secret_key` | シークレットアクセスキー |
| `use_path_style` | パス形式のアクセスを使用するかどうか |

**HDFS Storage Vault** で**変更できない**プロパティは次のとおりです。

| プロパティ | 理由 |
|----------|--------|
| `path_prefix` | 変更すると、過去のデータのパスとの整合性が失われるため |
| `fs.defaultFS` | 変更すると、書き込み済みのデータにアクセスできなくなるため |

その他のプロパティの説明については、[CREATE-STORAGE-VAULT](../sql-manual/sql-statements/cluster-management/storage-management/CREATE-STORAGE-VAULT)を参照してください。

### 例

S3 Storage Vault を変更します。

```sql
ALTER STORAGE VAULT old_s3_vault
PROPERTIES (
    "type"           = "S3",
    "VAULT_NAME"     = "new_s3_vault",
    "s3.access_key"  = "new_ak",
    "s3.secret_key"  = "new_sk"
);
```

HDFS Storage Vault を変更します。

```sql
ALTER STORAGE VAULT old_hdfs_vault
PROPERTIES (
    "type"             = "hdfs",
    "VAULT_NAME"       = "new_hdfs_vault",
    "hadoop.username"  = "hdfs"
);
```

## Storage Vault を削除する

現在、Storage Vault の削除はサポートされていません。

## Storage Vault のアクセス制御

<!-- Knowledge type: Operational steps -->
<!-- Applicable scenarios: Storage access control in multi-user environments -->

管理者ユーザーは、指定した MySQL ユーザーまたはロールに Storage Vault の使用権限を付与できます。これにより、テーブル作成時に Vault を参照したり、その情報を表示したりできるユーザーを制御します。

Storage Vault に対する `USAGE_PRIV` を持つユーザーまたはロールは、次の操作を実行できます。

- `SHOW STORAGE VAULTS` で Storage Vault の情報を表示する
- テーブル作成時に `PROPERTIES` で Storage Vault を指定する

### 権限を付与する

**構文**

```sql
GRANT
    USAGE_PRIV
    ON STORAGE VAULT <vault_name>
    TO { ROLE | USER } {<role> | <user>}
```

**例**

```sql
GRANT USAGE_PRIV ON STORAGE VAULT my_storage_vault TO USER user1;
```

### 権限を取り消す

**構文**

```sql
REVOKE
    USAGE_PRIV
    ON STORAGE VAULT <vault_name>
    FROM { ROLE | USER } {<role> | <user>}
```

**例**

```sql
REVOKE USAGE_PRIV ON STORAGE VAULT my_storage_vault FROM USER user1;
```

## よくある質問

<!-- Knowledge type: Troubleshooting -->
<!-- Applicable scenarios: Routine operations and troubleshooting -->

### Q1: 特定の Storage Vault を参照しているテーブルを調べるにはどうすればよいですか？

**ステップ 1**：`SHOW STORAGE VAULTS` を実行し、対象の Storage Vault の `storage_vault_id` を確認します。

**ステップ 2**：次の SQL を実行して、その Vault を参照しているテーブルを検索します。`PROPERTY_VALUE=3` を実際の `storage_vault_id` の値に置き換えてください。

```sql
SELECT *
FROM information_schema.table_properties
WHERE PROPERTY_NAME = "storage_vault_id"
  AND PROPERTY_VALUE = 3;
```

クエリ結果の例：

```
+---------------+---------------------------------+-------------------------------------+------------------+----------------+
| TABLE_CATALOG | TABLE_SCHEMA                    | TABLE_NAME                          | PROPERTY_NAME    | PROPERTY_VALUE |
+---------------+---------------------------------+-------------------------------------+------------------+----------------+
| internal      | regression_test_vault_p0_create | s3_92ba28c209154d968e680e58dd54d0cc | storage_vault_id | 3              |
+---------------+---------------------------------+-------------------------------------+------------------+----------------+
1 row in set (0.04 sec)
```

### Q2: テーブルの作成後に Storage Vault を変更できますか？

できません。テーブルの作成に成功した後、そのテーブルの `storage_vault` プロパティは変更できません。別の Storage Vault を使用するには、テーブルを再作成してデータを再ロードする必要があります。

### Q3: Storage Vault の名前を変更すると、以前その Vault を参照していたデータベースに影響しますか？

はい。Storage Vault の `VAULT_NAME` を変更すると、データベース単位の `storage_vault_name` 設定が無効になり、そのデータベース内で新しいテーブルを作成するときにエラーが発生する場合があります。[ALTER-DATABASE](../sql-manual/sql-statements/database/ALTER-DATABASE.md) を使用して、データベースに有効な `storage_vault_name` を再設定する必要があります。
