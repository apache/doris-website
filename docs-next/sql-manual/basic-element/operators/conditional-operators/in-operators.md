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