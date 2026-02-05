---
{
    "title": "其他 OLAP 系统迁移到 Doris",
    "language": "zh-CN",
    "description": "从 ClickHouse、Greenplum、Hive、Iceberg、Hudi 等 OLAP 系统迁移数据到 Apache Doris 的指南"
}
---

本指南介绍如何从各种 OLAP 系统迁移数据到 Apache Doris，包括 ClickHouse、Greenplum 以及数据湖技术如 Hive、Iceberg 和 Hudi。

## 迁移方法概述

| 源系统 | 推荐方法 | 说明 |
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

### 使用 JDBC Catalog 迁移

#### 步骤 1：设置 ClickHouse JDBC 驱动

```bash
# 下载 ClickHouse JDBC 驱动
wget https://github.com/ClickHouse/clickhouse-java/releases/download/v0.6.0/clickhouse-jdbc-0.6.0-all.jar

# 部署到 Doris
cp clickhouse-jdbc-0.6.0-all.jar $DORIS_HOME/fe/jdbc_drivers/
cp clickhouse-jdbc-0.6.0-all.jar $DORIS_HOME/be/jdbc_drivers/
```

#### 步骤 2：创建 ClickHouse Catalog

```sql
CREATE CATALOG clickhouse_catalog PROPERTIES (
    'type' = 'jdbc',
    'user' = 'default',
    'password' = 'password',
    'jdbc_url' = 'jdbc:clickhouse://clickhouse-host:8123/default',
    'driver_url' = 'clickhouse-jdbc-0.6.0-all.jar',
    'driver_class' = 'com.clickhouse.jdbc.ClickHouseDriver'
);
```

#### 步骤 3：探索和迁移

```sql
-- 探索 ClickHouse 数据
SWITCH clickhouse_catalog;
SHOW DATABASES;
USE default;
SHOW TABLES;

-- 预览表
SELECT * FROM events LIMIT 10;

-- 创建 Doris 表
SWITCH internal;
CREATE TABLE analytics.events (
    event_id BIGINT,
    event_time DATETIME,
    user_id BIGINT,
    event_type VARCHAR(64),
    properties JSON
)
DUPLICATE KEY(event_id)
PARTITION BY RANGE(event_time) ()
DISTRIBUTED BY HASH(event_id) BUCKETS 16
PROPERTIES (
    "dynamic_partition.enable" = "true",
    "dynamic_partition.time_unit" = "DAY",
    "replication_num" = "3"
);

-- 迁移数据
INSERT INTO internal.analytics.events
SELECT
    event_id,
    event_time,
    user_id,
    event_type,
    properties
FROM clickhouse_catalog.default.events;
```

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

## Greenplum

Greenplum 基于 PostgreSQL，因此迁移与 PostgreSQL 类似。

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

### 使用 JDBC Catalog 迁移

```sql
-- 创建 Greenplum catalog（使用 PostgreSQL 驱动）
CREATE CATALOG gp_catalog PROPERTIES (
    'type' = 'jdbc',
    'user' = 'gpadmin',
    'password' = 'password',
    'jdbc_url' = 'jdbc:postgresql://gp-master:5432/database',
    'driver_url' = 'postgresql-42.5.6.jar',
    'driver_class' = 'org.postgresql.Driver'
);

-- 查询 Greenplum 数据
SWITCH gp_catalog;
USE public;
SELECT * FROM large_table LIMIT 10;

-- 带分区迁移
INSERT INTO internal.target_db.large_table
SELECT * FROM gp_catalog.public.large_table
WHERE partition_col >= '2024-01-01';
```

## 数据湖（Hive、Iceberg、Hudi） {#data-lake}

Doris 的 Multi-Catalog 功能提供与数据湖表格式的原生集成。

### Hive 迁移

#### 步骤 1：创建 Hive Catalog

```sql
CREATE CATALOG hive_catalog PROPERTIES (
    'type' = 'hms',
    'hive.metastore.uris' = 'thrift://hive-metastore:9083',
    'hadoop.username' = 'hadoop'
);
```

基于 S3 的 Hive：

```sql
CREATE CATALOG hive_catalog PROPERTIES (
    'type' = 'hms',
    'hive.metastore.uris' = 'thrift://hive-metastore:9083',
    's3.endpoint' = 's3.amazonaws.com',
    's3.region' = 'us-east-1',
    's3.access_key' = 'your_ak',
    's3.secret_key' = 'your_sk'
);
```

#### 步骤 2：查询和迁移

```sql
-- 浏览 Hive 表
SWITCH hive_catalog;
SHOW DATABASES;
USE warehouse;
SHOW TABLES;

-- 直接查询 Hive 数据
SELECT * FROM hive_catalog.warehouse.fact_sales LIMIT 10;

-- 迁移到 Doris
INSERT INTO internal.analytics.fact_sales
SELECT * FROM hive_catalog.warehouse.fact_sales
WHERE dt >= '2024-01-01';
```

### Iceberg 迁移

