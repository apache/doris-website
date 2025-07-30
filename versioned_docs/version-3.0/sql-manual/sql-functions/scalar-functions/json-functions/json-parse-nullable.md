---
{
    "title": "JSON_PARSE_NULLABLE",
    "language": "en"
}
---

## Description

The `JSON_PARSE_NULLABLE` function is used to parse a JSON string into a valid JSON object. If the input string is invalid or NULL, it returns NULL without throwing an error.

## Syntax

```sql
JSON_PARSE_NULLABLE( <str> )

```
## Alias

- JSONB_PARSE_NULLABLE

## Required Parameters

| Parameter | Description |
|------|------|
| `<str>` | The input string in JSON format to be parsed. |

## Return Value
- If the input string is valid JSON, it returns the corresponding JSON object.
- If the input string is invalid or NULL, it returns NULL.

## Examples

1.Valid JSON string:
```sql
SELECT JSON_PARSE_NULLABLE('{"name": "John", "age": 30}');
```

```sql
+-------------------------------------------------------+
| JSON_PARSE_NULLABLE('{"name": "John", "age": 30}')    |
+-------------------------------------------------------+
| {"name": "John", "age": 30}                           |
+-------------------------------------------------------+

```
2.Invalid JSON string:
```sql
SELECT JSON_PARSE_NULLABLE('{"name": "John", "age": }');
```

```sql
+-------------------------------------------------------+
| JSON_PARSE_NULLABLE('{"name": "John", "age": }')      |
+-------------------------------------------------------+
| NULL                                                  |
+-------------------------------------------------------+

```