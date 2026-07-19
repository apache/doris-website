---
{
    "title": "SEARCH 函数",
    "language": "zh-CN",
    "description": "SEARCH 函数是 Apache Doris 4.0 提供的统一全文检索入口，通过简洁的 DSL 表达式描述查询条件，并基于倒排索引高效执行词项、短语、布尔、通配符与正则等多种检索。"
}
---

<!-- 知识类型: 函数参考 / 操作步骤 -->
<!-- 适用场景: 全文检索 / 倒排索引查询 / DSL 表达式编写 -->

`SEARCH` 函数是 Apache Doris 自 4.0 版本起提供的统一全文检索查询入口。它通过简洁的 DSL（领域特定语言）描述查询条件，并基于倒排索引高效执行。

`SEARCH` 是一个返回布尔值的谓词函数，可作为过滤条件出现在 `WHERE` 子句中。它接收 SEARCH DSL 字符串用于描述文本匹配规则，并将可匹配条件下推至倒排索引执行。

**典型使用场景：**

- 在文本字段上执行词项、短语、布尔组合检索
- 跨多列进行联合搜索
- 使用通配符或正则表达式进行模式匹配
- 对 VARIANT 子列进行结构化文本检索
- 兼容 Lucene/Elasticsearch query_string 语法风格

## 语法

### 基本调用形式

```sql
SEARCH('<search_expression>')
SEARCH('<search_expression>', '<default_field>')
SEARCH('<search_expression>', '<default_field>', '<default_operator>')
```

**参数说明：**

| 参数 | 是否必填 | 说明 |
| --- | --- | --- |
| `<search_expression>` | 必填 | SEARCH DSL 查询表达式（字符串字面量） |
| `<default_field>` | 可选 | 当 DSL 中的词项未显式指定字段时自动套用的列名 |
| `<default_operator>` | 可选 | 多词项表达式默认布尔运算符，仅接受 `and` 或 `or`（不区分大小写），默认为 `or` |

**使用要点：**

- **位置**：用于 `WHERE` 子句，作为谓词参与行过滤
- **返回类型**：BOOLEAN（匹配为 TRUE）

提供 `default_field` 后，Doris 会把裸词项或函数自动扩展到该字段。例如：

- `SEARCH('foo bar', 'tags', 'and')` 等价于 `SEARCH('tags:ALL(foo bar)')`
- `SEARCH('foo bar', 'tags')` 会展开为 `tags:ANY(foo bar)`

DSL 中显式出现的布尔操作优先级最高，会覆盖默认运算符。

### Options 参数（JSON 格式）

第二个参数也可以是 JSON 字符串，用于高级配置：

```sql
SEARCH('<search_expression>', '<options_json>')
```

**支持的选项：**

| 选项 | 类型 | 说明 |
| --- | --- | --- |
| `default_field` | string | 未指定字段的词项使用的默认列名 |
| `default_operator` | string | 多词项表达式的默认运算符（`and` 或 `or`） |
| `mode` | string | `standard`（默认）或 `lucene` |
| `minimum_should_match` | integer | SHOULD 子句最小匹配数（仅 Lucene 模式） |

**示例：**

```sql
SELECT * FROM docs
WHERE SEARCH('apple banana',
             '{"default_field":"title","default_operator":"and","mode":"lucene"}');
```

### NULL 与三值逻辑

`SEARCH()` 遵循 SQL 三值逻辑：

- 当所有参与匹配的列值均为 NULL 时，结果为 UNKNOWN（在 `WHERE` 中被过滤）
- 与其他子表达式组合时，按布尔短路原则返回结果，例如：
    - `TRUE OR NULL = TRUE`
    - `FALSE OR NULL = NULL`
    - `NOT NULL = NULL`

该行为与文本检索算子保持一致。

## 按场景使用 SEARCH

### 场景一：单词项匹配

**适用场景：** 检索某一字段中包含特定词项的文档。

- **语法：** `column:term`
- **语义：** 在列的分词结果中匹配该词项；是否区分大小写取决于索引属性 `lower_case`
- **索引建议：** 为该列创建带合适 `parser`/`analyzer` 的倒排索引

```sql
SELECT id, title FROM search_test_basic WHERE SEARCH('title:Machine');
SELECT id, title FROM search_test_basic WHERE SEARCH('title:Python');
SELECT id, title FROM search_test_basic WHERE SEARCH('category:Technology');
```

### 场景二：多词项 OR 匹配（ANY）

**适用场景：** 命中候选词列表中的任意一个即视为匹配，例如标签匹配、关键词联合检索。

- **语法：** `column:ANY(term1 term2 ...)`
- **语义：** 列的分词结果中包含列表里任意一个词项即可（OR 语义）；顺序无关，重复词忽略
- **索引建议：** 为该列创建分词倒排索引（如 `english`/`chinese`/`unicode`）

