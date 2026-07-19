---
{
    "title": "Inverted Index (Text Search)",
    "sidebar_label": "Overview",
    "language": "en",
    "description": "Doris text search is based on inverted indexes and supports full-text search, phrase matching, regex matching, custom tokenization, and BM25 relevance scoring. It can be combined with vector search for hybrid retrieval scenarios such as RAG."
}
---

<!-- Knowledge type: Feature introduction + Quick start -->
<!-- Applicable scenarios: Keyword search / Phrase matching / RAG hybrid retrieval / Relevance ranking -->

Text search retrieves documents that contain specific terms or phrases from a dataset and ranks the results by relevance.

| Retrieval method | Strength | Applicable scenarios |
|----------|------|----------|
| Text search | "Find precisely": controllable, explainable exact matching that ensures deterministic keyword hits and filter conditions | Keyword search, phrase matching, boolean filtering |
| Vector search | "Find broadly": uses semantic similarity to expand the recall range | Semantic search, approximate matching |

In generative AI applications, especially in retrieval-augmented generation (RAG) scenarios, text search and vector search complement each other:

- Balance semantic breadth with lexical precision
- Improve recall while ensuring accuracy and explainability of results
- Together build a reliable retrieval foundation that provides more accurate and relevant context for large language models

## Evolution of text search in Doris

Starting from version 2.0.0, Doris introduced the inverted index to support high-performance full-text search. As retrieval scenarios diversified and query complexity increased, Doris has continued to expand its text search capabilities in subsequent releases.

| Stage | Version | Key capabilities |
|------|------|----------|
| Foundation stage | 2.0+ | Introduced column-level inverted indexes; provided basic full-text search operators (`MATCH_ANY`, `MATCH_ALL`) and multi-language tokenizers, supporting efficient keyword search on large-scale datasets |
| Feature expansion | 2.x to 3.x | Enhanced the operator system, added advanced operators such as phrase matching (`MATCH_PHRASE`), prefix search (`MATCH_PHRASE_PREFIX`), and regex matching (`MATCH_REGEXP`); version 3.1 introduced custom tokenization |
| Capability enhancement | 4.0+ | Introduced BM25 relevance scoring and the unified query entry point `SEARCH` function, supporting text relevance ranking and hybrid ranking |

The core enhancements in 4.0+ include:

- **BM25 relevance scoring**: The `score()` function ranks results by text relevance and can be combined with vector similarity scores to enable hybrid ranking.
- **SEARCH function**: Provides a unified query DSL that supports cross-column queries and boolean logic combinations, simplifying the construction of complex queries while further improving query performance.

---

## Core text search features in Doris

### 1. Rich text operators

Doris provides a set of full-text search operators that cover multiple retrieval patterns, satisfying needs ranging from basic keyword matching to complex phrase queries.

Main operators supported in the current version:

| Operator | Description | Typical scenarios |
|------|------|----------|
| `MATCH_ANY` / `MATCH_ALL` | Any-term match (OR) and all-term match (AND) | General keyword search |
| `MATCH_PHRASE` | Exact phrase match, with support for custom slop and order control | Proximity word queries |
| `MATCH_PHRASE_PREFIX` | Phrase prefix match | Auto-completion, incremental search |
| `MATCH_REGEXP` | Matching based on regular expressions | Pattern-based text retrieval |

