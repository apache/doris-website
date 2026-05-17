---
{
    "title": "IVF On-Disk",
    "language": "en",
    "description": "The Apache Doris IVF On-Disk index stores inverted lists on disk and uses a dedicated cache to reduce memory footprint for large-scale vector retrieval.",
    "keywords": [
        "IVF On-Disk",
        "Apache Doris vector index",
        "ANN index",
        "ivf_on_disk",
        "vector retrieval memory optimization",
        "ivf_nprobe",
        "ann_index_ivf_list_cache_limit",
        "large-scale vector retrieval"
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

# IVF On-Disk in Apache Doris

<!-- Knowledge type: Capability definition + Configuration parameters + Performance reference -->
<!-- Applicable scenarios: Large-scale vector retrieval / Constrained memory budget / ANN index selection -->

`ivf_on_disk` is an index type that Apache Doris provides for large-scale vector retrieval (ANN) scenarios. It stores the main body of the IVF inverted lists on disk and loads hot data on demand through a dedicated cache, significantly reducing resident memory usage while preserving IVF retrieval capabilities.

## Quick navigation

- To learn why `ivf_on_disk` is needed, read [Background and goals](#background-and-goals).
- To start using it directly in table creation, read [Index DDL](#1-index-ddl) and [Query parameters](#2-query-parameters).
- To control memory usage, read [BE cache configuration](#3-be-cache-configuration) and [Tuning recommendations](#tuning-recommendations).
- To evaluate real-world behavior, read [Performance reference data](#performance-reference-data).
- To compare with in-memory IVF, read [Comparison with IVF](#comparison-with-ivf).

## Background and goals

<!-- Knowledge type: Capability definition -->

When the vector scale reaches tens of millions or more, the index memory cost of pure in-memory IVF rises rapidly and becomes a resource bottleneck. The design goals of `ivf_on_disk` include:

- Preserve the parameter model and retrieval semantics of IVF (`nlist` / `nprobe`).
- Switch from a "must reside fully in memory" mode to a "disk + dedicated cache" mode.
- Allow users to continue using existing ANN SQL usage and operational practices.

In short, `ivf_on_disk` is mainly aimed at production scenarios where **the memory budget is constrained but ANN acceleration is still required**.

## Comparison with IVF

<!-- Knowledge type: Architecture selection decision -->

The following table helps you quickly decide when to choose `ivf_on_disk` over `ivf`.

| Comparison dimension | `ivf` (in memory)   | `ivf_on_disk` (disk + cache)                |
| -------------------- | ------------------- | ------------------------------------------- |
| Inverted list storage | Fully in memory    | Mainly on disk, loaded on demand via cache  |
| Memory usage         | High, grows linearly with data volume | Significantly lower, can be explicitly capped by the cache limit |
| Query latency        | Lowest              | Slightly higher than in-memory IVF, affected by cache hit ratio |
| Parameter model      | `nlist` / `nprobe`  | Identical                                   |
| Query functions      | ANN query functions | Identical                                   |
| Applicable scale     | Small to medium     | Tens of millions and above                  |
| Migration cost       | -                   | Low, only requires changing `index_type`    |

## User interface

### 1) Index DDL

<!-- Knowledge type: Operational steps -->

Create an ANN index by specifying `index_type="ivf_on_disk"`:

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

Key notes:

- Both `ivf` and `ivf_on_disk` must explicitly specify `nlist`.
- `metric_type` supports `l2_distance` and `inner_product`.
- The query functions remain the same: `l2_distance_approximate` / `inner_product_approximate`.

### 2) Query parameters

<!-- Knowledge type: Configuration parameters -->

`ivf_nprobe` remains the most critical query-phase parameter for the IVF family:

```sql
SET ivf_nprobe = 64;
```

In general, a larger `nprobe` yields a higher recall, but query latency rises accordingly.

### 3) BE cache configuration

<!-- Knowledge type: Configuration parameters -->

`ivf_on_disk` introduces a dedicated cache for IVF inverted lists. The related BE configurations are as follows:

| Configuration item                              | Default | Description                                                |
| ----------------------------------------------- | ------- | ---------------------------------------------------------- |
| `ann_index_ivf_list_cache_limit`                | `70%`   | Cache upper limit. The percentage is based on the BE process available memory (constrained by `mem_limit`), not the physical memory of the entire machine. |
| `ann_index_ivf_list_cache_stale_sweep_time_sec` | `3600`  | Cleanup interval for stale entries in the cache, in seconds. |

## Observability

<!-- Knowledge type: Monitoring metrics -->
<!-- Applicable scenarios: Troubleshooting / Performance tuning -->

To help locate performance bottlenecks of `ivf_on_disk`, dedicated Profile counters and BE metrics are provided. They can be used to determine whether the current cache size is appropriate and whether latency mainly comes from disk page faults or from the retrieval computation itself.

Common Profile fields:

- `AnnIvfOnDiskLoadCosts`
- `AnnIvfOnDiskCacheHitCnt`
- `AnnIvfOnDiskCacheMissCnt`

Common BE metrics:

- `ann_ivf_on_disk_fetch_page_costs_ms`
- `ann_ivf_on_disk_fetch_page_cnt`
- `ann_ivf_on_disk_search_costs_ms`
- `ann_ivf_on_disk_search_cnt`
- `ann_ivf_on_disk_cache_hit_cnt`
- `ann_ivf_on_disk_cache_miss_cnt`

## Usage notes

<!-- Knowledge type: Usage constraints -->

- `ivf_on_disk` shares the major usage constraints of existing ANN indexes (such as vector column types and the validity of index parameters).
- Training quality and retrieval effectiveness still depend on the data scale and the parameter combination (`nlist`, `ivf_nprobe`).
- `ivf_on_disk` supports common ingestion paths such as Stream Load. You are advised to validate it with your business data before going to production.

## Performance reference data

<!-- Knowledge type: Performance reference -->

The following table is a reference benchmark snapshot that illustrates the practical trade-offs among cache coverage, memory usage, and latency.

| Scenario               | Memory usage (GB) | AnnIndexIVFListCache hit ratio | Max QPS | Recall@100 | Average latency (s) | P99 latency (s) | P95 latency (s) |
| ---------------------- | ----------------: | -----------------------------: | ------: | ---------: | ------------------: | --------------: | --------------: |
| Brute Force (No Index) |                 - |                              - |  0.2922 |     0.0000 |            292.5394 |        307.9490 |        307.9442 |
| IVF In Memory          |              32.0 |                           100% | 71.8535 |     0.9598 |              0.4167 |          0.5623 |          0.5151 |
| OnDisk Cache 100%      |              32.0 |                           100% | 72.3649 |     0.9599 |              0.8274 |          1.1236 |          1.0395 |
| OnDisk Cache 79%       |              22.0 |                            70% | 45.0266 |     0.9599 |              1.9900 |          4.4059 |          3.3568 |
| OnDisk Cache 60%       |              16.7 |                            55% | 38.3141 |     0.9599 |              2.3281 |          4.0063 |          3.5542 |

Reading guidance:

- When the recall is roughly the same (around 0.96), reducing the cache significantly lowers memory usage but raises tail latency.
- When the cache coverage approaches 100%, `ivf_on_disk` can maintain a recall close to in-memory IVF, but with some increase in latency.
- In production, you are advised to continuously monitor the hit ratio metric and use it to back-tune `ann_index_ivf_list_cache_limit`.

## Tuning recommendations

<!-- Knowledge type: Operational steps -->
<!-- Applicable scenarios: Performance tuning -->

The recommended iterative tuning steps are:

1. Start tests by reusing the baseline `nlist` / `ivf_nprobe` parameters from `ivf`.
2. Set `ann_index_ivf_list_cache_limit` according to the memory budget, then observe the hit ratio and latency variation.
3. If recall is stable but latency jitter is significant, prioritize raising the cache ratio and re-test the hit situation.
4. After the cache ratio changes, jointly adjust `ivf_nprobe` again to balance recall and latency.

## FAQ

<!-- Knowledge type: Frequently asked questions -->

**Q1: Is there any difference in SQL usage between `ivf_on_disk` and `ivf`?**

There is no difference. When creating the index, you only need to change `index_type` to `ivf_on_disk`. The query functions (`l2_distance_approximate` / `inner_product_approximate`) and parameters (`ivf_nprobe`) remain the same.

**Q2: What is the percentage baseline for `ann_index_ivf_list_cache_limit`?**

It is the BE process available memory (constrained by `mem_limit`), not the physical memory of the entire machine. Plan the cache ratio based on the BE memory upper limit.

**Q3: What hit ratio is considered reasonable?**

It depends on the tail latency that the business can tolerate. According to the reference data, latency is most stable when the hit ratio is 100%; when the hit ratio drops to 55%-70%, memory usage decreases substantially, but P99 latency can rise to the seconds level. Continuously tune based on observability metrics.

**Q4: When should `ivf_on_disk` be chosen over `ivf`?**

Choose `ivf_on_disk` first when the vector scale is large (tens of millions or more), the memory budget is tight, and ANN acceleration is still required. Choose `ivf` when latency is extremely sensitive and memory is sufficient.

## Related documents

- [Vector index overview](./overview.md)
- [IVF index](./ivf.md)
- [HNSW index](./hnsw.md)
- [Vector index management](./index-management.md)
- [Large-scale vector retrieval performance](./performance-large-scale.md)
