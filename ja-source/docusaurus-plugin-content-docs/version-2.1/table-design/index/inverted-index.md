---
{
  "title": "転置インデックス",
  "language": "ja",
  "description": "転置インデックスは情報検索の分野で一般的に使用されるインデックス技術です。"
}
---
## インデックス化の原理

[Inverted Index](https://en.wikipedia.org/wiki/Inverted_index)は、情報検索の分野で一般的に使用されるインデックス技術です。テキストを個々の単語に分割し、単語 -> ドキュメントIDのインデックスを構築することで、特定の単語を含むドキュメントを素早く検索できます。

バージョン2.0.0から、Dorisはinverted indexをサポートしており、テキストタイプの全文検索、通常の数値および日付タイプの等価・範囲クエリに使用でき、大量のデータから条件を満たす行を高速でフィルタリングできます。

Dorisのinverted indexの実装では、テーブルの各行がドキュメントに対応し、各カラムがドキュメント内のフィールドに対応します。そのため、inverted indexを使用することで、特定のキーワードを含む行を素早く特定でき、WHERE句を高速化できます。

Dorisの他のインデックスとは異なり、inverted indexはストレージ層で独立したファイルを使用し、データファイルと1対1で対応しますが、物理的には独立して保存されます。このアプローチにより、データファイルを書き直すことなくインデックスの作成と削除が可能になり、処理オーバーヘッドが大幅に削減されます。

## 使用シナリオ

Inverted indexは幅広い用途があり、等価、範囲、全文検索（キーワードマッチング、フレーズマッチングなど）を高速化できます。テーブルは複数のinverted indexを持つことができ、クエリ時には複数のinverted indexの条件を任意に組み合わせることができます。

Inverted indexの機能を以下に簡単に紹介します：

**1. 文字列タイプの全文検索を高速化**
  - 複数キーワードの同時マッチング`MATCH_ALL`と任意の1つのキーワードマッチング`MATCH_ANY`を含むキーワード検索をサポート
  
  - フレーズクエリ`MATCH_PHRASE`をサポート

  - トークン化された正規表現クエリ`MATCH_REGEXP`をサポート

  - 英語、中国語、Unicodeトークナイザーをサポート

**2. 通常の等価・範囲クエリを高速化し、BITMAPインデックスの機能をカバーし置き換え**

- 文字列、数値、日時タイプの =, !=, >, >=, <, <=の高速フィルタリングをサポート

- 文字列、数値、日時配列タイプの`array_contains`の高速フィルタリングをサポート

**3. 包括的な論理結合をサポート**

- AND条件の高速化だけでなく、ORおよびNOT条件もサポート

- AND、OR、NOTによる複数条件の任意の論理結合をサポート

**4. 柔軟で効率的なインデックス管理**

- テーブル作成時のinverted index定義をサポート

- 既存テーブルへのinverted index追加をサポート、テーブル内の既存データを書き直すことなく増分インデックス構築

- 既存テーブルからのinverted index削除をサポート、テーブル内の既存データを書き直すことなく実行

:::tip

Inverted indexの使用にはいくつかの制限があります：

1. 精度の問題がある浮動小数点タイプFLOATとDOUBLEは、精度が不正確なためinverted indexをサポートしません。解決策は、精度が正確なDECIMALタイプを使用することで、これはinverted indexをサポートします。

2. 一部の複雑なデータタイプはまだinverted indexをサポートしていません。MAP、STRUCT、JSON、HLL、BITMAP、QUANTILE_STATE、AGG_STATEが含まれます。

3. DUPLICATEおよびMerge-on-Writeを有効にしたUNIQUEテーブルモデルは、任意のカラムでのinverted index構築をサポートします。ただし、AGGREGATEおよびMerge-on-Writeを有効にしていないUNIQUEモデルは、Keyカラムでのinverted index構築のみをサポートします。非Keyカラムはinverted indexを持つことができません。これは、これら2つのモデルがマージのために全データを読み取る必要があるため、事前フィルタリングにインデックスを使用できないためです。

:::

## インデックスの管理

### テーブル作成時のInverted Index定義

テーブル作成文では、COLUMN定義の後にインデックス定義があります：

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
構文の説明：

**1. `idx_column_name(column_name)` は必須です。`column_name` はインデックス用のカラム名で、事前に定義されたカラムである必要があります。`idx_column_name` はインデックス名で、テーブルレベルで一意である必要があります。推奨される命名規則：カラム名の前に `idx_` プレフィックスを付ける**

**2. `USING INVERTED` は必須で、インデックスタイプが転置インデックスであることを指定します**

**3. `PROPERTIES` はオプションで、転置インデックスの追加プロパティを指定します。現在サポートされているプロパティは：**

<details>
  <summary>parser: トークナイザーを指定します</summary>
  <p>- デフォルトでは未指定で、トークン化を行わないことを意味します</p>
  <p>- `english`: 英語のトークン化。英語テキストのカラムに適しており、スペースと句読点でトークン化し、高いパフォーマンスです</p>
  <p>- `chinese`: 中国語のトークン化。主に中国語テキストのカラムに適しており、英語のトークン化よりもパフォーマンスが劣ります</p>
  <p>- `unicode`: Unicodeのトークン化。中国語と英語の混在、および多言語混在テキストに適しています。メールアドレスのプレフィックスとサフィックス、IPアドレス、文字と数字の混在文字列をトークン化でき、中国語を文字単位でトークン化できます。</p>

  トークン化の結果は `TOKENIZE` SQL関数を使用して検証できます。詳細については以下のセクションを参照してください。
</details>

<details>
  <summary>parser_mode</summary>

  **トークン化モードを指定します。現在 `parser = chinese` でサポートされているモードは：**
  <p>- fine_grained: 細粒度モード。より短く、より多くの単語を生成する傾向があります。例：'武汉市长江大桥' は '武汉', '武汉市', '市长', '长江', '长江大桥', '大桥' にトークン化されます</p>
  <p>- coarse_grained: 粗粒度モード。より長く、より少ない単語を生成する傾向があります。例：'武汉市长江大桥' は '武汉市', '长江大桥' にトークン化されます</p>
  <p>- デフォルト coarse_grained</p>
</details>

<details>
  <summary>support_phrase</summary>

  **インデックスがMATCH_PHRASEフレーズクエリの高速化をサポートするかどうかを指定します**
  <p>- true: サポートしますが、インデックスにはより多くのストレージ容量が必要です</p>
  <p>- false: サポートしません。ストレージ効率が良く、MATCH_ALLを使用して複数のキーワードをクエリできます</p>
  <p>- バージョン2.0.14、2.1.5、3.0.1以降では、parserが設定されている場合はデフォルトでtrueです。それ以外の場合はfalseがデフォルトです。</p>

  例えば、以下の例では中国語のトークン化、粗粒度モード、フレーズクエリ高速化のサポートを指定しています。

```sql
   INDEX idx_name(column_name) USING INVERTED PROPERTIES("parser" = "chinese", "parser_mode" = "coarse_grained", "support_phrase" = "true")
```
</details>

<details>
  <summary>char_filter</summary>

  **トークン化前のテキストの前処理を指定し、通常はトークン化の動作に影響を与える**

  <p>char_filter_type: 異なる機能のchar_filterを指定する（現在はchar_replaceのみサポート）</p>

  <p>char_replaceはpattern内の各文字をreplacement内の文字に置換する</p>
  <p>- char_filter_pattern: 置換される文字</p>
  <p>- char_filter_replacement: 置換文字配列、オプション、デフォルトはスペース文字</p>

  例えば、以下の例はドットとアンダースコアをスペースに置換し、それらを単語区切り文字として扱うことで、トークン化の動作に影響を与える。

```sql
   INDEX idx_name(column_name) USING INVERTED PROPERTIES("parser" = "unicode", "char_filter_type" = "char_replace", "char_filter_pattern" = "._", "char_filter_replacement" = " ")
```
</details>

<details>
  <summary>ignore_above</summary>

  **非トークン化文字列インデックス（parser未指定）の長さ制限を指定**
  <p>- ignore_aboveで設定された長さより長い文字列はインデックス化されません。文字列配列の場合、ignore_aboveは各配列要素に個別に適用され、ignore_aboveより長い要素はインデックス化されません。</p>
  <p>- デフォルトは256、単位はバイト</p>

</details>

<details>
  <summary>lower_case</summary>

  **大文字小文字を区別しないマッチングのためにトークンを小文字に変換するかどうか**
  <p>- true: 小文字に変換</p>
  <p>- false: 小文字に変換しない</p>
  <p>- バージョン2.1.2以降、デフォルトはtrueで、自動的に小文字に変換されます。以前のバージョンではデフォルトはfalseです。</p>
</details>

<details>
  <summary>stopwords</summary>

  **使用するストップワードリストの指定。tokenizerの動作に影響します**
  <p>- デフォルトの組み込みストップワードリストには、'is'、'the'、'a'などの意味のない単語が含まれています。書き込みまたはクエリ時に、tokenizerはストップワードリストにある単語を無視します。</p>
  <p>- none: 空のストップワードリストを使用</p>
</details>

**4. `COMMENT`はインデックスコメントの指定でオプション**

### 既存テーブルへの転置インデックスの追加

**1. ADD INDEX**

`CREATE INDEX`と`ALTER TABLE ADD INDEX`の両方の構文をサポートします。パラメータはテーブル作成時のインデックス定義で使用されるものと同じです。

```sql
-- Syntax 1
CREATE INDEX idx_name ON table_name(column_name) USING INVERTED [PROPERTIES(...)] [COMMENT 'your comment'];
-- Syntax 2
ALTER TABLE table_name ADD INDEX idx_name(column_name) USING INVERTED [PROPERTIES(...)] [COMMENT 'your comment'];
```
**2. BUILD INDEX**

`CREATE / ADD INDEX`操作はインデックス定義の追加のみを行います。この操作後に書き込まれる新しいデータは転置インデックスを生成しますが、既存のデータには`BUILD INDEX`を使用してインデックス作成をトリガーする必要があります：

```sql
-- Syntax 1, by default, builds the index for all partitions in the table
BUILD INDEX index_name ON table_name;
-- Syntax 2, you can specify partitions, one or more
BUILD INDEX index_name ON table_name PARTITIONS(partition_name1, partition_name2);
```
`BUILD INDEX`の進行状況を確認するには、`SHOW BUILD INDEX`を使用します：

```sql
SHOW BUILD INDEX [FROM db_name];
-- Example 1, view the progress of all BUILD INDEX tasks
SHOW BUILD INDEX;
-- Example 2, view the progress of BUILD INDEX tasks for a specific table
SHOW BUILD INDEX where TableName = "table1";
```
`BUILD INDEX`をキャンセルするには、`CANCEL BUILD INDEX`を使用します：

```sql
CANCEL BUILD INDEX ON table_name;
CANCEL BUILD INDEX ON table_name (job_id1, job_id2, ...);
```
:::tip

`BUILD INDEX`は各BEで複数のスレッドによって実行される非同期タスクを作成します。スレッド数はBE設定の`alter_index_worker_count`で設定でき、デフォルト値は3です。

2.1.4より前のバージョンでは、`BUILD INDEX`は成功するまで再試行を続けていました。このバージョンから、失敗とタイムアウトメカニズムにより無限の再試行が防止されます。

1. タブレットの過半数のレプリカで`BUILD INDEX`が失敗した場合、`BUILD INDEX`操作全体が失敗します。
2. 時間が`alter_table_timeout_second`を超えた場合、`BUILD INDEX`操作はタイムアウトします。
3. ユーザーは`BUILD INDEX`を複数回実行できます。既に正常に構築されたインデックスは再構築されません。

:::

### 既存テーブルからの転置インデックスの削除

```sql
-- Syntax 1
DROP INDEX idx_name ON table_name;
-- Syntax 2
ALTER TABLE table_name DROP INDEX idx_name;
```
:::tip

`DROP INDEX`はインデックス定義を削除するため、新しいデータはインデックスに書き込まれなくなります。これにより、各BEで複数のスレッドによって実行されるインデックス削除を実行する非同期タスクが作成されます。スレッド数はBEパラメータ`alter_index_worker_count`で設定でき、デフォルト値は3です。

:::

### 転置インデックスの表示

-- 構文 1: テーブルスキーマのINDEXセクションでUSING INVERTEDは転置インデックスを示します
SHOW CREATE TABLE table_name;

-- 構文 2: IndexTypeがINVERTEDの場合、転置インデックスを示します
SHOW INDEX FROM idx_name;

## インデックスの使用

### 転置インデックスによるクエリの高速化

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
-- To use MATCH_PHRASE, you need to enable "support_phrase" = "true" in PROPERTIES.
SELECT * FROM table_name WHERE content MATCH_PHRASE 'keyword1 keyword2';

-- 2.2 Rows in the content column containing both keyword1 and keyword2, with a slop (maximum word distance) of 3
-- 'keyword1 keyword2', 'keyword1 a keyword2', 'keyword1 a b c keyword2' all match because the slop is 0, 1, and 3 respectively, all within 3
-- 'keyword1 a b c d keyword2' does not match because the slop is 4, exceeding 3
-- 'keyword2 keyword1', 'keyword2 a keyword1', 'keyword2 a b c keyword1' also match because when slop > 0, the order of keyword1 and keyword2 is not required. To enforce the order, Doris provides a + sign after slop
SELECT * FROM table_name WHERE content MATCH_PHRASE 'keyword1 keyword2 ~3';
-- To enforce order, use a positive sign with slop; 'keyword1 a b c keyword2' matches, while 'keyword2 a b c keyword1' does not
SELECT * FROM table_name WHERE content MATCH_PHRASE 'keyword1 keyword2 ~3+';

-- 2.3 Prefix matching the last word keyword2, with a default limit of 50 prefixes (controlled by session variable inverted_index_max_expansions)
-- It is necessary to ensure that keyword1 and keyword2 remain adjacent in the original text after tokenization, with no other words in between.
-- 'keyword1 keyword2abc' matches because keyword1 is identical and keyword2abc is a prefix of keyword2
-- 'keyword1 keyword2' also matches because keyword2 is a prefix of keyword2
-- 'keyword1 keyword3' does not match because keyword3 is not a prefix of keyword2
-- 'keyword1 keyword3abc' does not match because keyword3abc is not a prefix of keyword2
SELECT * FROM table_name WHERE content MATCH_PHRASE_PREFIX 'keyword1 keyword2';

-- 2.4 If only one word is provided, it defaults to a prefix query with a limit of 50 prefixes (controlled by session variable inverted_index_max_expansions)
SELECT * FROM table_name WHERE content MATCH_PHRASE_PREFIX 'keyword1';

-- 2.5 Regular expression matching on tokenized words, with a default limit of 50 matches (controlled by session variable inverted_index_max_expansions)
-- Similar to MATCH_PHRASE_PREFIX but with regex instead of prefix
SELECT * FROM table_name WHERE content MATCH_REGEXP 'key.*';

-- 3. Normal equality, range, IN, and NOT IN queries using standard SQL syntax, for example:
SELECT * FROM table_name WHERE id = 123;
SELECT * FROM table_name WHERE ts > '2023-01-01 00:00:00';
SELECT * FROM table_name WHERE op_type IN ('add', 'delete');

-- 4. Full-text search across multiple columns using the multi_match function
-- Parameters:
--   First N parameters are column names to search
--   Second-to-last parameter specifies match mode: 'any'/'all'/'phrase'/'phrase_prefix'
--   Last parameter is the keyword or phrase to search for

-- 4.1 Rows where 'keyword1' appears in ANY of col1,col2,col3 (OR logic)
select * FROM table_name WHERE multi_match(col1, col2, col3, 'any', 'keyword1');

-- 4.2 Rows where 'keyword1' appears in ALL of col1,col2,col3 (AND logic)
select * FROM table_name WHERE multi_match(col1, col2, col3, 'all', 'keyword1');

-- 4.3 Rows where the exact phrase 'keyword1' appears in ANY of col1,col2,col3 (exact phrase match)
select * FROM table_name WHERE multi_match(col1, col2, col3, 'phrase', 'keyword1');

-- 4.4 Rows where a phrase starting with 'keyword1' appears in ANY of col1,col2,col3 (phrase prefix match)
-- For example, will match content like "keyword123"
select * FROM table_name WHERE multi_match(col1, col2, col3, 'phrase_prefix', 'keyword1');
```
### プロファイルによるインデックス高速化効果の分析

転置インデックスクエリの高速化は、セッション変数`enable_inverted_index_query`を使用して切り替えることができ、デフォルトではtrueに設定されています。インデックスの高速化効果を検証するには、falseに設定して無効にすることができます。

転置インデックスの高速化効果は、Query Profileの次のメトリクスを使用して分析できます：
- RowsInvertedIndexFiltered: 転置インデックスによってフィルタリングされた行数。他のRows値と比較してインデックスのフィルタリング効果を分析できます。
- InvertedIndexFilterTime: 転置インデックスによって消費された時間。
  - InvertedIndexSearcherOpenTime: 転置インデックスを開くのにかかった時間。
  - InvertedIndexSearcherSearchTime: 転置インデックス内の内部クエリにかかった時間。


### トークン化関数を使用したトークン化効果の検証

トークン化の実際の効果を確認したり、テキストの一部をトークン化したりするには、`TOKENIZE`関数を使用して検証できます。

`TOKENIZE`関数の最初のパラメータはトークン化するテキストで、2番目のパラメータはインデックス作成時に使用されるトークン化パラメータを指定します。

SELECT TOKENIZE('I love Doris','"parser"="english"');
+------------------------------------------------+
| tokenize('I love Doris', '"parser"="english"') |
+------------------------------------------------+
| ["i", "love", "doris"]                         |
+------------------------------------------------+

```

## Usage Example

Demonstrating the creation of an inverted index, full-text search, and regular queries using 1 million records from HackerNews. This includes a simple performance comparison with queries without indexing.

### table Creation

```sql
CREATE DATABASE test_inverted_index;

USE test_inverted_index;

-- comment フィールドに転置インデックスを持つテーブルを作成する
--   USING INVERTED はインデックスタイプを転置インデックスとして指定する
--   PROPERTIES("parser" = "english") は "english" トークナイザーの使用を指定する。その他のオプションには中国語のトークン化用の "chinese" や多言語トークン化用の "unicode" がある。"parser" パラメータが指定されない場合、トークン化は適用されない。

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
SELECT count() FROM hackernews_1m;
+---------+
| count() |
+---------+
| 1000000 |
+---------+

```

### Queries

**01 Full-Text Search**

- Using `LIKE` to match and count rows containing 'OLAP' in the `comment` column took 0.18s.

  ```sql
SELECT count() FROM hackernews_1m WHERE comment LIKE '%OLAP%';
  +---------+
  | count() |
  +---------+
  |      34 |
  +---------+

  ```

- Using full-text search with `MATCH_ANY` based on the inverted index to count rows containing 'OLAP' in the `comment` column took 0.02s, resulting in a 9x speedup. The performance improvement would be even more significant on larger datasets.
  
  The difference in the number of results is due to the inverted index normalizing the terms by converting them to lowercase, among other processes, hence `MATCH_ANY` yields more results than `LIKE`.

  ```sql
SELECT count() FROM hackernews_1m WHERE comment MATCH_ANY 'OLAP';
  +---------+
  | count() |
  +---------+
  |      35 |
  +---------+

  ```

- Similarly, comparing the performance for counting occurrences of 'OLTP', 0.07s vs 0.01s. Due to caching, both `LIKE` and `MATCH_ANY` improved, but the inverted index still provided a 7x speedup.

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

- Counting rows where both 'OLAP' and 'OLTP' appear took 0.13s vs 0.01s, a 13x speedup.

  To require multiple terms to appear simultaneously (AND relationship), use `MATCH_ALL 'keyword1 keyword2 ...'`.

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

- Counting rows where either 'OLAP' or 'OLTP' appears took 0.12s vs 0.01s, a 12x speedup.
  
  To require any one or more of multiple terms to appear (OR relationship), use `MATCH_ANY 'keyword1 keyword2 ...'`.

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

  ### 02 Standard Equality and Range Queries

- Range query on a `DateTime` type column

  ```sql
SELECT count() FROM hackernews_1m WHERE timestamp > '2007-08-23 04:17:00';
  +---------+
  | count() |
  +---------+
  |  999081 |
  +---------+

  ```

- Adding an inverted index for the `timestamp` column

  ```sql
-- 日時型の場合、USING INVERTEDはパーサーの指定を必要としません
  -- CREATE INDEXはインデックスを作成するための構文の一つです。別の方法は後で説明します
  CREATE INDEX idx_timestamp ON hackernews_1m(timestamp) USING INVERTED;

  ```

  ```sql
BUILD INDEX idx_timestamp ON hackernews_1m;

  ```

- Checking the index creation progress. From the difference between `FinishTime` and `CreateTime`, we can see that building the inverted index for 1 million rows on the `timestamp` column took only 1 second.

  ```sql
SHOW ALTER TABLE COLUMN;
  +-------+---------------+-------------------------+-------------------------+---------------+---------+---------------+---------------+---------------+----------+------+----------+---------+
  | JobId | TableName     | CreateTime              | FinishTime              | IndexName     | IndexId | OriginIndexId | SchemaVersion | TransactionId | State    | Msg  | Progress | Timeout |
  +-------+---------------+-------------------------+-------------------------+---------------+---------+---------------+---------------+---------------+----------+------+----------+---------+
  | 10030 | hackernews_1m | 2023-02-10 19:44:12.929 | 2023-02-10 19:44:13.938 | hackernews_1m | 10031   | 10008         | 1:1994690496  | 3             | FINISHED |      | NULL     | 2592000 |
  +-------+---------------+-------------------------+-------------------------+---------------+---------+---------------+---------------+---------------+----------+------+----------+---------+

  ```

  ```sql
-- テーブルにパーティションがない場合、PartitionName はデフォルトで TableName になります
  SHOW BUILD INDEX;
  +-------+---------------+---------------+----------------------------------------------------------+-------------------------+-------------------------+---------------+----------+------+----------+
  | JobId | TableName     | PartitionName | AlterInvertedIndexes                                     | CreateTime              | FinishTime              | TransactionId | State    | Msg  | Progress |
  +-------+---------------+---------------+----------------------------------------------------------+-------------------------+-------------------------+---------------+----------+------+----------+
  | 10191 | hackernews_1m | hackernews_1m | [ADD INDEX idx_timestamp (`timestamp`) USING INVERTED],  | 2023-06-26 15:32:33.894 | 2023-06-26 15:32:34.847 | 3             | FINISHED |      | NULL     |
  +-------+---------------+---------------+----------------------------------------------------------+-------------------------+-------------------------+---------------+----------+------+----------+

  ```

- After the index is created, range queries use the same query syntax. Doris will automatically recognize the index for optimization. However, due to the small dataset, the performance difference is not significant.

  ```sql
SELECT count() FROM hackernews_1m WHERE timestamp > '2007-08-23 04:17:00';
  +---------+
  | count() |
  +---------+
  |  999081 |
  +---------+

  ```

- Performing similar operations on a numeric column `parent` with an equality match query.

  ```sql
SELECT count() FROM hackernews_1m WHERE parent = 11189;
  +---------+
  | count() |
  +---------+
  |       2 |
  +---------+

  -- 数値型の場合、USING INVERTEDはパーサーの指定は必要ありません
  -- ALTER TABLE t ADD INDEXはインデックスを作成する2番目の構文です
  ALTER TABLE hackernews_1m ADD INDEX idx_parent(parent) USING INVERTED;


  -- BUILD INDEXを実行して既存データの転置インデックスを作成します
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

- Creating an inverted index for the string column `author` without tokenization. Equality queries can also leverage the index for speedup.

  ```sql
SELECT count() FROM hackernews_1m WHERE author = 'faster';
  +---------+
  | count() |
  +---------+
  |      20 |
  +---------+
  
  -- ここでは、USING INVERTEDを`author`列をトークン化せずに使用し、単一の用語として扱います
  ALTER TABLE hackernews_1m ADD INDEX idx_author(author) USING INVERTED;

  
  -- 既存データに対してinvertedインデックスを追加するためにBUILD INDEXを実行します
  BUILD INDEX idx_author ON hackernews_1m;

  
100万件のautherレコードに対する増分インデックスの作成は、わずか1.5秒で完了しました。

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
-- インデックスの作成後、文字列の等価一致も大幅な高速化を示しました。

```sql
SELECT count() FROM hackernews_1m WHERE author = 'faster';
+---------+
| count() |
+---------+
|      20 |
+---------+
```
