---
{
    "title": "PostgreSQL to Doris",
    "language": "en",
    "description": "Migrate PostgreSQL in batches with JDBC and choose CDC, type mappings, and validation."
}
---

This guide uses the PostgreSQL JDBC Catalog to copy a stable snapshot into a Doris internal table. It suits one-time or scheduled batch migration and does not automatically propagate later updates, deletes, or DDL. See the CDC options below for continuous synchronization.

## Prerequisites

- A PostgreSQL database named `migration_source` and a source account with SELECT access to the sample table.
- Connectivity from every Doris FE/BE to the source. Install `postgresql-42.5.6.jar` following the [PostgreSQL Catalog](../lakehouse/catalogs/jdbc-pg-catalog.md) and [driver deployment](../lakehouse/catalogs/jdbc-catalog-overview.md) references. The example uses a driver filename, so the Jar must exist in `jdbc_drivers_dir` on all FE/BE nodes.
- A Doris account with permissions to create catalogs/databases/tables, read the external table, and load the target. See [authorization](../admin-manual/auth/authorization/internal.md).
- Run the source setup inside `migration_source`; use an empty target table. Replace the sample hosts, username, and password.

## Basic usage

### 1. Prepare the source table

Prepare this sample in the source database using an account with CREATE and INSERT privileges. The catalog connection uses the source read account described above.

```sql
CREATE TABLE public.migration_demo (
    id BIGINT PRIMARY KEY,
    amount DECIMAL(12,2),
    note VARCHAR(100)
);
INSERT INTO public.migration_demo VALUES (1, 12.50, 'first'), (2, NULL, NULL);
```

Result: the table is created with 2 rows.

### 2. Create and inspect the catalog in Doris

```sql
CREATE CATALOG migration_pg PROPERTIES (
    'type' = 'jdbc',
    'user' = 'migration_reader',
    'password' = '<source_password>',
    'jdbc_url' = 'jdbc:postgresql://pg-host:5432/migration_source',
    'driver_url' = 'postgresql-42.5.6.jar',
    'driver_class' = 'org.postgresql.Driver'
);
DESC migration_pg.public.migration_demo;
```

The external schema should contain `id`, `amount`, and `note`. Inspect their actual mapped types before creating the target.

### 3. Create the target and copy the data

```sql
CREATE DATABASE IF NOT EXISTS migration_target;
CREATE TABLE migration_target.pg_demo (
    id BIGINT NOT NULL,
    amount DECIMAL(12,2),
    note STRING
)
DUPLICATE KEY(id)
DISTRIBUTED BY HASH(id) BUCKETS 1
PROPERTIES ('replication_num' = '1');

INSERT INTO migration_target.pg_demo (id, amount, note)
SELECT id, amount, note FROM migration_pg.public.migration_demo;

SELECT id, amount, note FROM migration_target.pg_demo ORDER BY id;
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

- JDBC maps PostgreSQL `json/jsonb` to `STRING`, not automatically to `VARIANT`. Convert explicitly and validate if the target uses another type.
- The catalog uses string mappings for PostgreSQL `time`, `timetz`, and `interval`. This does not mean that Doris lacks a TIME type.
- `numeric` without usable precision, or outside the supported decimal range, may map to `STRING`. Inspect the external type before numeric calculations.
- In the 4.1 series since 4.1.5, `timestamptz` maps to `TIMESTAMPTZ` and `bytea` to `VARBINARY`; earlier mappings and configuration differ. Dev uses the current mapping. Verify time zones, precision, and byte-for-byte binary equality.
- Array dimension inference needs source data and can report an unsupported type when no usable data exists. Validate each column against the [PostgreSQL mapping reference](../lakehouse/catalogs/jdbc-pg-catalog.md).

## Continuous synchronization

Use [Flink CDC synchronization](../connection-integration/data-integration/flink-doris-connector.md) when the migration must hand off an initial snapshot and propagate later updates/deletes. Choose compatible Flink, CDC, and Doris Connector versions from the connector reference rather than combining independent minimum-version claims.

## Validation and errors

For the same snapshot and bounded range, run `COUNT(*)`, `COUNT(amount)`, and `SUM(amount)` on source `migration_pg.public.migration_demo` and target `migration_target.pg_demo`. This example should return `2`, `1`, and `12.50`, respectively. Also inspect exact sample values, NULLs, precision, and time zones. See [Migration Overview](./overview.md) for full validation and cutover.

For connection failures, check connectivity from all FE/BE nodes, driver files, source permissions, and driver-location restrictions. Inspect `DESC` and convert explicitly for incompatible types. After a failed import, establish which ranges were written before retrying; do not blindly repeat the entire INSERT.

## Best practices

Validate the environment with this small table, then batch larger migrations by stable keys or time ranges. Continuous replication needs a target model that handles updates, deletes, and replay; design snapshot tables and ongoing mirrors separately.
