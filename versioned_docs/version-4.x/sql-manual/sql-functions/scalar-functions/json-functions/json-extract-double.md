---
{
    "title": "JSON_EXTRACT_DOUBLE",
    "language": "en"
}
---

## Description
`JSON_EXTRACT_DOUBLE` extracts the field specified by `<json_path>` from a JSON object and converts it to [`DOUBLE`](../../../basic-element/sql-data-types/numeric/FLOATING-POINT.md) type.

## Syntax
```sql
JSON_EXTRACT_DOUBLE(<json_object>, <json_path>)
```

## Parameters
- `<json_object>`: JSON type, the target parameter to extract from.
- `<json_path>`: String type, the JSON path to extract the target element from the target JSON.

## Return Value
`Nullable(DOUBLE)` Returns the extracted DOUBLE value, returns NULL in some cases

## Usage Notes
1. If `<json_object>` or `<json_path>` is NULL, returns NULL.
2. If the element specified by `<json_path>` does not exist, returns NULL.
3. If the element specified by `<json_path>` cannot be converted to DOUBLE, returns NULL.
4. Its behavior is consistent with "cast + json_extract", which is equivalent to:
    ```sql
    CAST(JSON_EXTRACT(<json_object>, <json_path>) as DOUBLE)
    ```

## Examples
1. Normal parameters
    ```sql
    SELECT json_extract_double('{"id": 123.345, "name": "doris"}', '$.id');
    ```
    ```text
    +-----------------------------------------------------------------+
    | json_extract_double('{"id": 123.345, "name": "doris"}', '$.id') |
    +-----------------------------------------------------------------+
    |                                                         123.345 |
    +-----------------------------------------------------------------+
    ```
2. Case where path does not exist
    ```sql
    SELECT json_extract_double('{"id": 123.345, "name": "doris"}', '$.id2');
    ```
    ```text
    +------------------------------------------------------------------+
    | json_extract_double('{"id": 123.345, "name": "doris"}', '$.id2') |
    +------------------------------------------------------------------+
    |                                                             NULL |
    +------------------------------------------------------------------+
    ```
3. NULL parameters
    ```sql
    SELECT json_extract_double('{"id": 123.345, "name": "doris"}', NULl);
    ```
    ```text
    +---------------------------------------------------------------+
    | json_extract_double('{"id": 123.345, "name": "doris"}', NULl) |
    +---------------------------------------------------------------+
    |                                                          NULL |
    +---------------------------------------------------------------+
    ```
    ```sql
    SELECT json_extract_double(NULL, '$.id2');
    ```
    ```text
    +------------------------------------+
    | json_extract_double(NULL, '$.id2') |
    +------------------------------------+
    |                               NULL |
    +------------------------------------+
    ```
4. Case where conversion to DOUBLE is not possible
    ```sql
    SELECT json_extract_double('{"id": 123, "name": "doris"}','$.name');
    ```
    ```text
    +--------------------------------------------------------------+
    | json_extract_double('{"id": 123, "name": "doris"}','$.name') |
    +--------------------------------------------------------------+
    |                                                         NULL |
    +--------------------------------------------------------------+
    ```
