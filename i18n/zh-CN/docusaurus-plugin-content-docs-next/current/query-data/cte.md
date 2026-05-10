---
{
    "title": "公用表表达式（CTE）",
    "language": "zh-CN",
    "description": "Apache Doris CTE（公用表表达式）使用指南：通过 WITH 子句定义临时结果集，支持嵌套与递归 CTE，适用于层级遍历、图遍历等场景。",
    "keywords": [
        "Doris CTE",
        "公用表表达式",
        "WITH 子句",
        "递归 CTE",
        "RECURSIVE",
        "嵌套 CTE",
        "层级查询",
        "树形结构查询",
        "图遍历",
        "cte_max_recursion_depth"
    ]
}
---

<!-- 知识类型: 能力定义 + 语法参考 -->
<!-- 适用场景: 复杂查询编写 / 层级与图结构遍历 -->

公用表表达式（Common Table Expression，简称 CTE）是 Apache Doris 在 `SELECT` 语句中定义临时结果集的能力。通过 `WITH` 子句声明一次，便可在同一条 SQL 内多次引用，常用于简化复杂查询、消除重复子查询，以及表达层级与图遍历等自引用逻辑。

## 适用场景

<!-- 知识类型: 适用场景 -->

当遇到以下情况时，使用 CTE 通常会让 SQL 更清晰、更易维护：

- **同一子查询被多次引用**：将子查询命名为 CTE，避免在主查询中重复书写。
- **多层嵌套子查询难以阅读**：用多个 CTE 拆分逻辑，按步骤命名，提升可读性。
- **基于上一段结果再做计算**：通过嵌套 CTE，让后一个 CTE 直接引用前一个 CTE 的结果。
- **层级 / 树形结构遍历**：例如组织架构、分类目录、评论楼中楼，使用递归 CTE 一次性展开所有层级。
- **图结构可达性遍历**：例如从某个节点出发，沿边查找所有可达节点。

## 基本用法

### 语法概览

使用 `WITH` 子句定义一个或多个 CTE，多个 CTE 之间用逗号分隔，每个 CTE 关联一个名称和一个子查询：

```sql
WITH
    cte_name1 AS (subquery1),
    cte_name2 AS (subquery2)
SELECT ... FROM cte_name1 JOIN cte_name2 ON ...;
```

在包含 `WITH` 子句的语句中，可以引用每个 CTE 名称以访问对应的临时结果集。

### 简单 CTE 示例

下面的示例在 `WITH` 子句中定义了 `cte1` 和 `cte2`，并在外层 `SELECT` 中同时引用：

```sql
WITH
    cte1 AS (SELECT a, b FROM table1),
    cte2 AS (SELECT c, d FROM table2)
SELECT b, d FROM cte1 JOIN cte2
WHERE cte1.a = cte2.c;
```

### 嵌套 CTE

CTE 名称可以在其他 CTE 中被引用，因此可以基于已定义的 CTE 继续定义新的 CTE：

```sql
WITH
    cte1 AS (SELECT a, b FROM table1),
    cte2 AS (SELECT c, d FROM cte1)
SELECT b, d FROM cte1 JOIN cte2
WHERE cte1.a = cte2.c;
```

## 递归 CTE

<!-- 知识类型: 能力定义 + 语法参考 -->
<!-- 适用场景: 树/层级遍历、图遍历、分层聚合 -->

递归 CTE（带 `RECURSIVE` 关键字的 CTE）用于在单条 SQL 内表达自引用查询，常用于树/层级遍历、图遍历和分层聚合等场景。

### 语法

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
- `recursive_query` 中能引用 `cte_name`，通常以 `JOIN` 形式使用。

### 组成结构

递归 CTE 由两部分组成，二者通常通过 `UNION` 或 `UNION ALL` 连接：

| 组成部分 | 说明 |
|---|---|
| 锚点（anchor）查询 | 非递归部分，执行一次生成初始行集（seed） |
| 递归（recursive）查询 | 可以引用 CTE 本体，基于上一轮产生的新行继续生成新行 |

