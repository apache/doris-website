---
{
"title": "ALTER STORAGE VAULT",
"language": "en"
}
---

## Description

Modify the mutable properties of a Storage Vault.

## Syntax

```sql
ALTER STORAGE VAULT <storage_vault_name>
PROPERTIES (<storage_vault_property>)
```

## Required Parameters

**<storage_vault_property>**

> - type: Optional values are s3, hdfs

>When type is s3, the allowed property fields are as follows:
>
>- s3.access_key: ak for s3 vault
>- s3.secret_key: sk for s3 vault
>- vault_name: The name of the vault. When a vault is set as the default storage vault using the statement `SET <original_vault_name> DEFAULT STORAGE VAULT`, its name cannot be modified. To rename the vault, you must first unset the default storage vault by executing the `UNSET DEFAULT STORAGE VAULT` command, and then modify its name. Finally, if you need to set the renamed vault as the default storage vault, you can use the statement `SET <new_vault_name> DEFAULT STORAGE VAULT`.
>- use_path_style: Whether to allow path style url, optional values are true, false. The default value is false.

>When type is hdfs, the following fields are prohibited:
>
>- path_prefix: Storage path prefix
>- fs.defaultFS: hdfs name

## Permission Control

The user executing this SQL command must have at least ADMIN_PRIV permissions.

## Examples

Modify s3 storage vault ak

```sql
ALTER STORAGE VAULT old_vault_name
PROPERTIES (
  "type"="S3",
  "VAULT_NAME" = "new_vault_name",
   "s3.access_key" = "new_ak"
);
```

Modify hdfs storage vault

```sql
ALTER STORAGE VAULT old_vault_name
PROPERTIES (
  "type"="hdfs",
  "VAULT_NAME" = "new_vault_name",
  "hadoop.username" = "hdfs"
);
```
