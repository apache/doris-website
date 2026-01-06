---
{
    "title": "MAP_ENTRIES",
    "language": "en",
    "description": "Converts the given map into an ARRAY<STRUCT<key, value>>."
}
---

## Description

Converts the given `map` into an `ARRAY<STRUCT<key, value>>`.

Each element of the returned array is a struct with two named fields: `key` and `value`. Both fields are nullable.
The `key` and `value` field types are the same as the map's key and value types respectively.

## Syntax

```sql
MAP_ENTRIES(<map>)
```

## Parameters

| Parameter | Description |
| -- | -- |
| `<map>` | Input map content |

## Return Value

Returns an array of structs that represent the entries of the map. If `<map>` is `NULL`, returns `NULL`.

## Example

```sql
select 
  map_entries(map()),
  map_entries(map(1, '100', 0.1, '2'));
```

```text
+--------------------+--------------------------------------------------------+
| map_entries(map()) | map_entries(map(1, '100', 0.1, '2'))                   |
+--------------------+--------------------------------------------------------+
| []                 | [{"key":1.0, "value":"100"}, {"key":0.1, "value":"2"}] |
+--------------------+--------------------------------------------------------+
```


