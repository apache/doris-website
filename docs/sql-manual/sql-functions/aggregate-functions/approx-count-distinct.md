---
{
    "title": "APPROX_COUNT_DISTINCT",
    "language": "en"
}
---

## Description

Returns the number of distinct non-NULL elements.
This function is implemented based on the HyperLogLog algorithm, which uses a fixed size of memory to estimate the column base. The algorithm is based on the assumption of a null distribution in the tails, and the accuracy depends on the data distribution. Based on the fixed bucket size used by Doris, the relative standard error of the algorithm is 0.8125%.
For a more detailed and specific analysis, see [related paper](https://algo.inria.fr/flajolet/Publications/FlFuGaMe07.pdf)

## Syntax

```sql
APPROX_COUNT_DISTINCT(<expr>)
```

## Parameters

| Parameters | Description |
| -- | -- |
| `<expr>` | The expression needs to be obtained |

## Return Value

Returns a value of type BIGINT.

## Example

```sql
-- setup
create table t1(
        k1 int,
        k2 varchar(100)
) distributed by hash (k1) buckets 1
properties ("replication_num"="1");
insert into t1 values 
    (1, 'apple'),
    (1, 'banana'),
    (1, 'apple'),
    (2, 'orange'),
    (2, 'orange'),
    (2, 'grape'),
    (3, null);
```

```sql
select approx_count_distinct(k2) from t1;
```

Calculate the approximate distinct count of all k2 values, NULL values are not included in the calculation.

```text
+---------------------------+
| approx_count_distinct(k2) |
+---------------------------+
|                         4 |
+---------------------------+
```

```sql
select k1, approx_count_distinct(k2) from t1 group by k1;
```

Group by k1 and calculate the approximate distinct count of k2 in each group. When all records in the group are NULL, returns 0.

```text
+------+---------------------------+
| k1   | approx_count_distinct(k2) |
+------+---------------------------+
|    1 |                         2 |
|    2 |                         2 |
|    3 |                         0 |
+------+---------------------------+
```

```sql
select approx_count_distinct(k2) from t1 where k1 = 999;
```

When the query result is empty, returns 0.

```text
+---------------------------+
| approx_count_distinct(k2) |
+---------------------------+
|                         0 |
+---------------------------+
```
