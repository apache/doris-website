---
{
    "title": "异步物化视图概述",
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

物化视图作为一种有效的解决方案，兼顾了视图的灵活性和物理表的高性能。
它可以预先计算并存储查询结果集，从而在查询请求到达时直接从物化视图中获取结果，而无需重新执行查询语句。

## 使用场景
- 查询加速，提高并发，减少资源消耗。
- 简化 ETL 流程，提升开发效率。
- 结合湖仓一体，加速外表查询。
- 提升写入效率，减少资源竞争。

## 使用限制

1. 异步物化视图和基表的数据最终一致，无法保持实时一致性。
2. 如果查询包含窗口函数，暂时还不支持透明改写。
3. 如果物化视图包含 order by，暂时还不支持透明改写，查询可以包含 order by。
4. 物化视图的连接表比查询多，比如查询使用了 t1, t2, 物化视图是 t1, t2, t3，暂时还不支持透明改写。

## 原理介绍
物化视图为类型 MTMV 的内表，创建物化视图，会注册刷新物化视图的任务，刷新时，会运行一个任务执行 insert overwrite 语句向物化视图写入数据。

不同于同步物化视图的实时增量刷新机制，异步物化视图支持全量刷新和分区增量刷新两种机制，全量刷新，计算并刷新物化视图定义 SQL 的所有数据。
以保证数据的最终一致性。 分区增量刷新，当物化视图的基表分区数据发生变化时，可以识别并仅刷新变化的分区，无需刷新整个物化视图。

透明改写指在处理查询时，可自动对用户的 SQL 进行优化及改写，提高查询性能及执行效率，降低计算成本。改写通常对用户不可见，无需干预改写过程。
Doris 异步物化视图采用基于 SPJG（SELECT-PROJECT-JOIN-GROUP-BY）模式的透明改写算法。该算法能够分析 SQL 的结构信息，
自动寻找合适的物化视图进行透明改写，并选择最优的物化视图来响应查询 SQL。

## 物化刷新数据湖支持情况

对于物化刷新数据湖的支持情况，不同类型的表和 Catalog 有不同的支持程度：

| 表类型  | Catalog 类型 | 全量刷新   | 分区刷新 | 触发刷新     |
| ------- | ------------ |--------| -------- |----------|
| 内表    | Internal     | 2.1 支持 | 2.1 支持  | 2.1.4 支持 |
| 外表    | Hive         | 2.1 支持 | 2.1 支持  | 不支持      |
| Iceberg | 支持         | 2.1 支持    | 不支持   | 不支持      |
| Paimon  | 支持         | 2.1 支持    | 不支持   | 不支持      |
| Hudi    | 支持         | 2.1 支持    | 不支持   | 不支持      |
| JDBC    | 支持         | 2.1 支持    | 不支持   | 不支持      |
| ES      | 支持         | 2.1 支持    | 不支持   | 不支持      |

## 物化视图和 OLAP 内表关系

:::tips
自 2.1.4 版本起，物化视图支持 Duplicate 模型
:::

物化视图的底层实现是一个 Duplicate 模型的 OLAP 表。这意味着，理论上物化视图支持 Duplicate 模型的所有功能。
然而，为了确保物化视图能够正常且高效地刷新数据，对其功能进行了一些限制，具体如下
1. 物化视图的分区是基于其基表自动创建和维护的，因此用户不能对物化视图进行分区操作
2. 由于物化视图背后有相关的作业（JOB）需要处理，所以不能使用删除表（DELETE TABLE）或重命名表（RENAME TABLE）的命令来操作物化视图。
   相反，需要使用物化视图自身的命令来进行这些操作。
3. 物化视图的列数据类型是根据查询语句推导出来的，因此这些数据类型不能被修改。否则，可能会导致物化视图的刷新任务失败。
4. 物化视图具有一些 Duplicate 表没有的属性（property），这些属性需要通过物化视图的命令进行修改。而其他公用的属性则需要使用 ALTER TABLE 命令进行修改。


## 更多参考
创建、查询与维护异步物化视图，可以参考 [创建、查询与维护异步物化视图](../functions-and-demands)

最佳实践，可以参考 [最佳实践](../use-guide)

常见问题，可以参考 [常见问题](../faq)

