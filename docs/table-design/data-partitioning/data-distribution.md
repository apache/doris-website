---
{
    "title": "Data Distribution Concepts",
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

When writing data to the table, Doris distributes the data rows across various data shards (Tablets) based on the table's partitioning and bucketing strategies. Through data distribution, Doris can leverage the storage and computing capabilities of multiple machines, thus achieving large-scale data storage and processing. During query execution, the optimizer performs partition and bucket pruning, and during JOIN or aggregation queries, data may be transferred between nodes (Shuffle). By using reasonable partitioning and bucketing strategies, partition pruning and COLOCATE can be fully utilized to optimize query performance.

## Nodes

A Doris cluster consists of a set of FE nodes and BE nodes, each with its own operating system, dedicated memory, and disk storage. FE nodes are responsible for managing the cluster's metadata and parsing and planning SQL, with shards (Tablets) being the most important type of metadata; BE nodes are responsible for data storage and query processing. After the planning is completed by FE, the computation tasks are sent to BE, and after BE completes the computation, the final results are returned to FE, which then returns the query results to the user. The data of the shards (Tablets) is stored on the disks of the BE.

## Tables and Shards

When data is written to Doris tables, Doris first maps the data rows to the corresponding partitions based on the partition type and the values of the partition columns, and then maps the data rows to a shard under the partition based on the bucketing columns, thus giving the data rows a corresponding storage location.

### Partitioning

You can understand Doris's partitioning from the partition type and partition mode. The partition type determines which partition the data rows are mapped to, while the partition mode determines how the partitions are created.

- Partition Types: Doris supports Range and List partitioning.
   - Range: Refers to mapping data rows with partition column values within a certain range to a partition.
   - List: Refers to mapping data rows where the partition column equals certain specific values to a partition.

- Partition Modes: Doris supports three modes for creating partitions: manual, dynamic, and automatic. They are:
   - Manual: Users specify partitions when creating the table or use the Alter statement to add partitions.
   - Dynamic: Doris creates partitions based on the time schedule of the partitions, and no partitions are created when importing data.
   - Automatic: Doris creates partitions as needed based on the imported data.

### Bucketing

Doris supports two types of bucketing: Hash and Random.

- Hash: Maps data rows to shards within a partition based on the hash value of the bucketing column values, using crc32 and the modulus of the number of buckets.
- Random: Randomly maps data rows to shards within a partition; for small files, you can use load_to_single_tablet to optimize.

To optimize the joins and aggregation queries of large tables, COLOCATE can be used to enhance performance.

## Data Distribution Goals

The primary goal of data distribution in Doris is:

 - To utilize the storage and computing capabilities of multiple nodes, meaning that data is evenly distributed across various BE nodes. Uneven data distribution or data skew can cause some nodes to process more data than others, thus affecting query performance.

Other goals include:

 - Optimizing query performance: Fully utilizing partition and bucket pruning and COLOCATE to significantly enhance query performance based on query characteristics.
 - Flexible data management: For example, partitioning by time, storing cold data on HDD, hot data on SSD, and deleting historical partitions to free up data.
 - Reasonable metadata: The metadata of each shard (Tablet) exists in both FE and BE, requiring reasonable control over the number of shards. Based on experience, every 10 million shards require at least 100GB of memory in FE, and the number of shards handled by a single BE should be less than 20,000.
 - Write throughput: The number of buckets per partition should not be too large (recommended < 128), as a larger number can affect write throughput. The number of partitions involved in each write should also not be too large; it is recommended to import a few partitions at a time.

