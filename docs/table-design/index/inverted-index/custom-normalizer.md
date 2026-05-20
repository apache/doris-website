---
{
    "title": "Custom Normalizer",
    "language": "en",
    "description": "Guide to custom normalizers for Doris inverted indexes: treat the entire text as a single token and support keyword exact-match scenarios such as case conversion and accent normalization."
}
---

<!-- Knowledge type: Feature description + Procedure -->
<!-- Applicable scenario: Keyword exact match / Standardization preprocessing without tokenization -->

A custom Normalizer applies uniform preprocessing to text. It **does not split the text**; instead, it treats the entire text as a single complete token. By combining character filters (`char_filter`) and token filters (`token_filter`), it supports case conversion, character normalization, and similar functions. It is commonly used in scenarios that do not require tokenization but do require normalization, such as keyword search.

**Differences between Normalizer and Analyzer**

| Comparison item | Normalizer | Analyzer |
| --- | --- | --- |
| Whether the text is split | No, the entire text is a single token | Yes, the text is split into multiple tokens by rules |
| Typical scenario | Keyword exact match (such as product codes, IDs) | Full-text search (such as article body) |
| Common filters | lowercase, ascii_folding, etc. | tokenizer + various filters |

## Applicable Scenarios

- **Keyword search**: Fields such as product codes, product names, and user IDs that do not require tokenization but need a unified format.
- **Case-insensitive matching**: Treat `ProductA` and `producta` as the same value.
- **Accent and special character normalization**: Normalize `Café` to `cafe` to avoid missed matches caused by symbol differences.

## Usage Workflow

The complete workflow consists of three steps:

1. (Optional) Create custom `char_filter` and `token_filter`.
2. Create a custom Normalizer that combines the filters above.
3. Reference the Normalizer in the table creation statement through the inverted index property.

### Step 1: Create custom filters (optional)

If the built-in filters cannot meet your requirements, you can create custom filters first.

> For details on creating `char_filter` and `token_filter`, see the [Custom Analyzer](./custom-analyzer.md) document.

### Step 2: Create a custom Normalizer

```sql
CREATE INVERTED INDEX NORMALIZER IF NOT EXISTS x_normalizer
PROPERTIES (
    "char_filter" = "x_char_filter",          -- Optional, one or more character filters
    "token_filter" = "x_filter1, x_filter2"   -- Optional, one or more token filters, executed in order
);
```

**Parameter description**

| Parameter | Required | Description |
| --- | --- | --- |
| `char_filter` | No | Names of one or more character filters, separated by commas |
| `token_filter` | No | Names of one or more token filters, executed in the declared order |

### Step 3: Reference the Normalizer in the table creation statement

In the inverted index properties, use `normalizer` to specify the normalizer to use.

```sql
CREATE TABLE tbl (
    `id` bigint NOT NULL,
    `code` text NULL,
    INDEX idx_code (`code`) USING INVERTED PROPERTIES("normalizer" = "x_custom_normalizer")
)
...
```

:::caution Note
`normalizer` and `analyzer` are mutually exclusive and cannot be specified together in the same index.
:::

## Managing Custom Normalizers

| Operation | SQL statement |
| --- | --- |
| View | `SHOW INVERTED INDEX NORMALIZER;` |
| Drop | `DROP INVERTED INDEX NORMALIZER IF EXISTS x_normalizer;` |

## Complete Example: Ignore Case and Accent Marks

**Scenario**: A product name field needs to support case-insensitive exact match that also ignores accent marks (for example, `Café-Products` and `cafe-products` are treated as the same value).

**Implementation steps**:

1. Create a custom token filter `my_ascii_folding` (used to remove accent marks).
2. Create a Normalizer `lowercase_ascii_normalizer` that combines the built-in `lowercase` filter with `my_ascii_folding` from the previous step.
3. Create the table and apply the Normalizer to the `product_name` field.
4. Verify the normalization result with the `tokenize` function.

**SQL example**:

```sql
-- 1. Create a custom token filter (when specific parameters are needed)
--    Here, create an ascii_folding filter
CREATE INVERTED INDEX TOKEN_FILTER IF NOT EXISTS my_ascii_folding
PROPERTIES
(
    "type" = "ascii_folding",
    "preserve_original" = "false"
);

-- 2. Create the normalizer
--    Combine lowercase (built-in) and my_ascii_folding
CREATE INVERTED INDEX NORMALIZER IF NOT EXISTS lowercase_ascii_normalizer
PROPERTIES
(
    "token_filter" = "lowercase, my_ascii_folding"
);

-- 3. Use the normalizer when creating a table
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

-- 4. Verification test
select tokenize('Café-Products', '"normalizer"="lowercase_ascii_normalizer"');
```

**Expected result**:

```json
[
    {"token":"cafe-products"}
]
```

As shown, `Café-Products` is processed as a single token (not split), and both lowercase conversion and accent removal are applied.

## Limitations

1. The names referenced in `char_filter` and `token_filter` must exist (either built-in or already created).
2. A Normalizer can be dropped only when no table is using it.
3. A `char_filter` or `token_filter` can be dropped only when no Normalizer references it.
4. After a custom normalizer statement is executed, it takes about 10 seconds to synchronize to the BE. Data ingested after that takes effect normally.
5. `normalizer` and `analyzer` cannot be specified together in the same inverted index.
