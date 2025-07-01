---
{
    "title": "REVOKE FROM",
    "language": "en"
}
---

## Description

The REVOKE command has the following functions:

1. Revoke the specified permission of a user or a role.
2. Revoke the specified role previously granted to a user.

**Related Commands**

- [GRANT TO](./GRANT-TO.md)
- [SHOW GRANTS](../../../sql-manual/sql-statements/account-management/SHOW-GRANTS.md)
- [CREATE ROLE](./CREATE-ROLE.md)
- [CREATE WORKLOAD GROUP](../cluster-management/compute-management/CREATE-WORKLOAD-GROUP.md)
- [CREATE RESOURCE](../cluster-management/compute-management/CREATE-RESOURCE.md)
- [CREATE STORAGE VAULT](../cluster-management/storage-management/CREATE-STORAGE-VAULT.md)

## Syntax

**Revoke the specified permission of a user or a role**

```sql
REVOKE <privilege_list> 
ON { <priv_level> 
   | RESOURCE <resource_name> 
   | WORKLOAD GROUP <workload_group_name> 
   | COMPUTE GROUP <compute_group_name> 
   | STORAGE VAULT <storage_vault_name> 
   } 
FROM { <user_identity> | ROLE <role_name> }
```

**Revoke the specified role previously granted to a user**

```sql
REVOKE <role_list> FROM <user_identity> 
```

## Required Parameters

**1. `<privilege_list>`**

A comma-separated list of privileges to be revoked. Supported privileges include:

- NODE_PRIV: Cluster node operation permissions
- ADMIN_PRIV: Administrator privileges
- GRANT_PRIV: Authorization privileges
- SELECT_PRIV: Query privileges
- LOAD_PRIV: Data import privileges
- ALTER_PRIV: Modify privileges
- CREATE_PRIV: Create privileges
- DROP_PRIV: Delete privileges
- USAGE_PRIV: Usage privileges
- SHOW_VIEW_PRIV: View definition privileges

**2. `<priv_level>`**

Specifies the scope of the privileges. Supported formats include:

- *.*.*: All catalogs, databases, and tables
- catalog_name.*.*: Specifies all databases and tables in the specified catalog
- catalog_name.db.*: Specifies all tables in the specified database
- catalog_name.db.tbl: Specifies a specific table in the specified database

**3. `<resource_name>`**

Specifies the resource name. Supports `%` (matches any string) and `_` (matches any single character) wildcard characters.

**4. `<workload_group_name>`**

Specifies the workload group name. Supports `%` (matches any string) and `_` (matches any single character) wildcard characters.

**5. `<compute_group_name>`**

Specifies the compute group name. Supports `%` (matches any string) and `_` (matches any single character) wildcard characters.

**6. `<storage_vault_name>`**

Specifies the storage vault name. Supports `%` (matches any string) and `_` (matches any single character) wildcard characters.


**7. `<user_identity>`**

Specifies the user identity. The user must be a user created with the CREATE USER statement. The host part of the user identity can be a domain name, and the permission revocation time may have a delay of 1 minute for domain names.

**8. `<role_name>`**

Specifies the role name. The role must exist.

**9. `<role_list>`**

A comma-separated list of roles to be revoked. All specified roles must exist.

## Access Control Requirements

Users executing this SQL command must have at least the following privileges:

| Privilege | Object | Notes                |
| :---------------- | :------------- | :---------------------------- |
| GRANT_PRIV        | User or Role   | Only users or roles with the GRANT_PRIV privilege can perform the GRANT operation. |

## Examples

- Revoke the SELECT privilege on a specific database from a user:

   ```sql
   REVOKE SELECT_PRIV ON db1.* FROM 'jack'@'192.%';
   ```

- Revoke the usage privilege on a specific resource from a user:

   ```sql
   REVOKE USAGE_PRIV ON RESOURCE 'spark_resource' FROM 'jack'@'192.%';
   ```

- Revoke roles from a user:

   ```sql
   REVOKE 'role1','role2' FROM 'jack'@'192.%';
   ```

- Revoke the usage privilege on a specific workload group from a user:

   ```sql
   REVOKE USAGE_PRIV ON WORKLOAD GROUP 'g1' FROM 'jack'@'%';
   ```

- Revoke the usage privilege on all workload groups from a user:

   ```sql
   REVOKE USAGE_PRIV ON WORKLOAD GROUP '%' FROM 'jack'@'%';
   ```

- Revoke roles from a user:

   ```sql
   REVOKE 'role1','role2' FROM ROLE 'test_role';
   ```

- Revoke the usage privilege on all compute groups from a user:

   ```sql
   REVOKE USAGE_PRIV ON COMPUTE GROUP 'group1' FROM 'jack'@'%';
   ```

- Revoke the usage privilege on a compute group from a role:

   ```sql
   REVOKE USAGE_PRIV ON COMPUTE GROUP 'group1' FROM ROLE 'my_role';
   ```

- Revoke the usage privilege on all storage vaults from a user:

   ```sql
   REVOKE USAGE_PRIV ON STORAGE VAULT 'vault1' FROM 'jack'@'%';
   ```

- Revoke the usage privilege on a storage vault from a role:

   ```sql
   REVOKE USAGE_PRIV ON STORAGE VAULT 'vault1' FROM ROLE 'my_role';
   ```

- Revoke the usage privilege on all storage vaults from a role:

   ```sql
   REVOKE USAGE_PRIV ON STORAGE VAULT '%' FROM 'jack'@'%';
   ```
