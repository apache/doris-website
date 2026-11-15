---
{
    "title": "相关性打分",
    "language": "zh-CN",
    "description": "Doris 全文检索通过 BM25 算法为查询结果计算相关性得分，结合词频、逆文档频率与记录长度进行加权排序，帮助用户优先返回最相关内容。"
}
---

<!-- 知识类型: 功能特性 / 查询用法 -->
<!-- 适用场景: 全文检索结果排序 / 搜索相关性优化 -->

在执行全文检索类查询（如 `MATCH_ANY`、`MATCH_ALL`、`MATCH_PHRASE` 等）时，往往需要按"匹配程度"对结果进行排序，从而优先返回最相关的记录。Doris 提供了 **相关性打分（Relevance Scoring）** 能力：每一行都会根据查询条件计算一个数值化的得分，分数越高表示相关性越强。

当前 Doris 使用 **BM25（Best Matching 25）** 算法作为相关性打分的默认实现。

**典型使用场景：**

- 搜索引擎类应用：根据关键词返回最相关的文档列表
- 日志分析：按相关性排序，快速定位与关键词最匹配的日志
- 内容推荐：基于文本相似度筛选优先内容
- 知识库检索：按问题相关度返回候选答案

## 快速上手

以下示例展示了如何在查询中启用相关性打分并按得分排序：

```sql
SELECT *,
       score() AS relevance
FROM search_demo
WHERE content MATCH_ANY 'text search test'
ORDER BY relevance DESC
LIMIT 10;
```

执行后，Doris 会基于 BM25 算法计算每一行的得分，并返回前 10 条最相关的记录：

```text
+------+-----------------------------------+---------+--------------+-----------+
| id   | content                           | author  | publish_date | relevance |
+------+-----------------------------------+---------+--------------+-----------+
|    1 | Full text search engine test demo | Alice   | 2024-01-01   |  2.915228 |
|    7 | Text processing techniques        | Grace   | 2024-01-07   |  1.341931 |
|    5 | Performance test framework        | Eve     | 2024-01-05   |  1.341931 |
|    3 | Advanced search algorithms        | Charlie | 2024-01-03   |  1.341931 |
+------+-----------------------------------+---------+--------------+-----------+
```

## 启用条件

在当前开发版本中，计算 `score()` 的 `SELECT` 必须读取一张 Doris 内表，并在自身的 `WHERE` 子句中包含至少一个 `MATCH_*` 或 `SEARCH` 条件。不支持在该 `SELECT` 中使用 JOIN、子查询或 LATERAL VIEW。

对于最外层的非聚合 `SELECT`，`score()` 可以出现在查询列表、窗口函数和 `ORDER BY` 中，`ORDER BY` 和 `LIMIT` 均为可选项。对于包含 `GROUP BY`、聚合函数或 `DISTINCT` 的查询，`score()` 只能作为 `WHERE` 中的最低得分过滤条件。

位于子查询、视图、CTE 或集合运算中的打分 `SELECT` 仍需按自身的得分排序并设置 `LIMIT`。相关子查询不能调用 `score()`。快速上手中的 Top-N 写法仍然适用。

### 按相关性得分过滤

先准备一张带英文分词倒排索引的独立示例表。执行以下语句需要建库、建表、导入和查询权限：

```sql
CREATE DATABASE IF NOT EXISTS score_filter_example;
USE score_filter_example;

CREATE TABLE score_filter_demo (
    id BIGINT,
    content TEXT,
    INDEX idx_content (content) USING INVERTED
        PROPERTIES("parser" = "english", "support_phrase" = "true")
)
DUPLICATE KEY(id)
DISTRIBUTED BY HASH(id) BUCKETS 1
PROPERTIES ("replication_num" = "1");

INSERT INTO score_filter_demo VALUES
(1, 'Full text search engine test demo'),
(2, 'Database performance analysis'),
(3, 'Search engine examples');
```

从 Doris 4.0.4 开始，可以直接在 `WHERE` 中按最低得分过滤。以下 Top-N 写法适用于 Doris 4.0.4 及后续版本：

```sql
SELECT *, score() AS relevance
FROM score_filter_demo
WHERE content MATCH_ANY 'text search test'
  AND score() > 5
ORDER BY relevance DESC
LIMIT 10;
```

此查询按得分从高到低返回最多 10 条得分大于 5 的匹配记录；没有匹配记录达到阈值时，返回空结果。得分取决于查询和数据集，5 只是示例阈值。

在 `WHERE` 中直接使用 `score()`，在 `ORDER BY` 中使用查询列表里的得分别名。直接过滤仅支持一个最低得分条件，即 `score() > <threshold>` 或 `score() >= <threshold>`，阈值需为数值常量。如需兼容已发布的 4.x 版本，请使用数值字面量。请用 `AND` 将得分条件与检索条件组合。不支持得分上限（`<`、`<=`）、等值（`=`）、多个得分条件，或嵌套在 `OR` 中的得分条件。

#### 开发版本中不带 Top-N 的过滤

在当前开发版本中，最外层单表 `SELECT` 可以省略 `ORDER BY` 和 `LIMIT`，直接按得分过滤：

```sql
SELECT id, content, score() AS relevance
FROM score_filter_demo
WHERE content MATCH_ANY 'text search test'
  AND score() > 5;
```

此查询返回全部得分大于 5 的匹配记录，不限定顺序和返回条数。位于子查询、视图、CTE 或集合运算中的打分 `SELECT` 仍需在自身内部按得分排序并设置 `LIMIT`。

#### Doris 4.0.0～4.0.3 的兼容写法

