---
{
    "title": "カスタムアナライザー",
    "language": "ja",
    "description": "Dorisのカスタムアナライザーは、文字フィルター、トークナイザー、トークンフィルターを組み合わせ、テキストの分割方法を柔軟に制御することで、転置インデックスの検索関連性と精度を高めます。",
    "keywords": [
        "custom analyzer",
        "inverted index tokenizer",
        "tokenizer",
        "token_filter",
        "char_filter",
        "edge_ngram",
        "word_delimiter",
        "USING ANALYZER",
        "multi-analyzer index",
        "ik_smart",
        "ik_max_word",
        "max_ngram_diff"
    ]
}
---

<!-- Knowledge type: Feature overview + Configuration parameters + Operating procedures -->
<!-- Applicable scenarios: Inverted index text tokenization customization / Multilingual search / Auto-completion / Exact match -->

カスタムアナライザーは、**文字フィルター（char_filter）**、**トークナイザー**、**トークンフィルター（token_filter）**を組み合わせ、業務上の要件に応じてテキストを検索可能な語に分割する方法を細かく定義できます。組み込みアナライザーの制約を補い、検索の関連性とデータ分析の精度に直接影響します。

![カスタムアナライザーの図](/images/analyzer.png)

### 適用シナリオ {#applicable-scenarios}

| シナリオ | 推奨する組み合わせ |
| --- | --- |
| 多言語が混在するテキストの検索 | `icu`トークナイザー + `icu_normalizer`フィルター |
| 電話番号やコードの前方一致 | `edge_ngram`トークナイザー |
| 複雑な英語テキストの分割（キャメルケース、ハイフンなど） | `standard`トークナイザー + `word_delimiter`フィルター |
| オートコンプリートや入力候補 | `edge_ngram`トークナイザー + `lowercase`フィルター |
| 完全一致（元の語を保持） | `keyword`トークナイザー + `lowercase` / `asciifolding`フィルター |

---

## 基本コンポーネント {#core-components}

カスタムアナライザーは、元のテキストに順番に適用される以下の4種類のオブジェクトで構成されます。

```
Original text ──► [char_filter] ──► [tokenizer] ──► [token_filter] ──► Terms
```

| コンポーネント | 役割 | 個数 |
| --- | --- | --- |
| `char_filter` | トークン化前に文字を前処理する（置換や正規化など） | 0 ~ N |
| `tokenizer` | テキストを語に分割する | 1 |
| `token_filter` | 分割後の語を処理する（小文字化やASCIIへの変換など） | 0 ~ N |
| `analyzer` | 上記のコンポーネントを組み合わせ、完全なトークン化パイプラインを構成する | 1 |

---

## カスタムアナライザーの作成 {#creating-a-custom-analyzer}

### 1. 文字フィルター（char_filter） {#1-character-filter-char_filter}

```sql
CREATE INVERTED INDEX CHAR_FILTER IF NOT EXISTS x_char_filter
PROPERTIES (
    "type" = "char_replace"
    -- See below for other parameters
);
```

サポートされる文字フィルターの種類は次のとおりです。

- **`char_replace`**: トークン化前に、指定した文字を別の文字に置換します。
    - `char_filter_pattern`: 置換対象の文字のリスト
    - `char_filter_replacement`: 置換後の文字（デフォルト: スペース）

- **`icu_normalizer`**: ICUによる正規化を使ってテキストを前処理します。
    - `name`: 正規化形式（デフォルトは`nfkc_cf`）。選択肢: `nfc`、`nfkc`、`nfkc_cf`、`nfd`、`nfkd`
    - `mode`: 正規化モード（デフォルトは`compose`）。選択肢: `compose`、`decompose`
    - `unicode_set_filter`: 正規化する文字集合を指定します（`[a-z]`など）。

### 2. トークナイザー {#2-tokenizer}

```sql
CREATE INVERTED INDEX TOKENIZER IF NOT EXISTS x_tokenizer
PROPERTIES (
    "type" = "standard"
);
```

サポートされるトークナイザーの種類は次のとおりです。

