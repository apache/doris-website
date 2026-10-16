---
{
    "title": "Migration Overview",
    "language": "en",
    "description": "Choose a migration method, design target tables, and validate the result."
}
---

Apache Doris supports migration through external catalogs, CDC tools, and file loading. Copying table data does not migrate source transactions, indexes, constraints, procedures, permissions, or SQL semantics. First decide whether you need a one-time snapshot or continuous propagation of updates and deletes.

## Migration paths

| Source | One-time or batch migration | Continuous synchronization |
| --- | --- | --- |
| [PostgreSQL](./postgresql-to-doris.md) | PostgreSQL JDBC Catalog + `INSERT INTO ... SELECT` | Flink CDC; native Streaming Jobs are also available in dev |
| [MySQL](./mysql-to-doris.md) | MySQL JDBC Catalog + `INSERT INTO ... SELECT` | Flink CDC; native Streaming Jobs are also available in dev |
| [Elasticsearch](./elasticsearch-to-doris.md) | ES Catalog + `INSERT INTO ... SELECT` | Design change capture, updates, and deletion handling separately |
| [ClickHouse / Greenplum](./other-olap-to-doris.md) | The corresponding JDBC Catalog or file loading | Depends on the source system |
| [Hive / Iceberg / Hudi](./other-olap-to-doris.md#data-lake) | The corresponding lakehouse catalog + `INSERT INTO ... SELECT` | Scheduled batches or an appropriate connector |

A catalog makes external data queryable; creating one does not copy data into Doris internal tables. A batch `INSERT INTO ... SELECT` does not continuously capture later updates or deletes.

## Basic workflow

1. Verify connectivity from every FE/BE, driver deployment, source read permissions, and Doris permissions to create catalogs/tables and load data.
2. Establish a stable source snapshot or a write-free window. Catalog queries across tables or batches do not automatically form a globally consistent snapshot.
3. Inspect actual mappings with `DESC catalog.database.table` and design the target using an appropriate [data model](../table-design/data-model/intro.mdx). Do not directly copy source keys, engines, or indexes.
4. Complete a small pilot migration. The MySQL and PostgreSQL guides include reproducible table setup, imports, and query results.
5. Import bounded key or time ranges, record completed ranges and CDC positions, validate the result, and then switch read traffic.

## Configuration and types

| Item | What to verify |
| --- | --- |
| Catalog | Drivers, connection addresses, authentication, and driver-location controls; see [JDBC Catalog](../lakehouse/catalogs/jdbc-catalog-overview.md) or [ES Catalog](../lakehouse/catalogs/es-catalog.md) |
| Target table | Key model, partitions, buckets, replicas, and update ordering |
| Type mapping | Mapping depends on the import method, driver, and Doris version; JDBC mappings are not CDC mappings |
| Time and binary data | Check time zones, microsecond precision, and byte preservation. Some JDBC mappings changed in 4.1.5; use the reference for the deployed version |
| Incremental synchronization | Snapshot/log-position handoff, primary keys, replay, updates, and deletes |

## Validation and cutover

For the same source snapshot and bounded range, compare row counts, distinct keys, NULL counts, numeric sums, and extrema. Sample exact values for timestamps, decimals, binary data, arrays, and semi-structured columns. Matching row counts alone do not prove correctness.

For continuous synchronization, test inserts, updates, and deletes, as well as lag and restart behavior. Switch application reads only after verification, retaining source data and a rollback route.

## Errors and caveats

- Repeating a batch INSERT may duplicate rows, particularly in Duplicate Key tables. Define a replay strategy before resuming. A Unique Key table does not automatically remove rows deleted at the source.
- Source changes during multiple batches can cause gaps or duplication. Use a consistent snapshot, a write-free window, or a reliable CDC handoff.
- For unsupported types, case differences, or precision changes, inspect the external table with `DESC`, convert explicitly, and validate again. Do not silently omit incompatible columns.
- Synchronous INSERT, asynchronous load jobs, Flink, and Streaming Jobs use different status interfaces. Follow the relevant loading reference rather than relying on `SHOW LOAD` for every method.

## Best practices

Start with representative small tables, then size batches and concurrency for measured data volume, query load, and available resources. Verify query results and update semantics before cutover, and retain completed ranges and validation records.
