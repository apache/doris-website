---
{
    "title": "Other OLAP Systems to Doris",
    "language": "en",
    "description": "Guide to migrating data from ClickHouse, Greenplum, Hive, Iceberg, Hudi and other OLAP systems to Apache Doris"
}
---

This guide covers migrating data from various OLAP systems to Apache Doris, including ClickHouse, Greenplum, and data lake technologies like Hive, Iceberg, and Hudi.

## Migration Methods Overview

| Source System | Migration Method | Notes |
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

### Migration

Use the [JDBC Catalog](../lakehouse/catalogs/jdbc-catalog.md) to connect to ClickHouse and migrate data via `INSERT INTO ... SELECT`.

## Greenplum

Greenplum is PostgreSQL-based, so migration is similar to PostgreSQL. See the [PostgreSQL to Doris](./postgresql-to-doris.md) guide for general principles.

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

### Migration

Use the [JDBC Catalog](../lakehouse/catalogs/jdbc-catalog.md) with the PostgreSQL driver to connect to Greenplum and migrate data. For large tables, consider parallel export via `gpfdist` followed by file-based loading into Doris.

## Data Lake (Hive, Iceberg, Hudi) {#data-lake}

Doris's Multi-Catalog feature provides native integration with data lake table formats.

### Hive

Use the [Hive Catalog](../lakehouse/catalogs/hive-catalog.md) to directly query and migrate data from Hive. Supports both HDFS and S3-based storage.

### Iceberg

Use the [Iceberg Catalog](../lakehouse/catalogs/iceberg-catalog.md) to query and migrate Iceberg tables. Supports HMS and REST catalog types, as well as time travel queries.

### Hudi

Use the Hive Catalog to query and migrate Hudi tables (read-optimized view).

## Spark/Flink Connector Migration

For systems not directly supported by catalogs, use the [Spark Doris Connector](../ecosystem/spark-doris-connector.md) or [Flink Doris Connector](../ecosystem/flink-doris-connector.md) to read from any Spark/Flink-supported source and write to Doris.

## Schema Design Principles

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

## Next Steps

- [Lakehouse Overview](../lakehouse/lakehouse-overview.md) - Multi-Catalog capabilities
- [Hive Catalog](../lakehouse/catalogs/hive-catalog.md) - Hive integration details
- [Iceberg Catalog](../lakehouse/catalogs/iceberg-catalog.md) - Iceberg integration
- [Spark Doris Connector](../ecosystem/spark-doris-connector.md) - Spark integration
- [Flink Doris Connector](../ecosystem/flink-doris-connector.md) - Flink integration
