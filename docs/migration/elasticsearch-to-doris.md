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

3. **Nested Documents**: Elasticsearch nested/object types map to Doris JSON type.

4. **Array Handling**: Elasticsearch arrays require explicit configuration in Doris.

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
| date | DATE or DATETIME | See [Date Handling](#handling-date-types) |
| ip | STRING | |
| nested | JSON | |
| object | JSON | |
| flattened | JSON | Supported since Doris 3.1.4, 4.0.3 |
| geo_point | STRING | Store as "lat,lon" string |
| geo_shape | STRING | Store as GeoJSON string |

## Migration Options

### Option 1: ES Catalog (Recommended)

The ES Catalog provides direct access to Elasticsearch data from Doris, enabling both querying and migration.

#### Prerequisites

- Elasticsearch 5.x or higher
- Network connectivity between Doris FE/BE nodes and Elasticsearch

#### Step 1: Create ES Catalog

```sql
CREATE CATALOG es_catalog PROPERTIES (
    'type' = 'es',
    'hosts' = 'http://es-node1:9200,http://es-node2:9200',
    'user' = 'elastic',
    'password' = 'password'
);
```

With additional options:

```sql
CREATE CATALOG es_catalog PROPERTIES (
    'type' = 'es',
    'hosts' = 'http://es-node1:9200',
    'user' = 'elastic',
    'password' = 'password',
    'doc_value_scan' = 'true',
    'keyword_sniff' = 'true',
    'nodes_discovery' = 'true',
    'ssl' = 'false',
    'mapping_es_id' = 'true'
);
```

#### Step 2: Explore Elasticsearch Data

```sql
-- Switch to ES catalog
SWITCH es_catalog;

-- ES creates a default_db database
USE default_db;

-- List indices as tables
SHOW TABLES;

-- Preview data
SELECT * FROM logs_index LIMIT 10;

-- Check field mappings
DESC logs_index;
```

#### Step 3: Design Doris Table

Based on your Elasticsearch index, design an appropriate Doris table:

```sql
-- Example: Log data table
SWITCH internal;

CREATE TABLE logs (
    `@timestamp` DATETIME NOT NULL,
    log_id VARCHAR(64),
    level VARCHAR(16),
    message TEXT,
    host VARCHAR(128),
    service VARCHAR(64),
    trace_id VARCHAR(64),
    INDEX idx_message (message) USING INVERTED PROPERTIES("parser" = "unicode", "support_phrase" = "true"),
    INDEX idx_level (level) USING INVERTED,
    INDEX idx_service (service) USING INVERTED
)
DUPLICATE KEY(`@timestamp`, log_id)
PARTITION BY RANGE(`@timestamp`) ()
DISTRIBUTED BY HASH(log_id) BUCKETS 16
PROPERTIES (
    "dynamic_partition.enable" = "true",
    "dynamic_partition.time_unit" = "DAY",
    "dynamic_partition.start" = "-30",
    "dynamic_partition.end" = "3",
    "dynamic_partition.prefix" = "p",
    "replication_num" = "3"
);
```

`★ Insight ─────────────────────────────────────`
1. **DUPLICATE KEY model** is best for log data where append-only writes are common
2. **Inverted indexes** enable full-text search similar to Elasticsearch
3. **Dynamic partitioning** automatically manages time-based data lifecycle
`─────────────────────────────────────────────────`

#### Step 4: Migrate Data

```sql
-- Basic migration
INSERT INTO internal.analytics_db.logs
SELECT
    `@timestamp`,
    _id as log_id,
    level,
    message,
    host,
    service,
    trace_id
FROM es_catalog.default_db.logs_index;
```

For large indices, migrate by time range:

```sql
-- Migrate by day
INSERT INTO internal.analytics_db.logs
SELECT * FROM es_catalog.default_db.logs_index
WHERE `@timestamp` >= '2024-01-01' AND `@timestamp` < '2024-01-02';
```

#### Step 5: Configure Array Fields

Elasticsearch doesn't have explicit array types. To read arrays correctly, configure the ES index mapping:

```bash
# Add array field metadata to ES index
curl -X PUT "localhost:9200/logs_index/_mapping" -H 'Content-Type: application/json' -d '{
    "_meta": {
        "doris": {
            "array_fields": ["tags", "ip_addresses"]
        }
    }
}'
```

Then in Doris:

```sql
-- Array fields will be correctly recognized
SELECT tags, ip_addresses FROM es_catalog.default_db.logs_index LIMIT 5;
```

### Option 2: Logstash Pipeline

Use Logstash to read from Elasticsearch and write to Doris via HTTP.

#### Logstash Configuration

```ruby
input {
    elasticsearch {
        hosts => ["http://es-node:9200"]
        index => "logs-*"
        query => '{ "query": { "range": { "@timestamp": { "gte": "now-7d" } } } }'
        size => 1000
        scroll => "5m"
        docinfo => true
    }
}

filter {
    mutate {
        rename => { "[@metadata][_id]" => "doc_id" }
    }
    date {
        match => ["@timestamp", "ISO8601"]
        target => "@timestamp"
    }
}

output {
    http {
        url => "http://doris-fe:8030/api/analytics_db/logs/_stream_load"
        http_method => "put"
        headers => {
            "Authorization" => "Basic cm9vdDo="
            "Expect" => "100-continue"
            "format" => "json"
            "strip_outer_array" => "true"
        }
        format => "json_batch"
        pool_max => 10
    }
}
```

### Option 3: Custom Script with Scroll API

For more control, use a custom script with Elasticsearch Scroll API:

```python
from elasticsearch import Elasticsearch
import requests
import json

es = Elasticsearch(['http://es-node:9200'])
doris_url = 'http://doris-fe:8030/api/db/table/_stream_load'

# Scroll through Elasticsearch
resp = es.search(
    index='logs-*',
    scroll='5m',
    size=10000,
    body={'query': {'match_all': {}}}
)

scroll_id = resp['_scroll_id']
hits = resp['hits']['hits']

while hits:
    # Transform and load to Doris
    docs = [hit['_source'] for hit in hits]

    response = requests.put(
        doris_url,
        headers={
            'Content-Type': 'application/json',
            'Authorization': 'Basic cm9vdDo=',
            'format': 'json',
            'strip_outer_array': 'true'
        },
        data=json.dumps(docs)
    )

    # Continue scrolling
    resp = es.scroll(scroll_id=scroll_id, scroll='5m')
    scroll_id = resp['_scroll_id']
    hits = resp['hits']['hits']
```

## Migrating Full-text Search

Doris's inverted index provides full-text search capabilities similar to Elasticsearch.

### Creating Inverted Indexes

```sql
-- Create table with inverted index for full-text search
CREATE TABLE articles (
    id BIGINT,
    title VARCHAR(256),
    content TEXT,
    author VARCHAR(64),
    published_at DATETIME,
    tags ARRAY<STRING>,
    INDEX idx_title (title) USING INVERTED PROPERTIES("parser" = "unicode"),
    INDEX idx_content (content) USING INVERTED PROPERTIES(
        "parser" = "unicode",
        "support_phrase" = "true"
    ),
    INDEX idx_tags (tags) USING INVERTED
)
DUPLICATE KEY(id)
DISTRIBUTED BY HASH(id) BUCKETS 8;
```

### Full-text Search Queries

```sql
-- Match query (similar to ES match)
SELECT * FROM articles
WHERE content MATCH 'apache doris';

-- Phrase match (similar to ES match_phrase)
SELECT * FROM articles
WHERE content MATCH_PHRASE 'real-time analytics';

-- Multiple conditions
SELECT * FROM articles
WHERE title MATCH 'database'
  AND content MATCH 'performance'
  AND published_at > '2024-01-01';
```

### DSL to SQL Conversion Examples

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

## Handling Common Issues

### Handling Date Types

Elasticsearch dates can have multiple formats. Ensure consistent handling:

```sql
-- Doris table with datetime
CREATE TABLE events (
    event_id VARCHAR(64),
    event_time DATETIME,
    event_data JSON
)
DUPLICATE KEY(event_id)
DISTRIBUTED BY HASH(event_id) BUCKETS 8;

-- Migration with date conversion
INSERT INTO events
SELECT
    _id,
    CAST(`@timestamp` AS DATETIME),
    event_data
FROM es_catalog.default_db.events_index;
```

### Handling Nested Documents

Elasticsearch nested objects map to Doris JSON:

```sql
-- ES document with nested data
-- { "user": { "name": "John", "address": { "city": "NYC" } } }

-- Doris table
CREATE TABLE users (
    id VARCHAR(64),
    user_data JSON
)
DISTRIBUTED BY HASH(id) BUCKETS 8;

-- Query nested data in Doris
SELECT
    id,
    JSON_EXTRACT(user_data, '$.name') as name,
    JSON_EXTRACT(user_data, '$.address.city') as city
FROM users;
```

### Handling _id Field

To preserve Elasticsearch `_id`:

```sql
-- Enable _id mapping in catalog
CREATE CATALOG es_catalog PROPERTIES (
    'type' = 'es',
    'hosts' = 'http://es-node:9200',
    'mapping_es_id' = 'true'
);

-- Query with _id
SELECT _id, * FROM es_catalog.default_db.index_name LIMIT 10;
```

### Performance Optimization

For better ES Catalog read performance:

```sql
-- Enable columnar scan (doc_value)
CREATE CATALOG es_catalog PROPERTIES (
    'type' = 'es',
    'hosts' = 'http://es-node:9200',
    'doc_value_scan' = 'true'
);
```

Note: `text` fields don't support doc_value, so they'll fall back to `_source`.

## Validation

After migration, validate:

```sql
-- Compare document counts
SELECT COUNT(*) FROM es_catalog.default_db.logs_index;
SELECT COUNT(*) FROM internal.analytics_db.logs;

-- Verify full-text search works
SELECT COUNT(*) FROM internal.analytics_db.logs
WHERE message MATCH 'error';

-- Compare against ES catalog query
SELECT COUNT(*) FROM es_catalog.default_db.logs_index
WHERE message = 'error';

-- Spot check specific documents
SELECT * FROM internal.analytics_db.logs
WHERE log_id = 'specific-doc-id';
```

## Next Steps

- [Inverted Index](../table-design/index/inverted-index/overview.md) - Full-text search in Doris
- [ES Catalog](../lakehouse/catalogs/es-catalog.md) - Complete ES Catalog reference
- [Log Storage Analysis](../log-storage-analysis.md) - Optimizing log analytics in Doris
