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
NDV(<expr>)
```

## Parameters

| Parameters | Description |
| -- | -- |
| `<expr>` | The expression to get the value. Supported types are String, Date, DateTime,Timestamptz, IPv4, IPv6, TinyInt, Bool, SmallInt, Integer, BigInt, LargeInt, Float, Double, Decimal. |

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
select approx_count_distinct(k_string) from t1;
```

String type: Calculate the approximate distinct count of all k_string values, NULL values are not included in the calculation.

```text
+---------------------------------+
| approx_count_distinct(k_string) |
+---------------------------------+
|                               4 |
+---------------------------------+
```

```sql
select approx_count_distinct(k_tinyint) from t1;
```

TinyInt type: Calculate the approximate distinct count of all k_tinyint values.

```text
+----------------------------------+
| approx_count_distinct(k_tinyint) |
+----------------------------------+
|                                5 |
+----------------------------------+
```

```sql
select approx_count_distinct(k1) from t1;
```

Integer type: Calculate the approximate distinct count of all k1 values.

```text
+---------------------------+
| approx_count_distinct(k1) |
+---------------------------+
|                         3 |
+---------------------------+
```

```sql
select k1, approx_count_distinct(k_string) from t1 group by k1;
```

Group by k1 and calculate the approximate distinct count of k_string in each group. When all records in the group are NULL, returns 0.

```text
+------+---------------------------------+
| k1   | approx_count_distinct(k_string) |
+------+---------------------------------+
|    1 |                               2 |
|    2 |                               2 |
|    3 |                               0 |
+------+---------------------------------+
```

```sql
select ndv(k_string) from t1;
```

Using alias NDV has the same effect as APPROX_COUNT_DISTINCT.

```text
+---------------+
| ndv(k_string) |
+---------------+
|             4 |
+---------------+
```

```sql
select approx_count_distinct(k_string) from t1 where k1 = 999;
```

When the query result is empty, returns 0.

```text
+---------------------------------+
| approx_count_distinct(k_string) |
+---------------------------------+
|                               0 |
+---------------------------------+
```
