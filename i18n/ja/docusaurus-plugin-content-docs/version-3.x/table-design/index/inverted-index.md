---
{
  "title": "転置インデックス",
  "language": "ja",
  "description": "転置インデックスは情報検索の分野で一般的に使用されるインデキシング技術です。"
}
---
## インデックス原理

[転置インデックス](https://en.wikipedia.org/wiki/Inverted_index)は、情報検索分野で一般的に使用されるインデックス技術です。テキストを個々の単語に分割し、単語 -> 文書IDのインデックスを構築することで、特定の単語を含む文書を高速に検索できます。

バージョン2.0.0以降、Dorisは転置インデックスをサポートしており、テキスト型の全文検索、通常の数値型と日付型の等価・範囲クエリに使用でき、大量のデータから条件に合致する行を高速にフィルタリングできます。

Dorisの転置インデックスの実装では、テーブルの各行が1つの文書に対応し、各列が文書内のフィールドに対応します。したがって、転置インデックスを使用することで、特定のキーワードを含む行を高速に特定でき、WHERE句を高速化できます。

Dorisの他のインデックスとは異なり、転置インデックスはストレージ層で独立したファイルを使用し、データファイルと1対1で対応しますが、物理的には独立して保存されます。このアプローチにより、データファイルを書き換えることなくインデックスの作成と削除が可能になり、処理オーバーヘッドを大幅に削減できます。

## 使用シナリオ

転置インデックスは幅広い用途があり、等価、範囲、全文検索（キーワード一致、フレーズ一致など）を高速化できます。1つのテーブルに複数の転置インデックスを持つことができ、クエリ時に複数の転置インデックスの条件を任意に組み合わせることができます。

転置インデックスの機能を以下に簡単に紹介します：

**1. 文字列型の全文検索の高速化**

- キーワード検索をサポート。複数のキーワードを同時に一致させる`MATCH_ALL`と任意の1つのキーワードを一致させる`MATCH_ANY`を含む。

- フレーズクエリ`MATCH_PHRASE`をサポート
  - 単語間距離のslopの指定をサポート
  - フレーズ + プレフィックス`MATCH_PHRASE_PREFIX`をサポート

- トークン化された正規表現クエリ`MATCH_REGEXP`をサポート

- 英語、中国語、Unicodeのトークナイザーをサポート

**2. 通常の等価・範囲クエリの高速化、BITMAPインデックスの機能を包含・置換**

- 文字列、数値、datetime型の=、!=、>、>=、<、<=の高速フィルタリングをサポート

- 文字列、数値、datetime配列型の`array_contains`の高速フィルタリングをサポート

**3. 包括的な論理結合をサポート**

- AND条件の高速化だけでなく、ORやNOT条件もサポート

- AND、OR、NOTによる複数条件の任意の論理結合をサポート

**4. 柔軟で効率的なインデックス管理**

- テーブル作成時の転置インデックス定義をサポート

- 既存テーブルへの転置インデックス追加をサポート。テーブル内の既存データを書き換えることなく増分インデックス構築

- 既存テーブルからの転置インデックス削除をサポート。テーブル内の既存データを書き換えることなく削除

:::tip

転置インデックスの使用にはいくつかの制限があります：

1. 浮動小数点型のFLOATとDOUBLEは精度の問題があるため、精度が不正確なことから転置インデックスをサポートしていません。解決策は、転置インデックスをサポートする正確なDECIMAL型を使用することです。

2. 一部の複雑なデータ型は、MAP、STRUCT、JSON、HLL、BITMAP、QUANTILE_STATE、AGG_STATEを含めて、まだ転置インデックスをサポートしていません。

3. DUPLICATEとMerge-on-Writeが有効なUNIQUEテーブルモデルは、任意の列に転置インデックスの構築をサポートしています。しかし、Merge-on-Writeが有効でないAGGREGATEとUNIQUEモデルは、Key列にのみ転置インデックスの構築をサポートしており、非Key列には転置インデックスを作成できません。これは、この2つのモデルではマージのためにすべてのデータを読み取る必要があり、事前フィルタリングにインデックスを使用できないためです。

:::

## インデックス管理

### テーブル作成時の転置インデックス定義

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
構文の説明:

**1. `idx_column_name(column_name)`は必須です。`column_name`はインデックス対象の列名で、事前に定義された列である必要があります。`idx_column_name`はインデックス名で、テーブルレベルで一意である必要があります。推奨命名規則：列名の前に`idx_`プレフィックスを付けること**

**2. `USING INVERTED`は必須で、インデックスタイプが転置インデックスであることを指定します**

**3. `PROPERTIES`はオプションで、転置インデックスの追加プロパティを指定します。現在サポートされているプロパティは以下の通りです:**

<details>
  <summary>parser: トークナイザーを指定します</summary>
  <p>- デフォルトでは未指定で、トークン化を行わないことを意味します</p>
  <p>- `english`: 英語トークン化、英語テキストを含む列に適しており、スペースと句読点でトークン化し、高いパフォーマンスを提供します</p>
  <p>- `chinese`: 中国語トークン化、主に中国語テキストを含む列に適しており、英語トークン化よりもパフォーマンスが低くなります</p>
  <p>- `unicode`: Unicodeトークン化、中国語と英語の混合、および多言語混合テキストに適しています。メールのプレフィックスとサフィックス、IPアドレス、文字と数字の混合文字列をトークン化でき、中国語を文字単位でトークン化できます。</p>
  <p>- `icu`（3.1.0以降でサポート）: ICU（International Components for Unicode）トークン化、ICUライブラリに基づきます。複雑な文字体系と多言語ドキュメントを持つ国際化テキストに最適です。アラビア語、タイ語、その他のUnicodeベースの文字をサポートします。</p>
  <p>- `basic`（3.1.0以降でサポート）: シンプルな文字種認識を使用した基本的なルールベースのトークン化。極めて高いパフォーマンス要件またはシンプルなテキスト処理ニーズのシナリオに適しています。ルール：連続する英数字は1つのトークンとして扱われ、各中国語文字は個別のトークンとなり、句読点/スペース/特殊文字は無視されます。このトークナイザーは全トークナイザーの中で最高のパフォーマンスを提供しますが、unicodeやicuと比較してよりシンプルなトークン化ロジックを持ちます。</p>
  <p>- `ik`（3.1.0以降でサポート）: IK中国語トークン化、中国語テキスト分析専用に設計されています。</p>

  トークン化結果は`TOKENIZE` SQL関数を使用して検証できます。詳細については以下のセクションを参照してください。
</details>

<details>
  <summary>parser_mode</summary>

  **トークン化モードを指定します。現在`parser = chinese`でサポートされているモードは以下の通りです:**
  <p>- fine_grained: 細粒度モード、より短く、より多くの単語を生成する傾向があります。例：'武汉市长江大桥'は'武汉'、'武汉市'、'市长'、'长江'、'长江大桥'、'大桥'にトークン化されます</p>
  <p>- coarse_grained: 粗粒度モード、より長く、より少ない単語を生成する傾向があります。例：'武汉市长江大桥'は'武汉市'、'长江大桥'にトークン化されます</p>
  <p>- デフォルトはcoarse_grained</p>
</details>

<details>
  <summary>support_phrase</summary>

  **インデックスがMATCH_PHRASEフレーズクエリ高速化をサポートするかどうかを指定します**
  <p>- true: サポートされますが、インデックスはより多くのストレージ容量を必要とします</p>
  <p>- false: サポートされません。よりストレージ効率が良く、MATCH_ALLを使用して複数のキーワードをクエリできます</p>
  <p>- バージョン2.0.14、2.1.5、3.0.1以降では、parserが設定されている場合デフォルトはtrueです。それ以外の場合はfalseがデフォルトです。</p>

  例えば、以下の例では中国語トークン化、粗粒度モード、およびフレーズクエリ高速化のサポートを指定しています。

```sql
   INDEX idx_name(column_name) USING INVERTED PROPERTIES("parser" = "chinese", "parser_mode" = "coarse_grained", "support_phrase" = "true")
```
</details>

<details>
  <summary>char_filter</summary>

  **トークン化の前にテキストの前処理を指定します。通常、トークン化の動作に影響を与えるために使用されます**

  <p>char_filter_type: 異なる機能のchar_filterを指定します（現在はchar_replaceのみサポート）</p>

  <p>char_replaceはパターン内の各文字をreplacementの文字で置換します</p>
  <p>- char_filter_pattern: 置換される文字</p>
  <p>- char_filter_replacement: 置換文字の配列、オプション、デフォルトではスペース文字</p>

  例えば、以下の例はドットとアンダースコアをスペースで置換し、これにより単語の区切り文字として扱い、トークン化の動作に影響を与えます。

```sql
   INDEX idx_name(column_name) USING INVERTED PROPERTIES("parser" = "unicode", "char_filter_type" = "char_replace", "char_filter_pattern" = "._", "char_filter_replacement" = " ")
```
`
</details>

<details>
  <summary>ignore_above</summary>

  **トークン化されていない文字列インデックスの長さ制限を指定します（parserが指定されていない場合）**
  <p>- ignore_aboveで設定された長さより長い文字列はインデックス化されません。文字列配列の場合、ignore_aboveは各配列要素に個別に適用され、ignore_aboveより長い要素はインデックス化されません。</p>
  <p>- デフォルトは256、単位はバイトです</p>

</details>

<details>
  <summary>lower_case</summary>

  **大文字小文字を区別しないマッチングのためにトークンを小文字に変換するかどうか**
  <p>- true: 小文字に変換する</p>
  <p>- false: 小文字に変換しない</p>
  <p>- バージョン2.0.7および2.1.2以降では、デフォルトはtrueで、自動的に小文字に変換されます。それ以前のバージョンではデフォルトはfalseです。</p>
</details>

<details>
  <summary>stopwords</summary>

  **使用するストップワードリストを指定します。これはトークナイザーの動作に影響します**
  <p>- デフォルトの組み込みストップワードリストには、'is'、'the'、'a'などの意味のない単語が含まれています。書き込みまたはクエリ時に、トークナイザーはストップワードリストにある単語を無視します。</p>
  <p>- none: 空のストップワードリストを使用する</p>
</details>

<details>
  <summary>dict_compression (3.1.0以降サポート)</summary>

  **転置インデックス用語辞書に対してZSTD辞書圧縮を有効にするかどうかを指定します**
  <p>- true: 辞書圧縮を有効にする。インデックスのストレージサイズを最大20%削減でき、特に大規模テキストデータやログ解析シナリオで効果的です</p>
  <p>- false: 辞書圧縮を無効にする（デフォルト）</p>
  <p>- 推奨事項: 大規模テキストデータセット、ログ解析、またはストレージコストが懸念されるシナリオで有効にしてください。inverted_index_storage_format = "V3"と組み合わせることで最適に動作します</p>

  例:

```sql
   INDEX idx_name(column_name) USING INVERTED PROPERTIES("parser" = "english", "dict_compression" = "true")
```
</details>

**4. `COMMENT`はインデックスコメントの指定に使用するオプション項目です**

**5. テーブルレベルプロパティ`inverted_index_storage_format`（3.1.0以降でサポート）**

  転置インデックスに新しいV3ストレージ形式を使用するには、テーブル作成時にこのプロパティを指定します：

```sql
CREATE TABLE table_name (
    column_name TEXT,
    INDEX idx_name(column_name) USING INVERTED PROPERTIES("parser" = "english", "dict_compression" = "true")
) PROPERTIES (
    "inverted_index_storage_format" = "V3"
);
```
**inverted_index_storage_format値:**
  <p>- "V2": デフォルトのストレージ形式</p>
  <p>- "V3": 圧縮が最適化された新しいストレージ形式。V2と比較して、V3は以下を提供します:</p>
  <p>  - より小さなインデックスファイルで、ディスク使用量とI/Oオーバーヘッドを削減</p>
  <p>  - 大規模テキストデータとログ解析シナリオにおいて最大20%のストレージ容量節約</p>
  <p>  - 用語辞書のZSTD辞書圧縮（dict_compressionが有効な場合）</p>
  <p>  - 各用語に関連する位置情報の圧縮</p>
  <p>- 推奨: 大規模テキストデータセット、ログ分析ワークロード、またはストレージ最適化が重要な新しいテーブルにはV3を使用してください</p>

### 既存テーブルへの転置インデックスの追加

**1. ADD INDEX**

`CREATE INDEX`と`ALTER TABLE ADD INDEX`の両方の構文をサポートします。パラメータは、テーブル作成時にインデックスを定義する際に使用するものと同じです。

```sql
-- Syntax 1
CREATE INDEX idx_name ON table_name(column_name) USING INVERTED [PROPERTIES(...)] [COMMENT 'your comment'];
-- Syntax 2
ALTER TABLE table_name ADD INDEX idx_name(column_name) USING INVERTED [PROPERTIES(...)] [COMMENT 'your comment'];
```
**2. BUILD INDEX**

`CREATE / ADD INDEX`操作はインデックス定義を追加するのみです。この操作後に書き込まれる新しいデータは転置インデックスを生成しますが、既存のデータには`BUILD INDEX`を使用してインデックス作成をトリガーする必要があります：

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

`BUILD INDEX`は各BEで複数のスレッドによって実行される非同期タスクを作成します。スレッド数はBE設定`alter_index_worker_count`で設定でき、デフォルト値は3です。

2.0.12および2.1.4より前のバージョンでは、`BUILD INDEX`は成功するまで再試行し続けていました。これらのバージョン以降、失敗およびタイムアウト機構により無限の再試行が防止されます。3.0（Cloud Mode）では現時点でこのコマンドはサポートされていません。

1. タブレットのレプリカの大部分で`BUILD INDEX`が失敗した場合、`BUILD INDEX`操作全体が失敗します。
2. 時間が`alter_table_timeout_second`を超えた場合、`BUILD INDEX`操作がタイムアウトします。
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

-- 構文1: USING INVERTEDを使用したテーブルスキーマのINDEXセクションは転置インデックスを示します
SHOW CREATE TABLE table_name;

-- 構文2: IndexTypeがINVERTEDの場合、転置インデックスを示します
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
### プロファイルを通じたインデックス加速効果の分析

転置インデックスクエリ加速は、セッション変数 `enable_inverted_index_query` を使用して切り替えることができ、これはデフォルトで true に設定されています。インデックスの加速効果を確認するには、false に設定して無効にすることができます。

転置インデックスの加速効果は、Query Profile の以下のメトリクスを使用して分析できます：
- RowsInvertedIndexFiltered: 転置インデックスによってフィルタリングされた行数。他のRows値と比較してインデックスのフィルタリング効果を分析できます。
- InvertedIndexFilterTime: 転置インデックスによって消費された時間。
  - InvertedIndexSearcherOpenTime: 転置インデックスを開くのにかかった時間。
  - InvertedIndexSearcherSearchTime: 転置インデックス内の内部クエリにかかった時間。


### トークン化関数を使用したトークン化効果の検証

トークン化の実際の効果を確認したり、テキストをトークン化したりするには、`TOKENIZE` 関数を検証に使用できます。

`TOKENIZE` 関数の最初のパラメータはトークン化するテキストで、2番目のパラメータはインデックス作成時に使用されたトークン化パラメータを指定します。

```sql
-- English tokenization
SELECT TOKENIZE('I love Doris','"parser"="english"');
+------------------------------------------------+
| tokenize('I love Doris', '"parser"="english"') |
+------------------------------------------------+
| ["i", "love", "doris"]                         |
+------------------------------------------------+

-- ICU tokenization for multilingual text (Supported since 3.1.0)
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

-- Basic tokenization for high performance (Supported since 3.1.0)
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
## 使用例

HackerNewsから100万件のレコードを使用して、転置インデックスの作成、全文検索、および通常のクエリを実演します。これには、インデックスを使用しないクエリとの簡単なパフォーマンス比較が含まれます。

### テーブル作成

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
### データインポート

**Stream Loadによるデータインポート**

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
**SQL count() でデータインポートの成功を確認する**

```sql
SELECT count() FROM hackernews_1m;
+---------+
| count() |
+---------+
| 1000000 |
+---------+
```
### クエリ

**01 全文検索**

- `LIKE`を使用して`comment`列で'OLAP'を含む行をマッチして数える処理は0.18秒かかりました。

  ```sql
  SELECT count() FROM hackernews_1m WHERE comment LIKE '%OLAP%';
  +---------+
  | count() |
  +---------+
  |      34 |
  +---------+
  ```
- `comment`列で'OLAP'を含む行をカウントするために転置インデックスに基づく`MATCH_ANY`を使用したフルテキスト検索は0.02秒かかり、9倍の高速化を実現しました。より大きなデータセットでは、パフォーマンスの向上はさらに大幅になるでしょう。

  結果数の違いは、転置インデックスが小文字への変換などのプロセスによって用語を正規化するため、`MATCH_ANY`が`LIKE`よりも多くの結果を返すことによるものです。

  ```sql
  SELECT count() FROM hackernews_1m WHERE comment MATCH_ANY 'OLAP';
  +---------+
  | count() |
  +---------+
  |      35 |
  +---------+
  ```
- 同様に、'OLTP'の出現回数をカウントするパフォーマンスを比較すると、0.07秒対0.01秒でした。キャッシュにより、`LIKE`と`MATCH_ANY`の両方が改善されましたが、転置インデックスは依然として7倍の高速化を提供しました。

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
- 'OLAP'と'OLTP'の両方が出現する行のカウントは0.13秒対0.01秒で、13倍の高速化を実現しました。

  複数の用語が同時に出現することを要求する（AND関係）には、`MATCH_ALL 'keyword1 keyword2 ...'`を使用してください。

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
- 'OLAP'または'OLTP'のいずれかが含まれる行をカウントする処理は0.12秒から0.01秒になり、12倍の高速化を実現しました。

複数の用語のうち1つ以上が含まれることを要求する（OR関係）には、`MATCH_ANY 'keyword1 keyword2 ...'`を使用してください。

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
### 02 標準等価性および範囲クエリ

- `DateTime`型カラムでの範囲クエリ

  ```sql
  SELECT count() FROM hackernews_1m WHERE timestamp > '2007-08-23 04:17:00';
  +---------+
  | count() |
  +---------+
  |  999081 |
  +---------+
  ```
- `timestamp`列の転置インデックスの追加

  ```sql
  -- For date-time types, USING INVERTED does not require specifying a parser
  -- CREATE INDEX is one syntax for creating an index, another method will be shown later
  CREATE INDEX idx_timestamp ON hackernews_1m(timestamp) USING INVERTED;
  ```
  ```sql
  BUILD INDEX idx_timestamp ON hackernews_1m;
  ```
- インデックス作成の進行状況を確認します。`FinishTime`と`CreateTime`の差から、`timestamp`列の100万行に対する転置インデックスの構築にわずか1秒しかかからなかったことがわかります。

  ```sql
  SHOW ALTER TABLE COLUMN;
  +-------+---------------+-------------------------+-------------------------+---------------+---------+---------------+---------------+---------------+----------+------+----------+---------+
  | JobId | TableName     | CreateTime              | FinishTime              | IndexName     | IndexId | OriginIndexId | SchemaVersion | TransactionId | State    | Msg  | Progress | Timeout |
  +-------+---------------+-------------------------+-------------------------+---------------+---------+---------------+---------------+---------------+----------+------+----------+---------+
  | 10030 | hackernews_1m | 2023-02-10 19:44:12.929 | 2023-02-10 19:44:13.938 | hackernews_1m | 10031   | 10008         | 1:1994690496  | 3             | FINISHED |      | NULL     | 2592000 |
  +-------+---------------+-------------------------+-------------------------+---------------+---------+---------------+---------------+---------------+----------+------+----------+---------+
  ```
  ```sql
  -- If the table has no partitions, PartitionName defaults to TableName
  SHOW BUILD INDEX;
  +-------+---------------+---------------+----------------------------------------------------------+-------------------------+-------------------------+---------------+----------+------+----------+
  | JobId | TableName     | PartitionName | AlterInvertedIndexes                                     | CreateTime              | FinishTime              | TransactionId | State    | Msg  | Progress |
  +-------+---------------+---------------+----------------------------------------------------------+-------------------------+-------------------------+---------------+----------+------+----------+
  | 10191 | hackernews_1m | hackernews_1m | [ADD INDEX idx_timestamp (`timestamp`) USING INVERTED],  | 2023-06-26 15:32:33.894 | 2023-06-26 15:32:34.847 | 3             | FINISHED |      | NULL     |
  +-------+---------------+---------------+----------------------------------------------------------+-------------------------+-------------------------+---------------+----------+------+----------+
  ```
- インデックスが作成された後、範囲クエリは同じクエリ構文を使用します。Dorisは最適化のためにインデックスを自動的に認識します。ただし、データセットが小さいため、パフォーマンスの差は顕著ではありません。

  ```sql
  SELECT count() FROM hackernews_1m WHERE timestamp > '2007-08-23 04:17:00';
  +---------+
  | count() |
  +---------+
  |  999081 |
  +---------+
  ```
- 等価マッチクエリを使用して、数値列`parent`で同様の操作を実行する。

  ```sql
  SELECT count() FROM hackernews_1m WHERE parent = 11189;
  +---------+
  | count() |
  +---------+
  |       2 |
  +---------+

  -- For numeric types, USING INVERTED does not require specifying a parser
  -- ALTER TABLE t ADD INDEX is the second syntax for creating an index
  ALTER TABLE hackernews_1m ADD INDEX idx_parent(parent) USING INVERTED;


  -- Execute BUILD INDEX to create the inverted index for existing data
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
- トークン化なしで文字列カラム`author`の転置インデックスを作成します。等価クエリもインデックスを活用して高速化できます。

  ```sql
  SELECT count() FROM hackernews_1m WHERE author = 'faster';
  +---------+
  | count() |
  +---------+
  |      20 |
  +---------+

  
  -- Here, USING INVERTED is used without tokenizing the `author` column, treating it as a single term
  ALTER TABLE hackernews_1m ADD INDEX idx_author(author) USING INVERTED;

  
  -- Execute BUILD INDEX to add the inverted index for existing data
  BUILD INDEX idx_author ON hackernews_1m;

  
Creating an incremental index for 1 million author records took only 1.5 seconds.

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

-- After creating the index, string equality matches also showed significant acceleration.

```sql
hackernews_1mテーブルからauthorが'faster'であるレコードの件数を取得するSELECT count()クエリです。
+---------+
| count() |
+---------+
|      20 |
+---------+

```
