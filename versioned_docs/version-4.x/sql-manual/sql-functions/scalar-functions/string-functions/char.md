---
{
    "title": "CHAR | String Functions",
    "language": "en",
    "description": "The CHAR function interprets each argument as an integer and returns a string consisting of the characters represented by those integer code values."
}
---

# CHAR

## Description

The CHAR function interprets each argument as an integer and returns a string consisting of the characters represented by those integer code values.

## Syntax

```sql
CHAR(<expr>[, <expr> ...] [USING <charset_name>])
```

## Parameters

| Parameter | Description |
| ------------------ | ----------------------------------------- |
| `<expr>` | Integer code value to be converted to a character. Type: INT |

## Return Value

Returns VARCHAR type, a string composed of characters corresponding to the argument integer code values.

Special cases:
- If any argument is NULL, returns an empty string
- If the result string is illegal for the given character set, returns NULL
- Arguments greater than 255 are converted to multi-byte characters. For example, `CHAR(15049882)` is equivalent to `CHAR(229, 164, 154)`

## Examples

1. Basic usage: ASCII character generation
```sql
SELECT CHAR(68, 111, 114, 105, 115);
```
```text
+--------------------------------------+
| char('utf8', 68, 111, 114, 105, 115) |
+--------------------------------------+
| Doris                                |
+--------------------------------------+
```

2. Multi-byte UTF-8 characters (Chinese)
```sql
SELECT CHAR(15049882, 15179199, 14989469);
```
```text
+--------------------------------------------+
| char('utf8', 15049882, 15179199, 14989469) |
+--------------------------------------------+
| 多睿丝                                     |
+--------------------------------------------+
```

3. Illegal character returns NULL
```sql
SELECT CHAR(255);
```
```text
+-------------------+
| char('utf8', 255) |
+-------------------+
| NULL              |
+-------------------+
```

4. NULL value handling
```sql
SELECT CHAR(NULL);
```
```text
+------------+
| CHAR(NULL) |
+------------+
|            |
+------------+
```

