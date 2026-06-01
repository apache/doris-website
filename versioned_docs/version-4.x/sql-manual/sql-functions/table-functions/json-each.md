---
{
    "title": "JSON_EACH",
    "language": "en",
    "description": "Expands the top-level JSON object into a set of key/value pairs, where the value column retains JSON type. Must be used with LATERAL VIEW."
}
---

## Description

The `json_each` table function expands the top-level JSON object into a set of key/value pairs. Each row contains one key (`key`) and its corresponding value (`value`). The `value` column retains the JSON type, so string values are returned with JSON quotes preserved.

Must be used with [`LATERAL VIEW`](../../../query-data/lateral-view.md).

## Syntax

```sql
JSON_EACH(<json_str>)
```

## Parameters

| Parameter    | Description                                          |
| ------------ | ---------------------------------------------------- |
| `<json_str>` | The JSON string to expand. The content must be a JSON object. |

## Return Value

Returns multi-column, multi-row data. Each row corresponds to one key-value pair in the JSON object:

| Column  | Type   | Description                                                                 |
|---------|--------|-----------------------------------------------------------------------------|
| `key`   | String | The key name from the JSON object                                           |
| `value` | JSON   | The corresponding value, kept as JSON type (string values include quotes, e.g. `"foo"`) |

Special cases:
- If `<json_str>` is NULL, returns 0 rows
- If `<json_str>` is an empty object (`{}`), returns 0 rows

## Examples

Basic usage: expand a JSON object with string values

```sql
SELECT k, v
FROM (SELECT 1) dummy
LATERAL VIEW json_each('{"a":"foo","b":"bar"}') t AS k, v;
```

```text
+---+-------+
| k | v     |
+---+-------+
| a | "foo" |
| b | "bar" |
+---+-------+
```

> The `value` column is of JSON type, so string values retain their JSON quotes.

JSON object with multiple value types

```sql
SELECT k, v
FROM (SELECT 1) dummy
LATERAL VIEW json_each('{"str":"hello","num":42,"bool":true,"null_val":null,"arr":[1,2]}') t AS k, v;
```

```text
+----------+---------+
| k        | v       |
+----------+---------+
| str      | "hello" |
| num      | 42      |
| bool     | true    |
| null_val | NULL    |
| arr      | [1,2]   |
+----------+---------+
```

NULL parameter: returns 0 rows

```sql
SELECT k, v
FROM (SELECT 1) dummy
LATERAL VIEW json_each(NULL) t AS k, v;
-- Empty set
```

Empty object: returns 0 rows

```sql
SELECT k, v
FROM (SELECT 1) dummy
LATERAL VIEW json_each('{}') t AS k, v;
-- Empty set
```