| 種類 | 説明 | 主なパラメーター |
| --- | --- | --- |
| `standard` | Unicodeのテキスト分割規則に従う標準的なトークン化。多くの言語に適しています | なし |
| `ngram` | N-gramに分割します | `min_gram`、`max_gram`、`max_ngram_diff`、`token_chars` |
| `edge_ngram` | 単語の先頭から始まるN-gramを生成します | `min_gram`、`max_gram`、`token_chars` |
| `keyword` | テキスト全体を単一の語として出力します。多くの場合、token_filterと組み合わせます | なし |
| `char_group` | 指定した文字で分割します | `tokenize_on_chars` |
| `basic` | 英語、数字、中国語、Unicodeの簡易的なトークン化 | `extra_chars` |
| `icu` | ICUによる国際化対応のトークン化。複数言語の複雑な文字体系をサポートします | なし |
| `ik_smart` | 完全な単語を優先するIKの中国語トークン化。4.1.5以降、カスタムアナライザーで使用できます | なし |
| `ik_max_word` | 重複する可能性のある語をより多く生成する、IKの細粒度な中国語トークン化。4.1.5以降、カスタムアナライザーで使用できます | なし |

パラメーターの説明:

- `min_gram`: 最小長（デフォルトは1）
- `max_gram`: 最大長（デフォルトは2）
- `token_chars`: 保持する文字カテゴリ（デフォルトはすべて保持）。選択肢: `letter`、`digit`、`whitespace`、`punctuation`、`symbol`
- `tokenize_on_chars`: 文字のリストまたはカテゴリ。カテゴリには`whitespace`、`letter`、`digit`、`punctuation`、`symbol`、`cjk`を指定できます
- `extra_chars`: 分割に使用する追加のASCII文字（`[]().`など）

#### Ngramの長さの範囲に関する制限（4.1.5以降） {#ngram-range-limits-since-415}

4.1.5以降、`ngram`トークナイザーでは`max_ngram_diff`を指定することで、gramの最大長と最小長の差に関する従来の上限`1`を緩和できます。`mode`プロパティを指定しない通常の`ngram`トークナイザーを作成する際には、次の条件が検証されます。

| パラメーター | デフォルト | 制約 |
| --- | --- | --- |
| `min_gram` | `1` | `max_gram`以下の正の整数。新しい`ngram`トークナイザーでは最大`1024`。 |
| `max_gram` | `2` | `min_gram`以上の正の整数。新しい`ngram`トークナイザーでは最大`1024`。 |
| `max_ngram_diff` | `1` | `0`から`255`までの整数で、`max_gram - min_gram <= max_ngram_diff`を満たす必要があります。`0`を指定すると、固定長のN-gramだけが許可されます。 |

