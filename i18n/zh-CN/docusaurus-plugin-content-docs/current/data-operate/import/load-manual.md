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

## 导入方案介绍

本节对导入方案做一个总体介绍，以便大家根据数据源、文件格式、数据量等选择最合适的导入方案。

Doris支持的导入方式包括Stream Load、Broker Load、Insert Into、Routine Load、 MySQL Load。除了直接使用Doris原生的导入方式进行导入，Doris还提供了一系列的生态工具帮助用户进行数据导入，包括Spark Doris Connector、Flink Doris Connector、Doris Kafka Connector、DataX Doriswriter、Doris Streamloader等。

针对高频小导入场景，Doris还提供了Group Commit功能。Group Commit 不是一种新的导入方式，而是对`INSERT INTO VALUES、Stream Load、Http Stream`的扩展，对小导入在服务端进行攒批。

每种导入方式和生态工具适用的场景不一样，支持的数据源、文件格式也有差异。

### 导入方式
| 导入方式                                      | 使用场景                                   | 支持的文件格式          | 单次导入数据量    | 导入模式 |
| :-------------------------------------------- | :----------------------------------------- | ----------------------- | ----------------- | -------- |
| [Stream Load](./import-way/stream-load-manual)           | 从本地数据导入                             | csv、json、parquet、orc | 小于10GB          | 同步     |
| [Broker Load](./import-way/broker-load-manual.md)        | 从对象存储、HDFS等导入                     | csv、json、parquet、orc | 数十GB到数百 GB   | 异步     |
| [INSERT INTO VALUES](./import-way/insert-into-manual.md) | <p>单条或小批量据量导入</p><p>通过JDBC等接口导入</p> | SQL                     | 简单测试用        | 同步     |
| [INSERT INTO SELECT](./import-way/insert-into-manual.md) | <p>Doris内部表之间数据导入</p><p>外部表导入</p>      | SQL                     | 根据内存大小而定  | 同步     |
| [Routine Load](./import-way/routine-load-manual.md)      | 从kakfa实时导入                            | csv、json               | 微批导入 MB 到 GB | 异步     |
| [MySQL Load](./import-way/mysql-load-manual.md)          | 从本地数据导入                             | csv                     | 小于10GB          | 同步     |
| [Group Commit](./import-way/group-commit-manual.md)          | 高频小批量导入                             | 根据使用的导入方式而定                     |  微批导入KB         | -     |

### 生态工具

| 生态工具              | 使用场景                                                     |
| --------------------- | ------------------------------------------------------------ |
| [Spark Doris Connector](../../ecosystem/spark-doris-connector.md) | 从spark批量导入数据                                          |
| [Flink Doris Connector](../../ecosystem/flink-doris-connector.md) | 从flink实时导入数据                                          |
| [Doris Kafka Connector](../../ecosystem/doris-kafka-connector.md) | 从kafaka实时导入数据                                         |
| [DataX Doriswriter](../../ecosystem/datax.md)     | 从MySQL、Oracle、SqlServer、Postgre、Hive、ADS等同步数据     |
| [Doris Streamloader](../../ecosystem/doris-streamloader.md)    | 实现了 Stream Load 的多并发导入，一次导入可以同时导入多个文件及目录 |
| [X2Doris](./migrate-data-from-other-olap.md)               | 从其他AP数据库迁移数据到Doris                                |

### 文件格式

| 文件格式 | 支持的导入方式                       | 支持的压缩格式                            |
| -------- | ------------------------------------ | ----------------------------------------- |
| csv      | Stream Load、Broker Load、MySQL Load | gz, lzo, bz2, lz4, LZ4FRAME,lzop, deflate |
| json     | Stream Load、Broker Load             | 不支持                                    |
| parquet  | Stream Load、Broker Load             | 不支持                                    |
| orc      | Stream Load、Broker Load             | 不支持                                    |

### 数据源

| 数据源                                         | 支持的导入方式                                        |
| ---------------------------------------------- | ------------------------------------------------------ |
| 本地数据                                       | <p>Stream Load</p> <p>StreamLoader</p> <p>MySQL load</p>         |
| 对象存储                                       | <p>Broker Load</p> <p>INSERT TO SELECT FROM S3 TVF</p>              |
| HDFS                                           | <p>Broker Load</p> <p>INSERT TO SELECT FROM HDFS TVF</p>         |
| Kafka                                          | <p>Routine Load</p> <p>Kakfa  Doris Connector</p>              |
| Flink                                          | Flink Doris Connector                                  |
| Spark                                          | Spark Doris Connector                                  |
| Mysql、PostgreSQL，Oracle，SQLServer等TP数据库 | <p>通过外表导入</p> <p>Flink Doris Connector</p>                |
| 其他AP数据库                                   | <p>X2Doris</p> <p>通过外表导入</p> <p>Spark/Flink Doris Connector</p> |

## 概念介绍

本节主要对导入相关的一些概念进行介绍，以帮助大家更好的使用数据导入功能。

### 原子性

Doris 中所有导入任务都是原子性的，即一个导入作业要么全部成功，要么全部失败，不会出现仅部分数据导入成功的情况，并且在同一个导入任务中对多张表的导入也能够保证原子性。对于简单的导入任务，用户无需做额外配置或操作。对于表所附属的物化视图，也同时保证和基表的原子性和一致性。

### 标签机制

Doris 的导入作业都可以设置一个 Label。这个 Label 通常是用户自定义的、具有一定业务逻辑属性的字符串，如果用户不指定，系统也会自动生成一个。Label 的主要作用是唯一标识一个导入任务，并且能够保证相同的 Label 仅会被成功导入一次。

Label 是用于保证对应的导入作业，仅能成功导入一次。一个被成功导入的 Label，再次使用时，会被拒绝并报错 `Label already used`。通过这个机制，可以在 Doris 侧做到 `At-Most-Once` 语义。如果结合上游系统的 `At-Least-Once` 语义，则可以实现导入数据的 `Exactly-Once` 语义。

### 导入模式

导入模式分为同步导入和异步导入。对于同步导入方式，返回结果即表示导入成功还是失败。而对于异步导入方式，返回成功仅代表作业提交成功，不代表数据导入成功，需要使用对应的命令查看导入作业的运行状态。

### 数据转化

在向表中导入数据时，有时候表中的内容与源数据文件中的内容不完全一致，需要对数据进行变换才行。Doris支持在导入过程中直接对源数据进行一些变换。具体有：映射、转换、前置过滤和后置过滤。

### 错误数据处理

在导入过程中，原始列跟目标列的数据类型可能不完全一致，导入时会对数据类型不一致的原始列值进行转换。转换过程中可能会发生字段类型不匹配、字段超长等转换失败的情况。严格模式用于控制导入过程中是否会对这些转换失败的错误数据行进行过滤。

### 最小写入副本数

默认情况下，数据导入要求至少有超过半数的副本写入成功，导入才算成功。然而，这种方式不够灵活，在某些场景会带来不便。Doris 允许用户设置最小写入副本数 (Min Load Replica Num)。对导入数据任务，当它成功写入的副本数大于或等于最小写入副本数时，导入即成功。
