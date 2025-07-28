---
{
    "title": "JSON_INSERT",
    "language": "en"
}
---

## Description
The `JSON_INSERT` function is used to insert data into JSON and return the result.

## Syntax
```sql
JSON_INSERT (<json_object>, <path>,  <value>[, <path>,  <value>, ...])
```

## Parameters
- `<json_object>`: JSON type expression, the target to be modified.
- `<path>`: String type expression, specifies the path where the value is to be inserted
- `<value>`: JSON type or other types supported by [`TO_JSON`](./to-json.md), the value to be inserted.

## Return Value
- `Nullable(JSON)` Returns the modified JSON object

## Usage Notes
1. Note that path-value pairs are evaluated from left to right.
2. If the value pointed to by `<path>` already exists in the JSON object, it will have no effect.
3. `<path>` cannot contain wildcards, if it contains wildcards an error will be reported.
4. If `<path>` contains multiple levels of paths, all paths except the last level must exist in the JSON object.
5. If `<path>` points to an array member element, but the object is not actually an array, then the object will be converted to the first member of the array, and then processed as a normal array.
6. When `<json_object>` or `<path>` is NULL, NULL will be returned. If `<value>` is NULL, a JSON null value will be inserted.

## Examples
1. Path-value pairs are evaluated from left to right
    ```sql
    select json_insert('{}', '$.k', json_parse('{}'), '$.k.k2', 123);
    ```
    ```text
    +-----------------------------------------------------------+
    | json_insert('{}', '$.k', json_parse('{}'), '$.k.k2', 123) |
    +-----------------------------------------------------------+
    | {"k":{"k2":123}}                                          |
    +-----------------------------------------------------------+
    ```
2. Value pointed to by `<path>` already exists in the JSON object
    ```sql
    select json_insert('{"k": 1}', "$.k", 2);
    ```
    ```text
    +-----------------------------------+
    | json_insert('{"k": 1}', "$.k", 2) |
    +-----------------------------------+
    | {"k":1}                           |
    +-----------------------------------+
    ```
3. `<path>` cannot contain wildcards
    ```sql
    select json_insert('{"k": 1}', "$.*", 2);
    ```
    ```text
    ERROR 1105 (HY000): errCode = 2, detailMessage = [INVALID_ARGUMENT] In this situation, path expressions may not contain the * and ** tokens or an array range, argument index: 1, row index: 0
    ```
4. Cannot create multi-level paths
    ```sql
    select json_insert('{}', '$.k1.k2.k3', 123);
    ```
    ```text
    +--------------------------------------+
    | json_insert('{}', '$.k1.k2.k3', 123) |
    +--------------------------------------+
    | {}                                   |
    +--------------------------------------+
    ```
5. Automatic conversion to array
    ```sql
    select json_insert('{"k": "v"}', '$[1]', 123);
    ```
    ```text
    +----------------------------------------+
    | json_insert('{"k": "v"}', '$[1]', 123) |
    +----------------------------------------+
    | [{"k": "v"}, 123]                      |
    +----------------------------------------+
    ```
    ```sql
    select json_insert('{"k": "v"}', '$.k[1]', 123);
    ```
    ```text
    +------------------------------------------+
    | json_insert('{"k": "v"}', '$.k[1]', 123) |
    +------------------------------------------+
    | {"k": ["v", 123]}                        |
    +------------------------------------------+
    ```
6. NULL parameters
    ```sql
    select json_insert(NULL, '$[1]', 123);
    ```
    ```text
    +--------------------------------+
    | json_insert(NULL, '$[1]', 123) |
    +--------------------------------+
    | NULL                           |
    +--------------------------------+
    ```
    ```sql
    select json_insert('{"k": "v"}', NULL, 123);
    ```
    ```text
    +--------------------------------------+
    | json_insert('{"k": "v"}', NULL, 123) |
    +--------------------------------------+
    | NULL                                 |
    +--------------------------------------+
    ```
    ```sql
    select json_insert('{"k": "v"}', '$.k[1]', NULL);
    ```
    ```text
    +-------------------------------------------+
    | json_insert('{"k": "v"}', '$.k[1]', NULL) |
    +-------------------------------------------+
    | {"k": ["v", null]}                        |
    +-------------------------------------------+
    ```