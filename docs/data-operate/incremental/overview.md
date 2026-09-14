---
{
    "title": "Change Data and Incremental Consumption Overview",
    "language": "en",
    "description": "Row-level change data in Doris 5.0: Row Binlog records inserts, updates and deletes; Table Stream consumes them exactly-once; @incr queries them by time window.",
    "keywords": [
        "Doris incremental consumption",
        "Doris change data",
        "Row Binlog",
        "row-level binlog",
        "Table Stream",
        "@incr incremental query",
        "incremental ETL",
        "downstream table sync",
        "change auditing",
        "CDC",
        "Change Data Capture",
        "UPDATE_BEFORE UPDATE_AFTER",
        "append_only min_delta detail",
        "enable_feature_binlog",
        "enable_table_stream",
        "Merge-on-Write"
    ]
}
---

<!-- Knowledge type: Concept description + Selection guide -->
<!-- Use cases: Incremental ETL / Downstream sync / Change auditing / Incremental reads by time window -->

Starting from version 5.0, Doris can record a row-level change log (Row Binlog) for internal tables and offers two ways to read those changes:

- **Table Stream**: a named consumption object that remembers how far you have consumed. Each read returns only the changes since the last consumption, and reading plus writing into the target table happen in one transaction.
- **Incremental query (`@incr`)**: no object to create. Read the changes of a table within a time window you specify.

