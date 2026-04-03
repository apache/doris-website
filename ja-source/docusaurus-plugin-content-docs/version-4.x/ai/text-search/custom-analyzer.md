---
{
  "title": "カスタムアナライザー",
  "description": "カスタムアナライザーを使用することで、文字フィルター、トークナイザー、",
  "language": "ja"
}
---
## 概要

カスタムアナライザーを使用することで、文字フィルター、トークナイザー、トークンフィルターを特定のニーズに応じて組み合わせることにより、組み込みトークナイザーの制限を克服できます。これにより、テキストが検索可能な用語にセグメント化される方法が細かく調整され、検索関連性とデータ分析の精度が直接決定されます。これは検索体験とデータ価値を向上させるための基盤となる重要な要素です。

![Custom Analyzer 概要](/images/analyzer.png)

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
`char_replace`はトークン化前に指定された文字を置換します。
- パラメータ
  - `char_filter_pattern`: 置換する文字
  - `char_filter_replacement`: 置換文字（デフォルト: スペース）

#### 2. tokenizerの作成

```sql
CREATE INVERTED INDEX TOKENIZER IF NOT EXISTS x_tokenizer
PROPERTIES (
  "type" = "standard"
);
```
利用可能なトークナイザー：
- **standard**: Unicode テキストセグメンテーションに従った文法ベースのトークン化
- **ngram**: 指定された長さのN-gramを生成
- **edge_ngram**: 単語の開始位置にアンカーされたN-gramを生成
- **keyword**: 入力全体を単一のタームとして出力するno-opトークナイザー
- **char_group**: 指定された文字でトークン化
- **basic**: 英語、数字、中国語、Unicodeに対応したシンプルなトークナイザー
- **icu**: すべての言語をサポートする国際テキストセグメンテーション
- **pinyin**: 中国語テキスト検索のための中国語ピンイン変換トークナイザー
  - `keep_first_letter`: 有効にすると、各中国語文字の最初の文字のみを保持します。例：`刘德华`は`ldh`になります。デフォルト: true
  - `keep_separate_first_letter`: 有効にすると、各中国語文字の最初の文字を個別に保持します。例：`刘德华`は`l`,`d`,`h`になります。デフォルト: false。注意：これはタームフリークエンシーにより、クエリのファジネスを増加させる可能性があります
  - `limit_first_letter_length`: 最初の文字の結果の最大長を設定します。デフォルト: 16
  - `keep_full_pinyin`: 有効にすると、各中国語文字の完全なピンインを保持します。例：`刘德华`は[`liu`,`de`,`hua`]になります。デフォルト: true
  - `keep_joined_full_pinyin`: 有効にすると、各中国語文字の完全なピンインを結合します。例：`刘德华`は[`liudehua`]になります。デフォルト: false
  - `keep_none_chinese`: 結果に中国語以外の文字や数字を保持します。デフォルト: true
  - `keep_none_chinese_together`: 中国語以外の文字をまとめて保持します。デフォルト: true。例：`DJ音乐家`は`DJ`,`yin`,`yue`,`jia`になります。falseに設定すると、`DJ音乐家`は`D`,`J`,`yin`,`yue`,`jia`になります。注意：`keep_none_chinese`を最初に有効にする必要があります
  - `keep_none_chinese_in_first_letter`: 最初の文字に中国語以外の文字を保持します。例：`刘德华AT2016`は`ldhat2016`になります。デフォルト: true
  - `keep_none_chinese_in_joined_full_pinyin`: 結合された完全なピンインに中国語以外の文字を保持します。例：`刘德华2016`は`liudehua2016`になります。デフォルト: false
  - `none_chinese_pinyin_tokenize`: 中国語以外の文字がピンインである場合、それらを別々のピンインタームに分解します。デフォルト: true。例：`liudehuaalibaba13zhuanghan`は`liu`,`de`,`hua`,`a`,`li`,`ba`,`ba`,`13`,`zhuang`,`han`になります。注意：`keep_none_chinese`と`keep_none_chinese_together`を最初に有効にする必要があります
  - `keep_original`: 有効にすると、元の入力も保持します。デフォルト: false
  - `lowercase`: 中国語以外の文字を小文字にします。デフォルト: true
  - `trim_whitespace`: デフォルト: true
  - `remove_duplicated_term`: 有効にすると、インデックス容量を節約するために重複するタームを削除します。例：`de的`は`de`になります。デフォルト: false。注意：位置関連のクエリに影響する可能性があります
  - `ignore_pinyin_offset`: このパラメーターは現在機能がありません。デフォルト: true

#### 3. token_filterの作成

```sql
CREATE INVERTED INDEX TOKEN_FILTER IF NOT EXISTS x_token_filter
PROPERTIES (
  "type" = "word_delimiter"
);
```
利用可能なトークンフィルター：
- **word_delimiter**: 英数字以外の文字でトークンを分割します
- **ascii_folding**: 非ASCII文字をASCII相当文字に変換します
- **lowercase**: トークンを小文字に変換します
- **pinyin**: トークン化後に中国語文字をpinyinに変換します。パラメータの詳細については、上記の**pinyin**トークナイザーを参照してください。

#### 4. アナライザーの作成

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
## Table作成でのカスタムアナライザーの使用

カスタムアナライザーは、インデックスプロパティの`analyzer`パラメータを使用して指定します：

```sql
CREATE TABLE tbl (
    `a` bigint NOT NULL AUTO_INCREMENT(1),
    `ch` text NULL,
    INDEX idx_ch (`ch`) USING INVERTED PROPERTIES("analyzer" = "x_custom_analyzer", "support_phrase" = "true")
)
table_properties;
```
## 使用制限

1. tokenizerとtoken_filterの`type`とパラメータは、サポートされたリストからのものでなければならず、そうでなければTable作成が失敗します
2. analyzerは、それを使用しているTableがない場合にのみ削除できます
3. tokenizerとtoken_filterは、それらを使用しているanalyzerがない場合にのみ削除できます
4. カスタムanalyzer構文を作成した後、データロードが正常に動作する前にBEへの同期に10秒かかります

## 注意事項

1. カスタムanalyzerで複数のコンポーネントをネストすると、トークン化のパフォーマンスが低下する可能性があります
2. `tokenize`関数はカスタムanalyzerをサポートします
3. 事前定義されたトークン化は`built_in_analyzer`を使用し、カスタムトークン化は`analyzer`を使用します - 一つのみが存在できます

## 完全な例

### 例1：電話番号のトークン化

電話番号のトークン化にedge_ngramを使用：

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
### Example 2: 細粒度のTokenization

詳細なtokenizationのためにstandard + word_delimiterを使用する場合：

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
### Example 3: 複数のToken Filterを使用したKeyword

複数のtoken filterでkeywordを使用して元の用語を保持する：

```sql
CREATE INVERTED INDEX ANALYZER IF NOT EXISTS keyword_lowercase
PROPERTIES
(
"tokenizer" = "keyword",
"token_filter" = "asciifolding, lowercase"
);
```
### Example 4: 中国語ピンイン検索

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
#### Pinyin Filter の使用

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
