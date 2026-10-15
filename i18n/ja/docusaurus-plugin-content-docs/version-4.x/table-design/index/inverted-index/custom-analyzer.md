---
{
    "title": "カスタムアナライザー",
    "language": "ja",
    "description": "Doris のカスタムアナライザーは、文字フィルター、トークナイザー、トークンフィルターを組み合わせ、テキストの分割方法を柔軟に制御します。これにより、転置インデックスを使った検索の関連性と精度を高められます。",
    "keywords": [
        "カスタムアナライザー",
        "転置インデックスのトークナイザー",
        "トークナイザー",
        "token_filter",
        "char_filter",
        "edge_ngram",
        "word_delimiter",
        "USING ANALYZER",
        "複数アナライザーのインデックス"
    ]
}
---

<!-- Knowledge type: Feature overview + Configuration parameters + Operating procedures -->
<!-- Applicable scenarios: Inverted index text tokenization customization / Multilingual search / Auto-completion / Exact match -->

カスタムアナライザーは、**文字フィルター（char_filter）**、**トークナイザー**、**トークンフィルター（token_filter）**を組み合わせ、用途に応じてテキストを検索可能なトークンに分割する方法を定義します。組み込みアナライザーでは対応できない分割方法を設定でき、検索の関連性とデータ分析の精度に直接影響します。

![カスタムアナライザーの構成図](/images/analyzer.png)

### 適用シナリオ

| シナリオ | 推奨する組み合わせ |
| --- | --- |
| 複数言語が混在するテキストの検索 | `icu` トークナイザー + `icu_normalizer` フィルター |
| 電話番号やコードの前方一致 | `edge_ngram` トークナイザー |
| 複雑な英語テキストの分割（キャメルケース、ハイフンなど） | `standard` トークナイザー + `word_delimiter` フィルター |
| 入力補完や入力候補の提示 | `edge_ngram` トークナイザー + `lowercase` フィルター |
| 完全一致（元のトークンを保持） | `keyword` トークナイザー + `lowercase` / `asciifolding` フィルター |

---

## 主要コンポーネント

カスタムアナライザーは、元のテキストに次の順序で適用される四種類のオブジェクトで構成されます。

```
Original text ──► [char_filter] ──► [tokenizer] ──► [token_filter] ──► Terms
```

| コンポーネント | 役割 | 個数 |
| --- | --- | --- |
| `char_filter` | トークン化の前に文字を処理する（置換や正規化など） | 0 ~ N |
| `tokenizer` | テキストをトークンに分割する | 1 |
| `token_filter` | 生成されたトークンを処理する（小文字化や ASCII への変換など） | 0 ~ N |
| `analyzer` | 上記のコンポーネントを組み合わせ、トークン化の一連の処理を構成する | 1 |

---

## カスタムアナライザーの作成

### 1. 文字フィルター（char_filter）

```sql
CREATE INVERTED INDEX CHAR_FILTER IF NOT EXISTS x_char_filter
PROPERTIES (
    "type" = "char_replace"
    -- See below for other parameters
);
```

サポートされる文字フィルターの種類は次のとおりです。

- **`char_replace`**: トークン化の前に指定した文字を別の文字に置き換えます。
    - `char_filter_pattern`: 置き換える文字のリスト
    - `char_filter_replacement`: 置換後の文字（デフォルト: スペース）

- **`icu_normalizer`**: ICU 正規化を使用してテキストを前処理します。
    - `name`: 正規化形式（デフォルト: `nfkc_cf`）。選択肢: `nfc`、`nfkc`、`nfkc_cf`、`nfd`、`nfkd`
    - `mode`: 正規化モード（デフォルト: `compose`）。選択肢: `compose`、`decompose`
    - `unicode_set_filter`: 正規化する文字集合を指定します（例: `[a-z]`）。

### 2. トークナイザー

```sql
CREATE INVERTED INDEX TOKENIZER IF NOT EXISTS x_tokenizer
PROPERTIES (
    "type" = "standard"
);
```

サポートされるトークナイザーの種類は次のとおりです。

| 種類 | 説明 | 主なパラメーター |
| --- | --- | --- |
| `standard` | Unicode のテキスト分割規則に従う標準のトークン化。ほとんどの言語に適しています。 | なし |
| `ngram` | N-gram に分割します。 | `min_gram`、`max_gram`、`token_chars` |
| `edge_ngram` | 単語の先頭から始まる N-gram を生成します。 | `min_gram`、`max_gram`、`token_chars` |
| `keyword` | テキスト全体を一つのトークンとして出力します。通常は token_filter と組み合わせます。 | なし |
| `char_group` | 指定した文字で分割します。 | `tokenize_on_chars` |
| `basic` | 英語、数字、中国語、Unicode の単純なトークン化を行います。 | `extra_chars` |
| `icu` | ICU による国際化対応のトークン化。複数言語の複雑な文字体系をサポートします。 | なし |

