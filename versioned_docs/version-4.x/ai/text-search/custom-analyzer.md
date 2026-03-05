---
{
    "title": "Custom Analyzer",
    "language": "en",
    "description": "Custom analyzers allow you to overcome the limitations of built-in tokenizers by combining character filters, tokenizers,"
}
---

## Overview

Custom analyzers allow you to overcome the limitations of built-in tokenizers by combining character filters, tokenizers, and token filters according to specific needs. This fine-tunes how text is segmented into searchable terms, directly determining search relevance and data analysis accuracy—a foundational key to enhancing search experience and data value.

![Custom Analyzer Overview](/images/analyzer.png)

## Using Custom Analyzers

### Creating Components

#### 1. Creating a char_filter

```sql
CREATE INVERTED INDEX CHAR_FILTER IF NOT EXISTS x_char_filter
PROPERTIES (
  "type" = "char_replace"
  -- configure pattern/replacement parameters as needed
);
```

`char_replace` replaces specified characters before tokenization.
- Parameters
  - `char_filter_pattern`: characters to replace
  - `char_filter_replacement`: replacement characters (default: space)

#### 2. Creating a tokenizer

```sql
CREATE INVERTED INDEX TOKENIZER IF NOT EXISTS x_tokenizer
PROPERTIES (
  "type" = "standard"
);
```

Available tokenizers:
- **standard**: Grammar-based tokenization following Unicode text segmentation
- **ngram**: Generates N-grams of specified length
- **edge_ngram**: Generates N-grams anchored at word start
- **keyword**: No-op tokenizer that outputs entire input as single term
- **char_group**: Tokenizes on specified characters
- **basic**: Simple English, numbers, Chinese, Unicode tokenizer
- **icu**: International text segmentation supporting all languages
- **pinyin**: Chinese pinyin conversion tokenizer for Chinese text search
  - `keep_first_letter`: When enabled, retains only the first letter of each Chinese character. For example, `刘德华` becomes `ldh`. Default: true
  - `keep_separate_first_letter`: When enabled, keeps the first letters of each Chinese character separately. For example, `刘德华` becomes `l`,`d`,`h`. Default: false. Note: This may increase query fuzziness due to term frequency
  - `limit_first_letter_length`: Sets the maximum length of the first letter result. Default: 16
  - `keep_full_pinyin`: When enabled, preserves the full Pinyin of each Chinese character. For example, `刘德华` becomes [`liu`,`de`,`hua`]. Default: true
  - `keep_joined_full_pinyin`: When enabled, joins the full Pinyin of each Chinese character. For example, `刘德华` becomes [`liudehua`]. Default: false
  - `keep_none_chinese`: Keeps non-Chinese letters or numbers in the result. Default: true
  - `keep_none_chinese_together`: Keeps non-Chinese letters together. Default: true. For example, `DJ音乐家` becomes `DJ`,`yin`,`yue`,`jia`. When set to false, `DJ音乐家` becomes `D`,`J`,`yin`,`yue`,`jia`. Note: `keep_none_chinese` should be enabled first
  - `keep_none_chinese_in_first_letter`: Keeps non-Chinese letters in the first letter. For example, `刘德华AT2016` becomes `ldhat2016`. Default: true
  - `keep_none_chinese_in_joined_full_pinyin`: Keeps non-Chinese letters in joined full Pinyin. For example, `刘德华2016` becomes `liudehua2016`. Default: false
  - `none_chinese_pinyin_tokenize`: Breaks non-Chinese letters into separate Pinyin terms if they are Pinyin. Default: true. For example, `liudehuaalibaba13zhuanghan` becomes `liu`,`de`,`hua`,`a`,`li`,`ba`,`ba`,`13`,`zhuang`,`han`. Note: `keep_none_chinese` and `keep_none_chinese_together` should be enabled first
  - `keep_original`: When enabled, keeps the original input as well. Default: false
  - `lowercase`:  Lowercases non-Chinese letters. Default: true
  - `trim_whitespace`: Default: true
  - `remove_duplicated_term`: When enabled, removes duplicated terms to save index space. For example, `de的` becomes `de`. Default: false. Note: Position-related queries may be influenced
  - `ignore_pinyin_offset`: This parameter currently has no functionality. Default: true

#### 3. Creating a token_filter

```sql
CREATE INVERTED INDEX TOKEN_FILTER IF NOT EXISTS x_token_filter
PROPERTIES (
  "type" = "word_delimiter"
);
```

Available token filters:
- **word_delimiter**: Splits tokens at non-alphanumeric characters
- **ascii_folding**: Converts non-ASCII characters to ASCII equivalents
- **lowercase**: Converts tokens to lowercase
- **pinyin**: Converts Chinese characters to pinyin after tokenization. For parameter details, refer to the **pinyin** tokenizer above.

#### 4. Creating an analyzer

```sql
CREATE INVERTED INDEX ANALYZER IF NOT EXISTS x_analyzer
PROPERTIES (
  "tokenizer" = "x_tokenizer",            -- single tokenizer
  "token_filter" = "x_filter1, x_filter2" -- one or more token_filters, in order
);
```

### Viewing Components

```sql
SHOW INVERTED INDEX TOKENIZER;
SHOW INVERTED INDEX TOKEN_FILTER;
SHOW INVERTED INDEX ANALYZER;
```

### Deleting Components

```sql
DROP INVERTED INDEX TOKENIZER IF EXISTS x_tokenizer;
DROP INVERTED INDEX TOKEN_FILTER IF EXISTS x_token_filter;
DROP INVERTED INDEX ANALYZER IF EXISTS x_analyzer;
```

## Using Custom Analyzers in Table Creation

Custom analyzers are specified using the `analyzer` parameter in index properties:

```sql
CREATE TABLE tbl (
    `a` bigint NOT NULL AUTO_INCREMENT(1),
    `ch` text NULL,
    INDEX idx_ch (`ch`) USING INVERTED PROPERTIES("analyzer" = "x_custom_analyzer", "support_phrase" = "true")
)
table_properties;
```

## Usage Limitations

1. The `type` and parameters in tokenizer and token_filter must be from the supported list, otherwise table creation will fail
2. An analyzer can only be deleted when no tables are using it
3. Tokenizers and token_filters can only be deleted when no analyzers are using them
4. After creating custom analyzer syntax, it takes 10 seconds to sync to BE before data loading works normally

## Notes

1. Nesting multiple components in a custom analyzer may degrade tokenization performance
2. The `tokenize` function supports custom analyzers
3. Predefined tokenization uses `built_in_analyzer`, custom tokenization uses `analyzer` - only one can exist

## Complete Examples

### Example 1: Phone Number Tokenization

Using edge_ngram for phone number tokenization:

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

### Example 2: Fine-grained Tokenization

Using standard + word_delimiter for detailed tokenization:

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

### Example 3: Keyword with Multiple Token Filters

Using keyword to preserve original terms with multiple token filters:

```sql
CREATE INVERTED INDEX ANALYZER IF NOT EXISTS keyword_lowercase
PROPERTIES
(
"tokenizer" = "keyword",
"token_filter" = "asciifolding, lowercase"
);
```

### Example 4: Chinese Pinyin Search

Using pinyin tokenizer for Chinese name and text search - supports full pinyin, first letter abbreviations, and mixed Chinese-English text.

#### Using Pinyin Tokenizer

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

#### Using Pinyin Filter

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