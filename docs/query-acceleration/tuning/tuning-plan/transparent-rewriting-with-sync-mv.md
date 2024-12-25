---
{
  "title": "Transparent Rewriting with Single-table Materialized View",
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

The [Materialized View](../../materialized-view/sync-materialized-view.md) is a special kind of table that pre-computes and stores data according to a predefined SELECT statement. Its main purpose is to meet users' needs for analyzing raw detailed data from any dimension and also enable quick analysis and queries on fixed dimensions.

The applicable scenarios for materialized views are as follows:

1. The analysis requirements cover both detailed data queries and fixed-dimension queries.
2. The queries only involve a small number of columns or rows in the table.
3. The queries include time-consuming processing operations, such as long-duration aggregation operations, etc.
4. The queries need to match different prefix indexes.

For queries that frequently and repeatedly use the results of the same subqueries, single-table synchronous materialized views can significantly improve performance. Doris will automatically maintain the data of materialized views to ensure data consistency between the base table and the materialized view table, without requiring additional manual maintenance costs. During a query, the system will automatically match the optimal materialized view and directly read data from it.

:::tip Precautions
- In Doris 2.0 and subsequent versions, materialized views have some enhanced functions. It is recommended that users confirm in the test environment whether the expected queries can hit the materialized views they want to create before using materialized views in the formal production environment.
- It is not recommended to create multiple materialized views with similar forms on the same table, as this may lead to conflicts among multiple materialized views and thus cause query hit failures.
  :::

## Case

The following uses a specific example to demonstrate the process of using single-table materialized views to accelerate queries:

Suppose we have a detailed sales record table named `sales_records`, which records various pieces of information for each transaction in detail, including the transaction ID, salesperson ID, selling store ID, sales date, and transaction amount. Now, we often need to conduct analysis and queries on the sales volume of different stores.

To optimize the performance of these queries, we can create a materialized view named `store_amt`. This view groups by the selling store and sums up the sales amounts of the same store. The specific steps are as follows:

### Create a Materialized View

Firstly, we use the following SQL statement to create the materialized view `store_amt`:

```sql
CREATE MATERIALIZED VIEW store_amt AS 
	@@ -59,38 +61,36 @@ FROM sales_records
GROUP BY store_id;
```

After submitting the creation task, Doris will build this materialized view asynchronously in the background. We can use the following command to check the creation progress of the materialized view:

```sql
SHOW ALTER TABLE MATERIALIZED VIEW FROM db_name;
```

When the `State` field becomes `FINISHED`, it means that the `store_amt` materialized view has been successfully created.

### Transparent Rewriting

After the materialized view is created, when we query the sales volume of different stores, Doris will automatically match the `store_amt` materialized view and directly read the pre-aggregated data from it, thus significantly improving the query efficiency. The query statement is as follows:

```sql
SELECT store_id, SUM(sale_amt) FROM sales_records GROUP BY store_id;
```

We can also use the `EXPLAIN` command to check whether the query has successfully hit the materialized view:

```sql
EXPLAIN SELECT store_id, SUM(sale_amt) FROM sales_records GROUP BY store_id;
```

At the end of the execution plan, if something like the following is displayed, it means that the query has successfully hit the `store_amt` materialized view:

```sql
TABLE: default_cluster:test.sales_records(store_amt), PREAGGREGATION: ON
```

Through the above steps, we can use single-table materialized views to optimize query performance and improve the efficiency of data analysis.

## Summary

By creating single-table materialized views, we can significantly improve the query speed for relevant aggregation analysis. Single-table materialized views not only enable us to conduct statistical analysis quickly but also flexibly support the query needs for detailed data, which is a very powerful feature in Doris. 