---
{
    "title": "Doris 与 MaxCompute 数据集成",
    "language": "zh-CN",
    "description": "通过 Apache Doris MaxCompute Catalog 实现与阿里云 MaxCompute 的双向数据集成，支持数据导入、写回、库表管理，助力企业构建高效的湖仓一体架构。"
}
---

本文档介绍如何通过 [MaxCompute Catalog](../catalogs/maxcompute-catalog.md) 实现 Apache Doris 与阿里云 MaxCompute 之间的数据集成：

- **数据导入**：将 MaxCompute 中的数据快速导入到 Doris 中进行分析。
- **数据写回**（4.1.0+）：将 Doris 中的分析结果或其他数据源的数据写回 MaxCompute。
- **库表管理**（4.1.0+）：在 Doris 中直接创建和管理 MaxCompute 的库表。

本文档基于 Apache Doris 2.1.9 版本，部分功能需要 4.1.0 及以上版本。

## 环境准备

### 01 开通 MaxCompute 开放存储 API

在 [MaxCompute 控制台](https://maxcompute.console.aliyun.com/) 左侧导航栏 -> `租户管理` -> `租户属性` -> 打开 `开放存储 (Storage API) 开关`

### 02 开通 MaxCompute 权限

Doris 使用 AK/SK 访问 MaxCompute 服务。请确保 AK/SK 对应的 IAM 用户，拥有对应 MaxCompute 服务的以下角色或权限：

```json
{
    "Statement": [
        {
            "Action": [
                "odps:List",
                "odps:Usage"
            ],
            "Effect": "Allow",
            "Resource": ["acs:odps:*:regions/*/quotas/pay-as-you-go"]
        }
    ],
    "Version": "1"
}
```

### 03 确认 Doris 和 MaxCompute 网络环境

强烈建议 Doris 集群和 MaxCompute 服务在同一个 VPC 中，并确保设置了正确的安全组。

本文实例是在同 VPC 网络情况下的测试结果。

## 导入 MaxCompute 数据

### 01 创建 Catalog

```sql
CREATE CATALOG mc PROPERTIES (
    "type" = "max_compute",
    "mc.default.project" = "xxx",
    "mc.access_key" = "AKxxxxx",
    "mc.secret_key" = "SKxxxxx",
    "mc.endpoint" = "xxxxx"
);
```

如需支持 Schema 层级（3.1.3+）：

```sql
CREATE CATALOG mc PROPERTIES (
    "type" = "max_compute",
    "mc.default.project" = "xxx",
    "mc.access_key" = "AKxxxxx",
    "mc.secret_key" = "SKxxxxx",
    "mc.endpoint" = "xxxxx",
    "mc.enable.namespace.schema" = "true"
);
```

具体请参阅 [MaxCompute Catalog](../catalogs/maxcompute-catalog.md) 文档。

### 02 导入 TPCH 数据集

我们使用 MaxCompute 公开数据集中的 TPCH 100 数据集作为示例（数据已经导入到 MaxCompute 中），并使用 `CREATE TABLE AS SELECT` 语句将 MaxCompute 的数据导入到 Doris 中。

该数据集有 7 张表。其中最大的 `lineitem` 表有 16 列，600037902 行，磁盘空间占用约为 30GB。

```sql
-- switch catalog
SWITCH internal;
-- create database
CREATE DATABASE tpch_100g;
-- ingest data
CREATE TABLE tpch_100g.lineitem AS SELECT * FROM mc.selectdb_test.lineitem;
CREATE TABLE tpch_100g.nation AS SELECT * FROM mc.selectdb_test.nation;
CREATE TABLE tpch_100g.orders AS SELECT * FROM mc.selectdb_test.orders;
CREATE TABLE tpch_100g.part AS SELECT * FROM mc.selectdb_test.part;
CREATE TABLE tpch_100g.partsupp AS SELECT * FROM mc.selectdb_test.partsupp;
CREATE TABLE tpch_100g.region AS SELECT * FROM mc.selectdb_test.region;
CREATE TABLE tpch_100g.supplier AS SELECT * FROM mc.selectdb_test.supplier;
```

在 Doris 集群单 BE 16C 64G 规格下，上述操作串行执行，耗时约为 6-7 分钟。

### 03 导入 Github Event 数据集

我们使用 MaxCompute 公开数据集中的 Github Event 数据集作为示例（数据已经导入到 MaxCompute 中），并使用 `CREATE TABLE AS SELECT` 语句将 MaxCompute 的数据导入到 Doris 中。

这里我们选择 `dwd_github_events_odps` 表的 `2015-01-01` 到 `2016-01-01` 共 365 个分区的数据。数据共 32 列，212786803 行，磁盘空间占用约为 10GB。

```sql
-- switch catalog
SWITCH internal;
-- create database
CREATE DATABASE github_events;
-- ingest data
CREATE TABLE github_events.dwd_github_events_odps
AS SELECT * FROM mc.github_events.dwd_github_events_odps
WHERE ds BETWEEN '2015-01-01' AND '2016-01-01';
```

在 Doris 集群单 BE 16C 64G 规格下，上述操作耗时约为 2 分钟。

## 数据写回 MaxCompute（4.1.0+）

自 4.1.0 版本开始，Doris 支持将数据写回 MaxCompute。该功能适用于以下场景：

- **分析结果回写**：在 Doris 中完成数据分析后，将结果写回 MaxCompute 供其他系统使用。
- **数据加工处理**：利用 Doris 强大的计算能力对数据进行 ETL 处理，并将处理后的数据存储到 MaxCompute。
- **跨源数据整合**：将 Doris 中来自多个数据源的数据整合后写入 MaxCompute 进行统一管理。

:::note
- 该功能为实验功能，自 4.1.0 版本开始支持。
- 支持写入分区表和非分区表。
- 不支持聚簇表、事务表、Delta Table 和外部表的写入。
:::

### 01 INSERT INTO 追加写入

INSERT 操作将数据以追加的方式写入到 MaxCompute 目标表中。

```sql
-- 切换到 MaxCompute Catalog
SWITCH mc;

-- 插入单行数据
INSERT INTO mc_db.mc_tbl VALUES (val1, val2, val3, val4);

-- 从 Doris 内表导入数据到 MaxCompute
INSERT INTO mc_db.mc_tbl SELECT col1, col2 FROM internal.db1.tbl1;

-- 指定列写入
INSERT INTO mc_db.mc_tbl(col1, col2) VALUES (val1, val2);

-- 指定分区写入（可以仅指定部分分区列，其余分区动态写入）
INSERT INTO mc_db.mc_tbl PARTITION(ds='20250201') SELECT id, name FROM internal.db1.source_tbl;
```

### 02 INSERT OVERWRITE 覆盖写入

INSERT OVERWRITE 会使用新的数据完全覆盖原有表中的数据。

```sql
-- 全表覆盖
INSERT OVERWRITE TABLE mc_db.mc_tbl VALUES (val1, val2, val3, val4);

-- 从其他表覆盖写入
INSERT OVERWRITE TABLE mc_db.mc_tbl(col1, col2) SELECT col1, col2 FROM internal.db1.tbl1;

-- 指定分区覆盖
INSERT OVERWRITE TABLE mc_db.mc_tbl PARTITION(ds='20250101') VALUES (10, 'new1');
```

### 03 CTAS 创建表并写入

可以通过 `CREATE TABLE AS SELECT` 语句在 MaxCompute 中创建新表并写入数据。

```sql
-- 在 MaxCompute 中创建表并导入数据
CREATE TABLE mc_db.mc_new_tbl AS SELECT * FROM internal.db1.source_tbl;
```

## 库表管理（4.1.0+）

自 4.1.0 版本开始，Doris 支持在 MaxCompute 中直接创建和删除库表。该功能适用于以下场景：

- **统一数据管理**：在 Doris 中统一管理多个数据源的元数据，无需切换到 MaxCompute 控制台。
- **自动化数据流水线**：在 ETL 流程中动态创建目标表，实现端到端的自动化处理。

:::note
- 该功能为实验功能，自 4.1.0 版本开始支持。
- 该功能仅在 `mc.enable.namespace.schema` 属性为 `true` 时可用。
- 支持创建和删除分区表和非分区表。
- 不支持创建聚簇表、事务表、Delta Table 和外部表。
:::

### 01 创建和删除库

```sql
-- 切换到 MaxCompute Catalog
SWITCH mc;

-- 创建 Schema
CREATE DATABASE IF NOT EXISTS mc_schema;

-- 使用全限定名创建
CREATE DATABASE IF NOT EXISTS mc.mc_schema;

-- 删除 Schema（会同时删除其下的所有表）
DROP DATABASE IF EXISTS mc.mc_schema;
```

:::caution
对于 MaxCompute Database，删除后会同时删除其下的所有表，请谨慎操作。
:::

### 02 创建和删除表

```sql
-- 创建非分区表
CREATE TABLE mc_schema.mc_tbl1 (
    id INT,
    name STRING,
    amount DECIMAL(18, 6),
    create_time DATETIME
);

-- 创建分区表
CREATE TABLE mc_schema.mc_tbl2 (
    id INT,
    val STRING,
    ds STRING,
    region STRING
)
PARTITION BY (ds, region)();

-- 删除表（会同时删除数据，包括分区数据）
DROP TABLE IF EXISTS mc_schema.mc_tbl1;
```

具体请参阅 [MaxCompute Catalog](../catalogs/maxcompute-catalog.md) 文档了解更多细节。
