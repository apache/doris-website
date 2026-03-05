---
{
    "title": "JSON_VALID",
    "language": "en",
    "description": "The JSONVALID function returns 0 or 1 to indicate whether the input is a valid JSON. If the input is NULL, it returns NULL."
}
---

## Description

The JSON_VALID function returns 0 or 1 to indicate whether the input is a valid JSON. If the input is NULL, it returns NULL.

## Syntax

```sql
JSON_VALID( <str> )

```

Required Parameters
| Parameter | Description |
|------|------|
| `<str>` | The input string in JSON format to be parsed. |

## Alias

- JSONB_VALID

## Examples

1. Valid JSON string

```sql
SELECT json_valid('{"k1":"v31","k2":300}');
+-------------------------------------+
| json_valid('{"k1":"v31","k2":300}') |
+-------------------------------------+
|                                   1 |
+-------------------------------------+

```

2. Invalid JSON string

```sql
SELECT json_valid('invalid json');
+----------------------------+
| json_valid('invalid json') |
+----------------------------+
|                          0 |
+----------------------------+

```

3. NULL 参数

```sql
SELECT json_valid(NULL);
+------------------+
| json_valid(NULL) |
+------------------+
|             NULL |
+------------------+

```
