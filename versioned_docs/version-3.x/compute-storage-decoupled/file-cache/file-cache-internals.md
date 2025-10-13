---
{
    "title": "File Cache Internals",
    "language": "en"
}

---

## Fundamentals

### (1) Cache Slicing and Prefetch Mechanism

Doris employs cache slicing and prefetch mechanisms to optimize data cache management and read efficiency. Specifically, target files are sliced with 1MB alignment, and each slice is stored as a separate Block file in the local filesystem after complete download. This slicing approach effectively reduces cache granularity, improving cache flexibility and space utilization. Doris can cache only required portions of data, avoiding the space waste of caching entire large files. Smaller cache blocks also facilitate management and eviction, enabling more precise hotspot data access.

### (2) Local File Directory Organization

To better manage cached data, Doris adopts a specific local file directory structure. Caches may be distributed across multiple directories on multiple disks. To achieve uniform distribution across directories, Doris calculates a hash value from the target file path and uses this hash as the last-level directory for Block file storage. Each Block file is named based on its offset position in the target file.

For example, if the target file path is `/remote/data/datafile1` with a hash value of `12345`, the cached Block file might be stored at `/cache/123/12345/offset1`, where `offset1` represents the block's offset position in the original file.

### (3) Multi-Queue Mechanism

Doris' file cache uses a multi-queue mechanism to separate different data types, preventing cache pollution and improving hit rates. Cache data is categorized into the following types, each stored in separate queues prioritized by importance:

- TTL Queue: Stores data with TTL (Time-To-Live) attributes. This data remains in cache for the specified TTL duration and has the highest priority during that period. When cache space is insufficient, the system preferentially evicts data from other queues to preserve TTL data. TTL is a table attribute - for example, setting it to 3600 means data imported into this table should remain in file cache for 1 hour after import. Use case: Suitable for small-scale tables that need local persistence, such as resident tables with long TTL values.
- Index Queue: Stores index data primarily used to accelerate query filtering operations, typically with high access frequency. Note: Inverted index files, despite being "indexes", are treated as normal cache data due to their typically large size.
- Normal Queue: Stores regular data without TTL attributes. Most data falls into this category.
- Disposable Queue: Stores temporary data like compaction reads. This data is typically evicted after use and has the lowest priority.

This multi-queue mechanism enables Doris to allocate cache space rationally based on different data characteristics and usage scenarios, maximizing cache resource utilization.

### (4) Eviction Mechanism

The cache eviction mechanism is crucial for file cache management, determining how to select data for eviction when space is limited. Doris' eviction mechanism includes the following triggers and selection strategies:

Eviction Triggers:

- Passive eviction due to space constraints:
  - When local disk space or inode count is insufficient, Doris triggers passive eviction to free space.
  - When reaching cache capacity limits: Even if disk space remains, eviction starts when cache usage reaches predefined thresholds.
- Proactive early eviction: Unlike synchronous eviction where new data must wait for old data to be evicted (impacting query performance), Doris asynchronously cleans old caches when usage reaches high-water marks.
- Proactive garbage collection: While LRU can evict unused data, Doris actively cleans garbage data like compaction/Schema Change original data, failed import rollback data, and dropped table/partition data.
- TTL expiration: Unique to TTL data. When TTL expires, data is demoted to the normal cache and participates in regular eviction.

Eviction Target Selection:

