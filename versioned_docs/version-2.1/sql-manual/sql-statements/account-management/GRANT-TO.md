---
{
    "title": "GRANT TO",
    "language": "en",
    "description": "The GRANT command is used to:"
}
---

## Description

The GRANT command is used to:

1. Grant specified privileges to a user or role.
2. Grant specified roles to a user.

**Related Commands**

- [REVOKE FROM](./REVOKE-FROM.md)
- [SHOW GRANTS](../../../sql-manual/sql-statements/account-management/SHOW-GRANTS.md)
- [CREATE ROLE](./CREATE-ROLE.md)
- [CREATE WORKLOAD GROUP](../cluster-management/compute-management/CREATE-WORKLOAD-GROUP.md)
- [CREATE RESOURCE](../cluster-management/compute-management/CREATE-RESOURCE.md)

## Syntax

**Grant specified privileges to a user or role**

```sql
GRANT <privilege_list> 
ON { <priv_level> 
    | RESOURCE <resource_name> 
    | WORKLOAD GROUP <workload_group_name>
   } 
TO { <user_identity> | ROLE <role_name> }
```

**Grant specified roles to a user**

```sql
GRANT <role_list> TO <user_identity> 
```

## Required Parameters

**1. `<privilege_list>`**

A comma-separated list of privileges to be granted. Currently supported privileges include:

- NODE_PRIV: Cluster node operation permissions, including node online and offline operations.
- ADMIN_PRIV: All privileges except NODE_PRIV.
- GRANT_PRIV: Privilege for operation privileges, including creating and deleting users, roles, authorization and revocation, setting passwords, etc.
- SELECT_PRIV: Read permission on the specified database or table.
- LOAD_PRIV: Import privileges on the specified database or table.
- ALTER_PRIV: Schema change permission for the specified database or table.
- CREATE_PRIV: Create permission on the specified database or table.
- DROP_PRIV: Drop privilege on the specified database or table.
- USAGE_PRIV: Access to the specified resource and Workload Group permissions.
- SHOW_VIEW_PRIV: Permission to view view creation statements.

Legacy privilege conversion:

- ALL and READ_WRITE will be converted to: SELECT_PRIV, LOAD_PRIV, ALTER_PRIV, CREATE_PRIV, DROP_PRIV.
- READ_ONLY is converted to SELECT_PRIV.

**2. `<priv_level>`**

Supports the following four forms:

- ..*: Privileges can be applied to all catalogs and all databases and tables within them.
- catalog_name..: Privileges can be applied to all databases and tables in the specified catalog.
- catalog_name.db.*: Privileges can be applied to all tables under the specified database.
- catalog_name.db.tbl: Privileges can be applied to the specified table under the specified database.

**3. `<resource_name>`**

Specifies the resource name, supporting `%` and `*` to match all resources, but does not support wildcards, such as res*.

**4. `<workload_group_name>`**

Specifies the workload group name, supporting `%` and `*` to match all workload groups, but does not support wildcards.

**5. `<user_identity>`**

Specifies the user to receive the privileges. Must be a user_identity created with CREATE USER. The host in user_identity can be a domain name. If it is a domain name, the effective time of the authority may be delayed by about 1 minute.

**6. `<role_name>`**

Specifies the role to receive the privileges. If the specified role does not exist, it will be created automatically.

**7. `<role_list>`**

A comma-separated list of roles to be assigned. The specified roles must exist.

## Access Control Requirements

Users executing this SQL command must have at least the following privileges:

| Privilege | Object | Notes                |
| :---------------- | :------------- | :---------------------------- |
| GRANT_PRIV        | User or Role   | Only users or roles with the GRANT_PRIV privilege can perform the GRANT operation. |

## Examples

- Grant permissions to all catalogs and databases and tables to the user:

    ```sql
    GRANT SELECT_PRIV ON *.*.* TO 'jack'@'%';
    ```

- Grant permissions to the specified database table to the user:

    ```sql
    GRANT SELECT_PRIV,ALTER_PRIV,LOAD_PRIV ON ctl1.db1.tbl1  TO 'jack'@'192.8.%';
    ```

- Grant permissions to the specified database table to the role:

    ```sql
    GRANT LOAD_PRIV ON ctl1.db1.* TO ROLE 'my_role';
    ```

- Grant access to all resources to users:

    ```sql
    GRANT USAGE_PRIV ON RESOURCE * TO 'jack'@'%';
    ```

- Grant the user permission to use the specified resource:

    ```sql
    GRANT USAGE_PRIV ON RESOURCE 'spark_resource' TO 'jack'@'%';
    ```

- Grant access to specified resources to roles:

    ```sql
    GRANT USAGE_PRIV ON RESOURCE 'spark_resource' TO ROLE 'my_role';
    ```

- Grant the specified role to a user:

    ```sql
    GRANT 'role1','role2' TO 'jack'@'%';
    ```

- Grant the specified workload group 'g1' to user jack:

    ```sql
    GRANT USAGE_PRIV ON WORKLOAD GROUP 'g1' TO 'jack'@'%';
    ```

- Match all workload groups granted to user jack:

    ```sql
    GRANT USAGE_PRIV ON WORKLOAD GROUP '%' TO 'jack'@'%';
    ```

- Grant the workload group 'g1' to the role my_role:

    ```sql
    GRANT USAGE_PRIV ON WORKLOAD GROUP 'g1' TO ROLE 'my_role';
    ```

- Allow jack to view the creation statement of view1 under db1:

    ```sql
    GRANT SHOW_VIEW_PRIV ON db1.view1 TO 'jack'@'%';
    ```
