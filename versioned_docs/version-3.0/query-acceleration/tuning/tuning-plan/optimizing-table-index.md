---
{
    "title": "Optimizing Table Index Design",
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

Doris currently supports two types of indexes:

1. Built-in Indexes: These include prefix indexes, ZoneMap indexes, etc.

2. Secondary Indexes: These include inverted indexes, Bloom filter indexes, N-Gram Bloom filter indexes, and Bitmap indexes, etc.

In the process of business optimization, fully analyzing business characteristics and make effective use of indexes can greatly enhance the effectiveness of queries and analyses, thereby achieving the purpose of performance tuning.

For a detailed introduction to various indexes, please refer to the [Table Index](../../../table-design/index/index-overview) section. This chapter will demonstrate index usage techniques in several typical scenarios from the perspective of actual cases and summarize optimization suggestions for reference in business tuning.

## Case 1: Optimizing the Order of Key Columns to Leverage Prefix Indexes for Accelerated Queries

In optimizing table schema design, we have introduced how to select appropriate fields as key fields and utilize Doris's key column sorting feature to accelerate queries. This case will further expand on this scenario.

Due to Doris's built-in prefix index function, it automatically takes the first 36 bytes of the table's Key as a prefix index when creating the table. When query conditions match the prefix of the prefix index, it can significantly speed up the query. Below is an example of a table definition:

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

The corresponding business SQL pattern is as follows:

```sql
select * from t1 where t1.c2 = '1';
select * from t1 where t1.c2 in ('1', '2', '3');
```

In the above schema definition, `c1` comes before `c2`. However, the queries use the `c2` field for filtering. In this case, the acceleration function of the prefix index cannot be utilized. To optimize, we can adjust the definition order of `c1` and `c2`, placing the `c2` column in the first field position to leverage the acceleration function of the prefix index.

The adjusted schema is as follows:

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

:::tip

When defining the schema column order, reference the high-frequency and high-priority columns in business query filtering to fully leverage Doris's prefix index acceleration function.

:::

## Case 2: Using Inverted Indexes to Accelerate Queries

Doris supports inverted indexes as secondary indexes to accelerate business scenarios such as equal value, range, and full-text search of text types. The creation and management of inverted indexes are independent, allowing for convenient business performance optimization without affecting the original table schema and without the need to re-import table data.

For typical usage scenarios, syntax, and cases, please refer to the [Table Index - Inverted Index](../../../table-design/index/inverted-index) section for a detailed introduction, so this chapter will not repeat the explanation.

:::tip

For full-text searches of text types and equal value or range queries on string, numeric, and datetime type fields, inverted indexes can be utilized to accelerate queries. Especially in certain situations, such as when the original table structure and key definition are not convenient to optimize, or the cost of re-importing table data is high, inverted indexes provide a flexible acceleration solution to optimize business execution performance.

:::

## Case 3: Adjusting Field Order to Leverage ZoneMap Index for Data Filtering

The ZoneMap index is a built-in index that maintains statistical information such as Min/Max/Count on column-stored data. When Doris scans the storage layer for data, it can quickly filter out data blocks that do not meet the filtering conditions based on the ZoneMap statistical information (such as Min/Max) of the filtering field, thereby effectively reducing the amount of table scanning.

By default, ZoneMap selects the first column of the schema to establish an index. Therefore, by reasonably adjusting the field order, this feature can be fully utilized to accelerate data filtering at the storage layer.

Taking the `store_sales` table in the standard test set TPC-DS as an example, its original schema definition is as follows:

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

An example of a query fragment is as follows:

```sql
select *
from store_sales, date_dim dt
where dt.d_date_sk = store_sales.ss_sold_date_sk
      and ss_sold_date_sk between 2450816 and 2451000;
```

To leverage the range filtering condition on the fact table `store_sales` for rapid storage layer filtering, we can consider adjusting the field definition order to use the ZoneMap index. Since ZoneMap is established on the first field by default, we need to adjust the filtering field `ss_sold_date_sk` to the first position in the schema.

The adjusted schema is as follows:

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

:::tip

Adjust the equal value or range filtering field to the first column of the schema to leverage the ZoneMap index for data block-level filtering. This can accelerate the table scanning process, thereby achieving the purpose of performance tuning.

:::

## Summary

In schema tuning, apart from table-level schema optimization, index optimization also occupies an important position. Doris provides multiple index types, including built-in indexes such as prefix and ZoneMap, as well as secondary indexes such as inverted indexes, which provide strong support for performance acceleration. By reasonably utilizing these indexes, we can significantly improve the speed of business queries and analyses in multiple scenarios, which is of great significance for multi-scenario business queries and analyses.