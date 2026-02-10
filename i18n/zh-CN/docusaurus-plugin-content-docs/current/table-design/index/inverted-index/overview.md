---
{
    "title": "倒排索引",
    "sidebar_label": "概述",
    "language": "zh-CN",
    "description": "倒排索引，是信息检索领域常用的索引技术，将文本分成一个个词，构建 词 -> 文档编号 的索引，可以快速查找一个词在哪些文档出现。"
}
---

## 索引原理

[倒排索引](https://zh.wikipedia.org/wiki/%E5%80%92%E6%8E%92%E7%B4%A2%E5%BC%95)，是信息检索领域常用的索引技术，将文本分成一个个词，构建 词 -> 文档编号 的索引，可以快速查找一个词在哪些文档出现。

从 2.0.0 版本开始，Doris 支持倒排索引，可以用来进行文本类型的全文检索、普通数值日期类型的等值范围查询，快速从海量数据中过滤出满足条件的行。

在 Doris 的倒排索引实现中，Table 的一行对应一个文档、一列对应文档中的一个字段，因此利用倒排索引可以根据关键词快速定位包含它的行，达到 WHERE 子句加速的目的。

与 Doris 中其他索引不同的是，在存储层倒排索引使用独立的文件，跟数据文件一一对应、但物理存储上文件相互独立。这样的好处是可以做到创建、删除索引不用重写数据文件，大幅降低处理开销。


## 使用场景

倒排索引的使用范围很广泛，可以加速等值、范围、全文检索（关键词匹配、短语系列匹配等）。一个表可以有多个倒排索引，查询时多个倒排索引的条件可以任意组合。

倒排索引的功能简要介绍如下：

**1. 加速字符串类型的全文检索**

- 支持关键词检索，包括同时匹配多个关键字 `MATCH_ALL`、匹配任意一个关键字 `MATCH_ANY`

- 支持短语查询 `MATCH_PHRASE`
  - 支持指定词距 `slop`
  - 支持短语 + 前缀 `MATCH_PHRASE_PREFIX`

- 支持分词正则查询 `MATCH_REGEXP`

- 支持英文、中文以及 Unicode, IK, ICU等多种分词

**2. 加速普通等值、范围查询，覆盖原来 BITMAP 索引的功能，代替 BITMAP 索引**

- 支持字符串、数值、日期时间类型的 =, !=, >, >=, <, <= 快速过滤

- 支持字符串、数字、日期时间数组类型的 =, !=, >, >=, <, <=

**3. 支持完善的逻辑组合**

- 不仅支持 AND 条件加速，还支持 OR NOT 条件加速

- 支持多个条件的任意 AND OR NOT 逻辑组合

**4. 灵活高效的索引管理**

- 支持在创建表上定义倒排索引

- 支持在已有的表上增加倒排索引，而且支持增量构建倒排索引，无需重写表中的已有数据

- 支持删除已有表上的倒排索引，无需重写表中的已有数据

:::tip

倒排索引的使用有下面一些限制：

1. 存在精度问题的浮点数类型 FLOAT 和 DOUBLE 不支持倒排索引，原因是浮点数精度不准确。解决方案是使用精度准确的定点数类型 DECIMAL，DECIMAL 支持倒排索引。

2. 部分复杂数据类型还不支持倒排索引，包括：MAP、STRUCT、JSON、HLL、BITMAP、QUANTILE_STATE、AGG_STATE。其中 MAP、STRUCT 会逐步支持，JSON 类型可以换成 VARIANT 类型获得支持。其他几个类型因为其特殊用途暂不需要支持倒排索引。

3. DUPLICATE 和 开启 Merge-on-Write 的 UNIQUE 表模型支持任意列建倒排索引。但是 AGGREGATE 和 未开启 Merge-on-Write 的 UNIQUE 模型仅支持 Key 列建倒排索引，非 Key 列不能建倒排索引，这是因为这两个模型需要读取所有数据后做合并，因此不能利用索引做提前过滤。

:::

## 管理索引

### 建表时定义倒排索引

在建表语句中 COLUMN 的定义之后是索引定义：

```sql
CREATE TABLE table_name
(
  column_name1 TYPE1,
  column_name2 TYPE2,
  column_name3 TYPE3,
  INDEX idx_name1(column_name1) USING INVERTED [PROPERTIES(...)] [COMMENT 'your comment'],
  INDEX idx_name2(column_name2) USING INVERTED [PROPERTIES(...)] [COMMENT 'your comment']
)
table_properties;
```

语法说明如下：

**1. `idx_column_name(column_name)` 是必须的，`column_name` 是建索引的列名，必须是前面列定义中出现过的，`idx_column_name` 是索引名字，必须表级别唯一，建议命名规范：列名前面加前缀 `idx_`**

**2. `USING INVERTED` 是必须的，用于指定索引类型是倒排索引**

**3. `PROPERTIES` 是可选的，用于指定倒排索引的额外属性，目前支持的属性如下：**

<details>
  <summary>parser 指定分词器</summary>

  - 默认不指定表示不分词
  - `english`：英文分词，适合英文文本；使用空格和标点分词，性能高
  - `chinese`：中文分词，适合中文文本；性能较 `english` 略低
  - `unicode`：多语言分词，适用于中英文混合/多语言文本；可对邮箱前后缀、IP 地址、字母数字混合进行分词，并支持中文按字符分词
  - `icu`（自 3.1.0 起支持）：ICU 分词，基于 ICU 库，适用于国际化文本与复杂书写系统（如阿拉伯语、泰语等）
  - `basic`（自 3.1.0 起支持）：基本规则分词器；连续字母数字为一词，中文按字切分，忽略标点/空格/特殊字符；性能最高但分词规则更简单，日志场景中可作为替换unicode分词器。
  - `ik`（自 3.1.0 起支持）：IK 中文分词，适用于中文文本分析

  分词效果可通过 `TOKENIZE` SQL 函数验证，详见后续章节。

</details>

<details>
  <summary>parser_mode</summary>

  用于指定分词模式（`parser = chinese` 时可用）：

  - `fine_grained`：细粒度，倾向于分出更短、更多的词；如“武汉市长江大桥”→“武汉”“武汉市”“市长”“长江”“长江大桥”“大桥”
  - `coarse_grained`：粗粒度，倾向于分出更长、更少的词；如“武汉市长江大桥”→“武汉市”“长江大桥”
  - 默认：`coarse_grained`

</details>

<details>
  <summary>support_phrase</summary>

  是否支持 `MATCH_PHRASE` 短语查询加速：

  - `true`：支持，但索引占用更多存储空间
  - `false`：不支持，更省存储；可用 `MATCH_ALL` 查询多个关键词
  - 自 2.0.14、2.1.5、3.0.1 起：若设置了 `parser`，默认 `true`；否则默认 `false`

  示例：中文分词 + 粗粒度模式 + 支持短语加速：

```sql
INDEX idx_name(column_name) USING INVERTED PROPERTIES(
  "parser" = "chinese",
  "parser_mode" = "coarse_grained",
  "support_phrase" = "true"
)
```

</details>

<details>
  <summary>char_filter</summary>

  在分词前对文本进行预处理，影响分词行为。

  - `char_filter_type`：char_filter 类型（目前仅支持 `char_replace`）
  - `char_replace`：将 `pattern` 中每个字符替换为 `replacement` 中的字符
  - `char_filter_pattern`：需要替换的字符
  - `char_filter_replacement`：替换后的字符（可选，默认空格）

  示例：将点和下划线替换为空格，使其作为词分隔符。

```sql
INDEX idx_name(column_name) USING INVERTED PROPERTIES(
  "parser" = "unicode",
  "char_filter_type" = "char_replace",
  "char_filter_pattern" = "._",
  "char_filter_replacement" = " "
)
```

</details>

<details>
  <summary>ignore_above</summary>

  指定不分词字符串索引（未指定 `parser`）的长度限制。

  - 长度超过 `ignore_above` 的字符串不会被索引；对字符串数组，该限制分别作用于每个元素
  - 默认值：`256`（字节）

</details>

<details>
  <summary>lower_case</summary>

  是否将分词结果转换为小写，以便实现不区分大小写匹配。

  - `true`：转换为小写
  - `false`：不转换
  - 自 2.0.7 和 2.1.2 起默认 `true`；更早版本默认 `false`

</details>

<details>
  <summary>stopwords</summary>

  指定停用词表，会影响分词器行为。

  - 内置停用词表包含常见无意义词（如 `is`、`the`、`a` 等），写入或查询时将被忽略
  - `none`：使用空的停用词表

</details>

<details>
  <summary>dict_compression（自 3.1.0 起支持）</summary>

  是否对倒排索引的词典启用 ZSTD 字典压缩。

  - `true`：启用字典压缩
  - `false`：默认，不启用
  - 建议：对大文本/日志或重视存储成本的场景启用；与 `inverted_index_storage_format = "V3"` 搭配效果最佳，对大规模文本与日志场景可减少约 20% 存储。

  示例：

```sql
INDEX idx_name(column_name) USING INVERTED PROPERTIES(
  "parser" = "english",
  "dict_compression" = "true"
)
```

</details>

**4. `COMMENT` 是可选的，用于指定索引注释**

**5. 表级属性 `inverted_index_storage_format`**

  **inverted_index_storage_format 取值：**
  - "V1": 每个索引一个独立的idx文件
  - "V2": 所有索引统一一个idx文件，有效降低索引文件读写的IO
  - "V3": 当前最新的存储格式，和V2格式类似，但是具有优化的索引文件压缩能力。(该功能自 3.1.0 版本开始支持，4.0.1开始作为默认存储格式)

  与 V2 相比，V3 提供：

    1. 对词典启用 ZSTD 字典压缩(当 dict_compression 启用时)
    2. 对每个词关联的位置信息进行压缩
    3. 使用建议：对于大规模文本数据和日志分析场景，建议使用V3，可节省约20%的存储空间。

要使用新的 V3 存储格式，在建表时指定此属性：

```sql
CREATE TABLE table_name (
    column_name TEXT,
    INDEX idx_name(column_name) USING INVERTED PROPERTIES("parser" = "english", "dict_compression" = "true")
) PROPERTIES (
    "inverted_index_storage_format" = "V3"
);
```

### 已有表增加倒排索引


**1. ADD INDEX**

支持`CREATE INDEX` 和 `ALTER TABLE ADD INDEX` 两种语法，参数跟建表时索引定义相同

```sql
-- 语法 1
CREATE INDEX idx_name ON table_name(column_name) USING INVERTED [PROPERTIES(...)] [COMMENT 'your comment'];
-- 语法 2
ALTER TABLE table_name ADD INDEX idx_name(column_name) USING INVERTED [PROPERTIES(...)] [COMMENT 'your comment'];
```

**2. BUILD INDEX**

`CREATE / ADD INDEX` 操作只是新增了索引定义，这个操作之后的新写入数据会生成倒排索引，而存量数据需要使用 `BUILD INDEX` 触发：

```sql
-- 语法 1，默认给全表的所有分区 BUILD INDEX
BUILD INDEX index_name ON table_name;
-- 语法 2，可指定 Partition，可指定一个或多个
BUILD INDEX index_name ON table_name PARTITIONS(partition_name1, partition_name2);
```

通过 `SHOW BUILD INDEX` 查看 `BUILD INDEX` 进度：
```sql
SHOW BUILD INDEX [FROM db_name];
-- 示例 1，查看所有的 BUILD INDEX 任务进展
SHOW BUILD INDEX;
-- 示例 2，查看指定 table 的 BUILD INDEX 任务进展
SHOW BUILD INDEX where TableName = "table1";
```

通过 `CANCEL BUILD INDEX` 取消 `BUILD INDEX`：
```sql
CANCEL BUILD INDEX ON table_name;
CANCEL BUILD INDEX ON table_name (job_id1,jobid_2,...);
```

:::tip

`BUILD INDEX` 会生成一个异步任务执行，在每个 BE 上有多个线程执行索引构建任务，通过 BE 参数 `alter_index_worker_count` 可以设置，默认值是 3。

2.0.12 和 2.1.4 之前的版本 `BUILD INDEX` 会一直重试直到成功，从这两个版本开始通过失败和超时机制避免一直重试。3.0 存算分离模式暂不支持此命令。

1. 一个 tablet 的多数副本 `BUILD INDEX` 失败后，整个 `BUILD INDEX` 失败结束
2. 时间超过 `alter_table_timeout_second` ()，`BUILD INDEX` 超时结束
3. 用户可以多次触发 `BUILD INDEX`，已经 BUILD 成功的索引不会重复 BUILD

:::


### 已有表删除倒排索引

```sql
-- 语法 1
DROP INDEX idx_name ON table_name;
-- 语法 2
ALTER TABLE table_name DROP INDEX idx_name;
```

:::tip

`DROP INDEX` 会删除索引定义，新写入数据不会再写索引，同时会生成一个异步任务执行索引删除操作，在每个 BE 上有多个线程执行索引删除任务，通过 BE 参数 `alter_index_worker_count` 可以设置，默认值是 3。

:::

### 查看倒排索引

```sql
-- 语法 1，表的 schema 中 INDEX 部分 USING INVERTED 是倒排索引
SHOW CREATE TABLE table_name;

-- 语法 2，IndexType 为 INVERTED 的是倒排索引
SHOW INDEX FROM idx_name;
```


## 使用索引

### 利用倒排索引加速查询

```sql
-- 1. 全文检索关键词匹配，通过 MATCH_ANY MATCH_ALL 完成
SELECT * FROM table_name WHERE column_name MATCH_ANY | MATCH_ALL 'keyword1 ...';

-- 1.1 content 列中包含 keyword1 的行
SELECT * FROM table_name WHERE content MATCH_ANY 'keyword1';

-- 1.2 content 列中包含 keyword1 或者 keyword2 的行，后面还可以添加多个 keyword
SELECT * FROM table_name WHERE content MATCH_ANY 'keyword1 keyword2';

-- 1.3 content 列中同时包含 keyword1 和 keyword2 的行，后面还可以添加多个 keyword
SELECT * FROM table_name WHERE content MATCH_ALL 'keyword1 keyword2';


-- 2. 全文检索短语匹配，通过 MATCH_PHRASE 完成
-- 2.1 content 列中同时包含 keyword1 和 keyword2 的行，而且 keyword2 必须紧跟在 keyword1 后面
-- 'keyword1 keyword2'，'wordx keyword1 keyword2'，'wordx keyword1 keyword2 wordy' 能匹配，因为他们都包含 keyword1 keyword2，而且 keyword2 紧跟在 keyword1 后面
-- 'keyword1 wordx keyword2' 不能匹配，因为 keyword1 keyword2 之间隔了一个词 wordx
-- 'keyword2 keyword1'，因为 keyword1 keyword2 的顺序反了
-- 使用 MATCH_PHRASE 需要再 PROPERTIES 中开启 "support_phrase" = "true"
SELECT * FROM table_name WHERE content MATCH_PHRASE 'keyword1 keyword2';

-- 2.2 content 列中同时包含 keyword1 和 keyword2 的行，而且 keyword1 keyword2 的 `词距`（slop）不超过 3
-- 'keyword1 keyword2', 'keyword1 a keyword2', 'keyword1 a b c keyword2' 都能匹配，因为 keyword1 keyword2 中间隔的词分别是 0 1 3 都不超过 3
-- 'keyword1 a b c d keyword2' 不能能匹配，因为 keyword1 keyword2 中间隔的词有 4 个，超过 3
-- 'keyword2 keyword1', 'keyword2 a keyword1', 'keyword2 a b c keyword1' 也能匹配，因为指定 slop > 0 时不再要求 keyword1 keyword2 的顺序。这个行为参考了 ES，与直觉的预期不一样，因此 Doris 提供了在 slop 后面指定正数符号（+）表示需要保持 keyword1 keyword2 的先后顺序
SELECT * FROM table_name WHERE content MATCH_PHRASE 'keyword1 keyword2 ~3';
-- slop 指定正号，'keyword1 a b c keyword2' 能匹配，而 'keyword2 a b c keyword1' 不能匹配
SELECT * FROM table_name WHERE content MATCH_PHRASE 'keyword1 keyword2 ~3+';

-- 2.3 在保持词顺序的前提下，对最后一个词 keyword2 做前缀匹配，默认找 50 个前缀词（session 变量 inverted_index_max_expansions 控制）
-- 需要保证 keyword1, keyword2 在原文分词后也是相邻的，不能中间有其他词
-- 'keyword1 keyword2abc' 能匹配，因为 keyword1 完全一样，最后一个 keyword2abc 是 keyword2 的前缀
-- 'keyword1 keyword2' 也能匹配，因为 keyword2 也是 keyword2 的前缀
-- 'keyword1 keyword3' 不能匹配，因为 keyword3 不是 keyword2 的前缀
-- 'keyword1 keyword3abc' 也不能匹配，因为 keyword3abc 也不是 keyword2 的前缀
SELECT * FROM table_name WHERE content MATCH_PHRASE_PREFIX 'keyword1 keyword2';

-- 2.4 如果只填一个词会退化为前缀查询，默认找 50 个前缀词（session 变量 inverted_index_max_expansions 控制）
SELECT * FROM table_name WHERE content MATCH_PHRASE_PREFIX 'keyword1';

-- 2.5 对分词后的词进行正则匹配，默认匹配 50 个（session 变量 inverted_index_max_expansions 控制）
-- 类似 MATCH_PHRASE_PREFIX 的匹配规则，只是前缀变成了正则
SELECT * FROM table_name WHERE content MATCH_REGEXP 'key.*';

-- 3. 普通等值、范围、IN、NOT IN，正常的 SQL 语句即可，例如
SELECT * FROM table_name WHERE id = 123;
SELECT * FROM table_name WHERE ts > '2023-01-01 00:00:00';
SELECT * FROM table_name WHERE op_type IN ('add', 'delete');

-- 4. 多列全文检索匹配，通过 multi_match 函数完成
-- 参数说明：
--   前N个参数是要匹配的列名
--   倒数第二个参数指定匹配模式：'any'/'all'/'phrase'/'phrase_prefix'
--   最后一个参数是要搜索的关键词或短语

-- 4.1 在col1,col2,col3任意一列中包含'keyword1'的行（OR逻辑）
SELECT * FROM table_name WHERE multi_match(col1, col2, col3, 'any', 'keyword1');

-- 4.2 在col1,col2,col3所有列中都包含'keyword1'的行（AND逻辑）
SELECT * FROM table_name WHERE multi_match(col1, col2, col3, 'all', 'keyword1');

-- 4.3 在col1,col2,col3任意一列中包含完整短语'keyword1'的行（精确短语匹配）
SELECT * FROM table_name WHERE multi_match(col1, col2, col3, 'phrase', 'keyword1');

-- 4.4 在col1,col2,col3任意一列中包含以'keyword1'开头的短语的行（短语前缀匹配）
-- 例如会匹配"keyword123"这样的内容
SELECT * FROM table_name WHERE multi_match(col1, col2, col3, 'phrase_prefix', 'keyword1');
```

### 通过 profile 分析索引加速效果

倒排查询加速可以通过 session 变量 `enable_inverted_index_query` 开关，默认是 true 打开，有时为了验证索引加速效果可以设置为 false 关闭。

可以通过 Query Profile 中的下面几个指标分析倒排索引的加速效果。
- RowsInvertedIndexFiltered 倒排过滤掉的行数，可以与其他几个 Rows 值对比分析索引过滤效果
- InvertedIndexFilterTime 倒排索引消耗的时间
  - InvertedIndexSearcherOpenTime 倒排索引打开索引的时间
  - InvertedIndexSearcherSearchTime 倒排索引内部查询的时间


### 用分词函数验证分词效果

如果想检查分词实际效果或者对一段文本进行分词行为，可以使用 TOKENIZE 函数进行验证。

TOKENIZE 函数的第一个参数是待分词的文本，第二个参数是创建索引指定的分词参数。

```sql
SELECT TOKENIZE('武汉长江大桥','"parser"="chinese","parser_mode"="fine_grained"');
+-----------------------------------------------------------------------------------+
| tokenize('武汉长江大桥', '"parser"="chinese","parser_mode"="fine_grained"')       |
+-----------------------------------------------------------------------------------+
| ["武汉", "武汉长江大桥", "长江", "长江大桥", "大桥"]                              |
+-----------------------------------------------------------------------------------+

SELECT TOKENIZE('武汉市长江大桥','"parser"="chinese","parser_mode"="fine_grained"');
+--------------------------------------------------------------------------------------+
| tokenize('武汉市长江大桥', '"parser"="chinese","parser_mode"="fine_grained"')        |
+--------------------------------------------------------------------------------------+
| ["武汉", "武汉市", "市长", "长江", "长江大桥", "大桥"]                               |
+--------------------------------------------------------------------------------------+

SELECT TOKENIZE('武汉市长江大桥','"parser"="chinese","parser_mode"="coarse_grained"');
+----------------------------------------------------------------------------------------+
| tokenize('武汉市长江大桥', '"parser"="chinese","parser_mode"="coarse_grained"')        |
+----------------------------------------------------------------------------------------+
| ["武汉市", "长江大桥"]                                                                 |
+----------------------------------------------------------------------------------------+

SELECT TOKENIZE('I love Doris','"parser"="english"');
+------------------------------------------------+
| tokenize('I love Doris', '"parser"="english"') |
+------------------------------------------------+
| ["i", "love", "doris"]                         |
+------------------------------------------------+

SELECT TOKENIZE('I love CHINA 我爱我的祖国','"parser"="unicode"');
+-------------------------------------------------------------------+
| tokenize('I love CHINA 我爱我的祖国', '"parser"="unicode"')       |
+-------------------------------------------------------------------+
| ["i", "love", "china", "我", "爱", "我", "的", "祖", "国"]        |
+-------------------------------------------------------------------+

-- ICU 分词多语言文本 (该功能自 3.1.0 版本开始支持)
SELECT TOKENIZE('مرحبا بالعالم Hello 世界', '"parser"="icu"');
+--------------------------------------------------------+
| tokenize('مرحبا بالعالم Hello 世界', '"parser"="icu"') |
+--------------------------------------------------------+
| ["مرحبا", "بالعالم", "Hello", "世界"]                   |
+--------------------------------------------------------+

SELECT TOKENIZE('มนไมเปนไปตามความตองการ', '"parser"="icu"');
+-------------------------------------------------------------------+
| tokenize('มนไมเปนไปตามความตองการ', '"parser"="icu"')            |
+-------------------------------------------------------------------+
| ["มน", "ไมเปน", "ไป", "ตาม", "ความ", "ตองการ"]                  |
+-------------------------------------------------------------------+

-- Basic 分词高性能场景 (该功能自 3.1.0 版本开始支持)
SELECT TOKENIZE('Hello World! This is a test.', '"parser"="basic"');
+-----------------------------------------------------------+
| tokenize('Hello World! This is a test.', '"parser"="basic"') |
+-----------------------------------------------------------+
| ["hello", "world", "this", "is", "a", "test"]              |
+-----------------------------------------------------------+

SELECT TOKENIZE('你好世界', '"parser"="basic"');
+-------------------------------------------+
| tokenize('你好世界', '"parser"="basic"')   |
+-------------------------------------------+
| ["你", "好", "世", "界"]                    |
+-------------------------------------------+

SELECT TOKENIZE('Hello你好World世界', '"parser"="basic"');
+------------------------------------------------------+
| tokenize('Hello你好World世界', '"parser"="basic"')    |
+------------------------------------------------------+
| ["hello", "你", "好", "world", "世", "界"]             |
+------------------------------------------------------+

SELECT TOKENIZE('GET /images/hm_bg.jpg HTTP/1.0', '"parser"="basic"');
+---------------------------------------------------------------------+
| tokenize('GET /images/hm_bg.jpg HTTP/1.0', '"parser"="basic"')      |
+---------------------------------------------------------------------+
| ["get", "images", "hm", "bg", "jpg", "http", "1", "0"]              |
+---------------------------------------------------------------------+
```

## 使用示例

用 HackerNews 100 万条数据展示倒排索引的创建、全文检索、普通查询，包括跟无索引的查询性能进行简单对比。

### 建表

```sql

CREATE DATABASE test_inverted_index;

USE test_inverted_index;

-- 创建表的同时创建了 comment 的倒排索引 idx_comment
--   USING INVERTED 指定索引类型是倒排索引
--   PROPERTIES("parser" = "english") 指定采用 "english" 分词，还支持 "chinese" 中文分词和 "unicode" 中英文多语言混合分词，如果不指定 "parser" 参数表示不分词

CREATE TABLE hackernews_1m
(
    `id` BIGINT,
    `deleted` TINYINT,
    `type` String,
    `author` String,
    `timestamp` DateTimeV2,
    `comment` String,
    `dead` TINYINT,
    `parent` BIGINT,
    `poll` BIGINT,
    `children` Array<BIGINT>,
    `url` String,
    `score` INT,
    `title` String,
    `parts` Array<INT>,
    `descendants` INT,
    INDEX idx_comment (`comment`) USING INVERTED PROPERTIES("parser" = "english") COMMENT 'inverted index for comment'
)
DUPLICATE KEY(`id`)
DISTRIBUTED BY HASH(`id`) BUCKETS 10
PROPERTIES ("replication_num" = "1");

```


### 导入数据

**通过 Stream Load 导入数据**

```
wget https://qa-build.oss-cn-beijing.aliyuncs.com/regression/index/hacknernews_1m.csv.gz

curl --location-trusted -u root: -H "compress_type:gz" -T hacknernews_1m.csv.gz  http://127.0.0.1:8030/api/test_inverted_index/hackernews_1m/_stream_load
{
    "TxnId": 2,
    "Label": "a8a3e802-2329-49e8-912b-04c800a461a6",
    "TwoPhaseCommit": "false",
    "Status": "Success",
    "Message": "OK",
    "NumberTotalRows": 1000000,
    "NumberLoadedRows": 1000000,
    "NumberFilteredRows": 0,
    "NumberUnselectedRows": 0,
    "LoadBytes": 130618406,
    "LoadTimeMs": 8988,
    "BeginTxnTimeMs": 23,
    "StreamLoadPutTimeMs": 113,
    "ReadDataTimeMs": 4788,
    "WriteDataTimeMs": 8811,
    "CommitAndPublishTimeMs": 38
}
```

**SQL 运行 count() 确认导入数据成功**

```sql
SELECT count() FROM hackernews_1m;
+---------+
| count() |
+---------+
| 1000000 |
+---------+
```

### 查询

**01 全文检索**

- 用 `LIKE` 匹配计算 comment 中含有 'OLAP' 的行数，耗时 0.18s

  ```sql
  SELECT count() FROM hackernews_1m WHERE comment LIKE '%OLAP%';
  +---------+
  | count() |
  +---------+
  |      34 |
  +---------+
  ```

- 用基于倒排索引的全文检索 `MATCH_ANY` 计算 comment 中含有'OLAP'的行数，耗时 0.02s，加速 9 倍，在更大的数据集上效果会更加明显

  
  这里结果条数的差异，是因为倒排索引对 comment 分词后，还会对词进行进行统一成小写等归一化处理，因此 `MATCH_ANY` 比 `LIKE` 的结果多一些

  ```sql
  SELECT count() FROM hackernews_1m WHERE comment MATCH_ANY 'OLAP';
  +---------+
  | count() |
  +---------+
  |      35 |
  +---------+
  ```

- 同样的对比统计 'OLTP' 出现次数的性能，0.07s vs 0.01s，由于缓存的原因 `LIKE` 和 `MATCH_ANY` 都有提升，倒排索引仍然有 7 倍加速

  ```sql
  SELECT count() FROM hackernews_1m WHERE comment LIKE '%OLTP%';
  +---------+
  | count() |
  +---------+
  |      48 |
  +---------+


  SELECT count() FROM hackernews_1m WHERE comment MATCH_ANY 'OLTP';
  +---------+
  | count() |
  +---------+
  |      51 |
  +---------+
  ```

- 同时出现 'OLAP' 和 'OLTP' 两个词，0.13s vs 0.01s，13 倍加速

  要求多个词同时出现时（AND 关系）使用 `MATCH_ALL` 'keyword1 keyword2 ...'

  ```sql
  SELECT count() FROM hackernews_1m WHERE comment LIKE '%OLAP%' AND comment LIKE '%OLTP%';
  +---------+
  | count() |
  +---------+
  |      14 |
  +---------+


  SELECT count() FROM hackernews_1m WHERE comment MATCH_ALL 'OLAP OLTP';
  +---------+
  | count() |
  +---------+
  |      15 |
  +---------+
  ```

- 任意出现 'OLAP' 和 'OLTP' 其中一个词，0.12s vs 0.01s，12 倍加速
  
  只要求多个词任意一个或多个出现时（OR 关系）使用 `MATCH_ANY` 'keyword1 keyword2 ...'

  ```sql
  SELECT count() FROM hackernews_1m WHERE comment LIKE '%OLAP%' OR comment LIKE '%OLTP%';
  +---------+
  | count() |
  +---------+
  |      68 |
  +---------+
  
  SELECT count() FROM hackernews_1m WHERE comment MATCH_ANY 'OLAP OLTP';
  +---------+
  | count() |
  +---------+
  |      71 |
  +---------+
  ```


**02 普通等值、范围查询**

- DataTime 类型的列范围查询

  ```sql
  SELECT count() FROM hackernews_1m WHERE timestamp > '2007-08-23 04:17:00';
  +---------+
  | count() |
  +---------+
  |  999081 |
  +---------+
  ```

- 为 timestamp 列增加一个倒排索引

  ```sql
  -- 对于日期时间类型 USING INVERTED，不用指定分词
  -- CREATE INDEX 是第一种建索引的语法，另外一种在后面展示
  CREATE INDEX idx_timestamp ON hackernews_1m(timestamp) USING INVERTED;
  ```

  ```sql
  BUILD INDEX idx_timestamp ON hackernews_1m;
  ```

- 查看索引创建进度，通过 FinishTime 和 CreateTime 的差值，可以看到 100 万条数据对 timestamp 列建倒排索引只用了 1s

  ```sql
  SHOW ALTER TABLE COLUMN;
  +-------+---------------+-------------------------+-------------------------+---------------+---------+---------------+---------------+---------------+----------+------+----------+---------+
  | JobId | TableName     | CreateTime              | FinishTime              | IndexName     | IndexId | OriginIndexId | SchemaVersion | TransactionId | State    | Msg  | Progress | Timeout |
  +-------+---------------+-------------------------+-------------------------+---------------+---------+---------------+---------------+---------------+----------+------+----------+---------+
  | 10030 | hackernews_1m | 2023-02-10 19:44:12.929 | 2023-02-10 19:44:13.938 | hackernews_1m | 10031   | 10008         | 1:1994690496  | 3             | FINISHED |      | NULL     | 2592000 |
  +-------+---------------+-------------------------+-------------------------+---------------+---------+---------------+---------------+---------------+----------+------+----------+---------+
  ```

  ```sql
  -- 若 table 没有分区，PartitionName 默认就是 TableName
  SHOW BUILD INDEX;
  +-------+---------------+---------------+----------------------------------------------------------+-------------------------+-------------------------+---------------+----------+------+----------+
  | JobId | TableName     | PartitionName | AlterInvertedIndexes                                     | CreateTime              | FinishTime              | TransactionId | State    | Msg  | Progress |
  +-------+---------------+---------------+----------------------------------------------------------+-------------------------+-------------------------+---------------+----------+------+----------+
  | 10191 | hackernews_1m | hackernews_1m | [ADD INDEX idx_timestamp (`timestamp`) USING INVERTED],  | 2023-06-26 15:32:33.894 | 2023-06-26 15:32:34.847 | 3             | FINISHED |      | NULL     |
  +-------+---------------+---------------+----------------------------------------------------------+-------------------------+-------------------------+---------------+----------+------+----------+
  ```

- 索引创建后，范围查询用同样的查询方式，Doris 会自动识别索引进行优化，但是这里由于数据量小性能差别不大

  ```sql
  SELECT count() FROM hackernews_1m WHERE timestamp > '2007-08-23 04:17:00';
  +---------+
  | count() |
  +---------+
  |  999081 |
  +---------+
  ```

- 在数值类型的列 Parent 进行类似 timestamp 的操作，这里查询使用等值匹配

  ```sql
  SELECT count() FROM hackernews_1m WHERE parent = 11189;
  +---------+
  | count() |
  +---------+
  |       2 |
  +---------+


  -- 对于数值类型 USING INVERTED，不用指定分词
  -- ALTER TABLE t ADD INDEX 是第二种建索引的语法
  ALTER TABLE hackernews_1m ADD INDEX idx_parent(parent) USING INVERTED;


  -- 执行 BUILD INDEX 给存量数据构建倒排索引
  BUILD INDEX idx_parent ON hackernews_1m;


  SHOW ALTER TABLE COLUMN;
  +-------+---------------+-------------------------+-------------------------+---------------+---------+---------------+---------------+---------------+----------+------+----------+---------+
  | JobId | TableName     | CreateTime              | FinishTime              | IndexName     | IndexId | OriginIndexId | SchemaVersion | TransactionId | State    | Msg  | Progress | Timeout |
  +-------+---------------+-------------------------+-------------------------+---------------+---------+---------------+---------------+---------------+----------+------+----------+---------+
  | 10030 | hackernews_1m | 2023-02-10 19:44:12.929 | 2023-02-10 19:44:13.938 | hackernews_1m | 10031   | 10008         | 1:1994690496  | 3             | FINISHED |      | NULL     | 2592000 |
  | 10053 | hackernews_1m | 2023-02-10 19:49:32.893 | 2023-02-10 19:49:33.982 | hackernews_1m | 10054   | 10008         | 1:378856428   | 4             | FINISHED |      | NULL     | 2592000 |
  +-------+---------------+-------------------------+-------------------------+---------------+---------+---------------+---------------+---------------+----------+------+----------+---------+

  SHOW BUILD INDEX;
  +-------+---------------+---------------+----------------------------------------------------+-------------------------+-------------------------+---------------+----------+------+----------+
  | JobId | TableName     | PartitionName | AlterInvertedIndexes                               | CreateTime              | FinishTime              | TransactionId | State    | Msg  | Progress |
  +-------+---------------+---------------+----------------------------------------------------+-------------------------+-------------------------+---------------+----------+------+----------+
  | 11005 | hackernews_1m | hackernews_1m | [ADD INDEX idx_parent (`parent`) USING INVERTED],  | 2023-06-26 16:25:10.167 | 2023-06-26 16:25:10.838 | 1002          | FINISHED |      | NULL     |
  +-------+---------------+---------------+----------------------------------------------------+-------------------------+-------------------------+---------------+----------+------+----------+


  SELECT count() FROM hackernews_1m WHERE parent = 11189;
  +---------+
  | count() |
  +---------+
  |       2 |
  +---------+
  ```

- 对字符串类型的 `author` 建立不分词的倒排索引，等值查询也可以利用索引加速

  ```sql
  SELECT count() FROM hackernews_1m WHERE author = 'faster';
  +---------+
  | count() |
  +---------+
  |      20 |
  +---------+
  
  -- 这里只用了 USING INVERTED，不对 author 分词，整个当做一个词处理
  ALTER TABLE hackernews_1m ADD INDEX idx_author(author) USING INVERTED;

  
  -- 执行 BUILD INDEX 给存量数据加上倒排索引：
  BUILD INDEX idx_author ON hackernews_1m;

  
  -- 100 万条 author 数据增量建索引仅消耗 1.5s
  SHOW ALTER TABLE COLUMN;
  +-------+---------------+-------------------------+-------------------------+---------------+---------+---------------+---------------+---------------+----------+------+----------+---------+
  | JobId | TableName     | CreateTime              | FinishTime              | IndexName     | IndexId | OriginIndexId | SchemaVersion | TransactionId | State    | Msg  | Progress | Timeout |
  +-------+---------------+-------------------------+-------------------------+---------------+---------+---------------+---------------+---------------+----------+------+----------+---------+
  | 10030 | hackernews_1m | 2023-02-10 19:44:12.929 | 2023-02-10 19:44:13.938 | hackernews_1m | 10031   | 10008         | 1:1994690496  | 3             | FINISHED |      | NULL     | 2592000 |
  | 10053 | hackernews_1m | 2023-02-10 19:49:32.893 | 2023-02-10 19:49:33.982 | hackernews_1m | 10054   | 10008         | 1:378856428   | 4             | FINISHED |      | NULL     | 2592000 |
  | 10076 | hackernews_1m | 2023-02-10 19:54:20.046 | 2023-02-10 19:54:21.521 | hackernews_1m | 10077   | 10008         | 1:1335127701  | 5             | FINISHED |      | NULL     | 2592000 |
  +-------+---------------+-------------------------+-------------------------+---------------+---------+---------------+---------------+---------------+----------+------+----------+---------+
  
  SHOW BUILD INDEX order by CreateTime desc limit 1;
  +-------+---------------+---------------+----------------------------------------------------+-------------------------+-------------------------+---------------+----------+------+----------+
  | JobId | TableName     | PartitionName | AlterInvertedIndexes                               | CreateTime              | FinishTime              | TransactionId | State    | Msg  | Progress |
  +-------+---------------+---------------+----------------------------------------------------+-------------------------+-------------------------+---------------+----------+------+----------+
  | 13006 | hackernews_1m | hackernews_1m | [ADD INDEX idx_author (`author`) USING INVERTED],  | 2023-06-26 17:23:02.610 | 2023-06-26 17:23:03.755 | 3004          | FINISHED |      | NULL     |
  +-------+---------------+---------------+----------------------------------------------------+-------------------------+-------------------------+---------------+----------+------+----------+
  
  -- 创建索引后，字符串等值匹配也有明显加速
  SELECT count() FROM hackernews_1m WHERE author = 'faster';
  +---------+
  | count() |
  +---------+
  |      20 |
  +---------+
  ```
