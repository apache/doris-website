---
{
    "title": "BITOR",
    "language": "en",
    "description": "Used to perform a bitwise OR operation on two integers."
}
---

## Description
Used to perform a bitwise OR operation on two integers.

Integer range: TINYINT, SMALLINT, INT, BIGINT, LARGEINT

## Syntax
```sql
BITOR( <lhs>, <rhs>)
```

## Parameters
| parameter | description                                                             |
|-----------|-------------------------------------------------------------------------|
| `<lhs>`   | The first BOOLEAN value to be evaluated                                 |
| `<rhs>`   | The second BOOLEAN value to be evaluated |

## Return Value

Returns the result of the OR operation on two integers.

## Examples
```sql
select BITOR(3,5), BITOR(4,7);
```

```text
+---------+---------+
| (3 | 5) | (4 | 7) |
+---------+---------+
|       7 |       7 |
+---------+---------+
```