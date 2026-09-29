---
{
    "title": "Fluss Catalog",
    "language": "en",
    "description": "Query Apache Fluss tables from Doris: log and primary-key tables, plus Union Read of Paimon-tiered data and Fluss logs.",
    "keywords": [
        "Fluss Catalog",
        "Apache Fluss",
        "query Fluss from Doris",
        "Union Read",
        "lake and log union read",
        "tiered lake table",
        "Fluss Paimon",
        "Tiering Service",
        "tbl$lake",
        "tbl$log",
        "fluss.union_read.mode",
        "fluss.bootstrap.servers",
        "fluss.lake.paimon",
        "Fluss log table",
        "Fluss primary-key table",
        "Fluss type mapping",
        "streaming storage",
        "has no readable lake snapshot yet"
    ]
}
---

<!-- Knowledge Type: Capability Definition + Configuration Parameters + Performance Tuning + Troubleshooting -->
<!-- Use Case: Real-time queries on Fluss tables / Lake and log Union Read / Data integration and federated queries -->

Doris reads tables in [Apache Fluss](https://fluss.apache.org/) through a Fluss Catalog. Fluss is a streaming storage system built for real-time analytics, and its tiering service can keep writing table data into a Paimon data lake. Doris can read the live data in Fluss directly. It can also merge the history already tiered into Paimon with the newer rows still in the Fluss log and query them as one table. That second way of reading is called Union Read.

:::note
- This feature is experimental and has been available since version 5.0.0.
- Only reads are supported. Writes and database or table management statements are not.
- For tiered lake tables, Paimon is the only supported lake format.
:::

## Use Cases

| Scenario | Description |
| --- | --- |
| Real-time queries | Query the latest data in Fluss log tables and primary-key tables directly. |
| Union Read | For a table with lake tiering enabled, one query reads the tiered history in the Paimon lake together with the rows in the Fluss log that have not been tiered yet. This is the lake and log union read. |
| Data integration | Read Fluss data into Doris internal tables, or join it with internal tables and tables from other catalogs in federated queries. |
| Writing back | Not supported. |

## How It Works

<!-- Knowledge Type: Architecture Principles -->

Fluss tables come in three forms, and each is read differently:

| Table type | How Doris reads it |
| --- | --- |
| Log table | Reads the Fluss log. Each bucket becomes one scan range. |
| Primary-key table | Reads the latest KV snapshot of each bucket, applies the change log written after the snapshot, and merges by primary key to get the latest state. |
| Tiered lake table (`table.datalake.enabled = true`) | Reads the tiered data in the Paimon lake, applies the Fluss log after the tiering offset, and merges both in one scan. This is Union Read. |

The lake side is read by the Paimon Connector built into Doris; the Fluss Catalog has no lake reader of its own. Fluss records a readable Paimon snapshot for every tiered table, and Doris reads the Paimon data at that snapshot, so the native ORC/Parquet readers and the file cache all apply.

A Union Read on a tiered primary-key table merges the two sides by primary key. During planning, the FE attaches the offset range of the bucket's log tail to each lake split of that bucket. When the BE reads the lake data, it drops rows that the log tail has since updated or deleted, and then emits the latest state of the log tail itself once more as a separate scan range. Every row comes out exactly once, and the result matches reading the whole table from Fluss alone.

## Configuring Catalog

<!-- Knowledge Type: Configuration Parameters -->
<!-- Use Case: Creating a Fluss Catalog / Configuring SASL authentication / Configuring the Paimon lake connection -->

### Syntax

```sql
CREATE CATALOG [IF NOT EXISTS] catalog_name PROPERTIES (
    'type' = 'fluss',
    'fluss.bootstrap.servers' = '<bootstrap_servers>',
    {FlussProperties},
    {LakeProperties},
    {CommonProperties}
);
```

* `<bootstrap_servers>`

    Required. The bootstrap address of the Fluss cluster, a comma-separated list of `host:port`. This is normally the CoordinatorServer address, for example `'fluss.bootstrap.servers' = '10.0.0.1:9123,10.0.0.2:9123'`.

* `{FlussProperties}`

    The FlussProperties section holds the parameters specific to the Fluss Catalog.

    | Parameter | Required | Default | Description |
    | --- | --- | --- | --- |
    | `fluss.union_read.mode` | No | `auto` | Union Read mode for tiered lake tables. One of `auto`, `required`, or `disabled`. See Union Read Modes. |
    | `fluss.union_read.max_tail_rows` | No | `2000000` | For a Union Read on a primary-key table, the maximum number of rows allowed in the log tail of a single bucket. See Union Read Modes. |
    | `fluss.union_read.max_total_tail_rows` | No | `20000000` | For a Union Read on a primary-key table, the maximum total number of rows allowed across the log tails of all buckets in one scan. Must not be smaller than `fluss.union_read.max_tail_rows`. |
    | `enable.mapping.varbinary` | No | `false` | Whether to map the Fluss `BINARY`/`BYTES` types to Doris `varbinary`. By default they map to `string`. |
    | `enable.mapping.timestamp_tz` | No | `false` | Whether to map the Fluss `TIMESTAMP_LTZ` type to Doris `timestamptz`. By default it maps to `datetime`. |

    Apart from the Doris-specific parameters above and `fluss.lake.paimon.*`, every other property with the `fluss.` prefix is passed to the Fluss client as is, with the prefix stripped. The FE and the BE share the same set. Doris does not restrict the parameter names, so any configuration item the Fluss client understands can be passed this way. For example, if the Fluss cluster has SASL authentication turned on:

    ```sql
    'fluss.client.security.protocol' = 'sasl',
    'fluss.client.security.sasl.mechanism' = 'PLAIN',
    'fluss.client.security.sasl.username' = '<username>',
    'fluss.client.security.sasl.password' = '<password>'
    ```

    See the [Fluss configuration reference](https://fluss.apache.org/docs/maintenance/configuration/) and the [Fluss authentication guide](https://fluss.apache.org/docs/security/authentication/) for the full list.

* `{LakeProperties}`

    The LakeProperties section holds the connection settings of the Paimon lake behind tiered lake tables, with the prefix `fluss.lake.paimon.`. What follows the prefix is written exactly like `datalake.paimon.*` in the Fluss cluster's `server.yaml`, so the values can be copied over. See Lake Connection Settings.

* `{CommonProperties}`

    The CommonProperties section holds the common properties. See the Common Properties section in [Catalog Overview](../catalog-overview.md).

### Examples

The minimal configuration. It is enough when you only read Fluss's own data, or when the storage behind the lake needs no credentials:

```sql
CREATE CATALOG fluss PROPERTIES (
    'type' = 'fluss',
    'fluss.bootstrap.servers' = '10.0.0.1:9123'
);
```

The Paimon lake is on object storage (S3-compatible storage in this example):

```sql
CREATE CATALOG fluss_lake PROPERTIES (
    'type' = 'fluss',
    'fluss.bootstrap.servers' = '10.0.0.1:9123',
    'fluss.lake.paimon.s3.endpoint' = 'http://minio:9000',
    'fluss.lake.paimon.s3.access-key' = '<ak>',
    'fluss.lake.paimon.s3.secret-key' = '<sk>'
);
```

The Fluss cluster has SASL authentication turned on:

```sql
CREATE CATALOG fluss_sasl PROPERTIES (
    'type' = 'fluss',
    'fluss.bootstrap.servers' = '10.0.0.1:9123',
    'fluss.client.security.protocol' = 'sasl',
    'fluss.client.security.sasl.mechanism' = 'PLAIN',
    'fluss.client.security.sasl.username' = '<username>',
    'fluss.client.security.sasl.password' = '<password>'
);
```

### Deployment Requirements

- The FE uses the Fluss client to read metadata and plan queries, and the BE uses it to read data. Both must be able to reach the CoordinatorServer and the TabletServer of the Fluss cluster.
- The KV snapshots of primary-key tables and the archived log segments live in the remote storage configured in Fluss (`remote.data.dir`). The BE reads those files directly, so it must be able to reach that remote storage as well.
- To read tiered lake tables, both the FE and the BE must be able to reach the storage that holds the Paimon lake.
- Lake data is read by the Paimon Connector plugin built into Doris. The plugin ships with Doris and needs no separate installation.

## Supported Fluss Versions

<!-- Knowledge Type: Version Compatibility -->

| Doris version | Fluss client version |
| --- | --- |
| 5.0 | 1.0 |

Fluss clusters older than 1.0 are not supported: the client APIs that Doris relies on first appeared in Fluss 1.0.

## Metadata Mapping

<!-- Knowledge Type: Behavior Rules -->

The Fluss metadata hierarchy is Database -> Table, which maps one to one onto Doris. There is no extra name mapping.

For a table with lake tiering enabled, `SHOW TABLES` lists only the table itself. `tbl$lake` and `tbl$log` are two ways of reading the same table and do not appear as separate entries.

`SHOW CREATE TABLE` shows the columns and comments of a Fluss table but not its table properties. To find out whether a table has lake tiering enabled (`table.datalake.enabled`) and which lake format it uses (`table.datalake.format`), check the table definition on the Fluss side, for example in Flink SQL. In Doris, only tables with lake tiering enabled have `tbl$lake` and `tbl$log`.

## Column Type Mapping

<!-- Knowledge Type: Type Reference -->

| Fluss Type | Doris Type | Comment |
| --- | --- | --- |
| BOOLEAN | boolean | |
| TINYINT | tinyint | |
| SMALLINT | smallint | |
| INT | int | |
| BIGINT | bigint | |
| FLOAT | float | |
| DOUBLE | double | |
| DECIMAL(P, S) | decimal(P, S) | |
| CHAR(N) | char(N) | Maps to string when N is greater than 255 |
| STRING | string | |
| BINARY(N) | string / varbinary(N) | Controlled by `enable.mapping.varbinary`. The default `false` maps to `string`; `true` maps to `varbinary` |
| BYTES | string / varbinary | Same as above |
| DATE | date | |
| TIME | UNSUPPORTED | Doris has no type with the same semantics. The other columns in the table can still be queried; only a query that touches this column fails |
| TIMESTAMP(P) | datetime(P) | Maps to datetime(6) when the precision is greater than 6, which may lose precision |
| TIMESTAMP_LTZ(P) | datetime(P) / timestamptz(P) | Precision greater than 6 is mapped to 6. Controlled by `enable.mapping.timestamp_tz`. The default `false` maps to `datetime`; `true` maps to `timestamptz` |
| ARRAY | array | |
| MAP | map | |
| ROW | struct | |

> Note:
>
> A `TIMESTAMP_LTZ` column shows `WITH_TIMEZONE` in the Extra column of `DESCRIBE`. When it is mapped to `datetime`, Doris converts the value to the current session time zone (`SET time_zone = <tz>`) before returning it.
>
> For a table with lake tiering enabled, `tbl` and `tbl$lake` have the same column types. The mapping above is aligned with the type conversion Fluss applies when writing to Paimon and with the type mapping of the Paimon Catalog.

## Partitioned Tables

<!-- Knowledge Type: Behavior Rules + Limitations -->

Partition columns are ordinary columns in Doris. `SHOW PARTITIONS` lists partitions in the form `k1=v1/k2=v2`. Predicates on partition columns are used for partition pruning, so fewer buckets are read.

Fluss stores partition values only in the partition name, and characters that are not allowed in a partition name (such as `.` and `:`) are replaced with `_`. Doris can only read partition columns whose values survive that round trip unchanged:

- Supported: `CHAR`, `STRING`, `BOOLEAN`, `TINYINT`, `SMALLINT`, `INT`, `BIGINT`, `DATE`, and `BINARY`/`BYTES` when `enable.mapping.varbinary` is off (the partition value is the hex text of the bytes).
- Not supported: `FLOAT`, `DOUBLE`, `TIME`, `TIMESTAMP`, `TIMESTAMP_LTZ`. Such tables can still be described with `DESCRIBE`, but queries and `SHOW PARTITIONS` fail, and the error message names the partition column that caused it.

## Query Operations

<!-- Knowledge Type: Operational Examples + Behavior Rules -->
<!-- Use Case: Querying Fluss tables / Reading only the lake or only the log / Controlling the Union Read mode -->

### Basic Query

```sql
-- Switch to the catalog, then query
SWITCH fluss;
USE db;
SELECT * FROM tbl LIMIT 10;

-- Use the fully qualified name
SELECT * FROM fluss.db.tbl WHERE dt = '20260101';
```

A log table returns all log records up to the moment the query was planned. Buckets in the same partition use offsets taken at the same instant, so one query sees a consistent view. A primary-key table returns the latest state of each key, and deleted keys do not appear in the result.

### Tiered Lake Tables and Union Read

For a table with `table.datalake.enabled = true`, Doris offers three ways to read it. The default reads the lake and the log together, which is Union Read:

```sql
SELECT * FROM fluss.db.tbl;         -- Union Read: lake + log merged into the full data set (default)
SELECT * FROM fluss.db.`tbl$lake`;  -- Only the tiered data in the Paimon lake
SELECT * FROM fluss.db.`tbl$log`;   -- Only the data in the Fluss log that has not been tiered yet
```

`tbl$lake` and `tbl$log` split the data by where it lives. They do not overlap, and together they make up all of `tbl`. The names describe where the data is, not how fresh it is: if the tiering service stops, `tbl$log` is still whatever remains in the log.

**`tbl$lake`**

- The Paimon Connector reads the Paimon table written by the tiering service directly. For a table tiered by Fluss 1.0, `tbl$lake` has exactly the same columns as `tbl`. The `__bucket`, `__offset`, and `__timestamp` system columns that earlier Fluss releases added to lake tables no longer exist.
- It reads the lake at the readable lake snapshot that Fluss records, or at the latest state of the lake when there is none yet. Fluss creates the Paimon table together with the Fluss table, so before the tiering service commits anything, `tbl$lake` returns an empty result instead of an error.
- If Doris cannot find the lake table with the current lake connection settings, the query fails with `nothing has been tiered`. This usually means that settings such as `fluss.lake.paimon.warehouse` do not point to the warehouse the Fluss cluster writes to. See Lake Connection Settings.
- The time travel and incremental queries of the Paimon Catalog are not supported.

**`tbl$log`**

- Starts reading from the log offset that corresponds to the lake snapshot and returns only the data written after that offset.
- Only log tables are supported. For a primary-key table, the log after the lake snapshot is a change stream with updates and deletes of keys that already exist in the lake, so it cannot be returned as a set of independent rows. Querying `$log` on a primary-key table fails.
- The table must already have a readable lake snapshot, otherwise the query fails.
- Tables without lake tiering have no `$lake` or `$log`.

### Union Read Modes

<!-- Knowledge Type: Configuration Parameters + Behavior Rules -->
<!-- Use Case: Controlling whether Union Read happens / Finding out why auto mode fell back -->

Whether a query on the tiered lake table itself (`SELECT * FROM tbl`) does a Union Read is controlled by the catalog property `fluss.union_read.mode`:

| Value | Behavior |
| --- | --- |
| `auto` (default) | Does a Union Read when a readable lake snapshot exists. When the conditions are not met, it falls back to reading the data from Fluss instead of failing. See the cases below. |
| `required` | Union Read is mandatory. Fails when the conditions are not met instead of falling back. |
| `disabled` | No Union Read. Reads only the data currently in Fluss and ignores the lake, including partitions that exist only in the lake. |

The session variable `fluss_union_read_mode` overrides the catalog setting for the current session:

```sql
SET fluss_union_read_mode = 'required';  -- No fallback to a Fluss-only read; fail instead
SET fluss_union_read_mode = 'disabled';  -- Read from Fluss only
SET fluss_union_read_mode = '';          -- Default: follow the catalog setting
```

To change the mode for a single statement only, use the `SET_VAR` hint:

```sql
SELECT /*+ SET_VAR(fluss_union_read_mode='required') */ * FROM fluss.db.tbl;
```

The Union Read mode decides which path the data is read through. As long as Fluss still holds all of the table's data, that is, no log has expired under the TTL and no partition has been dropped from Fluss while it still exists in the lake, all three modes return the same rows. `required` is useful for regression tests and troubleshooting, because it fails when the read path is not what you expect instead of quietly taking another path.

**Cases where `auto` falls back**

| Case | Description |
| --- | --- |
| No readable lake snapshot | The tiering service has not committed anything yet, so all data is still in Fluss. The table is read from Fluss alone. |
| `key-type` | A primary-key column of a primary-key table, other than a partition column, has a type whose values cannot be compared exactly between the lake side and the log side: `FLOAT`, `DOUBLE`, `TIME`, `TIMESTAMP` with precision greater than 6, and `TIMESTAMP_LTZ`. When `enable.mapping.timestamp_tz` is `false` (the default), a `TIMESTAMP_LTZ` column of any precision falls in this case, because two different instants can have the same local time during a daylight saving time overlap. When it is `true`, only a precision greater than 6 does. |
| `partition-type` | A partition column of a primary-key table is not `STRING`. Lake splits are matched to Fluss partitions by the text form of the partition value, and only `STRING` guarantees that both sides write it the same way. |
| `tail-truncated` | Part of the log after the lake snapshot of a primary-key table has already been deleted by the Fluss TTL, so the log tail cannot be read in full. |
| `tail-too-large` | The log tail of a primary-key table has more rows than `fluss.union_read.max_tail_rows` or `fluss.union_read.max_total_tail_rows` allows. |

The last four cases apply to primary-key tables only, and `EXPLAIN` reports them in the `degraded` field. When a primary-key table falls back, the partitions that still exist in Fluss are read from Fluss in full. This loses no data, because Fluss keeps the complete state of those partitions; the query just cannot use the columnar files in the lake for them and runs slower. Partitions that have been dropped from Fluss but still exist in the lake, for example because of partition expiration, keep being read from the lake. An unpartitioned table is read from Fluss alone.

For `partition-type`, Doris cannot reliably tell which Fluss partition a lake split belongs to. If the lake holds a partition that Fluss no longer has, or a partition value that the two sides write differently, the query fails with `cannot be matched safely to a live fluss partition` instead of falling back. Set the Union Read mode to `disabled` to read only the data in Fluss.

Log tables are different. A Fluss-only read returns only what is still kept in the Fluss log, and once the early log expires under the TTL, the result has fewer rows than a Union Read would. `disabled` is not recommended for log tables that have been tiered. A log table also has no fallback when its log tail is incomplete: if part of the log after the lake snapshot has already expired, a Union Read fails with `Part of the log tail has expired` in both `auto` and `required` mode, and so does a query on `tbl$log` in any mode. Wait for Fluss to publish a newer readable lake snapshot.

**Row limits for the log tail**

For a Union Read on a primary-key table, the BE keeps the log tail of every bucket in memory: one copy is the set of primary keys used to filter the lake data, and one copy is the rows the tail itself has to emit. To bound memory use, `fluss.union_read.max_tail_rows` limits the tail rows of a single bucket (default 2 million rows), and `fluss.union_read.max_total_tail_rows` limits the total tail rows across all buckets in one scan (default 20 million rows). Both limits are checked during planning, based on the offsets reported by Fluss. Normally the log tail only holds the data written within one `table.datalake.freshness` period, far below the default limits. Hitting a limit usually means the tiering service has stopped or is badly behind.

**Checking the read path with EXPLAIN**

The `flussScan` line in the `EXPLAIN` output shows how the query actually reads the table:

```text
flussScan: readMode=default, unionRead=yes, lakeSplits=3, suppressedLakeSplits=1, logRanges=0, pkRanges=0, pkTailRanges=1, mode=auto
```

| Field | Meaning |
| --- | --- |
| `readMode` | `default` reads the whole table; `log` reads `tbl$log`. |
| `unionRead` | Whether a Union Read was done. It is also `yes` for `tbl$log`, whose starting offsets come from the lake snapshot; `lakeSplits` is 0 there. |
| `lakeSplits` | Number of lake splits. |
| `suppressedLakeSplits` | Number of those lake splits that have to be filtered by the log tail. Primary-key tables only. |
| `logRanges` | Number of log scan ranges of a log table. |
| `pkRanges` | Number of buckets of a primary-key table read entirely from Fluss (KV snapshot + change log). |
| `pkTailRanges` | Number of log tail scan ranges in a Union Read on a primary-key table. |
| `mode` | The Union Read mode in effect. Carries a `(session)` suffix when it comes from the session variable. |
| `degraded` | Appears only when a primary-key table falls back in `auto` mode. The value is one of `key-type`, `partition-type`, `tail-truncated`, and `tail-too-large` from the table above. Having no readable lake snapshot is not reported here; it only shows as `unionRead=no`. When partitions that exist only in the lake are still read from the lake, `unionRead=yes` and `degraded` appear together. |

### Lake Connection Settings

<!-- Knowledge Type: Configuration Parameters -->
<!-- Use Case: Paimon lake on object storage that needs credentials / Overriding the lake settings reported by the Fluss cluster -->

The Fluss cluster writes the `datalake.paimon.*` settings from its `server.yaml` into the properties of every tiered table, and Doris builds the Paimon lake connection from them. In most cases the catalog needs no lake connection settings of its own.

However, before Fluss returns table properties to a client, it removes every configuration item whose name contains `key`, `secret`, or `password`. When the Paimon lake sits on object storage that needs credentials, Doris cannot get them from Fluss, so they must be supplied in the catalog with the `fluss.lake.paimon.` prefix:

```sql
CREATE CATALOG fluss PROPERTIES (
    'type' = 'fluss',
    'fluss.bootstrap.servers' = '10.0.0.1:9123',
    'fluss.lake.paimon.s3.endpoint' = 'http://minio:9000',
    'fluss.lake.paimon.s3.access-key' = '<ak>',
    'fluss.lake.paimon.s3.secret-key' = '<sk>'
);
```

After the prefix, use Paimon's own parameter names, the same as what follows `datalake.paimon.` in the Fluss `server.yaml`. Copy them as they are:

| Fluss server.yaml | Doris catalog property |
| --- | --- |
| `datalake.paimon.warehouse: s3://bucket/lake` | `'fluss.lake.paimon.warehouse' = 's3://bucket/lake'` |
| `datalake.paimon.metastore: filesystem` | `'fluss.lake.paimon.metastore' = 'filesystem'` |
| `datalake.paimon.s3.endpoint: http://minio:9000` | `'fluss.lake.paimon.s3.endpoint' = 'http://minio:9000'` |

Overrides are applied per key, not as a whole. A key set in the catalog overrides the same key reported by the Fluss cluster, and keys that are not set still come from the cluster. If you only supply credentials, `warehouse`, `metastore`, and the rest still come from the cluster.

Storage parameters (credentials, session tokens, endpoint, region, addressing style, and Hadoop settings) are not handed to the Paimon Catalog. They are converted to Doris's own storage parameter names and applied by the Doris storage layer. The reason is that these settings serve both the FE (reading manifests) and the BE (reading data files), and only the storage layer gives both sides the same set. The mapping is as follows:

| Paimon parameter | Doris storage parameter |
| --- | --- |
| `s3.access-key` / `s3.access.key` / `fs.s3a.access.key` | `s3.access_key` |
| `s3.secret-key` / `s3.secret.key` / `fs.s3a.secret.key` | `s3.secret_key` |
| `s3.session-token` / `s3.session.token` / `fs.s3a.session.token` | `s3.session_token` |
| `s3.endpoint` / `fs.s3a.endpoint` | `s3.endpoint` |
| `s3.region` / `fs.s3a.endpoint.region` | `s3.region` |
| `s3.path-style-access` / `s3.path.style.access` / `fs.s3a.path.style.access` | `use_path_style` |
| `fs.oss.accessKeyId` | `oss.access_key` |
| `fs.oss.accessKeySecret` | `oss.secret_key` |
| `fs.oss.endpoint` | `oss.endpoint` |
| `fs.obs.access.key` / `fs.obs.access-key` | `obs.access_key` |
| `fs.obs.secret.key` / `fs.obs.secret-key` | `obs.secret_key` |
| `fs.obs.endpoint` | `obs.endpoint` |

Other parameters that start with `fs.`, `dfs.`, or `hadoop.`, such as HDFS HA and Kerberos settings, are handed to the Doris storage layer as well, under their original names.

`fluss.lake.paimon.metastore` accepts `filesystem` (default), `hive`, and `rest`. Other parameters, such as the Hive Metastore address or the REST authentication settings, are written the same way as in the [Paimon Catalog](./paimon-catalog.mdx).

`ALTER CATALOG` can only set properties; it cannot remove them. To withdraw a `fluss.lake.paimon.*` override, set it to an empty string, and Doris goes back to the configuration reported by the Fluss cluster:

```sql
ALTER CATALOG fluss SET PROPERTIES ('fluss.lake.paimon.warehouse' = '');
```

One Fluss Catalog reads lake tables with a single set of lake settings. After the Fluss cluster changes `datalake.paimon.*`, drop and recreate the catalog so that Doris loads the new settings. `REFRESH CATALOG` only clears the metadata cache and does not reload the lake settings.

### Query Profile

<!-- Knowledge Type: Performance Diagnostics -->

A single Fluss scan may read the Fluss log, the Paimon lake, and the log tail that overrides lake data, and it has to filter as well. The profile therefore reports time and row counts per read path and per range type, which shows where the time goes:

```text
TableReader
├── FlussLogReadTime            8s25ms      Total time on the Fluss side (JNI)
│   ├── FlussPkTailRangeNum          2      Only the range types actually read in this scan are registered
│   ├── FlussPkTailRangeReadTime  6s2ms
│   └── FlussLogRowsReturned         2
├── FlussLakeReadTime           8s25ms      Total time on the Paimon side, including tail reads and filtering
│   ├── FlussLakeRangeNum            1
│   ├── FlussLakeSuppressRangeNum    2
│   └── FlussLakeRowsReturned        7      Rows after filtering; add FlussUnionSuppressedRows to get the count before filtering
├── FlussUnionTailReadTime      5s20ms      One round trip to Fluss per bucket
└── FlussUnionSuppressTime      16.1us      Filtering per block, grows with the number of lake rows
```

Subtracting the time of each range type from the total of its side gives the cost of initializing that reader (JNI class loading, or setting up the Paimon read stack). A query that only reads a log table has no lake or primary-key counters in its profile.

A scan that reads lake splits also has the following counters under `TableReader`. They carry values in a Union Read on a primary-key table:

| Counter | Meaning |
| --- | --- |
| `FlussUnionSuppressedRows` | Lake rows dropped because the log tail updated or deleted them. |
| `FlussUnionTailKeysRead` | Change log records read from the log tails. |
| `FlussUnionTailKeysRetained` | Distinct primary keys kept in memory to filter the lake rows. |
| `FlussUnionTailCacheHitCount` | Lake splits that reused a log tail already read for the same bucket. |

## Query Performance

<!-- Knowledge Type: Architecture Principles + Performance Tuning -->
<!-- Use Case: Performance tuning / Checking whether a query uses the native reader or JNI -->

The BE has two paths for reading Fluss tables, and their costs differ a lot:

- C++ native reader. The BE reads the ORC/Parquet files in the Paimon lake directly, with the same readers the Paimon Catalog uses. It does not go through the JVM, and it can use the Doris [file cache](../data-cache.md).
- JNI reader. The BE calls the Fluss Java SDK through JNI to read Fluss's own data. Logs, KV snapshots, and change logs can only be read this way. Every batch has to be converted from Java objects into Doris columnar blocks, which is much slower than the native reader.

Which path is used depends on the type of the scan range, which corresponds to the counters on the `flussScan` line of `EXPLAIN`:

| Data read | EXPLAIN counter | Read path |
| --- | --- | --- |
| Log of a log table | `logRanges` | JNI |
| Whole primary-key table read (KV snapshot + change log) | `pkRanges` | JNI |
| Log tail of a primary-key table in a Union Read | `pkTailRanges` | JNI |
| Lake splits of a log table in a Union Read | `lakeSplits` | C++ native reader |
| Lake splits of a primary-key table in a Union Read | `lakeSplits`, `suppressedLakeSplits` | Decided by the Paimon Catalog rules, see below. Filtering lake rows by the primary keys in the log tail happens in C++ on the BE |

`tbl$lake` is planned by the Paimon Connector directly, so its `EXPLAIN` has no `flussScan` line. It shows `paimonNativeReadSplits=N/M` instead, meaning N of the M splits use the native reader, and its profile has no Fluss counters.

Lake splits are planned by the Paimon Connector, and whether they use the native reader follows the same rules as a plain Paimon table:

- A log table is tiered into a Paimon append table. Every split reads files directly, so all of them use the native reader.
- A primary-key table is tiered into a Paimon primary-key table. Splits that are already compacted and need no merging with other files use the native reader. Files just written and not yet compacted, and splits whose files have overlapping key ranges and need merge-on-read, use the Paimon JNI reader.
- The session variable `force_jni_scanner = true` sends every lake split through JNI. Use it only when troubleshooting.

For a tiered table, Union Read lets the part in the lake (usually the vast majority of the data) go through the native reader, and only the small amount of log after the tiering offset goes through JNI. The more timely the tiering (the smaller `table.datalake.freshness`), the less goes through JNI. That is why tiered tables use Union Read by default. A few suggestions:

- When analyzing history and freshness does not matter much, query `tbl$lake` directly. It skips the Fluss log entirely: a log table is then read wholly by the native reader, and a primary-key table follows the Paimon rules above.
- `fluss.union_read.mode = disabled` sends the whole table through JNI. It is not recommended except for troubleshooting.
- When `auto` mode falls back (`degraded=` appears in `EXPLAIN`), everything read from Fluss also goes through JNI; only the partitions that exist only in the lake are still read from the lake. Watch for the `key-type` and `partition-type` cases: they are determined by the table schema, and only changing the table definition fixes them.
- A Union Read on a primary-key table reads the primary keys in the log tail once more for every bucket (`FlussUnionTailReadTime` in the profile). The longer the tail, the higher the cost.

To confirm which path a query took, compare `lakeSplits` with `logRanges`, `pkRanges`, and `pkTailRanges` in `EXPLAIN`, and compare `FlussLakeReadTime` with `FlussLogReadTime` in the profile.

## Limitations

<!-- Knowledge Type: Limitations -->

- Read only. `INSERT`, `UPDATE`, and `DELETE` are not supported, nor are database and table management statements such as `CREATE TABLE` and `DROP TABLE`.
- Paimon is the only supported lake format. For a table whose `table.datalake.format` is something else, `tbl$lake` fails. Once such a table has a readable lake snapshot, a query on the table itself also fails in `auto` and `required` mode; set the Union Read mode to `disabled` to read the data in Fluss.
- The Fluss `TIME` type maps to `UNSUPPORTED`, and that column cannot be queried.
- Predicates are not pushed down to Fluss: apart from partition pruning, Doris filters the data read from Fluss after reading it. For the lake, the filter is passed to Paimon when splits are planned, and Paimon uses it to skip partitions and data files. Column pruning and sub-column pruning of nested types are both supported.
- Time travel and incremental queries are not supported, including on `tbl$lake`.
- Fluss provides only table-level row counts, without column-level statistics.

## FAQ

<!-- Knowledge Type: Troubleshooting -->
<!-- Use Case: Missing Paimon plugin / Object storage credentials / Lake snapshot not ready / Lake table not found / Lake configuration changed / Expired log tail / Unsupported partition column type / Partition matching failure -->

1. Querying a tiered lake table fails with `the paimon connector plugin is not available`

    Lake data is read by the Paimon Connector plugin. Check that the `plugins/connector/paimon` directory under the FE deployment directory is complete.

2. Querying `tbl$lake` or doing a Union Read fails with an error about accessing object storage

    Fluss does not hand out storage credentials. Configure them in the catalog with `fluss.lake.paimon.*`. See Lake Connection Settings.

3. Error `has no readable lake snapshot yet`

    The tiering service has not committed any data to the lake yet. A query on the table itself reports this only in `required` mode: wait for the tiering service to commit, or switch to `auto`. A query on `tbl$log` reports it in every mode, because `tbl$log` starts from the lake snapshot; query the table itself instead.

4. `tbl$lake` fails with `nothing has been tiered`

    Doris cannot find the lake table with the current lake connection settings. Fluss 1.0 creates the lake table together with the Fluss table, so this usually means that settings such as `fluss.lake.paimon.warehouse` do not point to the warehouse the Fluss cluster writes to. See Lake Connection Settings.

5. Error `is already serving lake tables with a different paimon configuration`

    The `datalake.paimon.*` configuration of the Fluss cluster changed after the catalog started reading lake tables. Drop and recreate the catalog. `REFRESH CATALOG` does not reload the lake settings.

6. Error `Part of the log tail has expired`

    A Union Read on a log table, or a query on `tbl$log`, needs the log after the lake snapshot, and part of it has already been deleted by the Fluss TTL. Wait for Fluss to publish a newer readable lake snapshot. See Union Read Modes.

7. Error `cannot be read: its partition column 'xx' has fluss type TIMESTAMP(3)`

    Doris cannot read partition columns of that type. See Partitioned Tables.

8. Error `cannot be matched safely to a live fluss partition`

    The primary-key table is partitioned by a column that is not `STRING`, and the lake holds a partition that Doris cannot match to a partition in Fluss, for example one that Fluss has already dropped. See the `partition-type` case in Union Read Modes. To read the data still in Fluss, set the Union Read mode to `disabled`.

## Debugging

<!-- Knowledge Type: Debugging Environment -->

The `docker/thirdparties/docker-compose/fluss` directory in the Doris code base contains the Fluss environment used by the regression tests, with Fluss, Flink, the Paimon tiering service, and MinIO. Follow the README there to set one up and verify the feature.

## References

- [Apache Fluss documentation](https://fluss.apache.org/docs/)
- [Fluss Lakehouse Storage](https://fluss.apache.org/docs/maintenance/tiered-storage/lakehouse-storage/)
- [Paimon Catalog](./paimon-catalog.mdx)
