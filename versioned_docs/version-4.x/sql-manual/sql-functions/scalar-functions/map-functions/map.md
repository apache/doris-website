---
{
    "title": "MAP | Map Functions",
    "language": "en",
    "description": "Constructs a MAP<K, V> of a specific type using several groups of key-value pairs"
}
---

## Description

Constructs a [`MAP<K, V>`](../../../basic-element/sql-data-types/semi-structured/MAP.md) of a specific type using several groups of key-value pairs

## Syntax

```sql
MAP( <key1> , <value1> [, <key2>, <value2> ... ])
```

## Parameters
### Optional Parameters
- `<key1>` supports multiple types (refer to [`MAP<K, V>`](../../../basic-element/sql-data-types/semi-structured/MAP.md)) to construct the key of the map
- `<value1>` to construct the value of the map
### Variable Parameters
Supports multiple groups of key-value parameters

## Return Value

Returns a specific type `MAP<K, V>` constructed from several groups of key-value pairs

## Notes
1. The number of parameters must be even (can be 0), otherwise an error will be reported.
2. Key parameters can appear repeatedly, but Doris will remove duplicate keys.
3. Keys can be NULL, and multiple NULL keys will be deduplicated.

## Examples
1. Regular parameters
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
2. No parameters case
    ```sql
    select map();
    ```
    ```text
    +-------+
    | map() |
    +-------+
    | {}    |
    +-------+
    ```
3. NULL parameters
    ```sql
    select map(null, 2, 3, null);
    ```
    ```text
    +-----------------------+
    | map(null, 2, 3, null) |
    +-----------------------+
    | {null:2, 3:null}      |
    +-----------------------+
    ```
4. If there are duplicate keys, they will be deduplicated
    ```sql
    select map(1, 2, 2, 11, 1, 3, null, "null 1", null, "null 2");
    ```
    ```text
    +--------------------------------------------------------+
    | map(1, 2, 2, 11, 1, 3, null, "null 1", null, "null 2") |
    +--------------------------------------------------------+
    | {2:"11", 1:"3", null:"null 2"}                         |
    +--------------------------------------------------------+
    ```
