---
{
    "title": "HLL_CARDINALITY",
    "language": "en"
}
---

## HLL_CARDINALITY
### description
#### Syntax

`HLL_CARDINALITY(hll)`

HLL_CARDINALITY is used to calculate the cardinality of a single HLL type value.

### example
```
MySQL > select HLL_CARDINALITY(uv_set) from test_uv;
+---------------------------+
| hll_cardinality(`uv_set`) |
+---------------------------+
|                         3 |
+---------------------------+
```
### keywords
HLL,HLL_CARDINALITY
