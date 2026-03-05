---
{
    "title": "JSON_LENGTH",
    "language": "en",
    "description": "The JSONLENGTH function returns the length or number of elements of a given JSON document. If the JSON document is an array,"
}
---

## Description
The JSON_LENGTH function returns the length or number of elements of a given JSON document. If the JSON document is an array, the number of elements in the array is returned; if the JSON document is an object, the number of key-value pairs in the object is returned. Returns NULL if the JSON document is empty or invalid.

## Syntax

```sql
JSON_LENGTH(<json_str> [ , <json_path> ])
```

## Required Parameters

| parameters| described|
|------|------|
| `<json_str>`| The length of the JSON string needs to be checked. |

## Optional Parameters
| parameters| described|
|------|------|
| `<json_path>`| If a path is specified, the JSON_LENGTH() function returns the length of the data that matches the path in the JSON document, otherwise it returns the length of the JSON document|

## Usage Notes
This function calculates the length of a JSON document based on the following rules:
- The length of the scalar is 1. For example: '1','"x "','true',' false', and 'null' are all of length 1.
- The length of an array is the number of array elements. For example: '[1,2]' has length 2.
- The length of an object is the number of object members. For example: '{"x": 1}' has length 1

## Return Value

- For a JSON array, returns the number of elements in the array.
- For JSON objects, returns the number of key-value pairs in the object.
- Returns NULL for invalid JSON strings.
- For other types (such as strings, numbers, booleans, null, etc.), NULL is returned.

## Examples

```sql
SELECT json_length('{"k1":"v31","k2":300}');
```

```sql
+--------------------------------------+
| json_length('{"k1":"v31","k2":300}') |
+--------------------------------------+
| 2                                    |
+--------------------------------------+
```
```sql
SELECT json_length('"abc"');
```
```sql
+----------------------+
| json_length('"abc"') |
+----------------------+
| 1                    |
+----------------------+
```
```sql
SELECT json_length('{"x": 1, "y": [1, 2]}', '$.y');
```
```sql
+---------------------------------------------+
| json_length('{"x": 1, "y": [1, 2]}', '$.y') |
+---------------------------------------------+
| 2                                           |
+---------------------------------------------+
```