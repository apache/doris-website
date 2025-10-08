---
{
    "title": "SEARCH Function",
    "language": "en"
}
---

## Overview

The `SEARCH` function provides a comprehensive and lightweight DSL (Domain Specific Language) for full-text retrieval queries in Apache Doris. It simplifies complex text search operations by offering a unified query interface that leverages inverted indexes for high-performance text searches.

## Design Goals

The SEARCH function addresses the following core challenges:

### 1. Simplified Query Complexity
- **Unified Entry Point**: Consolidates all text search queries into a single function
- **Lightweight DSL Syntax**: Provides an intuitive query language for complex searches
- **Reduced SQL Complexity**: Eliminates the need to manually combine multiple text search operators

### 2. Multi-Condition Index Pushdown Optimization
- **Direct Index Utilization**: Pushes complex text search conditions directly to the index query layer
- **Performance Optimization**: Leverages inverted index capabilities for faster execution
- **Unified Query Optimization**: Enables the index layer to optimize combined queries efficiently

### 3. Precise Relevance Scoring Strategy
- **Clear Scoring Semantics**: Explicitly defines which conditions participate in relevance scoring
- **Filter vs. Score Separation**: SEARCH function conditions contribute to relevance scoring, while other WHERE conditions act as filters
- **Accurate Scoring**: Ensures relevance scores reflect only the search criteria, not filtering conditions

### 4. Elasticsearch Migration Support
- **Familiar Syntax**: Helps Elasticsearch users migrate to Doris without extensive query rewriting
- **Query String Compatibility**: Provides similar functionality to Elasticsearch's query_string feature

## Current Version Features (MVP)

### Supported Features ✅

| Feature | Description | Example |
|---------|-------------|---------|
| **Basic Term Query** | Exact term matching | `SEARCH('title:Machine')` |
| **ANY Query** | Match any of multiple values | `SEARCH('tags:ANY(java python golang)')` |
| **ALL Query** | Match all specified values | `SEARCH('tags:ALL(machine learning)')` |
| **Boolean Logic** | AND, OR, NOT operators with nesting | `SEARCH('(title:A OR title:B) AND category:C')` |
| **Multi-Field Search** | Search across multiple fields simultaneously | `SEARCH('title:hello OR content:world')` |

### Planned Features ❌ (TODO)

The following features are planned for future releases:

- ❌ **Phrase Query** (PHRASE) - Exact phrase matching
- ❌ **Prefix Query** (PREFIX) - Prefix-based matching
- ❌ **Wildcard Query** (WILDCARD) - Pattern matching with * and ?
- ❌ **Regular Expression** (REGEXP) - Regex-based searches
- ❌ **Range Query** (RANGE) - Numeric/date range searches
- ❌ **List Query** (LIST/IN) - Match against a list of values
- ❌ **Variant Subcolumn Support** - Search on variant type subcolumns
- ❌ **Configuration Parameters** - Advanced query options

## DSL Syntax Reference

### Supported Syntax ✅

#### Basic Queries

```sql
-- Term query: Exact word matching
SELECT * FROM table WHERE SEARCH('title:apache');

-- ANY query: Match any of the specified values
SELECT * FROM table WHERE SEARCH('tags:ANY(java python golang)');

-- ALL query: Match all specified values
SELECT * FROM table WHERE SEARCH('tags:ALL(programming tutorial)');
```

#### Boolean Operations

```sql
-- AND operator
SELECT * FROM table WHERE SEARCH('title:apache AND status:active');

-- OR operator
SELECT * FROM table WHERE SEARCH('title:apache OR title:doris');

-- NOT operator
SELECT * FROM table WHERE SEARCH('category:tech AND NOT status:deleted');

-- Complex grouping
SELECT * FROM table WHERE SEARCH('(title:apache OR title:doris) AND NOT (status:deleted OR status:archived)');
```

#### Multi-Field Search

```sql
-- Search across multiple fields
SELECT * FROM table WHERE SEARCH('title:database OR content:system');

-- Complex multi-field queries
SELECT * FROM table WHERE SEARCH('title:apache AND (content:database OR tags:ANY(sql nosql))');
```

### Unsupported Syntax ❌ (Fallback to Term Query)

The following queries are currently not implemented and will fallback to basic term queries:

