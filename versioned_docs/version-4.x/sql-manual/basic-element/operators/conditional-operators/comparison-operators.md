---
{
    "title": "Comparison Operators",
    "language": "en",
    "description": "Comparison conditions compare one expression with another. The result of the comparison can be TRUE, FALSE, or UNKNOWN."
}
---

## Description

Comparison conditions compare one expression with another. The result of the comparison can be TRUE, FALSE, or UNKNOWN.

## Operator Introduction

| Operator | Function | Example |
| ------------------- | ----------------------------------------------------------- | ------------------- |
| `=` | Equality comparison. If either side of the comparison is UNKNOWN, the result is UNKNOWN. | `SELECT 1 = 1` |
| `<=>` | NULL-safe equality comparison. Unlike equality comparison, NULL-safe equality treats NULL as a comparable value. Returns TRUE when both sides are NULL. Returns FALSE when only one side is NULL. This operator never returns UNKNOWN. | `SELECT NULL <=> NULL` |
| `!=` `<>` | Inequality comparison | `SELECT 1 != 1` |
| `<` `>` | Greater than and less than comparison | `SELECT 1 > 1` |
| `<=` `>=` | Greater than or equal to and less than or equal to comparison | `SELECT 1 >= 1` |
| `<x> BETWEEN <y> AND <z>` | Equivalent to `<x> >= <y> and <x> <= <z>`. Greater than or equal to `<y>` and less than or equal to `<z>` | `SELECT 1 BETWEEN 0 AND 2` |