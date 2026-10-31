---
{
    "title": "赋值操作符",
    "language": "zh-CN",
    "description": "赋值操作符的作用是，将操作符右侧的表达式，赋给左侧的表达式。在 Doris 中，赋值操作符只能在 UPDATE 语句的 SET 部分，以及 SET 语句中使用。详细请参考 UPDATE 语句和 SET 语句。"
}
---

## 描述

赋值操作符的作用是，将操作符右侧的表达式，赋给左侧的表达式。在 Doris 中，赋值操作符只能在 UPDATE 语句的 SET 部分，以及 SET 语句中使用。详细请参考 [UPDATE 语句](../../sql-statements/data-modification/DML/UPDATE.md)和 [SET 语句](../../sql-statements/session/variable/SET-VARIABLE.md)。

## 操作符介绍

| 操作符    | 作用                      | 示例                        |
| --------- | ------------------------- | --------------------------- |
| <x> = <y> | 将 <y> 的结果赋值给 <x>。 | `SET enable_profile = true` |
