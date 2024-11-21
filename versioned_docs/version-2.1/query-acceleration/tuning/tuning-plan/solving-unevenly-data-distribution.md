---
{
    "title": "Solving Unevenly Data Distribution",
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

In the section on using column statistics to optimize plans, we introduced the uniformity assumption employed by the optimizer. However, in real-world scenarios, data often does not satisfy this uniformity assumption. When the optimizer generates an unsatisfactory execution plan due to significant estimation errors, we can manually adjust and optimize the execution plan using hints.

## Tuning Case 1: Bucket Issue

When data skew occurs on the bucket key of a table, the workload will be unevenly distributed across different BE instances, thereby prolonging the overall query execution time.

Taking the TPC-H schema as an example: Suppose the `orders` table uses `o_orderkey` as the bucket key and has two tablets. For certain reasons, one tablet contains 100 million rows of data, while the other tablet contains only 100 rows.

When executing the following query:

```sql
SELECT COUNT(*) FROM orders JOIN customer ON o_custkey = c_custkey;
```

The optimizer generates a Broadcast Join, with the `orders` table as the left table and the `customer` table as the right table.

The execution engine then launches a thread for each tablet of the `orders` table to perform the join. However, due to uneven data distribution, one thread processes 100 million rows of data, while the other thread processes only 100 rows.

Ideally, both threads should each process 50% of the data to double the query efficiency. To address this issue, we can specify the use of a Shuffle Join to redistribute the data from the `orders` table based on `o_custkey` before joining it with the `customer` table.

## Tuning Case 2: Row Estimation Issue

The optimizer estimates the filter rate based on the uniformity assumption. Significant errors in the estimated number of filtered rows can impact the selection of subsequent SQL operators.

When estimating the filter rate, the optimizer typically relies on the assumption of uniform distribution. However, when the error in the estimated number of filtered rows is significant, it can affect the selection of subsequent SQL operators.

Considering the following SQL query:

```sql
select count(1) 
from orders, customer 
where o_custkey = c_custkey and o_orderdate < '1920-01-02'
```

Under the assumption of uniform distribution, the optimizer may assume that the number of rows output after filtering with `o_orderdate < '1920-01-02'` will be less than the number of rows in the `customer` table, and therefore choose to build a hash table based on the `orders` table.

However, if the actual data is skewed, resulting in more `orders` satisfying the condition than the number of entries in the `customer` table, a more reasonable choice would be to build the hash table based on the `customer` table.

To optimize the query, we need to adjust the SQL statement based on the actual situation or prompt the optimizer to use a more suitable execution plan.

Revising the SQL as follows:

```sql
select /* +leading(orders customer) */ count(1)
from orders, customer 
where o_custkey = c_custkey and o_orderdate < '1920-01-02'
```