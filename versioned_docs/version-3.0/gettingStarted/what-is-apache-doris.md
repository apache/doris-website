---
{ 
'title': 'Introduction to Apache Doris',
'language': 'en' 
}
---

## What's Apache Doris

Apache Doris is an MPP-based real-time data warehouse known for its high query speed. For queries on large datasets, it returns results in sub-seconds. It supports both high-concurrency point queries and high-throughput complex analysis. It can be used for report analysis, ad-hoc queries, unified data warehouse, and data lake query acceleration. Based on Apache Doris, users can build applications for user behavior analysis, A/B testing platform, log analysis, user profile analysis, and e-commerce order analysis.

Apache Doris, formerly known as Palo, was initially created to support Baidu's ad reporting business. It was officially open-sourced in 2017 and donated by Baidu to the Apache Software Foundation in July 2018, where it was operated by members of the incubator project management committee under the guidance of Apache mentors. In June 2022, Apache Doris graduated from the Apache incubator as a Top-Level Project. By 2024, the Apache Doris community has gathered more than 600 contributors from hundreds of companies in different industries, with over 120 monthly active contributors.

Apache Doris has a wide user base. It has been used in production environments of over 4000 companies worldwide, including giants such as TikTok, Baidu, Tencent, and NetEase. It is also widely used across industries from finance, retailing, and telecommunications to energy, manufacturing, medical care, etc.

## Usage Scenarios

As shown in the figure below, after various data integrations and processing, data sources are typically ingested into the real-time data warehouse Doris and offline lakehouses (such as Hive, Iceberg, and Hudi). These are widely used in OLAP analysis scenarios.

![Apache Doris Usage Scenarios](/images/getting-started/apache-doris-usage-scenarios-pipeline.jpeg) 

Apache Doris is widely used in the following scenarios:

- **Real-time Data Analysis**:

  - **Real-time Reporting and Decision-making**: Doris provides real-time updated reports and dashboards for both internal and external enterprise use, supporting real-time decision-making in automated processes.
  
  - **Ad Hoc Analysis**: Doris offers multidimensional data analysis capabilities, enabling rapid business intelligence analysis and ad hoc queries to help users quickly uncover insights from complex data.
  
  - **User Profiling and Behavior Analysis**: Doris can analyze user behaviors such as participation, retention, and conversion, while also supporting scenarios like population insights and crowd selection for behavior analysis.

- **Lakehouse Analytics**:

  - **Lakehouse Query Acceleration**: Doris accelerates lakehouse data queries with its efficient query engine.
  
  - **Federated Analytics**: Doris supports federated queries across multiple data sources, simplifying architecture and eliminating data silos.
  
  - **Real-time Data Processing**: Doris combines real-time data streams and batch data processing capabilities to meet the needs of high concurrency and low-latency complex business requirements.

- **SQL-based Observability**:

  - **Log and Event Analysis**: Doris enables real-time or batch analysis of logs and events in distributed systems, helping to identify issues and optimize performance.


## Overall Architecture

Apache Doris uses the MySQL protocol, is highly compatible with MySQL syntax, and supports standard SQL. Users can access Apache Doris through various client tools, and it seamlessly integrates with BI tools. When deploying Apache Doris, you can choose between a storage-compute integrated architecture or a storage-compute separated architecture based on hardware environments and business needs.

### Storage-Compute Integrated Architecture

The storage-compute integrated architecture of Apache Doris is streamlined and easy to maintain. As shown in the figure below, it consists of only two types of processes:

- **Frontend (FE):** Primarily responsible for handling user requests, query parsing and planning, metadata management, and node management tasks.

- **Backend (BE):** Primarily responsible for data storage and query execution. Data is partitioned into shards and stored with multiple replicas across BE nodes.

![MPP Architecture of Storage-Compute Integrated Architecture](/images/getting-started/apache-doris-technical-overview.png)

In a production environment, multiple FE nodes can be deployed for disaster recovery. Each FE node maintains a full copy of the metadata. The FE nodes are divided into three roles:

