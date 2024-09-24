---
{
    "title": "WARM UP COMPUTE GROUP",
    "language": "zh_CN"
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

## 描述

WARM UP COMPUTE GROUP 语句用于预热计算组中的数据，以提高查询性能。预热操作可以从另一个计算组中获取资源，也可以指定特定的表和分区进行预热。预热操作返回一个作业ID，可以用于追踪预热作业的状态。

## 语法

```sql

WARM UP COMPUTE GROUP <destination_compute_group_name> WITH COMPUTE GROUP <source_compute_group_name> FORCE;

WARM UP COMPUTE GROUP <destination_compute_group_name> WITH <warm_up_list>;

warm_up_list ::= warm_up_item [AND warm_up_item...];

warm_up_item ::= TABLE <table_name> [PARTITION <partition_name>];

```

## 参数

* destination_compute_group_name: 要预热的目标计算组的名称。

* source_compute_group_name: 从中获取资源的源集群的名称。

* warm_up_list: 要预热的特定项目的列表，可以包括表和分区。

* table_name: 用于预热的表的名称。

* partition_name: 用于预热的分区的名称。

## 返回值

* JobId: 预热作业的ID。

## 示例

1. 使用名为source_group_name的计算组预热名为destination_group_name的计算组。

```sql
   WARM UP COMPUTE GROUP destination_group_name WITH COMPUTE GROUP source_group_name;

```

2. 使用名为destination_group的计算组预热表sales_data和customer_info以及表orders的分区q1_2024。

```
    WARM UP COMPUTE GROUP destination_group WITH 
        TABLE sales_data 
        AND TABLE customer_info 
        AND TABLE orders PARTITION q1_2024;

```

## 关键字

    WARM UP, COMPUTE GROUP, CACHE
