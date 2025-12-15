---
{
    "title": "Logic Operators",
    "language": "en"
}
---

## Description

Logical conditions combine the results of two components' conditions to generate a single result based on them, or to invert the result of a condition.

## Operator Introduction

| Operator | Function                                                      | Example                |
| ------- | ------------------------------------------------------------ | ---------------------- |
| NOT    | Returns TRUE if the following condition is FALSE. Returns FALSE if TRUE. If it is UNKNOWN, it remains UNKNOWN. | `SELECT NOT (TRUE)`     |
| AND    | Returns TRUE if both components' conditions are TRUE. Returns FALSE if either is FALSE. Otherwise, returns UNKNOWN. | `SELECT TRUE AND FALSE` |
| OR     | Returns TRUE if either component's condition is TRUE. Returns FALSE if both are FALSE. Otherwise, returns UNKNOWN. | `SELECT TRUE OR NULL`  |

## Truth Tables

### NOT Truth Table

|       | TRUE   | FALSE | UNKNOWN |
| :----  | :------ | :------ |
| NOT    | FALSE  | TRUE   | UNKNOWN |

### AND Truth Table

| AND      | TRUE    | FALSE | UNKNOWN |
| :------ | :------ | :---- | :------ |
| TRUE    | TRUE    | FALSE | UNKNOWN |
| FALSE   | FALSE   | FALSE | FALSE   |
| UNKNOWN | UNKNOWN | FALSE | UNKNOWN |

### OR Truth Table

| OR       | TRUE | FALSE   | UNKNOWN |
| :------ | :--- | :------ | :------ |
| TRUE    | TRUE | TRUE    | TRUE    |
| FALSE   | TRUE | FALSE   | UNKNOWN |
| UNKNOWN | TRUE | UNKNOWN | UNKNOWN |