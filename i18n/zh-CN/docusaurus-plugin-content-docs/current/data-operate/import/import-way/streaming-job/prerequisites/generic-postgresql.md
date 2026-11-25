---
{
    "title": "通用 PostgreSQL",
    "language": "zh-CN",
    "description": "为 Doris 持续导入配置自建 PostgreSQL 数据源。",
    "keywords": [
        "PostgreSQL",
        "Doris 持续导入",
        "逻辑复制",
        "wal_level",
        "pg_hba.conf",
        "CDC"
    ]
}
---

:::caution 实验性功能

Doris 持续导入为实验性功能，自 Doris 4.1.5 版本起支持。

:::

本文介绍如何将自建 PostgreSQL 配置为 Doris 持续导入的数据源。使用托管 PostgreSQL 时，请在[支持的数据源](../continuous-load-overview.md#支持的数据源与同步模式)中查找对应服务的准备文档。

## 前置检查清单

| 检查项 | 要求 |
| --- | --- |
| 逻辑复制 | `wal_level = logical`，复制槽和 WAL 发送进程有足够余量 |
| 同步用户 | 有 `LOGIN` 和 `REPLICATION` 属性，并能读取待同步的源表 |
| 源表 | 每张待同步的表都有主键 |
| 网络 | Doris FE 和部署在 BE 上的 CDC Client 可连接源库的配置端口，通常为 `5432` |

## 步骤一：启用并验证逻辑复制

连接源实例并查询当前配置。

```sql
SHOW wal_level;
SHOW max_replication_slots;
SHOW max_wal_senders;
```

如果逻辑复制尚未启用或容量不足，在 `postgresql.conf` 中配置以下参数。复制槽和 WAL 发送进程的数量是示例值，请根据已有复制负载和新增 Doris 作业配置，并为并发连接留出余量。

```ini
wal_level = logical
max_replication_slots = 10
max_wal_senders = 12
```

在维护窗口重启 PostgreSQL，再执行上述查询确认参数生效。参见 [PostgreSQL 逻辑复制配置](https://www.postgresql.org/docs/current/logical-replication-config.html)。

## 步骤二：创建同步用户

使用数据库管理员或具备授权能力的角色创建带 `REPLICATION` 属性的登录账号，并授予源库和 Schema 的访问权限。

```sql
CREATE ROLE doris_sync WITH LOGIN REPLICATION PASSWORD '<password>';
GRANT CONNECT ON DATABASE source_db TO doris_sync;
```

连接 `source_db` 后再授予 Schema 和表权限。按实际情况替换 `public`，并为作业需要同步的表授予 `SELECT`。

```sql
GRANT USAGE ON SCHEMA public TO doris_sync;
GRANT SELECT ON TABLE public.orders, public.customers TO doris_sync;
```

## 步骤三：配置 Publication

Doris 使用 `pgoutput`，默认按作业创建并管理 Publication（发布）和逻辑复制槽。由 Doris 创建 Publication 时，同步用户需要有源库的 `CREATE` 权限，并拥有要发布的源表。

如果同步用户只拥有读取和复制权限，请由具备相应权限的角色在 `source_db` 中提前创建 Publication，并将作业要同步的所有表加入其中。

```sql
CREATE PUBLICATION doris_pub_custom FOR TABLE public.orders, public.customers;
```

创建作业时将 `publication_name` 设为 `doris_pub_custom`。省略 `slot_name` 时，复制槽由 Doris 管理。预先创建的 Publication 由用户维护。参见 [PostgreSQL Publication 权限说明](https://www.postgresql.org/docs/current/sql-createpublication.html)。

完成源库准备后，参照 [PostgreSQL CDC 自动建表同步](../continuous-load-postgresql-database.md)或 [PostgreSQL CDC SQL 映射同步](../continuous-load-postgresql-table.md)创建作业。

## 故障排查

| 现象 | 检查项 |
| --- | --- |
| PostgreSQL 拒绝连接 | 检查监听地址、防火墙，以及 `pg_hba.conf` 中最先匹配源库和同步用户的规则。 |
| 逻辑复制被拒绝 | 确认 `wal_level = logical` 且同步角色具有 `REPLICATION` 属性。 |
| 作业无法创建 Publication | 检查同步用户的源库 `CREATE` 权限和源表所有权，或使用预先创建的 Publication。 |
| 保留的 WAL 持续增长 | 在 `pg_replication_slots` 中检查复制槽的活动状态和延迟。停滞的复制槽可能一直保留 WAL，直至恢复或达到配置的保留上限。 |
