---
{
    "title": "MAP_CONTAINS_ENTRY",
    "language": "en"
}
---

## Description

Determines whether the given `map` contains a specific entry `(key, value)`

## Syntax

```sql
MAP_CONTAINS_ENTRY(<map>, <key>, <value>)
```

## Parameters

| Parameter | Description |
| -- | -- |
| `<map>` | Input map content |
| `<key>` | The key to be retrieved |
| `<value>` | The value to be retrieved |

## Return Value

Determines whether the given `map` contains a specific `(key, value)` pair. Returns 1 if it exists, otherwise returns 0. If `<map>` is `NULL`, returns `NULL`.

Key and value comparisons use "null-safe equal" (two `NULL`s are considered equal), which differs from the standard SQL definition.

## Example

```sql
select map_contains_entry(map(null, 1, 2, null), null, 1);
```

```text
+----------------------------------------------------+
| map_contains_entry(map(null, 1, 2, null), null, 1) |
+----------------------------------------------------+
|                                                  1 |
+----------------------------------------------------+
```

```sql
select map_contains_entry(map(1, '100', 0.1, '2'), 1, '100');
```

```text
+-------------------------------------------------------+
| map_contains_entry(map(1, '100', 0.1, '2'), 1, '100') |
+-------------------------------------------------------+
|                                                     1 |
+-------------------------------------------------------+
```

```sql
select map_contains_entry(map(1, '100', 0.1, '2'), 0.11, '2');
```

```text
+--------------------------------------------------------+
| map_contains_entry(map(1, '100', 0.1, '2'), 0.11, '2') |
+--------------------------------------------------------+
|                                                      0 |
+--------------------------------------------------------+
```
