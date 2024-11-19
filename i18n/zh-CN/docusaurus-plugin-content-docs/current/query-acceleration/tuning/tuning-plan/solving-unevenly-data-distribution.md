---
{
    "title": "数据倾斜处理",
    "language": "zh-CN"
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

在[使用列统计信息优化计划](../../../query-acceleration/tuning/tuning-plan/tuning-plan-with-statistics)小节中，我们介绍了优化器所使用的均匀假设。然而，在实际场景中，数据常常并不满足均匀假设。当优化器由于估算误差过大而生成了不理想的执行计划时，我们可以借助 Hint 方式人工调整并优化该执行计划。

## 调优案例 1：Bucket 问题

当 Table 在 Bucket Key 上出现数据倾斜时，Workload 在不同的 BE instance 间会分布不均，今儿延长整个查询的执行时间。

以 TPC-H 的 Schema 为例：假设 `orders` 表以 `o_orderkey` 作为 Bucket Key，并且有两个 Tablet。由于某些原因，一个 Tablet 包含了 1 亿行数据，而另一个 Tablet 仅包含 100 行数据。

当执行以下查询时时：

```sql
SELECT COUNT(*) FROM orders JOIN customer ON o_custkey = c_custkey;
```

优化器生成了 Broadcast Join，其中 `orders` 表作为左表，`customer` 表作为右表。

执行引擎随后会对 `orders` 表的每个 Tablet 启动一个线程来执行 Join。然而，由于数据分布不均，会导致其中一个线程处理了 1 亿行数据，而另一个线程只处理了 100 行数据。

在理想情况下，两个线程应各处理 50% 的数据，以实现查询效率提升一倍。针对此问题，我们可以指定使用 Shuffle Join，让 `orders` 表的数据根据 `o_custkey` 重新分布，然后再与 `customer` 表进行 Join。

## 调优案例 2：估行问题

优化器基于均匀假设估算过滤率。过滤行数误差偏大则会影响后续 SQL 算子的选择。

优化器在估算过滤率时，通常是基于均匀分布的假设。然而，当过滤行数的误差偏大时，则会影响到后续 SQL 算子的选择。

以下 SQL 查询为例：

```sql
select count(1)
from orders, customer 
where o_custkey = c_custkey and o_orderdate < '1920-01-02'
```

在均匀分布的假设下，优化器可能会认为经过`o_orderdate < '1920-01-02'`过滤后输出的行数会少于 `customer` 表的行数，因此选择以 `orders` 表为基础构建 Hash Table。

但是，如果实际数据存在倾斜，导致满足条件的 `orders` 数量多于 `customer` 表中的数量，那么更合理的选择应该是以 `customer` 表为基础来构建 Hash Table。

为了优化查询，我们需要根据实际情况调整 SQL 语句或提示优化器使用更合适的执行计划。

改写 SQL 如下：

```sql
select /* +leading(orders customer) */ count(1)
from orders, customer 
where o_custkey = c_custkey and o_orderdate < '1920-01-02'
```