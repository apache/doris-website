---
{
    "title": "LINEAR_HISTOGRAM",
    "language": "en"
}
---

## Description

The LINEAR_HISTOGRAM function is used to describe the data distribution. It uses an "equal width" bucking strategy, and divides the data into buckets according to the value of the data.

## Syntax

```sql
`LINEAR_HISTOGRAM(<expr>, DOUBLE <interval>[, DOUBLE <offset>)`
```

## Parameters

| Parameters | Description |
| -- | -- |
| `interval` | Required. The width of the bucket. |
| `offset`   | Optional. The default value is 0, and the range is `[0, interval)`. |

## Return Value

Returns a value of the computed JSON type.

## Example

```sql
select linear_histogram(a, 2) from histogram_test;
```

```text
+--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
| linear_histogram(a, cast(2 as DOUBLE))                                                                                                                                                                                                                                                                                                           |
+--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
| {"num_buckets":6,"buckets":[{"lower":0.0,"upper":2.0,"count":2,"acc_count":2},{"lower":2.0,"upper":4.0,"count":4,"acc_count":6},{"lower":4.0,"upper":6.0,"count":4,"acc_count":10},{"lower":6.0,"upper":8.0,"count":4,"acc_count":14},{"lower":8.0,"upper":10.0,"count":4,"acc_count":18},{"lower":10.0,"upper":12.0,"count":2,"acc_count":20}]} |
+--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
```

```sql
select linear_histogram(a, 2, 1) from histogram_test;
```

```text
+---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
| linear_histogram(a, cast(2 as DOUBLE), cast(1 as DOUBLE))                                                                                                                                                                                                                                   |
+---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
| {"num_buckets":5,"buckets":[{"lower":1.0,"upper":3.0,"count":4,"acc_count":4},{"lower":3.0,"upper":5.0,"count":4,"acc_count":8},{"lower":5.0,"upper":7.0,"count":4,"acc_count":12},{"lower":7.0,"upper":9.0,"count":4,"acc_count":16},{"lower":9.0,"upper":11.0,"count":4,"acc_count":20}]} |
+---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
```

```text
Field description: 

- `num_buckets`: The number of buckets.
- `buckets`: All buckets.
  - `lower`: Lower bound of the bucket. (included)
  - `upper`: Upper bound of the bucket. (not included)
  - `count`: The number of elements contained in the bucket.
  - `acc_count`: Accumulated count.
```