パラメーターの説明:

- `min_gram`: 最小長（デフォルト: 1）
- `max_gram`: 最大長（デフォルト: 2）
- `token_chars`: 保持する文字のカテゴリー（デフォルト: すべて保持）。選択肢: `letter`、`digit`、`whitespace`、`punctuation`、`symbol`
- `tokenize_on_chars`: 文字のリストまたはカテゴリー。カテゴリーとして `whitespace`、`letter`、`digit`、`punctuation`、`symbol`、`cjk` を使用できます。
- `extra_chars`: 分割文字として追加する ASCII 文字（例: `[]().`）

### 3. トークンフィルター

```sql
CREATE INVERTED INDEX TOKEN_FILTER IF NOT EXISTS x_token_filter
PROPERTIES (
    "type" = "word_delimiter"
);
```

サポートされるトークンフィルターの種類は次のとおりです。

| 種類 | 役割 |
| --- | --- |
| `word_delimiter` | 英数字以外の文字で分割し、正規化も実行できます。 |
| `ascii_folding` | ASCII 以外の文字を対応する ASCII 文字に変換します。 |
| `lowercase` | トークンのテキストを小文字に変換します。 |
| `icu_normalizer` | ICU 正規化を使用してトークンを処理します。 |

#### word_delimiter の詳細

デフォルトの動作:

1. 英数字以外の文字を区切り文字として使用します（例: `Super-Duper` → `Super`、`Duper`）。
2. トークンの先頭と末尾の区切り文字を除去します（例: `XL---42+'Autocoder'` → `XL`、`42`、`Autocoder`）。
3. 大文字と小文字が切り替わる位置で分割します（例: `PowerShot` → `Power`、`Shot`）。
4. 英字と数字の境界で分割します（例: `XL500` → `XL`、`500`）。
5. 英語の所有格 `'s` を除去します（例: `Neil's` → `Neil`）。

オプションのパラメーター:

| パラメーター | デフォルト | 説明 |
| --- | --- | --- |
| `generate_number_parts` | `true` | 数字の部分を出力するかどうか |
| `generate_word_parts` | `true` | 単語の部分を出力するかどうか |
| `protected_words` | なし | 分割しない保護対象の単語 |
| `split_on_case_change` | `true` | 大文字と小文字の切り替わりで分割するかどうか |
| `split_on_numerics` | `true` | 英字と数字の境界で分割するかどうか |
| `stem_english_possessive` | `true` | 英語の所有格 `'s` を除去するかどうか |
| `type_table` | なし | 文字種のカスタム対応表 |

`type_table` は次の対応付けの種類をサポートします。

- `ALPHA`（英字）
- `ALPHANUM`（英数字）
- `DIGIT`（数字）
- `LOWER`（小文字の英字）
- `SUBWORD_DELIM`（英数字以外の区切り文字）
- `UPPER`（大文字の英字）

例: `["+ => ALPHA", "- => ALPHA"]` を指定すると、`+` と `-` は英字として扱われ、分割位置にはなりません。

#### icu_normalizer のパラメーター

- `name`: 正規化形式（デフォルト: `nfkc_cf`）。選択肢: `nfc`、`nfkc`、`nfkc_cf`、`nfd`、`nfkd`
- `unicode_set_filter`: 正規化する文字集合を指定します。

### 4. アナライザー

上記のコンポーネントを組み合わせ、トークン化の一連の処理を構成します。

```sql
CREATE INVERTED INDEX ANALYZER IF NOT EXISTS x_analyzer
PROPERTIES (
    "tokenizer" = "x_tokenizer",            -- A single tokenizer
    "token_filter" = "x_filter1, x_filter2" -- One or more token_filters, executed in order
);
```

---

## テーブルでのカスタムアナライザーの使用

作成したカスタムアナライザーは、`analyzer` フィールドを使用してインデックスの `PROPERTIES` 内で参照します。

```sql
CREATE TABLE tbl (
    `a` bigint NOT NULL AUTO_INCREMENT(1),
    `ch` text NULL,
    INDEX idx_ch (`ch`) USING INVERTED PROPERTIES("analyzer" = "x_custom_analyzer", "support_phrase" = "true")
)
table_properties;
```

注意事項:

1. カスタムアナライザーは、インデックスの `PROPERTIES` 内で `analyzer` を使用して設定します。
2. `analyzer` と同時に使用できるプロパティは `support_phrase` のみです。

