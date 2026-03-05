---
{
    "title": "RANK",
    "language": "zh-CN",
    "description": "RANK() 是一个窗口函数，用于返回有序数据集中值的排名。排名从 1 开始按顺序递增。当出现相同值时，这些值获得相同的排名，但会导致排名序列出现间隔。例如，如果前两行并列排名第 1，则下一个不同的值将排名第 3（而不是第 2）。 如果未显示指定窗口，"
}
---

## 描述

RANK() 是一个窗口函数，用于返回有序数据集中值的排名。排名从 1 开始按顺序递增。当出现相同值时，这些值获得相同的排名，但会导致排名序列出现间隔。例如，如果前两行并列排名第 1，则下一个不同的值将排名第 3（而不是第 2）。
如果未显示指定窗口，会隐式生成`RANGE BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW` 类型，且当前仅支持此类。


## 语法

```sql
RANK()
```

## 返回值

返回 BIGINT 类型的排名值。对于相同的值返回相同的排名，但会在序列中产生间隔。

## 举例

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
| Sales      | Charlie      | 8000   | 3           |  -- 注意这里是 3 而不是 2
| IT         | David        | 12000  | 1           |
| IT         | Eve          | 11000  | 2           |
| IT         | Frank        | 11000  | 2           |
| IT         | Grace        | 9000   | 4           |  -- 注意这里是 4 而不是 3
+------------+---------------+--------+-------------+
```

在这个例子中，数据按部门分区，并在每个部门内根据工资进行排名。当出现相同工资时（如 Alice 和 Bob、Eve 和 Frank），它们获得相同的排名，但会导致后续排名出现间隔。
