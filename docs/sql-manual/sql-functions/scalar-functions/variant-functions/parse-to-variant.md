---
{
    "title": "PARSE_TO_VARIANT",
    "language": "en",
    "description": "Parses one complete JSON value from text or a JSON/JSONB expression into a typed VARIANT value."
}
---

## Description

`PARSE_TO_VARIANT` parses one complete JSON value into `VARIANT`. It accepts JSON objects, arrays, strings, numbers, booleans, and the JSON literal `null`. This function is available in Doris 4.2 and later.

## Syntax

```sql
PARSE_TO_VARIANT(<json_value>)
```

## Parameters

| Parameter | Description |
| --- | --- |
| `<json_value>` | A `CHAR`, `VARCHAR`, or `STRING` expression containing one complete JSON value, or a `JSON`/`JSONB` expression. JSON/JSONB input is converted to JSON text and then parsed as VARIANT. |

## Return Value

Returns a `VARIANT` value.

- SQL `NULL` input returns SQL `NULL`.
- The JSON literal `null` returns Variant/JSON `null`, which is different from SQL `NULL`.
- Invalid JSON, duplicate object keys rejected by the current validation settings, unsupported depth, or another validation error causes the query to fail.

## Example

Parse JSON text:

```sql
SELECT CAST(
           PARSE_TO_VARIANT('{"id": 42, "tags": ["doris", "sql"]}')
           AS STRING
       ) AS value;
```

```text
+----------------------------------------+
| value                                  |
+----------------------------------------+
| {"id":42,"tags":["doris","sql"]}     |
+----------------------------------------+
```

Parse a JSON/JSONB expression:

```sql
SELECT CAST(
           PARSE_TO_VARIANT(CAST('{"id": 42}' AS JSON))
           AS STRING
       ) AS value;
```

```text
+-----------+
| value     |
+-----------+
| {"id":42} |
+-----------+
```

Extract a value and CAST it to a concrete SQL type:

```sql
SELECT CAST(
           PARSE_TO_VARIANT('{"user": {"id": 42}}')['user']['id']
           AS BIGINT
       ) AS user_id;
```

```text
+---------+
| user_id |
+---------+
|      42 |
+---------+
```

SQL `NULL` remains SQL `NULL`:

```sql
SELECT PARSE_TO_VARIANT(NULL) IS NULL AS is_sql_null;
```

```text
+-------------+
| is_sql_null |
+-------------+
|           1 |
+-------------+
```

Invalid JSON returns an error:

```sql
SELECT PARSE_TO_VARIANT('{"id":');
```

```text
ERROR: Parse json document failed
```

## Usage Notes

- Use [PARSE_TO_VARIANT_ERROR_TO_NULL](./parse-to-variant-error-to-null) when invalid input should become SQL `NULL` instead of failing the query.
- `PARSE_TO_VARIANT` always expresses JSON-parsing intent. By contrast, the behavior of `CAST(string AS VARIANT)` depends on `enable_variant_string_cast_parse`; see the [VARIANT CAST rules](../../../basic-element/sql-data-types/semi-structured/VARIANT#cast-rules).
