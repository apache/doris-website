---
{
    "title": "MAP_CONTAINS_KEY",
    "language": "en"
}
---

## Description

Determines whether a given `map` contains a specific key `key`

## Syntax

```sql
MAP_CONTAINS_KEY(<map>, <key>)
```

## Parameters
- `<map>` [`MAP`](../../../basic-element/sql-data-types/semi-structured/MAP.md) type, the input map content.
- `<key>` Key type supported by [`MAP`](../../../basic-element/sql-data-types/semi-structured/MAP.md), the key to be searched.

## Return Value
Determines whether a given `map` contains a specific key `key`, returns 1 if it exists, returns 0 if it does not exist.

## Examples

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
> Key comparison in Map uses "null-safe equal" (null and null are considered equal), which is different from 

```sql
select map_contains_key(map(null,1), null);
```
```text
+-------------------------------------+
| map_contains_key(map(null,1), null) |
+-------------------------------------+
|                                   1 |
+-------------------------------------+