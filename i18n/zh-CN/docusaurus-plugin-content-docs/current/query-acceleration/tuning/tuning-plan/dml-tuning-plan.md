---
{
    "title": "DML 计划调优",
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

数据操作语言（DML）计划调优包括导入部分（INSERT INTO SELECT）和查询部分（CREATE TABLE AS SELECT - CTAS）。接下来，将分别介绍这两部分的原理及调优实践。
## 数据加载
### 原理
Apache Doris 提供了多种灵活的数据导入解决方案，以满足不同场景下的数据访问需求。Doris 支持从以下数据源导入数据：

1. 对象存储（S3）和 HDFS

2. 本地文件

3. Kafka

4. 关系型数据库（如 MySQL、PostgreSQL、Oracle、SQL Server 等）

5. 通过 JDBC 连接的数据源

6. JSON 格式数据

**Doris 提供了以下主要的数据导入方法：**

1. Broker Load：通过Broker process 从外部存储系统导入数据

2. Stream Load：从本地文件或内存数据中流式传输数据

3. Routine Load：持续从 Kafka 导入数据

4. INSERT INTO：通过 SQL 插入语句导入数据

5. S3 加载：直接从支持 S3 协议的对象存储中导入数据

6. MySQL 加载：使用 MySQL 客户端导入本地数据

**不同的导入方法对数据格式的支持略有不同：**

1. Broker Load：支持 Parquet、ORC、CSV 和 GZip 格式

2. Stream Load：支持 CSV、JSON、Parquet 和 ORC 格式

3. Routine Load：支持 CSV 和 JSON 格式

4. MySQL 加载：支持 CSV 格式

**数据导入具备以下机制：**

1. 原子性保证：每个导入任务都作为一个完整的事务，确保数据写入的原子性。

2. 导入标签：为每个导入任务分配一个唯一的标签，以确保至多一次（At-Most-Once）语义。

3. 同步 / 异步模式：同步模式会立即返回结果，而异步模式则需要单独查询任务状态。

4. 数组类型支持：可以使用 CAST 和数组函数导入数组类型的数据。

5. 执行引擎：用户可根据配置选择是否使用 Pipeline 引擎来执行导入任务。

**在实际应用中，需要考虑以下几点：**

1. 合理选择导入方法：针对不同的数据源选择最合适的导入方法

2. 利用标签机制：实现精确一次（Exactly-Once）语义保证

3. 恰当配置并行度：根据集群资源调整并行导入的数量

4. 监控导入状态：对于异步导入，要及时查看任务的进展情况

通过灵活运用 Doris 提供的各种导入功能，可以将来自不同来源的数据高效地导入到 Doris 中进行分析。如需更多详细信息，请参阅[数据加载概述](../../../data-operate/import/import-way/load-manual)。


### 加载优化
Pipeline 引擎是 Doris 中一种新的查询执行引擎，旨在提高查询和数据处理的效率。在数据导入期间，也可以启用管道引擎来提升整体性能。默认情况下，在数据导入期间Pipeline 引擎是禁用的，但用户可以通过相关配置启用它。
要在数据导入期间启用Pipeline 引擎，需配置以下变量：

**1. 前端（FE）配置项：enable_pipeline_load**

- 位置：在前端（FE）的配置文件中。
- 功能：启用后，诸如流式加载（Stream Load）等导入任务将尝试使用管道引擎执行。

**2. 会话变量：enable_nereids_dml_with_pipeline**

- 位置：在会话级别设置。
- 功能：启用后，INSERT INTO 语句将尝试使用管道引擎执行。

**3. 会话变量：enable_pipeline_engine**

-位置：在会话级别设置。
-功能：控制管道引擎是否实际被启用。

## 查询
如需详细信息，请参阅[计划调优](../../../query-acceleration/tuning/tuning-plan/optimizing-table-schema)的其他部分内容。
