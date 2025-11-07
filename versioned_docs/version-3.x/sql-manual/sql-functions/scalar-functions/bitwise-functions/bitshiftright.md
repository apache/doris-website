---
{
"title": "BIT_SHIFT_RIGHT",
"language": "en"
}
---

## Description
Used for right shift operations, usually used to shift all bits of a binary number to the right by a specified number of bits. This operation is usually used to process binary data, or for some mathematical calculations (such as efficient implementation of division).

The result of logically shifting -1 right by one position is BIGINT_MAX(9223372036854775807).

Shifting a number right by a negative amount always results in a result of 0.

## Syntax
```sql
BIT_SHIFT_RIGHT( <x>, <bits>)
```

## Parameters
| parameter | description                      |
|-----------|----------------------------------|
| `<x>`     | The number to be shifted                        |
| `<bits>`  | The number of bits to shift right. It is an integer that determines how many bits `<x>` will be shifted right. |

## Return Value

Returns an integer representing the result of a right shift operation.

## Examples

```sql
select BIT_SHIFT_RIGHT(1024,3), BIT_SHIFT_RIGHT(-1,1), BIT_SHIFT_RIGHT(100, -1);
```

```text
+--------------------------+------------------------+--------------------------+
| bit_shift_right(1024, 3) | bit_shift_right(-1, 1) | bit_shift_right(100, -1) |
+--------------------------+------------------------+--------------------------+
|                      128 |    9223372036854775807 |                        0 |
+--------------------------+------------------------+--------------------------+
```
