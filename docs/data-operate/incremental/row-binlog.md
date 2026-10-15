---
{
    "title": "Row Binlog",
    "language": "en",
    "description": "Doris Row Binlog records row-level inserts, updates and deletes: table properties, TTL retention, automatic cleanup, supported table models and troubleshooting.",
    "keywords": [
        "Row Binlog",
        "row-level binlog",
        "Doris binlog",
        "binlog.enable",
        "binlog.format ROW",
        "binlog.need_historical_value",
        "binlog.ttl_seconds",
        "Row Binlog TTL",
        "before image",
        "historical value",
        "commit TSO",
        "__DORIS_BINLOG_OP__",
        "__DORIS_COMMIT_TSO_COL__",
        "binlog() table function",
        "Merge-on-Write change records",
        "Duplicate Key change records",
        "light schema change",
        "enable_mow_light_delete",
        "change data capture",
        "Doris CDC",
        "Incremental View Maintenance",
        "IVM",
        "Not allowed to perform current operation on Table With binlog",
        "Only duplicate and mow table model support binlog"
    ]
}
---

<!-- Knowledge type: Feature description + Parameter reference -->
<!-- Use cases: Enabling row-level change recording on a table / Checking whether a table model is supported / Inspecting change records -->

Row Binlog is the row-level change log of Doris internal tables. Once enabled, every row-level change produced by a write (insert, update, delete) is persisted together with the values before and after the change and the commit timestamp. It is the data source of [Table Stream](table-stream), [Incremental Query](incremental-query) and [Incremental View Maintenance (IVM)](../../query-acceleration/materialized-view/async-materialized-view/incremental-materialized-view), and can also be consumed from Flink through the [Flink Doris Connector](../../connection-integration/data-integration/flink-doris-connector/incremental-read) (Connector 26.3.0 or later).

Change records are retained for one day by default. Set `binlog.ttl_seconds` to cover the longest expected consumption delay; expiring change records does not delete data from the base table.

:::caution Experimental feature
This feature is available since version 5.0.0 and is experimental. It requires `enable_feature_binlog = true` in the FE configuration.
:::

## Prerequisites

<!-- Knowledge type: Environment requirements -->

