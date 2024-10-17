---
{
    "title": "Tuning Plan with Column Statistics",
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

Optimizer, during the Cost-Based Optimization (CBO) , leverages column statistics to make more precise estimations, thereby finding execution plans with lower costs. To effectively utilize these statistics, Doris must first perform the collection of statistical information. For details, please refer to the section on Statistics.

With the assistance of statistical information, we can more accurately estimate the number of rows output by operators, including filtering, Join, and aggregation operations. Below, we will demonstrate how Doris uses column statistics to optimize plans through case studies.

:::info Note

The following case study data is generated using the [TPC-H tool](https://github.com/apache/doris/tree/master/tools/tpch-tools). For more details on the TPC-H Benchmark, please visit the [official website](https://www.tpc.org/tpch/).

:::

## Case 1: Filtering

The query statement is as follows:

```sql
select * from orders where o_orderdate < '1990-01-01'
```

Without statistical information, the optimizer can only rely on empirical parameters to estimate the number of rows filtered by the condition `o_orderdate < '1990-01-01'`. For example, it might simply estimate the filtered result as half the number of rows in the `orders` table.

However, by executing the `ANALYZE TABLE orders` command, the optimizer can obtain the minimum value of the `o_orderdate` column, which is `'1992-01-01'`. Therefore, the optimizer can accurately determine that the number of filtered rows has not actually decreased.

## Case 2: Join

Hash Join is the most commonly used Join algorithm. This algorithm uses one table to build a Hash Table, while the other table is used as the Probe table for matching. Since the cost of building a Hash Table is much higher than the cost of a Probe operation, the table with fewer rows should be chosen to build the Hash Table.

In Doris, it is stipulated that the right table in a Join operation is used to build the Hash Table, while the left table serves as the Probe table. Given that the `orders` table has 150,000 rows and the `customer` table has 15,000 rows, with a 10-fold difference between them.

The query statement is as follows:

```sql
select * from orders join customer on o_custkey = c_custkey and o_orderdate < '1990-01-01'
```

Without statistical information, we might estimate the number of filtered rows in the `orders` table as half of the original table, i.e., 75,000 rows, which is still more than the number of rows in the `customer` table. Therefore, the Join order would be determined as `orders JOIN customer`, with the `customer` table building the Hash Table and the `orders` table serving as the Probe table.

However, with statistical information, the optimizer knows that the minimum value of the `o_orderdate` column is `'1992-01-01'`, and thus estimates the filtered result as 0 rows, which is obviously less than the number of rows in the `customer` table. Therefore, the Join order is adjusted to `customer JOIN orders`.

In actual tests, the execution plan generated using statistical information increased execution efficiency by 40% compared to the execution plan without statistical information.

## Case 3: Uniform Assumption

In real-world business scenarios, data distribution is often not uniform. Taking the order date `o_orderdate` as an example, although the optimizer may adopt a uniform assumption when using statistical information to estimate query plan costs, assuming the same order volume each year, in reality, the order volume in 1992 may significantly exceed the total of other years. Specifically, if the range of `o_orderdate` is from '1992-01-01' to '1998-08-02', spanning 8 years, under the uniform assumption, the optimizer would estimate the filter rate for `o_orderdate < '1993-01-01'` as 1/8. However, this assumption may lead the optimizer to underestimate the actual number of filtered rows, thereby affecting the selection order of tables in subsequent Join operations.

To more accurately assess query performance and optimize Join order, we need to view the actual number of filtered rows recorded in the execution plan (Profile). Additionally, hints can be added to the SQL to guide the optimizer in selecting a more appropriate Join order.

## Case 4: Absence of Column Statistics

In certain specific scenarios, it may not be possible to collect column statistics. For example, when queries involve external tables, when the data volume is extremely large, or when the cost of collecting statistical information is too high. In such cases, the optimizer will instead rely on the number of rows in the table and generate execution plans based on heuristic rules. Typically, in the absence of statistical information, the optimizer tends to generate a left-deep tree execution plan.