---
{
  "title": "リリース 4.0.0",
  "language": "ja",
  "description": "Apache Doris 4の正式リリースを発表できることを嬉しく思います。"
}
---
# Apache Doris 4.0: 分析、全文検索、ベクトル検索のための統合エンジン

**Apache Doris 4.0**の正式リリースを発表できることを嬉しく思います。これは4つの主要な領域の改善に焦点を当てた重要なマイルストーンリリースです：1) 新しいAI機能である**ベクトル検索**と**AI関数**、2) より強力な**全文検索**、3) ETL/ELT処理の向上、4) TopN遅延マテリアライゼーションとSQLキャッシュによるパフォーマンス最適化。

**Apache** **Doris 4.0の主要なハイライト:**

1. **ベクトル検索、** **AI** **関数、ハイブリッド検索によるAI対応:** 
   1. **ベクトル検索:** Doris 4.0では**ベクトルインデックス**を導入してベクトル検索をサポートします。これにより、ユーザーは外部のベクトルデータベースを必要とせずに、Apache Doris内で直接ベクトル検索と通常のSQL分析の両方を実行できます。
   2. **AI** **関数:** これらの関数により、データアナリストは情報抽出、感情分析、テキスト要約などのタスクのために、Doris内でSQL経由で直接大規模言語モデルを呼び出すことができます。グルーコードが少なくなり、パイプラインがよりクリーンになります。
   3. **ハイブリッド検索・分析処理 (HSAP):** Doris 4.0はベクトル検索、全文検索、構造化分析を1つのエンジンに統合します。この統一されたアプローチにより、精密なキーワード検索、セマンティックマッチング、複雑な分析クエリが、外部システムやデータの重複なしに、単一のSQLワークフロー内でシームレスに実行できます。
2. **より優れた全文検索**: 全く新しいSEARCH()関数により、Elasticsearch Query Stringに類似した軽量なDSL構文を提供し、より高速で柔軟かつ使いやすいテキスト検索を実現します。
3. **より強力な** **ETL/ELT**: Doris 4.0では重い ETL/ELT処理とマルチテーブル マテリアライズドビューを改善するため、新しい**Spill Disk**機能を導入します。この機能はメモリ制限を超えた際に中間データを自動的にディスクに書き込み、大規模ETLタスクのより高い安定性と耐障害性を確保します。
4. **パフォーマンス最適化:** Doris 4.0はTopN遅延マテリアライゼーションとSQLキャッシュの改善により、大幅なパフォーマンス向上を実現します。TopNクエリは特定のワイドテーブルシナリオにおいて数十倍高速に実行されるようになりました。また、デフォルトで有効になったSQLキャッシュも改善し、SQL解析効率の100倍改善を達成しました。

このリリースは**200名を超えるコミュニティメンバー**によるチームの成果であり、**9,000を超える改善と修正が提出されました**。このマイルストーンバージョンのテスト、レビュー、改良を支援していただいた全ての方々に感謝いたします。

- **GitHub**: https://github.com/apache/doris/releases
- **Doris 4.0のダウンロード**: https://doris.apache.org/download

## 1. AI機能: ベクトル検索とAI関数

### A. ベクトル検索のためのベクトルインデックス

Doris 4.0では**ベクトルインデックス**を導入してベクトル検索を改善します。4.0により、ユーザーはDorisのネイティブSQL分析と併用してベクトルインデックスを使用し、Doris内で構造化クエリとベクトル類似度検索の両方を実行できるようになりました。これにより、**セマンティック検索、スマートレコメンデーション、画像検索**などのAIワークロードのためのはるかにシンプルなアーキテクチャをユーザーに提供します。

#### ベクトルインデックス検索関数

- `l2_distance_approximate()`: HNSWインデックスを使用してユークリッド距離(L2)に基づく類似度計算を近似します。値が小さいほど類似度が高くなります。
- `inner_product_approximate()`: HNSWインデックスを使用して内積に基づく類似度計算を近似します。値が大きいほど類似度が高くなります。

#### 例

```SQL
-- 1) create table
CREATE TABLE doc_store (
  id BIGINT,
  title STRING,
  tags ARRAY<STRING>,
  embedding ARRAY<FLOAT> NOT NULL,
  INDEX idx_vec (embedding) USING ANN PROPERTIES (
      "index_type"  = "hnsw",
      "metric_type" = "l2_distance",
      "dim"         = "768",
      "quantizer"   = "flat" -- options：flat / sq8 / sq4
  ),
  INDEX idx_title (title) USING INVERTED PROPERTIES ("parser" = "english")
)
DUPLICATE KEY(id)
DISTRIBUTED BY HASH(id) BUCKETS 16
PROPERTIES("replication_num"="1");

-- 2) TopN 
SELECT id, l2_distance_approximate(embedding, [...]) AS dist
FROM doc_store
ORDER BY dist ASC
LIMIT 10;

-- 3) hybrid search : filter first and then topn
SELECT id, title,
       l2_distance_approximate(embedding, [...]) AS dist
FROM doc_store
WHERE title MATCH_ANY 'music'                -- filter using full text index
  AND array_contains(tags, 'recommendation') -- filter using structured filter
ORDER BY dist ASC
LIMIT 5;

-- 4) range query
SELECT COUNT(*)
FROM doc_store
WHERE l2_distance_approximate(embedding, [...]) <= 0.35;
```
**パラメータ**

- `index_type`: 必須。現在は`hnsw`（Hierarchical Navigable Small Worlds）をサポートしています。
- `metric_type`: 必須。オプションは`l2_distance`（ユークリッド距離）または`inner_product`です。
- `dim`: 必須。インポートされるベクトルの次元と厳密に一致する必要がある正の整数。
- `max_degree`: オプション。デフォルト値は32です。HNSWグラフ内のノードの出次数（HNSWアルゴリズムのパラメータ`M`）を制御します。
- `ef_construction`: オプション。デフォルト値は40です。インデックス構築フェーズ中の候補キューの長さ（HNSWアルゴリズムのパラメータ`efConstruction`）を指定します。
- `quant`: オプション。オプションは`flat`（デフォルト）、`sq8`（8ビットスカラー量子化）、または`sq4`（4ビットスカラー量子化）です。量子化により、メモリ使用量が大幅に削減されます：SQ8インデックスのサイズはFLATインデックスの約1/3であり、わずかな再現率の損失を代償に、より高いストレージ容量とより低いコストを実現します。

**注意事項**

