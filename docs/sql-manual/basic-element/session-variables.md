---
{
    "title": "Session Variable List",
    "language": "en",
    "description": "Values, defaults and effects of Doris session variables."
}
---

:::caution This page is under construction and is not yet complete

This page collects the session variables of Doris. It currently only covers variables that were
**added, had their default changed, or were removed** in recent versions; it is not yet a complete
reference. For a variable that does not appear here, use `SHOW VARIABLES LIKE '<pattern>'` to inspect
its current value.

For how variables are classified, scoped and set, see [Variables](./variables.md).

:::

## Inspect and set

```sql
-- Inspect
SHOW VARIABLES LIKE 'enable_file_scanner_v2';

-- Current session only
SET enable_file_scanner_v2 = false;

-- Globally (applies to sessions created afterwards)
SET GLOBAL enable_file_scanner_v2 = false;
```

## What changed in 4.1.4

| Category | Variables |
| --- | --- |
| Added | `enable_file_scanner_v2`, `enable_expr_zonemap_filter`, `enable_local_exchange_before_agg`, `enable_local_exchange_before_streaming_agg`, `runtime_filter_broadcast_join_producer_num`, `runtime_filter_tree_publish_max_send_bytes`, `bucket_shuffle_downgrade_ratio`, `eager_aggregation_on_broadcast_join`, `eager_agg_broadcast_row_count`, `force_eager_agg_hint`, `enable_topn_lazy_mat_phase2_no_write_file_cache`, `file_cache_query_limit_bytes`, `file_presigned_url_ttl_seconds`, `force_forward_all_queries` |
| Semantics changed | `enable_runtime_filter_partition_prune`, `enable_nereids_distribute_planner` |
| Removed | `eager_aggregation_on_join`, `plan_nereids_dump` |

## External table scan

### `enable_file_scanner_v2`

| Item | Value |
| --- | --- |
| Type | Boolean |
| Default | `true` |
| Version | Added in 4.1.4 |

Whether to use File Scanner V2 to scan external files. When enabled, `FileScanNode` uses the new
native scan engine for the query scenarios it supports, covering the Parquet, ORC, CSV and JSON
formats as well as the Hive, Iceberg, Paimon and Hudi table formats. JDBC catalogs and Iceberg system
tables still use the legacy scan path.

Set it to `false` to compare behavior if you suspect a query issue is related to the new scanner. See
[Data Lake Query Tuning](../../lakehouse/best-practices/optimization.md).

### `enable_expr_zonemap_filter`

| Item | Value |
| --- | --- |
| Type | Boolean |
| Default | `true` |
| Version | Added in 4.1.4 |

Controls expression ZoneMap filtering in the scanners that honor this variable.

File Scanner V2 always performs the safe form of expression ZoneMap filtering and is not affected by
this variable.

### `enable_runtime_filter_partition_prune`

| Item | Value |
| --- | --- |
| Type | Boolean |
| Default | `true` |
| Version | Semantics changed in 4.1.4 |

Controls runtime-filter partition pruning in the scanners that honor this variable.

Since 4.1.4, File Scanner V2 always performs the safe form of partition pruning, so setting this
variable to `false` has no effect on File Scanner V2.

## Query planning and execution

### `enable_nereids_distribute_planner`

| Item | Value |
| --- | --- |
| Type | Boolean |
| Default | `true` |
| Version | Upgrade behavior changed in 4.1.4 |

Whether to use the Nereids distributed planner.

Since 4.1.4, upgrading refreshes the **global default of this variable to `true`**, even when the
cluster metadata previously persisted `false`. If plan distribution looks different after the
upgrade, run `SET GLOBAL enable_nereids_distribute_planner = false;` to roll back.

### `runtime_filter_broadcast_join_producer_num`

| Item | Value |
| --- | --- |
| Type | Int |
| Default | `3` |
| Version | Added in 4.1.4 |

Maximum number of producer BEs for each runtime filter in a broadcast join. A value less than or
equal to `0` removes the limit.

In a broadcast join every build-side BE produces the same runtime filter content, so bounding the
number of producers noticeably reduces RPC overhead on large clusters. This only affects the Nereids
distributed planning path; the legacy Coordinator path keeps its existing behavior.

### `runtime_filter_tree_publish_max_send_bytes`

| Item | Value |
| --- | --- |
| Type | Long (bytes) |
| Default | `268435456` (256 MB) |
| Version | Added in 4.1.4 |

Maximum number of bytes sent in a single RPC when publishing a global runtime filter. Above this
threshold Doris switches to tree (multi-level) publishing, so the merge node no longer sends the same
large filter to every scan node.

A value of `0` disables tree publishing and falls back to direct publishing. The value must be
greater than or equal to `0`, otherwise setting it fails.

