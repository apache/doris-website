---
{
    "title": "PostgreSQL to Doris",
    "language": "en",
    "description": "Comprehensive guide to migrating data from PostgreSQL to Apache Doris"
}
---

This guide covers migrating data from PostgreSQL to Apache Doris. You can choose from several migration methods depending on your requirements for real-time sync, data volume, and operational complexity.

## Considerations

1. **Schema Design**: Before migration, select an appropriate Doris [Data Model](../table-design/data-model/overview.md) and plan your [Partitioning](../table-design/data-partitioning/data-distribution.md) and [Bucketing](../table-design/data-partitioning/data-bucketing.md) strategies.

2. **Data Types**: Review the type mapping table below. Some PostgreSQL types require special handling (arrays, timestamps with timezone, JSON).

3. **Primary Keys**: PostgreSQL's serial/identity columns map to Doris INT/BIGINT types. For unique constraints, use Doris's UNIQUE KEY model.

4. **Timezone Handling**: PostgreSQL `timestamptz` stores timestamps in UTC and converts to session timezone on read. Doris `DATETIME` does not carry timezone information. Convert timestamps explicitly during migration and ensure JVM timezone consistency in Doris BE (`be.conf`).

5. **Array Handling**: PostgreSQL arrays map to Doris ARRAY type, but dimension detection requires existing data. If array dimension cannot be determined, use explicit casting.

6. **JSON/JSONB**: PostgreSQL JSON/JSONB maps to Doris VARIANT type, which supports flexible schema and efficient JSON operations.

7. **Large Table Migration**: For tables with hundreds of millions of rows, partition the migration by time ranges or ID ranges, use multiple INSERT statements concurrently, and monitor Doris BE memory and disk usage.

## Data Type Mapping

| PostgreSQL Type | Doris Type | Notes |
|-----------------|------------|-------|
| boolean | BOOLEAN | |
| smallint / int2 | SMALLINT | |
| integer / int4 | INT | |
| bigint / int8 | BIGINT | |
| decimal / numeric | DECIMAL(P,S) | Numeric without precision maps to STRING |
| real / float4 | FLOAT | |
| double precision | DOUBLE | |
| smallserial | SMALLINT | |
| serial | INT | |
| bigserial | BIGINT | |
| char(n) | CHAR(N) | |
| varchar / text | STRING | |
| timestamp | DATETIME | |
| timestamptz | DATETIME | Converted to local timezone; see Timezone Handling above |
| date | DATE | |
| time | STRING | Doris does not support TIME type |
| interval | STRING | |
| json / jsonb | VARIANT | See [VARIANT type](../data-operate/import/complex-types/variant.md) for flexible schema |
| uuid | STRING | |
| bytea | STRING | |
| array | ARRAY | See Array Handling above |
| inet / cidr / macaddr | STRING | |
| point / line / polygon | STRING | Geometric types stored as strings |

## Migration Options

### Option 1: JDBC Catalog (Batch Migration)

The [JDBC Catalog](../lakehouse/catalogs/jdbc-catalog.md) provides direct access to PostgreSQL data from Doris. This is the simplest approach for both querying and migrating data.

**Prerequisites**: PostgreSQL 11.x or higher; [PostgreSQL JDBC Driver](https://jdbc.postgresql.org/) version 42.5.x or above; network connectivity between Doris FE/BE nodes and PostgreSQL (port 5432).

### Option 2: Flink CDC (Real-time Sync)

Flink CDC captures changes from PostgreSQL WAL (Write-Ahead Log) and streams them to Doris in real-time. This is ideal for continuous synchronization.

**Prerequisites**: PostgreSQL with logical replication enabled (`wal_level = logical`); Flink 1.15+ with Flink CDC and Flink Doris Connector; a replication slot in PostgreSQL.

For detailed setup, see the [Flink Doris Connector](../ecosystem/flink-doris-connector.md) documentation.

### Option 3: Streaming Job (Continuous File Loading)

Doris's built-in [Streaming Job](../data-operate/import/streaming-job.md) (`CREATE JOB ON STREAMING`) provides continuous file-based loading without external tools. Export PostgreSQL data to S3/object storage, and the Streaming Job automatically picks up new files and loads them into Doris.

This option is suited for:

- Continuous incremental migration via file export pipelines
- Environments where you prefer Doris-native features over external tools like Flink
- Scenarios where PostgreSQL data is periodically exported to object storage

**Prerequisites**: Data exported to S3-compatible object storage; Doris 2.1+ with Job Scheduler enabled.

For detailed setup, see the [Streaming Job](../data-operate/import/streaming-job.md) and [CREATE STREAMING JOB](../sql-manual/sql-statements/job/CREATE-STREAMING-JOB.md) documentation.

### Option 4: Export and Load

For air-gapped environments or when direct connectivity is not possible:

1. Export data from PostgreSQL to files (CSV, Parquet)
2. Upload to object storage (S3, HDFS)
3. Load into Doris using [S3 Load](../data-operate/import/data-source/amazon-s3.md) or [Broker Load](../data-operate/import/import-way/broker-load-manual.md)

## Validation Checklist

After migration, validate:

- Row counts match between source and target
- Sample records are identical
- Null values are preserved correctly
- Numeric precision is maintained
- Date/time values are correct (check timezone)
- Array and JSON fields are queryable

## Next Steps

- [Flink Doris Connector](../ecosystem/flink-doris-connector.md) - Detailed connector documentation
- [Loading Data](../data-operate/import/load-manual.md) - Alternative import methods
- [Data Model](../table-design/data-model/overview.md) - Choose the right table model