- デフォルトでは、Dorisは「プリフィルタリング」メカニズムを使用します：まず正確に位置を特定できるインデックス（例：転置インデックス）を使用して述語フィルタリングを適用し、その後、残りのデータセットでANN TopN（近似最近傍）検索を実行します。これにより、結果の解釈可能性と再現率の安定性が保証されます。
- SQLクエリに二次インデックスによって正確に位置を特定できない述語が含まれている場合（例：id列に転置インデックスなどの二次インデックスが存在しないROUND(id) > 100）、システムはプリフィルタリングのセマンティクスと正確性を保持するため、正確な総当たり検索にフォールバックします。
- ベクトル列は`ARRAY<FLOAT> NOT NULL`型である必要があり、インポートされるベクトルの次元はインデックスの`dim`パラメータと一致する必要があります。
- 現在、ANN検索は**Duplicate Key**テーブルモデルのみをサポートしています。

### B. AI関数

Doris 4.0では、一連のAI関数も導入されました。

データアナリストは、AI関数を使用して、外部ツールを必要とせず、シンプルなSQLクエリで大規模言語モデルを直接呼び出すことができます。重要な情報の抽出、レビューでの感情分類、簡潔なテキスト要約の生成など、すべてのLLMとのやり取りがApache Doris内でシームレスに実行できるようになりました。

- **AI_CLASSIFY:** テキスト内容と最も高い一致度を持つ単一のラベル文字列を（与えられたラベルセットから）抽出します。
- **AI_EXTRACT:** テキスト内容に基づいて、指定された各ラベルに関連する情報を抽出します。
- **AI_FILTER**: テキスト内容の正確性を判定し、`bool`値（true/false）を返します。
- **AI_FIXGRAMMAR:** テキストの文法およびスペルエラーを修正します。
- **AI_GENERATE:** 入力パラメータに基づいてコンテンツを生成します。
- **AI_MASK:** 指定されたラベルに従って元のテキスト内の機密情報を`[MASKED]`で置き換えます（データ非機密化のため）。
- **AI_SENTIMENT:** テキストの感情傾向を分析し、次のいずれかの値を返します：`positive`、`negative`、`neutral`、または`mixed`。
- **AI_SIMILARITY:** 2つのテキスト間の意味的類似性を評価し、0から10の間の浮動小数点数を返します（値が高いほど意味的類似性が高いことを示します）。
- **AI_SUMMARIZE:** テキストの簡潔な要約を生成します。
- **AI_TRANSLATE:** テキストを指定された言語に翻訳します。
- **AI_AGG:** 複数のテキストエントリに対して行間集約分析を実行します。

現在、以下のLLMをサポートしています：Local（ローカル展開）、OpenAI、Anthropic、Gemini、DeepSeek、MoonShot、MiniMax、Zhipu、Qwen、Baichuan。

#### AI関数の使用例

模擬的な求人選考シナリオでAI_FILTER関数を使用する例をご覧ください。

まず、採用のための候補者の履歴書と求人要件のテーブルを模擬しました：

```SQL
CREATE TABLE candidate_profiles (
    candidate_id INT,
    name         VARCHAR(50),
    self_intro   VARCHAR(500)
)
DUPLICATE KEY(candidate_id)
DISTRIBUTED BY HASH(candidate_id) BUCKETS 1
PROPERTIES (
    "replication_num" = "1"
);

CREATE TABLE job_requirements (
    job_id   INT,
    title    VARCHAR(100),
    jd_text  VARCHAR(500)
)
DUPLICATE KEY(job_id)
DISTRIBUTED BY HASH(job_id) BUCKETS 1
PROPERTIES (
    "replication_num" = "1"
);

INSERT INTO candidate_profiles VALUES
(1, 'Alice', 'I am a senior backend engineer with 7 years of experience in Java, Spring Cloud and high-concurrency systems.'),
(2, 'Bob',   'Frontend developer focusing on React, TypeScript and performance optimization for e-commerce sites.'),
(3, 'Cathy', 'Data scientist specializing in NLP, large language models and recommendation systems.');

INSERT INTO job_requirements VALUES
(101, 'Backend Engineer', 'Looking for a senior backend engineer with deep Java expertise and experience designing distributed systems.'),
(102, 'ML Engineer',      'Seeking a data scientist or ML engineer familiar with NLP and large language models.');
```
AI_FILTERを使用して、求人要件と候補者のプロフィール間でセマンティックマッチングを実行し、適切な候補者をフィルタリングできます：

```SQL
SELECT
    c.candidate_id, c.name,
    j.job_id, j.title
FROM candidate_profiles AS c
JOIN job_requirements AS j
WHERE AI_FILTER(CONCAT('Does the following candidate self-introduction match the job description?', 
                'Job: ', j.jd_text, ' Candidate: ', c.self_intro));
+--------------+-------+--------+------------------+
| candidate_id | name  | job_id | title            |
+--------------+-------+--------+------------------+
|            3 | Cathy |    102 | ML Engineer      |
|            1 | Alice |    101 | Backend Engineer |
+--------------+-------+--------+------------------+
```
## 2. より良い全文検索

企業の多様な検索ニーズに応えるため、Doris 4.0は全文検索機能を大幅に改善し、より正確で柔軟な全文検索体験を提供し、ハイブリッド検索シナリオのサポートも向上させました。

### A. 新しいSEARCH()関数：全文検索のための統一された軽量DSL

#### ハイライト

- **1つの関数で全文検索を処理:** Doris 4.0は複雑なテキスト検索演算子を統一された`SEARCH()`関数に統合し、Elasticsearch Query Stringに密接に準拠した構文により、SQL連結の複雑さと移行コストを大幅に削減します。
- **複数条件のインデックスプッシュダウン:** 複雑な検索条件は転置インデックスに直接プッシュダウンされて実行され、「一度解析して一度連結する」という繰り返しのオーバーヘッドを回避し、パフォーマンスを大幅に向上させます。

#### 現在のバージョンでサポートされる構文機能

- Term Query: `field:value`
- ANY / ALL複数値マッチング: `field:ANY(v1 v2 ...)` / `field:ALL(v1 v2 ...)`
- Boolean組み合わせ: `AND` / `OR` / `NOT` とブラケットグループ化
- マルチフィールド検索: 単一の`search()`関数内で複数のフィールドに対してboolean組み合わせを実行

#### 将来のバージョンでサポート予定の構文機能（継続的な反復を通じて）

- フレーズ
- プレフィックス
- ワイルドカード
- 正規表現
- 範囲
- リスト

#### 例

