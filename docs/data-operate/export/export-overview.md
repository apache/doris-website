---
{
    "title": "Data Export Overview",
    "language": "en",
    "description": "Apache Doris data export overview: how to export query result sets or table data to Parquet, ORC, CSV and other formats, into HDFS, S3, or the local file system."
}
---

<!-- Knowledge type: Architecture selection decision -->
<!-- Applicable scenarios: Data export solution selection / Cross-system data exchange -->

The data export feature writes **query result sets** or **Apache Doris table data** to a specified storage system in a specified file format. It is commonly used for result set downloads and cross-system data exchange.

## Data Export vs. Data Backup

Both data export and data backup can output data from Apache Doris to external storage, but they target different scenarios. The following table compares the core differences between the two:

| Comparison Dimension     | Data Export                                                            | Data Backup                                                       |
| ------------------------ | ---------------------------------------------------------------------- | ----------------------------------------------------------------- |
| Final storage location   | HDFS, object storage, local file system                                | HDFS, object storage                                              |
| Data format              | Open formats such as Parquet, ORC, CSV                                 | Apache Doris internal storage format                              |
| Execution speed          | Medium (requires reading data and converting to the target format)     | Fast (uploads Doris data files directly, no parsing or conversion required) |
| Flexibility              | Allows flexible export scope definition through SQL                    | Supports only table-level full backup                             |
| Typical use scenarios    | Result set download, data exchange between different systems           | Data backup, data migration between Apache Doris clusters         |

## Choosing an Export Method

<!-- Knowledge type: Architecture selection decision -->

Apache Doris provides the following three data export methods, each suited to different export needs:

- **[SELECT INTO OUTFILE](./outfile.md)**: supports exporting any SQL result set.
- **[EXPORT](./export-manual.md)**: supports exporting partial or full data at the table level.
- **[MySQL DUMP](./export-with-mysql-dump.md)**: data export compatible with MySQL Dump commands.

### Capability Comparison of the Three Methods

The following table compares the three export methods across execution mode, SQL capabilities, concurrency, and supported formats, helping you choose quickly:

| Comparison Dimension     | SELECT INTO OUTFILE                                                          | EXPORT                                                | MySQL DUMP             |
| ------------------------ | ---------------------------------------------------------------------------- | ----------------------------------------------------- | ---------------------- |
| Synchronous / Asynchronous | Synchronous                                                                | Asynchronous (check progress with `SHOW EXPORT` after submission) | Synchronous            |
| Supports arbitrary SQL   | Supported                                                                    | Not supported                                         | Not supported          |
| Export specified partitions | Supported                                                                 | Supported                                             | Not supported          |
| Export specified tablets | Supported                                                                    | Not supported                                         | Not supported          |
| Concurrent export        | Supported, high concurrency (limited by single-node operators such as `ORDER BY`) | Supported, high concurrency (Tablet-level concurrency) | Not supported, single-threaded export |
| Supported export formats | Parquet, ORC, CSV                                                            | Parquet, ORC, CSV                                     | MySQL Dump proprietary format |
| Supports external tables | Supported                                                                    | Partially supported                                   | Not supported          |
| Supports views           | Supported                                                                    | Supported                                             | Supported              |
| Supported export locations | S3, HDFS                                                                   | S3, HDFS                                              | LOCAL                  |

### Applicable Scenarios

#### SELECT INTO OUTFILE

Suitable for the following scenarios:

- The exported data needs to go through complex computation logic, such as filtering, aggregation, or joins.
- Scenarios suitable for executing synchronous tasks.

For detailed usage, see [SELECT INTO OUTFILE](./outfile.md).

#### EXPORT

Suitable for the following scenarios:

- Single-table export of large data volumes that requires only simple filter conditions.
- Scenarios that require asynchronous task submission.

For detailed usage, see [Export Asynchronous Export](./export-manual.md).

#### MySQL Dump

Suitable for the following scenarios:

- Compatibility with the MySQL ecosystem, with the need to export both table schemas and data.
- Used only for development, testing, or cases with very small data volumes.

