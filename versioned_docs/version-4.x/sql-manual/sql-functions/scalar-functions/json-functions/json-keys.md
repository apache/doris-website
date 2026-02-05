---
{
    "title": "JSON_KEYS",
    "language": "en",
    "description": "Returns all keys of a JSON object in array form. By default, it returns the keys of the root object,"
}
---

## Description
Returns all keys of a JSON object in array form. By default, it returns the keys of the root object, but you can also control which specific path's object keys to return through parameters.

## Syntax

```sql
JSON_KEYS(<json_object>[, <path>])
```

## Parameters
### Required Parameters
- `<json_object>` JSON type, the JSON object from which keys need to be extracted.


### Optional Parameters
- `<path>` String type, optional JSON path that specifies the JSON subdocument to check. If not provided, defaults to the root document.

## Return Value
- Array<String> Returns an array of strings, where the array members are all the keys of the JSON object.

## Notes
- Returns NULL when `<json_object>` or `<path>` is NULL.
- Returns NULL if it's not a JSON object (e.g., if it's a JSON array).
- Returns NULL if the object pointed to by `<path>` does not exist.

## Examples
1. Example 1
    ```sql
    SELECT JSON_KEYS('{"a": 1, "b": {"c": 30}}');
    ```
    ```text
    +---------------------------------------+
    | JSON_KEYS('{"a": 1, "b": {"c": 30}}') |
    +---------------------------------------+
    | ["a", "b"]                            |
    +---------------------------------------+
    ```
    ```sql
    SELECT JSON_KEYS('{}');
    ```
    ```text
    +-----------------+
    | JSON_KEYS('{}') |
    +-----------------+
    | []              |
    +-----------------+
    ```

2. Specify path
    ```sql
    SELECT JSON_KEYS('{"a": 1, "b": {"c": 30}}', '$.b');
    ```
    ```text
    +----------------------------------------------+
    | JSON_KEYS('{"a": 1, "b": {"c": 30}}', '$.b') |
    +----------------------------------------------+
    | ["c"]                                        |
    +----------------------------------------------+
    ```
3. NULL parameters
    ```sql
    SELECT JSON_KEYS('{"a": 1, "b": {"c": 30}}', NULL);
    ```
    ```text
    +---------------------------------------------+
    | JSON_KEYS('{"a": 1, "b": {"c": 30}}', NULL) |
    +---------------------------------------------+
    | NULL                                        |
    +---------------------------------------------+
    ```
    ```sql
    SELECT JSON_KEYS(NULL);
    ```
    ```text
    +-----------------+
    | JSON_KEYS(NULL) |
    +-----------------+
    | NULL            |
    +-----------------+
    ```
4. Not a JSON object
    ```sql
    SELECT JSON_KEYS('[1,2]');
    ```
    ```text
    +--------------------+
    | JSON_KEYS('[1,2]') |
    +--------------------+
    | NULL               |
    +--------------------+
    ```
    ```sql
    SELECT JSON_KEYS('{"k": [1, 2, 3]}', '$.k');
    ```
    ```text
    +--------------------------------------+
    | JSON_KEYS('{"k": [1, 2, 3]}', '$.k') |
    +--------------------------------------+
    | NULL                                 |
    +--------------------------------------+
    ```
5. Object specified by path does not exist
    ```sql
    SELECT JSON_KEYS('{"a": 1, "b": {"c": 30}}', '$.c');
    ```
    ```text
    +----------------------------------------------+
    | JSON_KEYS('{"a": 1, "b": {"c": 30}}', '$.c') |
    +----------------------------------------------+
    | NULL                                         |
    +----------------------------------------------+
    ```