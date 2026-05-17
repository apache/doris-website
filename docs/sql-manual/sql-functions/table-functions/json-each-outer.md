---
{
    "title": "JSON_EACH_OUTER",
    "language": "en",
    "description": "Expands the top-level JSON object into a set of key/value pairs, where the value column retains JSON type. Unlike json_each, returns one row of NULLs instead of 0 rows when input is NULL or an empty object. Must be used with LATERAL VIEW."
}
---

## Description

The `json_each_outer` table function expands the top-level JSON object into a set of key/value pairs. Each row contains one key (`key`) and its corresponding value (`value`). The `value` column retains the JSON type, so string values are returned with JSON quotes preserved.

Unlike [`json_each`](json-each.md), when the input is NULL or an empty object, `json_each_outer` returns one row of `NULL, NULL` instead of 0 rows.

Must be used with [`LATERAL VIEW`](../../../query-data/lateral-view.md).

## Syntax

```sql
JSON_EACH_OUTER(<json_str>)
```

## Parameters

| Parameter    | Description                                                   |
| ------------ | ------------------------------------------------------------- |
| `<json_str>` | The JSON string to expand. The content must be a JSON object. |

## Return Value

Returns multi-column, multi-row data. Each row corresponds to one key-value pair in the JSON object:

| Column  | Type   | Description                                                                             |
| ------- | ------ | --------------------------------------------------------------------------------------- |
| `key`   | String | The key name from the JSON object                                                       |
| `value` | JSON   | The corresponding value, kept as JSON type (string values include quotes, e.g. `"foo"`) |

Special cases:
- If `<json_str>` is NULL, returns 1 row of `NULL, NULL`
- If `<json_str>` is an empty object (`{}`), returns 1 row of `NULL, NULL`

## Examples

Basic usage: expand a JSON object with string values

```sql
SELECT k, v
FROM (SELECT 1) dummy
LATERAL VIEW json_each_outer('{"a":"foo","b":"bar"}') t AS k, v;
```

```text
+---+-------+
| k | v     |
+---+-------+
| a | "foo" |
| b | "bar" |
+---+-------+
```

NULL parameter: returns 1 row of NULL

```sql
SELECT k, v
FROM (SELECT 1) dummy
LATERAL VIEW json_each_outer(NULL) t AS k, v;
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
LATERAL VIEW json_each_outer('{}') t AS k, v;
```

```text
+------+------+
| k    | v    |
+------+------+
| NULL | NULL |
+------+------+
```
