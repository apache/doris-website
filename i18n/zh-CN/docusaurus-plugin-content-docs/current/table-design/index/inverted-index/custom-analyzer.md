---
{
    "title": "自定义分词",
    "language": "zh-CN",
    "description": "Doris 自定义分词通过组合字符过滤器、分词器与词元过滤器，灵活控制文本切分策略，提升倒排索引的搜索相关性与精度。",
    "keywords": [
        "自定义分词",
        "custom analyzer",
        "倒排索引分词器",
        "tokenizer",
        "token_filter",
        "char_filter",
        "edge_ngram",
        "word_delimiter",
        "USING ANALYZER",
        "多分词索引"
    ]
}
---

<!-- 知识类型: 功能概述 + 配置参数 + 操作步骤 -->
<!-- 适用场景: 倒排索引文本分词定制 / 多语言搜索 / 自动补全 / 精确匹配 -->

自定义分词（Custom Analyzer）通过组合 **字符过滤器（char_filter）**、**分词器（tokenizer）** 和 **词元过滤器（token_filter）**，让用户根据业务需求精细定义文本如何被切分成可搜索的词项。它突破了内置分词的局限，直接影响搜索结果的相关性与数据分析的准确性。

![自定义分词示意图](/images/analyzer.png)

### 适用场景

| 场景 | 推荐组合 |
| --- | --- |
| 多语言混合文本搜索 | `icu` 分词器 + `icu_normalizer` 过滤器 |
| 电话号码 / 编码前缀匹配 | `edge_ngram` 分词器 |
| 复杂英文文本拆分（驼峰、连字符等） | `standard` 分词器 + `word_delimiter` 过滤器 |
| 自动补全 / 输入提示 | `edge_ngram` 分词器 + `lowercase` 过滤器 |
| 精确匹配（保留原词） | `keyword` 分词器 + `lowercase`/`asciifolding` 过滤器 |

---

## 核心组件

自定义分词由四类对象组成，按顺序作用于原始文本：

```
原始文本 ──► [char_filter] ──► [tokenizer] ──► [token_filter] ──► 词项
```

| 组件 | 作用 | 数量 |
| --- | --- | --- |
| `char_filter` | 分词前对字符进行预处理（如替换、标准化） | 0 ~ N |
| `tokenizer` | 将文本切分成词项 | 1 |
| `token_filter` | 对切分后的词项做加工（如小写、ASCII 折叠） | 0 ~ N |
| `analyzer` | 将上述组件组装为完整的分词管道 | 1 |

---

## 创建自定义分词

### 1. 字符过滤器（char_filter）

```sql
CREATE INVERTED INDEX CHAR_FILTER IF NOT EXISTS x_char_filter
PROPERTIES (
    "type" = "char_replace"
    -- 其他参数见下文
);
```

支持的字符过滤器类型：

- **`char_replace`**：在分词前将指定字符替换为目标字符。
    - `char_filter_pattern`：需要替换的字符列表
    - `char_filter_replacement`：替换后的字符（默认空格）

- **`icu_normalizer`**：使用 ICU 标准化对文本进行预处理。
    - `name`：标准化形式（默认 `nfkc_cf`）。可选：`nfc`、`nfkc`、`nfkc_cf`、`nfd`、`nfkd`
    - `mode`：标准化模式（默认 `compose`）。可选：`compose`（组合）、`decompose`（分解）
    - `unicode_set_filter`：指定需要标准化的字符集（如 `[a-z]`）

### 2. 分词器（tokenizer）

```sql
CREATE INVERTED INDEX TOKENIZER IF NOT EXISTS x_tokenizer
PROPERTIES (
    "type" = "standard"
);
```

支持的分词器类型：

| 类型 | 说明 | 主要参数 |
| --- | --- | --- |
| `standard` | 标准分词（遵循 Unicode 文本分割），适用于多数语言 | 无 |
| `ngram` | 按 N 元组切分 | `min_ngram`、`max_ngram`、`token_chars` |
| `edge_ngram` | 从词首起始位置生成 N 元组 | `min_ngram`、`max_ngram`、`token_chars` |
| `keyword` | 整段文本作为一个词项输出，常与 token_filter 组合 | 无 |
| `char_group` | 按给定字符切分 | `tokenize_on_chars` |
| `basic` | 简单英文 / 数字 / 中文 / Unicode 分词 | `extra_chars` |
| `icu` | ICU 国际化分词，支持多语言复杂脚本 | 无 |

参数说明：

- `min_ngram`：最小长度（默认 1）
- `max_ngram`：最大长度（默认 2）
- `token_chars`：保留字符类别（默认保留全部）。可选：`letter`、`digit`、`whitespace`、`punctuation`、`symbol`
- `tokenize_on_chars`：字符列表或类别，类别支持 `whitespace`、`letter`、`digit`、`punctuation`、`symbol`、`cjk`
- `extra_chars`：额外分割的 ASCII 字符（如 `[]().`）

### 3. 词元过滤器（token_filter）

