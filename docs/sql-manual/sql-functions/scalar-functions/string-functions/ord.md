---
{
    "title": "ORD/UNICODE",
    "language": "en",
    "description": "Returns the first Unicode code point of a UTF-8 string as an INT. UNICODE is an alias for ORD."
}
---

## Description

Returns the Unicode code point of the first character in a UTF-8 string. Only the first character is decoded. Returns NULL if the input is NULL.

## Alias

- UNICODE

## Syntax

```sql
ORD(<str>)
UNICODE(<str>)
```

## Parameters

| Parameter | Description |
|-----------|-------------|
| `<str>` | The string whose first Unicode code point is returned. Type: STRING or VARCHAR. |

## Return Value

Returns INT, representing the first Unicode code point as a decimal integer.

- If the input is NULL, returns NULL.
- If the string is empty or its first character has an invalid or incomplete UTF-8 encoding, returns -1.
- A leading NUL character returns 0.
- Characters and bytes after the first character do not affect the result, even if those bytes are invalid UTF-8.

Unlike [ASCII](./ascii.md), which returns the first byte value, ORD decodes the first Unicode character.

## Examples

ASCII, Chinese, and emoji characters:

```sql
SELECT ORD('ABC') AS ascii_code, ORD('中text') AS chinese_code, ORD('😀') AS emoji_code;
```

```text
+------------+--------------+------------+
| ascii_code | chinese_code | emoji_code |
+------------+--------------+------------+
|         65 |        20013 |     128512 |
+------------+--------------+------------+
```

The UNICODE alias returns the same value:

```sql
SELECT ORD('é') AS ord_code, UNICODE('é') AS unicode_code;
```

```text
+----------+--------------+
| ord_code | unicode_code |
+----------+--------------+
|      233 |          233 |
+----------+--------------+
```

Empty strings, NULL input, and a leading NUL character:

```sql
SELECT ORD('') AS empty_code, ORD(NULL) AS null_code, ORD(UNHEX('00')) AS nul_code;
```

```text
+------------+-----------+----------+
| empty_code | null_code | nul_code |
+------------+-----------+----------+
|         -1 |      NULL |        0 |
+------------+-----------+----------+
```

Invalid and incomplete leading UTF-8 return -1. Invalid bytes after a valid first character are ignored:

```sql
SELECT ORD(UNHEX('FF')) AS invalid_code, ORD(UNHEX('E4BD')) AS incomplete_code,
       ORD(UNHEX('41FF')) AS valid_first_code;
```

```text
+--------------+-----------------+------------------+
| invalid_code | incomplete_code | valid_first_code |
+--------------+-----------------+------------------+
|           -1 |              -1 |               65 |
+--------------+-----------------+------------------+
```

<!-- TODO: A Chinese-speaking contributor should add the matching Chinese ORD/UNICODE documentation. -->
