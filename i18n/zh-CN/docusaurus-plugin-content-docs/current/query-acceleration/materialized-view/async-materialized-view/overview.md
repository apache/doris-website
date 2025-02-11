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

物化视图作为一种高效的解决方案，兼具了视图的灵活性和物理表的高性能优势。
它能够预先计算并存储查询的结果集，从而在查询请求到达时，直接从已存储的物化视图中快速获取结果，避免了重新执行复杂的查询语句所带来的开销。

## 使用场景

- 查询加速与并发提升：物化视图能够显著提高查询速度，同时增强系统的并发处理能力，有效减少资源消耗。
- 简化 ETL 流程：在数据抽取、转换和加载（ETL）过程中，物化视图能够简化流程，提升开发效率，使数据处理更加顺畅。
- 加速湖仓一体架构中的外表查询：在湖仓一体架构中，物化视图能够显著提升对外部数据源的查询速度，提高数据访问效率。
- 提升写入效率：通过减少资源竞争，物化视图能够优化数据写入过程，提高写入效率，确保数据的一致性和完整性。

## 使用限制
- 异步物化视图与基表数据一致性：异步物化视图与基表的数据最终会保持一致，但无法实时同步，即无法保持实时一致性。
- 窗口函数查询支持：当前，如果查询中包含了窗口函数，暂不支持将该查询透明地改写为利用物化视图的形式。
- 物化视图连接表多于查询表：如果物化视图所连接的表数量多于查询所涉及的表（例如，查询仅涉及 t1 和 t2，而物化视图则包含了 t1、t2 以及额外的 t3），
则系统目前不支持将该查询透明地改写为利用该物化视图的形式。
- 如果物化视图包含 UNION ALL 等集合操作，LIMIT，ORDER BY，CROSS JOIN，物化视图可以正常构建，但是不能用于透明改写。

## 原理介绍

物化视图，作为数据库中的一种高级特性，其实质为类型 MTMV 的内表。在创建物化视图时，系统会同时注册一个刷新任务。此任务会在需要时运行，执行 INSERT OVERWRITE 语句，以将最新的数据写入物化视图中。

**刷新机制**
与同步物化视图所采用的实时增量刷新不同，异步物化视图提供了更为灵活的刷新选项

- **全量刷新：**
在此模式下，系统会重新计算物化视图定义 SQL 所涉及的所有数据，并将结果完整地写入物化视图。
此过程确保了物化视图中的数据与基表数据保持一致，但可能会消耗更多的计算资源和时间。

- **分区增量刷新：**
当物化视图的基表分区数据发生变化时，系统能够智能地识别出这些变化，并仅针对受影响的分区进行刷新。
这种机制显著降低了刷新物化视图所需的计算资源和时间，同时保证了数据的最终一致性。

**透明改写：**
透明改写是数据库优化查询性能的一种重要手段。在处理用户查询时，系统能够自动对 SQL 进行优化和改写，
以提高查询的执行效率和降低计算成本。这一改写过程对用户而言是透明的，无需用户进行任何干预。

Doris 异步物化视图采用了基于 SPJG（SELECT-PROJECT-JOIN-GROUP-BY）模式的透明改写算法。
该算法能够深入分析 SQL 的结构信息，自动寻找并选择合适的物化视图进行透明改写。在多个物化视图可供选择时，
算法还会根据一定的策略（如成本模型）选择最优的物化视图来响应查询 SQL，从而进一步提升查询性能。


## 物化刷新数据湖支持情况

物化刷新数据湖的支持情况，不同类型的表和 Catalog 有不同的支持程度

<table>
    <tr>
        <th rowspan="2">表类型</th>
        <th rowspan="2">Catalog 类型</th>
        <th colspan="2">刷新方式</th>
        <th >刷新时机</th>
    </tr>
    <tr>
        <th>全量刷新</th>
        <th>分区刷新</th>
        <th>自动触发</th>
    </tr>
    <tr>
        <td>内表</td>
        <td>Internal</td>
        <td>2.1 支持</td>
        <td>2.1 支持</td>
        <td>2.1.4 支持</td>
    </tr>
    <tr>
        <td>Hive</td>
        <td>Hive</td>
        <td>2.1 支持</td>
        <td>2.1 支持</td>
        <td>不支持</td>
    </tr>
    <tr>
        <td>Iceberg</td>
        <td>Iceberg</td>
        <td>2.1 支持</td>
        <td>不支持</td>
        <td>不支持</td>
    </tr>
    <tr>
        <td>Paimon</td>
        <td>Paimon</td>
        <td>2.1 支持</td>
        <td>不支持</td>
        <td>不支持</td>
    </tr>
    <tr>
        <td>Hudi</td>
        <td>Hudi</td>
        <td>2.1 支持</td>
        <td>不支持</td>
        <td>不支持</td>
    </tr>
    <tr>
        <td>JDBC</td>
        <td>JDBC</td>
        <td>2.1 支持</td>
        <td>不支持</td>
        <td>不支持</td>
    </tr>
    <tr>
        <td>ES</td>
        <td>ES</td>
        <td>2.1 支持</td>
        <td>不支持</td>
        <td>不支持</td>
    </tr>
</table>

## 物化视图和 OLAP 内表关系

异步物化视图定义 SQL 使用基表的表模型没有限制，可以是明细模型，主键模型（merge-on-write 和 merge-on-read），聚合模型等。

物化视图自身的底层实现依托于 Duplicate 模型的 OLAP 表，这一设计使其理论上能够支持 Duplicate 模型的所有核心功能。然而，
为了保障物化视图能够稳定且高效地执行数据刷新任务，我们对其功能进行了一系列必要的限制。以下是具体的限制内容：

- 物化视图的分区是基于其基表自动创建和维护的，因此用户不能对物化视图进行分区操作
- 由于物化视图背后有相关的作业（JOB）需要处理，所以不能使用删除表（DELETE TABLE）或重命名表（RENAME TABLE）的命令来操作物化视图。
   相反，需要使用物化视图自身的命令来进行这些操作。
- 物化视图的列数据类型是根据创建时指定的查询语句自动推导得出的，因此这些数据类型不能被修改。否则，可能会导致物化视图的刷新任务失败。
- 物化视图具有一些 Duplicate 表没有的属性（property），这些属性需要通过物化视图的命令进行修改。
而其他公用的属性则需要使用 ALTER TABLE 命令进行修改。


## 更多参考
创建、查询与维护异步物化视图，可以参考 [创建、查询与维护异步物化视图](../async-materialized-view/functions-and-demands.md)

最佳实践，可以参考 [最佳实践](../async-materialized-view/use-guide.md)

常见问题，可以参考 [常见问题](../async-materialized-view/faq.md)

