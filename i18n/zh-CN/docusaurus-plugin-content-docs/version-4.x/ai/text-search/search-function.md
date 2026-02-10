---
{
    "title": "SEARCH 函数",
    "language": "zh-CN",
    "description": "SEARCH 函数为 Apache Doris 4.0版本开始提供的统一的全文检索查询入口。它以简洁的 DSL（领域特定语言）描述查询条件，并基于倒排索引高效执行。"
}
---

## 概述

`SEARCH` 函数为 Apache Doris 4.0版本开始提供的统一的全文检索查询入口。它以简洁的 DSL（领域特定语言）描述查询条件，并基于倒排索引高效执行。


SEARCH 是一个返回布尔值的谓词函数，可作为过滤条件出现在 `WHERE`中。它接收一个 SEARCH DSL 字符串用于描述文本匹配规则，并将可匹配条件下推至倒排索引执行。


## 语法与语义

语法

```sql
SEARCH('<search_expression>')
SEARCH('<search_expression>', '<default_field>')
SEARCH('<search_expression>', '<default_field>', '<default_operator>')
```

- `<search_expression>`：SEARCH DSL 查询表达式（字符串字面量）
- `<default_field>`（可选）：当 DSL 中的词项未显式指定字段时自动套用的列名。
- `<default_operator>`（可选）：多词项表达式默认布尔运算符，仅接受 `and` 或 `or`（不区分大小写），默认为 `or`。

用法

- 位置：用于 `WHERE`，作为谓词参与行过滤。
- 返回类型：BOOLEAN（匹配为 TRUE）。

提供 `default_field` 后，Doris 会把裸词项或函数自动扩展到该字段。例如 `SEARCH('foo bar', 'tags', 'and')` 等价于 `SEARCH('tags:ALL(foo bar)')`，而 `SEARCH('foo bark', 'tags')` 会展开为 `tags:ANY(foo bark)`。DSL 中显式出现的布尔操作优先级最高，会覆盖默认运算符。

`SEARCH()` 遵循 SQL 三值逻辑。当所有参与匹配的列值均为 NULL 时结果为 UNKNOWN（在 `WHERE` 中被过滤），但若与其他子表达式组合，可按布尔短路原则返回 TRUE 或继续保留 NULL（例如 `TRUE OR NULL = TRUE`、`FALSE OR NULL = NULL`、`NOT NULL = NULL`），行为与文本检索算子保持一致。

### 当前支持语法

#### 词项查询
- 语法：`column:term`
- 语义：在列的分词结果中匹配该词项；是否区分大小写取决于索引属性 `lower_case`
- 索引建议：为该列创建带合适 `parser`/`analyzer` 的倒排索引
```sql
SELECT id, title FROM search_test_basic WHERE SEARCH('title:Machine');
SELECT id, title FROM search_test_basic WHERE SEARCH('title:Python');
SELECT id, title FROM search_test_basic WHERE SEARCH('category:Technology');
```

#### ANY 查询
- 语法：`column:ANY(term1 term2 ...)`
- 语义：列的分词结果中包含列表里任意一个词项即可（OR 语义）；顺序无关，重复词忽略
- 索引建议：为该列创建分词倒排索引（如 `english`/`chinese`/`unicode`）
```sql
SELECT id, title FROM search_test_basic WHERE SEARCH('tags:ANY(python javascript)');
SELECT id, title FROM search_test_basic WHERE SEARCH('tags:ANY(machine learning tutorial)');

-- 边界：单值 ANY 等价于词项查询
SELECT id, title FROM search_test_basic WHERE SEARCH('tags:ANY(python)');
```

#### ALL 查询
- 语法：`column:ALL(term1 term2 ...)`
- 语义：列的分词结果中同时包含列表里所有词项（AND 语义）；顺序无关，重复词忽略
- 索引建议：为该列创建分词倒排索引（如 `english`/`chinese`/`unicode`）
```sql
SELECT id, title FROM search_test_basic WHERE SEARCH('tags:ALL(machine learning)');
SELECT id, title FROM search_test_basic WHERE SEARCH('tags:ALL(programming tutorial)');

-- 边界：单值 ALL 等价于词项查询
SELECT id, title FROM search_test_basic WHERE SEARCH('tags:ALL(python)');
```

#### 布尔操作
- 语法：`(expr) AND/OR/NOT (expr)`
- 语义：在 SEARCH 内用 `AND`、`OR`、`NOT` 组合子表达式
- 索引建议：尽量将可匹配条件写入 SEARCH 内部以获得索引下推；其他 WHERE 条件作为过滤
```sql
SELECT id, title FROM search_test_basic
WHERE SEARCH('title:Machine AND category:Technology');

SELECT id, title FROM search_test_basic
WHERE SEARCH('title:Python OR title:Data');

SELECT id, title FROM search_test_basic
WHERE SEARCH('category:Technology AND NOT title:Machine');
```

#### 复杂嵌套表达式
- 语法：使用括号对表达式分组（例如：`(expr1 OR expr2) AND expr3`）
- 语义：通过括号控制布尔优先级，支持多层嵌套
- 索引建议：同上
```sql
SELECT id, title FROM search_test_basic
WHERE SEARCH('(title:Machine OR title:Python) AND category:Technology');

SELECT id, title FROM search_test_basic
WHERE SEARCH('tags:ANY(python javascript) AND (category:Technology OR category:Programming)');
```

