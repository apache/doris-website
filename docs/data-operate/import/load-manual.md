---
{
    "title": "Load Overview",
    "language": "en",
    "description": "How to choose an Apache Doris data load method, covering four scenarios: real-time writes, streaming sync, batch loading, and external data source integration.",
    "keywords": [
        "Doris data load",
        "Stream Load",
        "Broker Load",
        "Routine Load",
        "INSERT INTO",
        "Group Commit",
        "Flink Doris Connector",
        "Kafka Connector",
        "Flink CDC",
        "Streaming Job",
        "continuous load",
        "real-time write",
        "batch load",
        "Catalog external data source"
    ]
}
---

<!-- Knowledge type: Architecture selection decision -->
<!-- Applicable scenario: Data load method selection / Data integration solution design -->

Apache Doris provides multiple data load and integration methods to help you write data into the database from different sources. Starting from typical business scenarios, this document explains how to choose the most suitable solution among four categories: **real-time writes**, **streaming sync**, **batch loading**, and **external data source integration**.

## Quick Navigation

Based on data source and timeliness requirements, you can refer to the following table to quickly locate the recommended load method:

| Business scenario                                                | Data source                    | Recommended load method                                                                                                                                                  |
| :--------------------------------------------------------------- | :----------------------------- | :----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Application real-time write (very small volume, every 5 minutes) | JDBC client                    | [JDBC INSERT](./import-way/insert-into-manual.md)                                                                                                                        |
| Application high-concurrency or high-frequency small-batch write | JDBC / HTTP                    | [Group Commit](./load-best-practices/group-commit-manual.md) + JDBC INSERT or Stream Load                                                                                |
| Application high-throughput write                                | HTTP                           | [Stream Load](./import-way/stream-load-manual)                                                                                                                           |
| Real-time data stream ingestion                                  | Flink                          | [Flink Doris Connector](../../connection-integration/data-integration/flink-doris-connector.md)                                                                          |
| Real-time message queue ingestion                                | Kafka                          | [Routine Load](./import-way/routine-load-manual.md) or [Doris Kafka Connector](../../connection-integration/data-integration/doris-kafka-connector.md)                   |
| Transactional database real-time sync (no external components)   | MySQL / PostgreSQL             | [Streaming Job continuous load](./import-way/streaming-job/continuous-load-overview.md)                                                                                  |
| Transactional database CDC sync                                  | MySQL / PostgreSQL, etc.       | [Flink CDC](../../connection-integration/data-integration/flink-doris-connector.md) or [DataX](../../connection-integration/data-integration/datax.md)                   |
| Object storage continuous load (automatic incremental file load) | S3                             | [Streaming Job continuous load](./import-way/streaming-job/continuous-load-overview.md)                                                                                  |
| Object storage / HDFS file batch load                            | S3 / OSS / HDFS                | [Broker Load](./import-way/broker-load-manual.md) or [INSERT INTO SELECT](./import-way/insert-into-manual.md)                                                            |
| Local file batch load                                            | Local disk                     | [Stream Load](./import-way/stream-load-manual) or [Doris Streamloader](../../connection-integration/data-integration/doris-streamloader.md)                              |
| External data source (data lake / external table) query and load | Hive / Iceberg / JDBC, etc.    | [Catalog](../../lakehouse/lakehouse-overview.md) + [INSERT INTO SELECT](./import-way/insert-into-manual.md)                                                              |

> Each load in Doris is by default an implicit transaction. For more transaction-related information, see [Transaction](../transaction.md).

## Choosing a Load Method by Scenario

### Real-Time Write: Direct Application Write

<!-- Knowledge type: Operation steps -->

This applies to scenarios where applications **write data in real time** to Doris tables through HTTP or JDBC, commonly used for businesses that require real-time analysis and queries.

- **Very small volume of data (about once every 5 minutes)**: Use [JDBC INSERT](./import-way/insert-into-manual.md) to write data.
- **High concurrency or high frequency (more than 20 concurrent, or multiple writes within 1 minute)**: Enable [Group Commit](./load-best-practices/group-commit-manual.md) and use it together with JDBC INSERT or Stream Load.
- **High-throughput write**: Use [Stream Load](./import-way/stream-load-manual) to write data over the HTTP protocol.

