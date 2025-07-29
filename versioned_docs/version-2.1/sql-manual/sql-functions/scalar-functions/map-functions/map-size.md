---
{
    "title": "MAP_SIZE",
    "language": "en"
}
---

## Description

Count the number of elements in a Map

## Syntax

```sql
MAP_SIZE(<map>)
```

## Parameters

| Parameter | Description |
| -- | -- |
| `<map>` | Input map content |

## Return Value

Returns the number of elements in the Map

## Example

```sql
select map_size(map()),map_size(map(1, "100", 0.1, 2));
```

```text
+-----------------+-------------------------------------------------------------------------------------------------+
| map_size(map()) | map_size(map(cast(1 as DECIMALV3(2, 1)), '100', cast(0.1 as DECIMALV3(2, 1)), cast(2 as TEXT))) |
+-----------------+-------------------------------------------------------------------------------------------------+
|               0 |                                                                                               2 |
+-----------------+-------------------------------------------------------------------------------------------------+
```
