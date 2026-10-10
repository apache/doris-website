---
{
    "title": "PARSE_TO_VARIANT",
    "language": "en",
    "description": "Parses one complete JSON value from text or a JSON/JSONB expression into a typed VARIANT value."
}
---

## Description

`PARSE_TO_VARIANT` parses one complete JSON value into `VARIANT`. It accepts JSON objects, arrays, strings, numbers, booleans, and the JSON literal `null`. This function is available in Doris 4.1.4 and later; this page describes its behavior in Doris 5.0.0 and later.

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
- The JSON literal `null` returns a VARIANT `null`, which is different from SQL `NULL`.
- Text that is not valid JSON is returned as a VARIANT string. So is JSON that contains an integer outside [-2^63, 2^64 - 1] or a number outside the `DOUBLE` range: the whole text becomes one string. This is controlled by the BE configuration `variant_throw_exeception_on_invalid_json` (default `false`); when it is `true`, such input makes the query fail.
- An empty string returns an empty object `{}`.
- A document nested so deeply that the JSON parser itself rejects it (about 1,000 levels) is invalid JSON and is also returned as a string.
- The query fails when an object key is longer than `variant_max_json_key_length` bytes (BE configuration, default 255), when an object contains duplicate keys (unless the BE configuration `variant_enable_duplicate_json_path_check` is `true`, which keeps the first value), when nesting is deeper than 128 levels, or when a string is not valid UTF-8.

## Example

Parse JSON text:

```sql
SELECT CAST(
           PARSE_TO_VARIANT('{"id": 42, "tags": ["doris", "sql"]}')
           AS STRING
       ) AS value;
```

```text
+----------------------------------+
| value                            |
+----------------------------------+
| {"id":42,"tags":["doris","sql"]} |
+----------------------------------+
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

Text that is not valid JSON is kept as a string:

```sql
SELECT CAST(PARSE_TO_VARIANT('{"id":') AS STRING) AS value,
       VARIANT_TYPE(PARSE_TO_VARIANT('{"id":'))    AS type;
```

```text
+--------+--------+
| value  | type   |
+--------+--------+
| {"id": | string |
+--------+--------+
```

Duplicate keys return an error:

```sql
SELECT PARSE_TO_VARIANT('{"id": 1, "id": 2}');
```

```text
ERROR 1105 (HY000): errCode = 2, detailMessage = [INVALID_ARGUMENT]Parse json document failed at row 0, error: [INVALID_ARGUMENT]Duplicate Variant object key
```

## Usage Notes

- Use [TRY_PARSE_TO_VARIANT](./try-parse-to-variant.md) when a parse error should return SQL `NULL` instead of failing the query.
- `PARSE_TO_VARIANT` explicitly parses JSON. By contrast, `CAST(string AS VARIANT)` and `INSERT` of a string into a VARIANT column keep the input as a VARIANT string and do not parse JSON. To write JSON text with `INSERT`, wrap it in `PARSE_TO_VARIANT`. See [Write data](../../../basic-element/sql-data-types/semi-structured/VARIANT.md#write-data) and [CAST to VARIANT](../../../basic-element/sql-data-types/semi-structured/VARIANT.md#cast-to-variant).
