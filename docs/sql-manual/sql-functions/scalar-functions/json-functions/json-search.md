---
{
    "title": "JSON_SEARCH",
    "language": "en"
}
---

## Description

The `JSON_SEARCH` function is used to search for specified values in a JSON document. If the value is found, it returns the path to the value. If the value is not found, it returns NULL. This function can recursively search within JSON data structures.

## Syntax

```sql
JSON_SEARCH( <json_object>, <one_or_all>, <search_value> )
```
## Parameters
- `<json_object>`: JSON type, the JSON document to be searched.
- `<one_or_all>`: String type, specifies whether to find all matching values. Can be 'one' or 'all'.
- `<search_value>`: String type, the value to search for, the search target.

## Return Value
Nullable(JSON): Depending on the `<one_or_all>` parameter, there are two cases:

    1. 'one': If a matching value is found, returns a JSON path pointing to the matching value. If no matching value is found, returns NULL.
    2. 'all': Returns paths to all matching values. If there are multiple values, returns them as a JSON array. If no matches are found, returns NULL.

## Notes
- The `one_or_all` parameter determines whether to find all matching values. 'one' returns the first matching path, 'all' returns all matching paths. If it's any other value, an error will be reported.
- If no matching value is found, the function returns NULL.
- If any of `<json_object>`, `<one_or_all>`, `<search_value>` is NULL, returns NULL.

## Examples

1. Search for a single value (one)
    ```sql
    SELECT JSON_SEARCH('{"name": "John", "age": 30}', 'one', 'John');
    ```
    ```text
    +-----------------------------------------------------------+
    | JSON_SEARCH('{"name": "John", "age": 30}', 'one', 'John') |
    +-----------------------------------------------------------+
    | "$.name"                                                  |
    +-----------------------------------------------------------+

    ```
2. Search for a single value (one), returns only one path even if there are multiple matches
    ```sql
    SELECT JSON_SEARCH('{"name": "John", "age": 30, "alias": "John"}', 'one', 'John');
    ```
    ```text
    +----------------------------------------------------------------------------+
    | JSON_SEARCH('{"name": "John", "age": 30, "alias": "John"}', 'one', 'John') |
    +----------------------------------------------------------------------------+
    | "$.name"                                                                   |
    +----------------------------------------------------------------------------+
    ```
3. Search for all matching values (all)
    ```sql
    SELECT JSON_SEARCH('{"name": "John", "age": 30, "alias": "John"}', 'all', 'John');
    ```
    ```text
    +----------------------------------------------------------------------------+
    | JSON_SEARCH('{"name": "John", "age": 30, "alias": "John"}', 'all', 'John') |
    +----------------------------------------------------------------------------+
    | ["$.alias","$.name"]                                                       |
    +----------------------------------------------------------------------------+
    ```
4. No matching value found

    ```sql
    SELECT JSON_SEARCH('{"name": "John", "age": 30}', 'one', 'Alice');
    ```
    ```text
    +------------------------------------------------------------+
    | JSON_SEARCH('{"name": "John", "age": 30}', 'one', 'Alice') |
    +------------------------------------------------------------+
    | NULL                                                       |
    +------------------------------------------------------------+
    ```

5. NULL parameters
    ```sql
    SELECT JSON_SEARCH('{"name": "John", "age": 30}', NULL, 'Alice');
    ```
    ```text
    +-----------------------------------------------------------+
    | JSON_SEARCH('{"name": "John", "age": 30}', NULL, 'Alice') |
    +-----------------------------------------------------------+
    | NULL                                                      |
    +-----------------------------------------------------------+
    ```
    ```sql
    SELECT JSON_SEARCH('{"name": "John", "age": 30}', 'one', NULL);
    ```
    ```text
    +---------------------------------------------------------+
    | JSON_SEARCH('{"name": "John", "age": 30}', 'one', NULL) |
    +---------------------------------------------------------+
    | NULL                                                    |
    +---------------------------------------------------------+
    ```
    ```sql
    SELECT JSON_SEARCH(NULL, 'one', 'Alice');
    ```
    ```
    +-----------------------------------+
    | JSON_SEARCH(NULL, 'one', 'Alice') |
    +-----------------------------------+
    | NULL                              |
    +-----------------------------------+
    ```
6. Invalid `<one_or_all>` parameter
    ```sql
    SELECT JSON_SEARCH('{"name": "John", "age": 30}', 'three', 'Alice');
    ```
    ```text
    ERROR 1105 (HY000): errCode = 2, detailMessage = [INVALID_ARGUMENT]the one_or_all argument three is not 'one' not 'all'
    ```