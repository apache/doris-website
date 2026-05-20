---
{
    "title": "SEARCH Function",
    "language": "en",
    "description": "The SEARCH function is the unified full-text search entry point provided by Apache Doris 4.0. It describes query conditions through a concise DSL expression and efficiently executes term, phrase, boolean, wildcard, and regex searches based on the inverted index."
}
---

<!-- Knowledge type: Function reference / Procedure -->
<!-- Use cases: Full-text search / Inverted index query / DSL expression authoring -->

The `SEARCH` function is the unified full-text search query entry point provided by Apache Doris starting from version 4.0. It describes query conditions through a concise DSL (domain-specific language) and executes them efficiently based on the inverted index.

`SEARCH` is a predicate function that returns a boolean value. It can appear as a filter condition in a `WHERE` clause. It accepts a SEARCH DSL string that describes text matching rules and pushes down matchable conditions to the inverted index for execution.

**Typical use cases:**

- Perform term, phrase, and boolean combination searches on text fields
- Run combined searches across multiple columns
- Use wildcards or regular expressions for pattern matching
- Perform structured text searches on VARIANT subcolumns
- Maintain compatibility with the Lucene/Elasticsearch query_string syntax style

## Syntax

### Basic Invocation Forms

```sql
SEARCH('<search_expression>')
SEARCH('<search_expression>', '<default_field>')
SEARCH('<search_expression>', '<default_field>', '<default_operator>')
```

**Parameter description:**

| Parameter | Required | Description |
| --- | --- | --- |
| `<search_expression>` | Required | The SEARCH DSL query expression (a string literal) |
| `<default_field>` | Optional | The column name automatically applied when terms in the DSL do not explicitly specify a field |
| `<default_operator>` | Optional | The default boolean operator for multi-term expressions. Only `and` or `or` is accepted (case insensitive). The default is `or` |

**Usage notes:**

- **Position**: Used in a `WHERE` clause as a predicate participating in row filtering
- **Return type**: BOOLEAN (TRUE on a match)

When `default_field` is provided, Doris automatically expands bare terms or functions to that field. For example:

- `SEARCH('foo bar', 'tags', 'and')` is equivalent to `SEARCH('tags:ALL(foo bar)')`
- `SEARCH('foo bar', 'tags')` expands to `tags:ANY(foo bar)`

Boolean operations that appear explicitly in the DSL have the highest precedence and override the default operator.

### Options Parameter (JSON Format)

The second parameter can also be a JSON string for advanced configuration:

```sql
SEARCH('<search_expression>', '<options_json>')
```

**Supported options:**

| Option | Type | Description |
| --- | --- | --- |
| `default_field` | string | The default column name used for terms without an explicitly specified field |
| `default_operator` | string | The default operator for multi-term expressions (`and` or `or`) |
| `mode` | string | `standard` (default) or `lucene` |
| `minimum_should_match` | integer | The minimum number of SHOULD clause matches (Lucene mode only) |

**Example:**

```sql
SELECT * FROM docs
WHERE SEARCH('apple banana',
             '{"default_field":"title","default_operator":"and","mode":"lucene"}');
```

### NULL and Three-Valued Logic

`SEARCH()` follows SQL three-valued logic:

- When all column values participating in the match are NULL, the result is UNKNOWN (filtered out in `WHERE`)
- When combined with other subexpressions, the result follows boolean short-circuit rules. For example:
    - `TRUE OR NULL = TRUE`
    - `FALSE OR NULL = NULL`
    - `NOT NULL = NULL`

This behavior is consistent with text search operators.

## Using SEARCH by Scenario

### Scenario 1: Single-Term Match

**Use case:** Search for documents that contain a specific term in a field.

- **Syntax:** `column:term`
- **Semantics:** Match the term against the tokenized result of the column. Whether matching is case sensitive depends on the index property `lower_case`
- **Index recommendation:** Create an inverted index on the column with an appropriate `parser`/`analyzer`

```sql
SELECT id, title FROM search_test_basic WHERE SEARCH('title:Machine');
SELECT id, title FROM search_test_basic WHERE SEARCH('title:Python');
SELECT id, title FROM search_test_basic WHERE SEARCH('category:Technology');
```