```sql
-- ⚠️ Phrase query (will fallback to term query)
SELECT * FROM table WHERE SEARCH('content:"machine learning"');

-- ⚠️ Prefix query (will fallback to term query)
SELECT * FROM table WHERE SEARCH('title:data*');

-- ⚠️ Wildcard query (will fallback to term query)
SELECT * FROM table WHERE SEARCH('title:d*ta');

-- ⚠️ Regular expression (will fallback to term query)
SELECT * FROM table WHERE SEARCH('title:/[a-z]+/');

-- ⚠️ Range query (will fallback to term query)
SELECT * FROM table WHERE SEARCH('age:[18 TO 65]');
```

## Usage Examples

### Example 1: Basic Term Search

```sql
-- Search for documents with "Machine" in title
SELECT id, title FROM search_test WHERE SEARCH('title:Machine');

-- Search with filtering
SELECT id, title, category
FROM search_test
WHERE SEARCH('title:Python') AND category = 'Technology';
```

### Example 2: ANY Query

```sql
-- Find documents with any of the specified tags
SELECT id, title FROM search_test
WHERE SEARCH('tags:ANY(python javascript golang)');

-- Combine with other conditions
SELECT id, title FROM search_test
WHERE SEARCH('tags:ANY(machine learning tutorial)')
AND created_date > '2024-01-01';
```

### Example 3: ALL Query

```sql
-- Find documents containing all specified terms
SELECT id, title FROM search_test
WHERE SEARCH('tags:ALL(machine learning)');

-- Complex ALL query with grouping
SELECT id, title FROM search_test
WHERE SEARCH('(tags:ALL(tutorial programming)) AND category:tech');
```

### Example 4: Complex Boolean Queries

```sql
-- Multiple boolean operators
SELECT id, title FROM search_test
WHERE SEARCH('(title:Learning OR content:Tutorial) AND category:Technology AND NOT tags:deprecated');

-- Nested conditions
SELECT * FROM search_test
WHERE SEARCH('((title:apache OR title:doris) AND category:database) OR (tags:ANY(sql nosql) AND NOT status:archived)');
```

## Performance Considerations

### Query Optimization Tips

1. **Use Specific Fields**: Specify field names for better index utilization
   ```sql
   -- Good
   SEARCH('title:apache')

   -- Less efficient
   SEARCH('apache') -- searches all indexed fields
   ```

2. **Combine with WHERE Clauses**: Use SEARCH for text matching and WHERE for exact filtering
   ```sql
   SELECT * FROM table
   WHERE SEARCH('content:database')
   AND category = 'tech'
   AND created_date > '2024-01-01';
   ```

3. **Leverage Index Pushdown**: Let SEARCH conditions benefit from index optimization
   - All SEARCH conditions are pushed down to the inverted index layer
   - Additional WHERE conditions filter the results after index lookup

### Performance Benchmarks

Expected query performance (actual results may vary):

| Data Size | Query Type | Expected Response Time |
|-----------|------------|----------------------|
| 10K rows | Term Query | < 20ms |
| 10K rows | ANY/ALL Query | < 50ms |
| 100K rows | Complex Boolean Query | < 200ms |

## Limitations and Known Issues

### Current Limitations

1. **Fallback Behavior**: Unsupported query types (phrase, prefix, wildcard, etc.) fall back to term queries without error
2. **No Variant Support**: Cannot search on variant type subcolumns yet
3. **No Configuration Options**: Advanced parameters (default_operator, minimum_should_match, etc.) not yet available

### Migration from Elasticsearch

When migrating from Elasticsearch's `query_string`:

✅ **Supported Migrations:**
- Basic term queries
- Boolean logic (AND/OR/NOT)
- Multi-field searches
- Grouping with parentheses

❌ **Requires Workaround:**
- Phrase queries → Use MATCH_PHRASE operator separately
- Wildcard/Prefix → Use MATCH_REGEXP or LIKE
- Range queries → Use standard SQL comparison operators

## Next Steps

- Review [Inverted Index Overview](./inverted-index-overview.md) for indexing fundamentals
- Learn about [Search Operators](../../table-design/index/inverted-index/search-operators.md) for alternative query methods
- Explore [BM25 Scoring](../../table-design/index/inverted-index/bm25-scoring.md) for relevance ranking
- Check [Vector Search](../vector-search.md) for AI-powered similarity searches

## Roadmap

### Planned for Next Release
- ✨ Variant subcolumn index support
- ✨ Wildcard query (WILDCARD)
- ✨ Configuration parameter support

### Future Releases
- 🔜 Phrase query (PHRASE)
- 🔜 Prefix query (PREFIX)
- 🔜 Regular expression (REGEXP)
- 🔜 Range query (RANGE)
