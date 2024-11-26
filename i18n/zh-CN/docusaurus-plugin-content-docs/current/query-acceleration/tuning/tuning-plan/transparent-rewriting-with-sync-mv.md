---
{
    "title": "使用单表物化视图透明改写",
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

## 工作原理

单表物化视图 (Materialized View) 是一种特殊的表，它预先根据定义好的 SELECT 语句计算并存储数据。其主要目的是满足用户对原始明细数据的任意维度分析需求，同时也能快速地进行固定维度的分析查询。

物化视图的适用场景为：

1. 分析需求同时涵盖明细数据查询和固定维度查询。

2. 查询仅涉及表中的少部分列或行。

3. 查询包含耗时的处理操作，例如长时间的聚合操作等。

4. 查询需要匹配不同的前缀索引。

对于频繁重复使用相同子查询结果的查询，单表同步物化视图能显著提升性能。Doris 会自动维护物化视图的数据，确保基础表 (Base Table) 和物化视图表的数据一致性，无需额外的人工维护成本。在查询时，系统会自动匹配到最优的物化视图，并直接从物化视图中读取数据。


## 调优案例

下面通过一个具体例子来阐述单表物化视图的使用方法：

假设我们拥有一张销售记录明细表 `sales_records`，该表详细记录了每笔交易的各项信息，包括交易 ID、销售员 ID、售卖门店 ID、销售日期以及交易金额。现在，我们经常需要针对不同门店的销售量进行分析查询。

为了优化这些查询的性能，我们可以创建一个物化视图 `store_amt`，该视图按售卖门店进行分组，并对同一门店的销售额进行求和。具体步骤如下：

### 创建物化视图 

首先，我们使用以下 SQL 语句来创建物化视图 `store_amt`：

```sql
CREATE MATERIALIZED VIEW store_amt AS 
SELECT store_id, SUM(sale_amt) 
FROM sales_records
GROUP BY store_id;
```

提交创建任务后，Doris 会在后台异步构建这个物化视图。我们可以通过以下命令来查看物化视图的创建进度：

```sql
SHOW ALTER TABLE MATERIALIZED VIEW FROM db_name; 
```

当`State`字段变为`FINISHED`时，就表示`store_amt`物化视图已经成功创建。

### 查询数据

物化视图创建完成后，当我们查询不同门店的销售量时，Doris 会自动匹配到`store_amt`物化视图，并直接从中读取预先聚合好的数据，从而显著提升查询效率。

查询语句如下：

```sql
SELECT store_id, SUM(sale_amt) FROM sales_records GROUP BY store_id;
```

我们还可以通过`EXPLAIN`命令来检查查询是否成功命中了物化视图：

```sql
EXPLAIN SELECT store_id, SUM(sale_amt) FROM sales_records GROUP BY store_id;
```

在执行计划的最末尾，如果显示类似以下内容，则表示查询成功命中了`store_amt`物化视图：

```sql
TABLE: default_cluster:test.sales_records(store_amt), PREAGGREGATION: ON
```

通过以上步骤，我们可以利用单表物化视图来优化查询性能，提高数据分析的效率。

## 总结

通过创建物化视图，我们能够显著提升相关聚合分析的查询速度。物化视图不仅使我们能够快速进行统计分析，而且还灵活地支持了明细数据的查询需求，是 Doris 中一项非常强大的功能。