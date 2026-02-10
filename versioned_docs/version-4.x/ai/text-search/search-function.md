---
{
    "title": "SEARCH Function",
    "language": "en",
    "description": "The SEARCH function provides a concise DSL (domain‑specific language) for full‑text queries in Apache Doris from 4.0 version."
}
---

## Introduction

The `SEARCH` function provides a concise DSL (domain‑specific language) for full‑text queries in Apache Doris from 4.0 version. It simplifies common text search patterns into a unified query entry that runs on inverted indexes for high performance.


SEARCH is a boolean predicate function evaluated in the WHERE clause. It takes a SEARCH DSL string that describes text‑matching rules and pushes matchable predicates to inverted indexes.


## Syntax and Semantics

Syntax

```sql
SEARCH('<search_expression>')
SEARCH('<search_expression>', '<default_field>')
SEARCH('<search_expression>', '<default_field>', '<default_operator>')
```

- `<search_expression>` — string literal containing the SEARCH DSL expression.
- `<default_field>` *(optional)* — column name automatically applied to terms that do not specify a field.
- `<default_operator>` *(optional)* — default boolean operator for multi-term expressions; accepts `and` or `or` (case-insensitive). Defaults to `or`.

Usage

- Placement: use in the `WHERE` clause as a predicate.
- Return type: BOOLEAN (TRUE for matching rows).

When `default_field` is provided, Doris expands bare terms or functions to that field. For example, `SEARCH('foo bar', 'tags', 'and')` behaves like `SEARCH('tags:ALL(foo bar)')`, while `SEARCH('foo bark', 'tags')` expands to `tags:ANY(foo bark)`. Explicit boolean operators inside the DSL always take precedence over the default operator.

`SEARCH()` follows SQL three-valued logic. Rows where all referenced fields are NULL evaluate to UNKNOWN (filtered out in the `WHERE` clause) unless other predicates short-circuit the expression (`TRUE OR NULL = TRUE`, `FALSE OR NULL = NULL`, `NOT NULL = NULL`), matching the behavior of dedicated text search operators.

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

#### Phrase query
- Syntax: `column:"quoted phrase"`
- Semantics: matches contiguous tokens in order using the column's analyzer; quotes must wrap the entire phrase.
- Indexing tip: requires an inverted index configured with a tokenizer (`parser`) that preserves positional information.
```sql
SELECT id, title FROM search_test_basic
WHERE SEARCH('content:"machine learning"');
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

#### Wildcard query
- Syntax: `column:prefix*`, `column:*mid*`, `column:?ingle`
- Semantics: performs pattern matching with `*` (multi-character) and `?` (single-character) wildcards.
- Indexing tip: works on untokenized indexes and on tokenized indexes with `lower_case` when case-insensitive matching is required.
```sql
SELECT id, title FROM search_test_basic
WHERE SEARCH('firstname:Chris*');

-- Using the default field parameter
SELECT id, firstname FROM people
WHERE SEARCH('Chris*', 'firstname');
```

#### Regular expression query
- Syntax: `column:/regex/`
- Semantics: applies Lucene-style regular expression matching; slashes delimit the pattern.
- Indexing tip: only available on untokenized indexes.
```sql
SELECT id, title FROM corpus
WHERE SEARCH('title:/data.+science/');
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

-- Simplified syntax with default field/operator
SELECT id, tags
FROM tag_dataset
WHERE SEARCH('deep learning', 'tags', 'and'); -- expands to tags:ALL(deep learning)

-- Phrase and wildcard queries in one DSL
SELECT id, content FROM t
WHERE SEARCH('content:"deep learning" OR content:AI*')
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

- Range and list clauses (`field:[a TO b]`, `field:IN(...)`) still degrade to term lookups; rely on regular SQL predicates for numeric/date ranges or explicit `IN` filters.

Use standard operators or text search operators as alternatives when needed, for example:

```sql
-- Range filters via SQL
SELECT * FROM t WHERE created_at >= '2024-01-01';
```
