---
{
    "title": "PARSE_TO_VARIANT_ERROR_TO_NULL (Return NULL on Error)",
    "language": "en",
    "description": "Parses one complete JSON value into VARIANT and returns SQL NULL when parsing or validation fails."
}
---

## Description

`PARSE_TO_VARIANT_ERROR_TO_NULL` parses one complete JSON value into `VARIANT`. The `ERROR_TO_NULL` suffix means that a parsing or validation error returns SQL `NULL` instead of failing the query. This function is available in Doris 4.2 and later.

## Syntax

```sql
PARSE_TO_VARIANT_ERROR_TO_NULL(<json_value>)
```

## Parameters

| Parameter | Description |
| --- | --- |
| `<json_value>` | A `CHAR`, `VARCHAR`, or `STRING` expression containing one complete JSON value, or a `JSON`/`JSONB` expression. JSON/JSONB input is converted to JSON text and then parsed as VARIANT. |

## Return Value

Returns a nullable `VARIANT` value.

- Valid input returns the parsed VARIANT value.
- Invalid JSON or another parsing or validation error returns SQL `NULL`.
- SQL `NULL` input returns SQL `NULL`.
- The valid JSON literal `null` returns Variant/JSON `null`, not SQL `NULL`.

## Example

Keep valid values and convert invalid JSON to SQL `NULL`:

```sql
SELECT CAST(
           PARSE_TO_VARIANT_ERROR_TO_NULL('{"id": 1}')
           AS STRING
       ) AS valid_value,
       PARSE_TO_VARIANT_ERROR_TO_NULL('{"id":') IS NULL AS invalid_is_null,
       PARSE_TO_VARIANT_ERROR_TO_NULL(NULL) IS NULL AS input_is_null;
```

```text
+-------------+-----------------+---------------+
| valid_value | invalid_is_null | input_is_null |
+-------------+-----------------+---------------+
| {"id":1}    |               1 |             1 |
+-------------+-----------------+---------------+
```

Parse JSON/JSONB input:

```sql
SELECT CAST(
           PARSE_TO_VARIANT_ERROR_TO_NULL(CAST('[10, 20, 30]' AS JSON))
           AS STRING
       ) AS value;
```

```text
+------------+
| value      |
+------------+
| [10,20,30] |
+------------+
```

JSON `null` and SQL `NULL` remain distinct:

```sql
SELECT PARSE_TO_VARIANT_ERROR_TO_NULL('null') IS NULL AS json_null_is_sql_null,
       PARSE_TO_VARIANT_ERROR_TO_NULL('{') IS NULL AS error_is_sql_null;
```

```text
+-----------------------+-------------------+
| json_null_is_sql_null | error_is_sql_null |
+-----------------------+-------------------+
|                     0 |                 1 |
+-----------------------+-------------------+
```

## Usage Notes

- Use [PARSE_TO_VARIANT](./parse-to-variant) when invalid input should fail the query and expose the data-quality error.
- This function converts only parsing and validation failures to SQL `NULL`; it does not change the meaning of a valid JSON `null` value.
