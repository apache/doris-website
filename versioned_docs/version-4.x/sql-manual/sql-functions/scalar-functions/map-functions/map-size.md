---
{
    "title": "MAP_SIZE",
    "language": "en",
    "description": "Calculates the number of elements in a Map"
}
---

## Description

Calculates the number of elements in a Map

## Syntax

```sql
MAP_SIZE(<map>)
```

## Parameters
- `<map>` [`MAP`](../../../basic-element/sql-data-types/semi-structured/MAP.md) type, the input map content.
## Return Value
Returns the number of elements in the Map

## Usage Notes
1. Both NULL keys and values are counted.
2. For NULL parameters, returns NULL.

## Examples
1. Regular parameters
    ```sql
    select map_size(map()), map_size(map(1, "100", 0.1, 2, null, null));
    ```

    ```text
    +-----------------+---------------------------------------------+
    | map_size(map()) | map_size(map(1, "100", 0.1, 2, null, null)) |
    +-----------------+---------------------------------------------+
    |               0 |                                           3 |
    +-----------------+---------------------------------------------+
    ```
2. NULL parameters
    ```sql
    select map_size(NULL);
    ```
    ```text
    +----------------+
    | map_size(NULL) |
    +----------------+
    |           NULL |
    +----------------+
    ```