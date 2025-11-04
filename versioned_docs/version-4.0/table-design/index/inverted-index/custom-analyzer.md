---
{
    "title": "Custom Analyzer",
    "language": "en"
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
