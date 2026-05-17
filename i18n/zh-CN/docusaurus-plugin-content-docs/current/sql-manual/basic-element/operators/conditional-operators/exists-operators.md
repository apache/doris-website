---
{
    "title": "EXISTS 操作符",
    "language": "zh-CN",
    "description": "EXISTS 条件用于测试子查询中行的存在性。"
}
---

## 描述

EXISTS 条件用于测试子查询中行的存在性。

## 操作符介绍

| 操作符 | 作用                                    | 示例                                                         |
| ------ | --------------------------------------- | ------------------------------------------------------------ |
| EXISTS | 如果子查询返回至少一条数据，则返回 TRUE | `SELECT department_id  FROM departments d  WHERE EXISTS  (SELECT * FROM employees e    WHERE d.department_id    = e.department_id)   ORDER BY department_id;` |