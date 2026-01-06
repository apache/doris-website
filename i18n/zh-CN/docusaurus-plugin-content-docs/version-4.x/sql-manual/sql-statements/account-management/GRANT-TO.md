---
{
    "title": "GRANT TO",
    "language": "zh-CN",
    "description": "GRANT 命令用于："
}
---

## 描述

GRANT 命令用于：

1. 将指定的权限授予某用户或角色。
2. 将指定角色授予某用户。

**相关命令**

- [REVOKE FROM](./REVOKE-FROM.md)
- [SHOW GRANTS](../../../sql-manual/sql-statements/account-management/SHOW-GRANTS.md)
- [CREATE ROLE](./CREATE-ROLE.md)
- [CREATE WORKLOAD GROUP](../cluster-management/compute-management/CREATE-WORKLOAD-GROUP.md)
- [CREATE RESOURCE](../cluster-management/compute-management/CREATE-RESOURCE.md)
- [CREATE STORAGE VAULT](../cluster-management/storage-management/CREATE-STORAGE-VAULT.md)

## 语法

**将指定的权限授予某用户或角色**

```sql
GRANT <privilege_list> 
ON { <priv_level> 
    | RESOURCE <resource_name> 
    | WORKLOAD GROUP <workload_group_name> 
    | COMPUTE GROUP <compute_group_name> 
    | STORAGE VAULT <storage_vault_name>
   } 
TO { <user_identity> | ROLE <role_name> }
```

**将指定角色授予某用户**

```sql
GRANT <role_list> TO <user_identity> 
```

## 必选参数

**1. `<privilege_list>`**

需要赋予的权限列表，以逗号分隔。当前支持如下权限：

- NODE_PRIV：集群节点操作权限，包括节点上下线等操作。
- ADMIN_PRIV：除 NODE_PRIV 以外的所有权限。
- GRANT_PRIV：操作权限的权限，包括创建删除用户、角色，授权和撤权，设置密码等。
- SELECT_PRIV：对指定的库或表的读取权限。
- LOAD_PRIV：对指定的库或表的导入权限。
- ALTER_PRIV：对指定的库或表的 schema 变更权限。
- CREATE_PRIV：对指定的库或表的创建权限。
- DROP_PRIV：对指定的库或表的删除权限。
- USAGE_PRIV：对指定资源、Workload Group、Compute Group 的使用权限。
- SHOW_VIEW_PRIV：查看 view 创建语句的权限。

旧版权限转换：
- ALL 和 READ_WRITE 会被转换成：SELECT_PRIV, LOAD_PRIV, ALTER_PRIV, CREATE_PRIV, DROP_PRIV。
- READ_ONLY 会被转换为 SELECT_PRIV。

**2. `<priv_level>`**

支持以下四种形式：

- *.*.*：权限可以应用于所有 catalog 及其中的所有库表。
- catalog_name.*.*：权限可以应用于指定 catalog 中的所有库表。
- catalog_name.db.*：权限可以应用于指定库下的所有表。
- catalog_name.db.tbl：权限可以应用于指定库下的指定表。

**3. `<resource_name>`**

指定 resource 名，支持 % 和 * 匹配所有资源，不支持通配符，比如 res*。

**4. `<workload_group_name>`**

指定 workload group 名，支持 % 和 * 匹配所有 workload group，不支持通配符。

**5. `<compute_group_name>`**

指定 compute group 名称，支持 % 和 * 匹配所有 compute group，不支持通配符。

**6. `<storage_vault_name>`**

指定 storage vault 名称，支持 % 和 * 匹配所有 storage vault，不支持通配符。

**7. `<user_identity>`**

指定接收权限的用户。必须为使用 CREATE USER 创建过的 user_identity。user_identity 中的 host 可以是域名，如果是域名的话，权限的生效时间可能会有 1 分钟左右的延迟。

**8. `<role_name>`**

指定接收权限的角色。如果指定的角色不存在，则会自动创建。

**9. `<role_list>`**

需要赋予的角色列表，以逗号分隔，指定的角色必须存在。

## 权限控制

执行此 SQL 命令的用户必须至少具有以下权限：

| 权限（Privilege） | 对象（Object） | 说明（Notes）                 |
| :---------------- | :------------- | :---------------------------- |
| GRANT_PRIV        | 用户（User）或 角色（Role）    | 用户或者角色拥有 GRANT_PRIV 权限才能进行 GRANT 操作 |

## 示例

- 授予所有 catalog 和库表的权限给用户：

    ```sql
    GRANT SELECT_PRIV ON *.*.* TO 'jack'@'%';
    ```

- 授予指定库表的权限给用户：

    ```sql
    GRANT SELECT_PRIV,ALTER_PRIV,LOAD_PRIV ON ctl1.db1.tbl1  TO 'jack'@'192.8.%';
    ```

- 授予指定库表的权限给角色：

    ```sql
    GRANT LOAD_PRIV ON ctl1.db1.* TO ROLE 'my_role';
    ```

- 授予所有 resource 的使用权限给用户：

    ```sql
    GRANT USAGE_PRIV ON RESOURCE * TO 'jack'@'%';
    ```

- 授予指定 resource 的使用权限给用户：

    ```sql
    GRANT USAGE_PRIV ON RESOURCE 'spark_resource' TO 'jack'@'%';
    ```

- 授予指定 resource 的使用权限给角色：

    ```sql
    GRANT USAGE_PRIV ON RESOURCE 'spark_resource' TO ROLE 'my_role';
    ```

- 将指定 role 授予某用户：

    ```sql
    GRANT 'role1','role2' TO 'jack'@'%';
    ```

- 将指定 workload group 授予用户：

    ```sql
    GRANT USAGE_PRIV ON WORKLOAD GROUP 'g1' TO 'jack'@'%';
    ```

- 匹配所有 workload group 授予用户：

    ```sql
    GRANT USAGE_PRIV ON WORKLOAD GROUP '%' TO 'jack'@'%';
    ```

- 将指定 workload group 授予角色：

    ```sql
    GRANT USAGE_PRIV ON WORKLOAD GROUP 'g1' TO ROLE 'my_role';
    ```

- 允许用户查看指定 view 的创建语句：

    ```sql
    GRANT SHOW_VIEW_PRIV ON db1.view1 TO 'jack'@'%';
    ```

- 授予用户对指定 compute group 的使用权限：

    ```sql
    GRANT USAGE_PRIV ON COMPUTE GROUP 'group1' TO 'jack'@'%';
    ```

- 授予角色对指定 compute group 的使用权限：

    ```sql
    GRANT USAGE_PRIV ON COMPUTE GROUP 'group1' TO ROLE 'my_role';
    ```

- 授予用户对所有 compute group 的使用权限：

    ```sql
    GRANT USAGE_PRIV ON COMPUTE GROUP '*' TO 'jack'@'%';
    ```

- 授予用户对指定 storage vault 的使用权限：

    ```sql
    GRANT USAGE_PRIV ON STORAGE VAULT 'vault1' TO 'jack'@'%';
    ```

- 授予角色对指定 storage vault 的使用权限：

    ```sql
    GRANT USAGE_PRIV ON STORAGE VAULT 'vault1' TO ROLE 'my_role';
    ```

- 授予用户对所有 storage vault 的使用权限：

    ```sql
    GRANT USAGE_PRIV ON STORAGE VAULT '*' TO 'jack'@'%';
    ```