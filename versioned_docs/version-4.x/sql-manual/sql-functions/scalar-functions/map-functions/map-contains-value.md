---
{
    "title": "MAP_CONTAINS_VALUE",
    "language": "en",
    "description": "Determines whether a given map contains a specific value value"
}
---

## Description

Determines whether a given `map` contains a specific value `value`

## Syntax

```sql
MAP_CONTAINS_VALUE(<map>, <value>)
```

## Parameters
- `<map>` [`MAP`](../../../basic-element/sql-data-types/semi-structured/MAP.md) type, the input map content.
- `<value>` supports multiple types, the value to be searched.

## Return Value
Determines whether a given `map` contains a specific value `value`. Returns 1 if exists, 0 if not exists.

## Usage Notes
1. If parameter `<map>` is NULL, returns NULL.
2. `<value>` can be NULL. The comparison for NULL is `null-safe-equal`, which means NULL is considered equal to NULL.

## Examples
1. Regular parameters
    ```sql
    select map_contains_value(map(1, "100", 0.1, 2), 100), map_contains_value(map(1, "100", 0.1, 2), 101);
    ```
    ```text
    +------------------------------------------------+------------------------------------------------+
    | map_contains_value(map(1, "100", 0.1, 2), 100) | map_contains_value(map(1, "100", 0.1, 2), 101) |
    +------------------------------------------------+------------------------------------------------+
    |                                              1 |                                              0 |
    +------------------------------------------------+------------------------------------------------+
    ```
2. NULL parameters
    ```sql
    select map_contains_value(NULL, 100);
    ```
    ```text
    +-------------------------------+
    | map_contains_value(NULL, 100) |
    +-------------------------------+
    |                          NULL |
    +-------------------------------+
    ```
    ```sql
    select map_contains_value(map(null, null), null), map_contains_value(map(null, 100), null);
    ```
    ```text
    +-------------------------------------------+------------------------------------------+
    | map_contains_value(map(null, null), null) | map_contains_value(map(null, 100), null) |
    +-------------------------------------------+------------------------------------------+
    |                                         1 |                                        0 |
    +-------------------------------------------+------------------------------------------+
    ```