```sql
CREATE INVERTED INDEX TOKEN_FILTER IF NOT EXISTS x_token_filter
PROPERTIES (
    "type" = "word_delimiter"
);
```

支持的词元过滤器类型：

| 类型 | 作用 |
| --- | --- |
| `word_delimiter` | 在非字母数字字符处切分，并可执行标准化 |
| `ascii_folding` | 将非 ASCII 字符映射为等效 ASCII |
| `lowercase` | 将 token 文本转为小写 |
| `icu_normalizer` | 使用 ICU 标准化对词元进行处理 |

#### word_delimiter 详解

默认行为：

1. 使用非字母数字字符作为分隔符（例：`Super-Duper` → `Super`, `Duper`）
2. 清除 token 首尾分隔符（例：`XL---42+'Autocoder'` → `XL`, `42`, `Autocoder`）
3. 在大小写转换处切分（例：`PowerShot` → `Power`, `Shot`）
4. 在字母与数字交界处切分（例：`XL500` → `XL`, `500`）
5. 移除英文所有格 `'s`（例：`Neil's` → `Neil`）

可选参数：

| 参数 | 默认值 | 说明 |
| --- | --- | --- |
| `generate_number_parts` | `true` | 是否输出数字部分 |
| `generate_word_parts` | `true` | 是否输出单词部分 |
| `protected_words` | 无 | 受保护的词，不参与切分 |
| `split_on_case_change` | `true` | 是否在大小写变化处切分 |
| `split_on_numerics` | `true` | 是否在字母与数字交界处切分 |
| `stem_english_possessive` | `true` | 是否移除英文所有格 `'s` |
| `type_table` | 无 | 自定义字符类型映射表 |

`type_table` 支持映射类型：

- `ALPHA`（字母）
- `ALPHANUM`（字母数字）
- `DIGIT`（数字）
- `LOWER`（小写字母）
- `SUBWORD_DELIM`（非字母数字分隔符）
- `UPPER`（大写字母）

示例：`["+ => ALPHA", "- => ALPHA"]` 可将 `+`、`-` 视为字母而不被切分。

#### icu_normalizer 参数

- `name`：标准化形式（默认 `nfkc_cf`）。可选：`nfc`、`nfkc`、`nfkc_cf`、`nfd`、`nfkd`
- `unicode_set_filter`：指定需要标准化的字符集

### 4. 分析器（analyzer）

将上述组件组装成完整的分词管道：

```sql
CREATE INVERTED INDEX ANALYZER IF NOT EXISTS x_analyzer
PROPERTIES (
    "tokenizer" = "x_tokenizer",            -- 单个分词器
    "token_filter" = "x_filter1, x_filter2" -- 一个或多个 token_filter，按顺序执行
);
```

---

## 在表中使用自定义分词

通过索引 `PROPERTIES` 中的 `analyzer` 字段引用已创建的自定义分析器：

```sql
CREATE TABLE tbl (
    `a` bigint NOT NULL AUTO_INCREMENT(1),
    `ch` text NULL,
    INDEX idx_ch (`ch`) USING INVERTED PROPERTIES("analyzer" = "x_custom_analyzer", "support_phrase" = "true")
)
table_properties;
```

注意事项：

1. 自定义分词在索引 `PROPERTIES` 中通过 `analyzer` 设置
2. 与 `analyzer` 同时使用的 properties 仅有 `support_phrase`

---

## 一列多分词索引

Doris 支持在同一列上创建多个使用不同分词器的倒排索引，使同一份数据可用不同分词策略检索。

### 应用场景

- **多语言支持**：在同一文本列上使用不同语言的分词器
- **搜索精度与召回率平衡**：关键词分词器用于精确匹配，标准分词器用于模糊搜索
- **自动补全**：edge_ngram 分词器用于前缀匹配，标准分词器用于常规搜索

### 创建多个索引

```sql
-- 1. 创建不同分词策略的分词器
CREATE INVERTED INDEX ANALYZER IF NOT EXISTS std_analyzer
PROPERTIES ("tokenizer" = "standard", "token_filter" = "lowercase");

CREATE INVERTED INDEX ANALYZER IF NOT EXISTS kw_analyzer
PROPERTIES ("tokenizer" = "keyword", "token_filter" = "lowercase");

CREATE INVERTED INDEX TOKENIZER IF NOT EXISTS edge_ngram_tokenizer
PROPERTIES (
    "type" = "edge_ngram",
    "min_gram" = "1",
    "max_gram" = "20",
    "token_chars" = "letter"
);

CREATE INVERTED INDEX ANALYZER IF NOT EXISTS ngram_analyzer
PROPERTIES ("tokenizer" = "edge_ngram_tokenizer", "token_filter" = "lowercase");

-- 2. 在同一列上创建多个索引
CREATE TABLE articles (
    id INT,
    content TEXT,
    -- 标准分词器用于分词搜索
    INDEX idx_content_std (content) USING INVERTED
        PROPERTIES("analyzer" = "std_analyzer", "support_phrase" = "true"),
    -- 关键词分词器用于精确匹配
    INDEX idx_content_kw (content) USING INVERTED
        PROPERTIES("analyzer" = "kw_analyzer"),
    -- edge n-gram 分词器用于自动补全
    INDEX idx_content_ngram (content) USING INVERTED
        PROPERTIES("analyzer" = "ngram_analyzer")
) ENGINE=OLAP
DUPLICATE KEY(id)
DISTRIBUTED BY HASH(id) BUCKETS 1
PROPERTIES ("replication_allocation" = "tag.location.default: 1");
```