### `bucket_shuffle_downgrade_ratio`

| Item | Value |
| --- | --- |
| Type | Double |
| Default | `0.8` |
| Version | Added in 4.1.4 (experimental) |

Downgrade a bucket shuffle join to a regular shuffle join when the base table side's total bucket
count is smaller than the total instance count times this ratio. A value less than or equal to `0`
never downgrades. The default of `0.8` keeps the original behavior.

### `enable_local_exchange_before_agg`

| Item | Value |
| --- | --- |
| Type | Boolean |
| Default | `true` |
| Version | Added in 4.1.4 |

Whether a local exchange is inserted before an aggregation operator.

:::caution
Turning this off is not recommended. Before 4.1.4, disabling this behavior could return **wrong
results** with serial or non-hash local exchanges; that issue was fixed in 4.1.4.
:::

### `enable_local_exchange_before_streaming_agg`

| Item | Value |
| --- | --- |
| Type | Boolean |
| Default | `false` |
| Version | Added in 4.1.4 |

Whether a local exchange is inserted before a streaming aggregation operator.

### `eager_aggregation_on_broadcast_join`

| Item | Value |
| --- | --- |
| Type | Boolean |
| Default | `true` |
| Version | Added in 4.1.4 |

Whether eager aggregation (aggregation push-down) is allowed on a broadcast join.

### `eager_agg_broadcast_row_count`

| Item | Value |
| --- | --- |
| Type | Int |
| Default | `250000` |
| Version | Added in 4.1.4 |

Row-count threshold used to decide whether to apply eager aggregation on a broadcast join.

### `force_eager_agg_hint`

| Item | Value |
| --- | --- |
| Type | String |
| Default | `""` (empty) |
| Version | Added in 4.1.4 |

A matching hint that forces eager aggregation push-down, intended for testing and debugging.
**Not recommended in production.**

The format is `<func>:<qualifier.column | *>=<push|nopush>`, with entries separated by `;`:

```sql
SET force_eager_agg_hint = 'sum:t1.a=push; sum:t2.a=nopush; count:*=push';
```

Note that entries are matched per aggregate function, but the effect applies to the current candidate
push-down branch or subtree rather than to one aggregate function independently. If any matched entry
in a branch is `nopush`, that branch is not pushed down; otherwise, if any matched entry is `push`,
that branch may be forced down, and the other aggregates in the same branch follow that branch-level
decision.

### `force_forward_all_queries`

| Item | Value |
| --- | --- |
| Type | Boolean |
| Default | `false` |
| Version | Added in 4.1.4 |

When enabled, every query in the current session is forwarded to the master FE. This is useful when
diagnosing problems caused by metadata inconsistency between the master and follower FEs. The
variable is the session-level counterpart of the FE configuration item of the same name.

## Cache

### `file_cache_query_limit_bytes`

| Item | Value |
| --- | --- |
| Type | Long (bytes) |
| Default | `-1` |
| Version | Added in 4.1.4 |

Maximum number of remote scan bytes a single query may write to the file cache through read-through
on each BE:

- less than `0`: no limit (feature disabled);
- equal to `0`: the query never writes to the file cache;
- greater than `0`: the query stops writing to the file cache once its cumulative remote scan volume
  reaches this threshold.

Use it to prevent a one-off large scan from evicting hot data from the cache.

### `enable_topn_lazy_mat_phase2_no_write_file_cache`

| Item | Value |
| --- | --- |
| Type | Boolean |
| Default | `false` |
| Version | Added in 4.1.4 |

When enabled, phase-2 reads of TopN lazy materialization go straight to remote storage on a file
cache miss and **do not write the missed range back to the file cache**. This helps when the phase-2
read pattern is random and the cache hit rate is low.

## AI functions

### `file_presigned_url_ttl_seconds`

| Item | Value |
| --- | --- |
| Type | Long (seconds) |
| Default | `3600` |
| Version | Added in 4.1.4 |

Expiration time of the presigned URL generated for an object in S3-compatible storage in multimodal
`EMBED()` scenarios. Increase it when media files are large and the provider takes longer to fetch
them. See [EMBED](../sql-functions/ai-functions/distance-functions/embed.md).

## Removed variables

| Variable | Removed in | Notes |
| --- | --- | --- |
| `eager_aggregation_on_join` | 4.1.4 | The aggregation push-down strategy was reworked; use `eager_aggregation_on_broadcast_join` and `eager_agg_broadcast_row_count` instead. Remove the variable from any script that still sets it |
| `plan_nereids_dump` | 4.1.4 | Now internal state that is only turned on while replaying a minidump; it can no longer be set with `SET` |
