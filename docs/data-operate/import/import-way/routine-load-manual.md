---
{
    "title": "Routine Load",
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

Doris can continuously consume data from Kafka Topic through the Routine Load method. After submitting a Routine Load job, Doris will continuously run the load job, generating real-time loading tasks to constantly consume messages from the specified Topic in the Kafka cluster.

Routine Load is a streaming load job that supports Exactly-Once semantics, ensuring that data is neither lost nor duplicated.

## Usage Scenarios

### Supported Data Sources

Routine Load supports consuming data from Kafka clusters.

### Supported Data File Formats

Routine Load supports consuming data in CSV and JSON formats.

When loading CSV format, it is necessary to clearly distinguish between null values and empty strings:

- Null values need to be represented with `\n`. For example, `a,\n,b` indicates that the middle column is a null value.

- Empty strings can be represented by leaving the data field empty. For example, `a,,b` indicates that the middle column is an empty string.

### Usage Limitations

When using Routine Load to consume data from Kafka, there are the following limitations:

- The supported message formats are CSV and JSON text formats. Each message in CSV should be on a separate line, and the line should not end with a newline character.

- By default, it supports Kafka versions 0.10.0.0 and above. If you need to use a Kafka version below 0.10.0.0 (such as 0.9.0, 0.8.2, 0.8.1, 0.8.0), you need to modify the BE configuration by setting the value of `kafka_broker_version_fallback` to the compatible older version, or directly set the value of `property.broker.version.fallback` when creating the Routine Load. However, using an older version may mean that some new features of Routine Load, such as setting the offset of Kafka partitions based on time, may not be available.

## Basic Principles

Routine Load continuously consumes data from Kafka Topics and writes it into Doris.

When a Routine Load job is created in Doris, it generates a resident import job that consists of several import tasks:

- Load Job: A Routine Load Job is a resident import job that continuously consumes data from the data source.

- Load Task: An import job is broken down into several import tasks for actual consumption, with each task being an independent transaction.

The specific import process of Routine Load is shown in the following diagram:

![Routine Load](/images/routine-load.png)

1. The Client submits a request to create a Routine Load job to the FE, and the FE generates a resident import job (Routine Load Job) through the Routine Load Manager.

2. The FE splits the Routine Load Job into several Routine Load Tasks through the Job Scheduler, which are then scheduled by the Task Scheduler and distributed to BE nodes.

3. On the BE, after a Routine Load Task is completed, it submits the transaction to the FE and updates the Job's metadata.

4. After a Routine Load Task is submitted, it continues to generate new Tasks or retries timed-out Tasks.

5. The newly generated Routine Load Tasks continue to be scheduled by the Task Scheduler in a continuous cycle.

## Quick Start

### Create Job

In Doris, you can create persistent Routine Load  tasks using the `CREATE ROUTINE LOAD` command. For detailed syntax, please refer to [CREATE ROUTINE LOAD](../../../sql-manual/sql-statements/Data-Manipulation-Statements/Load/CREATE-ROUTINE-LOAD). Routine Load supports consuming data in CSV and JSON formats.

**Loading CSV Data**

1. Loading data sample

    In Kafka, there is the following sample data:

    ```SQL
    kafka-console-consumer.sh --bootstrap-server localhost:9092 --topic test-routine-load-csv --from-beginnin
    1,Emily,25
    2,Benjamin,35
    3,Olivia,28
    4,Alexander,60
    5,Ava,17
    6,William,69
    7,Sophia,32
    8,James,64
    9,Emma,37
    10,Liam,64
    ```

2. Creating table

    In Doris, create the table for loading with the following syntax:

    ```sql
    CREATE TABLE testdb.test_routineload_tbl(
        user_id            BIGINT       NOT NULL COMMENT "User ID",
        name               VARCHAR(20)           COMMENT "User Name",
        age                INT                   COMMENT "User Age"
    )
    DUPLICATE KEY(user_id)
    DISTRIBUTED BY HASH(user_id) BUCKETS 10;
    ```

3. Creating the Routine Load job

    In Doris, use the `CREATE ROUTINE LOAD` command to create the load job:

    ```sql
    CREATE ROUTINE LOAD testdb.example_routine_load_csv ON test_routineload_tbl
    COLUMNS TERMINATED BY ",",
    COLUMNS(user_id, name, age)
    FROM KAFKA(
        "kafka_broker_list" = "192.168.88.62:9092",
        "kafka_topic" = "test-routine-load-csv",
        "property.kafka_default_offsets" = "OFFSET_BEGINNING"
    );
    ```

**Loading** **JSON** **Data**

1. Loading sample data

    In Kafka, there is the following sample data:

    ```sql
    kafka-console-consumer.sh --bootstrap-server localhost:9092 --topic test-routine-load-json --from-beginning
    ```

2. Creating table

    In Doris, create the table for loading with the following syntax:

    ```sql
    CREATE TABLE testdb.test_routineload_tbl(
        user_id            BIGINT       NOT NULL COMMENT "User ID",
        name               VARCHAR(20)           COMMENT "User Name",
        age                INT                   COMMENT "User Age"
    )
    DUPLICATE KEY(user_id)
    DISTRIBUTED BY HASH(user_id) BUCKETS 10;
    ```

3. Creating the Routine Load job

    In Doris, use the `CREATE ROUTINE LOAD` command to create the job:

    ```sql
    CREATE ROUTINE LOAD testdb.example_routine_load_json ON test_routineload_tbl
    COLUMNS(user_id, name, age)
    PROPERTIES(
        "format"="json",
        "jsonpaths"="[\"$.user_id\",\"$.name\",\"$.age\"]"
    )
    FROM KAFKA(
        "kafka_broker_list" = "192.168.88.62:9092"
    );
    ```

### Viewing Status

In Doris, you can check the status of Routine Load jobs and tasks using the following methods:

- Load Jobs: Used to view information about load tasks, such as the target table, number of subtasks, load delay status, load configuration, and load results.

- Load Tasks: Used to view the status of individual load tasks, including task ID, transaction status, task status, execution start time, and BE (Backend) node assignment.

**01 Viewing Running Jobs**

You can use the `SHOW ROUTINE LOAD` command to check the status of jobs. The `SHOW ROUTINE LOAD` command provides information about the current job, including the target table, load delay status, load configuration, and error messages.

For example, to view the status of the `testdb.example_routine_load_csv` job, you can run the following command:

```sql
mysql> SHOW ROUTINE LOAD FOR testdb.example_routine_load\G
*************************** 1. row ***************************
                  Id: 12025
                Name: example_routine_load
          CreateTime: 2024-01-15 08:12:42
           PauseTime: NULL
             EndTime: NULL
              DbName: default_cluster:testdb
           TableName: test_routineload_tbl
        IsMultiTable: false
               State: RUNNING
      DataSourceType: KAFKA
      CurrentTaskNum: 1
       JobProperties: {"max_batch_rows":"200000","timezone":"America/New_York","send_batch_parallelism":"1","load_to_single_tablet":"false","column_separator":"','","line_delimiter":"\n","current_concurrent_number":"1","delete":"*","partial_columns":"false","merge_type":"APPEND","exec_mem_limit":"2147483648","strict_mode":"false","jsonpaths":"","max_batch_interval":"10","max_batch_size":"104857600","fuzzy_parse":"false","partitions":"*","columnToColumnExpr":"user_id,name,age","whereExpr":"*","desired_concurrent_number":"5","precedingFilter":"*","format":"csv","max_error_number":"0","max_filter_ratio":"1.0","json_root":"","strip_outer_array":"false","num_as_string":"false"}
DataSourceProperties: {"topic":"test-topic","currentKafkaPartitions":"0","brokerList":"192.168.88.62:9092"}
    CustomProperties: {"kafka_default_offsets":"OFFSET_BEGINNING","group.id":"example_routine_load_73daf600-884e-46c0-a02b-4e49fdf3b4dc"}
           Statistic: {"receivedBytes":28,"runningTxns":[],"errorRows":0,"committedTaskNum":3,"loadedRows":3,"loadRowsRate":0,"abortedTaskNum":0,"errorRowsAfterResumed":0,"totalRows":3,"unselectedRows":0,"receivedBytesRate":0,"taskExecuteTimeMs":30069}
            Progress: {"0":"2"}
                 Lag: {"0":0}
ReasonOfStateChanged:
        ErrorLogUrls:
            OtherMsg:
                User: root
             Comment:
1 row in set (0.00 sec)
```

**02 Viewing Running Tasks**

You can use the `SHOW ROUTINE LOAD TASK` command to check the status of load tasks. The `SHOW ROUTINE LOAD TASK` command provides information about the individual tasks under a specific load job, including task ID, transaction status, task status, execution start time, and BE ID.

For example, to view the task status of the `example_routine_load_csv` job, you can run the following command:

```sql
mysql> SHOW ROUTINE LOAD TASK WHERE jobname = 'example_routine_load_csv';
+-----------------------------------+-------+-----------+-------+---------------------+---------------------+---------+-------+----------------------+
| TaskId                            | TxnId | TxnStatus | JobId | CreateTime          | ExecuteStartTime    | Timeout | BeId  | DataSourceProperties |
+-----------------------------------+-------+-----------+-------+---------------------+---------------------+---------+-------+----------------------+
| 8cf47e6a68ed4da3-8f45b431db50e466 | 195   | PREPARE   | 12177 | 2024-01-15 12:20:41 | 2024-01-15 12:21:01 | 20      | 10429 | {"4":1231,"9":2603}  |
| f2d4525c54074aa2-b6478cf8daaeb393 | 196   | PREPARE   | 12177 | 2024-01-15 12:20:41 | 2024-01-15 12:21:01 | 20      | 12109 | {"1":1225,"6":1216}  |
| cb870f1553864250-975279875a25fab6 | -1    | NULL      | 12177 | 2024-01-15 12:20:52 | NULL                | 20      | -1    | {"2":7234,"7":4865}  |
| 68771fd8a1824637-90a9dac2a7a0075e | -1    | NULL      | 12177 | 2024-01-15 12:20:52 | NULL                | 20      | -1    | {"3":1769,"8":2982}  |
| 77112dfea5e54b0a-a10eab3d5b19e565 | 197   | PREPARE   | 12177 | 2024-01-15 12:21:02 | 2024-01-15 12:21:02 | 20      | 12098 | {"0":3000,"5":2622}  |
+-----------------------------------+-------+-----------+-------+---------------------+---------------------+---------+-------+----------------------+
```

### Pausing Jobs

You can pause an load job using the [PAUSE ROUTINE LOAD](../../../sql-manual/sql-statements/Data-Manipulation-Statements/Load/PAUSE-ROUTINE-LOAD) command. When a job is paused, it enters the PAUSED state, but the load job is not terminated and can be resumed using the RESUME ROUTINE LOAD command.

To pause the `testdb.example_routine_load_csv` load job, you can use the following command:

```sql
PAUSE ROUTINE LOAD FOR testdb.example_routine_load_csv;
```

### Resuming Jobs

You can resume a paused load job using the [RESUME ROUTINE LOAD](../../../sql-manual/sql-statements/Data-Manipulation-Statements/Load/RESUME-ROUTINE-LOAD) command.

To resume the `testdb.example_routine_load_csv` job, you can use the following command:

```sql
RESUME ROUTINE LOAD FOR testdb.example_routine_load_csv;
```

### Modifying Jobs

You can modify a created loading job using the [ALTER ROUTINE LOAD](../../../sql-manual/sql-statements/Data-Manipulation-Statements/Load/ALTER-ROUTINE-LOAD) command. Before modifying the job, you need to pause it using the` PAUSE ROUTINE LOAD` command, and after making the modifications, you can resume it using the `RESUME ROUTINE LOAD` command.

To modify the `desired_concurrent_number` parameter for the job and update the Kafka topic information, you can use the following command:

```sql
ALTER ROUTINE LOAD FOR testdb.example_routine_load_csv
PROPERTIES(
    "desired_concurrent_number" = "3"
)
FROM KAFKA(
    "kafka_broker_list" = "192.168.88.60:9092",
    "kafka_topic" = "test-topic"
);
```

### Canceling Jobs

You can stop and delete a Routine Load job using the [STOP ROUTINE LOAD](../../../sql-manual/sql-statements/Data-Manipulation-Statements/Load/STOP-ROUTINE-LOAD) command. Once deleted, the load job cannot be recovered and cannot be viewed using the `SHOW ROUTINE LOAD` command.

To stop and delete the `testdb.example_routine_load_csv` load job, you can use the following command:

```sql
STOP ROUTINE LOAD FOR testdb.example_routine_load_csv;
```

## Reference Manual

### Load Commands

The syntax for creating a Routine Load persistent load job is as follows:

```sql
CREATE ROUTINE LOAD [<db_name>.]<job_name> [ON <tbl_name>]
[merge_type]
[load_properties]
[job_properties]
FROM KAFKA [data_source_properties]
[COMMENT "<comment>"]
```

The modules for creating a loading job are explained as follows:

| Module                 | Description                                                  |
| ---------------------- | ------------------------------------------------------------ |
| db_name                | Specifies the name of the database for creating the loading task. |
| job_name               | Specifies the name of the created loading job. The job name must be unique within the same database. |
| tbl_name               | Specifies the name of the table to be loaded. This parameter is optional. If not specified, the dynamic table mode will be used, where Kafka data should contain the table name information. |
| merge_type             | Specifies the data merge type. The default value is APPEND. Possible merge_type options are: <ul><li>APPEND: Append load mode</li><li>MERGE: Merge load mode</li><li>DELETE: load data as delete records</li></ul> |
| load_properties        | Describes the load properties, including:<ul><li>colum_spearator clause</li><li>columns_mapping clause</li><li>preceding_filter clause</li><li>where_predicates clause</li><li>partitions clause</li><li>delete_on clause</li><li>order_by clause</li></ul> |
| job_properties         | Specifies the general load parameters for Routine Load.      |
| data_source_properties | Describes the properties of Kafka data source.               |
| comment                | Describes any additional comments for the loading job.       |

### Load Parameter Description

**01 FE Configuration Parameters**

**max_routine_load_task_concurrent_num**

- Default Value: 256

- Dynamic Configuration: Yes

- FE Master Exclusive: Yes

- Parameter Description: Limits the maximum number of concurrent subtasks for Routine Load jobs. It is recommended to keep it at the default value. Setting it too high may result in excessive concurrent tasks and resource consumption.

**max_routine_load_task_num_per_be**

- Default Value: 1024

- Dynamic Configuration: Yes

- FE Master Exclusive: Yes

- Parameter Description: Limits the maximum number of concurrent Routine Load tasks per backend (BE). `max_routine_load_task_num_per_be` should be smaller than the `routine_load_thread_pool_size` parameter.

**max_routine_load_job_num**

- Default Value: 100

- Dynamic Configuration: Yes

- FE Master Exclusive: Yes

- Parameter Description: Limits the maximum number of Routine Load jobs, including those in NEED_SCHEDULED, RUNNING, and PAUSE states.

**max_tolerable_backend_down_num**

- Default Value: 0

- Dynamic Configuration: Yes

- FE Master Exclusive: Yes

- Parameter Description: If any BE goes down, Routine Load cannot automatically recover. Under certain conditions, Doris can reschedule PAUSED tasks and transition them to the RUNNING state. Setting this parameter to 0 means that re-scheduling is only allowed when all BE nodes are in the alive state.

**period_of_auto_resume_min**

- Default Value: 5 (minutes)

- Dynamic Configuration: Yes

- FE Master Exclusive: Yes

- Parameter Description: The period for automatically resuming Routine Load.

**02 BE Configuration Parameters**

**max_consumer_num_per_group**

- Default Value: 3

- Dynamic Configuration: Yes

- Description: Specifies the maximum number of consumers generated per subtask. For Kafka data sources, a consumer can consume one or multiple Kafka partitions. For example, if a task needs to consume 6 Kafka partitions, it will generate 3 consumers, with each consumer consuming 2 partitions. If there are only 2 partitions, it will generate 2 consumers, with each consumer consuming 1 partition.

### Load Configuration Parameters

When creating a Routine Load job, you can specify the load configuration parameters for different modules using the `CREATE ROUTINE LOAD` command.

**tbl_name Clause**

Specifies the name of the table to be loaded. This parameter is optional.

If not specified, the dynamic table mode is used, which requires the data in Kafka to contain the table name information. Currently, only extracting the table name from the Value field of Kafka is supported. The format should be as follows, using JSON as an example: `table_name|{"col1": "val1", "col2": "val2"}`, where `tbl_name` is the table name and `|` is used as the separator between the table name and the table data. The same format applies to CSV data, such as `table_name|val1,val2,val3`. Note that the `table_name` here must be consistent with the table name in Doris, otherwise the load will fail. Note that dynamic tables do not support the column_mapping configuration described later.

**merge_type Clause**

The merge_type module specifies the type of data merging. There are three options for merge_type:

- APPEND: Append load mode.

- MERGE: Merge load mode. Only applicable to Unique Key models. It needs to be used together with the [DELETE ON] module to mark the Delete Flag column.

- DELETE: All loaded data is data that needs to be deleted.

**load_properties Clause**

The load_properties module describes the properties of the loaded data using the following syntax:

```sql
[COLUMNS TERMINATED BY <column_separator>,]
[COLUMNS (<column1_name>[, <column2_name>, <column_mapping>, ...]),]
[WHERE <where_expr>,]
[PARTITION(<partition1_name>, [<partition2_name>, <partition3_name>, ...]),]
[DELETE ON <delete_expr>,]
[ORDER BY <order_by_column1>[, <order_by_column2>, <order_by_column3>, ...]]
```

The specific parameters for each module are as follows:

| Submodule             | Parameter            | Description                                                  |
| --------------------- | -------------------- | ------------------------------------------------------------ |
| COLUMNS TERMINATED BY | `<column_separator>` | Specifies the column delimiter, defaulting to `\t`. For example, to specify a comma as the delimiter, use `COLUMNS TERMINATED BY ","`. When handling empty values, note the following:<ul><li>Null values should be represented as `\n`. For example, `a,\n,b` represents a null value in the middle column.</li><li>Empty strings (`''`) are treated as empty values. For example, `a,,b` represents an empty string in the middle column.</li></ul>|
| COLUMNS               | `<column_name>`      | Specifies the corresponding column names. For example, to specify the load columns as `(k1, k2, k3)`, use `COLUMNS(k1, k2, k3)`. The COLUMNS clause can be omitted in the following cases:<ul><li>When the columns in the CSV match the table columns one by one.</li><li>When the key columns in JSON have the same names as the table columns.</li></ul> |
|                       | `<column_mapping>`   | During the load process, column mapping can be used to filter and transform columns. For example, if the target column needs to perform a derived calculation based on a column in the data source (e.g., the target column k4 is calculated as k3 + 1 based on the k3 column), you can use `COLUMNS(k1, k2, k3, k4 = k3 + 1)`. For more details, refer to the [Data Conversion](../../../data-operate/import/load-data-convert) documentation. |
| WHERE                 | `<where_expr>`       | Specifies the condition to filter the loaded data source. For example, to load only data where age > 30, use `WHERE age > 30`. |
| PARTITION             | `<partition_name>`   | Specifies which partitions in the target table to load. If not specified, it will automatically load into the corresponding partitions. For example, to load partitions p1 and p2 of the target table, use `PARTITION(p1, p2)`. |
| DELETE ON             | `<delete_expr>`      | In the MERGE load mode, using delete_expr to mark which columns need to be deleted. For example, to delete columns where age > 30 during the MERGE process, use `DELETE ON age > 30`. |
| ORDER BY              | `<order_by_column>`  | Only effective for Unique Key models. Specifies the Sequence Column in the loaded data to ensure the order of the data. For example, when loading into a Unique Key table and specifying create_time as the Sequence Column, use `ORDER BY create_time`. For more information on Sequence Columns in Unique Key models, refer to the [Data Update/Sequence Columns](../../../data-operate/update/update-of-unique-model) |

**job_properties Clause**

The job_properties clause is used to specify the properties of a Routine Load job when creating it. The syntax is as follows:

```sql
PROPERTIES ("<key1>" = "<value1>"[, "<key2>" = "<value2>" ...])
```

Here are the available parameters for the job_properties clause:

| Parameter                   | Description                                                  |
| --------------------------- | ------------------------------------------------------------ |
| desired_concurrent_number   | <ul><li>Default value: 256</li><li>Description: Specifies the desired concurrency for a single load subtask (load task). It modifies the expected number of load subtasks for a Routine Load job. The actual concurrency during the load process may not be equal to the desired concurrency. The actual concurrency is determined based on factors such as the number of nodes in the cluster, the load on the cluster, and the characteristics of the data source. The actual number of loading subtasks can be calculated using the following formula:</li><li>`min(topic_partition_num, desired_concurrent_number, max_routine_load_task_concurrent_num)`</li> <li>where:</li><li>topic_partition_num: The number of partitions in the Kafka topic</li><li>desired_concurrent_number: The parameter value set</li><li>max_routine_load_task_concurrent_num: The parameter for setting the maximum task parallelism for Routine Load in the FE</li></ul> |
| max_batch_interval          | The maximum running time for each subtask, in seconds. Must be greater than 0, with a default value of 60s. max_batch_interval/max_batch_rows/max_batch_size together form the execution threshold for subtasks. If any of these parameters reaches the threshold, the load subtask ends and a new one is generated. |
| max_batch_rows              | The maximum number of rows read by each subtask. Must be greater than or equal to 200,000. The default value is 20,000,000. max_batch_interval/max_batch_rows/max_batch_size together form the execution threshold for subtasks. If any of these parameters reaches the threshold, the load subtask ends and a new one is generated. |
| max_batch_size              | The maximum number of bytes read by each subtask. The unit is bytes, and the range is from 100MB to 10GB. The default value is 1G. max_batch_interval/max_batch_rows/max_batch_size together form the execution threshold for subtasks. If any of these parameters reaches the threshold, the load subtask ends and a new one is generated. |
| max_error_number            | The maximum number of error rows allowed within a sampling window. Must be greater than or equal to 0. The default value is 0, which means no error rows are allowed. The sampling window is `max_batch_rows * 10`. If the number of error rows within the sampling window exceeds `max_error_number`, the regular job will be paused and manual intervention is required to check for data quality issues using the [SHOW ROUTINE LOAD](../../../sql-manual/sql-statements/Show-Statements/SHOW-ROUTINE-LOAD) command and `ErrorLogUrls`. Rows filtered out by the WHERE condition are not counted as error rows. |
| strict_mode                 | Whether to enable strict mode. The default value is disabled. Strict mode applies strict filtering to type conversions during the load process. If enabled, non-null original data that results in a NULL after type conversion will be filtered out. The filtering rules in strict mode are as follows:<ul><li>Derived columns (generated by functions) are not affected by strict mode.</li><li>If a column's type needs to be converted, any data with an incorrect data type will be filtered out. You can check the filtered columns due to data type errors in the `ErrorLogUrls` of [SHOW ROUTINE LOAD](../../../sql-manual/sql-statements/Show-Statements/SHOW-ROUTINE-LOAD).</li><li>For columns with range restrictions, if the original data can be successfully converted but falls outside the declared range, strict mode does not affect it. For example, if the type is decimal(1,0) and the original data is 10, it can be converted but is not within the range declared for the column. Strict mode does not affect this type of data. For more details, see [Strict Mode](../../../data-operate/import/error-data-handling#maximum-error-rate).</li></ul> |
| timezone                    | Specifies the time zone used by the load job. The default is to use the session's timezone parameter. This parameter affects the results of all timezone-related functions involved in the load. |
| format                      | Specifies the data format for the load. The default is CSV, and JSON format is supported. |
| jsonpaths                   | When the data format is JSON, jsonpaths can be used to specify the JSON paths to extract data from nested structures. It is a JSON array of strings, where each string represents a JSON path. |
| json_root                 | When importing JSON format data, you can specify the root node of the JSON data through json_root. Doris will extract and parse elements from the root node. Default is empty. For example, specify the JSON root node with: `"json_root" = "$.RECORDS"` |
| strip_outer_array         | When importing JSON format data, if strip_outer_array is true, it indicates that the JSON data is presented as an array, and each element in the data will be treated as a row. Default value is false. Typically, JSON data in Kafka might be represented as an array with square brackets `[]` in the outermost layer. In this case, you can specify `"strip_outer_array" = "true"` to consume Topic data in array mode. For example, the following data will be parsed into two rows: `[{"user_id":1,"name":"Emily","age":25},{"user_id":2,"name":"Benjamin","age":35}]` |
| send_batch_parallelism    | Used to set the parallelism of sending batch data. If the parallelism value exceeds the `max_send_batch_parallelism_per_job` in BE configuration, the coordinating BE will use the value of `max_send_batch_parallelism_per_job`. |
| load_to_single_tablet     | Supports importing data to only one tablet in the corresponding partition per task. Default value is false. This parameter can only be set when importing data to OLAP tables with random bucketing. |
| partial_columns           | Specifies whether to enable partial column update feature. Default value is false. This parameter can only be set when the table model is Unique and uses Merge on Write. Multi-table streaming does not support this parameter. For details, refer to [Partial Column Update](../../../data-operate/update/update-of-unique-model) |
| max_filter_ratio          | The maximum allowed filter ratio within the sampling window. Must be between 0 and 1 inclusive. Default value is 1.0, indicating any error rows can be tolerated. The sampling window is `max_batch_rows * 10`. If the ratio of error rows to total rows within the sampling window exceeds `max_filter_ratio`, the routine job will be suspended and require manual intervention to check data quality issues. Rows filtered by WHERE conditions are not counted as error rows. |
| enclose                   | Specifies the enclosing character. When CSV data fields contain line or column separators, a single-byte character can be specified as an enclosing character for protection to prevent accidental truncation. For example, if the column separator is "," and the enclosing character is "'", the data "a,'b,c'" will have "b,c" parsed as one field. |
| escape                    | Specifies the escape character. Used to escape characters in fields that are identical to the enclosing character. For example, if the data is "a,'b,'c'", the enclosing character is "'", and you want "b,'c" to be parsed as one field, you need to specify a single-byte escape character, such as "\", and modify the data to "a,'b,\'c'". |

These parameters can be used to customize the behavior of a Routine Load job according to your specific requirements.

**04 data_source_properties Clause**

When creating a Routine Load job, you can specify the data_source_properties clause to specify properties of the Kafka data source. The syntax is as follows:

```sql
FROM KAFKA ("<key1>" = "<value1>"[, "<key2>" = "<value2>" ...])
```

The available options for the data_source_properties clause are as follows:

| Parameter         | Description                                                  |
| ----------------- | ------------------------------------------------------------ |
| kafka_broker_list | Specifies the connection information for Kafka brokers. The format is `<kafka_broker_ip>:<kafka_port>`. Multiple brokers are separated by commas. For example, to specify a Broker List with the default port 9092, you can use the following command: `"kafka_broker_list" = "<broker1_ip>:9092,<broker2_ip>:9092"` |
| kafka_topic       | Specifies the Kafka topic to subscribe to. A load job can only consume one Kafka topic. |
| kafka_partitions  | Specifies the Kafka partitions to subscribe to. If not specified, all partitions are consumed by default. |
| kafka_offsets     | Specifies the starting consumption offset for Kafka partitions. If a timestamp is specified, consumption starts from the nearest offset equal to or greater than that timestamp. The offset can be a specific offset greater than or equal to 0, or it can use the following formats:<ul><li>OFFSET_BEGINNING: Starts consuming from the position where there is data.</li><li>OFFSET_END: Starts consuming from the end.</li><li>Timestamp format, e.g., "2021-05-22 11:00:00"</li><li>If not specified, consumption starts from `OFFSET_END` for all partitions under the topic.</li><li>Multiple starting consumption offsets can be specified, separated by commas, such as `"kafka_offsets" = "101,0,OFFSET_BEGINNING,OFFSET_END"` or `"kafka_offsets" = "2021-05-22 11:00:00,2021-05-22 11:00:00"`</li><li>Note that timestamp format cannot be mixed with OFFSET format.</li></ul> |
| property          | Specifies custom Kafka parameters. This is equivalent to the "--property" parameter in the Kafka shell. When the value of a parameter is a file, the keyword "FILE:" needs to be added before the value. For creating a file, you can refer to the [CREATE FILE](../../../sql-manual/sql-statements/Data-Definition-Statements/Create/CREATE-FILE) command documentation. For more supported custom parameters, you can refer to the client-side configuration options in the official [CONFIGURATION](https://github.com/confluentinc/librdkafka/blob/master/CONFIGURATION.md) documentation of librdkafka. For example: `"property.client.id" = "12345"`, `"property.group.id" = "group_id_0"`, `"property.ssl.ca.location" = "FILE:ca.pem"` |

By configuring the Kafka property parameter in the `data_source_properties`, you can set up security access options. Currently, Doris supports various Kafka security protocols such as plaintext (default), SSL, PLAIN, and Kerberos.

### Load Status

You can check the status of a load job using the `SHOW ROUTINE LOAD` command. The syntax for the command is as follows:

```sql
SHOW [ALL] ROUTINE LOAD [FOR jobName];
```

For example, executing `SHOW ROUTINE LOAD` will return a result set similar to the following:

```sql
mysql> SHOW ROUTINE LOAD FOR testdb.example_routine_load\G
*************************** 1. row ***************************
                  Id: 12025
                Name: example_routine_load
          CreateTime: 2024-01-15 08:12:42
           PauseTime: NULL
             EndTime: NULL
              DbName: default_cluster:testdb
           TableName: test_routineload_tbl
        IsMultiTable: false
               State: RUNNING
      DataSourceType: KAFKA
      CurrentTaskNum: 1
       JobProperties: {"max_batch_rows":"200000","timezone":"America/New_York","send_batch_parallelism":"1","load_to_single_tablet":"false","column_separator":"','","line_delimiter":"\n","current_concurrent_number":"1","delete":"*","partial_columns":"false","merge_type":"APPEND","exec_mem_limit":"2147483648","strict_mode":"false","jsonpaths":"","max_batch_interval":"10","max_batch_size":"104857600","fuzzy_parse":"false","partitions":"*","columnToColumnExpr":"user_id,name,age","whereExpr":"*","desired_concurrent_number":"5","precedingFilter":"*","format":"csv","max_error_number":"0","max_filter_ratio":"1.0","json_root":"","strip_outer_array":"false","num_as_string":"false"}
DataSourceProperties: {"topic":"test-topic","currentKafkaPartitions":"0","brokerList":"192.168.88.62:9092"}
    CustomProperties: {"kafka_default_offsets":"OFFSET_BEGINNING","group.id":"example_routine_load_73daf600-884e-46c0-a02b-4e49fdf3b4dc"}
           Statistic: {"receivedBytes":28,"runningTxns":[],"errorRows":0,"committedTaskNum":3,"loadedRows":3,"loadRowsRate":0,"abortedTaskNum":0,"errorRowsAfterResumed":0,"totalRows":3,"unselectedRows":0,"receivedBytesRate":0,"taskExecuteTimeMs":30069}
            Progress: {"0":"2"}
                 Lag: {"0":0}
ReasonOfStateChanged:
        ErrorLogUrls:
            OtherMsg:
                User: root
             Comment:
1 row in set (0.00 sec)
```

The columns in the result set provide the following information:

| Column Name          | Description                                                  |
| -------------------- | ------------------------------------------------------------ |
| Id                   | The ID of the load job, automatically generated by Doris.    |
| Name                 | The name of the load job.                                    |
| CreateTime           | The time when the job was created.                           |
| PauseTime            | The time when the job was last paused.                       |
| EndTime              | The time when the job ended.                                 |
| DbName               | The name of the associated database.                         |
| TableName            | The name of the associated table. For multi-table scenarios, it is displayed as "multi-table". |
| IsMultiTbl           | Indicates whether it is a multi-table load.                  |
| State                | The running state of the job, which can have five values: <ul><li> NEED_SCHEDULE: The job is waiting to be scheduled. After the CREATE ROUTINE LOAD or RESUME ROUTINE LOAD command, the job enters the NEED_SCHEDULE state.</li><li>RUNNING: The job is currently running.</li><li>PAUSED: The job has been paused and can be resumed using the RESUME ROUTINE LOAD command.</li><li>STOPPED: The job has finished and cannot be restarted.</li><li>CANCELLED: The job has been canceled.</li></ul> |
| DataSourceType       | The type of data source, which is KAFKA, in this example.    |
| CurrentTaskNum       | The current number of subtasks.                              |
| JobProperties        | Details of the job configuration.                            |
| DataSourceProperties | Details of the data source configuration.                    |
| CustomProperties     | Custom configuration properties.                             |
| Statistic            | Statistics of the job's running status.                      |
| Progress             | The job's progress. For Kafka data sources, it shows the offset consumed for each partition. For example, `{"0":"2"}` indicates that partition 0 has consumed 2 offsets. |
| Lag                  | The lag of the job. For Kafka data sources, it shows the consumption lag for each partition. For example, `{"0":10}` indicates a consumption lag of 10 for partition 0. |
| ReasonOfStateChanged | The reason for the state change of jobs.                     |
| ErrorLogUrls         | The URL(s) to view the filtered low-quality data.            |
| OtherMsg             | Other error messages.                                        |

## Load example

### Setting the Maximum Error Tolerance

1. Load sample data:

    ```sql
    1,Benjamin,18
    2,Emily,20
    3,Alexander,dirty_data
    ```

2. Create table:

    ```sql
    CREATE TABLE demo.routine_test01 (
        id       INT             NOT NULL   COMMENT "User ID",
        name     VARCHAR(30)     NOT NULL   COMMENT "Name",
        age      INT                        COMMENT "Age"
    )
    DUPLICATE KEY(`id`)
    DISTRIBUTED BY HASH(`id`) BUCKETS 1;
    ```

3. Load command:

    ```sql
    CREATE ROUTINE LOAD demo.kafka_job01 ON routine_test01
            COLUMNS TERMINATED BY ","
            PROPERTIES
            (
                "max_filter_ratio"="0.5",
                "max_error_number" = "100",
                "strict_mode" = "true"
            )
            FROM KAFKA
            (
                "kafka_broker_list" = "10.16.10.6:9092",
                "kafka_topic" = "routineLoad01",
                "property.kafka_default_offsets" = "OFFSET_BEGINNING"
            );  
    ```

4. Load result:

    ```sql
    mysql> select * from routine_test01;
    +------+------------+------+
    | id   | name       | age  |
    +------+------------+------+
    |    1 | Benjamin   |   18 |
    |    2 | Emily      |   20 |
    +------+------------+------+
    2 rows in set (0.01 sec)
    ```

### Consuming Data from a Specified Offset

1. Load sample data:

    ```sql
    1,Benjamin,18
    2,Emily,20
    3,Alexander,22
    4,Sophia,24
    5,William,26
    6,Charlotte,28
    ```

2. Create table:

    ```sql
    CREATE TABLE demo.routine_test02 (
        id       INT             NOT NULL   COMMENT "User ID",
        name     VARCHAR(30)     NOT NULL   COMMENT "Name",
        age      INT                        COMMENT "Age"
    )
    DUPLICATE KEY(`id`)
    DISTRIBUTED BY HASH(`id`) BUCKETS 1;
    ```

3. Load command:

    ```sql
    CREATE ROUTINE LOAD demo.kafka_job02 ON routine_test02
            COLUMNS TERMINATED BY ","
            FROM KAFKA
            (
                "kafka_broker_list" = "10.16.10.6:9092",
                "kafka_topic" = "routineLoad02",
                "kafka_partitions" = "0",
                "kafka_offsets" = "3"
            );
    ```

4. Load result:

    ```sql
    mysql> select * from routine_test02;
    +------+--------------+------+
    | id   | name         | age  |
    +------+--------------+------+
    |    4 | Sophia       |   24 |
    |    5 | William      |   26 |
    |    6 | Charlotte    |   28 |
    +------+--------------+------+
    3 rows in set (0.01 sec)
    ```

### Specifying the Consumer Group's group.id and client.id

1. Load sample data:

    ```sql
    1,Benjamin,18
    2,Emily,20
    3,Alexander,22
    ```

2. Create table:

    ```sql
    CREATE TABLE demo.routine_test03 (
        id       INT             NOT NULL   COMMENT "User ID",
        name     VARCHAR(30)     NOT NULL   COMMENT "Name",
        age      INT                        COMMENT "Age"
    )
    DUPLICATE KEY(`id`)
    DISTRIBUTED BY HASH(`id`) BUCKETS 1;
    ```

3. Load command:

    ```sql
    CREATE ROUTINE LOAD demo.kafka_job03 ON routine_test03
            COLUMNS TERMINATED BY ","
            FROM KAFKA
            (
                "kafka_broker_list" = "10.16.10.6:9092",
                "kafka_topic" = "routineLoad01",
                "property.group.id" = "kafka_job03",
                "property.client.id" = "kafka_client_03",
                "property.kafka_default_offsets" = "OFFSET_BEGINNING"
            );  
    ```

4. Load result:

    ```sql
    mysql> select * from routine_test03;
    +------+------------+------+
    | id   | name       | age  |
    +------+------------+------+
    |    1 | Benjamin   |   18 |
    |    2 | Emily      |   20 |
    |    3 | Alexander  |   22 |
    +------+------------+------+
    3 rows in set (0.01 sec)
    ```

### Setting load filtering conditions

1. Load sample data:

    ```sql
    1,Benjamin,18
    2,Emily,20
    3,Alexander,22
    4,Sophia,24
    5,William,26
    6,Charlotte,28
    ```

2. Create table:

    ```sql
    CREATE TABLE demo.routine_test04 (
        id       INT             NOT NULL   COMMENT "User ID",
        name     VARCHAR(30)     NOT NULL   COMMENT "Name",
        age      INT                        COMMENT "Age"
    )
    DUPLICATE KEY(`id`)
    DISTRIBUTED BY HASH(`id`) BUCKETS 1;
    ```

3. Load command:

    ```sql
    CREATE ROUTINE LOAD demo.kafka_job04 ON routine_test04
            COLUMNS TERMINATED BY ",",
            WHERE id >= 3
            FROM KAFKA
            (
                "kafka_broker_list" = "10.16.10.6:9092",
                "kafka_topic" = "routineLoad04",
                "property.kafka_default_offsets" = "OFFSET_BEGINNING"
            );  
    ```

4. Load result:

    ```sql
    mysql> select * from routine_test04;
    +------+--------------+------+
    | id   | name         | age  |
    +------+--------------+------+
    |    4 | Sophia       |   24 |
    |    5 | William      |   26 |
    |    6 | Charlotte    |   28 |
    +------+--------------+------+
    3 rows in set (0.01 sec)
    ```

### Loading specified partition data

1. Load sample data:

    ```sql
    1,Benjamin,18,2024-02-04 10:00:00
    2,Emily,20,2024-02-05 11:00:00
    3,Alexander,22,2024-02-06 12:00:00
    ```

2. Create table:

    ```sql
    CREATE TABLE demo.routine_test05 (
        id      INT            NOT NULL  COMMENT "ID",
        name    VARCHAR(30)    NOT NULL  COMMENT "Name",
        age     INT                      COMMENT "Age",
        date    DATETIME                 COMMENT "Date"
    )
    DUPLICATE KEY(`id`)
    PARTITION BY RANGE(`id`)
    (PARTITION partition_a VALUES [("0"), ("1")),
    PARTITION partition_b VALUES [("1"), ("2")),
    PARTITION partition_c VALUES [("2"), ("3")))
    DISTRIBUTED BY HASH(`id`) BUCKETS 1;
    ```

3. Load command:

    ```sql
    CREATE ROUTINE LOAD demo.kafka_job05 ON routine_test05
            COLUMNS TERMINATED BY ",",
            PARTITION(partition_b)
            FROM KAFKA
            (
                "kafka_broker_list" = "10.16.10.6:9092",
                "kafka_topic" = "routineLoad05",
                "property.kafka_default_offsets" = "OFFSET_BEGINNING"
            );
    ```

4. Load result:

    ```sql
    mysql> select * from routine_test05;
    +------+----------+------+---------------------+
    | id   | name     | age  | date                |
    +------+----------+------+---------------------+
    |    1 | Benjamin |   18 | 2024-02-04 10:00:00 |
    +------+----------+------+---------------------+
    1 rows in set (0.01 sec)
    ```

### Setting Time Zone for load

1. Load sample data:

    ```sql
    1,Benjamin,18,2024-02-04 10:00:00
    2,Emily,20,2024-02-05 11:00:00
    3,Alexander,22,2024-02-06 12:00:00
    ```

2. Create table:

    ```sql
    CREATE TABLE demo.routine_test06 (
        id      INT            NOT NULL  COMMENT "id",
        name    VARCHAR(30)    NOT NULL  COMMENT "name",
        age     INT                      COMMENT "age",
        date    DATETIME                 COMMENT "date"
    )
    DUPLICATE KEY(id)
    DISTRIBUTED BY HASH(id) BUCKETS 1;
    ```

3. Load command:

    ```sql
    CREATE ROUTINE LOAD demo.kafka_job06 ON routine_test06
            COLUMNS TERMINATED BY ","
            PROPERTIES
            (
                "timezone" = "Asia/Shanghai"
            )
            FROM KAFKA
            (
                "kafka_broker_list" = "10.16.10.6:9092",
                "kafka_topic" = "routineLoad06",
                "property.kafka_default_offsets" = "OFFSET_BEGINNING"
            );  
    ```

4. Load result:

    ```sql
    mysql> select * from routine_test06;
    +------+-------------+------+---------------------+
    | id   | name        | age  | date                |
    +------+-------------+------+---------------------+
    |    1 | Benjamin    |   18 | 2024-02-04 10:00:00 |
    |    2 | Emily       |   20 | 2024-02-05 11:00:00 |
    |    3 | Alexander   |   22 | 2024-02-06 12:00:00 |
    +------+-------------+------+---------------------+
    3 rows in set (0.00 sec)
    ```

### Setting merge_type

**Specify merge_type for delete operation**

1. Load sample data:

    ```sql
    3,Alexander,22
    5,William,26
    ```

    Table data before load:

    ```sql
    mysql> SELECT * FROM routine_test07;
    +------+----------------+------+
    | id   | name           | age  |
    +------+----------------+------+
    |    1 | Benjamin       |   18 |
    |    2 | Emily          |   20 |
    |    3 | Alexander      |   22 |
    |    4 | Sophia         |   24 |
    |    5 | William        |   26 |
    |    6 | Charlotte      |   28 |
    +------+----------------+------+
    ```

2. Create table:

    ```sql
    CREATE TABLE demo.routine_test07 (
        id      INT            NOT NULL  COMMENT "id",
        name    VARCHAR(30)    NOT NULL  COMMENT "name",
        age     INT                      COMMENT "age"
    )
    UNIQUE KEY(id)
    DISTRIBUTED BY HASH(id) BUCKETS 1;
    ```

3. Load command:

    ```sql
    CREATE ROUTINE LOAD demo.kafka_job07 ON routine_test07
            WITH DELETE
            COLUMNS TERMINATED BY ","
            FROM KAFKA
            (
                "kafka_broker_list" = "10.16.10.6:9092",
                "kafka_topic" = "routineLoad07",
                "property.kafka_default_offsets" = "OFFSET_BEGINNING"
            );  
    ```

4. Load result:

    ```sql
    mysql> SELECT * FROM routine_test07;
    +------+----------------+------+
    | id   | name           | age  |
    +------+----------------+------+
    |    1 | Benjamin       |   18 |
    |    2 | Emily          |   20 |
    |    4 | Sophia         |   24 |
    |    6 | Charlotte      |   28 |
    +------+----------------+------+
    ```

**Specify merge_type for merge operation**

1. Load sample data:

    ```sql
    1,xiaoxiaoli,28
    2,xiaoxiaowang,30
    3,xiaoxiaoliu,32
    4,dadali,34
    5,dadawang,36
    6,dadaliu,38
    ```

    Table data before load:

    ```sql
    mysql> SELECT * FROM routine_test08;
    +------+----------------+------+
    | id   | name           | age  |
    +------+----------------+------+
    |    1 | Benjamin       |   18 |
    |    2 | Emily          |   20 |
    |    3 | Alexander      |   22 |
    |    4 | Sophia         |   24 |
    |    5 | William        |   26 |
    |    6 | Charlotte      |   28 |
    +------+----------------+------+
    6 rows in set (0.01 sec)
    ```

2. Create table:

    ```sql
    CREATE TABLE demo.routine_test08 (
        id      INT            NOT NULL  COMMENT "id",
        name    VARCHAR(30)    NOT NULL  COMMENT "name",
        age     INT                      COMMENT "age"
    )
    UNIQUE KEY(id)
    DISTRIBUTED BY HASH(id) BUCKETS 1;
    ```

3. Load command:

    ```sql
    CREATE ROUTINE LOAD demo.kafka_job08 ON routine_test08
            WITH MERGE
            COLUMNS TERMINATED BY ",",
            DELETE ON id = 2
            FROM KAFKA
            (
                "kafka_broker_list" = "10.16.10.6:9092",
                "kafka_topic" = "routineLoad08",
                "property.kafka_default_offsets" = "OFFSET_BEGINNING"
            );   
    ```

4. Load result:

    ```sql
    mysql> SELECT * FROM routine_test08;
    +------+-------------+------+
    | id   | name        | age  |
    +------+-------------+------+
    |    1 | xiaoxiaoli  |   28 |
    |    3 | xiaoxiaoliu |   32 |
    |    4 | dadali      |   34 |
    |    5 | dadawang    |   36 |
    |    6 | dadaliu     |   38 |
    +------+-------------+------+
    5 rows in set (0.00 sec)
    ```

**Specifying the sequence column to be merged**

1. Load sample data:

    ```sql
    1,xiaoxiaoli,28
    2,xiaoxiaowang,30
    3,xiaoxiaoliu,32
    4,dadali,34
    5,dadawang,36
    6,dadaliu,38
    ```

    Data in the table before loading:

    ```sql
    mysql> SELECT * FROM routine_test09;
    +------+----------------+------+
    | id   | name           | age  |
    +------+----------------+------+
    |    1 | Benjamin       |   18 |
    |    2 | Emily          |   20 |
    |    3 | Alexander      |   22 |
    |    4 | Sophia         |   24 |
    |    5 | William        |   26 |
    |    6 | Charlotte      |   28 |
    +------+----------------+------+
    6 rows in set (0.01 sec)
    ```

2. Create table

    ```sql
    CREATE TABLE demo.routine_test08 (
        id      INT            NOT NULL  COMMENT "id",
        name    VARCHAR(30)    NOT NULL  COMMENT "name",
        age     INT                      COMMENT "age",
    )
    UNIQUE KEY(id)
    DISTRIBUTED BY HASH(id) BUCKETS 1
    PROPERTIES (
        "function_column.sequence_col" = "age"
    );
    ```

3. Load Command

    ```sql
    CREATE ROUTINE LOAD demo.kafka_job09 ON routine_test09
            WITH MERGE 
            COLUMNS TERMINATED BY ",",
            COLUMNS(id, name, age),
            DELETE ON id = 2,
            ORDER BY age
            PROPERTIES
            (
                "desired_concurrent_number"="1",
                "strict_mode" = "false"
            )
            FROM KAFKA
            (
                "kafka_broker_list" = "10.16.10.6:9092",
                "kafka_topic" = "routineLoad09",
                "property.kafka_default_offsets" = "OFFSET_BEGINNING"
            );   
    ```

4. Load result:

    ```sql
    mysql> SELECT * FROM routine_test09;
    +------+-------------+------+
    | id   | name        | age  |
    +------+-------------+------+
    |    1 | xiaoxiaoli  |   28 |
    |    3 | xiaoxiaoliu |   32 |
    |    4 | dadali      |   34 |
    |    5 | dadawang    |   36 |
    |    6 | dadaliu     |   38 |
    +------+-------------+------+
    5 rows in set (0.00 sec)
    ```

### Load with column mapping and derived column calculation

1. Load sample data:

    ```sql
    1,Benjamin,18
    2,Emily,20
    3,Alexander,22
    ```

2. Create table:

    ```sql
    CREATE TABLE demo.routine_test10 (
        id      INT            NOT NULL  COMMENT "id",
        name    VARCHAR(30)    NOT NULL  COMMENT "name",
        age     INT                      COMMENT "age",
        num     INT                      COMMENT "number"
    )
    DUPLICATE KEY(`id`)
    DISTRIBUTED BY HASH(`id`) BUCKETS 1;
    ```

3. Load command:

    ```sql
    CREATE ROUTINE LOAD demo.kafka_job10 ON routine_test10
            COLUMNS TERMINATED BY ",",
            COLUMNS(id, name, age, num=age*10)
            FROM KAFKA
            (
                "kafka_broker_list" = "10.16.10.6:9092",
                "kafka_topic" = "routineLoad10",
                "property.kafka_default_offsets" = "OFFSET_BEGINNING"
            );  
    ```

4. Load result:

    ```sql
    mysql> SELECT * FROM routine_test10;
    +------+----------------+------+------+
    | id   | name           | age  | num  |
    +------+----------------+------+------+
    |    1 | Benjamin       |   18 |  180 |
    |    2 | Emily          |   20 |  200 |
    |    3 | Alexander      |   22 |  220 |
    +------+----------------+------+------+
    3 rows in set (0.01 sec)
    ```

### Load with enclosed data

1. Load sample data:

    ```sql
    1,"Benjamin",18
    2,"Emily",20
    3,"Alexander",22
    ```

2. Create table:

    ```sql
    CREATE TABLE demo.routine_test11 (
        id      INT            NOT NULL  COMMENT "id",
        name    VARCHAR(30)    NOT NULL  COMMENT "name",
        age     INT                      COMMENT "age",
        num     INT                      COMMENT "number"
    )
    DUPLICATE KEY(`id`)
    DISTRIBUTED BY HASH(`id`) BUCKETS 1;
    ```

3. Load command:

    ```sql
    CREATE ROUTINE LOAD demo.kafka_job11 ON routine_test11
            COLUMNS TERMINATED BY ","
            PROPERTIES
            (
                "desired_concurrent_number"="1",
                "enclose" = "\""
            )
            FROM KAFKA
            (
                "kafka_broker_list" = "10.16.10.6:9092",
                "kafka_topic" = "routineLoad12",
                "property.kafka_default_offsets" = "OFFSET_BEGINNING"
            );
    ```

4. Load result:

    ```sql
    mysql> SELECT * FROM routine_test11;
    +------+----------------+------+------+
    | id   | name           | age  | num  |
    +------+----------------+------+------+
    |    1 | Benjamin       |   18 |  180 |
    |    2 | Emily          |   20 |  200 |
    |    3 | Alexander      |   22 |  220 |
    +------+----------------+------+------+
    3 rows in set (0.02 sec)
    ```

### JSON Format Load

**Load JSON format data in simple mode**

1. Load sample data:

    ```sql
    { "id" : 1, "name" : "Benjamin", "age":18 }
    { "id" : 2, "name" : "Emily", "age":20 }
    { "id" : 3, "name" : "Alexander", "age":22 }
    ```

2. Create table:

    ```sql
    CREATE TABLE demo.routine_test12 (
        id      INT            NOT NULL  COMMENT "id",
        name    VARCHAR(30)    NOT NULL  COMMENT "name",
        age     INT                      COMMENT "age"
    )
    DUPLICATE KEY(`id`)
    DISTRIBUTED BY HASH(`id`) BUCKETS 1;
    ```

3. Load command:

    ```sql
    CREATE ROUTINE LOAD demo.kafka_job12 ON routine_test12
            PROPERTIES
            (
                "format" = "json"
            )
            FROM KAFKA
            (
                "kafka_broker_list" = "10.16.10.6:9092",
                "kafka_topic" = "routineLoad12",
                "property.kafka_default_offsets" = "OFFSET_BEGINNING"
            );  
    ```

4. Load result:

    ```sql
    mysql> select * from routine_test12;
    +------+----------------+------+
    | id   | name           | age  |
    +------+----------------+------+
    |    1 | Benjamin       |   18 |
    |    2 | Emily          |   20 |
    |    3 | Alexander      |   22 |
    +------+----------------+------+
    3 rows in set (0.02 sec)
    ```

**Load complex JSON format data in match mode**

1. Load sample data

    ```sql
    { "name" : "Benjamin", "id" : 1, "num":180 , "age":18 }
    { "name" : "Emily", "id" : 2, "num":200 , "age":20 }
    { "name" : "Alexander", "id" : 3, "num":220 , "age":22 }
    ```

2. Create table:

    ```sql
    CREATE TABLE demo.routine_test13 (
        id      INT            NOT NULL  COMMENT "id",
        name    VARCHAR(30)    NOT NULL  COMMENT "name",
        age     INT                      COMMENT "age",
        num     INT                      COMMENT "num"
    )
    DUPLICATE KEY(`id`)
    DISTRIBUTED BY HASH(`id`) BUCKETS 1;
    ```

3. Load command:

    ```sql
    CREATE ROUTINE LOAD demo.kafka_job13 ON routine_test13
            COLUMNS(name, id, num, age)
            PROPERTIES
            (
                "format" = "json",
                "jsonpaths" = "[\"$.name\",\"$.id\",\"$.num\",\"$.age\"]"
            )
            FROM KAFKA
            (
                "kafka_broker_list" = "10.16.10.6:9092",
                "kafka_topic" = "routineLoad13",
                "property.kafka_default_offsets" = "OFFSET_BEGINNING"
            );  
    ```

4. Load result:

    ```sql
    mysql> select * from routine_test13;
    +------+----------------+------+------+
    | id   | name           | age  | num  |
    +------+----------------+------+------+
    |    1 | Benjamin       |   18 |  180 |
    |    2 | Emily          |   20 |  200 |
    |    3 | Alexander      |   22 |  220 |
    +------+----------------+------+------+
    3 rows in set (0.01 sec)
    ```

**Loading data with specified JSON root node**

1. Load sample data

    ```sql
    {"id": 1231, "source" :{ "id" : 1, "name" : "Benjamin", "age":18 }}
    {"id": 1232, "source" :{ "id" : 2, "name" : "Emily", "age":20 }}
    {"id": 1233, "source" :{ "id" : 3, "name" : "Alexander", "age":22 }}
    ```

2. Create table:

    ```sql
    CREATE TABLE demo.routine_test14 (
        id      INT            NOT NULL  COMMENT "id",
        name    VARCHAR(30)    NOT NULL  COMMENT "name",
        age     INT                      COMMENT "age"
    )
    DUPLICATE KEY(`id`)
    DISTRIBUTED BY HASH(`id`) BUCKETS 1;
    ```

3. Load command

    ```sql
    CREATE ROUTINE LOAD demo.kafka_job14 ON routine_test14
            PROPERTIES
            (
                "format" = "json",
                "json_root" = "$.source"
            )
            FROM KAFKA
            (
                "kafka_broker_list" = "10.16.10.6:9092",
                "kafka_topic" = "routineLoad14",
                "property.kafka_default_offsets" = "OFFSET_BEGINNING"
            );  
    ```

4. Load result

    ```sql
    mysql> select * from routine_test14;
    +------+----------------+------+
    | id   | name           | age  |
    +------+----------------+------+
    |    1 | Benjamin       |   18 |
    |    2 | Emily          |   20 |
    |    3 | Alexander      |   22 |
    +------+----------------+------+
    3 rows in set (0.01 sec)
    ```

**Loading data with column mapping and derived column calculation**

1. Load sample data:

    ```sql
    { "id" : 1, "name" : "Benjamin", "age":18 }
    { "id" : 2, "name" : "Emily", "age":20 }
    { "id" : 3, "name" : "Alexander", "age":22 }
    ```

2. Create table:

    ```sql
    CREATE TABLE demo.routine_test15 (
        id      INT            NOT NULL  COMMENT "id",
        name    VARCHAR(30)    NOT NULL  COMMENT "name",
        age     INT                      COMMENT "age",
        num     INT                      COMMENT "num"
    )
    DUPLICATE KEY(`id`)
    DISTRIBUTED BY HASH(`id`) BUCKETS 1;
    ```

3. Load command:

    ```sql
    CREATE ROUTINE LOAD demo.kafka_job15 ON routine_test15
            COLUMNS(id, name, age, num=age*10)
            PROPERTIES
            (
                "format" = "json",
            )
            FROM KAFKA
            (
                "kafka_broker_list" = "10.16.10.6:9092",
                "kafka_topic" = "routineLoad15",
                "property.kafka_default_offsets" = "OFFSET_BEGINNING"
            );  
    ```

4. Load result:

    ```sql
    mysql> select * from routine_test15;
    +------+----------------+------+------+
    | id   | name           | age  | num  |
    +------+----------------+------+------+
    |    1 | Benjamin       |   18 |  180 |
    |    2 | Emily          |   20 |  200 |
    |    3 | Alexander      |   22 |  220 |
    +------+----------------+------+------+
    3 rows in set (0.01 sec)
    ```

### Loading Complex Data Types

**Load Array Data Type**

1. Load sample data:

    ```sql
    { "id" : 1, "name" : "Benjamin", "age":18, "array":[1,2,3,4,5]}
    { "id" : 2, "name" : "Emily", "age":20, "array":[6,7,8,9,10]}
    { "id" : 3, "name" : "Alexander", "age":22, "array":[11,12,13,14,15]}
    ```

2. Create table:

    ```sql
    CREATE TABLE demo.routine_test16
    (
        id      INT             NOT NULL  COMMENT "id",
        name    VARCHAR(30)     NOT NULL  COMMENT "name",
        age     INT                       COMMENT "age",
        array   ARRAY<int(11)>  NULL      COMMENT "test array column"
    )
    DUPLICATE KEY(`id`)
    DISTRIBUTED BY HASH(`id`) BUCKETS 1;
    ```

3. Load command:

    ```sql
    CREATE ROUTINE LOAD demo.kafka_job16 ON routine_test16
            PROPERTIES
            (
                "format" = "json"
            )
            FROM KAFKA
            (
                "kafka_broker_list" = "10.16.10.6:9092",
                "kafka_topic" = "routineLoad16",
                "property.kafka_default_offsets" = "OFFSET_BEGINNING"
            );  
    ```

4. Load result:

    ```sql
    mysql> select * from routine_test16;
    +------+----------------+------+----------------------+
    | id   | name           | age  | array                |
    +------+----------------+------+----------------------+
    |    1 | Benjamin       |   18 | [1, 2, 3, 4, 5]      |
    |    2 | Emily          |   20 | [6, 7, 8, 9, 10]     |
    |    3 | Alexander      |   22 | [11, 12, 13, 14, 15] |
    +------+----------------+------+----------------------+
    3 rows in set (0.00 sec)
    ```

**Loading Map Data Type**

1. Load sample data:

    ```sql
    { "id" : 1, "name" : "Benjamin", "age":18, "map":{"a": 100, "b": 200}}
    { "id" : 2, "name" : "Emily", "age":20, "map":{"c": 300, "d": 400}}
    { "id" : 3, "name" : "Alexander", "age":22, "map":{"e": 500, "f": 600}}
    ```

2. Create table:

    ```sql
    CREATE TABLE demo.routine_test17 (
        id      INT                 NOT NULL  COMMENT "id",
        name    VARCHAR(30)         NOT NULL  COMMENT "name",
        age     INT                           COMMENT "age",
        map     Map<STRING, INT>    NULL      COMMENT "test column"
    )
    DUPLICATE KEY(`id`)
    DISTRIBUTED BY HASH(`id`) BUCKETS 1;
    ```

3. Load command:

    ```sql
    CREATE ROUTINE LOAD demo.kafka_job17 ON routine_test17
        PROPERTIES
            (
                "format" = "json"
            )
            FROM KAFKA
            (
                "kafka_broker_list" = "10.16.10.6:9092",
                "kafka_topic" = "routineLoad17",
                "property.kafka_default_offsets" = "OFFSET_BEGINNING"
            );  
    ```

4. Load result:

    ```sql
    mysql> select * from routine_test17;
    +------+----------------+------+--------------------+
    | id   | name           | age  | map                |
    +------+----------------+------+--------------------+
    |    1 | Benjamin       |   18 | {"a":100, "b":200} |
    |    2 | Emily          |   20 | {"c":300, "d":400} |
    |    3 | Alexander      |   22 | {"e":500, "f":600} |
    +------+----------------+------+--------------------+
    3 rows in set (0.01 sec)
    ```

**Loading Bitmap Data Type**

1. Load sample data

    ```sql
    { "id" : 1, "name" : "Benjamin", "age":18, "bitmap_id":243}
    { "id" : 2, "name" : "Emily", "age":20, "bitmap_id":28574}
    { "id" : 3, "name" : "Alexander", "age":22, "bitmap_id":8573}
    ```

2. Create table:

    ```sql
    CREATE TABLE demo.routine_test18 (
        id        INT            NOT NULL      COMMENT "id",
        name      VARCHAR(30)    NOT NULL      COMMENT "name",
        age       INT                          COMMENT "age",
        bitmap_id INT                          COMMENT "test",
        device_id BITMAP         BITMAP_UNION  COMMENT "test column"
    )
    AGGREGATE KEY (`id`,`name`,`age`,`bitmap_id`)
    DISTRIBUTED BY HASH(`id`) BUCKETS 1;
    ```

3. Load command:

    ```sql
    CREATE ROUTINE LOAD demo.kafka_job18 ON routine_test18
            COLUMNS(id, name, age, bitmap_id, device_id=to_bitmap(bitmap_id))
            PROPERTIES
            (
                "format" = "json"
            )
            FROM KAFKA
            (
                "kafka_broker_list" = "10.16.10.6:9092",
                "kafka_topic" = "routineLoad18",
                "property.kafka_default_offsets" = "OFFSET_BEGINNING"
            );
    ```

4. Load result:

    ```sql
    mysql> select id, BITMAP_UNION_COUNT(pv) over(order by id) uv from(
        ->    select id, BITMAP_UNION(device_id) as pv
        ->    from routine_test18 
        -> group by id 
        -> ) final;
    +------+------+
    | id   | uv   |
    +------+------+
    |    1 |    1 |
    |    2 |    2 |
    |    3 |    3 |
    +------+------+
    3 rows in set (0.00 sec)
    ```

**Loading HLL Data Type**

1. Loading sample data:

    ```sql
    2022-05-05,10001,Test01,Beijing,windows
    2022-05-05,10002,Test01,Beijing,linux
    2022-05-05,10003,Test01,Beijing,macos
    2022-05-05,10004,Test01,Hebei,windows
    2022-05-06,10001,Test01,Shanghai,windows
    2022-05-06,10002,Test01,Shanghai,linux
    2022-05-06,10003,Test01,Jiangsu,macos
    2022-05-06,10004,Test01,Shaanxi,windows
    ```

2. Create table:

    ```sql
    create table demo.routine_test19 (
        dt        DATE,
        id        INT,
        name      VARCHAR(10),
        province  VARCHAR(10),
        os        VARCHAR(10),
        pv        hll hll_union
    )
    Aggregate KEY (dt,id,name,province,os)
    distributed by hash(id) buckets 10;
    ```

3. Load command:

    ```sql
    CREATE ROUTINE LOAD demo.kafka_job19 ON routine_test19
            COLUMNS TERMINATED BY ",",
            COLUMNS(dt, id, name, province, os, pv=hll_hash(id))
            FROM KAFKA
            (
                "kafka_broker_list" = "10.16.10.6:9092",
                "kafka_topic" = "routineLoad19",
                "property.kafka_default_offsets" = "OFFSET_BEGINNING"
            );  
    ```

4. Load result:

    ```sql
    mysql> select * from routine_test19;
    +------------+-------+----------+----------+---------+------+
    | dt         | id    | name     | province | os      | pv   |
    +------------+-------+----------+----------+---------+------+
    | 2022-05-05 | 10001 | Test01   | Beijing     | windows | NULL |
    | 2022-05-06 | 10001 | Test01   | Shanghai    | windows | NULL |
    | 2022-05-05 | 10002 | Test01   | Beijing     | linux   | NULL |
    | 2022-05-06 | 10002 | Test01   | Shanghai    | linux   | NULL |
    | 2022-05-05 | 10004 | Test01   | Heibei      | windows | NULL |
    | 2022-05-06 | 10004 | Test01   | Shanxi      | windows | NULL |
    | 2022-05-05 | 10003 | Test01   | Beijing     | macos   | NULL |
    | 2022-05-06 | 10003 | Test01   | Jiangsu     | macos   | NULL |
    +------------+-------+----------+----------+---------+------+
    8 rows in set (0.01 sec)

    mysql> SELECT HLL_UNION_AGG(pv) FROM routine_test19;
    +-------------------+
    | hll_union_agg(pv) |
    +-------------------+
    |                 4 |
    +-------------------+
    1 row in set (0.01 sec)
    ```

### Kafka Security Authentication

**Loading Kafka data with SSL authentication**

1. Loading sample data:

    ```sql
    { "id" : 1, "name" : "Benjamin", "age":18 }
    { "id" : 2, "name" : "Emily", "age":20 }
    { "id" : 3, "name" : "Alexander", "age":22 }
    ```

2. Create table:

    ```sql
    CREATE TABLE demo.routine_test20 (
        id      INT            NOT NULL  COMMENT "id",
        name    VARCHAR(30)    NOT NULL  COMMENT "name",
        age     INT                      COMMENT "age"
    )
    DUPLICATE KEY(`id`)
    DISTRIBUTED BY HASH(`id`) BUCKETS 1;
    ```

3. Load command:

    ```sql
    CREATE ROUTINE LOAD demo.kafka_job20 ON routine_test20
            PROPERTIES
            (
                "format" = "json"
            )
            FROM KAFKA
            (
                "kafka_broker_list" = "192.168.100.129:9092",
                "kafka_topic" = "routineLoad21",
                "property.security.protocol" = "ssl",
                "property.ssl.ca.location" = "FILE:ca.pem",
                "property.ssl.certificate.location" = "FILE:client.pem",
                "property.ssl.key.location" = "FILE:client.key",
                "property.ssl.key.password" = "ssl_passwd"
            );  
    ```

4. Load result:

    ```sql
    mysql> select * from routine_test20;
    +------+----------------+------+
    | id   | name           | age  |
    +------+----------------+------+
    |    1 | Benjamin       |   18 |
    |    2 | Emily          |   20 |
    |    3 | Alexander      |   22 |
    +------+----------------+------+
    3 rows in set (0.01 sec)
    ```

**Loading Kafka data with Kerberos authentication**

1. Loading sample data:

    ```sql
    { "id" : 1, "name" : "Benjamin", "age":18 }
    { "id" : 2, "name" : "Emily", "age":20 }
    { "id" : 3, "name" : "Alexander", "age":22 }
    ```

2. Create table:

    ```sql
    CREATE TABLE demo.routine_test21 (
        id      INT            NOT NULL  COMMENT "id",
        name    VARCHAR(30)    NOT NULL  COMMENT "name",
        age     INT                      COMMENT "age"
    )
    DUPLICATE KEY(`id`)
    DISTRIBUTED BY HASH(`id`) BUCKETS 1;
    ```

3. Load command:

    ```sql
    CREATE ROUTINE LOAD demo.kafka_job21 ON routine_test21
            PROPERTIES
            (
                "format" = "json"
            )
            FROM KAFKA
            (
                "kafka_broker_list" = "192.168.100.129:9092",
                "kafka_topic" = "routineLoad21",
                "property.security.protocol" = "SASL_PLAINTEXT",
                "property.sasl.kerberos.service.name" = "kafka",
                "property.sasl.kerberos.keytab" = "/etc/krb5.keytab",
                "property.sasl.kerberos.keytab"="/opt/third/kafka/kerberos/kafka_client.keytab",
                "property.sasl.kerberos.principal" = "clients/stream.dt.local@EXAMPLE.COM"
            );  
    ```

4. Load result:

    ```sql
    mysql> select * from routine_test21;
    +------+----------------+------+
    | id   | name           | age  |
    +------+----------------+------+
    |    1 | Benjamin       |   18 |
    |    2 | Emily          |   20 |
    |    3 | Alexander      |   22 |
    +------+----------------+------+
    3 rows in set (0.01 sec)
    ```

**Loading Kafka data with PLAIN authentication in Kafka cluster**

1. Loading sample data:

    ```sql
    { "id" : 1, "name" : "Benjamin", "age":18 }
    { "id" : 2, "name" : "Emily", "age":20 }
    { "id" : 3, "name" : "Alexander", "age":22 }
    ```

2. Create table:

    ```sql
    CREATE TABLE demo.routine_test22 (
        id      INT            NOT NULL  COMMENT "id",
        name    VARCHAR(30)    NOT NULL  COMMENT "name",
        age     INT                      COMMENT "age"
    )
    DUPLICATE KEY(`id`)
    DISTRIBUTED BY HASH(`id`) BUCKETS 1;
    ```

3. Load command:

    ```sql
    CREATE ROUTINE LOAD demo.kafka_job22 ON routine_test22
            PROPERTIES
            (
                "format" = "json"
            )
            FROM KAFKA
            (
                "kafka_broker_list" = "192.168.100.129:9092",
                "kafka_topic" = "routineLoad22",
                "property.security.protocol"="SASL_PLAINTEXT",
                "property.sasl.mechanism"="PLAIN",
                "property.sasl.username"="admin",
                "property.sasl.password"="admin"
            );  
    ```

4. Load result

    ```sql
    mysql> select * from routine_test22;
    +------+----------------+------+
    | id   | name           | age  |
    +------+----------------+------+
    |    1 | Benjamin       |   18 |
    |    2 | Emily          |   20 |
    |    3 | Alexander      |   22 |
    +------+----------------+------+
    3 rows in set (0.02 sec)
    ```

### Single-task Loading to Multiple Tables  

Create a Kafka routine dynamic table load task named "test1" for the "example_db". Specify the column delimiter, group.id, and client.id. Automatically consume all partitions and start subscribing from the available data position (OFFSET_BEGINNING).

Assuming we need to load data from Kafka into tables "tbl1" and "tbl2" in the "example_db", we create a Routine Load task named "test1". This task will load data from Kafka's topic `my_topic` into both "tbl1" and "tbl2" simultaneously. This way, we can load data from Kafka into two tables using a single routine load task.

```sql
CREATE ROUTINE LOAD example_db.test1
FROM KAFKA
(
    "kafka_broker_list" = "broker1:9092,broker2:9092,broker3:9092",
    "kafka_topic" = "my_topic",
    "property.kafka_default_offsets" = "OFFSET_BEGINNING"
);
```

Currently, only extracting the table name from the Value field of Kafka is supported. The format should be as follows, using JSON as an example: `table_name|{"col1": "val1", "col2": "val2"}`, where `tbl_name` is the table name and `|` is used as the separator between the table name and the table data. The same format applies to CSV data, such as `table_name|val1,val2,val3`. Note that the `table_name` here must be consistent with the table name in Doris, otherwise the load will fail. Note that dynamic tables do not support the column_mapping configuration described later.

### Strict Mode Load

Create a Kafka routine load task named "test1" for the "example_db" and "example_tbl". The load task is set to strict mode.

```sql
CREATE ROUTINE LOAD example_db.test1 ON example_tbl
COLUMNS(k1, k2, k3, v1, v2, v3 = k1 * 100),
PRECEDING FILTER k1 = 1,
WHERE k1 < 100 and k2 like "%doris%"
PROPERTIES
(
    "strict_mode" = "true"
)
FROM KAFKA
(
    "kafka_broker_list" = "broker1:9092,broker2:9092,broker3:9092",
    "kafka_topic" = "my_topic"
);
```

## More Details

Refer to the SQL manual on [Routine Load](../../../sql-manual/sql-statements/Data-Manipulation-Statements/Load/CREATE-ROUTINE-LOAD). You can also enter `HELP ROUTINE LOAD` in the client command line for more help.