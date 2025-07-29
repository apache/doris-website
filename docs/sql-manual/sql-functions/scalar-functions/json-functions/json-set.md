---
{
    "title": "JSON_SET",
    "language": "en"
}
---

## Description
The `JSON_SET` function is used to insert or replace data in JSON and return the result.

## Syntax
```sql
JSON_SET (<json_object>, <path>,  <value>[, <path>,  <value>, ...])
```

## Parameters
- `<json_object>`: JSON type expression, the target to be modified.
- `<path>`: String type expression, specifies the path where the value is to be inserted
- `<value>`: JSON type or other types supported by [`TO_JSON`](./to-json.md), the value to be inserted.

## Return Value
- Nullable(JSON) Returns the modified JSON object

## Usage Notes
1. When the object pointed to by `<path>` exists, its behavior is consistent with [`JSON_REPLACE`](./json-replace.md), otherwise its behavior is consistent with [`JSON_INSERT`](./json-insert.md)

## Examples
1. Path does not exist
    ```sql
    select json_set('{}', '$.k', json_parse('{}'), '$.k.k2', 123);
    ```
    ```text
    +--------------------------------------------------------+
    | json_set('{}', '$.k', json_parse('{}'), '$.k.k2', 123) |
    +--------------------------------------------------------+
    | {"k":{"k2":123}}                                       |
    +--------------------------------------------------------+
    ```
2. Value pointed to by `<path>` already exists in the JSON object
    ```sql
    select json_set('{"k": 1}', "$.k", 2);
    ```
    ```text
    +--------------------------------+
    | json_set('{"k": 1}', "$.k", 2) |
    +--------------------------------+
    | {"k":2}                        |
    +--------------------------------+
    ```
3. NULL parameters
    ```sql
    select json_set(NULL, '$[1]', 123);
    ```
    ```text
    +-----------------------------+
    | json_set(NULL, '$[1]', 123) |
    +-----------------------------+
    | NULL                        |
    +-----------------------------+
    ```
    ```sql
    select json_set('{"k": "v"}', NULL, 123);
    ```
    ```text
    +-----------------------------------+
    | json_set('{"k": "v"}', NULL, 123) |
    +-----------------------------------+
    | NULL                              |
    +-----------------------------------+
    ```
    ```sql
    select json_set('{"k": "v"}', '$.k[1]', NULL);
    ```
    ```text
    +----------------------------------------+
    | json_set('{"k": "v"}', '$.k[1]', NULL) |
    +----------------------------------------+
    | {"k":["v",null]}                       |
    +----------------------------------------+
    ```