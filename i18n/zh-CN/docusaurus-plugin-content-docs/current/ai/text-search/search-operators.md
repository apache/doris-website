---
{
    "title": "全文检索与查询加速支持",
    "language": "zh-CN",
    "description": "Apache Doris全文检索与查询加速功能详解：支持MATCH_ANY/ALL/PHRASE/REGEXP等8种全文检索算子，提供短语匹配、前缀匹配、正则匹配、边缘短语匹配等高级搜索能力。结合倒排索引加速等值、范围、集合、数组等复杂查询，显著提升文本搜索和结构化数据过滤性能。"
}
---

## 全文检索算子

### MATCH_ANY
- 匹配包含任一关键词的行。
```sql
SELECT * FROM table_name WHERE content MATCH_ANY 'keyword1 keyword2';
```

### MATCH_ALL
- 匹配同时包含所有关键词的行。
```sql
SELECT * FROM table_name WHERE content MATCH_ALL 'keyword1 keyword2';
```

### MATCH_PHRASE
- 短语匹配，要求词项相邻且顺序一致。
- 如需索引加速，请在索引属性中开启 `"support_phrase" = "true"`。
```sql
SELECT * FROM table_name WHERE content MATCH_PHRASE 'keyword1 keyword2';
```

### MATCH_PHRASE（带 slop）
- 允许关键词之间存在最多 `slop` 个词的间隔。
```sql
-- 允许 keyword1 与 keyword2 之间最多间隔 3 个词
SELECT * FROM table_name WHERE content MATCH_PHRASE 'keyword1 keyword2 ~3';
```

### MATCH_PHRASE（严格顺序）
- 结合 `+` 与 slop，要求词序固定。
```sql
SELECT * FROM table_name WHERE content MATCH_PHRASE 'keyword1 keyword2 ~3+';
```

### MATCH_PHRASE_PREFIX
- 短语匹配，最后一个词按前缀匹配。
- 当只给出一个词时，退化为该词的前缀匹配。
```sql
-- 最后一个词前缀匹配
SELECT * FROM table_name WHERE content MATCH_PHRASE_PREFIX 'keyword1 key';

-- 单词退化为前缀匹配
SELECT * FROM table_name WHERE content MATCH_PHRASE_PREFIX 'keyword1';
```

### MATCH_REGEXP
- 正则匹配（针对分词后的词项进行匹配）。
```sql
SELECT * FROM table_name WHERE content MATCH_REGEXP '^key_word.*';
```

### MATCH_PHRASE_EDGE
- 边缘短语匹配：首词按后缀匹配，中间词精确匹配，末词按前缀匹配；词项需相邻。
```sql
SELECT * FROM table_name WHERE content MATCH_PHRASE_EDGE 'search engine optim';
```

### 使用 USING ANALYZER 指定分词器

当一个列上创建了多个使用不同分词器的倒排索引时，可以使用 `USING ANALYZER` 子句指定查询时使用哪个分词器。

**语法：**
```sql
SELECT * FROM table_name WHERE column MATCH 'keywords' USING ANALYZER analyzer_name;
```

**支持的算子：**
所有 MATCH 算子都支持 `USING ANALYZER` 子句：
- MATCH / MATCH_ANY
- MATCH_ALL
- MATCH_PHRASE
- MATCH_PHRASE_PREFIX
- MATCH_PHRASE_EDGE
- MATCH_REGEXP

**示例：**
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

**注意事项：**
- 如果指定分词器的索引未构建，查询会自动降级到非索引路径（结果正确，但性能较慢）
- 如果未指定分词器，系统会使用任意可用的索引
- 内置分词器名称：`none`（精确匹配）、`standard`（标准分词）、`chinese`（中文分词）

## 倒排索引查询加速

### 支持的运算符和函数

- 等值与集合：`=`, `!=`, `IN`, `NOT IN`
- 范围：`>`, `>=`, `<`, `<=`, `BETWEEN`
- 空值判断：`IS NULL`, `IS NOT NULL`
- 数组：`array_contains`, `array_overlaps`

```sql
-- 示例
SELECT * FROM t WHERE price >= 100 AND price < 200;            -- 范围
SELECT * FROM t WHERE tags IN ('a','b','c');                    -- 集合
SELECT * FROM t WHERE array_contains(attributes, 'color');      -- 数组
```
