---
title: 'Apache Doris 4.2 Peer Read: 7.5× Faster Cold Queries with Shared Caches'
summary: 'Peer Read shares cached data across compute groups. A Doris cloud service workload saw 7.5× faster cold point queries, while a TPC-H 1 TB test cut cold-read time by 51%.'
description: 'How Apache Doris 4.2 Peer Read shares File Cache data across compute groups, races object storage reads, and reduces cold-query latency.'
keywords:
  - 'Apache Doris 4.2'
  - 'Peer Read'
  - 'File Cache'
  - 'compute groups'
  - 'cold queries'
date: '2026-11-03'
author: 'Xin Deng'
tags:
  - 'Tech Sharing'
image: '/images/blogs/apache-doris-4-2-peer-read-cache-sharing/cover.jpg'
---
<!--
Licensed to the Apache Software Foundation (ASF) under one
or more contributor license agreements. See the NOTICE file
distributed with this work for additional information
regarding copyright ownership. The ASF licenses this file
to you under the Apache License, Version 2.0 (the
"License"); you may not use this file except in compliance
with the License. You may obtain a copy of the License at

  http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing,
software distributed under the License is distributed on an
"AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
KIND, either express or implied. See the License for the
specific language governing permissions and limitations
under the License.
-->

In an [Apache Doris](https://doris.apache.org/) deployment with compute-storage separation, multiple compute groups share data in object storage. Without cache sharing, three problems commonly follow:

- **High first-query latency after separating reads and writes.** Newly ingested data may already be cached in the write group, while a read group's first query still fetches it from object storage. A single primary-key lookup can take several seconds.
- **Performance fluctuations after scaling.** New nodes start with empty caches after scale-out or tablet rebalancing, and query performance takes time to recover.
- **Repeated object storage reads after eviction.** Limited cache capacity means previously fetched data may need to be downloaded again when it is accessed later.

The missing piece is shared cache access. **Peer Read**, introduced in Apache Doris 4.2, tries another node's cache when a local read misses, including nodes in other compute groups. If the peer lacks the data or responds too slowly, the request falls back to object storage.

In a user's workload on a Doris cloud service, enabling Peer Read reduced average cold primary-key lookup latency from **4.45 to 0.59 seconds**, about **7.5× faster**. P99 latency fell from 7.69 to 1.52 seconds, and object storage requests fell by about 98%. In a separate TPC-H 1 TB test, total cold-read time across 22 queries fell by about 51%.

## 1. Shared data, isolated caches

A Doris cluster with compute-storage separation can use multiple compute groups for read/write separation, online/offline workload isolation, and elastic scaling. Groups share data and metadata, so committed writes become visible to other groups.

Each BE, however, maintains its own local File Cache. Without Peer Read, a read group cannot directly use blocks cached by the write group or by another read group. Each group has to populate its own cache.

![Read groups share object storage but cannot use one another's local cached blocks without peer reads](/images/blogs/apache-doris-4-2-peer-read-cache-sharing/cache-islands.jpg)

### Why cold reads are slow

Object storage provides high throughput for large reads, but individual requests have much higher latency than local disks or a network within the same data center. Before reading table data, many queries must read segment footers and indexes. Those reads are small but numerous.

In the primary-key workload described later, each query averaged more than 200 remote I/O requests, mostly for footers and indexes. Waiting for those small requests accounted for much of the query time.

### Cache warm-up and Peer Read

Earlier Doris versions already support cache warm-up, including incremental warm-up that notifies read groups after ingestion. Warm-up anticipates which data will be accessed and loads it from object storage before queries arrive. Peer Read covers misses discovered at query time.

| Dimension | Cache warm-up | Peer Read |
| --- | --- | --- |
| Trigger | Proactively loads object storage data before a query | Reads another node after a local cache miss |
| Prerequisite | Known access patterns and configured warm-up tasks or relationships | No prediction of hot data required |
| Typical use | Known hot data and incremental synchronization of newly ingested data | Cold reads after scaling, eviction, or before warm-up finishes |
| Cost | Each read group needs cache capacity; warm-up reads object storage | Uses the peer's network and disk resources |

The two approaches work together: warm-up prepares known hot data, while Peer Read fills gaps during execution.

## 2. How Peer Read works

Peer Read reuses existing BE File Caches without adding a separate cache service. It intervenes only on a local miss; a local hit follows the existing path.

![On a local cache miss, Doris discovers peers, fetches missing blocks, falls back to object storage when needed, and backfills the local cache](/images/blogs/apache-doris-4-2-peer-read-cache-sharing/peer-read-flow.jpg)

### 2.1 Find candidate peers

Candidates come from two sources:

- **FE hints during scaling.** When a tablet moves between BEs in the same compute group, FE tells the destination about the source BE and gives that peer the highest priority. Initial reads can fetch cached blocks from the old BE.
- **On-demand FE lookup.** If no candidates are available locally, the BE asks FE in the background where the tablet is assigned across compute groups. The current read does not wait and proceeds to object storage. A cold query usually has many concurrent reads; the first footer read can trigger discovery, allowing later reads in the same query to use peers.

The BE also remembers the compute group that last served a successful peer read for each tablet and prefers it next time.

### 2.2 Fetch only missing blocks

The requester asks peers only for blocks missing from its local cache. Returned data serves the current query and backfills local File Cache, allowing later reads of the same blocks to hit locally.

### 2.3 Give peers a 20 ms head start

By default, Peer Read races against object storage with a configurable **20 ms head start**. The BE sends the peer request first. If it returns within that window, Doris does not send an object storage request. Otherwise, Doris starts the object storage read too and uses the first result returned.

![A fast peer avoids an object storage request; a slower peer races object storage after the configurable 20 ms delay](/images/blogs/apache-doris-4-2-peer-read-cache-sharing/race-timeline.jpg)

Starting both reads immediately would add an object storage request on every miss. Waiting indefinitely for a peer would let one slow node delay a query. The head start balances those costs.

### 2.4 Fall back automatically

If a peer is unreachable, times out, lacks the block, or is rate-limited, Doris falls back to object storage rather than failing the query because of the peer attempt.

Candidate lists also adapt. A node without the requested data moves to the end of the list. Repeated RPC failures evict a candidate. If all candidates repeatedly miss for a tablet, Doris temporarily pauses peer attempts for that tablet to avoid ineffective requests.

### 2.5 Let a write group fill the cache

In a one-writer, multiple-reader deployment, the write group can act as a **fill compute group**. If its BE receives a read request and also lacks the block, it fetches the block from object storage, stores it in its own File Cache, and returns it to the requesting read group.

![A write group fetches missing blocks into its cache and serves them to multiple read groups](/images/blogs/apache-doris-4-2-peer-read-cache-sharing/fill-compute-group.jpg)

The fetched copy can then serve other read groups while it remains cached, reducing separate downloads of the same data. Fill requests have concurrency and timeout limits; when those limits are reached, the requester falls back to object storage itself.

## 3. TPC-H 1 TB: roughly half the cold-read time

We compared cold reads between a write group and a read group using TPC-H at 1 TB. The write group already had the data cached. Before each of the 22 sequential queries, the read group's cache was cleared.

![Total elapsed time for 22 TPC-H queries: 323.3 seconds from object storage, 158.6 with Peer Read, and 59.5 for local cache hits](/images/blogs/apache-doris-4-2-peer-read-cache-sharing/tpch-cold-read.jpg)

| Read path | Total time for 22 queries | Compared with direct object storage |
| --- | ---: | --- |
| Cold read, direct object storage | 323.3 s | Baseline |
| Cold read, Peer Read enabled | **158.6 s** | **About 2× faster; 51% less time** |
| Warm read, local cache hit (reference) | 59.5 s | Reference only |

**Test setup:** TPC-H 1 TB; one FE with 4 CPU cores and 16 GB RAM; six BEs, each with 32 CPU cores, 128 GB RAM, and three 500 GB cloud disks. The write and read groups each had three BEs. Cache blocks were 1 MB, and Peer Read used its default race mode.

Peer Read reduced total elapsed time from 323.3 to 158.6 seconds. Sequential mode, which tries peers before falling back to object storage, produced a similar total of 155.5 seconds. In sequential mode, all 22 queries were faster than direct object storage reads, with per-query speedups from 1.4× to 3.3×.

### When the write group's cache is also cold

We also tested a case where neither group had the data cached. The write group fetched it from object storage, cached it, and forwarded it to the read group. Across 22 queries, total time was **332.4 seconds**, about **3% more** than direct object storage reads.

This test used the same hardware and sequential mode. The extra forwarding hop added about 3% in this experiment. It also left data in the write group's cache for subsequent requests from other read groups, where it could provide the benefits measured in the cached-peer test. The result is specific to this setup, not a guarantee of a fixed overhead.

## 4. Doris cloud service workload: 7.5× faster cold point queries

A user of a Doris cloud service runs one write group that continuously ingests data and multiple read groups that serve external APIs, primarily through primary-key lookups. First queries against new data had variable latency. Each read group needed substantial cache capacity, duplicating the same data across groups.

For Peer Read, the DBA designated the write group as the read groups' fill compute group. A local miss first requests data from the write group; if that group's cache also misses, it fetches the data on the requester's behalf.

The user tested **100 primary-key lookups** against a business table using the Unique Key model. The write group first warmed the data. After clearing the read group's cache and restarting it, the user executed the same 100 queries with Peer Read disabled and enabled. The queries covered 100 different tablets and ran sequentially, once each.

![Cold primary-key lookup latency and object storage requests with Peer Read off and on, with local cache hits as a reference](/images/blogs/apache-doris-4-2-peer-read-cache-sharing/point-query-results.png)

| Metric | Cold, Peer Read off | Cold, Peer Read on | Local warm read (reference) |
| --- | ---: | ---: | ---: |
| Average latency | 4.45 s | **0.59 s** | 0.06 s |
| P99 latency | 7.69 s | **1.52 s** | 0.09 s |
| Object storage requests | 21,368 | **372** | 0 |
| Bytes read from object storage | 4.24 GiB | **About 186 KiB** | 0 |

Each compute group had one BE, and the test used one sequential run. These measurements describe the user's Doris cloud service environment.

All 100 queries obtained data from peers and were faster with Peer Read enabled. Average latency fell by about **87%**, a **7.5×** speedup; P99 fell by about **80%**. Object storage requests dropped to about 1.7% of the original count, reducing the request-billed portion of storage cost.

Point lookups benefited more than scan-heavy TPC-H queries because their latency was dominated by many small footer and index reads. Peer Read shortened the wait for each of those reads.

Local cache hits remained roughly an order of magnitude faster. Peer Read reduces cold-read latency while the local cache is being populated; local caching still provides the fastest read path.

## 5. Enable Peer Read in Apache Doris

> **Apache Doris 4.2 provides Peer Read as an experimental feature, disabled by default.**

### Configuration

1. Enable File Cache on every BE with `enable_file_cache = true`.
2. Set `enable_cache_read_from_peer = true` on every BE. This switch controls both same-group and cross-group peer reads.
3. For fill behavior in a one-writer, multiple-reader deployment, set `peer_cache_fill_compute_group_id` on every BE in each requesting read group. Use the write group's **compute group ID**, not its name.

See the [Doris 4.x Peer Cache Read documentation](https://doris.apache.org/docs/4.x/compute-storage-decoupled/file-cache/file-cache-peer-read/) for configuration procedures, parameter details, and troubleshooting.

### Verify the read path

Inspect these counters under `SegmentIterator` in Query Profile:

| Counter | Meaning |
| --- | --- |
| `NumPeerIOTotal` | Number of peer reads |
| `CrossCGPeerIOTotal` | Peer reads across compute groups |
| `PeerRaceWin` / `S3RaceWin` | Races won by the peer and by object storage, respectively |

### Operational considerations

- Cross-group reads use the peer group's network and disk resources. A fill group also uses object storage bandwidth and cache capacity. Disable Peer Read where strict resource isolation is required.
- Cross-availability-zone peer reads can incur inter-zone traffic charges.
- If `S3RaceWin` substantially exceeds `PeerRaceWin`, the peer path is not faster in that environment. To prioritize fewer object storage requests, consider increasing `peer_race_hedge_delay_ms`. If latency is the priority and peers provide little benefit, consider disabling Peer Read.
- Peer Read applies to internal tables in compute-storage separation mode. External-table reads, such as Hive and Iceberg, do not use this path.

## 6. Reuse cached data across groups

Peer Read lets a compute group use blocks already cached elsewhere in the cluster. Newly ingested data, first reads on scaled-out nodes, and data accessed again after eviction can all benefit without a new cache service. If a peer cannot serve the request, Doris falls back to object storage.

In the TPC-H 1 TB test, this cut total cold-read time roughly in half. In the Doris cloud service user's primary-key workload, average cold-query latency fell from 4.45 to 0.59 seconds. Peer Read was planned for the upcoming Apache Doris 4.2 release at the time of the original article; evaluate its experimental implementation with your own workload and resource-isolation requirements.
