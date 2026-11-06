---
{
    "title": "カスタムアナライザー",
    "language": "ja",
    "description": "Doris のカスタムアナライザーは、文字フィルター、トークナイザー、トークンフィルターを組み合わせてテキストの分割方法を柔軟に制御し、倒立インデックスの検索関連性と精度を高めます。",
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

カスタムアナライザーは、**文字フィルター（char_filter）**、**トークナイザー**、**トークンフィルター（token_filter）**を組み合わせ、業務上の要件に応じてテキストを検索可能な語に分割する方法を細かく定義できます。組み込みアナライザーの制約を補い、検索結果の関連性とデータ分析の精度に直接影響します。

![カスタムアナライザーの図](/images/analyzer.png)

### 適用シナリオ {#applicable-scenarios}

| シナリオ | 推奨する組み合わせ |
| --- | --- |
| 多言語が混在するテキストの検索 | `icu` トークナイザー + `icu_normalizer` フィルター |
| 電話番号やコードのプレフィックス一致 | `edge_ngram` トークナイザー |
| 複雑な英語テキストの分割（キャメルケース、ハイフンなど） | `standard` トークナイザー + `word_delimiter` フィルター |
| オートコンプリートや入力候補 | `edge_ngram` トークナイザー + `lowercase` フィルター |
| 完全一致（元の語を保持） | `keyword` トークナイザー + `lowercase` / `asciifolding` フィルター |

---

## 主要コンポーネント {#core-components}

カスタムアナライザーは、元のテキストに順番に適用される次の種類のオブジェクトで構成されます。

```
Original text ──► [char_filter] ──► [tokenizer] ──► [token_filter] ──► Terms
```

| コンポーネント | 役割 | 個数 |
| --- | --- | --- |
| `char_filter` | トークン化の前に文字を前処理する（置換や正規化など） | 0 ~ N |
| `tokenizer` | テキストを語に分割する | 1 |
| `token_filter` | 分割後の語を処理する（小文字化や ASCII フォールディングなど） | 0 ~ N |
| `analyzer` | 上記のコンポーネントを組み合わせて、完全なトークン化パイプラインを構成する | 1 |

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

- **`char_replace`**: トークン化の前に、指定した文字を対象の文字に置換します。
    - `char_filter_pattern`: 置換する文字のリスト
    - `char_filter_replacement`: 置換後の文字（デフォルト: スペース）

- **`icu_normalizer`**: ICU 正規化を使用してテキストを前処理します。
    - `name`: 正規化形式（デフォルトは `nfkc_cf`）。選択肢: `nfc`、`nfkc`、`nfkc_cf`、`nfd`、`nfkd`
    - `mode`: 正規化モード（デフォルトは `compose`）。選択肢: `compose`、`decompose`
    - `unicode_set_filter`: 正規化する文字集合を指定します（`[a-z]` など）。

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
| `standard` | Unicode のテキスト分割に従う標準的なトークン化。多くの言語に適しています | なし |
| `ngram` | N-gram に分割します | `min_gram`、`max_gram`、`max_ngram_diff`、`token_chars` |
| `edge_ngram` | 単語の先頭から始まる N-gram を生成します | `min_gram`、`max_gram`、`token_chars` |
| `keyword` | テキスト全体を単一の語として出力します。多くの場合、token_filter と組み合わせます | なし |
| `char_group` | 指定した文字で分割します | `tokenize_on_chars` |
| `basic` | 英語、数字、中国語、Unicode を単純にトークン化します | `extra_chars` |
| `icu` | ICU による国際化対応のトークン化。複数言語の複雑な文字体系をサポートします | なし |
| `ik_smart` | 完全な単語を優先する IK の中国語スマートトークン化。4.1.5 以降、カスタムアナライザーで使用できます | なし |
| `ik_max_word` | 重複する可能性のある語も多く生成する IK の詳細な中国語トークン化。4.1.5 以降、カスタムアナライザーで使用できます | なし |

パラメーターの説明:

- `min_gram`: 最小長（デフォルトは 1）
- `max_gram`: 最大長（デフォルトは 2）
- `token_chars`: 保持する文字カテゴリ（デフォルトではすべて保持）。選択肢: `letter`、`digit`、`whitespace`、`punctuation`、`symbol`
- `tokenize_on_chars`: 文字のリストまたはカテゴリ。カテゴリには `whitespace`、`letter`、`digit`、`punctuation`、`symbol`、`cjk` を指定できます。
- `extra_chars`: 追加の分割対象となる ASCII 文字（`[]().` など）

#### Ngram の長さの範囲制限（4.1.5 以降） {#ngram-range-limits-since-415}

4.1.5 以降、`ngram` トークナイザーは `max_ngram_diff` をサポートし、gram の最大長と最小長の差に対する従来の上限 `1` を緩和できます。作成時には、次の条件が検証されます。

| パラメーター | デフォルト | 制約 |
| --- | --- | --- |
| `min_gram` | `1` | `max_gram` 以下の正の整数。新しい `ngram` トークナイザーでは `1024` 以下。 |
| `max_gram` | `2` | `min_gram` 以上の正の整数。新しい `ngram` トークナイザーでは `1024` 以下。 |
| `max_ngram_diff` | `1` | `0` から `255` までの整数で、`max_gram - min_gram <= max_ngram_diff` を満たす必要があります。`0` に設定すると、固定長の N-gram のみが許可されます。 |

たとえば、`min_gram=1` と `max_gram=8` を指定する場合、`max_ngram_diff` は少なくとも `7` にする必要があります。省略すると、作成時に `The difference between max_gram and min_gram in NGram Tokenizer must be less than or equal to: [ 1 ] but was [7]` というエラーが発生します。使用方法の全体は[例 5](#example-5-expand-the-ngram-length-range-since-415)を参照してください。

これらの制限と `max_ngram_diff` は `ngram` にのみ適用されます。`edge_ngram` はこのパラメーターを受け付けません。電話番号とオートコンプリートの例では、それぞれの `min_gram` と `max_gram` の設定を使用します。範囲を広げると入力位置ごとに生成される語が増えるため、不要なインデックスの肥大化を避けるよう、検索要件に合わせて範囲を設定してください。

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
| `word_delimiter` | 英数字以外の文字で分割し、正規化も実行できます |
| `ascii_folding` | 非 ASCII 文字を対応する ASCII 文字に変換します |
| `lowercase` | トークンのテキストを小文字に変換します |
| `icu_normalizer` | ICU 正規化を使用してトークンを処理します |

#### word_delimiter の詳細 {#word_delimiter-details}

デフォルトの動作:

1. 英数字以外の文字を区切り文字として使用します（例: `Super-Duper` を `Super`、`Duper` に分割）。
2. トークンの先頭と末尾の区切り文字を除去します（例: `XL---42+'Autocoder'` から `XL`、`42`、`Autocoder` を生成）。
3. 大文字と小文字の切り替わりで分割します（例: `PowerShot` を `Power`、`Shot` に分割）。
4. 文字と数字の境界で分割します（例: `XL500` を `XL`、`500` に分割）。
5. 英語の所有格 `'s` を除去します（例: `Neil's` から `Neil` を生成）。

オプションのパラメーター:

| パラメーター | デフォルト | 説明 |
| --- | --- | --- |
| `generate_number_parts` | `true` | 数字部分を出力するかどうか |
| `generate_word_parts` | `true` | 単語部分を出力するかどうか |
| `protected_words` | なし | 分割しない保護対象の単語 |
| `split_on_case_change` | `true` | 大文字と小文字の切り替わりで分割するかどうか |
| `split_on_numerics` | `true` | 文字と数字の境界で分割するかどうか |
| `stem_english_possessive` | `true` | 英語の所有格 `'s` を除去するかどうか |
| `type_table` | なし | カスタムの文字種マッピングテーブル |

`type_table` は次のマッピング種別をサポートします。

- `ALPHA`（文字）
- `ALPHANUM`（英数字）
- `DIGIT`（数字）
- `LOWER`（小文字）
- `SUBWORD_DELIM`（英数字以外の区切り文字）
- `UPPER`（大文字）

例: `["+ => ALPHA", "- => ALPHA"]` は `+` と `-` を文字として扱い、分割位置に使用しません。

#### icu_normalizer のパラメーター {#icu_normalizer-parameters}

- `name`: 正規化形式（デフォルトは `nfkc_cf`）。選択肢: `nfc`、`nfkc`、`nfkc_cf`、`nfd`、`nfkd`
- `unicode_set_filter`: 正規化する文字集合を指定します。

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

インデックスの `PROPERTIES` にある `analyzer` フィールドを通じて、作成済みのカスタムアナライザーを参照します。

```sql
CREATE TABLE tbl (
    `a` bigint NOT NULL AUTO_INCREMENT(1),
    `ch` text NULL,
    INDEX idx_ch (`ch`) USING INVERTED PROPERTIES("analyzer" = "x_custom_analyzer", "support_phrase" = "true")
)
table_properties;
```

注意事項:

1. カスタムアナライザーは、インデックスの `PROPERTIES` で `analyzer` を使用して設定します。
2. `analyzer` と併用できるプロパティは `support_phrase` のみです。

---

## 単一カラムに対する複数のアナライザーインデックス {#multiple-analyzer-indexes-on-a-single-column}

Doris では、同じカラムに異なるトークナイザーを使用する複数の倒立インデックスを作成できるため、同じデータを異なるトークン化方法で検索できます。

### ユースケース {#use-cases}

- **多言語対応**: 同じテキストカラムに、言語ごとのトークナイザーを使用します。
- **検索精度と再現率の両立**: 完全一致には keyword トークナイザーを、あいまい検索には standard トークナイザーを使用します。
- **オートコンプリート**: プレフィックス一致には edge_ngram トークナイザーを、通常の検索には standard トークナイザーを使用します。

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

### クエリ実行時のアナライザーの指定 {#specifying-an-analyzer-at-query-time}

`USING ANALYZER` 句を使用して、使用するインデックスを指定します。

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

インデックスを追加した後、既存のデータに対してインデックスを構築する必要があります。

```sql
-- Build a specific index (non-cloud mode)
BUILD INDEX idx_content_chinese ON articles;

-- Build all indexes (cloud mode)
BUILD INDEX ON articles;

-- Check the build progress
SHOW BUILD INDEX WHERE TableName='articles';
```

### 重要な注意事項 {#key-notes}

1. **トークナイザーの同一性**: `tokenizer` と `token_filter` の設定が同じトークナイザーは、同一と見なされます。同じカラムに、トークナイザーの同一性が共通する複数のインデックスは作成できません。
2. **インデックス選択時の動作**:
    - `USING ANALYZER` を指定した場合、指定したトークナイザー用のインデックスが存在し、構築済みであれば、そのインデックスが使用されます。
    - インデックスが構築されていない場合、クエリはインデックスを使用しない経路に切り替わります（結果は正しいままですが、性能は低下します）。
    - `USING ANALYZER` を指定しない場合、利用可能なインデックスのいずれかが使用されることがあります。
3. **性能上の考慮事項**:
    - インデックスを追加するたびに、ストレージ使用量と書き込み時の負荷が増加します。
    - 実際のクエリパターンに基づいてトークナイザーを選択してください。
    - クエリパターンを予測できる場合は、インデックス数を抑えることを検討してください。

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

## 完全な例 {#complete-examples}

### 例 1: 電話番号のプレフィックス一致 {#example-1-phone-number-prefix-matching}

`edge_ngram` を使用して電話番号のすべてのプレフィックス断片を生成し、入力に応じた検索を可能にします。

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

### 例 2: 複雑な英語テキストの詳細なトークン化 {#example-2-fine-grained-tokenization-for-complex-english-text}

`standard` トークナイザーと `word_delimiter` を組み合わせて、より細かくトークン化し、大文字と小文字の正規化と ASCII フォールディングも適用します。

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

### 例 3: 元の語を保持する完全一致 {#example-3-exact-match-with-original-term-preserved}

`keyword` トークナイザーを使用してテキスト全体を保持し、`lowercase` と `asciifolding` を適用して正規化します。これは、大文字と小文字を区別しない文字列の完全一致によく使用されます。

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

### 例 4: IK による中国語のスマートトークン化と詳細なトークン化（4.1.5 以降） {#example-4-ik-smart-and-fine-grained-chinese-tokenization-since-415}

4.1.5 以降、カスタムアナライザーでは組み込みの `ik_smart` と `ik_max_word` トークナイザーを直接参照できます。また、どちらかの `type` を指定した名前付きトークナイザーを作成してから、文字フィルターやトークンフィルターと組み合わせることもできます。どちらの IK トークナイザーにも追加のトークナイザーパラメーターはありません。両者は BE 設定 `inverted_index_dict_path` の下にある `ik` ディレクトリの辞書を使用します。トークン化とインデックス構築に関わるすべての BE がこれらのコンポーネントをサポートし、辞書を読み取れる必要があります。

以下の例では、直接参照する方法と名前付きトークナイザーを使用する方法を示します。これらのコンポーネントの作成には、グローバルな `ADMIN` 権限が必要です。テーブルの作成、データロード、クエリの実行には、対象のデータベースとテーブルに対する対応する権限も必要です。

```sql
CREATE INVERTED INDEX ANALYZER IF NOT EXISTS cn_ik_smart
PROPERTIES ("tokenizer" = "ik_smart");

CREATE INVERTED INDEX TOKENIZER IF NOT EXISTS cn_ik_max_tokenizer
PROPERTIES ("type" = "ik_max_word");

CREATE INVERTED INDEX ANALYZER IF NOT EXISTS cn_ik_max
PROPERTIES ("tokenizer" = "cn_ik_max_tokenizer");
```

作成に成功すると `Query OK` が返されます。コンポーネントが BE に同期された後、`TOKENIZE` で出力を比較します。以下の結果は組み込み辞書を使用したもので、辞書を変更するとトークンも変わる可能性があります。

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

テーブルの倒立インデックスでアナライザーを使用します。

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

中国語の完全な単語を保持して検索する場合は `ik_smart` を、より多くの部分語に一致させる必要がある場合は `ik_max_word` を使用します。トークンをさらに処理する必要がある場合は、アナライザーの `token_filter` プロパティを通じてトークンフィルターを追加します。

### 例 5: Ngram の長さの範囲を拡大する（4.1.5 以降） {#example-5-expand-the-ngram-length-range-since-415}

このトークナイザーは `max_ngram_diff=7` を明示的に設定し、長さ `1` から `8` までの N-gram を生成します。

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

作成が成功し、BE への同期が完了したら、次を実行します。

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

1. `tokenizer` と `token_filter` の `type` およびパラメーターには、現在サポートされているトークナイザーとトークンフィルターのみを使用できます。それ以外を指定すると、テーブルの作成に失敗します。
2. `analyzer` を削除できるのは、そのアナライザーを使用するテーブルがない場合のみです。
3. `tokenizer` または `token_filter` を削除できるのは、それを使用する `analyzer` がない場合のみです。
4. カスタムアナライザーの DDL は実行から 10 秒後に BE に同期され、それ以降のデータのインポートではエラーが発生しません。

---

## 注意事項 {#notes}

1. カスタム `analyzer` に複数のコンポーネントを組み合わせると、トークン化の性能が低下する可能性があります。
2. `select tokenize` トークン化関数はカスタムアナライザーをサポートしており、トークン化結果のデバッグに使用できます。
3. 同じインデックスには、定義済みの `built_in_analyzer` とカスタムの `analyzer` のどちらか一方のみを設定できます。
