---
{
    "title": "CHAR",
    "language": "en"
}
---

## Description

Interpret each argument as an integer and return a string consisting of the characters given by the code values ​​of those integers. Special cases:

- If the result string is illegal for the given character set, the corresponding conversion result is NULL.

- Arguments greater than `255` are converted to multiple result bytes. For example, `char(15049882)` is equivalent to `char(229, 164, 154)`.

## Description

Interpret each argument as an integer and return a string consisting of the characters given by the code values ​​of those integers. Special cases:

- If the result string is illegal for the given character set, the corresponding conversion results in the value NULL.

- Arguments greater than `255` are converted to multiple result bytes. For example, `char(15049882)` is equivalent to `char(229, 164, 154)`.

## Syntax

```sql
CHAR ( <expr> [ , <expr> ... ] [ USING <charset_name> ] )
```

## Parameters

| Parameters       | Description |
|------------------|---------------------|
| `<expr>`         | Integer to be calculated as a character |
| `<charset_name>` | Encoding of the return value, currently only supports `utf8` |

## Return value

Parameter list `<expr>` A string consisting of the corresponding characters. Special cases:

- If the result string is illegal for the given character set, the corresponding conversion result is NULL.

- Parameters greater than `255` will be converted to multiple result bytes. For example, `CHAR(15049882)` is equivalent to `CHAR(229, 164, 154)`.

## Example

```sql
SELECT CHAR(68, 111, 114, 105, 115),CHAR(15049882, 15179199, 14989469),CHAR(255)
```

```text
+--------------------------------------+--------------------------------------------+-------------------+
| char('utf8', 68, 111, 114, 105, 115) | char('utf8', 15049882, 15179199, 14989469) | char('utf8', 255) |
+--------------------------------------+--------------------------------------------+-------------------+
| Doris                                | 多睿丝                                     | NULL              |
+--------------------------------------+--------------------------------------------+-------------------+
```