```SQL
-- Term Queries
SELECT * FROM docs WHERE search('title:apache');

-- ANY: Matches any one of the specified values
SELECT * FROM docs WHERE search('tags:ANY(java python golang)');

-- ALL: Requires all specified values to be present simultaneously
SELECT * FROM docs WHERE search('tags:ALL(machine learning)');

-- Boolean logic with multiple fields
SELECT * FROM docs
WHERE search('(title:Doris OR content:database) AND NOT category:archived');

-- Combined with structured filtering (structured conditions do not affect scoring)
SELECT * FROM docs
WHERE search('title:apache') AND publish_date >= '2025-01-01';
```
### B. テキスト検索スコアリング

ハイブリッド検索シナリオをより適切にサポートするため、Doris 4.0では業界をリードするBM25関連性スコアリングアルゴリズムを従来のTF-IDFアルゴリズムの代替として導入しています。BM25は文書の長さに基づいて用語頻度の重みを動的に調整し、特にログ解析や文書検索などの長文テキストおよび複数フィールド検索シナリオにおいて、結果の関連性と検索精度を大幅に向上させます。

例:

```SQL
SELECT *, score() as score 
FROM search_demo 
WHERE content MATCH_ANY 'search query' 
ORDER BY score DESC 
LIMIT 10;
```
#### 機能と制限

**サポートされるインデックスタイプ**

- Tokenized Index: 事前定義されたトークナイザーとカスタムトークナイザーをサポート。
- Non-Tokenized Index: トークン化を行わないインデックス（全文インデックス）。

**サポートされるテキスト検索演算子**

- MATCH_ANY
- MATCH_ALL
- MATCH_PHRASE
- MATCH_PHRASE_PREFIX
- SEARCH

**注意事項**

- スコア範囲: BM25スコアには固定の上限または下限がありません。スコアの絶対値よりも相対的な大きさの方が意味があります。
- 空のクエリ: クエリ用語がデータセットに存在しない場合、0のスコアが返されます。
- ドキュメント長の影響: より短いドキュメントは、クエリ用語を含む場合、通常より高いスコアを受け取ります。
- クエリ用語の数: 複数用語のクエリの場合、総スコアは個々の用語のスコアの組み合わせ（合計）です。

### C. Better Inverted Index Tokenization

Doris 3.1で基本的なトークン化機能を導入しました。これらの機能は4.0でさらに改善され、様々なシナリオにおける多様なトークン化とテキスト検索のニーズを満たすようになりました。

1. #### 新しい組み込みトークナイザー

- **ICU (International Components for Unicode) Tokenizer**

適用シナリオ: 複雑な文字体系を持つ国際化されたテキスト、特に多言語混在ドキュメントに適しています。

例:

```SQL
SELECT TOKENIZE('مرحبا بالعالم Hello 世界', '"parser"="icu"');
-- Result: ["مرحبا", "بالعالم", "Hello", "世界"]

SELECT TOKENIZE('มนไมเปนไปตามความตองการ', '"parser"="icu"');
-- Result: ["มน", "ไมเปน", "ไป", "ตาม", "ความ", "ตองการ"]
```
- **Basic Tokenizer**

適用シナリオ：シンプルなシナリオまたは極めて高いパフォーマンスが必要なシナリオ。ログ処理シナリオにおいてUnicodeトークナイザーの代替として使用可能。

例：

```SQL
-- English Text Tokenization
SELECT TOKENIZE('Hello World! This is a test.', '"parser"="basic"');
-- Result: ["hello", "world", "this", "is", "a", "test"]

-- Chinese Text Tokenization
SELECT TOKENIZE('你好世界', '"parser"="basic"');
-- Result: ["你", "好", "世", "界"]

-- Mixed-Language Tokenization
SELECT TOKENIZE('Hello你好World世界', '"parser"="basic"');
-- Result: ["hello", "你", "好", "world", "世", "界"]

-- Supports Numbers and Special Characters
SELECT TOKENIZE('GET /images/hm_bg.jpg HTTP/1.0', '"parser"="basic"');
-- Result: ["get", "images", "hm", "bg", "jpg", "http", "1", "0"]

-- Handles Long Numeric Sequences
SELECT TOKENIZE('12345678901234567890', '"parser"="basic"');
-- Result: ["12345678901234567890"]
```
1. #### 新しいカスタムトークン化機能

- 柔軟なパイプライン: `char filter`、`tokenizer`、および複数の`token filters`の連鎖設定により、カスタムテキスト処理ワークフローを構築できます。
- 再利用可能なコンポーネント: 一般的に使用される`tokenizers`と`filters`を複数の`analyzers`間で共有でき、冗長な定義を減らし、メンテナンスコストを削減できます。
- ユーザーはDorisのカスタムトークン化機能を活用して、`char filters`、`tokenizers`、および`token filters`を柔軟に組み合わせることができます。これにより、異なるフィールドに適したカスタマイズされたトークン化ワークフローが可能になり、多様なシナリオでの個人化されたテキスト検索要件を満たします。

##### 使用例 1:

- `word_delimiter`タイプの`token filter`を作成し、Word Delimiter Filterを設定してドット（`.`）とアンダースコア（`_`）を区切り文字として設定します。
- `token filter` `complex_word_splitter`を参照するカスタムtokenizer `complex_identifier_analyzer`を作成します。

```SQL
-- 1. Create a custom token filter
CREATE INVERTED INDEX TOKEN_FILTER IF NOT EXISTS complex_word_splitter
PROPERTIES
(
    "type" = "word_delimiter",
    "type_table" = "[. => SUBWORD_DELIM], [_ => SUBWORD_DELIM]");

-- 2. Create a custom tokenizer
CREATE INVERTED INDEX ANALYZER IF NOT EXISTS complex_identifier_analyzer
PROPERTIES
(
    "tokenizer" = "standard",
    "token_filter" = "complex_word_splitter, lowercase"
);

SELECT TOKENIZE('apy217.39_202501260000026_526', '”analyzer“=” complex_identifier_analyzer“');
-- Result:[apy]，[217]，[39]，[202501260000026]，[526]

-- MATCH('apy217') or MATCH('202501260000026') can both work
```
##### 使用例2:

- `|`記号のみを区切り文字として使用する、`multi_value_tokenizer`という名前の`char_group`タイプの`tokenizer`を作成します。
- `tokenizer` `multi_value_tokenizer`を参照するカスタムtokenizer `multi_value_analyzer`を作成します。

