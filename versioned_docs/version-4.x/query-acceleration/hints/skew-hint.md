---
{
    "title": "Skew Hint",
    "language": "en",
    "description": "Skew Hint is used to mitigate data skew in query execution."
}
---

## Overview

Skew Hint is used to mitigate data skew in query execution.

## Join Skew Hint

### Overview

`SaltJoin` is used to mitigate data skew in join scenarios. When join keys contain known hot values, the optimizer introduces a salt column to spread hot-key rows across multiple parallel instances, preventing a single instance from becoming the bottleneck.

The primary goal of this rewrite is to reduce local overload risk caused by hot keys in `Shuffle Join` scenarios and improve overall execution stability.

### Applicable Scenarios

1. Obvious one-sided skew: one side of the join has highly concentrated hot keys.

2. Known skewed values: you can explicitly provide skewed value lists through hints.

3. `Shuffle Join` is required: the other table is too large for `Broadcast Join`.

### Supported Join Types

- `INNER JOIN`
- `LEFT JOIN`
- `RIGHT JOIN`

### Usage

#### Method 1: comment hint

```sql
SELECT /*+ leading(tl shuffle[skew(tl.a(1,2))] tr) */ *
FROM tl
INNER JOIN tr ON tl.a = tr.a;
```

#### Method 2: join hint syntax

```sql
SELECT *
FROM tl
JOIN[shuffle[skew(tl.a(1,2))]] tr ON tl.a = tr.a;
```

Parameter notes:

- `tl`: alias of the left table.
- `tr`: alias of the right table.
- `tl.a`: skewed column.
- `(1,2)`: list of known skewed values.

Example:

Create test tables and insert data:

```sql
-- Create left table tl
CREATE TABLE IF NOT EXISTS tl (
    id INT,
    a INT,
    name STRING,
    value DOUBLE
) USING parquet;

-- Create right table tr
CREATE TABLE IF NOT EXISTS tr (
    id INT,
    a INT,
    description STRING,
    amount DOUBLE
) USING parquet;

-- Insert left table data (simulated skew)
INSERT INTO tl VALUES
(1, 1, 'name_1', 100.0),
(2, 1, 'name_2', 200.0),
(3, 1, 'name_3', 300.0),
(4, 1, 'name_4', 400.0),
(5, 2, 'name_5', 500.0),
(6, 2, 'name_6', 600.0),
(7, 2, 'name_7', 700.0),
(8, 3, 'name_8', 800.0),
(9, 4, 'name_9', 900.0),
(10, 5, 'name_10', 1000.0);

-- Insert right table data
INSERT INTO tr VALUES
(1, 1, 'desc_1', 150.0),
(2, 1, 'desc_2', 250.0),
(3, 2, 'desc_3', 350.0),
(4, 2, 'desc_4', 450.0),
(5, 3, 'desc_5', 550.0),
(6, 4, 'desc_6', 650.0),
(7, 5, 'desc_7', 750.0),
(8, 1, 'desc_8', 850.0),
(9, 2, 'desc_9', 950.0);
```

Use salt join to optimize queries:

Example 1: optimize inner join

```sql
-- Comment hint syntax
SELECT /*+leading(tl shuffle[skew(tl.a(1,2))] tr)*/
    tl.id as tl_id,
    tl.name,
    tr.description,
    tl.value + tr.amount as total
FROM tl
INNER JOIN tr ON tl.a = tr.a
WHERE tl.value > 300.0;

-- Join hint syntax
SELECT
    tl.id as tl_id,
    tl.name,
    tr.description,
    tl.value + tr.amount as total
FROM tl
JOIN[shuffle[skew(tl.a(1,2))]] tr ON tl.a = tr.a
WHERE tl.value > 300.0;
```

Example 2: optimize left join

```sql
-- Mitigate skew on the left table in a left join
SELECT /*+leading(tl shuffle[skew(tl.a(1,2))] tr)*/
    tl.id,
    tl.a,
    tl.name,
    COALESCE(tr.description, 'No Match') as description
FROM tl
LEFT JOIN tr ON tl.a = tr.a
ORDER BY tl.id;
```

Example 3: optimize right join

```sql
-- Mitigate skew on the right table in a right join
SELECT /*+leading(tl shuffle[skew(tr.a(1,2))] tr)*/
    tr.id,
    tr.a,
    tr.description,
    COALESCE(tl.name, 'No Match') as name
FROM tl
RIGHT JOIN tr ON tl.a = tr.a
WHERE tr.amount > 500.0;
```

### Optimization Principle

The core idea is a salting rewrite for hot keys.

After skew values are specified via `skew(...)`, the optimizer introduces a salt column on the skewed side and rewrites the join condition from `key` to `(key, salt)`. This spreads hot-key rows across parallel instances instead of concentrating them in a single worker.

To keep join semantics correct, the other side is expanded by the same salt buckets for the corresponding skewed keys, so rows can still match on `(key, salt)`.

A simplified flow:

1. Identify and mark hot values.

2. Add salt on the skewed side to split hot rows.

3. Expand matching rows on the other side by salt buckets, then join.

This strategy works best for one-sided skew and can significantly reduce hotspot pressure while improving parallelism and execution stability.

### Limitations

`SaltJoin` can only mitigate one-sided hotspots and cannot fully eliminate two-sided skew on the same key.

