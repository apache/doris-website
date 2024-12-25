---
{
    "title": "Transparent Rewriting by Async-Materialized View",
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

## Overview

[Materialized View](../../materialized-view/sync-materialized-view.md) is a special type of table that pre-computes and stores data based on a predefined SELECT statement. Its main purpose is to meet users' needs for analyzing raw detailed data in any dimension and also enable rapid fixed-dimension analytical queries.

The applicable scenarios for materialized views are as follows:

1. Analytical requirements cover both detailed data queries and fixed-dimension queries.
2. Queries only involve a small subset of columns or rows in the table.
3. Queries contain time-consuming processing operations, such as long aggregation operations.
4. Queries need to match different prefix indexes.

For queries that frequently reuse the same subquery results, single-table synchronous materialized views can significantly improve performance. Doris will automatically maintain the data of materialized views, ensuring data consistency between the base table and the materialized view table without the need for additional manual maintenance costs. During queries, the system will automatically match the optimal materialized view and read data directly from it.

:::tip Precautions
- In Doris 2.0 and subsequent versions, materialized views have some enhanced functions. It is recommended that users confirm in the test environment whether the expected queries can hit the materialized views they want to create before using materialized views in the formal production environment.
- It is not recommended to create multiple similar materialized views on the same table, as this may lead to conflicts among multiple materialized views and result in query hit failures.
:::

## Case

The following uses a specific example to demonstrate the process of using single-table materialized views to accelerate queries.

Suppose we have a detailed sales record table `sales_records`, which records various information for each transaction, including transaction ID, salesperson ID, store ID, sales date, and transaction amount. Now, we often need to conduct analytical queries on the sales volumes of different stores.

To optimize the performance of these queries, we can create a materialized view `store_amt` that groups by store ID and sums the sales amounts for the same store. The specific steps are as follows:

### Create a Materialized View

First, we use the following SQL statement to create the materialized view `store_amt`:

```sql
CREATE MATERIALIZED VIEW store_amt AS 
SELECT store_id, SUM(sale_amt) 
FROM sales_records
GROUP BY store_id;
```

After submitting the creation task, Doris will asynchronously build this materialized view in the background. We can view the progress of creating the materialized view through the following command:

```sql
SHOW ALTER TABLE MATERIALIZED VIEW FROM db_name;
```

When the `State` field changes to `FINISHED`, it indicates that the `store_amt` materialized view has been successfully created.

### Transparent Rewriting

After the materialized view is created, when we query the sales volumes of different stores, Doris will automatically match the `store_amt` materialized view and directly read the pre-aggregated data from it, thus significantly improving query efficiency. The query statement is as follows:

```sql
SELECT store_id, SUM(sale_amt) FROM sales_records GROUP BY store_id;
```

We can also use the `EXPLAIN` command to check whether the query has successfully hit the materialized view:

```sql
EXPLAIN SELECT store_id, SUM(sale_amt) FROM sales_records GROUP BY store_id;
```

At the end of the execution plan, if content similar to the following is displayed, it indicates that the query has successfully hit the `store_amt` materialized view:

```sql
TABLE: default_cluster:test.sales_records(store_amt), PREAGGREGATION: ON
```

Through the above steps, we can use single-table materialized views to optimize query performance and improve the efficiency of data analysis.

## Summary

By creating single-table materialized views, we can significantly improve the query speed for related aggregation analyses. Single-table materialized views not only enable us to conduct statistical analyses quickly but also flexibly support the query requirements for detailed data, making it a very powerful feature in Doris. 