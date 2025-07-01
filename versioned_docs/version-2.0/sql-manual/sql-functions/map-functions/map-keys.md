---
{
    "title": "MAP_KEYS",
    "language": "en"
}
---

### Description

#### Syntax

`ARRAY<K> map_keys(Map<K, V> map)`

Extracts the keys of a given `map` into an `ARRAY` of the corresponding type.

### Example

```sql
mysql> select map_keys(map(1, "100", 0.1, 2));
+-------------------------------------------------------------------------------------------------+
| map_keys(map(cast(1 as DECIMALV3(2, 1)), '100', cast(0.1 as DECIMALV3(2, 1)), cast(2 as TEXT))) |
+-------------------------------------------------------------------------------------------------+
| [1.0, 0.1]                                                                                      |
+-------------------------------------------------------------------------------------------------+
1 row in set (0.15 sec)

mysql> select map_keys(map());
+-----------------+
| map_keys(map()) |
+-----------------+
| []              |
+-----------------+
1 row in set (0.12 sec)
```

### Keywords

MAP, KEYS, MAP_KEYS
