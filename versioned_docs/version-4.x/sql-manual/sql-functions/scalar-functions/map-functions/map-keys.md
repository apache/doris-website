---
{
    "title": "MAP_KEYS",
    "language": "en",
    "description": "Extracts the keys from a given map into an ARRAY of the corresponding type."
}
---

## Description

Extracts the keys from a given `map` into an [`ARRAY`](../../../basic-element/sql-data-types/semi-structured/ARRAY.md) of the corresponding type.

## Syntax

```sql
MAP_KEYS(<map>)
```

## Parameters
- `<map>` [`MAP`](../../../basic-element/sql-data-types/semi-structured/MAP.md) type, the input map content.

## Return Value
Extracts the keys from a given `map` into an [`ARRAY`](../../../basic-element/sql-data-types/semi-structured/ARRAY.md) of the corresponding type.

## Examples
1. Regular parameters
    ```sql
    select map_keys(map()),map_keys(map(1, "100", 0.1, 2, null, null));
    ```
    ```text
    +-----------------+---------------------------------------------+
    | map_keys(map()) | map_keys(map(1, "100", 0.1, 2, null, null)) |
    +-----------------+---------------------------------------------+
    | []              | [1.0, 0.1, null]                            |
    +-----------------+---------------------------------------------+
    ```
2. NULL parameters
    ```sql
    select map_keys(NULL);
    ```
    ```text
    +----------------+
    | map_keys(NULL) |
    +----------------+
    | NULL           |
    +----------------+
    ```