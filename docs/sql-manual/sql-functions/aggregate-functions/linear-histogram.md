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
LINEAR_HISTOGRAM(<expr>, <interval> [, <offset>])
```

## Parameters

| Parameter | Description |
| -- | -- |
| `<expr>` | The expression to summarize. Supports BOOLEAN, TINYINT, SMALLINT, INT, BIGINT, LARGEINT, FLOAT, DOUBLE, and DECIMAL. BOOLEAN input is supported in the Doris 4.1 series since 4.1.5; FALSE and TRUE are counted as 0 and 1. |
| `<interval>` | Bucket width, of type DOUBLE. Must be greater than 0. |
| `<offset>` | Optional DOUBLE offset. Defaults to 0 and must be in `[0, interval)`. |

## Return Value

Returns VARCHAR containing JSON text with bucket boundaries, counts, and cumulative counts. NULL inputs are ignored. If all inputs are NULL or there are no input rows, returns `{"num_buckets":0,"buckets":[]}`.

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

BOOLEAN input uses buckets for 0 and 1; NULL does not contribute to the count:

```sql
SELECT LINEAR_HISTOGRAM(b, 1.0)
FROM (SELECT TRUE AS b UNION ALL SELECT FALSE UNION ALL SELECT TRUE UNION ALL SELECT NULL) t;
```

```text
{"num_buckets":2,"buckets":[{"lower":0.0,"upper":1.0,"count":1,"acc_count":1},{"lower":1.0,"upper":2.0,"count":2,"acc_count":3}]}
```
