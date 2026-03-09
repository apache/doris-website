---
{
  "title": "カスタムアナライザー",
  "language": "ja",
  "description": "カスタムアナライザーを使用することで、character filter、tokenizer を組み合わせて、組み込みtokenizerの制限を克服できます。"
}
---
## 概要

カスタムアナライザーは、特定のニーズに応じて文字フィルター、トークナイザー、およびトークンフィルターを組み合わせることで、組み込みトークナイザーの制限を克服することを可能にします。これにより、テキストが検索可能な用語にどのように分割されるかを細かく調整し、検索の関連性とデータ分析の精度を直接決定します。これは検索体験とデータ価値を向上させるための基盤となる重要な要素です。

![Custom Analyzer Overview](/images/analyzer.png)

## カスタムアナライザーの使用

### コンポーネントの作成

#### 1. char_filterの作成

```sql
CREATE INVERTED INDEX CHAR_FILTER IF NOT EXISTS x_char_filter
PROPERTIES (
  "type" = "char_replace"
  -- configure pattern/replacement parameters as needed
);
```
`char_replace`はトークン化の前に指定された文字を置換します。
- パラメータ
  - `char_filter_pattern`: 置換する文字
  - `char_filter_replacement`: 置換文字（デフォルト: スペース）
`icu_normalizer`: ICU正規化を使用してテキストを前処理します。
- パラメータ
  - `name`: 正規化形式（デフォルト `nfkc_cf`）。オプション: `nfc`、`nfkc`、`nfkc_cf`、`nfd`、`nfkd`
  - `mode`: 正規化モード（デフォルト `compose`）。オプション: `compose`、`decompose`
  - `unicode_set_filter`: 正規化する文字セットを指定（例：`[a-z]`）

#### 2. トークナイザーの作成

```sql
CREATE INVERTED INDEX TOKENIZER IF NOT EXISTS x_tokenizer
PROPERTIES (
  "type" = "standard"
);
```
利用可能なtokenizer:
- **standard**: Unicode テキストセグメンテーションに従った文法ベースのトークン化
- **ngram**: 指定された長さのN-gramを生成
- **edge_ngram**: 単語の開始位置を基準としたN-gramを生成
- **keyword**: 入力全体を単一のタームとして出力するno-opトークナイザー
- **char_group**: 指定された文字でトークン化
- **basic**: シンプルな英語、数字、中国語、Unicodeトークナイザー
- **icu**: すべての言語をサポートする国際的なテキストセグメンテーション
- **pinyin**: 中国語テキスト検索用の中国語pinyin変換トークナイザー（4.0.2からサポート、フレーズクエリはまだサポートされていません）
  - `keep_first_letter`: 有効にすると、各中国語文字の最初の文字のみを保持します。例：`刘德华`は`ldh`になります。デフォルト: true
  - `keep_separate_first_letter`: 有効にすると、各中国語文字の最初の文字を個別に保持します。例：`刘德华`は`l`,`d`,`h`になります。デフォルト: false。注意：タームの頻度によりクエリの曖昧性が増加する可能性があります
  - `limit_first_letter_length`: 最初の文字結果の最大長を設定します。デフォルト: 16
  - `keep_full_pinyin`: 有効にすると、各中国語文字の完全なpinyinを保持します。例：`刘德华`は[`liu`,`de`,`hua`]になります。デフォルト: true
  - `keep_joined_full_pinyin`: 有効にすると、各中国語文字の完全なpinyinを結合します。例：`刘德华`は[`liudehua`]になります。デフォルト: false
  - `keep_none_chinese`: 結果に中国語以外の文字や数字を保持します。デフォルト: true
  - `keep_none_chinese_together`: 中国語以外の文字をまとめて保持します。デフォルト: true。例：`DJ音乐家`は`DJ`,`yin`,`yue`,`jia`になります。falseに設定すると、`DJ音乐家`は`D`,`J`,`yin`,`yue`,`jia`になります。注意：最初に`keep_none_chinese`を有効にする必要があります
  - `keep_none_chinese_in_first_letter`: 最初の文字に中国語以外の文字を保持します。例：`刘德华AT2016`は`ldhat2016`になります。デフォルト: true
  - `keep_none_chinese_in_joined_full_pinyin`: 結合した完全なpinyinに中国語以外の文字を保持します。例：`刘德华2016`は`liudehua2016`になります。デフォルト: false
  - `none_chinese_pinyin_tokenize`: 中国語以外の文字がpinyinの場合、それらを個別のpinyinタームに分割します。デフォルト: true。例：`liudehuaalibaba13zhuanghan`は`liu`,`de`,`hua`,`a`,`li`,`ba`,`ba`,`13`,`zhuang`,`han`になります。注意：最初に`keep_none_chinese`と`keep_none_chinese_together`を有効にする必要があります
  - `keep_original`: 有効にすると、元の入力も保持します。デフォルト: false
  - `lowercase`: 中国語以外の文字を小文字化します。デフォルト: true
  - `trim_whitespace`: デフォルト: true
  - `remove_duplicated_term`: 有効にすると、重複するタームを削除してインデックス容量を節約します。例：`de的`は`de`になります。デフォルト: false。注意：位置関連のクエリが影響を受ける可能性があります
  - `ignore_pinyin_offset`: このパラメータは現在機能がありません。デフォルト: true

