---
{
    "title": "Custom Normalizer",
    "language": "en",
    "description": "Custom Normalizer is used for unified text preprocessing,"
}
---

## Overview

Custom Normalizer is used for unified text preprocessing, typically in scenarios that do not require tokenization but need normalization (such as keyword search). Unlike an Analyzer, a Normalizer does not split text but processes the entire text as a single complete Token. It supports combining character filters and token filters to achieve functions like case conversion and character normalization.

## Using Custom Normalizer

### Create

A custom normalizer consists mainly of character filters (`char_filter`) and token filters (`token_filter`).

> Note: For detailed creation methods of `char_filter` and `token_filter`, please refer to the [Custom Analyzer] documentation.

```sql
CREATE INVERTED INDEX NORMALIZER IF NOT EXISTS x_normalizer
PROPERTIES (
  "char_filter" = "x_char_filter",          -- Optional, one or more character filters
  "token_filter" = "x_filter1, x_filter2"   -- Optional, one or more token filters, executed in order
);
```

### View

```sql
SHOW INVERTED INDEX NORMALIZER;
```

### Drop

```sql
DROP INVERTED INDEX NORMALIZER IF EXISTS x_normalizer;
```

## Usage in Table Creation

Specify the custom normalizer using `normalizer` in the inverted index properties.

**Note**: `normalizer` and `analyzer` are mutually exclusive and cannot be specified in the same index simultaneously.

```sql
CREATE TABLE tbl (
    `id` bigint NOT NULL,
    `code` text NULL,
    INDEX idx_code (`code`) USING INVERTED PROPERTIES("normalizer" = "x_custom_normalizer")
)
...
```

## Limitations

1. The names referenced in `char_filter` and `token_filter` must exist (either built-in or created).
2. A normalizer can only be dropped if no table is using it.
3. A `char_filter` or `token_filter` can only be dropped if no normalizer is using it.
4. After using the custom normalizer syntax, it takes about 10 seconds to sync to the BE, after which import operations will function normally without errors.

## Complete Example

### Example: Ignoring Case and Special Accents

This example demonstrates how to create a normalizer that converts text to lowercase and removes accents (e.g., normalizing `Café` to `cafe`), suitable for exact matching that is case-insensitive and accent-insensitive.

```sql
-- 1. Create a custom token filter (if specific parameters are needed)
-- Create an ascii_folding filter here
CREATE INVERTED INDEX TOKEN_FILTER IF NOT EXISTS my_ascii_folding
PROPERTIES
(
    "type" = "ascii_folding",
    "preserve_original" = "false"
);

-- 2. Create the normalizer
-- Combine lowercase (built-in) and my_ascii_folding
CREATE INVERTED INDEX NORMALIZER IF NOT EXISTS lowercase_ascii_normalizer
PROPERTIES
(
    "token_filter" = "lowercase, my_ascii_folding"
);

-- 3. Use in table creation
CREATE TABLE product_table (
    `id` bigint NOT NULL,
    `product_name` text NULL,
    INDEX idx_name (`product_name`) USING INVERTED PROPERTIES("normalizer" = "lowercase_ascii_normalizer")
) ENGINE=OLAP
DUPLICATE KEY(`id`)
DISTRIBUTED BY RANDOM BUCKETS 1
PROPERTIES (
"replication_allocation" = "tag.location.default: 1"
);

-- 4. Verify and test
select tokenize('Café-Products', '"normalizer"="lowercase_ascii_normalizer"');
```

Result:
```json
[
  {"token":"cafe-products"}
]
```
