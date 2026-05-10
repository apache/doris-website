---
{
    "title": "内置鉴权",
    "language": "zh-CN",
    "description": "鉴权是指根据用户身份限制其访问和操作 Doris 资源的机制。"
}
---

## 关键概念

鉴权是指根据用户身份限制其访问和操作 Doris 资源的机制。

Doris 基于 RBAC（Role-Based Access Control）的权限管理模型进行权限控制。

### 权限 

权限作用的对象是节点、数据目录、数据库或表。不同的权限代表不同的操作许可。

#### 所有权限

| 权限             | 对象类型 | 描述                                                                                                                                                                  |
|----------------| --------- |---------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| Admin_priv     | Global      | 超管权限。                                                                                                                                                               |
| Node_priv      | Global      | 节点变更权限。包括 FE、BE、BROKER 节点的添加、删除、下线等操作。                                                                                                                              |
| Grant_priv     | Global,Catalog,Db,Table，Resource,Workload Group | 权限变更权限。允许执行包括授权、撤权、添加/删除/变更 用户/角色 等操作。<br>给其他用户/角色授权时，2.1.2 版本之前，当前用户只需要相应层级的 Grant_priv 权限，2.1.2 版本之后当前用户也要有想要授权的资源的权限。<br>给其他用户分配角色时，要有 Global 级别的 Grant_priv 权限。 |
| Select_priv    | Global,Catalog,Db,Table，Column | 对数据目录、数据库、表、列的只读权限。                                                                                                                                                 |
| Load_priv      | Global,Catalog,Db,Table | 对数据目录、数据库、表的写权限。包括 Load、Insert、Delete 等。                                                                                                                            |
| Alter_priv     | Global,Catalog,Db,Table | 对数据目录、数据库、表的更改权限。包括重命名 库/表、添加/删除/变更 列、添加/删除 分区等操作。                                                                                                                  |
| Create_priv    | Global,Catalog,Db,Table | 创建数据目录、数据库、表、视图的权限。                                                                                                                                                 |
| Drop_priv      | Global,Catalog,Db,Table | 删除数据目录、数据库、表、视图的权限。                                                                                                                                                 |
| Usage_priv     | Resource,Workload Group | Resource 和 Workload Group 的使用权限。                                                                                                                                    |
| Show_view_priv | Global,Catalog,Db,Table | 执行 SHOW CREATE VIEW 的权限。                                                                                                                                            |

### 角色 

Doris 可以创建自定义命名的角色。角色可以被看做是一组权限的集合。新创建的用户可以被赋予某一角色，则自动被赋予该角色所拥有的权限。后续对角色的权限变更，也会体现在所有属于该角色的用户权限上。

#### 内置角色

内置角色是 Doris 默认创建的角色，并默认拥有一定的权限，包括 operator 和 admin。

- operator : 拥有 Admin_priv 和 Node_priv
- admin: 拥有 Admin_priv

### 用户

在 Doris 中，一个 user_identity 唯一标识一个用户。user_identity 由两部分组成，user_name 和 host，其中 username 为用户名。host 标识用户端连接所在的主机地址。

## 鉴权机制

Doris 权限设计基于 RBAC（Role-Based Access Control）的权限管理模型，用户和角色关联，角色和权限关联，用户通过角色间接和权限关联。

当角色被删除时，用户自动失去该角色的所有权限。

当用户和角色取消关联，用户自动失去角色的所有权限。

当角色的权限被增加或删除，用户的权限也会随之变更。

```
┌────────┐        ┌────────┐         ┌────────┐
│  user1 ├────┬───►  role1 ├────┬────►  priv1 │
└────────┘    │   └────────┘    │    └────────┘
              │                 │
              │                 │
              │   ┌────────┐    │
              │   │  role2 ├────┤
┌────────┐    │   └────────┘    │    ┌────────┐
│  user2 ├────┘                 │  ┌─►  priv2 │
└────────┘                      │  │ └────────┘
                  ┌────────┐    │  │
           ┌──────►  role3 ├────┘  │
           │      └────────┘       │
           │                       │
           │                       │
┌────────┐ │      ┌────────┐       │ ┌────────┐
│  userN ├─┴──────►  roleN ├───────┴─►  privN │
└────────┘        └────────┘         └────────┘
```

如上图所示：

user1 和 user2 都是通过 role1 拥有了 priv1 的权限。

userN 通过 role3 拥有了 priv1 的权限，通过 roleN 拥有了 priv2 和 privN 的权限，因此 userN 同时拥有 priv1，priv2 和 privN 的权限。


### 注意事项

- 为了方便用户操作，是可以直接给用户授权的，底层实现上，是为每个用户创建了一个专属于该用户的默认角色，当给用户授权时，实际上是在给该用户的默认角色授权。
- 默认角色不能被删除，不能被分配给其他人，删除用户时，默认角色也自动删除。

## 相关命令
- 授权/分配角色：[GRANT](../../../sql-manual/sql-statements/account-management/GRANT-TO)
- 撤权/撤销角色：[REVOKE](../../../sql-manual/sql-statements/account-management/REVOKE-FROM)
- 创建角色：[CREATE ROLE](../../../sql-manual/sql-statements/account-management/CREATE-ROLE)
- 删除角色：[DROP ROLE](../../../sql-manual/sql-statements/account-management/DROP-ROLE)
- 修改角色：[ALTER ROLE](../../../sql-manual/sql-statements/account-management/ALTER-ROLE)
- 查看当前用户权限和角色：[SHOW GRANTS](../../../sql-manual/sql-statements/account-management/SHOW-GRANTS)
- 查看所有用户权限和角色：[SHOW ALL GRANTS](../../../sql-manual/sql-statements/account-management/SHOW-GRANTS)
- 查看已创建的角色：[SHOW ROLES](../../../sql-manual/sql-statements/account-management/SHOW-ROLES)
- 查看支持的所有权限项：[SHOW PRIVILEGES](../../../sql-manual/sql-statements/account-management/SHOW-PRIVILEGES)

## 最佳实践

这里举例一些 Doris 权限系统的使用场景。

1. 场景一

   Doris 集群的使用者分为管理员（Admin）、开发工程师（RD）和用户（Client）。其中管理员拥有整个集群的所有权限，主要负责集群的搭建、节点管理等。开发工程师负责业务建模，包括建库建表、数据的导入和修改等。用户访问不同的数据库和表来获取数据。

   在这种场景下，可以为管理员赋予 ADMIN 权限或 GRANT 权限。对 RD 赋予对任意或指定数据库表的 CREATE、DROP、ALTER、LOAD、SELECT 权限。对 Client 赋予对任意或指定数据库表 SELECT 权限。同时，也可以通过创建不同的角色，来简化对多个用户的授权操作。

2. 场景二

   一个集群内有多个业务，每个业务可能使用一个或多个数据。每个业务需要管理自己的用户。在这种场景下。管理员用户可以为每个数据库创建一个拥有 DATABASE 层级 GRANT 权限的用户。该用户仅可以对用户进行指定的数据库的授权。