These operators can be used independently or combined through the `SEARCH()` function to build complex logical queries. For example (the `docs` table referenced here is the one created in the [Quick start](#quick-start) section below):

```sql
-- Exact phrase search
SELECT * FROM docs WHERE content MATCH_PHRASE 'inverted index';

-- Prefix search
SELECT * FROM docs WHERE content MATCH_PHRASE_PREFIX 'data ware';
```

[View all operators](./search-operators.md)

---

### 2. Custom tokenization (3.1+)

In text search, the tokenization method directly determines retrieval precision and recall. Starting from version 3.1, Doris supports **custom analyzers**, allowing you to flexibly define the tokenization pipeline based on business needs.

Custom tokenization achieves fine-grained text control by combining the following three types of components:

- **Character filter (char_filter)**: Replaces, removes, or normalizes symbols before tokenization
- **Tokenizer (tokenizer)**: Selects the tokenization algorithm. Supports types such as `standard`, `ngram`, `edge_ngram`, `keyword`, and `icu` for processing text in different languages and structures
- **Token filter (token_filter)**: For example, `lowercase`, `word_delimiter`, and `ascii_folding`, used to normalize and refine tokenization results

```sql
-- Example: Define a custom analyzer
CREATE INVERTED INDEX ANALYZER IF NOT EXISTS keyword_lowercase
PROPERTIES (
    "tokenizer" = "keyword",
    "token_filter" = "asciifolding, lowercase"
);

-- Use the custom analyzer when creating a table
CREATE TABLE docs (
    id BIGINT,
    content TEXT,
    INDEX idx_content (content) USING INVERTED PROPERTIES(
        "analyzer" = "keyword_lowercase",
        "support_phrase" = "true"
    )
);
```

[Learn about custom tokenization](./custom-analyzer.md)

---

### 3. BM25 relevance scoring (4.0+)

Doris implements the **BM25 (Best Matching 25)** algorithm for text relevance computation, providing ranking and scoring capabilities for full-text search.

Core characteristics of BM25:

- A probabilistic model based on term frequency (TF), inverse document frequency (IDF), and document length
- Robust for both short and long texts
- Weighting strategy can be tuned through the `k1` and `b` parameters

```sql
SELECT id, title, score() AS relevance
FROM docs
WHERE content MATCH_ANY 'real-time OLAP analytics'
ORDER BY relevance DESC
LIMIT 10;
```

[Learn more about the scoring mechanism](./scoring.md)

---

### 4. SEARCH function: unified query entry point (4.0+)

The `SEARCH()` function provides a unified syntax entry point for text retrieval, supporting multi-column search and boolean logic combinations, which makes complex queries more concise to express:

```sql
SELECT id, title, score() AS relevance
FROM docs
WHERE SEARCH('title:Machine AND tags:ANY(database sql)')
ORDER BY relevance DESC
LIMIT 20;
```

[Complete SEARCH function guide](./search-function.md)

---

## Quick start

### Step 1: Create a table with inverted indexes

```sql
CREATE TABLE docs (
    id BIGINT,
    title STRING,
    content STRING,
    category STRING,
    tags ARRAY<STRING>,
    created_at DATETIME,
    -- Text search indexes
    INDEX idx_title(title) USING INVERTED PROPERTIES ("parser" = "chinese"),
    INDEX idx_content(content) USING INVERTED PROPERTIES ("parser" = "chinese", "support_phrase" = "true"),
    INDEX idx_category(category) USING INVERTED,
    INDEX idx_tags(tags) USING INVERTED
)
DUPLICATE KEY(id)
DISTRIBUTED BY HASH(id) BUCKETS 10
PROPERTIES ("replication_num" = "1");
```

### Step 2: Run text queries

```sql
-- Simple keyword search
SELECT * FROM docs WHERE content MATCH_ANY 'apache doris';

-- Phrase search
SELECT * FROM docs WHERE content MATCH_PHRASE 'full-text search';

-- Boolean query with SEARCH
SELECT * FROM docs
WHERE SEARCH('title:apache AND (category:database OR tags:ANY(sql nosql))');

-- Relevance-based ranking
SELECT id, title, score() AS relevance
FROM docs
WHERE content MATCH_ANY 'real-time analytics OLAP'
ORDER BY relevance DESC
LIMIT 10;
```

## Hybrid search: text + vector

In RAG applications, combining text search with vector similarity enables more comprehensive retrieval:

```sql
-- Hybrid retrieval: semantic similarity + keyword filtering
SELECT id, title, score() AS text_relevance
FROM docs
WHERE
    -- Vector filter for semantic similarity
    cosine_distance(embedding, [0.1, 0.2, ...]) < 0.3
    -- Text filter for keyword constraints
    AND SEARCH('title:search AND content:engine AND category:technology')
ORDER BY text_relevance DESC
LIMIT 10;
```

## Managing inverted indexes

### Create an index

```sql
-- Create at table creation time
CREATE TABLE t (
    content STRING,
    INDEX idx(content) USING INVERTED PROPERTIES ("parser" = "chinese")
);

-- Create on an existing table
CREATE INDEX idx_content ON docs(content) USING INVERTED PROPERTIES ("parser" = "chinese");

-- Build the index for existing data
BUILD INDEX idx_content ON docs;
```

### Drop an index

```sql
DROP INDEX idx_content ON docs;
```

### View indexes

```sql
SHOW CREATE TABLE docs;
SHOW INDEX FROM docs;
```

## Further reading

### Core documentation

- [Text search operators](./search-operators.md): Complete operator reference and query acceleration
- [SEARCH function](./search-function.md): Unified query DSL syntax and examples
- [Relevance scoring](./scoring.md): Relevance ranking algorithm and usage

### Advanced topics

- [Custom analyzer](./custom-analyzer.md): Build domain-specific tokenizers and filters
- [Vector search](../vector-index/overview.md): Use embedding vectors for semantic similarity search
