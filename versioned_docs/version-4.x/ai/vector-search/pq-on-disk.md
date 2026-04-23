---
{
    "title": "PQ On-Disk",
    "language": "en",
    "description": "PQ On-Disk is a disk-backed vector reranking mode in Apache Doris. It is designed for selective filter-first workloads such as multi-tenant vector search, and uses PQ-encoded vectors to accelerate brute-force distance evaluation on filtered rows."
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

# PQ On-Disk in Apache Doris

`pq_on_disk` is a vector index mode in Apache Doris for **filter-first vector search**. It stores Product Quantization (PQ) codes on disk, keeps only the PQ codebook and hot chunks in memory, and uses the compressed vectors to accelerate brute-force-style distance evaluation on rows that have already passed scalar filtering.

This feature is especially useful in **multi-tenant vector search**. In many SaaS-style workloads, vectors from many tenants are stored together in the same segment. If you build a global `hnsw` or `ivf` index on that mixed data and then query with predicates such as `WHERE tenant_id = ?`, the ANN recall can degrade significantly because the global recall structure was built across all tenants rather than for one tenant's local subset. `pq_on_disk` avoids this problem by not depending on a global cross-tenant recall structure. Instead, Doris first applies the tenant filter, then uses PQ codes to accelerate vector scoring inside the filtered subset.

## When to Use PQ On-Disk

Use `pq_on_disk` when your query pattern is usually:

```sql
WHERE <highly_selective_filter>
ORDER BY l2_distance_approximate(...) LIMIT N
```

Typical examples include:

- `WHERE tenant_id = ?`
- `WHERE user_id = ?`
- `WHERE category_id = ? AND status = 'active'`
- `WHERE tag MATCH_ANY '...'
  ORDER BY l2_distance_approximate(...) LIMIT N`

This is a different operating point from global ANN search:

- `hnsw` and `ivf` are designed for **global ANN recall** across a large vector collection.
- `ivf_on_disk` keeps the IVF recall model but moves the main IVF data to disk to reduce memory pressure.
- `pq_on_disk` is designed for **filtered-subset reranking**, where the candidate set is already narrowed down by ordinary predicates and Doris needs a faster way to score those rows.

## Why It Helps in Multi-Tenant Search

Suppose a segment contains vectors from 10,000 tenants. A global HNSW or IVF index is built over all rows in the segment. If the query is:

```sql
SELECT doc_id
FROM tenant_embeddings
WHERE tenant_id = 10001
ORDER BY l2_distance_approximate(embedding, <query_vector>)
LIMIT 20;
```

The query only cares about one tenant's rows, but the global ANN structure was trained or connected using vectors from all tenants. The nearest paths, graph edges, or IVF partitions that are good for global recall are not necessarily good for recall **after tenant filtering**.

`pq_on_disk` addresses this case differently:

1. Doris first applies the scalar predicate such as `tenant_id = 10001`.
2. It obtains a filtered candidate set for that tenant.
3. Instead of computing full float32 brute-force distances on every filtered row, Doris uses PQ-encoded vectors to evaluate distances much faster.
4. PQ code data is read from disk in rowid order and reused through a dedicated chunk cache.

As a result, `pq_on_disk` is often a better fit than global ANN structures when:

- the filter is highly selective,
- recall under post-filter/global ANN is unstable,
- and full brute-force over raw vectors is still too expensive.

## Quick Start

### Create a table

The following example uses `tenant_id` as the main filter column:

```sql
CREATE TABLE tenant_embeddings (
  tenant_id BIGINT NOT NULL,
  doc_id BIGINT NOT NULL,
  embedding ARRAY<FLOAT> NOT NULL,
  INDEX idx_embedding (embedding) USING ANN PROPERTIES (
    "index_type" = "pq_on_disk",
    "metric_type" = "l2_distance",
    "dim" = "768",
    "pq_m" = "96",
    "pq_nbits" = "8"
  )
) ENGINE=OLAP
DUPLICATE KEY(tenant_id, doc_id)
DISTRIBUTED BY HASH(tenant_id) BUCKETS 8
PROPERTIES (
  "replication_num" = "1"
);
```

### Basic query

```sql
SELECT doc_id,
       l2_distance_approximate(embedding, array_repeat(CAST(0.01 AS FLOAT), 768)) AS score
FROM tenant_embeddings
WHERE tenant_id = 10001
ORDER BY score ASC
LIMIT 20;
```

This query pattern is the primary target of `pq_on_disk`: filter first, then do fast vector Top-N inside the filtered rows.

## How PQ On-Disk Works

At a high level:

1. Doris trains a PQ codebook for the segment.
2. Raw vectors are encoded into compact PQ codes.
3. PQ codes are stored on disk in rowid order.
4. At query time, Doris first evaluates ordinary predicates.
5. For rows that survive filtering, Doris loads the corresponding PQ chunks and computes approximate distances using PQ codes instead of full raw vectors.

So `pq_on_disk` is best understood as **PQ-accelerated filtered brute-force**, rather than a global ANN recall structure like HNSW or IVF.

## User-Facing Interfaces

### 1) Index DDL

Use `index_type="pq_on_disk"` in ANN index properties.

```sql
CREATE TABLE image_pool (
  user_id BIGINT NOT NULL,
  photo_id BIGINT NOT NULL,
  embedding ARRAY<FLOAT> NOT NULL,
  INDEX idx_emb (embedding) USING ANN PROPERTIES (
    "index_type" = "pq_on_disk",
    "metric_type" = "l2_distance",
    "dim" = "768",
    "pq_m" = "96",
    "pq_nbits" = "8"
  )
) ENGINE=OLAP
DUPLICATE KEY(user_id, photo_id)
DISTRIBUTED BY HASH(user_id) BUCKETS 8
PROPERTIES ("replication_num" = "1");
```

### 2) Typical query patterns

Top-N after filtering:

```sql
SELECT photo_id
FROM image_pool
WHERE user_id = 10001
ORDER BY l2_distance_approximate(embedding, array_repeat(CAST(0.01 AS FLOAT), 768)) ASC
LIMIT 20;
```

Prepared-statement style query:

```sql
SELECT photo_id
FROM image_pool
WHERE user_id = ?
ORDER BY l2_distance_approximate(embedding, CAST(? AS ARRAY<FLOAT>)) ASC
LIMIT 20;
```

For inner-product search, sort in descending order:

```sql
SELECT photo_id
FROM image_pool
WHERE user_id = 10001
ORDER BY inner_product_approximate(embedding, array_repeat(CAST(0.01 AS FLOAT), 768)) DESC
LIMIT 20;
```

Range search is also supported:

```sql
SELECT photo_id
FROM image_pool
WHERE user_id = 10001
  AND l2_distance_approximate(embedding, array_repeat(CAST(0.01 AS FLOAT), 768)) < 500.0
ORDER BY photo_id;
```

## Parameters and Constraints

### Index parameters

| Property | Required | Default | Description |
|---|---|---|---|
| `index_type` | Yes | - | Must be `pq_on_disk`. |
| `metric_type` | Yes | - | `l2_distance` or `inner_product`. |
| `dim` | Yes | - | Vector dimension. |
| `pq_m` | Yes | - | Number of PQ subquantizers. Must divide `dim`. |
| `pq_nbits` | No | `8` | Number of bits per subquantizer code. |

### Training behavior

`pq_on_disk` needs enough rows to train the PQ codebook. The minimum training row count is:

```text
(1 << pq_nbits) * 100
```

Examples:

- `pq_nbits = 8` requires at least `25600` training rows.
- `pq_nbits = 4` requires at least `1600` training rows.

If a segment does not have enough rows to train the PQ index, Doris can fall back to brute-force search for that segment.

## BE Cache Configuration

`pq_on_disk` uses a dedicated chunk cache for PQ code data:

- `ann_index_pq_chunk_cache_limit` (default: `60%`)
- `ann_index_pq_chunk_cache_stale_sweep_time_sec` (default: `1800`)

The percentage value of `ann_index_pq_chunk_cache_limit` is based on process-available memory (`mem_limit`), not total machine memory.

## Observability

`pq_on_disk` introduces a dedicated BE cache named `AnnIndexPqChunkCache`.

When troubleshooting, check the following first:

- Whether the query is actually selective enough.
- Whether the filtered rows have good locality.
- Whether the PQ chunk cache is large enough to avoid repeated disk reads.
- Whether some segments are falling back to brute force because they do not have enough rows for PQ training.

## Usage Notes

- `pq_on_disk` is intended for **filter-first** workloads, not for global ANN recall across the whole segment.
- It is particularly suitable for **multi-tenant vector search** where rows from many tenants are mixed in the same segment.
- It supports both `l2_distance` and `inner_product`, including Top-N and range-search style queries.
- Query result ordering must match metric semantics: `l2_distance_approximate` uses ascending order, while `inner_product_approximate` uses descending order.
- Data locality matters. It works best when rows for the same filter key are physically close so PQ chunk reads are more sequential.
- For very small segments or insufficient training data, Doris may not build the PQ index and can fall back to brute force.

## Best Practices

1. Choose `pq_on_disk` when the query pattern is usually **filter first, rerank second**.
2. Prefer it for **tenant-aware retrieval** such as `WHERE tenant_id = ? ORDER BY ... LIMIT N`.
3. Keep the filter column selective. The smaller the filtered candidate set, the more suitable `pq_on_disk` becomes.
4. Start with `pq_nbits = 8` unless you intentionally want a smaller code size at the cost of recall.
5. Choose `pq_m` so that `dim / pq_m` is reasonable for your model dimension and business recall target.
6. Use prepared statements for 768-D and higher query vectors to reduce SQL parsing overhead.
7. Validate on real business distributions, especially when tenant sizes are very uneven.

## How to Choose Between `hnsw`, `ivf_on_disk`, and `pq_on_disk`

Use `hnsw` when:

- You need high-recall global ANN search.
- Query latency is the top priority and enough memory is available.

Use `ivf_on_disk` when:

- You still need a global IVF-style ANN recall model.
- Memory is limited, but the query still searches a large global vector collection.

Use `pq_on_disk` when:

- The query already has a highly selective scalar filter.
- Rows from different tenants or users are mixed in the same segment.
- Global ANN recall under tenant/user filtering is poor.
- You want to accelerate filtered brute-force scoring with compressed vectors.

In short, `pq_on_disk` is not a replacement for all ANN structures. It is the right choice when the main problem is **efficient vector reranking inside a filtered subset**, especially in multi-tenant workloads.