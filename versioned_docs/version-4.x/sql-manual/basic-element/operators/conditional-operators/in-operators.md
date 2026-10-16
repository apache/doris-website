---
{
    "title": "In Operators",
    "language": "en",
    "description": "The IN operator tests whether a value is a member of a list of values or a subquery."
}
---

## Description

The IN operator tests whether a value is a member of a list of values or a subquery.

## Operator Introduction

| Operator | Function | Example |
| ------- | ------------------------------------------------ | ------------------------------ |
| IN     | Tests if it is equal to any member. Returns TRUE if so. | `SELECT 1 IN (SELECT 2)` |
| NOT IN | Tests if it is not equal to all members. Returns TRUE if so. | `SELECT 1 NOT IN (3, 4, 5)` |

## Type Constraints

`IN` and `NOT IN` support scalar primitive values only. Complex types such as `ARRAY`, `MAP`, and `STRUCT`, as well as object types, cannot be used as the left-hand expression or as values in the `IN` list.

For example, the following statements are invalid:

```sql
SELECT STRUCT(1, 2) IN (STRUCT(1, 2));
SELECT [1, 2] IN ([1, 2]);
SELECT MAP('a', 1) IN (MAP('a', 1));
```
