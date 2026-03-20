---
{
  "title": "Exists演算子",
  "description": "EXISTS条件は、サブクエリ内の行の存在をテストするために使用されます。",
  "language": "ja"
}
---
## 説明

EXISTS条件は、サブクエリ内の行の存在をテストするために使用されます。

## オペレーター紹介

| オペレーター | 機能 | 例 |
| ------ | ------------------------------------------------------- | ------------------------------------------------------------ |
| EXISTS | サブクエリが少なくとも1行のデータを返す場合にTRUEを返します | `SELECT department_id FROM departments d WHERE EXISTS (SELECT * FROM employees e WHERE d.department_id = e.department_id) ORDER BY department_id;` |
