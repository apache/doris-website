---
{
    "title": "JSON_EACH_TEXT_OUTER",
    "language": "en",
    "description": "Expands the top-level JSON object into a set of key/value pairs, where the value column is returned as plain text. Unlike json_each_text, returns one row of NULLs instead of 0 rows when input is NULL or an empty object. Must be used with LATERAL VIEW."
}
---

## Description

The `json_each_text_outer` table function expands the top-level JSON object into a set of key/value pairs. Each row contains one key (`key`) and its corresponding value (`value`). Unlike [`json_each_outer`](json-each-outer.md), the `value` column is of type TEXT, so string values are returned **without** JSON quotes.

Unlike [`json_each_text`](json-each-text.md), when the input is NULL or an empty object, `json_each_text_outer` returns one row of `NULL, NULL` instead of 0 rows.

Must be used with [`LATERAL VIEW`](../../../query-data/lateral-view.md).

## Syntax

```sql
JSON_EACH_TEXT_OUTER(<json_str>)
```

## Parameters

| Parameter    | Description                                                   |
| ------------ | ------------------------------------------------------------- |
| `<json_str>` | The JSON string to expand. The content must be a JSON object. |

## Return Value

Returns multi-column, multi-row data. Each row corresponds to one key-value pair in the JSON object:

| Column  | Type | Description                                                                      |
| ------- | ---- | -------------------------------------------------------------------------------- |
| `key`   | TEXT | The key name from the JSON object                                                |
| `value` | TEXT | The corresponding value as plain text (string values have no quotes, e.g. `foo`) |

Special cases:
- If `<json_str>` is NULL, returns 1 row of `NULL, NULL`
- If `<json_str>` is an empty object (`{}`), returns 1 row of `NULL, NULL`
- A JSON `null` value is returned as SQL `NULL`

## Examples

Basic usage: expand a JSON object with string values

```sql
SELECT k, v
FROM (SELECT 1) dummy
LATERAL VIEW json_each_text_outer('{"a":"foo","b":"bar"}') t AS k, v;
```

```text
+---+-----+
| k | v   |
+---+-----+
| a | foo |
| b | bar |
+---+-----+
```

> The `value` column is of TEXT type, so string values have **no** JSON quotes (unlike `json_each_outer`).

NULL parameter: returns 1 row of NULL

```sql
SELECT k, v
FROM (SELECT 1) dummy
LATERAL VIEW json_each_text_outer(NULL) t AS k, v;
```

```text
+------+------+
| k    | v    |
+------+------+
| NULL | NULL |
+------+------+
```

Empty object: returns 1 row of NULL

```sql
SELECT k, v
FROM (SELECT 1) dummy
LATERAL VIEW json_each_text_outer('{}') t AS k, v;
```

```text
+------+------+
| k    | v    |
+------+------+
| NULL | NULL |
+------+------+
```