| Role      | Function                                                     |
| --------- | ------------------------------------------------------------ |
| Master    | The FE Master node is responsible for metadata read and write operations. When metadata changes occur in the Master, they are synchronized to Follower or Observer nodes via the BDB JE protocol. |
| Follower  | The Follower node is responsible for reading metadata. If the Master node fails, a Follower node can be selected as the new Master. |
| Observer  | The Observer node is responsible for reading metadata and is mainly used to increase query concurrency. It does not participate in cluster leadership elections. |

Both FE and BE processes are horizontally scalable, enabling a single cluster to support hundreds of machines and tens of petabytes of storage capacity. The FE and BE processes use a consistency protocol to ensure high availability of services and high reliability of data. The storage-compute integrated architecture is highly integrated, significantly reducing the operational complexity of distributed systems.


### Compute-Storage Decoupled
Starting from version 3.0, a compute-storage decoupled deployment architecture can be chosen. The compute-storage decoupled version of Apache Doris utilizes a unified shared storage layer as the data storage space. By separating storage and computation, users can independently scale storage capacity and computing resources, thereby achieving optimal performance and cost efficiency. As shown in the figure below, the compute-storage decoupled architecture is divided into three layers:

- **Metadata Layer**: The metadata layer is primarily responsible for request planning, query parsing and planning, as well as metadata storage and management.
  
- **Compute Layer**: The compute layer consists of multiple compute groups, each of which can operate as an independent tenant handling business computations. Within each compute group, there are multiple stateless BE nodes, and BE nodes can be elastically scaled up or down at any time.
  
- **Storage Layer**: The storage layer can use shared storage solutions such as S3, HDFS, OSS, COS, OBS, Minio, and Ceph to store Doris's data files, including Segment files and inverted index files.

![Overall Architecture and Technical Features of Compute-Storage Decoupling](/images/getting-started/apache-doris-technical-compute-storage-decouple-overview.jpg)

## Core Features of Apache Doris

- **High Availability**: In Apache Doris, both metadata and data are stored with multiple replicas, synchronizing data logs via the quorum protocol. Data write is considered successful once a majority of replicas have completed the write, ensuring that the cluster remains available even if a few nodes fail. Apache Doris supports both same-city and cross-region disaster recovery, enabling dual-cluster master-slave modes. When some nodes experience failures, the cluster can automatically isolate the faulty nodes, preventing the overall cluster availability from being affected.

- **High Compatibility**: Apache Doris is highly compatible with the MySQL protocol and supports standard SQL syntax, covering most MySQL and Hive functions. This high compatibility allows users to seamlessly migrate and integrate existing applications and tools. Apache Doris supports the MySQL ecosystem, enabling users to connect Doris using MySQL Client tools for more convenient operations and maintenance. It also supports MySQL protocol compatibility for BI reporting tools and data transmission tools, ensuring efficiency and stability in data analysis and data transmission processes.

- **Real-Time Data Warehouse**: Based on Apache Doris, a real-time data warehouse service can be built. Apache Doris offers second-level data ingestion capabilities, capturing incremental changes from upstream online transactional databases into Doris within seconds. Leveraging vectorized engines, MPP architecture, and Pipeline execution engines, Doris provides sub-second data query capabilities, thereby constructing a high-performance, low-latency real-time data warehouse platform.

- **Unified Lakehouse**: Apache Doris can build a unified lakehouse architecture based on external data sources such as data lakes or relational databases. The Doris unified lakehouse solution enables seamless integration and free data flow between data lakes and data warehouses, helping users directly utilize data warehouse capabilities to solve data analysis problems in data lakes while fully leveraging data lake data management capabilities to enhance data value.

- **Flexible Modeling**: Apache Doris offers various modeling approaches, such as wide table models, pre-aggregation models, star/snowflake schemas, etc. During data import, data can be flattened into wide tables and written into Doris through compute engines like Flink or Spark, or data can be directly imported into Doris, performing data modeling operations through views, materialized views, or real-time multi-table joins.