### Scenario 2: Multi-Term OR Match (ANY)

**Use case:** A match occurs when any term in a candidate list is hit, for example tag matching or combined keyword searches.

- **Syntax:** `column:ANY(term1 term2 ...)`
- **Semantics:** The tokenized result of the column contains any term in the list (OR semantics). Order does not matter, and duplicate terms are ignored
- **Index recommendation:** Create a tokenized inverted index on the column (such as `english`/`chinese`/`unicode`)

```sql
SELECT id, title FROM search_test_basic WHERE SEARCH('tags:ANY(python javascript)');
SELECT id, title FROM search_test_basic WHERE SEARCH('tags:ANY(machine learning tutorial)');

-- Edge case: a single-value ANY is equivalent to a term query
SELECT id, title FROM search_test_basic WHERE SEARCH('tags:ANY(python)');
```

### Scenario 3: Multi-Term AND Match (ALL)

**Use case:** Multiple terms must all be hit, for example strict topic filtering.

- **Syntax:** `column:ALL(term1 term2 ...)`
- **Semantics:** The tokenized result of the column contains all terms in the list at the same time (AND semantics). Order does not matter, and duplicate terms are ignored
- **Index recommendation:** Create a tokenized inverted index on the column (such as `english`/`chinese`/`unicode`)

```sql
SELECT id, title FROM search_test_basic WHERE SEARCH('tags:ALL(machine learning)');
SELECT id, title FROM search_test_basic WHERE SEARCH('tags:ALL(programming tutorial)');

-- Edge case: a single-value ALL is equivalent to a term query
SELECT id, title FROM search_test_basic WHERE SEARCH('tags:ALL(python)');
```

### Scenario 4: Boolean Combination Query

**Use case:** Multiple conditions need to be combined with AND/OR/NOT, for example "must contain A and not contain B".

- **Syntax:** `(expr) AND/OR/NOT (expr)`
- **Semantics:** Combine subexpressions inside SEARCH using `AND`, `OR`, and `NOT`
- **Index recommendation:** Place matchable conditions inside SEARCH whenever possible to obtain index pushdown. Use other WHERE conditions for additional filtering

```sql
SELECT id, title FROM search_test_basic
WHERE SEARCH('title:Machine AND category:Technology');

SELECT id, title FROM search_test_basic
WHERE SEARCH('title:Python OR title:Data');

SELECT id, title FROM search_test_basic
WHERE SEARCH('category:Technology AND NOT title:Machine');
```

### Scenario 5: Complex Nested Expressions

**Use case:** Use parentheses to control boolean precedence and construct multi-level nested filter conditions.

- **Syntax:** Use parentheses to group expressions, such as `(expr1 OR expr2) AND expr3`
- **Semantics:** Control boolean precedence with parentheses. Multi-level nesting is supported
- **Index recommendation:** Same as boolean combination queries

```sql
SELECT id, title FROM search_test_basic
WHERE SEARCH('(title:Machine OR title:Python) AND category:Technology');

SELECT id, title FROM search_test_basic
WHERE SEARCH('tags:ANY(python javascript) AND (category:Technology OR category:Programming)');
```

### Scenario 6: Lucene/Elasticsearch Syntax Compatibility

**Use case:** Migrating from Elasticsearch, or wishing to write expressions following the Lucene query_string semantics.

Lucene mode emulates the query_string behavior of Elasticsearch/Lucene. Boolean operators work as left-to-right modifiers rather than traditional boolean algebra.

**Main differences from standard mode:**

