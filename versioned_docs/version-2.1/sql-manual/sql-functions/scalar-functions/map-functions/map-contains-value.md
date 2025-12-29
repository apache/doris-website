---
{
    "title": "MAP_CONTAINS_VALUE",
    "language": "en",
    "description": "Determines whether the given map contains a specific value value"
}
---

## Description

Determines whether the given `map` contains a specific value `value`

## Syntax

```sql
MAP_CONTAINS_VALUE(<map>, <value>)
```

## Parameters

| Parameter | Description |
| -- | -- |
| `<map>` | Input map content |
| `<value>` | The value to be retrieved |

## Return Value

Determines whether the given `map` contains a specific value `value`, and returns 1 if it exists, otherwise returns 0.

## Example

```sql
select map_contains_value(map(null, 1, 2, null), null),map_contains_value(map(1, "100", 0.1, 2), 101);
```

```text
+-------------------------------------------------+------------------------------------------------------------------------------------------------------------------------------------+
| map_contains_value(map(NULL, 1, 2, NULL), NULL) | map_contains_value(map(cast(1 as DECIMALV3(2, 1)), '100', cast(0.1 as DECIMALV3(2, 1)), cast(2 as TEXT)), cast(101 as VARCHAR(3))) |
+-------------------------------------------------+------------------------------------------------------------------------------------------------------------------------------------+
|                                               1 |                                                                                                                                  0 |
+-------------------------------------------------+------------------------------------------------------------------------------------------------------------------------------------+
```
