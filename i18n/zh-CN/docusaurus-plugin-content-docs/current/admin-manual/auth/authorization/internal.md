---
{
    "title": "内置鉴权",
    "language": "zh-CN",
    "description": "基于 RBAC 模型，通过权限、角色、用户三层结构实现 Doris 资源的细粒度访问控制。"
}
---

<!-- 知识类型: 概念说明 + 架构选型决策 -->
<!-- 适用场景: 权限规划 / 访问控制设计 / 多业务隔离 -->

Doris 内置鉴权基于 **RBAC（Role-Based Access Control，基于角色的访问控制）** 模型，通过「权限 → 角色 → 用户」的三层结构，按用户身份限制其对节点、Catalog、库、表、列、Resource、Workload Group 等资源的访问与操作。

本文介绍 Doris 内置鉴权的核心概念、运行机制、相关 SQL 命令以及典型权限规划场景。

## 适用场景

| 场景                                | 推荐做法                                                                                       |
|-----------------------------------|--------------------------------------------------------------------------------------------|
| 集群运维（管理员）                         | 授予 `Admin_priv` 或 `Node_priv`，使用内置 `operator` / `admin` 角色                                  |
| 数据开发（建库建表、导入）                     | 授予指定库/表的 `CREATE`、`DROP`、`ALTER`、`LOAD`、`SELECT` 权限                                         |
| 数据查询（只读访问）                        | 授予指定库/表/列的 `Select_priv`                                                                   |
| 多业务多租户共享集群                        | 为每个业务库创建拥有库级 `Grant_priv` 的「业务管理员」用户，由其自行管理本业务用户                                          |
| 资源/工作负载隔离                         | 通过 `Usage_priv` 控制 Resource、Workload Group 的使用                                              |
| 敏感字段（如手机号、身份证）保护                  | 使用列级 `Select_priv`；或结合[数据访问控制](../authorization/data)配置行级策略                                 |

## 核心概念

Doris 鉴权由以下三个核心实体构成：

- **权限（Privilege）**：作用在具体资源对象上的操作许可（如读、写、变更）。
- **角色（Role）**：一组权限的集合，可被赋予用户。
- **用户（User）**：操作的发起方，由 `user_name` 和 `host` 唯一标识。

### 权限

权限作用的对象包括节点、Catalog、库、表、列、Resource、Workload Group。不同权限代表不同的操作许可。

#### 所有权限项

<!-- 知识类型: 配置参数 -->

| 权限             | 对象类型                                              | 描述                                                                                                                                                                                            |
|----------------|---------------------------------------------------|---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| Admin_priv     | Global                                            | 超管权限。                                                                                                                                                                                         |
| Node_priv      | Global                                            | 节点变更权限。包括 FE、BE、BROKER 节点的添加、删除、下线等操作。                                                                                                                                                        |
| Grant_priv     | Global、Catalog、Db、Table、Resource、Workload Group   | 权限变更权限。允许执行包括授权、撤权、添加/删除/变更用户、角色等操作。<br />给其他用户/角色授权时：2.1.2 版本之前，当前用户只需要相应层级的 `Grant_priv` 权限；2.1.2 版本之后，当前用户还必须拥有所授权资源对应的权限。<br />给其他用户分配角色时，当前用户必须拥有 Global 级别的 `Grant_priv` 权限。 |
| Select_priv    | Global、Catalog、Db、Table、Column                    | 对 Catalog、库、表、列的只读权限。                                                                                                                                                                          |
| Load_priv      | Global、Catalog、Db、Table                           | 对 Catalog、库、表的写权限。包括 Load、Insert、Delete 等。                                                                                                                                                      |
| Alter_priv     | Global、Catalog、Db、Table                           | 对 Catalog、库、表的更改权限。包括重命名库/表、添加/删除/变更列、添加/删除分区等操作。                                                                                                                                              |
| Create_priv    | Global、Catalog、Db、Table                           | 创建 Catalog、库、表、视图的权限。                                                                                                                                                                          |
| Drop_priv      | Global、Catalog、Db、Table                           | 删除 Catalog、库、表、视图的权限。                                                                                                                                                                          |
| Usage_priv     | Resource、Workload Group                           | Resource 和 Workload Group 的使用权限。                                                                                                                                                              |
| Show_view_priv | Global、Catalog、Db、Table                           | 执行 `SHOW CREATE VIEW` 的权限。                                                                                                                                                                    |

#### 权限层级

同一权限可授予到不同层级。通过 `GRANT` 语句指定的资源路径，决定了权限的作用范围。

| 层级         | 授权路径示例                                                        | 作用范围                                              |
|------------|---------------------------------------------------------------|---------------------------------------------------|
| 全局         | `GRANT ... ON *.*.* TO user1`                                 | 任意 Catalog 中的任意库表                                 |
| Catalog 级  | `GRANT ... ON ctl.*.* TO user1`                               | 指定 Catalog 中的任意库表                                 |
| 库级         | `GRANT ... ON ctl.db.* TO user1`                              | 指定库中的任意表                                          |
| 表级         | `GRANT ... ON ctl.db.tbl TO user1`                            | 指定表的任意列                                           |
| 列级         | `GRANT Select_priv(col1,col2) ON ctl.db.tbl TO user1`         | 指定表的部分列；目前列权限仅支持 `Select_priv`                    |
| 行级         | 基于策略定义，详见[数据访问控制](../authorization/data)                       | 控制用户可访问的数据行                                       |
| Resource   | `GRANT USAGE_PRIV ON RESOURCE '%' TO user1`                   | Resource 的使用；仅支持 `Usage_priv` 和 `Grant_priv`      |
| Workload Group | `GRANT USAGE_PRIV ON WORKLOAD GROUP '%' TO user1`          | Workload Group 的使用；仅支持 `Usage_priv` 和 `Grant_priv` |

