---
{
"title": "BIT_COUNT",
"language": "en"
}
---

## Description
Used to return the number of 1 bits in the binary representation of an integer value. This function can be used to quickly count the number of "active" bits of an integer in the binary representation, and is usually used to analyze data distribution or perform certain bit operations

## Syntax
```sql
BIT_COUNT( <x>)
```

## Parameters
| parameter | description                                                     |
|-----------|-----------------------------------------------------------------|
| `<x>`     | Counts the number of 1s in the binary representation of integer x. Integer types can be: TINYINT, SMALLINT, INT, BIGINT, LARGEINT |

## Return Value

Returns the number of 1s in the binary representation of `<x>`

## Examples

```sql
select BIT_COUNT(8), BIT_COUNT(-1);
```
```text
+--------------+---------------+
| bit_count(8) | bit_count(-1) |
+--------------+---------------+
|            1 |             8 |
+--------------+---------------+
```
