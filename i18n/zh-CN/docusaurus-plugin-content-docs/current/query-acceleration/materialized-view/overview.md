---
{
    "title": "物化视图概览",
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

物化视图是既包含计算逻辑也包含数据的实体。它不同于视图，因为视图仅包含计算逻辑，本身不存储数据。

## 物化视图的使用场景

物化视图根据 SQL 定义计算并存储数据，且根据策略进行周期性或实时性更新。物化视图可直接查询，也可以将查询透明改写。它可用于以下几个场景：

### 查询加速

在决策支持系统中，如 BI 报表、Ad-Hoc 查询等，这类分析型查询通常包含聚合操作，可能还涉及多表连接。由于计算此类查询结果较为消耗资源、响应时间可能长达分钟级，且业务场景往往要求秒级响应，可以构建物化视图，对常见查询进行加速。

### 轻量化 ETL（数据建模）

在数据分层场景中，可以通过嵌套物化视图来构建 DWD 和 DWM 层，利用物化视图的调度刷新能力。

### 湖仓一体

针对多种外部数据源，可以将这些数据源所使用的表进行物化视图构建，以此来节省从外部表导入到内部表的成本，并且加速查询过程。

## 物化视图的分类

### 按照数据时效性分类：同步 vs 异步

- 同步物化视图需要与基表的数据保持强一致性。

- 异步物化视图与基表的数据保持最终一致性，可能会有一定的延迟。它通常用于对数据时效性要求不高的场景，一般使用 T+1 或小时级别的数据来构建物化视图。如果时效性要求高，则考虑使用同步物化视图。

目前，同步物化视图不支持直接查询，而异步物化视图支持直接查询。

### 按照支持透明改写的 SQL 模式分类：单表 vs 多表

物化视图的定义 SQL 可以包含单表查询，也可以包含多表查询。从使用表的数量角度出发，可以划分物化视图为单表物化视图或多表物化视图。

- 对于异步物化视图，可以使用单表或多表。

- 对于同步物化视图，只能使用单表。

### 按照物化视图刷新分类：全量 vs 分区增量 vs 实时

**对于异步物化视图**

- 全量刷新：计算物化视图定义 SQL 的所有数据。

- 分区增量刷新：当物化视图基表的分区数据发生变化时，识别出物化视图对应变化的分区，并仅刷新这些分区，从而实现分区增量刷新，而无需刷新整个物化视图。

**对于同步物化视图**

- 可以理解为实时更新，保持与基表的数据一致。