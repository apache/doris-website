---
{
    "title": "Managing Storage Vault",
    "language": "en",
    "description": "The Storage Vault is a remote shared storage used by Doris in a decoupled storage-compute model."
}
---

The Storage Vault is a remote shared storage used by Doris in a decoupled storage-compute model. You can configure one or more Storage Vaults to store different tables in different Storage Vaults.

## Create an Storage Vault

**Syntax**

```sql
CREATE STORAGE VAULT [IF NOT EXISTS] <vault_name>
PROPERTIES
("key" = "value",...)
```

<vault_name> is the user-defined name of the Storage Vault, which serves as the identifier for accessing the Storage Vault.


### Create an HDFS Storage Vault

To create an HDFS-based decoupled storage-compute Doris cluster, ensure that all nodes (including FE/BE nodes, Meta Service) have privilege to access the specified HDFS, including completing Kerberos authorization configuration and connectivity checks in advance (which can be tested using Hadoop Client on each corresponding node).

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

### Create an S3 Storage Vault

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

More parameter explanations and examples can be found in [CREATE-STORAGE-VAULT](../sql-manual/sql-statements/cluster-management/storage-management/CREATE-STORAGE-VAULT.md).

**Note**
The provided object storage path must have head/get/list/put/multipartUpload/delete access permissions.

## View Storage Vaults

**Syntax**

```
SHOW STORAGE VAULTS
```

The returned result includes 4 columns: the Storage Vault name, Storage Vault ID, properties, and whether it is the default Storage Vault.

## Set the Default Storage Vault

**Syntax**

```sql
SET <vault_name> AS DEFAULT STORAGE VAULT
```

## Specify Storage Vault When Creating a Table

When creating a table, specify `storage_vault_name` in `PROPERTIES`, and the data will be stored in the Storage Vault corresponding to the specified `vault name`. Once the table is successfully created, the `storage_vault` cannot be modified, meaning changing the Storage Vault is not supported.

**Example**

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

## Specify Storage Vault When Creating a Database

When creating a database, specify `storage_vault_name` in `PROPERTIES`. If `storage_vault_name` is not specified when creating a table under the database, the table will use the Storage Vault corresponding to the database's `vault name` for data storage. Users can change the `storage_vault_name` of the database via [ALTER-DATABASE](../sql-manual/sql-statements/database/ALTER-DATABASE.md). However, this action will not affect the `storage_vault` of tables that have already been created under the database, and only newly created tables will use the updated `storage_vault`.

**Example**

```sql
CREATE DATABASE IF NOT EXIST `db_test`
PROPERTIES (
    "storage_vault_name" = "hdfs_demo_vault"
);
```

:::info Note

This feature is supported since version 3.0.5.

The priority order for using Storage Vault when creating a table is: Table -> Database -> Default Storage Vault. If Storage Vault is not specified in the table's PROPERTY, it will check if Storage Vault is specified in the database; if the database also does not specify it, it will further check if there is a default Storage Vault.

If the `VAULT_NAME` attribute of Storage Vault is modified, it may cause the Storage Vault set in the database to become invalid, resulting in an error. Users will need to configure a valid `storage_vault_name` for the database based on the actual situation.

:::

## Alter Storage Vault

Used to alter modifiable properties of the Storage Vault configuration.

S3 Storage Vault allowed properties:
- `VAULT_NAME`
- `s3.access_key`
- `s3.secret_key`
- `use_path_style`

HDFS Storage Vault forbidden properties:
- `path_prefix`
- `fs.defaultFS`

Properties explanations can be found in [CREATE-STORAGE-VAULT](../sql-manual/sql-statements/cluster-management/storage-management/CREATE-STORAGE-VAULT.md).

**Example**

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
## Delete an Storage Vault

Not supported

## Storage Vault Privilege

Grant a specified MySQL user the usage privilege for a certain Storage Vault, allowing the user to specify that Storage Vault when creating tables or viewing Storage Vaults.

### Granting

```sql
GRANT
    USAGE_PRIV
    ON STORAGE VAULT <vault_name>
    TO { ROLE | USER } {<role> | <user>}
```

Only Admin users have the authority to execute the `GRANT` statement, which is used to grant specified Storage Vault privileges to User/Role. Users/Roles with `USAGE_PRIV` privilege for a certain Storage Vault can perform the following operations:

- View the information of that Storage Vault through `SHOW STORAGE VAULTS`;
- Specify the use of that Storage Vault in `PROPERTIES` when creating tables.

**Example**

```sql
grant usage_priv on storage vault my_storage_vault to user1
```

### Revoking

Revoke the Storage Vault privileges of a specified MySQL user.

**Syntax**

```sql
REVOKE 
    USAGE_PRIV
    ON STORAGE VAULT <vault_name>
    FROM { ROLE | USER } {<role> | <user>}
```

Only Admin users have the authority to execute the `REVOKE` statement, which is used to revoke the privileges of User/Role for the specified Storage Vault.

**Example**

```sql
revoke usage_priv on storage vault my_storage_vault from user1
```

## FAQ

#### Q1. 如何查询特定storage vault被那些表引用？

1. Use `show storage vault` to find the ​​storage vault id​​ corresponding to the storage vault name.

2. Execute the following SQL statement:

```sql
mysql> select * from information_schema.table_properties where PROPERTY_NAME = "storage_vault_id" and PROPERTY_VALUE=3;
+---------------+---------------------------------+-------------------------------------+------------------+----------------+
| TABLE_CATALOG | TABLE_SCHEMA                    | TABLE_NAME                          | PROPERTY_NAME    | PROPERTY_VALUE |
+---------------+---------------------------------+-------------------------------------+------------------+----------------+
| internal      | regression_test_vault_p0_create | s3_92ba28c209154d968e680e58dd54d0cc | storage_vault_id | 3              |
+---------------+---------------------------------+-------------------------------------+------------------+----------------+
1 row in set (0.04 sec)
```

Replace `PROPERTY_VALUE=3` with the corresponding ​​storage vault id​​ value.