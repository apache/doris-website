---
{
    "title": "Other OLAP Systems to Doris",
    "language": "en",
    "description": "Guide to migrating data from ClickHouse, Greenplum, Hive, Iceberg, Hudi and other OLAP systems to Apache Doris"
}
---

This guide covers migrating data from various OLAP systems to Apache Doris, including ClickHouse, Greenplum, and data lake technologies like Hive, Iceberg, and Hudi.

## Migration Methods Overview

| Source System | Recommended Method | Notes |
|---------------|-------------------|-------|
| ClickHouse | JDBC Catalog + SQL Convertor | Schema and SQL syntax conversion needed |
| Greenplum | JDBC Catalog | PostgreSQL-compatible |
| Hive | Multi-Catalog (Hive Catalog) | Direct metadata integration |
| Iceberg | Multi-Catalog (Iceberg Catalog) | Table format native support |
| Hudi | Multi-Catalog (Hudi Catalog) | Table format native support |
| Spark/Flink Tables | Spark/Flink Doris Connector | Batch or streaming |

## ClickHouse

ClickHouse and Doris are both columnar OLAP databases with some similarities but different SQL dialects and data types.

### Data Type Mapping

| ClickHouse Type | Doris Type | Notes |
|-----------------|------------|-------|
| Int8 | TINYINT | |
| Int16 | SMALLINT | |
| Int32 | INT | |
| Int64 | BIGINT | |
| UInt8 | SMALLINT | Unsigned to signed |
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
| Nullable(T) | T (nullable) | |
| LowCardinality(T) | T | No special handling needed |
| Enum8/Enum16 | TINYINT/SMALLINT or STRING | |

### Migration with JDBC Catalog

#### Step 1: Set Up ClickHouse JDBC Driver

```bash
# Download ClickHouse JDBC driver
wget https://github.com/ClickHouse/clickhouse-java/releases/download/v0.6.0/clickhouse-jdbc-0.6.0-all.jar

# Deploy to Doris
cp clickhouse-jdbc-0.6.0-all.jar $DORIS_HOME/fe/jdbc_drivers/
cp clickhouse-jdbc-0.6.0-all.jar $DORIS_HOME/be/jdbc_drivers/
```

#### Step 2: Create ClickHouse Catalog

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

#### Step 3: Explore and Migrate

```sql
-- Explore ClickHouse data
SWITCH clickhouse_catalog;
SHOW DATABASES;
USE default;
SHOW TABLES;

-- Preview table
SELECT * FROM events LIMIT 10;

-- Create Doris table
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

-- Migrate data
INSERT INTO internal.analytics.events
SELECT
    event_id,
    event_time,
    user_id,
    event_type,
    properties
FROM clickhouse_catalog.default.events;
```

### SQL Syntax Conversion

Common ClickHouse to Doris SQL conversions:

| ClickHouse | Doris |
|------------|-------|
| `toDate(datetime)` | `DATE(datetime)` |
| `toDateTime(string)` | `CAST(string AS DATETIME)` |
| `formatDateTime(dt, '%Y-%m')` | `DATE_FORMAT(dt, '%Y-%m')` |
| `arrayJoin(arr)` | `EXPLODE(arr)` with LATERAL VIEW |
| `groupArray(col)` | `COLLECT_LIST(col)` |
| `argMax(col1, col2)` | `MAX_BY(col1, col2)` |
| `argMin(col1, col2)` | `MIN_BY(col1, col2)` |
| `uniq(col)` | `APPROX_COUNT_DISTINCT(col)` |
| `uniqExact(col)` | `COUNT(DISTINCT col)` |
| `JSONExtract(json, 'key', 'String')` | `JSON_EXTRACT(json, '$.key')` |
| `multiIf(cond1, val1, cond2, val2, default)` | `CASE WHEN cond1 THEN val1 WHEN cond2 THEN val2 ELSE default END` |

### Table Engine Mapping

