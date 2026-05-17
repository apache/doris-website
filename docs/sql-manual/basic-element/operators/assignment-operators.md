---
{
    "title": "Assignment Operators",
    "language": "en",
    "description": "The function of the assignment operator is to assign the expression on the right-hand side of the operator to the expression on the left-hand side."
}
---

## Description

The function of the assignment operator is to assign the expression on the right-hand side of the operator to the expression on the left-hand side. In Doris, the assignment operator can only be used in the SET part of the UPDATE statement and in the SET statement. For details, please refer to the [UPDATE](../../sql-statements/data-modification/DML/UPDATE.md) statement and the [SET](../../sql-statements/session/variable/SET-VARIABLE.md) statement.

## Operators

| Operator | Purpose | Example |
|----------|---------|---------|
| <x> = <y> | Assign the result of <y> to <x>. | `SET enable_profile = true` |