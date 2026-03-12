---
{
    "title": "Practical Guide",
    "language": "en",
    "description": "Hands-on guide for Apache Doris ANN vector search: table design, index creation, data loading, index build, query tuning, and troubleshooting."
}
---

<!--
Licensed to the Apache Software Foundation (ASF) under one
or more contributor license agreements.  See the NOTICE file
distributed with this work for additional information
regarding copyright ownership.  The ASF licenses this file
to you under the Apache License, Version 2.0 (the
"License"); you may not use this file except in compliance
with the License.  You may obtain a copy of the License at

  http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing,
software distributed under the License is distributed on an
"AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
KIND, either express or implied.  See the License for the
specific language governing permissions and limitations
under the License.
-->

This guide provides a production-oriented workflow for Apache Doris ANN vector search, from schema design to tuning and troubleshooting.

## 1. Scope and Typical Scenarios

Apache Doris 4.x supports ANN indexing on high-dimensional vectors for scenarios such as:

- Semantic search
- RAG retrieval
- Recommendation
- Image or multimodal retrieval
- Outlier detection

Supported index types:

- `hnsw`: high recall and online query performance
- `ivf`: lower memory and faster build in large-scale cases

Supported approximate distance functions:

- `l2_distance_approximate` (`ORDER BY ... ASC`)
- `inner_product_approximate` (`ORDER BY ... DESC`)

## 2. Prerequisites and Constraints

Before using ANN indexes, confirm the following:

1. Doris version: `>= 4.0.0`
2. Table model: only `DUPLICATE KEY` is supported for ANN
3. Vector column: must be `ARRAY<FLOAT> NOT NULL`
4. Dimension consistency: input vector dimension must match index `dim`

Example table model:

```sql
CREATE TABLE document_vectors (
  id BIGINT NOT NULL,
  embedding ARRAY<FLOAT> NOT NULL
)
DUPLICATE KEY(id)
DISTRIBUTED BY HASH(id) BUCKETS 8
PROPERTIES ("replication_num" = "1");
```

## 3. End-to-End Workflow

### Step 1: Create Table

You can choose one of two patterns:

1. Define ANN index when creating table.
   - Index is built during ingest.
   - Faster time-to-query after loading.
   - Slower ingest throughput.
2. Create table first, then `CREATE INDEX` and `BUILD INDEX` later.
   - Better for large batch import.
   - More control over compaction and build timing.

Example (index defined in `CREATE TABLE`):

```sql
CREATE TABLE document_vectors (
  id BIGINT NOT NULL,
  title VARCHAR(500),
  content TEXT,
  category VARCHAR(100),
  embedding ARRAY<FLOAT> NOT NULL,
  INDEX idx_embedding (embedding) USING ANN PROPERTIES (
    "index_type" = "hnsw",
    "metric_type" = "l2_distance",
    "dim" = "768"
  )
)
ENGINE = OLAP
DUPLICATE KEY(id)
DISTRIBUTED BY HASH(id) BUCKETS 8
PROPERTIES ("replication_num" = "1");
```

### Step 2: Configure ANN Index

Common properties:

- `index_type`: `hnsw` or `ivf`
- `metric_type`: `l2_distance` or `inner_product`
- `dim`: vector dimension
- `quantizer`: `flat`, `sq8`, `sq4`, `pq` (optional)

HNSW-specific:

- `max_degree` (default `32`)
- `ef_construction` (default `40`)

IVF-specific:

- `nlist` (default `1024`)

Example:

```sql
CREATE INDEX idx_embedding ON document_vectors (embedding) USING ANN PROPERTIES (
  "index_type" = "hnsw",
  "metric_type" = "l2_distance",
  "dim" = "768",
  "max_degree" = "64",
  "ef_construction" = "128"
);
```

### Step 3: Load Data

Recommended order for bulk workloads:

1. Create table (without ANN index or without `BUILD INDEX` yet)
2. Import data in batch (Stream Load, S3 TVF, or SDK)
3. Trigger index build

For production, prefer batch loading approaches such as Stream Load or SDK batch insert.

### Step 4: Build and Monitor Index

When index is created after table creation, run `BUILD INDEX` manually:

```sql
BUILD INDEX idx_embedding ON document_vectors;
SHOW BUILD INDEX WHERE TableName = "document_vectors";
```

Build states include `PENDING`, `RUNNING`, `FINISHED`, and `CANCELLED`.

## 4. Query Patterns

### TopN search

```sql
SELECT id, title,
       l2_distance_approximate(embedding, [0.1, 0.2, ...]) AS dist
FROM document_vectors
ORDER BY dist
LIMIT 10;
```

### Range search

```sql
SELECT id, title
FROM document_vectors
WHERE l2_distance_approximate(embedding, [0.1, 0.2, ...]) < 0.5;
```

### Search with filters

```sql
SELECT id, title,
       l2_distance_approximate(embedding, [0.1, 0.2, ...]) AS dist
FROM document_vectors
WHERE category = 'AI'
ORDER BY dist
LIMIT 10;
```

Doris uses pre-filtering in vector search plans, which helps preserve recall in mixed filter scenarios.

## 5. Tuning Checklist

### Query-side parameters

- HNSW: `hnsw_ef_search` (higher recall vs higher latency)
- IVF: `nprobe` (or `ivf_nprobe`, depending on version/session variables)

Example:

```sql
SET hnsw_ef_search = 100;
SET nprobe = 128;
SET optimize_index_scan_parallelism = true;
```

### Build-side recommendations

1. Run compaction before final index build on large datasets.
2. Avoid oversized segments when targeting high recall.
3. Benchmark several parameter groups (`max_degree`, `ef_construction`, `ef_search`) on the same dataset.

### Capacity planning

For memory and CPU sizing, see [ANN Resource Estimation Guide](./resource-estimation.md).

## 6. Index Operations

Common management SQL:

```sql
SHOW INDEX FROM document_vectors;
SHOW DATA ALL FROM document_vectors;
ALTER TABLE document_vectors DROP INDEX idx_embedding;
```

When changing index parameters, use drop-and-recreate workflow, then rebuild index.

## 7. Troubleshooting

### Index not used

Check:

1. Index exists: `SHOW INDEX`
2. Build finished: `SHOW BUILD INDEX`
3. Correct function: use `_approximate` functions

### Low recall

Check:

- HNSW parameters (`max_degree`, `ef_construction`, `hnsw_ef_search`)
- IVF probe parameters (`nprobe`/`ivf_nprobe`)
- Segment size and post-compaction rebuild

### High latency

Check:

- Cold vs warm query behavior (index loading)
- Overly large `hnsw_ef_search`
- Parallel scan setting
- BE memory pressure

### Data import errors

Common causes:

- dimension mismatch (`dim` vs actual data)
- null vector values
- invalid array format

## 8. Hybrid Search Pattern

You can combine ANN with text search by defining both ANN and inverted indexes in the same table, then filtering with text predicates and ordering with vector distance. This is a common approach for production RAG pipelines.
