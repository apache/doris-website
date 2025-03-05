---
{
    "title": "CREATE ROUTINE LOAD",
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


## Description

The Routine Load feature allows users to submit a resident import task that continuously reads data from a specified data source and imports it into Doris.

Currently, it only supports importing CSV or Json format data from Kafka through unauthenticated or SSL authentication methods. [Example of importing Json format data](../../../../data-operate/import/import-way/routine-load-manual.md#Example-of-importing-Json-format-data)

## Syntax

```sql
CREATE ROUTINE LOAD [<db>.]<job_name> [ON <tbl_name>]
[<merge_type>]
[<load_properties>]
[<job_properties>]
FROM <data_source> [<data_source_properties>]
[COMMENT "<comment>"]
```

## Required Parameters

**1. `[<db>.]<job_name>`**

> The name of the import job. Within the same database, only one job with the same name can be running.

**2. `FROM <data_source>`**

> The type of data source. Currently supports: KAFKA

**3. `<data_source_properties>`**

> 1. `<kafka_broker_list>`
>
>    Kafka broker connection information. Format is ip:host. Multiple brokers are separated by commas.
>    
>    ```text
>    "kafka_broker_list" = "broker1:9092,broker2:9092"
>    ```
>
> 2. `<kafka_topic>`
>
>    Specifies the Kafka topic to subscribe to.
>    ```text
>    "kafka_topic" = "my_topic"
>    ```

## Optional Parameters

**1. `<tbl_name>`**

> Specifies the name of the table to import into. This is an optional parameter. If not specified, the dynamic table method is used, which requires the data in Kafka to contain table name information.
>
> Currently, only supports getting table names from Kafka's Value, and it needs to follow this format: for json example: `table_name|{"col1": "val1", "col2": "val2"}`,
> where `tbl_name` is the table name, with `|` as the separator between table name and table data.
>
> For csv format data, it's similar: `table_name|val1,val2,val3`. Note that `table_name` here must match the table name in Doris, otherwise the import will fail.
>
> Tips: Dynamic tables do not support the `columns_mapping` parameter. If your table structure matches the table structure in Doris and there is a large amount of table information to import, this method will be the best choice.

**2. `<merge_type>`**

> Data merge type. Default is APPEND, which means the imported data are ordinary append write operations. MERGE and DELETE types are only available for Unique Key model tables. The MERGE type needs to be used with the [DELETE ON] statement to mark the Delete Flag column. The DELETE type means that all imported data are deleted data.
>
> Tips: When using dynamic multiple tables, please note that this parameter should be consistent with each dynamic table's type, otherwise it will result in import failure.

**3. `<load_properties>`**

> Used to describe imported data. The composition is as follows:
>
> ```SQL
> [column_separator],
> [columns_mapping],
> [preceding_filter],
> [where_predicates],
> [partitions],
> [DELETE ON],
> [ORDER BY]
> ```
>
> 1. `<column_separator>`
>
>    Specifies the column separator, defaults to `\t`
>
>    `COLUMNS TERMINATED BY ","`
>
> 2. `<columns_mapping>`
>
>    Used to specify the mapping relationship between file columns and table columns, as well as various column transformations. For a detailed introduction to this part, you can refer to the [Column Mapping, Transformation and Filtering] document.
>
>    `(k1, k2, tmpk1, k3 = tmpk1 + 1)`
>
>    Tips: Dynamic tables do not support this parameter.
>
> 3. `<preceding_filter>`
>
>    Filter raw data. For detailed information about this part, please refer to the [Column Mapping, Transformation and Filtering] document.
>
>    `WHERE k1 > 100 and k2 = 1000`
>
>    Tips: Dynamic tables do not support this parameter.
>
> 4. `<where_predicates>`
>
>    Filter imported data based on conditions. For detailed information about this part, please refer to the [Column Mapping, Transformation and Filtering] document.
>
>    `WHERE k1 > 100 and k2 = 1000`
>
>    Tips: When using dynamic multiple tables, please note that this parameter should match the columns of each dynamic table, otherwise the import will fail. When using dynamic multiple tables, we only recommend using this parameter for common public columns.
>
> 5. `<partitions>`
>
>    Specify which partitions of the destination table to import into. If not specified, data will be automatically imported into the corresponding partitions.
>
>    `PARTITION(p1, p2, p3)`
>
>    Tips: When using dynamic multiple tables, please note that this parameter should match each dynamic table, otherwise the import will fail.
>
> 6. `<DELETE ON>`
>
>    Must be used with MERGE import mode, only applicable to Unique Key model tables. Used to specify the Delete Flag column and calculation relationship in the imported data.
>
>    `DELETE ON v3 >100`
>
>    Tips: When using dynamic multiple tables, please note that this parameter should match each dynamic table, otherwise the import will fail.
>
> 7. `<ORDER BY>`
>
>    Only applicable to Unique Key model tables. Used to specify the Sequence Col column in the imported data. Mainly used to ensure data order during import.
>
>    Tips: When using dynamic multiple tables, please note that this parameter should match each dynamic table, otherwise the import will fail.

**4. `<job_properties>`**

> Used to specify general parameters for routine import jobs.
>
>    ```text
>    PROPERTIES (
>        "key1" = "val1",
>        "key2" = "val2"
>    )
>    ```
>
> Currently, we support the following parameters:
>
> 1. `<desired_concurrent_number>`
>
>     The desired concurrency. A routine import job will be divided into multiple subtasks for execution. This parameter specifies how many tasks can run simultaneously for a job. Must be greater than 0. Default is 5.
>
>    This concurrency is not the actual concurrency. The actual concurrency will be determined by considering the number of cluster nodes, load conditions, and data source conditions.
>
>    `"desired_concurrent_number" = "3"`
>
> 2. `<max_batch_interval>/<max_batch_rows>/<max_batch_size>`
>
>    These three parameters represent:
>
>     1. Maximum execution time for each subtask, in seconds. Must be greater than or equal to 1. Default is 10.
>     2. Maximum number of rows to read for each subtask. Must be greater than or equal to 200000. Default is 20000000.
>     3. Maximum number of bytes to read for each subtask. Unit is bytes, range is 100MB to 10GB. Default is 1G.
>
>     These three parameters are used to control the execution time and processing volume of a subtask. When any one reaches the threshold, the task ends.
>
>     ```text
>     "max_batch_interval" = "20",
>     "max_batch_rows" = "300000",
>     "max_batch_size" = "209715200"
>     ```
>
> 3. `<max_error_number>`
>
>     Maximum number of error rows allowed within the sampling window. Must be greater than or equal to 0. Default is 0, meaning no error rows are allowed.
>
>     The sampling window is `max_batch_rows * 10`. If the number of error rows within the sampling window exceeds `max_error_number`, the routine job will be suspended and require manual intervention to check data quality issues.
>
>     Rows filtered by where conditions are not counted as error rows.
>
> 4. `<strict_mode>`
>
>     Whether to enable strict mode, default is off. If enabled, when non-null original data's column type conversion results in NULL, it will be filtered. Specified as:
>
>     `"strict_mode" = "true"`
>
>     Strict mode means: strictly filter column type conversions during the import process. The strict filtering strategy is as follows:
>
>     1. For column type conversion, if strict mode is true, erroneous data will be filtered. Here, erroneous data refers to: original data that is not null but results in null value after column type conversion.
>     2. For columns generated by function transformation during import, strict mode has no effect.
>     3. For columns with range restrictions, if the original data can pass type conversion but cannot pass range restrictions, strict mode has no effect. For example: if the type is decimal(1,0) and the original data is 10, it can pass type conversion but is outside the column's declared range. Strict mode has no effect on such data.
>
>     **Relationship between strict mode and source data import**
>
>     Here's an example using TinyInt column type
>
>     Note: When columns in the table allow null values
>
>     | source data | source data example | string to int | strict_mode   | result                 |
>     | ----------- | ------------------- | ------------- | ------------- | ---------------------- |
>     | null        | `\N`               | N/A           | true or false | NULL                   |
>     | not null    | aaa or 2000        | NULL          | true          | invalid data(filtered) |
>     | not null    | aaa                | NULL          | false         | NULL                   |
>     | not null    | 1                  | 1             | true or false | correct data           |
>
>     Here's an example using Decimal(1,0) column type
>
>     Note: When columns in the table allow null values
>
>     | source data | source data example | string to int | strict_mode   | result                 |
>     | ----------- | ------------------- | ------------- | ------------- | ---------------------- |
>     | null        | `\N`               | N/A           | true or false | NULL                   |
>     | not null    | aaa                | NULL          | true          | invalid data(filtered) |
>     | not null    | aaa                | NULL          | false         | NULL                   |
>     | not null    | 1 or 10            | 1             | true or false | correct data           |
>
>     Note: Although 10 is a value exceeding the range, because its type meets decimal requirements, strict mode has no effect on it. 10 will eventually be filtered in other ETL processing flows, but won't be filtered by strict mode.
>
> 5. `<timezone>`
>
>     Specifies the timezone used for the import job. Defaults to the Session's timezone parameter. This parameter affects all timezone-related function results involved in the import.
>
>     `"timezone" = "Asia/Shanghai"`
>
> 6. `<format>`
>
>     Specifies the import data format, default is csv, json format is supported.
>
>     `"format" = "json"`
>
> 7. `<jsonpaths>`
>
>     When importing json format data, jsonpaths can be used to specify fields to extract from Json data.
>
>     `-H "jsonpaths: [\"$.k2\", \"$.k1\"]"`
>
> 8. `<strip_outer_array>`
>
>     When importing json format data, strip_outer_array set to true indicates that Json data is presented as an array, where each element in the data will be treated as a row. Default value is false.
>
>     `-H "strip_outer_array: true"`
>
> 9. `<json_root>`
>
>     When importing json format data, json_root can be used to specify the root node of Json data. Doris will parse elements extracted from the root node through json_root. Default is empty.
>
>     `-H "json_root: $.RECORDS"`
>  
> 10. `<send_batch_parallelism>`
>
>     Integer type, used to set the parallelism of sending batch data. If the parallelism value exceeds `max_send_batch_parallelism_per_job` in BE configuration, the BE serving as the coordination point will use the value of `max_send_batch_parallelism_per_job`.
>
>     `"send_batch_parallelism" = "10"`
>
> 11. `<load_to_single_tablet>`
>
>     Boolean type, true indicates support for a task to import data to only one tablet of the corresponding partition, default value is false. This parameter is only allowed to be set when importing data to olap tables with random bucketing.
>
>     `"load_to_single_tablet" = "true"`
>
> 12. `<partial_columns>`
>
>     Boolean type, true indicates using partial column updates, default value is false. This parameter is only allowed to be set when the table model is Unique and uses Merge on Write. Dynamic multiple tables do not support this parameter.
>
>     `"partial_columns" = "true"`
>
> 13. `<max_filter_ratio>`
>
>     Maximum filter ratio allowed within the sampling window. Must be between greater than or equal to 0 and less than or equal to 1. Default value is 0.
>
>     The sampling window is `max_batch_rows * 10`. If within the sampling window, error rows/total rows exceeds `max_filter_ratio`, the routine job will be suspended and require manual intervention to check data quality issues.
>
>     Rows filtered by where conditions are not counted as error rows.
>
> 14. `<enclose>`
>
>     Enclosure character. When csv data fields contain row or column separators, to prevent accidental truncation, a single-byte character can be specified as an enclosure for protection. For example, if the column separator is "," and the enclosure is "'", for data "a,'b,c'", "b,c" will be parsed as one field.
>
>     Note: When enclose is set to `"`, trim_double_quotes must be set to true.
>
> 15. `<escape>`
>
>     Escape character. Used to escape characters in csv fields that are the same as the enclosure character. For example, if the data is "a,'b,'c'", enclosure is "'", and you want "b,'c" to be parsed as one field, you need to specify a single-byte escape character, such as `\`, and modify the data to `a,'b,\'c'`.
>
**5. Optional properties in `data_source_properties`**

> 1. `<kafka_partitions>/<kafka_offsets>`
>
>     Specifies the kafka partitions to subscribe to and the starting offset for each partition. If a time is specified, consumption will start from the nearest offset greater than or equal to that time.
>
>     offset can be specified as a specific offset greater than or equal to 0, or:
>
>     - `OFFSET_BEGINNING`: Start subscribing from where data exists.
>     - `OFFSET_END`: Start subscribing from the end.
>     - Time format, such as: "2021-05-22 11:00:00"
>
>     If not specified, defaults to subscribing to all partitions under the topic from `OFFSET_END`.
>
>     ```text
>     "kafka_partitions" = "0,1,2,3",
>     "kafka_offsets" = "101,0,OFFSET_BEGINNING,OFFSET_END"
>     ```
>
>     ```text
>     "kafka_partitions" = "0,1,2,3",
>     "kafka_offsets" = "2021-05-22 11:00:00,2021-05-22 11:00:00,2021-05-22 11:00:00"
>     ```
>
>    Note: Time format cannot be mixed with OFFSET format.
>
> 2. `<property>`
>
>     Specifies custom kafka parameters. Functions the same as the "--property" parameter in kafka shell.
>
>     When the value of a parameter is a file, the keyword "FILE:" needs to be added before the value.
>
>     For information about how to create files, please refer to the [CREATE FILE](../../security/CREATE-FILE) command documentation.
>
>     For more supported custom parameters, please refer to the client configuration items in the official CONFIGURATION documentation of librdkafka. For example:
>
>     ```text
>     "property.client.id" = "12345",
>     "property.ssl.ca.location" = "FILE:ca.pem"
>     ```
>
>     2.1 When using SSL to connect to Kafka, the following parameters need to be specified:
>
>        ```text
>        "property.security.protocol" = "ssl",
>        "property.ssl.ca.location" = "FILE:ca.pem",
>        "property.ssl.certificate.location" = "FILE:client.pem",
>        "property.ssl.key.location" = "FILE:client.key",
>        "property.ssl.key.password" = "abcdefg"
>        ```
>
>        Among them:
>
>        `property.security.protocol` and `property.ssl.ca.location` are required, used to specify the connection method as SSL and the location of the CA certificate.
>
>        If client authentication is enabled on the Kafka server side, the following also need to be set:
>
>        ```text
>        "property.ssl.certificate.location"
>        "property.ssl.key.location"
>        "property.ssl.key.password"
>        ```
>
>        Used to specify the client's public key, private key, and private key password respectively.
>
>     2.2 Specify default starting offset for kafka partitions
>
>     If `<kafka_partitions>/<kafka_offsets>` is not specified, all partitions will be consumed by default.
>
>     In this case, `<kafka_default_offsets>` can be specified to set the starting offset. Default is `OFFSET_END`, meaning subscription starts from the end.
>
>     Example:
>
>     ```text
>     "property.kafka_default_offsets" = "OFFSET_BEGINNING"
>     ```

**6. `COMMENT`**

>     Comment information for the routine load task.

## Access Control Requirements

Users executing this SQL command must have at least the following privileges:

| Privilege | Object | Notes |
| :-------- | :----- | :---- |
| LOAD_PRIV | Table | CREATE ROUTINE LOAD belongs to table LOAD operation |

## Usage Notes

- Dynamic tables do not support the `columns_mapping` parameter
- When using dynamic multiple tables, parameters like merge_type, where_predicates, etc., need to conform to each dynamic table's requirements
- Time format cannot be mixed with OFFSET format
- `kafka_partitions` and `kafka_offsets` must correspond one-to-one
- When `enclose` is set to `"`, `trim_double_quotes` must be set to true.

## Examples

- Create a Kafka routine load task named test1 for example_tbl in example_db. Specify column separator, group.id and client.id, and automatically consume all partitions by default, starting subscription from where data exists (OFFSET_BEGINNING)

   ```sql
   CREATE ROUTINE LOAD example_db.test1 ON example_tbl
   COLUMNS TERMINATED BY ",",
   COLUMNS(k1, k2, k3, v1, v2, v3 = k1 * 100)
   PROPERTIES
   (
       "desired_concurrent_number"="3",
       "max_batch_interval" = "20",
       "max_batch_rows" = "300000",
       "max_batch_size" = "209715200",
       "strict_mode" = "false"
   )
   FROM KAFKA
   (
       "kafka_broker_list" = "broker1:9092,broker2:9092,broker3:9092",
       "kafka_topic" = "my_topic",
       "property.group.id" = "xxx",
       "property.client.id" = "xxx",
       "property.kafka_default_offsets" = "OFFSET_BEGINNING"
   );
   ```

- Create a Kafka routine dynamic multi-table load task named test1 for example_db. Specify column separator, group.id and client.id, and automatically consume all partitions by default, starting subscription from where data exists (OFFSET_BEGINNING)

  Assuming we need to import data from Kafka into test1 and test2 tables in example_db, we create a routine load task named test1, and write data from test1 and test2 to a Kafka topic named `my_topic`. This way, we can import data from Kafka into two tables through one routine load task.

   ```sql
   CREATE ROUTINE LOAD example_db.test1
   PROPERTIES
   (
       "desired_concurrent_number"="3",
       "max_batch_interval" = "20",
       "max_batch_rows" = "300000",
       "max_batch_size" = "209715200",
       "strict_mode" = "false"
   )
   FROM KAFKA
   (
       "kafka_broker_list" = "broker1:9092,broker2:9092,broker3:9092",
       "kafka_topic" = "my_topic",
       "property.group.id" = "xxx",
       "property.client.id" = "xxx",
       "property.kafka_default_offsets" = "OFFSET_BEGINNING"
   );
   ```

- Create a Kafka routine load task named test1 for example_tbl in example_db. The import task is in strict mode.

   ```sql
   CREATE ROUTINE LOAD example_db.test1 ON example_tbl
   COLUMNS(k1, k2, k3, v1, v2, v3 = k1 * 100),
   PRECEDING FILTER k1 = 1,
   WHERE k1 > 100 and k2 like "%doris%"
   PROPERTIES
   (
       "desired_concurrent_number"="3",
       "max_batch_interval" = "20",
       "max_batch_rows" = "300000",
       "max_batch_size" = "209715200",
       "strict_mode" = "true"
   )
   FROM KAFKA
   (
       "kafka_broker_list" = "broker1:9092,broker2:9092,broker3:9092",
       "kafka_topic" = "my_topic",
       "kafka_partitions" = "0,1,2,3",
       "kafka_offsets" = "101,0,0,200"
   );
   ```

- Import data from Kafka cluster using SSL authentication. Also set client.id parameter. Import task is in non-strict mode, timezone is Africa/Abidjan

   ```sql
   CREATE ROUTINE LOAD example_db.test1 ON example_tbl
   COLUMNS(k1, k2, k3, v1, v2, v3 = k1 * 100),
   WHERE k1 > 100 and k2 like "%doris%"
   PROPERTIES
   (
       "desired_concurrent_number"="3",
       "max_batch_interval" = "20",
       "max_batch_rows" = "300000",
       "max_batch_size" = "209715200",
       "strict_mode" = "false",
       "timezone" = "Africa/Abidjan"
   )
   FROM KAFKA
   (
       "kafka_broker_list" = "broker1:9092,broker2:9092,broker3:9092",
       "kafka_topic" = "my_topic",
       "property.security.protocol" = "ssl",
       "property.ssl.ca.location" = "FILE:ca.pem",
       "property.ssl.certificate.location" = "FILE:client.pem",
       "property.ssl.key.location" = "FILE:client.key",
       "property.ssl.key.password" = "abcdefg",
       "property.client.id" = "my_client_id"
   );
   ```

- Import Json format data. Use field names in Json as column name mapping by default. Specify importing partitions 0,1,2, all starting offsets are 0

   ```sql
   CREATE ROUTINE LOAD example_db.test_json_label_1 ON table1
   COLUMNS(category,price,author)
   PROPERTIES
   (
       "desired_concurrent_number"="3",
       "max_batch_interval" = "20",
       "max_batch_rows" = "300000",
       "max_batch_size" = "209715200",
       "strict_mode" = "false",
       "format" = "json"
   )
   FROM KAFKA
   (
       "kafka_broker_list" = "broker1:9092,broker2:9092,broker3:9092",
       "kafka_topic" = "my_topic",
       "kafka_partitions" = "0,1,2",
       "kafka_offsets" = "0,0,0"
   );
   ```

- Import Json data, extract fields through Jsonpaths, and specify Json document root node

   ```sql
   CREATE ROUTINE LOAD example_db.test1 ON example_tbl
   COLUMNS(category, author, price, timestamp, dt=from_unixtime(timestamp, '%Y%m%d'))
   PROPERTIES
   (
       "desired_concurrent_number"="3",
       "max_batch_interval" = "20",
       "max_batch_rows" = "300000",
       "max_batch_size" = "209715200",
       "strict_mode" = "false",
       "format" = "json",
       "jsonpaths" = "[\"$.category\",\"$.author\",\"$.price\",\"$.timestamp\"]",
       "json_root" = "$.RECORDS"
       "strip_outer_array" = "true"
   )
   FROM KAFKA
   (
       "kafka_broker_list" = "broker1:9092,broker2:9092,broker3:9092",
       "kafka_topic" = "my_topic",
       "kafka_partitions" = "0,1,2",
       "kafka_offsets" = "0,0,0"
   );
   ```

- Create a Kafka routine load task named test1 for example_tbl in example_db with condition filtering.

   ```sql
   CREATE ROUTINE LOAD example_db.test1 ON example_tbl
   WITH MERGE
   COLUMNS(k1, k2, k3, v1, v2, v3),
   WHERE k1 > 100 and k2 like "%doris%",
   DELETE ON v3 >100
   PROPERTIES
   (
       "desired_concurrent_number"="3",
       "max_batch_interval" = "20",
       "max_batch_rows" = "300000",
       "max_batch_size" = "209715200",
       "strict_mode" = "false"
   )
   FROM KAFKA
   (
       "kafka_broker_list" = "broker1:9092,broker2:9092,broker3:9092",
       "kafka_topic" = "my_topic",
       "kafka_partitions" = "0,1,2,3",
       "kafka_offsets" = "101,0,0,200"
   );
   ```

- Import data into a Unique Key model table containing sequence columns

   ```sql
   CREATE ROUTINE LOAD example_db.test_job ON example_tbl
   COLUMNS TERMINATED BY ",",
   COLUMNS(k1,k2,source_sequence,v1,v2),
   ORDER BY source_sequence
   PROPERTIES
   (
       "desired_concurrent_number"="3",
       "max_batch_interval" = "30",
       "max_batch_rows" = "300000",
       "max_batch_size" = "209715200"
   ) FROM KAFKA
   (
       "kafka_broker_list" = "broker1:9092,broker2:9092,broker3:9092",
       "kafka_topic" = "my_topic",
       "kafka_partitions" = "0,1,2,3",
       "kafka_offsets" = "101,0,0,200"
   );
   ```

- Start consuming from a specified time point

   ```sql
   CREATE ROUTINE LOAD example_db.test_job ON example_tbl
   PROPERTIES
   (
       "desired_concurrent_number"="3",
       "max_batch_interval" = "30",
       "max_batch_rows" = "300000",
       "max_batch_size" = "209715200"
   ) FROM KAFKA
   (
       "kafka_broker_list" = "broker1:9092,broker2:9092",
       "kafka_topic" = "my_topic",
       "kafka_default_offsets" = "2021-05-21 10:00:00"
   );
   ```