#### 3. token_filterの作成

```sql
CREATE INVERTED INDEX TOKEN_FILTER IF NOT EXISTS x_token_filter
PROPERTIES (
  "type" = "word_delimiter"
);
```
利用可能なtoken filter:
- **word_delimiter**: 英数字以外の文字でトークンを分割します
- **ascii_folding**: 非ASCII文字をASCII相当文字に変換します
- **lowercase**: トークンを小文字に変換します
- **pinyin**: トークン化後に中国語文字をpinyinに変換します。パラメータの詳細については、上記の**pinyin** tokenizerを参照してください。
- **icu_normalizer**: ICU正規化を使用してトークンを処理します。
  - `name`: 正規化形式（デフォルト `nfkc_cf`）。オプション: `nfc`, `nfkc`, `nfkc_cf`, `nfd`, `nfkd`
  - `unicode_set_filter`: 正規化する文字セットを指定します

#### 4. analyzerの作成

```sql
CREATE INVERTED INDEX ANALYZER IF NOT EXISTS x_analyzer
PROPERTIES (
  "tokenizer" = "x_tokenizer",            -- single tokenizer
  "token_filter" = "x_filter1, x_filter2" -- one or more token_filters, in order
);
```
### コンポーネントの表示

```sql
SHOW INVERTED INDEX TOKENIZER;
SHOW INVERTED INDEX TOKEN_FILTER;
SHOW INVERTED INDEX ANALYZER;
```
### コンポーネントの削除

```sql
DROP INVERTED INDEX TOKENIZER IF EXISTS x_tokenizer;
DROP INVERTED INDEX TOKEN_FILTER IF EXISTS x_token_filter;
DROP INVERTED INDEX ANALYZER IF EXISTS x_analyzer;
```
## テーブル作成でのカスタムアナライザーの使用

カスタムアナライザーは、インデックスプロパティの`analyzer`パラメータを使用して指定されます：

```sql
CREATE TABLE tbl (
    `a` bigint NOT NULL AUTO_INCREMENT(1),
    `ch` text NULL,
    INDEX idx_ch (`ch`) USING INVERTED PROPERTIES("analyzer" = "x_custom_analyzer", "support_phrase" = "true")
)
table_properties;
```
## 使用制限

1. tokenizerとtoken_filterの`type`とパラメータは、サポートされているリストからのものでなければならず、そうでなければテーブル作成は失敗します
2. analyzerは、それを使用しているテーブルがない場合のみ削除できます
3. tokenizerとtoken_filterは、それらを使用しているanalyzerがない場合のみ削除できます
4. カスタムanalyzer構文を作成した後、データ読み込みが正常に動作するまでBEへの同期に10秒かかります

## 注意事項

1. カスタムanalyzerで複数のコンポーネントをネストすると、トークン化のパフォーマンスが低下する可能性があります
2. `tokenize`関数はカスタムanalyzerをサポートしています
3. 事前定義されたトークン化では`built_in_analyzer`を使用し、カスタムトークン化では`analyzer`を使用します - 一つのみ存在できます

## 完全な例

### 例1: 電話番号のトークン化

