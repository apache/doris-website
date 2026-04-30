---
{
    "title": "Full-Text Search and Query Acceleration Operators",
    "language": "en",
    "description": "Reference for full-text search and query acceleration operators supported by Apache Doris inverted index: 8 search operators including MATCH_ANY/ALL/PHRASE/REGEXP cover keyword, phrase, prefix, and regex scenarios, and accelerate equality, range, and array structured queries."
}
---

<!-- Knowledge type: Operator reference / Usage examples -->
<!-- Applicable scenarios: Full-text search query authoring / Inverted index query acceleration -->

This document introduces the query operators supported by Apache Doris inverted index, in two categories:

- **Full-text search operators**: For fuzzy matching scenarios on text fields, such as keywords, phrases, prefixes, and regex.
- **Inverted index query acceleration**: For precise filtering scenarios on structured fields, such as equality, range, set, and array.

## Full-Text Search Operators

The following table lists all full-text search operators and their typical use cases:

| Operator | Typical Scenario | Matching Rule |
|------|----------|----------|
| `MATCH_ANY` | Keyword "OR" search | Matches if any keyword is hit |
| `MATCH_ALL` | Keyword "AND" search | Must hit all keywords |
| `MATCH_PHRASE` | Strict phrase search | Terms are adjacent and in the same order |
| `MATCH_PHRASE` (with slop) | Fault-tolerant phrase search | Allows gaps between terms |
| `MATCH_PHRASE` (strict order) | Phrase search with fixed term order | Term order is fixed within the gap range |
| `MATCH_PHRASE_PREFIX` | Input suggestion / prefix completion | Last term matches by prefix |
| `MATCH_REGEXP` | Term-level regex matching | Applies regex to tokenized results |
| `MATCH_PHRASE_EDGE` | Multi-edge fuzzy matching | First-term suffix + middle exact + last-term prefix |

### Keyword Search: MATCH_ANY / MATCH_ALL

Suitable for the scenario "given several keywords, find documents that contain these words."

- **MATCH_ANY**: Matches rows that contain any of the keywords.

    ```sql
    SELECT * FROM table_name WHERE content MATCH_ANY 'keyword1 keyword2';
    ```

- **MATCH_ALL**: Matches rows that contain all of the keywords simultaneously.

    ```sql
    SELECT * FROM table_name WHERE content MATCH_ALL 'keyword1 keyword2';
    ```

### Phrase Search: MATCH_PHRASE Family

Suitable for precise phrase matching scenarios where "keywords need to be adjacent or maintain term order."

#### Strict Phrase Matching

Requires terms to be adjacent and in the same order. To enable index acceleration, set `"support_phrase" = "true"` in the index properties.

```sql
SELECT * FROM table_name WHERE content MATCH_PHRASE 'keyword1 keyword2';
```

#### Phrase Matching with Slop

Allows up to `slop` words between keywords, and term order can vary.

```sql
-- Allow up to 3 words between keyword1 and keyword2
SELECT * FROM table_name WHERE content MATCH_PHRASE 'keyword1 keyword2 ~3';
```

#### Strict-Order Phrase Matching

Combines `+` with slop to require a fixed term order.

```sql
SELECT * FROM table_name WHERE content MATCH_PHRASE 'keyword1 keyword2 ~3+';
```

### Prefix and Edge Matching

Suitable for scenarios such as "input suggestion" and "prefix/suffix fuzzy matching."

#### MATCH_PHRASE_PREFIX

Phrase matching where the last word matches by prefix. When only a single word is given, this degenerates into a prefix match for that word.

```sql
-- The last word matches by prefix
SELECT * FROM table_name WHERE content MATCH_PHRASE_PREFIX 'keyword1 key';

-- A single word degenerates into a prefix match
SELECT * FROM table_name WHERE content MATCH_PHRASE_PREFIX 'keyword1';
```

#### MATCH_PHRASE_EDGE

Edge phrase matching, with the following matching rules:

- The first word matches by **suffix**
- Middle words match by **exact match**
- The last word matches by **prefix**
- Terms must be adjacent

```sql
SELECT * FROM table_name WHERE content MATCH_PHRASE_EDGE 'search engine optim';
```

### Regex Matching: MATCH_REGEXP

Performs regex matching on tokenized terms.

```sql
SELECT * FROM table_name WHERE content MATCH_REGEXP '^key_word.*';
```

## Specifying an Analyzer with USING ANALYZER

When multiple inverted indexes using different analyzers are created on a single column, you can use the `USING ANALYZER` clause to specify which analyzer to use at query time.

### Syntax

```sql
SELECT * FROM table_name WHERE column MATCH 'keywords' USING ANALYZER analyzer_name;
```

### Supported Operators

All MATCH operators support the `USING ANALYZER` clause:

- `MATCH` / `MATCH_ANY`
- `MATCH_ALL`
- `MATCH_PHRASE`
- `MATCH_PHRASE_PREFIX`
- `MATCH_PHRASE_EDGE`
- `MATCH_REGEXP`

### Built-in Analyzers

| Name | Description |
|------|------|
| `none` | Exact match, no tokenization |
| `standard` | Standard tokenization |
| `chinese` | Chinese tokenization |

### Usage Examples

```sql
-- Use the standard analyzer (tokenizes the text)
SELECT * FROM articles WHERE content MATCH 'hello world' USING ANALYZER std_analyzer;

-- Use the keyword analyzer (exact match, no tokenization)
SELECT * FROM articles WHERE content MATCH 'hello world' USING ANALYZER kw_analyzer;

-- Combined with MATCH_PHRASE
SELECT * FROM articles WHERE content MATCH_PHRASE 'hello world' USING ANALYZER std_analyzer;

-- Use built-in analyzers
SELECT * FROM articles WHERE content MATCH 'hello' USING ANALYZER standard;
SELECT * FROM articles WHERE content MATCH 'hello' USING ANALYZER none;
```

### Notes

- If the index for the specified analyzer has not been built, the query automatically falls back to the non-index path (results are correct, but performance is slower).
- If no analyzer is specified, the system uses any available index.

## Inverted Index Query Acceleration

In addition to full-text search, inverted index can also accelerate precise filtering on structured fields. The supported operators and functions are as follows:

| Category | Operator / Function |
|------|---------------|
| Equality and set | `=`, `!=`, `IN`, `NOT IN` |
| Range | `>`, `>=`, `<`, `<=`, `BETWEEN` |
| Null check | `IS NULL`, `IS NOT NULL` |
| Array | `array_contains`, `array_overlaps` |

Usage examples:

```sql
-- Range query
SELECT * FROM t WHERE price >= 100 AND price < 200;

-- Set query
SELECT * FROM t WHERE tags IN ('a', 'b', 'c');

-- Array query
SELECT * FROM t WHERE array_contains(attributes, 'color');
```
