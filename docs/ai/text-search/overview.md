---
{
    "title": "Text Search",
    "sidebar_label": "Overview",
    "language": "en"
}
---

## Overview

Text search retrieves documents that contain specific terms or phrases and ranks results by relevance.

Compared with vector search, which excels at “finding broadly” by expanding recall through semantic similarity, text search excels at “finding precisely” by providing controllable, explainable exact matches that ensure keyword hits and deterministic filters.

In generative AI applications—especially Retrieval‑Augmented Generation (RAG)—text and vector search complement each other. Working together, they balance semantic breadth and lexical precision, improve recall while ensuring accuracy and interpretability, and build a reliable retrieval foundation that provides models with more accurate, relevant context.

## Evolution of Doris Text Search

Since version 2.0.0, Doris has introduced and continuously expanded text search to meet diverse retrieval scenarios and growing query complexity.

### Foundation (2.0+)
Column‑level inverted indexes with basic full‑text operators (MATCH_ANY, MATCH_ALL) and multi‑language tokenizers enable efficient keyword search on large datasets.

### Feature Expansion (2.x → 3.x)
An enriched operator set adds phrase matching (MATCH_PHRASE), prefix search (MATCH_PHRASE_PREFIX), and regex matching (MATCH_REGEXP). Version 3.1 introduces custom analyzers to address varied text analysis needs.

### Capability Enhancements (4.0+)
Text search gains relevance scoring and a unified search entry, formally introducing BM25 scoring and the SEARCH function.

- BM25 relevance scoring: rank results by text relevance with `score()`, and blend with vector similarity for hybrid ranking.

- SEARCH function: unified query DSL supporting cross‑column search and boolean logic, simplifying complex query construction while improving performance.

## Core Text Search Features

### Rich Text Operators

Doris provides a set of full‑text operators covering multiple retrieval patterns—from keyword matching to advanced phrase queries.

Major operators include:

- `MATCH_ANY` / `MATCH_ALL`: OR/AND multi‑term matching for general keyword search
- `MATCH_PHRASE`: Exact phrase with configurable slop and order control
- `MATCH_PHRASE_PREFIX`: Phrase prefix matching for autocomplete and incremental search
- `MATCH_REGEXP`: Regex on tokenized terms for pattern‑based search

Operators can be used standalone or composed via `SEARCH()` to build complex logic. For example:

```sql
-- Keyword search (any keyword match)
SELECT * FROM docs WHERE content MATCH_ANY 'apache doris database';

-- Require all keywords
SELECT * FROM docs WHERE content MATCH_ALL 'real-time analytics OLAP';

-- Exact phrase
SELECT * FROM docs WHERE content MATCH_PHRASE 'inverted index';

-- Phrase with slop (allow up to 2 words between terms)
SELECT * FROM docs WHERE content MATCH_PHRASE 'machine learning ~2';

-- Prefix matching
SELECT * FROM docs WHERE content MATCH_PHRASE_PREFIX 'data ware';  -- matches "data warehouse", "data warehousing"
```

[See all operators →](../../table-design/index/inverted-index/search-operators.md)

### Custom Analyzers (3.1+)

Tokenization strategy directly affects both precision and recall. Since 3.1, Doris supports custom analyzers so you can define the analysis pipeline by combining `char_filter`, `tokenizer`, and `token_filter`.

Typical usage includes:

- Custom character filtering for replacement/normalization before tokenization
- Choosing tokenizers such as `standard`, `ngram`, `edge_ngram`, `keyword`, `icu` for different languages and text shapes
- Applying token filters like `lowercase`, `word_delimiter`, `ascii_folding` to normalize and refine tokens

```sql
-- Define a custom analyzer
CREATE INVERTED INDEX ANALYZER IF NOT EXISTS keyword_lowercase
PROPERTIES (
  "tokenizer" = "keyword",
  "token_filter" = "asciifolding, lowercase"
);

-- Use the analyzer in table creation
CREATE TABLE docs (
  id BIGINT,
  content TEXT,
  INDEX idx_content (content) USING INVERTED PROPERTIES (
    "analyzer" = "keyword_lowercase",
    "support_phrase" = "true"
  )
);
```

[Learn about custom analyzers →](./text-search/custom-analyzer.md)

### BM25 Relevance Scoring (4.0+)

Doris implements the **BM25 (Best Matching 25)** algorithm for text relevance scoring, enabling Top-N ranking of search results:

