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
