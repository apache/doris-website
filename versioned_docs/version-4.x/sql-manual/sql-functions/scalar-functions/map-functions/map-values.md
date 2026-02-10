---
{
    "title": "MAP_VALUES",
    "language": "en",
    "description": "Extracts the values from a given MAP into an ARRAY of the corresponding type."
}
---

## Description

Extracts the values from a given [`MAP`](../../../basic-element/sql-data-types/semi-structured/MAP.md) into an [`ARRAY`](../../../basic-element/sql-data-types/semi-structured/ARRAY.md) of the corresponding type.

## Syntax

```sql
MAP_VALUES(<map>)
```

## Parameters
- `<map>` [`MAP`](../../../basic-element/sql-data-types/semi-structured/MAP.md) type, the input map content.

## Return Value
Extracts the values from a given `map` into an [`ARRAY`](../../../basic-element/sql-data-types/semi-structured/ARRAY.md) of the corresponding type.

## Usage Notes
1. For NULL parameters, returns NULL.
2. For empty MAP objects, returns an empty array.
3. NULL values in the MAP are also included in the returned array.

## Examples
1. Regular parameters
    ```sql
    select map_values(map()), map_values(map(1, "100", 0.1, 2, 0.3, null));
    ```

    ```text
    +-------------------+----------------------------------------------+
    | map_values(map()) | map_values(map(1, "100", 0.1, 2, 0.3, null)) |
    +-------------------+----------------------------------------------+
    | []                | ["100", "2", null]                           |
    +-------------------+----------------------------------------------+
    ```
2. NULL parameters
    ```sql
    select map_values(null);
    ```
    ```text
    +------------------+
    | map_values(null) |
    +------------------+
    | NULL             |
    +------------------+
    ```