递归会持续执行，直到不再产生新行或达到系统限制。

### 执行语义（迭代模型）

<!-- 知识类型: 执行原理 -->

递归 CTE 的典型执行流程如下：

1. 执行 `anchor_query`，将结果写入输出集合（Output），并作为首轮的工作集合（WorkSet）。
2. 当 WorkSet 非空时，循环执行：
    - 用 WorkSet 作为 `recursive_query` 的输入，执行 `recursive_query`，得到 `newRows`。
    - 若使用 `UNION ALL`：直接将 `newRows` 追加到 Output，并把 `newRows` 作为下一轮的 WorkSet。
    - 若使用 `UNION`（去重）：对 `newRows` 与已有 Output 做差集（去重），只将未出现的行加入 Output 与下一轮 WorkSet。
3. 重复步骤 2，直到 `newRows` 为空，或触发系统预设的递归深度上限。

session 变量 `cte_max_recursion_depth` 控制最大递归深度，默认值为 100，超出会抛错。

### UNION vs UNION ALL

<!-- 知识类型: 选型对比 -->

| 写法 | 语义 | 性能 | 适用场景 |
|---|---|---|---|
| `UNION ALL` | 保留重复行 | 开销低（无需去重） | 允许重复，或在应用层后处理重复 |
| `UNION` | 隐含去重 | 每轮或全局增加排序 / 哈希去重开销，大数据量下代价显著 | 必须在数据库内部去重的场景 |

建议：如果语义允许并能在应用层后处理重复，优先使用 `UNION ALL`。

### 示例

#### 简单层级遍历

从根节点出发，递归遍历整棵树：

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
SELECT * FROM search_tree ORDER BY id;
```

#### 图遍历

沿着边的方向，遍历图中所有可达路径：

```sql
CREATE TABLE graph
(
    c_from int,
    c_to int,
    label varchar(100)
) DUPLICATE KEY (c_from) DISTRIBUTED BY HASH(c_from) BUCKETS 1 PROPERTIES ('replication_num' = '1');

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

注意：上例最终使用 `SELECT DISTINCT` 去重；如果在递归内部使用 `UNION` 去重，会在每一轮都做去重，代价较高。

## 递归 CTE 使用限制

<!-- 知识类型: 限制约束 -->

使用递归 CTE 时需要遵守以下约束：

- 内部查询的顶层操作符必须是 `UNION` 或 `UNION ALL`。
- 非递归部分的子查询不能引用递归 CTE 自身。
- 递归部分的子查询只能引用递归 CTE 一次。
- 递归部分的子查询如果内部还有子查询，那内部的子查询不能引用递归 CTE。
- 递归 CTE 的输出列类型由非递归侧的子查询输出决定；如果递归侧和非递归侧类型不一致，会报错，需要人工 `CAST` 保证两边数据类型一致。
- session 变量 `cte_max_recursion_depth` 限制最大递归次数，防止死循环，默认值是 100。

## 常见错误与排查

<!-- 知识类型: Troubleshooting -->
<!-- 适用场景: 编写递归 CTE 时调试 -->

| 错误现象 | 可能原因 | 解决办法 |
|---|---|---|
| 锚点与递归成员列数或类型不匹配 | 两部分 `SELECT` 列数或列类型不一致 | 确保两侧列数、顺序与类型一致，必要时使用 `CAST` 或显式列名 |
| 锚点引用自身（非法） | 锚点不允许引用 CTE 本体 | 只在递归成员中引用 CTE；检查语法 / 解析树 |
| 无限递归 / 超过最大递归深度 | 递归没有收敛条件或收敛条件设置不正确 | 添加 `WHERE` 过滤，或调整系统最大递归深度；若逻辑确实无限递归需修正查询逻辑 |

## 参考资料

- [MySQL 递归 CTE 手册](https://dev.mysql.com/doc/refman/8.4/en/with.html#common-table-expressions-recursive)：递归 CTE 的标准定义与示例。
