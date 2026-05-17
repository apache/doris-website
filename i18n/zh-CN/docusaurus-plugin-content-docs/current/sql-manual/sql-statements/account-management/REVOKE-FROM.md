---
{
    "title": "REVOKE FROM",
    "language": "zh-CN",
    "description": "REVOKE 命令用于："
}
---

## 描述

REVOKE 命令用于：

1. 撤销某用户或某角色的指定权限。
2. 撤销先前授予某用户的指定角色。

**相关命令**

- [GRANT TO](./GRANT-TO.md)
- [SHOW GRANTS](../../../sql-manual/sql-statements/account-management/SHOW-GRANTS.md)
- [CREATE ROLE](./CREATE-ROLE.md)
- [CREATE WORKLOAD GROUP](../cluster-management/compute-management/CREATE-WORKLOAD-GROUP.md)
- [CREATE RESOURCE](../cluster-management/compute-management/CREATE-RESOURCE.md)
- [CREATE STORAGE VAULT](../cluster-management/storage-management/CREATE-STORAGE-VAULT.md)

## 语法

**撤销某用户或某角色的指定权限**

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

**撤销先前授予某用户的指定角色**

```sql
REVOKE <role_list> FROM <user_identity> 
```

## 必选参数

**1. `<privilege_list>`**

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

**2. `<priv_level>`**

指定权限的作用范围。支持以下格式：

- *.*.*：所有 catalog、数据库和表
- catalog_name.*.*：指定 catalog 中的所有数据库和表
- catalog_name.db.*：指定数据库中的所有表
- catalog_name.db.tbl：指定数据库中的特定表

**3. `<resource_name>`**

指定 resource 名称。支持 % （匹配任意字符串）和 _（匹配任意单个字符）通配符。

**4. `<workload_group_name>`**

指定 workload group 名称。支持 % （匹配任意字符串）和 _（匹配任意单个字符）通配符。

**5. `<compute_group_name>`**

指定 compute group 名称。支持 % （匹配任意字符串）和 _（匹配任意单个字符）通配符。

**6. `<storage_vault_name>`**

指定 storage vault 名称。支持 % （匹配任意字符串）和 _（匹配任意单个字符）通配符。


**7. `<user_identity>`**

指定要撤销权限的用户。必须是使用 CREATE USER 创建的用户。user_identity 中的 host 可以是域名，如果是域名，权限的撤销时间可能会有 1 分钟左右的延迟。

**8. `<role_name>`**

指定要撤销权限的角色。该角色必须存在。

**9. `<role_list>`**

需要撤销的角色列表，以逗号分隔。指定的所有角色必须存在。

## 权限控制

执行此 SQL 命令的用户必须至少具有以下权限：

| 权限（Privilege） | 对象（Object） | 说明（Notes）                 |
| :---------------- | :------------- | :---------------------------- |
| GRANT_PRIV        | 用户（User）或 角色（Role）    | 用户或者角色拥有 GRANT_PRIV 权限才能进行 GRANT 操作 |

## 示例

- 撤销用户在特定数据库上的 SELECT 权限：

   ```sql
   REVOKE SELECT_PRIV ON db1.* FROM 'jack'@'192.%';
   ```

- 撤销用户对资源的使用权限：

   ```sql
   REVOKE USAGE_PRIV ON RESOURCE 'spark_resource' FROM 'jack'@'192.%';
   ```

- 撤销用户的角色：

   ```sql
   REVOKE 'role1','role2' FROM 'jack'@'192.%';
   ```

- 撤销用户对 workload group  的使用权限：

   ```sql
   REVOKE USAGE_PRIV ON WORKLOAD GROUP 'g1' FROM 'jack'@'%';
   ```

- 撤销用户对所有 workload group  的使用权限：

   ```sql
   REVOKE USAGE_PRIV ON WORKLOAD GROUP '%' FROM 'jack'@'%';
   ```

- 撤销角色对 workload group  的使用权限：

   ```sql
   REVOKE USAGE_PRIV ON WORKLOAD GROUP 'g1' FROM ROLE 'test_role';
   ```

- 撤销用户对 compute group  的使用权限：

   ```sql
   REVOKE USAGE_PRIV ON COMPUTE GROUP 'group1' FROM 'jack'@'%';
   ```

- 撤销角色对 compute group  的使用权限：

   ```sql
   REVOKE USAGE_PRIV ON COMPUTE GROUP 'group1' FROM ROLE 'my_role';
   ```

- 撤销用户对 storage vault 的使用权限：

   ```sql
   REVOKE USAGE_PRIV ON STORAGE VAULT 'vault1' FROM 'jack'@'%';
   ```

- 撤销角色对 storage vault 的使用权限：

   ```sql
   REVOKE USAGE_PRIV ON STORAGE VAULT 'vault1' FROM ROLE 'my_role';
   ```

- 撤销用户对所有 storage vault 的使用权限：

   ```sql
   REVOKE USAGE_PRIV ON STORAGE VAULT '%' FROM 'jack'@'%';
   ```
