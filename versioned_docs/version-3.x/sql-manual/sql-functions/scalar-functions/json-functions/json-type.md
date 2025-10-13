---
{
    "title": "JSON_TYPE",
    "language": "en"
}
---

## Description

Used to determine the type of the field specified by `json_path` in the JSONB data. If the field does not exist, it returns NULL. If the field exists, it returns one of the following types:

- object
- array
- null
- bool
- int
- bigint
- largeint
- double
- string

## Syntax

```sql
JSON_TYPE( <json>, <json_path> )
```

## Alias
- `JSONB_TYPE`

## Parameters

- `<json>` The JSON string to check the type of.
- `<json_path>` String type, which specifies the location of the field in JSON. The path is usually given in $. At the beginning, use. to represent the hierarchical structure.

## Return Value

`Nullable<String>`: Returns the type of the corresponding field.

## Usage Notes
- If `<json_object>` or `<json_path>` is NULL, returns NULL.
- If `<json_path>` is not a valid path, the function reports an error.
- If the field specified by `<json_path>` does not exist, returns NULL.

## Examples
1. JSON is of string type:
    ```sql
    SELECT JSON_TYPE('{"name": "John", "age": 30}', '$.name');
    ```
    ```text
    +-------------------------------------------------------------------+
    | jsonb_type(cast('{"name": "John", "age": 30}' as JSON), '$.name') |
    +-------------------------------------------------------------------+
    | string                                                            |
    +-------------------------------------------------------------------+
    ```

2. JSON is of number type:
    ```sql
    SELECT JSON_TYPE('{"name": "John", "age": 30}', '$.age');
    ```
    ```text
    +------------------------------------------------------------------+
    | jsonb_type(cast('{"name": "John", "age": 30}' as JSON), '$.age') |
    +------------------------------------------------------------------+
    | int                                                              |
    +------------------------------------------------------------------+
    ```
3. NULL parameters
    ```sql
    select json_type(NULL, '$.key1');
    ```
    ```text
    +---------------------------+
    | json_type(NULL, '$.key1') |
    +---------------------------+
    | NULL                      |
    +---------------------------+
    ```
4. NULL parameters 2
    ```sql
    select json_type('{"key1": true}', NULL);
    ```
    ```text
    +-----------------------------------+
    | json_type('{"key1": true}', NULL) |
    +-----------------------------------+
    | NULL                              |
    +-----------------------------------+
    ```
5. Field specified by `json_path` parameter does not exist
    ```sql
    select json_type('{"key1": true}', '$.key2');
    ```
    ```text
    +---------------------------------------+
    | json_type('{"key1": true}', '$.key2') |
    +---------------------------------------+
    | NULL                                  |
    +---------------------------------------+
    ```
6. Invalid `json_path` parameter
    ```sql
    select json_type('{"key1": true}', '$.');
    ```
    ```text
    ERROR 1105 (HY000): errCode = 2, detailMessage = [INVALID_ARGUMENT]Json path error: Invalid Json Path for value: $.
    ```