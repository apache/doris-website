---
{
    "title": "Export Overview",
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

The data export function is used to write the query result set or Doris table data into the specified storage system in the specified file format.

The differences between the export function and the data backup function are as follows:

| |Data Export|Data Backup|
| ----- | ----- | ----- |
|Final Storage Location|HDFS, Object Storage, Local File System|HDFS, Object Storage|
|Data Format|Open file formats such as Parquet, ORC, CSV|Doris internal storage format|
|Execution Speed|Moderate (requires reading data and converting to the target data format)|Fast (no parsing and conversion required, directly upload Doris data files)|
|Flexibility|Can flexibly define the data to be exported through SQL statements|Only supports table-level full backup|
|Use Cases|Result set download, data exchange between different systems|Data backup, data migration between Doris clusters|

## Choosing Export Methods

Doris provides three different data export methods:

* **SELECT INTO OUTFILE**: Supports the export of any SQL result set.
* **EXPORT**: Supports the export of partial or full table data.
* **MySQL DUMP**: Compatible with the MySQL dump command for data export.

The similarities and differences between the three export methods are as follows:

| |SELECT INTO OUTFILE|EXPORT|MySQL DUMP|
| ----- | ----- | ----- | ----- |
|Synchronous/Asynchronous|Synchronous|Asynchronous (submit EXPORT tasks and check task progress via SHOW EXPORT command)|Synchronous|
|Supports any SQL|Yes|No|No|
|Export specific partitions|Yes|Yes|No|
|Export specific tablets|Yes|No|No|
|Concurrent export|Supported with high concurrency (depends on whether the SQL statement has operators such as ORDER BY that need to be processed on a single node)|Supported with high concurrency (supports tablet-level concurrent export)|Not supported, single-threaded export only|
|Supported export data formats|Parquet, ORC, CSV|Parquet, ORC, CSV|MySQL Dump proprietary format|
|Supports exporting external tables|Yes|Partially supported|No|
|Supports exporting views|Yes|Yes|Yes|
|Supported export locations|S3, HDFS, LOCAL|S3, HDFS, LOCAL|LOCAL|

### SELECT INTO OUTFILE

Suitable for the following scenarios:

* Data needs to be exported after complex calculations, such as filtering, aggregation, joins, etc.
* Suitable for scenarios that require synchronous tasks.

### EXPORT

Suitable for the following scenarios:

* Large-scale single table export, with simple filtering conditions.
* Scenarios that require asynchronous task submission.

### MySQL Dump

Suitable for the following scenarios:

* Compatible with the MySQL ecosystem, requires exporting both table structure and data.
* Only for development testing or scenarios with very small data volumes.

## Export File Column Type Mapping

Parquet and ORC file formats have their own data types. Doris's export function can automatically map Doris's data types to the corresponding data types in Parquet and ORC file formats. The CSV format does not have types, all data is output as text.

The following table shows the mapping between Doris data types and Parquet, ORC file format data types:

1. Doris export to ORC file format data type mapping table:

    |Doris Type|Orc Type|
    | -------- | ------- |
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
    |json| Not supported|

2. When Doris exports to Parquet file format, it first converts Doris in-memory data to Arrow in-memory data format, then writes out to Parquet file format. The mapping relationship between Doris data types and Arrow data types is:

    | Doris Type | Arrow Type |
    | ----- | ----- |
    | boolean | boolean |
    | tinyint | int8 |
    | smallint | int16 |
    | int | int32 |
    | bigint | int64 |
    | largeInt | utf8 |
    | date | utf8 |
    | datev2 | Date32Type |
    | datetime | utf8 |
    | datetimev2 | TimestampType |
    | float | float32 |
    | double | float64 |
    | char / varchar / string | utf8 |
    | decimal | decimal128 |
    | struct | struct |
    | map | map |
    | array | list |