```SQL
-- Create a char group tokenizer for multi-valued column splitting
CREATE INVERTED INDEX TOKENIZER IF NOT EXISTS multi_value_tokenizer
PROPERTIES
(
    "type" = "char_group",
    "tokenize_on_chars" = "[|]",
    "max_token_length" = "255"
);
-- Create a tokenizer for multi-valued columns
CREATE INVERTED INDEX ANALYZER IF NOT EXISTS multi_value_analyzer
PROPERTIES
(
    "tokenizer" = "multi_value_tokenizer",
    "token_filter" = "lowercase, asciifolding"
);

SELECT tokenize('alice|123456|company', '"analyzer"="multi_value_analyzer"');
-- Result: [alice]、[123456]、[company]

-- Both MATCH_ANY('alice') and MATCH_ANY('123456') can successfully match
```
1. ## より良いETL/ELT処理

Doris 4.0では、大規模なETL/ELTデータ処理の安定性と耐障害性を向上させる新しい**Spill Disk機能**を導入します。この機能により、計算タスクがメモリ閾値を超えた場合に、中間データの一部が自動的にディスクに書き込まれ、メモリ不足によるタスク失敗を防ぎます。

現在、spill-to-diskは以下のオペレーターでサポートされています：

- Hash Joinオペレーター
- Aggregationオペレーター
- Sortオペレーター
- CTEオペレーター

### BE設定項目

```JavaScript
spill_storage_root_path=/mnt/disk1/spilltest/doris/be/storage;/mnt/disk2/doris-spill;/mnt/disk3/doris-spill
spill_storage_limit=100%
```
- **spill_storage_root_path:** ディスクにスピルされた中間結果ファイルのストレージパス。デフォルトでは、`storage_root_path`と同じです。
- **spill_storage_limit:** スピルされたファイルのディスク容量制限。特定のサイズ（例：100G、1T）またはパーセンテージで設定可能で、デフォルト値は20%です。`spill_storage_root_path`が専用ディスクに設定されている場合、このパラメータは100%に設定できます。主な目的は、スピルされたファイルが過度のディスク容量を占有して通常のデータストレージを妨げることを防ぐことです。

### FE Session Variable

```JavaScript
set enable_spill=true;
set exec_mem_limit = 10g;
set query_timeout = 3600;
```
- **enable_spill:** クエリがディスクにデータをスピルするかどうかを決定します。デフォルトでは無効になっています。有効にすると、クエリは自動的に中間データをディスクにスピルして、メモリ不足による失敗を防ぎます。
- **exec_mem_limit:** 単一のクエリが使用できる最大メモリサイズを指定します。
- **query_timeout:** ディスクへのスピルが有効になっている場合、クエリの実行時間が大幅に増加する可能性があるため、このパラメータを適切に調整する必要があります。

### スピル実行状態の監視

ディスクへのスピルが発生すると、ユーザーは複数の方法でその実行状態を監視できます：

**監査ログ**

FE監査ログに2つのフィールド：`SpillWriteBytesToLocalStorage` と `SpillReadBytesFromLocalStorage` が追加されました。これらは、スピル中にディスクに書き込まれたデータの総量と、ディスクから読み取られたデータの総量をそれぞれ表します。

```Plain
SpillWriteBytesToLocalStorage=503412182|SpillReadBytesFromLocalStorage=503412182
```
**Query Profile**

クエリ実行中にディスクへのスピルがトリガーされた場合、スピル関連のメトリクスをマークし追跡するために、`Spill`で始まる複数のカウンターがQuery Profileに追加されます。HashJoinの"Build HashTable"ステップを例にとると、以下のカウンターが利用可能です：

```Bash
PARTITIONED_HASH_JOIN_SINK_OPERATOR  (id=4  ,  nereids_id=179):(ExecTime:  6sec351ms)
      -  Spilled:  true
      -  CloseTime:  528ns
      -  ExecTime:  6sec351ms
      -  InitTime:  5.751us
      -  InputRows:  6.001215M  (6001215)
      -  MemoryUsage:  0.00  
      -  MemoryUsagePeak:  554.42  MB
      -  MemoryUsageReserved:  1024.00  KB
      -  OpenTime:  2.267ms
      -  PendingFinishDependency:  0ns
      -  SpillBuildTime:  2sec437ms
      -  SpillInMemRow:  0
      -  SpillMaxRowsOfPartition:  68.569K  (68569)
      -  SpillMinRowsOfPartition:  67.455K  (67455)
      -  SpillPartitionShuffleTime:  836.302ms
      -  SpillPartitionTime:  131.839ms
      -  SpillTotalTime:  5sec563ms
      -  SpillWriteBlockBytes:  714.13  MB
      -  SpillWriteBlockCount:  1.344K  (1344)
      -  SpillWriteFileBytes:  244.40  MB
      -  SpillWriteFileTime:  350.754ms
      -  SpillWriteFileTotalCount:  32
      -  SpillWriteRows:  6.001215M  (6001215)
      -  SpillWriteSerializeBlockTime:  4sec378ms
      -  SpillWriteTaskCount:  417
      -  SpillWriteTaskWaitInQueueCount:  0
      -  SpillWriteTaskWaitInQueueTime:  8.731ms
      -  SpillWriteTime:  5sec549ms
```
**システムテーブル: backend_active_tasks**

テーブルに2つのフィールドを追加しました：`SPILL_WRITE_BYTES_TO_LOCAL_STORAGE`と`SPILL_READ_BYTES_FROM_LOCAL_STORAGE`。これらは、クエリ実行中の中間スピルデータについて、それぞれディスクに書き込まれたデータの総量とディスクから読み取られたデータの総量を表します。

クエリ結果の例:

```Bash
mysql [information_schema]>select * from backend_active_tasks;
+-------+------------+-------------------+-----------------------------------+--------------+------------------+-----------+------------+----------------------+---------------------------+--------------------+-------------------+------------+------------------------------------+-------------------------------------+
| BE_ID | FE_HOST    | WORKLOAD_GROUP_ID | QUERY_ID                          | TASK_TIME_MS | TASK_CPU_TIME_MS | SCAN_ROWS | SCAN_BYTES | BE_PEAK_MEMORY_BYTES | CURRENT_USED_MEMORY_BYTES | SHUFFLE_SEND_BYTES | SHUFFLE_SEND_ROWS | QUERY_TYPE | SPILL_WRITE_BYTES_TO_LOCAL_STORAGE | SPILL_READ_BYTES_FROM_LOCAL_STORAGE |
+-------+------------+-------------------+-----------------------------------+--------------+------------------+-----------+------------+----------------------+---------------------------+--------------------+-------------------+------------+------------------------------------+-------------------------------------+
| 10009 | 10.16.10.8 |                 1 | 6f08c74afbd44fff-9af951270933842d |        13612 |            11025 |  12002430 | 1960955904 |            733243057 |                  70113260 |                  0 |                 0 | SELECT     |                          508110119 |                            26383070 |
| 10009 | 10.16.10.8 |                 1 | 871d643b87bf447b-865eb799403bec96 |            0 |                0 |         0 |          0 |                    0 |                         0 |                  0 |                 0 | SELECT     |                                  0 |                                   0 |
+-------+------------+-------------------+-----------------------------------+--------------+------------------+-----------+------------+----------------------+---------------------------+--------------------+-------------------+------------+------------------------------------+-------------------------------------+
2 rows in set (0.00 sec)
```
### テスト

