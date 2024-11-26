---
{
    "title": "优化索引设计和使用",
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


Doris 目前支持两类索引：

1. 内置索引：包括前缀索引和 ZoneMap 索引等；

2. 二级索引：包括倒排索引、Bloomfilter 索引、N-Gram Bloomfilter 索引和 Bitmap 索引等。

在业务优化过程中，充分分析业务特征并有效利用索引，会大大提升查询和分析的效果，从而达到性能调优的目的。

各类索引的详细介绍可以参考[表索引](../../../table-design/index/index-overview)章节进行了解。本章将从实际案例的角度出发，展示几种典型场景下的索引使用技巧，并总结优化建议，以供业务调优时参考。

## 案例 1：优化 Key 列顺序以利用前缀索引加速查询

在优化表 Schema 设计中，我们已介绍了如何选择合适的字段作为 Key 字段，并利用 Doris 的 Key 列排序特性来加速查询。本案例将进一步扩展该场景。

由于 Doris 内置了前缀索引功能，它会在建表时自动取表 Key 的前 36 字节作为前缀索引。当查询条件与前缀索引的前缀相匹配时，可以显著加快查询速度。以下是一个表定义的示例：

```sql
CREATE TABLE `t1` (
  `c1` VARCHAR(10) NULL,
  `c2` VARCHAR(10) NULL
) ENGINE=OLAP
DUPLICATE KEY(`c1`)
DISTRIBUTED BY HASH(`c2`) BUCKETS 10
PROPERTIES (
"replication_allocation" = "tag.location.default: 1"
);
```

相应的业务 SQL 模式如下：

```sql
select * from t1 where t1.c2 = '1';
select * from t1 where t1.c2 in ('1', '2', '3');
```

在上述 Schema 定义中，`c1`在前，`c2`在后。然而，查询却是使用`c2`字段进行过滤。在这种情况下，无法利用前缀索引的加速功能。为了进行优化，我们可以调整`c1`和`c2`列的定义顺序，将`c2`列置于第一个字段位置，从而利用前缀索引的加速功能。

调整后的 Schema 如下：

```sql
CREATE TABLE `t1` (
  `c2` VARCHAR(10) NULL,
  `c1` VARCHAR(10) NULL
) ENGINE=OLAP
DUPLICATE KEY(`c2`)
DISTRIBUTED BY HASH(`c1`) BUCKETS 10
PROPERTIES (
"replication_allocation" = "tag.location.default: 1"
);
```

:::tip 优化提示

在定义 schema 列顺序时，应参考业务查询过滤中的高频高优列，以便充分利用 Doris 的前缀索引加速功能。

:::

## 案例 2：使用倒排索引加速查询

Doris 支持倒排索引作为二级索引，以加速等值、范围及文本类型的全文检索等业务场景。倒排索引的创建和管理是独立的，它能够在不影响原始表 Schema 和无需重新导入表数据的情况下，便捷地进行业务性能优化。

关于典型的使用场景、语法及案例，可参考[表索引 - 倒排索引](../../../table-design/index/inverted-index)，查看详细介绍，本章节不再重复阐述。

:::tip 优化建议

对于文本类型的全文检索，以及字符串、数值、日期时间类型字段上的等值或范围查询，均可利用倒排索引来加速查询。特别是在某些情况下，如原始表结构和 Key 定义不便优化，或重新导入表数据的成本较高时，倒排索引提供了一种灵活的加速方案，以优化业务执行性能。

:::

## 案例 3: 调整字段顺序利用 ZoneMap 索引过滤数据

ZoneMap 索引是一种内置索引，它在列存数据上维护了如 Min/Max/Count 等统计信息。当 Doris 对存储层进行数据扫描时，会根据过滤字段的 ZoneMap 统计信息（如 Min/Max）快速过滤掉不满足过滤条件的数据块，从而有效减少扫表量。

默认情况下，ZoneMap 会选择 Schema 的第一列建立索引。因此，通过合理调整字段顺序，可以充分利用这一特性来加速存储层的数据过滤。

以标准测试集 TPC-DS 中的 `store_sales` 表为例，其原始 Schema 定义如下：

```sql
CREATE TABLE IF NOT EXISTS store_sales (
    ss_item_sk bigint not null,
    ss_ticket_number bigint not null,
    ss_sold_date_sk bigint,
    ......
    ss_net_paid_inc_tax decimalv3(7,2),
    ss_net_profit decimalv3(7,2)
)
DUPLICATE KEY(ss_item_sk, ss_ticket_number)
DISTRIBUTED BY HASH(ss_item_sk, ss_ticket_number) BUCKETS 32
PROPERTIES (
  "replication_num" = "1"
);
```

查询片段示例如下：

```sql
select *
from store_sales, date_dim dt
where dt.d_date_sk = store_sales.ss_sold_date_sk
      and ss_sold_date_sk between 2450816 and 2451000;
```

为了利用事实表 `store_sales` 上的范围过滤条件进行快速的存储层过滤，我们可以考虑调整字段定义顺序，以便使用 ZoneMap 索引。由于 ZoneMap 默认建立在第一个字段上，因此我们需要将过滤字段 `ss_sold_date_sk` 调整至 Schema 的第一个位置。

调整后的 Schema 如下：

```sql
CREATE TABLE IF NOT EXISTS store_sales (
    ss_sold_date_sk bigint,
    ss_item_sk bigint not null,
    ss_ticket_number bigint not null,
    ......
    ss_net_paid_inc_tax decimalv3(7,2),
    ss_net_profit decimalv3(7,2)
)
DUPLICATE KEY(ss_sold_date_sk, ss_item_sk, ss_ticket_number)
DISTRIBUTED BY HASH(ss_sold_date_sk, ss_item_sk, ss_ticket_number) BUCKETS 32
PROPERTIES (
  "replication_num" = "1"
);
```

:::tip 优化建议

将等值或范围过滤字段调整为 Schema 的第一个列，以便利用 ZoneMap 索引进行数据块级别的过滤。这样可以加速扫表过程，从而达到性能调优的目的。

:::

## 总结

在 Schema 调优中，除了表级 Schema 优化外，索引优化同样占据重要地位。Doris 提供了多种索引类型，包括前缀、ZoneMap 等内置索引，以及倒排等二级索引。这些索引为性能加速提供了强大的支持，通过合理利用这些索引，我们可以显著提升多场景下的业务查询和分析速度，这对于多场景业务查询和分析具有重要意义。
