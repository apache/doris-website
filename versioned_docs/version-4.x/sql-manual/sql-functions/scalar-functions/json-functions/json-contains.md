---
{
"title": "JSON_CONTAINS",
"language": "en"
}
---

## Description

Used to determine whether a JSON document contains a specified JSON element. If the specified element exists in the JSON document, it returns 1, otherwise it returns 0. If the JSON document or the queried element is invalid, it returns `NULL`.

## Syntax

```sql
JSON_CONTAINS(<json_object>, <candidate>[, <json_path>])
```

## Parameters
### Required Parameters
- `<json_object>` JSON type, check whether `<candidate>` exists in it.
- `<candidate>` JSON type, the candidate value to be determined.
### Optional Parameters
- `<json_path>` String type, the search starting path. If not provided, it starts from root by default.

## Return Value
- Null: If any of the three parameters is NULL, returns NULL
- True: If `<json_object>` contains `<candidate>`, returns True.
- False: If `<json_object>` does not contain `<candidate>`, returns False.
- If `<json_object>` or `<candidate>` is not a JSON type, an error is reported.

## Examples 
1. Example 1
    ```sql
    SET @j = '{"a": 1, "b": 2, "c": {"d": 4}}';
    SET @j2 = '1';
    SELECT JSON_CONTAINS(@j, @j2, '$.a');
    ```
    ```text
    +-------------------------------+
    | JSON_CONTAINS(@j, @j2, '$.a') |
    +-------------------------------+
    |                             1 |
    +-------------------------------+
    ```
    ```sql
    SELECT JSON_CONTAINS(@j, @j2, '$.b');
    ```
    ```text
    +-------------------------------+
    | JSON_CONTAINS(@j, @j2, '$.b') |
    +-------------------------------+
    |                             0 |
    +-------------------------------+
    ```
    ```sql
    SELECT JSON_CONTAINS(@j, '{"a": 1}');
    ```
    ```text
    +-------------------------------+
    | JSON_CONTAINS(@j, '{"a": 1}') |
    +-------------------------------+
    |                             1 |
    +-------------------------------+
    ```
2. NULL parameters
    ```sql
    SELECT JSON_CONTAINS(NULL, '{"a": 1}');
    ```
    ```text
    +---------------------------------+
    | JSON_CONTAINS(NULL, '{"a": 1}') |
    +---------------------------------+
    |                            NULL |
    +---------------------------------+
    ```
    ```sql
    SELECT JSON_CONTAINS('{"a": 1}', NULL);
    ```
    ```text
    +---------------------------------+
    | JSON_CONTAINS('{"a": 1}', NULL) |
    +---------------------------------+
    |                            NULL |
    +---------------------------------+
    ```
    ```sql
    SELECT JSON_CONTAINS('{"a": 1}', '{"a": 1}', NULL);
    ```
    ```text
    +---------------------------------------------+
    | JSON_CONTAINS('{"a": 1}', '{"a": 1}', NULL) |
    +---------------------------------------------+
    |                                        NULL |
    +---------------------------------------------+
    ```