With left-side skew as an example, the rewrite randomly salts hot keys on the left side and expands rows on the right side by salt value. The join condition changes from `key` to `(key, salt)`, so the left-side hotspot is distributed.

However, the right side does not reduce hotspot data; it is duplicated across salt partitions for matching. Therefore, when both sides are highly skewed on the same key, this rewrite can reduce pressure on one side but cannot completely fix hotspots on the other side.

For example, if both left and right tables each contain 100 rows with `key=1` and the bucket count is 100, the left-side rows are distributed across 100 buckets, while right-side rows are expanded so each bucket still contains those 100 rows. Left-side pressure decreases, but right-side skew remains significant.

## AGG Skew Hint

### Overview

`Count Distinct Skew Rewrite` is used to mitigate NDV skew in `DISTINCT` aggregations.

A typical case is: `GROUP BY a` has a small number of groups, but one hot group (for example, `a=1`) has an extremely large `DISTINCT b`, causing a single instance to hold a very large dedup hash table and leading to memory pressure and long tails.

This rewrite uses salting buckets plus multi-stage aggregation to split distinct processing inside hot groups and reduce per-instance load.

### Applicable Scenarios

1. Obvious NDV skew in `DISTINCT` aggregations: a few groups have abnormally high cardinality.

2. Long-tail latency, high memory watermark, or OOM risk with normal multi-stage distinct aggregation.

3. Query is `GROUP BY`-centric and the target distinct argument can be explicitly marked with `[skew]`.

### Usage

```sql
SELECT a, COUNT(DISTINCT [skew] b)
FROM t
GROUP BY a;
```

### Supported Functions

Currently, AGG skew rewrite supports the following aggregate functions:

- `COUNT`
- `SUM`
- `SUM0`
- `GROUP_CONCAT`

Only the functions above support AGG skew rewrite. Other aggregate functions fall back to the regular plan.

### Optimization Principle

For `SELECT a, COUNT(DISTINCT [skew] b) FROM t GROUP BY a`, the flow is:

1. Apply local deduplication first to reduce raw data volume.

2. Compute a bucket column for the distinct argument (for example `saltExpr = xxhash_32(b) % bucket_num`).

3. Distribute by `(a, saltExpr)` and run `multi_distinct_count`.

4. Aggregate by `a` again and merge bucket results to produce final `COUNT(DISTINCT b)`.

The key benefit is that hot groups are no longer handled by one large dedup hash structure; they are split into buckets and processed in parallel.

### Limitations

`Count Distinct Skew Rewrite` is condition-based. If conditions are not met, the optimizer falls back to the normal aggregation plan. Common limitations include:

1. `GROUP BY` is required (pure global aggregation does not trigger it).

2. The target must be a single-argument `DISTINCT` aggregation and marked with `[skew]`.

3. If the same level has more complex multi-aggregation combinations, the optimizer may skip this rewrite.

4. If the distinct argument is already included in `GROUP BY`, this rewrite usually provides no benefit and will not trigger.

### Recommendations

1. Prioritize `[skew]` for `DISTINCT` aggregations with clear hotspots.

2. Tune `skew_rewrite_agg_bucket_num` based on data scale to avoid too few buckets (insufficient split) or too many buckets (higher scheduling and merge overhead).

3. Compare `EXPLAIN`/`PROFILE` before and after optimization to verify reductions in long-tail latency and memory peak.

## Window Skew Hint

### Overview

`Window Skew Rewrite` mitigates sort long-tail issues in window functions when `PARTITION BY` keys are skewed.

When some partition keys (such as user ID or organization ID) are highly concentrated, conventional execution accumulates large sort and window workloads on a few instances, and the slowest instance dominates total latency.

### Applicable Scenarios

1. Obvious hotspots on window `PARTITION BY` keys.

2. Window queries with `ORDER BY` where sorting is the main bottleneck.

3. Multiple window expressions in one SQL statement, sharing all or part of the partition keys.

### Usage

Mark `[skew]` directly in the `PARTITION BY` clause:

```sql
SELECT
    SUM(a) OVER(
        PARTITION BY [skew] b
        ORDER BY d
        ROWS BETWEEN UNBOUNDED PRECEDING AND 1 FOLLOWING
    ) AS w1
FROM test_skew_window;
```

### Optimization Principle

The core idea is to split heavy sorting into two stages:

1. Perform local sort upstream.

2. Shuffle by `PARTITION BY` keys.

3. Run merge sort downstream, then compute window functions.

Compared with "shuffle then full sort", this approach is usually more stable under skew: hotspot partitions still need processing, but sorting shifts from full re-sorting to merging pre-sorted streams.

### Limitations

1. `[skew]` is a partition-key-level hint and mainly targets `PARTITION BY` skew.

2. This optimization focuses on sorting overhead and does not change window semantics; extremely large single partitions can still cause long tails.

3. Within the same partition-key group, only lower window nodes that can shuffle apply this strategy; upper nodes reuse existing distribution and order.

4. Without `PARTITION BY`, window execution cannot use partition-level parallelism to mitigate skew.

### Recommendations

1. Prioritize `[skew]` on partition keys with obvious hotspots.

2. Use `PROFILE` to observe sort-node time, skew metrics, and long-tail instance changes.
