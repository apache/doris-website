---
{
    "title": "PostgreSQL 迁移到 Doris",
    "language": "zh-CN",
    "description": "从 PostgreSQL 迁移数据到 Apache Doris 的完整指南"
}
---

本指南介绍如何将数据从 PostgreSQL 迁移到 Apache Doris。您可以根据实时同步需求、数据量和运维复杂度选择多种迁移方法。

## 注意事项

1. **Schema 设计**：迁移前，选择合适的 Doris [数据模型](../table-design/data-model/overview.md)并规划您的[分区](../table-design/data-partitioning/data-distribution.md)和[分桶](../table-design/data-partitioning/data-bucketing.md)策略。

2. **数据类型**：查看下面的类型映射表。某些 PostgreSQL 类型需要特殊处理（数组、带时区的时间戳、JSON）。

3. **主键**：PostgreSQL 的 serial/identity 列映射到 Doris 的 INT/BIGINT 类型。对于唯一约束，使用 Doris 的 UNIQUE KEY 模型。

## 数据类型映射

| PostgreSQL 类型 | Doris 类型 | 说明 |
|-----------------|------------|------|
| boolean | BOOLEAN | |
| smallint / int2 | SMALLINT | |
| integer / int4 | INT | |
| bigint / int8 | BIGINT | |
| decimal / numeric | DECIMAL(P,S) | 无精度的 Numeric 映射为 STRING |
| real / float4 | FLOAT | |
| double precision | DOUBLE | |
| smallserial | SMALLINT | |
| serial | INT | |
| bigserial | BIGINT | |
| char(n) | CHAR(N) | |
| varchar / text | STRING | |
| timestamp | DATETIME | |
| timestamptz | DATETIME | 转换为本地时区；参见[时区问题](#处理时区问题) |
| date | DATE | |
| time | STRING | Doris 不支持 TIME 类型 |
| interval | STRING | |
| json / jsonb | JSON 或 STRING | 使用 STRING 可获得更好的查询性能 |
| uuid | STRING | |
| bytea | STRING | |
| array | ARRAY | 参见[处理数组](#处理数组) |
| inet / cidr / macaddr | STRING | |
| point / line / polygon | STRING | 几何类型存储为字符串 |

## 迁移选项

### 选项 1：JDBC Catalog（推荐）

JDBC Catalog 提供从 Doris 直接访问 PostgreSQL 数据的能力。这是查询和迁移数据最简单的方法。

#### 前提条件

- PostgreSQL 11.x 或更高版本
- [PostgreSQL JDBC 驱动](https://jdbc.postgresql.org/) 42.5.x 或更高版本
- Doris FE/BE 节点与 PostgreSQL 之间的网络连接（端口 5432）

#### 步骤 1：下载并部署 JDBC 驱动

```bash
# 下载驱动
wget https://jdbc.postgresql.org/download/postgresql-42.5.6.jar

# 复制到 Doris FE 和 BE 的 jdbc_drivers 目录
cp postgresql-42.5.6.jar $DORIS_HOME/fe/jdbc_drivers/
cp postgresql-42.5.6.jar $DORIS_HOME/be/jdbc_drivers/
```

#### 步骤 2：创建 PostgreSQL Catalog

```sql
CREATE CATALOG pg_catalog PROPERTIES (
    'type' = 'jdbc',
    'user' = 'postgres_user',
    'password' = 'postgres_password',
    'jdbc_url' = 'jdbc:postgresql://pg-host:5432/database_name',
    'driver_url' = 'postgresql-42.5.6.jar',
    'driver_class' = 'org.postgresql.Driver'
);
```

对于 SSL 连接：

```sql
CREATE CATALOG pg_catalog PROPERTIES (
    'type' = 'jdbc',
    'user' = 'postgres_user',
    'password' = 'postgres_password',
    'jdbc_url' = 'jdbc:postgresql://pg-host:5432/database_name?ssl=true&sslmode=require',
    'driver_url' = 'postgresql-42.5.6.jar',
    'driver_class' = 'org.postgresql.Driver'
);
```

#### 步骤 3：探索源数据

```sql
-- 切换到 catalog
SWITCH pg_catalog;

-- 列出可用的 schema（Doris 中的数据库）
SHOW DATABASES;

-- 使用某个 schema
USE public;

-- 列出表
SHOW TABLES;

-- 预览数据
SELECT * FROM source_table LIMIT 10;

-- 检查行数
SELECT COUNT(*) FROM source_table;
```

#### 步骤 4：创建 Doris 目标表

```sql
-- 切换回内部 catalog
SWITCH internal;
USE target_db;

-- 根据源 schema 创建表
CREATE TABLE orders (
    order_id INT,
    customer_id INT,
    order_date DATE NOT NULL,
    total_amount DECIMAL(10, 2),
    status VARCHAR(32),
    created_at DATETIME
)
UNIQUE KEY(order_id, order_date)
PARTITION BY RANGE(order_date) ()
DISTRIBUTED BY HASH(order_id) BUCKETS 16
PROPERTIES (
    "dynamic_partition.enable" = "true",
    "dynamic_partition.time_unit" = "MONTH",
    "dynamic_partition.start" = "-12",
    "dynamic_partition.end" = "3",
    "dynamic_partition.prefix" = "p",
    "dynamic_partition.buckets" = "16",
    "replication_num" = "3"
);
```

#### 步骤 5：迁移数据

对于中小型表：

```sql
INSERT INTO internal.target_db.orders
SELECT
    order_id,
    customer_id,
    order_date,
    total_amount,
    status,
    created_at
FROM pg_catalog.public.orders;
```

对于大表，分批迁移：

```sql
-- 按日期范围分批
INSERT INTO internal.target_db.orders
SELECT * FROM pg_catalog.public.orders
WHERE order_date >= '2024-01-01' AND order_date < '2024-04-01';

INSERT INTO internal.target_db.orders
SELECT * FROM pg_catalog.public.orders
WHERE order_date >= '2024-04-01' AND order_date < '2024-07-01';
```

#### 步骤 6：验证迁移

```sql
-- 比较行数
SELECT 'doris' as source, COUNT(*) as cnt FROM internal.target_db.orders
UNION ALL
SELECT 'postgres' as source, COUNT(*) as cnt FROM pg_catalog.public.orders;

-- 抽查特定记录
SELECT * FROM internal.target_db.orders WHERE order_id = 12345;
SELECT * FROM pg_catalog.public.orders WHERE order_id = 12345;
```

### 选项 2：Flink CDC（实时同步）

Flink CDC 从 PostgreSQL WAL（预写日志）捕获变更并实时流式传输到 Doris。这适用于持续同步场景。

#### 前提条件

- 启用逻辑复制的 PostgreSQL（`wal_level = logical`）
- Flink 1.15+ 配合 Flink CDC 和 Flink Doris Connector
- PostgreSQL 中的复制槽

#### 步骤 1：配置 PostgreSQL

确保 `postgresql.conf` 中有以下设置：

```properties
wal_level = logical
max_replication_slots = 10
max_wal_senders = 10
```

创建复制用户并授予权限：

```sql
-- 创建具有复制权限的用户
CREATE USER flink_cdc WITH REPLICATION PASSWORD 'password';

-- 授予表访问权限
GRANT SELECT ON ALL TABLES IN SCHEMA public TO flink_cdc;
GRANT USAGE ON SCHEMA public TO flink_cdc;
```

#### 步骤 2：创建 Flink CDC 任务

使用 Flink SQL：

```sql
-- 源：PostgreSQL CDC
CREATE TABLE pg_orders (
    order_id INT,
    customer_id INT,
    order_date DATE,
    total_amount DECIMAL(10, 2),
    status STRING,
    created_at TIMESTAMP(3),
    PRIMARY KEY (order_id) NOT ENFORCED
) WITH (
    'connector' = 'postgres-cdc',
    'hostname' = 'pg-host',
    'port' = '5432',
    'username' = 'flink_cdc',
    'password' = 'password',
    'database-name' = 'source_db',
    'schema-name' = 'public',
    'table-name' = 'orders',
    'slot.name' = 'flink_slot',
    'decoding.plugin.name' = 'pgoutput'
);

-- 目标：Doris
CREATE TABLE doris_orders (
    order_id INT,
    customer_id INT,
    order_date DATE,
    total_amount DECIMAL(10, 2),
    status STRING,
    created_at DATETIME
) WITH (
    'connector' = 'doris',
    'fenodes' = 'doris-fe:8030',
    'table.identifier' = 'target_db.orders',
    'username' = 'doris_user',
    'password' = 'doris_password',
    'sink.enable-2pc' = 'true',
    'sink.label-prefix' = 'pg_orders_sync'
);

-- 开始同步
INSERT INTO doris_orders SELECT * FROM pg_orders;
```

### 选项 3：导出和加载

适用于网络隔离环境或无法直接连接的情况。

#### 步骤 1：从 PostgreSQL 导出

```bash
# 导出为 CSV
psql -h pg-host -U user -d database -c "\COPY orders TO '/tmp/orders.csv' WITH CSV HEADER"

# 使用 DuckDB 或 pandas 导出为 Parquet
duckdb -c "COPY (SELECT * FROM postgres_scan('postgresql://user:pass@host/db', 'public', 'orders')) TO '/tmp/orders.parquet'"
```

#### 步骤 2：上传到对象存储

```bash
# 上传到 S3
aws s3 cp /tmp/orders.parquet s3://bucket/migration/orders.parquet

# 或上传到 HDFS
hdfs dfs -put /tmp/orders.parquet /migration/orders.parquet
```

#### 步骤 3：加载到 Doris

```sql
-- 使用 S3 Load
LOAD LABEL orders_migration
(
    DATA INFILE("s3://bucket/migration/orders.parquet")
    INTO TABLE orders
    FORMAT AS "parquet"
)
WITH S3 (
    "provider" = "AWS",
    "s3.endpoint" = "s3.amazonaws.com",
    "s3.region" = "us-east-1",
    "s3.access_key" = "your_ak",
    "s3.secret_key" = "your_sk"
);

-- 检查加载状态
SHOW LOAD WHERE LABEL = "orders_migration"\G
```

## 处理常见问题

### 处理时区问题

PostgreSQL `timestamptz` 以 UTC 存储时间戳并在读取时转换为会话时区。Doris `DATETIME` 不携带时区信息。

**建议**：迁移时显式转换时间戳：

```sql
-- 在 PostgreSQL 查询中转换为特定时区
INSERT INTO doris_table
SELECT
    id,
    created_at AT TIME ZONE 'UTC' as created_at_utc
FROM pg_catalog.schema.table;
```

同时确保 Doris BE 中 JVM 时区一致，在 `be.conf` 中设置：

```properties
JAVA_OPTS="-Duser.timezone=UTC ..."
```

### 处理数组

PostgreSQL 数组映射到 Doris ARRAY 类型，但维度检测需要现有数据：

```sql
-- PostgreSQL 源表
CREATE TABLE pg_table (
    id INT,
    tags TEXT[]
);

-- Doris 目标表
CREATE TABLE doris_table (
    id INT,
    tags ARRAY<STRING>
)
DISTRIBUTED BY HASH(id) BUCKETS 8;
```

如果无法确定数组维度，显式转换：

```sql
INSERT INTO doris_table
SELECT
    id,
    CAST(tags AS ARRAY<STRING>)
FROM pg_catalog.schema.pg_table;
```

### 处理 JSON/JSONB

对于复杂的 JSON 查询，映射到 Doris STRING 并使用 JSON 函数：

```sql
-- 查询 JSON 字段
SELECT
    id,
    JSON_EXTRACT(json_col, '$.name') as name,
    JSON_EXTRACT(json_col, '$.address.city') as city
FROM table_name;
```

### 大表迁移

对于数亿行的表：

1. **分区迁移**：按时间范围或 ID 范围迁移
2. **增加并行度**：同时运行多个 INSERT 语句
3. **监控资源**：检查 Doris BE 内存和磁盘使用情况

```sql
-- 并行迁移脚本（并发运行）
-- 会话 1
INSERT INTO orders SELECT * FROM pg_catalog.public.orders
WHERE order_id BETWEEN 0 AND 10000000;

-- 会话 2
INSERT INTO orders SELECT * FROM pg_catalog.public.orders
WHERE order_id BETWEEN 10000001 AND 20000000;
```

## 验证清单

迁移后，验证：

- [ ] 源和目标的行数匹配
- [ ] 样本记录相同
- [ ] NULL 值正确保留
- [ ] 数值精度保持
- [ ] 日期/时间值正确（检查时区）
- [ ] 数组和 JSON 字段可查询

```sql
-- 综合验证查询
SELECT
    'rows' as check_type,
    CASE WHEN s.cnt = t.cnt THEN 'PASS' ELSE 'FAIL' END as result,
    s.cnt as source_count,
    t.cnt as target_count
FROM
    (SELECT COUNT(*) cnt FROM pg_catalog.public.orders) s,
    (SELECT COUNT(*) cnt FROM internal.target_db.orders) t;
```