たとえば、`min_gram=1`と`max_gram=8`を指定する場合、`max_ngram_diff`は少なくとも`7`にする必要があります。省略すると、作成時に`The difference between max_gram and min_gram in NGram Tokenizer must be less than or equal to: [ 1 ] but was [7]`というエラーが発生します。使用方法全体については[例5](#example-5-expand-the-ngram-length-range-since-415)を参照してください。

これらの制限と`max_ngram_diff`は、`mode`プロパティを指定しない通常の`ngram`トークナイザーに適用されます。`mode`を指定したトークナイザーには別の検証が適用され、これらの制限は無視されます。`edge_ngram`はこのパラメーターを受け付けません。電話番号とオートコンプリートの例では、それぞれの`min_gram`と`max_gram`の設定を使用します。範囲を広げると、入力位置ごとに生成される語が増えます。不要なインデックスの肥大化を避けるため、検索要件に合わせて範囲を設定してください。

### 3. トークンフィルター {#3-token-filter}

```sql
CREATE INVERTED INDEX TOKEN_FILTER IF NOT EXISTS x_token_filter
PROPERTIES (
    "type" = "word_delimiter"
);
```

サポートされるトークンフィルターの種類は次のとおりです。

| 種類 | 役割 |
| --- | --- |
| `word_delimiter` | 英数字以外の文字で分割し、正規化も行えます |
| `ascii_folding` | 非ASCII文字を対応するASCII文字に変換します |
| `lowercase` | トークンのテキストを小文字に変換します |
| `icu_normalizer` | ICUによる正規化を使ってトークンを処理します |

#### word_delimiterの詳細 {#word_delimiter-details}

デフォルトの動作:

1. 英数字以外の文字を区切り文字として使用します（例: `Super-Duper`を`Super`、`Duper`に分割）。
2. トークンの先頭と末尾の区切り文字を削除します（例: `XL---42+'Autocoder'`を`XL`、`42`、`Autocoder`に分割）。
3. 大文字と小文字が切り替わる位置で分割します（例: `PowerShot`を`Power`、`Shot`に分割）。
4. 文字と数字の境界で分割します（例: `XL500`を`XL`、`500`に分割）。
5. 英語の所有格を表す`'s`を削除します（例: `Neil's`を`Neil`に変換）。

オプションのパラメーター:

| パラメーター | デフォルト | 説明 |
| --- | --- | --- |
| `generate_number_parts` | `true` | 数字部分を出力するかどうか |
| `generate_word_parts` | `true` | 単語部分を出力するかどうか |
| `protected_words` | なし | 分割しない保護対象の単語 |
| `split_on_case_change` | `true` | 大文字と小文字が切り替わる位置で分割するかどうか |
| `split_on_numerics` | `true` | 文字と数字の境界で分割するかどうか |
| `stem_english_possessive` | `true` | 英語の所有格を表す`'s`を削除するかどうか |
| `type_table` | なし | カスタムの文字種マッピングテーブル |

`type_table`は次のマッピング種別をサポートします。

- `ALPHA`（文字）
- `ALPHANUM`（英数字）
- `DIGIT`（数字）
- `LOWER`（小文字）
- `SUBWORD_DELIM`（英数字以外の区切り文字）
- `UPPER`（大文字）

例: `["+ => ALPHA", "- => ALPHA"]`を指定すると、`+`と`-`は文字として扱われ、分割位置には使用されません。

#### icu_normalizerのパラメーター {#icu_normalizer-parameters}

- `name`: 正規化形式（デフォルトは`nfkc_cf`）。選択肢: `nfc`、`nfkc`、`nfkc_cf`、`nfd`、`nfkd`
- `unicode_set_filter`: 正規化する文字集合を指定します

### 4. アナライザー {#4-analyzer}

上記のコンポーネントを組み合わせて、完全なトークン化パイプラインを構成します。

```sql
CREATE INVERTED INDEX ANALYZER IF NOT EXISTS x_analyzer
PROPERTIES (
    "tokenizer" = "x_tokenizer",            -- A single tokenizer
    "token_filter" = "x_filter1, x_filter2" -- One or more token_filters, executed in order
);
```

---

## テーブルでのカスタムアナライザーの使用 {#using-a-custom-analyzer-in-a-table}

作成したカスタムアナライザーは、インデックスの`PROPERTIES`にある`analyzer`フィールドで参照します。

```sql
CREATE TABLE tbl (
    `a` bigint NOT NULL AUTO_INCREMENT(1),
    `ch` text NULL,
    INDEX idx_ch (`ch`) USING INVERTED PROPERTIES("analyzer" = "x_custom_analyzer", "support_phrase" = "true")
)
table_properties;
```

注意事項:

1. カスタムアナライザーは、インデックスの`PROPERTIES`に`analyzer`で設定します。
2. `analyzer`と併用できるプロパティは`support_phrase`のみです。

---

## 単一カラムへの複数のアナライザーインデックス {#multiple-analyzer-indexes-on-a-single-column}

Dorisでは、同じカラムに異なるトークナイザーを使用する複数の転置インデックスを作成できます。これにより、同じデータを異なるトークン化方法で検索できます。

### ユースケース {#use-cases}

- **多言語対応**: 同じテキストカラムに、言語ごとのトークナイザーを使用します。
- **検索精度と再現率の両立**: 完全一致にはkeywordトークナイザー、あいまい検索にはstandardトークナイザーを使用します。
- **オートコンプリート**: 前方一致にはedge_ngramトークナイザー、通常の検索にはstandardトークナイザーを使用します。

### 複数のインデックスの作成 {#creating-multiple-indexes}

```sql
-- 1. Create tokenizers with different tokenization strategies
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

-- 2. Create multiple indexes on the same column
CREATE TABLE articles (
    id INT,
    content TEXT,
    -- Standard tokenizer for tokenized search
    INDEX idx_content_std (content) USING INVERTED
        PROPERTIES("analyzer" = "std_analyzer", "support_phrase" = "true"),
    -- Keyword tokenizer for exact matching
    INDEX idx_content_kw (content) USING INVERTED
        PROPERTIES("analyzer" = "kw_analyzer"),
    -- edge n-gram tokenizer for auto-completion
    INDEX idx_content_ngram (content) USING INVERTED
        PROPERTIES("analyzer" = "ngram_analyzer")
) ENGINE=OLAP
DUPLICATE KEY(id)
DISTRIBUTED BY HASH(id) BUCKETS 1
PROPERTIES ("replication_allocation" = "tag.location.default: 1");
```

### クエリ時のアナライザーの指定 {#specifying-an-analyzer-at-query-time}

`USING ANALYZER`句を使用して、使用するインデックスを指定します。

```sql
-- Insert test data
INSERT INTO articles VALUES
    (1, 'hello world'),
    (2, 'hello'),
    (3, 'world'),
    (4, 'hello world test');

-- Tokenized search: matches rows containing the term 'hello'
-- Returns: 1, 2, 4
SELECT id FROM articles WHERE content MATCH 'hello' USING ANALYZER std_analyzer ORDER BY id;

-- Exact match: matches only the exact 'hello' string
-- Returns: 2
SELECT id FROM articles WHERE content MATCH 'hello' USING ANALYZER kw_analyzer ORDER BY id;

-- Use edge n-gram for prefix matching
-- Returns: 1, 2, 4 (all rows starting with 'hel')
SELECT id FROM articles WHERE content MATCH 'hel' USING ANALYZER ngram_analyzer ORDER BY id;
```

組み込みトークナイザーを直接使用することもできます。

```sql
SELECT * FROM articles WHERE content MATCH 'hello' USING ANALYZER standard;
SELECT * FROM articles WHERE content MATCH 'hello' USING ANALYZER none;
SELECT * FROM articles WHERE content MATCH 'Hello' USING ANALYZER chinese;
```

### 既存のテーブルへのインデックスの追加 {#adding-an-index-to-an-existing-table}

```sql
-- Add a new index that uses a different tokenizer
ALTER TABLE articles ADD INDEX idx_content_chinese (content)
USING INVERTED PROPERTIES("parser" = "chinese");

-- Wait for the schema change to complete
SHOW ALTER TABLE COLUMN WHERE TableName='articles';
```

### インデックスの構築 {#building-an-index}

インデックスを追加した後は、既存データに対してインデックスを構築する必要があります。

```sql
-- Build a specific index (non-cloud mode)
BUILD INDEX idx_content_chinese ON articles;

-- Build all indexes (cloud mode)
BUILD INDEX ON articles;

-- Check the build progress
SHOW BUILD INDEX WHERE TableName='articles';
```

### 主な注意事項 {#key-notes}

1. **トークナイザーの同一性**: `tokenizer`と`token_filter`の設定が同じトークナイザーは、同一と見なされます。同じカラムに、トークナイザーの構成が同一のインデックスを複数作成することはできません。
2. **インデックスの選択動作**:
    - `USING ANALYZER`を指定した場合、指定したトークナイザーに対応するインデックスが存在し、構築済みであれば、そのインデックスが使用されます。
    - インデックスが構築されていない場合、クエリはインデックスを使わない実行経路に切り替わります（結果は正しいものの、性能は低下します）。
    - `USING ANALYZER`を指定しない場合は、利用可能ないずれかのインデックスが使用されることがあります。
3. **性能上の考慮事項**:
    - インデックスを追加するたびに、ストレージ使用量と書き込み時の負荷が増えます。
    - 実際のクエリパターンに基づいてトークナイザーを選択してください。
    - クエリパターンが予測できる場合は、インデックスの数を抑えることを検討してください。

---

## 管理とメンテナンス {#management-and-maintenance}

### 表示 {#view}

```sql
SHOW INVERTED INDEX TOKENIZER;
SHOW INVERTED INDEX TOKEN_FILTER;
SHOW INVERTED INDEX ANALYZER;
```

### 削除 {#delete}

```sql
DROP INVERTED INDEX TOKENIZER IF EXISTS x_tokenizer;
DROP INVERTED INDEX TOKEN_FILTER IF EXISTS x_token_filter;
DROP INVERTED INDEX ANALYZER IF EXISTS x_analyzer;
```

---

## 完全な使用例 {#complete-examples}

### 例1: 電話番号の前方一致 {#example-1-phone-number-prefix-matching}

`edge_ngram`を使用して電話番号のすべての先頭部分を生成し、入力途中でも検索できるようにします。

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

結果:

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

### 例2: 複雑な英語テキストの細粒度なトークン化 {#example-2-fine-grained-tokenization-for-complex-english-text}

`standard`トークナイザーと`word_delimiter`を組み合わせてテキストをより細かく分割し、さらに大文字と小文字の正規化とASCIIへの変換を行います。

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

結果:

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

### 例3: 元の語を保持した完全一致 {#example-3-exact-match-with-original-term-preserved}

`keyword`トークナイザーでテキスト全体を保持し、その後に`lowercase`と`asciifolding`で正規化します。これは、文字列の大文字と小文字を区別しない完全一致によく使用されます。

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

結果:

```json
[
    {"token":"hello world"}
]
```

### 例4: IK Smartと細粒度な中国語トークン化（4.1.5以降） {#example-4-ik-smart-and-fine-grained-chinese-tokenization-since-415}

4.1.5以降、カスタムアナライザーでは、組み込みの`ik_smart`トークナイザーと`ik_max_word`トークナイザーを直接参照できます。また、いずれかを`type`に指定した名前付きトークナイザーを作成し、文字フィルターやトークンフィルターと組み合わせることもできます。どちらのIKトークナイザーにも追加のトークナイザーパラメーターはありません。両方とも、BEの設定項目`inverted_index_dict_path`が指すディレクトリ内の`ik`ディレクトリにある辞書を使用します。トークン化とインデックス構築に関わるすべてのBEが、これらのコンポーネントをサポートし、辞書を読み取れる必要があります。

以下の例では、直接参照する方法と名前付きトークナイザーを使用する方法を示します。これらのコンポーネントの作成にはグローバルな`ADMIN`権限が必要です。テーブルの作成、データロード、クエリの実行には、対象のデータベースとテーブルに対する対応する権限も必要です。

```sql
CREATE INVERTED INDEX ANALYZER IF NOT EXISTS cn_ik_smart
PROPERTIES ("tokenizer" = "ik_smart");

CREATE INVERTED INDEX TOKENIZER IF NOT EXISTS cn_ik_max_tokenizer
PROPERTIES ("type" = "ik_max_word");

CREATE INVERTED INDEX ANALYZER IF NOT EXISTS cn_ik_max
PROPERTIES ("tokenizer" = "cn_ik_max_tokenizer");
```

作成に成功すると`Query OK`が返されます。コンポーネントがBEに同期されたら、`TOKENIZE`で出力を比較します。以下の結果は組み込み辞書を使用したものです。辞書を変更すると、生成されるトークンも変わる場合があります。

```sql
SELECT TOKENIZE('中华人民共和国', '"analyzer"="cn_ik_smart"');
```

```json
[{"token":"中华人民共和国"}]
```

```sql
SELECT TOKENIZE('中华人民共和国', '"analyzer"="cn_ik_max"');
```

```json
[
    {"token":"中华人民共和国"},
    {"token":"中华人民"},
    {"token":"中华"},
    {"token":"华人"},
    {"token":"人民共和国"},
    {"token":"人民"},
    {"token":"共和国"},
    {"token":"共和"},
    {"token":"国"}
]
```

テーブルの転置インデックスでアナライザーを使用します。

```sql
CREATE TABLE ik_articles (
    id INT,
    content STRING,
    INDEX idx_content(content) USING INVERTED
        PROPERTIES("analyzer" = "cn_ik_smart")
)
DUPLICATE KEY(id)
DISTRIBUTED BY HASH(id) BUCKETS 1
PROPERTIES ("replication_allocation" = "tag.location.default: 1");

INSERT INTO ik_articles VALUES (1, '中华人民共和国');

SELECT id FROM ik_articles
WHERE content MATCH '中华人民共和国' USING ANALYZER cn_ik_smart
ORDER BY id;
```

```text
+----+
| id |
+----+
|  1 |
+----+
```

中国語の完全な単語を維持して検索したい場合は`ik_smart`を使用し、単語の一部との一致を増やしたい場合は`ik_max_word`を使用します。さらにトークンを処理する必要がある場合は、アナライザーの`token_filter`プロパティでトークンフィルターを追加してください。

### 例5: Ngramの長さの範囲を拡張する（4.1.5以降） {#example-5-expand-the-ngram-length-range-since-415}

このトークナイザーは、`max_ngram_diff=7`を明示的に設定することで、長さが`1`から`8`までのN-gramを生成します。

```sql
CREATE INVERTED INDEX TOKENIZER IF NOT EXISTS ngram_1_8_tokenizer
PROPERTIES (
    "type" = "ngram",
    "min_gram" = "1",
    "max_gram" = "8",
    "max_ngram_diff" = "7"
);

CREATE INVERTED INDEX ANALYZER IF NOT EXISTS ngram_1_8_analyzer
PROPERTIES ("tokenizer" = "ngram_1_8_tokenizer");
```

作成とBEへの同期が成功したら、次を実行します。

```sql
SELECT TOKENIZE('abcdefgh', '"analyzer"="ngram_1_8_analyzer"');
```

```json
[
    {"token":"a"}, {"token":"ab"}, {"token":"abc"}, {"token":"abcd"},
    {"token":"abcde"}, {"token":"abcdef"}, {"token":"abcdefg"}, {"token":"abcdefgh"},
    {"token":"b"}, {"token":"bc"}, {"token":"bcd"}, {"token":"bcde"},
    {"token":"bcdef"}, {"token":"bcdefg"}, {"token":"bcdefgh"},
    {"token":"c"}, {"token":"cd"}, {"token":"cde"}, {"token":"cdef"},
    {"token":"cdefg"}, {"token":"cdefgh"},
    {"token":"d"}, {"token":"de"}, {"token":"def"}, {"token":"defg"}, {"token":"defgh"},
    {"token":"e"}, {"token":"ef"}, {"token":"efg"}, {"token":"efgh"},
    {"token":"f"}, {"token":"fg"}, {"token":"fgh"},
    {"token":"g"}, {"token":"gh"}, {"token":"h"}
]
```


---

## 制限事項 {#limitations}

1. `tokenizer`と`token_filter`の`type`およびパラメーターには、現在サポートされているトークナイザーとトークンフィルターのみを使用できます。それ以外を指定すると、テーブルの作成に失敗します。
2. `analyzer`を削除できるのは、どのテーブルでも使用されていない場合に限ります。
3. `tokenizer`または`token_filter`を削除できるのは、どの`analyzer`でも使用されていない場合に限ります。
4. カスタムアナライザーのDDLは、実行から10秒後にBEへ同期されます。その後のデータインポートではエラーは発生しません。

---

## 注意事項 {#notes}

1. カスタム`analyzer`に複数のコンポーネントを組み込むと、トークン化の性能が低下する場合があります。
2. `select tokenize`トークン化関数はカスタムアナライザーに対応しており、トークン化結果のデバッグに使用できます。
3. 同じインデックスには、事前定義済みの`built_in_analyzer`とカスタム`analyzer`のどちらか一方のみを設定できます。
