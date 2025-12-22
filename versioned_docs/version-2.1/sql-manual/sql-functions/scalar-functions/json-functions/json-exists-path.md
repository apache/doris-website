---
{
    "title": "JSON_EXISTS_PATH",
    "language": "en",
    "description": "It is used to judge whether the field specified by jsonpath exists in the JSON data. If it exists, it returns TRUE, and if it does not exist,"
}
---

## Description

It is used to judge whether the field specified by json_path exists in the JSON data. If it exists, it returns TRUE, and if it does not exist, it returns FALSE

## Syntax

```sql
JSON_EXISTS_PATH (<json_str>,  <path>)
```

## Alias

* JSONB_EXISTS_PATH


## Parameters
| Parameter           | Description                                                     |
|--------------|--------------------------------------------------------|
| `<json_str>` | The element to be included in the JSON array. It can be a value of any type, including NULL. If no element is specified, an empty array is returned.
| `<path>`     | The JSON path to be judged. If it is NULL, then return NULL.                      |

## Return Values
If it exists, return TRUE; if it does not exist, return FALSE.

## Examples

```sql
SELECT JSON_EXISTS_PATH('{"id": 123, "name": "doris"}', '$.name');
```
```text
+---------------------------------------------------------------------------+
| jsonb_exists_path(cast('{"id": 123, "name": "doris"}' as JSON), '$.name') |
+---------------------------------------------------------------------------+
|                                                                         1 |
+---------------------------------------------------------------------------+
```
```sql
SELECT JSON_EXISTS_PATH('{"id": 123, "name": "doris"}', '$.age');
```
```text
+--------------------------------------------------------------------------+
| jsonb_exists_path(cast('{"id": 123, "name": "doris"}' as JSON), '$.age') |
+--------------------------------------------------------------------------+
|                                                                        0 |
+--------------------------------------------------------------------------+
```
```sql
SELECT JSONB_EXISTS_PATH('{"id": 123, "name": "doris"}', '$.age');
```
```text
+--------------------------------------------------------------------------+
| jsonb_exists_path(cast('{"id": 123, "name": "doris"}' as JSON), '$.age') |
+--------------------------------------------------------------------------+
|                                                                        0 |
+--------------------------------------------------------------------------+
```

