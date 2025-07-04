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
+-----------------------------------------------+-----------------------------------------------+
| map_contains_key(map(null, 1, 2, null), null) | map_contains_key(map(1, "100", 0.1, 2), 0.11) |
+-----------------------------------------------+-----------------------------------------------+
|                                             1 |                                             0 |
+-----------------------------------------------+-----------------------------------------------+
```
* Key comparison in maps uses "null-safe equal" (null and null are considered equal), which differs from the standard SQL definition.

```sql
select map_contains_key(map(null,1), null);
```
```text
+-------------------------------------+
| map_contains_key(map(null,1), null) |
+-------------------------------------+
|                                   1 |
+-------------------------------------+
```