For detailed usage, see [MySQL Dump](./export-with-mysql-dump.md).

## Column Type Mapping for Exported Files

<!-- Knowledge type: Configuration parameters / Type mapping reference -->

The Parquet and ORC file formats have their own data type definitions, and Apache Doris automatically converts internal data types to the corresponding Parquet/ORC types during export. The CSV format has no type definitions; all data is output as text.

The mappings between Apache Doris data types and the ORC and Parquet formats are listed below.

### ORC Type Mapping

| Doris Type              | ORC Type  |
| ----------------------- | --------- |
| boolean                 | boolean   |
| tinyint                 | tinyint   |
| smallint                | smallint  |
| int                     | int       |
| bigint                  | bigint    |
| largeInt                | string    |
| date                    | string    |
| datev2                  | string    |
| datetime                | string    |
| datetimev2              | timestamp |
| float                   | float     |
| double                  | double    |
| char / varchar / string | string    |
| decimal                 | decimal   |
| struct                  | struct    |
| map                     | map       |
| array                   | array     |
| json                    | string    |
| variant                 | string    |
| bitmap                  | binary    |
| quantile_state          | binary    |
| hll                     | binary    |

### Parquet Type Mapping

When Apache Doris exports to the Parquet file format, it first converts the in-memory Doris data to the Arrow in-memory format, and then Arrow writes it out to the Parquet file. The mappings are as follows:

| Doris Type              | Arrow Type  | Parquet Physical Type | Parquet Logical Type             |
| ----------------------- | ----------- | --------------------- | -------------------------------- |
| boolean                 | boolean     | BOOLEAN               |                                  |
| tinyint                 | int8        | INT32                 | INT_8                            |
| smallint                | int16       | INT32                 | INT_16                           |
| int                     | int32       | INT32                 | INT_32                           |
| bigint                  | int64       | INT64                 | INT_64                           |
| largeInt                | utf8        | BYTE_ARRAY            | UTF8                             |
| date                    | utf8        | BYTE_ARRAY            | UTF8                             |
| datev2                  | date32      | INT32                 | DATE                             |
| datetime                | utf8        | BYTE_ARRAY            | UTF8                             |
| datetimev2              | timestamp   | INT96 / INT64         | TIMESTAMP(MICROS/MILLIS/SECONDS) |
| float                   | float32     | FLOAT                 |                                  |
| double                  | float64     | DOUBLE                |                                  |
| char / varchar / string | utf8        | BYTE_ARRAY            | UTF8                             |
| decimal                 | decimal128  | FIXED_LEN_BYTE_ARRAY  | DECIMAL(scale, precision)        |
| struct                  | struct      |                       | Parquet Group                    |
| map                     | map         |                       | Parquet Map                      |
| array                   | list        |                       | Parquet List                     |
| json                    | utf8        | BYTE_ARRAY            | UTF8                             |
| variant                 | utf8        | BYTE_ARRAY            | UTF8                             |
| bitmap                  | binary      | BYTE_ARRAY            |                                  |
| quantile_state          | binary      | BYTE_ARRAY            |                                  |
| hll                     | binary      | BYTE_ARRAY            |                                  |

:::note
In versions 2.1.11 and 3.0.7, the `parquet.enable_int96_timestamps` property is supported to specify whether the Doris `datetimev2` type is stored as `INT96` or `INT64` in Parquet. The default is `INT96`. `INT96` has been deprecated in the Parquet standard and is used only for compatibility with legacy systems (such as Hive versions before 4.0).
:::

## Related Documents

- [Export Asynchronous Export](./export-manual.md): use the `EXPORT` command to asynchronously export table or partition data.
- [SELECT INTO OUTFILE](./outfile.md): use `SELECT INTO OUTFILE` to synchronously export query results.
- [MySQL Dump](./export-with-mysql-dump.md): use the `mysqldump` tool to export table schemas and data.
- [Data Export Best Practices](./export-best-practice.md): export concurrency tuning and methods for evaluating export speed.
