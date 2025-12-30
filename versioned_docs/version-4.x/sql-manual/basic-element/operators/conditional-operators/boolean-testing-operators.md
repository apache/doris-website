---
{
    "title": "Boolean Testing Operators",
    "language": "en",
    "description": "This operator is used exclusively to check for TRUE, FALSE, or NULL. For an introduction to NULL, please refer to the \"Nulls\" section."
}
---

## Description

This operator is used exclusively to check for TRUE, FALSE, or NULL. For an introduction to NULL, please refer to the "Nulls" section.

## Operator Introduction

| Operator | Function | Example |
| -------------------- | ------------------------------------------------------------ | ------------------------ |
| `x IS [NOT] TRUE` | Checks if x is TRUE. Returns TRUE if x is TRUE, otherwise returns FALSE. | `SELECT 1 IS NOT TRUE` |
| `x IS [NOT] FALSE` | Checks if x is FALSE. Returns TRUE if x is FALSE, otherwise returns FALSE. | `SELECT 1 IS NOT FALSE` |
| `x IS [NOT] NULL` | Checks if x is NULL. Returns TRUE if x is NULL, otherwise returns FALSE. | `SELECT 1 IS NOT NULL` |