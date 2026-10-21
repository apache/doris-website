---
{
    "title": "Skew Hints",
    "language": "en",
    "description": "Use join, DISTINCT aggregation and window skew hints to mitigate uneven work, with runnable examples and plan/profile verification.",
    "keywords": [
        "Doris skew hint",
        "SaltJoin",
        "DISTINCT skew",
        "window skew"
    ]
}
---

Skew hints mitigate long-running instances caused by a few hot keys. Doris supports join salting, DISTINCT aggregation bucketing and window sorting strategies while preserving SQL results. Use them when Profiles show skew; replication and extra shuffles also add cost.

:::note
The three hint forms on this page are available in Doris 4.1.0. Check the execution plan for the deployed release to confirm whether a rewrite applies.
:::

## Prepare Data

The examples require CREATE, INSERT and SELECT privileges in the current database. These small tables verify syntax and results, rather than demonstrating a performance benefit:

```sql
CREATE TABLE skew_left (id INT, k INT, v INT)
DUPLICATE KEY(id)
DISTRIBUTED BY HASH(id) BUCKETS 1
PROPERTIES ("replication_num"="1");
CREATE TABLE skew_right (id INT, k INT, v INT)
DUPLICATE KEY(id)
DISTRIBUTED BY HASH(id) BUCKETS 1
PROPERTIES ("replication_num"="1");
INSERT INTO skew_left VALUES (1,1,10),(2,1,20),(3,2,30),(4,3,40);
INSERT INTO skew_right VALUES (1,1,100),(2,2,200);
```

## Join Skew Hint

For known hot join keys, use `shuffle[skew(<column>(<literal>, ...))]`. Doris randomly salts hot rows on one side, replicates matching rows on the other side across salt values, and shuffles on the original key plus the salt.

- For ordinary INNER and LEFT joins, the hot column must come from the left side. For RIGHT joins, it must come from the right. ASOF INNER/LEFT/RIGHT variants follow the corresponding side rule and still require their MATCH_CONDITION and equality keys.
- The column must be a direct column reference in a join equality key. Expressions, casts and columns outside the equality keys do not trigger rewriting. The hint requires shuffle; Mark, FULL, SEMI and ANTI joins are excluded.
- One specified hot column is handled per rewrite. Skew on both sides can still leave replication costs and very large join results.

Write the hint on the join:

```sql
SELECT l.id AS left_id, r.id AS right_id
FROM skew_left l
JOIN[shuffle[skew(l.k(1))]] skew_right r ON l.k = r.k
ORDER BY left_id, right_id;
```

```text
left_id  right_id
1        1
2        1
3        2
```

The same distribution and hot key can be specified in LEADING:

```sql
SELECT /*+ leading(l shuffle[skew(l.k(1))] r) */
       l.id AS left_id, r.id AS right_id
FROM skew_left l JOIN skew_right r ON l.k = r.k
ORDER BY left_id, right_id;
```

```text
left_id  right_id
1        1
2        1
3        2
```

Here `l.k` is the hot column and `1` is its known hot value. Use literals compatible with the column type. If join order changes, check that the hot column remains on the required side.

## DISTINCT Aggregation Skew Hint

Place `[skew]` before the argument of a single-argument DISTINCT aggregate:

```sql
SELECT k, COUNT(DISTINCT [skew] id) AS distinct_ids
FROM skew_left
GROUP BY k
ORDER BY k;
```

```text
k  distinct_ids
1  2
2  1
3  1
```

Supported functions are COUNT, SUM, SUM0 and single-argument GROUP_CONCAT. Rewriting requires GROUP BY, exactly one aggregate function and one DISTINCT argument at that level, a direct column argument, and that argument not already included in GROUP BY. Otherwise Doris keeps the regular aggregation. The rewrite distributes deduplication by group keys and hash buckets before merging by the original group keys, reducing high-NDV hot-group pressure.

## Window Skew Hint

Place `[skew]` after PARTITION BY in the window specification:

```sql
SELECT id, SUM(v) OVER (
    PARTITION BY [skew] k ORDER BY id
    ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
) AS running_sum
FROM skew_left
ORDER BY id;
```

```text
id  running_sum
1   10
2   30
3   30
4   40
```

This strategy locally sorts before shuffling by partition keys and merging sorted streams. Within a partition-key group, only the bottom window node requiring shuffle uses it; upper nodes reuse distribution and ordering. A global window without PARTITION BY does not gain partition-level parallelism, and a very large single partition can still be slow.

## Parameters

| Parameter | Type | Default | Range and effect |
|---|---|---|---|
| `skew_rewrite_join_salt_explode_factor` | Session integer | `0` | `0` chooses automatically from BEs/CPU; `1` to `65535` sets the salt/replication multiplier. This is independent of table bucket count |
| `skew_rewrite_agg_bucket_num` | Session integer | `1024` | `1` to `65535`, controls hash buckets for the DISTINCT rewrite |

## Verification and Guidance

Prefix the example SELECT with EXPLAIN and inspect accepted hints and the added salt, aggregation or sorting nodes. Enable `enable_profile=true` and compare per-instance rows, time, memory and shuffle bytes for the same SQL. A hint can be inapplicable; the final plan determines whether rewriting occurred.

Choose hot values from actual data. Start with automatic join salting: larger multipliers replicate more rows on the other side and may increase network/memory usage or cause OOM. Excessive aggregate buckets add shuffle and merge costs. Window skew handling optimizes sorting rather than reducing required rows. Measure again when data distribution changes.
