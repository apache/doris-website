---
{
    "title": "JSON_PARSE_NULLABLE_ERROR_TO_VALUE",
    "language": "en",
    "description": "The JSONPARSENULLABLEERRORTOVALUE function is used to parse a JSON string into a valid JSON object. If the input JSON string is invalid,"
}
---

## Description

The `JSON_PARSE_NULLABLE_ERROR_TO_VALUE` function is used to parse a JSON string into a valid JSON object. If the input JSON string is invalid, it will return the default value specified by the user, instead of throwing an error. If the input is `NULL`, it will return the default value.

## Syntax

```sql
JSON_PARSE_NULLABLE_ERROR_TO_VALUE( <str> , <default_value>)
```
## Aliases
- JSONB_PARSE_NULLABLE_ERROR_TO_VALUE

## Required Parameters

| parameters| described|
|------|------|
| `<str>` | The input string in JSON format to be parsed. |
| `<default_value>` | The default value returned when parsing fails. |

## Return Value
If the input string is a valid JSON, it returns the corresponding JSON object.
If the input string is invalid or NULL, it returns the default value specified by the default_value parameter.

## Examples

1. Valid JSON string:
```sql
SELECT JSON_PARSE_NULLABLE_ERROR_TO_VALUE('{"name": "John", "age": 30}', 'default');
```

```sql
+------------------------------------------------------------------------------+
| JSON_PARSE_NULLABLE_ERROR_TO_VALUE('{"name": "John", "age": 30}', 'default') |
+------------------------------------------------------------------------------+
| {"name": "John", "age": 30}                                                  |
+------------------------------------------------------------------------------+
```

2. Invalid JSON string:
```sql
SELECT JSON_PARSE_NULLABLE_ERROR_TO_VALUE('{"name": "John", "age": }', 'default');
```

```sql
+----------------------------------------------------------------------------+
| JSON_PARSE_NULLABLE_ERROR_TO_VALUE('{"name": "John", "age": }', 'default') |
+----------------------------------------------------------------------------+
| default                                                                    |
+----------------------------------------------------------------------------+
```

3. Input is NULL:

```sql
SELECT JSON_PARSE_NULLABLE_ERROR_TO_VALUE(NULL, 'default');
```

```sql
+---------------------------------------------------------------+
| JSON_PARSE_NULLABLE_ERROR_TO_VALUE(NULL, 'default')           |
+---------------------------------------------------------------+
| default                                                       |
+---------------------------------------------------------------+
```