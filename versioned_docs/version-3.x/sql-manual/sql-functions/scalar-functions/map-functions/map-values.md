---
{
    "title": "MAP_VALUES",
    "language": "en",
    "description": "Extract the values of the given map into an ARRAY of the corresponding type"
}
---

## Description

Extract the values of the given `map` into an `ARRAY` of the corresponding type

## Syntax

```sql
MAP_VALUES(<map>)
```

## Parameters

| Parameter | Description |
| -- | -- |
| `<map>` | Input map content |

## Return Value

Extract the values of the given `map` into an `ARRAY` of the corresponding type

## Example

```sql
select map_values(map()),map_values(map(1, "100", 0.1, 2));
```

```text
+-------------------+---------------------------------------------------------------------------------------------------+
| map_values(map()) | map_values(map(cast(1 as DECIMALV3(2, 1)), '100', cast(0.1 as DECIMALV3(2, 1)), cast(2 as TEXT))) |
+-------------------+---------------------------------------------------------------------------------------------------+
| []                | ["100", "2"]                                                                                      |
+-------------------+---------------------------------------------------------------------------------------------------+
```
