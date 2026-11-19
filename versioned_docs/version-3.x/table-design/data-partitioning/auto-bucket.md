---
{
    "title": "Auto bucket",
    "language": "en",
    "description": "Users often encounter various issues due to improper bucket settings. To address this,"
}
---

Users often encounter various issues due to improper bucket settings. To address this, we provide an automated approach for setting the number of buckets, which is currently applicable only to OLAP tables.

In the past, user had to set the number of buckets manually when creating table, but the automatic bucket feature is a way for Apache Doris to dynamically project the number of buckets, so that the number of buckets always stays within a suitable range and users don't have to worry about the minutiae of the number of buckets.

For the sake of clarity, this section splits the bucket into two periods, the initial bucket and the subsequent bucket; the initial and subsequent are just terms used in this article to describe the feature clearly, there is no initial or subsequent Apache Doris bucket.

As we know from the section above on creating buckets, `BUCKET_DESC` is very simple, but you need to specify the number of buckets; for the automatic bucket projection feature, the syntax of BUCKET_DESC directly changes the number of buckets to `Auto` and adds a new Properties configuration.

```sql
-- old version of the creation syntax for specifying the number of buckets
DISTRIBUTED BY HASH(site) BUCKETS 20

-- Newer versions use the creation syntax for automatic bucket imputation
DISTRIBUTED BY HASH(site) BUCKETS AUTO
properties("estimate_partition_size" = "100G")
```

The new configuration parameter estimate_partition_size indicates the amount of data for a single partition. This parameter is optional and if not given, Doris will take the default value of estimate_partition_size to 10GB.

As you know from the above, a partitioned bucket is a tablet at the physical level, and for best performance, it is recommended that the tablet size be in the range of 1GB - 10GB. So how does the automatic bucketing projection ensure that the tablet size is within this range? 

To summarize, there are a few principles.

- If the overall data volume is small, the number of buckets should not be set too high
- If the overall data volume is large, the number of buckets should be related to the total number of disk blocks, so as to fully utilize the capacity of each BE machine and each disk

:::tip
propertie estimate_partition_size not support alter
:::

## Initial bucketing projection

:::info Version differences

Since **3.0.6** in the 3.0 series and **3.1.0**, the FE configuration `autobucket_partition_size_per_bucket_gb` controls the size used to estimate one bucket. Its default value is `-1`: Doris uses 5 GiB in integrated storage-compute mode and 10 GiB in decoupled storage-compute mode. A positive value overrides this adaptive default. Earlier 3.0 releases use 1 GiB per bucket after compression. The 5:1 compression estimate and the small-partition thresholds below apply in both cases.

:::

Doris computes the initial number of buckets as follows (1 GiB = 1024 MiB):

1. Divide `estimate_partition_size` by 5 to estimate the compressed partition size `P`.
2. Compute the size-based bucket count `N`: use 1 if `P <= 100 MiB`, 2 if `100 MiB < P <= 1 GiB`, and otherwise `ceil(P / target_size)`. Choose `target_size` according to the version and configuration above.
3. In integrated storage-compute mode, compute the disk-based count `M` by summing `ceil(available_disk_capacity / 50 GiB)` over online disks with a valid path hash on backends available for loading. Decoupled storage-compute mode does not apply this disk-capacity limit.
4. Set `x = min(N, M, autobucket_max_buckets)`, omitting `M` in decoupled mode. If `x < N` and `x` is smaller than the number of alive BEs, raise `x` to the number of alive BEs. Apply `autobucket_max_buckets` again, then apply the lower bound `autobucket_min_buckets`.

The defaults in 3.x are `autobucket_min_buckets = 1` and `autobucket_max_buckets = 128`. Do not configure the minimum above the maximum.

For example, on Doris 3.0.6 or later, or 3.1.x, assume integrated storage-compute mode, the default target size, and 3 available BEs with two empty 500 GiB disks each. Then `M = 3 * 2 * ceil(500 / 50) = 60`:

| `estimate_partition_size` | Estimated compressed size `P` | Size-based count `N` | Final bucket count |
|---|---|---|---|
| 100 MiB | 20 MiB | 1 | 1 |
| 1 GiB | About 205 MiB | 2 | 2 |
| 100 GiB | 20 GiB | 4 | 4 |
| 500 GiB | 100 GiB | 20 | 20 |
| 1 TiB | About 205 GiB | 41 | 41 |

These are estimates, not fixed output values for every cluster. Disk availability and FE configuration affect the result. To retain the earlier size-based rule on 3.0.6 or later, set `autobucket_partition_size_per_bucket_gb = 1` explicitly.

## Subsequent bucketing projection

The above is the calculation logic for the initial bucketing. The subsequent bucketing can be evaluated based on the amount of partition data available since there is already a certain amount of partition data. The subsequent bucket size is evaluated based on the EMA[1] (short term exponential moving average) value of up to the first 7 partitions, which is used as the estimate_partition_size. At this point there are two ways to calculate the partition buckets, assuming partitioning by days, counting forward to the first day partition size of S7, counting forward to the second day partition size of S6, and so on to S1.

- If the partition data in 7 days is strictly increasing daily, then the trend value will be taken at this time. There are 6 delta values, which are

```
S7 - S6 = delta1,
S6 - S5 = delta2,
...
S2 - S1 = delta6
```

This yields the ema(delta) value.Then, today's estimate_partition_size = S7 + ema(delta)

- not the first case, this time directly take the average of the previous days EMA. Today's estimate_partition_size = EMA(S1, ... , S7)

:::tip

According to the above algorithm, the initial number of buckets and the number of subsequent buckets can be calculated. Unlike before when only a fixed number of buckets could be specified, due to changes in business data, it is possible that the number of buckets in the previous partition is different from the number of buckets in the next partition, which is transparent to the user, and the user does not need to care about the exact number of buckets in each partition, and this automatic extrapolation will make the number of buckets more reasonable.

:::