Spill Disk機能の安定性を検証するため、TPC-DS 10TB標準データセットを使用してテストを実施しました。テスト環境は、AWS上の3台のBEサーバー（各16コアCPU、64GBメモリ）で構成され、BEメモリ対データサイズ比は1:52となりました。

テスト結果では、総実行時間は28102.386秒で、TPC-DSベンチマークの99クエリすべてが正常に完了し、Spill Disk機能の安定性が検証されました。

Spill Disk機能の詳細については、ドキュメントをご参照ください：https://doris.apache.org/docs/dev/admin-manual/workload-management/spill-disk

1. ## データ品質保証：End-to-End

データの精度は、健全なビジネス判断の基盤です。この基盤を強化するため、Doris 4.0では関数動作の包括的なレビューと標準化を導入し、**end-to-endの検証メカニズム**を確立しています：データ取り込みから分析計算まで。これにより、すべての処理結果の**精度と信頼性**を確保し、企業の意思決定に堅固なデータバックボーンを提供します。

> 注意：これらのデータ品質の改善により、以前のバージョンから動作が変更される可能性があります。アップグレード前にドキュメントを十分にご確認ください。

### CAST関数

`CAST`はSQLで最も論理的に複雑な関数の一つで、その中核機能は異なるデータ型の変換です。このプロセスでは、多数の詳細な形式ルールやエッジケースの処理だけでなく、型セマンティクスの正確なマッピングも必要となります。これらすべてが、実際の使用において`CAST`をエラーの発生しやすいプロセスの一部にしています。

特にデータインポートシナリオでは、これは本質的に外部文字列を内部データベース型に変換する`CAST`プロセスです。したがって、`CAST`の動作はインポートロジックの精度と安定性を直接決定します。

また、多くのデータベースがAIシステムによって操作されるようになることを予見しており、これらのシステムはデータベース動作の明確な定義を必要とします。そのため、BNF（バッカス・ナウア記法）を導入しました。BNFを通じて動作を定義することで、開発者やAI Agentに明確な運用ガイドラインを提供することを目指しています。

例えば、`DATE`型に対する`CAST`操作だけでも、BNFを通じて数十の形式組み合わせシナリオをカバーしています（参照：https://doris.apache.org/docs/dev/sql-manual/basic-element/sql-data-types/conversion/datetime-conversion）。テストフェーズでは、これらのルールに基づいて数百万のテストケースを導出し、結果の正確性を確保しました。

```XML
<datetime>       ::= <date> (("T" | " ") <time> <whitespace>* <offset>?)?
                   | <digit>{14} <fraction>? <whitespace>* <offset>?

––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––

<date>           ::= <year> ("-" | "/") <month1> ("-" | "/") <day1>
                   | <year> <month2> <day2>

<year>           ::= <digit>{2} | <digit>{4} ; Till 1970
<month1>         ::= <digit>{1,2}            ; 01–12
<day1>           ::= <digit>{1,2}            ; 01–28/29/30/31 

<month2>         ::= <digit>{2}              ; 01–12
<day2>           ::= <digit>{2}              ; 01–28/29/30/31 

––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––

<time>           ::= <hour1> (":" <minute1> (":" <second1> <fraction>?)?)?
                   | <hour2> (<minute2> (<second2> <fraction>?)?)?

<hour1>           ::= <digit>{1,2}      ; 00–23
<minute1>         ::= <digit>{1,2}      ; 00–59
<second1>         ::= <digit>{1,2}      ; 00–59

<hour2>           ::= <digit>{2}        ; 00–23
<minute2>         ::= <digit>{2}        ; 00–59
<second2>         ::= <digit>{2}        ; 00–59

<fraction>        ::= "." <digit>*

––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––

<offset>         ::= ( "+" | "-" ) <hour-offset> [ ":"? <minute-offset> ]
                   | <special-tz>
                   | <long-tz>

<hour-offset>    ::= <digit>{1,2}      ; 0–14
<minute-offset>  ::= <digit>{2}        ; 00/30/45

<special-tz>     ::= "CST" | "UTC" | "GMT" | "ZULU" | "Z"   ; 
<long-tz>        ::= ( ^<whitespace> )+                     ; e.g. America/New_York

––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––

<digit>          ::= "0" | "1" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9"

<area>           ::= <alpha>+
<location>       ::= (<alpha> | "_")+
<alpha>          ::= "A" | … | "Z" | "a" | … | "z"
<whitespace>     ::= " " | "\t" | "\n" | "\r" | "\v" | "\f"
```
### Strict Mode、Non-Strict Mode、およびTRY_CAST

Doris 4.0では、CAST操作に3つのメカニズムを追加しました：Strict Mode、Non-Strict Mode（`enable_strict_cast`セッション変数で制御）、および`TRY_CAST`関数です。これらのメカニズムにより、Dorisはデータ型変換をより適切に処理できるようになります。

**Strict Mode**

システムは、事前定義されたBNF（Backus-Naur Form）構文規則に従って、入力データの形式、型、および値の範囲について厳密な検証を実行します。データが規則を満たさない場合（例：「数値型」が必要なフィールドに文字列が渡される、または日付が「YYYY-MM-DD」標準に準拠していない）、システムはデータ処理ワークフローを直接終了し、明確なエラー（具体的な非準拠フィールドと理由を含む）をスローします。これにより、無効なデータがストレージまたは計算プロセスに入ることを防ぎます。

この「ゼロトレランス」検証ロジックは、PostgreSQLの厳密なデータ検証動作と高度に一致しています。これはソースからのデータ精度と一貫性を保証し、データ信頼性に対する要件が極めて高いシナリオで不可欠です：金融業界での取引照合、財務での請求書会計、政府システムでの情報登録など。これらのシナリオでの無効なデータ（例：負の取引金額、不正な請求書日付形式）は、財務損失、コンプライアンスリスク、またはビジネスプロセスの中断につながる可能性があります。

**Non-Strict Mode**

