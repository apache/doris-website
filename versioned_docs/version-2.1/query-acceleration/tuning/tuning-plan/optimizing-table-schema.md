---
{
    "title": "Optimizing Table Schema Design",
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

In Schema design and tuning, table Schema design is a crucial part, encompassing table engine selection, partition and bucket column selection, partition and bucket size settings, key column and field type optimization, etc. Systems lacking proper Schema design may encounter issues such as data skew, failing to fully leverage system parallelism and sorting features, thereby hindering the Doris system from realizing its true performance advantages within business systems.

Detailed design principles can be found in the [Data Table Design](../../../table-design/overview) section for further information. This chapter, from the perspective of practical cases, will showcase performance bottlenecks caused by Schema design issues in several typical scenarios and provide optimization suggestions for business tuning reference.

## Case 1: Table Engine Selection

Doris supports three table models: Duplicate, Unique, and Aggregate. Among them, Unique can be further divided into Merge-On-Read (MOR) and Merge-On-Write (MOW).

The query performance of these table models, from best to worst, is: Duplicate > MOW > MOR == Aggregate. Therefore, under normal circumstances, if there are no special requirements, the Duplicate table is recommended for better query performance.

:::tip

When the business has no data update requirements but high demands for query performance, the [Duplicate table](../../../table-design/data-model/duplicate) is recommended.

:::

## Case 2: Bucket Column Selection

Doris supports bucketing data, which means distributing data based on bucket keys in the Schema to form data buckets.

Selecting appropriate bucket columns is vital for the reasonable distribution of raw data, effectively preventing performance issues caused by data skew. Meanwhile, it maximizes the utilization of Doris's Colocate Join and Bucket Shuffle Join features, significantly enhancing the performance of Join operations.

Taking the table creation statement of table t1 as an example, the current bucket column is set as c2. However, during the actual data import process, if all values of column c2 are defaulted to null, even if 64 buckets are set, only one bucket will contain all the data. This extreme case leads to severe data skew, resulting in performance bottlenecks.

```sql
CREATE TABLE `t1` (
  `c1` INT NULL,
  `c2` INT NULL
) ENGINE=OLAP
DUPLICATE KEY(`c1`)
DISTRIBUTED BY HASH(`c2`) BUCKETS 64
PROPERTIES (
"replication_allocation" = "tag.location.default: 1"
）;
insert into t1 select number, null from numbers ('number'='10000000');
```

In response to the above situation, we can change the bucket column from c2 to c1 to achieve adequate data hashing and maximize the system's parallel processing capabilities, thereby achieving tuning purposes.

Therefore, during the Schema design phase, business personnel need to design reasonable bucket columns beforehand based on business characteristics. For instance, if it is known beforehand that the business meaning of column c2 may contain a large number of skewed values, such as null or certain specific values, these fields should be avoided as bucket columns. Conversely, fields with adequate hashing characteristics in business meaning, such as user ID, should be selected as bucket columns. During the performance issue troubleshooting phase, the following SQL statement can be used to confirm whether the bucket field has data skew and make subsequent optimization adjustments accordingly.

```sql
select c2，count(*) cnt from t1 group by c2 order by cnt desc limit 10;
```

It is clear that good prior design can significantly reduce the cost of locating and correcting issues when they occur. Therefore, it is strongly recommended that business personnel conduct rigorous design and checks during the Schema design phase to avoid introducing unnecessary costs.

:::tip
Check whether the bucket column has data skew issues. If so, replace it with a field that has adequate hashing characteristics in business meaning as the bucket column.
:::

## Case 3: Key Column Optimization

Among the three table models, if the table creation Schema explicitly specifies a Duplicate Key, Unique Key, or Aggregate Key, Doris will ensure that data is sorted based on the Key column at the storage level. This feature provides new ideas for data query performance optimization. Specifically, during the Schema design phase, if columns frequently used for equality or range queries in business queries can be defined as Key columns, it will significantly increase the execution speed of such queries, thereby enhancing overall performance.

Here is a set of examples of business query requirements:

```sql
select * from t1 where t1.c1 = 1;
select * from t1 where t1.c1 > 1 and t1.c1 < 10;
select * from t1 where t1.c1 in (1, 2, 3);
```

For the above business requirements and the Schema design and later optimization of table t1, considering setting column c1 as the Key column to accelerate the query process is advisable. Here is an example:

```sql
CREATE TABLE `t1` (
  `c1` INT NULL,
  `c2` INT NULL
) ENGINE=OLAP
DUPLICATE KEY(`c1`)
DISTRIBUTED BY HASH(`c2`) BUCKETS 10
PROPERTIES (
"replication_allocation" = "tag.location.default: 1"
）;
```

:::tip
Set columns frequently used in business queries as key columns to accelerate the query process.
:::

## Case 4: Field Type Optimization

In database systems, the complexity of processing different types of data can vary significantly. For example, processing variable-length types is much more complex than fixed-length types; similarly, processing high-precision types is more complex than low-precision types.

This characteristic provides important insights into the design and later optimization of business system Schemas:

1. While meeting the expression and computation needs of business systems, priority should be given to fixed-length types, avoiding the use of variable-length types;

2. At the same time, low-precision types should be adopted instead of high-precision types. Specific practices include using BIGINT to replace VARCHAR or STRING type fields and using FLOAT / INT / BIGINT to replace DECIMAL type fields. Reasonable design and optimization of such field types will greatly enhance business computation efficiency, thereby improving system performance.

:::tip
When defining Schema types, follow the principle of prioritizing fixed-length and low-precision types.
:::

## Summary

In summary, a well-designed Schema can maximize the utilization of Doris's features, thereby significantly enhancing business performance. Conversely, a non-optimized Schema design may have a global negative impact on the business, such as causing data skew. Therefore, the initial Schema design optimization work is particularly important.

For performance tuning, you can also refer to using [Colocate Group to optimize Join](../../../query-data/join#colocate-join). This document will provide detailed instructions on how to fully leverage Doris's features for performance optimization, offering strong support for improving your business performance.