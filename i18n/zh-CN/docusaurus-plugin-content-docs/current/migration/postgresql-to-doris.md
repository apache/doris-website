---
{
    "title": "PostgreSQL 迁移到 Doris",
    "language": "zh-CN",
    "description": "通过 JDBC 批量迁移 PostgreSQL，并选择正确的 CDC、类型映射与校验方式。"
}
---

本页使用 PostgreSQL JDBC Catalog 把一个稳定快照导入 Doris 内部表。该方式适合一次性或周期性批量迁移，不会自动捕获后续更新、删除或 DDL。持续同步请见后面的 CDC 路线。

## 前提条件

- 已有名为 `migration_source` 的 PostgreSQL 数据库，以及对示例表具有 SELECT 权限的源端账户。
- 每个 Doris FE/BE 都可以访问源服务。按 [PostgreSQL Catalog](../lakehouse/catalogs/jdbc-pg-catalog.md) 和 [驱动部署](../lakehouse/catalogs/jdbc-catalog-overview.md) 准备 `postgresql-42.5.6.jar`。示例使用驱动文件名，因此 Jar 必须位于所有 FE/BE 的 `jdbc_drivers_dir` 中。
- 使用具备建 Catalog、建库、建表、读外表及写目标表权限的 Doris 账户。权限配置见 [授权](../admin-manual/auth/authorization/internal.md)。
- 以下演示在源库 `migration_source` 中运行，目标表必须为空。请替换示例主机、用户名和密码。

## 基本用法

### 1. 准备源表

在源数据库中执行：

```sql
CREATE TABLE public.migration_demo (
    id BIGINT PRIMARY KEY,
    amount DECIMAL(12,2),
    note VARCHAR(100)
);
INSERT INTO public.migration_demo VALUES (1, 12.50, 'first'), (2, NULL, NULL);
```

结果：建表成功并插入 2 行。

### 2. 在 Doris 中创建并检查 Catalog

```sql
CREATE CATALOG migration_pg PROPERTIES (
    'type' = 'jdbc',
    'user' = 'migration_reader',
    'password' = '<source_password>',
    'jdbc_url' = 'jdbc:postgresql://pg-host:5432/migration_source',
    'driver_url' = 'postgresql-42.5.6.jar',
    'driver_class' = 'org.postgresql.Driver'
);
DESC migration_pg.public.migration_demo;
```

结果应包含 `id`、`amount`、`note` 三列。检查实际外表类型，再创建目标表。

### 3. 创建目标表并迁移

```sql
CREATE DATABASE IF NOT EXISTS migration_target;
CREATE TABLE migration_target.pg_demo (
    id BIGINT NOT NULL,
    amount DECIMAL(12,2),
    note STRING
)
DUPLICATE KEY(id)
DISTRIBUTED BY HASH(id) BUCKETS 1
PROPERTIES ('replication_num' = '1');

INSERT INTO migration_target.pg_demo (id, amount, note)
SELECT id, amount, note FROM migration_pg.public.migration_demo;

SELECT id, amount, note FROM migration_target.pg_demo ORDER BY id;
```

```text
+------+--------+-------+
| id   | amount | note  |
+------+--------+-------+
|    1 |  12.50 | first |
|    2 |   NULL | NULL  |
+------+--------+-------+
```

示例使用单副本、单分桶，便于本地验证；生产环境请按可用 BE 数量和可靠性要求调整。重复执行 INSERT 会追加重复数据。
## 连接参数

| 参数 | 类型 | 是否必需 / 默认值 | 描述 |
| --- | --- | --- | --- |
| `type` | STRING | 必需，无默认值 | 使用 `jdbc` |
| `user` / `password` | STRING | 必需，无默认值 | 源数据库凭据 |
| `jdbc_url` | STRING | 必需，无默认值 | 源数据库地址；PostgreSQL URL 还指定数据库 |
| `driver_url` | STRING | 必需，无默认值 | 每个 FE/BE 可访问的 Jar；本例使用预部署文件名 |
| `driver_class` | STRING | 必需，无默认值 | 对应驱动的 Java 类名 |

连接池、名称映射及驱动路径安全规则见 [完整 JDBC 参数参考](../lakehouse/catalogs/jdbc-catalog-overview.md)。

## 类型与版本注意事项 {#data-type-mapping}

- JDBC 读取的 `json/jsonb` 映射为 `STRING`，不会自动变为 `VARIANT`。要使用其他目标类型，请显式转换并校验。
- PostgreSQL `time`、`timetz`、`interval` 采用该 Catalog 定义的字符串映射；这不表示 Doris 没有 TIME 类型。
- 无明确精度或超出支持范围的 `numeric` 可能映射为 `STRING`。先检查外表类型，再做数值计算。
- 4.1 系列自 4.1.5 起，`timestamptz` 映射为 `TIMESTAMPTZ`，`bytea` 映射为 `VARBINARY`；更早版本的映射及配置不同。dev 使用当前映射。核查时区、精度及二进制逐字节一致性。
- 数组维度需要源数据辅助识别；没有可用数据时可能显示为不支持的类型。请按 [PostgreSQL 映射参考](../lakehouse/catalogs/jdbc-pg-catalog.md) 验证具体列。

## 持续同步

需要源端更新、删除和全量初始化衔接时，使用 [Flink CDC 同步](../connection-integration/data-integration/flink-doris-connector/cdc-sync.md)。按 Connector 兼容矩阵选择 Flink、CDC 和 Doris Connector 版本，不要把独立版本的最低要求简单组合。

<version since="dev">

</version>

dev 还提供 [原生 PostgreSQL CDC](../data-operate/import/import-way/streaming-job/continuous-load-postgresql-database.md)。该自动建表路线要求源表主键，目前提供至少一次语义，前提条件、日志权限、复制资源及监控方式以该参考为准；不要直接套用本页 JDBC 类型映射。

## 校验与错误处理

在同一快照和固定范围内，对源表 `migration_pg.public.migration_demo` 与目标表 `migration_target.pg_demo` 分别执行 `COUNT(*)`、`COUNT(amount)`、`SUM(amount)`；本例结果应分别为 `2`、`1`、`12.50`。还应逐值检查样本、NULL、精度和时区。完整迁移的校验与切换流程见 [迁移概览](./overview.md)。

连接失败时先检查所有 FE/BE 的网络、驱动文件、源账户权限及驱动路径限制。类型不兼容时先检查 `DESC` 并显式转换；导入失败后检查实际已写入范围，再决定重试，不要无条件重复整个 INSERT。

## 建议

先用本页的小表验证环境，再按稳定键或时间范围分批。持续同步选择能够处理更新、删除和重放的目标模型；批量快照表与持续镜像表应分别设计。
