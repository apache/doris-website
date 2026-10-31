---
{
    "title": "SHOW GRANTS",
    "language": "zh-CN",
    "description": "该语句用于查看用户权限。"
}
---

## 描述

 该语句用于查看用户权限。

## 语法

```sql
SHOW [ALL] GRANTS [FOR <user_identity>];
```

## 可选参数

**1. `[ALL]`**

是否查看所有用户的权限。

**2. `<user_identity>`**

指定要查看权限的用户。必须为通过 `CREATE USER` 命令创建的 `user_identity`。

## 返回值

  | 列名 | 说明 |
  | -- | -- |
  | UserIdentity | 用户标识 |
  | Comment | 注释 |
  | Password | 是否设置密码 |
  | Roles | 拥有的角色 |
  | GlobalPrivs | 拥有的全局权限 |
  | CatalogPrivs | 拥有的 catalog 权限 |
  | DatabasePrivs | 拥有的数据库权限 |
  | TablePrivs | 拥有的表权限 |
  | ColPrivs | 拥有的列权限 |
  | ResourcePrivs | 拥有的资源权限 |
  | WorkloadGroupPrivs | 拥有的 WorkloadGroup 权限 |

## 权限控制

执行此 SQL 命令的用户必须至少具有以下权限：

| 权限（Privilege） | 对象（Object） | 说明（Notes）                 |
| :---------------- | :------------- | :---------------------------- |
| GRANT_PRIV        | 用户（User）或 角色（Role）    | 用户或者角色拥有 GRANT_PRIV 权限才能查看所有用户权限操作，否则只能查看当前用户的权限 |

## 注意事项
  - `SHOW ALL GRANTS` 可以查看所有用户的权限，但需要有 `GRANT_PRIV` 权限。
  - 如果指定 `user_identity`，则查看该指定用户的权限。且该 `user_identity` 必须为通过 `CREATE USER` 命令创建的。
  - 如果不指定 `user_identity`，则查看当前用户的权限。
  - Doris 基于 RBAC（Role-Based Access Control）的权限管理模型进行权限控制，因此这里展示出来的权限其实是用户所有角色的权限合集，如果想查看具体权限来源于哪个角色， 可以通过[SHOW ROLES](./SHOW-ROLES.md)查看

## 示例

1. 查看所有用户权限信息

   ```sql
   SHOW ALL GRANTS;
   ```

   ```text
   +--------------+---------+----------+----------+----------------------+--------------+-----------------------------------------------------------------------+------------+----------+---------------+--------------------+
   | UserIdentity | Comment | Password | Roles    | GlobalPrivs          | CatalogPrivs | DatabasePrivs                                                         | TablePrivs | ColPrivs | ResourcePrivs | WorkloadGroupPrivs |
   +--------------+---------+----------+----------+----------------------+--------------+-----------------------------------------------------------------------+------------+----------+---------------+--------------------+
   | 'root'@'%'   | ROOT    | No       | operator | Node_priv,Admin_priv | NULL         | internal.information_schema: Select_priv; internal.mysql: Select_priv | NULL       | NULL     | NULL          | normal: Usage_priv |
   | 'admin'@'%'  | ADMIN   | No       | admin    | Admin_priv           | NULL         | internal.information_schema: Select_priv; internal.mysql: Select_priv | NULL       | NULL     | NULL          | normal: Usage_priv |
   | 'jack'@'%'   |         | No       |          | NULL                 | NULL         | internal.information_schema: Select_priv; internal.mysql: Select_priv | NULL       | NULL     | NULL          | normal: Usage_priv |
   +--------------+---------+----------+----------+----------------------+--------------+-----------------------------------------------------------------------+------------+----------+---------------+--------------------+
   ```

2. 查看指定 user 的权限

    ```sql
    SHOW GRANTS FOR jack@'%';
    ```

    ```text
    +--------------+---------+----------+-------+-------------+--------------+-----------------------------------------------------------------------+------------+----------+---------------+--------------------+
    | UserIdentity | Comment | Password | Roles | GlobalPrivs | CatalogPrivs | DatabasePrivs                                                         | TablePrivs | ColPrivs | ResourcePrivs | WorkloadGroupPrivs |
    +--------------+---------+----------+-------+-------------+--------------+-----------------------------------------------------------------------+------------+----------+---------------+--------------------+
    | 'jack'@'%'   |         | No       |       | NULL        | NULL         | internal.information_schema: Select_priv; internal.mysql: Select_priv | NULL       | NULL     | NULL          | normal: Usage_priv |
    +--------------+---------+----------+-------+-------------+--------------+-----------------------------------------------------------------------+------------+----------+---------------+--------------------+
    ```

3. 查看当前用户的权限

   ```sql
   SHOW GRANTS;
   ```

   ```text
   +--------------+---------+----------+----------+----------------------+--------------+-----------------------------------------------------------------------+------------+----------+---------------+--------------------+
   | UserIdentity | Comment | Password | Roles    | GlobalPrivs          | CatalogPrivs | DatabasePrivs                                                         | TablePrivs | ColPrivs | ResourcePrivs | WorkloadGroupPrivs |
   +--------------+---------+----------+----------+----------------------+--------------+-----------------------------------------------------------------------+------------+----------+---------------+--------------------+
   | 'root'@'%'   | ROOT    | No       | operator | Node_priv,Admin_priv | NULL         | internal.information_schema: Select_priv; internal.mysql: Select_priv | NULL       | NULL     | NULL          | normal: Usage_priv |
   +--------------+---------+----------+----------+----------------------+--------------+-----------------------------------------------------------------------+------------+----------+---------------+--------------------+
   ```