システムはBNF規則に対してもデータを検証しますが、「フォルトトレラント」処理ロジックを採用します：データが非準拠の場合、ワークフローは終了されず、エラーもスローされません。代わりに、無効なデータは自動的に`NULL`値に変換され、その後SQLが実行を継続します（例：文字列「xyz」を数値`NULL`に変換）。これにより、SQLタスクが正常に完了し、ビジネスプロセスの継続性と実行効率を優先します。

このモードは「データ整合性要件は低いが、SQL実行成功率が重要」なシナリオにより適しています：ログデータ処理、ユーザー行動データクリーニング、アドホックデータ分析など。これらのシナリオでは、データ量が膨大でデータソースが複雑です（例：APPログは、デバイス異常により文字化けした形式のフィールドを含む可能性があります）。少量の無効なデータによってSQL全体が中断されると、処理効率が大幅に低下します。一方、少数の`NULL`値は全体的な分析結果への影響は最小限です（例：アクティブユーザーまたはクリックスルー率の統計）。

**TRY_CAST関数**

`enable_strict_cast`パラメータは、ステートメントレベルですべてのCAST操作の動作を制御します。しかし、単一のSQLに複数のCAST関数が含まれるシナリオが発生する可能性があります：一部にはStrict Mode、他にはNon-Strict Modeが必要です。これに対処するため、`TRY_CAST`関数が導入されました。

`TRY_CAST`関数は式を指定されたデータ型に変換します。変換が成功すると、変換された値を返します。失敗すると、`NULL`を返します。その構文は`TRY_CAST(source_expr AS target_type)`です。ここで`source_expr`は変換される式、`target_type`はターゲットデータ型です。

例：

- `TRY_CAST('123' AS INT)`は`123`を返します
- `TRY_CAST('abc' AS INT)`は`NULL`を返します

`TRY_CAST`関数は、型変換に対してより柔軟なアプローチを提供します。厳密な変換成功が必要でないシナリオでは、この関数を使用して変換失敗によるエラーを回避できます。

### 浮動小数点数の計算

Dorisは2つの浮動小数点データ型をサポートしています：`FLOAT`と`DOUBLE`です。しかし、`INF`（無限大）と`NAN`（非数値）の不確実な動作は、歴史的に`ORDER BY`や`GROUP BY`などの操作で潜在的なエラーを引き起こしていました。Doris 4.0では、これらの値の動作を標準化し、明確に定義しました。

**算術演算**

Doris浮動小数点数は、加算、減算、乗算、除算を含む一般的な算術演算をサポートします。

Dorisが浮動小数点ゼロ除算を処理する際、IEEE 754標準に完全には準拠していないことをお伝えします。代わりに、DorisはPostgreSQLの実装を参考にしています：ゼロ除算の場合、特別な値（例：INF）は生成されません。代わりに、返される結果は`SQL NULL`です。

| 式                      | PostgreSQL | IEEE 754  | Doris    |
| ----------------------- | ---------- | --------- | -------- |
| 1.0 / 0.0               | Error      | Infinity  | NULL     |
| 0.0 / 0.0               | Error      | NaN       | NULL     |
| -1.0 / 0.0              | Error      | -Infinity | NULL     |
| 'Infinity' / 'Infinity' | NaN        | NaN       | NaN      |
| 1.0 / 'Infinity'        | 0          | 0         | 0        |
| 'Infinity' - 'Infinity' | NaN        | NaN       | NaN      |
| 'Infinity' - 1.0        | Infinity   | Infinity  | Infinity |

**比較演算**

IEEE標準で定義される浮動小数点比較には、典型的な整数比較との重要な違いがあります。例：

- 負のゼロと正のゼロは等しいと見なされます
- 任意のNaN（非数値）値は、自身を含む他の値と等しくありません
- すべての有限浮動小数点数は+∞より厳密に小さく、-∞より厳密に大きいです

結果の一貫性と予測可能性を保証するため、DorisはIEEE標準とは異なる方法でNaNを処理します。Dorisでは：

- NaNは他のすべての値（Infinityを含む）より大きいと見なされます
- NaNはNaNと等しいです

例

```SQL
mysql> select * from sort_float order by d;
+------+-----------+
| id   | d         |
+------+-----------+
|    5 | -Infinity |
|    2 |      -123 |
|    1 |       123 |
|    4 |  Infinity |
|    8 |       NaN |
|    9 |       NaN |
+------+-----------+

mysql> select 
    cast('Nan' as double) = cast('Nan' as double) , 
    cast('Nan' as double) > cast('Inf' as double) , 
    cast('Nan' as double) > cast('123456.789' as double);
+-----------------------------------------------+-----------------------------------------------+------------------------------------------------------+
| cast('Nan' as double) = cast('Nan' as double) | cast('Nan' as double) > cast('Inf' as double) | cast('Nan' as double) > cast('123456.789' as double) |
+-----------------------------------------------+-----------------------------------------------+------------------------------------------------------+
|                                             1 |                                             1 |                                                    1 |
+-----------------------------------------------+-----------------------------------------------+------------------------------------------------------+
```
### Date Functions

この最適化は、日付関数とタイムゾーンサポートという2つの主要領域に焦点を当て、データ処理の精度と適用性をさらに向上させています：

**統一された日付オーバーフロー動作**

オーバーフローシナリオ（例：0000-01-01より前の日付や9999-12-31より後の日付）における多数の日付関数の動作が標準化されました。以前は、異なる関数がオーバーフローを一貫性なく処理していましたが、現在は、すべての関連する関数が日付オーバーフローがトリガーされた際に統一してエラーを返し、異常な結果による データ計算の偏差を防ぎます。

**拡張された日付関数サポート**

一部の日付型関数のパラメータシグネチャが`int32`から`int64`にアップグレードされました。この調整により、元の`int32`タイプの日付範囲制限が解除され、関連する関数がより広い範囲にわたる日付計算をサポートできるようになります。

**改善されたタイムゾーンサポートドキュメント**

Dorisの実際のタイムゾーン管理ロジック（ドキュメント：https://doris.apache.org/docs/dev/admin-manual/cluster-management/time-zone）に基づいて、タイムゾーンサポートコンテンツが更新され、明確化されました。これには、2つのコアパラメータ（`system_time_zone`と`time_zone`）の役割と変更方法の詳細な説明、および日付関数（例：`FROM_UNIXTIME`、`UNIX_TIMESTAMP`）やデータインポート変換に対するタイムゾーンの具体的な影響が含まれます。これにより、ユーザーにタイムゾーン機能の設定と使用に関するより明確なガイダンスを提供します。

**まとめ**

