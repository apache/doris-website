---
{
    "title": "Custom Analyzer",
    "language": "en",
    "description": "Doris custom analyzers combine character filters, tokenizers, and token filters to flexibly control text segmentation strategies, improving the search relevance and precision of inverted indexes.",
    "keywords": [
        "custom analyzer",
        "custom analyzer",
        "inverted index tokenizer",
        "tokenizer",
        "token_filter",
        "char_filter",
        "edge_ngram",
        "word_delimiter",
        "USING ANALYZER",
        "multi-analyzer index"
    ]
}
---

<!-- Knowledge type: Feature overview + Configuration parameters + Operating procedures -->
<!-- Applicable scenarios: Inverted index text tokenization customization / Multilingual search / Auto-completion / Exact match -->

A Custom Analyzer combines a **character filter (char_filter)**, a **tokenizer**, and a **token filter (token_filter)** so that you can precisely define how text is split into searchable terms based on business needs. It overcomes the limitations of built-in analyzers and directly affects search relevance and the accuracy of data analysis.

![Custom analyzer diagram](/images/analyzer.png)

### Applicable Scenarios

| Scenario | Recommended Combination |
| --- | --- |
| Multilingual mixed-text search | `icu` tokenizer + `icu_normalizer` filter |
| Phone number / code prefix matching | `edge_ngram` tokenizer |
| Splitting complex English text (camel case, hyphens, etc.) | `standard` tokenizer + `word_delimiter` filter |
| Auto-completion / input suggestions | `edge_ngram` tokenizer + `lowercase` filter |
| Exact match (preserve original term) | `keyword` tokenizer + `lowercase` / `asciifolding` filter |

---

## Core Components

A custom analyzer consists of four kinds of objects, applied to the original text in order:

```
Original text ──► [char_filter] ──► [tokenizer] ──► [token_filter] ──► Terms
```

| Component | Purpose | Count |
| --- | --- | --- |
| `char_filter` | Pre-processes characters before tokenization (such as replacement and normalization) | 0 ~ N |
| `tokenizer` | Splits text into terms | 1 |
| `token_filter` | Processes the resulting terms (such as lowercasing or ASCII folding) | 0 ~ N |
| `analyzer` | Assembles the components above into a complete tokenization pipeline | 1 |

---

## Creating a Custom Analyzer

### 1. Character Filter (char_filter)

```sql
CREATE INVERTED INDEX CHAR_FILTER IF NOT EXISTS x_char_filter
PROPERTIES (
    "type" = "char_replace"
    -- See below for other parameters
);
```

Supported character filter types:

- **`char_replace`**: replaces specified characters with target characters before tokenization.
    - `char_filter_pattern`: list of characters to replace
    - `char_filter_replacement`: replacement character (default: space)

- **`icu_normalizer`**: pre-processes text using ICU normalization.
    - `name`: normalization form (default `nfkc_cf`). Options: `nfc`, `nfkc`, `nfkc_cf`, `nfd`, `nfkd`
    - `mode`: normalization mode (default `compose`). Options: `compose`, `decompose`
    - `unicode_set_filter`: specifies the character set to normalize (such as `[a-z]`)

### 2. Tokenizer

```sql
CREATE INVERTED INDEX TOKENIZER IF NOT EXISTS x_tokenizer
PROPERTIES (
    "type" = "standard"
);
```

Supported tokenizer types:

| Type | Description | Main Parameters |
| --- | --- | --- |
| `standard` | Standard tokenization (follows Unicode text segmentation), suitable for most languages | None |
| `ngram` | Splits by N-grams | `min_ngram`, `max_ngram`, `token_chars` |
| `edge_ngram` | Generates N-grams starting from the beginning of the word | `min_ngram`, `max_ngram`, `token_chars` |
| `keyword` | Outputs the entire text as a single term, often combined with token_filter | None |
| `char_group` | Splits by the given characters | `tokenize_on_chars` |
| `basic` | Simple English / digit / Chinese / Unicode tokenization | `extra_chars` |
| `icu` | ICU internationalized tokenization, supports complex scripts in multiple languages | None |

