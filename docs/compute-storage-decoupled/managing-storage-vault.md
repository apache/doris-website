---
{
    "title": "Managing Storage Vault: Creation, Configuration, and Access Control",
    "sidebar_label": "Managing Storage Vault",
    "language": "en",
    "description": "Describes how to create, view, and modify Storage Vaults in compute-storage decoupled mode, specify storage locations for tables or databases, and manage user access permissions.",
    "keywords": ["Storage Vault", "compute-storage decoupled", "object storage", "HDFS", "S3", "storage management", "Doris"]
}
---

<!-- Knowledge type: Operational steps -->
<!-- Applicable scenarios: Storage configuration and management for compute-storage decoupled clusters -->

A Storage Vault is the remote shared storage abstraction that Doris uses in compute-storage decoupled mode. You can configure one or more Storage Vaults and store different tables in different Storage Vaults for flexible storage management.

## Create a Storage Vault

<!-- Knowledge type: Operational steps -->

**Syntax**

```sql
CREATE STORAGE VAULT [IF NOT EXISTS] <vault_name>
PROPERTIES
("key" = "value", ...)
```

`<vault_name>` is a user-defined name for the Storage Vault and serves as the unique identifier for subsequent operations.

### Create an HDFS Storage Vault

<!-- Applicable scenarios: Using HDFS as shared storage -->

Before creating an HDFS-based Storage Vault, ensure that all nodes (including FE, BE nodes, and Meta Service) can access the target HDFS, including completing Kerberos authorization configuration and connectivity checks (you can test this on each node using the Hadoop Client).

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

### Create an S3 Storage Vault

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

:::caution Permission Requirements
The object storage path must have the following access permissions: `head`, `get`, `list`, `put`, `multipartUpload`, `delete`.
:::

For more cloud provider examples and parameter descriptions, see [CREATE-STORAGE-VAULT](../sql-manual/sql-statements/cluster-management/storage-management/CREATE-STORAGE-VAULT).

## View Storage Vaults

<!-- Knowledge type: Operational steps -->

**Syntax**

```sql
SHOW STORAGE VAULTS
```

The result contains 4 columns:

| Column | Description |
|--------|-------------|
| Storage Vault Name | The user-defined Vault identifier |
| Storage Vault ID | The system-assigned unique ID |
| Properties | The configuration properties of the Vault |
| IsDefault | Whether this is the default Storage Vault |

## Set the Default Storage Vault

<!-- Knowledge type: Operational steps -->

**Syntax**

```sql
SET <vault_name> AS DEFAULT STORAGE VAULT
```

After this is set, if no Storage Vault is explicitly specified when creating a table, this default Vault is used automatically.

## Specify a Storage Vault When Creating a Table

<!-- Knowledge type: Operational steps -->
<!-- Applicable scenarios: Binding a storage location to a specific table -->

Specify `storage_vault_name` in the `PROPERTIES` clause of `CREATE TABLE`. The table data is then stored in the corresponding Storage Vault.

:::warning Note
After a table is created successfully, the `storage_vault` of that table **cannot be modified**. Changing the Storage Vault after creation is not supported.
:::

**Example**

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

## Specify a Storage Vault When Creating a Database

<!-- Knowledge type: Operational steps -->
<!-- Applicable scenarios: Setting a default storage location for a database -->

Specify `storage_vault_name` in the `PROPERTIES` clause of `CREATE DATABASE`. New tables created under the database inherit the database's Storage Vault configuration if no Storage Vault is specified individually for those tables.

**Example**

```sql
CREATE DATABASE IF NOT EXISTS `db_test`
PROPERTIES (
    "storage_vault_name" = "hdfs_demo_vault"
);
```

You can change the `storage_vault_name` of a database via [ALTER-DATABASE](../sql-manual/sql-statements/database/ALTER-DATABASE.md). **The change only takes effect for newly created tables and does not affect existing tables.**

:::info Version Notes and Priority Rules

- Specifying a Storage Vault at database creation time is supported starting from **version 3.0.5**.
- The priority of Storage Vault selection when creating a table (from highest to lowest): **Table** > **Database** > **Default Storage Vault**.
- If the `VAULT_NAME` of a Storage Vault is modified, the Vault configured at the database level may become invalid and cause errors. In that case, you must reconfigure a valid `storage_vault_name` for the database.

:::

## Modify a Storage Vault

<!-- Knowledge type: Configuration parameters -->
<!-- Applicable scenarios: Updating storage credentials or renaming a Vault -->

