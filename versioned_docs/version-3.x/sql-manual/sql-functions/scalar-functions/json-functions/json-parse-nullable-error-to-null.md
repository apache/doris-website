---
{
    "title": "JSON_PARSE_NULLABLE_ERROR_TO_NULL",
    "language": "en",
    "description": "The JSONPARSENULLABLEERRORTONULL function is used to parse a JSON string into a valid JSON object. If the input JSON string is invalid,"
}
---

## Description

The `JSON_PARSE_NULLABLE_ERROR_TO_NULL` function is used to parse a JSON string into a valid JSON object. If the input JSON string is invalid, it will return `NULL` without throwing an error. If the input is `NULL`, it will directly return `NULL`.

## Syntax

```sql
JSON_PARSE_NULLABLE_ERROR_TO_NULL( <str> )
```
## Aliases

- JSONB_PARSE_NULLABLE_ERROR_TO_NULL

## Required Parameters

| Parameter | Description                                             |
|-----------|---------------------------------------------------------|
| `<str>`   | The input string in JSON format to be parsed.           |

## Return Value

If the input string is a valid JSON, it returns the corresponding JSON object.
If the input string is invalid or NULL, it returns NULL.

## Examples

1. Valid JSON string:

```sql
SELECT JSON_PARSE_NULLABLE_ERROR_TO_NULL('{"name": "John", "age": 30}');

```

```sql
+---------------------------------------------------------------+
| JSON_PARSE_NULLABLE_ERROR_TO_NULL('{"name": "John", "age": 30}') |
+---------------------------------------------------------------+
| {"name": "John", "age": 30}                                    |
+---------------------------------------------------------------+

```
2. Invalid JSON string:

```sql
SELECT JSON_PARSE_NULLABLE_ERROR_TO_NULL('{"name": "John", "age": }');

```

```sql
+---------------------------------------------------------------+
| JSON_PARSE_NULLABLE_ERROR_TO_NULL('{"name": "John", "age": }') |
+---------------------------------------------------------------+
| NULL                                                          |
+---------------------------------------------------------------+

```
3. Input is NULL:

```sql
SELECT JSON_PARSE_NULLABLE_ERROR_TO_NULL(NULL);

```

```sql
+---------------------------------------------------------------+
| JSON_PARSE_NULLABLE_ERROR_TO_NULL(NULL)                        |
+---------------------------------------------------------------+
| NULL                                                          |
+---------------------------------------------------------------+

```