電話番号のトークン化にedge_ngramを使用:

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
```
### 例2: 細かい粒度のトークン化

詳細なトークン化のためのstandard + word_delimiterの使用:

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
```
### 例3: 複数のトークンフィルターを使用したキーワード

複数のトークンフィルターでkeywordを使用して元の用語を保持する場合:

```sql
CREATE INVERTED INDEX ANALYZER IF NOT EXISTS keyword_lowercase
PROPERTIES
(
"tokenizer" = "keyword",
"token_filter" = "asciifolding, lowercase"
);
```
### 例4: 中国語ピンイン検索

中国語の名前とテキスト検索にpinyinトークナイザーを使用 - 完全なピンイン、頭文字略語、および中国語と英語の混在テキストをサポートします。

#### Pinyinトークナイザーの使用

```sql
-- Create pinyin tokenizer with multiple output formats
CREATE INVERTED INDEX TOKENIZER IF NOT EXISTS pinyin_tokenizer
PROPERTIES (
    "type" = "pinyin",
    "keep_first_letter" = "true",
    "keep_full_pinyin" = "true",
    "keep_joined_full_pinyin" = "true",
    "keep_original" = "true",
    "keep_none_chinese" = "true",
    "lowercase" = "true",
    "remove_duplicated_term" = "true"
);

CREATE INVERTED INDEX ANALYZER IF NOT EXISTS pinyin_analyzer
PROPERTIES (
    "tokenizer" = "pinyin_tokenizer"
);

CREATE TABLE contacts (
    id BIGINT NOT NULL AUTO_INCREMENT(1),
    name TEXT NULL,
    INDEX idx_name (name) USING INVERTED PROPERTIES("analyzer" = "pinyin_analyzer", "support_phrase" = "true")
) ENGINE=OLAP
DUPLICATE KEY(id)
DISTRIBUTED BY RANDOM BUCKETS 1
PROPERTIES ("replication_allocation" = "tag.location.default: 1");

INSERT INTO contacts VALUES (1, "刘德华"), (2, "张学友"), (3, "郭富城");

SELECT * FROM contacts WHERE name MATCH '刘德华';
SELECT * FROM contacts WHERE name MATCH 'liudehua';
SELECT * FROM contacts WHERE name MATCH 'liu';
SELECT * FROM contacts WHERE name MATCH 'ldh';
```
#### Pinyinフィルターの使用

```sql
-- Create pinyin filter to apply after keyword tokenizer
CREATE INVERTED INDEX TOKEN_FILTER IF NOT EXISTS pinyin_filter
PROPERTIES (
    "type" = "pinyin",
    "keep_first_letter" = "true",
    "keep_full_pinyin" = "true",
    "keep_original" = "true",
    "lowercase" = "true"
);

CREATE INVERTED INDEX ANALYZER IF NOT EXISTS keyword_pinyin
PROPERTIES (
    "tokenizer" = "keyword",
    "token_filter" = "pinyin_filter"
);

CREATE TABLE stars (
    id BIGINT NOT NULL AUTO_INCREMENT(1),
    name TEXT NULL,
    INDEX idx_name (name) USING INVERTED PROPERTIES("analyzer" = "keyword_pinyin")
) ENGINE=OLAP
DUPLICATE KEY(id)
DISTRIBUTED BY RANDOM BUCKETS 1
PROPERTIES ("replication_allocation" = "tag.location.default: 1");

INSERT INTO stars VALUES (1, "刘德华"), (2, "张学友"), (3, "刘德华ABC");

-- Supports multiple search modes:
SELECT * FROM stars WHERE name MATCH '刘德华';
SELECT * FROM stars WHERE name MATCH 'liu';
SELECT * FROM stars WHERE name MATCH 'ldh';
SELECT * FROM stars WHERE name MATCH 'zxy';
```
## 単一カラムでの複数アナライザー

Dorisは、単一カラムに対して異なるアナライザーを持つ複数の転置インデックスの作成をサポートしています。これにより、同一データを異なるトークン化方法で検索できる柔軟な検索戦略が可能になります。

### 使用例

