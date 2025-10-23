---
{
"title": "SEARCH Function",
    "language": "en"
}
---

## Introduction

The `SEARCH` function provides a concise DSL (domain‑specific language) for full‑text queries in Apache Doris from 4.0 version. It simplifies common text search patterns into a unified query entry that runs on inverted indexes for high performance.


SEARCH is a boolean predicate function evaluated in the WHERE clause. It takes a SEARCH DSL string that describes text‑matching rules and pushes matchable predicates to inverted indexes.


## Syntax and Semantics

Syntax

```sql
SEARCH('<search_expression>')
```

- Argument: `<search_expression>` — string literal containing the SEARCH DSL expression

Usage

- Placement: use in the `WHERE` clause as a predicate
- Return type: BOOLEAN (TRUE for matching rows)

### Current Supported Queries

#### Term query
- Syntax: `column:term`
- Semantics: match the term in the column's token stream; case sensitivity depends on index `lower_case`
- Indexing tip: add an inverted index with an appropriate `parser`/analyzer on the column
```sql
SELECT id, title FROM search_test_basic WHERE SEARCH('title:Machine');
SELECT id, title FROM search_test_basic WHERE SEARCH('title:Python');
SELECT id, title FROM search_test_basic WHERE SEARCH('category:Technology');
```

#### ANY
- Syntax: `column:ANY(term1 term2 ...)`
- Semantics: matches if any listed term is present in the column (OR); order-insensitive; duplicates ignored
- Indexing tip: use a tokenized inverted index (e.g., `english`/`chinese`/`unicode` parser)
```sql
SELECT id, title FROM search_test_basic WHERE SEARCH('tags:ANY(python javascript)');
SELECT id, title FROM search_test_basic WHERE SEARCH('tags:ANY(machine learning tutorial)');

-- Edge case: single value behaves like a term query
SELECT id, title FROM search_test_basic WHERE SEARCH('tags:ANY(python)');
```

#### ALL
- Syntax: `column:ALL(term1 term2 ...)`
- Semantics: requires all listed terms be present (AND); order-insensitive; duplicates ignored
- Indexing tip: use a tokenized inverted index (e.g., `english`/`chinese`/`unicode` parser)
```sql
SELECT id, title FROM search_test_basic WHERE SEARCH('tags:ALL(machine learning)');
SELECT id, title FROM search_test_basic WHERE SEARCH('tags:ALL(programming tutorial)');

-- Edge case: single value behaves like a term query
SELECT id, title FROM search_test_basic WHERE SEARCH('tags:ALL(python)');
```

#### Boolean operators
- Syntax: `(expr) AND/OR/NOT (expr)`
- Semantics: combine sub-expressions inside SEARCH using boolean operators
- Indexing tip: keep matchable conditions inside SEARCH for pushdown; other WHERE predicates act as filters
```sql
SELECT id, title FROM search_test_basic
WHERE SEARCH('title:Machine AND category:Technology');

SELECT id, title FROM search_test_basic
WHERE SEARCH('title:Python OR title:Data');

SELECT id, title FROM search_test_basic
WHERE SEARCH('category:Technology AND NOT title:Machine');
```

#### Grouping and nesting
- Syntax: parenthesized sub-expressions
- Semantics: control precedence with parentheses; multi-level nesting is supported
- Indexing tip: same as above
```sql
SELECT id, title FROM search_test_basic
WHERE SEARCH('(title:Machine OR title:Python) AND category:Technology');

SELECT id, title FROM search_test_basic
WHERE SEARCH('tags:ANY(python javascript) AND (category:Technology OR category:Programming)');
```

#### Multi‑column search
- Syntax: `column1:term OR column2:ANY(...) OR ...`
- Semantics: search across multiple columns; each column follows its own index/analyzer configuration
- Indexing tip: add inverted indexes for each involved column
```sql
SELECT id, title FROM search_test_basic
WHERE SEARCH('title:Python OR tags:ANY(database mysql) OR author:Alice');

SELECT id, title FROM search_test_basic
WHERE SEARCH('tags:ALL(tutorial) AND category:Technology');
```

#### EXACT query

- Pattern: `column:EXACT(<text>)`
- Semantics: exact match on the entire column value; case‑sensitive; does not match partial tokens
- Indexing tip: use an untokenized inverted index on the column (no `parser`) for best performance

Example:

```sql
SELECT id
FROM t
WHERE SEARCH('content:EXACT(machine learning)');
```

#### Variant subcolumn query

- Pattern: `variant_col.sub.path:term`
- Semantics: query a VARIANT subcolumn using dot notation; matching follows the index/analyzer configured on the VARIANT column
- Supports boolean combinations, `ANY`/`ALL`, nested paths; nonexistent subcolumns simply produce no matches

Example:

```sql
SELECT id
FROM test_variant_search_subcolumn
WHERE SEARCH('properties.message:alpha');
```

### Examples

```sql
-- Table with both tokenized and untokenized indexes
CREATE TABLE t (
  id INT,
  content STRING,
  INDEX idx_untokenized(content) USING INVERTED,
  INDEX idx_tokenized(content)  USING INVERTED PROPERTIES("parser" = "standard")
);

-- Exact string match (uses untokenized index)
SELECT id, content
FROM t
WHERE SEARCH('content:EXACT(machine learning)')
ORDER BY id;

-- No match for partial token with EXACT
SELECT id, content
FROM t
WHERE SEARCH('content:EXACT(machine)')
ORDER BY id;

-- ANY/ALL use tokenized index
SELECT id, content FROM t WHERE SEARCH('content:ANY(machine learning)') ORDER BY id;
SELECT id, content FROM t WHERE SEARCH('content:ALL(machine learning)') ORDER BY id;

-- Compare EXACT vs ANY
SELECT id, content FROM t WHERE SEARCH('content:EXACT(deep learning)') ORDER BY id;
SELECT id, content FROM t WHERE SEARCH('content:ANY(deep learning)') ORDER BY id;

-- Mixed conditions
SELECT id, content
FROM t
WHERE SEARCH('content:EXACT(machine learning) OR content:ANY(intelligence)')
ORDER BY id;

-- VARIANT column with inverted index
CREATE TABLE test_variant_search_subcolumn (
  id BIGINT,
  properties VARIANT<PROPERTIES("variant_max_subcolumns_count"="0")>,
  INDEX idx_properties (properties) USING INVERTED PROPERTIES (
    "parser" = "unicode",
    "lower_case" = "true",
    "support_phrase" = "true"
  )
);

-- Single term
SELECT id
FROM test_variant_search_subcolumn
WHERE SEARCH('properties.message:alpha')
ORDER BY id;

-- AND / ALL
SELECT id
FROM test_variant_search_subcolumn
WHERE SEARCH('properties.message:alpha AND properties.message:beta')
ORDER BY id;

SELECT id
FROM test_variant_search_subcolumn
WHERE SEARCH('properties.message:ALL(alpha beta)')
ORDER BY id;

-- OR across different subcolumns
SELECT id
FROM test_variant_search_subcolumn
WHERE SEARCH('properties.message:hello OR properties.category:beta')
ORDER BY id;
```

### Current Limitations

- Phrase, prefix, wildcard, and regular expression queries are not yet supported in `SEARCH()`
- Range/list queries are not yet supported in `SEARCH()`
- Unsupported patterns may fall back to term queries

Use standard operators or text search operators as alternatives when needed, for example:

```sql
-- Phrase search via operator
SELECT * FROM t WHERE content MATCH_PHRASE 'full text search';

-- Range filters via SQL
SELECT * FROM t WHERE created_at >= '2024-01-01';
```
