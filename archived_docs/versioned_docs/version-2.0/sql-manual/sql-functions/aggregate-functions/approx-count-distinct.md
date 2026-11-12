---
{
    "title": "APPROX_COUNT_DISTINCT",
    "language": "en"
}
---

### Description
#### Syntax

`APPROX_COUNT_DISTINCT(expr)`

Returns an approximate aggregation function similar to the result of `COUNT(DISTINCT col)`.

It is implemented based on the HyperLogLog algorithm, which uses a fixed size of memory to estimate the column base. The algorithm is based on the assumption of a null distribution in the tails, and the accuracy depends on the data distribution. Based on the fixed bucket size used by Doris, the relative standard error of the algorithm is 0.8125%.

For a more detailed and specific analysis, see [related paper](https://algo.inria.fr/flajolet/Publications/FlFuGaMe07.pdf)

### Example

```sql
MySQL > select approx_count_distinct(query_id) from log_statis group by datetime;
+-----------------+
| approx_count_distinct(`query_id`) |
+-----------------+
| 17721           |
+-----------------+
```

### Keywords
  APPROX_COUNT_DISTINCT