`ALTER STORAGE VAULT` updates the modifiable properties of a Storage Vault.

### Modifiable Properties

Properties that can be modified for an **S3 Storage Vault**:

| Property | Description |
|----------|-------------|
| `VAULT_NAME` | Vault name (rename) |
| `s3.access_key` | Access key ID |
| `s3.secret_key` | Access key secret |
| `use_path_style` | Whether to use path-style access |

Properties that **cannot** be modified for an **HDFS Storage Vault**:

| Property | Reason |
|----------|--------|
| `path_prefix` | Modifying it causes inconsistency in historical data paths |
| `fs.defaultFS` | Modifying it makes already-written data inaccessible |

For more property descriptions, see [CREATE-STORAGE-VAULT](../sql-manual/sql-statements/cluster-management/storage-management/CREATE-STORAGE-VAULT).

### Examples

Modify an S3 Storage Vault:

```sql
ALTER STORAGE VAULT old_s3_vault
PROPERTIES (
    "type"           = "S3",
    "VAULT_NAME"     = "new_s3_vault",
    "s3.access_key"  = "new_ak",
    "s3.secret_key"  = "new_sk"
);
```

Modify an HDFS Storage Vault:

```sql
ALTER STORAGE VAULT old_hdfs_vault
PROPERTIES (
    "type"             = "hdfs",
    "VAULT_NAME"       = "new_hdfs_vault",
    "hadoop.username"  = "hdfs"
);
```

## Delete a Storage Vault

Deleting a Storage Vault is not currently supported.

## Storage Vault Access Control

<!-- Knowledge type: Operational steps -->
<!-- Applicable scenarios: Storage access control in multi-user environments -->

Admin users can grant Storage Vault usage permissions to specified MySQL users or roles, controlling which users can reference a Vault when creating tables or view its information.

A user or role that holds `USAGE_PRIV` on a Storage Vault can perform the following operations:

- View the Storage Vault's information via `SHOW STORAGE VAULTS`
- Specify the Storage Vault in `PROPERTIES` when creating a table

### Grant Permissions

**Syntax**

```sql
GRANT
    USAGE_PRIV
    ON STORAGE VAULT <vault_name>
    TO { ROLE | USER } {<role> | <user>}
```

**Example**

```sql
GRANT USAGE_PRIV ON STORAGE VAULT my_storage_vault TO USER user1;
```

### Revoke Permissions

**Syntax**

```sql
REVOKE
    USAGE_PRIV
    ON STORAGE VAULT <vault_name>
    FROM { ROLE | USER } {<role> | <user>}
```

**Example**

```sql
REVOKE USAGE_PRIV ON STORAGE VAULT my_storage_vault FROM USER user1;
```

## FAQ

<!-- Knowledge type: Troubleshooting -->
<!-- Applicable scenarios: Routine operations and troubleshooting -->

### Q1: How do I find out which tables reference a specific Storage Vault?

**Step 1**: Run `SHOW STORAGE VAULTS` to find the `storage_vault_id` of the target Storage Vault.

**Step 2**: Run the following SQL to query tables that reference that Vault. Replace `PROPERTY_VALUE=3` with the actual `storage_vault_id` value:

```sql
SELECT *
FROM information_schema.table_properties
WHERE PROPERTY_NAME = "storage_vault_id"
  AND PROPERTY_VALUE = 3;
```

Example query result:

```
+---------------+---------------------------------+-------------------------------------+------------------+----------------+
| TABLE_CATALOG | TABLE_SCHEMA                    | TABLE_NAME                          | PROPERTY_NAME    | PROPERTY_VALUE |
+---------------+---------------------------------+-------------------------------------+------------------+----------------+
| internal      | regression_test_vault_p0_create | s3_92ba28c209154d968e680e58dd54d0cc | storage_vault_id | 3              |
+---------------+---------------------------------+-------------------------------------+------------------+----------------+
1 row in set (0.04 sec)
```

### Q2: Can I change the Storage Vault after a table is created?

No. After a table is created successfully, the `storage_vault` property of that table cannot be modified. If you need to use a different Storage Vault, you must recreate the table and reload the data.

### Q3: After renaming a Storage Vault, are databases that previously referenced that Vault affected?

Yes. If the `VAULT_NAME` of a Storage Vault is modified, the `storage_vault_name` configuration at the database level may become invalid, causing errors when creating new tables under that database. You must use [ALTER-DATABASE](../sql-manual/sql-statements/database/ALTER-DATABASE.md) to reassign a valid `storage_vault_name` to the database.
