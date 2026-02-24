---
{
    "title": "Full-Text Search and Query Acceleration Support",
    "language": "en",
    "description": "Comprehensive guide to full-text search operators (MATCH_ANY, MATCH_ALL, MATCH_PHRASE, MATCH_REGEXP) and inverted index query acceleration for optimizing text search and structured data queries in database systems with practical SQL examples."
}
---

## Full-Text Search Operators

### MATCH_ANY
- Matches rows containing any of the specified keywords in a field.
```sql
SELECT * FROM table_name WHERE content MATCH_ANY 'keyword1 keyword2';
```

### MATCH_ALL
- Matches rows containing all specified keywords in a field.
```sql
SELECT * FROM table_name WHERE content MATCH_ALL 'keyword1 keyword2';
```

### MATCH_PHRASE
- Phrase match where terms appear adjacent and in order.
- Requires index property `"support_phrase" = "true"` for acceleration.
```sql
SELECT * FROM table_name WHERE content MATCH_PHRASE 'keyword1 keyword2';
```

### MATCH_PHRASE with slop
- Loose phrase matching that allows gaps between terms up to a maximum distance.
```sql
-- Allow up to 3 terms between keyword1 and keyword2
SELECT * FROM table_name WHERE content MATCH_PHRASE 'keyword1 keyword2 ~3';
```

### MATCH_PHRASE with strict order
- Combine slop with strict order using `+` to enforce term order.
```sql
SELECT * FROM table_name WHERE content MATCH_PHRASE 'keyword1 keyword2 ~3+';
```

### MATCH_PHRASE_PREFIX
- Phrase match where the last term uses prefix matching.
- With a single term, it degrades to prefix matching for that term.
```sql
-- Last term as prefix
SELECT * FROM table_name WHERE content MATCH_PHRASE_PREFIX 'keyword1 key';

-- Single-term prefix match
SELECT * FROM table_name WHERE content MATCH_PHRASE_PREFIX 'keyword1';
```

### MATCH_REGEXP
- Regular expression match on the tokenized terms of a field.
```sql
SELECT * FROM table_name WHERE content MATCH_REGEXP '^key_word.*';
```

### MATCH_PHRASE_EDGE
- Treats the first term as suffix-match, middle terms as exact, last term as prefix-match; terms must be adjacent.
```sql
SELECT * FROM table_name WHERE content MATCH_PHRASE_EDGE 'search engine optim';
```

### Specifying Analyzer with USING ANALYZER

When a column has multiple inverted indexes with different analyzers, use the `USING ANALYZER` clause to specify which analyzer to use for the query.

**Syntax:**
```sql
SELECT * FROM table_name WHERE column MATCH 'keywords' USING ANALYZER analyzer_name;
```

**Supported Operators:**
All MATCH operators support the `USING ANALYZER` clause:
- MATCH / MATCH_ANY
- MATCH_ALL
- MATCH_PHRASE
- MATCH_PHRASE_PREFIX
- MATCH_PHRASE_EDGE
- MATCH_REGEXP

**Examples:**
```sql
-- Use standard analyzer (tokenizes text into words)
SELECT * FROM articles WHERE content MATCH 'hello world' USING ANALYZER std_analyzer;

-- Use keyword analyzer (exact match, no tokenization)
SELECT * FROM articles WHERE content MATCH 'hello world' USING ANALYZER kw_analyzer;

-- Use with MATCH_PHRASE
SELECT * FROM articles WHERE content MATCH_PHRASE 'hello world' USING ANALYZER std_analyzer;

-- Use built-in analyzers
SELECT * FROM articles WHERE content MATCH 'hello' USING ANALYZER standard;
SELECT * FROM articles WHERE content MATCH 'hello' USING ANALYZER none;
```

**Notes:**
- If the specified analyzer's index is not built, the query automatically falls back to non-index path (correct results, slower performance)
- If no analyzer is specified, the system uses any available index
- Built-in analyzer names: `none` (exact match), `standard`, `chinese`

## Inverted Index Query Acceleration

### Supported Operators and Functions

- Equality and set: `=`, `!=`, `IN`, `NOT IN`
- Range: `>`, `>=`, `<`, `<=`, `BETWEEN`
- Null checks: `IS NULL`, `IS NOT NULL`
- Arrays: `array_contains`, `array_overlaps`

```sql
-- Examples
SELECT * FROM t WHERE price >= 100 AND price < 200;          -- range
SELECT * FROM t WHERE tags IN ('a','b','c');                  -- set
SELECT * FROM t WHERE array_contains(attributes, 'color');    -- arrays
```
