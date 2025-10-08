---
{
    "title": "BM25 Scoring",
    "language": "en"
}
---

## Overview

BM25 (Best Matching 25) is a probability-based text relevance scoring algorithm widely used in full-text search engines. Doris's BM25 implementation provides relevance scoring for inverted index queries, helping users sort search results by relevance.

## BM25 Algorithm Principles

### Core Formula

The BM25 core scoring formula is:

```
Score = IDF × (tf × (k1 + 1)) / (tf + k1 × (1 - b + b × |d|/avgdl))
```

Where:
- **tf** (term frequency): The frequency of the term in the document
- **IDF** (Inverse Document Frequency): Inverse document frequency
- **|d|**: The length of the current document (number of terms)
- **avgdl**: Average length of all documents in the collection
- **k1, b**: Algorithm tuning parameters

### Parameter Explanation

| Parameter | Default Value | Meaning | Database Representation |
|-----------|---------------|---------|------------------------|
| k1 | 1.2 | Parameter controlling tf saturation. The larger the value, the greater the impact of tf | Fixed parameter, not configurable |
| b | 0.75 | Parameter controlling document length normalization. 0 means document length is not considered, 1 means full normalization | Fixed parameter, not configurable |
| boost | 1.0 | Query boost factor | Fixed parameter, not configurable |

### Statistical Information Calculation

**IDF Calculation Formula:**

```
IDF = log(1 + (Total Documents - Documents Containing Term + 0.5) / (Documents Containing Term + 0.5))
```

**Average Document Length (avgdl):**

```
avgdl = Total Terms / Total Documents
```

## Features and Limitations

### Supported Index Types

- ✅ **Tokenized Indexes**: Predefined tokenizers and custom tokenizers
- ❌ **Non-Tokenized Indexes**: Indexes without tokenization

:::tip Note
Unlike Elasticsearch, Doris's BM25 scoring only applies to tokenized indexes. Non-tokenized indexes are primarily for exact matching and do not provide relevance scoring.
:::

### Supported Query Types

- MATCH_ANY
- MATCH_ALL
- MATCH_PHRASE
- MATCH_PHRASE_PREFIX

### Query Pushdown Limitations

1. The `score()` function must exist in the project after SELECT
2. The filter after WHERE condition must contain a match query condition
3. Must be a topn query, and ORDER BY must be on the score column

## Usage

### Basic Query Syntax

```sql
SELECT *, score() as score
FROM search_demo
WHERE content MATCH_ANY 'search query'
ORDER BY score DESC
LIMIT 10;
```

## Notes

1. **Score Range**: BM25 scores have no fixed upper or lower bounds, the relative size of scores is more meaningful than absolute values
2. **Empty Query**: If the query term does not exist in the collection, a score of 0 will be returned
3. **Document Length Impact**: Shorter documents typically receive higher scores when containing query terms
4. **Query Term Count**: The score for multi-term queries is the combination (sum) of individual term scores

## Common Questions

**Q: Why can't non-tokenized index type fields use BM25 scoring?**

A: In Doris's design, non-tokenized index fields are primarily for exact matching and do not perform tokenization, so BM25 scoring is not applicable.

**Q: How to improve query performance?**

A:
- Ensure the query pattern meets pushdown optimization conditions
- Use appropriate LIMIT to avoid unnecessary large result sets
- Ensure query conditions correctly utilize inverted indexes

**Q: Why is the score 0?**

A:
- The query term does not exist in the document, or document length information is missing
- May not have correct virtual column pushdown, need to analyze with EXPLAIN
