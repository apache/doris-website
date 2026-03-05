---
{
    "title": "JSON_PARSE_NOTNULL_ERROR_TO_INVALID",
    "language": "en",
    "description": "This function is used to parse a JSON string. If the JSON string is malformed or a parsing error occurs,"
}
---

## Description

This function is used to parse a JSON string. If the JSON string is malformed or a parsing error occurs, the function will return an invalid JSON object (usually `{}`). The main purpose of this function is to ensure that when a JSON format error occurs, a safe default value is returned, preventing query failures due to parsing errors.

## Aliases

- JSONB_PARSE_NOTNULL_ERROR_TO_INVALID

## Syntax

```sql
JSON_PARSE_NOTNULL_ERROR_TO_INVALID( <str> )
```

## Required Parameters

| parameters| described|
|------|------|
| `<str>`| The JSON string to be parsed. This parameter should be a valid string containing JSON-formatted data. If the JSON format is invalid, the function will return an invalid JSON object. |

## Return Value
Returns an invalid JSON object (usually `{}`).

## Examples

```sql

SELECT JSON_PARSE_NOTNULL_ERROR_TO_INVALID('{"name": "Alice", "age": 30}') AS parsed_json;

```

```sql
+---------------------------+
| parsed_json               |
+---------------------------+
| {"name":"Alice","age":30} |
+---------------------------+

```

