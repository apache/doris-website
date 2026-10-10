---
{
    "title": "UNIQ_THETA",
    "language": "en",
    "description": "Returns the approximate number of distinct non-NULL elements, implemented with the Apache DataSketches Theta Sketch."
}
---

## Description

Returns the approximate number of distinct non-NULL elements.

This function is implemented with the [Apache DataSketches](https://datasketches.apache.org/docs/Theta/ThetaSketches.html) Theta Sketch. Compared with the HyperLogLog based [APPROX_COUNT_DISTINCT](./approx-count-distinct), the Theta Sketch produces a mergeable sketch state that also supports set operations (union / intersect / difference), which makes it suitable for pre-aggregating detailed data into sketches that are later combined across partitions, dimensions, or time windows. It uses the KMV algorithm and, with the default 4096 nominal entries, has a relative error of 3.125% (95% confidence); the result is exact for small cardinalities.

## Syntax

```sql
UNIQ_THETA(<expr>)
```

## Parameters

| Parameters | Description |
| -- | -- |
| `<expr>` | The expression to get the value. Supported types are String, Date, DateTime, Timestamptz, IPv4, IPv6, TinyInt, Bool, SmallInt, Integer, BigInt, LargeInt, Float, Double, Decimal. |

## Return Value

Returns a value of type BIGINT.

## Example

```sql
-- setup
create table t1(
        k1 int,
        k_string varchar(100),
        k_tinyint tinyint
) distributed by hash (k1) buckets 1
properties ("replication_num"="1");
insert into t1 values
    (1, 'apple', 10),
    (1, 'banana', 20),
    (1, 'apple', 10),
    (2, 'orange', 30),
    (2, 'orange', 40),
    (2, 'grape', 50),
    (3, null, null);
```

```sql
select uniq_theta(k_string) from t1;
```

String type: Calculate the approximate distinct count of all k_string values, NULL values are not included in the calculation.

```text
+----------------------+
| uniq_theta(k_string) |
+----------------------+
|                    4 |
+----------------------+
```

```sql
select uniq_theta(k_tinyint) from t1;
```

TinyInt type: Calculate the approximate distinct count of all k_tinyint values.

```text
+-----------------------+
| uniq_theta(k_tinyint) |
+-----------------------+
|                     5 |
+-----------------------+
```

```sql
select k1, uniq_theta(k_string) from t1 group by k1 order by k1;
```

Group by k1 and calculate the approximate distinct count of k_string in each group. When all records in the group are NULL, returns 0.

```text
+------+----------------------+
| k1   | uniq_theta(k_string) |
+------+----------------------+
|    1 |                    2 |
|    2 |                    2 |
|    3 |                    0 |
+------+----------------------+
```

```sql
select uniq_theta(k_string) from t1 where k1 = 999;
```

When the query result is empty, returns 0.

```text
+----------------------+
| uniq_theta(k_string) |
+----------------------+
|                    0 |
+----------------------+
```

### Mergeable sketch state

Because `uniq_theta` is registered as a normal aggregate, the generic `agg_state` combinators `uniq_theta_state` / `uniq_theta_merge` / `uniq_theta_union` are available automatically. This lets you pre-compute sketches and later merge or union them without rescanning the raw data.

```sql
set enable_agg_state = true;

-- uniq_theta_merge(uniq_theta_state(...)) equals a direct uniq_theta
select uniq_theta_merge(uniq_theta_state(k_string)) from t1;
```

```text
+----------------------------------------------+
| uniq_theta_merge(uniq_theta_state(k_string)) |
+----------------------------------------------+
|                                            4 |
+----------------------------------------------+
```

```sql
-- persist per-key sketches into an aggregate table, then merge/union later
create table theta_agg(
        k1 int,
        s agg_state<uniq_theta(varchar(100))> generic
)
aggregate key(k1)
distributed by hash(k1) buckets 1
properties ("replication_num"="1");

insert into theta_agg values
    (1, uniq_theta_state(cast('apple' as varchar(100)))),
    (1, uniq_theta_state(cast('banana' as varchar(100)))),
    (2, uniq_theta_state(cast('orange' as varchar(100))));

-- per-key cardinality
select k1, uniq_theta_merge(s) from theta_agg group by k1 order by k1;
```

```text
+------+---------------------+
| k1   | uniq_theta_merge(s) |
+------+---------------------+
|    1 |                   2 |
|    2 |                   1 |
+------+---------------------+
```

```sql
-- union across keys, then merge for the global cardinality
select uniq_theta_merge(u) from
    (select uniq_theta_union(s) as u from theta_agg group by k1) t;
```

```text
+---------------------+
| uniq_theta_merge(u) |
+---------------------+
|                   3 |
+---------------------+
```
