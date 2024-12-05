---
{
    "title": "GRANT TO",
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


## Description

The GRANT command is used to:

1. Grant specified privileges to a user or role.
2. Grant specified roles to a user.

## Syntax

GRANT privilege_list ON priv_level TO user_identity [ROLE role_name]

GRANT privilege_list ON RESOURCE resource_name TO user_identity [ROLE role_name]

GRANT privilege_list ON WORKLOAD GROUP workload_group_name TO user_identity [ROLE role_name]

GRANT privilege_list ON COMPUTE GROUP compute_group_name TO user_identity [ROLE role_name]

GRANT privilege_list ON STORAGE VAULT storage_vault_name TO user_identity [ROLE role_name]

GRANT role_list TO user_identity

## Parameters

### privilege_list

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
- SHOW_VIEW_PRIV: Permission to view `view` creation statements.

Legacy privilege conversion:
- ALL and READ_WRITE will be converted to: SELECT_PRIV, LOAD_PRIV, ALTER_PRIV, CREATE_PRIV, DROP_PRIV.
- READ_ONLY is converted to SELECT_PRIV.

### priv_level

Supports the following four forms:

- *.*.*: Privileges can be applied to all catalogs and all databases and tables within them.
- catalog_name.*.*: Privileges can be applied to all databases and tables in the specified catalog.
- catalog_name.db.*: Privileges can be applied to all tables under the specified database.
- catalog_name.db.tbl: Privileges can be applied to the specified table under the specified database.

### resource_name

Specifies the resource name, supporting `%` and `*` to match all resources, but does not support wildcards, such as res*.

### workload_group_name

Specifies the workload group name, supporting `%` and `*` to match all workload groups, but does not support wildcards.

### compute_group_name

Specifies the compute group name, supporting `%` and `*` to match all compute groups, but does not support wildcards.

### storage_vault_name

Specifies the storage vault name, supporting `%` and `*` to match all storage vaults, but does not support wildcards.

### user_identity

Specifies the user to receive the privileges. Must be a user_identity created with CREATE USER. The host in user_identity can be a domain name. If it is a domain name, the effective time of the authority may be delayed by about 1 minute.

### role_name

Specifies the role to receive the privileges. If the specified role does not exist, it will be created automatically.

### role_list

A comma-separated list of roles to be assigned. The specified roles must exist.

## Examples

1. Grant permissions to all catalogs and databases and tables to the user:

   GRANT SELECT_PRIV ON *.*.* TO 'jack'@'%';

2. Grant permissions to the specified database table to the user:

   GRANT SELECT_PRIV,ALTER_PRIV,LOAD_PRIV ON ctl1.db1.tbl1 TO 'jack'@'192.8.%';

3. Grant permissions to the specified database table to the role:

   GRANT LOAD_PRIV ON ctl1.db1.* TO ROLE 'my_role';

4. Grant access to all resources to users:

   GRANT USAGE_PRIV ON RESOURCE * TO 'jack'@'%';

5. Grant the user permission to use the specified resource:

   GRANT USAGE_PRIV ON RESOURCE 'spark_resource' TO 'jack'@'%';

6. Grant access to specified resources to roles:

   GRANT USAGE_PRIV ON RESOURCE 'spark_resource' TO ROLE 'my_role';

7. Grant the specified role to a user:

   GRANT 'role1','role2' TO 'jack'@'%';

8. Grant the specified workload group 'g1' to user jack:

   GRANT USAGE_PRIV ON WORKLOAD GROUP 'g1' TO 'jack'@'%';

9. Match all workload groups granted to user jack:

   GRANT USAGE_PRIV ON WORKLOAD GROUP '%' TO 'jack'@'%';

10. Grant the workload group 'g1' to the role my_role:

    GRANT USAGE_PRIV ON WORKLOAD GROUP 'g1' TO ROLE 'my_role';

11. Allow jack to view the creation statement of view1 under db1:

    GRANT SHOW_VIEW_PRIV ON db1.view1 TO 'jack'@'%';

12. Grant user permission to use the specified compute group:

    GRANT USAGE_PRIV ON COMPUTE GROUP 'group1' TO 'jack'@'%';

13. Grant role permission to use the specified compute group:

    GRANT USAGE_PRIV ON COMPUTE GROUP 'group1' TO ROLE 'my_role';

14. Grant user permission to use all compute groups:

    GRANT USAGE_PRIV ON COMPUTE GROUP '*' TO 'jack'@'%';

15. Grant user permission to use the specified storage vault:

    GRANT USAGE_PRIV ON STORAGE VAULT 'vault1' TO 'jack'@'%';

16. Grant role permission to use the specified storage vault:

    GRANT USAGE_PRIV ON STORAGE VAULT 'vault1' TO ROLE 'my_role';

17. Grant user permission to use all storage vaults:

    GRANT USAGE_PRIV ON STORAGE VAULT '*' TO 'jack'@'%';

## Related Commands

- [REVOKE](./REVOKE.md)
- [SHOW GRANTS](../../../sql-manual/sql-statements/account-management/SHOW-GRANTS.md)
- [CREATE ROLE](./CREATE-ROLE.md)
- [CREATE WORKLOAD GROUP](../Administration-Statements/CREATE-WORKLOAD-GROUP.md)
- [CREATE RESOURCE](../Administration-Statements/CREATE-RESOURCE.md)
- [CREATE STORAGE VAULT](../Administration-Statements/CREATE-STORAGE-VAULT.md)

## Keywords

GRANT, WORKLOAD GROUP, COMPUTE GROUP, RESOURCE 
