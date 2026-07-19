---
{
    "title": "GROUPING_ID",
    "language": "zh-CN",
    "description": "GROUPINGID 是一个用于计算分组层级的函数。当 SQL 语句中使用了 GROUP BY 子句时，该函数可以在 SELECT 或 HAVING 子句中使用，返回一个 BIGINT 值，该值表示各分组列聚合情况对应的二进制位图转换为十进制后的结果。"
}
---

## 描述

GROUPING_ID 是一个用于计算分组层级的函数。当 SQL 语句中使用了 GROUP BY 子句时，该函数可以在 SELECT 或 HAVING 子句中使用，返回一个 BIGINT 值，该值表示各分组列聚合情况对应的二进制位图转换为十进制后的结果。

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

### 示例 A: 过滤结果集

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