| ClickHouse Engine | Doris Model | Notes |
|-------------------|-------------|-------|
| MergeTree | DUPLICATE | Append-only analytics |
| ReplacingMergeTree | UNIQUE | Deduplication by key |
| SummingMergeTree | AGGREGATE | Pre-aggregation |
| AggregatingMergeTree | AGGREGATE | Complex aggregations |
| CollapsingMergeTree | UNIQUE | With delete support |

## Greenplum

Greenplum is PostgreSQL-based, so migration is similar to PostgreSQL.

### Data Type Mapping

Use the [PostgreSQL type mapping](./postgresql-to-doris.md#data-type-mapping) as reference. Additional Greenplum-specific types:

| Greenplum Type | Doris Type | Notes |
|----------------|------------|-------|
| INT2/INT4/INT8 | SMALLINT/INT/BIGINT | |
| FLOAT4/FLOAT8 | FLOAT/DOUBLE | |
| NUMERIC | DECIMAL | |
| TEXT | STRING | |
| BYTEA | STRING | |
| TIMESTAMP | DATETIME | |
| INTERVAL | STRING | |

### Migration with JDBC Catalog

```sql
-- Create Greenplum catalog (uses PostgreSQL driver)
CREATE CATALOG gp_catalog PROPERTIES (
    'type' = 'jdbc',
    'user' = 'gpadmin',
    'password' = 'password',
    'jdbc_url' = 'jdbc:postgresql://gp-master:5432/database',
    'driver_url' = 'postgresql-42.5.6.jar',
    'driver_class' = 'org.postgresql.Driver'
);

-- Query Greenplum data
SWITCH gp_catalog;
USE public;
SELECT * FROM large_table LIMIT 10;

-- Migrate with partitioning
INSERT INTO internal.target_db.large_table
SELECT * FROM gp_catalog.public.large_table
WHERE partition_col >= '2024-01-01';
```

### Parallel Migration

For large Greenplum tables, leverage parallel export:

```bash
# Export from Greenplum to files
psql -h gp-master -c "COPY large_table TO '/tmp/data.csv' WITH CSV"

# Or use gpfdist for parallel export
# Then load to Doris using Stream Load or Broker Load
```

## Data Lake (Hive, Iceberg, Hudi) {#data-lake}

Doris's Multi-Catalog feature provides native integration with data lake table formats.

### Hive Migration

#### Step 1: Create Hive Catalog

```sql
CREATE CATALOG hive_catalog PROPERTIES (
    'type' = 'hms',
    'hive.metastore.uris' = 'thrift://hive-metastore:9083',
    'hadoop.username' = 'hadoop'
);
```

For S3-based Hive:

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

#### Step 2: Query and Migrate

```sql
-- Browse Hive tables
SWITCH hive_catalog;
SHOW DATABASES;
USE warehouse;
SHOW TABLES;

-- Query Hive data directly
SELECT * FROM hive_catalog.warehouse.fact_sales LIMIT 10;

-- Migrate to Doris
INSERT INTO internal.analytics.fact_sales
SELECT * FROM hive_catalog.warehouse.fact_sales
WHERE dt >= '2024-01-01';
```

### Iceberg Migration

```sql
-- Create Iceberg catalog
CREATE CATALOG iceberg_catalog PROPERTIES (
    'type' = 'iceberg',
    'iceberg.catalog.type' = 'hms',
    'hive.metastore.uris' = 'thrift://hive-metastore:9083'
);

-- Or with REST catalog
CREATE CATALOG iceberg_catalog PROPERTIES (
    'type' = 'iceberg',
    'iceberg.catalog.type' = 'rest',
    'uri' = 'http://iceberg-rest:8181'
);

-- Query Iceberg tables
SELECT * FROM iceberg_catalog.db.table_name;

-- Time travel query
SELECT * FROM iceberg_catalog.db.table_name
FOR VERSION AS OF 123456789;

-- Migrate data
INSERT INTO internal.target_db.target_table
SELECT * FROM iceberg_catalog.source_db.source_table;
```

### Hudi Migration

```sql
-- Create Hudi catalog
CREATE CATALOG hudi_catalog PROPERTIES (
    'type' = 'hms',
    'hive.metastore.uris' = 'thrift://hive-metastore:9083'
);

-- Query Hudi tables (read-optimized)
SELECT * FROM hudi_catalog.db.hudi_table;

-- Migrate data
INSERT INTO internal.target_db.target_table
SELECT * FROM hudi_catalog.db.hudi_table;
```

## Spark/Flink Connector Migration

For systems not directly supported by catalogs, use Spark or Flink connectors.

### Spark Doris Connector

```scala
// Read from any Spark-supported source
val sourceDF = spark.read
  .format("source_format")
  .load("source_path")

// Write to Doris
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
-- Read from source
CREATE TABLE source_table (...) WITH ('connector' = 'source-connector', ...);

-- Write to Doris
CREATE TABLE doris_sink (...) WITH (
    'connector' = 'doris',
    'fenodes' = 'doris-fe:8030',
    'table.identifier' = 'db.table',
    'username' = 'root',
    'password' = ''
);

INSERT INTO doris_sink SELECT * FROM source_table;
```

## Export-Import Method

For air-gapped environments or when direct connectivity isn't possible:

### Step 1: Export to Files

```bash
# From ClickHouse
clickhouse-client --query "SELECT * FROM table FORMAT Parquet" > data.parquet

# From Greenplum
psql -c "\COPY table TO 'data.csv' WITH CSV HEADER"

# From Hive
hive -e "INSERT OVERWRITE DIRECTORY '/tmp/export' ROW FORMAT DELIMITED SELECT * FROM table"
```

### Step 2: Upload to Object Storage

```bash
# Upload to S3
aws s3 cp data.parquet s3://bucket/migration/

# Or to HDFS
hdfs dfs -put data.parquet /migration/
```

### Step 3: Load into Doris

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

## Best Practices

### Schema Design Considerations

When migrating from other OLAP systems:

1. **Choose the right data model**:
   - DUPLICATE for append-only event data
   - UNIQUE for dimension tables with updates
   - AGGREGATE for pre-aggregated metrics

2. **Partition strategy**:
   - Time-based partitioning for time-series data
   - Match source partitioning when possible

3. **Bucket count**:
   - Start with 8-16 buckets per partition
   - Scale based on data volume and query patterns

### Incremental Migration

For continuous sync from data lakes:

```sql
-- Track last sync timestamp
CREATE TABLE sync_metadata (
    table_name VARCHAR(128),
    last_sync_time DATETIME
)
DISTRIBUTED BY HASH(table_name) BUCKETS 1;

-- Incremental load
INSERT INTO internal.analytics.fact_sales
SELECT * FROM hive_catalog.warehouse.fact_sales
WHERE updated_at > (
    SELECT last_sync_time FROM sync_metadata
    WHERE table_name = 'fact_sales'
);

-- Update sync metadata
INSERT INTO sync_metadata VALUES ('fact_sales', NOW())
ON DUPLICATE KEY UPDATE last_sync_time = NOW();
```

## Validation

After migration:

```sql
-- Row count validation
SELECT
    'source' as system,
    COUNT(*) as cnt
FROM source_catalog.db.table
UNION ALL
SELECT
    'doris' as system,
    COUNT(*) as cnt
FROM internal.db.table;

-- Aggregation validation
SELECT SUM(amount), COUNT(DISTINCT user_id)
FROM internal.db.table;

-- Compare with source
SELECT SUM(amount), COUNT(DISTINCT user_id)
FROM source_catalog.db.table;
```

## Next Steps

- [Lakehouse Overview](../lakehouse/lakehouse-overview.md) - Multi-Catalog capabilities
- [Hive Catalog](../lakehouse/catalogs/hive-catalog.md) - Hive integration details
- [Iceberg Catalog](../lakehouse/catalogs/iceberg-catalog.md) - Iceberg integration
- [Spark Doris Connector](../ecosystem/spark-doris-connector.md) - Spark integration
- [Flink Doris Connector](../ecosystem/flink-doris-connector.md) - Flink integration
