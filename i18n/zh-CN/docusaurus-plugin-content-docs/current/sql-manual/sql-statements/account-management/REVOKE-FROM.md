---
{
    "title": "REVOKE FROM",
    "language": "zh-CN"
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

## 描述

REVOKE 命令用于：

1. 撤销某用户或某角色的指定权限。
2. 撤销先前授予某用户的指定角色。

## 语法

REVOKE privilege_list ON priv_level FROM user_identity [ROLE role_name]

REVOKE privilege_list ON RESOURCE resource_name FROM user_identity [ROLE role_name]

REVOKE privilege_list ON WORKLOAD GROUP workload_group_name FROM user_identity [ROLE role_name]

REVOKE privilege_list ON COMPUTE GROUP compute_group_name FROM user_identity [ROLE role_name]

REVOKE privilege_list ON STORAGE VAULT storage_vault_name FROM user_identity [ROLE role_name]

REVOKE role_list FROM user_identity

## 参数

### privilege_list

需要撤销的权限列表，以逗号分隔。支持的权限包括：

- NODE_PRIV：集群节点操作权限
- ADMIN_PRIV：管理员权限
- GRANT_PRIV：授权权限
- SELECT_PRIV：查询权限
- LOAD_PRIV：数据导入权限
- ALTER_PRIV：修改权限
- CREATE_PRIV：创建权限
- DROP_PRIV：删除权限
- USAGE_PRIV：使用权限
- SHOW_VIEW_PRIV：查看视图定义权限

### priv_level

指定权限的作用范围。支持以下格式：

- *.*.*：所有 catalog、数据库和表
- catalog_name.*.*：指定 catalog 中的所有数据库和表
- catalog_name.db.*：指定数据库中的所有表
- catalog_name.db.tbl：指定数据库中的特定表

### resource_name

指定 resource 名称。支持 % （匹配任意字符串）和 _（匹配任意单个字符）通配符。

### workload_group_name

指定 workload group 名称。支持 % （匹配任意字符串）和 _（匹配任意单个字符）通配符。

### compute_group_name

指定 compute group 名称。支持 % （匹配任意字符串）和 _（匹配任意单个字符）通配符。

### storage_vault_name

指定 storage vault 名称。支持 % （匹配任意字符串）和 _（匹配任意单个字符）通配符。


### user_identity

指定要撤销权限的用户。必须是使用 CREATE USER 创建的用户。user_identity 中的 host 可以是域名，如果是域名，权限的撤销时间可能会有 1 分钟左右的延迟。

### role_name

指定要撤销权限的角色。该角色必须存在。

### role_list

需要撤销的角色列表，以逗号分隔。指定的所有角色必须存在。

## 示例

1. 撤销用户在特定数据库上的 SELECT 权限：

   REVOKE SELECT_PRIV ON db1.* FROM 'jack'@'192.%';

2. 撤销用户对资源的使用权限：

   REVOKE USAGE_PRIV ON RESOURCE 'spark_resource' FROM 'jack'@'192.%';

3. 撤销用户的角色：

   REVOKE 'role1','role2' FROM 'jack'@'192.%';

4. 撤销用户对 workload group  的使用权限：

   REVOKE USAGE_PRIV ON WORKLOAD GROUP 'g1' FROM 'jack'@'%';

5. 撤销用户对所有 workload group  的使用权限：

   REVOKE USAGE_PRIV ON WORKLOAD GROUP '%' FROM 'jack'@'%';

6. 撤销角色对 workload group  的使用权限：

   REVOKE USAGE_PRIV ON WORKLOAD GROUP 'g1' FROM ROLE 'test_role';

7. 撤销用户对 compute group  的使用权限：

   REVOKE USAGE_PRIV ON COMPUTE GROUP 'group1' FROM 'jack'@'%';

8. 撤销角色对 compute group  的使用权限：

   REVOKE USAGE_PRIV ON COMPUTE GROUP 'group1' FROM ROLE 'my_role';

9. 撤销用户对 storage vault 的使用权限：

   REVOKE USAGE_PRIV ON STORAGE VAULT 'vault1' FROM 'jack'@'%';

10. 撤销角色对 storage vault 的使用权限：

   REVOKE USAGE_PRIV ON STORAGE VAULT 'vault1' FROM ROLE 'my_role';

11. 撤销用户对所有 storage vault 的使用权限：

   REVOKE USAGE_PRIV ON STORAGE VAULT '%' FROM 'jack'@'%';

## 相关命令

- [GRANT](./GRANT.md)
- [SHOW GRANTS](../../../sql-manual/sql-statements/account-management/SHOW-GRANTS)
- [CREATE ROLE](./CREATE-ROLE.md)
- [CREATE WORKLOAD GROUP](../Administration-Statements/CREATE-WORKLOAD-GROUP.md)
- [CREATE COMPUTE GROUP](../Administration-Statements/CREATE-COMPUTE-GROUP.md)
- [CREATE RESOURCE](../Administration-Statements/CREATE-RESOURCE.md)
- [CREATE STORAGE VAULT](../Administration-Statements/CREATE-STORAGE-VAULT.md)

## 关键词

    REVOKE, WORKLOAD GROUP, COMPUTE GROUP, RESOURCE 