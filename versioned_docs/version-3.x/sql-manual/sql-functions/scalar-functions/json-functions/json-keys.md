---
{
    "title": "JSON_KEYS",
    "language": "en",
    "description": "Used to return the key from the top-level value of a JSON object. These keys are returned as an array or, if path parameters are given,"
}
---

## Description

Used to return the key from the top-level value of a JSON object. These keys are returned as an array or, if path parameters are given, the top-level keys of the selected path. You need to provide the JSON document as an argument to the function. You can also (optionally) provide a second parameter to specify where the "top-level" path in the JSON document starts.
Where json_doc is a JSON document, and path is an optional parameter used to determine where the "top-level" path in the JSON document starts.

## Syntax

`JSON_KEYS(<str> [, <path>])`

## Alias

- JSONB_KEYS

## Required Parameters
| parameters| described|
|------|------|
| `<str>`| A JSON string from which to extract the key is needed. |

## Optional Parameters

| parameters| described|
|------|------|
| `<path>`| Optional JSON path that specifies the JSON subdocument to be checked. If it is not provided, the default is the root document. |

## Return Value

- Returns a list of key names (a array) for the JSON document.
- Returns NULL if `<str>` is not a valid JSON object.
- If the JSON object has no keys, an empty array is returned.

## Usage Notes
 
- If the selected object is empty, the result array is empty. If the top-level value contains nested sub-objects, the return value does not include the keys of those sub-objects.

## Examples

```sql
SELECT JSON_KEYS('{"a": 1, "b": {"c": 30}}');
```
```sql
+-----------------------------------------------------+
| json_keys(cast('{"a": 1, "b": {"c": 30}}' as JSON)) |
+-----------------------------------------------------+
| ["a", "b"]                                          |
+-----------------------------------------------------+
```
```sql
SELECT JSON_KEYS('{"a": 1, "b": {"c": 30}}', '$.b');
```
```sql
+------------------------------------------------------------+
| json_keys(cast('{"a": 1, "b": {"c": 30}}' as JSON), '$.b') |
+------------------------------------------------------------+
| ["c"]                                                      |
+------------------------------------------------------------+
```
```sql
SELECT JSON_KEYS('{}');
```
```sql
+-------------------------------+
| json_keys(cast('{}' as JSON)) |
+-------------------------------+
| []                            |
+-------------------------------+
```
```sql
SELECT JSON_KEYS('[1,2]');
```
```sql
+----------------------------------+
| json_keys(cast('[1,2]' as JSON)) |
+----------------------------------+
| NULL                             |
+----------------------------------+
```
```sql
 SELECT JSON_KEYS('[]');
 ```
 ```sql
+-------------------------------+
| json_keys(cast('[]' as JSON)) |
+-------------------------------+
| NULL                          |
+-------------------------------+
```