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