:::tip
`Admin_priv` 权限只能在 Global 层级授予或撤销。
:::

### 角色

角色是一组权限的集合。用户被赋予角色后，会自动继承该角色的所有权限；后续对角色权限的变更，也会同步反映到所有持有该角色的用户上。

#### 内置角色

Doris 默认创建以下两个内置角色：

| 内置角色     | 默认权限                       | 典型用途       |
|----------|----------------------------|------------|
| operator | `Admin_priv` + `Node_priv` | 集群运维、节点变更  |
| admin    | `Admin_priv`               | 业务管理、数据管理  |

#### 自定义角色

可通过 `CREATE ROLE` 创建命名角色，将常用权限组合后批量赋予用户，便于统一管理与权限回收。

### 用户

在 Doris 中，一个 `user_identity` 唯一标识一个用户。`user_identity` 由两部分组成：

- `user_name`：用户名。
- `host`：用户端连接所在的主机地址。

## 鉴权机制

<!-- 知识类型: 架构原理 -->

Doris 权限体系基于 RBAC 模型，用户与角色关联，角色与权限关联，**用户通过角色间接拥有权限**。

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

- `user1` 和 `user2` 都通过 `role1` 拥有了 `priv1` 的权限。
- `userN` 通过 `role3` 拥有了 `priv1` 的权限，通过 `roleN` 拥有了 `priv2` 和 `privN` 的权限，因此 `userN` 同时拥有 `priv1`、`priv2` 和 `privN` 的权限。

### 权限继承与回收规则

- 角色被删除时，所属用户**自动失去**该角色的所有权限。
- 用户与角色取消关联时，用户**自动失去**该角色的所有权限。
- 角色的权限被增加或删除时，所有持有该角色的用户权限**同步变更**。

### 注意事项

- 为了方便操作，Doris 支持直接给用户授权。底层实现上，会为每个用户创建一个专属的**默认角色**，直接对用户授权时，实际上是对该默认角色授权。
- 默认角色不能被删除、不能被分配给其他用户；当用户被删除时，其默认角色也会自动删除。

## 相关 SQL 命令

<!-- 知识类型: 命令参考 -->

| 操作类别       | 命令                                                                                       |
|------------|------------------------------------------------------------------------------------------|
| 授权 / 分配角色  | [GRANT](../../../sql-manual/sql-statements/account-management/GRANT-TO)                  |
| 撤权 / 撤销角色  | [REVOKE](../../../sql-manual/sql-statements/account-management/REVOKE-FROM)              |
| 创建角色       | [CREATE ROLE](../../../sql-manual/sql-statements/account-management/CREATE-ROLE)         |
| 删除角色       | [DROP ROLE](../../../sql-manual/sql-statements/account-management/DROP-ROLE)             |
| 修改角色       | [ALTER ROLE](../../../sql-manual/sql-statements/account-management/ALTER-ROLE)           |
| 查看当前用户权限   | [SHOW GRANTS](../../../sql-manual/sql-statements/account-management/SHOW-GRANTS)         |
| 查看所有用户权限   | [SHOW ALL GRANTS](../../../sql-manual/sql-statements/account-management/SHOW-GRANTS)     |
| 查看已创建的角色   | [SHOW ROLES](../../../sql-manual/sql-statements/account-management/SHOW-ROLES)           |
| 查看支持的所有权限项 | [SHOW PRIVILEGES](../../../sql-manual/sql-statements/account-management/SHOW-PRIVILEGES) |

## 最佳实践

<!-- 知识类型: 操作步骤 -->
<!-- 适用场景: 权限规划 / 多业务隔离 -->

以下是 Doris 权限系统的两种典型使用场景。

### 场景一：单业务集群按角色分工

Doris 集群的使用者分为管理员（Admin）、开发工程师（RD）和用户（Client）：

- **管理员**：拥有整个集群的所有权限，负责集群搭建、节点管理等。
- **开发工程师（RD）**：负责业务建模，包括建库建表、数据导入与修改等。
- **用户（Client）**：访问不同的库表以获取数据。

推荐授权方案：

- 管理员：赋予 `Admin_priv` 或全局 `Grant_priv`。
- RD：赋予对任意或指定库表的 `Create_priv`、`Drop_priv`、`Alter_priv`、`Load_priv`、`Select_priv`。
- Client：赋予对任意或指定库表的 `Select_priv`。

可通过创建不同的角色，简化对多个用户的批量授权操作。

### 场景二：多业务集群委托管理

一个集群内有多个业务，每个业务使用一个或多个数据库，且每个业务需要自行管理其用户。

推荐授权方案：管理员为每个业务库创建一个拥有该库级别 `Grant_priv` 的「业务管理员」用户。该用户仅可在所授权的数据库范围内为他人授权，从而实现业务间的权限隔离与自治。