真にAIエージェントフレンドリーなデータベースエコシステムを構築し、大規模モデルがDorisをより正確かつ深く理解できるよう支援するため、DorisのSQL Referenceを体系的に改善しました。これには、データ型定義、関数定義、データ変換ルールなどのコアコンテンツの改良が含まれ、AIとデータベース間の協力的な相互作用のための明確で信頼性の高い技術基盤を築いています。

この取り組みは、洞察力とエネルギーによってプロジェクトに重要な推進力をもたらしたコミュニティ貢献者の素晴らしいサポートによって実現されました。より多くのコミュニティメンバーの参加を心から歓迎します：イノベーションの境界を押し広げ、エコシステムを強化し、すべての人にとってより大きな価値を創造するために共に取り組みましょう。

## 5. Performance Optimization

### TopN

クエリパターン`SELECT * FROM tableX ORDER BY columnA ASC/DESC LIMIT N`は典型的なTopNクエリで、ログ解析、ベクトル検索、データ探索などの高頻度シナリオで広く使用されています。このようなクエリはフィルタリング条件を含まないため、従来の実行方法では大規模データセットを扱う際にフルテーブルスキャンとソートが必要となります。これは過度の不要なデータ読み取りと深刻な読み取り増幅問題を引き起こします。特に高並行リクエストや大規模データストレージシナリオでは、これらのクエリの性能ボトルネックがより顕著になり、最適化の緊急な必要性を生み出しています。

![img](/images/4.0.0-release.png)

この問題点に対処するため、「Lazy Materialization」最適化メカニズムを導入し、TopNクエリを効率的な実行のための2つのフェーズに分割しました：

1. 第1フェーズ：ソート列（`columnA`）とデータ位置特定に使用される主キー/行識別子のみを読み取ります。ソートによって`LIMIT N`条件を満たす対象行を迅速にフィルタリングします。
2. 第2フェーズ：行識別子に基づいて対象行のすべての列データを正確に読み取ります。

Doris 4.0では、この機能をさらに拡張しました：

- 複数テーブル結合におけるTopN lazy materializationのサポート。
- 外部テーブルクエリにおけるTopN lazy materializationのサポート。

これらの2つの新しいシナリオにおいて、このソリューションは不要な列読み取り量を大幅に削減し、読み取り増幅を根本的に軽減します。小さい`LIMIT`値を持つワイドテーブルシナリオでは、TopNクエリの実行効率も数十倍向上しました。

### SQL Cache

SQL CacheはDorisの以前のバージョンで提供されていた機能でしたが、多くの条件によって使用が制限され、デフォルトで無効化されていました。このバージョンでは、SQL Cache結果の正確性に影響を与える可能性のある問題を体系的に解決しました：

- catalog、データベース、テーブル、または列のクエリ権限の変更
- Session変数の変更
- 定数畳み込みルールによって簡略化できない非決定的関数の存在

SQL Cache結果の正確性を確保した後、この機能は現在デフォルトで有効化されています。

また、クエリオプティマイザーのSQL解析性能を大幅に最適化し、SQL解析効率の100倍の改善を達成しました。

例えば、次のSQLを考えてみます。ここで`big_view`はネストしたビューを含む大きなビューで、合計163個の結合と17個の和集合を持ちます：

```SQL
SELECT *, now() as etl_time from big_view;
```
このクエリのSQL解析時間は400msから2msに短縮されました。この最適化はSQL Cacheに利点をもたらすだけでなく、高同時実行クエリシナリオにおけるDorisのパフォーマンスも大幅に改善します。

### JSONパフォーマンス最適化

JSONは半構造化データの標準的なストレージフォーマットです。Doris 4.0では、JSONBもアップグレードしました：

**Decimal型のサポートを追加**

これにより、JSONのNumber型とDoris内部型の間のマッピングシステムが補完されます（以前はInt8/Int16/Int32/Int64/Int128/Float/Doubleをカバー）。高精度数値シナリオにおけるストレージと処理のニーズをさらに満たし、大きなデータや高精度データの型適応問題によってJSON変換で精度損失が発生することを回避します。これはVARIANTデータ型の派生にも役立ちます。

**JSONB関連関数の体系的なパフォーマンス最適化**

Doris 4.0では、JSONB関連関数（例：`json_extract`シリーズ、`json_exists_path`、`json_type`）に対して全面的なパフォーマンス改善を実施しました。最適化後、これらの関数の実行効率は30%以上向上し、JSONフィールド抽出、型判定、パス検証などの高頻度操作の処理速度が大幅に加速されました。これにより、半構造化データの効率的な分析により強力なサポートを提供します。

関連機能の詳細情報については、Dorisの公式ドキュメントを参照してください：https://doris.apache.org/docs/dev/sql-manual/basic-element/sql-data-types/semi-structured/JSON

## 6. よりユーザーフレンドリーなリソース管理

Doris 4.0では`workload group`の使用メカニズムも最適化されました：

- CPUとメモリのソフトリミットとハードリミットの定義方法を統一しました。様々な設定項目を通じてソフト/ハードリミット機能を個別に有効にする必要がなくなりました。
- 同一の`workload group`でソフトリミットとハードリミットの両方の使用をサポートします。

この最適化により、パラメータ設定プロセスが簡素化されるだけでなく、`workload group`の柔軟性も向上し、より多様なリソース管理ニーズを満たします。

### CPUリソース設定

`MIN_CPU_PERCENT`と`MAX_CPU_PERCENT`は、CPU競合が発生した際のWorkload Group内のすべてのリクエストに対する最小および最大保証CPUリソースを定義します：

- MAX_CPU_PERCENT（最大CPU割合）：グループのCPU帯域幅の上限です。現在のCPU使用状況に関係なく、Workload GroupのCPU使用率はこの値を超えることはありません。
- MIN_CPU_PERCENT（最小CPU割合）：グループの予約CPU帯域幅です。競合時、他のグループはこの部分の帯域幅を使用できませんが、リソースがアイドル状態の場合、グループは`MIN_CPU_PERCENT`を超える帯域幅を使用できます。

例：ある会社の営業部門とマーケティング部門が同じDorisインスタンスを共有しているとします。営業部門のワークロードはCPU集約的で高優先度のクエリを含み、マーケティング部門のワークロードもCPU集約的ですが低優先度のクエリです。各部門に個別のWorkload Groupを作成することで：

- 営業Workload Groupに40%の`MIN_CPU_PERCENT`を割り当てます。
- マーケティングWorkload Groupに30%の`MAX_CPU_PERCENT`を割り当てます。

この設定により、営業ワークロードが必要なCPUリソースを確保しながら、マーケティングワークロードが営業部門のCPUニーズに影響を与えることを防げます。

### メモリリソース設定

