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

In Doris, **data distribution** is centered on efficiently mapping rows of data written to a table onto various **data tablets** in the underlying storage through well-designed partitioning and bucketing strategies. With these distribution strategies, Doris fully leverages multi-node storage and computational capabilities, enabling efficient storage and querying of large-scale datasets.

---

## Overview of Data Distribution

### Data Ingestion

When data is written to a table, Doris first assigns each row to the corresponding partition based on the table's partitioning strategy. Then, it maps the rows to specific tablets within the partition according to the bucketing strategy, determining the physical storage location for each row.

### Query Execution

During query execution, Doris' optimizer leverages partition and bucket pruning to minimize data scans. For queries involving JOIN or aggregation, cross-node data transfers (Shuffle) may occur. Properly designed partitioning and bucketing strategies can reduce Shuffle operations and improve query performance through mechanisms like **Colocate Join**.

---

## Node and Storage Architecture

### Node Types

A Doris cluster consists of two types of nodes:

- **FE Nodes (Frontend)**: Manage cluster metadata (e.g., tables, tablets) and handle SQL parsing and execution planning.
- **BE Nodes (Backend)**: Store data and execute computational tasks. After processing, BE nodes send the results back to FE nodes, which aggregate and return the final output to the user.

### Data Tablets

The data stored on BE nodes is organized into multiple **data tablets**, which are the smallest units of data management and the fundamental building blocks for data movement and replication.

---

## Partitioning Strategy

Partitioning is the first layer of logical data organization that divides a table into smaller subsets. Doris offers the following **partition types** and **partition modes**:

### Partition Types

- **Range Partition**: Maps rows to partitions based on a range of values in the partition column.
- **List Partition**: Maps rows to partitions based on specific values in the partition column.

### Partition Modes

- **Manual Partitioning**: Users manually define partitions when creating a table or by using `ALTER` statements to add partitions.
- **Dynamic Partitioning**: The system creates partitions based on a time-based schedule, but it does not automatically create partitions during data ingestion.
- **Automatic Partitioning**: The system automatically creates partitions on demand during data ingestion.

---

## Bucketing Strategy

Bucketing is the second layer of logical data organization, which divides rows within a partition into smaller subsets. Doris supports the following bucketing methods:

- **Hash Bucketing**: Distributes rows across tablets by calculating the `crc32` hash of bucket column values and taking the modulo of the bucket count to ensure even distribution.
- **Random Bucketing**: Randomly assigns rows to tablets, ideal for small-scale data ingestion (e.g., using `load_to_single_tablet` for optimization).

---

## Data Distribution Optimization

### Colocate Join

For large tables frequently involved in JOIN or aggregation queries, **Colocate** ensures rows with the same bucket column values are located on the same physical node. This minimizes cross-node data transfers and significantly enhances query performance.

### Partition Pruning

Doris can prune irrelevant partitions based on query filters, reducing the scan range and lowering I/O costs.

---

## Goals of Data Distribution

1. **Even Data Distribution**
   Ensures data is evenly distributed across BE nodes to prevent data skew, which can cause some nodes to be overloaded, thus affecting query performance.

2. **Query Performance Optimization**
   Minimizes Shuffle costs and enhances JOIN and aggregation efficiency through partition pruning, bucketing, and Colocate optimizations.

3. **Flexible Data Management**
   - Partition data by time to store cold data on HDD and hot data on SSD.
   - Regularly delete historical partitions to release storage space.

4. **Metadata Scalability**
   Metadata for each tablet is stored on both FE and BE nodes. Proper control of the tablet count is necessary. Recommended guidelines include:
   - At least 100 GB of memory for FE nodes per 10 million tablets.
   - A single BE node should manage fewer than 20,000 tablets.

5. **Optimized Write Throughput**
   - Limit the bucket count to a reasonable number (recommended < 128) to avoid write throughput degradation.
   - Restrict the number of partitions involved in each write operation (preferably ingesting data into only a few partitions per batch).

---

By carefully designing and managing partitioning and bucketing strategies, Doris enables efficient storage and query processing for large-scale datasets, meeting diverse and complex business needs.
