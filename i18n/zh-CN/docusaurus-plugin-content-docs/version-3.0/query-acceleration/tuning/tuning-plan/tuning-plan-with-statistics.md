---
{
    "title": "使用列统计信息优化计划",
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

优化器在 CBO 阶段，利用列统计信息，能够做出更为精准的估算，进而找到代价更小的执行计划（plan）。为了有效利用统计信息，Doris 首先需要执行统计信息的收集工作，具体请参考[统计信息收集](../../../query-acceleration/statistics)。

在统计信息的辅助下，我们能够更为准确地估算出算子输出的行数，这包括过滤、Join 以及聚合等操作。下面，我们将通过案例来演示 Doris 如何使用列统计信息优化计划。

:::info 备注

以下案例数据均通过 [TPC-H 工具](https://github.com/apache/doris/tree/master/tools/tpch-tools)生成。如需了解 TPC-H Benchmark 详情可前往[官网](https://www.tpc.org/tpch/)查看

:::

## 案例 1：过滤

查询语句如下：

```sql
select * from orders where o_orderdate < '1990-01-01'
```

在没有统计信息的情况下，优化器只能依据经验参数来估算`o_orderdate < '1990-01-01'`这一条件过滤后的行数，例如，可能会简单地将过滤结果估算为`orders`表行数的一半。

然而，通过执行`analyze table orders`命令，优化器便能够获取到`o_orderdate`列的最小值，即`'1992-01-01'`。因此，优化器能够准确地判断出过滤后的行数实际上并没有减少。

## 案例 2：Join 操作

Hash Join 是最常用的 Join 算法。该算法会利用一个表来构建 Hash Table，而另一个表则作为 Probe 表进行匹配。由于构建 Hash Table 的代价远高于 Probe 操作代价，因此应选择行数较少的表来构建 Hash Table。

在 Doris 中，规定 Join 操作的右表用于构建 Hash Table，而左表则作为 Probe 表。已知`orders`表的行数为 150,000，而`customer`表的行数为 15,000，两者相差 10 倍。

查询语句如下：

```sql
select * from orders join customer on o_custkey = c_custkey and o_orderdate < '1990-01-01'
```

在没有统计信息的情况下，我们可能会估算过滤后的`orders`表行数为原表的一半，即 75,000 行，这仍然比`customer`表的行数多。因此，Join 的顺序会被确定为`orders join customer`，即`customer`表构建 Hash Table，`orders`表作为 Probe 表。

然而，如果拥有统计信息，优化器便能知道`o_orderdate`列的最小值是`'1992-01-01'`，因此会估算出过滤后的结果为 0 行，这显然比`customer`表的行数要少。于是，Join 的顺序会调整为`customer join orders` 。

在实际测试中，采用统计信息生成的执行计划相较于未使用统计信息的执行计划，其执行效率增加了 40%。

## 案例 3：均匀假设

在实际业务场景中，数据分布往往并不均匀。以订单日期 `o_orderdate` 为例，尽管在使用统计信息估算查询计划成本时，优化器可能会采用均匀假设，即假设每年的订单量相同，但实际上，1992 年的订单量可能会显著超过其他年份的总和。具体来说，如果 `o_orderdate` 的范围是 '1992-01-01' 到 '1998-08-02'，一共 8 年，那么在均匀假设下，优化器会估算 `o_orderdate < '1993-01-01'` 的过滤率为 1/8。然而，这种假设很可能导致优化器低估了实际过滤后的行数，进而影响到后续 Join 操作中表的选择顺序。

为了更准确地评估查询性能并优化 Join 顺序，我们需要查看执行计划（Profile）中记录的实际过滤行数。在此基础上，还可以在 SQL 中添加 Hint，以指导优化器选择更合适的 Join 顺序。

## 案例 4：无列统计信息

在某些特定场景下，可能会出现无法收集列统计信息的情况。例如，当查询涉及外部表时、当数据量极为庞大，或者收集统计信息的成本过高时。面对这种情况，优化器将转而依据表的行数，并通过启发性规则来生成执行计划（plan）。通常，在缺少统计信息的情况下，优化器倾向于生成一个左深树的执行计划。