---
{
    "title": "Incremental View Maintenance (IVM)",
    "language": "en",
    "description": "How Doris 5.0 uses Incremental View Maintenance (IVM) to process row-level base table inserts, updates and deletes, and how to configure refresh, fallback, diagnostics and production operations.",
    "keywords": [
        "Incremental View Maintenance",
        "IVM",
        "Doris IVM",
        "async materialized view",
        "materialized view incremental maintenance",
        "materialized view row-level update",
        "IVM incremental refresh",
        "IVM refresh interval",
        "IVM scheduled refresh",
        "IVM fallback",
        "IvmFallbackReason",
        "internal Table Stream",
        "row-level incremental refresh",
        "REFRESH INCREMENTAL",
        "INCREMENTAL FALLBACK",
        "Row Binlog",
        "Table Stream"
    ]
}
---

<!-- Knowledge type: Feature description / How-to guide / Parameter reference / Troubleshooting -->
<!-- Use cases: Frequent base table inserts, updates and deletes / Small share of changed rows / Expensive full or partition recomputation -->

Incremental View Maintenance (IVM) maintains an asynchronous materialized view based on row-level changes in its base tables. A regular asynchronous materialized view recomputes all of its data or every affected partition; IVM computes only the rows inserted, updated and deleted in the base tables between two refreshes and applies those changes to the materialized view.

