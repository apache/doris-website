---
{
    "title": "Exists Operators",
    "language": "en"
}
---

## Description

The EXISTS condition is used to test for the existence of rows in a subquery.

## Operator Introduction

| Operator | Function | Example |
| ------ | ------------------------------------------------------- | ------------------------------------------------------------ |
| EXISTS | Returns TRUE if the subquery returns at least one row of data | `SELECT department_id FROM departments d WHERE EXISTS (SELECT * FROM employees e WHERE d.department_id = e.department_id) ORDER BY department_id;` |