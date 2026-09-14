---
{
    "title": "Change Data and Incremental Consumption Overview",
    "language": "en",
    "description": "Starting from Doris 5.0, internal tables can record row-level changes (Row Binlog), which can be consumed incrementally through Table Streams or queried by time window with @incr. This page covers the problems these features solve, typical scenarios, the capability matrix, and prerequisites."
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

Incremental processing inside Doris usually runs into these problems:

- **Downstream wants increments but cannot get them**: the upstream table receives many updates and deletes every day, so downstream reports, wide tables, and aggregate tables can only be recomputed in full, or rely on an `update_time` column maintained by the application.
- **Updates and deletes are invisible**: an update on a Unique Key table overwrites the old value and a deleted row simply disappears, so there is no way to know afterwards what was changed or deleted.
- **Increments of multiple tables do not line up**: when joining incremental data with a dimension table, the dimension table is in its "current" state while the increment covers "a period in the past".

Row Binlog records every insert, update (with values before and after the update), and delete of each row, together with a globally monotonic commit timestamp. Table Stream and incremental query read those records in different ways.

## Two layers

```text
 INSERT / UPDATE / DELETE / Stream Load / ...
                     │
                     ▼
 ┌──────────────────────────────────────────────────────┐
 │ Row Binlog (table-level switch, set at CREATE TABLE) │
 │ operation type, before/after images, commit TSO      │
 └──────────────────────────────────────────────────────┘
              │                          │
              ▼                          ▼
        Table Stream                @incr query
        (stateful,                  (stateless,
         offset-based)               time window)
```

| Capability | Object needed / who tracks the position | Best for |
|---|---|---|
| Table Stream | `CREATE STREAM` required<br />Doris keeps a consumption offset per partition | Continuous incremental ETL, downstream sync, exactly-once consumption |
| Incremental query `@incr` | Nothing to create<br />You choose the time window | Ad-hoc analysis, external schedulers that manage their own positions |

## Typical scenarios

**1. Incremental sync to a downstream table**

An orders table receives many status updates every day. Create a `min_delta` Table Stream and periodically run `INSERT INTO downstream SELECT ... FROM the orders stream`. Each run processes only the net changes between two executions: new orders, orders whose status changed (with the values before and after), and deleted orders. Reading the changes and writing the downstream table happen in one transaction; a failure rolls back automatically, so nothing is skipped or consumed twice. See [Table Stream Basics](table-stream.md).

**2. Append-only logs and event tables**

For detail tables that only receive inserts, use an `append_only` Stream to fetch only the newly written rows at minimal cost. See [Table Stream Basics](table-stream.md#consumption-types).

**3. Change auditing and replay**

When you need the full trail of every modification, use a `detail` Stream, or export row-by-row changes for a time window with the `DETAIL` mode of `@incr`, and land them in an audit table. See [Incremental Query](incremental-query.md).

**4. Consistent joins between incremental data and dimension tables**

Consuming order changes requires joining the users table. `users_stream@snapshot()` reads the image of the users table aligned with the consumption offset, so a new order is never joined with stale user information or vice versa. See [Table Stream Advanced](table-stream-advanced.md#snapshot-reads-snapshot).

## Capability matrix

### Table models

| Table model | Row Binlog / before image | Available change types |
|---|---|---|
| Duplicate Key | Supported<br />No before image | APPEND only |
| Unique Key (Merge-on-Write, without cluster key) | Supported<br />Before image supported (`binlog.need_historical_value = true`) | APPEND / UPDATE_BEFORE / UPDATE_AFTER / DELETE |
| Unique Key (Merge-on-Read) | Not supported | - |
| Aggregate Key | Not supported | - |

Other restrictions (auto-increment columns, VARIANT columns, schema change scope, and so on) are listed in [Row Binlog](row-binlog.md#supported-scope-and-limitations).

### Choosing a consumption type

| You need | Choose | Notes |
|---|---|---|
| Only newly inserted rows | `append_only` | Updates and deletes are not emitted; lowest overhead |
| The net change of each key between two consumptions | `min_delta` (default) | Multiple modifications of the same key fold into one UPDATE_BEFORE + UPDATE_AFTER pair; a key inserted and then deleted is not emitted |
| The complete record of every modification | `detail` | Emitted row by row, never folded |

UPDATE_BEFORE and DELETE rows in `min_delta` and `detail` need before images, so the base table must be a MoW table with `binlog.need_historical_value` enabled.

## Prerequisites

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

## Reading guide

| Page | Content |
|---|---|
| [Quick Start](quick-start.md) | A 10-minute walkthrough: create the table, create the Stream, write data, view changes, consume |
| [Row Binlog](row-binlog.md) | How to enable it, properties, supported scope, the change record model, DDL restrictions, overhead and troubleshooting |
| [Incremental Query](incremental-query.md) | `@incr` time-window queries and the three incremental modes |
| [Table Stream Basics](table-stream.md) | Creating and managing Streams, the three consumption types, initial rows, reading versus consuming, virtual columns |
| [Table Stream Advanced](table-stream-advanced.md) | Partition-level offsets, snapshot and reset, consistent joins, concurrent consumption, the effect of base table changes, monitoring and recovery |
