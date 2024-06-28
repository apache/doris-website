---
{
    "title": "数据导出概述",
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

数据导出功能，用于将查询结果集或者 Apache Doris 的表数据，使用指定的文件格式，写入指定的存储系统中的。

导出功能和数据备份功能有以下区别：

| | 数据导出 | 数据备份|
| ----- | ----- | ----- |
|数据最终存储位置|HDFS、对象存储、本地文件系统|HDFS、对象存储|
|数据格式|Parquet、ORC、CSV 等开放格式|Apache Doris 内部存储格式|
|执行速度 | 中等（需要读取数据并转换成目标数据格式）| 快速（无需解析和转换，直接上传 Apache Doris 数据文件）|
|灵活度 | 可以通过 SQL 语句灵活定义要导出的数据 | 仅支持表级别全量备份|
|使用场景 | 结果集下载、不同系统之间的数据交换 | 数据备份、Apache Doris 集群间的数据迁移|

## 选择导出方式

Apache Doris 提供以下三种不同的数据导出方式：

* SELECT INTO OUTFILE：支持任意 SQL 结果集的导出。
* EXPORT：支持表级别的部分或全部数据导出。
* MySQL DUMP：兼容 MySQL Dump 指令的数据导出。

三种导出方式的异同点如下：

| |SELECT INTO OUTFILE|EXPORT|MySQL DUMP|
| ----- | ----- | ----- | ----- |
|同步/异步 | 同步 | 异步（提交 EXPORT 任务后通过 SHOW EXPORT 命令查看任务进度）| 同步|
|支持任意 SQL|支持 | 不支持 | 不支持|
|导出指定分区 | 支持 | 支持 | 不支持|
|导出指定 Tablets|支持 | 不支持 | 不支持|
|并发导出 | 支持且并发高（但取决于 SQL 语句是否有 ORDER BY 等需要单机处理的算子）| 支持且并发高（支持 Tablet 粒度的并发导出）| 不支持，只能单线程导出|
|支持导出的数据格式|Parquet、ORC、CSV|Parquet、ORC、CSV|MySQL Dump 专有格式|
|是否支持导出外表 | 支持 | 部分支持 | 不支持|
|是否支持导出 View|支持 | 支持 | 支持|
|支持的导出位置|S3、HDFS、LOCAL|S3、HDFS、LOCAL|LOCAL|

### SELECT INTO OUTFILE

适用于以下场景：

* 导出数据需要经过复杂计算逻辑的，如过滤、聚合、关联等。
* 适合执行同步任务的场景。

### EXPORT

适用于以下场景：

* 大数据量的单表导出、仅需简单的过滤条件。
* 需要异步提交任务的场景。

### MySQL Dump

适用于以下场景：

* 兼容 MySQL 生态，需要同时导出表结构和数据。
* 仅用于开发测试或者数据量很小的情况。

## 导出文件列类型映射

Parquet、ORC 文件格式拥有自己的数据类型。Apache Doris 的导出功能能够自动将 Apache Doris 的数据类型导出为 Parquet、ORC 文件格式的对应数据类型。CSV 格式没有类型，所有数据都以文本形式输出。

以下是 Apache Doris 数据类型和 Parquet、ORC 文件格式的数据类型映射关系表：

1. Doris 导出到 Orc 文件格式的数据类型映射表：
    |Doris Type|Orc Type|
    | ----- | ----- |
    |boolean|boolean|
    |tinyint|tinyint|
    |smallint|smallint|
    |int|int|
    |bigint|bigint|
    |largeInt|string|
    |date|string|
    |datev2|string|
    |datetime|string|
    |datetimev2|timestamp|
    |float|float|
    |double|double|
    |char / varchar / string|string|
    |decimal|decimal|
    |struct|struct|
    |map|map|
    |array|array|
    |json|不支持|

    <br/>
2. Apache Doris 导出到 Parquet 文件格式时，会先将 Apache Doris 内存数据转换为 Arrow 内存数据格式，然后由 Arrow 写出到 Parquet 文件格式。Apache Doris 数据类型到 Arrow 数据类的映射关系为：

    |Doris Type|Arrow Type|
    | ----- | ----- |
    |boolean|boolean|
    |tinyint|int8|
    |smallint|int16|
    |int|int32|
    |bigint|int64|
    |largeInt|utf8|
    |date|utf8|
    |datev2|Date32Type|
    |datetime|utf8|
    |datetimev2|TimestampType|
    |float|float32|
    |double|float64|
    |char / varchar / string|utf8|
    |decimal|decimal128|
    |struct|struct|
    |map|map|
    |array|list|
    |json|utf8|
