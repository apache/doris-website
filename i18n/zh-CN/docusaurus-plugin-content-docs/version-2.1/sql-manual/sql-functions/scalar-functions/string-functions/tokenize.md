---
{
    "title": "TOKENIZE",
    "language": "zh-CN",
    "description": "TOKENIZE 函数使用指定的分词器对字符串进行分词,并以字符串数组形式返回分词结果。该函数特别适用于测试和理解在使用倒排索引进行全文搜索时,文本将如何被分析处理。"
}
---

## 描述

`TOKENIZE` 函数使用指定的分词器对字符串进行分词,并以字符串数组形式返回分词结果。该函数特别适用于测试和理解在使用倒排索引进行全文搜索时,文本将如何被分析处理。

## 语法

```sql
ARRAY<VARCHAR> TOKENIZE(VARCHAR str, VARCHAR properties)
```

## 参数

- `str`: 要进行分词的输入字符串,类型: `VARCHAR`
- `properties`: 指定分词器配置的属性字符串,类型: `VARCHAR`

`properties` 参数支持以下键值对(格式: `'key1'='value1', 'key2'='value2'` 或 `"key1"="value1", "key2"="value2"`):

### 支持的属性

| 属性 | 描述 | 示例值 |
|------|------|--------|
| `parser` | 内置分词器类型 | `"chinese"`, `"english"`, `"unicode"` |
| `parser_mode` | 中文分词器的分词模式 | `"fine_grained"`, `"coarse_grained"` |
| `char_filter_type` | 字符过滤器类型 | `"char_replace"` |
| `char_filter_pattern` | 要替换的字符(与 `char_filter_type` 配合使用) | `"._=:,"` |
| `char_filter_replacement` | 替换字符(与 `char_filter_type` 配合使用) | `" "` (空格) |
| `stopwords` | 停用词配置 | `"none"` |

## 返回值

返回 `ARRAY<VARCHAR>` 类型,包含分词后的字符串数组。

## 示例

### 示例 1: 使用中文分词器

```sql
SELECT TOKENIZE('我来到北京清华大学', "'parser'='chinese'");
```
```
["我", "来到", "北京", "清华大学"]
```

### 示例 2: 中文分词器的细粒度模式

```sql
SELECT TOKENIZE('我来到北京清华大学', "'parser'='chinese', 'parser_mode'='fine_grained'");
```
```
["我", "来到", "北京", "清华", "清华大学", "华大", "大学"]
```

### 示例 3: 使用 Unicode 分词器

```sql
SELECT TOKENIZE('Apache Doris数据库', "'parser'='unicode'");
```
```
["apache", "doris", "数", "据", "库"]
```

### 示例 4: 使用字符过滤器

```sql
SELECT TOKENIZE('GET /images/hm_bg.jpg HTTP/1.0 test:abc=bcd',
    '"parser"="unicode","char_filter_type" = "char_replace","char_filter_pattern" = "._=:,","char_filter_replacement" = " "');
```
```
["get", "images", "hm", "bg", "jpg", "http", "1", "0", "test", "abc", "bcd"]
```

### 示例 5: 停用词配置

```sql
SELECT TOKENIZE('华夏智胜新税股票A', '"parser"="unicode"');
```
```
["华", "夏", "智", "胜", "新", "税", "股", "票"]
```

```sql
SELECT TOKENIZE('华夏智胜新税股票A', '"parser"="unicode","stopwords" = "none"');
```
```
["华", "夏", "智", "胜", "新", "税", "股", "票", "a"]
```

## 注意事项

1. **分词器配置**: `properties` 参数必须是有效的属性字符串。此版本仅支持内置分词器。

2. **支持的分词器**: 2.1 版本支持以下内置分词器:
   - `chinese`: 中文文本分词器,支持可选的 `parser_mode`(`fine_grained` 或 `coarse_grained`)
   - `english`: 带词干提取的英语分词器
   - `unicode`: 基于 Unicode 的多语言文本分词器

3. **分词模式**: `parser_mode` 属性主要用于 `chinese` 分词器:
   - `fine_grained`: 细粒度模式,生成更详细的词条,包含重叠片段
   - `coarse_grained`: 粗粒度模式(默认),标准分词

4. **字符过滤器**: 需要同时使用 `char_filter_type`、`char_filter_pattern` 和 `char_filter_replacement` 来在分词前替换特定字符。

5. **性能考虑**: `TOKENIZE` 函数主要用于测试和调试分词器配置。在生产环境的全文搜索中,应使用带有 `MATCH` 谓词的倒排索引。

6. **与倒排索引的兼容性**: 在 `TOKENIZE` 中使用的相同分词器配置可以应用于创建表时的倒排索引:
   ```sql
   CREATE TABLE example (
       content TEXT,
       INDEX idx_content(content) USING INVERTED PROPERTIES("parser"="chinese")
   )
   ```

7. **测试分词器行为**: 使用 `TOKENIZE` 可以在创建倒排索引之前预览文本的分词效果,有助于为您的数据选择最合适的分词器。

## 关键字

TOKENIZE, STRING, 全文搜索, 倒排索引, 分词器
