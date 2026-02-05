---
{
    "title": "Migration Overview",
    "language": "en",
    "description": "Guide to migrating data from various databases and data systems to Apache Doris"
}
---

Apache Doris provides multiple methods to migrate data from various source systems. This guide helps you choose the best migration approach based on your source system and requirements.

## Migration Paths

| Source System | Recommended Method | Real-time Sync | Full Migration | Incremental |
|---------------|-------------------|----------------|----------------|-------------|
| [PostgreSQL](./postgresql-to-doris.md) | JDBC Catalog / Flink CDC | Yes | Yes | Yes |
| [MySQL](./mysql-to-doris.md) | Flink CDC / JDBC Catalog | Yes | Yes | Yes |
| [Elasticsearch](./elasticsearch-to-doris.md) | ES Catalog | No | Yes | Manual |
| [ClickHouse](./other-olap-to-doris.md#clickhouse) | JDBC Catalog | No | Yes | Manual |
| [Greenplum](./other-olap-to-doris.md#greenplum) | JDBC Catalog | No | Yes | Manual |
| [Hive/Iceberg/Hudi](./other-olap-to-doris.md#data-lake) | Multi-Catalog | No | Yes | Yes |

## Choosing a Migration Method

### Catalog-Based Migration (Recommended)

Doris's [Multi-Catalog](../lakehouse/lakehouse-overview.md) feature allows you to directly query external data sources without data movement. This is the recommended approach for:

- **Initial exploration**: Query source data before deciding on migration strategy
- **Hybrid queries**: Join data across Doris and external sources
- **Incremental migration**: Gradually move data while keeping source accessible

```sql
-- Create a catalog to connect to your source
CREATE CATALOG pg_catalog PROPERTIES (
    'type' = 'jdbc',
    'user' = 'username',
    'password' = 'password',
    'jdbc_url' = 'jdbc:postgresql://host:5432/database',
    'driver_url' = 'postgresql-42.5.6.jar',
    'driver_class' = 'org.postgresql.Driver'
);

-- Query source data directly
SELECT * FROM pg_catalog.schema_name.table_name LIMIT 10;

-- Migrate data with INSERT INTO SELECT
INSERT INTO doris_db.doris_table
SELECT * FROM pg_catalog.schema_name.source_table;
```

### Flink CDC (Real-time Synchronization)

[Flink CDC](../ecosystem/flink-doris-connector.md) is ideal for:

- **Real-time data sync**: Capture changes as they happen
- **Full database migration**: Sync entire databases with automatic table creation
- **Zero-downtime migration**: Keep source and Doris in sync during transition

### Export-Import Method

For scenarios where direct connectivity is limited:

1. Export data from source system to files (CSV, Parquet, JSON)
2. Stage files in object storage (S3, GCS, HDFS)
3. Load into Doris using [S3 Load](../data-operate/import/data-source/amazon-s3.md) or [Broker Load](../data-operate/import/import-way/broker-load-manual.md)

## Migration Planning Checklist

Before migrating, consider the following:

1. **Data Volume Assessment**
   - Total data size and row count
   - Daily/hourly data growth rate
   - Historical data retention requirements

2. **Schema Design**
   - Choose appropriate [Data Model](../table-design/data-model/overview.md) (Duplicate, Unique, Aggregate)
   - Plan [Partitioning](../table-design/data-partitioning/data-distribution.md) strategy
   - Define [Bucketing](../table-design/data-partitioning/data-bucketing.md) keys

3. **Data Type Mapping**
   - Review type compatibility (see migration guides for specific mappings)
   - Handle special types (arrays, JSON, timestamps with timezone)

4. **Performance Requirements**
   - Query latency expectations
   - Concurrent query load
   - Data freshness requirements

5. **Migration Window**
   - Acceptable downtime (if any)
   - Sync vs. async migration needs

## Best Practices

### Start with a Pilot Table

Before migrating your entire database, test with a representative table:

```sql
-- 1. Create the Doris table with appropriate schema
CREATE TABLE pilot_table (
    id INT,
    created_at DATETIME,
    data VARCHAR(255)
)
UNIQUE KEY(id)
DISTRIBUTED BY HASH(id) BUCKETS 8;

-- 2. Migrate data
INSERT INTO pilot_table
SELECT id, created_at, data
FROM source_catalog.db.source_table;

-- 3. Validate row counts
SELECT COUNT(*) FROM pilot_table;
SELECT COUNT(*) FROM source_catalog.db.source_table;
```

### Batch Large Migrations

For tables with billions of rows, migrate in batches:

```sql
-- Migrate by date range
INSERT INTO doris_table
SELECT * FROM source_catalog.db.source_table
WHERE created_at >= '2024-01-01' AND created_at < '2024-02-01';
```

### Monitor Migration Progress

Track load jobs using:

```sql
-- Check active load jobs
SHOW LOAD WHERE STATE = 'LOADING';

-- Check recent load history
SHOW LOAD ORDER BY CreateTime DESC LIMIT 10;
```

## Next Steps

Choose your source system to see detailed migration instructions:

- [PostgreSQL to Doris](./postgresql-to-doris.md)
- [MySQL to Doris](./mysql-to-doris.md)
- [Elasticsearch to Doris](./elasticsearch-to-doris.md)
- [Other OLAP Systems to Doris](./other-olap-to-doris.md)