Doris 4.0.0～4.0.3 不允许在 `WHERE` 中使用 `score()`。在这些版本中，请先在子查询中获取数量受限的打分候选结果，并将 `MATCH_*` 条件、按得分别名的 `ORDER BY` 和 `LIMIT` 都放在该子查询内，再在外层查询中按别名过滤：

```sql
SELECT a.*
FROM (
    SELECT *, score() AS relevance
    FROM score_filter_demo
    WHERE content MATCH_ANY 'text search test'
    ORDER BY relevance DESC
    LIMIT 1000
) AS a
WHERE a.relevance > 5
ORDER BY a.relevance DESC
LIMIT 10;
```

此查询从得分最高的 1000 条候选记录中返回最多 10 条得分大于 5 的记录；候选记录均未达到阈值时，返回空结果。应按应用需求选择候选数量；该写法过滤的是候选结果集，而不是返回全部得分超过阈值的匹配记录。

在 Doris 4.0.0～4.0.3 中，请保留内层 `LIMIT`：缺少它时，子查询不再具备所需的 Top-N 结构，优化器可能将外层得分条件移入计算得分的查询。仅在外层设置 `ORDER BY` 和 `LIMIT` 不能替代内层 Top-N 操作。

### 支持的索引类型

| 索引类型         | 是否支持打分 | 说明                       |
| ---------------- | ------------ | -------------------------- |
| 分词型倒排索引   | 支持         | 可计算 BM25 相关性得分     |
| 非分词型倒排索引 | 不支持       | 仅支持精确匹配，不计算打分 |

### 支持的查询类型

- `MATCH_ANY`
- `MATCH_ALL`
- `MATCH_PHRASE`
- `MATCH_PHRASE_PREFIX`
- `SEARCH`

## BM25 算法说明

BM25 是一种基于概率模型的文本相关性算法。它综合考虑 **词频（TF）**、**逆文档频率（IDF）** 与 **记录长度** 三个因子，对匹配结果进行加权计算。相比传统 TF-IDF 模型，BM25 具有更好的鲁棒性与可调性，能够有效平衡长文本与短文本之间的得分差异。

### 核心公式

```text
score = IDF × (tf × (k1 + 1)) / (tf + k1 × (1 - b + b × |d| / avgdl))
```

公式中各变量的含义：

| 变量      | 含义                                   |
| --------- | -------------------------------------- |
| `tf`      | 查询词在当前行中的出现次数             |
| `IDF`     | 逆文档频率，衡量词的稀有程度           |
| `\|d\|`   | 当前行的长度（分词后的词元数）         |
| `avgdl`   | 表中所有行的平均长度                   |
| `k1`、`b` | 算法调节参数                           |

### 参数说明

| 参数    | 默认值 | 说明                       |
| ------- | ------ | -------------------------- |
| `k1`    | 1.2    | 控制词频对得分的影响程度   |
| `b`     | 0.75   | 控制记录长度归一化的强度   |
| `boost` | 1.0    | 查询级别的权重因子         |

### 辅助统计量

```text
IDF   = log(1 + (N - n + 0.5) / (n + 0.5))
avgdl = total_terms / total_rows
```

其中：

- `N`：表中总行数
- `n`：包含该查询词的行数

当查询包含多个词项时，**最终得分为各词项得分之和**。

### 记录长度与 `norms` 属性

`norms` 索引属性和 `inverted_index_skip_norms_for_variant` BE 配置项自 Doris 4.1.5 起支持。

`|d|` 来自 norms，每个索引字段每行占 1 字节，包括该字段没有值的行。分词索引默认写入 norms（`"norms" = "true"`），非分词索引不写。仅用于过滤的索引可设置 `"norms" = "false"` 节省空间：

```sql
INDEX idx_content(content) USING INVERTED PROPERTIES("parser" = "english", "norms" = "false")
```

VARIANT 子路径继承索引的 `norms` 属性，空间开销为 `行数 × 路径数` 字节。BE 配置项 `inverted_index_skip_norms_for_variant`（默认 `false`，可动态修改）设为 `true` 时，所有 VARIANT 路径索引都不写 norms，优先于索引属性。

关闭 norms 不影响 `MATCH_*` 过滤，但 `score()` 读到任一缺少 norms 的段时会报错。该属性和配置项只影响新写入的段；已有段在 compaction 重写前保持不变。修改前须将所有 BE 升级到支持它们的版本。

## 结果解读

理解打分结果有助于更准确地使用相关性排序：

| 特征       | 说明                                                       |
| ---------- | ---------------------------------------------------------- |
| 得分范围   | 正数，无固定上限；通常仅比较相对大小，不关注绝对数值       |
| 多词查询   | 包含多个词项时，总得分等于各词项得分之和                   |
| 长度影响   | 在包含相同词项的前提下，较短的记录得分略高                 |
| 无匹配词项 | 若查询词未在表中出现，对应得分为 0                         |

## 常见问题

**Q1：为什么我的查询没有返回打分？**

请依次确认：

1. 需要输出得分时，是否在 `SELECT` 查询列表中调用了 `score()`
2. 同一个 `SELECT` 是否读取一张内表，并在 `WHERE` 中包含 `MATCH_*` 或 `SEARCH` 条件
3. 打分 `SELECT` 位于子查询、视图、CTE 或集合运算中时，是否在自身内部按得分排序并设置 `LIMIT`
4. 索引是否为分词型倒排索引

**Q2：BM25 与 TF-IDF 有什么区别？**

BM25 在 TF-IDF 的基础上引入了 **词频饱和** 与 **长度归一化** 两个改进，使长短文本间的得分更加均衡，鲁棒性更好。

**Q3：得分可以跨查询比较吗？**

不建议。BM25 得分依赖具体查询词及表中数据的分布，不同查询之间的绝对值不具备可比性，**仅在同一查询的结果集内比较相对大小**。