- Doris 5.0.0 or later.
- `enable_feature_binlog = true` in `fe.conf` on the FE (not a dynamic configuration; the FE must be restarted).
- For automatic cleanup, also set `enable_feature_binlog = true` in `be.conf` on the BEs (not a dynamic configuration; the BEs must be restarted).
- A Duplicate Key table, or a Unique Key Merge-on-Write (MoW) table without cluster keys; see [Supported scope and limitations](#supported-scope-and-limitations).
- Row Binlog can only be enabled at table creation, so evaluate it before creating the table.

## Basic concepts

<!-- Knowledge type: Concept description -->

| Concept | Description |
|---|---|
| Change record | Every time a transaction commits on the base table, each changed row produces one record containing the operation type (insert / update / delete), the values after the change, and optionally the values before the change (the before image) |
| Commit timestamp (TSO) | A globally monotonic timestamp obtained from the FE when a write transaction commits, composed of a physical part (milliseconds) and a logical counter. All changes of one transaction share the same TSO. Table Stream offsets and `@incr` time windows are both measured in TSO |
| LSN | The sequence number of a change record within its transaction. Together with the TSO it defines the order of change records |

## Enabling Row Binlog

<!-- Knowledge type: Operational steps + Configuration parameters -->

Row Binlog can only be enabled through table properties in `CREATE TABLE`, and cannot be disabled afterwards:

```sql
CREATE TABLE orders (
    order_id BIGINT,
    status   VARCHAR(16),
    amount   DECIMAL(10, 2)
)
UNIQUE KEY(order_id)
DISTRIBUTED BY HASH(order_id) BUCKETS 8
PROPERTIES (
    "enable_unique_key_merge_on_write" = "true",
    "binlog.enable" = "true",
    "binlog.format" = "ROW",
    "binlog.need_historical_value" = "true",
    "binlog.ttl_seconds" = "86400"
);
```

`binlog.enable` and `binlog.format = "ROW"` must be set together; setting `binlog.enable` alone does not enable Row Binlog.

### Properties

| Property | Values | Default | Changeable after creation | Description |
|---|---|---|---|---|
| `binlog.enable` | `true` / `false` | `false` | Cannot be disabled once enabled | Whether binlog is enabled; must be set together with `binlog.format = "ROW"` |
| `binlog.format` | `ROW` | - | No | Must be `ROW`, meaning row-level changes are recorded. The value is case-sensitive; a lowercase `row` fails with `Invalid binlog format value: row` |
| `binlog.need_historical_value` | `true` / `false` | `false` | No | Whether the values before a change (before image) are recorded. Only Unique Key MoW tables can set it to `true`. `min_delta` / `detail` Table Streams, `MIN_DELTA` incremental queries, and IVMs that need to handle updates or deletes depend on it |
| `binlog.ttl_seconds` | positive integer (seconds) | `86400` (one day) | Yes | Retention period for change records. Expired records are filtered from incremental reads and reclaimed through background compaction; `0` and negative values are not allowed. See [Retention and cleanup](#retention-and-cleanup) |
| `binlog.max_bytes` | integer (bytes) | unlimited | Yes | Retention size limit. **Has no effect in the current version** |
| `binlog.max_history_nums` | integer | unlimited | Yes | Retention count limit. **Has no effect in the current version** |

### Changing immutable properties

Changing an immutable property on an existing table fails immediately:

```sql
ALTER TABLE orders SET ("binlog.enable" = "false");
-- ERROR: can't disable binlog when format is [Row]

ALTER TABLE orders SET ("binlog.need_historical_value" = "false");
-- ERROR: not support change binlog.need_historical_value from true to false

ALTER TABLE t_without_binlog SET ("binlog.format" = "ROW");
-- ERROR: not support change binlog format from STATEMENT_AND_SNAPSHOT to ROW
```

For an existing table without Row Binlog, create a new table with Row Binlog enabled, load the data, and swap the two atomically with [`ALTER TABLE ... REPLACE WITH TABLE`](../../sql-manual/sql-statements/table-and-view/table/ALTER-TABLE-REPLACE).

### Viewing the properties

`SHOW CREATE TABLE` lists all `binlog.*` properties:

```sql
SHOW CREATE TABLE orders\G
```

```text
...
"binlog.enable" = "true",
"binlog.ttl_seconds" = "86400",
"binlog.max_bytes" = "9223372036854775807",
"binlog.max_history_nums" = "9223372036854775807",
"binlog.format" = "ROW",
"binlog.need_historical_value" = "true",
...
```

## Supported scope and limitations

<!-- Knowledge type: Support matrix -->
<!-- Use cases: Checking table model / column type support before creating the table -->

### Table models

| Table model | Supported | Notes |
|---|---|---|
| Duplicate Key | Yes | Only inserted rows are recorded; `binlog.need_historical_value = true` is rejected with `Duplicate table model don't support record historical value` |
| Unique Key, Merge-on-Write | Yes | Inserts, updates, and deletes are recorded; the before image can be enabled. **Tables with cluster keys are not supported** and fail with `Unique merge-on-write tables with cluster keys do not support binlog<Row>` |
| Unique Key, Merge-on-Read | No | Fails with `Only duplicate and mow table model support binlog<Row>` |
| Aggregate Key | No | Same as above |

### Column types

| Restriction | Notes |
|---|---|
| Auto-increment columns | Not supported; both `CREATE TABLE` and `ADD COLUMN` reject them |
| VARIANT columns | Not supported; both `CREATE TABLE` and `ADD COLUMN` reject them |

### Deployment modes

Row Binlog can be enabled in both the integrated storage-compute mode and the compute-storage decoupled mode.

### Write methods

Changes produced by every write method (`INSERT`, `UPDATE`, `DELETE`, Stream Load, Broker Load, Routine Load, the Flink / Spark connectors, and so on) are recorded, including partial column updates and flexible partial column updates.

## Change record model

<!-- Knowledge type: Behavior rules -->
<!-- Use cases: Understanding which change records each write operation produces -->

### Operation types and hidden columns

Each change record contains all visible columns of the base table (values after the change) plus the following hidden columns:

| Hidden column | Type | Description |
|---|---|---|
| `__DORIS_BINLOG_OP__` | TINYINT | Operation type. In the raw records returned by the `binlog()` table function: `0` insert, `1` update, `2` delete. In `@incr` incremental queries an update is split into two rows: `0` insert, `1` delete, `2` before update, `3` after update |
| `__DORIS_BINLOG_TSO__` | BIGINT | Commit timestamp |
| `__DORIS_BINLOG_LSN__` | BIGINT | Sequence number within the transaction |
| `__BEFORE__<column>__` | Same as the original column | Value before the change, one per non-key column. Present only when `binlog.need_historical_value = true` |

The base table itself gets an extra hidden column `__DORIS_COMMIT_TSO_COL__` holding the commit timestamp of the latest write of each row. It can be queried directly after `SET show_hidden_columns = true`:

```sql
SET show_hidden_columns = true;
SELECT order_id, status, __DORIS_COMMIT_TSO_COL__ FROM orders;
```

### Duplicate Key tables

Duplicate Key tables only have inserts. Every row of every write is recorded as an insert record, and rows with the same key are never merged.

`DELETE FROM ... WHERE ...` on a Duplicate Key table marks rows with a delete predicate and **does not produce change records**; downstream consumers using Table Stream or `@incr` cannot see such deletes. Use a Unique Key MoW table if deletes need to reach downstream.

### Unique Key MoW tables

| Write operation | Recorded as |
|---|---|
| Writing a key that does not exist | One insert record |
| Writing a key that already exists (`INSERT` with the same key, `UPDATE`, partial column update) | One update record carrying the complete row after the update; with the before image enabled, also the values before the update |
| Deleting an existing key (`DELETE`, a load with the delete sign) | One delete record. With the before image enabled it carries the values before deletion; otherwise only the key columns have values |
| Writing the same key again after deleting it | One insert record (the previous version is a delete marker, not a live row) |
| Writing a sequence column value lower than the visible row | The write is discarded and no change record is produced |

`DELETE` on a MoW table is implemented by writing delete markers by default, so it produces delete records. If the table property `enable_mow_light_delete` is `true`, `DELETE` uses a delete predicate instead and, like on Duplicate Key tables, produces no change records. Keep that property at its default `false` on tables with Row Binlog.

A partial column update records the complete merged row rather than only the updated columns. In a flexible partial column update (`unique_key_update_mode = UPDATE_FLEXIBLE_COLUMNS`), deleting and then writing the same key within one batch is recorded as one update record: the before image is the old row before deletion, and the after image is the newly written row where columns that were not provided take their default value or NULL instead of the old values.

The following example shows the raw change records of a MoW table with the before image enabled:

```sql
INSERT INTO orders VALUES (1, 'created', 100.00);
INSERT INTO orders VALUES (1, 'paid', 100.00);
DELETE FROM orders WHERE order_id = 1;
INSERT INTO orders VALUES (1, 'created', 150.00);

SELECT __DORIS_BINLOG_OP__ AS op, order_id, status, amount,
       __BEFORE__status__, __BEFORE__amount__
FROM binlog("table" = "orders")
ORDER BY __DORIS_BINLOG_TSO__, __DORIS_BINLOG_LSN__;
```

```text
+------+----------+---------+--------+--------------------+--------------------+
| op   | order_id | status  | amount | __BEFORE__status__ | __BEFORE__amount__ |
+------+----------+---------+--------+--------------------+--------------------+
|    0 |        1 | created | 100.00 | NULL               |               NULL |
|    1 |        1 | paid    | 100.00 | created            |             100.00 |
|    2 |        1 | paid    | 100.00 | paid               |             100.00 |
|    0 |        1 | created | 150.00 | NULL               |               NULL |
+------+----------+---------+--------+--------------------+--------------------+
```

## DDL restrictions

<!-- Knowledge type: Behavior rules -->
<!-- Use cases: Checking which ALTER TABLE operations remain available with Row Binlog enabled -->

Only the following `ALTER TABLE` operations are allowed on a table with Row Binlog enabled:

| Allowed | Notes |
|---|---|
| `ADD COLUMN` / `DROP COLUMN` | Only as light schema change (the table must have `light_schema_change` enabled, which is the default); new columns are added to the change records automatically |
| `CREATE INDEX` / `DROP INDEX` | Only light index changes |
| `ADD ROLLUP` / `DROP ROLLUP` / `RENAME ROLLUP` | |
| Partition operations: `ADD PARTITION`, `DROP PARTITION`, `MODIFY PARTITION`, `RENAME PARTITION`, `REPLACE PARTITION` | |
| `RENAME` table, `REPLACE WITH TABLE` | |
| Modifying the table comment or column comments | |
| Modifying the bucketing | |
| Modifying table properties | Except `bloom_filter_columns` / `bloom_filter_fpp` |
| `ENABLE FEATURE` (such as `SEQUENCE_LOAD`) | Converted into `ADD COLUMN` internally |

Other operations are rejected with `Not allowed to perform current operation on Table With binlog<row>`, typically:

- `MODIFY COLUMN` (changing a column type, position, and so on)
- `RENAME COLUMN`
- `ORDER BY` (reordering columns)
- `BUILD INDEX`
- Modifying bloom filter properties

Table-level operations such as `TRUNCATE TABLE` and backup / restore work as usual on tables with Row Binlog. How schema and partition changes of the base table affect existing Table Streams is described in [Table Stream Advanced](table-stream-advanced#effect-of-base-table-changes).

## Retention and cleanup

<!-- Knowledge type: Behavior rules -->
<!-- Use cases: Setting retention / Handling expired offsets / Capacity planning -->

Since Doris 5.0.0, `binlog.ttl_seconds` controls Row Binlog retention in both the integrated storage-compute mode and the compute-storage decoupled mode. Retention is based on the physical time in the commit TSO, using the current Master FE TSO as the reference. Records whose commit time is at or before the reference time minus the TTL are expired. The retention window advances even when the table receives no new writes.

### Configuring retention

The default TTL is `86400` seconds (one day). When a database explicitly sets `binlog.ttl_seconds`, new tables inherit it unless their table properties override it. Changing the database setting does not change existing tables. `CREATE TABLE ... LIKE` copies the source table's TTL.

To retain changes for seven days on the `orders` table created above:

```sql
ALTER TABLE orders SET ("binlog.ttl_seconds" = "604800");
```

After the statement succeeds, `SHOW CREATE TABLE orders` includes:

```text
"binlog.ttl_seconds" = "604800"
```

The TTL must be greater than `0`; neither `0` nor `-1` disables expiration. Shortening the TTL can immediately expire existing records. Extending it can make records that are still physically present readable again, but cannot recover records that have already been cleaned up. If an `ALTER TABLE` fails while publishing the setting to partitions, a shorter TTL may already have taken effect; check `SHOW CREATE TABLE` and retry the same statement to complete the update.

### Effect on reads

Incremental reads apply the retention window when the statement is planned, before physical cleanup finishes. A statement uses one reference TSO, and each new statement recalculates the window.

| Read method | Behavior when the requested start is expired |
|---|---|
| `@incr` without `startTimestamp` | Reads only retained changes, including in `MIN_DELTA` mode |
| `@incr` with `incrementType = MIN_DELTA` and an explicit `startTimestamp` | Fails with `Row binlog offset has expired according to binlog.ttl_seconds` to avoid returning incomplete net changes |
| `@incr` with `incrementType = DETAIL` or `APPEND_ONLY` | Moves the effective start to the first retained TSO and returns only the retained part of the requested window |
| Table Stream with `type = min_delta` | Fails with the same error if a partition's consumption offset is expired |
| Table Stream with `type = detail` or `append_only` | Skips expired changes and reads from the first retained TSO |
| MoW snapshot reads (`FOR TIME AS OF`, `FOR VERSION AS OF`, or a Stream's `@snapshot()`) | When reconstruction requires Row Binlog, an expired target snapshot fails with the same error because its before images are no longer available in the retention window |
| `binlog()` table function | Does not apply the TTL filter; it can still show expired raw records until physical cleanup removes them |

Expiration does not wait for consumers. Consume changes within the retention window, even if a Stream is still reported as usable by `IS_STALE` / `STALE_REASON`: these fields do not report TTL expiration in the current implementation. After required changes have expired, rebuild downstream data from a full snapshot. For a Table Stream, use the [reset procedure](table-stream-advanced#reset-reset) to reload downstream and advance the offsets. Manage IVM's internal Streams through [materialized view refresh tasks](../../query-acceleration/materialized-view/async-materialized-view/incremental-materialized-view#internal-table-streams).

### Example: expired changes with base data preserved

Run this example in an existing database with `CREATE` and `LOAD` privileges, and `SELECT` privilege for the queries:

```sql
CREATE TABLE row_binlog_ttl_demo (id INT, value INT)
DUPLICATE KEY(id)
DISTRIBUTED BY HASH(id) BUCKETS 1
PROPERTIES (
    "replication_num" = "1",
    "binlog.enable" = "true",
    "binlog.format" = "ROW",
    "binlog.ttl_seconds" = "30"
);

INSERT INTO row_binlog_ttl_demo VALUES (1, 10);

SELECT COUNT(*) AS change_count
FROM row_binlog_ttl_demo@incr("incrementType" = "DETAIL");
```

Immediately after the insert, the query returns:

```text
+--------------+
| change_count |
+--------------+
|            1 |
+--------------+
```

Wait more than 30 seconds, then run the incremental query again:

```sql
SELECT COUNT(*) AS change_count
FROM row_binlog_ttl_demo@incr("incrementType" = "DETAIL");
```

```text
+--------------+
| change_count |
+--------------+
|            0 |
+--------------+
```

The base row is still present:

```sql
SELECT id, value FROM row_binlog_ttl_demo;
```

```text
+------+-------+
| id   | value |
+------+-------+
|    1 |    10 |
+------+-------+
```

### Physical cleanup and capacity planning

Background compaction reclaims fully expired Row Binlog Rowsets, including on idle tables. A Rowset that also contains unexpired records is retained until all its records expire. Cleanup preserves base-table data and version continuity. Storage is reclaimed asynchronously, so the TTL is not a deadline for files to disappear or a strict storage size limit.

Automatic cleanup requires `enable_feature_binlog = true` on the BEs and automatic compaction to be enabled. Setting the BE configuration or table property `disable_auto_compaction = true` pauses automatic cleanup, but incremental reads still filter expired records. After a BE restart, cleanup waits for a valid reference TSO from a Master FE heartbeat.

`binlog.max_bytes` and `binlog.max_history_nums` still have no effect on Row Binlog. Reserve storage according to write volume, TTL and cleanup delay. For MoW tables with the before image enabled, every update stores an additional copy of the old values. Set the TTL longer than the maximum consumption delay, refresh interval and expected outage, with time for recovery.

## Write overhead

<!-- Knowledge type: Performance notes -->
<!-- Use cases: Evaluating load throughput before going to production -->

With Row Binlog enabled, every write additionally generates and persists change records; on MoW tables, updates and deletes also read the old values to build the before image. Load throughput drops noticeably, and the actual amount depends on the table schema and the update ratio. Recommendations:

- Enable it only on tables that really need incremental consumption.
- Evaluate the throughput change with a realistic write workload before going to production.
- Do not enable `binlog.need_historical_value` if the values before a change are not needed (for example, `append_only` consumption or only the latest values matter).

## Troubleshooting with the binlog() table function

<!-- Knowledge type: Troubleshooting -->
<!-- Use cases: Confirming whether a write produced the expected changes / Inspecting the change history of a key -->

The `binlog()` table function returns the raw change records of a table, for example to confirm whether a write produced the expected changes or to inspect the change history of a key.

:::caution
`binlog()` is mainly for internal debugging and is not recommended in production data pipelines. Its output format and parameters may change between versions; use [Table Stream](table-stream) or [`@incr`](incremental-query) for real incremental consumption.
:::

```sql
SELECT __DORIS_BINLOG_OP__, __DORIS_BINLOG_TSO__, __DORIS_BINLOG_LSN__,
       order_id, status, amount
FROM binlog(
    "db" = "demo",
    "table" = "orders",
    "partition" = "p20260914"
)
WHERE order_id = 1
ORDER BY __DORIS_BINLOG_TSO__, __DORIS_BINLOG_LSN__;
```

| Parameter | Required | Description |
|---|---|---|
| `table` | Yes | Table name |
| `db` | No | Database name, defaults to the current database |
| `partition` | No | Partition names separated by commas; defaults to all partitions |
| `tablet` | No | Tablet IDs separated by commas; defaults to all tablets |

`binlog()` reads the stored raw records without change folding or TTL filtering, and its `__DORIS_BINLOG_OP__` uses the raw encoding (`0` insert, `1` update, `2` delete). Expired records may remain visible here until physical cleanup finishes. The full syntax is in [BINLOG table function](../../sql-manual/sql-functions/table-valued-functions/binlog).

## Common errors

<!-- Knowledge type: Troubleshooting -->

| Error message | Cause | Action |
|---|---|---|
| `Invalid binlog format value: row` | `binlog.format` was given in lowercase | The value is case-sensitive; use uppercase `ROW` |
| `ROW binlog.ttl_seconds must be greater than 0` | The TTL is `0` or negative | Set a positive integer in seconds; the default is `86400` |
| `Row binlog offset has expired according to binlog.ttl_seconds` | A `MIN_DELTA` start or a MoW snapshot is outside the retention window | Rebuild downstream from a full snapshot and realign consumption; see [Effect on reads](#effect-on-reads) |
| `not support change binlog format from STATEMENT_AND_SNAPSHOT to ROW` | `ALTER TABLE` was used to enable Row Binlog on an existing table | Row Binlog can only be enabled at table creation. Create a new table with Row Binlog enabled, load the data, and swap the two with `ALTER TABLE ... REPLACE WITH TABLE` |
| `can't disable binlog when format is [Row]` | `binlog.enable = false` was set on a table with Row Binlog enabled | Row Binlog cannot be disabled once enabled |
| `not support change binlog.need_historical_value from true to false` | `binlog.need_historical_value` was modified | The property cannot be changed after creation |
| `Duplicate table model don't support record historical value` | `binlog.need_historical_value = true` was set on a Duplicate Key table | Duplicate Key tables have no before image; remove the property, or use a Unique Key MoW table if the before image is needed |
| `Unique merge-on-write tables with cluster keys do not support binlog<Row>` | The MoW table has cluster keys | Create the table without cluster keys |
| `Only duplicate and mow table model support binlog<Row>` | The table model is Aggregate Key or Unique Key Merge-on-Read | Use a Duplicate Key or Unique Key MoW table |
| `Not allowed to perform current operation on Table With binlog<row>` | A disallowed DDL was run, such as `MODIFY COLUMN`, `RENAME COLUMN`, `ORDER BY`, `BUILD INDEX`, or modifying bloom filter properties | See the allowed list in [DDL restrictions](#ddl-restrictions) |
