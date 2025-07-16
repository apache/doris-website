---
{
    "title": "APPROX_COUNT_DISTINCT",
    "language": "en"
}
---

## APPROX_COUNT_DISTINCT
### Description
#### Syntax

`APPROX_COUNT_DISTINCT (expr)`


Returns an approximate aggregation function similar to the result of COUNT (DISTINCT col).

It combines COUNT and DISTINCT faster and uses fixed-size memory, so less memory can be used for columns with high cardinality.

### example
```
MySQL > select approx_count_distinct(query_id) from log_statis group by datetime;
+-----------------+
| approx_count_distinct(`query_id`) |
+-----------------+
| 17721           |
+-----------------+
```
### keywords

APPROX_COUNT_DISTINCT
