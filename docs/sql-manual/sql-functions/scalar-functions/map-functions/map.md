---
{
    "title": "MAP",
    "language": "en"
}
---

## Description

Constructs a [`Map<K, V>`](../../../basic-element/sql-data-types/semi-structured/MAP.md) of a specific type using some set of key-value pairs

## Syntax

```sql
MAP( <key1> , <value1> [, <key2>,<value2> ... ])
```

## Parameters

| Parameter | Description                                     |
| -- |-------------------------------------------------|
| `<key>` | Constructing the key of the map, case sensitive |
| `<value>` | Constructing the value of the map               |

## Return Value

Returns a specific type `Map<K, V>` constructed from a number of key-value pairs

## Example

```sql
select map(1, "100", 0.1, 2),map(1, "100", 0.1, 2)[1];
```

```text
+-----------------------+--------------------------+
| map(1, "100", 0.1, 2) | map(1, "100", 0.1, 2)[1] |
+-----------------------+--------------------------+
| {1.0:"100", 0.1:"2"}  | 100                      |
+-----------------------+--------------------------+
```

* If there are duplicate keys, they will be deduplicated：
```sql
select map(1, 2, 2, 11, 1, 3);
```
```text
+------------------------+
| map(1, 2, 2, 11, 1, 3) |
+------------------------+
| {2:11, 1:3}            |
+------------------------+
```
> There are two sets of parameters with the key 1 (1, 2 and 1, 3), only 1, 3 is retained.