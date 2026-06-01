---
{
    "title": "全文检索与查询加速算子",
    "language": "zh-CN",
    "description": "Apache Doris 倒排索引支持的全文检索与查询加速算子参考：MATCH_ANY/ALL/PHRASE/REGEXP 等 8 种检索算子覆盖关键词、短语、前缀、正则等场景，并加速等值、范围、数组等结构化查询。"
}
---

<!-- 知识类型: 算子参考 / 使用示例 -->
<!-- 适用场景: 全文检索查询编写 / 倒排索引查询加速 -->

本文介绍 Apache Doris 倒排索引支持的查询算子，包括两大类：

- **全文检索算子**：用于文本字段的关键词、短语、前缀、正则等模糊匹配场景。
- **倒排索引查询加速**：用于结构化字段的等值、范围、集合、数组等精确过滤场景。

## 全文检索算子

下表列出全部全文检索算子及其典型使用场景：

| 算子 | 典型场景 | 匹配规则 |
|------|----------|----------|
| `MATCH_ANY` | 关键词「或」搜索 | 命中任意一个关键词即可 |
| `MATCH_ALL` | 关键词「与」搜索 | 必须命中全部关键词 |
| `MATCH_PHRASE` | 严格短语搜索 | 词项相邻且顺序一致 |
| `MATCH_PHRASE`（带 slop） | 容错短语搜索 | 允许词项之间存在间隔 |
| `MATCH_PHRASE`（严格顺序） | 固定词序的短语搜索 | 间隔范围内词序固定 |
| `MATCH_PHRASE_PREFIX` | 输入联想 / 前缀补全 | 末词按前缀匹配 |
| `MATCH_REGEXP` | 词项级正则匹配 | 对分词结果应用正则 |
| `MATCH_PHRASE_EDGE` | 多端模糊匹配 | 首词后缀 + 中间精确 + 末词前缀 |

### 关键词搜索：MATCH_ANY / MATCH_ALL

适用于「输入若干关键词，查找包含这些词的文档」的场景。

- **MATCH_ANY**：匹配包含任一关键词的行。

    ```sql
    SELECT * FROM table_name WHERE content MATCH_ANY 'keyword1 keyword2';
    ```

- **MATCH_ALL**：匹配同时包含所有关键词的行。

    ```sql
    SELECT * FROM table_name WHERE content MATCH_ALL 'keyword1 keyword2';
    ```

### 短语搜索：MATCH_PHRASE 系列

适用于「关键词需相邻或保持词序」的精确短语匹配场景。

#### 严格短语匹配

要求词项相邻且顺序一致。如需索引加速，请在索引属性中开启 `"support_phrase" = "true"`。

```sql
SELECT * FROM table_name WHERE content MATCH_PHRASE 'keyword1 keyword2';
```

#### 带 slop 的短语匹配

允许关键词之间存在最多 `slop` 个词的间隔，词序可不固定。

```sql
-- 允许 keyword1 与 keyword2 之间最多间隔 3 个词
SELECT * FROM table_name WHERE content MATCH_PHRASE 'keyword1 keyword2 ~3';
```

#### 严格顺序的短语匹配

结合 `+` 与 slop，要求词序固定。

```sql
SELECT * FROM table_name WHERE content MATCH_PHRASE 'keyword1 keyword2 ~3+';
```

### 前缀与边缘匹配

适用于「输入联想」「前后缀模糊匹配」等场景。

#### MATCH_PHRASE_PREFIX

短语匹配，最后一个词按前缀匹配。当只给出一个词时，退化为该词的前缀匹配。

```sql
-- 最后一个词按前缀匹配
SELECT * FROM table_name WHERE content MATCH_PHRASE_PREFIX 'keyword1 key';

-- 单词退化为前缀匹配
SELECT * FROM table_name WHERE content MATCH_PHRASE_PREFIX 'keyword1';
```

#### MATCH_PHRASE_EDGE

边缘短语匹配，匹配规则如下：

- 首词按**后缀**匹配
- 中间词按**精确**匹配
- 末词按**前缀**匹配
- 词项之间需相邻

```sql
SELECT * FROM table_name WHERE content MATCH_PHRASE_EDGE 'search engine optim';
```

### 正则匹配：MATCH_REGEXP

针对分词后的词项进行正则匹配。

```sql
SELECT * FROM table_name WHERE content MATCH_REGEXP '^key_word.*';
```

## 使用 USING ANALYZER 指定分词器

当一个列上创建了多个使用不同分词器的倒排索引时，可以使用 `USING ANALYZER` 子句指定查询时使用哪个分词器。

### 语法

```sql
SELECT * FROM table_name WHERE column MATCH 'keywords' USING ANALYZER analyzer_name;
```

### 支持的算子

所有 MATCH 算子都支持 `USING ANALYZER` 子句：

- `MATCH` / `MATCH_ANY`
- `MATCH_ALL`
- `MATCH_PHRASE`
- `MATCH_PHRASE_PREFIX`
- `MATCH_PHRASE_EDGE`
- `MATCH_REGEXP`

### 内置分词器

| 名称 | 说明 |
|------|------|
| `none` | 精确匹配，不分词 |
| `standard` | 标准分词 |
| `chinese` | 中文分词 |

### 使用示例

```sql
-- 使用标准分词器（将文本分词）
SELECT * FROM articles WHERE content MATCH 'hello world' USING ANALYZER std_analyzer;

-- 使用关键词分词器（精确匹配，不分词）
SELECT * FROM articles WHERE content MATCH 'hello world' USING ANALYZER kw_analyzer;

-- 配合 MATCH_PHRASE 使用
SELECT * FROM articles WHERE content MATCH_PHRASE 'hello world' USING ANALYZER std_analyzer;

-- 使用内置分词器
SELECT * FROM articles WHERE content MATCH 'hello' USING ANALYZER standard;
SELECT * FROM articles WHERE content MATCH 'hello' USING ANALYZER none;
```

### 注意事项

- 如果指定分词器的索引未构建，查询会自动降级到非索引路径（结果正确，但性能较慢）。
- 如果未指定分词器，系统会使用任意可用的索引。

## 倒排索引查询加速

除全文检索外，倒排索引同样可加速结构化字段的精确过滤。支持的运算符与函数如下：

| 类别 | 运算符 / 函数 |
|------|---------------|
| 等值与集合 | `=`、`!=`、`IN`、`NOT IN` |
| 范围 | `>`、`>=`、`<`、`<=`、`BETWEEN` |
| 空值判断 | `IS NULL`、`IS NOT NULL` |
| 数组 | `array_contains`、`array_overlaps` |

使用示例：

```sql
-- 范围查询
SELECT * FROM t WHERE price >= 100 AND price < 200;

-- 集合查询
SELECT * FROM t WHERE tags IN ('a', 'b', 'c');

-- 数组查询
SELECT * FROM t WHERE array_contains(attributes, 'color');
```
