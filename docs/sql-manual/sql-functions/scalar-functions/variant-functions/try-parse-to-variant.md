---
{
    "title": "TRY_PARSE_TO_VARIANT",
    "language": "en",
    "description": "Tries to parse one JSON value into VARIANT. Over-long or duplicate keys return SQL NULL instead of an error; text that is not valid JSON is kept as a string."
}
---

## Description

`TRY_PARSE_TO_VARIANT` tries to parse one complete JSON value into `VARIANT`. The `TRY_` prefix means that a parse error returns SQL `NULL` instead of failing the query. By default, text that is not valid JSON is not a parse error; see Return Value. This function is available in Doris 4.1.4 and later; this page describes its behavior in Doris 5.0.0 and later.

## Syntax

```sql
TRY_PARSE_TO_VARIANT(<json_value>)
```

## Parameters

| Parameter | Description |
| --- | --- |
| `<json_value>` | A `CHAR`, `VARCHAR`, or `STRING` expression containing one complete JSON value, or a `JSON`/`JSONB` expression. JSON/JSONB input is converted to JSON text and then parsed as VARIANT. |

## Return Value

Returns a nullable `VARIANT` value.

- Valid input returns the parsed VARIANT value.
- These parse errors return SQL `NULL`: an object key longer than `variant_max_json_key_length` bytes (BE configuration, default 255), duplicate keys in one object (unless the BE configuration `variant_enable_duplicate_json_path_check` is `true`, which keeps the first value), nesting deeper than 128 levels, and a string that is not valid UTF-8.
- Text that is not valid JSON, and JSON that contains an integer outside [-2^63, 2^64 - 1] or a number outside the `DOUBLE` range, are returned as a VARIANT string, the same as [PARSE_TO_VARIANT](./parse-to-variant.md). They return SQL `NULL` only when the BE configuration `variant_throw_exeception_on_invalid_json` is `true` (default `false`).
- An empty string returns an empty object `{}`.
- SQL `NULL` input returns SQL `NULL`.
- The JSON literal `null` returns a VARIANT `null`, not SQL `NULL`.

## Example

Keep valid values and turn parse errors into SQL `NULL`:

```sql
SELECT CAST(
           TRY_PARSE_TO_VARIANT('{"id": 1}')
           AS STRING
       ) AS valid_value,
       TRY_PARSE_TO_VARIANT('{"id": 1, "id": 2}') IS NULL AS duplicate_is_null,
       TRY_PARSE_TO_VARIANT(NULL) IS NULL AS input_is_null;
```

```text
+-------------+-------------------+---------------+
| valid_value | duplicate_is_null | input_is_null |
+-------------+-------------------+---------------+
| {"id":1}    |                 1 |             1 |
+-------------+-------------------+---------------+
```

Parse JSON/JSONB input:

```sql
SELECT CAST(
           TRY_PARSE_TO_VARIANT(CAST('[10, 20, 30]' AS JSON))
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

JSON `null` is not SQL `NULL`, and text that is not valid JSON is kept as a string:

```sql
SELECT TRY_PARSE_TO_VARIANT('null') IS NULL AS json_null_is_sql_null,
       VARIANT_TYPE(TRY_PARSE_TO_VARIANT('{"id":')) AS invalid_json_type;
```

```text
+-----------------------+-------------------+
| json_null_is_sql_null | invalid_json_type |
+-----------------------+-------------------+
|                     0 | string            |
+-----------------------+-------------------+
```

## Usage Notes

- Use [PARSE_TO_VARIANT](./parse-to-variant.md) when a parse error should fail the query and expose the data-quality problem.
- This function converts only parse errors to SQL `NULL`; it does not change the meaning of a valid JSON `null` value.
- Load jobs such as Stream Load parse JSON text with the same rules as this function. See [Parse errors](../../../basic-element/sql-data-types/semi-structured/VARIANT.md#parse-errors).
