---
{
    "title": "Elasticsearch to Doris",
    "language": "en",
    "description": "Comprehensive guide to migrating data from Elasticsearch to Apache Doris"
}
---

This guide covers migrating data from Elasticsearch to Apache Doris. Doris can serve as a powerful alternative to Elasticsearch for log analytics, full-text search, and general OLAP workloads, often with better performance and lower operational complexity.

## Why Migrate from Elasticsearch to Doris?

| Aspect | Elasticsearch | Apache Doris |
|--------|---------------|--------------|
| Query Language | DSL (JSON-based) | Standard SQL |
| JOINs | Limited | Full SQL JOINs |
| Storage Efficiency | Higher storage usage | Columnar compression |
| Operational Complexity | Complex cluster management | Simpler operations |
| Full-text Search | Native inverted index | Inverted index support |
| Real-time Analytics | Good | Excellent |

## Considerations

1. **Full-text Search**: Doris supports [Inverted Index](../table-design/index/inverted-index/overview.md) for full-text search capabilities similar to Elasticsearch.

2. **Index to Table Mapping**: Each Elasticsearch index typically maps to a Doris table.

3. **Nested Documents**: Elasticsearch nested types map to Doris [VARIANT](../data-operate/import/complex-types/variant.md) type for flexible schema handling.

4. **Array Handling**: Elasticsearch doesn't have explicit array types. To read arrays correctly via the ES Catalog, configure array field metadata in the ES index mapping using `_meta.doris.array_fields`.

5. **Date Types**: Elasticsearch dates can have multiple formats. Ensure consistent date handling when migrating — use explicit casting to DATETIME.

6. **_id Field**: To preserve Elasticsearch document `_id`, enable `mapping_es_id` in the ES Catalog configuration.

7. **Performance**: For better ES Catalog read performance, enable `doc_value_scan`. Note that `text` fields don't support doc_value and will fall back to `_source`.

## Data Type Mapping

| Elasticsearch Type | Doris Type | Notes |
|--------------------|------------|-------|
| null | NULL | |
| boolean | BOOLEAN | |
| byte | TINYINT | |
| short | SMALLINT | |
| integer | INT | |
| long | BIGINT | |
| unsigned_long | LARGEINT | |
| float | FLOAT | |
| half_float | FLOAT | |
| double | DOUBLE | |
| scaled_float | DOUBLE | |
| keyword | STRING | |
| text | STRING | Consider inverted index in Doris |
| date | DATE or DATETIME | See Date Types consideration above |
| ip | STRING | |
| nested | VARIANT | See [VARIANT type](../data-operate/import/complex-types/variant.md) for flexible schema |
| object | VARIANT | See [VARIANT type](../data-operate/import/complex-types/variant.md) |
| flattened | VARIANT | Supported since Doris 3.1.4, 4.0.3 |
| geo_point | STRING | Store as "lat,lon" string |
| geo_shape | STRING | Store as GeoJSON string |

## Migration Options

### Option 1: ES Catalog (Recommended)

The [ES Catalog](../lakehouse/catalogs/es-catalog.md) provides direct access to Elasticsearch data from Doris, enabling both querying and migration.

**Prerequisites**: Elasticsearch 5.x or higher; network connectivity between Doris FE/BE nodes and Elasticsearch.

### Option 2: Logstash Pipeline

Use Logstash to read from Elasticsearch and write to Doris via HTTP (Stream Load). This approach gives you transformation capabilities during migration.

### Option 3: Custom Script with Scroll API

For more control, use a custom script with Elasticsearch Scroll API to read data and load it into Doris via Stream Load.

## Full-text Search in Doris

Doris's [Inverted Index](../table-design/index/inverted-index/overview.md) provides full-text search capabilities similar to Elasticsearch.

### DSL to SQL Conversion Reference

| Elasticsearch DSL | Doris SQL |
|-------------------|-----------|
| `{"match": {"title": "doris"}}` | `WHERE title MATCH 'doris'` |
| `{"match_phrase": {"content": "real time"}}` | `WHERE content MATCH_PHRASE 'real time'` |
| `{"term": {"status": "active"}}` | `WHERE status = 'active'` |
| `{"terms": {"tag": ["a", "b"]}}` | `WHERE tag IN ('a', 'b')` |
| `{"range": {"price": {"gte": 10}}}` | `WHERE price >= 10` |
| `{"bool": {"must": [...]}}` | `WHERE ... AND ...` |
| `{"bool": {"should": [...]}}` | `WHERE ... OR ...` |
| `{"exists": {"field": "email"}}` | `WHERE email IS NOT NULL` |

## Next Steps

- [Inverted Index](../table-design/index/inverted-index/overview.md) - Full-text search in Doris
- [ES Catalog](../lakehouse/catalogs/es-catalog.md) - Complete ES Catalog reference
- [Log Storage Analysis](../log-storage-analysis.md) - Optimizing log analytics in Doris