```sql
SELECT id, title FROM search_test_basic WHERE SEARCH('tags:ANY(python javascript)');
SELECT id, title FROM search_test_basic WHERE SEARCH('tags:ANY(machine learning tutorial)');

-- 边界：单值 ANY 等价于词项查询
SELECT id, title FROM search_test_basic WHERE SEARCH('tags:ANY(python)');
```

### 场景三：多词项 AND 匹配（ALL）

**适用场景：** 必须同时命中多个词项，例如严格主题筛选。

- **语法：** `column:ALL(term1 term2 ...)`
- **语义：** 列的分词结果中同时包含列表里所有词项（AND 语义）；顺序无关，重复词忽略
- **索引建议：** 为该列创建分词倒排索引（如 `english`/`chinese`/`unicode`）

```sql
SELECT id, title FROM search_test_basic WHERE SEARCH('tags:ALL(machine learning)');
SELECT id, title FROM search_test_basic WHERE SEARCH('tags:ALL(programming tutorial)');

-- 边界：单值 ALL 等价于词项查询
SELECT id, title FROM search_test_basic WHERE SEARCH('tags:ALL(python)');
```

### 场景四：布尔组合查询

**适用场景：** 多个条件之间需要 AND/OR/NOT 组合，例如「必须包含 A 且不包含 B」。

- **语法：** `(expr) AND/OR/NOT (expr)`
- **语义：** 在 SEARCH 内用 `AND`、`OR`、`NOT` 组合子表达式
- **索引建议：** 尽量将可匹配条件写入 SEARCH 内部以获得索引下推；其他 WHERE 条件作为过滤

```sql
SELECT id, title FROM search_test_basic
WHERE SEARCH('title:Machine AND category:Technology');

SELECT id, title FROM search_test_basic
WHERE SEARCH('title:Python OR title:Data');

SELECT id, title FROM search_test_basic
WHERE SEARCH('category:Technology AND NOT title:Machine');
```

### 场景五：复杂嵌套表达式

**适用场景：** 需要通过括号控制布尔优先级，构造多层嵌套的过滤条件。

- **语法：** 使用括号对表达式分组，例如 `(expr1 OR expr2) AND expr3`
- **语义：** 通过括号控制布尔优先级，支持多层嵌套
- **索引建议：** 同布尔组合查询

```sql
SELECT id, title FROM search_test_basic
WHERE SEARCH('(title:Machine OR title:Python) AND category:Technology');

SELECT id, title FROM search_test_basic
WHERE SEARCH('tags:ANY(python javascript) AND (category:Technology OR category:Programming)');
```

### 场景六：兼容 Lucene/Elasticsearch 语法

**适用场景：** 从 Elasticsearch 迁移、或希望按 Lucene query_string 语义书写表达式。

Lucene 模式模拟 Elasticsearch/Lucene 的 query_string 行为，布尔操作符作为左到右的修饰符工作，而非传统的布尔代数。

**与标准模式的主要区别：**

- AND/OR/NOT 是影响相邻词项的修饰符
- 操作符优先级从左到右
- 内部使用 MUST/SHOULD/MUST_NOT（类似 Lucene 的 Occur 枚举）
- 纯 NOT 查询返回空结果（需要正向子句）

**启用 Lucene 模式：**

```sql
-- 基本 Lucene 模式
SELECT * FROM docs
WHERE SEARCH('apple AND banana',
             '{"default_field":"title","mode":"lucene"}');

-- 使用 minimum_should_match
SELECT * FROM docs
WHERE SEARCH('apple AND banana OR cherry',
             '{"default_field":"title","mode":"lucene","minimum_should_match":1}');
```

**行为对比：**

| 查询 | 标准模式 | Lucene 模式 |
| --- | --- | --- |
| `a AND b` | a ∩ b | +a +b（都是 MUST） |
| `a OR b` | a ∪ b | a b（都是 SHOULD，min=1） |
| `NOT a` | ¬a | 空结果（无正向子句） |
| `a AND NOT b` | a ∩ ¬b | +a -b（MUST a，MUST_NOT b） |
| `a AND b OR c` | (a ∩ b) ∪ c | +a b c（只有 a 是 MUST） |

> **注意：** 在 Lucene 模式中，`a AND b OR c` 从左到右解析：OR 操作符将 `b` 从 MUST 改为 SHOULD。使用 `minimum_should_match` 来要求 SHOULD 子句匹配。

### 场景七：短语查询

**适用场景：** 检索连续且有序的词组，例如「machine learning」必须按顺序出现。

- **语法：** `column:"quoted phrase"`
- **语义：** 根据列的分析器匹配连续且有序的词项，需使用双引号包裹完整短语
- **索引建议：** 目标列必须使用带位置信息的分词倒排索引（配置 `parser`）

```sql
SELECT id, title FROM search_test_basic
WHERE SEARCH('content:"machine learning"');
```

