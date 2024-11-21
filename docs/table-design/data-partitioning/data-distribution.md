---
{
    "title": "Data Distribution Concepts",
    "language": "en_US"
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

In Doris, the core of **data distribution** is to efficiently map the rows of data written to the table onto the various **data shards (Tablets)** in the underlying storage through reasonable partitioning and bucketing strategies. Through data distribution strategies, Doris can fully utilize the storage and computing capabilities of multiple nodes, thereby supporting efficient storage and querying of large-scale data.

---

## Overview of Data Distribution

### Data Writing

When writing data, Doris first allocates the rows of data to the corresponding partitions based on the table's partitioning strategy. Then, according to the bucketing strategy, the rows of data are further mapped to specific shards within the partition, thus determining the storage location of the data rows.

### Query Execution

During query execution, Doris's optimizer will prune data based on partitioning and bucketing strategies to maximize the reduction of the scanning range. In cases involving JOIN or aggregate queries, data transfer across nodes (Shuffle) may occur. Reasonable partitioning and bucketing design can reduce Shuffle and fully utilize **Colocate Join** to optimize query performance.

---

## Node and Storage Architecture

### Node Types

The Doris cluster consists of the following two types of nodes:

- **FE Node (Frontend)**: Manages cluster metadata (such as tables and shards) and is responsible for SQL parsing and execution planning.
- **BE Node (Backend)**: Stores data and is responsible for executing computation tasks. The results from BE are summarized and returned to FE, which then returns them to the user.

### Data Shards (Tablet)

The data shards stored by BE nodes are the smallest unit of data management in Doris and the basic unit for data movement and replication.

---

## Partitioning Strategy

Partitioning is the first layer of logical division for data organization, used to divide the data in the table into smaller subsets. Doris provides the following two types of **partitioning** and three **partitioning modes**:

### Partition Types

- **Range Partitioning**: Allocates data rows to corresponding partitions based on the value range of the partitioning column.
- **List Partitioning**: Allocates data rows to corresponding partitions based on specific values of the partitioning column.

### Partitioning Modes

- **Manual Partitioning**: Users manually create partitions (e.g., specified during table creation or added via `ALTER` statements).
- **Dynamic Partitioning**: The system automatically creates partitions based on time scheduling rules, but does not create partitions on demand when writing data.
- **Automatic Partitioning**: The system automatically creates corresponding partitions as needed during data writing, with caution to avoid generating too many partitions with dirty data.

---

## Bucketing Strategy

Bucketing is the second layer of logical division for data organization, used to further divide data rows into smaller units within partitions. Doris supports the following two bucketing methods:

- **Hash Bucketing**: Distributes data rows evenly across shards by calculating the `crc32` hash value of the bucketing column and taking the modulus of the number of buckets.
- **Random Bucketing**: Randomly assigns data rows to shards. When using Random bucketing, the `load_to_single_tablet` option can be used to optimize the quick writing of small-scale data.

---

## Data Distribution Optimization

### Colocate Join

For large tables that frequently require JOIN or aggregate queries, the **Colocate** strategy can be enabled to place data with the same bucketing column values on the same physical node, reducing cross-node data transfer and significantly improving query performance.

### Partition Pruning

During queries, Doris can prune irrelevant partitions through filtering conditions, thereby reducing the data scanning range and lowering I/O costs.

### Bucketing Parallelism

During queries, a reasonable number of buckets can fully utilize the computing and I/O resources of the machines. It is recommended that the data volume of a single shard be around 2GB, not exceeding 10GB. For fewer than 10 nodes.

---

## Data Distribution Goals

1. **Uniform Data Distribution**
   Ensure that data is evenly distributed across all BE nodes to avoid data skew that leads to overload on certain nodes, thereby improving overall system performance.

2. **Optimize Query Performance**
   By using partition pruning, shard parallelism, and Colocate strategies, reduce the amount of data scanned, enhance computational parallelism, lower Shuffle costs, and improve the efficiency of JOIN and aggregate queries.

3. **Flexible Data Management**
   - Partition cold data (HDD) and hot data (SSD) by time.
   - Regularly delete historical partitions to free up storage space.

4. **Control Metadata Scale**
   Since the metadata of each shard is stored in both FE and BE, it is necessary to reasonably control the number of shards. The empirical recommendation is:
   - For every 10 million shards, FE requires at least 100GB of memory.
   - The number of shards carried by a single BE should be less than 20,000.
   - The recommended data volume for a single shard is 2GB, and it is best not to exceed 10GB. For tables with very large data volumes, shards can go up to 50GB.

5. **Optimize Write Throughput**
   - The number of buckets should be reasonably controlled (recommended < 128) to avoid degrading write performance.
   - The number of partitions written at one time should be moderate (recommended to write a small number of partitions at a time).

---

By carefully designing and managing partitioning and bucketing strategies, Doris can efficiently support the storage and query processing of large-scale data, meeting various complex business needs.
