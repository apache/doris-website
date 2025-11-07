---
{
    "title": "BIT_LENGTH",
    "language": "en"
}
---

## Description

It is used to return the median of the binary representation of a string (that is, the total number of binary digits). It calculates the number of bits occupied by the binary encoding of the string.

## Syntax
```sql
BIT_LENGTH( <str>)
```

## Parameters
| parameter | description |
|-----------|-------------|
| `<str>`   | The string to be calculated     |

## Return Value

Returns the number of bits occupied by `<str>` in the binary representation, including all 0 and 1.

## Examples

```sql
select BIT_LENGTH("abc"), BIT_LENGTH("中国"), BIT_LENGTH(123);
```

```text
+-------------------+----------------------+-----------------------------------------+
| bit_length('abc') | bit_length('中国')   | bit_length(cast(123 as VARCHAR(65533))) |
+-------------------+----------------------+-----------------------------------------+
|                24 |                   48 |                                      24 |
+-------------------+----------------------+-----------------------------------------+
```

