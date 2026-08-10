---
{
    "title": "ADBC Catalog",
    "language": "en",
    "description": "Query Arrow Flight SQL and other external sources through an ADBC driver: Arrow-format transfer and parallel BE reads.",
    "keywords": [
        "ADBC Catalog",
        "Arrow Database Connectivity",
        "Arrow Flight SQL",
        "ADBC driver",
        "driver_url",
        "partitioned_read",
        "parallel reads",
        "predicate pushdown",
        "cross-cluster federated query",
        "Doris data integration",
        "ADBC vs JDBC"
    ]
}
---

<!-- Knowledge Type: Capability Definition + Configuration Reference -->
<!-- Applicable Scenarios: Cross-cluster federated query / External data source access / Data integration -->

## Overview

ADBC ([Arrow Database Connectivity](https://arrow.apache.org/adbc/)) is a database access interface defined by the Arrow ecosystem. **An ADBC Catalog reads an external data source through an ADBC driver: data crosses the network in Arrow format, and several BE nodes read it in parallel.**

Two things work differently than in a JDBC Catalog:

- Arrow-native transfer. Data crosses the network in Arrow format and Doris reads it directly, without the row-by-row, value-by-value conversion a JDBC catalog performs.
- Parallel reads. One scan is split by the driver's own result partitions and read by several BE nodes at once, instead of by a single BE node over one connection.

:::note
- This is an experimental feature, supported since version 5.0.0.
- Only read operations are supported. Writing to the external data source is not supported.
- Doris ships no ADBC driver. You deploy the driver library yourself, to the FE and to every BE node.
:::

The current phase targets Arrow Flight SQL data sources, including another Doris cluster, and replaces the [Doris Catalog](./doris-catalog.mdx). Another data source needs only its own ADBC driver library, plus a dialect implementation where its SQL differs from ANSI SQL.

### Differences from a JDBC Catalog

| Aspect | JDBC Catalog | ADBC Catalog |
| --- | --- | --- |
| Data transfer | Source rows become JDBC objects, then Doris data one value at a time | Data is transferred in Arrow format and read directly, with no per-value conversion |
| Read parallelism | One BE node over a single connection | Split by the driver's result partitions and read by several BE nodes |
| Driver form | A JDBC driver JAR, downloadable from a remote URL | An ADBC driver shared library (`.so`), referenced as a local file only |
| Write support | Write-back supported | Not supported yet |

## Applicable Scenarios

| Scenario | Description |
| --- | --- |
| Data integration | Read from the external data source into a Doris internal table, or run federated queries across internal tables and tables in other catalogs. Data is transferred in Arrow format and read in parallel by several BE nodes, which performs better than the JDBC path. |
| Writing back | Not supported. |

## Feature Overview

<!-- Knowledge Type: Capability Matrix -->

| Feature | Support | Description |
| --- | --- | --- |
| Metadata access | Supported | `SHOW DATABASES`, `SHOW TABLES`, `DESC`, `SHOW CREATE TABLE` and `information_schema` |
| Data query | Supported | Queries against external tables, plus joins, aggregation, `ORDER BY`, `UNION` and subqueries with internal tables and tables in other catalogs |
| Column pruning | Supported | Only the columns a query needs are requested from the data source |
| Predicate pushdown | Supported | Some scalar predicates become the remote `WHERE` clause |
| `LIMIT` pushdown | Supported | Applies once the whole `WHERE` clause has been pushed down |
| `COUNT(*)` optimization | Supported | No column data is read |
| Parallel reads | Supported | A scan is split by the driver's result partitions and read by several BE nodes |
| Type mapping | Supported | Automatic, including `ARRAY`, `MAP`, `STRUCT`, `DECIMAL`, dates, and timestamps with and without a time zone |
| Metadata cache | Supported | Cached for 10 minutes by default, cleared by any `REFRESH` statement |
| `SELECT INTO OUTFILE` | Supported | Query results can be exported to a file |
| Materialized views (MTMV) | Supported | An MTMV can be built and refreshed on an ADBC table |
| Writing to the data source | Not supported yet | `INSERT`, `CREATE TABLE`, `DROP TABLE` and other write statements are rejected |
| Statistics | Not supported yet | Statistics collection is unavailable |
| Aggregate pushdown | Not supported yet | Aggregation runs in Doris |

## Deploying the ADBC Driver

<!-- Knowledge Type: Deployment Steps -->

Doris ships no ADBC driver, so deploy the driver library to the cluster nodes before you create a catalog.

### Driver Placement Requirements

:::caution
At `CREATE CATALOG` the FE resolves `driver_url` into an absolute path and sends that path to the BEs unchanged. Each BE loads the driver from exactly that path. Therefore:

- The driver file must exist at the **same absolute path** on the FE and on **every** BE node.
- The FE and all BEs must load the **same build**. ADBC describes partition information in a driver-private format with no interoperability guarantee across driver implementations. Mixing driver versions may not raise an error at all; it may simply produce wrong results.
:::

The build output creates two driver directories:

- FE: `<FE_HOME>/plugins/adbc_drivers`
- BE: `<BE_HOME>/plugins/adbc_drivers`

FE and BE usually live under different deployment directories, so these two absolute paths are not the same. In a multi-node deployment, put the driver at one shared absolute path on every FE and BE node, for example `/opt/doris/adbc_drivers`, and point `drivers_dir` in the FE's `adbc.conf` at that directory.

### adbc.conf

The ADBC connector plugin reads its settings from `<DORIS_HOME>/plugins/connector/adbc/adbc.conf` on the FE. This file must exist on **every FE node**. Doris does not replicate it through catalog metadata, and an edit takes effect after an FE restart.

| Setting | Default | Description |
| --- | --- | --- |
| `drivers_dir` | `<DORIS_HOME>/plugins/adbc_drivers` | The directory a bare file name in `driver_url` resolves under. |
| `driver_secure_path` | `*` | Directories a driver may be loaded from, separated by semicolons (`;`). `*` or blank allows any directory. When set to concrete paths, a driver path is matched component by component, so neither path traversal nor prefix confusion (`/opt/drv` against `/opt/drv-evil`) can get around it. |

Example configuration:

```properties
drivers_dir=/opt/doris/adbc_drivers
driver_secure_path=/opt/doris/adbc_drivers
```

## Configuring Catalog

<!-- Knowledge Type: Configuration Parameters -->

### Syntax

```sql
CREATE CATALOG [IF NOT EXISTS] catalog_name PROPERTIES (
    'type' = 'adbc',
    'driver_url' = '<driver_url>',
    'uri' = '<connection_uri>',
    {DriverProperties},
    {ConnectionProperties},
    {ReadProperties},
    {DriverOptions},
    {CommonProperties}
);
```

* `<driver_url>`

    Required. The ADBC driver shared library, given as a **local reference only**. Three forms are accepted:

    | Form | Description |
    | --- | --- |
    | A bare file name | Resolved under the `drivers_dir` directory from `adbc.conf`. The name must match `[A-Za-z0-9._-]+.so`, optionally with a version suffix such as `.so.1`, and cannot contain a path separator. |
    | A `file://` URL | Carries no authority, query or fragment. |
    | An absolute path | The FE and every BE load the driver library from that path. |

    Remote schemes such as `http://` are rejected, because a per-node download cannot promise that every node ends up with the same driver build.

* `<connection_uri>`

    Required. The ADBC connection string.

    It **must pin one remote catalog**, for example `postgresql://host:5432/mydb`, because Doris maps ADBC's three naming levels onto its own two. See [Namespace Mapping](#namespace-mapping) for details.

* `{DriverProperties}`

    The DriverProperties section holds optional properties that control how the driver is loaded.

    | Property | Default | Description |
    | --- | --- | --- |
    | `driver_checksum` | Nothing is verified | MD5 of the driver library file, verified at `CREATE CATALOG`. |
    | `driver_entrypoint` | Empty | The driver's entry point symbol. When empty, the driver infers it. |

    `driver_checksum` catches the wrong driver build, or a stale copy on one node. Such a file usually loads without complaint and surfaces much later as a query failure that says nothing about a driver.

    :::caution
    `driver_checksum` verifies the FE's copy only, not the copies on the BEs.
    :::

* `{ConnectionProperties}`

    The ConnectionProperties section holds the credentials for the data source and the dialect used to generate pushdown SQL.

    | Property | Default | Description |
    | --- | --- | --- |
    | `user` | None | User name, passed to the driver as written. Whether it is required depends on the data source. |
    | `password` | None | Password, passed to the driver as written. Whether it is required depends on the data source. |
    | `sql_dialect` | Auto-detected | The dialect used to generate pushdown SQL. By default the driver reports the data source's vendor name and Doris picks a dialect from it. An unrecognized name gets `ansi`. |

    Set `sql_dialect` explicitly when the vendor name a data source reports is unhelpful, or when its SQL does not match what that name implies. Two dialects are built in:

    | Value | Description |
    | --- | --- |
    | `ansi` | Standard SQL. The default, and what an unrecognized data source gets. |
    | `doris` | Identical to `ansi` except that identifiers are quoted with backticks (`` ` ``). Doris reads a double-quoted name as a string literal, so ANSI quoting does not parse against a Doris data source at all. A data source whose vendor name starts with `doris`, case-insensitively, selects this dialect automatically. |

* `{ReadProperties}`

    The ReadProperties section controls parallel reads.

    | Property | Default | Description |
    | --- | --- | --- |
    | `partitioned_read` | `auto` | Parallel read mode. An invalid value raises an error rather than falling back to the default. |
    | `max_partitions` | `1024` | The largest number of partitions one scan may plan. |

    `partitioned_read` accepts three values:

    | Value | Description |
    | --- | --- |
    | `auto` | The default. Splits the scan when the driver can partition it, and reads it as a single statement when it cannot. |
    | `disabled` | Never asks for partitions. Asking is not free: on an Arrow Flight SQL data source the call that returns partitions **is** the query's execution, so planning costs one more remote round trip and the data source starts working before Doris has committed to running the query. Use this value to get back to single-statement reads when a data source pays too much for that, or when Doris cannot read the partitions it returns. |
    | `required` | The scan must be split, or the query fails and says why. Use it where parallelism must not be lost quietly. Under `auto`, a driver that stops partitioning still returns a successful query, and nothing in the result shows that it took the fallback path. |

    `max_partitions` is a guard rail against a pathological data source, not a tuning knob. Every partition costs some planning resource, and enough of them will exhaust the FE. Exceeding the limit fails the query instead of falling back to a single-statement read, because by that point the data source has already executed the query and a fallback would make it execute a second time.

* `{DriverOptions}`

    The DriverOptions section holds options passed straight through to the driver, written with an `adbc.` prefix.

    :::caution
    **The prefix is part of the option name and is not stripped.** ADBC's own option names already start with `adbc.`, for example `adbc.snowflake.sql.db`, so in `CREATE CATALOG` you write `adbc.adbc.snowflake.sql.db`.
    :::

    ```sql
    'adbc.adbc.snowflake.sql.db' = 'my_database'
    ```

* `{CommonProperties}`

    The CommonProperties section is used to fill in common properties. Refer to the Common Properties section of [Catalog Overview](../catalog-overview.md).

    For metadata cache properties, see [Metadata Cache](#meta-cache).

## Examples

<!-- Knowledge Type: Operational Examples -->

### Querying Another Doris Cluster

Read another Doris cluster through the Arrow Flight SQL driver. `uri` points at the Arrow Flight port of the target cluster's FE:

```sql
CREATE CATALOG remote_doris PROPERTIES (
    'type' = 'adbc',
    'driver_url' = 'libadbc_driver_flightsql.so',
    'uri' = 'grpc://remote-doris-fe:8070',
    'user' = 'root',
    'password' = '<password>'
);

SELECT id, name FROM remote_doris.some_db.some_table ORDER BY id LIMIT 10;
```

`driver_url` here is a bare file name, resolved under `drivers_dir` from `adbc.conf`.

### Using an Absolute Path and Pinning the Driver Build

Reference the driver by absolute path, and pin the FE's copy with `driver_checksum`:

```sql
CREATE CATALOG remote_source PROPERTIES (
    'type' = 'adbc',
    'driver_url' = '/opt/doris/adbc_drivers/libadbc_driver_flightsql.so',
    'driver_checksum' = 'd41d8cd98f00b204e9800998ecf8427e',
    'uri' = 'grpc+tls://remote-host:8070',
    'user' = 'analyst',
    'password' = '<password>'
);
```

### Setting the Dialect and Requiring Parallel Reads

Use the `doris` dialect against a Doris data source, and require the scan to be split so that parallelism is never lost quietly:

```sql
CREATE CATALOG remote_doris_parallel PROPERTIES (
    'type' = 'adbc',
    'driver_url' = 'libadbc_driver_flightsql.so',
    'uri' = 'grpc://remote-doris-fe:8070',
    'user' = 'root',
    'password' = '<password>',
    'sql_dialect' = 'doris',
    'partitioned_read' = 'required',
    'max_partitions' = '256'
);
```

### Disabling Parallel Reads

Turn parallel reads off when the data source pays too much for the partition request that happens before the query runs:

```sql
CREATE CATALOG remote_source_single PROPERTIES (
    'type' = 'adbc',
    'driver_url' = 'libadbc_driver_flightsql.so',
    'uri' = 'grpc://remote-host:8070',
    'user' = 'root',
    'password' = '<password>',
    'partitioned_read' = 'disabled'
);
```

## Namespace Mapping

<!-- Knowledge Type: Behavior Rules -->

ADBC names objects in three levels (catalog / db_schema / table), while a Doris external table has two (database / table). The outermost name is already spent on the catalog you created, so one remote level has to be dropped from the name:

- `uri` must pin one remote catalog. At most one of the two remote levels then varies, and Doris never has to join two names into a single database name.
- When the remote `db_schema` is non-empty, the Doris database name is that `db_schema`. Otherwise it is the remote catalog name.

| Remote (catalog, db_schema) | Doris database name |
| --- | --- |
| `mydb`, `public` | `public` |
| `mydb`, empty | `mydb` |

If the data source reports an object with neither a catalog name nor a db_schema name, Doris cannot address it as a database and raises an error.

If `uri` does not pin a remote catalog, Doris reports this at `CREATE CATALOG` and asks you to name the remote catalog in the uri, such as `postgresql://host:5432/mydb`, or through a driver option. Some drivers do not implement the interface Doris uses for that check. Their catalogs are accepted as written, and the problem surfaces at the first `SHOW DATABASES`.

## Column Type Mapping

<!-- Knowledge Type: Type Reference -->

Doris maps the Arrow types the data source returns.

| Arrow type | Doris type | Comment |
| --- | --- | --- |
| `bool` | `BOOLEAN` | |
| `int8` | `TINYINT` | |
| `int16` | `SMALLINT` | |
| `int32` | `INT` | |
| `int64` | `BIGINT` | |
| `uint8` | `SMALLINT` | Unsigned integers widen by one step |
| `uint16` | `INT` | Unsigned integers widen by one step |
| `uint32` | `BIGINT` | Unsigned integers widen by one step |
| `uint64` | `LARGEINT` | Unsigned integers widen by one step |
| `float16`, `float32` | `FLOAT` | |
| `float64` | `DOUBLE` | |
| `decimal128(P,S)` | `DECIMAL(P,S)` | Maximum precision 38; beyond that the column is rejected |
| `decimal256(P,S)` | `DECIMAL(P,S)` | Maximum precision 76; beyond that the column is rejected |
| `date32(day)` | `DATE` | |
| `date64(ms)` | `DATETIME(3)` | `date64` carries a time of day, which `DATE` would drop |
| `timestamp(s)` without time zone | `DATETIME(0)` | |
| `timestamp(ms)` without time zone | `DATETIME(3)` | |
| `timestamp(us)`, `timestamp(ns)` without time zone | `DATETIME(6)` | Nanosecond precision is truncated to microseconds |
| `timestamp` with time zone | `TIMESTAMPTZ(0-6)` | Same precision rules. A zoned Arrow timestamp is an instant, and `DATETIME` would drop the zone |
| `utf8`, `large_utf8`, `utf8_view` | `STRING` | |
| `binary`, `large_binary`, `binary_view`, `fixed_size_binary` | `STRING` | Doris has no general binary column type on the external table path |
| `list`, `large_list`, `fixed_size_list`, `list_view`, `large_list_view` | `ARRAY` | Element type is mapped recursively |
| `struct` | `STRUCT` | Field types are mapped recursively, and **field names are lowercased** |
| `map` | `MAP` | Key and value types are mapped recursively |
| `dictionary` | Mapped by the dictionary's value type | |
| `run_end_encoded` | Mapped by the value type | |
| Others | Unsupported | |

:::note
- Doris has no unsigned integer types, so an unsigned type widens by one step. `uint32` maps to `BIGINT` rather than `INT`, because the narrower type would silently wrap every value above 2^31 into a negative number.
- When a type cannot be mapped, Doris raises an error while describing the table and names the column and its Arrow type, rather than mapping it to something lossy. Cast the column on the source side, or leave it out of the query.
- Reading from a Doris data source, an `IPV4` column arrives as `INT` because both sides encode it as int32, and a source `DATETIME` column arrives as `TIMESTAMPTZ`.
:::

## Query Operations

<!-- Knowledge Type: Operational Examples + Behavior Rules -->

### Basic Query

Once the catalog is configured, query its tables in any of these ways:

```sql
-- 1. switch to catalog, use database and query
SWITCH adbc_ctl;
USE adbc_db;
SELECT * FROM adbc_tbl LIMIT 10;

-- 2. use adbc database directly
USE adbc_ctl.adbc_db;
SELECT * FROM adbc_tbl LIMIT 10;

-- 3. use full qualified name to query
SELECT * FROM adbc_ctl.adbc_db.adbc_tbl LIMIT 10;
```

### Metadata Operations

```sql
SHOW DATABASES FROM adbc_ctl;

SHOW TABLES FROM adbc_ctl.adbc_db;

DESC adbc_ctl.adbc_db.adbc_tbl;

SHOW CREATE TABLE adbc_ctl.adbc_db.adbc_tbl;
```

Database and table listings are always read live, so a table created on the data source is visible without any `REFRESH`. Table schemas are cached; see [Metadata Cache](#meta-cache).

:::note
Views on the data source are not listed as tables.
:::

### Data Integration

You can write data from the external source into a Doris internal table:

```sql
INSERT INTO internal.demo.local_tbl
SELECT * FROM adbc_ctl.adbc_db.adbc_tbl;
```

Federated queries with internal tables and tables in other catalogs also work, as do `SELECT ... INTO OUTFILE` and materialized views (MTMV) built on ADBC tables.

### Column Pruning

Doris requests only the columns a query needs. Unused columns do not appear in the generated remote SQL.

### Predicate Pushdown

The following predicates become the remote SQL `WHERE` clause:

| Category | Supported forms |
| --- | --- |
| Comparison | `=`, `!=`, `<`, `<=`, `>`, `>=` |
| Null tests | `IS NULL`, `IS NOT NULL` |
| Sets | `IN`, `NOT IN` |
| Logical operators | `AND`, `OR`, `NOT` over the predicates above |

Function calls, arithmetic expressions, `LIKE` and `BETWEEN` are not pushed down and stay in Doris.

Each top-level `AND` conjunct is pushed all or not at all. **Doris re-applies every predicate regardless**, so pushdown affects query speed and never changes which rows come back.

### LIMIT Pushdown

`LIMIT` is pushed down only after the whole `WHERE` clause has been pushed down, so the data source never truncates ahead of a filter Doris still has to apply.

### COUNT(*) Optimization

`COUNT(*)` reads no column data from the data source.

### Inspecting the Generated Remote SQL

`EXPLAIN` shows the SQL statement actually sent to the data source:

```sql
EXPLAIN
SELECT id, name
FROM adbc_ctl.adbc_db.adbc_tbl
WHERE id > 100 AND name IS NOT NULL
LIMIT 10;
```

The `QUERY:` line in the output is the pushed-down remote statement, and its columns match the ones the scan actually requests.

:::tip
On an Arrow Flight SQL data source, the call that asks for partitions is itself the query's execution. So when you run `EXPLAIN` on an ADBC table, Doris does not ask the data source for partitions, and the data source does not actually execute the query.
:::

### Parallel Reads

When `partitioned_read` is `auto` (the default) or `required`, Doris asks the driver to split one scan into several result partitions. One BE node reads each partition, and the nodes work in parallel.

When the data source cannot partition a scan:

- `auto`: falls back to a single-statement read on one BE node.
- `required`: the query fails and says why.

A partition count above `max_partitions` fails the query.

## Metadata Cache {#meta-cache}

<!-- Knowledge Type: Configuration Parameters + Usage Guidance -->

To speed up access to an external data source, Doris caches part of an ADBC catalog's metadata: database name resolution, table name resolution, and table schemas.

Database and table listings are **not cached**. They are always read live, so a table created on the data source is reachable without a `REFRESH`.

### Cache Property Configuration {#meta-cache-unified-model}

An ADBC catalog's metadata cache is configured through the unified keys `meta.cache.<engine>.<entry>.{enable,ttl-second,capacity}`.

| Property | Default | Meaning |
| --- | --- | --- |
| `meta.cache.adbc.metadata.enable` | `true` | Whether the metadata cache is enabled. |
| `meta.cache.adbc.metadata.ttl-second` | `600` | `0` disables the cache, which takes effect immediately and can be used to see the latest metadata; `-1` never expires; other positive integers are a TTL in seconds based on access time. |
| `meta.cache.adbc.metadata.capacity` | `1000` | Maximum number of cache entries. `0` disables the cache. |

**How it takes effect:** the cache is active only when `enable=true`, `ttl-second != 0` and `capacity > 0`.

:::tip
The default TTL of 10 minutes is well below the default for other catalogs. An ADBC data source is another live database: its tables are altered by other people's DDL at any time, and nothing tells Doris when. This value is the ceiling on how long someone who forgot to `REFRESH` keeps seeing the old table schema.
:::

### Cache Modules {#meta-cache-unified-modules}

Database resolution, table name resolution and table schemas share one set of settings. They are read together and dropped together, and they describe the same thing: the shape of the remote data source.

| Module (`<entry>`) | Property key prefix | Cached content and impact |
| --- | --- | --- |
| `metadata` | `meta.cache.adbc.metadata.` | Caches database name resolution, table name resolution and table schemas. Impact: how soon an added, dropped or retyped column on the source becomes visible in Doris. |

### Manual Refresh

Each of these statements drops the cache for its own scope:

```sql
REFRESH CATALOG adbc_ctl;
REFRESH DATABASE adbc_ctl.adbc_db;
REFRESH TABLE adbc_ctl.adbc_db.adbc_tbl;
```

### Best Practices {#meta-cache-best-practices}

* **Real-time access to the latest metadata**: if you want every query to read the data source's current table schema, set `ttl-second` to `0`:

  ```sql
  ALTER CATALOG adbc_ctl SET PROPERTIES ("meta.cache.adbc.metadata.ttl-second" = "0");
  ```

* **Data sources whose schemas change often**: lower `ttl-second`, or run a `REFRESH` once you know a change has happened.

### Observability {#meta-cache-unified-observability}

Cache metrics are available from the `information_schema.catalog_meta_cache_statistics` system table:

```sql
SELECT catalog_name, engine_name, entry_name,
       effective_enabled, ttl_second, capacity,
       estimated_size, hit_rate, load_failure_count, last_error
FROM information_schema.catalog_meta_cache_statistics
WHERE catalog_name = 'adbc_ctl' AND engine_name = 'adbc'
ORDER BY entry_name;
```

The system table is documented at [catalog_meta_cache_statistics](../../admin-manual/system-tables/information_schema/catalog_meta_cache_statistics.md).

:::caution
An ADBC connection reaches the data source as the single identity configured on the catalog, whoever runs the query. Cache entries are therefore shared across all users.
:::

## Limitations

<!-- Knowledge Type: Limitations -->

- Read only. `INSERT`, `CREATE TABLE`, `DROP TABLE` and other write statements against the data source are rejected.
- Statistics collection and aggregate pushdown are not supported.
- Views on the data source are not listed as tables.
- `driver_checksum` verifies the FE's copy of the driver only. The BE copies are not verified, and the FE and BE files are not compared against each other.
- `driver_url` accepts local references only. Doris will not download a driver from a remote URL.
- Reading from a Doris data source, an `IPV4` column arrives as `INT` and a source `DATETIME` column arrives as `TIMESTAMPTZ`.

## Appendix

### FAQ

<!-- Knowledge Type: Troubleshooting -->

| Symptom or error | Cause | What to do |
| --- | --- | --- |
| `Driver file not found` | The FE cannot find the driver file at the path it resolved. | Check that a bare file name in `driver_url` is present in the `drivers_dir` directory from `adbc.conf`, and that an absolute path or `file://` URL exists and is readable on the FE node. |
| `Driver path does not match any path allowed by driver_secure_path` | The driver path falls outside the allow list in `adbc.conf`. | Move the driver into an allowed directory, or change `driver_secure_path` and restart the FE. |
| `scheme 'xxx' is not supported, only a local file is` | `driver_url` uses a remote scheme such as `http://`. | An ADBC driver is not downloaded per node. Place the driver file on the FE and on all BEs, then reference it by bare name, absolute path or `file://` URL. |
| `The ADBC source reports no current catalog, so 'uri' does not pin one` | `uri` does not pin a remote catalog. | Name the remote catalog in the uri, such as `postgresql://host:5432/mydb`, or set it through a driver option with the `adbc.` prefix. |
| A query fails saying a column's Arrow type has no Doris equivalent | That column's type cannot be mapped. | Cast it to a mappable type on the data source, or leave it out of the query rather than using `SELECT *`. |
| Query results look wrong, but nothing reports an error | The driver file may not be the same build on the FE and on every BE. ADBC describes partition information in a driver-private format, and different implementations can misread each other's without raising anything. | Use `driver_checksum` to pin the FE's build, and compare the MD5 of the driver file on each BE by hand. |
| The remote SQL fails with a syntax error | The data source's SQL dialect does not match the one in use. | Set `sql_dialect` explicitly, for example `'sql_dialect' = 'doris'` against a Doris data source. |