:::caution Experimental feature
This feature is available since version 5.0.0. It is experimental and disabled by default. See [Prerequisites](#prerequisites) for how to enable it.
:::

## What problems it solves

<!-- Knowledge type: Problem background -->

Incremental processing inside Doris usually runs into these problems:

| Problem | Without change records | With Row Binlog |
|---|---|---|
| Downstream wants increments but cannot get them | The upstream table receives many updates and deletes every day, so downstream reports, wide tables, and aggregate tables can only be recomputed in full, or rely on an `update_time` column maintained by the application | A Table Stream returns only the changes between two consumptions, so downstream processes the increment |
| Updates and deletes are invisible | An update on a Unique Key table overwrites the old value and a deleted row simply disappears, so there is no way to know afterwards what was changed or deleted | Every insert, update (with the values before and after), and delete of each row is recorded |
| Increments of multiple tables do not line up | When joining incremental data with a dimension table, the dimension table is in its "current" state while the increment covers "a period in the past" | `<stream>@snapshot()` reads the dimension table image aligned with the consumption offset |

Row Binlog records every insert, update (with values before and after the update), and delete of each row, together with a globally monotonic commit timestamp. Table Stream and incremental query read those records in different ways.

## Two layers

<!-- Knowledge type: Architecture description -->

![Two layers of incremental consumption: Row Binlog feeds Table Stream and incremental queries](/images/next/data-operate/incremental/two-layers.png)

| Capability | Object needed | Who tracks the position | Best for |
|---|---|---|---|
| Table Stream | `CREATE STREAM` required | Doris keeps a consumption offset per partition | Continuous incremental ETL, downstream sync, exactly-once consumption |
| Incremental query `@incr` | Nothing to create | You choose the time window | Ad-hoc analysis, external schedulers that manage their own positions |

## Typical scenarios

<!-- Knowledge type: Scenario description -->
<!-- Use cases: Incremental sync to a downstream table / Append-only logs / Change auditing and replay / Joining dimension tables -->

![Recommended incremental consumption approach for four typical scenarios](/images/next/data-operate/incremental/typical-scenarios.png)

| Scenario | Recommended approach | How it works | See |
|---|---|---|---|
| Incremental sync to a downstream table | Table Stream, `min_delta` type | An orders table receives many status updates every day. Create a `min_delta` Table Stream and periodically run `INSERT INTO downstream SELECT ... FROM the orders stream`. Each run processes only the net changes between two executions: new orders, orders whose status changed (with the values before and after), and deleted orders. Reading the changes and writing the downstream table happen in one transaction; a failure rolls back automatically, so nothing is skipped or consumed twice | [Table Stream Basics](table-stream) |
| Append-only logs and event tables | Table Stream, `append_only` type | For detail tables that only receive inserts, fetch only the newly written rows at minimal cost | [Consumption types](table-stream#consumption-types) |
| Change auditing and replay | Table Stream `detail` type, or the `DETAIL` mode of `@incr` | When you need the full trail of every modification, export row-by-row changes by consumption offset or by time window and land them in an audit table | [Incremental Query](incremental-query) |
| Consistent joins between incremental data and dimension tables | `<stream>@snapshot()` | Consuming order changes requires joining the users table. `users_stream@snapshot()` reads the image of the users table aligned with the consumption offset, so a new order is never joined with stale user information or vice versa | [Snapshot reads](table-stream-advanced#snapshot-reads-snapshot) |

## Capability matrix

### Table models

<!-- Knowledge type: Support matrix -->

| Table model | Row Binlog | Before image | Available change types |
|---|---|---|---|
| Duplicate Key | Supported | Not supported | APPEND only |
| Unique Key (Merge-on-Write, without cluster key) | Supported | Supported (`binlog.need_historical_value = true`) | APPEND / UPDATE_BEFORE / UPDATE_AFTER / DELETE |
| Unique Key (Merge-on-Read) | Not supported | - | - |
| Aggregate Key | Not supported | - | - |

Other restrictions (auto-increment columns, VARIANT columns, schema change scope, and so on) are listed in [Row Binlog](row-binlog#supported-scope-and-limitations).

### Choosing a consumption type

<!-- Knowledge type: Selection guide -->

| You need | Choose | Notes |
|---|---|---|
| Only newly inserted rows | `append_only` | Updates and deletes are not emitted; lowest overhead |
| The net change of each key between two consumptions | `min_delta` (default) | Multiple modifications of the same key fold into one UPDATE_BEFORE + UPDATE_AFTER pair; a key inserted and then deleted is not emitted |
| The complete record of every modification | `detail` | Emitted row by row, never folded |

UPDATE_BEFORE and DELETE rows in `min_delta` and `detail` need before images, so the base table must be a MoW table with `binlog.need_historical_value` enabled.

## Prerequisites

<!-- Knowledge type: Environment requirements -->
<!-- Use cases: Pre-deployment check / Enabling the feature -->

1. **Version**: Doris 5.0.0 or later.
2. **FE configuration**: enable the following two items in `fe.conf` and restart the FE (neither is a dynamic configuration):

    ```text
    enable_feature_binlog = true
    enable_table_stream = true
    ```

    `enable_feature_binlog` controls Row Binlog and the allocation of commit timestamps (TSO); `enable_table_stream` controls the Table Stream DDL. When it is off, creating a Stream fails with `Table Stream is experimental. Please set enable_table_stream=true to enable it.`.

3. **Enable Row Binlog at table creation**: Row Binlog can only be enabled when the table is created. An existing table cannot be switched on through `ALTER TABLE`; recreate the table and reload the data.
4. **Deployment mode**: Row Binlog and Table Stream work in both the integrated storage-compute mode and the compute-storage decoupled mode. Use `@incr` incremental queries in the integrated mode for now; support in the decoupled mode is still being completed.

:::tip Write overhead
With Row Binlog enabled, every write additionally generates and persists change records, and MoW tables also need to read the old values. Load throughput drops noticeably. Enable it only on tables that really need incremental consumption, and evaluate with a realistic workload before going to production.
:::

## FAQ

<!-- Knowledge type: FAQ -->

| Question | Answer |
|---|---|
| Can Row Binlog be enabled on an existing table? | No. Row Binlog can only be enabled at table creation; create a new table with Row Binlog enabled and reload the data, see [Row Binlog](row-binlog#enabling-row-binlog) |
| Table Stream or `@incr`? | Continuous incremental ETL that must be exactly-once: Table Stream. Ad-hoc analysis, looking back at changes in a period, or an external system that already manages its own positions: `@incr`, see [Differences from Table Stream](incremental-query#differences-from-table-stream) |
| Creating a Stream fails with `Table Stream is experimental. Please set enable_table_stream=true to enable it.` | `enable_table_stream` is not enabled on the FE; update `fe.conf` and restart the FE |
| Does it work in the compute-storage decoupled mode? | Row Binlog and Table Stream do; use `@incr` in the integrated storage-compute mode for now |
| How does Row Binlog affect writes? | Every write additionally generates and persists change records, and MoW tables also read the old values, so load throughput drops noticeably. Enable it only on tables that need incremental consumption and evaluate with a realistic workload |
| Are change records cleaned up automatically? | Not in the current version; reserve extra storage for tables with Row Binlog, see [Retention and cleanup](row-binlog#retention-and-cleanup) |

## Reading guide

<!-- Knowledge type: Navigation -->

| Page | Content |
|---|---|
| [Quick Start](quick-start) | A 10-minute walkthrough: create the table, create the Stream, write data, view changes, consume |
| [Row Binlog](row-binlog) | How to enable it, properties, supported scope, the change record model, DDL restrictions, overhead and troubleshooting |
| [Incremental Query](incremental-query) | `@incr` time-window queries and the three incremental modes |
| [Table Stream Basics](table-stream) | Creating and managing Streams, the three consumption types, initial rows, reading versus consuming, virtual columns |
| [Table Stream Advanced](table-stream-advanced) | Partition-level offsets, snapshot and reset, consistent joins, concurrent consumption, the effect of base table changes, monitoring and recovery |
