---
{
    "title": "Azure PostgreSQL",
    "language": "zh-CN",
    "description": "为 Doris 持续导入配置 Azure Database for PostgreSQL 灵活服务器。",
    "keywords": [
        "Azure Database for PostgreSQL",
        "Doris 持续导入",
        "wal_level",
        "CDC"
    ]
}
---

:::caution 实验性功能

Doris 持续导入为实验性功能，自 Doris 4.1.5 版本起支持。

:::

<!-- 知识类型: 操作步骤 / 配置参数 -->
<!-- 适用场景: 部署前检查 / 环境配置 -->

本文介绍如何将 Azure Database for PostgreSQL 灵活服务器配置为 Doris 持续导入的数据源。

## 前置检查清单

| 检查项 | 要求 |
| --- | --- |
| Azure 操作权限 | 可以修改服务器参数和重启实例 |
| 数据库权限 | 可以创建用户、授予复制权限并为所需源表创建 Publication |
| 维护窗口 | 修改 `wal_level` 后需要重启实例 |
| 网络和 TLS | Doris FE 和部署在 BE 上的 CDC Client 可通过 TLS 访问源实例的 `5432` 端口。使用公网时，在 [Azure 防火墙](https://learn.microsoft.com/zh-cn/azure/postgresql/network/concepts-networking-public)中放行其出口 IP。使用私网时，检查路由和 DNS。 |

## 步骤一：检查当前配置

连接源实例，检查 WAL 级别以及复制槽和 WAL 发送进程的容量。

```sql
SHOW wal_level;
SHOW max_replication_slots;
SHOW max_wal_senders;
```

如果 `wal_level` 已为 `logical`，且复制槽和 WAL 发送进程有足够余量，可以继续创建同步用户。

## 步骤二：配置服务器参数

1. 在 Azure 门户打开 PostgreSQL 灵活服务器，进入 **设置 → 服务器参数（Server parameters）**。
2. 将 `wal_level` 设置为 `logical`。
3. 根据已有复制负载和计划新增的 Doris 作业，按需调高 `max_replication_slots` 和 `max_wal_senders`。
4. 保存更改。[Azure PostgreSQL 逻辑复制](https://learn.microsoft.com/zh-cn/azure/postgresql/configure-maintain/concepts-logical)

    ![Azure PostgreSQL 服务器参数页面，显示 wal_level 设置为 LOGICAL 和保存按钮](/images/next/data-operate/streaming-job/azure-postgresql-wal-level.png)

## 步骤三：重启实例并验证配置

在维护窗口重启实例。重启后连接源库并执行 `SHOW wal_level;`，预期返回 `logical`。

## 步骤四：创建同步用户

使用 Azure PostgreSQL 服务器管理员账号连接源库，将 `source_db` 和 `public` 替换为待同步的数据库和 Schema，并授予源表的访问权限。

### 1. 创建用户

```sql
CREATE ROLE doris_sync WITH LOGIN PASSWORD '<password>';
```

### 2. 授予源库和 Schema 访问权限

```sql
GRANT CONNECT ON DATABASE source_db TO doris_sync;
GRANT USAGE ON SCHEMA public TO doris_sync;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO doris_sync;
```

### 3. 授予复制权限

```sql
ALTER ROLE doris_sync WITH REPLICATION;
```

`REPLICATION` 属性通过 PostgreSQL SQL 授予。检查同步用户的 `rolreplication` 是否为真。

```sql
SELECT rolname, rolreplication FROM pg_roles WHERE rolname = 'doris_sync';
```

## 步骤五：配置 Publication

Doris 使用 `pgoutput` 进行逻辑复制，默认按作业创建 Publication（发布）和逻辑复制槽。由 Doris 创建 Publication 时，同步用户需要具有源库的 `CREATE` 权限，并拥有要发布的源表。[PostgreSQL Publication 权限说明](https://www.postgresql.org/docs/current/sql-createpublication.html)

如果同步用户只拥有读取和复制权限，请由具备相应权限的角色在源库提前创建 Publication，并将作业要同步的所有表加入其中。自动建表同步使用带主键的源表。

```sql
CREATE PUBLICATION doris_pub_custom FOR TABLE public.orders, public.customers;
```

创建作业时设置 `"publication_name" = "doris_pub_custom"`。省略 `slot_name` 时，复制槽由 Doris 管理。预先创建的 Publication 由用户维护。

完成准备工作后，参照 [PostgreSQL CDC 自动建表同步](../continuous-load-postgresql-database.md)创建作业并配置 TLS。

## FAQ

**Q1：为什么管理员登录后仍需要授予 `REPLICATION`？**

Azure 管理员角色成员资格与 PostgreSQL 的 `REPLICATION` 属性独立。可查询 `pg_roles.rolreplication` 确认实际的复制权限。

**Q2：怎样检查已有 Publication 包含哪些表？**

在源库查询 `pg_publication_tables`，核对 `pubname` 对应的 `schemaname` 和 `tablename`。

## 故障排查（Troubleshooting）

| 现象 | 检查项 |
| --- | --- |
| 复制连接被拒绝 | 确认同步用户的 `rolreplication = true`，且 `wal_level = logical`。 |
| 作业无法创建 Publication | 检查源库 `CREATE` 权限和源表所有权，或者提前创建 Publication 并指定 `publication_name`。 |
| Azure 拒绝 `CREATE EXTENSION hstore` | 如果源表使用 `hstore`，在**服务器参数**的 `azure.extensions` 中添加该扩展，再到源库执行 `CREATE EXTENSION IF NOT EXISTS hstore;`。[Azure 扩展允许列表](https://learn.microsoft.com/zh-cn/azure/postgresql/extensions/how-to-allow-extensions) |
