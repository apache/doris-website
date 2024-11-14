---
{
    "title": "Manual bucketing",
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


If partitions are used, `DISTRIBUTED ..`. statement describes the rules for dividing data within each partition.

If partitions are not used, it describes the rules for dividing the data across the entire table.

It is also possible to specify a bucketing method for each partition individually.

The bucket columns can be multiple columns. For the Aggregate and Unique models, they must be Key columns, while for the duplicate key data model, they can be both key and value columns. Bucket columns can be the same as or different from Partition columns.

The choice of bucket columns involves a trade-off between query throughput and query concurrency:

- If multiple bucket columns are selected, the data distribution will be more uniform. If a query condition does not include equal conditions for all bucket columns, the query will trigger simultaneous scanning of all buckets, increasing query throughput and reducing the latency of individual queries. This approach is suitable for high-throughput, low-concurrency query scenarios.
- If only one or a few bucket columns are selected, a point query can trigger scanning of just one bucket. In this case, when multiple point queries are concurrent, there is a higher probability that they will trigger scanning of different buckets, reducing the IO impact between queries (especially when different buckets are distributed across different disks). Therefore, this approach is suitable for high-concurrency point query scenarios.

## Recommendations for bucket number and data volume:

- The total number of tablets for a table is equal to (Partition num * Bucket num).
- Without considering expansion, it is recommended that the number of tablets for a table be slightly more than the total number of disks in the cluster.
- In theory, there is no upper or lower limit for the data volume of a single tablet, but it is recommended to be within the range of 1G - 10G. If the data volume of a single tablet is too small, the data aggregation effect will not be good, and the metadata management pressure will be high. If the data volume is too large, it will not be conducive to the migration and replenishment of replicas, and it will increase the cost of retrying failed operations such as Schema Change or Rollup (the granularity of retrying these operations is the tablet).
- When there is a conflict between the data volume principle and the quantity principle of tablets, it is recommended to prioritize the data volume principle.
- When creating a table, the bucket number for each partition is uniformly specified. However, when dynamically adding partitions `ADD PARTITION`, the bucket number for the new partition can be specified separately. This feature can be conveniently used to handle data reduction or expansion.
- Once the bucket number for a partition is specified, it cannot be changed. Therefore, when determining the bucket number, it is necessary to consider the cluster expansion scenario in advance. For example, if there are only 3 hosts with 1 disk each, and the bucket number is set to 3 or less, then even if more machines are added later, the concurrency cannot be improved.

Here are some examples: Assuming there are 10 BEs, each with one disk. If a table has a total size of 500MB, 4-8 tablets can be considered. For 5GB: 8-16 tablets. For 50GB: 32 tablets. For 500GB: It is recommended to partition the table, with each partition size around 50GB and 16-32 tablets per partition. For 5TB: It is recommended to partition the table, with each partition size around 50GB and 16-32 tablets per partition.

The data volume of a table can be viewed using the [SHOW DATA](../../sql-manual/sql-statements/Show-Statements/SHOW-DATA) command, and the result should be divided by the number of replicas to obtain the actual data volume of the table.

## Random distribution

- If an OLAP table does not have fields of the update type, setting the data bucketing mode of the table to RANDOM can avoid severe data skew. When data is imported into the corresponding partitions of the table, each batch of a single import job will randomly select a tablet for writing.
- When the bucketing mode of a table is set to RANDOM, there is no bucketing column, it is not possible to query only a few buckets based on the values of the bucketing column. Queries on the table will simultaneously scan all buckets that hit the partition. This setting is suitable for aggregate query analysis of the entire table data, but not suitable for high-concurrency point queries.
- If the data distribution of the OLAP table is Random Distribution, then during data import, single-tablet import mode can be set (set `load_to_single_tablet` to true). Then, during large-volume data import, a task will only write to one tablet when writing data to the corresponding partition. This can improve the concurrency and throughput of data import, reduce the write amplification caused by data import and compaction, and ensure the stability of the cluster.
