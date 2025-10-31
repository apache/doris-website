---
{
    "title": "JSON_REPLACE",
    "language": "en"
}
---

## Description
The `JSON_REPLACE` function is used to replace data in JSON and return the result.

## Syntax
```sql
JSON_REPLACE (<json_object>, <path>,  <value>[, <path>,  <value>, ...])
```

## Parameters
- `<json_object>`: JSON type expression, the target to be modified.
- `<path>`: String type expression, specifies the path where the value is to be replaced
- `<value>`: JSON type or other types supported by [`TO_JSON`](./to-json.md), the value to be replaced.

## Return Value
- Nullable(JSON) Returns the modified JSON object

## Usage Notes
1. Note that path-value pairs are evaluated from left to right.
2. If the value pointed to by `<path>` does not exist in the JSON object, it will have no effect.
3. `<path>` cannot contain wildcards, if it contains wildcards an error will be reported.
4. When `<json_object>` or `<path>` is NULL, NULL will be returned. If `<value>` is NULL, a JSON null value will be inserted.

## Examples
1. Path-value pairs are evaluated from left to right
    ```sql
    select json_replace('{"k": {"k2": "v2"}}', '$.k', json_parse('{"k2": 321, "k3": 456}'), '$.k.k2', 123);
    ```
    ```text
    +-------------------------------------------------------------------------------------------------+
    | json_replace('{"k": {"k2": "v2"}}', '$.k', json_parse('{"k2": 321, "k3": 456}'), '$.k.k2', 123) |
    +-------------------------------------------------------------------------------------------------+
    | {"k":{"k2":123,"k3":456}}                                                                       |
    +-------------------------------------------------------------------------------------------------+
    ```
2. Value pointed to by `<path>` does not exist in the JSON object
    ```sql
    select json_replace('{"k": 1}', "$.k2", 2);
    ```
    ```text
    +-------------------------------------+
    | json_replace('{"k": 1}', "$.k2", 2) |
    +-------------------------------------+
    | {"k":1}                             |
    +-------------------------------------+
    ```
3. `<path>` cannot contain wildcards
    ```sql
    select json_replace('{"k": 1}', "$.*", 2);
    ```
    ```text
    ERROR 1105 (HY000): errCode = 2, detailMessage = [INVALID_ARGUMENT] In this situation, path expressions may not contain the * and ** tokens or an array range, argument index: 1, row index: 0
    ```
4. NULL parameters
    ```sql
    select json_replace(NULL, '$[1]', 123);
    ```
    ```text
    +---------------------------------+
    | json_replace(NULL, '$[1]', 123) |
    +---------------------------------+
    | NULL                            |
    +---------------------------------+
    ```
    ```sql
    select json_replace('{"k": "v"}', NULL, 123);
    ```
    ```text
    +---------------------------------------+
    | json_replace('{"k": "v"}', NULL, 123) |
    +---------------------------------------+
    | NULL                                  |
    +---------------------------------------+
    ```
    ```sql
    select json_replace('{"k": "v"}', '$.k', NULL);
    ```
    ```text
    +-----------------------------------------+
    | json_replace('{"k": "v"}', '$.k', NULL) |
    +-----------------------------------------+
    | {"k":null}                              |
    +-----------------------------------------+
    ```