---
{
    "title": "Other OLAP Systems to Doris",
    "language": "en",
    "description": "Choose migration routes and validation for ClickHouse, Greenplum, and lakehouse tables."
}
---

ClickHouse, Greenplum, and lakehouse tables can be copied to Doris through their corresponding catalogs. Define snapshot, update, and aggregation semantics before selecting a target model; source storage engines do not have automatic, complete Doris equivalents.

## Routes and prerequisites

| Source | Connection and options reference | Checks before migration |
| --- | --- | --- |
| ClickHouse | [ClickHouse JDBC Catalog](../lakehouse/catalogs/jdbc-clickhouse-catalog.md) | Drivers, unsigned integers, date-time and complex-type mappings |
| Greenplum | [PostgreSQL JDBC Catalog](../lakehouse/catalogs/jdbc-pg-catalog.md) | Compatible driver, actual metadata, and consistency of distributed exports |
| Hive | [Hive Catalog](../lakehouse/catalogs/hive-catalog.mdx) | Metastore, file storage, authentication, and partitions |
| Iceberg | [Iceberg Catalog](../lakehouse/catalogs/iceberg-catalog.mdx) | Metadata service, storage permissions, and a consistent snapshot |
| Hudi | [Hudi Catalog](../lakehouse/catalogs/hudi-catalog.md) | Table type, visible view, underlying files, and query limitations |

Every FE/BE must reach the required services, drivers, and storage. Configure a catalog following its reference and use a Doris account allowed to read the external table and create/load the target.

## ClickHouse {#clickhouse}

Use the JDBC Catalog and explicit columns in `INSERT INTO ... SELECT`. Run `DESC` first; suggested target designs are not the actual JDBC mappings. For example, the catalog does not promise a direct CHAR mapping for ClickHouse `FixedString`; test Map/Tuple and other complex-type support for the actual driver and Doris version.

For `ReplacingMergeTree`, `CollapsingMergeTree`, and aggregate-state tables, establish the final visible rows, version columns, deletion markers, and merge rules. A Doris Unique Key table does not automatically reproduce all source-engine semantics. Test SQL differences involving NULLs, tied extrema, array expansion, and JSON string extraction.

## Greenplum {#greenplum}

Follow the batch workflow in [PostgreSQL migration](./postgresql-to-doris.md), checking the actual Greenplum mappings. Parallel exports and SQL batches must share a consistent source view; concurrency alone does not establish a cross-table snapshot.

## Data lake {#data-lake}

Use the respective Hive, Iceberg, and Hudi catalogs. Pin the intended Iceberg snapshot during migration. For Hudi, establish which view is read and which table types the deployed version supports. Creating a catalog only makes external data accessible; it does not create a Doris copy.

## Basic usage

Assume `source_catalog` is configured as described above and `analytics.migration_demo` contains `id BIGINT` and `value DECIMAL(12,2)`, with a fixed source snapshot. Verify these types with `DESC`, then run in Doris:

```sql
CREATE DATABASE IF NOT EXISTS migration_target;
CREATE TABLE migration_target.olap_demo (
    id BIGINT,
    `value` DECIMAL(12,2)
)
DUPLICATE KEY(id)
DISTRIBUTED BY HASH(id) BUCKETS 1
PROPERTIES ('replication_num' = '1');

INSERT INTO migration_target.olap_demo (id, `value`)
SELECT id, `value` FROM source_catalog.analytics.migration_demo;

SELECT COUNT(*), SUM(`value`) FROM source_catalog.analytics.migration_demo;
SELECT COUNT(*), SUM(`value`) FROM migration_target.olap_demo;
```

Expected result: the empty target receives both selected columns from the source snapshot, and the two validation queries return equal row counts and sums. One replica and one bucket are illustrative; size production tables for resources and reliability. See [MySQL](./mysql-to-doris.md) or [PostgreSQL](./postgresql-to-doris.md) for a complete fixed-input example.

## Other loading methods

If a direct connection is unavailable, export supported files and use [S3 Load](../data-operate/import/data-source/amazon-s3.md) or [Broker Load](../data-operate/import/import-way/broker-load-manual.md). Establish file formats, encoding, NULL representation, precision, and time zones before scaling the import.

You can also use the [Spark Connector](../connection-integration/data-integration/spark-doris-connector.md) or [Flink Connector](../connection-integration/data-integration/flink-doris-connector.md). Follow each connector's reference for batch/streaming capabilities, compatible versions, and semantics.

## Errors and best practices

Validate bounded samples before increasing batch sizes or concurrency. Convert unsupported types explicitly and inspect precision loss rather than skipping columns. Repeating INSERT into a Duplicate Key target appends duplicate rows; establish completed ranges before resuming. Complete the cross-system checks in [Migration Overview](./overview.md) before cutover and retain source data and a rollback route.
