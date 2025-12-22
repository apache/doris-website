---
{
    "title": "公用表表达式（CTE）",
    "language": "zh-CN",
    "description": "公用表表达式（Common Table Expression）定义一个临时结果集，你可以在 SQL 语句的范围内多次引用。CTE 主要用于 SELECT 语句中。"
}
---

## 描述

公用表表达式（Common Table Expression）定义一个临时结果集，你可以在 SQL 语句的范围内多次引用。CTE 主要用于 SELECT 语句中。

要指定公用表表达式，请使用 `WITH` 具有一个或多个逗号分隔子句的子句。每个子句都提供一个子查询，用于生成结果集，并将名称与子查询相关联。

Doris 支持嵌套 CTE。在包含该 `WITH`子句 的语句中，可以引用每个 CTE 名称以访问相应的 CTE 结果集。CTE 名称可以在其他 CTE 中引用，从而可以基于其他 CTE 定义 CTE。

Doris **不支持** 递归 CTE。有关递归 CTE 的详细解释，可以参考 [MySQL 递归 CTE 手册](https://dev.mysql.com/doc/refman/8.4/en/with.html#common-table-expressions-recursive)

## 示例

### 简单示例

下面的示例定义名为的 CTE `cte1` 和 `cte2` 中 `WITH` 子句，并且是指在它们的顶层 `SELECT` 下面的 `WITH` 子句：

```sql
WITH
  cte1 AS (SELECT a，b FROM table1)，
  cte2 AS (SELECT c，d FROM table2)
SELECT b，d FROM cte1 JOIN cte2
WHERE cte1.a = cte2.c;
```

### 嵌套 CTE

```sql
WITH
  cte1 AS (SELECT a, b FROM table1),
  cte2 AS (SELECT c, d FROM cte1)
SELECT b, d FROM cte1 JOIN cte2
WHERE cte1.a = cte2.c;
```

### 递归 CTE（Doris 不支持）

```sql
WITH r_cte AS (
  SELECT 1 AS user_id, 2 as manager_id
  UNION ALL
  SELECT user_id, manager_id FROM r_cte INNER JOIN (SELECT 1 AS user_id, 2 as manager_id) t ON r_cte.manager_id = t.user_id
)
SELECT * FROM r_cte