Parameter descriptions:

- `min_ngram`: minimum length (default 1)
- `max_ngram`: maximum length (default 2)
- `token_chars`: character categories to keep (default: keep all). Options: `letter`, `digit`, `whitespace`, `punctuation`, `symbol`
- `tokenize_on_chars`: a character list or category. Categories support `whitespace`, `letter`, `digit`, `punctuation`, `symbol`, `cjk`
- `extra_chars`: additional ASCII characters to split on (such as `[]().`)

### 3. Token Filter

```sql
CREATE INVERTED INDEX TOKEN_FILTER IF NOT EXISTS x_token_filter
PROPERTIES (
    "type" = "word_delimiter"
);
```

Supported token filter types:

| Type | Purpose |
| --- | --- |
| `word_delimiter` | Splits at non-alphanumeric characters and can perform normalization |
| `ascii_folding` | Maps non-ASCII characters to their ASCII equivalents |
| `lowercase` | Converts token text to lowercase |
| `icu_normalizer` | Processes tokens using ICU normalization |

#### word_delimiter Details

Default behavior:

1. Uses non-alphanumeric characters as delimiters (for example: `Super-Duper` to `Super`, `Duper`)
2. Removes leading and trailing delimiters from a token (for example: `XL---42+'Autocoder'` to `XL`, `42`, `Autocoder`)
3. Splits at case transitions (for example: `PowerShot` to `Power`, `Shot`)
4. Splits at the boundary between letters and digits (for example: `XL500` to `XL`, `500`)
5. Removes the English possessive `'s` (for example: `Neil's` to `Neil`)

Optional parameters:

| Parameter | Default | Description |
| --- | --- | --- |
| `generate_number_parts` | `true` | Whether to output the numeric parts |
| `generate_word_parts` | `true` | Whether to output the word parts |
| `protected_words` | None | Protected words that are not split |
| `split_on_case_change` | `true` | Whether to split at case changes |
| `split_on_numerics` | `true` | Whether to split at the boundary between letters and digits |
| `stem_english_possessive` | `true` | Whether to remove the English possessive `'s` |
| `type_table` | None | Custom character type mapping table |

`type_table` supports the following mapping types:

- `ALPHA` (letter)
- `ALPHANUM` (alphanumeric)
- `DIGIT` (digit)
- `LOWER` (lowercase letter)
- `SUBWORD_DELIM` (non-alphanumeric delimiter)
- `UPPER` (uppercase letter)

Example: `["+ => ALPHA", "- => ALPHA"]` treats `+` and `-` as letters so that they are not used as split points.

#### icu_normalizer Parameters

- `name`: normalization form (default `nfkc_cf`). Options: `nfc`, `nfkc`, `nfkc_cf`, `nfd`, `nfkd`
- `unicode_set_filter`: specifies the character set to normalize

### 4. Analyzer

Assembles the components above into a complete tokenization pipeline:

```sql
CREATE INVERTED INDEX ANALYZER IF NOT EXISTS x_analyzer
PROPERTIES (
    "tokenizer" = "x_tokenizer",            -- A single tokenizer
    "token_filter" = "x_filter1, x_filter2" -- One or more token_filters, executed in order
);
```

---

## Using a Custom Analyzer in a Table

Reference a created custom analyzer through the `analyzer` field in the index `PROPERTIES`:

```sql
CREATE TABLE tbl (
    `a` bigint NOT NULL AUTO_INCREMENT(1),
    `ch` text NULL,
    INDEX idx_ch (`ch`) USING INVERTED PROPERTIES("analyzer" = "x_custom_analyzer", "support_phrase" = "true")
)
table_properties;
```

Notes:

1. A custom analyzer is set in the index `PROPERTIES` through `analyzer`.
2. The only property that can be used together with `analyzer` is `support_phrase`.

---

## Multiple Analyzer Indexes on a Single Column

Doris supports creating multiple inverted indexes that use different tokenizers on the same column, so that the same data can be retrieved with different tokenization strategies.

### Use Cases

