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

### 递归 CTE

递归 CTE（Common Table Expression with `RECURSIVE`）用于在单条 SQL 内表达自引用的查询，常用于树/层级遍历、图遍历和分层聚合等场景。递归 CTE 由两部分组成：

- 锚点（anchor）查询：非递归部分，执行一次生成初始行集（seed）。
- 递归（recursive）查询：可以引用 CTE 本体，基于上轮产生的新行继续生成新行。

锚点与递归部分通常由 `UNION` 或 `UNION ALL` 连接。递归执行直到不再产生新行或达到系统限制。

## 语法

```sql
WITH [RECURSIVE] cte_name [(col1, col2, ...)] AS (
  <anchor_query>     -- 非递归部分（一次执行）
  UNION [ALL]
  <recursive_query>  -- 可引用 cte_name 的递归部分
)
SELECT ... FROM cte_name;
```

要点：

- `RECURSIVE` 关键字允许在 CTE 定义中引用自身。
- 锚点和递归成员输出的列数和类型必须严格一致。
- `recursive_query` 中能引用 `cte_name`，通常以 `JOIN`形式使用。

## 执行语义（迭代模型）

典型迭代执行流程：

1. 执行 `anchor_query`，将结果写入输出集合（Output）并作为首轮的工作集合（WorkSet）。
2. 当 WorkSet 非空时：
   - 用 WorkSet 作为 `recursive_query` 的输入，执行 `recursive_query`，得到 `newRows`。
   - 若使用 `UNION ALL`：直接将 `newRows` 追加到 Output，并把 `newRows` 作为下一轮的 WorkSet。
   - 若使用 `UNION`（去重）：对 `newRows` 与已有 Output 做差集（去重），只将未出现的行加入 Output 与下一轮 WorkSet。
3. 重复步骤 2，直到 `newRows` 为空或触发系统预设的上限（Doris session变量限制递归深度`cte_max_recursion_depth` 默认值为100，超出会抛错）。

终止当当前轮没有新行被产生（或达到系统最大递归深度限制）。

## UNION vs UNION ALL

- `UNION ALL`：保留重复，执行开销低（无需去重）。适用于允许重复或在后端由业务逻辑控制重复的场景。
- `UNION`：隐含去重，会在每轮或全局增加排序/哈希去重开销，代价显著，尤其是在大数据量下。

建议：如果语义允许且能在应用层后处理重复，优先使用 `UNION ALL`。

## 常见用例与 SQL 示例

1) 简单层级遍历：

```sql
CREATE TABLE tree
(
    id int,
    parent_id int,
    data varchar(100)
) DUPLICATE KEY (id)
DISTRIBUTED BY HASH(id) BUCKETS 1 PROPERTIES ('replication_num' = '1');

INSERT INTO tree VALUES (0, NULL, 'ROOT'), (1, 0, 'Child_1'), (2, 0, 'Child_2'), (3, 1, 'Child_1_1');

WITH RECURSIVE search_tree AS (
    SELECT id, parent_id, data
    FROM tree t
    WHERE t.id = 0
UNION ALL
    SELECT t.id, t.parent_id, t.data
    FROM tree t, search_tree st
    WHERE t.parent_id = st.id
)
SELECT * FROM search_tree order BY id;
```

2) 图遍历：

```sql
CREATE TABLE graph
(
    c_from int,
    c_to int,
    label varchar(100)
) DUPLICATE KEY (c_from) DISTRIBUTED BY HASH(c_from) BUCKETS 1 PROPERTIES 'replication_num' = '1');

INSERT INTO graph VALUES (1, 2, '1 -> 2'), (1, 3, '1 -> 3'), (2, 3, '2 -> 3'), (1, 4, '1 -> 4'), (4, 5, '4 -> 5');

WITH RECURSIVE search_graph AS (
    SELECT c_from, c_to, label FROM graph g
UNION ALL
    SELECT g.c_from, g.c_to, g.label
    FROM graph g, search_graph sg
    WHERE g.c_from = sg.c_to
)
SELECT DISTINCT * FROM search_graph ORDER BY c_from, c_to;
```

注意：使用 `UNION` 会在每轮做去重，代价较高。

## 递归CTE的限制

- 内部查询顶层操作符必须是UNION(ALL)。
- 非递归部分的子查询不能引用递归CTE自身。
- 递归部分的子查询只能引用递归CTE一次。
- 递归部分的子查询如果内部还有子查询，那内部的子查询不能引用递归CTE。
- 递归CTE的输出列类型由非递归侧的子查询输出决定，如果递归侧和非递归侧类型不一致，会报错。需要人工cast保证两边数据类型一致。
- session变量`cte_max_recursion_depth`，限制最大递归次数，防止死循环，默认值是100。

## 常见错误、原因与解决办法

1. 错误：锚点与递归成员列数或类型不匹配  
   - 原因：两部分 `SELECT` 列数或列类型不一致。  
   - 解决：确保两侧列数、顺序与类型一致，必要时使用 `CAST` 或显式列名。
2. 错误：锚点引用自身（非法）  
   - 原因：锚点不允许引用 CTE 本体。  
   - 解决：只在递归成员中引用 CTE；检查语法/解析树。
3. 错误：无限递归 / 超过最大递归深度  
   - 原因：递归没有收敛条件或收敛条件设置不正确。  
   - 解决：添加`WHERE` 过滤、或调整系统最大递归深度；若逻辑确实无限递归需修正查询逻辑。
