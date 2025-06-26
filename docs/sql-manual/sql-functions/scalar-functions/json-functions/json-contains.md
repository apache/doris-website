---
{
"title": "JSON_CONTAINS",
"language": "en"
}
---

## Description

This function is used to check whether a JSON document contains a specified JSON element. If the specified element exists in the JSON document, it returns 1; otherwise, it returns 0. If the JSON document or the queried element is invalid, it returns `NULL`.

## Syntax

`JSON_CONTAINS(<json_str>,  <candidate> [,  <json_path>])`

## Required Parameters

| Parameter   | Description                                         |
|-------------|-----------------------------------------------------|
| `<json_str>` | The JSON string to be checked.                      |
| `<candidate>` | The JSON element to check for inclusion.            |

## Optional Parameters

| Parameter   | Description                                         |
|-------------|-----------------------------------------------------|
| `<json_path>` | An optional JSON path to specify the subdocument to check. If not provided, the root document is used by default. |

## Return Value
- If `<json_path>` exists in `json_doc`, it returns 1.
- If `<json_path>` does not exist in `json_doc`, it returns 0.
- If any parameter is invalid or the JSON document format is incorrect, it returns `NULL`.

## Examples

```sql

SELECT JSON_CONTAINS('{"a": 1, "b": 2, "c": {"d": 4}}', '1', '$.a');

```

```sql
+------------------------------------------------------------------------------------------+
| json_contains(cast('{"a": 1, "b": 2, "c": {"d": 4}}' as JSON), cast('1' as JSON), '$.a') |
+------------------------------------------------------------------------------------------+
|                                                                                        1 |
+------------------------------------------------------------------------------------------+

```


```sql

SELECT json_contains('[1, 2, {"x": 3}]', '1');

```

```sql
+-------------------------------------------------------------------------+
| json_contains(cast('[1, 2, {"x": 3}]' as JSON), cast('1' as JSON), '$') |
+-------------------------------------------------------------------------+
|                                                                       1 |
+-------------------------------------------------------------------------+

```



