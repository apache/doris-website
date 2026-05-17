---
{
    "title": "MAP_AGG",
    "language": "en",
    "description": "The MAPAGG function is used to form a mapping structure based on key-value pairs from multiple rows of data."
}
---

## Description

The MAP_AGG function is used to form a mapping structure based on key-value pairs from multiple rows of data.

## Syntax

`MAP_AGG(<expr1>, <expr2>)`

## Parameters

| Parameter | Description |
| -- | -- |
| `<expr1>` | The expression used as the key. Supported types: Bool, TinyInt, SmallInt, Integer, BigInt, LargeInt, Float, Double, Decimal, Date, Datetime, String. |
| `<expr2>` | The expression used as the value. Supported types: Bool, TinyInt, SmallInt, Integer, BigInt, LargeInt, Float, Double, Decimal, Date, Datetime, String. |

## Return Value

Returns a value of the Map type. If there is no valid data in the group, returns an empty Map.

## Example

```sql
-- setup
CREATE TABLE nation (
    n_nationkey INT,
    n_name STRING,
    n_regionkey INT
) DISTRIBUTED BY HASH(n_nationkey) BUCKETS 1
PROPERTIES ("replication_num" = "1");
INSERT INTO nation VALUES
    (0, 'ALGERIA', 0),
    (1, 'ARGENTINA', 1),
    (2, 'BRAZIL', 1),
    (3, 'CANADA', 1);
```

```sql
select `n_regionkey`, map_agg(`n_nationkey`, `n_name`) from `nation` group by `n_regionkey`;
```

```text
+-------------+-----------------------------------------+
| n_regionkey | map_agg(`n_nationkey`, `n_name`)        |
+-------------+-----------------------------------------+
|           0 | {0:"ALGERIA"}                           |
|           1 | {1:"ARGENTINA", 2:"BRAZIL", 3:"CANADA"} |
+-------------+-----------------------------------------+
```

```sql
select map_agg(`n_name`, `n_nationkey` % 5) from `nation`;
```

```text
+------------------------------------------------------+
| map_agg(`n_name`, `n_nationkey` % 5)                 |
+------------------------------------------------------+
| {"ALGERIA":0, "ARGENTINA":1, "BRAZIL":2, "CANADA":3} |
+------------------------------------------------------+
```

```sql
select map_agg(`n_name`, `n_nationkey` % 5) from `nation` where n_nationkey is null;
```

```text
+--------------------------------------+
| map_agg(`n_name`, `n_nationkey` % 5) |
+--------------------------------------+
| {}                                   |
+--------------------------------------+
```
select n_regionkey, map_agg(`n_name`, `n_nationkey` % 5) from `nation` group by `n_regionkey`;
```

```text
+-------------+------------------------------------------------------------------------+
| n_regionkey | map_agg(`n_name`, (`n_nationkey` % 5))                                 |
+-------------+------------------------------------------------------------------------+
|           2 | {"INDIA":3, "INDONESIA":4, "JAPAN":2, "CHINA":3, "VIETNAM":1}          |
|           0 | {"ALGERIA":0, "ETHIOPIA":0, "KENYA":4, "MOROCCO":0, "MOZAMBIQUE":1}    |
|           3 | {"FRANCE":1, "GERMANY":2, "ROMANIA":4, "RUSSIA":2, "UNITED KINGDOM":3} |
|           1 | {"ARGENTINA":1, "BRAZIL":2, "CANADA":3, "PERU":2, "UNITED STATES":4}   |
|           4 | {"EGYPT":4, "IRAN":0, "IRAQ":1, "JORDAN":3, "SAUDI ARABIA":0}          |
+-------------+------------------------------------------------------------------------+
```
