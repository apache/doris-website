---
{
    "title": "自定义分词",
    "language": "zh-CN"
}
---

## 介绍

自定义分词可以突破内置分词的局限，根据特定需求组合字符过滤器、分词器和词元过滤器，精细定义文本如何被切分成可搜索的词项，这直接决定了搜索结果的相关性与数据分析的准确性，是提升搜索体验与数据价值的底层关键。

## 使用自定义分词

### 创建

#### 1. char_filter

```sql
CREATE INVERTED INDEX CHAR_FILTER IF NOT EXISTS x_char_filter
PROPERTIES
(
    "type" = "char_replace",    // 类型（char_replace）
    "xxx" = "xxx"               // 参数
);
```

| 分词器 | 参数 | 解释 |
|--------|------|------|
| **char_replace** | | 将一系列字符替换为某个字符 |
| | char_filter_pattern | 需要替换的字符列表 |
| | char_filter_replacement | 替换后的字符 |

#### 2. tokenizer 分词器

```sql
CREATE INVERTED INDEX TOKENIZER IF NOT EXISTS x_tokenizer
PROPERTIES
(
    "type" = "standard",      // 类型（standard, ngram, edge_ngram, keyword, basic, icu）
    "xxx" = "xxx"             // 参数
);
```

| 分词器 | 参数 | 解释 |
|--------|------|------|
| **standard** | | 标准分词器提供基于语法的分词功能（遵循Unicode文本分割算法，具体规范见 Unicode Standard Annex #29），适用于大多数语言 |
| **ngram** | | ngram分词器在遇到指定字符列表中的任意字符时，会先将文本切分为单词，然后为每个单词生成指定长度的N元组 |
| | min_ngram | 单个字符元的最小长度。默认值为1 |
| | max_ngram | 单个字符元的最大长度。默认值为2 |
| | token_chars | 用于定义哪些字符应该被保留在一个token中。系统会根据不属于这些字符类的字符来分割文本（最终token仅保留配置的字符类型）。默认为空列表 []（保留所有字符）<br/>字符类别包括以下任意类型：<br/>- letter（字母） — 例如 a, b, ï 或 京<br/>- digit（数字） — 例如 3 或 7<br/>- whitespace（空白符） — 例如空格或换行符<br/>- punctuation（标点） — 例如 ! 或双引号<br/>- symbol（符号） — 例如 $ 或 √ |
| **edge_ngram** | | edge_ngram分词器在遇到指定字符列表中的任意字符时，会先将文本切分为单词，然后为每个单词生成固定锚定在词首起始位置的N元组 |
| | min_ngram | 单个字符元的最小长度，默认值为1 |
| | max_ngram | 单个字符元的最大长度，默认值为2 |
| | token_chars | 用于定义哪些字符应该被保留在一个token中。系统会根据不属于这些字符类的字符来分割文本（最终token仅保留配置的字符类型）。默认为空列表 []（保留所有字符）<br/>字符类别支持以下类型：<br/>- letter（字母） — 例如 a, b, ï 或 京<br/>- digit（数字） — 例如 3 或 7<br/>- whitespace（空白符） — 例如空格或换行符<br/>- punctuation（标点） — 例如 ! 或双引号<br/>- symbol（符号） — 例如 $ 或 √ |
| **keyword** | | keyword分词器是一种无操作型分词器，它接受任意输入文本并将原始文本作为单一术语完整输出。该分词器可配合token过滤器使用以实现输出标准化，例如将电子邮件地址转为小写形式 |
| **char_group** | tokenize_on_chars | 一个包含字符的列表，用于指定字符串的分词依据。每当遇到该列表中的字符时，就会开始一个新的token。该列表可以接受单个字符（例如 -），也可以接受字符类别，包括：空白符（whitespace）、字母（letter）、数字（digit）、标点符号（punctuation）、符号（symbol）和 中文（cjk） |
| **basic** | extra_chars | 简单的英文，数字，中文，unicode分词器。例如 extra_chars = \[\]\(\)\.<br/>在默认分词的逻辑之外，将配置的ascii字符分割出来 |
| **icu** | | 国际话文字切分，支持所有国家文本 |

#### 3. token_filter 过滤器

