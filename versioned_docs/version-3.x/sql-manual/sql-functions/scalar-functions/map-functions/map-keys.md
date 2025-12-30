---
{
    "title": "MAP_KEYS",
    "language": "en",
    "description": "Extract the keys of the given map into an ARRAY of the corresponding type"
}
---

## Description

Extract the keys of the given `map` into an `ARRAY` of the corresponding type

## Syntax

```sql
MAP_KEYS(<map>)
```

## Parameters

| Parameter | Description |
| -- | -- |
| `<map>` | Input map content |

## Return Value

Extract the keys of the given `map` into an `ARRAY` of the corresponding type

## Example

```sql
select map_keys(map()),map_keys(map(1, "100", 0.1, 2));
```

```text
+-----------------+-------------------------------------------------------------------------------------------------+
| map_keys(map()) | map_keys(map(cast(1 as DECIMALV3(2, 1)), '100', cast(0.1 as DECIMALV3(2, 1)), cast(2 as TEXT))) |
+-----------------+-------------------------------------------------------------------------------------------------+
| []              | [1.0, 0.1]                                                                                      |
+-----------------+-------------------------------------------------------------------------------------------------+
```
