---
{
    "title": "Migration Overview",
    "language": "en",
    "description": "Guide to migrating data from various databases and data systems to Apache Doris"
}
---

Apache Doris provides multiple methods to migrate data from various source systems. This guide helps you choose the best migration approach based on your source system and requirements.

## Migration Paths

| Source System | Migration Method | Sync Modes |
|---------------|-------------------|------------|
| [PostgreSQL](./postgresql-to-doris.md) | Streaming Job / JDBC Catalog / Flink CDC | Full, CDC |
| [MySQL](./mysql-to-doris.md) | Streaming Job / JDBC Catalog / Flink CDC | Full, CDC |
| [Elasticsearch](./elasticsearch-to-doris.md) | ES Catalog | Full |
| [ClickHouse](./other-olap-to-doris.md#clickhouse) | JDBC Catalog | Full |
| [Greenplum](./other-olap-to-doris.md#greenplum) | JDBC Catalog | Full |
| [Hive/Iceberg/Hudi](./other-olap-to-doris.md#data-lake) | Multi-Catalog | Full, Batch Incremental |

## Choosing a Migration Method

### Catalog-Based Migration

Doris's [Multi-Catalog](../lakehouse/lakehouse-overview.md) feature allows you to directly query external data sources without data movement. This approach is suited for:

- **Initial exploration**: Query source data before deciding on migration strategy
- **Hybrid queries**: Join data across Doris and external sources
- **Incremental migration**: Gradually move data while keeping source accessible

### Streaming Job (Built-in CDC Sync)

Doris's built-in [Streaming Job](../data-operate/import/streaming-job/streaming-job-multi-table.md) can directly synchronize full and incremental data from MySQL and PostgreSQL without external tools. It reads binlog/WAL natively, auto-creates target tables, and keeps data in sync — all with a single SQL command.

- **No external dependencies**: No Flink cluster or other middleware required
- **Full + incremental sync**: Initial snapshot followed by continuous CDC
- **Multi-table support**: Sync multiple tables in one job

### Flink CDC (Real-time Synchronization)

[Flink CDC](../ecosystem/flink-doris-connector.md) provides CDC-based sync via an external Flink cluster. Choose this over Streaming Job when you need:

- **Schema evolution**: Automatic DDL propagation
- **Complex transformations**: Flink SQL processing during sync
- **Broader source support**: Sources beyond MySQL/PostgreSQL

### Export-Import Method

For scenarios where direct connectivity is limited:

1. Export data from source system to files (CSV, Parquet, JSON)
2. Stage files in object storage (S3, GCS, HDFS)
3. Load into Doris using [S3 Load](../data-operate/import/data-source/amazon-s3.md) or [Broker Load](../data-operate/import/import-way/broker-load-manual.md)

## Migration Planning Principles

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

## Best Practices

- **Start with a pilot table**: Before migrating your entire database, test with a representative table to validate schema design, type mappings, and data correctness.
- **Batch large migrations**: For tables with billions of rows, migrate in batches (e.g., by date range) to manage resource usage and allow for validation between batches.
- **Monitor migration progress**: Use `SHOW LOAD` to track active and completed load jobs.
- **Validate after migration**: Compare row counts, spot-check records, and verify data types between source and target.

## Next Steps

Choose your source system to see detailed migration instructions:

- [PostgreSQL to Doris](./postgresql-to-doris.md)
- [MySQL to Doris](./mysql-to-doris.md)
- [Elasticsearch to Doris](./elasticsearch-to-doris.md)
- [Other OLAP Systems to Doris](./other-olap-to-doris.md)
