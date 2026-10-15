---
{
    "title": "EXISTS 演算子",
    "language": "ja",
    "description": "EXISTS 条件は、サブクエリに行が存在するかどうかを判定します。"
}
---

## 説明

EXISTS 条件は、サブクエリに行が存在するかどうかを判定します。

## 演算子の概要

| 演算子 | 機能 | 例 |
| ------ | ------------------------------------------------------- | ------------------------------------------------------------ |
| EXISTS | サブクエリが一行以上返す場合は TRUE を返します | `SELECT department_id FROM departments d WHERE EXISTS (SELECT * FROM employees e WHERE d.department_id = e.department_id) ORDER BY department_id;` |