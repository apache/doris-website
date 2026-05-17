---
{
    "title": "Vector Index Practical Guide",
    "sidebar_label": "Practical Guide",
    "language": "en",
    "description": "Apache Doris vector index (ANN) practical guide: an end-to-end operational guide covering table creation, index creation, data ingestion, querying, tuning, and troubleshooting.",
    "keywords": [
        "Doris vector index",
        "ANN index",
        "HNSW",
        "IVF",
        "vector retrieval",
        "vector search",
        "semantic search",
        "RAG",
        "cosine similarity",
        "vector recall",
        "BUILD INDEX"
    ]
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

<!-- Knowledge type: Operational guide / End-to-end workflow -->
<!-- Applicable scenarios: Launching vector retrieval / Performance tuning / Troubleshooting -->

This document is intended for users who need to deploy vector retrieval (ANN) in Apache Doris. It provides a complete operational path from table design to query tuning and troubleshooting. If you are evaluating how to migrate semantic search, RAG, or recommendation recall to Doris, you can follow the steps in this document directly.

## Quick Navigation

| What you want to do | Section |
|---|---|
| Confirm whether the Doris version and table model meet the requirements | [Prerequisites and Limitations](#prerequisites-and-limitations) |
| Choose between HNSW and IVF index | [Applicable Scenarios and Index Selection](#applicable-scenarios-and-index-selection) |
| Run the full table creation -> ingestion -> query workflow | [End-to-End Operational Workflow](#end-to-end-operational-workflow) |
| Sort by cosine similarity | [Using Cosine Similarity](#using-cosine-similarity) |
| Increase recall / reduce latency | [Query and Build Tuning](#query-and-build-tuning) |
| Troubleshoot index not taking effect / low recall / ingestion failures | [Common Troubleshooting](#common-troubleshooting) |

---

## Applicable Scenarios and Index Selection

<!-- Knowledge type: Architectural selection decision -->

Starting from Apache Doris 4.x, ANN (Approximate Nearest Neighbor) vector indexes are supported. Common deployment scenarios include:

- Semantic search
- RAG retrieval augmentation
- Recommendation system recall
- Image or multimodal retrieval
- Anomaly detection

### Index Type Comparison

| Index type | Recall | Online query performance | Build speed | Memory usage | Applicable scenario |
|---|---|---|---|---|---|
| `hnsw` | High | Good | Slow | Higher | Online low-latency retrieval |
| `ivf` | Medium | Better | Fast | More efficient | Large-scale datasets |
| `ivf_on_disk` | Medium | Medium | Fast | Most efficient | Ultra-large scale, memory-constrained |

### Supported Distance Functions

| Function | Sort direction | Description |
|---|---|---|
| `l2_distance_approximate` | `ORDER BY ... ASC` | Euclidean distance, smaller distance means more similar |
| `inner_product_approximate` | `ORDER BY ... DESC` | Inner product, larger value means more similar |

> Cosine similarity cannot be configured directly via `metric_type="cosine"`. It must be implemented by normalizing the vectors and using inner product. For details, see [Using Cosine Similarity](#using-cosine-similarity).

---

## Prerequisites and Limitations

<!-- Knowledge type: Environment requirements -->
<!-- Applicable scenarios: Pre-deployment check -->

Before using ANN indexes, confirm the following conditions:

| Check item | Requirement |
|---|---|
| Doris version | `>= 4.0.0` |
| Table model | Only `DUPLICATE KEY` is supported |
| Vector column type | `ARRAY<FLOAT> NOT NULL` |
| Dimension consistency | The dimension of ingested vectors must match the index `dim` |

Minimal table creation example:

```sql
CREATE TABLE document_vectors (
    id BIGINT NOT NULL,
    embedding ARRAY<FLOAT> NOT NULL
)
DUPLICATE KEY(id)
DISTRIBUTED BY HASH(id) BUCKETS 8
PROPERTIES ("replication_num" = "1");
```

---

## End-to-End Operational Workflow

<!-- Knowledge type: Operational steps -->
<!-- Applicable scenarios: First-time deployment of vector retrieval -->

The complete workflow consists of 4 steps: create table -> configure index -> ingest data -> build and monitor index.

### Step 1: Create the Vector Table

There are two ways to create the table. Choose based on the data scale and ingestion mode:

| Method | Pros | Cons | Recommended scenario |
|---|---|---|---|
| Define the ANN index directly when creating the table | Queryable as soon as data is written | Slower ingestion | Small scale, streaming ingestion |
| Create the table and ingest data first, then `CREATE INDEX` + `BUILD INDEX` | Faster ingestion, controllable build timing | Requires an extra build step | Large-scale batch ingestion |

Example of defining an ANN index directly when creating the table:

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

### Step 2: Configure Vector Index Parameters

<!-- Knowledge type: Configuration parameters -->

Common parameters:

| Parameter | Values | Description |
|---|---|---|
| `index_type` | `hnsw` / `ivf` / `ivf_on_disk` | Index type |
| `metric_type` | `l2_distance` / `inner_product` | Distance metric |
| `dim` | Integer | Vector dimension |
| `quantizer` | `flat` / `sq8` / `sq4` / `pq` | Quantization method (optional) |

HNSW-specific parameters:

| Parameter | Default | Description |
|---|---|---|
| `max_degree` | `32` | Maximum number of neighbors per node |
| `ef_construction` | `40` | Search width during build |

IVF-specific parameters (shared by `ivf` and `ivf_on_disk`):

| Parameter | Default | Description |
|---|---|---|
| `nlist` | `1024` | Number of cluster centroids |

Example of creating the index after the table:

```sql
CREATE INDEX idx_embedding ON document_vectors (embedding) USING ANN PROPERTIES (
    "index_type" = "hnsw",
    "metric_type" = "l2_distance",
    "dim" = "768",
    "max_degree" = "64",
    "ef_construction" = "128"
);
```

### Step 3: Ingest Data

Recommended order for batch ingestion:

1. Create the table, **without building the index for now**
2. Batch-write the data (Stream Load / S3 TVF / SDK)
3. Build the index uniformly after the data ingestion is complete

In production environments, this batch mode is preferred. It can significantly reduce ingestion time.

### Step 4: Build the Index and Monitor

If the post-ingestion index creation method is used, you need to trigger it manually:

```sql
BUILD INDEX idx_embedding ON document_vectors;

SHOW BUILD INDEX WHERE TableName = "document_vectors";
```

Build states include: `PENDING`, `RUNNING`, `FINISHED`, `CANCELLED`.

---

## Query Patterns

<!-- Knowledge type: Operational examples -->

### TopN Nearest Neighbor Search

```sql
SELECT id, title,
       l2_distance_approximate(embedding, [0.1, 0.2, ...]) AS dist
FROM document_vectors
ORDER BY dist
LIMIT 10;
```

### Range Search

```sql
SELECT id, title
FROM document_vectors
WHERE l2_distance_approximate(embedding, [0.1, 0.2, ...]) < 0.5;
```

### Hybrid Search with Filter Conditions

```sql
SELECT id, title,
       l2_distance_approximate(embedding, [0.1, 0.2, ...]) AS dist
FROM document_vectors
WHERE category = 'AI'
ORDER BY dist
LIMIT 10;
```

In hybrid filtering scenarios, Doris uses a **pre-filtering** strategy, which balances both performance and recall.

---

## Using Cosine Similarity

<!-- Knowledge type: Operational steps -->
<!-- Applicable scenarios: Business metric is cosine -->

ANN indexes do not support configuring `metric_type="cosine"` directly. If your business needs to sort by cosine similarity, use the following pattern:

1. Apply L2 normalization to vectors before ingestion (convert them to unit vectors)
2. Use `metric_type="inner_product"` when creating the ANN index
3. Use `inner_product_approximate(...)` in queries, and sort by `ORDER BY ... DESC`

**Principle:**

- `cos(x, y) = (x · y) / (||x|| · ||y||)`
- After normalization, `||x|| = ||y|| = 1`, so `cos(x, y) = x · y`

In a unit-vector space, cosine sorting is equivalent to inner product sorting.

---

## Query and Build Tuning

<!-- Knowledge type: Performance tuning -->
<!-- Applicable scenarios: Recall not meeting requirements / Latency too high -->

### Query Parameters

| Index type | Tuning parameter | Effect |
|---|---|---|
| HNSW | `hnsw_ef_search` | Larger value yields higher recall and higher latency |
| IVF | `nprobe` or `ivf_nprobe` (depending on version) | Larger value yields higher recall |

```sql
SET hnsw_ef_search = 100;
SET nprobe = 128;
SET optimize_index_scan_parallelism = true;
```

### Build Recommendations

1. For large-scale data, run compaction first, then trigger the final index build
2. Control the segment scale to avoid impacting recall when segments are too large
3. Run A/B benchmarks on multiple parameter sets against the same dataset

### Capacity Estimation

- Rough vector memory formula: `dim * 4 bytes * row_count`
- Add the overhead of the ANN index structure on top of this
- Reserve a memory budget for non-vector columns and execution operators

For 10M / 100M scale capacity reference on single-node and distributed deployments, see [Large-Scale Performance Test](./performance-large-scale.md).

---

## Index Management

<!-- Knowledge type: Operational commands -->

Common management SQL:

```sql
-- View the index list
SHOW INDEX FROM document_vectors;

-- View data scale
SHOW DATA ALL FROM document_vectors;

-- Drop the index
ALTER TABLE document_vectors DROP INDEX idx_embedding;
```

To adjust index parameters, the recommended approach is to **drop the old index and rebuild it**.

---

## Common Troubleshooting

<!-- Knowledge type: Troubleshooting -->
<!-- Applicable scenarios: Troubleshooting -->

### Index Not Taking Effect

Investigate in this order:

1. Whether the index exists: run `SHOW INDEX`
2. Whether the index has finished building: run `SHOW BUILD INDEX`
3. Whether the query uses a distance function with the `_approximate` suffix

### Low Recall

| Investigation direction | Recommendation |
|---|---|
| HNSW parameters | Increase `max_degree`, `ef_construction`, `hnsw_ef_search` |
| IVF probe parameters | Increase `nprobe` / `ivf_nprobe` |
| Segment scale | Rebuild the index after compaction |

### High Query Latency

| Investigation direction | Recommendation |
|---|---|
| Cold query vs. hot query | Index loading time differs. You can warm up after service startup |
| `hnsw_ef_search` too large | Reduce it appropriately to lower latency |
| Parallel scan not enabled | Set `optimize_index_scan_parallelism = true` |
| BE memory pressure | Check BE memory levels and GC behavior |

### Ingestion Failure

| Common cause | Recommendation |
|---|---|
| Dimension mismatch | Check that the ingested vector dimension matches the index `dim` |
| NULL appears in the vector column | Fill or filter out NULL on the business side |
| Invalid vector array format | Validate the JSON / Stream Load payload format |

---

## FAQ

<!-- Knowledge type: Frequently asked questions -->

**Q1: Can ANN indexes be used on UNIQUE KEY or AGGREGATE KEY tables?**

No. ANN indexes **only support the DUPLICATE KEY model**.

**Q2: Can ANN indexes and inverted indexes be created at the same time?**

Yes. You can create both an ANN index and an inverted index on the same table. Combining text filtering with vector sorting enables the **hybrid retrieval** pattern that is common in online RAG.

**Q3: What if I need to use cosine similarity?**

ANN does not support `metric_type="cosine"`. Normalize the vectors and use `inner_product`, and the effect is equivalent. For details, see [Using Cosine Similarity](#using-cosine-similarity).

**Q4: What if BUILD INDEX is stuck in RUNNING?**

Check the progress with `SHOW BUILD INDEX`. Building a large table itself takes a long time, so first confirm whether it is still building normally. If there is no progress for a long time, check the BE memory and disk status.

**Q5: How do I adjust ANN index parameters?**

ANN index parameters do not support in-place modification. The recommendation is to **DROP INDEX first, then CREATE INDEX with the new parameters**, and finally BUILD INDEX.
