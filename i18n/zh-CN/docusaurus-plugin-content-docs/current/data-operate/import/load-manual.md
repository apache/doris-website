---
{
    "title": "导入概览",
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

Apache Doris 提供了多种导入和集成数据的方法，您可以使用合适的导入方式从各种源将数据导入到数据库中。Apache Doris 提供的数据导入方式可以分为四类：

- **实时写入**：应用程序通过 HTTP 或者 JDBC 实时写入数据到 Doris 表中，适用于需要实时分析和查询的场景。

    - 极少量数据（5 分钟一次）时可以使用 [JDBC INSERT](./import-way/insert-into-manual.md) 写入数据。

    - 并发较高或者频次较高（大于 20 并发或者 1 分钟写入多次）时建议打开 [Group Commit](./import-way/group-commit-manual.md)，使用 JDBC INSERT 或者 Stream Load 写入数据。

    - 吞吐较高时推荐使用 [Stream Load](./import-way/stream-load-manual) 通过 HTTP 写入数据。

- **流式同步**：通过实时数据流（如 Flink、Kafka、事务数据库）将数据实时导入到 Doris 表中，适用于需要实时分析和查询的场景。

    - 可以使用 [Flink Doris Connector](../../ecosystem/flink-doris-connector.md) 将 Flink 的实时数据流写入到 Doris 表中。

    - 可以使用 [Routine Load](./import-way/routine-load-manual.md) 或者 [Doris Kafka Connector](../../ecosystem/doris-kafka-connector.md) 将 Kafka 的实时数据流写入到 Doris 表中。Routine Load 方式下，Doris 会调度任务将 Kafka 中的数据拉取并写入 Doris 中，目前支持 csv 和 json 格式的数据。Kafka Connector 方式下，由 Kafka 将数据写入到 Doris 中，支持 avro、json、csv、protobuf 格式的数据。

    - 可以使用 [Flink CDC](../../ecosystem/flink-doris-connector.md) 或 [ Datax](../../ecosystem/datax.md) 将事务数据库的 CDC 数据流写入到 Doris 中。

- **批量导入**：将数据从外部存储系统（如 S3、HDFS、本地文件、NAS）批量加载到 Doris 表中，适用于非实时数据导入的需求。
    - 可以使用 [Broker Load](./import-way/broker-load-manual.md) 将 S3 和 HDFS 中的文件写入到 Doris 中。

    - 可以使用 [INSERT INTO SELECT](./import-way/insert-into-manual.md) 将 S3、HDFS 和 NAS 中的文件同步写入到 Doris 中，配合 [JOB](../scheduler/job-scheduler.md) 可以异步写入。

    - 可以使用 [Stream Load](./import-way/stream-load-manual) 或者 [Doris Streamloader](../../ecosystem/doris-streamloader.md) 将本地文件写入 Doris 中。

- **外部数据源集成**：通过与外部数据源（如 Hive、JDBC、Iceberg 等）的集成，实现对外部数据的查询和部分数据导入到 Doris 表中。
    - 可以创建 [Catalog](../../lakehouse/lakehouse-overview.md) 读取外部数据源中的数据，使用 [INSERT INTO SELECT](./import-way/insert-into-manual.md) 将外部数据源中的数据同步写入到 Doris 中，配合 [JOB](../scheduler/job-scheduler.md) 可以异步写入。

    - 可以使用 [X2Doris](./migrate-data-from-other-olap.md) 将其他 AP 系统的数据迁移到 Doris 中。

Doris 的每个导入默认都是一个隐式事务，事务相关的更多信息请参考[事务](../transaction.md)。

## 导入方式快速浏览

Doris 的导入主要涉及数据源、数据格式、导入方式、错误数据处理、数据转换、事务多个方面。您可以在如下表格中快速浏览各导入方式适合的场景和支持的文件格式。

| 导入方式                                      | 使用场景                                   | 支持的文件格式          | 单次导入数据量    | 导入模式 |
| :-------------------------------------------- | :----------------------------------------- | ----------------------- | ----------------- | -------- |
| [Stream Load](./import-way/stream-load-manual)           | 导入本地文件或者应用程序写入         | csv、json、parquet、orc | 小于10GB          | 同步     |
| [Broker Load](./import-way/broker-load-manual.md)        | 从对象存储、HDFS等导入                     | csv、json、parquet、orc | 数十GB到数百 GB   | 异步     |
| [INSERT INTO VALUES](./import-way/insert-into-manual.md) | 通过JDBC等接口导入 | SQL                     | 简单测试用        | 同步     |
| [INSERT INTO SELECT](./import-way/insert-into-manual.md) | 可以导入外部表或者对象存储、HDFS中的文件      | SQL                     | 根据内存大小而定  | 同步     |
| [Routine Load](./import-way/routine-load-manual.md)      | 从kakfa实时导入                            | csv、json               | 微批导入 MB 到 GB | 异步     |
| [MySQL Load](./import-way/mysql-load-manual.md)          | 从本地数据导入                             | csv                     | 小于10GB          | 同步     |
| [Group Commit](./import-way/group-commit-manual.md)          | 高频小批量导入                             | 根据使用的导入方式而定                     |  微批导入KB         | -     |