## Technical overview

Doris provides an efficient SQL interface and is fully compatible with the MySQL protocol. Its query engine is based on an MPP (Massively Parallel Processing) architecture, capable of efficiently executing complex analytical queries and achieving low-latency real-time queries. Through columnar storage technology for data encoding and compression, it significantly optimizes query performance and storage compression ratio.

### Interface

Apache Doris adopts the MySQL protocol, supports standard SQL, and is highly compatible with MySQL syntax. Users can access Apache Doris through various client tools and seamlessly integrate it with BI tools, including but not limited to Smartbi, DataEase, FineBI, Tableau, Power BI, and Apache Superset. Apache Doris can work as the data source for any BI tools that support the MySQL protocol.

### Storage engine

Apache Doris has a columnar storage engine, which encodes, compresses, and reads data by column. This enables a very high data compression ratio and largely reduces unnecessary data scanning, thus making more efficient use of IO and CPU resources.

Apache Doris supports various index structures to minimize data scans:

- **Sorted Compound Key Index**: Users can specify three columns at most to form a compound sort key. This can effectively prune data to better support highly concurrent reporting scenarios.

- **Min/Max Index**: This enables effective data filtering in equivalence and range queries of numeric types.

- **BloomFilter Index**: This is very effective in equivalence filtering and pruning of high-cardinality columns.

- **Inverted Index**: This enables fast searching for any field.

Apache Doris supports a variety of data models and has optimized them for different scenarios:

- **Detail Model (Duplicate Key Model):** A detail data model designed to meet the detailed storage requirements of fact tables.

- **Primary Key Model (Unique Key Model):** Ensures unique keys; data with the same key is overwritten, enabling row-level data updates.

- **Aggregate Model (Aggregate Key Model):** Merges value columns with the same key, significantly improving performance through pre-aggregation.

Apache Doris also supports strongly consistent single-table materialized views and asynchronously refreshed multi-table materialized views. Single-table materialized views are automatically refreshed and maintained by the system, requiring no manual intervention from users. Multi-table materialized views can be refreshed periodically using in-cluster scheduling or external scheduling tools, reducing the complexity of data modeling.

### Query engine

Apache Doris has an MPP-based query engine for parallel execution between and within nodes. It supports distributed shuffle join for large tables to better handle complicated queries.

![MPP-based Query engine 1](/images/getting-started/apache-doris-query-engine-1.png)

The query engine of Apache Doris is fully vectorized, with all memory structures laid out in a columnar format. This can largely reduce virtual function calls, increase cache hit rates, and make efficient use of SIMD instructions. Apache Doris delivers a 5~10 times higher performance in wide table aggregation scenarios than non-vectorized engines.

![MPP-based Query engine 2](/images/getting-started/apache-doris-query-engine-2.png)

Apache Doris uses adaptive query execution technology to dynamically adjust the execution plan based on runtime statistics. For example, it can generate a runtime filter and push it to the probe side. Specifically, it pushes the filters to the lowest-level scan node on the probe side, which largely reduces the data amount to be processed and increases join performance. The runtime filter of Apache Doris supports In/Min/Max/Bloom Filter.

![MPP-based pip_exec_3](/images/pip_exec_3.png)

Apache Doris uses a Pipeline execution engine that breaks down queries into multiple sub-tasks for parallel execution, fully leveraging multi-core CPU capabilities. It simultaneously addresses the thread explosion problem by limiting the number of query threads. The Pipeline execution engine reduces data copying and sharing, optimizes sorting and aggregation operations, thereby significantly improving query efficiency and throughput.

In terms of the optimizer, Apache Doris employs a combined optimization strategy of CBO (Cost-Based Optimizer), RBO (Rule-Based Optimizer), and HBO (History-Based Optimizer). RBO supports constant folding, subquery rewriting, predicate pushdown, and more. CBO supports join reordering and other optimizations. HBO recommends the optimal execution plan based on historical query information. These multiple optimization measures ensure that Doris can enumerate high-performance query plans across various types of queries.

