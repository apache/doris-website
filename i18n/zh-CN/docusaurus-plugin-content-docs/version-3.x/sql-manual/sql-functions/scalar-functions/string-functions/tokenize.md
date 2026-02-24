---
{
    "title": "TOKENIZE",
    "language": "zh-CN",
    "description": "TOKENIZE 函数使用指定的分词器对字符串进行分词,并返回分词结果。该函数特别适用于测试和理解在使用倒排索引进行全文搜索时,文本将如何被分析处理。"
}
---

## 描述

`TOKENIZE` 函数使用指定的分词器对字符串进行分词,并返回分词结果。该函数特别适用于测试和理解在使用倒排索引进行全文搜索时,文本将如何被分析处理。

:::tip 版本差异
`TOKENIZE` 函数在 3.0 和 3.1+ 版本之间存在行为差异:
- **3.0 版本**: 使用 `parser` 参数,返回简单字符串数组
- **3.1+ 版本**: 支持 `built_in_analyzer` 和自定义 `analyzer`,返回 JSON 对象数组,功能更强大

关于 3.0 版本的具体用法,请参见 [3.0 版本特性](#30-版本特性) 章节。
:::

---

## 3.1+ 版本特性 (推荐)

### 语法

```sql
VARCHAR TOKENIZE(VARCHAR str, VARCHAR properties)
```

### 参数

- `str`: 要进行分词的输入字符串,类型: `VARCHAR`
- `properties`: 指定分词器配置的属性字符串,类型: `VARCHAR`

`properties` 参数支持以下键值对(格式: `"key1"="value1", "key2"="value2"`):

| 属性 | 描述 | 示例值 |
|------|------|--------|
| `built_in_analyzer` | 内置分词器类型 | `"standard"`, `"english"`, `"chinese"`, `"unicode"`, `"icu"`, `"basic"`, `"ik"`, `"none"` |
| `analyzer` | 自定义分词器名称(通过 `CREATE INVERTED INDEX ANALYZER` 创建) | `"my_custom_analyzer"` |
| `parser` | 内置分词器类型(向后兼容) | `"chinese"`, `"english"`, `"unicode"` |
| `parser_mode` | 中文分词器的分词模式 | `"fine_grained"`, `"coarse_grained"` |
| `support_phrase` | 启用短语支持(存储位置信息) | `"true"`, `"false"` |
| `lower_case` | 将词条转换为小写 | `"true"`, `"false"` |
| `char_filter_type` | 字符过滤器类型 | `"char_replace"` |
| `char_filter_pattern` | 要替换的字符(与 `char_filter_type` 配合使用) | `"._=:,"` |
| `char_filter_replacement` | 替换字符(与 `char_filter_type` 配合使用) | `" "` (空格) |
| `stopwords` | 停用词配置 | `"none"` |

### 返回值

返回包含分词结果 JSON 数组的 `VARCHAR` 类型字符串。数组中的每个元素是一个对象,具有以下结构:
- `token`: 分词后的词条
- `position`: (可选)当启用 `support_phrase` 时,词条的位置索引

### 示例

#### 示例 1: 使用内置分词器

```sql
-- 标准分词器
SELECT TOKENIZE("Hello World", '"built_in_analyzer"="standard"');
```
```
[{ "token": "hello" }, { "token": "world" }]
```

```sql
-- 英语分词器(带词干提取)
SELECT TOKENIZE("running quickly", '"built_in_analyzer"="english"');
```
```
[{ "token": "run" }, { "token": "quick" }]
```

```sql
-- 中文分词器
SELECT TOKENIZE('我来到北京清华大学', '"built_in_analyzer"="chinese"');
```
```
[{ "token": "我" }, { "token": "来到" }, { "token": "北京" }, { "token": "清华大学" }]
```

```sql
-- Unicode 分词器
SELECT TOKENIZE('Apache Doris数据库', '"built_in_analyzer"="unicode"');
```
```
[{ "token": "apache" }, { "token": "doris" }, { "token": "数" }, { "token": "据" }, { "token": "库" }]
```

```sql
-- ICU 分词器处理多语言文本
SELECT TOKENIZE("Hello World 世界", '"built_in_analyzer"="icu"');
```
```
[{ "token": "hello" }, { "token": "world" }, { "token": "世界" }]
```

```sql
-- 基础分词器
SELECT TOKENIZE("GET /images/hm_bg.jpg HTTP/1.0", '"built_in_analyzer"="basic"');
```
```
[{ "token": "get" }, { "token": "images" }, { "token": "hm" }, { "token": "bg" }, { "token": "jpg" }, { "token": "http" }, { "token": "1" }, { "token": "0" }]
```

```sql
-- IK 分词器处理中文文本
SELECT TOKENIZE("中华人民共和国国歌", '"built_in_analyzer"="ik"');
```
```
[{ "token": "中华人民共和国" }, { "token": "国歌" }]
```

#### 示例 2: 中文分词器的细粒度模式

```sql
SELECT TOKENIZE('我来到北京清华大学', '"built_in_analyzer"="chinese", "parser_mode"="fine_grained"');
```
```
[{ "token": "我" }, { "token": "来到" }, { "token": "北京" }, { "token": "清华" }, { "token": "清华大学" }, { "token": "华大" }, { "token": "大学" }]
```

#### 示例 3: 使用字符过滤器

```sql
SELECT TOKENIZE('GET /images/hm_bg.jpg HTTP/1.0 test:abc=bcd',
    '"built_in_analyzer"="unicode","char_filter_type" = "char_replace","char_filter_pattern" = "._=:,","char_filter_replacement" = " "');
```
```
[{ "token": "get" }, { "token": "images" }, { "token": "hm" }, { "token": "bg" }, { "token": "jpg" }, { "token": "http" }, { "token": "1" }, { "token": "0" }, { "token": "test" }, { "token": "abc" }, { "token": "bcd" }]
```

#### 示例 4: 启用短语支持(位置信息)

```sql
SELECT TOKENIZE("Hello World", '"built_in_analyzer"="standard", "support_phrase"="true"');
```
```
[{ "token": "hello", "position": 0 }, { "token": "world", "position": 1 }]
```

#### 示例 5: 使用自定义分词器

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

---

## 3.0 版本特性

:::info
3.0 版本的功能相比 3.1+ 版本有所限制,建议升级到 3.1+ 以获得增强功能。
:::

### 语法

```sql
ARRAY<VARCHAR> TOKENIZE(VARCHAR str, VARCHAR properties)
```

### 参数

3.0 版本的 `properties` 参数支持:

| 属性 | 描述 | 示例值 |
|------|------|--------|
| `parser` | 内置分词器类型 | `"chinese"`, `"english"`, `"unicode"` |
| `parser_mode` | 中文分词器的分词模式 | `"fine_grained"`, `"coarse_grained"` |
| `char_filter_type` | 字符过滤器类型 | `"char_replace"` |
| `char_filter_pattern` | 要替换的字符 | `"._=:,"` |
| `char_filter_replacement` | 替换字符 | `" "` (空格) |
| `stopwords` | 停用词配置 | `"none"` |

**3.0 版本不支持:**
- `built_in_analyzer` 参数
- `analyzer` 参数(自定义分词器)
- `support_phrase` 参数
- `lower_case` 参数
- 额外的分词器: `icu`, `basic`, `ik`, `standard`

### 返回值

返回 `ARRAY<VARCHAR>` 类型,包含分词后的字符串数组(简单字符串数组,不是 JSON 对象)。

### 示例

#### 示例 1: 使用中文分词器

```sql
SELECT TOKENIZE('我来到北京清华大学', "'parser'='chinese'");
```
```
["我", "来到", "北京", "清华大学"]
```

#### 示例 2: 中文分词器的细粒度模式

```sql
SELECT TOKENIZE('我来到北京清华大学', "'parser'='chinese', 'parser_mode'='fine_grained'");
```
```
["我", "来到", "北京", "清华", "清华大学", "华大", "大学"]
```

#### 示例 3: 使用 Unicode 分词器

```sql
SELECT TOKENIZE('Apache Doris数据库', "'parser'='unicode'");
```
```
["apache", "doris", "数", "据", "库"]
```

#### 示例 4: 使用字符过滤器

```sql
SELECT TOKENIZE('GET /images/hm_bg.jpg HTTP/1.0 test:abc=bcd',
    '"parser"="unicode","char_filter_type" = "char_replace","char_filter_pattern" = "._=:,","char_filter_replacement" = " "');
```
```
["get", "images", "hm", "bg", "jpg", "http", "1", "0", "test", "abc", "bcd"]
```

#### 示例 5: 停用词配置

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

---

## 注意事项

1. **版本兼容性**:
   - 3.0 版本使用 `parser` 参数,返回简单字符串数组
   - 3.1+ 版本同时支持 `parser`(向后兼容) 和 `built_in_analyzer`,返回 JSON 对象数组
   - 3.1+ 版本新增自定义分词器、更多内置分词器和短语支持功能

2. **支持的分词器**:
   - **3.0 版本**: `chinese`, `english`, `unicode`
   - **3.1+ 版本**: `standard`, `english`, `chinese`, `unicode`, `icu`, `basic`, `ik`, `none`

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