`MIN_MEMORY_PERCENT`と`MAX_MEMORY_PERCENT`は、Workload Groupが使用できる最小および最大メモリを表します：

- MAX_MEMORY_PERCENT：グループ内でリクエストが実行される際、メモリ使用量は総メモリのこの割合を超えることはありません。超過した場合、クエリはディスクへのスピリングをトリガーするか、終了（kill）されます。
- MIN_MEMORY_PERCENT：グループの最小予約メモリです。リソースがアイドル状態の場合、グループは`MIN_MEMORY_PERCENT`を超えるメモリを使用できますが、メモリが不足している場合、システムは`MIN_MEMORY_PERCENT`に基づいてメモリを割り当てます。グループのメモリ使用量を`MIN_MEMORY_PERCENT`まで減らすために一部のクエリをkillし、他のWorkload Groupが十分なメモリを持てるようにします。

### Spill Diskとの統合

Doris 4.0では、Workload Groupのメモリ管理機能をSpill Disk機能と統合しました。ユーザーは個別のクエリにメモリサイズを設定してスピリングを制御するだけでなく、Workload Groupのスロットメカニズムを通じて動的スピリングも実装できます。Workload Groupに対して以下のポリシーが実装されています：

- none（デフォルト）：ポリシーを無効にします。クエリは可能な限りメモリを使用しますが、Workload Groupのメモリ制限に達すると、スピリングがトリガーされます（クエリサイズに基づく選択はありません）。
- fixed：クエリあたりの利用可能メモリ = `workload groupのmem_limit * query_slot_count / max_concurrency`。このポリシーは同時実行性に基づいて各クエリに固定メモリを割り当てます。
- dynamic：クエリあたりの利用可能メモリ = `workload groupのmem_limit * query_slot_count / sum(running query slots)`。これは主に`fixed`モードでの未使用スロットに対処し、基本的に大きなクエリを最初にスピリングをトリガーします。

`fixed`と`dynamic`の両方がクエリにハードリミットを設定します：制限を超えるとスピリングまたはkillがトリガーされ、ユーザーが設定した静的メモリ割り当てパラメータを上書きします。したがって、`slot_memory_policy`を設定する際は、Workload Groupの`max_concurrency`を適切に設定して、メモリ不足を回避してください。

## まとめ

Apache Doris 4.0は新しいAIサポート（ベクトル検索、AI Functions）とより優れた全文検索機能により大きな進歩を遂げています。これらのアップグレードにより、ユーザーはAIとエージェントの時代で先行でき、企業は従来のBI分析からAI駆動のワークロードまですべてを処理できるようになります。

リアルタイムダッシュボードやユーザー行動分析の強化から、ドキュメント検索や大規模オフラインデータ処理のサポートまで、Doris 4.0は技術、金融、Web3、小売、ヘルスケアなど様々な業界で、より高速で信頼性が高く、AI対応の分析体験を提供します。

Apache Dorisの最新版はダウンロード可能です。詳細なリリースノートとアップグレードガイドについては[doris.apache.org](https://doris.apache.org/)にアクセスし、Dorisコミュニティに参加して探索、テスト、フィードバックの共有を行ってください。

## 謝辞

このバージョンの研究開発、テスト、要件フィードバックに参加したすべての貢献者に改めて心から感謝いたします：

Pxl, walter, Gabriel, Mingyu Chen (Rayner), Mryange, morrySnow, zhangdong, lihangyu, zhangstar333, hui lai, Calvin Kirs, deardeng, Dongyang Li, Kaijie Chen, Xinyi Zou, minghong, meiyi, James / Jibing-Li, seawinde, abmdocrt, Yongqiang YANG, Sun Chenyang, wangbo, starocean999, Socrates / 苏小刚，Gavin Chou, 924060929, HappenLee, yiguolei, daidai, Lei Zhang, zhengyu, zy-kkk, zclllyybb /zclllhhjj, bobhan1, amory, zhiqiang, Jerry Hu, Xin Liao, Siyang Tang, LiBinfeng, Tiewei Fang, Luwei, huanghaibin, Qi Chen, TengJianPing, 谢健，Lightman, zhannngchen, koarz, xy720, kkop, HHoflittlefish777, xzj7019, Ashin Gau, lw112, plat1ko, shuke, yagagagaga, shee, zgxme, qiye, zfr95, slothever, Xujian Duan, Yulei-Yang, Jack, Kang, Lijia Liu, linrrarity, Petrichor, Thearas, Uniqueyou, dwdwqfwe, Refrain, catpineapple, smiletan, wudi, caiconghui, camby, zhangyuan, jakevin, Chester, Mingxi, Rijesh Kunhi Parambattu, admiring_xm, zxealous, XLPE, chunping, sparrow, xueweizhang, Adonis Ling, Jiwen liu, KassieZ, Liu Zhenlong, MoanasDaddyXu, Peyz, 神技圈子，133tosakarin, FreeOnePlus, Ryan19929, Yixuan Wang, htyoung, smallx, Butao Zhang, Ceng, GentleCold, GoGoWen, HonestManXin, Liqf, Luzhijing, Shuo Wang, Wen Zhenghu, Xr Ling, Zhiguo Wu, Zijie Lu, feifeifeimoon, heguanhui, toms, wudongliang, yangshijie, yongjinhou, yulihua, zhangm365, Amos Bird, AndersZ, Ganlin Zhao, Jeffrey, John Zhang, M1saka, SWEI, XueYuhai, Yao-MR, York Cao, caoliang-web, echo-dundun, huanghg1994, lide, lzy, nivane, nsivarajan, py023, vlt, wlong, zhaorongsheng, AlexYue, Arjun Anandkumar, Arnout Engelen, Benjaminwei, DayuanX, DogDu, DuRipeng, Emmanuel Ferdman, Fangyuan Deng, Guangdong Liu, HB, He xueyu, Hongkun Xu, Hu Yanjun, JinYang, KeeProMise, Muhammet Sakarya, Nya~, On-Work-Song, Shane, Stalary, StarryVerse, TsukiokaKogane, Udit Chaudhary, Xin Li, XnY-wei, Xu Chen, XuJianxu, XuPengfei, Yijia Su, ZhenchaoXu, cat-with-cat, elon-X, gnehil, hongyu guo, ivin, jw-sun, koi, liuzhenwei, msridhar78, noixcn, nsn_huang, peterylh, shouchengShen, spaces-x, wangchuang, wangjing, wangqt, wubiao, xuchenhao, xyf, yanmingfu, yi wang, z404289981, zjj, zzwwhh, İsmail Tosun, 赵硕
