---
{
    "title": "JSON_EXTRACT_ISNULL",
    "language": "en"
}
---

## Description
`JSON_EXTRACT_ISNULL` determines whether the field specified by `<json_path>` in a JSON object is a null value.

## Syntax
```sql
JSON_EXTRACT_ISNULL(<json_object>, <json_path>)
```

## Parameters
- `<json_object>`: JSON type, the target parameter to extract from.
- `<json_path>`: String type, the JSON path to extract the target element from the target JSON.

## Return Value
`Nullable(BOOL)` Returns true if the value is null, otherwise returns false.

## Usage Notes
1. If `<json_object>` or `<json_path>` is NULL, returns NULL.
2. If the element specified by `<json_path>` does not exist, returns NULL.
3. If the element specified by `<json_path>` is not null, returns false.

## Examples
1. Normal parameters
    ```sql
    SELECT json_extract_isnull('{"id": 123, "name": "doris"}', '$.id');
    ```
    ```text
    +-------------------------------------------------------------+
    | json_extract_isnull('{"id": 123, "name": "doris"}', '$.id') |
    +-------------------------------------------------------------+
    |                                                           0 |
    +-------------------------------------------------------------+
    ```

    ```sql
    SELECT json_extract_isnull('{"id": null, "name": "doris"}', '$.id');
    ```
    ```text
    +--------------------------------------------------------------+
    | json_extract_isnull('{"id": null, "name": "doris"}', '$.id') |
    +--------------------------------------------------------------+
    |                                                            1 |
    +--------------------------------------------------------------+
    ```
2. Case where path does not exist
    ```sql
    SELECT json_extract_isnull('{"id": null, "name": "doris"}', '$.id2');
    ```
    ```text
    +---------------------------------------------------------------+
    | json_extract_isnull('{"id": null, "name": "doris"}', '$.id2') |
    +---------------------------------------------------------------+
    |                                                          NULL |
    +---------------------------------------------------------------+
    ```
3. NULL parameters
    ```sql
    SELECT json_extract_isnull('{"id": 123, "name": "doris"}', NULl);
    ```
    ```text
    +-----------------------------------------------------------+
    | json_extract_isnull('{"id": 123, "name": "doris"}', NULl) |
    +-----------------------------------------------------------+
    |                                                      NULL |
    +-----------------------------------------------------------+
    ```
    ```sql
    SELECT json_extract_isnull(NULL, '$.id2');
    ```
    ```text
    +------------------------------------+
    | json_extract_isnull(NULL, '$.id2') |
    +------------------------------------+
    |                               NULL |
    +------------------------------------+
    ```