:::caution Experimental feature
IVM is available since Doris 5.0.0. It is experimental and disabled by default. Before using it, enable Row Binlog and Table Stream in the FE configuration. See [Prerequisites](#prerequisites).
:::

<!-- Knowledge type: Scenario selection -->
<!-- Use cases: Choosing IVM / Estimating refresh cost -->

## When to use IVM

Compare the number of changed rows per refresh, the size of the affected partitions and your consistency requirements before choosing a refresh method.

| Scenario | Recommendation | Reason |
|---|---|---|
| Base tables receive frequent inserts, updates and deletes, and the changed rows are a small share of the table or partition | Use IVM | Only the row-level changes between two refreshes are computed, so whole partitions are not recomputed |
| Changes are concentrated in a few partitions and recomputing those partitions is affordable | Use `PARTITIONS` | Simpler to configure; recomputes the affected partitions |
| Building the first baseline, small data volume, or recovering the IVM baseline | Use `COMPLETE` | Recomputes all data of the materialized view |
| Results must be transactionally consistent with the base tables in real time | Do not use an asynchronous materialized view | IVM still refreshes through asynchronous tasks and does not provide real-time consistency |

<!-- Knowledge type: Architecture decision -->
<!-- Use cases: Choosing between INCREMENTAL / PARTITIONS / COMPLETE / AUTO -->

## Differences from partition-level incremental refresh

Doris supports four refresh methods for asynchronous materialized views. IVM corresponds to `INCREMENTAL`. Do not confuse it with the partition-level incremental refresh provided by `PARTITIONS`.

| Refresh method | Computation granularity | Suitable scenario | Behavior when the conditions are not met |
|---|---|---|---|
| `INCREMENTAL` | Row-level changes | The number of changed rows is far smaller than the whole table or the affected partitions | Fails by default; can fall back when `FALLBACK` is specified |
| `PARTITIONS` | Every affected materialized view partition | Changes are concentrated in a few partitions and recomputing them is affordable | Fails by default; falls back to `COMPLETE` when `FALLBACK` is specified |
| `COMPLETE` | All data | Small data volume, first baseline, or recovering the IVM baseline | Always recomputes everything |
| `AUTO` | Chosen automatically by Doris | You want Doris to pick an available strategy | Tries IVM, partition refresh and complete refresh in turn, whichever is available |

`INCREMENTAL FALLBACK` only changes how failures are handled at refresh time. When the materialized view is created, its definition SQL must still satisfy the IVM requirements; `FALLBACK` does not let an unsupported definition pass the creation check.

<!-- Knowledge type: How it works -->
<!-- Use cases: Understanding the IVM data flow / Consistency mechanism -->

## How it works

IVM reuses the Row Binlog and Table Stream capabilities of Doris:

![How IVM works: base table changes flow into Row Binlog and then into internal Table Streams; the delta plan combines unconsumed changes with a consistent snapshot to update the materialized view and advances the consumption offsets in the same transaction](/images/next/query-acceleration/ivm-workflow.jpg)

When a materialized view that supports IVM is created, Doris creates an internal Table Stream for every base table that participates in incremental maintenance. The names of internal Streams start with `__doris_ivm_stream_`. You do not need to create, consume or drop these Streams.

At refresh time, Doris generates a delta plan from the unconsumed changes of each base table. For join queries, it also reads a snapshot of the base tables aligned with the consumption offsets, so that multi-table computation uses a consistent data boundary. The materialized view data and the consumption offsets are committed in the same transaction; if the transaction fails, neither is committed.

<!-- Knowledge type: Pre-deployment checklist -->
<!-- Use cases: Enabling IVM / Evaluating tables before creation -->

## Prerequisites

### Version and FE configuration

1. Use Doris 5.0.0 or later.
2. Set the following options in `fe.conf` on every FE and restart the FEs:

    ```text
    enable_feature_binlog = true
    enable_table_stream = true
    ```

Both options are static (non-dynamic) configurations. `enable_feature_binlog` turns on Row Binlog and the global commit timestamp; `enable_table_stream` turns on Table Stream DDL and internal Stream management.

### Base table requirements

Base tables that participate in incremental maintenance must be Doris OLAP internal tables in the Internal Catalog and meet the following requirements:

| Base table model | Supported | Requirements and behavior |
|---|---|---|
| Unique Key Merge-on-Write | Yes | Row Binlog and the before image must be enabled; inserts, updates and deletes are all handled |
| Duplicate Key | Yes | Row Binlog must be enabled; only appended changes are provided, and deletes executed through delete predicates are not recorded |
| Unique Key Merge-on-Read | No | Use Merge-on-Write instead |
| Aggregate Key | Not for incremental maintenance | Can only be used as a table listed in `excluded_trigger_tables` that does not trigger incremental refresh |
| External tables | No | The incremental base tables of an IVM must be Doris internal tables |

For workloads that need to handle updates and deletes, use a Unique Key Merge-on-Write table and set the following properties when creating it:

```sql
PROPERTIES (
    "enable_unique_key_merge_on_write" = "true",
    "binlog.enable" = "true",
    "binlog.format" = "ROW",
    "binlog.need_historical_value" = "true"
);
```

Row Binlog can only be enabled when the table is created and cannot be disabled afterwards. For the full list of table model, column type, write method and DDL restrictions, see [Row Binlog](../../../data-operate/incremental/row-binlog).

<!-- Knowledge type: Step-by-step guide -->
<!-- Use cases: First-time setup / Feature verification -->

## Quick start

The following example creates an IVM that aggregates orders by status. The first refresh uses `COMPLETE` to build a full baseline; later refreshes use `INCREMENTAL FALLBACK` to process row-level changes.

The steps are:

1. Create a Unique Key Merge-on-Write base table with Row Binlog enabled.
2. Create the IVM with `REFRESH INCREMENTAL FALLBACK`.
3. Run a `COMPLETE` refresh to build the full baseline.
4. Change the base table data and run an incremental refresh.
5. Query the refresh task to confirm the result and the fallback reason.

### Step 1: Create the base table and load initial data

Create a base table that supports updates and deletes, with Row Binlog and the before image enabled:

```sql
CREATE DATABASE IF NOT EXISTS ivm_demo;
USE ivm_demo;

CREATE TABLE orders (
    order_id BIGINT,
    order_status VARCHAR(16),
    amount DECIMAL(10, 2)
)
UNIQUE KEY(order_id)
DISTRIBUTED BY HASH(order_id) BUCKETS 1
PROPERTIES (
    "replication_num" = "1",
    "enable_unique_key_merge_on_write" = "true",
    "binlog.enable" = "true",
    "binlog.format" = "ROW",
    "binlog.need_historical_value" = "true"
);

INSERT INTO orders VALUES
    (1, 'created', 100.00),
    (2, 'created', 200.00),
    (3, 'paid',    300.00);
```

### Step 2: Create the IVM

Specify `REFRESH INCREMENTAL` in `CREATE MATERIALIZED VIEW`. This example also specifies `FALLBACK`, so that Doris can fall back to a partition refresh or a complete refresh when a change cannot be computed incrementally in a safe way. The trigger is `ON MANUAL` so that each refresh can be observed step by step; production views usually switch to a scheduled or on-commit trigger, see [Setting the automatic refresh interval](#setting-the-automatic-refresh-interval).

```sql
CREATE MATERIALIZED VIEW orders_by_status
BUILD DEFERRED
REFRESH INCREMENTAL FALLBACK ON MANUAL
DISTRIBUTED BY RANDOM BUCKETS 1
PROPERTIES (
    "replication_num" = "1"
)
AS
SELECT
    order_status,
    COUNT(*) AS order_count,
    SUM(amount) AS total_amount
FROM orders
GROUP BY order_status;
```

After the view is created, Doris automatically creates the corresponding internal Table Stream. You can check the mapping with `mv_infos`:

```sql
SELECT Name, RefreshInfo, IvmBaseTableStreams
FROM mv_infos("database" = "ivm_demo")
WHERE Name = "orders_by_status";
```

### Step 3: Build the full baseline

Use `COMPLETE` for the first refresh to build the baseline for later incremental maintenance:

```sql
REFRESH MATERIALIZED VIEW orders_by_status COMPLETE;
```

The refresh task runs asynchronously. After the task succeeds, query the materialized view:

```sql
SELECT order_status, order_count, total_amount
FROM orders_by_status
ORDER BY order_status;
```

```text
+--------------+-------------+--------------+
| order_status | order_count | total_amount |
+--------------+-------------+--------------+
| created      |           2 |       300.00 |
| paid         |           1 |       300.00 |
+--------------+-------------+--------------+
```

### Step 4: Write changes and run an incremental refresh

The following statements update order 1, delete order 2 and insert order 4:

```sql
INSERT INTO orders VALUES (1, 'paid', 100.00);
DELETE FROM orders WHERE order_id = 2;
INSERT INTO orders VALUES (4, 'created', 400.00);

REFRESH MATERIALIZED VIEW orders_by_status INCREMENTAL FALLBACK;
```

After the refresh task succeeds, IVM has processed only the row-level changes above. The materialized view now contains:

```sql
SELECT order_status, order_count, total_amount
FROM orders_by_status
ORDER BY order_status;
```

```text
+--------------+-------------+--------------+
| order_status | order_count | total_amount |
+--------------+-------------+--------------+
| created      |           1 |       400.00 |
| paid         |           2 |       400.00 |
+--------------+-------------+--------------+
```

### Step 5: Confirm the refresh method and fallback reason

Query the latest refresh task to confirm the requested method, the actual refresh scope and the fallback reason:

```sql
SELECT Status, TaskContext, RefreshMode, IvmFallbackReason, ErrorMsg
FROM tasks("type" = "mv")
WHERE MvDatabaseName = "ivm_demo"
  AND MvName = "orders_by_status"
ORDER BY CreateTime DESC, TaskId DESC
LIMIT 1;
```

- `TaskContext` records the refresh method requested by this task, for example `INCREMENTAL`.
- `RefreshMode` records the partition scope the task actually refreshed: `COMPLETE`, `PARTIAL` or `NOT_REFRESH`.
- `IvmFallbackReason` is empty when no IVM fallback happened; otherwise it records a stable fallback reason.
- `ErrorMsg` records the details of a failed strict incremental refresh.

<!-- Knowledge type: Compatibility reference -->
<!-- Use cases: Evaluating SQL before creation / Diagnosing unsupported syntax -->

## Supported queries

IVM checks the definition SQL when the materialized view is created. With an explicit `REFRESH INCREMENTAL`, an unsupported definition makes the creation fail.

### Supported relational operations

| Operation | Support |
|---|---|
| Column selection and expression projection | Supported |
| `WHERE` filters | Supported |
| `GROUP BY` aggregation | Supported; the aggregation must be at the top level of the query, with only projections above it |
| `INNER JOIN`, `CROSS JOIN` | Supported |
| `LEFT OUTER JOIN`, `RIGHT OUTER JOIN`, `FULL OUTER JOIN` | Supported; the preserved side must have a deterministic row identity |
| Nested outer joins | Supported; complex subtrees on the null-producing side noticeably enlarge the refresh plan |
| `UNION ALL` | Supported |
| Single-row constant relations | Supported; the first refresh builds the baseline with `COMPLETE` |
| Subquery aliases | Supported |
| Creating an IVM on top of another IVM | Supported |

The following forms are not supported:

- `SELECT DISTINCT` and `UNION DISTINCT`.
- `UNION ALL` with constant branches.
- `ORDER BY`, `LIMIT` and window functions.
- Mark Join, for example the join produced from a correlated subquery with disjunctive conditions.
- Plan nodes outside the allowlist above.
- Using a regular asynchronous materialized view as an IVM base table. Chained maintenance requires the lower-level materialized view to be an IVM as well.

### Supported aggregate functions

IVM supports the following aggregate functions. Their arguments can be columns or deterministic expressions:

- `COUNT(*)`, `COUNT(expr)`
- `SUM`
- `AVG`
- `MIN`
- `MAX`
- `BITMAP_UNION`
- `BITMAP_UNION_COUNT`
- `ARRAY_AGG`
- `COLLECT_LIST`

Aggregate functions with `DISTINCT` are not supported. `ARRAY_AGG` does not support JSONB or VARIANT element types.

Some aggregate functions cannot safely derive the new result from the current delta alone when rows are deleted:

- When a deleted value may be the current `MIN` or `MAX`, the full data must be read again.
- When a delete affects a Bitmap aggregation result, the full Bitmap must be recomputed.

Strict `INCREMENTAL` fails in these cases; `INCREMENTAL FALLBACK` falls back to `COMPLETE`.

<!-- Knowledge type: Runtime behavior / Failure handling -->
<!-- Use cases: Configuring the refresh strategy / Automatic refresh interval / Diagnosing IVM fallback / Rebuilding the baseline -->

## Refresh and fallback

### Choosing the refresh strategy at creation time

| Definition | Behavior at creation | Default behavior of later refreshes |
|---|---|---|
| `REFRESH INCREMENTAL` | Strictly checks the IVM support scope; creation fails if unsupported | Only tries IVM; the task fails if IVM fails |
| `REFRESH INCREMENTAL FALLBACK` | Same as strict mode; the IVM check must still pass | Tries IVM first, then falls back according to the reason |
| `REFRESH AUTO` | Probes whether the definition supports IVM; if not, creates a regular asynchronous materialized view | For views that support IVM, tries IVM, partition refresh and complete refresh in turn |
| `REFRESH PARTITIONS [FALLBACK]` | Requires the materialized view to define `PARTITION BY` | Recomputes the changed partitions; with `FALLBACK`, can fall back to a complete refresh |
| `REFRESH COMPLETE` | Does not create IVM metadata | Always refreshes completely |

### Setting the automatic refresh interval

IVM reuses the trigger methods of asynchronous materialized views and has no trigger syntax of its own. Specify the trigger in the `ON` clause after `REFRESH INCREMENTAL [FALLBACK]`:

| Trigger | Syntax | Description |
|---|---|---|
| Manual | `ON MANUAL` | Default. Refreshes only when `REFRESH MATERIALIZED VIEW` is executed |
| Scheduled | `ON SCHEDULE EVERY <interval> <unit> [STARTS '<start_time>']` | Runs an incremental refresh automatically at a fixed interval |
| On commit | `ON COMMIT` | Runs an incremental refresh automatically after a load transaction commits on a base table |

The rules for the scheduled interval are:

- `<interval>` must be a positive integer, and `<unit>` can be `MINUTE`, `HOUR`, `DAY` or `WEEK`.
- **The minimum refresh interval is `EVERY 1 MINUTE`.** Specifying `SECOND` fails with `interval time unit can not be second`. The FE option `enable_job_schedule_second_for_test` allows second-level intervals, but it is for testing only and must not be enabled in production.
- `STARTS` sets the first scheduling time in the format `'yyyy-MM-dd HH:mm:ss'` and must be later than the current time. Without it, the first refresh runs one interval after the materialized view is created. Later runs are fixed at the first scheduling time plus whole multiples of the interval, regardless of when the previous task finished.

The following example runs an incremental refresh every 5 minutes and allows fallback when a change cannot be computed incrementally:

```sql
CREATE MATERIALIZED VIEW orders_by_status
BUILD IMMEDIATE
REFRESH INCREMENTAL FALLBACK ON SCHEDULE EVERY 5 MINUTE
DISTRIBUTED BY RANDOM BUCKETS 1
PROPERTIES (
    "replication_num" = "1"
)
AS
SELECT
    order_status,
    COUNT(*) AS order_count,
    SUM(amount) AS total_amount
FROM orders
GROUP BY order_status;
```

Scheduled and on-commit tasks run with the refresh strategy defined when the materialized view was created: `INCREMENTAL` only tries IVM, `INCREMENTAL FALLBACK` tries IVM first and then falls back according to the reason, and `AUTO` tries IVM, partition refresh and complete refresh in turn. Automatically triggered tasks also behave as follows:

- **The first automatic refresh builds the baseline by itself.** If the materialized view has never been refreshed successfully (for example, it was created with `BUILD DEFERRED` and not refreshed yet), the first scheduled or on-commit task automatically runs `COMPLETE` to build the full baseline; you do not need to run `COMPLETE` by hand. Later tasks then refresh incrementally.
- **Refresh tasks of one materialized view run serially, and surplus triggers are skipped.** At most one running and one waiting automatically triggered task are kept. When the interval is shorter than the duration of a single refresh, or base tables commit very frequently under `ON COMMIT`, new triggers are skipped and the FE metric `async_materialized_view_task_skip_num` increases. The waiting task consumes all accumulated changes in one run, so no change is lost, but the actual refresh latency is longer than the configured interval. Choose an interval that lets a single incremental refresh finish within one interval under normal load.
- **`ON COMMIT` is triggered only by base tables that participate in incremental maintenance.** Commits on tables listed in `excluded_trigger_tables` do not trigger a refresh, see [excluded_trigger_tables](#excluded_trigger_tables).

When changing the trigger, specify only the `ON` clause and do not repeat `INCREMENTAL`. The refresh method of an IVM cannot be changed with `ALTER`, so `ALTER MATERIALIZED VIEW ... REFRESH INCREMENTAL ...` is rejected; changing only the trigger is allowed, and Doris recreates the scheduling job with the new trigger:

```sql
ALTER MATERIALIZED VIEW orders_by_status REFRESH ON SCHEDULE EVERY 1 MINUTE;
ALTER MATERIALIZED VIEW orders_by_status REFRESH ON COMMIT;
ALTER MATERIALIZED VIEW orders_by_status REFRESH ON MANUAL;
```

### Overriding the refresh method manually

After an IVM is created, you can run any of the following as needed:

```sql
REFRESH MATERIALIZED VIEW <mv_name> INCREMENTAL;
REFRESH MATERIALIZED VIEW <mv_name> INCREMENTAL FALLBACK;
REFRESH MATERIALIZED VIEW <mv_name> PARTITIONS;
REFRESH MATERIALIZED VIEW <mv_name> PARTITIONS FALLBACK;
REFRESH MATERIALIZED VIEW <mv_name> COMPLETE;
```

An IVM does not allow the legacy `PARTITION (<partition_name>)` or `PARTITIONS (<partition_name>, ...)` syntax for naming the partitions to refresh. Use the `PARTITIONS` keyword to let Doris compute the partitions that need refreshing, or use `COMPLETE` to refresh all data.

### Fallback order

When the request allows fallback, Doris tries the following order by default:

```text
IVM -> PARTITIONS -> COMPLETE
```

Some failures mean that the existing IVM baseline can no longer be used safely. In those cases Doris skips the partition refresh and runs `COMPLETE` directly. Common reasons include:

| `IvmFallbackReason` | Meaning | Recovery |
|---|---|---|
| `BINLOG_BROKEN` | The previous refresh did not finish completely, or an internal Stream can no longer be used | Complete refresh and realign the baseline |
| `MIN_MAX_BOUNDARY_HIT` | A delete may change the current `MIN` or `MAX` | Recompute the aggregation result completely |
| `BITMAP_AGG_DELETE` | A delete affects a Bitmap aggregation | Recompute the Bitmap completely |
| `PLAN_SIGNATURE_MISMATCH` | The current query plan does not match the persisted IVM layout | Complete refresh and build a new baseline |
| `INCOMPLETE_REFRESH_SNAPSHOT` | No complete refresh snapshot is available for the fallback chain yet | Complete refresh to build the baseline |

Strict `INCREMENTAL` never falls back. When the task fails, the materialized view keeps the data it had before the refresh, and the consumption offsets of the internal Streams do not advance. After fixing the error, you can run the incremental refresh again, or run `COMPLETE` to rebuild the baseline.

### First refresh and baseline rebuild

Run `COMPLETE` once after creating an IVM before starting incremental refreshes. The following situations may also require rebuilding the full baseline:

- Structural changes of the materialized view or the base tables change the IVM layout signature.
- The continuity of Row Binlog or an internal Stream is broken.
- `ivm_partition_window_limit` is widened or removed, bringing previously ignored partitions back into the maintenance scope.
- `excluded_trigger_tables` is modified, changing the set of base tables that participate in incremental maintenance.

While a baseline rebuild is pending, strict `INCREMENTAL` fails and prompts you to run `AUTO` or `COMPLETE` first.

<!-- Knowledge type: Troubleshooting -->
<!-- Use cases: Verifying the delta plan / Previewing refresh data -->

## Previewing and explaining the delta plan

### Viewing the refresh plan with EXPLAIN

The following command only generates the plan. It does not modify the materialized view data, the internal Stream offsets or the IVM metadata:

```sql
EXPLAIN REFRESH MATERIALIZED VIEW <mv_name> INCREMENTAL;
```

By default the plan only includes the Streams that currently have unconsumed data. To inspect the full structure of the delta plan, use:

```sql
EXPLAIN REFRESH MATERIALIZED VIEW <mv_name> INCREMENTAL WITH ALL STREAMS;
```

`WITH ALL STREAMS` also puts the Streams that have already been fully consumed into the plan, which is useful for inspecting the complete incremental shape of a multi-table join. It does not change any persisted state.

You can also explain the complete refresh plan:

```sql
EXPLAIN REFRESH MATERIALIZED VIEW <mv_name> COMPLETE;
```

### Viewing the rows to be written with DRY RUN

`WITH DRY RUN` executes the delta query of the next incremental refresh and returns the result to the client, without writing to the materialized view or advancing the Stream offsets:

```sql
REFRESH MATERIALIZED VIEW <mv_name> INCREMENTAL WITH DRY RUN;
REFRESH MATERIALIZED VIEW <mv_name> INCREMENTAL WITH DRY RUN LIMIT 100;
REFRESH MATERIALIZED VIEW <mv_name> INCREMENTAL WITH DRY RUN LIMIT 100 OFFSET 200;
```

The result contains the rows the refresh would actually write, so besides the business columns it also includes internal columns such as the IVM, Sequence and Delete Sign columns. As long as the base table data does not change, repeated executions return the same result.

`DRY RUN` only supports the `INCREMENTAL` refresh of an IVM. It cannot be combined with `COMPLETE`, `EXPLAIN` or partition refresh.

<!-- Knowledge type: Operations -->
<!-- Use cases: Monitoring internal Streams / Lifecycle management -->

## Internal Table Streams

IVM manages the full lifecycle of its internal Table Streams automatically:

- When an IVM is created, an internal Stream is created for every base table that participates in incremental maintenance.
- When `excluded_trigger_tables` is modified, internal Streams are added or removed according to the new set of base tables.
- When an IVM is dropped, the internal Streams owned by that materialized view are cleaned up.
- During a refresh, consumption offsets are recorded and advanced per base table partition.

You can view the mapping between base tables and internal Streams directly with `mv_infos`:

```sql
SELECT Name, IvmBaseTableStreams
FROM mv_infos("database" = "<database_name>")
WHERE Name = "<mv_name>";
```

You can also check Stream status and partition backlog in `information_schema.table_streams` and `information_schema.table_stream_consumption`.

:::warning Do not manage internal Streams manually
Internal Streams start with `__doris_ivm_stream_` and are reserved for IVM. Do not consume them with `INSERT INTO ... SELECT`, and do not drop or recreate them manually. Doris rejects regular `INSERT INTO` consumption of internal Streams.
:::

For the offset, snapshot and concurrency semantics of Table Streams, see [Table Stream Basics](../../../data-operate/incremental/table-stream) and [Table Stream Advanced](../../../data-operate/incremental/table-stream-advanced).

<!-- Knowledge type: Configuration parameters -->
<!-- Use cases: IVM key design / Incremental partition window / Refresh resource control -->

## IVM properties

Choose properties based on row identity, partition window and trigger relationships first, then evaluate the detailed impact with the sections below.

| Property | Default | Modifiable | Effect |
|---|---|---|---|
| `ivm_use_full_keys` | `false` | No | Adds the row identity keys of the source rows to the Unique Key of the materialized view, reducing the risk of hash collisions |
| `ivm_partition_window_limit` | Unlimited | Yes | Maintains only the last N partitions of the specified base tables, ordered by partition value |
| `excluded_trigger_tables` | None | Yes | Base tables that get no internal Stream and do not trigger incremental refresh on their own |

### ivm_use_full_keys

`ivm_use_full_keys` controls whether the Unique Key of the materialized view also includes the identity keys of the source rows:

| Item | Description |
|---|---|
| Type | Boolean |
| Default | `false` |
| Modifiable | No; can only be set when the IVM is created |
| Effect | Reduces the risk of hash collisions when a composite row identity is hashed |
| Cost | Increases the key width and storage overhead of the materialized view |

```sql
PROPERTIES (
    "ivm_use_full_keys" = "true"
)
```

Enable this property when the query contains multi-table joins, `UNION ALL` or chained IVMs, and avoiding row identity hash collisions matters more to your workload. Before enabling it, confirm that the types and total length of the source keys satisfy the Doris Unique Key limits.

### ivm_partition_window_limit

`ivm_partition_window_limit` restricts each IVM refresh to the last N partitions of the specified base tables, ordered by partition value. The format is `<table_name>:<partition_count>`, with multiple tables separated by commas:

```sql
PROPERTIES (
    "ivm_partition_window_limit" = "orders:7,users:1"
)
```

This property only limits the partitions read by IVM incremental refresh. It is not a partition retention policy for the materialized view. `COMPLETE` still reads the full base tables and builds the full result. Changes in old partitions excluded by the window never enter later IVM results, so this is a lossy setting that only suits workloads that explicitly care about recent partitions only.

You can modify this property with `ALTER MATERIALIZED VIEW ... SET`. Widening the window or removing the limit requires a full baseline rebuild on the next refresh, because previously ignored changes cannot be recovered from the existing offsets.

### excluded_trigger_tables

Base tables listed in `excluded_trigger_tables` get no internal Stream and do not trigger incremental refresh on their own. When a refresh is triggered by changes in other base tables, Doris still reads the current data of these tables during the computation.

Only exclude dimension tables that rarely change, or tables whose changes may wait until a refresh is triggered by another base table. Excluding a frequently changing table leaves the materialized view with stale results after that table changes on its own.

### Resource and partition properties

- `workload_group`: the Workload Group used by refresh tasks, for limiting CPU and memory resources.
- `partition_sync_limit`, `partition_sync_time_unit`: control the range of partitions the materialized view retains and synchronizes. This differs from the incremental read window of `ivm_partition_window_limit`.
- `refresh_partition_num`: controls how many partitions a single `INSERT` processes during partition refresh and fallback. It does not control the number of rows in an IVM delta.

For all materialized view properties, see [CREATE ASYNC MATERIALIZED VIEW](../../../sql-manual/sql-statements/table-and-view/async-materialized-view/CREATE-ASYNC-MATERIALIZED-VIEW).

<!-- Knowledge type: Limitations -->
<!-- Use cases: Production readiness / Performance risk review -->

## Limitations and notes

- IVM can only be enabled when the materialized view is created. You cannot turn a regular materialized view into an IVM with `ALTER MATERIALIZED VIEW`, nor change an IVM to another default refresh method. To switch, recreate the materialized view.
- Enabling Row Binlog adds write and storage overhead. Unique Key MoW tables also need to read and store the values before each update. Enable it only for base tables that really need IVM, and evaluate load throughput with realistic workloads before going to production.
- IVM still refreshes through asynchronous tasks and does not provide real-time consistency with base table transactions. Refresh latency depends on the trigger method, queueing time and the execution time of the delta plan. The minimum scheduled interval is 1 minute, see [Setting the automatic refresh interval](#setting-the-automatic-refresh-interval).
- Complex nested outer joins enlarge the delta plan, especially complex subtrees on the null-producing side. When planning or refresh becomes too expensive, simplify the joins or materialize the complex subtree as a lower-level IVM first.
- `MIN`, `MAX` and Bitmap aggregations require a complete recomputation in some delete scenarios. In production, use `INCREMENTAL FALLBACK` or `AUTO` and monitor `IvmFallbackReason`.
- The table model, column type, schema change and delete restrictions of Row Binlog apply directly to IVM. See [Supported scope and limitations of Row Binlog](../../../data-operate/incremental/row-binlog#supported-scope-and-limitations).

<!-- Knowledge type: FAQ / Troubleshooting -->
<!-- Use cases: Creation failure / Refresh fallback / Baseline rebuild / Data latency -->

## FAQ

When creation fails, a refresh falls back, or the data is not updated, use the table below to locate the cause.

| Problem | Diagnosis and handling |
|---|---|
| `CREATE MATERIALIZED VIEW ... REFRESH INCREMENTAL` fails | Check that `enable_feature_binlog` and `enable_table_stream` are enabled on the FEs, that the base tables meet the table model and Row Binlog requirements, and that the definition SQL is within the IVM support scope |
| A strict incremental refresh asks for a baseline rebuild | Run a `COMPLETE` or `AUTO` refresh to build a new full baseline, then run the strict incremental refresh again |
| `ON SCHEDULE EVERY 30 SECOND` fails with `interval time unit can not be second` | The minimum scheduled interval is `EVERY 1 MINUTE`, and the unit can only be `MINUTE`, `HOUR`, `DAY` or `WEEK`. Use `ON COMMIT` when lower latency is needed, see [Setting the automatic refresh interval](#setting-the-automatic-refresh-interval) |
| The actual latency of scheduled refreshes is longer than the interval | Tasks of one materialized view run serially, and surplus triggers are skipped when a single refresh takes longer than the interval. Check task durations in `tasks("type"="mv")` and the FE metric `async_materialized_view_task_skip_num`, then lengthen the interval, simplify the definition, or give the refresh more resources through `workload_group` |
| The refresh task falls back to `COMPLETE` | Query `IvmFallbackReason` in `tasks("type"="mv")` and handle it according to the reasons in [Fallback order](#fallback-order) |
| The view is not updated after an excluded base table changes on its own | Tables in `excluded_trigger_tables` do not trigger refreshes on their own. Wait for a refresh triggered by other base tables, or adjust the property and rebuild the baseline as prompted |
| Can internal Streams be consumed or reset manually | No. Internal Streams are reserved for IVM; Doris manages their lifecycle and consumption offsets |

<!-- Knowledge type: Best practices -->
<!-- Use cases: Production deployment / Resource planning / Ongoing operations -->

## Best practices

1. **Compare the number of changed rows with the partition size first.** Prefer IVM when changes are a small share of a partition; when changes cover most of a partition, `PARTITIONS` may be simpler.
2. **Enable safe fallback in production.** Use `INCREMENTAL FALLBACK` or `AUTO` so that deletes or baseline problems do not leave refreshes failing for a long time.
3. **Choose the trigger and interval from the refresh duration.** The minimum scheduled interval is 1 minute, and the interval should exceed the duration of a single incremental refresh under normal load; use `ON COMMIT` when lower latency is needed and base tables do not commit too frequently.
4. **Build the full baseline first.** Run `COMPLETE` after creation, verify the result, then start incremental refreshes.
5. **Use Unique Key MoW for update and delete workloads.** Duplicate Key tables only suit append-only data.
6. **Isolate resources for refresh tasks.** Use `workload_group` to keep complex delta plans from competing with online queries.
7. **Monitor tasks and Stream backlog.** Watch `tasks("type"="mv")`, `mv_infos` and `information_schema.table_stream_consumption` together.
8. **Review fallback reasons regularly.** Occasional fallbacks protect correctness; continuous fallbacks indicate that the query shape, Binlog continuity or the baseline needs attention.

<!-- Knowledge type: Step-by-step guide -->
<!-- Use cases: Cleaning up the example environment -->

## Cleaning up the example

```sql
DROP MATERIALIZED VIEW orders_by_status;
DROP TABLE orders;
DROP DATABASE ivm_demo;
```

When an IVM is dropped, Doris also cleans up its internal Table Streams. No separate `DROP STREAM` is needed.

<!-- Knowledge type: Navigation -->

## See also

- Overall capabilities and use cases of asynchronous materialized views: [Async Materialized View Overview](overview)
- Creating, querying and maintaining asynchronous materialized views: [Manage and Query Async Materialized Views](functions-and-demands)
- Refresh strategy selection and resource planning: [Async Materialized View Best Practices](use-guide)
- How to enable Row Binlog and its limitations: [Row Binlog](../../../data-operate/incremental/row-binlog)
- Consumption, offset and snapshot semantics of Table Streams: [Table Stream Basics](../../../data-operate/incremental/table-stream)
- Manual refresh syntax: [REFRESH MATERIALIZED VIEW](../../../sql-manual/sql-statements/table-and-view/async-materialized-view/REFRESH-MATERIALIZED-VIEW)
- Viewing the mapping between an IVM and its internal Streams: [MV_INFOS](../../../sql-manual/sql-functions/table-valued-functions/mv_infos)
- Viewing the refresh scope and fallback reason: [TASKS](../../../sql-manual/sql-functions/table-valued-functions/tasks)