```sql
-- 创建 Iceberg catalog
CREATE CATALOG iceberg_catalog PROPERTIES (
    'type' = 'iceberg',
    'iceberg.catalog.type' = 'hms',
    'hive.metastore.uris' = 'thrift://hive-metastore:9083'
);

-- 或使用 REST catalog
CREATE CATALOG iceberg_catalog PROPERTIES (
    'type' = 'iceberg',
    'iceberg.catalog.type' = 'rest',
    'uri' = 'http://iceberg-rest:8181'
);

-- 查询 Iceberg 表
SELECT * FROM iceberg_catalog.db.table_name;

-- 时间旅行查询
SELECT * FROM iceberg_catalog.db.table_name
FOR VERSION AS OF 123456789;

-- 迁移数据
INSERT INTO internal.target_db.target_table
SELECT * FROM iceberg_catalog.source_db.source_table;
```

### Hudi 迁移

```sql
-- 创建 Hudi catalog
CREATE CATALOG hudi_catalog PROPERTIES (
    'type' = 'hms',
    'hive.metastore.uris' = 'thrift://hive-metastore:9083'
);

-- 查询 Hudi 表（读优化）
SELECT * FROM hudi_catalog.db.hudi_table;

-- 迁移数据
INSERT INTO internal.target_db.target_table
SELECT * FROM hudi_catalog.db.hudi_table;
```

## Spark/Flink Connector 迁移

对于 catalog 不直接支持的系统，使用 Spark 或 Flink connector。

### Spark Doris Connector

```scala
// 从任何 Spark 支持的源读取
val sourceDF = spark.read
  .format("source_format")
  .load("source_path")

// 写入 Doris
sourceDF.write
  .format("doris")
  .option("doris.table.identifier", "db.table")
  .option("doris.fenodes", "doris-fe:8030")
  .option("user", "root")
  .option("password", "")
  .save()
```

### Flink Doris Connector

```sql
-- 从源读取
CREATE TABLE source_table (...) WITH ('connector' = 'source-connector', ...);

-- 写入 Doris
CREATE TABLE doris_sink (...) WITH (
    'connector' = 'doris',
    'fenodes' = 'doris-fe:8030',
    'table.identifier' = 'db.table',
    'username' = 'root',
    'password' = ''
);

INSERT INTO doris_sink SELECT * FROM source_table;
```

## 导出-导入方法

对于网络隔离环境或无法直接连接时：

### 步骤 1：导出到文件

```bash
# 从 ClickHouse
clickhouse-client --query "SELECT * FROM table FORMAT Parquet" > data.parquet

# 从 Greenplum
psql -c "\COPY table TO 'data.csv' WITH CSV HEADER"

# 从 Hive
hive -e "INSERT OVERWRITE DIRECTORY '/tmp/export' ROW FORMAT DELIMITED SELECT * FROM table"
```

### 步骤 2：上传到对象存储

```bash
# 上传到 S3
aws s3 cp data.parquet s3://bucket/migration/

# 或上传到 HDFS
hdfs dfs -put data.parquet /migration/
```

### 步骤 3：加载到 Doris

```sql
-- S3 Load
LOAD LABEL migration_job
(
    DATA INFILE("s3://bucket/migration/data.parquet")
    INTO TABLE target_table
    FORMAT AS "parquet"
)
WITH S3 (
    "provider" = "AWS",
    "s3.endpoint" = "s3.amazonaws.com",
    "s3.region" = "us-east-1",
    "s3.access_key" = "ak",
    "s3.secret_key" = "sk"
);
```

## 最佳实践

### Schema 设计考虑

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

### 增量迁移

从数据湖持续同步：

```sql
-- 跟踪最后同步时间戳
CREATE TABLE sync_metadata (
    table_name VARCHAR(128),
    last_sync_time DATETIME
)
DISTRIBUTED BY HASH(table_name) BUCKETS 1;

-- 增量加载
INSERT INTO internal.analytics.fact_sales
SELECT * FROM hive_catalog.warehouse.fact_sales
WHERE updated_at > (
    SELECT last_sync_time FROM sync_metadata
    WHERE table_name = 'fact_sales'
);

-- 更新同步元数据
INSERT INTO sync_metadata VALUES ('fact_sales', NOW())
ON DUPLICATE KEY UPDATE last_sync_time = NOW();
```

## 验证

迁移后：

```sql
-- 行数验证
SELECT
    'source' as system,
    COUNT(*) as cnt
FROM source_catalog.db.table
UNION ALL
SELECT
    'doris' as system,
    COUNT(*) as cnt
FROM internal.db.table;

-- 聚合验证
SELECT SUM(amount), COUNT(DISTINCT user_id)
FROM internal.db.table;
```

## 下一步

- [湖仓一体概述](../lakehouse/lakehouse-overview.md) - Multi-Catalog 功能
- [Hive Catalog](../lakehouse/catalogs/hive-catalog.md) - Hive 集成详情
- [Iceberg Catalog](../lakehouse/catalogs/iceberg-catalog.md) - Iceberg 集成
- [Spark Doris Connector](../ecosystem/spark-doris-connector.md) - Spark 集成
- [Flink Doris Connector](../ecosystem/flink-doris-connector.md) - Flink 集成