#### 词组查询
- 语法：`column:"quoted phrase"`
- 语义：根据列的分析器匹配连续且有序的词项，需使用双引号包裹完整短语。
- 索引建议：目标列必须使用带位置信息的分词倒排索引（配置 `parser`）。
```sql
SELECT id, title FROM search_test_basic
WHERE SEARCH('content:"machine learning"');
```

#### 多列搜索
- 语法：`column1:term OR column2:ANY(...) OR ...`
- 语义：在单条表达式中跨多列匹配；每列按其索引/分词配置生效
- 索引建议：为涉及到的每一列建立合适的倒排索引
```sql
SELECT id, title FROM search_test_basic
WHERE SEARCH('title:Python OR tags:ANY(database mysql) OR author:Alice');

SELECT id, title FROM search_test_basic
WHERE SEARCH('tags:ALL(tutorial) AND category:Technology');
```

#### 通配符查询
- 语法：`column:prefix*`、`column:*mid*`、`column:?ingle`
- 语义：使用 `*` 匹配任意长度字符串，`?` 匹配单个字符。
- 索引建议：适用于未分词索引，也可用于开启 `lower_case` 的分词索引以获得不区分大小写的匹配。
```sql
SELECT id, title FROM search_test_basic
WHERE SEARCH('firstname:Chris*');

-- 结合默认字段参数
SELECT id, firstname FROM people
WHERE SEARCH('Chris*', 'firstname');
```

#### 正则表达式查询
- 语法：`column:/regex/`
- 语义：使用 Lucene 风格正则表达式匹配，模式由斜杠包裹。
- 索引建议：仅支持未分词倒排索引。
```sql
SELECT id, title FROM corpus
WHERE SEARCH('title:/data.+science/');
```

#### EXACT 查询（严格等值匹配）

- 语法：`column:EXACT(text)`
- 语义：按列的完整值进行精确匹配；区分大小写；不匹配部分词项
- 索引建议：该列建议同时建立未分词倒排索引（不设置 `parser`），用于 EXACT 加速

示例：

```sql
SELECT id
FROM t
WHERE SEARCH('content:EXACT(machine learning)');
```

#### Variant 子列查询

- 语法：`variant_col.sub.path:term`
- 语义：通过点号路径访问 VARIANT 子列进行匹配；匹配行为遵循该 VARIANT 列上索引/分析器的配置
- 支持布尔组合、`ANY`/`ALL`、嵌套路径；不存在的子列不返回匹配

示例：

```sql
SELECT id
FROM test_variant_search_subcolumn
WHERE SEARCH('properties.message:alpha');
```

### 示例

```sql
-- 同时建立分词与未分词倒排索引
CREATE TABLE t (
  id INT,
  content STRING,
  INDEX idx_untokenized(content) USING INVERTED,
  INDEX idx_tokenized(content)  USING INVERTED PROPERTIES("parser" = "standard")
);

-- 严格等值匹配（使用未分词索引）
SELECT id, content
FROM t
WHERE SEARCH('content:EXACT(machine learning)')
ORDER BY id;

-- EXACT 不匹配部分词项
SELECT id, content
FROM t
WHERE SEARCH('content:EXACT(machine)')
ORDER BY id;

-- ANY/ALL 使用分词索引
SELECT id, content FROM t WHERE SEARCH('content:ANY(machine learning)') ORDER BY id;
SELECT id, content FROM t WHERE SEARCH('content:ALL(machine learning)') ORDER BY id;

-- 对比 EXACT 与 ANY
SELECT id, content FROM t WHERE SEARCH('content:EXACT(deep learning)') ORDER BY id;
SELECT id, content FROM t WHERE SEARCH('content:ANY(deep learning)') ORDER BY id;

-- 组合条件
SELECT id, content
FROM t
WHERE SEARCH('content:EXACT(machine learning) OR content:ANY(intelligence)')
ORDER BY id;

-- 使用默认字段与默认运算符的简化写法
SELECT id, tags
FROM tag_dataset
WHERE SEARCH('deep learning', 'tags', 'and'); -- 自动展开为 tags:ALL(deep learning)

-- 同时使用短语与通配符
SELECT id, content FROM t
WHERE SEARCH('content:"deep learning" OR content:AI*')
ORDER BY id;

-- 带 VARIANT 列与倒排索引
CREATE TABLE test_variant_search_subcolumn (
  id BIGINT,
  properties VARIANT<PROPERTIES("variant_max_subcolumns_count"="0")>,
  INDEX idx_properties (properties) USING INVERTED PROPERTIES (
    "parser" = "unicode",
    "lower_case" = "true",
    "support_phrase" = "true"
  )
);

-- 单词查询
SELECT id
FROM test_variant_search_subcolumn
WHERE SEARCH('properties.message:alpha')
ORDER BY id;

-- AND / ALL 查询
SELECT id
FROM test_variant_search_subcolumn
WHERE SEARCH('properties.message:alpha AND properties.message:beta')
ORDER BY id;

SELECT id
FROM test_variant_search_subcolumn
WHERE SEARCH('properties.message:ALL(alpha beta)')
ORDER BY id;

-- 不同子列 OR 查询
SELECT id
FROM test_variant_search_subcolumn
WHERE SEARCH('properties.message:hello OR properties.category:beta')
ORDER BY id;
```

### 当前限制

- 范围与列表子句（如 `field:[a TO b]`、`field:IN(...)`）仍会降级为普通词项匹配，建议使用常规 SQL 范围/`IN` 过滤。

可使用标准操作符或文本检索算子替代：

```sql
-- 通过 SQL 进行范围过滤
SELECT * FROM t WHERE created_at >= '2024-01-01';
```
