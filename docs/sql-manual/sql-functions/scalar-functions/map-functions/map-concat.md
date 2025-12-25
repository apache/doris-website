---
{
    "title": "MAP_CONCAT",
    "language": "en"
}
---

## Description

Concatenates multiple maps into a single map.

## Syntax

```sql
MAP_CONCAT(<map1> [, <map2> [, <map3> ... ]])
```

## Parameters
- `<map1>`, `<map2>`, `<map3>`, ...: [`MAP`](../../../basic-element/sql-data-types/semi-structured/MAP.md) type, the input maps to concatenate.

## Return Value
Returns a concatenated `MAP` containing all key-value pairs from the input maps.

## Usage Notes
1. The function accepts zero or more map arguments.
2. If any argument is NULL, the result is NULL.

## Examples
1. Basic usage
    ```sql
    select map_concat() as empty_map;
    ```
    ```text
    +-----------+
    | empty_map |
    +-----------+
    | {}        |
    +-----------+
    ```

    ```sql
    select map_concat(map('single', 'argument')) as single_argument;
    ```
    ```text
    +-----------------+
    | single_argument |
    +-----------------+
    | {"single":"argument"} |
    +-----------------+
    ```

    ```sql
    select map_concat({'a': 'apple'}, {'b': 'banana'}, {'c': 'cherry'}) as literal_maps_merged;
    ```
    ```text
    +-------------------------------+
    | literal_maps_merged           |
    +-------------------------------+
    | {"a":"apple", "b":"banana", "c":"cherry"} |
    +-------------------------------+
    ```

2. NULL parameters
    ```sql
    select map_concat({'a': 'apple'}, NULL) as with_null;
    ```
    ```text
    +------------+
    | with_null  |
    +------------+
    | NULL       |
    +------------+
