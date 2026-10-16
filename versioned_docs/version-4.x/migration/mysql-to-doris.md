---
{
    "title": "MySQL to Doris",
    "language": "en",
    "description": "Migrate MySQL in batches with JDBC and choose CDC, type mappings, and validation."
}
---

This guide uses the MySQL JDBC Catalog to copy a stable snapshot into a Doris internal table. It suits one-time or scheduled batch migration and does not automatically propagate later updates, deletes, or DDL. See the CDC options below for continuous synchronization.

## Prerequisites

- A MySQL database named `migration_source` and a source account with SELECT access to the sample table.
- Connectivity from every Doris FE/BE to the source. Install `mysql-connector-j-8.3.0.jar` following the [MySQL Catalog](../lakehouse/catalogs/jdbc-mysql-catalog.md) and [driver deployment](../lakehouse/catalogs/jdbc-catalog-overview.md) references. The example uses a driver filename, so the Jar must exist in `jdbc_drivers_dir` on all FE/BE nodes.
- A Doris account with permissions to create catalogs/databases/tables, read the external table, and load the target. See [authorization](../admin-manual/auth/authorization/internal.md).
- Run the source setup inside `migration_source`; use an empty target table. Replace the sample hosts, username, and password.

## Basic usage

### 1. Prepare the source table

Prepare this sample in the source database using an account with CREATE and INSERT privileges. The catalog connection uses the source read account described above.

```sql
CREATE TABLE migration_demo (
    id BIGINT PRIMARY KEY,
    amount DECIMAL(12,2),
    note VARCHAR(100)
);
INSERT INTO migration_demo VALUES (1, 12.50, 'first'), (2, NULL, NULL);
```

Result: the table is created with 2 rows.

### 2. Create and inspect the catalog in Doris

```sql
CREATE CATALOG migration_mysql PROPERTIES (
    'type' = 'jdbc',
    'user' = 'migration_reader',
    'password' = '<source_password>',
    'jdbc_url' = 'jdbc:mysql://mysql-host:3306/migration_source',
    'driver_url' = 'mysql-connector-j-8.3.0.jar',
    'driver_class' = 'com.mysql.cj.jdbc.Driver'
);
DESC migration_mysql.migration_source.migration_demo;
```

The external schema should contain `id`, `amount`, and `note`. Inspect their actual mapped types before creating the target.

### 3. Create the target and copy the data

```sql
CREATE DATABASE IF NOT EXISTS migration_target;
CREATE TABLE migration_target.mysql_demo (
    id BIGINT NOT NULL,
    amount DECIMAL(12,2),
    note STRING
)
DUPLICATE KEY(id)
DISTRIBUTED BY HASH(id) BUCKETS 1
PROPERTIES ('replication_num' = '1');

INSERT INTO migration_target.mysql_demo (id, amount, note)
SELECT id, amount, note FROM migration_mysql.migration_source.migration_demo;

SELECT id, amount, note FROM migration_target.mysql_demo ORDER BY id;
```

```text
+------+--------+-------+
| id   | amount | note  |
+------+--------+-------+
|    1 |  12.50 | first |
|    2 |   NULL | NULL  |
+------+--------+-------+
```

One replica and one bucket keep the example suitable for local verification. Size production tables for available BEs and reliability requirements. Repeating the INSERT appends duplicate rows.
## Connection options

| Parameter | Type | Required / default | Description |
| --- | --- | --- | --- |
| `type` | STRING | Required, no default | Use `jdbc` |
| `user` / `password` | STRING | Required, no default | Source database credentials |
| `jdbc_url` | STRING | Required, no default | Source JDBC connection URL, including the database name |
| `driver_url` | STRING | Required, no default | Jar accessible to every FE/BE; this example uses a preinstalled filename |
| `driver_class` | STRING | Required, no default | Java class for the selected driver |

See the [full JDBC reference](../lakehouse/catalogs/jdbc-catalog-overview.md) for connection pools, name mapping, and driver-location controls.

## Types and version differences {#data-type-mapping}

- Widen unsigned integers: for example, `INT UNSIGNED` maps to `BIGINT` and `BIGINT UNSIGNED` to `LARGEINT`. Do not copy their signed equivalents unchanged.
- The MySQL JDBC Catalog maps JSON to `STRING`, not automatically to `VARIANT`. Follow catalog mappings for `TIME`, `ENUM`, and `SET`; JDBC and CDC do not necessarily use the same rules.
- JDBC metadata for `TINYINT(1)` depends on driver settings. Inspect `DESC` rather than treating every TINYINT as Boolean.
- In the 4.1 series since 4.1.5, `TIMESTAMP` uses `TIMESTAMPTZ` and binary types use `VARBINARY`; `DATETIME` remains a time-zone-free date-time. Earlier mappings and configuration differ. Dev uses the current mapping.
- Batch INSERT does not copy primary-key behavior, AUTO_INCREMENT, indexes, or source constraints. See the [MySQL mapping reference](../lakehouse/catalogs/jdbc-mysql-catalog.md) for complete rules.

## Continuous synchronization

Use [Flink CDC synchronization](../connection-integration/data-integration/flink-doris-connector.md) when the migration must hand off an initial snapshot and propagate later updates/deletes. Choose compatible Flink, CDC, and Doris Connector versions from the connector reference rather than combining independent minimum-version claims.

## Validation and errors

For the same snapshot and bounded range, run `COUNT(*)`, `COUNT(amount)`, and `SUM(amount)` on source `migration_mysql.migration_source.migration_demo` and target `migration_target.mysql_demo`. This example should return `2`, `1`, and `12.50`, respectively. Also inspect exact sample values, NULLs, precision, and time zones. See [Migration Overview](./overview.md) for full validation and cutover.

For connection failures, check connectivity from all FE/BE nodes, driver files, source permissions, and driver-location restrictions. Inspect `DESC` and convert explicitly for incompatible types. After a failed import, establish which ranges were written before retrying; do not blindly repeat the entire INSERT.

## Best practices

Validate the environment with this small table, then batch larger migrations by stable keys or time ranges. Continuous replication needs a target model that handles updates, deletes, and replay; design snapshot tables and ongoing mirrors separately.