### Streaming Sync: Real-Time Data Stream Ingestion

<!-- Knowledge type: Architecture selection decision -->

This applies to scenarios where data is continuously synchronized to Doris tables through real-time data streams (such as Flink, Kafka, or transactional database CDC).

1. **Flink real-time data stream**

    Use the [Flink Doris Connector](../../connection-integration/data-integration/flink-doris-connector.md) to write Flink real-time data streams into Doris tables.

2. **Kafka real-time data stream**

    Choose between [Routine Load](./import-way/routine-load-manual.md) and the [Doris Kafka Connector](../../connection-integration/data-integration/doris-kafka-connector.md). The differences are as follows:

    | Method             | Data flow direction                       | Supported formats              |
    | :----------------- | :---------------------------------------- | :----------------------------- |
    | Routine Load       | Doris actively pulls data from Kafka      | csv, json                      |
    | Kafka Connector    | Kafka actively pushes data into Doris     | avro, json, csv, protobuf      |

3. **Transactional database CDC sync**

    Use [Flink CDC](../../connection-integration/data-integration/flink-doris-connector.md) or [DataX](../../connection-integration/data-integration/datax.md) to write CDC data streams from transactional databases into Doris.

4. **Streaming Job continuous load (no external components)**

    Through the built-in [Streaming Job](./import-way/streaming-job/continuous-load-overview.md) in Doris, you can continuously read data from sources such as MySQL, PostgreSQL, and S3 and write it into Doris, **without depending on external components such as Flink or Kafka**. Two sync methods are supported:

    | Sync method              | Underlying mechanism                       | Auto table creation | Semantic guarantee | Typical scenario                                                       |
    | :----------------------- | :----------------------------------------- | :------------------ | :----------------- | :--------------------------------------------------------------------- |
    | SQL Mapping Sync         | Job + TVF (INSERT INTO SELECT)             | Pre-creation needed | exactly-once       | Cases requiring column pruning, field renaming, type conversion, or conditional filtering |
    | Auto Table Creation Sync | Job + native whole-database DDL            | Auto-created on first run | at-least-once | Mirror replication of an entire database or a group of tables, with downstream table schemas automatically following the upstream |

### Batch Load: Loading Files from External Storage

<!-- Knowledge type: Operation steps -->

This applies to non-real-time scenarios where files in external storage systems (such as object storage, HDFS, local files, or NAS) are **loaded in batches** into Doris tables.

- **Object storage / HDFS files**: Use [Broker Load](./import-way/broker-load-manual.md) to write data into Doris.
- **Object storage / HDFS / NAS files (synchronous or asynchronous)**: Use [INSERT INTO SELECT](./import-way/insert-into-manual.md) for synchronous writes. For asynchronous execution, combine it with [JOB](../../admin-manual/workload-management/job-scheduler) scheduling.
- **Local files**: Use [Stream Load](./import-way/stream-load-manual) or [Doris Streamloader](../../connection-integration/data-integration/doris-streamloader) to write data into Doris.

### External Data Source Integration: Catalog Federated Query and Load

<!-- Knowledge type: Architecture selection decision -->

This applies to scenarios where you integrate with external data sources (such as Hive, JDBC, or Iceberg) to query external data and **load it on demand** into Doris tables.

- Create a [Catalog](../../lakehouse/lakehouse-overview.md) to read data from external data sources.
- Use [INSERT INTO SELECT](./import-way/insert-into-manual.md) to synchronously write data from the external data source into Doris. For asynchronous execution, combine it with [JOB](../../admin-manual/workload-management/job-scheduler) scheduling.

## Partial Column Update During Load

<!-- Knowledge type: Configuration parameters -->

Doris supports **partial column updates** during data loading, which allows you to update only specific columns in a table without providing values for all columns. This capability is especially useful in the following scenarios:

- Updating a small number of fields in a wide table
- Performing incremental updates (Upsert on partial columns)

