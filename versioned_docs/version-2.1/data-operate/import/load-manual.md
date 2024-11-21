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

Apache Doris offers various methods for importing and integrating data, allowing you to import data from diverse sources into the database. These methods can be categorized into four types:

- **Real-Time Writing**: Data is written into Doris tables in real-time via HTTP or JDBC, suitable for scenarios requiring immediate analysis and querying.

    - For small amounts of data (once every 5 minutes), you can use [JDBC INSERT](./import-way/insert-into-manual.md).

    - For higher concurrency or frequency (more than 20 concurrent writes or multiple writes per minute), you can enable enable [Group Commit](./import-way/group-commit-manual.md) and use JDBC INSERT or Stream Load.

    - For high throughput, you can use [Stream Load](./import-way/stream-load-manual) via HTTP.

- **Streaming Synchronization**: Real-time data streams (e.g., Flink, Kafka, transactional databases) are imported into Doris tables, ideal for real-time analysis and querying.

    - You can use [Flink Doris Connector](../../ecosystem/flink-doris-connector.md) to write Flink’s real-time data streams into Doris.

    - You can use [Routine Load](./import-way/routine-load-manual.md) or [Doris Kafka Connector](../../ecosystem/doris-kafka-connector.md) for Kafka’s real-time data streams. Routine Load pulls data from Kafka to Doris and supports CSV and JSON formats, while Kafka Connector writes data to Doris, supporting Avro, JSON, CSV, and Protobuf formats.

    - You can use [Flink CDC](../../ecosystem/flink-doris-connector.md) or [Datax](../../ecosystem/datax.md) to write transactional database CDC data streams into Doris.

- **Batch Import**: Data is batch-loaded from external storage systems (e.g., S3, HDFS, local files, NAS) into Doris tables, suitable for non-real-time data import needs.

    - You can use [Broker Load](./import-way/broker-load-manual.md) to write files from S3 and HDFS into Doris.

    - You can use [INSERT INTO SELECT](./import-way/insert-into-manual.md) to synchronously load files from S3, HDFS, and NAS into Doris, and you can perform the operation asynchronously using a [JOB](../scheduler/job-scheduler.md).

    - You can use [Stream Load](./import-way/stream-load-manual) or [Doris Streamloader](../../ecosystem/doris-streamloader.md) to write local files into Doris.

- **External Data Source Integration**: Query and partially import data from external sources (e.g., Hive, JDBC, Iceberg) into Doris tables.

    - You can create a [Catalog](../../lakehouse/lakehouse-overview.md) to read data from external sources and use [INSERT INTO SELECT](./import-way/insert-into-manual.md) to synchronize this data into Doris, with asynchronous writing via [JOB](../scheduler/job-scheduler.md).
    
    - You can use [X2Doris](./migrate-data-from-other-olap.md) to migrate data from other AP systems into Doris.

Each import method in Doris is an implicit transaction by default. For more information on transactions, refer to [Transactions](../transaction.md).

### Quick Overview of Import Methods

Doris's import process mainly involves various aspects such as data sources, data formats, import methods, error handling, data transformation, and transactions. You can quickly browse the scenarios suitable for each import method and the supported file formats in the table below.

| Import Method                                      | Use Case                                   | Supported File Formats | Single Import Volume | Import Mode |
| :-------------------------------------------- | :----------------------------------------- | ----------------------- | ----------------- | -------- |
| [Stream Load](./import-way/stream-load-manual)           | Importing local files or push data in applications via http.                             | csv, json, parquet, orc | Less than 10GB          | Synchronous     |
| [Broker Load](./import-way/broker-load-manual.md)        | Importing from object storage, HDFS, etc.                     | csv, json, parquet, orc | Tens of GB to hundreds of GB   | Asynchronous     |
| [INSERT INTO VALUES](./import-way/insert-into-manual.md) | Writing data via JDBC. | SQL                     | Simple testing | Synchronous     |
| [INSERT INTO SELECT](./import-way/insert-into-manual.md) | Importing from an external source like a table in a catalog or files in s3.      | SQL                     | Depending on memory size  | Synchronous, Asynchronous via Job     |
| [Routine Load](./import-way/routine-load-manual.md)      | Real-time import from Kafka                            | csv, json               | Micro-batch import MB to GB | Asynchronous     |
| [MySQL Load](./import-way/mysql-load-manual.md)          | Importing from local files.                             | csv                     | Less than 1GB          | Synchronous     |
| [Group Commit](./import-way/group-commit-manual.md)          | Writing with high frequency.                            | Depending on the import method used                     |  Micro-batch import KB         | -     |
