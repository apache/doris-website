---
{
    "title": "REVOKE",
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

The REVOKE command is used to:

1. Revoke specified privileges from a user or role.
2. Revoke specified roles previously granted to a user.

## Syntax

REVOKE privilege_list ON priv_level FROM user_identity [ROLE role_name]

REVOKE privilege_list ON RESOURCE resource_name FROM user_identity [ROLE role_name]

REVOKE privilege_list ON WORKLOAD GROUP workload_group_name FROM user_identity [ROLE role_name]

REVOKE privilege_list ON COMPUTE GROUP compute_group_name FROM user_identity [ROLE role_name]

REVOKE privilege_list ON STORAGE VAULT storage_vault_name FROM user_identity [ROLE role_name]

REVOKE role_list FROM user_identity

## Parameters

### privilege_list

A comma-separated list of privileges to be revoked. Supported privileges include:

- NODE_PRIV: Cluster node operation permissions
- ADMIN_PRIV: Administrator privileges
- GRANT_PRIV: Authorization privileges
- SELECT_PRIV: Query privileges
- LOAD_PRIV: Data import privileges
- ALTER_PRIV: Modification privileges
- CREATE_PRIV: Creation privileges
- DROP_PRIV: Deletion privileges
- USAGE_PRIV: Usage privileges
- SHOW_VIEW_PRIV: Privileges to view view definitions

### priv_level

Specifies the scope of the privileges. Supported formats:

- *.*.*: All catalogs, databases, and tables
- catalog_name.*.*: All databases and tables in the specified catalog
- catalog_name.db.*: All tables in the specified database
- catalog_name.db.tbl: Specific table in the specified database

### resource_name

Specifies the resource scope. Supports % (matches any string) and _ (matches any single character) wildcards.

### workload_group_name

Specifies the workload group name. Supports % (matches any string) and _ (matches any single character) wildcards.

### compute_group_name

Specifies the compute group name. Supports % (matches any string) and _ (matches any single character) wildcards.

### storage_vault_name

Specifies the storage vault name. Supports % (matches any string) and _ (matches any single character) wildcards.

### user_identity

Specifies the user from whom privileges are being revoked. Must be a user created with CREATE USER. The host in user_identity can be a domain name. If it's a domain name, the revocation of privileges may be delayed by about 1 minute.

### role_name

Specifies the role from which privileges are being revoked. The role must exist.

### role_list

A comma-separated list of roles to be revoked. All specified roles must exist.

## Examples

1. Revoke SELECT privilege on a specific database from a user:

   REVOKE SELECT_PRIV ON db1.* FROM 'jack'@'192.%';

2. Revoke usage privilege on a resource from a user:

   REVOKE USAGE_PRIV ON RESOURCE 'spark_resource' FROM 'jack'@'192.%';

3. Revoke roles from a user:

   REVOKE 'role1','role2' FROM 'jack'@'192.%';

4. Revoke usage privilege on a workload group from a user:

   REVOKE USAGE_PRIV ON WORKLOAD GROUP 'g1' FROM 'jack'@'%';

5. Revoke usage privilege on all workload groups from a user:

   REVOKE USAGE_PRIV ON WORKLOAD GROUP '%' FROM 'jack'@'%';

6. Revoke usage privilege on a workload group from a role:

   REVOKE USAGE_PRIV ON WORKLOAD GROUP 'g1' FROM ROLE 'test_role';

7. Revoke usage privilege on a compute group from a user:

   REVOKE USAGE_PRIV ON COMPUTE GROUP 'group1' FROM 'jack'@'%';

8. Revoke usage privilege on a compute group from a role:

   REVOKE USAGE_PRIV ON COMPUTE GROUP 'group1' FROM ROLE 'my_role';

9. Revoke usage privilege on a storage vault from a user:

   REVOKE USAGE_PRIV ON STORAGE VAULT 'vault1' FROM 'jack'@'%';

10. Revoke usage privilege on a storage vault from a role:

   REVOKE USAGE_PRIV ON STORAGE VAULT 'vault1' FROM ROLE 'my_role';


## Related Commands

- [GRANT](./GRANT.md)
- [SHOW GRANTS](../Show-Statements/SHOW-GRANTS.md)
- [CREATE ROLE](./CREATE-ROLE.md)
- [CREATE WORKLOAD GROUP](../Administration-Statements/CREATE-WORKLOAD-GROUP.md)
- [CREATE COMPUTE GROUP](../Administration-Statements/CREATE-COMPUTE-GROUP.md)
- [CREATE RESOURCE](../Administration-Statements/CREATE-RESOURCE.md)
- [CREATE STORAGE VAULT](../Administration-Statements/CREATE-STORAGE-VAULT.md)

## Keywords

    REVOKE, WORKLOAD GROUP, COMPUTE GROUP, RESOURCE, STORAGE VAULT

