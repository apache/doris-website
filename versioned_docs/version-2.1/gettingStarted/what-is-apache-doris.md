---
{ 
'title': 'Introduction to Apache Doris',
'language': 'en' 
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


## What's Apache Doris

Apache Doris is an MPP-based real-time data warehouse known for its high query speed. For queries on large datasets, it returns results in sub-seconds. It supports both high-concurrent point queries and high-throughput complex analysis. It can be used for report analysis, ad-hoc queries, unified data warehouse, and data lake query acceleration. Based on Apache Doris, users can build applications for user behavior analysis, A/B testing platform, log analysis, user profile analysis, and e-commerce order analysis.

Apache Doris, formerly known as Palo, was initially created to support Baidu's ad reporting business. It was officially open-sourced in 2017 and donated by Baidu to the Apache Software Foundation in July 2018, where it was operated by members of the incubator project management committee under the guidance of Apache mentors. In June 2022, Apache Doris graduated from the Apache incubator as a Top-Level Project. By 2024, the Apache Doris community has gathered more than 600 contributors from hundreds of companies in different industries, with over 120 monthly active contributors.

Apache Doris has a wide user base. It has been used in production environments of over 4000 companies worldwide, including giants such as TikTok, Baidu, Cisco, Tencent, and NetEase. It is also widely used across industries from finance, retailing, and telecommunications to energy, manufacturing, medical care, etc.

## Usage Scenarios

As shown in the figure below, after various data integrations and processing, data sources are typically ingested into the real-time data warehouse Doris and offline lakehouses (such as Hive, Iceberg, and Hudi). These are widely used in OLAP analysis scenarios.

![Apache Doris usage scenarios](/images/getting-started/apache-doris-usage-scenarios-pipeline.png)

Apache Doris is widely used in the following scenarios:

- Reporting Services and Ad-Hoc Queries: Doris provides multidimensional data analysis capabilities, supporting internal enterprise reports and ad-hoc report queries. It offers stable and high-performance service support for high-concurrency report access by users.

- Real-Time Data Warehouse Analysis: Doris can be applied to real-time data processing and analysis scenarios, providing second-level synchronization of data changes from TP databases and sub-second data query capabilities. It serves scenarios such as real-time dashboards, real-time risk control, real-time order analysis, and real-time advertiser reports.

- Unified Lakehouse Analysis: Doris’s external table federated analysis accesses data stored in offline lakehouses like Hive, Iceberg, and Hudi. This approach significantly enhances query performance without the need for data duplication.

- User Profiling and Behavior Analysis: Utilizing Doris’s built-in behavior analysis functions and bitmap types supports user behavior analysis and profiling scenarios. It provides efficient query and real-time analysis capabilities, helping enterprises quickly gain user insights, optimize user experiences, and make informed business decisions.

- Log Search and Analysis: Doris supports inverted indexing and full-text search, effectively meeting log search and analysis requirements. Leveraging its efficient query and storage engines, Doris offers a cost-performance advantage of up to tenfold compared to traditional log search and analysis solutions.

## Technical overview

Apache Doris adopts the MySQL protocol and is highly compatible with MySQL syntax, supporting standard SQL. Users can access Apache Doris through various client tools and seamlessly integrate it with BI tools. 

Apache Doris has a simple and neat architecture with only two types of processes:

- Frontend(FE): Mainly responsible for handling user request access, query parsing and planning, metadata management, and node management-related tasks.
  
- Backend(BE): Mainly responsible for data storage and the execution of query plans. Data is partitioned into shards and stored with multiple replicas in the BE.

![Overall Architecture and Technical Features](/images/getting-started/apache-doris-technical-overview.png)

In a production environment, multiple FE nodes can be deployed for disaster recovery and backup, with each FE maintaining a full copy of the metadata. The FE has three roles:

  | Role     | Function                                                         |
  | -------- | ------------------------------------------------------------ |
  | Master   | The FE Master node is responsible for reading and writing metadata. When the Master metadata undergoes changes, it synchronizes these changes to Follower or Observer nodes using the BDB JE protocol. |
  | Follower | Follower nodes are responsible for reading metadata. In the event of a Master node failure, a Follower node can be selected as the new Master node. |
  | Observer | Observer nodes are responsible for reading metadata, primarily to enhance the cluster's query concurrency and performance. They do not participate in the cluster's leader election. |

Both FE and BE processes are horizontally scalable, allowing a single cluster to support hundreds of machines and tens of petabytes of storage capacity. FE and BE processes ensure high availability and data reliability through consistency protocols. The compute-storage integrated architecture is highly consolidated, significantly reducing the operational costs of distributed systems.

## Core Features of Apache Doris

- High Availability: In Apache Doris, both metadata and data are stored with multiple replicas, synchronizing data logs via the quorum protocol. Data write is considered successful once a majority of replicas have completed the write, ensuring that the cluster remains available even if a few nodes fail. Apache Doris supports both same-city and cross-region disaster recovery, enabling dual-cluster master-slave modes. When some nodes experience failures, the cluster can automatically isolate the faulty nodes, preventing the overall cluster availability from being affected.

- High Compatibility: Apache Doris is highly compatible with the MySQL protocol and supports standard SQL syntax, covering most MySQL and Hive functions. This high compatibility allows users to seamlessly migrate and integrate existing applications and tools. Apache Doris supports the MySQL ecosystem, enabling users to connect Doris using MySQL Client tools for more convenient operations and maintenance. It also supports MySQL protocol compatibility for BI reporting tools and data transmission tools, ensuring efficiency and stability in data analysis and data transmission processes.

- Real-Time Data Warehouse: Based on Apache Doris, a real-time data warehouse service can be built. Apache Doris offers second-level data ingestion capabilities, capturing incremental changes from upstream online transactional databases into Doris within seconds. Leveraging vectorized engines, MPP architecture, and Pipeline execution engines, Doris provides sub-second data query capabilities, thereby constructing a high-performance, low-latency real-time data warehouse platform.

- Unified Lakehouse: Apache Doris can build a unified lakehouse architecture based on external data sources such as data lakes or relational databases. The Doris unified lakehouse solution enables seamless integration and free data flow between data lakes and data warehouses, helping users directly utilize data warehouse capabilities to solve data analysis problems in data lakes while fully leveraging data lake data management capabilities to enhance data value.

- Flexible Modeling: Apache Doris offers various modeling approaches, such as wide table models, pre-aggregation models, star/snowflake schemas, etc. During data import, data can be flattened into wide tables and written into Doris through compute engines like Flink or Spark, or data can be directly imported into Doris, performing data modeling operations through views, materialized views, or real-time multi-table joins.

## Technical overview

Doris provides an efficient SQL interface and is fully compatible with the MySQL protocol. Its query engine is based on an MPP (Massively Parallel Processing) architecture, capable of efficiently executing complex analytical queries and achieving low-latency real-time queries. Through columnar storage technology for data encoding and compression, it significantly optimizes query performance and storage compression ratio.

### Interface

Apache Doris adopts the MySQL protocol, supports standard SQL, and is highly compatible with MySQL syntax. Users can access Apache Doris through various client tools and seamlessly integrate it with BI tools, including but not limited to Smartbi, DataEase, FineBI, Tableau, Power BI, and Apache Superset. Apache Doris can work as the data source for any BI tools that support the MySQL protocol.

### Storage engine

Apache Doris has a columnar storage engine, which encodes, compresses, and reads data by column. This enables a very high data compression ratio and largely reduces unnecessary data scanning, thus making more efficient use of IO and CPU resources.

Apache Doris supports various index structures to minimize data scans:

- Sorted Compound Key Index: Users can specify three columns at most to form a compound sort key. This can effectively prune data to better support highly concurrent reporting scenarios.

- Min/Max Index: This enables effective data filtering in equivalence and range queries of numeric types.

- BloomFilter Index: This is very effective in equivalence filtering and pruning of high-cardinality columns.

- Inverted Index: This enables fast searching for any field.

- Apache Doris supports a variety of data models and has optimized them for different scenarios:

Aggregate Key Model: merges the value columns with the same keys and improves performance by pre-aggregation

- Unique Key Model: ensures uniqueness of keys and overwrites data with the same key to achieve row-level data updates

- Duplicate Key Model: stores data as it is without aggregation, capable of detailed storage of fact tables

- Apache Doris also supports strongly consistent materialized views. Materialized views are automatically selected and updated within the system without manual efforts, which reduces maintenance costs for users.

### Query engine

Apache Doris has an MPP-based query engine for parallel execution between and within nodes. It supports distributed shuffle join for large tables to better handle complicated queries.

![Query engine 1](/images/getting-started/apache-doris-query-engine-1.png)

The query engine of Apache Doris is fully vectorized, with all memory structures laid out in a columnar format. This can largely reduce virtual function calls, increase cache hit rates, and make efficient use of SIMD instructions. Apache Doris delivers a 5~10 times higher performance in wide table aggregation scenarios than non-vectorized engines.

![Query engine 2](/images/getting-started/apache-doris-query-engine-2.png)

Apache Doris uses adaptive query execution technology to dynamically adjust the execution plan based on runtime statistics. For example, it can generate a runtime filter and push it to the probe side. Specifically, it pushes the filters to the lowest-level scan node on the probe side, which largely reduces the data amount to be processed and increases join performance. The runtime filter of Apache Doris supports In/Min/Max/Bloom Filter.

The query optimizer of Apache Doris is a combination of CBO and RBO. RBO supports constant folding, subquery rewriting, and predicate pushdown while CBO supports join reorder. The Apache Doris CBO is under continuous optimization for more accurate statistics collection and inference as well as a more accurate cost model.

