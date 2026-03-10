---
{
  "title": "Exists演算子",
  "language": "ja",
  "description": "EXISTS条件は、サブクエリ内での行の存在をテストするために使用されます。"
}
---
## 説明

EXISTS条件は、サブクエリ内の行の存在をテストするために使用されます。

## 演算子の紹介

| 演算子 | 機能 | 例 |
| ------ | ------------------------------------------------------- | ------------------------------------------------------------ |
| EXISTS | サブクエリが少なくとも1行のデータを返す場合にTRUEを返す | `SELECT department_id FROM departments d WHERE EXISTS (SELECT * FROM employees e WHERE d.department_id = e.department_id) ORDER BY department_id;` |
