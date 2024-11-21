---
{
    "title": "Inverted Index",
    "language": "en"
}
---

<!-- 
Licensed to the Apache Software Foundation (ASF) under one
or more contributor license agreements.  See the NOTICE file
distributed with this work for additional information
regarding copyright ownership.  The ASF licenses this file
to you under the Apache License, Version 2.0 (the
"License"); you may not use this file except in compliance
with the License.  You may obtain a copy of the License at

  http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing,
software distributed under the License is distributed on an
"AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
KIND, either express or implied.  See the License for the
specific language governing permissions and limitations
under the License.
-->


## Indexing Principle

[Inverted Index](https://en.wikipedia.org/wiki/Inverted_index) is a commonly used indexing technique in the field of information retrieval. It divides text into individual words and constructs a word -> document IDs index, allowing for quick searches to determine which documents contain a specific word.

Starting from version 2.0.0, Doris supports inverted indexes, which can be used for full-text searches on text types, equality, and range queries on normal numerical and date types, and quickly filtering rows that meet the criteria from massive amounts of data.

In Doris's implementation of the inverted index, each row in the table corresponds to a document, and each column corresponds to a field in the document. Thus, using an inverted index, you can quickly locate rows containing specific keywords, thereby accelerating the WHERE clause.

Unlike other indexes in Doris, the inverted index uses independent files at the storage layer, corresponding one-to-one with data files but physically stored independently. This approach allows for creating and deleting indexes without rewriting data files, significantly reducing processing overhead.

## Usage Scenarios

Inverted indexes have a wide range of applications and can accelerate equality, range, and full-text searches (keyword matching, phrase matching, etc.). A table can have multiple inverted indexes, and the conditions of multiple inverted indexes can be combined arbitrarily during queries.

The functionality of inverted indexes is briefly introduced as follows:

**1. Accelerate full-text searches for string types**

- Support for keyword search, including matching multiple keywords simultaneously `MATCH_ALL` and matching any one keyword `MATCH_ANY`.

- Support for phrase queries `MATCH_PHRASE`
  - Support for specifying slop for word distence
  - Support for phrase + prefix `MATCH_PHRASE_PREFIX`

- Support for tokenized regular expression queries `MATCH_REGEXP`

- Support for English, Chinese, and Unicode tokenizers

**2. Accelerate normal equality and range queries, covering and replacing the functionality of BITMAP index**

- Support for fast filtering of string, numerical, and datetime types for =, !=, >, >=, <, <=

- Support for fast filtering of string, numerical, and datetime array types for `array_contains`

**3. Support for comprehensive logical combinations**

- Not only supports acceleration for AND conditions but also for OR and NOT conditions

- Supports arbitrary logical combinations of multiple conditions with AND, OR, NOT

**4. Flexible and efficient index management**

- Support for defining inverted indexes when creating a table

- Support for adding inverted indexes to existing tables, with incremental index construction without rewriting existing data in the table

- Support for deleting inverted indexes from existing tables without rewriting existing data in the table

:::tip

There are some limitations to using inverted indexes:

1. Floating-point types FLOAT and DOUBLE, which have precision issues, do not support inverted indexes due to inaccurate precision. The solution is to use the precisely accurate DECIMAL type, which supports inverted indexes.

2. Some complex data types do not yet support inverted indexes, including MAP, STRUCT, JSON, HLL, BITMAP, QUANTILE_STATE, AGG_STATE. Among these data types, JSON can be replaced with the VARIANT type since Apache Doris 2.1.0 version (for more information, see [VARIANT](https://doris.apache.org/docs/sql-manual/sql-types/Data-Types/VARIANT)), MAP and STRUCT will gradually gain support, and the other types do not need support for inverted indexes due to their specific uses.

3. DUPLICATE and UNIQUE table models with Merge-on-Write enabled support building inverted indexes on any column. However, AGGREGATE and UNIQUE models without Merge-on-Write enabled only support building inverted indexes on Key columns, as non-Key columns cannot have inverted indexes. This is because these two models require reading all data for merging, so indexes cannot be used for pre-filtering.

To see the effect of inverted indexes on a query, you can analyze relevant metrics in the Query Profile.

- InvertedIndexFilterTime: time consumed by the inverted index
  - InvertedIndexSearcherOpenTime: time to open the inverted index
  - InvertedIndexSearcherSearchTime: time for internal queries of the inverted index

- RowsInvertedIndexFiltered: number of rows filtered by the inverted index, can be compared with other Rows values to analyze the filtering effect of the BloomFilter index
:::

## Syntax

### Define Inverted Indexes When Creating a Table

In the table creation statement, after the COLUMN definition, is the index definition:

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

Syntax explanation:

**1. `idx_column_name(column_name)` is mandatory, `column_name` is the name of the column for the index, must be a column defined earlier, `idx_column_name` is the index name, must be unique at the table level, recommended naming convention: prefix `idx_` before the column name**

**2. `USING INVERTED` is mandatory to specify that the index type is an inverted index**

**3. `PROPERTIES` is optional to specify additional properties of the inverted index, currently supported properties are:**

<details>
  <summary>parser: specifies the tokenizer</summary>
  <p>- By default, it is unspecified, meaning no tokenization</p>
  <p>- `english`: English tokenization, suitable for columns with English text, uses spaces and punctuation for tokenization, high performance</p>
  <p>- `chinese`: Chinese tokenization, suitable for columns with mainly Chinese text, lower performance than English tokenization</p>
  <p>- `unicode`: Unicode tokenization, suitable for mixed Chinese and English, and mixed multilingual texts. It can tokenize email prefixes and suffixes, IP addresses, and mixed character and number strings, and can tokenize Chinese by characters.</p>

  Tokenization results can be verified using the `TOKENIZE` SQL function, see the following sections for details.
</details>

<details>
  <summary>parser_mode</summary>

  **Specifies the tokenization mode, currently supported modes for `parser = chinese` are:**
  <p>- fine_grained: fine-grained mode, tends to generate shorter, more words, e.g., '武汉市长江大桥' will be tokenized into '武汉', '武汉市', '市长', '长江', '长江大桥', '大桥'</p>
  <p>- coarse_grained: coarse-grained mode, tends to generate longer, fewer words, e.g., '武汉市长江大桥' will be tokenized into '武汉市', '长江大桥'</p>
  <p>- default coarse_grained</p>
</details>

<details>
  <summary>support_phrase</summary>

  **Specifies whether the index supports MATCH_PHRASE phrase query acceleration**
  <p>- true: supported, but the index requires more storage space</p>
  <p>- false: not supported, more storage efficient, can use MATCH_ALL to query multiple keywords</p>
  <p>- default false</p>

  For example, the following example specifies Chinese tokenization, coarse-grained mode, and supports phrase query acceleration.
```sql
   INDEX idx_name(column_name) USING INVERTED PROPERTIES("parser" = "chinese", "parser_mode" = "coarse_grained", "support_phrase" = "true")
```
</details>

<details>
  <summary>char_filter</summary>

  **Specifies preprocessing the text before tokenization, usually to affect tokenization behavior**

  <p>char_filter_type: specifies different functional char_filters (currently only supports char_replace)</p>

  <p>char_replace replaces each char in the pattern with a char in the replacement</p>
  <p>- char_filter_pattern: characters to be replaced</p>
  <p>- char_filter_replacement: replacement character array, optional, defaults to a space character</p>

  For example, the following example replaces dots and underscores with spaces, thus treating them as word separators, affecting tokenization behavior.
```sql
   INDEX idx_name(column_name) USING INVERTED PROPERTIES("parser" = "unicode", "char_filter_type" = "char_replace", "char_filter_pattern" = "._", "char_filter_replacement" = " ")
```
`
</details>

<details>
  <summary>ignore_above</summary>

  **Specifies the length limit for non-tokenized string indexes (parser not specified)**
  <p>- Strings longer than the length set by ignore_above will not be indexed. For string arrays, ignore_above applies to each array element separately, and elements longer than ignore_above will not be indexed.</p>
  <p>- Default is 256, unit is bytes</p>

</details>

<details>
  <summary>lower_case</summary>

  **Whether to convert tokens to lowercase for case-insensitive matching**
  <p>- true: convert to lowercase</p>
  <p>- false: do not convert to lowercase</p>
  <p>- From version 2.0.7, the default is true, automatically converting to lowercase. Earlier versions default to false.</p>
</details>

<details>
  <summary>stopwords</summary>

  **Specifying the stopword list to use, which will affect the behavior of the tokenizer**
  <p>- The default built-in stopword list includes meaningless words such as 'is,' 'the,' 'a,' etc. When writing or querying, the tokenizer will ignore words that are in the stopword list.</p>
  <p>- none: Use an empty stopword list</p>
</details>

**4. `COMMENT` is optional for specifying index comments**

### Adding Inverted Indexes to Existing Tables

**1. ADD INDEX**

Supports both `CREATE INDEX` and `ALTER TABLE ADD INDEX` syntax. The parameters are the same as those used when defining indexes during table creation.

```sql
-- Syntax 1
CREATE INDEX idx_name ON table_name(column_name) USING INVERTED [PROPERTIES(...)] [COMMENT 'your comment'];
-- Syntax 2
ALTER TABLE table_name ADD INDEX idx_name(column_name) USING INVERTED [PROPERTIES(...)] [COMMENT 'your comment'];
```

**2. BUILD INDEX**

The `CREATE / ADD INDEX` operation only adds the index definition. New data written after this operation will generate inverted indexes, but existing data requires using `BUILD INDEX` to trigger indexing:

```sql
-- Syntax 1, by default, builds the index for all partitions in the table
BUILD INDEX index_name ON table_name;
-- Syntax 2, you can specify partitions, one or more
BUILD INDEX index_name ON table_name PARTITIONS(partition_name1, partition_name2);
```

To check the progress of `BUILD INDEX`, use `SHOW BUILD INDEX`:

```sql
SHOW BUILD INDEX [FROM db_name];
-- Example 1, view the progress of all BUILD INDEX tasks
SHOW BUILD INDEX;
-- Example 2, view the progress of BUILD INDEX tasks for a specific table
SHOW BUILD INDEX where TableName = "table1";
```

To cancel `BUILD INDEX`, use `CANCEL BUILD INDEX`:

```sql
CANCEL BUILD INDEX ON table_name;
CANCEL BUILD INDEX ON table_name (job_id1, job_id2, ...);
```

:::tip

`BUILD INDEX` creates an asynchronous task executed by multiple threads on each BE. The number of threads can be set using the BE config `alter_index_worker_count`, with a default value of 3.

In versions before 2.0.12, `BUILD INDEX` would keep retrying until it succeeded. Starting from these versions, failure and timeout mechanisms prevent endless retries.

1. If the majority of replicas for a tablet fail to `BUILD INDEX`, the entire `BUILD INDEX` operation fails.
2. If the time exceeds `alter_table_timeout_second`, the `BUILD INDEX` operation times out.
3. Users can trigger `BUILD INDEX` multiple times; indexes that have already been built successfully will not be rebuilt.

:::

### Deleting Inverted Indexes from Existing Tables

```sql
-- Syntax 1
DROP INDEX idx_name ON table_name;
-- Syntax 2
ALTER TABLE table_name DROP INDEX idx_name;
```

:::tip

`DROP INDEX` deletes the index definition, so new data will no longer write to the index. This creates an asynchronous task to perform the index deletion, executed by multiple threads on each BE. The number of threads can be set using the BE parameter `alter_index_worker_count`, with a default value of 3.

:::

### Accelerating Queries with Inverted Indexes

```sql
-- 1. Full-text search keyword matching using MATCH_ANY and MATCH_ALL
SELECT * FROM table_name WHERE column_name MATCH_ANY | MATCH_ALL 'keyword1 ...';

-- 1.1 Rows in the content column containing keyword1
SELECT * FROM table_name WHERE content MATCH_ANY 'keyword1';

-- 1.2 Rows in the content column containing keyword1 or keyword2; you can add more keywords
SELECT * FROM table_name WHERE content MATCH_ANY 'keyword1 keyword2';

-- 1.3 Rows in the content column containing both keyword1 and keyword2; you can add more keywords
SELECT * FROM table_name WHERE content MATCH_ALL 'keyword1 keyword2';
```

```sql
-- 2. Full-text search phrase matching using MATCH_PHRASE

-- 2.1 Rows in the content column containing both keyword1 and keyword2, where keyword2 must immediately follow keyword1
-- 'keyword1 keyword2', 'wordx keyword1 keyword2', 'wordx keyword1 keyword2 wordy' all match because they contain 'keyword1 keyword2' with keyword2 immediately following keyword1
-- 'keyword1 wordx keyword2' does not match because there is a word between keyword1 and keyword2
-- 'keyword2 keyword1' does not match because the order is reversed
SELECT * FROM table_name WHERE content MATCH_PHRASE 'keyword1 keyword2';

-- 2.2 Rows in the content column containing both keyword1 and keyword2, with a slop (maximum word distance) of 3
-- 'keyword1 keyword2', 'keyword1 a keyword2', 'keyword1 a b c keyword2' all match because the slop is 0, 1, and 3 respectively, all within 3
-- 'keyword1 a b c d keyword2' does not match because the slop is 4, exceeding 3
-- 'keyword2 keyword1', 'keyword2 a keyword1', 'keyword2 a b c keyword1' also match because when slop > 0, the order of keyword1 and keyword2 is not required. To enforce the order, Doris provides a + sign after slop
SELECT * FROM table_name WHERE content MATCH_PHRASE 'keyword1 keyword2 ~3';
-- To enforce order, use a positive sign with slop; 'keyword1 a b c keyword2' matches, while 'keyword2 a b c keyword1' does not
SELECT * FROM table_name WHERE content MATCH_PHRASE 'keyword1 keyword2 ~3+';

-- 2.3 Prefix matching the last word keyword2, with a default limit of 50 prefixes (controlled by session variable inverted_index_max_expansions)
-- 'keyword1 keyword2abc' matches because keyword1 is identical and keyword2abc is a prefix of keyword2
-- 'keyword1 keyword2' also matches because keyword2 is a prefix of keyword2
-- 'keyword1 keyword3' does not match because keyword3 is not a prefix of keyword2
-- 'keyword1 keyword3abc' does not match because keyword3abc is not a prefix of keyword2
SELECT * FROM table_name WHERE content MATCH_PHRASE_PREFIX 'keyword1 keyword2';

-- 2.4 If only one word is provided, it defaults to a prefix query with a limit of 50 prefixes (controlled by session variable inverted_index_max_expansions)
SELECT * FROM table_name WHERE content MATCH_PHRASE_PREFIX 'keyword1';

-- 2.5 Regular expression matching on tokenized words, with a default limit of 50 matches (controlled by session variable inverted_index_max_expansions)
-- Similar to MATCH_PHRASE_PREFIX but with regex instead of prefix
SELECT * FROM table_name WHERE content MATCH_REGEXP 'key*';
```

```sql
-- 3. Normal equality, range, IN, and NOT IN queries using standard SQL syntax, for example:
SELECT * FROM table_name WHERE id = 123;
SELECT * FROM table_name WHERE ts > '2023-01-01 00:00:00';
SELECT * FROM table_name WHERE op_type IN ('add', 'delete');
```

### TOKENIZE Function

To check the actual effect of tokenization or to tokenize a piece of text, you can use the `TOKENIZE` function for verification.

The first parameter of the `TOKENIZE` function is the text to be tokenized, and the second parameter specifies the tokenization parameters used when creating the index.

mysql> SELECT TOKENIZE('I love CHINA','"parser"="english"');
+------------------------------------------------+
| tokenize('I love CHINA', '"parser"="english"') |
+------------------------------------------------+
| ["i", "love", "china"]                         |
+------------------------------------------------+
1 row in set (0.02 sec)

mysql> SELECT TOKENIZE('I love CHINA 我爱我的祖国','"parser"="unicode"');
+-------------------------------------------------------------------+
| tokenize('I love CHINA 我爱我的祖国', '"parser"="unicode"')       |
+-------------------------------------------------------------------+
| ["i", "love", "china", "我", "爱", "我", "的", "祖", "国"]        |
+-------------------------------------------------------------------+
1 row in set (0.02 sec)
```

## Usage Example

Demonstrating the creation of an inverted index, full-text search, and regular queries using 1 million records from HackerNews. This includes a simple performance comparison with queries without indexing.

### Table Creation

```sql
CREATE DATABASE test_inverted_index;

USE test_inverted_index;

-- Create a table with an inverted index on the comment field
--   USING INVERTED specifies the index type as an inverted index
--   PROPERTIES("parser" = "english") specifies using the "english" tokenizer; other options include "chinese" for Chinese tokenization and "unicode" for mixed-language tokenization. If the "parser" parameter is not specified, no tokenization is applied.

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

### Data Import

**Importing Data via Stream Load**

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

**Confirm Data Import Success with SQL count()**

```sql
mysql> SELECT count() FROM hackernews_1m;
+---------+
| count() |
+---------+
| 1000000 |
+---------+
1 row in set (0.02 sec)
```

### Queries

**01 Full-Text Search**

- Using `LIKE` to match and count rows containing 'OLAP' in the `comment` column took 0.18s.

  ```sql
  mysql> SELECT count() FROM hackernews_1m WHERE comment LIKE '%OLAP%';
  +---------+
  | count() |
  +---------+
  |      34 |
  +---------+
  1 row in set (0.18 sec)
  ```

- Using full-text search with `MATCH_ANY` based on the inverted index to count rows containing 'OLAP' in the `comment` column took 0.02s, resulting in a 9x speedup. The performance improvement would be even more significant on larger datasets.
  
  The difference in the number of results is due to the inverted index normalizing the terms by converting them to lowercase, among other processes, hence `MATCH_ANY` yields more results than `LIKE`.

  ```sql
  mysql> SELECT count() FROM hackernews_1m WHERE comment MATCH_ANY 'OLAP';
  +---------+
  | count() |
  +---------+
  |      35 |
  +---------+
  1 row in set (0.02 sec)
  ```

- Similarly, comparing the performance for counting occurrences of 'OLTP', 0.07s vs 0.01s. Due to caching, both `LIKE` and `MATCH_ANY` improved, but the inverted index still provided a 7x speedup.

  ```sql
  mysql> SELECT count() FROM hackernews_1m WHERE comment LIKE '%OLTP%';
  +---------+
  | count() |
  +---------+
  |      48 |
  +---------+
  1 row in set (0.07 sec)

  mysql> SELECT count() FROM hackernews_1m WHERE comment MATCH_ANY 'OLTP';
  +---------+
  | count() |
  +---------+
  |      51 |
  +---------+
  1 row in set (0.01 sec)
  ```

- Counting rows where both 'OLAP' and 'OLTP' appear took 0.13s vs 0.01s, a 13x speedup.

  To require multiple terms to appear simultaneously (AND relationship), use `MATCH_ALL 'keyword1 keyword2 ...'`.

  ```sql
  mysql> SELECT count() FROM hackernews_1m WHERE comment LIKE '%OLAP%' AND comment LIKE '%OLTP%';
  +---------+
  | count() |
  +---------+
  |      14 |
  +---------+
  1 row in set (0.13 sec)

  mysql> SELECT count() FROM hackernews_1m WHERE comment MATCH_ALL 'OLAP OLTP';
  +---------+
  | count() |
  +---------+
  |      15 |
  +---------+
  1 row in set (0.01 sec)
  ```

- Counting rows where either 'OLAP' or 'OLTP' appears took 0.12s vs 0.01s, a 12x speedup.
  
  To require any one or more of multiple terms to appear (OR relationship), use `MATCH_ANY 'keyword1 keyword2 ...'`.

  ```sql
  mysql> SELECT count() FROM hackernews_1m WHERE comment LIKE '%OLAP%' OR comment LIKE '%OLTP%';
  +---------+
  | count() |
  +---------+
  |      68 |
  +---------+
  1 row in set (0.12 sec)
  
  mysql> SELECT count() FROM hackernews_1m WHERE comment MATCH_ANY 'OLAP OLTP';
  +---------+
  | count() |
  +---------+
  |      71 |
  +---------+
  1 row in set (0.01 sec)
  ```

  ### 02 Standard Equality and Range Queries

- Range query on a `DateTime` type column

  ```sql
  mysql> SELECT count() FROM hackernews_1m WHERE timestamp > '2007-08-23 04:17:00';
  +---------+
  | count() |
  +---------+
  |  999081 |
  +---------+
  1 row in set (0.03 sec)
  ```

- Adding an inverted index for the `timestamp` column

  ```sql
  -- For date-time types, USING INVERTED does not require specifying a parser
  -- CREATE INDEX is one syntax for creating an index, another method will be shown later
  mysql> CREATE INDEX idx_timestamp ON hackernews_1m(timestamp) USING INVERTED;
  Query OK, 0 rows affected (0.03 sec)
  ```

  ```sql
  mysql> BUILD INDEX idx_timestamp ON hackernews_1m;
  Query OK, 0 rows affected (0.01 sec)
  ```

- Checking the index creation progress. From the difference between `FinishTime` and `CreateTime`, we can see that building the inverted index for 1 million rows on the `timestamp` column took only 1 second.

  ```sql
  mysql> SHOW ALTER TABLE COLUMN;
  +-------+---------------+-------------------------+-------------------------+---------------+---------+---------------+---------------+---------------+----------+------+----------+---------+
  | JobId | TableName     | CreateTime              | FinishTime              | IndexName     | IndexId | OriginIndexId | SchemaVersion | TransactionId | State    | Msg  | Progress | Timeout |
  +-------+---------------+-------------------------+-------------------------+---------------+---------+---------------+---------------+---------------+----------+------+----------+---------+
  | 10030 | hackernews_1m | 2023-02-10 19:44:12.929 | 2023-02-10 19:44:13.938 | hackernews_1m | 10031   | 10008         | 1:1994690496  | 3             | FINISHED |      | NULL     | 2592000 |
  +-------+---------------+-------------------------+-------------------------+---------------+---------+---------------+---------------+---------------+----------+------+----------+---------+
  1 row in set (0.00 sec)
  ```

  ```sql
  -- If the table has no partitions, PartitionName defaults to TableName
  mysql> SHOW BUILD INDEX;
  +-------+---------------+---------------+----------------------------------------------------------+-------------------------+-------------------------+---------------+----------+------+----------+
  | JobId | TableName     | PartitionName | AlterInvertedIndexes                                     | CreateTime              | FinishTime              | TransactionId | State    | Msg  | Progress |
  +-------+---------------+---------------+----------------------------------------------------------+-------------------------+-------------------------+---------------+----------+------+----------+
  | 10191 | hackernews_1m | hackernews_1m | [ADD INDEX idx_timestamp (`timestamp`) USING INVERTED],  | 2023-06-26 15:32:33.894 | 2023-06-26 15:32:34.847 | 3             | FINISHED |      | NULL     |
  +-------+---------------+---------------+----------------------------------------------------------+-------------------------+-------------------------+---------------+----------+------+----------+
  1 row in set (0.04 sec)
  ```

- After the index is created, range queries use the same query syntax. Doris will automatically recognize the index for optimization. However, due to the small dataset, the performance difference is not significant.

  ```sql
  mysql> SELECT count() FROM hackernews_1m WHERE timestamp > '2007-08-23 04:17:00';
  +---------+
  | count() |
  +---------+
  |  999081 |
  +---------+
  1 row in set (0.01 sec)
  ```

- Performing similar operations on a numeric column `parent` with an equality match query.

  ```sql
  mysql> SELECT count() FROM hackernews_1m WHERE parent = 11189;
  +---------+
  | count() |
  +---------+
  |       2 |
  +---------+
  1 row in set (0.01 sec)

  -- For numeric types, USING INVERTED does not require specifying a parser
  -- ALTER TABLE t ADD INDEX is the second syntax for creating an index
  mysql> ALTER TABLE hackernews_1m ADD INDEX idx_parent(parent) USING INVERTED;
  Query OK, 0 rows affected (0.01 sec)

  -- Execute BUILD INDEX to create the inverted index for existing data
  mysql> BUILD INDEX idx_parent ON hackernews_1m;
  Query OK, 0 rows affected (0.01 sec)

  mysql> SHOW ALTER TABLE COLUMN;
  +-------+---------------+-------------------------+-------------------------+---------------+---------+---------------+---------------+---------------+----------+------+----------+---------+
  | JobId | TableName     | CreateTime              | FinishTime              | IndexName     | IndexId | OriginIndexId | SchemaVersion | TransactionId | State    | Msg  | Progress | Timeout |
  +-------+---------------+-------------------------+-------------------------+---------------+---------+---------------+---------------+---------------+----------+------+----------+---------+
  | 10030 | hackernews_1m | 2023-02-10 19:44:12.929 | 2023-02-10 19:44:13.938 | hackernews_1m | 10031   | 10008         | 1:1994690496  | 3             | FINISHED |      | NULL     | 2592000 |
  | 10053 | hackernews_1m | 2023-02-10 19:49:32.893 | 2023-02-10 19:49:33.982 | hackernews_1m | 10054   | 10008         | 1:378856428   | 4             | FINISHED |      | NULL     | 2592000 |
  +-------+---------------+-------------------------+-------------------------+---------------+---------+---------------+---------------+---------------+----------+------+----------+---------+

  mysql> SHOW BUILD INDEX;
  +-------+---------------+---------------+----------------------------------------------------+-------------------------+-------------------------+---------------+----------+------+----------+
  | JobId | TableName     | PartitionName | AlterInvertedIndexes                               | CreateTime              | FinishTime              | TransactionId | State    | Msg  | Progress |
  +-------+---------------+---------------+----------------------------------------------------+-------------------------+-------------------------+---------------+----------+------+----------+
  | 11005 | hackernews_1m | hackernews_1m | [ADD INDEX idx_parent (`parent`) USING INVERTED],  | 2023-06-26 16:25:10.167 | 2023-06-26 16:25:10.838 | 1002          | FINISHED |      | NULL     |
  +-------+---------------+---------------+----------------------------------------------------+-------------------------+-------------------------+---------------+----------+------+----------+
  1 row in set (0.01 sec)

  mysql> SELECT count() FROM hackernews_1m WHERE parent = 11189;
  +---------+
  | count() |
  +---------+
  |       2 |
  +---------+
  1 row in set (0.01 sec)
  ```

- Creating an inverted index for the string column `author` without tokenization. Equality queries can also leverage the index for speedup.

  ```sql
  mysql> SELECT count() FROM hackernews_1m WHERE author = 'faster';
  +---------+
  | count() |
  +---------+
  |      20 |
  +---------+
  1 row in set (0.03 sec)
  
  -- Here, USING INVERTED is used without tokenizing the `author` column, treating it as a single term
  mysql> ALTER TABLE hackernews_1m ADD INDEX idx_author(author) USING INVERTED;
  Query OK, 0 rows affected (0.01 sec)
  
  -- Execute BUILD INDEX to add the inverted index for existing data
  mysql> BUILD INDEX idx_author ON hackernews_1m;
  Query OK, 0 rows affected (0.01 sec)
  
Creating an incremental index for 1 million author records took only 1.5 seconds.

```sql
mysql> SHOW ALTER TABLE COLUMN;
+-------+---------------+-------------------------+-------------------------+---------------+---------+---------------+---------------+---------------+----------+------+----------+---------+
| JobId | TableName     | CreateTime              | FinishTime              | IndexName     | IndexId | OriginIndexId | SchemaVersion | TransactionId | State    | Msg  | Progress | Timeout |
+-------+---------------+-------------------------+-------------------------+---------------+---------+---------------+---------------+---------------+----------+------+----------+---------+
| 10030 | hackernews_1m | 2023-02-10 19:44:12.929 | 2023-02-10 19:44:13.938 | hackernews_1m | 10031   | 10008         | 1:1994690496  | 3             | FINISHED |      | NULL     | 2592000 |
| 10053 | hackernews_1m | 2023-02-10 19:49:32.893 | 2023-02-10 19:49:33.982 | hackernews_1m | 10054   | 10008         | 1:378856428   | 4             | FINISHED |      | NULL     | 2592000 |
| 10076 | hackernews_1m | 2023-02-10 19:54:20.046 | 2023-02-10 19:54:21.521 | hackernews_1m | 10077   | 10008         | 1:1335127701  | 5             | FINISHED |      | NULL     | 2592000 |
+-------+---------------+-------------------------+-------------------------+---------------+---------+---------------+---------------+---------------+----------+------+----------+---------+
```

```sql
mysql> SHOW BUILD INDEX ORDER BY CreateTime DESC LIMIT 1;
+-------+---------------+---------------+----------------------------------------------------+-------------------------+-------------------------+---------------+----------+------+----------+
| JobId | TableName     | PartitionName | AlterInvertedIndexes                               | CreateTime              | FinishTime              | TransactionId | State    | Msg  | Progress |
+-------+---------------+---------------+----------------------------------------------------+-------------------------+-------------------------+---------------+----------+------+----------+
| 13006 | hackernews_1m | hackernews_1m | [ADD INDEX idx_author (`author`) USING INVERTED],  | 2023-06-26 17:23:02.610 | 2023-06-26 17:23:03.755 | 3004          | FINISHED |      | NULL     |
+-------+---------------+---------------+----------------------------------------------------+-------------------------+-------------------------+---------------+----------+------+----------+
1 row in set (0.01 sec)
```

-- After creating the index, string equality matches also showed significant acceleration.

```sql
mysql> SELECT count() FROM hackernews_1m WHERE author = 'faster';
+---------+
| count() |
+---------+
|      20 |
+---------+
1 row in set (0.01 sec)
```