**Key Features:**
- Probabilistic ranking based on term frequency, inverse document frequency, and document length
- Robust handling of both long and short documents
- Tunable parameters (k1, b) for ranking behavior
- Seamless integration with Top-N queries

**Usage Pattern:**
```sql
SELECT id, title, score() AS relevance
FROM docs
WHERE content MATCH_ANY 'real-time OLAP analytics'
ORDER BY relevance DESC
LIMIT 10;
```

**How It Works:**
- `score()` computes BM25 score for each matched row
- Higher scores indicate stronger relevance to query terms
- Combine with `ORDER BY` and `LIMIT` for efficient Top-N retrieval
- Works with all `MATCH_*` operators and `SEARCH()` function

[Learn more about scoring →](./text-search/scoring.md)

### SEARCH Function: Unified Query DSL (4.0+)

The `SEARCH()` function provides a concise, expressive syntax for complex text queries:

**Basic Syntax:**
```sql
SEARCH('column:term')                          -- Single term
SEARCH('column:ANY(term1 term2)')              -- Any of the terms (OR)
SEARCH('column:ALL(term1 term2)')              -- All terms (AND)
SEARCH('column:EXACT(exact text)')             -- Case-sensitive exact match
```

**Boolean Composition:**
```sql
SEARCH('title:apache AND category:database')
SEARCH('title:doris OR title:clickhouse')
SEARCH('tags:ANY(olap analytics) AND NOT status:deprecated')
```

**Multi-Column Queries:**
```sql
SEARCH('title:search AND (content:engine OR tags:ANY(elasticsearch lucene))')
```

**Semi-Structured Data:**
```sql
SEARCH('properties.user.name:alice')           -- Variant subcolumn access
```

**With Scoring:**
```sql
SELECT id, title, score() AS relevance
FROM docs
WHERE SEARCH('title:Machine AND tags:ANY(database sql)')
ORDER BY relevance DESC
LIMIT 20;
```

[Complete SEARCH function guide →](./text-search/search-function.md)

## Quick Start

### Step 1: Create Table with Inverted Index

```sql
CREATE TABLE docs (
  id BIGINT,
  title STRING,
  content STRING,
  category STRING,
  tags ARRAY<STRING>,
  created_at DATETIME,
  -- Text search indexes
  INDEX idx_title(title) USING INVERTED PROPERTIES ("parser" = "english"),
  INDEX idx_content(content) USING INVERTED PROPERTIES ("parser" = "english", "support_phrase" = "true"),
  INDEX idx_category(category) USING INVERTED,
  INDEX idx_tags(tags) USING INVERTED
)
DUPLICATE KEY(id)
DISTRIBUTED BY HASH(id) BUCKETS 10;
```

### Step 2: Run Text Queries

```sql
-- Simple keyword search
SELECT * FROM docs WHERE content MATCH_ANY 'apache doris';

-- Phrase search
SELECT * FROM docs WHERE content MATCH_PHRASE 'full text search';

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

## Hybrid Search: Text + Vector

Combine text search with vector similarity for comprehensive retrieval in RAG applications:

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

## Managing Inverted Indexes

### Creating Indexes

```sql
-- At table creation
CREATE TABLE t (
  content STRING,
  INDEX idx(content) USING INVERTED PROPERTIES ("parser" = "english")
);

-- On existing table
CREATE INDEX idx_content ON docs(content) USING INVERTED PROPERTIES ("parser" = "chinese");

-- Build index for existing data
BUILD INDEX idx_content ON docs;
```

### Deleting Indexes

```sql
DROP INDEX idx_content ON docs;
```

### Viewing Indexes

```sql
SHOW CREATE TABLE docs;
SHOW INDEX FROM docs;
```

[Index management guide →](../../table-design/index/inverted-index/overview.md)

## Learn More

### Core Documentation

- [Inverted Index Overview](../../table-design/index/inverted-index/overview.md) — Architecture, indexing principles, and management
- [Text Search Operators](../../table-design/index/inverted-index/search-operators.md) — Complete operator reference and query acceleration
- [SEARCH Function](./search-function.md) — Unified query DSL syntax and examples
- [Relevance Scoring](./scoring.md) — Relevance ranking algorithm and usage

### Advanced Topics

- [Custom Analyzers](./custom-analyzer.md) — Build domain-specific tokenizers and filters
- [Vector Search](../vector-search.md) — Semantic similarity search with embeddings
