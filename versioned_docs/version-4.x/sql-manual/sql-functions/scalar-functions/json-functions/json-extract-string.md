---
{
    "title": "JSON_EXTRACT_STRING",
    "language": "en"
}
---

## Description
`JSON_EXTRACT_STRING` extracts the field specified by `<json_path>` from a JSON object and converts it to [`STRING`](../../../basic-element/sql-data-types/string-type/STRING.md) type.

## Syntax
```sql
JSON_EXTRACT_STRING(<json_object>, <json_path>)
```

## Parameters
- `<json_object>`: JSON type, the target parameter to extract from.
- `<json_path>`: String type, the JSON path to extract the target element from the target JSON.

## Return Value
`Nullable(STRING)` Returns the extracted STRING value, returns NULL in some cases

## Usage Notes
1. If `<json_object>` or `<json_path>` is NULL, returns NULL.
2. If the element specified by `<json_path>` does not exist, returns NULL.
3. If the element specified by `<json_path>` cannot be converted to STRING, returns NULL.
4. Its behavior is consistent with "cast + json_extract", which is equivalent to:
    ```sql
    CAST(JSON_EXTRACT(<json_object>, <json_path>) as STRING)
    ```
    So even if the object pointed to by `<json_path>` is not of STRING type, as long as it supports conversion to STRING type, you can get the converted value.
5. The STRING returned here does not contain double quotes (").
6. For null values in JSON objects, the result is not NULL but the string "null". 
If you want to check whether an element is null, please use the function  [`JSON_EXTRACT_ISNULL`](./json-extract-isnull.md)。

## Examples
1. Normal parameters
    ```sql
    SELECT json_extract_string('{"id": 123, "name": "doris"}', '$.name');
    ```
    ```text
    +---------------------------------------------------------------+
    | json_extract_string('{"id": 123, "name": "doris"}', '$.name') |
    +---------------------------------------------------------------+
    | doris                                                         |
    +---------------------------------------------------------------+
    ```
2. Case where path does not exist
    ```sql
    SELECT json_extract_string('{"id": 123, "name": "doris"}', '$.name2');
    ```
    ```text
    +----------------------------------------------------------------+
    | json_extract_string('{"id": 123, "name": "doris"}', '$.name2') |
    +----------------------------------------------------------------+
    | NULL                                                           |
    +----------------------------------------------------------------+
    ```
3. NULL parameters
    ```sql
    SELECT json_extract_string('{"id": 123, "name": "doris"}', NULl);
    ```
    ```text
    +-----------------------------------------------------------+
    | json_extract_string('{"id": 123, "name": "doris"}', NULl) |
    +-----------------------------------------------------------+
    | NULL                                                      |
    +-----------------------------------------------------------+
    ```
    ```sql
    SELECT json_extract_string(NULL, '$.id2');
    ```
    ```text
    +------------------------------------+
    | json_extract_string(NULL, '$.id2') |
    +------------------------------------+
    | NULL                               |
    +------------------------------------+
    ```
4. Case where other types are converted to STRING
    ```sql
    SELECT json_extract_string('{"id": 123, "name": "doris"}','$.id');
    ```
    ```text
    +------------------------------------------------------------+
    | json_extract_string('{"id": 123, "name": "doris"}','$.id') |
    +------------------------------------------------------------+
    | 123                                                        |
    +------------------------------------------------------------+
    ```
5. Null values will be converted to string "null" instead of NULL
    ```sql
    SELECT json_extract_string('{"id": null, "name": "doris"}','$.id');
    ```
    ```text
    +-------------------------------------------------------------+
    | json_extract_string('{"id": null, "name": "doris"}','$.id') |
    +-------------------------------------------------------------+
    | null                                                        |
    +-------------------------------------------------------------+
    ```