---
{
    "title": "IVF On-Disk",
    "language": "en",
    "description": "IVF On-Disk is an ANN index mode in Apache Doris that keeps IVF list data on disk and uses a dedicated cache to balance memory usage and query performance for large-scale vector search."
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

# IVF On-Disk in Apache Doris

`ivf_on_disk` is an ANN index type for large-scale vector search in Doris. It keeps IVF inverted-list data on disk, while loading hot data through a dedicated cache at query time. This makes it possible to run high-recall IVF search with a lower steady-state memory footprint than fully in-memory IVF.

## Why IVF On-Disk

For pure in-memory IVF, memory usage grows with vector count and dimensions. At tens of millions of vectors, index memory can become the bottleneck. `ivf_on_disk` is designed for this scenario:

- Retain IVF retrieval behavior (`nlist`/`nprobe` tuning model).
- Move IVF list payload from mandatory full-memory residency to disk + cache.
- Keep SQL usage and index DDL close to existing ANN workflows.

## Scope and User Value

Compared with `ivf`, `ivf_on_disk` focuses on a different operating point:

- Better memory elasticity under large data scale.
- More controllable memory-performance tradeoff via cache sizing.
- Similar SQL semantics and index tuning approach for users already familiar with IVF.

It is suitable when memory budget is tight, but brute-force scan is too slow and users still need ANN acceleration.

## User-Facing Interfaces

### 1) Index DDL

Use `index_type="ivf_on_disk"` in ANN index properties.

```sql
CREATE TABLE vec_tbl (
  id BIGINT NOT NULL,
  embedding ARRAY<FLOAT> NOT NULL,
  INDEX idx_emb (embedding) USING ANN PROPERTIES (
    "index_type" = "ivf_on_disk",
    "metric_type" = "l2_distance",
    "dim" = "768",
    "nlist" = "1024"
  )
) ENGINE=OLAP
DUPLICATE KEY(id)
DISTRIBUTED BY HASH(id) BUCKETS 8
PROPERTIES ("replication_num" = "1");
```

Notes:

- `nlist` is required for both `ivf` and `ivf_on_disk`.
- `metric_type` supports `l2_distance` and `inner_product`.
- Query syntax remains the same (`l2_distance_approximate` / `inner_product_approximate`).

### 2) Query-time IVF parameter

`ivf_nprobe` continues to be the main query-time parameter:

```sql
SET ivf_nprobe = 64;
```

Larger `nprobe` usually improves recall while increasing latency.

### 3) BE cache configuration

`ivf_on_disk` introduces a dedicated cache for IVF list data:

- `ann_index_ivf_list_cache_limit` (default: `70%`)
- `ann_index_ivf_list_cache_stale_sweep_time_sec` (default: `3600`)

The percentage value of `ann_index_ivf_list_cache_limit` is based on process-available memory (`mem_limit`), not total machine memory.

## Observability

For `ivf_on_disk`, Doris provides dedicated profile counters and BE metrics.

Common profile counters include:

- `AnnIvfOnDiskLoadCosts`
- `AnnIvfOnDiskCacheHitCnt`
- `AnnIvfOnDiskCacheMissCnt`

Common BE metrics include:

- `ann_ivf_on_disk_fetch_page_costs_ms`
- `ann_ivf_on_disk_fetch_page_cnt`
- `ann_ivf_on_disk_search_costs_ms`
- `ann_ivf_on_disk_search_cnt`
- `ann_ivf_on_disk_cache_hit_cnt`
- `ann_ivf_on_disk_cache_miss_cnt`

These metrics help estimate whether the current cache size is appropriate and whether latency comes from cache misses or compute.

## Usage Notes

- `ivf_on_disk` follows the same ANN table constraints as existing ANN indexes (for example, vector column type and key model constraints).
- Training quality still depends on data scale and parameter choice (`nlist`, `ivf_nprobe`).
- `ivf_on_disk` supports regular ingestion paths such as Stream Load. Use validation on your own workload before production rollout.

## Performance Reference

The following results are a reference benchmark snapshot. They show the practical tradeoff between cache coverage, memory usage, and latency under similar recall.

| Scenario | Memory Usage (GB) | AnnIndexIVFListCache Hit Ratio | Max QPS | Recall@100 | Avg Latency (s) | P99 Latency (s) | P95 Latency (s) |
|---|---:|---:|---:|---:|---:|---:|---:|
| Brute Force (No Index) | - | - | 0.2922 | 0.0000 | 292.5394 | 307.9490 | 307.9442 |
| IVF In Memory | 32.0 | 100% | 71.8535 | 0.9598 | 0.4167 | 0.5623 | 0.5151 |
| OnDisk Cache 100% | 32.0 | 100% | 72.3649 | 0.9599 | 0.8274 | 1.1236 | 1.0395 |
| OnDisk Cache 79% | 22.0 | 70% | 45.0266 | 0.9599 | 1.9900 | 4.4059 | 3.3568 |
| OnDisk Cache 60% | 16.7 | 55% | 38.3141 | 0.9599 | 2.3281 | 4.0063 | 3.5542 |

How to read this table:

- Under similar recall (~0.96), reducing cache size lowers memory usage but increases tail latency.
- At full cache coverage, `ivf_on_disk` keeps recall close to in-memory IVF with a moderate latency increase.
- Cache hit ratio is a key indicator for sizing `ann_index_ivf_list_cache_limit`.

## Tuning Suggestions

1. Start with the same `nlist` / `ivf_nprobe` baseline you use for `ivf`.
2. Set `ann_index_ivf_list_cache_limit` according to memory budget, then observe cache hit/miss metrics.
3. Increase cache first if recall is stable but latency is unstable due to frequent misses.
4. Re-tune `nprobe` after cache ratio changes to rebalance recall and latency.
