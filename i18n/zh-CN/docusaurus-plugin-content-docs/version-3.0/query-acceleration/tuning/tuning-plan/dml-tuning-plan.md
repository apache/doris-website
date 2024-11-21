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

DML 计划调优包括导入部分（INSERT INTO SELECT）与查询部分（CREATE TABLE AS SELECT - CTAS）。本小节将分别介绍这两部分的工作原理与调优实践。

## 导入部分

### 工作原理

Apache Doris 提供了多种灵活的数据导入方案，以满足不同场景下的数据接入需求。Doris 支持从以下数据源导入数据：

1. 对象存储（S3）和 HDFS

2. 本地文件

3. Kafka

4. 关系型数据库（如 MySQL、PostgreSQL、Oracle、SQLServer 等）

5. 通过 JDBC 连接的数据源

6. JSON 格式数据

**Doris 提供了以下几种主要的数据导入方式：**

1. Broker Load：通过 Broker 进程导入外部存储系统的数据

2. Stream Load：流式导入本地文件或内存中的数据

3. Routine Load：持续导入 Kafka 中的数据

4. INSERT INTO：通过 SQL 插入语句导入数据

5. S3 Load：直接从支持 S3 协议的对象存储导入数据

6. MySQL Load：使用 MySQL 客户端导入本地数据

**不同的导入方式所支持的数据格式略有差异：**

1. Broker Load：支持 Parquet、ORC、CSV、GZip 格式

2. Stream Load：支持 CSV、JSON、Parquet、ORC 格式

3. Routine Load：支持 CSV、JSON 格式

4. MySQL Load：支持 CSV 格式

**数据的导入具备以下机制：**

1. 原子性保证：每个导入作业都作为一个完整的事务，确保数据的原子性写入。

2. 导入标识：每个导入作业都分配有唯一的 Label，用于确保 At-Most-Once 语义。

3. 同步/异步模式：同步模式会立即返回结果，而异步模式则需要另行查询作业状态。

4. Array 类型支持：可以通过 CAST 和数组函数来导入 Array 类型的数据。

5. 执行引擎：可以根据配置选择是否使用 Pipeline 引擎来执行导入任务。

**在实际应用中，需要注意以下事项：**

1. 合理选择导入方式：针对不同的数据源，选择最合适的导入方法。

2. 利用 Label 机制：实现 Exactly-Once 语义的保证。

3. 适当配置并行度：根据集群资源，调整并行导入的数量。

4. 监控导入状态：对于异步导入，及时查看作业的运行情况。

:::tip 提示
通过灵活运用 Doris 提供的多种导入功能，可以高效地将各种来源的数据导入到 Doris 中进行分析。如需了解更多细节，请参考数据[导入概览](../../../data-operate/import/load-manual)
:::

### 导入优化

Pipeline 引擎是 Doris 中一种新的查询执行引擎，旨在提高查询和数据处理的效率。在数据导入过程中，Pipeline 引擎同样可以被启用，以提升整体性能。默认情况下，数据导入时 Pipeline 引擎是关闭状态，但用户可以通过相关配置来启用它。

在数据导入中启用 Pipeline 引擎，需配置以下变量：

**1. FE 配置项：enable_pipeline_load**

- 位置：位于 FE（Frontend）的配置文件中

- 作用：启用后，Stream Load 等导入任务将尝试使用 Pipeline 引擎执行

**2. Session 变量：enable_nereids_dml_with_pipeline**

- 位置：在会话级别进行设置

- 作用：启用后，INSERT INTO 语句将尝试使用 Pipeline 引擎执行

**3. Session 变量：enable_pipeline_engine**

- 位置：在会话级别进行设置

- 作用：控制是否实际启用 Pipeline 引擎

## 查询部分

详细请参考[计划调优 - 其他章节](../../../query-acceleration/tuning/tuning-plan/optimizing-table-schema)