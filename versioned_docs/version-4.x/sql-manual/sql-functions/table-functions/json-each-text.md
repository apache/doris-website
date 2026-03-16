---
{
    "title": "JSON_EACH_TEXT",
    "language": "en",
    "description": "Expands the top-level JSON object into a set of key/value pairs, where the value column is returned as plain text. Must be used with LATERAL VIEW."
}
---

## Description

The `json_each_text` table function expands the top-level JSON object into a set of key/value pairs. Each row contains one key (`key`) and its corresponding value (`value`). Unlike [`json_each`](json-each.md), the `value` column is of type TEXT, so string values are returned **without** JSON quotes.

Must be used with [`LATERAL VIEW`](../../../query-data/lateral-view.md).

:::note
This function has been supported since 4.1.0
:::

## Syntax

```sql
JSON_EACH_TEXT(<json_str>)
```

## Parameters

| Parameter    | Description                                          |
| ------------ | ---------------------------------------------------- |
| `<json_str>` | The JSON string to expand. The content must be a JSON object. |

## Return Value

Returns multi-column, multi-row data. Each row corresponds to one key-value pair in the JSON object:

| Column  | Type | Description                                                                          |
|---------|------|--------------------------------------------------------------------------------------|
| `key`   | TEXT | The key name from the JSON object                                                     |
| `value` | TEXT | The corresponding value as plain text (string values have no quotes, e.g. `foo`) |

Special cases:
- If `<json_str>` is NULL, returns 0 rows
- If `<json_str>` is an empty object (`{}`), returns 0 rows
- A JSON `null` value is returned as SQL `NULL`

## Examples

Basic usage: expand a JSON object with string values

```sql
SELECT k, v
FROM (SELECT 1) dummy
LATERAL VIEW json_each_text('{"a":"foo","b":"bar"}') t AS k, v;
```

```text
+---+-----+
| k | v   |
+---+-----+
| a | foo |
| b | bar |
+---+-----+
```

> The `value` column is of TEXT type, so string values have **no** JSON quotes (unlike `json_each`).

JSON object with multiple value types

```sql
SELECT k, v
FROM (SELECT 1) dummy
LATERAL VIEW json_each_text('{"str":"hello","num":42,"bool":true,"null_val":null}') t AS k, v;
```

```text
+----------+-------+
| k        | v     |
+----------+-------+
| str      | hello |
| num      | 42    |
| bool     | true  |
| null_val | NULL  |
+----------+-------+
```

> JSON `null` values map to SQL `NULL`.

NULL parameter: returns 0 rows

```sql
SELECT k, v
FROM (SELECT 1) dummy
LATERAL VIEW json_each_text(NULL) t AS k, v;
-- Empty set
```

Empty object: returns 0 rows

```sql
SELECT k, v
FROM (SELECT 1) dummy
LATERAL VIEW json_each_text('{}') t AS k, v;
-- Empty set
```