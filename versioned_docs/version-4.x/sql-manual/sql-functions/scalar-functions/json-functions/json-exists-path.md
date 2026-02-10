---
{
    "title": "JSON_EXISTS_PATH",
    "language": "en",
    "description": "Used to determine whether the field specified by <path> exists in JSON data. Returns TRUE if it exists, FALSE if it does not exist."
}
---

## Description

Used to determine whether the field specified by `<path>` exists in JSON data. Returns TRUE if it exists, FALSE if it does not exist.

## Syntax

```sql
JSON_EXISTS_PATH (<json_object>, <path>)
```

## Parameters
- `<json_object>` JSON type, determine whether the path specified by `<path>` exists in it.
- `<path>` String type, specifies the path.

## Return Value
- BOOL type, returns TRUE if it exists, FALSE if it does not exist
- NULL: If either `<json_object>` or `<path>` is NULL, returns NULL.

## Examples
1. Example 1
    ```sql
    SELECT JSON_EXISTS_PATH('{"id": 123, "name": "doris"}', '$.name');
    ```
    ```text
    +------------------------------------------------------------+
    | JSON_EXISTS_PATH('{"id": 123, "name": "doris"}', '$.name') |
    +------------------------------------------------------------+
    |                                                          1 |
    +------------------------------------------------------------+
    ```
2. Example 2
    ```sql
    SELECT JSON_EXISTS_PATH('{"id": 123, "name": "doris"}', '$.age');
    ```
    ```text
    +-----------------------------------------------------------+
    | JSON_EXISTS_PATH('{"id": 123, "name": "doris"}', '$.age') |
    +-----------------------------------------------------------+
    |                                                         0 |
    +-----------------------------------------------------------+
    ```
3. NULL parameters
    ```sql
    SELECT JSON_EXISTS_PATH('{"id": 123, "name": "doris"}', NULL);
    ```
    ```text
    +--------------------------------------------------------+
    | JSON_EXISTS_PATH('{"id": 123, "name": "doris"}', NULL) |
    +--------------------------------------------------------+
    |                                                   NULL |
    +--------------------------------------------------------+
    ```
    ```sql
    SELECT JSON_EXISTS_PATH(NULL, '$.age');
    ```
    ```text
    +---------------------------------+
    | JSON_EXISTS_PATH(NULL, '$.age') |
    +---------------------------------+
    |                            NULL |
    +---------------------------------+
    ```

