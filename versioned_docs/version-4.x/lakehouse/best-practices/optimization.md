---
{
    "title": "Data Lake Query Optimization",
    "language": "en",
    "description": "This document mainly introduces optimization methods and strategies for querying lake data (Hive, Iceberg, Paimon, etc.)."
}
---

This document mainly introduces optimization methods and strategies for querying lake data (Hive, Iceberg, Paimon, etc.).

## Partition Pruning

By specifying partition column conditions in queries, unnecessary partitions can be pruned, reducing the amount of data that needs to be read.

You can use `EXPLAIN <SQL>` to view the `partition` section of `XXX_SCAN_NODE` to check whether partition pruning is effective and how many partitions need to be scanned in this query.

For example:

```
0:VPAIMON_SCAN_NODE(88)
    table: paimon_ctl.db.table
    predicates: (user_id[#4] = 431304818)
    inputSplitNum=15775, totalFileSize=951754154566, scanRanges=15775
    partition=203/0
```

## Local Data Cache

Data Cache accelerates subsequent queries accessing the same data by caching recently accessed data files from remote storage systems (HDFS or object storage) to local disk.

The cache feature is disabled by default. Please refer to the [Data Cache](../data-cache.md) documentation to configure and enable it.

Since version 4.0.2, cache warmup functionality is supported, which can further actively utilize data cache to improve query performance.

## HDFS Read Optimization

Please refer to the **HDFS IO Optimization** section in the [HDFS Documentation](../storages/hdfs.md).

## Split Count Limit

When querying external tables (Hive, Iceberg, Paimon, etc.), Doris splits files into multiple splits for parallel processing. In some scenarios, especially when there are a large number of small files, too many splits may be generated, leading to:

1. Memory pressure: Too many splits consume a significant amount of FE memory
2. OOM issues: Excessive split counts may cause OutOfMemoryError
3. Performance degradation: Managing too many splits increases query planning overhead

You can use the `max_file_split_num` session variable to limit the maximum number of splits allowed per table scan (supported since 4.0.4):

- Type: `int`
- Default: `100000`
- Description: In non-batch mode, the maximum number of splits allowed per table scan to prevent OOM caused by too many splits.

Usage example:

```sql
-- Set maximum split count to 50000
SET max_file_split_num = 50000;

-- Disable this limit (set to 0 or negative number)
SET max_file_split_num = 0;
```

When this limit is set, Doris dynamically calculates the minimum split size to ensure the split count does not exceed the specified limit.

## Merge IO Optimization

For remote storage systems like HDFS and object storage, Doris optimizes IO access through Merge IO technology. Merge IO technology essentially merges multiple adjacent small IO requests into one large IO request, which can reduce IOPS and increase IO throughput.

For example, if the original request needs to read parts [0, 10] and [20, 50] of file `file1`:

```
Request Range: [0, 10], [20, 50]
```

Through Merge IO, it will be merged into one request:

```
Request Range: [0, 50]
```

In this example, two IO requests are merged into one, but it also reads some additional data (data between 10-20). Therefore, while Merge IO reduces the number of IO operations, it may bring potential read amplification issues.

You can view specific Merge IO information through Query Profile:

```
- MergedSmallIO:
    - MergedBytes: 3.00 GB
    - MergedIO: 424
    - RequestBytes: 2.50 GB
    - RequestIO: 65.555K (65555)
```

Where `RequestBytes` and `RequestIO` indicate the data volume and number of requests in the original request. `MergedBytes` and `MergedIO` indicate the data volume and number of requests after merging.

If you find that `MergedBytes` is much larger than `RequestBytes`, it indicates serious read amplification. You can adjust it through the following parameters:

- `merge_io_read_slice_size_bytes`

    Session variable, supported since version 3.1.3. Default is 8MB. If you find serious read amplification, you can reduce this parameter, such as to 64KB, and observe whether the modified IO requests and query latency improve.

## Parquet Page Cache

:::info
Supported since version 4.1.0.
:::

Parquet Page Cache is a page-level caching mechanism for Parquet files. This feature integrates with Doris's existing Page Cache framework, significantly improving query performance by caching decompressed (or compressed) data pages in memory.

### Key Features

1. **Unified Page Cache Integration**
    - Shares the same underlying `StoragePageCache` framework used by Doris internal tables
    - Shares memory pool and eviction policies
    - Reuses existing cache statistics and RuntimeProfile for unified performance monitoring

2. **Intelligent Caching Strategy**
    - **Compression Ratio Awareness**: Automatically decides whether to cache compressed or decompressed data based on the `parquet_page_cache_decompress_threshold` parameter
    - **Flexible Storage Approach**: Caches decompressed data when `decompressed size / compressed size ≤ threshold`; otherwise, decides whether to cache compressed data based on `enable_parquet_cache_compressed_pages`
    - **Cache Key Design**: Uses `file_path::mtime::offset` as the cache key to ensure cache consistency after file modifications

### Configuration Parameters

The following are BE configuration parameters:

- `enable_parquet_page_cache`

    Whether to enable the Parquet Page Cache feature. Default is `false`.

- `parquet_page_cache_decompress_threshold`

    Threshold that controls whether to cache compressed or decompressed data. Default is `1.5`. When the ratio of `decompressed size / compressed size` is less than or equal to this threshold, decompressed data will be cached; otherwise, it will decide whether to cache compressed data based on the `enable_parquet_cache_compressed_pages` setting.

- `enable_parquet_cache_compressed_pages`

    Whether to cache compressed data pages when the compression ratio exceeds the threshold. Default is `true`.

### Performance Monitoring

You can view Parquet Page Cache usage through Query Profile:

```
ParquetPageCache:
    - PageCacheHitCount: 1024
    - PageCacheMissCount: 128
```

Where `PageCacheHitCount` indicates the number of cache hits, and `PageCacheMissCount` indicates the number of cache misses.