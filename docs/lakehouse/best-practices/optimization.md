---
{
"title": "Data Lake Query Optimization",
"language": "en"
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

## HDFS Read Optimization

Please refer to the **HDFS IO Optimization** section in the [HDFS Documentation](../storages/hdfs.md).

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