```sql
CREATE INVERTED INDEX TOKEN_FILTER IF NOT EXISTS x_token_filter
PROPERTIES
(
    "type" = "word_delimiter",    // 类型（word_delimiter, ascii_folding, lowercase）
    "xxx" = "xxx"                 // 参数
);
```

| 过滤器 | 参数 | 解释 |
|--------|------|------|
| **word_delimiter** | | 在非字母数字字符处切分token，并根据预设规则执行可选的token标准化。默认规则如下：<br/>1. 非字母数字切分 → 使用非字母数字字符作为分隔符<br/>示例： Super-Duper → [ Super, Duper ]<br/>2. 移除首尾分隔符 → 清除token首尾的分隔符<br/>示例： XL---42+'Autocoder' → [ XL, 42, Autocoder ]<br/>3. 大小写转换切分 → 在字母大小写转换处切分<br/>示例： PowerShot → [ Power, Shot ]<br/>4. 字母数字过渡切分 → 在字母与数字交界处切分<br/>示例： XL500 → [ XL, 500 ]<br/>5. 移除英文所有格 → 删除词末的's所有格形式<br/>示例： Neil's → [ Neil ] |
| | generate_number_parts | 设为true时，输出包含纯数字token；设为false则排除。默认为true |
| | generate_word_parts | 设为true时，输出包含纯字母token；设为false则排除。默认为true |
| | protected_words | 禁止切分的token列表 |
| | split_on_case_change | 设为true时，在字母大小写转换处切分（如：camelCase → [camel, Case]）。默认为true |
| | split_on_numerics | 设为true时，在字母数字交界处切分（如：j2se → [j, 2, se]）。默认为true |
| | stem_english_possessive | 设为true时，移除英文所有格's后缀（如：O'Neil's → [O, Neil]）。默认为true |
| | type_table | 自定义字符类型映射表。可将非字母数字字符映射为数字/字母类型避免被切分<br/>示例配置： \[ + => ALPHA, - => ALPHA \]<br/>支持映射类型：<br/>- ALPHA（字母）<br/>- ALPHANUM（字母数字）<br/>- DIGIT（数字）<br/>- LOWER（小写字母）<br/>- SUBWORD_DELIM（非字母数字分隔符）<br/>- UPPER（大写字母） |
| **ascii_folding** | | 该过滤器将不在基本拉丁语Unicode区块（即前127个ASCII字符）内的字母、数字及符号字符转换为其等效的ASCII字符（若存在对应字符）。例如：将à转换为a |
| **lowercase** | | 将token文本转为小写形式。例如：输入THE Lazy DoG → 输出the lazy dog（保留原文形态） |

#### 4. analyzer 分析器

```sql
CREATE INVERTED INDEX ANALYZER IF NOT EXISTS x_analyzer
PROPERTIES
(
    "tokenizer" = "x_tokenizer",                           // 单个分词器
    "token_filter" = "x_token_filter1, x_token_filter2"    // 单个或多个token_filter，按顺序执行
);
```

### 查看

```sql
SHOW INVERTED INDEX TOKENIZER;
SHOW INVERTED INDEX TOKEN_FILTER;
SHOW INVERTED INDEX ANALYZER;
```

### 删除

```sql
DROP INVERTED INDEX TOKENIZER IF EXISTS x_tokenizer;
DROP INVERTED INDEX TOKEN_FILTER IF EXISTS x_token_filter;
DROP INVERTED INDEX ANALYZER IF EXISTS x_analyzer;
```

## 建表中使用自定义分词

1. 自定义分词在索引properties中使用analyzer来设置自定义分词器
2. properties中analyzer可以配合使用的只有support_phrase

```sql
CREATE TABLE tbl (
    `a` bigint NOT NULL AUTO_INCREMENT(1),
    `ch` text NULL,
    INDEX idx_ch (`ch`) USING INVERTED PROPERTIES("analyzer" = "x_custom_analyzer", "support_phrase" = "true")
)
table_properties;
```

## 使用限制

1. tokenizer和token_filter中type和参数只能填写目前支持的分词器和词元过滤器，否则建表失败
2. 只有在没有任何表使用analyzer的时候才能删除它
3. 只有在没有任何analyzer使用tokenizer和token_filter的情况下才能删除它
4. 使用自定义分词语法10s后会被同步到be，之后导入正常不会报错

## 注意事项

