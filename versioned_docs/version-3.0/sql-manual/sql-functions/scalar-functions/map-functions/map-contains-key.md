---
{
    "title": "MAP_CONTAINS_KEY",
    "language": "en"
}
---

## Description

Determines whether the given `map` contains a specific key `key`

## Syntax

```sql
MAP_CONTAINS_KEY(<map>, <key>)
```

## Parameters

| Parameter | Description |
| -- | -- |
| `<map>` | Input map content |
| `<key>` | The key to be retrieved |

## Return Value

Determines whether the given `map` contains a specific key `key`, and returns 1 if it exists, otherwise returns 0.

## Example

```sql
select map_contains_key(map(null, 1, 2, null), null),map_contains_key(map(1, "100", 0.1, 2), 0.11);
```

```text
+-----------------------------------------------+---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
| map_contains_key(map(NULL, 1, 2, NULL), NULL) | map_contains_key(cast(map(cast(1 as DECIMALV3(2, 1)), '100', cast(0.1 as DECIMALV3(2, 1)), cast(2 as TEXT)) as MAP<DECIMALV3(3, 2),VARCHAR(3)>), cast(0.11 as DECIMALV3(3, 2))) |
+-----------------------------------------------+---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
|                                             1 |                                                                                                                                                                               0 |
+-----------------------------------------------+---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
```
