---
{
    "title": "Loading Overview",
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

## Introduction to Import Solutions

This section provides an overview of import solutions in order to help users choose the most suitable import solution based on data source, file format, and data volume.

Doris supports various import methods, including Stream Load, Broker Load, Insert Into, Routine Load, and MySQL Load. In addition to using Doris's native import methods, Doris also provides a range of ecosystem tools to assist users in data import, including Spark Doris Connector, Flink Doris Connector, Doris Kafka Connector, DataX Doriswriter, and Doris Streamloader.

For high-frequency small import scenarios, Doris also provides the Group Commit feature. Group Commit is not a new import method, but an extension to `INSERT INTO VALUES, Stream Load, Http Stream`, which batches small imports on the server side.

Each import method and ecosystem tool has different use cases and supports different data sources and file formats.

### Import Methods
| Import Method                                      | Use Case                                   | Supported File Formats | Single Import Volume | Import Mode |
| :-------------------------------------------- | :----------------------------------------- | ----------------------- | ----------------- | -------- |
| [Stream Load](./import-way/stream-load-manual)           | Import from local data                             | csv, json, parquet, orc | Less than 10GB          | Synchronous     |
| [Broker Load](./import-way/broker-load-manual.md)        | Import from object storage, HDFS, etc.                     | csv, json, parquet, orc | Tens of GB to hundreds of GB   | Asynchronous     |
| [INSERT INTO VALUES](./import-way/insert-into-manual.md) | <p>Import single or small batch data</p><p>Import via JDBC, etc.</p> | SQL                     | Simple testing | Synchronous     |
| [INSERT INTO SELECT](./import-way/insert-into-manual.md) | <p>Import data between Doris internal tables</p><p>Import external tables</p>      | SQL                     | Depending on memory size  | Synchronous     |
| [Routine Load](./import-way/routine-load-manual.md)      | Real-time import from Kafka                            | csv, json               | Micro-batch import MB to GB | Asynchronous     |
| [MySQL Load](./import-way/mysql-load-manual.md)          | Import from local data                             | csv                     | Less than 10GB          | Synchronous     |
| [Group Commit](./import-way/group-commit-manual.md)          | High-frequency small batch import                             | Depending on the import method used                     |  Micro-batch import KB         | -     |


### Ecosystem Tools

| Ecosystem Tool              | Use Case                                                     |
| --------------------- | ------------------------------------------------------------ |
| [Spark Doris Connector](../../ecosystem/spark-doris-connector.md) | Batch import data from Spark                                          |
| [Flink Doris Connector](../../ecosystem/flink-doris-connector.md) | Real-time import data from Flink                                          |
| [Doris Kafka Connector](../../ecosystem/doris-kafka-connector.md) | Real-time import data from Kafka                                         |
| [DataX Doriswriter](../../ecosystem/datax.md)     | Synchronize data from MySQL, Oracle, SQL Server, PostgreSQL, Hive, ADS, etc.     |
| [Doris Streamloader](../../ecosystem/doris-streamloader.md)    | Implements concurrent import for Stream Load, allowing multiple files and directories to be imported at once |
| [X2Doris](./migrate-data-from-other-olap.md)               | Migrate data from other AP databases to Doris                                |

### File Formats

| File Format | Supported Import Methods                       | Supported Compression Formats                            |
| -------- | ------------------------------------ | ----------------------------------------- |
| csv      | Stream Load, Broker Load, MySQL Load | gz, lzo, bz2, lz4, LZ4FRAME,lzop, deflate |
| json     | Stream Load, Broker Load             | Not supported                                    |
| parquet  | Stream Load, Broker Load             | Not supported                                    |
| orc      | Stream Load, Broker Load             | Not supported                                    |

### Data Sources

| Data Source                                         | Supported Import Methods                                         |
| ---------------------------------------------- | ------------------------------------------------------ |
| Local data                                       | <p>Stream Load</p> <p>StreamLoader</p> <p>MySQL Load</p>              |
| Object storage                                       | <p>Broker Load</p> <p>INSERT TO SELECT FROM S3 TVF</p>                |
| HDFS                                           | <p>Broker Load</p> <p>INSERT TO SELECT FROM HDFS TVF</p>            |
| Kafka                                          | <p>Routine Load</p> <p>Kakfa Doris Connector</p>                 |
| Flink                                          | Flink Doris Connector                                  |
| Spark                                          | Spark Doris Connector                                  |
| Mysql, PostgreSQL, Oracle, SQL Server, and other TP databases | <p>Import via external tables</p> <p>Flink Doris Connector</p>                 |
| Other AP databases                                   | <p>X2Doris</p> <p>Import via external tables</p> <p>Spark/Flink Doris Connector</p> |

## Concept Introduction

This section mainly introduces some concepts related to import to help users better utilize the data import feature.

### Atomicity

All import tasks in Doris are atomic, meaning that a import job either succeeds completely or fails completely. Partially successful data import will not occur within the same import task, and atomicity and consistency between materialized views and base tables are also guaranteed. For simple import tasks, users do not need to perform additional configurations or operations. For materialized views associated with tables, atomicity and consistency with the base table are also guaranteed.

More detailed info refer to [Transaction](../../data-operate/transaction.md).

### Label Mechanism

Import jobs in Doris can be assigned a label. This label is usually a user-defined string with certain business logic properties. If not specified by the user, the system will generate one automatically. The main purpose of the label is to uniquely identify an import task and ensure that the same label is imported successfully only once.

The label is used to ensure that the corresponding import job can only be successfully imported once. If a label that has been successfully imported is used again, it will be rejected and an error message `Label already used` will be reported. With this mechanism, Doris can achieve `At-Most-Once` semantics on the Doris side. If combined with the `At-Least-Once` semantics of the upstream system, it is possible to achieve `Exactly-Once` semantics for importing data.

### Import Mode

Import mode can be either synchronous or asynchronous. For synchronous import methods, the result returned indicates whether the import is successful or not. For asynchronous import methods, a successful return only indicates that the job has been submitted successfully, not that the data import is successful. Users need to use the corresponding command to check the running status of the import job.

### Data Transformation

When importing data into a table, sometimes the content in the table may not be exactly the same as the content in the source data file, and data transformation is required. Doris supports performing certain transformations on the source data during the import process. Specifically, it includes mapping, conversion, pre-filtering, and post-filtering.

### Error Data Handling

During the import process, the data types of the original columns and the target columns may not be completely consistent. During the import, the values of original columns with inconsistent data types will be converted. During the conversion process, conversion failures may occur, such as field type mismatch or field length exceeded. Strict mode is used to control whether to filter out these conversion failure error data rows during the import process.

### Minimum Write Replica Number

By default, data import requires that at least a majority of replicas are successfully written for the import to be considered successful. However, this approach is not flexible and may cause inconvenience in certain scenarios. Doris allows users to set the minimum write replica number (Min Load Replica Num). For import data tasks, when the number of replicas successfully written is greater than or equal to the minimum write replica number, the import is considered successful.
