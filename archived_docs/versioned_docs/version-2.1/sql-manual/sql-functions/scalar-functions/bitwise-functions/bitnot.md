---
{
    "title": "BITNOT",
    "language": "en",
    "description": "Used to perform a bitwise inversion operation on an integer."
}
---

## Description
Used to perform a bitwise inversion operation on an integer.

Integer range: TINYINT, SMALLINT, INT, BIGINT, LARGEINT

## Syntax
```sql
BITNOT( <x>)
```

## Parameters
| parameter | description |
|-----------|-------------|
| `<x>`     | Integer operations      |

## Return Value
Returns the result of the NOT operation of one integer.

## Examples
```sql
select BITNOT(7), BITNOT(-127);
```
```text
+-------+----------+
| (~ 7) | (~ -127) |
+-------+----------+
|    -8 |      126 |
+-------+----------+
```