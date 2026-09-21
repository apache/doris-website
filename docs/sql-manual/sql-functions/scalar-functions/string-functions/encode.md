---
{
    "title": "ENCODE",
    "language": "en",
    "description": "Converts a string to a VARBINARY value using the specified character set for Hive-compatible character conversion."
}
---

## Description

Converts a string to a `VARBINARY` value using the specified character set. Character set names are case-insensitive. The supported character sets are `US-ASCII`, `ISO-8859-1`, `UTF-8`, `UTF-16BE`, `UTF-16LE`, and `UTF-16`.

## Syntax

```sql
ENCODE(<source>, <charset>)
```

## Parameters

| Parameter | Description |
| :--- | :--- |
| `<source>` | The string to encode. Type: STRING. |
| `<charset>` | A constant expression that evaluates to the name of the target character set. Type: STRING. Supported values are `US-ASCII`, `ISO-8859-1`, `UTF-8`, `UTF-16BE`, `UTF-16LE`, and `UTF-16`. A table column is not allowed. |

## Return Value

Returns a `VARBINARY` value containing the encoded bytes.

- If `<charset>` is `NULL`, or `<source>` is `NULL` and `<charset>` is valid, the function returns `NULL`.
- If `<source>` is an empty string, the function returns an empty binary value.
- `UTF-16` writes a big-endian byte order mark (BOM) for a non-empty input. `UTF-16BE` and `UTF-16LE` do not write a BOM.
- If `<charset>` is unsupported, the function returns an error even when `<source>` is `NULL`. If `<source>` contains a character that cannot be represented by the target character set, the function also returns an error.

## Example

**Encode the same character using UTF-8 and ISO-8859-1**

`HEX` is used to display the returned binary bytes.

```sql
SELECT
    HEX(ENCODE('é', 'UTF-8')) AS utf8_bytes,
    HEX(ENCODE('é', 'ISO-8859-1')) AS latin1_bytes;
```

```text
+------------+--------------+
| utf8_bytes | latin1_bytes |
+------------+--------------+
| C3A9       | E9           |
+------------+--------------+
```

**Compare the UTF-16 variants**

```sql
SELECT
    HEX(ENCODE('中', 'UTF-16BE')) AS big_endian,
    HEX(ENCODE('中', 'UTF-16LE')) AS little_endian,
    HEX(ENCODE('中', 'UTF-16')) AS with_bom;
```

```text
+------------+---------------+----------+
| big_endian | little_endian | with_bom |
+------------+---------------+----------+
| 4E2D       | 2D4E          | FEFF4E2D |
+------------+---------------+----------+
```

**NULL and empty input**

```sql
SELECT
    ENCODE(NULL, 'UTF-8') IS NULL AS null_result,
    HEX(ENCODE('', 'UTF-16')) = '' AS empty_result;
```

```text
+-------------+--------------+
| null_result | empty_result |
+-------------+--------------+
|           1 |            1 |
+-------------+--------------+
```
