---
{
    "title": "JSON_EXTRACT",
    "language": "en"
}
---

## Description
Extract the field specified by json_path from JSON type data.

## Syntax
```sql
JSON_EXTRACT (<json_object>, <path>[, <path2>, ...])
```
## Parameters
### Required Parameters:
- `<json_object>`: The JSON type expression to extract from.
- `<path>`: The JSON path to extract the target element from the target JSON.
### Optional/Variable Parameters
- `<path2>` Multiple path values can be extracted from the JSON object.

## Return Value
- `Nullable(JSON)`: Returns the JSON element pointed to by `<path>`. If multiple results are matched, they will be returned as a JSON array.

## Usage Notes
- If `<json_object>` is NULL, or `<path>` is NULL, returns NULL.
- For single `<path>` parameter cases, if the `<path>` does not exist, returns NULL.
- For multiple `<path>` parameter cases, non-existent paths are ignored, and matched elements are returned as a JSON array. If no matches are found, returns NULL.
- If `<path>` is not a valid path, an error is reported.
- If the value corresponding to `<path>` is a string, the returned string will be surrounded by double quotes (`"`). To get results without double quotes, please use the function [`JSON_UNQUOTE`](./json-unquote.md).
- The syntax of `<path>` is as follows:
    * `$` represents the json root
    * `.k1` represents the element with key `k1` in the json object
        * If the key value contains ".", `<path>` needs to use double quotes, for example `SELECT json_extract('{"k1.a":"abc","k2":300}', '$."k1.a"')`;
    * `[i]` represents the element at index i in the json array
        * To get the last element of json_array, you can use `$[last]`, the second to last element can use `$[last-1]`, and so on.
    * `*` represents a wildcard, where `$.*` represents all members of the root object, and `$[*]` represents all elements of the array.
    * `**` is used in combination with '$', '$**' represents all paths (including multi-level subpaths).
- If `<path>` contains wildcards (`*`), the matching results will be returned in array form.

## Examples
1. General parameters
  ```sql
  SELECT JSON_EXTRACT('{"k1":"v31","k2":300}', '$.k1');
  ```
  ```
  +-----------------------------------------------+
  | JSON_EXTRACT('{"k1":"v31","k2":300}', '$.k1') |
  +-----------------------------------------------+
  | "v31"                                         |
  +-----------------------------------------------+
  ```
> Note: The returned result is `"v31"` not `v31`.
2. NULL parameters
    ```sql
    select JSON_EXTRACT(null, '$.k1');
    ```
    ```
    +----------------------------+
    | JSON_EXTRACT(null, '$.k1') |
    +----------------------------+
    | NULL                       |
    +----------------------------+
    ```
3. `<path>` is NULL
    ```sql
    SELECT JSON_EXTRACT('{"k1":"v31","k2":300}', NULL);
    ```
    ```
    +---------------------------------------------+
    | JSON_EXTRACT('{"k1":"v31","k2":300}', NULL) |
    +---------------------------------------------+
    | NULL                                        |
    +---------------------------------------------+
    ```
4. Multi-level path
    ```sql
    SELECT JSON_EXTRACT('{"k1":"v31","k2":{"sub_key": 1234.56}}', '$.k2.sub_key');
    ```
    ```
    +------------------------------------------------------------------------+
    | JSON_EXTRACT('{"k1":"v31","k2":{"sub_key": 1234.56}}', '$.k2.sub_key') |
    +------------------------------------------------------------------------+
    | 1234.56                                                                |
    +------------------------------------------------------------------------+
    ```
5. Array path
    ```sql
    SELECT JSON_EXTRACT(json_array("abc", 123, cast(now() as string)), '$[2]');
    ```
    ```
    +----------------------------------------------------------------------+
    | JSON_EXTRACT(json_array("abc", 123, cast(now() as string)), '$.[2]') |
    +----------------------------------------------------------------------+
    | "2025-07-16 18:35:25"                                                |
    +----------------------------------------------------------------------+
    ```