- **多言語サポート**: 同一テキストカラムに対して異なる言語用の異なるアナライザーを使用
- **検索精度 vs. 再現率**: 完全一致にはkeywordアナライザーを使用し、あいまい検索にはstandardアナライザーを使用
- **オートコンプリート**: 通常検索にはstandardアナライザーを維持しながら、前方一致にはedge_ngramアナライザーを使用

### 複数インデックスの作成

```sql
-- Create analyzers with different tokenization strategies
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

-- Create table with multiple indexes on same column
CREATE TABLE articles (
    id INT,
    content TEXT,
    -- Standard analyzer for tokenized search
    INDEX idx_content_std (content) USING INVERTED
        PROPERTIES("analyzer" = "std_analyzer", "support_phrase" = "true"),
    -- Keyword analyzer for exact match
    INDEX idx_content_kw (content) USING INVERTED
        PROPERTIES("analyzer" = "kw_analyzer"),
    -- Edge n-gram analyzer for autocomplete
    INDEX idx_content_ngram (content) USING INVERTED
        PROPERTIES("analyzer" = "ngram_analyzer")
) ENGINE=OLAP
DUPLICATE KEY(id)
DISTRIBUTED BY HASH(id) BUCKETS 1
PROPERTIES ("replication_allocation" = "tag.location.default: 1");
```
### 特定のAnalyzerでのクエリ

使用するインデックスを指定するには`USING ANALYZER`句を使用します：

```sql
-- Insert test data
INSERT INTO articles VALUES
    (1, 'hello world'),
    (2, 'hello'),
    (3, 'world'),
    (4, 'hello world test');

-- Tokenized search: matches rows containing 'hello' token
-- Returns: 1, 2, 4
SELECT id FROM articles WHERE content MATCH 'hello' USING ANALYZER std_analyzer ORDER BY id;

-- Exact match: only matches rows with exact 'hello' string
-- Returns: 2
SELECT id FROM articles WHERE content MATCH 'hello' USING ANALYZER kw_analyzer ORDER BY id;

-- Prefix match with edge n-gram
-- Returns: 1, 2, 4 (all rows starting with 'hel')
SELECT id FROM articles WHERE content MATCH 'hel' USING ANALYZER ngram_analyzer ORDER BY id;
```
### 既存テーブルへのIndexの追加

```sql
-- Add a new index with different analyzer
ALTER TABLE articles ADD INDEX idx_content_chinese (content)
USING INVERTED PROPERTIES("parser" = "chinese");

-- Wait for schema change to complete
SHOW ALTER TABLE COLUMN WHERE TableName='articles';
```
### インデックスの構築

インデックスを追加した後、既存のデータに対してインデックスを構築する必要があります：

```sql
-- Build specific index (non-cloud mode)
BUILD INDEX idx_content_chinese ON articles;

-- Build all indexes (cloud mode)
BUILD INDEX ON articles;

-- Check build progress
SHOW BUILD INDEX WHERE TableName='articles';
```
### 重要な注意事項

1. **アナライザーのアイデンティティ**: 同じtokenizerとtoken_filter設定を持つ2つのアナライザーは同一とみなされます。同じカラムに同一のアナライザーアイデンティティを持つ複数のインデックスを作成することはできません。

2. **インデックス選択動作**:
   - `USING ANALYZER`を使用する場合、指定されたアナライザーのインデックスが存在し構築されていれば、それが使用されます
   - 指定されたインデックスが構築されていない場合、クエリは非インデックスパスにフォールバックします（結果は正確ですが、パフォーマンスは低下します）
   - `USING ANALYZER`を使用しない場合、利用可能な任意のインデックスが使用される場合があります

3. **組み込みアナライザー**: 組み込みアナライザーを直接使用することもできます:

   ```sql
   -- Using built-in analyzers
   SELECT * FROM articles WHERE content MATCH 'hello' USING ANALYZER standard;
   SELECT * FROM articles WHERE content MATCH 'hello' USING ANALYZER none;
   SELECT * FROM articles WHERE content MATCH '你好' USING ANALYZER chinese;
   ```
4. **パフォーマンスに関する考慮事項**:
   - 追加のインデックスはそれぞれストレージ容量と書き込みオーバーヘッドを増加させます
   - 実際のクエリパターンに基づいてanalyzerを選択してください
   - クエリパターンが予測可能な場合は、より少ないインデックス数の使用を検討してください
