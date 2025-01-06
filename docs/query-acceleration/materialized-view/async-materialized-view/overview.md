---
{
    "title": "Overview",
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


Materialized views, as an efficient solution, combine the flexibility of views with the high performance advantages of physical tables. They can pre-compute and store the result sets of queries, allowing for quick retrieval of results directly from the stored materialized view when query requests arrive, thus avoiding the overhead of re-executing complex query statements.

## Use Cases

- **Query Acceleration and Concurrency Improvement**: Materialized views can significantly enhance query speed while boosting the system's concurrent processing capabilities, effectively reducing resource consumption.
- **Simplifying ETL Processes**: During the Extract, Transform, Load (ETL) process, materialized views can streamline workflows, improve development efficiency, and make data processing smoother.
- **Accelerating External Table Queries in Lakehouse Architecture**: In a lakehouse architecture, materialized views can significantly enhance the query speed for external data sources, improving data access efficiency.
- **Improving Write Efficiency**: By reducing resource contention, materialized views can optimize the data writing process, enhance write efficiency, and ensure data consistency and integrity.

## Limitations
- **Consistency of Asynchronous Materialized Views with Base Table Data**: Asynchronous materialized views will eventually be consistent with the base table data, but they cannot be synchronized in real-time, meaning real-time consistency cannot be maintained.
- **Support for Window Function Queries**: Currently, if a query contains window functions, it is not supported to transparently rewrite that query to utilize materialized views.
- **Materialized Views with ORDER BY and Queries**: If the materialized view itself contains an ORDER BY clause, the system does not currently support using that materialized view for transparent query rewriting. However, please note that the query itself can still include an ORDER BY clause.
- **Materialized Views Joining More Tables than Query Tables**: If the number of tables joined in the materialized view exceeds the number of tables involved in the query (for example, if the query only involves t1 and t2, while the materialized view includes t1, t2, and an additional t3), the system currently does not support transparently rewriting that query to utilize the materialized view.

## Principle Introduction

Materialized views, as an advanced feature in databases, essentially function as MTMV-type internal tables. When creating a materialized view, the system simultaneously registers a refresh task. This task will run when needed, executing an INSERT OVERWRITE statement to write the latest data into the materialized view.

**Refresh Mechanism**  
Unlike the real-time incremental refresh used by synchronous materialized views, asynchronous materialized views offer more flexible refresh options.

**Full Refresh**:  
In this mode, the system recalculates all data involved in the SQL definition of the materialized view and writes the complete results into the materialized view. This process ensures that the data in the materialized view remains consistent with the base table data, but it may consume more computational resources and time.

**Partition Incremental Refresh**:  
When the partition data of the base table for the materialized view changes, the system can intelligently identify these changes and refresh only the affected partitions. This mechanism significantly reduces the computational resources and time required to refresh the materialized view while ensuring eventual data consistency.

**Transparent Rewriting**:  
Transparent rewriting is an important means for databases to optimize query performance. When processing user queries, the system can automatically optimize and rewrite the SQL to improve execution efficiency and reduce computational costs. This rewriting process is transparent to the user, requiring no intervention.

Doris asynchronous materialized views utilize a transparent rewriting algorithm based on the SPJG (SELECT-PROJECT-JOIN-GROUP-BY) model. This algorithm can deeply analyze the structural information of SQL, automatically searching for and selecting suitable materialized views for transparent rewriting. When multiple materialized views are available, the algorithm will also choose the optimal materialized view to respond to the query SQL based on certain strategies (such as cost models), further enhancing query performance.

## Support for Materialized Refresh Data Lake

Regarding the support for materialized refresh data lakes, different types of tables and catalogs have varying levels of support:

| Table Type | Catalog Type | Full Refresh | Partition Refresh | Triggered Refresh |
|------------|--------------|--------------|-------------------|--------------------|
| Internal   | Internal     | Supported in 2.1 | Supported in 2.1 | Supported in 2.1.4 |
| Hive       | Hive         | Supported in 2.1 | Supported in 2.1 | Not supported       |
| Iceberg    | Iceberg      | Supported in 2.1 | Not supported     | Not supported       |
| Paimon     | Paimon       | Supported in 2.1 | Not supported     | Not supported       |
| Hudi       | Hudi         | Supported in 2.1 | Not supported     | Not supported       |
| JDBC       | JDBC         | Supported in 2.1 | Not supported     | Not supported       |
| ES         | ES           | Supported in 2.1 | Not supported     | Not supported       |

## Relationship Between Materialized Views and OLAP Internal Tables

:::tips
Starting from version 2.1.4, materialized views support the Duplicate model.
:::

The underlying implementation of materialized views relies on OLAP tables of the Duplicate model, which theoretically allows them to support all core functionalities of the Duplicate model. However, to ensure that materialized views can execute data refresh tasks stably and efficiently, we have imposed a series of necessary restrictions on their functionality. The specific restrictions are as follows:

- The partitions of materialized views are automatically created and maintained based on their base tables, so users cannot perform partition operations on materialized views.
- Since there are related jobs (JOB) that need to be processed behind materialized views, commands like DELETE TABLE or RENAME TABLE cannot be used to operate on materialized views. Instead, the commands specific to the materialized view must be used for these operations.
- The column data types of materialized views are automatically inferred based on the query statement specified at creation, so these data types cannot be modified. Otherwise, it may lead to failures in the refresh tasks of the materialized view.
- Materialized views have some properties that Duplicate tables do not possess, and these properties need to be modified through the commands of the materialized view. Other common properties should be modified using the ALTER TABLE command.

## More References
For creating, querying, and maintaining asynchronous materialized views, you can refer to [Creating, Querying, and Maintaining Asynchronous Materialized Views](../functions-and-demands).

For best practices, you can refer to [Best Practices](../use-guide).

For frequently asked questions, you can refer to [Frequently Asked Questions](../faq).