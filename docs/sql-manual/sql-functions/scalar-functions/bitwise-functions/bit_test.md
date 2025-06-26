---
{
"title": "BIT_TEST",
"language": "en"
}
---

## Description
Convert the value of `<x>` to binary form and return the value of the specified position `<bits>`, where `<bits>` starts from 0 and goes from right to left.

If `<bits>` has multiple values, the values at multiple `<bits>` positions are combined using the AND operator and the final result is returned.

If the value of `<bits>` is negative or exceeds the total number of bits in `<x>`, the result will be 0.

Integer `<x>` range: TINYINT, SMALLINT, INT, BIGINT, LARGEINT.

## Alias
- BIT_TEST_ALL

## Syntax
```sql
BIT_TEST( <x>, <bits>[, <bits> ... ])
```

## Parameters
| parameter | description |
|-----------|-------------|
| `<x>`     | The integer to be calculated     |
| `<bits>`  | The value at the specified position      |

## Return Value

Returns the value at the specified position

## Examples

```sql
select BIT_TEST(43, 1), BIT_TEST(43, -1), BIT_TEST(43, 0, 1, 3, 5,2);
```

```text
+-----------------+------------------+-----------------------------+
| bit_test(43, 1) | bit_test(43, -1) | bit_test(43, 0, 1, 3, 5, 2) |
+-----------------+------------------+-----------------------------+
|               1 |                0 |                           0 |
+-----------------+------------------+-----------------------------+
```