---

## 単一列への複数のアナライザーインデックスの作成

Doris では、同じ列に対して異なるトークナイザーを使用する複数の転置インデックスを作成できます。これにより、同じデータを異なるトークン化方法で検索できます。

### ユースケース

- **多言語対応**: 同じテキスト列に対し、言語ごとに異なるトークナイザーを使用します。
- **検索精度と再現率の調整**: 完全一致には keyword トークナイザーを、あいまい検索には standard トークナイザーを使用します。
- **入力補完**: 前方一致には edge_ngram トークナイザーを、通常の検索には standard トークナイザーを使用します。

### 複数のインデックスの作成

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

### クエリ実行時のアナライザー指定

使用するインデックスを指定するには、`USING ANALYZER` 句を使用します。

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

### 既存のテーブルへのインデックスの追加

```sql
-- Add a new index that uses a different tokenizer
ALTER TABLE articles ADD INDEX idx_content_chinese (content)
USING INVERTED PROPERTIES("parser" = "chinese");

-- Wait for the schema change to complete
SHOW ALTER TABLE COLUMN WHERE TableName='articles';
```

### インデックスの構築

インデックスを追加した後は、既存データに対してインデックスを構築する必要があります。

```sql
-- Build a specific index (non-cloud mode)
BUILD INDEX idx_content_chinese ON articles;

-- Build all indexes (cloud mode)
BUILD INDEX ON articles;

-- Check the build progress
SHOW BUILD INDEX WHERE TableName='articles';
```

### 重要な注意事項

1. **トークナイザーの同一性**: `tokenizer` と `token_filter` の設定が同じ二つのトークナイザーは、同一とみなされます。同じ列に、同一とみなされるトークナイザーを使う複数のインデックスは作成できません。
2. **インデックスの選択動作**:
    - `USING ANALYZER` を指定すると、指定したトークナイザーに対応するインデックスが存在し、構築済みの場合に使用されます。
    - インデックスが構築されていない場合、クエリはインデックスを使用しない実行経路に切り替わります。結果は正しいままですが、実行速度は低下します。
    - `USING ANALYZER` を指定しない場合は、利用可能な任意のインデックスが使用されることがあります。
3. **パフォーマンス上の考慮事項**:
    - インデックスを追加するたびに、ストレージ使用量と書き込みの負荷が増えます。
    - 実際のクエリパターンに合わせてトークナイザーを選択してください。
    - クエリパターンが予測できる場合は、インデックス数を減らすことを検討してください。

---

## 管理とメンテナンス

### 一覧表示

```sql
SHOW INVERTED INDEX TOKENIZER;
SHOW INVERTED INDEX TOKEN_FILTER;
SHOW INVERTED INDEX ANALYZER;
```

### 削除

```sql
DROP INVERTED INDEX TOKENIZER IF EXISTS x_tokenizer;
DROP INVERTED INDEX TOKEN_FILTER IF EXISTS x_token_filter;
DROP INVERTED INDEX ANALYZER IF EXISTS x_analyzer;
```

---

## 完全な例

### 例1: 電話番号の前方一致

`edge_ngram` を使用して電話番号のすべての前方部分文字列を生成し、入力しながら検索できるようにします。

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

### 例2: 複雑な英語テキストの細かなトークン化

`standard` トークナイザーと `word_delimiter` を組み合わせてより細かくトークン化し、大文字と小文字の正規化および ASCII への変換も行います。

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

### 例3: 元のトークンを保持した完全一致

`keyword` トークナイザーでテキスト全体をそのまま保持し、`lowercase` と `asciifolding` を適用して正規化します。通常、大文字と小文字を区別しない文字列の完全一致に使用します。

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

---

## 制限事項

1. `type` および `tokenizer` と `token_filter` のパラメーターには、現在サポートされているトークナイザーとトークンフィルターのみを指定できます。それ以外を指定すると、テーブルの作成に失敗します。
2. `analyzer` を削除できるのは、それを使用しているテーブルがない場合のみです。
3. `tokenizer` または `token_filter` を削除できるのは、それを使用している `analyzer` がない場合のみです。
4. カスタムアナライザーの DDL は、実行から10秒後に BE に同期されます。その後のインポートではエラーは発生しません。

---

## 補足

1. カスタム `analyzer` に複数のコンポーネントを組み込むと、トークン化の性能が低下する場合があります。
2. トークン化関数 `select tokenize` はカスタムアナライザーをサポートしており、トークン化の結果を確認するために使用できます。
3. 同じインデックスには、事前定義された `built_in_analyzer` とカスタム `analyzer` のいずれか一方のみを設定できます。
