---
{
    "title": "Managing Storage Vault",
    "language": "en"
}
---

<!--
Licensed to the Apache Software Foundation (ASF) under one
or more contributor license agreements.  See the NOTICE file
distributed with this work for additional information
regarding copyright ownership.  The ASF licenses this file
to you under the Apache License, Version 2.0 (the
"License"); you may not use this file except in compliance
with the License.  You may obtain a copy of the License at

  http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing,
software distributed under the License is distributed on an
"AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
KIND, either express or implied.  See the License for the
specific language governing permissions and limitations
under the License.
-->

The Storage Vault is a remote shared storage used by Doris in a decoupled storage-compute model. You can configure one or more Storage Vaults to store different tables in different Storage Vaults.

## Create a Storage Vault

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
CREATE STORAGE VAULT IF NOT EXISTS ssb_hdfs_vault
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
CREATE STORAGE VAULT IF NOT EXISTS ssb_s3_vault
    PROPERTIES (
        "type"="S3",                                   -- required
        "s3.endpoint" = "oss-cn-beijing.aliyuncs.com", -- required
        "s3.region" = "bj",                            -- required
        "s3.bucket" = "bucket",                        -- required
        "s3.root.path" = "big/data/prefix",            -- required
        "s3.access_key" = "ak",                        -- required
        "s3.secret_key" = "sk",                        -- required
        "provider" = "OSS"                             -- required
    );
```

More parameter explanations and examples can be found in [CREATE-STORAGE-VAULT](../sql-manual/sql-statements/Data-Definition-Statements/Create/CREATE-STORAGE-VAULT.md).

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
"storage_vault_name" = "ssb_hdfs_vault"
);
```

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

Properties explanations can be found in [CREATE-STORAGE-VAULT](../sql-manual/sql-statements/Data-Definition-Statements/Create/CREATE-STORAGE-VAULT.md).

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

### Grant

```sql
GRANT
    USAGE_PRIV
    ON STORAGE VAULT <vault_name>
    TO { ROLE | USER } {<role> | <user>}
```

Only Admin users have the authority to execute the `GRANT` statement, which is used to grant specified Storage Vault privileges to User/Role. Users/Roles with `USAGE_PRIV` privilege for a certain Storage Vault can perform the following operations:

- View the information of that Storage Vault through `SHOW STORAGE VAULT`;
- Specify the use of that Storage Vault in `PROPERTIES` when creating tables.

**Example**

```sql
grant usage_priv on storage vault my_storage_vault to user1
```

### Revoke

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
