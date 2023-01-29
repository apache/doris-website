---
{
    'title': 'ClickHouse & Kudu to Doris: 10X Concurrency Increased, 70% Latency Down',
    'language': 'en'
    'summary': 'The value-added report provided by Linkedcare to customers was initially provided by ClickHouse, which was later replaced by Apache Doris;',
    'date': '2023-01-28',
    'author': 'Yi Yang',
    'tags': ['Best Practice'],
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

![kv](/images/linkedcare/kv.png)

## Author: 
YiYang, Senior Big Data Developer, Linkedcare

# About Linkedcare
Linkedcare is a leading SaaS software company in the health technology industry, focusing on the medical dental and cosmetic plastic surgery. In 2021, it was selected as one of the top 150 digital healthcare companies in the world by CB Insights. Linkedcare has served thousands of plastic surgery institutions in Los Angeles, Taiwan, and Hong Kong. Linkedcare also provides integrated management system services for dental clinics, covering electronic medical records, customer relationship management, intelligent marketing, B2B trading platform, insurance payment, BI tools, etc.

# Doris' Evolution in Linkedcare
Let me briefly introduce Doris's development in Linkedcare first. In general, the application of Doris in Linkedcare can be divided into two stages:
1. The value-added report provided by Linkedcare to customers was initially provided by ClickHouse, which was later replaced by Apache Doris;
2. Due to the continuous improvement of real-time data analysis requirements, T+1's data reporting gradually cannot meet business needs. Linkedcare needs a data warehouse that can handle real-time processing, and Doris has been introduced into the company's data warehouse since then. With the support of the Apache Doris community and the SelectDB professional technical team, our business data has been gradually migrated from Kudu to Doris.

![1](/images/linkedcare/1.png)

# Data Service Architecture: From ClickHouse to Doris
## Data Service Architecture Requirements
- Support complex queries: When customers do self-service on the dashboard, a complex SQL query statement will be generated to directly query the database, and the complexity of the statement is unknown, which adds a lot of pressure on the database and affects query performance.
- High concurrency and low latency: At least 100 concurrent queries can be supported, and query results can be return within 1 second;
- Real-time data update: The report data comes from the SaaS system. When the customer modifies the historical data in the system, the report data must be changed accordingly to ensure consistentency, which requires real-time processing.
- Low cost and easy deployment: There are a lot of private cloud customers in our SaaS business. In order to reduce labor costs, the business requires that the architecture deployment and operation and maintenance be simple enough.

## Early Problems Found: ClickHouse Shuts Down When High-concurrency Occurs
The previous project chose ClickHouse to provide data query services, but serious concurrency problems occurred during use:
10 concurrent queries will cause ClickHouse to shut down, resulting in the inability to provide services to customers normally, which is the direct reason for us to replace ClickHouse.

In addition, there are several severe problems:
1. The cost of ClickHouse services on the cloud is very high, and the dependency on ClickHouse components is relatively high. The frequent interaction between ClickHouse and Zookeeper during data ingestion will put greater pressure on stability.
2. How to seamlessly migrate data without affecting the normal use of customers is another problem.

## Selection between Doris, Clickhouse and Kudu
To deal with the existing problems and meet the business requirements, we decided to conduct research on Doris (0.14), Clickhouse, and Kudu respectively.

![2](/images/linkedcare/2.png)

As shown in the table above, we made a deep comparison of these 3 databases. And we can see that Doris has excellent performance in many aspects:
- High concurrency: Doris can handle high-concurrency of 1,000 and more. So it will easily solve the problem of 10 concurrent queries which led ClickHouse to shut down.
- Query performance: Doris can achieve millisecond-level query response. In single-table query, although Doris and ClickHouse are almost equivalent in query performance, in multi-table query, Doris is far better than ClickHouse. Doris can make sure that the QPS won't drop when high-concurrency happens.
- Data update: Doris' data model can meet our needs for data update to ensure the consistency of system data and business data, which will be described in detail below.
- Ease of use: Doris has a flat architecture, simple and fast deployment, fully-completed data ingest functions, and good at scaling out; At the same time, Doris can automatically perform replica balancing internally, and the operation and maintenance cost is extremely low. However, ClickHouse and Kudu rely heavily on components and require a lot of preparatory work for use. This requires a professional team to handle a large number of daily operation and maintenance tasks.
- Standard SQL: Doris is compatible with the MySQL protocol and uses standard SQL. It is easy for developers to get started and does not require additional learning costs.
- Distributed JOINs: Doris supports distributed JOINs, but ClickHouse has limitations in JOIN queries and functions as well as poor maintainability.
- Active community: The Apache Doris open source community is active with passion. At the same time, SelectDB provides a professional and full-time team for technical support for the Doris community. If you encounter problems, you can directly contact the community and find out a solution in time.

From the above research, we can find that Doris has excellent capabilities in all aspects and is very in line with our needs. Therefore, we adopt Doris instead of ClickHouse, which solves the problems of poor concurrency and the shutdown of ClickHouse.

# Data Warehouse Architecture: From Kudu+Impala to Doris
In the process of using data reports, we have gradually discovered many advantages of Doris, so we decided to introduce Doris to the company's data warehouse.

## Data Warehouse Architecture Requirements
- When the customer modifies the historical data in the system, the report data should also be changed accordingly. At the same time, there should be a feature that can help customers to change the value of a single column;
- When Flink extracts the full amount of data from the business database and writes it into the data warehouse frequently, the version compaction must keep up with the speed of new version generation, and will not cause version accumulation;
- Through resource isolation and other functions, Doris reduces the possibility of resource preemption, improves resource utilization, and makes full use of resources on the core computing nodes;
- Due to the limited memory resources in the company, overloaded tasks must be completed without increasing the number of clusters.

## Early Problems Found: Kudu+Impala Underperforms
The early company data warehouse architecture used Kudu and Impala for computing and storage. But we found the following problems during use:
1. When the number of concurrent queries (QPS) is large, the simple query response time of Kudu+Impala is always more than a few seconds, which cannot reach the millisecond-level required by the business. The long waiting time has brought bad user experience to customers. 
2. The Kudu+Impala engine cannot perform incremental aggregation of factual data, and can barely support real-time data analysis.
3. Kudu relies on a large number of primary key lookups when ingesting data. The batch processing efficiency is low and Kudu consumes a lot of CPU, which is not friendly to resource utilization.

## New Data Warehouse Architecture Design Based on Doris

![3](/images/linkedcare/3.png)

As shown in the figure above, Apache Doris is used in the new architecture and is responsible for data warehouse storage and computing; Data ingestion of real-time data and ODS data through Kafka has been replaced with Flink; We use Duckula as our stream computing platform; While we introduce DolphinSchedular for our task scheduling.

# Benefits of the new architecture based on Apache Doris:
- The new data warehouse architecture based on Doris no longer depends on Hadoop related components, and the operation and maintenance cost is low.
- Higher performance. Doris uses less server resources but provides stronger data processing capabilities;
- Doris supports high concurrency and can directly support WebApp query services;
- Doris supports the access to external tables, which enable easy data publishing and data ingestion;
- Doris supports dynamic scaling out and automatic data balance;
- Doris supports multiple federated queries, including Hive, ES, MySQL, etc.;
- Doris' Aggregate Model supports users updating a single column;
- By adjusting BE parameters and cluster size, the problem of version accumulation can be effectively solved;
- Through the Resource Tag and Query Block function, cluster resource isolation can be realized, resource usage rate can be reduced, and query performance can be improved.

Thanks to the excellent capabilities of the new architecture, the cluster we use has been reduced from 18 pieces of 16Cores 128G to 12 pieces of 16Cores 128G, saving up to 33% of resources compared to before; Further, the computing performance has been greatly improved. Doris can complete an ETL task that was completed in 3 hours on Kudu in only 1 hour. In addition, in frequent updates, Kudu's internal data fragmentation files cannot be automatically merged so that the performance will become worse and worse, requiring regular rebuilding; While the compaction function of Doris can effectively solve this problem.

# Highly Recommended
The cost of using Doris is very low. Only 3 low-end servers or even desktops can be used to deploy easily a data warehouse based on Apache Doris; For enterprises with limited investment and do not want to be left behind by the market, it is highly recommended to try Apache Doris.

Doris is also a mature analytical database with MPP architecture. At the same time, its community is very active and easy to communicate with. SelectDB, the commercial company behind Doris, has set up a full-time technical team for the community. Any questions can be answered within 1 hour. In the last year, the community has been continuously promoted by SelectDB and introduced a series of industry-leading new features. In addition, the community will seriously consider the user habits when iterating, which will bring a lot of convenience.

I really appreciate the full support from the Doris community and the SelectDB team. And I sincerely recommend developers and enterprises to start with Apache Doris today.

# Apache Doris 
Apache Doris is a real-time analytical database based on MPP architecture, known for its high performance and ease of use. It supports both high-concurrency point queries and high-throughput complex analysis. (https://github.com/apache/doris)

# Links
## GitHub:
https://github.com/apache/doris

## Apache Doris Website:
https://doris.apache.org

