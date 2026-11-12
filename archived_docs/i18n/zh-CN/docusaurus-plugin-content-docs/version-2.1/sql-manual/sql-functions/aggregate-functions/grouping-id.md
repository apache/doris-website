---
{
    "title": "GROUPING_ID",
    "language": "zh-CN",
    "description": "GROUPINGID 是一个用于计算分组层级的函数。当 SQL 语句中使用了 GROUP BY 子句时，该函数可以在 SELECT、HAVING 或 ORDER BY 子句中使用，返回一个 BIGINT 值，该值表示各分组列聚合情况对应的二进制位图转换为十进制后的结果。"
}
---

## 描述

GROUPING_ID 是一个用于计算分组层级的函数。当 SQL 语句中使用了 GROUP BY 子句时，该函数可以在 SELECT、HAVING 或 ORDER BY 子句中使用，返回一个 BIGINT 值，该值表示各分组列聚合情况对应的二进制位图转换为十进制后的结果。

## 语法

```sql
GROUPING_ID ( <column_expression>[ ,...n ] )
```

## 参数

| 参数                  | 说明                                           |
|-----------------------|------------------------------------------------|
| `<column_expression>` | 在 GROUP BY 子句中包含的列或表达式，可以指定多个参数。 |

## 返回值

返回一个 BIGINT 值，表示各分组列的聚合情况对应的二进制位图转换为十进制后的结果。

## 示例

### 示例 A: 识别分组层级

下面的例子按部门和职级统计雇员人数，并使用 GROUPING_ID 函数计算每一行的聚合程度。

```sql
SELECT
  department,
  CASE 
    WHEN GROUPING_ID(department, level) = 0 THEN level
    WHEN GROUPING_ID(department, level) = 1 THEN CONCAT('Total: ', department)
    WHEN GROUPING_ID(department, level) = 3 THEN 'Total: Company'
    ELSE 'Unknown'
  END AS 'Job Title',
  COUNT(uid) AS 'Employee Count'
FROM employee 
GROUP BY ROLLUP(department, level)
ORDER BY GROUPING_ID(department, level) ASC;
```


```text
+--------------------+---------------------------+----------------+
| department         | Job Title                 | Employee Count |
+--------------------+---------------------------+----------------+
| Board of Directors | Senior                    |              2 |
| Technology         | Senior                    |              3 |
| Sales              | Senior                    |              1 |
| Sales              | Assistant                 |              2 |
| Sales              | Trainee                   |              1 |
| Marketing          | Senior                    |              1 |
| Marketing          | Trainee                   |              2 |
| Marketing          | Assistant                 |              1 |
| Board of Directors | Total: Board of Directors |              2 |
| Technology         | Total: Technology         |              3 |
| Sales              | Total: Sales              |              4 |
| Marketing          | Total: Marketing          |              4 |
| NULL               | Total: Company            |             13 |
+--------------------+---------------------------+----------------+
```

### 示例 B: 过滤结果集

下面的例子返回部门中级别为 "Senior" 的雇员统计数据。

```sql
SELECT
  department,
  CASE 
    WHEN GROUPING_ID(department, level) = 0 THEN level
    WHEN GROUPING_ID(department, level) = 1 THEN CONCAT('Total: ', department)
    WHEN GROUPING_ID(department, level) = 3 THEN 'Total: Company'
    ELSE 'Unknown'
  END AS 'Job Title',
  COUNT(uid)
FROM employee 
GROUP BY ROLLUP(department, level)
HAVING `Job Title` IN ('Senior');
```


```text
+--------------------+-----------+--------------+
| department         | Job Title | count(`uid`) |
+--------------------+-----------+--------------+
| Board of Directors | Senior    |            2 |
| Technology         | Senior    |            3 |
| Sales              | Senior    |            1 |
| Marketing          | Senior    |            1 |
+--------------------+-----------+--------------+
```