### 查询时指定分词器

使用 `USING ANALYZER` 子句指定使用哪个索引：

```sql
-- 插入测试数据
INSERT INTO articles VALUES
    (1, 'hello world'),
    (2, 'hello'),
    (3, 'world'),
    (4, 'hello world test');

-- 分词搜索：匹配包含 'hello' 词项的行
-- 返回：1, 2, 4
SELECT id FROM articles WHERE content MATCH 'hello' USING ANALYZER std_analyzer ORDER BY id;

-- 精确匹配：仅匹配精确的 'hello' 字符串
-- 返回：2
SELECT id FROM articles WHERE content MATCH 'hello' USING ANALYZER kw_analyzer ORDER BY id;

-- 使用 edge n-gram 进行前缀匹配
-- 返回：1, 2, 4（所有以 'hel' 开头的行）
SELECT id FROM articles WHERE content MATCH 'hel' USING ANALYZER ngram_analyzer ORDER BY id;
```

也可直接使用内置分词器：

```sql
SELECT * FROM articles WHERE content MATCH 'hello' USING ANALYZER standard;
SELECT * FROM articles WHERE content MATCH 'hello' USING ANALYZER none;
SELECT * FROM articles WHERE content MATCH '你好' USING ANALYZER chinese;
```

### 为已有表添加索引

```sql
-- 添加使用不同分词器的新索引
ALTER TABLE articles ADD INDEX idx_content_chinese (content)
USING INVERTED PROPERTIES("parser" = "chinese");

-- 等待 schema change 完成
SHOW ALTER TABLE COLUMN WHERE TableName='articles';
```

### 构建索引

添加索引后，需要为已有数据构建索引：

```sql
-- 构建指定索引（非云模式）
BUILD INDEX idx_content_chinese ON articles;

-- 构建所有索引（云模式）
BUILD INDEX ON articles;

-- 查看构建进度
SHOW BUILD INDEX WHERE TableName='articles';
```

### 关键说明

1. **分词器身份识别**：两个具有相同 `tokenizer` 和 `token_filter` 配置的分词器被视为相同。不能在同一列上创建具有相同分词器身份的多个索引。
2. **索引选择行为**：
    - 使用 `USING ANALYZER` 时，如果指定分词器的索引存在且已构建，则使用该索引
    - 如果索引未构建，查询会降级到非索引路径（结果正确，但性能较慢）
    - 未使用 `USING ANALYZER` 时，可能使用任意可用的索引
3. **性能考虑**：
    - 每增加一个索引都会增加存储空间和写入开销
    - 根据实际查询模式选择分词器
    - 如果查询模式可预测，考虑使用较少的索引

---

## 管理与维护

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

---

## 完整示例

### 示例 1：电话号码前缀匹配

使用 `edge_ngram` 对电话号码生成所有前缀片段，便于实现「输入即搜」。

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

SELECT tokenize('13891972631', '"analyzer"="edge_ngram_phone_number"');
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

### 示例 2：复杂英文文本精细分词

使用 `standard` 分词器配合 `word_delimiter` 实现更精细的分词，并叠加大小写归一化与 ASCII 折叠。

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

SELECT tokenize('The server at IP 192.168.1.15 sent a confirmation to user_123@example.com, requiring a quickResponse before the deadline.', '"analyzer"="lowercase_delimited"');
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

### 示例 3：保留原词的精确匹配

使用 `keyword` 分词器保留整段文本，再通过 `lowercase`、`asciifolding` 做归一化，常用于精确匹配大小写不敏感的字符串。

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

SELECT tokenize('hÉllo World', '"analyzer"="keyword_lowercase"');
```

返回结果：

```json
[
    {"token":"hello world"}
]
```

---

## 使用限制

1. `tokenizer` 和 `token_filter` 中的 `type` 与参数只能填写当前支持的分词器和词元过滤器，否则建表失败。
2. 只有在没有任何表使用某个 `analyzer` 时，才能删除该 `analyzer`。
3. 只有在没有任何 `analyzer` 使用某个 `tokenizer` 或 `token_filter` 时，才能删除它们。
4. 自定义分词语法在执行 10 秒后同步到 BE，之后导入不会报错。

---

## 注意事项

1. 自定义分词 `analyzer` 嵌套多个组件可能导致分词性能降低。
2. `select tokenize` 分词函数支持自定义分词，可用于调试切分效果。
3. 预定义分词 `built_in_analyzer` 与自定义分词 `analyzer` 在同一索引上只能存在一个。
