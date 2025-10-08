---
{
    "title": "Inverted Index Overview",
    "language": "en"
}
---

## Introduction

Apache Doris provides powerful full-text search capabilities through inverted indexes. The inverted index is a widely used indexing technique in information retrieval that enables fast text searches, equality and range queries on numerical and date types.

## What is an Inverted Index?

An [inverted index](https://en.wikipedia.org/wiki/Inverted_index) divides text into individual words and constructs a word → document IDs mapping, allowing quick searches to determine which documents contain specific words.

In Doris's implementation:
- Each table row corresponds to a document
- Each column corresponds to a field in the document
- The inverted index uses independent files at the storage layer, enabling efficient index creation and deletion without rewriting data files

## Key Features

### 1. Full-Text Search
- Keyword search with `MATCH_ANY` and `MATCH_ALL`
- Phrase queries with `MATCH_PHRASE`
- Support for word distance (slop)
- Prefix matching with `MATCH_PHRASE_PREFIX`
- Regular expression queries with `MATCH_REGEXP`
- Multiple tokenizers: English, Chinese, and Unicode

### 2. Accelerated Queries
- Fast filtering for string, numerical, and datetime types (=, !=, >, >=, <, <=)
- Array type support with `array_contains`
- Comprehensive logical combinations (AND, OR, NOT)

### 3. Flexible Index Management
- Define indexes during table creation
- Add indexes to existing tables with incremental construction
- Delete indexes without rewriting table data

## Learn More

For detailed information about inverted indexes, please refer to the following documentation:

- [**Inverted Index Overview**](../../table-design/index/inverted-index/overview.md) - Learn about indexing principles and use cases
- [**Index Management**](../../table-design/index/inverted-index/index-management.md) - How to create, delete, and view inverted indexes
- [**Index Building**](../../table-design/index/inverted-index/index-build.md) - Build indexes for existing data with BUILD INDEX
- [**Search Operators**](../../table-design/index/inverted-index/search-operators.md) - Full-text search operators and query acceleration
- [**Custom Analyzer**](../../table-design/index/inverted-index/custom-analyzer.md) - Create custom tokenizers and analyzers
- [**BM25 Scoring**](../../table-design/index/inverted-index/bm25-scoring.md) - Relevance scoring for full-text search

## Quick Example

```sql
-- Create table with inverted index
CREATE TABLE docs (
    id BIGINT,
    title STRING,
    content STRING,
    INDEX idx_content(content) USING INVERTED PROPERTIES("parser" = "english")
)
DUPLICATE KEY(id)
DISTRIBUTED BY HASH(id) BUCKETS 10;

-- Full-text search
SELECT * FROM docs WHERE content MATCH_ANY 'apache doris';

-- Phrase search
SELECT * FROM docs WHERE content MATCH_PHRASE 'full text search';
```

## Next Steps

- Learn about the [SEARCH function](./search-function.md) for simplified full-text query syntax
- Explore [vector search](../vector-search.md) for AI-powered similarity search