- AND/OR/NOT are modifiers that affect adjacent terms
- Operator precedence is left to right
- MUST/SHOULD/MUST_NOT are used internally (similar to Lucene's Occur enum)
- A pure NOT query returns an empty result (a positive clause is required)

**Enable Lucene mode:**

```sql
-- Basic Lucene mode
SELECT * FROM docs
WHERE SEARCH('apple AND banana',
             '{"default_field":"title","mode":"lucene"}');

-- Use minimum_should_match
SELECT * FROM docs
WHERE SEARCH('apple AND banana OR cherry',
             '{"default_field":"title","mode":"lucene","minimum_should_match":1}');
```

**Behavior comparison:**

| Query | Standard mode | Lucene mode |
| --- | --- | --- |
| `a AND b` | a ∩ b | +a +b (both MUST) |
| `a OR b` | a ∪ b | a b (both SHOULD, min=1) |
| `NOT a` | ¬a | Empty result (no positive clause) |
| `a AND NOT b` | a ∩ ¬b | +a -b (MUST a, MUST_NOT b) |
| `a AND b OR c` | (a ∩ b) ∪ c | +a b c (only a is MUST) |

> **Note:** In Lucene mode, `a AND b OR c` is parsed from left to right: the OR operator changes `b` from MUST to SHOULD. Use `minimum_should_match` to require SHOULD clauses to match.

### Scenario 7: Phrase Query

**Use case:** Search for a contiguous and ordered phrase, for example requiring "machine learning" to appear in order.

- **Syntax:** `column:"quoted phrase"`
- **Semantics:** Match contiguous and ordered terms according to the column's analyzer. The full phrase must be wrapped in double quotes
- **Index recommendation:** The target column must use a tokenized inverted index that carries position information (configured with `parser`)

```sql
SELECT id, title FROM search_test_basic
WHERE SEARCH('content:"machine learning"');
```

### Scenario 8: Combined Search Across Multiple Columns

**Use case:** A single query covers multiple fields, for example returning rows that match the title, tags, or author.

- **Syntax:** `column1:term OR column2:ANY(...) OR ...`
- **Semantics:** Match across multiple columns within a single expression. Each column applies its own index/tokenizer configuration
- **Index recommendation:** Build an appropriate inverted index on each column involved

```sql
SELECT id, title FROM search_test_basic
WHERE SEARCH('title:Python OR tags:ANY(database mysql) OR author:Alice');

SELECT id, title FROM search_test_basic
WHERE SEARCH('tags:ALL(tutorial) AND category:Technology');
```

### Scenario 9: Wildcard Query

**Use case:** Prefix, suffix, or contains matching, for example searching for all names that start with "Chris".

- **Syntax:** `column:prefix*`, `column:*mid*`, `column:?ingle`
- **Semantics:** Use `*` to match a string of any length and `?` to match a single character
- **Index recommendation:** Suitable for non-tokenized indexes. Can also be used on tokenized indexes with `lower_case` enabled to obtain case-insensitive matching

```sql
SELECT id, title FROM search_test_basic
WHERE SEARCH('firstname:Chris*');

-- Combine with the default field parameter
SELECT id, firstname FROM people
WHERE SEARCH('Chris*', 'firstname');
```

### Scenario 10: Regular Expression Query

**Use case:** Use Lucene-style regular expressions for complex pattern matching.

- **Syntax:** `column:/regex/`
- **Semantics:** Match using Lucene-style regular expressions, with the pattern wrapped in slashes
- **Index recommendation:** Only non-tokenized inverted indexes are supported

```sql
SELECT id, title FROM corpus
WHERE SEARCH('title:/data.+science/');
```

### Scenario 11: Strict Equality Match (EXACT)

**Use case:** Exactly match the full original value of a column. Case sensitive, with no tokenization.

- **Syntax:** `column:EXACT(text)`
- **Semantics:** Perform exact matching against the full column value. Case sensitive. Does not match partial terms
- **Index recommendation:** Build a non-tokenized inverted index on the column as well (without setting `parser`) to accelerate EXACT

```sql
SELECT id
FROM t
WHERE SEARCH('content:EXACT(machine learning)');
```

### Scenario 12: VARIANT Subcolumn Query

**Use case:** Search a specific subpath within a semi-structured VARIANT field.

- **Syntax:** `variant_col.sub.path:term`
- **Semantics:** Access a VARIANT subcolumn through a dotted path for matching. The matching behavior follows the index/analyzer configuration on the VARIANT column
- **Supported capabilities:** Boolean combination, `ANY`/`ALL`, nested paths. Nonexistent subcolumns do not return matches

```sql
SELECT id
FROM test_variant_search_subcolumn
WHERE SEARCH('properties.message:alpha');
```

## Complete Example

The following comprehensive example demonstrates how to build both tokenized and non-tokenized indexes on the same column, and how to combine EXACT, ANY/ALL, phrase, and wildcard queries.

### Create the Table and Base Indexes

```sql
-- Build both tokenized and non-tokenized inverted indexes
CREATE TABLE t (
    id INT,
    content STRING,
    INDEX idx_untokenized(content) USING INVERTED,
    INDEX idx_tokenized(content)  USING INVERTED PROPERTIES("parser" = "standard")
);
```

### Comparing EXACT and Tokenized Queries

```sql
-- Strict equality match (uses the non-tokenized index)
SELECT id, content
FROM t
WHERE SEARCH('content:EXACT(machine learning)')
ORDER BY id;

-- EXACT does not match partial terms
SELECT id, content
FROM t
WHERE SEARCH('content:EXACT(machine)')
ORDER BY id;

-- ANY/ALL use the tokenized index
SELECT id, content FROM t WHERE SEARCH('content:ANY(machine learning)') ORDER BY id;
SELECT id, content FROM t WHERE SEARCH('content:ALL(machine learning)') ORDER BY id;

-- Compare EXACT and ANY
SELECT id, content FROM t WHERE SEARCH('content:EXACT(deep learning)') ORDER BY id;
SELECT id, content FROM t WHERE SEARCH('content:ANY(deep learning)') ORDER BY id;
```

### Combined Conditions and Simplified Forms

```sql
-- Combined conditions
SELECT id, content
FROM t
WHERE SEARCH('content:EXACT(machine learning) OR content:ANY(intelligence)')
ORDER BY id;

-- Simplified form using a default field and default operator
SELECT id, tags
FROM tag_dataset
WHERE SEARCH('deep learning', 'tags', 'and'); -- Automatically expands to tags:ALL(deep learning)

-- Use a phrase and a wildcard together
SELECT id, content FROM t
WHERE SEARCH('content:"deep learning" OR content:AI*')
ORDER BY id;
```

### VARIANT Column Search Example

```sql
-- A VARIANT column with an inverted index
CREATE TABLE test_variant_search_subcolumn (
    id BIGINT,
    properties VARIANT<PROPERTIES("variant_max_subcolumns_count"="0")>,
    INDEX idx_properties (properties) USING INVERTED PROPERTIES (
        "parser" = "unicode",
        "lower_case" = "true",
        "support_phrase" = "true"
    )
);

-- Single-term query
SELECT id
FROM test_variant_search_subcolumn
WHERE SEARCH('properties.message:alpha')
ORDER BY id;

-- AND / ALL queries
SELECT id
FROM test_variant_search_subcolumn
WHERE SEARCH('properties.message:alpha AND properties.message:beta')
ORDER BY id;

SELECT id
FROM test_variant_search_subcolumn
WHERE SEARCH('properties.message:ALL(alpha beta)')
ORDER BY id;

-- OR query across different subcolumns
SELECT id
FROM test_variant_search_subcolumn
WHERE SEARCH('properties.message:hello OR properties.category:beta')
ORDER BY id;
```

## Escape Characters

Use a backslash (`\`) to escape special characters in the DSL:

| Escape | Description | Example |
| --- | --- | --- |
| `\ ` | Literal space (joins terms) | `title:First\ Value` matches "First Value" |
| `\(` `\)` | Literal parentheses | `title:hello\(world\)` matches "hello(world)" |
| `\:` | Literal colon | `title:key\:value` matches "key:value" |
| `\\` | Literal backslash | `title:path\\to\\file` matches "path\to\file" |

**Examples:**

```sql
-- Search for a value containing a space as a single term
SELECT * FROM docs WHERE SEARCH('title:First\\ Value');

-- Search for a value containing parentheses
SELECT * FROM docs WHERE SEARCH('title:hello\\(world\\)');

-- Search for a value containing a colon
SELECT * FROM docs WHERE SEARCH('title:key\\:value');
```

> **Note:** In a SQL string, backslashes need to be double-escaped. Using `\\` in SQL produces a single `\` in the DSL.

## Current Limitations

- Range and list clauses (such as `field:[a TO b]` and `field:IN(...)`) still fall back to ordinary term matching. Use regular SQL range or `IN` filters instead.

You can use standard operators or text search operators as alternatives:

```sql
-- Filter by range using SQL
SELECT * FROM t WHERE created_at >= '2024-01-01';
```
