---
{
    "title": "使用同步物化视图透明改写",
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

## 原理

同步物化视图是一种特殊类型的表，它基于预定义的 SELECT 语句预先计算并存储数据。其主要目的是满足用户对原始明细数据任意维度的分析需求，同时也能够实现快速的固定维度分析查询。

物化视图适用于以下场景：

1. 分析需求既涵盖明细数据查询，又包含固定维度查询。
2. 查询仅涉及表中一小部分列或行。
3. 查询包含耗时的处理操作，比如长时间的聚合操作。
4. 查询需要匹配不同的前缀索引。

对于频繁重复使用相同子查询结果的查询，同步物化视图能够显著提升性能。Doris 会自动维护物化视图中的数据，确保基表和物化视图之间的数据一致性，而无需额外的人工维护成本。在查询期间，系统会自动匹配最优的物化视图并直接从中读取数据。

## 调优使用案例

以下是一个具体示例，用于说明单表物化视图的使用方法：

假设我们有一个详细的销售记录表 `sales_records`，它记录了每笔交易的各类信息，包括交易 ID、销售人员 ID、店铺 ID、销售日期以及交易金额。现在，我们经常需要针对不同店铺的销售额进行分析查询。

为优化这些查询的性能，我们可以创建一个物化视图 `store_amt`，按照店铺 ID 进行分组并对同一店铺的销售额进行求和。具体步骤如下：

### 创建物化视图

首先，我们使用以下 SQL 语句来创建物化视图 `store_amt`：

```sql
CREATE MATERIALIZED VIEW store_amt AS 
SELECT store_id, SUM(sale_amt) 
FROM sales_records
GROUP BY store_id;
```

提交创建任务后，Doris 会在后台异步构建这个物化视图。我们可以通过以下命令查看物化视图的创建进度：

```sql
SHOW ALTER TABLE MATERIALIZED VIEW FROM db_name; 
```

当 `State` 字段变为 `FINISHED` 时，就表明 `store_amt` 物化视图已成功创建。

### 查询数据

物化视图创建完成后，当我们查询不同店铺的销售额时，Doris 会自动匹配 `store_amt` 物化视图，并直接从其中读取预先聚合的数据，这将显著提高查询效率。

查询语句如下：

```sql
SELECT store_id, SUM(sale_amt) FROM sales_records GROUP BY store_id;
```

我们也可以使用 `EXPLAIN` 命令来检查查询是否成功命中物化视图：

```sql
EXPLAIN SELECT store_id, SUM(sale_amt) FROM sales_records GROUP BY store_id;
```

在执行计划的末尾，如果显示类似如下内容，则表明查询成功命中了 `store_amt` 物化视图：

```sql
TABLE: default_cluster:test.sales_records(store_amt), PREAGGREGATION: ON
```

通过这些步骤，我们可以利用单表物化视图来优化查询性能并提高数据分析的效率。

## 总结

通过创建物化视图，我们能够显著提高相关聚合分析的查询速度。物化视图不仅能让我们快速进行统计分析，还能灵活支持明细数据的查询需求，使其成为 Doris 中一个非常强大的功能。 