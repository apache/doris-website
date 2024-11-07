---
{
    "title": "Optimizing Table Scanning",
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

## Principle

Doris, as a high-performance real-time analytics data warehouse, offers a powerful partition pruning feature that can significantly enhance query performance. 

Partition pruning is a query optimization technique that intelligently identifies partitions relevant to a query by analyzing its conditions, and scans only the data within these partitions, thereby avoiding unnecessary scans of irrelevant partitions. This approach can greatly reduce I/O operations and computational load, thus accelerating query execution.

## Use Case

Here is a usage case to demonstrate Doris's partition pruning feature.

Suppose we have a sales data table named `sales`, which is partitioned by date, with each day's data stored in a separate partition. The table structure is defined as follows:

```sql
CREATE TABLE sales (
    date DATE,
    product VARCHAR(50),
    amount DECIMAL(10, 2)
)
PARTITION BY RANGE(date) (
    PARTITION p1 VALUES LESS THAN ('2023-01-01'),
    PARTITION p2 VALUES LESS THAN ('2023-02-01'),
    PARTITION p3 VALUES LESS THAN ('2023-03-01'),
    PARTITION p4 VALUES LESS THAN ('2023-04-01')
)
DISTRIBUTED BY HASH(date) BUCKETS 16
PROPERTIES
(
    "replication_num" = "1"
);
```

Now, we need to query the total sales amount between January 15, 2023 and February 15, 2023. The query statement is as follows:

```sql
SELECT SUM(amount) AS total_amount
FROM sales
WHERE date BETWEEN '2023-01-15' AND '2023-02-15';
```

For the above query, Doris's partition pruning optimization process is as follows:

1. Doris intelligently analyzes the partition column `date` in the query conditions and identifies the date range of the query as being between '2023-01-15' and '2023-02-15'.

2. By comparing the query conditions with the partition definitions, Doris precisely locates the range of partitions that need to be scanned. In this example, only partitions `p2` and `p3` need to be scanned, as their date ranges fully cover the query conditions.

3. Doris automatically skips partitions unrelated to the query conditions, such as `p1` and `p4`, avoiding unnecessary data scans and thereby reducing I/O overhead.

4. Finally, Doris performs data scanning and aggregation computations only within partitions `p2` and `p3`, quickly obtaining the query results.

By using the `EXPLAIN` command, we can view the query execution plan and confirm that Doris's partition pruning optimization has taken effect. In the execution plan, the `partition` attribute of the `OlapScanNode` node will display the actually scanned partitions as `p2` and `p3`.

```sql
|   0:VOlapScanNode(212)                                                     |
|      TABLE: cir.sales(sales), PREAGGREGATION: ON                           |
|      PREDICATES: (date[#0] >= '2023-01-15') AND (date[#0] <= '2023-02-15') |
|      partitions=2/4 (p2,p3)                                                |
```

## Summary

In summary, Doris's partition pruning feature can intelligently identify the relevance between query conditions and partitions, automatically prune irrelevant partitions, and scan only necessary data, thereby significantly enhancing query performance. Reasonable utilization of the partition pruning feature can help users build efficient real-time analytics systems and easily handle massive data query demands.