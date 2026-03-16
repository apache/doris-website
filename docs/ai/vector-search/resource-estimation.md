---
{
    "title": "ANN Resource Estimation Guide",
    "language": "en",
    "description": "This guide explains how to estimate memory and CPU requirements for ANN workloads in Apache Doris, including HNSW and IVF with different quantizers."
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

ANN workloads are usually constrained by memory and CPU rather than raw storage. This guide provides a practical way to estimate cluster sizing before launch.

The method follows the same pattern commonly used by vector databases:
1. Estimate index memory first.
2. Estimate CPU cores based on target query performance.
3. Reserve memory headroom for non-vector columns and execution overhead.

## Why ANN Needs Explicit Capacity Planning

Compared with regular OLAP indexes, ANN has a few specific resource characteristics:

1. Index build is CPU-intensive.
2. Very large segments may cause index build failures (for example, due to out-of-memory during single-index construction).
3. High-performance query usually requires indexes to stay resident in memory.
4. High-QPS query needs enough CPU cores to sustain distance computation and merge overhead.

To reduce memory usage, Doris supports vector quantization (`sq8`, `sq4`, `pq`). Quantization saves memory but may bring trade-offs:
- slower import (extra encoding),
- sometimes slower query (extra decode/reconstruction),
- reduced recall because quantization is lossy.

## Step-by-Step Estimation

Prepare the following inputs:
- Vector dimension `D`
- Total row count `N`
- Index type (`hnsw` or `ivf`)
- Quantizer (`flat`, `sq8`, `sq4`, `pq`)
- HNSW parameter `max_degree` (if using HNSW)
- Target QPS and latency goal

Then estimate in this order:
1. Index memory
2. CPU cores
3. Safety headroom

## HNSW Memory Estimation

For HNSW with default `max_degree=32`, practical memory is:

`HNSW_FLAT_Bytes ~= 1.3 * D * 4 * N`

Where:
- `D * 4 * N` is raw float32 vector memory
- `1.3` includes HNSW graph overhead

If `max_degree` is increased, scale graph overhead proportionally:

`HNSW_factor ~= 1 + 0.3 * (max_degree / 32)`

`HNSW_FLAT_Bytes ~= HNSW_factor * D * 4 * N`

Quantizer-based approximations:
- `sq8`: about `1/4` of `flat`
- `sq4`: about `1/8` of `flat`
- `pq`: typically close to `sq4` in memory (for example `pq_m=D/2, pq_nbits=8`)

### Quick Reference (`D=768`, `max_degree=32`)

| Rows | FLAT | SQ8 | SQ4 | PQ (`m=384, nbits=8`) |
|------|------|-----|-----|------------------------|
| 1M | 4 GB | 1 GB | 0.5 GB | 0.5 GB |
| 10M | 40 GB | 10 GB | 5 GB | 5 GB |
| 100M | 400 GB | 100 GB | 50 GB | 50 GB |
| 1B | 4000 GB | 1000 GB | 500 GB | 500 GB |
| 10B | 40000 GB | 10000 GB | 5000 GB | 5000 GB |

## IVF Memory Estimation

IVF has lower structural overhead than HNSW. A practical approximation is:

`IVF_FLAT_Bytes ~= D * 4 * N`

Quantizer-based approximations:
- `sq8`: about `1/4` of `flat`
- `sq4`: about `1/8` of `flat`
- `pq`: typically close to `sq4`

### Quick Reference (`D=768`)

| Rows | FLAT | SQ8 | SQ4 | PQ (`m=384, nbits=8`) |
|------|------|-----|-----|------------------------|
| 1M | 3 GB | 0.75 GB | 0.35 GB | 0.35 GB |
| 10M | 30 GB | 7.5 GB | 3.5 GB | 3.5 GB |
| 100M | 300 GB | 75 GB | 35 GB | 35 GB |
| 1B | 3000 GB | 750 GB | 350 GB | 350 GB |
| 10B | 30000 GB | 7500 GB | 3500 GB | 3500 GB |

## CPU Estimation

For high-QPS ANN search, a practical baseline ratio is:

`16 cores : 64 GB memory` (about `1 core : 4 GB`)

When using quantization, CPU demand does not always shrink proportionally with index memory. In practice, estimate CPU from the **FLAT-memory-equivalent workload**, then tune down only after benchmark validation.

## Real-Query Headroom (Do Not Size to 100%)

The formulas above estimate ANN index memory only. Real SQL often returns extra columns, for example:

```sql
SELECT id, text, l2_distance_approximate(embedding, [...]) AS dist
FROM tbl
ORDER BY dist
LIMIT N;
```

Even with TopN delayed materialization, execution still needs memory for other operators and columns. To reduce risk in production:

- keep ANN index memory below about `70%` of machine memory,
- reserve the remaining memory for query execution, compaction, and non-vector data access.

## Sizing Recommendations by Scenario

1. Highest performance, memory is not a concern: `HNSW + FLAT`.
2. Memory-constrained deployments: `HNSW/IVF + PQ` (often better practical balance than `SQ8/SQ4`).
3. For PQ parameterization, start from `pq_m = D / 2`, then tune by recall and latency targets.
4. If query performance requirements are moderate, prioritize reducing CPU core count. In some deployments, you can provision higher CPU during import/build and scale down CPU afterward.

## Related Documents

- [Overview](./overview.md)
- [HNSW](./hnsw.md)
- [IVF](./ivf.md)
- [ANN Index Management](./index-management.md)
