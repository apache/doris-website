---
{
    "title": "TOKENIZE",
    "language": "zh-CN",
    "description": "TOKENIZE 函数使用指定的分词器对字符串进行分词,并以JSON格式的字符串数组返回分词结果。该函数特别适用于理解在使用倒排索引进行全文搜索时,文本将如何被分析处理。"
}
---

## 描述

`TOKENIZE` 函数使用指定的分词器对字符串进行分词,并以JSON格式的字符串数组返回分词结果。该函数特别适用于理解在使用倒排索引进行全文搜索时,文本将如何被分析处理。

## 语法

```sql
VARCHAR TOKENIZE(VARCHAR str, VARCHAR properties)
```

## 参数

- `str`: 要进行分词的输入字符串,类型: `VARCHAR`
- `properties`: 指定分词器配置的属性字符串,类型: `VARCHAR`

`properties` 参数支持以下键值对(格式: `"key1"="value1", "key2"="value2"`):

### 常用属性

| 属性 | 描述 | 示例值 |
|------|------|--------|
| `built_in_analyzer` | 内置分词器类型 | `"english"`, `"chinese"`, `"unicode"`, `"icu"`, `"basic"`, `"ik"`, `"standard"`, `"none"` |
| `analyzer` | 自定义分词器名称(通过 `CREATE INVERTED INDEX ANALYZER` 创建) | `"my_custom_analyzer"` |
| `parser_mode` | 分词器模式(用于中文分词器) | `"fine_grained"`, `"coarse_grained"` |
| `support_phrase` | 启用短语支持(存储位置信息) | `"true"`, `"false"` |
| `lower_case` | 将词条转换为小写 | `"true"`, `"false"` |
| `char_filter_type` | 字符过滤器类型 | 根据过滤器而异 |
| `stop_words` | 停用词配置 | 根据实现而异 |

## 返回值

返回包含分词结果JSON数组的 `VARCHAR` 类型字符串。数组中的每个元素是一个对象,具有以下结构:

- `token`: 分词后的词条
- `position`: (可选)当启用 `support_phrase` 时,词条的位置索引

## 示例

### 示例 1: 使用内置分词器

```sql
-- 使用标准分词器
SELECT TOKENIZE("Hello World", '"built_in_analyzer"="standard"');
```
```
[{ "token": "hello" }, { "token": "world" }]
```

```sql
-- 使用英语分词器
SELECT TOKENIZE("running quickly", '"built_in_analyzer"="english"');
```
```
[{ "token": "run" }, { "token": "quick" }]
```

```sql
-- 使用unicode分词器处理中文文本
SELECT TOKENIZE("Apache Doris数据库", '"built_in_analyzer"="unicode"');
```
```
[{ "token": "apache" }, { "token": "doris" }, { "token": "数" }, { "token": "据" }, { "token": "库" }]
```

```sql
-- 使用中文分词器
SELECT TOKENIZE("我来到北京清华大学", '"built_in_analyzer"="chinese"');
```
```
[{ "token": "我" }, { "token": "来到" }, { "token": "北京" }, { "token": "清华大学" }]
```

```sql
-- 使用ICU分词器处理多语言文本
SELECT TOKENIZE("Hello World 世界", '"built_in_analyzer"="icu"');
```
```
[{ "token": "hello" }, { "token": "world" }, {"token": "世界"}]
```

```sql
-- 使用基础分词器
SELECT TOKENIZE("GET /images/hm_bg.jpg HTTP/1.0", '"built_in_analyzer"="basic"');
```
```
[{ "token": "get" }, { "token": "images" }, {"token": "hm"}, {"token": "bg"}, {"token": "jpg"}, {"token": "http"}, {"token": "1"}, {"token": "0"}]
```

```sql
-- 使用IK分词器处理中文文本
SELECT TOKENIZE("中华人民共和国国歌", '"built_in_analyzer"="ik"');
```
```
[{ "token": "中华人民共和国" }, { "token": "国歌" }]
```

### 示例 2: 使用自定义分词器

首先创建一个自定义分词器:

```sql
CREATE INVERTED INDEX ANALYZER lowercase_delimited
PROPERTIES (
    "tokenizer" = "standard",
    "token_filter" = "asciifolding, lowercase"
);
```

然后在 `TOKENIZE` 中使用:

```sql
SELECT TOKENIZE("FOO-BAR", '"analyzer"="lowercase_delimited"');
```
```
[{ "token": "foo" }, { "token": "bar" }]
```

### 示例 3: 启用短语支持(位置信息)

```sql
SELECT TOKENIZE("Hello World", '"built_in_analyzer"="standard", "support_phrase"="true"');
```
```
[{ "token": "hello", "position": 0 }, { "token": "world", "position": 1 }]
```

## 注意事项

1. **分词器配置**: `properties` 参数必须是有效的属性字符串。如果使用自定义分词器,必须先使用 `CREATE INVERTED INDEX ANALYZER` 创建。

2. **支持的分词器**: 当前支持的内置分词器包括:
   - `standard`: 标准分词器,用于通用文本
   - `english`: 带词干提取的英语分词器
   - `chinese`: 中文文本分词器
   - `unicode`: 基于Unicode的多语言文本分词器
   - `icu`: 基于ICU的高级Unicode处理分词器
   - `basic`: 基础分词
   - `ik`: 中文IK分词器
   - `none`: 不分词(返回原始字符串作为单个词条)

3. **性能考虑**: `TOKENIZE` 函数主要用于测试和调试分词器配置。在生产环境的全文搜索中,应使用带有 `MATCH` 或 `SEARCH` 操作符的倒排索引。

4. **JSON输出**: 输出是格式化的JSON字符串,如需进一步处理,可以使用JSON函数。

5. **与倒排索引的兼容性**: 在 `TOKENIZE` 中使用的相同分词器配置可以应用于创建表时的倒排索引:
   ```sql
   CREATE TABLE example (
       content TEXT,
       INDEX idx_content(content) USING INVERTED PROPERTIES("analyzer"="my_analyzer")
   )
   ```

6. **测试分词器行为**: 使用 `TOKENIZE` 可以在创建倒排索引之前预览文本的分词效果,有助于为您的数据选择最合适的分词器。

## 相关函数

- [MATCH](../../../../sql-manual/basic-element/operators/conditional-operators/full-text-search-operators): 使用倒排索引进行全文搜索
- [SEARCH](../../../../ai/text-search/search-function): 支持DSL的高级搜索

## 关键字

TOKENIZE, STRING, 全文搜索, 倒排索引, 分词器
