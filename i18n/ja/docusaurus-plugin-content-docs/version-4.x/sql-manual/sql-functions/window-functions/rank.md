---
{
    "title": "RANK",
    "language": "ja",
    "description": "RANK() は、並べ替えられたデータセット内の値の順位を返すウィンドウ関数です。順位は 1 から始まり、順に増加します。"
}
---

## 説明

RANK() は、並べ替えられたデータセット内の値の順位を返すウィンドウ関数です。順位は 1 から始まり、順に増加します。同じ値には同じ順位が付けられますが、その結果、順位に欠番が生じます。たとえば、最初の二行がともに 1 位の場合、次の異なる値には 3 位が付けられます（2 位ではありません）。

## 構文

```sql
RANK()
```

## 戻り値

BIGINT 型の順位を返します。同じ値には同じ順位を返しますが、順位に欠番が生じます。

## 例

<!-- setup-sql
CREATE TABLE employees (department VARCHAR(20), employee_name VARCHAR(20), salary INT) DISTRIBUTED BY HASH(employee_name) BUCKETS 1 PROPERTIES("replication_num"="1");
INSERT INTO employees VALUES ('Sales','Alice',10000),('Sales','Bob',10000),('Sales','Charlie',8000),('IT','David',12000),('IT','Eve',11000),('IT','Frank',11000),('IT','Grace',9000);
-->

```sql
SELECT 
    department,
    employee_name,
    salary,
    RANK() OVER (
        PARTITION BY department 
        ORDER BY salary DESC
    ) as salary_rank
FROM employees;
```

```text
+------------+---------------+--------+-------------+
| department | employee_name | salary | salary_rank |
+------------+---------------+--------+-------------+
| Sales      | Alice        | 10000  | 1           |
| Sales      | Bob          | 10000  | 1           |
| Sales      | Charlie      | 8000   | 3           |  -- Note this is 3, not 2
| IT         | David        | 12000  | 1           |
| IT         | Eve          | 11000  | 2           |
| IT         | Frank        | 11000  | 2           |
| IT         | Grace        | 9000   | 4           |  -- Note this is 4, not 3
+------------+---------------+--------+-------------+
```

この例では、データを部門ごとに分け、各部門内で給与に基づいて順位を付けています。Alice と Bob、Eve と Frank のように給与が同じ場合は同じ順位になり、それ以降の順位に欠番が生じます。