6. Non-existent path
    ```sql
    SELECT JSON_EXTRACT('{"k1":"v31","k2":300}', '$.k3');
    ```
    ```
    +-----------------------------------------------+
    | JSON_EXTRACT('{"k1":"v31","k2":300}', '$.k3') |
    +-----------------------------------------------+
    | NULL                                          |
    +-----------------------------------------------+
    ```
7. Multiple path parameters
    ```sql
    select JSON_EXTRACT('{"id": 123, "name": "doris"}', '$.name', '$.id', '$.not_exists');
    ```
    ```
    +--------------------------------------------------------------------------------+
    | JSON_EXTRACT('{"id": 123, "name": "doris"}', '$.name', '$.id', '$.not_exists') |
    +--------------------------------------------------------------------------------+
    | ["doris",123]                                                                  |
    +--------------------------------------------------------------------------------+
    ```
    > Even if there is only one match, it will be returned in array form
    ```sql
    select JSON_EXTRACT('{"id": 123, "name": "doris"}', '$.name', '$.id2', '$.not_exists');
    ```
    ```
    +---------------------------------------------------------------------------------+
    | JSON_EXTRACT('{"id": 123, "name": "doris"}', '$.name', '$.id2', '$.not_exists') |
    +---------------------------------------------------------------------------------+
    | ["doris"]                                                                       |
    +---------------------------------------------------------------------------------+
    ```
    > If all paths have no matches, return NULL
    ```sql
    select JSON_EXTRACT('{"id": 123, "name": "doris"}', '$.k1', '$.k2', '$.not_exists');
    ```
    ```
    +------------------------------------------------------------------------------+
    | JSON_EXTRACT('{"id": 123, "name": "doris"}', '$.k1', '$.k2', '$.not_exists') |
    +------------------------------------------------------------------------------+
    | NULL                                                                         |
    +------------------------------------------------------------------------------+
    ```

8. Wildcard path
    ```sql
    select json_extract('{"k": [1,2,3,4,5]}', '$.k[*]');
    ```
    ```
    +----------------------------------------------+
    | json_extract('{"k": [1,2,3,4,5]}', '$.k[*]') |
    +----------------------------------------------+
    | [1,2,3,4,5]                                  |
    +----------------------------------------------+
    ```
    ```sql
    select json_extract('{"k": [1,2,3,4,5], "k2": "abc", "k3": {"k4": "v4"}}', '$.*', '$.k3.k4');
    ```
    ```
    +---------------------------------------------------------------------------------------+
    | json_extract('{"k": [1,2,3,4,5], "k2": "abc", "k3": {"k4": "v4"}}', '$.*', '$.k3.k4') |
    +---------------------------------------------------------------------------------------+
    | [[1,2,3,4,5],"abc",{"k4":"v4"},"v4"]                                                  |
    +---------------------------------------------------------------------------------------+
    ```
9. '**' in path
    ```sql
    select json_extract('{"k": 123, "b": {"k": ["ab", "cd"]}}', '$**.k');
    ```
    ```text
    +---------------------------------------------------------------+
    | json_extract('{"k": 123, "b": {"k": ["ab", "cd"]}}', '$**.k') |
    +---------------------------------------------------------------+
    | [123,["ab","cd"]]                                             |
    +---------------------------------------------------------------+
    ```

10. Value is NULL case
    ```sql
    select JSON_EXTRACT('{"id": 123, "name": null}', '$.name') v, JSON_EXTRACT('{"id": 123, "name": null}', '$.name') is null v2;
    ```
    ```
    +------+------+
    | v    | v2   |
    +------+------+
    | null |    0 |
    +------+------+
    ```
11. Get all values of the specified key in the array
    ```sql
    SELECT JSON_EXTRACT('[{"k1":"v1"}, {"k2":"v2"}, {"k1":"v3"}, {"k1":"v4"}]', '$.k1');
    ```
    ```text
    +------------------------------------------------------------------------------+
    | JSON_EXTRACT('[{"k1":"v1"}, {"k2":"v2"}, {"k1":"v3"}, {"k1":"v4"}]', '$.k1') |
    +------------------------------------------------------------------------------+
    | ["v1","v3","v4"]                                                             |
    +------------------------------------------------------------------------------+
    ```