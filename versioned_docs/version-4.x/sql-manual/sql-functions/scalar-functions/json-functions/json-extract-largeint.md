---
{
    "title": "JSON_EXTRACT_LARGEINT",
    "language": "en",
    "description": "JSONEXTRACTLARGEINT extracts the field specified by <jsonpath> from a JSON object and converts it to LARGEINT type."
}
---

## Description
`JSON_EXTRACT_LARGEINT` extracts the field specified by `<json_path>` from a JSON object and converts it to [`LARGEINT`](../../../basic-element/sql-data-types/numeric/LARGEINT.md) type.

## Syntax
```sql
JSON_EXTRACT_LARGEINT(<json_object>, <json_path>)
```

## Parameters
- `<json_object>`: JSON type, the target parameter to extract from.
- `<json_path>`: String type, the JSON path to extract the target element from the target JSON.

## Return Value
`Nullable(LARGEINT)` Returns the extracted LARGEINT value, returns NULL in some cases

## Usage Notes
1. If `<json_object>` or `<json_path>` is NULL, returns NULL.
2. If the element specified by `<json_path>` does not exist, returns NULL.
3. If the element specified by `<json_path>` cannot be converted to LARGEINT, returns NULL.
4. Its behavior is consistent with "cast + json_extract", which is equivalent to:
    ```sql
    CAST(JSON_EXTRACT(<json_object>, <json_path>) as LARGEINT)
    ```

## Examples
1. Normal parameters
    ```sql
    SELECT json_extract_largeint('{"id": 11529215046068469760, "name": "doris"}', '$.id');
    ```
    ```text
    +--------------------------------------------------------------------------------+
    | json_extract_largeint('{"id": 11529215046068469760, "name": "doris"}', '$.id') |
    +--------------------------------------------------------------------------------+
    | 11529215046068469760                                                           |
    +--------------------------------------------------------------------------------+
    ```
2. Case where path does not exist
    ```sql
    SELECT json_extract_largeint('{"id": 11529215046068469760, "name": "doris"}', '$.id2');
    ```
    ```text
    +---------------------------------------------------------------------------------+
    | json_extract_largeint('{"id": 11529215046068469760, "name": "doris"}', '$.id2') |
    +---------------------------------------------------------------------------------+
    | NULL                                                                            |
    +---------------------------------------------------------------------------------+
    ```
3. NULL parameters
    ```sql
    SELECT json_extract_largeint('{"id": 11529215046068469760, "name": "doris"}', NULl);
    ```
    ```text
    +------------------------------------------------------------------------------+
    | json_extract_largeint('{"id": 11529215046068469760, "name": "doris"}', NULl) |
    +------------------------------------------------------------------------------+
    | NULL                                                                         |
    +------------------------------------------------------------------------------+
    ```
    ```sql
    SELECT json_extract_largeint(NULL, '$.id2');
    ```
    ```text
    +--------------------------------------+
    | json_extract_largeint(NULL, '$.id2') |
    +--------------------------------------+
    | NULL                                 |
    +--------------------------------------+
    ```
4. Case where conversion to LARGEINT is not possible
    ```sql
    SELECT json_extract_largeint('{"id": 123, "name": "doris"}','$.name');
    ```
    ```text
    +----------------------------------------------------------------+
    | json_extract_largeint('{"id": 123, "name": "doris"}','$.name') |
    +----------------------------------------------------------------+
    | NULL                                                           |
    +----------------------------------------------------------------+
    ```