1. 自定义分词analyzer嵌套多个可能会导致分词性能降低
2. select tokenize 分词函数支持自定义分词
3. 预定义分词使用parser，自定义分词使用anlyzer，只能存在一个

## 完整示例

### 示例1

使用edge_ngram对电话号码进行分词

```sql
CREATE INVERTED INDEX TOKENIZER IF NOT EXISTS edge_ngram_phone_number_tokenizer
PROPERTIES
(
    "type" = "edge_ngram",
    "min_gram" = "3",
    "max_gram" = "10",
    "token_chars" = "digit"
);

CREATE INVERTED INDEX ANALYZER IF NOT EXISTS edge_ngram_phone_number
PROPERTIES
(
    "tokenizer" = "edge_ngram_phone_number_tokenizer"
);

CREATE TABLE tbl (
    `a` bigint NOT NULL AUTO_INCREMENT(1),
    `ch` text NULL,
    INDEX idx_ch (`ch`) USING INVERTED PROPERTIES("support_phrase" = "true", "analyzer" = "edge_ngram_phone_number")
) ENGINE=OLAP
DUPLICATE KEY(`a`)
DISTRIBUTED BY RANDOM BUCKETS 1
PROPERTIES (
"replication_allocation" = "tag.location.default: 1"
);

select tokenize('13891972631', '"analyzer"="edge_ngram_phone_number"');
```

返回结果：
```json
[
  {"token":"138"},
  {"token":"1389"},
  {"token":"13891"},
  {"token":"138919"},
  {"token":"1389197"},
  {"token":"13891972"},
  {"token":"138919726"},
  {"token":"1389197263"}
]
```

### 示例2

使用standard + word_delimiter进行配合精细分词

```sql
CREATE INVERTED INDEX TOKEN_FILTER IF NOT EXISTS word_splitter
PROPERTIES
(
    "type" = "word_delimiter",
    "split_on_numerics" = "false",
    "split_on_case_change" = "false"
);

CREATE INVERTED INDEX ANALYZER IF NOT EXISTS lowercase_delimited
PROPERTIES
(
    "tokenizer" = "standard",
    "token_filter" = "asciifolding, word_splitter, lowercase"
);

CREATE TABLE tbl (
    `a` bigint NOT NULL AUTO_INCREMENT(1),
    `ch` text NULL,
    INDEX idx_ch (`ch`) USING INVERTED PROPERTIES("support_phrase" = "true", "analyzer" = "lowercase_delimited")
) ENGINE=OLAP
DUPLICATE KEY(`a`)
DISTRIBUTED BY RANDOM BUCKETS 1
PROPERTIES (
"replication_allocation" = "tag.location.default: 1"
);

select tokenize('The server at IP 192.168.1.15 sent a confirmation to user_123@example.com, requiring a quickResponse before the deadline.', '"analyzer"="lowercase_delimited"');
```

返回结果：
```json
[
  {"token":"the"},
  {"token":"server"},
  {"token":"at"},
  {"token":"ip"},
  {"token":"192"},
  {"token":"168"},
  {"token":"1"},
  {"token":"15"},
  {"token":"sent"},
  {"token":"a"},
  {"token":"confirmation"},
  {"token":"to"},
  {"token":"user"},
  {"token":"123"},
  {"token":"example"},
  {"token":"com"},
  {"token":"requiring"},
  {"token":"a"},
  {"token":"quickresponse"},
  {"token":"before"},
  {"token":"the"},
  {"token":"deadline"}
]
```

### 示例3

使用keyword保留原词利用多个token_filter进行分词

```sql
CREATE INVERTED INDEX ANALYZER IF NOT EXISTS keyword_lowercase
PROPERTIES
(
"tokenizer" = "keyword",
"token_filter" = "asciifolding, lowercase"
);

CREATE TABLE tbl (
    `a` bigint NOT NULL AUTO_INCREMENT(1),
    `ch` text NULL,
    INDEX idx_ch (`ch`) USING INVERTED PROPERTIES("support_phrase" = "true", "analyzer" = "keyword_lowercase")
) ENGINE=OLAP
DUPLICATE KEY(`a`)
DISTRIBUTED BY RANDOM BUCKETS 1
PROPERTIES (
"replication_allocation" = "tag.location.default: 1"
);

select tokenize('hÉllo World', '"analyzer"="keyword_lowercase"');
```

返回结果：
```json
[
  {"token":"hello world"}
]
```
