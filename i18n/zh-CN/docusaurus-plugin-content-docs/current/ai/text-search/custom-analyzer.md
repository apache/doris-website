---
{
    "title": "自定义分词",
    "language": "zh-CN",
    "description": "自定义分词可以突破内置分词的局限，根据特定需求组合字符过滤器、分词器和词元过滤器，精细定义文本如何被切分成可搜索的词项，这直接决定了搜索结果的相关性与数据分析的准确性，是提升搜索体验与数据价值的底层关键。"
}
---

## 概述

自定义分词可以突破内置分词的局限，根据特定需求组合字符过滤器、分词器和词元过滤器，精细定义文本如何被切分成可搜索的词项，这直接决定了搜索结果的相关性与数据分析的准确性，是提升搜索体验与数据价值的底层关键。

![自定义分词示意图](/images/analyzer.png)

## 使用自定义分词

### 创建

#### 1. char_filter（字符过滤器）

```sql
CREATE INVERTED INDEX CHAR_FILTER IF NOT EXISTS x_char_filter
PROPERTIES (
  "type" = "char_replace"
  -- 其他参数见下文
);
```

`char_replace`：在分词前将指定字符替换为目标字符。
- 参数
  - `char_filter_pattern`：需要替换的字符列表
  - `char_filter_replacement`：替换后的字符（默认空格）
`icu_normalizer`：使用 ICU 标准化对文本进行预处理。
- 参数
  - `name`：标准化形式（默认 `nfkc_cf`）。可选：`nfc`、`nfkc`、`nfkc_cf`、`nfd`、`nfkd`
  - `mode`：标准化模式（默认 `compose`）。可选：`compose`（组合）、`decompose`（分解）
  - `unicode_set_filter`：指定需要标准化的字符集（如 `[a-z]`）

#### 2. tokenizer（分词器）

```sql
CREATE INVERTED INDEX TOKENIZER IF NOT EXISTS x_tokenizer
PROPERTIES (
  "type" = "standard"
);
```

- `standard`：标准分词（遵循 Unicode 文本分割），适用于多数语言
- `ngram`：按 N 元组切分
  - `min_ngram`：最小长度（默认 1）
  - `max_ngram`：最大长度（默认 2）
  - `token_chars`：保留字符类别（默认保留全部）。可选：`letter`、`digit`、`whitespace`、`punctuation`、`symbol`
- `edge_ngram`：从词首起始位置生成 N 元组
  - `min_ngram`：最小长度（默认 1）
  - `max_ngram`：最大长度（默认 2）
  - `token_chars`：同上
- `keyword`：整段文本作为一个词项输出，常与 token_filter 组合使用
- `char_group`：按给定字符切分
  - `tokenize_on_chars`：字符列表或类别，类别支持 `whitespace`、`letter`、`digit`、`punctuation`、`symbol`、`cjk`
- `basic`：简单英文/数字/中文/Unicode 分词
  - `extra_chars`：额外分割的 ASCII 字符（如 `[]().`）
- `icu`：ICU 国际化分词，支持多语言复杂脚本

#### 3. token_filter（词元过滤器）

```sql
CREATE INVERTED INDEX TOKEN_FILTER IF NOT EXISTS x_token_filter
PROPERTIES (
  "type" = "word_delimiter"
);
```

- `word_delimiter`：在非字母数字字符处切分，并可执行标准化
  - 默认规则：
    - 使用非字母数字字符作为分隔符（例：Super-Duper → Super, Duper）
    - 清除 token 首尾分隔符（例：XL---42+'Autocoder' → XL, 42, Autocoder）
    - 在大小写转换处切分（例：PowerShot → Power, Shot）
    - 在字母与数字交界处切分（例：XL500 → XL, 500）
    - 移除英文所有格 's（例：Neil's → Neil）
  - 可选参数：
    - `generate_number_parts`（默认 true）
    - `generate_word_parts`（默认 true）
    - `protected_words`
    - `split_on_case_change`（默认 true）
    - `split_on_numerics`（默认 true）
    - `stem_english_possessive`（默认 true）
    - `type_table`：自定义字符类型映射（如 `[+ => ALPHA, - => ALPHA]`），类型含 `ALPHA`、`ALPHANUM`、`DIGIT`、`LOWER`、`SUBWORD_DELIM`、`UPPER`
- `ascii_folding`：将非 ASCII 字符映射为等效 ASCII
- `lowercase`：将 token 文本转为小写
- `icu_normalizer`：使用 ICU 标准化对词元进行处理。
  - `name`：标准化形式（默认 `nfkc_cf`）。可选：`nfc`、`nfkc`、`nfkc_cf`、`nfd`、`nfkd`
  - `unicode_set_filter`：指定需要标准化的字符集

#### 4. analyzer（分析器）

```sql
CREATE INVERTED INDEX ANALYZER IF NOT EXISTS x_analyzer
PROPERTIES (
  "tokenizer" = "x_tokenizer",            -- 单个分词器
  "token_filter" = "x_filter1, x_filter2" -- 一个或多个 token_filter，按顺序执行
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
3. 预定义分词built_in_analyzer，自定义分词使用anlyzer，只能存在一个

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
