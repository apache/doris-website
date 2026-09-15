---
{
    "title": "REFRESH MATERIALIZED VIEW",
    "language": "en",
    "description": "Manually refresh an asynchronous materialized view with IVM row-level incremental refresh, partition refresh, complete refresh, or an automatically chosen refresh method."
}
---

## Description

This statement is used to manually refresh the specified asynchronous materialized view. The refresh task runs asynchronously; check its status with `tasks("type"="mv")`.

## Syntax

```sql
REFRESH MATERIALIZED VIEW <mv_name>
{
    PARTITIONS (<partition_name> [, <partition_name> [, ... ] ])
  | COMPLETE
  | AUTO
  | PARTITIONS [FALLBACK]
  | INCREMENTAL [FALLBACK]
  | INCREMENTAL WITH DRY RUN [LIMIT <limit> [OFFSET <offset>]]
}
```

To view the refresh plan without running the refresh:

```sql
EXPLAIN REFRESH MATERIALIZED VIEW <mv_name> INCREMENTAL [WITH ALL STREAMS]
EXPLAIN REFRESH MATERIALIZED VIEW <mv_name> COMPLETE
```

## Required Parameters

**1. `<mv_name>`**

> Specifies the name of the materialized view.

**2. Refresh method**

| Refresh method | Description |
|---|---|
| `INCREMENTAL` | Uses Incremental View Maintenance (IVM) to process the row-level changes of the base tables between two refreshes. Only applies to materialized views created with IVM enabled |
| `PARTITIONS` | Doris computes the materialized view partitions that have changed and recomputes them |
| `COMPLETE` | Forces a recomputation of all materialized view data without checking whether partitions are synchronized with the base tables |
| `AUTO` | Doris automatically chooses an available method. For materialized views that support IVM, it tries IVM, partition refresh and complete refresh in turn |
| `PARTITIONS (<partition_name>, ...)` | Forces a refresh of the specified materialized view partitions without checking whether they are synchronized with the base tables |

## Optional Parameters

**1. `FALLBACK`**

Allows this refresh to fall back when the preferred method cannot run safely:

- `INCREMENTAL FALLBACK` tries IVM, partition refresh and complete refresh in that order by default. Some IVM errors fall back directly to a complete refresh.
- `PARTITIONS FALLBACK` falls back to a complete refresh when a partition refresh cannot run.
- `INCREMENTAL` or `PARTITIONS` without `FALLBACK` is the strict mode: the task fails when the preferred method fails.

**2. `WITH DRY RUN`**

Only for `INCREMENTAL`. It executes the delta query of the next IVM refresh and returns the rows that would be written, without modifying the materialized view data, advancing the internal Table Stream offsets, or modifying the IVM metadata.

Use `LIMIT` and `OFFSET` to restrict the returned result. The returned columns include the business columns and the internal columns used by IVM.

**3. `WITH ALL STREAMS`**

Only for `EXPLAIN ... INCREMENTAL`. By default the plan only includes the internal Streams that currently have unconsumed changes; with this option, the plan also includes the Streams that have already been fully consumed, which makes it easier to inspect the complete structure of a multi-table delta plan.

## Access Control Requirements

Users executing this SQL command must have at least the following privileges:

| Privilege | Object | Notes |
|---|---|---|
| ALTER_PRIV | Materialized View | `REFRESH` is an `ALTER` operation on a materialized view |

## Usage Notes

- `INCREMENTAL` is available since Doris 5.0.0 and is currently experimental. See [Incremental View Maintenance (IVM)](../../../../query-acceleration/materialized-view/async-materialized-view/incremental-materialized-view) for the prerequisites, supported scope, fallback reasons and baseline requirements.
- An IVM does not support forcing a refresh of specific partitions with `PARTITIONS (<partition_name>, ...)`. For a partition refresh, use `PARTITIONS` without a partition list, or use `COMPLETE` for a complete refresh.
- When a strict `INCREMENTAL` refresh fails, neither the materialized view data nor the consumption offsets of the internal Streams advance.
- For regular asynchronous materialized views on external tables whose version changes cannot be detected, specify `COMPLETE` or name the partitions explicitly.
- Neither `EXPLAIN` nor `WITH DRY RUN` modifies any persisted state.

## Examples

Strict incremental refresh with IVM:

```sql
REFRESH MATERIALIZED VIEW mv1 INCREMENTAL;
```

Allow fallback when the incremental refresh fails:

```sql
REFRESH MATERIALIZED VIEW mv1 INCREMENTAL FALLBACK;
```

Preview up to 100 rows that the next incremental refresh would write:

```sql
REFRESH MATERIALIZED VIEW mv1 INCREMENTAL WITH DRY RUN LIMIT 100;
```

View the complete IVM delta plan:

```sql
EXPLAIN REFRESH MATERIALIZED VIEW mv1 INCREMENTAL WITH ALL STREAMS;
```

Let Doris compute and refresh the changed partitions:

```sql
REFRESH MATERIALIZED VIEW mv1 PARTITIONS FALLBACK;
```

Refresh the specified partitions:

```sql
REFRESH MATERIALIZED VIEW mv1 PARTITIONS (p_19950801_19950901, p_19950901_19951001);
```

Force a refresh of all data:

```sql
REFRESH MATERIALIZED VIEW mv1 COMPLETE;
```
