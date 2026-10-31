---
{
    "title": "MAP_VALUES",
    "language": "en"
}
---

### Description

#### Syntax

`ARRAY<K> map_values(Map<K, V> map)`

Extracts the value of a given `map` into an `ARRAY` of the corresponding type.

### Example

```sql
mysql> select map_values(map(1, "100", 0.1, 2));
+---------------------------------------------------------------------------------------------------+
| map_values(map(cast(1 as DECIMALV3(2, 1)), '100', cast(0.1 as DECIMALV3(2, 1)), cast(2 as TEXT))) |
+---------------------------------------------------------------------------------------------------+
| ["100", "2"]                                                                                      |
+---------------------------------------------------------------------------------------------------+
1 row in set (0.12 sec)

mysql> select map_values(map());
+-------------------+
| map_values(map()) |
+-------------------+
| []                |
+-------------------+
1 row in set (0.11 sec)
```

### Keywords

MAP, VALUES, MAP_VALUES
