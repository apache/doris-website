---
{
    "title": "Operator Precedence",
    "language": "en"
}
---

## Description

Operator precedence determines the order in which operators are evaluated in an expression. When an expression contains multiple operators, Doris will perform calculations in descending order of operator precedence.

## Operator Precedence

The precedence decreases from top to bottom, with the highest precedence at the top.

| Precedence | Operator |
|------------|----------|
| 1          | !        |
| 2          | + (unary plus), - (unary minus), ~ (unary bitwise NOT), ^ |
| 3          | *, /, %, DIV |
| 4          | -, +     |
| 5          | &        |
| 6          | \|       |
| 7          | =(comparison), <=>, >=, >, <=, <, <>, !=, IS, LIKE, REGEXP, MATCH, IN |
| 8          | NOT      |
| 9          | AND, &&  |
| 10         | XOR      |
| 11         | OR       |
| 12         | \|\|     |