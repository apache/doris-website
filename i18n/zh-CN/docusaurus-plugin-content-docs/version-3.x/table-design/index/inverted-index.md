---
{
    "title": "倒排索引",
    "language": "zh-CN",
    "description": "倒排索引是信息检索领域中常用的索引技术。"
}
---

## 索引原理

[倒排索引](https://en.wikipedia.org/wiki/Inverted_index)是信息检索领域中常用的索引技术。它将文本分割成一个个词语，并构建 词语 -> 文档编号 的索引，从而能够快速查找包含特定词语的文档。

从 2.0.0 版本开始，Doris 支持倒排索引，可用于文本类型的全文检索、普通数值和日期类型的等值和范围查询，能够从海量数据中快速过滤出满足条件的行。

在 Doris 的倒排索引实现中，表的每一行对应一个文档，每一列对应文档中的一个字段。因此，利用倒排索引可以快速定位包含特定关键词的行，从而加速 WHERE 子句。

与 Doris 中其他索引不同，倒排索引在存储层使用独立的文件，与数据文件一一对应但物理上独立存储。这种方式允许在不重写数据文件的情况下创建和删除索引，显著降低处理开销。

## 使用场景

倒排索引有广泛的应用场景，可以加速等值查询、范围查询和全文检索（关键词匹配、短语匹配等）。一张表可以有多个倒排索引，查询时多个倒排索引的条件可以任意组合。

倒排索引的功能简要介绍如下：

**1. 加速字符串类型的全文检索**

- 支持关键词搜索，包括同时匹配多个关键词 `MATCH_ALL` 和匹配任意一个关键词 `MATCH_ANY`。

- 支持短语查询 `MATCH_PHRASE`
  - 支持指定 slop 来控制词距
  - 支持短语 + 前缀匹配 `MATCH_PHRASE_PREFIX`

- 支持分词后的正则表达式查询 `MATCH_REGEXP`

- 支持英文、中文和 Unicode 分词器

**2. 加速普通等值和范围查询，覆盖并替代 BITMAP 索引的功能**

- 支持字符串、数值和日期时间类型的 =、!=、>、>=、<、<= 快速过滤

- 支持字符串、数值和日期时间数组类型的 `array_contains` 快速过滤

**3. 支持全面的逻辑组合**

- 不仅支持 AND 条件的加速，还支持 OR 和 NOT 条件

- 支持多个条件通过 AND、OR、NOT 进行任意逻辑组合

**4. 灵活高效的索引管理**

- 支持在建表时定义倒排索引

- 支持为已有表增加倒排索引，增量构建索引而无需重写表中已有数据

- 支持从已有表中删除倒排索引，无需重写表中已有数据

:::tip

使用倒排索引有一些限制：

1. 浮点类型 FLOAT 和 DOUBLE 由于存在精度问题，不支持倒排索引。解决方案是使用精确的 DECIMAL 类型，该类型支持倒排索引。

2. 部分复杂数据类型目前不支持倒排索引，包括 MAP、STRUCT、JSON、HLL、BITMAP、QUANTILE_STATE、AGG_STATE。

3. DUPLICATE 和开启了 Merge-on-Write 的 UNIQUE 表模型支持在任意列上构建倒排索引。然而，AGGREGATE 模型和未开启 Merge-on-Write 的 UNIQUE 模型仅支持在 Key 列上构建倒排索引，非 Key 列不能建立倒排索引。这是因为这两种模型需要读取所有数据进行合并，因此索引无法用于预过滤。

:::

## 索引管理

### 建表时定义倒排索引

在建表语句中，COLUMN 定义之后是索引定义：

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

语法说明：

**1. `idx_column_name(column_name)` 是必须的，`column_name` 是建索引的列名，必须是前面定义过的列，`idx_column_name` 是索引名称，必须在表级别唯一，建议命名规范：在列名前加 `idx_` 前缀**

**2. `USING INVERTED` 是必须的，指定索引类型为倒排索引**

**3. `PROPERTIES` 是可选的，用于指定倒排索引的附加属性，目前支持的属性有：**

<details>
  <summary>parser：指定分词器</summary>
  <p>- 默认不指定，即不进行分词</p>
  <p>- `english`：英文分词，适用于英文文本列，使用空格和标点进行分词，性能较高</p>
  <p>- `chinese`：中文分词，适用于以中文为主的文本列，性能低于英文分词</p>
  <p>- `unicode`：Unicode 分词，适用于中英混合以及多语言混合文本。可以对邮件前缀和后缀、IP 地址以及字符与数字混合的字符串进行分词，并可按字对中文进行分词。</p>
  <p>- `icu`（自 3.1.0 版本起支持）：ICU（International Components for Unicode）分词，基于 ICU 库。适用于具有复杂书写系统的国际化文本和多语言文档。支持阿拉伯语、泰语等基于 Unicode 的文字系统。</p>
  <p>- `basic`（自 3.1.0 版本起支持）：基础的基于规则的分词，使用简单的字符类型识别。适用于对性能要求极高或简单文本处理的场景。规则：连续的字母数字字符被视为一个词元，每个中文字符是一个独立的词元，标点/空格/特殊字符被忽略。该分词器在所有分词器中性能最佳，但分词逻辑比 unicode 或 icu 更简单。</p>
  <p>- `ik`（自 3.1.0 版本起支持）：IK 中文分词，专为中文文本分析设计。</p>

  分词效果可以通过 `TOKENIZE` SQL 函数进行验证，详见后续章节。
</details>

<details>
  <summary>parser_mode</summary>

  **指定分词模式，目前 `parser = chinese` 支持的模式有：**
  <p>- fine_grained：细粒度模式，倾向于生成更短、更多的词语，例如 '武汉市长江大桥' 会被分词为 '武汉'、'武汉市'、'市长'、'长江'、'长江大桥'、'大桥'</p>
  <p>- coarse_grained：粗粒度模式，倾向于生成更长、更少的词语，例如 '武汉市长江大桥' 会被分词为 '武汉市'、'长江大桥'</p>
  <p>- 默认为 coarse_grained</p>
</details>

<details>
  <summary>support_phrase</summary>

  **指定索引是否支持 MATCH_PHRASE 短语查询加速**
  <p>- true：支持，但索引需要更多的存储空间</p>
  <p>- false：不支持，存储更节省，可以使用 MATCH_ALL 查询多个关键词</p>
  <p>- 从 2.0.14、2.1.5 和 3.0.1 版本开始，如果设置了 parser 则默认为 true，否则默认为 false。</p>

  例如，以下示例指定中文分词、粗粒度模式，并支持短语查询加速。
```sql
   INDEX idx_name(column_name) USING INVERTED PROPERTIES("parser" = "chinese", "parser_mode" = "coarse_grained", "support_phrase" = "true")
```
</details>

<details>
  <summary>char_filter</summary>

  **指定在分词之前对文本进行预处理，通常用于影响分词行为**

  <p>char_filter_type：指定不同功能的 char_filter（目前仅支持 char_replace）</p>

  <p>char_replace 将 pattern 中的每个字符替换为 replacement 中的字符</p>
  <p>- char_filter_pattern：需要被替换的字符</p>
  <p>- char_filter_replacement：替换字符数组，可选，默认为空格字符</p>

  例如，以下示例将点和下划线替换为空格，从而将它们视为分词分隔符，影响分词行为。
```sql
   INDEX idx_name(column_name) USING INVERTED PROPERTIES("parser" = "unicode", "char_filter_type" = "char_replace", "char_filter_pattern" = "._", "char_filter_replacement" = " ")
```
`
</details>

<details>
  <summary>ignore_above</summary>

  **指定未分词的字符串索引的长度限制（未指定 parser 时）**
  <p>- 超过 ignore_above 设定长度的字符串将不会被索引。对于字符串数组，ignore_above 分别应用于每个数组元素，超过 ignore_above 的元素将不会被索引。</p>
  <p>- 默认为 256，单位为字节</p>

</details>

<details>
  <summary>lower_case</summary>

  **是否将词元转换为小写以支持大小写不敏感匹配**
  <p>- true：转换为小写</p>
  <p>- false：不转换为小写</p>
  <p>- 从 2.0.7 和 2.1.2 版本开始，默认为 true，自动转换为小写。更早版本默认为 false。</p>
</details>

<details>
  <summary>stopwords</summary>

  **指定使用的停用词列表，会影响分词器的行为**
  <p>- 默认的内置停用词列表包含 'is'、'the'、'a' 等无意义的词。在写入或查询时，分词器会忽略停用词列表中的词。</p>
  <p>- none：使用空的停用词列表</p>
</details>

<details>
  <summary>dict_compression（自 3.1.0 版本起支持）</summary>

  **指定是否对倒排索引的词典启用 ZSTD 字典压缩**
  <p>- true：启用字典压缩，可将索引存储大小减少最多 20%，对大规模文本数据和日志分析场景尤为有效</p>
  <p>- false：禁用字典压缩（默认）</p>
  <p>- 建议：在大文本数据集、日志分析或存储成本敏感的场景中启用。与 inverted_index_storage_format = "V3" 配合使用效果最佳</p>

  例如：
```sql
   INDEX idx_name(column_name) USING INVERTED PROPERTIES("parser" = "english", "dict_compression" = "true")
```
</details>

**4. `COMMENT` 是可选的，用于指定索引注释**

**5. 表级属性 `inverted_index_storage_format`（自 3.1.0 版本起支持）**

  要使用新的 V3 存储格式的倒排索引，需在建表时指定此属性：

```sql
CREATE TABLE table_name (
    column_name TEXT,
    INDEX idx_name(column_name) USING INVERTED PROPERTIES("parser" = "english", "dict_compression" = "true")
) PROPERTIES (
    "inverted_index_storage_format" = "V3"
);
```

  **inverted_index_storage_format 取值：**
  <p>- "V2"：默认存储格式</p>
  <p>- "V3"：新的存储格式，采用优化的压缩方式。相比 V2，V3 提供：</p>
  <p>  - 更小的索引文件，降低磁盘占用和 I/O 开销</p>
  <p>  - 大规模文本数据和日志分析场景下最多可节省 20% 的存储空间</p>
  <p>  - 词典的 ZSTD 字典压缩（启用 dict_compression 时）</p>
  <p>  - 每个词元关联的位置信息压缩</p>
  <p>- 建议：对于大文本数据集、日志分析工作负载或对存储优化有要求的场景，新表建议使用 V3</p>

### 为已有表添加倒排索引

**1. ADD INDEX**

支持 `CREATE INDEX` 和 `ALTER TABLE ADD INDEX` 两种语法。参数与建表时定义索引的参数相同。

```sql
-- 语法 1
CREATE INDEX idx_name ON table_name(column_name) USING INVERTED [PROPERTIES(...)] [COMMENT 'your comment'];
-- 语法 2
ALTER TABLE table_name ADD INDEX idx_name(column_name) USING INVERTED [PROPERTIES(...)] [COMMENT 'your comment'];
```

**2. BUILD INDEX**

`CREATE / ADD INDEX` 操作仅添加索引定义。此操作之后写入的新数据会生成倒排索引，但已有数据需要使用 `BUILD INDEX` 触发索引构建：

```sql
-- 语法 1，默认为表中所有分区构建索引
BUILD INDEX index_name ON table_name;
-- 语法 2，可以指定一个或多个分区
BUILD INDEX index_name ON table_name PARTITIONS(partition_name1, partition_name2);
```

查看 `BUILD INDEX` 进度，使用 `SHOW BUILD INDEX`：

```sql
SHOW BUILD INDEX [FROM db_name];
-- 示例 1，查看所有 BUILD INDEX 任务的进度
SHOW BUILD INDEX;
-- 示例 2，查看指定表的 BUILD INDEX 任务进度
SHOW BUILD INDEX where TableName = "table1";
```

取消 `BUILD INDEX`，使用 `CANCEL BUILD INDEX`：

```sql
CANCEL BUILD INDEX ON table_name;
CANCEL BUILD INDEX ON table_name (job_id1, job_id2, ...);
```

:::tip

`BUILD INDEX` 会创建一个异步任务，由每个 BE 上的多个线程执行。线程数可通过 BE 配置 `alter_index_worker_count` 设置，默认值为 3。

在 2.0.12 和 2.1.4 之前的版本中，`BUILD INDEX` 会持续重试直到成功。从这些版本开始，引入了失败和超时机制以防止无限重试。3.0（云模式）目前不支持此命令。

1. 如果一个 tablet 的大多数副本 `BUILD INDEX` 失败，则整个 `BUILD INDEX` 操作失败。
2. 如果超过 `alter_table_timeout_second` 的时间，则 `BUILD INDEX` 操作超时。
3. 用户可以多次触发 `BUILD INDEX`；已成功构建的索引不会被重复构建。

:::

### 从已有表中删除倒排索引

```sql
-- 语法 1
DROP INDEX idx_name ON table_name;
-- 语法 2
ALTER TABLE table_name DROP INDEX idx_name;
```

:::tip

`DROP INDEX` 会删除索引定义，因此新数据将不再写入索引。这会创建一个异步任务来执行索引删除，由每个 BE 上的多个线程执行。线程数可通过 BE 参数 `alter_index_worker_count` 设置，默认值为 3。

:::

### 查看倒排索引

-- 语法 1：表结构中带有 USING INVERTED 的 INDEX 部分表示倒排索引
SHOW CREATE TABLE table_name;

-- 语法 2：IndexType 为 INVERTED 表示倒排索引
SHOW INDEX FROM idx_name;

## 使用索引

### 利用倒排索引加速查询

```sql
-- 1. 使用 MATCH_ANY 和 MATCH_ALL 进行全文检索关键词匹配
SELECT * FROM table_name WHERE column_name MATCH_ANY | MATCH_ALL 'keyword1 ...';

-- 1.1 content 列中包含 keyword1 的行
SELECT * FROM table_name WHERE content MATCH_ANY 'keyword1';

-- 1.2 content 列中包含 keyword1 或 keyword2 的行；可以添加更多关键词
SELECT * FROM table_name WHERE content MATCH_ANY 'keyword1 keyword2';

-- 1.3 content 列中同时包含 keyword1 和 keyword2 的行；可以添加更多关键词
SELECT * FROM table_name WHERE content MATCH_ALL 'keyword1 keyword2';
```

```sql
-- 2. 使用 MATCH_PHRASE 进行全文检索短语匹配

-- 2.1 content 列中同时包含 keyword1 和 keyword2 的行，且 keyword2 必须紧跟在 keyword1 之后
-- 'keyword1 keyword2'、'wordx keyword1 keyword2'、'wordx keyword1 keyword2 wordy' 都能匹配，因为它们包含 'keyword1 keyword2' 且 keyword2 紧跟在 keyword1 之后
-- 'keyword1 wordx keyword2' 不匹配，因为 keyword1 和 keyword2 之间有其他词
-- 'keyword2 keyword1' 不匹配，因为顺序相反
-- 要使用 MATCH_PHRASE，需要在 PROPERTIES 中启用 "support_phrase" = "true"。
SELECT * FROM table_name WHERE content MATCH_PHRASE 'keyword1 keyword2';

-- 2.2 content 列中同时包含 keyword1 和 keyword2 的行，slop（最大词距）为 3
-- 'keyword1 keyword2'、'keyword1 a keyword2'、'keyword1 a b c keyword2' 都能匹配，因为 slop 分别为 0、1 和 3，均在 3 以内
-- 'keyword1 a b c d keyword2' 不匹配，因为 slop 为 4，超过了 3
-- 'keyword2 keyword1'、'keyword2 a keyword1'、'keyword2 a b c keyword1' 也能匹配，因为当 slop > 0 时，不要求 keyword1 和 keyword2 的顺序。如需强制顺序，Doris 提供了在 slop 后加 + 号的方式
SELECT * FROM table_name WHERE content MATCH_PHRASE 'keyword1 keyword2 ~3';
-- 强制顺序，使用正号加 slop；'keyword1 a b c keyword2' 匹配，而 'keyword2 a b c keyword1' 不匹配
SELECT * FROM table_name WHERE content MATCH_PHRASE 'keyword1 keyword2 ~3+';

-- 2.3 对最后一个词 keyword2 进行前缀匹配，默认限制 50 个前缀（由会话变量 inverted_index_max_expansions 控制）
-- 需要确保 keyword1 和 keyword2 在原始文本分词后保持相邻，中间没有其他词。
-- 'keyword1 keyword2abc' 匹配，因为 keyword1 相同且 keyword2abc 以 keyword2 为前缀
-- 'keyword1 keyword2' 也匹配，因为 keyword2 是 keyword2 的前缀
-- 'keyword1 keyword3' 不匹配，因为 keyword3 不是 keyword2 的前缀
-- 'keyword1 keyword3abc' 不匹配，因为 keyword3abc 不是 keyword2 的前缀
SELECT * FROM table_name WHERE content MATCH_PHRASE_PREFIX 'keyword1 keyword2';

-- 2.4 如果仅提供一个词，默认进行前缀查询，限制 50 个前缀（由会话变量 inverted_index_max_expansions 控制）
SELECT * FROM table_name WHERE content MATCH_PHRASE_PREFIX 'keyword1';

-- 2.5 对分词后的词进行正则表达式匹配，默认限制 50 个匹配（由会话变量 inverted_index_max_expansions 控制）
-- 类似于 MATCH_PHRASE_PREFIX，但使用正则表达式代替前缀
SELECT * FROM table_name WHERE content MATCH_REGEXP 'key.*';

-- 3. 普通的等值、范围、IN 和 NOT IN 查询使用标准 SQL 语法，例如：
SELECT * FROM table_name WHERE id = 123;
SELECT * FROM table_name WHERE ts > '2023-01-01 00:00:00';
SELECT * FROM table_name WHERE op_type IN ('add', 'delete');

-- 4. 使用 multi_match 函数进行多列全文检索
-- 参数：
--   前 N 个参数为要搜索的列名
--   倒数第二个参数指定匹配模式：'any'/'all'/'phrase'/'phrase_prefix'
--   最后一个参数是要搜索的关键词或短语

-- 4.1 keyword1 出现在 col1、col2、col3 中任意一列的行（OR 逻辑）
select * FROM table_name WHERE multi_match(col1, col2, col3, 'any', 'keyword1');

-- 4.2 keyword1 出现在 col1、col2、col3 所有列的行（AND 逻辑）
select * FROM table_name WHERE multi_match(col1, col2, col3, 'all', 'keyword1');

-- 4.3 精确短语 keyword1 出现在 col1、col2、col3 中任意一列的行（精确短语匹配）
select * FROM table_name WHERE multi_match(col1, col2, col3, 'phrase', 'keyword1');

-- 4.4 以 keyword1 为前缀的短语出现在 col1、col2、col3 中任意一列的行（短语前缀匹配）
-- 例如，会匹配 "keyword123" 这样的内容
select * FROM table_name WHERE multi_match(col1, col2, col3, 'phrase_prefix', 'keyword1');
```

### 通过 Profile 分析索引加速效果

可以通过会话变量 `enable_inverted_index_query` 来开关倒排查询加速，默认设置为 true。要验证索引的加速效果，可以将其设置为 false 来关闭。

倒排索引的加速效果可以通过 Query Profile 中的以下指标进行分析：
- RowsInvertedIndexFiltered：被倒排索引过滤的行数，可以与其他 Rows 值进行比较以分析索引的过滤效果。
- InvertedIndexFilterTime：倒排索引消耗的时间。
  - InvertedIndexSearcherOpenTime：打开倒排索引所花费的时间。
  - InvertedIndexSearcherSearchTime：倒排索引内部查询所花费的时间。


### 使用分词函数验证分词效果

要检查分词的实际效果或对一段文本进行分词，可以使用 `TOKENIZE` 函数进行验证。

`TOKENIZE` 函数的第一个参数是要分词的文本，第二个参数指定创建索引时使用的分词参数。

```sql
-- 英文分词
SELECT TOKENIZE('I love Doris','"parser"="english"');
+------------------------------------------------+
| tokenize('I love Doris', '"parser"="english"') |
+------------------------------------------------+
| ["i", "love", "doris"]                         |
+------------------------------------------------+

-- ICU 分词用于多语言文本（自 3.1.0 版本起支持）
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

-- Basic 分词用于高性能场景（自 3.1.0 版本起支持）
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

使用 HackerNews 的 100 万条记录来演示倒排索引的创建、全文检索和普通查询。包含与无索引查询的简单性能对比。

### 建表

```sql
CREATE DATABASE test_inverted_index;

USE test_inverted_index;

-- 在 comment 字段上创建带倒排索引的表
--   USING INVERTED 指定索引类型为倒排索引
--   PROPERTIES("parser" = "english") 指定使用 "english" 分词器；其他选项包括 "chinese" 中文分词和 "unicode" 多语言混合分词。如果不指定 "parser" 参数，则不进行分词。

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

### 数据导入

**通过 Stream Load 导入数据**

```
wget https://qa-build.oss-cn-beijing.aliyuncs.com/regression/index/hacknernews_1m.csv.gz

curl --location-trusted -u root: -H "compress_type:gz" -T hacknernews_1m.csv.gz http://127.0.0.1:8030/api/test_inverted_index/hackernews_1m/_stream_load
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

**使用 SQL count() 确认数据导入成功**

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

- 使用 `LIKE` 匹配并统计 `comment` 列中包含 'OLAP' 的行数，耗时 0.18s。

  ```sql
  SELECT count() FROM hackernews_1m WHERE comment LIKE '%OLAP%';
  +---------+
  | count() |
  +---------+
  |      34 |
  +---------+
  ```

- 使用基于倒排索引的全文检索 `MATCH_ANY` 统计 `comment` 列中包含 'OLAP' 的行数，耗时 0.02s，实现了 9 倍加速。在更大的数据集上性能提升会更为显著。

  结果数量的差异是因为倒排索引会对词元进行规范化处理，包括转换为小写等，因此 `MATCH_ANY` 比 `LIKE` 返回更多结果。

  ```sql
  SELECT count() FROM hackernews_1m WHERE comment MATCH_ANY 'OLAP';
  +---------+
  | count() |
  +---------+
  |      35 |
  +---------+
  ```

- 类似地，比较统计 'OLTP' 出现次数的性能，0.07s vs 0.01s。由于缓存效果，`LIKE` 和 `MATCH_ANY` 都有所提升，但倒排索引仍然提供了 7 倍加速。

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

- 统计 'OLAP' 和 'OLTP' 同时出现的行数，耗时 0.13s vs 0.01s，实现了 13 倍加速。

  要求多个词同时出现（AND 关系），使用 `MATCH_ALL 'keyword1 keyword2 ...'`。

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

- 统计 'OLAP' 或 'OLTP' 出现的行数，耗时 0.12s vs 0.01s，实现了 12 倍加速。

  要求多个词中的一个或多个出现（OR 关系），使用 `MATCH_ANY 'keyword1 keyword2 ...'`。

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

  ### 02 普通等值和范围查询

- 对 `DateTime` 类型列的范围查询

  ```sql
  SELECT count() FROM hackernews_1m WHERE timestamp > '2007-08-23 04:17:00';
  +---------+
  | count() |
  +---------+
  |  999081 |
  +---------+
  ```

- 为 `timestamp` 列添加倒排索引

  ```sql
  -- 对于日期时间类型，USING INVERTED 不需要指定 parser
  -- CREATE INDEX 是创建索引的一种语法，另一种方法将在后面展示
  CREATE INDEX idx_timestamp ON hackernews_1m(timestamp) USING INVERTED;
  ```

  ```sql
  BUILD INDEX idx_timestamp ON hackernews_1m;
  ```

- 查看索引创建进度。从 `FinishTime` 和 `CreateTime` 的差值可以看出，为 100 万行的 `timestamp` 列构建倒排索引仅用了 1 秒。

  ```sql
  SHOW ALTER TABLE COLUMN;
  +-------+---------------+-------------------------+-------------------------+---------------+---------+---------------+---------------+---------------+----------+------+----------+---------+
  | JobId | TableName     | CreateTime              | FinishTime              | IndexName     | IndexId | OriginIndexId | SchemaVersion | TransactionId | State    | Msg  | Progress | Timeout |
  +-------+---------------+-------------------------+-------------------------+---------------+---------+---------------+---------------+---------------+----------+------+----------+---------+
  | 10030 | hackernews_1m | 2023-02-10 19:44:12.929 | 2023-02-10 19:44:13.938 | hackernews_1m | 10031   | 10008         | 1:1994690496  | 3             | FINISHED |      | NULL     | 2592000 |
  +-------+---------------+-------------------------+-------------------------+---------------+---------+---------------+---------------+---------------+----------+------+----------+---------+
  ```

  ```sql
  -- 如果表没有分区，PartitionName 默认为 TableName
  SHOW BUILD INDEX;
  +-------+---------------+---------------+----------------------------------------------------------+-------------------------+-------------------------+---------------+----------+------+----------+
  | JobId | TableName     | PartitionName | AlterInvertedIndexes                                     | CreateTime              | FinishTime              | TransactionId | State    | Msg  | Progress |
  +-------+---------------+---------------+----------------------------------------------------------+-------------------------+-------------------------+---------------+----------+------+----------+
  | 10191 | hackernews_1m | hackernews_1m | [ADD INDEX idx_timestamp (`timestamp`) USING INVERTED],  | 2023-06-26 15:32:33.894 | 2023-06-26 15:32:34.847 | 3             | FINISHED |      | NULL     |
  +-------+---------------+---------------+----------------------------------------------------------+-------------------------+-------------------------+---------------+----------+------+----------+
  ```

- 索引创建完成后，范围查询使用相同的查询语法。Doris 会自动识别索引进行优化。但由于数据集较小，性能差异不太显著。

  ```sql
  SELECT count() FROM hackernews_1m WHERE timestamp > '2007-08-23 04:17:00';
  +---------+
  | count() |
  +---------+
  |  999081 |
  +---------+
  ```

- 对数值列 `parent` 执行类似操作，进行等值匹配查询。

  ```sql
  SELECT count() FROM hackernews_1m WHERE parent = 11189;
  +---------+
  | count() |
  +---------+
  |       2 |
  +---------+

  -- 对于数值类型，USING INVERTED 不需要指定 parser
  -- ALTER TABLE t ADD INDEX 是创建索引的第二种语法
  ALTER TABLE hackernews_1m ADD INDEX idx_parent(parent) USING INVERTED;


  -- 执行 BUILD INDEX 为已有数据创建倒排索引
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

- 为字符串列 `author` 创建不带分词的倒排索引。等值查询同样可以利用索引加速。

  ```sql
  SELECT count() FROM hackernews_1m WHERE author = 'faster';
  +---------+
  | count() |
  +---------+
  |      20 |
  +---------+

  
  -- 此处使用 USING INVERTED 且不对 `author` 列进行分词，将其视为单个词元
  ALTER TABLE hackernews_1m ADD INDEX idx_author(author) USING INVERTED;

  
  -- 执行 BUILD INDEX 为已有数据添加倒排索引
  BUILD INDEX idx_author ON hackernews_1m;

  
为 100 万条 author 记录创建增量索引仅用了 1.5 秒。

```sql
SHOW ALTER TABLE COLUMN;
+-------+---------------+-------------------------+-------------------------+---------------+---------+---------------+---------------+---------------+----------+------+----------+---------+
| JobId | TableName     | CreateTime              | FinishTime              | IndexName     | IndexId | OriginIndexId | SchemaVersion | TransactionId | State    | Msg  | Progress | Timeout |
+-------+---------------+-------------------------+-------------------------+---------------+---------+---------------+---------------+---------------+----------+------+----------+---------+
| 10030 | hackernews_1m | 2023-02-10 19:44:12.929 | 2023-02-10 19:44:13.938 | hackernews_1m | 10031   | 10008         | 1:1994690496  | 3             | FINISHED |      | NULL     | 2592000 |
| 10053 | hackernews_1m | 2023-02-10 19:49:32.893 | 2023-02-10 19:49:33.982 | hackernews_1m | 10054   | 10008         | 1:378856428   | 4             | FINISHED |      | NULL     | 2592000 |
| 10076 | hackernews_1m | 2023-02-10 19:54:20.046 | 2023-02-10 19:54:21.521 | hackernews_1m | 10077   | 10008         | 1:1335127701  | 5             | FINISHED |      | NULL     | 2592000 |
+-------+---------------+-------------------------+-------------------------+---------------+---------+---------------+---------------+---------------+----------+------+----------+---------+
```

```sql
SHOW BUILD INDEX ORDER BY CreateTime DESC LIMIT 1;
+-------+---------------+---------------+----------------------------------------------------+-------------------------+-------------------------+---------------+----------+------+----------+
| JobId | TableName     | PartitionName | AlterInvertedIndexes                               | CreateTime              | FinishTime              | TransactionId | State    | Msg  | Progress |
+-------+---------------+---------------+----------------------------------------------------+-------------------------+-------------------------+---------------+----------+------+----------+
| 13006 | hackernews_1m | hackernews_1m | [ADD INDEX idx_author (`author`) USING INVERTED],  | 2023-06-26 17:23:02.610 | 2023-06-26 17:23:03.755 | 3004          | FINISHED |      | NULL     |
+-------+---------------+---------------+----------------------------------------------------+-------------------------+-------------------------+---------------+----------+------+----------+
```

-- 创建索引后，字符串等值匹配也有显著加速。

```sql
SELECT count() FROM hackernews_1m WHERE author = 'faster';
+---------+
| count() |
+---------+
|      20 |
+---------+
```
