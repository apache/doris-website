---
{
    "title": "DECODE",
    "language": "en",
    "description": "Converts a VARBINARY value to a string using the specified character set for Hive-compatible character conversion."
}
---

## Description

Converts a `VARBINARY` value to a string using the specified character set. Character set names are case-insensitive. The supported character sets are `US-ASCII`, `ISO-8859-1`, `UTF-8`, `UTF-16BE`, `UTF-16LE`, and `UTF-16`.

## Syntax

```sql
DECODE(<binary>, <charset>)
```

## Parameters

| Parameter | Description |
| :--- | :--- |
| `<binary>` | The binary value to decode. Type: VARBINARY. |
| `<charset>` | A string literal naming the character set used by the input bytes, or `NULL`. Supported values are `US-ASCII`, `ISO-8859-1`, `UTF-8`, `UTF-16BE`, `UTF-16LE`, and `UTF-16`. A column or other expression is not allowed. |

## Return Value

Returns a `STRING` value containing the decoded text.

- If `<charset>` is `NULL`, or `<binary>` is `NULL` and `<charset>` is valid, the function returns `NULL`.
- If `<binary>` is empty, the function returns an empty string.
- For `UTF-16`, the function recognizes big-endian (`FE FF`) and little-endian (`FF FE`) BOMs and removes the BOM from the result. Without a BOM, it decodes the input as big-endian. `UTF-16BE` and `UTF-16LE` always use their explicit byte order.
- If `<charset>` is unsupported, the function returns an error even when `<binary>` is `NULL`. If `<binary>` is malformed for the specified character set, the function also returns an error.

## Example

**Decode UTF-8 bytes**

```sql
SELECT DECODE(CAST(UNHEX('E4B8AD') AS VARBINARY), 'UTF-8') AS decoded_text;
```

```text
+--------------+
| decoded_text |
+--------------+
| 中           |
+--------------+
```

**Decode little-endian UTF-16 with a BOM**

The lower-case character set name also demonstrates case-insensitive matching.

```sql
SELECT DECODE(CAST(UNHEX('FFFE2D4E') AS VARBINARY), 'utf-16') AS decoded_text;
```

```text
+--------------+
| decoded_text |
+--------------+
| 中           |
+--------------+
```

**NULL and empty input**

```sql
SELECT
    DECODE(CAST(NULL AS VARBINARY), 'UTF-8') IS NULL AS null_result,
    DECODE(CAST(UNHEX('') AS VARBINARY), 'UTF-16') = '' AS empty_result;
```

```text
+-------------+--------------+
| null_result | empty_result |
+-------------+--------------+
|           1 |            1 |
+-------------+--------------+
```