### 场景八：跨多列联合搜索

**适用场景：** 一次查询覆盖多个字段，例如标题、标签、作者任一命中即返回。

- **语法：** `column1:term OR column2:ANY(...) OR ...`
- **语义：** 在单条表达式中跨多列匹配；每列按其索引/分词配置生效
- **索引建议：** 为涉及到的每一列建立合适的倒排索引

```sql
SELECT id, title FROM search_test_basic
WHERE SEARCH('title:Python OR tags:ANY(database mysql) OR author:Alice');

SELECT id, title FROM search_test_basic
WHERE SEARCH('tags:ALL(tutorial) AND category:Technology');
```

### 场景九：通配符查询

**适用场景：** 前缀、后缀或包含匹配，例如检索所有以「Chris」开头的姓名。

- **语法：** `column:prefix*`、`column:*mid*`、`column:?ingle`
- **语义：** 使用 `*` 匹配任意长度字符串，`?` 匹配单个字符
- **索引建议：** 适用于未分词索引，也可用于开启 `lower_case` 的分词索引以获得不区分大小写的匹配

```sql
SELECT id, title FROM search_test_basic
WHERE SEARCH('firstname:Chris*');

-- 结合默认字段参数
SELECT id, firstname FROM people
WHERE SEARCH('Chris*', 'firstname');
```

### 场景十：正则表达式查询

**适用场景：** 使用 Lucene 风格正则进行复杂模式匹配。

- **语法：** `column:/regex/`
- **语义：** 使用 Lucene 风格正则表达式匹配，模式由斜杠包裹
- **索引建议：** 仅支持未分词倒排索引

```sql
SELECT id, title FROM corpus
WHERE SEARCH('title:/data.+science/');
```

### 场景十一：严格等值匹配（EXACT）

**适用场景：** 按列的完整原始值精确匹配，区分大小写，不进行分词。

- **语法：** `column:EXACT(text)`
- **语义：** 按列的完整值进行精确匹配；区分大小写；不匹配部分词项
- **索引建议：** 该列建议同时建立未分词倒排索引（不设置 `parser`），用于 EXACT 加速

```sql
SELECT id
FROM t
WHERE SEARCH('content:EXACT(machine learning)');
```

### 场景十二：VARIANT 子列查询

**适用场景：** 对半结构化 VARIANT 字段中的某个子路径进行检索。

- **语法：** `variant_col.sub.path:term`
- **语义：** 通过点号路径访问 VARIANT 子列进行匹配；匹配行为遵循该 VARIANT 列上索引/分析器的配置
- **支持能力：** 布尔组合、`ANY`/`ALL`、嵌套路径；不存在的子列不返回匹配

```sql
SELECT id
FROM test_variant_search_subcolumn
WHERE SEARCH('properties.message:alpha');
```

## 完整示例

下面通过一个综合示例演示如何为同一列建立分词与未分词两套索引，并组合使用 EXACT、ANY/ALL、短语与通配符。

### 建表与基础索引

```sql
-- 同时建立分词与未分词倒排索引
CREATE TABLE t (
    id INT,
    content STRING,
    INDEX idx_untokenized(content) USING INVERTED,
    INDEX idx_tokenized(content)  USING INVERTED PROPERTIES("parser" = "standard")
);
```

### EXACT 与分词查询对比

```sql
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
```

### 组合条件与简化写法

```sql
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
```

### VARIANT 列检索示例

```sql
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

## 转义字符

使用反斜杠（`\`）转义 DSL 中的特殊字符：

| 转义 | 说明 | 示例 |
| --- | --- | --- |
| `\ ` | 字面空格（连接词项） | `title:First\ Value` 匹配 "First Value" |
| `\(` `\)` | 字面括号 | `title:hello\(world\)` 匹配 "hello(world)" |
| `\:` | 字面冒号 | `title:key\:value` 匹配 "key:value" |
| `\\` | 字面反斜杠 | `title:path\\to\\file` 匹配 "path\to\file" |

**示例：**

```sql
-- 搜索包含空格的值作为单个词项
SELECT * FROM docs WHERE SEARCH('title:First\\ Value');

-- 搜索包含括号的值
SELECT * FROM docs WHERE SEARCH('title:hello\\(world\\)');

-- 搜索包含冒号的值
SELECT * FROM docs WHERE SEARCH('title:key\\:value');
```

> **注意：** 在 SQL 字符串中，反斜杠需要双重转义。使用 `\\` 在 SQL 中产生 DSL 中的单个 `\`。

## 当前限制

- 范围与列表子句（如 `field:[a TO b]`、`field:IN(...)`）仍会降级为普通词项匹配，建议使用常规 SQL 范围/`IN` 过滤。

可使用标准操作符或文本检索算子替代：

```sql
-- 通过 SQL 进行范围过滤
SELECT * FROM t WHERE created_at >= '2024-01-01';
```