- **Multilingual support**: use tokenizers for different languages on the same text column.
- **Balancing search precision and recall**: use a keyword tokenizer for exact matching and a standard tokenizer for fuzzy search.
- **Auto-completion**: use an edge_ngram tokenizer for prefix matching and a standard tokenizer for regular search.

### Creating Multiple Indexes

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

### Specifying an Analyzer at Query Time

Use the `USING ANALYZER` clause to specify which index to use:

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

You can also use built-in tokenizers directly:

```sql
SELECT * FROM articles WHERE content MATCH 'hello' USING ANALYZER standard;
SELECT * FROM articles WHERE content MATCH 'hello' USING ANALYZER none;
SELECT * FROM articles WHERE content MATCH 'Hello' USING ANALYZER chinese;
```

### Adding an Index to an Existing Table

```sql
-- Add a new index that uses a different tokenizer
ALTER TABLE articles ADD INDEX idx_content_chinese (content)
USING INVERTED PROPERTIES("parser" = "chinese");

-- Wait for the schema change to complete
SHOW ALTER TABLE COLUMN WHERE TableName='articles';
```

### Building an Index

After adding an index, you must build the index for existing data:

```sql
-- Build a specific index (non-cloud mode)
BUILD INDEX idx_content_chinese ON articles;

-- Build all indexes (cloud mode)
BUILD INDEX ON articles;

-- Check the build progress
SHOW BUILD INDEX WHERE TableName='articles';
```

### Key Notes

1. **Tokenizer identity**: two tokenizers with the same `tokenizer` and `token_filter` configuration are considered identical. You cannot create multiple indexes on the same column that share the same tokenizer identity.
2. **Index selection behavior**:
    - When `USING ANALYZER` is specified, the index for the specified tokenizer is used if it exists and has been built.
    - If the index is not built, the query falls back to the non-index path (results are correct, but performance is slower).
    - When `USING ANALYZER` is not specified, any available index may be used.
3. **Performance considerations**:
    - Each additional index increases storage space and write overhead.
    - Choose tokenizers based on your actual query patterns.
    - If your query patterns are predictable, consider using fewer indexes.

---

## Management and Maintenance

### View

```sql
SHOW INVERTED INDEX TOKENIZER;
SHOW INVERTED INDEX TOKEN_FILTER;
SHOW INVERTED INDEX ANALYZER;
```

### Delete

```sql
DROP INVERTED INDEX TOKENIZER IF EXISTS x_tokenizer;
DROP INVERTED INDEX TOKEN_FILTER IF EXISTS x_token_filter;
DROP INVERTED INDEX ANALYZER IF EXISTS x_analyzer;
```

---

## Complete Examples

### Example 1: Phone Number Prefix Matching

Use `edge_ngram` to generate all prefix fragments of a phone number, enabling search-as-you-type.

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

Result:

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

### Example 2: Fine-Grained Tokenization for Complex English Text

Use the `standard` tokenizer together with `word_delimiter` for finer-grained tokenization, plus case normalization and ASCII folding.

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

Result:

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

### Example 3: Exact Match with Original Term Preserved

Use the `keyword` tokenizer to keep the entire text intact, then apply `lowercase` and `asciifolding` for normalization. This is commonly used for case-insensitive exact matching of strings.

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

Result:

```json
[
    {"token":"hello world"}
]
```

---

## Limitations

1. The `type` and parameters in `tokenizer` and `token_filter` can only use currently supported tokenizers and token filters; otherwise, table creation fails.
2. An `analyzer` can be dropped only when no table is using it.
3. A `tokenizer` or `token_filter` can be dropped only when no `analyzer` is using it.
4. Custom analyzer DDL is synchronized to the BE 10 seconds after execution; subsequent imports do not produce errors.

---

## Notes

1. Nesting multiple components in a custom `analyzer` may degrade tokenization performance.
2. The `select tokenize` tokenization function supports custom analyzers and can be used to debug tokenization results.
3. Only one of the predefined `built_in_analyzer` and a custom `analyzer` can exist on the same index.
</content>
</invoke>