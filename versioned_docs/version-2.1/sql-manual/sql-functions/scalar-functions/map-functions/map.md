---
{
    "title": "MAP | Map Functions",
    "language": "en",
    "description": "Constructs a Map<K, V> of a specific type using some set of key-value pairs"
}
---

# MAP

## Description

Constructs a `Map<K, V>` of a specific type using some set of key-value pairs

## Syntax

```sql
MAP( <key1> , <value1> [, <key2>,<value2> ... ])
```

## Parameters

| Parameter | Description |
| -- | -- |
| `<key>` | Constructing the key of the map, case sensitive |
| `<value>` | Constructing the value of the map |

## Return Value

Returns a specific type `Map<K, V>` constructed from a number of key-value pairs

## Example

```sql
select map(1, "100", 0.1, 2),map(1, "100", 0.1, 2)[1];
```

```text
+---------------------------------------------------------------------------------------+-------------------------------------------------------------------------------------------------------------------------------+
| map(cast(1 as DECIMALV3(2, 1)), '100', cast(0.1 as DECIMALV3(2, 1)), cast(2 as TEXT)) | element_at(map(cast(1 as DECIMALV3(2, 1)), '100', cast(0.1 as DECIMALV3(2, 1)), cast(2 as TEXT)), cast(1 as DECIMALV3(2, 1))) |
+---------------------------------------------------------------------------------------+-------------------------------------------------------------------------------------------------------------------------------+
| {1.0:"100", 0.1:"2"}                                                                  | 100                                                                                                                           |
+---------------------------------------------------------------------------------------+-------------------------------------------------------------------------------------------------------------------------------+
```

