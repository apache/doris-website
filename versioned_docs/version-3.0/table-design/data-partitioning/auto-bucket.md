---
{
    "title": "Auto bucket",
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


Users often encounter various issues due to improper bucket settings. To address this, we provide an automated approach for setting the number of buckets, which is currently applicable only to OLAP tables.

:::tip

This feature will be disabled when synchronized by CCR. If this table is copied by CCR, that is, PROPERTIES contains `is_being_synced = true`, it will be displayed as enabled in show create table, but will not actually take effect. When `is_being_synced` is set to `false`, these features will resume working, but the `is_being_synced` property is for CCR peripheral modules only and should not be manually set during CCR synchronization.  

:::

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

1. Obtain a number of buckets N based on the data size. Initially, we divide the value of `estimate_partition_size` by 5 (considering a data compression ratio of 5 to 1 when storing data in text format in Doris). The result obtained is

```
(, 100MB), then take N=1

[100MB, 1GB), then take N=2

(1GB, ), then one bucket per GB
```

2. calculate the number of buckets M based on the number of BE nodes and the disk capacity of each BE node.

```
Where each BE node counts as 1, and every 50G of disk capacity counts as 1.

The calculation rule for M is: M = Number of BE nodes * (Size of one disk block / 50GB) * Number of disk blocks.

For example: If there are 3 BEs, and each BE has 4 disks of 500GB, then M = 3 * (500GB / 50GB) * 4 = 120.

```

3. Calculation logic to get the final number of buckets.

```
Calculate an intermediate value x = min(M, N, 128).

If x < N and x < the number of BE nodes, the final bucket is y.

The number of BE nodes; otherwise, the final bucket is x.
```

4. x = max(x, autobucket_min_buckets), Here autobucket_min_buckets is configured in Config (where, default is 1)

The pseudo-code representation of the above process is as follows

```
int N = Compute the N value;
int M = compute M value;

int y = number of BE nodes;
int x = min(M, N, 128);

if (x < N && x < y) {
  return y;
}
return x;
```

With the above algorithm in mind, let's introduce some examples to better understand this part of the logic.

```
case1:
Amount of data 100 MB, 10 BE machines, 2TB * 3 disks
Amount of data N = 1
BE disks M = 10* (2TB/50GB) * 3 = 1230
x = min(M, N, 128) = 1
Final: 1

case2:
Data volume 1GB, 3 BE machines, 500GB * 2 disks
Amount of data N = 2
BE disks M = 3* (500GB/50GB) * 2 = 60
x = min(M, N, 128) = 2
Final: 2

case3:
Data volume 100GB, 3 BE machines, 500GB * 2 disks
Amount of data N = 20
BE disks M = 3* (500GB/50GB) * 2 = 60
x = min(M, N, 128) = 20
Final: 20

case4:
Data volume 500GB, 3 BE machines, 1TB * 1 disk
Data volume N = 100
BE disks M = 3* (1TB /50GB) * 1 = 60
x = min(M, N, 128) = 63
Final: 63

case5:
Data volume 500GB, 10 BE machines, 2TB * 3 disks
Amount of data N = 100
BE disks M = 10* (2TB / 50GB) * 3 = 1230
x = min(M, N, 128) = 100
Final: 100

case 6:
Data volume 1TB, 10 BE machines, 2TB * 3 disks
Amount of data N = 205
BE disks M = 10* (2TB / 50GB) * 3 = 1230
x = min(M, N, 128) = 128
Final: 128

case 7:
Data volume 500GB, 1 BE machine, 100TB * 1 disk
Amount of data N = 100
BE disk M = 1* (100TB / 50GB) * 1 = 2048
x = min(M, N, 128) = 100
Final: 100

case 8:
Data volume 1TB, 200 BE machines, 4TB * 7 disks
Amount of data N = 205
BE disks M = 200* (4TB / 50GB) * 7 = 114800
x = min(M, N, 128) = 128
Final: 200
```

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

- not the first case, this time directly take the average of the previous days EMA. Today's estimate_partition_size = EMA(S1, ... , S7) , S7)

:::tip

According to the above algorithm, the initial number of buckets and the number of subsequent buckets can be calculated. Unlike before when only a fixed number of buckets could be specified, due to changes in business data, it is possible that the number of buckets in the previous partition is different from the number of buckets in the next partition, which is transparent to the user, and the user does not need to care about the exact number of buckets in each partition, and this automatic extrapolation will make the number of buckets more reasonable.

:::
