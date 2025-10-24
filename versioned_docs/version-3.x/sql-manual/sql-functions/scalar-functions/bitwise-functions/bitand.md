---
{
"title": "BITAND",
"language": "en"
}
---

## Description
Used to perform a bitwise AND operation. The bitwise AND operation compares each bit of two integers. The result is 1 only when both corresponding binary bits are 1, otherwise it is 0.

Integer range: TINYINT, SMALLINT, INT, BIGINT, LARGEINT

## Syntax
```sql
BITAND( <lhs>, <rhs>)
```

## Parameters
| parameter | description  |
|-----------|--------------|
| `<lhs>`   | The first number involved in the bitwise AND operation |
| `<rhs>`   | The second number to be included in the bitwise AND operation |

## Return Value

Returns the result of the AND operation on two integers.


## Examples

```sql
select BITAND(3,5), BITAND(4,7);
```

```text
+---------+---------+
| (3 & 5) | (4 & 7) |
+---------+---------+
|       1 |       4 |
+---------+---------+

```
