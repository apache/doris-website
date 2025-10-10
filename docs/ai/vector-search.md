---
{
  "title": "Vector Search",
  "language": "en"
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

In generative AI applications, relying solely on a large model's internal parameter “memory” has clear limitations: (1) the model’s knowledge becomes outdated and cannot cover the latest information; (2) directly asking the model to “generate” answers increases the risk of hallucinations. This gives rise to RAG (Retrieval-Augmented Generation). The key task of RAG is not to have the model fabricate answers from nothing, but to retrieve the Top-K most relevant information chunks from an external knowledge base and feed them to the model as grounding context.

To achieve this, we need a mechanism to measure semantic relatedness between a user query and documents in the knowledge base. Vector representations are a standard tool: by encoding both queries and documents into semantic vectors, we can use vector similarity to measure relevance. With the advancement of pretrained language models, generating high-quality embeddings has become mainstream. Thus, the retrieval stage of RAG becomes a typical vector similarity search problem: from a large vector collection, find the K vectors most similar to the query (i.e., candidate knowledge pieces).

Vector retrieval in RAG is not limited to text; it naturally extends to multimodal scenarios. In a multimodal RAG system, images, audio, video, and other data types can also be encoded into vectors for retrieval and then supplied to the generative model as context. For example, if a user uploads an image, the system can first retrieve related descriptions or knowledge snippets, then generate explanatory content. In medical QA, RAG can retrieve patient records and literature to support more accurate diagnostic suggestions.

## Brute-Force Search

Starting from version 2.0, Apache Doris supports nearest-neighbor search based on vector distance. Performing vector search with SQL is natural and simple:

```sql
SELECT id, l2_distance(embedding, [1.0, 2.0, xxx, 10.0]) AS distance
FROM   vector_table
ORDER  BY distance
LIMIT  10; 
```

When the dataset is small (under ~1 million rows), Doris’s exact K-Nearest Neighbor search performance is sufficient, providing 100% recall and precision. As the dataset grows, however, most users are willing to trade a small amount of recall/accuracy for significantly lower latency. The problem then becomes Approximate Nearest Neighbor (ANN) search.

## Approximate Nearest Neighbor Search

From version 4.0, Apache Doris officially supports ANN search. No additional data type is introduced: vectors are stored as fixed-length arrays. For distance-based indexing a new index type, ANN, is implemented based on Faiss.

Using the common [SIFT](http://corpus-texmex.irisa.fr/) dataset as an example, you can create a table like this:

```sql
CREATE TABLE sift_1M (
  id int NOT NULL,
  embedding array<float>  NOT NULL  COMMENT "",
  INDEX ann_index (embedding) USING ANN PROPERTIES(
      "index_type"="hnsw",
      "metric_type"="l2_distance",
      "dim"="128",
      "quantizer"="flat"
  )
) ENGINE=OLAP
DUPLICATE KEY(id) COMMENT "OLAP"
DISTRIBUTED BY HASH(id) BUCKETS 1
PROPERTIES (
  "replication_num" = "1"
);
```

- index_type: `hnsw` means using the [Hierarchical Navigable Small World algorithm](https://en.wikipedia.org/wiki/Hierarchical_navigable_small_world)
- metric_type: `l2_distance` means using L2 distance as the distance function
- dim: `128` means the vector dimension is 128
- quantizer: `flat` means each vector dimension is stored as original float32

| Parameter | Required | Supported/Options | Default | Description |
|-----------|----------|-------------------|---------|-------------|
| `index_type` | Yes | hnsw only | (none) | ANN index algorithm. Currently only HNSW supported. |
| `metric_type` | Yes | `l2_distance`, `inner_product` | (none) | Vector similarity/distance metric. L2 = Euclidean; inner_product can approximate cosine if vectors are normalized. |
| `dim` | Yes | Positive integer (> 0) | (none) | Vector dimension. All imported vectors must match or an error is raised. |
| `max_degree` | No | Positive integer | `32` | HNSW M (max neighbors per node). Affects index memory and search performance. |
| `ef_construction` | No | Positive integer | `40` | HNSW efConstruction (candidate queue size during build). Larger gives better quality but slower build. |
| `quantizer` | No | `flat`, `sq8`, `sq4` | `flat` | Vector encoding/quantization: `flat` = raw; `sq8`/`sq4` = symmetric quantization (8/4 bit) to reduce memory. |

Import via S3 TVF:

```sql
INSERT INTO sift_1M
SELECT *
FROM S3(
  "uri" = "https://selectdb-customers-tools-bj.oss-cn-beijing.aliyuncs.com/sift_database.tsv",
  "format" = "csv");

SELECT count(*) FROM sift_1M

+----------+
| count(*) |
+----------+
|  1000000 |
+----------+
```

The SIFT dataset ships with a ground-truth set for result validation. Pick one query vector and first run an exact Top-N using the precise distance:

```sql
SELECT id,
       L2_distance(
        embedding,
        [0,11,77,24,3,0,0,0,28,70,125,8,0,0,0,0,44,35,50,45,9,0,0,0,4,0,4,56,18,0,3,9,16,17,59,10,10,8,57,57,100,105,125,41,1,0,6,92,8,14,73,125,29,7,0,5,0,0,8,124,66,6,3,1,63,5,0,1,49,32,17,35,125,21,0,3,2,12,6,109,21,0,0,35,74,125,14,23,0,0,6,50,25,70,64,7,59,18,7,16,22,5,0,1,125,23,1,0,7,30,14,32,4,0,2,2,59,125,19,4,0,0,2,1,6,53,33,2]
       ) AS distance
FROM sift_1m
ORDER BY distance
LIMIT 10;
--------------

+--------+----------+
| id     | distance |
+--------+----------+
| 178811 | 210.1595 |
| 177646 | 217.0161 |
| 181997 | 218.5406 |
| 181605 | 219.2989 |
| 821938 | 221.7228 |
| 807785 | 226.7135 |
| 716433 | 227.3148 |
| 358802 | 230.7314 |
| 803100 | 230.9112 |
| 866737 | 231.6441 |
+--------+----------+
10 rows in set (0.29 sec)
```

When using `l2_distance` or `inner_product`, Doris computes the distance between the query vector and all 1,000,000 candidate vectors, then applies a TopN operator globally. Using `l2_distance_approximate` / `inner_product_approximate` triggers the index path:

```sql
SELECT id,
       l2_distance_approximate(
        embedding,
        [0,11,77,24,3,0,0,0,28,70,125,8,0,0,0,0,44,35,50,45,9,0,0,0,4,0,4,56,18,0,3,9,16,17,59,10,10,8,57,57,100,105,125,41,1,0,6,92,8,14,73,125,29,7,0,5,0,0,8,124,66,6,3,1,63,5,0,1,49,32,17,35,125,21,0,3,2,12,6,109,21,0,0,35,74,125,14,23,0,0,6,50,25,70,64,7,59,18,7,16,22,5,0,1,125,23,1,0,7,30,14,32,4,0,2,2,59,125,19,4,0,0,2,1,6,53,33,2]
       ) AS distance
FROM sift_1m
ORDER BY distance
LIMIT 10;
--------------

+--------+----------+
| id     | distance |
+--------+----------+
| 178811 | 210.1595 |
| 177646 | 217.0161 |
| 181997 | 218.5406 |
| 181605 | 219.2989 |
| 821938 | 221.7228 |
| 807785 | 226.7135 |
| 716433 | 227.3148 |
| 358802 | 230.7314 |
| 803100 | 230.9112 |
| 866737 | 231.6441 |
+--------+----------+
10 rows in set (0.02 sec)
```

With the ANN index, query latency in this example drops from about 290 ms to 20 ms.

ANN indexes are built at the segment granularity. Because tables are distributed, after each segment returns its local TopN, the TopN operator merges results across tablets and segments to produce the global TopN.

Note: When `metric_type = l2_distance`, a smaller distance means closer vectors. For `inner_product`, a larger value means closer vectors. Therefore, if using `inner_product`, you must use `ORDER BY dist DESC` to obtain TopN via the index.

## Approximate Range Search

Beyond the common TopN nearest neighbor search (returning the closest N records), another typical pattern is threshold-based range search. Instead of returning a fixed number of results, it returns all points whose distance to the target vector satisfies a predicate (>, >=, <, <=). For example, you might want vectors whose distance is greater than or less than a threshold. This is useful when you need candidates that are “sufficiently similar” or “sufficiently dissimilar.” In recommendation systems you might retrieve items that are close but not identical to improve diversity; in anomaly detection you look for points far from the normal distribution.

Example SQL:

```sql
SELECT count(*)
FROM   sift_1m
WHERE  l2_distance_approximate(
        embedding,
        [0,11,77,24,3,0,0,0,28,70,125,8,0,0,0,0,44,35,50,45,9,0,0,0,4,0,4,56,18,0,3,9,16,17,59,10,10,8,57,57,100,105,125,41,1,0,6,92,8,14,73,125,29,7,0,5,0,0,8,124,66,6,3,1,63,5,0,1,49,32,17,35,125,21,0,3,2,12,6,109,21,0,0,35,74,125,14,23,0,0,6,50,25,70,64,7,59,18,7,16,22,5,0,1,125,23,1,0,7,30,14,32,4,0,2,2,59,125,19,4,0,0,2,1,6,53,33,2])
        > 300 
--------------

+----------+
| count(*) |
+----------+
|   999271 |
+----------+
1 row in set (0.19 sec)
```

These range-based vector searches are also accelerated by the ANN index: the index first narrows candidates, then approximate distances are computed, reducing cost and improving latency. Supported predicates: `>`, `>=`, `<`, `<=`.

## Compound Search

Compound Search combines an ANN TopN search with a range predicate in the same SQL statement, returning the TopN results that also satisfy a distance constraint.

```sql
SELECT id,
       l2_distance_approximate(
        embedding, [0,11,77,24,3,0,0,0,28,70,125,8,0,0,0,0,44,35,50,45,9,0,0,0,4,0,4,56,18,0,3,9,16,17,59,10,10,8,57,57,100,105,125,41,1,0,6,92,8,14,73,125,29,7,0,5,0,0,8,124,66,6,3,1,63,5,0,1,49,32,17,35,125,21,0,3,2,12,6,109,21,0,0,35,74,125,14,23,0,0,6,50,25,70,64,7,59,18,7,16,22,5,0,1,125,23,1,0,7,30,14,32,4,0,2,2,59,125,19,4,0,0,2,1,6,53,33,2]) as dist
FROM sift_1M
WHERE l2_distance_approximate(
        embedding, [0,11,77,24,3,0,0,0,28,70,125,8,0,0,0,0,44,35,50,45,9,0,0,0,4,0,4,56,18,0,3,9,16,17,59,10,10,8,57,57,100,105,125,41,1,0,6,92,8,14,73,125,29,7,0,5,0,0,8,124,66,6,3,1,63,5,0,1,49,32,17,35,125,21,0,3,2,12,6,109,21,0,0,35,74,125,14,23,0,0,6,50,25,70,64,7,59,18,7,16,22,5,0,1,125,23,1,0,7,30,14,32,4,0,2,2,59,125,19,4,0,0,2,1,6,53,33,2])
        > 300
ORDER BY dist limit 10
--------------

+--------+----------+
| id     | dist     |
+--------+----------+
| 243590 |  300.005 |
| 549298 | 300.0317 |
| 429685 | 300.0533 |
| 690172 | 300.0916 |
| 123410 | 300.1333 |
| 232540 | 300.1649 |
| 547696 | 300.2066 |
| 855437 | 300.2782 |
| 589017 | 300.3048 |
| 930696 | 300.3381 |
+--------+----------+
10 rows in set (0.12 sec)
```

A key question is whether predicate filtering happens before or after TopN. If predicates filter first and TopN is applied on the reduced set, it’s pre-filtering; otherwise, it’s post-filtering. Post-filtering can be faster but may dramatically reduce recall. Doris uses pre-filtering to preserve recall.

Doris can accelerate both phases with the index. However, if the first phase (range filter) is too selective, indexing both phases can hurt recall. Doris adaptively decides whether to use the index twice based on predicate selectivity and index type.

## ANN Search with Additional Filters

This refers to applying other predicates before the ANN TopN and returning the TopN under those constraints.

Example with a small 8-D vector and a text filter:

```sql
CREATE TABLE ann_with_fulltext (
  id int NOT NULL,
  embedding array<float> NOT NULL,
  comment String NOT NULL,
  value int NULL,
  INDEX idx_comment(`comment`) USING INVERTED PROPERTIES("parser" = "english") COMMENT 'inverted index for comment',
  INDEX ann_embedding(`embedding`) USING ANN PROPERTIES("index_type"="hnsw","metric_type"="l2_distance","dim"="8")
) DUPLICATE KEY (`id`) 
DISTRIBUTED BY HASH(`id`) BUCKETS 1
PROPERTIES("replication_num"="1");
```

Insert sample data and search only within rows where `comment` contains “music”:
```sql
INSERT INTO ann_with_fulltext VALUES
(1, [0.1,0.2,0.3,0.4,0.5,0.6,0.7,0.8], 'this is about music', 10),
(2, [0.2,0.1,0.5,0.3,0.9,0.4,0.7,0.1], 'sports news today',   20),
(3, [0.9,0.8,0.7,0.6,0.5,0.4,0.3,0.2], 'latest music trend',  30),
(4, [0.05,0.06,0.07,0.08,0.09,0.1,0.2,0.3], 'politics update',40);

SELECT id, comment,
       l2_distance_approximate(embedding, [0.1,0.1,0.2,0.2,0.3,0.3,0.4,0.4]) AS dist
FROM ann_with_fulltext
WHERE comment MATCH_ANY 'music'       -- Filter using inverted index
ORDER BY dist ASC                     -- Ann topn calculation after predicates evaluate.
LIMIT 2;

+------+---------------------+----------+
| id   | comment             | dist     |
+------+---------------------+----------+
|    1 | this is about music | 0.663325 |
|    3 | latest music trend  | 1.280625 |
+------+---------------------+----------+
2 rows in set (0.04 sec)
```

To ensure TopN can be accelerated via the vector index, all predicate columns should have appropriate secondary indexes (e.g., an inverted index).

## Session Variables Related to ANN Search

Beyond build-time parameters for HNSW, you can pass search-time parameters via session variables:

- hnsw_ef_search: EF search parameter. Controls max length of the candidate queue; larger = higher accuracy, higher latency. Default 32.
- hnsw_check_relative_distance: Whether to enable relative distance checking to improve accuracy. Default true.
- hnsw_bounded_queue: Whether to use a bounded priority queue to optimize performance. Default true.

## Vector Quantization

With FLAT encoding, an HNSW index (raw vectors plus graph structure) may consume large amounts of memory. HNSW must be fully resident in memory to function, so memory can become a bottleneck at large scale.

Vector quantization compresses float32 storage to reduce memory. Doris currently supports two scalar quantization schemes: INT8 and INT4 (SQ8 / SQ4). Example using SQ8:

```sql
CREATE TABLE sift_1M (
  id int NOT NULL,
  embedding array<float>  NOT NULL  COMMENT "",
  INDEX ann_index (embedding) USING ANN PROPERTIES(
      "index_type"="hnsw",
      "metric_type"="l2_distance",
      "dim"="128",
      "quantizer"="sq8"
  )
) ENGINE=OLAP
DUPLICATE KEY(id) COMMENT "OLAP"
DISTRIBUTED BY HASH(id) BUCKETS 1
PROPERTIES (
  "replication_num" = "1"
);
```

On 768-D Cohere-MEDIUM-1M and Cohere-LARGE-10M datasets, SQ8 reduces index size to roughly one third compared to FLAT.

| Dataset | Dim | Storage/Index Scheme | Total Disk | Data Part | Index Part | Notes |
|---------|-----|----------------------|------------|-----------|------------|-------|
| Cohere-MEDIUM-1M | 768D | Doris (FLAT) | 5.647 GB (2.533 + 3.114) | 2.533 GB | 3.114 GB | 1M vectors |
| Cohere-MEDIUM-1M | 768D | Doris SQ INT8 | 3.501 GB (2.533 + 0.992) | 2.533 GB | 0.992 GB | INT8 symmetric quantization |
| Cohere-LARGE-10M | 768D | Doris (FLAT) | 56.472 GB (25.328 + 31.145) | 25.328 GB | 31.145 GB | 10M vectors |
| Cohere-LARGE-10M | 768D | Doris SQ INT8 | 35.016 GB (25.329 + 9.687) | 25.329 GB | 9.687 GB | INT8 quantization |

Quantization introduces extra build-time overhead because each distance computation must decode quantized values. For 128-D vectors, build time increases with row count; SQ vs. FLAT can be up to ~10× slower to build.

![ANN-SQ-BUILD_COSTS](/images/ann-sq-build-time.png)

## Performance Tuning

Vector search is a typical secondary-index point lookup scenario. For high QPS and low latency, consider the following:

With tuning, on hardware FE 32C 64GB + BE 32C 64GB, Doris can reach 3000+ QPS (dataset: Cohere-MEDIUM-1M).

### Query Performance

| Concurrency | Scheme | QPS | Avg Latency (s) | P99 (s) | CPU Usage | Recall |
|-------------|--------|-----|-----------------|---------|-----------|--------|
| 240 | Doris | 3340.4399 | 0.071368168 | 0.163399825 | 40% | 91.00% |
| 240 | Doris SQ INT8 | 3188.6359 | 0.074728852 | 0.160370195 | 40% | 88.26% |
| 240 | Doris SQ INT4 | 2818.2291 | 0.084663868 | 0.174826815 | 43% | 80.38% |
| 240 | Doris brute force | 3.6787 | 25.554878826 | 29.363227973 | 100% | 100.00% |
| 480 | Doris | 4155.7220 | 0.113387271 | 0.261086075 | 60% | 91.00% |
| 480 | Doris SQ INT8 | 3833.1130 | 0.123040214 | 0.276912867 | 50% | 88.26% |
| 480 | Doris SQ INT4 | 3431.0538 | 0.137636995 | 0.281631249 | 57% | 80.38% |
| 480 | Doris brute force | 3.6787 | 25.554878826 | 29.363227973 | 100% | 100.00% |

### Use Prepared Statements

Modern embedding models often output 768-D or higher vectors. If you inline a 768-D literal into SQL, parsing time can exceed execution time. Use prepared statements. Currently Doris does not support MySQL client prepare commands directly; use JDBC:

1. Enable server-side prepared statements in the JDBC URL:  
   `jdbc:mysql://127.0.0.1:9030/demo?useServerPrepStmts=true`
2. Use PreparedStatement with placeholders (`?`) and reuse it.

### Reduce Segment Count

ANN indexes are built per segment. Too many segments cause overhead. Ideally each tablet should have no more than ~5 segments for an ANN-indexed table. Adjust `write_buffer_size` and `vertical_compaction_max_segment_size` in `be.conf` (e.g., both to 10737418240).

### Reduce Rowset Count

Same motivation as reducing segments: minimize scheduling overhead. Each load creates a rowset, so prefer stream load or `INSERT INTO SELECT` for batched ingestion.

### Keep ANN Index in Memory

Current ANN algorithms are memory-based. If a segment’s index is not in memory, a disk I/O occurs. Set `enable_segment_cache_prune=false` in `be.conf` to keep ANN indexes resident.

### parallel_pipeline_task_num = 1

ANN TopN queries return very few rows from each scanner, so high pipeline task parallelism is unnecessary. Set `parallel_pipeline_task_num = 1`.

### enable_profile = false

Disable query profiling for ultra latency-sensitive queries.

## Usage Limitations

1. The ANN index column must be a NOT NULL `Array<Float>`, and every imported vector must match the declared `dim`, otherwise an error is thrown.
2. ANN index is only supported on DuplicateKey table model.
3. Doris uses pre-filter semantics (predicates applied before ANN TopN). If predicates include columns without secondary indexes that can precisely locate rows (e.g., no inverted index), Doris falls back to brute force to preserve correctness.
   Example:
   ```sql
   SELECT id, l2_distance_approximate(embedding, [xxx]) AS distance
   FROM sift_1M
   WHERE round(id) > 100
   ORDER BY distance LIMIT 10;
   ```
  Although `id` is a key, without a secondary index (such as an inverted index), its predicate is applied after index analysis, so Doris falls back to brute force to honor pre-filter semantics.

4. If the distance function in SQL does not match the metric type defined in the index DDL, Doris cannot use the ANN index for TopN—even if you call `l2_distance_approximate` / `inner_product_approximate`.
5. For metric type `inner_product`, only `ORDER BY inner_product_approximate(...) DESC LIMIT N` (DESC required) can be accelerated by the ANN index.
6. The first parameter of `xxx_approximate()` must be a ColumnArray, and the second must be a CAST or ArrayLiteral. Reversing them triggers brute-force search.
