---
{
    "title": "LINEAR_HISTOGRAM",
    "language": "en",
    "description": "The LINEARHISTOGRAM function is used to describe data distribution."
}
---

## Description

The LINEAR_HISTOGRAM function is used to describe data distribution. It uses an "equal width" bucketing strategy and divides the data into buckets according to the value size.

## Syntax

```sql
LINEAR_HISTOGRAM(<expr>, DOUBLE <interval>[, DOUBLE <offset>])
```

## Parameters

| Parameter | Description |
| -- | -- |
| `interval` | The width of the bucket, supports types: TinyInt, SmallInt, Int, BigInt, LargeInt, Float, Double, Decimal. |
| `offset`   | Optional. Default is 0, range is `[0, interval)`, type Double supported. |

## Return Value

Returns a computed value of JSON type.

## Example

```sql
-- setup
create table histogram_test(
  a int
) distributed by hash(a) buckets 1
properties ("replication_num"="1");
insert into histogram_test values
  (0), (1), (2), (3), (4), (5), (6), (7), (8), (9), (10), (11), (null);
```

```sql
select linear_histogram(a, 2) from histogram_test;
```

```text
+------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
| linear_histogram(a, 2)                                                                                                                                                                                                                                                                                                                         |
+------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
| {"num_buckets":6,"buckets":[{"lower":0.0,"upper":2.0,"count":2,"acc_count":2},{"lower":2.0,"upper":4.0,"count":2,"acc_count":4},{"lower":4.0,"upper":6.0,"count":2,"acc_count":6},{"lower":6.0,"upper":8.0,"count":2,"acc_count":8},{"lower":8.0,"upper":10.0,"count":2,"acc_count":10},{"lower":10.0,"upper":12.0,"count":2,"acc_count":12}]} |
+------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
```

```sql
select linear_histogram(a, 2, 1) from histogram_test;
```

```text
+---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
| linear_histogram(a, 2, 1)                                                                                                                                                                                                                                                                                                                                                                         |
+---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
| {"num_buckets":7,"buckets":[{"lower":-1.0,"upper":1.0,"count":1,"acc_count":1},{"lower":1.0,"upper":3.0,"count":2,"acc_count":3},{"lower":3.0,"upper":5.0,"count":2,"acc_count":5},{"lower":5.0,"upper":7.0,"count":2,"acc_count":7},{"lower":7.0,"upper":9.0,"count":2,"acc_count":9},{"lower":9.0,"upper":11.0,"count":2,"acc_count":11},{"lower":11.0,"upper":13.0,"count":1,"acc_count":12}]} |
+---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
```

```sql
select linear_histogram(a, 2, 1) from histogram_test where a is null;
```

```text
+--------------------------------+
| linear_histogram(a, 2, 1)      |
+--------------------------------+
| {"num_buckets":0,"buckets":[]} |
```

Field description:

- `num_buckets`: Number of buckets.
- `buckets`: Buckets in the histogram.
  - `lower`: Lower bound (inclusive).
  - `upper`: Upper bound (exclusive).
  - `count`: Number of elements in the bucket.
  - `acc_count`: Accumulated count up to this bucket.
