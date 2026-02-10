---
{
    "title": "其他 OLAP 系统迁移到 Doris",
    "language": "zh-CN",
    "description": "从 ClickHouse、Greenplum、Hive、Iceberg、Hudi 等 OLAP 系统迁移数据到 Apache Doris 的指南"
}
---

本指南介绍如何从各种 OLAP 系统迁移数据到 Apache Doris，包括 ClickHouse、Greenplum 以及数据湖技术如 Hive、Iceberg 和 Hudi。

## 迁移方法概述

| 源系统 | 迁移方法 | 说明 |
|--------|---------|------|
| ClickHouse | JDBC Catalog + SQL 转换 | 需要 Schema 和 SQL 语法转换 |
| Greenplum | JDBC Catalog | 兼容 PostgreSQL |
| Hive | Multi-Catalog（Hive Catalog） | 直接元数据集成 |
| Iceberg | Multi-Catalog（Iceberg Catalog） | 原生表格式支持 |
| Hudi | Multi-Catalog（Hudi Catalog） | 原生表格式支持 |
| Spark/Flink 表 | Spark/Flink Doris Connector | 批量或流式 |

## ClickHouse

ClickHouse 和 Doris 都是列式 OLAP 数据库，有一些相似之处，但 SQL 方言和数据类型不同。

### 数据类型映射

| ClickHouse 类型 | Doris 类型 | 说明 |
|-----------------|------------|------|
| Int8 | TINYINT | |
| Int16 | SMALLINT | |
| Int32 | INT | |
| Int64 | BIGINT | |
| UInt8 | SMALLINT | 无符号转有符号 |
| UInt16 | INT | |
| UInt32 | BIGINT | |
| UInt64 | LARGEINT | |
| Float32 | FLOAT | |
| Float64 | DOUBLE | |
| Decimal(P, S) | DECIMAL(P, S) | |
| String | STRING | |
| FixedString(N) | CHAR(N) | |
| Date | DATE | |
| DateTime | DATETIME | |
| DateTime64 | DATETIME(precision) | |
| UUID | VARCHAR(36) | |
| Array(T) | ARRAY<T> | |
| Tuple | STRUCT | |
| Map(K, V) | MAP<K, V> | |
| Nullable(T) | T（可空） | |
| LowCardinality(T) | T | 无需特殊处理 |
| Enum8/Enum16 | TINYINT/SMALLINT 或 STRING | |

### SQL 语法转换

常见的 ClickHouse 到 Doris SQL 转换：

| ClickHouse | Doris |
|------------|-------|
| `toDate(datetime)` | `DATE(datetime)` |
| `toDateTime(string)` | `CAST(string AS DATETIME)` |
| `formatDateTime(dt, '%Y-%m')` | `DATE_FORMAT(dt, '%Y-%m')` |
| `arrayJoin(arr)` | `EXPLODE(arr)` 配合 LATERAL VIEW |
| `groupArray(col)` | `COLLECT_LIST(col)` |
| `argMax(col1, col2)` | `MAX_BY(col1, col2)` |
| `argMin(col1, col2)` | `MIN_BY(col1, col2)` |
| `uniq(col)` | `APPROX_COUNT_DISTINCT(col)` |
| `uniqExact(col)` | `COUNT(DISTINCT col)` |
| `JSONExtract(json, 'key', 'String')` | `JSON_EXTRACT(json, '$.key')` |
| `multiIf(cond1, val1, cond2, val2, default)` | `CASE WHEN cond1 THEN val1 WHEN cond2 THEN val2 ELSE default END` |

### 表引擎映射

| ClickHouse 引擎 | Doris 模型 | 说明 |
|-----------------|------------|------|
| MergeTree | DUPLICATE | 仅追加分析 |
| ReplacingMergeTree | UNIQUE | 按键去重 |
| SummingMergeTree | AGGREGATE | 预聚合 |
| AggregatingMergeTree | AGGREGATE | 复杂聚合 |
| CollapsingMergeTree | UNIQUE | 支持删除 |

### 迁移

使用 [JDBC Catalog](../lakehouse/catalogs/jdbc-catalog.md) 连接 ClickHouse，通过 `INSERT INTO ... SELECT` 迁移数据。

## Greenplum

Greenplum 基于 PostgreSQL，因此迁移与 PostgreSQL 类似。参见 [PostgreSQL 迁移到 Doris](./postgresql-to-doris.md) 指南了解通用原则。

### 数据类型映射

参考 [PostgreSQL 类型映射](./postgresql-to-doris.md#数据类型映射)。Greenplum 特有的类型：

| Greenplum 类型 | Doris 类型 | 说明 |
|----------------|------------|------|
| INT2/INT4/INT8 | SMALLINT/INT/BIGINT | |
| FLOAT4/FLOAT8 | FLOAT/DOUBLE | |
| NUMERIC | DECIMAL | |
| TEXT | STRING | |
| BYTEA | STRING | |
| TIMESTAMP | DATETIME | |
| INTERVAL | STRING | |

### 迁移

使用 [JDBC Catalog](../lakehouse/catalogs/jdbc-catalog.md) 配合 PostgreSQL 驱动连接 Greenplum 并迁移数据。对于大表，考虑通过 `gpfdist` 并行导出，然后基于文件加载到 Doris。

## 数据湖（Hive、Iceberg、Hudi） {#data-lake}

Doris 的 Multi-Catalog 功能提供与数据湖表格式的原生集成。

### Hive

使用 [Hive Catalog](../lakehouse/catalogs/hive-catalog.md) 直接查询和迁移 Hive 数据。支持 HDFS 和基于 S3 的存储。

### Iceberg

使用 [Iceberg Catalog](../lakehouse/catalogs/iceberg-catalog.md) 查询和迁移 Iceberg 表。支持 HMS 和 REST catalog 类型，以及时间旅行查询。

### Hudi

使用 Hive Catalog 查询和迁移 Hudi 表（读优化视图）。

## Spark/Flink Connector 迁移

对于 catalog 不直接支持的系统，使用 [Spark Doris Connector](../ecosystem/spark-doris-connector.md) 或 [Flink Doris Connector](../ecosystem/flink-doris-connector.md) 从任何 Spark/Flink 支持的源读取数据并写入 Doris。

## Schema 设计原则

从其他 OLAP 系统迁移时：

1. **选择正确的数据模型**：
   - DUPLICATE 用于仅追加的事件数据
   - UNIQUE 用于带更新的维表
   - AGGREGATE 用于预聚合指标

2. **分区策略**：
   - 对时间序列数据使用基于时间的分区
   - 尽可能匹配源分区

3. **分桶数**：
   - 每个分区从 8-16 个桶开始
   - 根据数据量和查询模式扩展

## 下一步

- [湖仓一体概述](../lakehouse/lakehouse-overview.md) - Multi-Catalog 功能
- [Hive Catalog](../lakehouse/catalogs/hive-catalog.md) - Hive 集成详情
- [Iceberg Catalog](../lakehouse/catalogs/iceberg-catalog.md) - Iceberg 集成
- [Spark Doris Connector](../ecosystem/spark-doris-connector.md) - Spark 集成
- [Flink Doris Connector](../ecosystem/flink-doris-connector.md) - Flink 集成