- Eviction ratio: Queues share disk space with individual ratio limits. When space is abundant (other queues haven't reached their ratios), a queue can use all remaining space. For example, the normal cache might be limited to 40% of total space but can use all available space if no other data exists. As other queue data enters, ratios gradually approach preset values.
- Eviction order: When write cache space is insufficient, Doris evicts data in this sequence: Disposable → Normal → Index → TTL. If evicting other queue data still doesn't free enough space, LRU eviction occurs within the same queue type.

Eviction Avoidance Recommendations:

- Sufficient disk space: Ensure adequate space to accommodate cache data, avoiding frequent evictions due to space constraints. Since cache cleanup has latency, maintain some buffer. Experience shows file cache space should be about 1.5× query hot data size for optimal hit rates.
- Isolate large queries: Route large queries to separate clusters to prevent them from occupying cache space and affecting other queries' hit rates.

### (5) Warm-up Mechanism

Cache warm-up preloads data into cache to accelerate subsequent queries. Doris provides multiple warm-up approaches:

- Manual warm-up: Users can warm up current cluster caches for specific tables/partitions, or reference another cluster to warm up its cached tables/partitions. Warm-up always downloads from remote storage (not other clusters/BEs). After execution, targets (tables/partitions or reference clusters) are converted to tablet sets for BE download. BE download logic essentially performs sequential reads of all tablet data files to cache them locally. Since warm-up data volume can be large, Doris splits tasks into 20GB-max batches with checkpoints for recovery after interruptions. If BEs encounter severe issues (e.g., crashes) or users cancel warm-up, all BEs stop downloads. Users can check job status (`FINISHED`, `CANCELLED`, `RUNNING`) via `SHOW WARM UP JOB`, including progress for running jobs. Repeated warm-ups for same tables/partitions won't redownload existing data, only performing incremental updates.
- Load balancing-triggered warm-up: When tablet distribution becomes unbalanced (especially during node failures or scaling), tablets migrate to new BEs. Target BEs then download cache data using metadata from source BEs (if available), ensuring query cache hits on new nodes. Source BE cache data is actively evicted during cleanup. Note: There's a time window between migration and complete download where cache misses may occur.
- Cross-cluster auto warm-up (v3.1+): In compute-storage separation scenarios, users may want automatic cache synchronization between compute clusters (e.g., when imports occur in Cluster A but queries in Cluster B). Doris offers two auto-sync methods:
  - Periodic warm-up: For non-real-time requirements, add sync intervals in `WARM UP` SQL. Instead of one-time execution, tasks periodically sync specified tables/partitions from one cluster to another incrementally.
  - Import/compaction-triggered warm-up: For real-time requirements, use import completion events to trigger warm-up. Since tablets may distribute differently across clusters, FE informs source clusters about target cluster tablet distribution. During source cluster import commit phase, it notifies target cluster BEs to download newly imported remote storage data. Compaction follows similar notification paths for warm-up.

## Scenario Analysis

### (1) File Cache in Query Processing

During queries, file cache reduces remote storage access and accelerates data retrieval:

- Scanner reads data files: When queries arrive, Scanner attempts to read required data files.
- Local cache check: Before accessing remote storage, Scanner first checks local file cache.
- Cache hit: If cache metadata contains the requested file path and offset, it returns BlockFile handles for Scanner to read directly, avoiding remote downloads and reducing latency.
- Cache miss: For partially or completely uncached ranges, Scanner downloads missing data from remote storage. Downloaded data enters file cache for future queries while following eviction policies.

### (2) File Cache in Data Loading

During imports, file cache prepares data for subsequent queries:

- Data upload to remote storage: Imported data first goes to remote storage.
- Async local cache write: Doris asynchronously writes this data to local disk cache, enabling immediate cache hits for post-import queries.
- Cache type: Based on data type and attributes (e.g., TTL), imported data enters corresponding queues (TTL, Index, or Normal).

### (3) File Cache in Compaction

Compaction optimizes storage and query performance by merging small files. Doris has two types:
- Cumulative Compaction: Merges incremental data versions
- Base Compaction: Merges baseline data (version 0) with incremental versions

Cache handling during compaction:

- Cumulative Compaction: Newly merged data enters file cache after remote storage upload, similar to imports, accelerating subsequent queries.
- Base Compaction: Since Base Compaction typically involves large cold data, new data only enters cache when space permits. Users can force cache insertion via BE config `enable_file_cache_keep_base_compaction_output = true`, but this may evict other hot data. Future versions plan adaptive strategies using historical query stats to determine cache insertion.

### (4) Cache Loading After Restart

Post-restart cache loading is critical for cache state recovery and quick query response. Pre-v3.1, unpreserved LRU information caused inconsistent queue ordering, affecting hit rates.

v3.1 introduces LRU persistence:

- Periodic dump: Doris periodically dumps LRU queue order info to disk.
- Post-restart load: Nodes reload dumped LRU info to restore queue states.
- Full-disk scan: To address potential metadata-file inconsistencies from periodic dumps, Doris performs a full-disk scan after LRU loading for completeness.
- Query-triggered async load: Since scanning takes time, BEs can serve queries during the process. If queries access unscanned data, early loading occurs to minimize latency.

### (5) Cache Handling During Scaling

Scaling operations are common in cluster management. Doris handles file cache during scaling as follows:

- Horizontal scale-out: During tablet migration to new BEs, target BEs download cache data using metadata from source BEs, ensuring cache hits on new nodes.
- Horizontal scale-in: Similar to scale-out, but when reduced cluster cache capacity falls below actual cache size, eviction occurs following standard mechanisms.
- Vertical scale-out:
  - Adding disks: Not recommended since Doris doesn't rehash or balance across disks. Cache directory changes may cause lookup failures. If necessary, clear cache and warm up as needed.
  - Increasing disk capacity: For same-disk-count capacity expansion, use `curl http://BE_IP:WEB_PORT/api/file_cache?op=reset&capacity=123456` to notify BEs.
- Vertical scale-in:
  - Reducing disk space: Also requires the `reset` operation. When new capacity is below cache size, eviction occurs per standard mechanisms.
- Post-scaling warm-up notes: Since horizontal scaling involves tablet rebalancing, wait for stabilization before warm-up for effectiveness. Monitor `doris_fe_tablet_num` metrics - when the curve stabilizes, warm-up completes.