For details on how to perform partial column updates on Unique Key tables and Aggregate tables, see [Column Update](../update/partial-column-update.md).

## Load Method Overview

Loading in Doris involves several aspects, including data sources, data formats, load methods, error data handling, data transformation, and transactions. The following table summarizes the suitable scenarios, supported file formats, and load modes for each method:

| Load method                                              | Use case                                              | Supported file formats   | Load mode    |
| :------------------------------------------------------- | :---------------------------------------------------- | :----------------------- | :----------- |
| [Stream Load](./import-way/stream-load-manual)           | Loading local files or application writes             | csv, json, parquet, orc  | Synchronous  |
| [Broker Load](./import-way/broker-load-manual.md)        | Loading from object storage, HDFS, etc.               | csv, json, parquet, orc  | Asynchronous |
| [INSERT INTO VALUES](./import-way/insert-into-manual.md) | Loading through interfaces such as JDBC               | SQL                      | Synchronous  |
| [INSERT INTO SELECT](./import-way/insert-into-manual.md) | Loading from external tables, object storage, or HDFS | SQL                      | Synchronous  |
| [Routine Load](./import-way/routine-load-manual.md)      | Real-time loading from Kafka                          | csv, json                | Asynchronous |
| [MySQL Load](./import-way/mysql-load-manual.md)          | Loading from local data                               | csv                      | Synchronous  |
| [Group Commit](./load-best-practices/group-commit-manual.md) | High-frequency small-batch loading                | Depends on the load method used | -      |
| [Streaming Job](./import-way/streaming-job/continuous-load-overview.md) | Continuous loading from sources such as MySQL, PostgreSQL, and S3 | Depends on the data source | Asynchronous |

## FAQ

<!-- Knowledge type: FAQ -->
<!-- Applicable scenario: Load method selection / Troubleshooting -->

**Q1: Which load method should be chosen for high-concurrency, small-batch writes?**

Enable [Group Commit](./load-best-practices/group-commit-manual.md) and use it together with JDBC INSERT or Stream Load. When concurrency exceeds 20, or when multiple writes occur within 1 minute, Group Commit can significantly reduce load pressure.

**Q2: What is the difference between Routine Load and the Doris Kafka Connector?**

- Routine Load: Doris schedules tasks that **actively pull** data from Kafka. Supports csv and json formats.
- Doris Kafka Connector: Kafka **actively pushes** data into Doris. Supports avro, json, csv, and protobuf formats.

**Q3: How do you load local files into Doris?**

You can use [Stream Load](./import-way/stream-load-manual) (suitable for small and medium files) or [Doris Streamloader](../../connection-integration/data-integration/doris-streamloader.md) (suitable for large-file batch scenarios).

**Q4: Can data from external data sources such as Hive or Iceberg be loaded into Doris?**

Yes. First connect to the external data source through a [Catalog](../../lakehouse/lakehouse-overview.md), then use [INSERT INTO SELECT](./import-way/insert-into-manual.md) to synchronously write the data into Doris. For asynchronous execution, combine it with [JOB](../../admin-manual/workload-management/job-scheduler) scheduling.

**Q5: Are there transactional guarantees for loading?**

Yes. Each load in Doris is by default an implicit transaction. For details, see [Transaction](../transaction.md).

**Q6: How do you choose between Streaming Job and Flink CDC?**

- **Streaming Job**: A built-in capability of Doris that **does not depend on external components such as Flink or Kafka**. It supports SQL Mapping Sync and Auto Table Creation Sync for MySQL and PostgreSQL, as well as continuous loading from S3. Auto Table Creation Sync automatically creates downstream tables, while SQL Mapping Sync provides exactly-once semantics and supports SQL processing.
- **Flink CDC**: Requires deploying a Flink cluster. It is suitable for scenarios that already have a Flink stream-processing system, require complex ETL processing, or need multi-target sync.

If you only need to continuously synchronize MySQL or PostgreSQL data into Doris and have no external stream-processing requirements, **prefer Streaming Job**. For details, see [Continuous Load Overview](./import-way/streaming-job/continuous-load-overview.md).
