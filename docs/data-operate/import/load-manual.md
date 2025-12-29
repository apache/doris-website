---
{
    "title": "Loading Overview",
    "language": "en",
    "description": "Apache Doris offers various methods for importing and integrating data, allowing you to import data from various sources into the database."
}
---

Apache Doris offers various methods for importing and integrating data, allowing you to import data from various sources into the database. These methods can be categorized into four types:

- **Real-Time Writing**: Data is written into Doris tables in real-time via HTTP or JDBC, suitable for scenarios requiring immediate analysis and querying.

    - For small amounts of data (once every 5 minutes), you can use [JDBC INSERT](./import-way/insert-into-manual.md).

    - For higher concurrency or frequency (more than 20 concurrent writes or multiple writes per minute), you can enable [Group Commit](./group-commit-manual.md) and use JDBC INSERT or Stream Load.

    - For high throughput, you can use [Stream Load](./import-way/stream-load-manual) via HTTP.

- **Streaming Synchronization**: Real-time data streams (e.g., Flink, Kafka, transactional databases) are imported into Doris tables, ideal for real-time analysis and querying.

    - You can use [Flink Doris Connector](../../ecosystem/flink-doris-connector.md) to write Flink’s real-time data streams into Doris.

    - You can use [Routine Load](./import-way/routine-load-manual.md) or [Doris Kafka Connector](../../ecosystem/doris-kafka-connector.md) for Kafka’s real-time data streams. Routine Load pulls data from Kafka to Doris and supports CSV and JSON formats, while Kafka Connector writes data to Doris, supporting Avro, JSON, CSV, and Protobuf formats.

    - You can use [Flink CDC](../../ecosystem/flink-doris-connector.md) or [Datax](../../ecosystem/datax.md) to write transactional database CDC data streams into Doris.

- **Batch Import**: Data is batch-loaded from external storage systems (e.g., Object Storage, HDFS, local files, NAS) into Doris tables, suitable for non-real-time data import needs.

    - You can use [Broker Load](./import-way/broker-load-manual.md) to write files from Object Storage and HDFS into Doris.

    - You can use [INSERT INTO SELECT](./import-way/insert-into-manual.md) to synchronously load files from Object Storage, HDFS, and NAS into Doris, and you can perform the operation asynchronously using a [JOB](../../admin-manual/workload-management/job-scheduler).

    - You can use [Stream Load](./import-way/stream-load-manual) or [Doris Streamloader](../../ecosystem/doris-streamloader.md) to write local files into Doris.

- **External Data Source Integration**: Query and partially import data from external sources (e.g., Hive, JDBC, Iceberg) into Doris tables.

    - You can create a [Catalog](../../lakehouse/lakehouse-overview.md) to read data from external sources and use [INSERT INTO SELECT](./import-way/insert-into-manual.md) to synchronize this data into Doris, with asynchronous execution via [JOB](../../admin-manual/workload-management/job-scheduler).
    

Each import method in Doris is an implicit transaction by default. For more information on transactions, refer to [Transactions](../transaction.md).

### Partial Column Updates During Import

Doris supports partial column updates during data import, allowing you to update only specific columns in a table without providing values for all columns. This is particularly useful for updating wide tables or performing incremental updates. For detailed information on how to perform partial column updates for Unique Key Model and Aggregate Key Model tables, please refer to [Partial Column Update](../update/partial-column-update.md).

### Quick Overview of Import Methods

Doris import process mainly involves various aspects such as data sources, data formats, import methods, error handling, data transformation, and transactions. You can quickly browse the scenarios suitable for each import method and the supported file formats in the table below.

| Import Method                                      | Use Case                                   | Supported File Formats | Import Mode |
| :-------------------------------------------- | :----------------------------------------- | ----------------------- | -------- |
| [Stream Load](./import-way/stream-load-manual)           | Importing local files or push data in applications via HTTP.                             | csv, json, parquet, orc | Synchronous     |
| [Broker Load](./import-way/broker-load-manual.md)        | Importing from object storage, HDFS, etc.                     | csv, json, parquet, orc | Asynchronous     |
| [INSERT INTO VALUES](./import-way/insert-into-manual.md) | Writing data via JDBC. | SQL                     | Synchronous     |
| [INSERT INTO SELECT](./import-way/insert-into-manual.md) | Importing from an external source like a table in a catalog or files in Object Storage, HDFS.      | SQL                     | Synchronous, Asynchronous via Job     |
| [Routine Load](./import-way/routine-load-manual.md)      | Real-time import from Kafka                            | csv, json               | Asynchronous     |
| [MySQL Load](./import-way/mysql-load-manual.md)          | Importing from local files.                             | csv                     | Synchronous     |
| [Group Commit](./group-commit-manual.md)          | Writing with high frequency.                            | Depending on the import method used | -     |
