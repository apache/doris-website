---
{
"title": "JSON_LENGTH",
"language": "en"
}
---

## Description
The `JSON_LENGTH` function is used to return the length or number of elements in a given JSON document. If the JSON document is an array, it returns the number of elements in the array; if the JSON document is an object, it returns the number of key-value pairs in the object. If the JSON document is invalid, it returns `NULL`.

## Syntax

```sql
JSON_LENGTH(<json_object> [, <path>])
```

## Parameters
### Required Parameters
- `<json_object>` JSON type, the JSON document whose length is to be returned.

### Optional Parameters
- `<path>` String type, used to return the length of a specific object in the document.

## Notes
This function calculates the length of a JSON document according to the following rules:
- The length of a scalar is 1. For example: '1', '"x"', 'true', 'false', 'null' all have a length of 1.
- The length of an array is the number of array elements. For example: '[1, 2]' has a length of 2.
- The length of an object is the number of object members. For example: '{"x": 1, "y": [1, 2, 3]}' has a length of 2.

## Return Value
- For JSON arrays, returns the number of elements in the array.
- For JSON objects, returns the number of key-value pairs in the object.
- For JSON scalar types (such as strings, numbers, booleans, null, etc.), returns 1.
- For invalid JSON strings, returns NULL.

## Examples
1. Example 1
    ```sql
    SELECT json_length('{"k1":"v31","k2":300}');
    ```
    ```text
    +--------------------------------------+
    | json_length('{"k1":"v31","k2":300}') |
    +--------------------------------------+
    |                                    2 |
    +--------------------------------------+
    ```
    ```sql
    SELECT json_length('[1, 2, 3, 4, 5, 6]');
    ```
    ```text
    +-----------------------------------+
    | json_length('[1, 2, 3, 4, 5, 6]') |
    +-----------------------------------+
    |                                 6 |
    +-----------------------------------+
    ```
2. Length of scalar types
    ```sql
    SELECT json_length('"abc"');
    ```
    ```text
    +----------------------+
    | json_length('"abc"') |
    +----------------------+
    |                    1 |
    +----------------------+
    ```
    ```sql
    SELECT json_length('123');
    ```
    ```text
    +--------------------+
    | json_length('123') |
    +--------------------+
    |                  1 |
    +--------------------+
    ```
    ```sql
    SELECT json_length('{"k": null}');
    ```
    ```text
    +----------------------------+
    | json_length('{"k": null}') |
    +----------------------------+
    |                          1 |
    +----------------------------+
    ```
3. Specify path
    ```sql
    SELECT json_length('{"x": 1, "y": [1, 2]}', '$.y');
    ```
    ```text
    +---------------------------------------------+
    | json_length('{"x": 1, "y": [1, 2]}', '$.y') |
    +---------------------------------------------+
    |                                           2 |
    +---------------------------------------------+
    ```
4. NULL parameters
    ```sql
    SELECT json_length('{"x": 1, "y": [1, 2]}', NULL);
    ```
    ```text
    +--------------------------------------------+
    | json_length('{"x": 1, "y": [1, 2]}', NULL) |
    +--------------------------------------------+
    |                                       NULL |
    +--------------------------------------------+
    ```
    ```sql
    SELECT json_length(NULL, '$.y');
    ```
    ```text
    +--------------------------+
    | json_length(NULL, '$.y') |
    +--------------------------+
    |                     NULL |
    +--------------------------+
    ```