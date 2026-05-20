---
{
    "title": "ANN Resource Estimation Guide",
    "sidebar_label": "Resource Estimation",
    "language": "en",
    "description": "How to estimate the memory and CPU requirements for Apache Doris vector search (ANN). This article provides capacity planning methods for HNSW/IVF and different quantization modes.",
    "keywords": [
        "ANN resource estimation",
        "vector search capacity planning",
        "HNSW memory estimation",
        "IVF memory estimation",
        "vector quantization sq8 sq4 pq",
        "Doris vector index CPU"
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

<!-- Knowledge type: Capacity planning / Resource estimation -->
<!-- Applicable scenarios: Pre-launch capacity planning / Cluster sizing / Memory and CPU budget estimation -->

Vector search (ANN) workloads are usually constrained by memory and CPU first, not by disk capacity. This article provides a practical resource estimation method to help you plan the specifications of an Apache Doris vector search cluster before going live.

## Quick Navigation

- To understand **why ANN needs separate estimation**: see [ANN Resource Characteristics](#ann-resource-characteristics).
- To **estimate memory directly**: see [HNSW Memory Estimation](#hnsw-memory-estimation) and [IVF Memory Estimation](#ivf-memory-estimation).
- To **estimate CPU**: see [CPU Core Estimation](#cpu-core-estimation).
- To learn about **production reservations**: see [Production Safety Margin](#production-safety-margin-do-not-design-against-100-memory).
- To make an **index choice**: see [Scenario-based Recommendations](#scenario-based-recommendations).

## Estimation Overview

The general estimation order is:

1. **Estimate index memory**: derive the resident index memory from data scale, index type, and quantization mode.
2. **Estimate CPU cores**: match the CPU count to the memory ratio based on target QPS and latency.
3. **Reserve a safety margin**: leave headroom for query execution, non-vector column access, and Compaction.

## ANN Resource Characteristics

<!-- Knowledge type: Concept explanation -->

Compared with regular OLAP indexes, ANN has the following resource usage characteristics:

| Resource Dimension | Resource Characteristics |
|----------|----------|
| Build-stage CPU | High utilization. Heavy CPU pressure during ingestion. |
| Build-stage memory | When a Segment is too large, building a single index may fail due to insufficient memory. |
| Query-stage memory | High-performance queries usually require the index to stay resident in memory as much as possible. |
| Query-stage CPU | High-QPS scenarios place a clear demand on the number of CPU cores. |

Doris supports three quantization modes, `sq8`, `sq4`, and `pq`, to reduce memory usage. The trade-offs of quantization are usually:

- **Slower ingestion**: extra encoding overhead.
- **Possibly slower queries**: extra decoding or reconstruction overhead.
- **Possible recall drop**: lossy encoding introduces error.

## Estimation Input Checklist

<!-- Knowledge type: Operational steps -->

Before starting the estimation, prepare the following inputs:

| Input | Description |
|--------|------|
| Vector dimension `D` | The float dimension of a single vector, for example `768`. |
| Total rows `N` | The total number of vectors to be indexed. |
| Index type | `hnsw` / `ivf` / `ivf_on_disk` |
| Quantization mode | `flat` / `sq8` / `sq4` / `pq` |
| `max_degree` | HNSW only. Controls the number of graph neighbors. Default `32`. |
| Target QPS and latency | Used for CPU core estimation. |

## HNSW Memory Estimation

<!-- Knowledge type: Capacity planning formula -->

### Empirical Formula Under Default Parameters

With the default `max_degree=32`:

```
HNSW_FLAT_Bytes ~= 1.3 * D * 4 * N
```

Where:

- `D * 4 * N` is the raw float32 vector memory.
- `1.3` represents the extra overhead from the HNSW graph structure (about `0.3` times).

### Adjustment When Tuning `max_degree`

The larger `max_degree` is, the higher the graph structure overhead. Scale proportionally:

```
HNSW_factor   ~= 1 + 0.3 * (max_degree / 32)
HNSW_FLAT_Bytes ~= HNSW_factor * D * 4 * N
```

### Approximate Memory Reduction From Quantization

| Quantization Mode | Memory Ratio (Relative to FLAT) |
|----------|------------------------|
| `sq8` | About `1/4` |
| `sq4` | About `1/8` |
| `pq` | Usually close to `sq4` (for example, `pq_m=D/2, pq_nbits=8`) |

### Notes on `ivf_on_disk`

`ivf_on_disk` reuses the training and query parameter model of IVF (`nlist` / `ivf_nprobe`), but stores the inverted list body on disk and serves queries through a cache. For capacity planning, you can first treat the IVF estimation below as the upper bound of "fully resident in memory", and then plan `ann_index_ivf_list_cache_limit` separately based on the size of hot data you expect to keep resident.

### Quick Reference (`D=768`, `max_degree=32`)

| Rows | FLAT | SQ8 | SQ4 | PQ (`m=384, nbits=8`) |
|------|------|------|------|--------------------------|
| 1M | 4 GB | 1 GB | 0.5 GB | 0.5 GB |
| 10M | 40 GB | 10 GB | 5 GB | 5 GB |
| 100M | 400 GB | 100 GB | 50 GB | 50 GB |
| 1B | 4000 GB | 1000 GB | 500 GB | 500 GB |
| 10B | 40000 GB | 10000 GB | 5000 GB | 5000 GB |

## IVF Memory Estimation

<!-- Knowledge type: Capacity planning formula -->

IVF has lower structural overhead than HNSW and can be approximated as:

```
IVF_FLAT_Bytes ~= D * 4 * N
```

The memory reduction ratio for IVF under quantization is the same as for HNSW:

| Quantization Mode | Memory Ratio (Relative to FLAT) |
|----------|------------------------|
| `sq8` | About `1/4` |
| `sq4` | About `1/8` |
| `pq` | Usually close to `sq4` |

### Quick Reference (`D=768`)

| Rows | FLAT | SQ8 | SQ4 | PQ (`m=384, nbits=8`) |
|------|------|------|------|--------------------------|
| 1M | 3 GB | 0.75 GB | 0.35 GB | 0.35 GB |
| 10M | 30 GB | 7.5 GB | 3.5 GB | 3.5 GB |
| 100M | 300 GB | 75 GB | 35 GB | 35 GB |
| 1B | 3000 GB | 750 GB | 350 GB | 350 GB |
| 10B | 30000 GB | 7500 GB | 3500 GB | 3500 GB |

## CPU Core Estimation

<!-- Knowledge type: Capacity planning formula -->

For high-QPS scenarios, you can start with the following empirical ratio:

```
16 cores : 64 GB   (about 1 core : 4 GB)
```

Note: even when quantization is enabled, CPU demand does not necessarily decrease at the same rate as index memory. In practice:

1. First estimate CPU based on the **FLAT-equivalent workload**.
2. Then gradually scale down to a reasonable level based on actual stress testing.

## Production Safety Margin (Do Not Design Against 100% Memory)

<!-- Knowledge type: Best practice -->

The formulas above only cover the ANN index itself, not the full SQL execution overhead. For example:

```sql
SELECT id, text, l2_distance_approximate(embedding, [...]) AS dist
FROM tbl
ORDER BY dist
LIMIT N;
```

Even with TopN late materialization, the execution layer still needs additional memory to handle non-vector columns and operator state. In production, the recommendations are:

- Keep ANN index memory within about **70%** of total machine memory.
- Use the remaining memory for query execution, Compaction, and other data access.

## Scenario-based Recommendations

<!-- Knowledge type: Architecture selection decision -->
<!-- Applicable scenarios: Index type and quantization mode selection -->

| Scenario | Recommended Plan | Description |
|------|----------|------|
| Performance-first with sufficient memory budget | `HNSW + FLAT` | Best recall and latency. |
| Memory-constrained | `HNSW/IVF + PQ` | Usually more balanced than `SQ8/SQ4`. |
| Initial PQ parameter | `pq_m = D / 2` | Fine-tune later based on recall and latency stress tests. |
| Low query performance requirement | Lower CPU configuration first | You can also adopt a "high CPU during ingestion, downsized after stabilization" strategy. |

## FAQ

<!-- Knowledge type: Frequently asked questions -->

**Q1: How much memory can be reduced after enabling quantization?**

A: `sq8` is about `1/4` of FLAT, and `sq4` and `pq` (for example, `pq_m=D/2, pq_nbits=8`) are about `1/8`. The exact value is still affected by the HNSW graph structure overhead.

**Q2: Can CPU be scaled down at the same ratio as the quantized memory?**

A: Not recommended. Quantization mainly reduces memory usage, and CPU demand does not decrease proportionally. It is recommended to first estimate CPU based on the FLAT-equivalent workload, and then scale down based on stress tests.

**Q3: How does memory change when `max_degree` is increased?**

A: The HNSW graph structure overhead scales by `1 + 0.3 * (max_degree / 32)`. For example, when `max_degree=64`, the factor is about `1.6`.

**Q4: How much memory should be planned for `ivf_on_disk`?**

A: The upper bound is "IVF fully resident in memory". The actual resident size is determined by `ann_index_ivf_list_cache_limit` and can be evaluated separately based on the size of hot data.

**Q5: Why should the design not target 100% memory?**

A: In addition to the ANN index, the SQL execution layer (non-vector columns, operator state), Compaction, and other access also consume memory. It is recommended to reserve about 30% headroom and keep index memory within 70% of total memory.

## Related Documents

- [Vector Search Overview](./overview.md)
- [HNSW](./hnsw.md)
- [IVF](./ivf.md)
- [ANN Index Management](./index-management.md)
