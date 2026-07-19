---
{
    "title": "DataX Doriswriter",
    "language": "en",
    "description": "Describes how to use DataX Doriswriter to synchronize data from sources such as MySQL, Oracle, and SQL Server to Apache Doris through Stream Load, including parameter configuration and import examples.",
    "keywords": [
        "DataX Doriswriter",
        "DataX import to Doris",
        "Stream Load",
        "MySQL sync to Doris"
    ]
}
---

<!-- Knowledge type: Procedure -->
<!-- Applicable scenario: Data integration / Offline batch synchronization -->

The [DataX](https://github.com/alibaba/DataX) Doriswriter plugin synchronizes data from various sources such as MySQL, Oracle, and SQL Server to Doris through Stream Load.

If you already use DataX for offline data synchronization, or if you need to write data from a DataX-supported source into Doris, you can use Doriswriter as the Writer plugin for DataX. This document follows the user configuration path to describe how to obtain the plugin, configure parameters, run a job, and explain the considerations for JSON and CSV import formats.

Using DataX Doriswriter mainly involves the following steps:

1. Obtain the DataX installation package, or compile the Doriswriter plugin yourself.
2. Configure the connection, batch, and Stream Load parameters that Doriswriter needs to write to Doris.
3. Write a DataX job script and run the synchronization job.
4. Adjust `loadProps` based on the data format to avoid delimiter conflicts.

## Pre-flight check

| Item | Description |
| --- | --- |
| DataX service | Doriswriter must be used together with the DataX service. |
| Source support | DataX supports many data sources. For the supported list, see [DataX supported data channels](https://github.com/alibaba/DataX#support-data-channels). |
| Doris import entry | Doriswriter writes to Doris through Stream Load. `loadUrl` must be configured with the `http_port` of an FE node. |

## Obtain DataX and Doriswriter

### Download the DataX installation package directly

DataX provides an installation package that you can use directly. For the download link, see [DataX installation package download](https://github.com/alibaba/DataX?tab=readme-ov-file#download-datax%E4%B8%8B%E8%BD%BD%E5%9C%B0%E5%9D%80).

### Compile the Doriswriter plugin yourself

To compile the Doriswriter plugin yourself, first download the [Doriswriter plugin source code](https://github.com/apache/doris/tree/master/extension/DataX).

1. Run `init-env.sh`.
2. Compile the `doriswriter` plugin separately:

    ```shell
    mvn clean install -pl plugin-rdbms-util,doriswriter -DskipTests
    ```

To compile the entire DataX project, see [DataX Quick Start](https://github.com/alibaba/DataX/blob/master/userGuid.md#quick-start).

#### Resolve the `datax-all` dependency error

If the following error appears during compilation:

```text
Could not find artifact com.alibaba.datax:datax-all:pom:0.0.1-SNAPSHOT ...
```

Resolve it as follows:

1. Download [alibaba-datax-maven-m2-20210928.tar.gz](https://doris-thirdparty-repo.bj.bcebos.com/thirdparty/alibaba-datax-maven-m2-20210928.tar.gz).
2. After extraction, copy the resulting `alibaba/datax/` directory into the `.m2/repository/com/alibaba/` directory used by your local Maven, and then compile again.

## Configure Doriswriter parameters

<!-- Knowledge type: Configuration parameters -->
<!-- Applicable scenario: DataX job configuration -->

Doriswriter parameters control the Doris connection, target database and table, batch size, retry on failure, and Stream Load request properties.

| Parameter | Required | Default | Description |
| --- | --- | --- | --- |
| `jdbcUrl` | Yes | None | The JDBC connection string for Doris, used to execute `preSql` or `postSql`. |
| `loadUrl` | Yes | None | The Stream Load target, in the format `ip:port`, where `ip` is the FE node IP and `port` is the FE node `http_port`. You can specify multiple addresses separated by commas (`,`); doriswriter accesses them in round-robin fashion. |
| `username` | Yes | None | The username for accessing the Doris database. |
| `password` | No | Empty | The password for accessing the Doris database. |
| `connection.selectedDatabase` | Yes | None | The name of the Doris database to write to. |
| `connection.table` | Yes | None | The name of the Doris table to write to. |
| `flushInterval` | No | `30000` ms | The time interval between data write batches. Setting this too small can cause Doris write blocking and return error code `-235`. If this value is too small, the import may be triggered before the row count or size threshold is reached, even when `maxBatchRows` and `batchSize` are set to large values. |
| `column` | Yes | None | The fields in the target table to write data to. These field names are used as the field names of the generated JSON data. Separate fields with commas, for example `"column": ["id", "name", "age"]`. |
| `preSql` | No | None | A standard SQL statement to run before writing data to the target table. |
| `postSql` | No | None | A standard SQL statement to run after writing data to the target table. |
| `maxBatchRows` | No | `500000` | The maximum number of rows per import batch. This parameter together with `batchSize` controls the size of each import batch; the import starts as soon as either threshold is reached. |
| `batchSize` | No | `94371840` | The maximum data volume per import batch. This parameter together with `maxBatchRows` controls the size of each import batch; the import starts as soon as either threshold is reached. |
| `maxRetries` | No | `3` | The number of retries after a batch import fails. |
| `labelPrefix` | No | `datax_doris_writer_` | The label prefix for each import job. The final label is `labelPrefix + UUID`, which guarantees global uniqueness and avoids duplicate imports. |
| `loadProps` | No | None | The Stream Load request parameters. You can configure the import data format, delimiters, and other properties. The default import format is CSV; JSON is also supported. For more parameters, see the [Stream Load documentation](../../data-operate/import/import-way/stream-load-manual.md). |

## Usage examples

### Scenario 1: Read data from a Stream and import it into Doris

For instructions on using the plugin to read data from a Stream and import it into Doris, see the [Doriswriter official example](https://github.com/apache/doris/blob/master/extension/DataX/doriswriter/doc/doriswriter.md).

### Scenario 2: Read data from MySQL and import it into Doris

The following example shows how to use DataX to read data from MySQL and write it to Doris through Doriswriter.

#### 1. Prepare the MySQL source table

```sql
CREATE TABLE `t_test` (
    `id` bigint(30) NOT NULL,
    `order_code` varchar(30) DEFAULT NULL COMMENT '',
    `line_code` varchar(30) DEFAULT NULL COMMENT '',
    `remark` varchar(30) DEFAULT NULL COMMENT '',
    `unit_no` varchar(30) DEFAULT NULL COMMENT '',
    `unit_name` varchar(30) DEFAULT NULL COMMENT '',
    `price` decimal(12,2) DEFAULT NULL COMMENT '',
    PRIMARY KEY (`id`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 ROW_FORMAT=DYNAMIC COMMENT='';
```

#### 2. Prepare the Doris target table

```sql
CREATE TABLE `ods_t_test` (
    `id` bigint(30) NOT NULL,
    `order_code` varchar(30) DEFAULT NULL COMMENT '',
    `line_code` varchar(30) DEFAULT NULL COMMENT '',
    `remark` varchar(30) DEFAULT NULL COMMENT '',
    `unit_no` varchar(30) DEFAULT NULL COMMENT '',
    `unit_name` varchar(30) DEFAULT NULL COMMENT '',
    `price` decimal(12,2) DEFAULT NULL COMMENT ''
) ENGINE=OLAP
UNIQUE KEY(`id`, `order_code`)
DISTRIBUTED BY HASH(`order_code`) BUCKETS 1
PROPERTIES (
    "replication_allocation" = "tag.location.default: 3",
    "in_memory" = "false",
    "storage_format" = "V2"
);
```

#### 3. Create the DataX job script

Create `my_import.json`. In real use, replace the source database and table in `reader`, and the Doris target database and table, username, and password in `writer` with values that match your environment.

```json
{
    "job": {
        "content": [
            {
                "reader": {
                    "name": "mysqlreader",
                    "parameter": {
                        "column": ["id", "order_code", "line_code", "remark", "unit_no", "unit_name", "price"],
                        "connection": [
                            {
                                "jdbcUrl": ["jdbc:mysql://localhost:3306/demo"],
                                "table": ["employees_1"]
                            }
                        ],
                        "username": "root",
                        "password": "xxxxx",
                        "where": ""
                    }
                },
                "writer": {
                    "name": "doriswriter",
                    "parameter": {
                        "loadUrl": ["127.0.0.1:8030"],
                        "column": ["id", "order_code", "line_code", "remark", "unit_no", "unit_name", "price"],
                        "username": "root",
                        "password": "xxxxxx",
                        "postSql": ["select count(1) from all_employees_info"],
                        "preSql": [],
                        "flushInterval": 30000,
                        "connection": [
                            {
                                "jdbcUrl": "jdbc:mysql://127.0.0.1:9030/demo",
                                "selectedDatabase": "demo",
                                "table": ["all_employees_info"]
                            }
                        ],
                        "loadProps": {
                            "format": "json",
                            "strip_outer_array": "true",
                            "line_delimiter": "\\x02"
                        }
                    }
                }
            }
        ],
        "setting": {
            "speed": {
                "channel": "1"
            }
        }
    }
}
```

#### 4. Configure the import data format

The example above imports data in JSON format:

```json
"loadProps": {
    "format": "json",
    "strip_outer_array": "true",
    "line_delimiter": "\\x02"
}
```

Notes for the JSON format:

1. `line_delimiter` defaults to a newline character, which can conflict with values in your data. Use a special or invisible character to avoid import errors.
2. `strip_outer_array` indicates that one batch of imported data contains multiple rows. When parsing, Doris expands the outer array and parses each Object inside it as a separate row.
3. For more Stream Load parameters, see the [Stream Load documentation](../../data-operate/import/import-way/stream-load-manual.md).

To use the CSV format, configure as follows:

```json
"loadProps": {
    "format": "csv",
    "column_separator": "\\x01",
    "line_delimiter": "\\x02"
}
```

For the CSV format, pay particular attention to the row and column delimiters to avoid conflicts with special characters in your data. Hidden characters are recommended. The default column separator is `\t`, and the default line delimiter is `\n`.

#### 5. Run the DataX job

Run the job with the following command. For more ways to run jobs, see the [DataX user guide](https://github.com/alibaba/DataX/blob/master/userGuid.md).

```shell
python bin/datax.py my_import.json
```

After it runs successfully, you should see logs similar to the following:

```text
2022-11-16 14:28:54.012 [job-0] INFO  JobContainer - jobContainer starts to do prepare ...
2022-11-16 14:28:54.012 [job-0] INFO  JobContainer - DataX Reader.Job [mysqlreader] do prepare work .
2022-11-16 14:28:54.013 [job-0] INFO  JobContainer - DataX Writer.Job [doriswriter] do prepare work .
2022-11-16 14:28:54.020 [job-0] INFO  JobContainer - jobContainer starts to do split ...
2022-11-16 14:28:54.020 [job-0] INFO  JobContainer - Job set Channel-Number to 1 channels.
2022-11-16 14:28:54.023 [job-0] INFO  JobContainer - DataX Reader.Job [mysqlreader] splits to [1] tasks.
2022-11-16 14:28:54.023 [job-0] INFO  JobContainer - DataX Writer.Job [doriswriter] splits to [1] tasks.
2022-11-16 14:28:54.033 [job-0] INFO  JobContainer - jobContainer starts to do schedule ...
2022-11-16 14:28:54.036 [job-0] INFO  JobContainer - Scheduler starts [1] taskGroups.
2022-11-16 14:28:54.037 [job-0] INFO  JobContainer - Running by standalone Mode.
2022-11-16 14:28:54.041 [taskGroup-0] INFO  TaskGroupContainer - taskGroupId=[0] start [1] channels for [1] tasks.
2022-11-16 14:28:54.043 [taskGroup-0] INFO  Channel - Channel set byte_speed_limit to -1, No bps activated.
2022-11-16 14:28:54.043 [taskGroup-0] INFO  Channel - Channel set record_speed_limit to -1, No tps activated.
2022-11-16 14:28:54.049 [taskGroup-0] INFO  TaskGroupContainer - taskGroup[0] taskId[0] attemptCount[1] is started
2022-11-16 14:28:54.052 [0-0-0-reader] INFO  CommonRdbmsReader$Task - Begin to read record by Sql: [select taskid,projectid,taskflowid,templateid,template_name,status_task from dwd_universal_tb_task
] jdbcUrl:[jdbc:mysql://localhost:3306/demo?yearIsDateType=false&zeroDateTimeBehavior=convertToNull&tinyInt1isBit=false&rewriteBatchedStatements=true].
Wed Nov 16 14:28:54 GMT+08:00 2022 WARN: Establishing SSL connection without server's identity verification is not recommended. According to MySQL 5.5.45+, 5.6.26+ and 5.7.6+ requirements SSL connection must be established by default if explicit option isn't set. For compliance with existing applications not using SSL the verifyServerCertificate property is set to 'false'. You need either to explicitly disable SSL by setting useSSL=false, or set useSSL=true and provide truststore for server certificate verification.
2022-11-16 14:28:54.071 [0-0-0-reader] INFO  CommonRdbmsReader$Task - Finished read record by Sql: [select taskid,projectid,taskflowid,templateid,template_name,status_task from dwd_universal_tb_task
] jdbcUrl:[jdbc:mysql://localhost:3306/demo?yearIsDateType=false&zeroDateTimeBehavior=convertToNull&tinyInt1isBit=false&rewriteBatchedStatements=true].
2022-11-16 14:28:54.104 [Thread-1] INFO  DorisStreamLoadObserver - Start to join batch data: rows[2] bytes[438] label[datax_doris_writer_c4e08cb9-c157-4689-932f-db34acc45b6f].
2022-11-16 14:28:54.104 [Thread-1] INFO  DorisStreamLoadObserver - Executing stream load to: 'http://127.0.0.1:8030/api/demo/dwd_universal_tb_task/_stream_load', size: '441'
2022-11-16 14:28:54.224 [Thread-1] INFO  DorisStreamLoadObserver - StreamLoad response :{"Status":"Success","BeginTxnTimeMs":0,"Message":"OK","NumberUnselectedRows":0,"CommitAndPublishTimeMs":17,"Label":"datax_doris_writer_c4e08cb9-c157-4689-932f-db34acc45b6f","LoadBytes":441,"StreamLoadPutTimeMs":1,"NumberTotalRows":2,"WriteDataTimeMs":11,"TxnId":217056,"LoadTimeMs":31,"TwoPhaseCommit":"false","ReadDataTimeMs":0,"NumberLoadedRows":2,"NumberFilteredRows":0}
2022-11-16 14:28:54.225 [Thread-1] INFO  DorisWriterManager - Async stream load finished: label[datax_doris_writer_c4e08cb9-c157-4689-932f-db34acc45b6f].
2022-11-16 14:28:54.249 [taskGroup-0] INFO  TaskGroupContainer - taskGroup[0] taskId[0] is successed, used[201]ms
2022-11-16 14:28:54.250 [taskGroup-0] INFO  TaskGroupContainer - taskGroup[0] completed it's tasks.
2022-11-16 14:29:04.048 [job-0] INFO  StandAloneJobContainerCommunicator - Total 2 records, 214 bytes | Speed 21B/s, 0 records/s | Error 0 records, 0 bytes |  All Task WaitWriterTime 0.000s |  All Task WaitReaderTime 0.000s | Percentage 100.00%
2022-11-16 14:29:04.049 [job-0] INFO  AbstractScheduler - Scheduler accomplished all tasks.
2022-11-16 14:29:04.049 [job-0] INFO  JobContainer - DataX Writer.Job [doriswriter] do post work.
Wed Nov 16 14:29:04 GMT+08:00 2022 WARN: Establishing SSL connection without server's identity verification is not recommended. According to MySQL 5.5.45+, 5.6.26+ and 5.7.6+ requirements SSL connection must be established by default if explicit option isn't set. For compliance with existing applications not using SSL the verifyServerCertificate property is set to 'false'. You need either to explicitly disable SSL by setting useSSL=false, or set useSSL=true and provide truststore for server certificate verification.
2022-11-16 14:29:04.187 [job-0] INFO  DorisWriter$Job - Start to execute preSqls:[select count(1) from dwd_universal_tb_task]. context info:jdbc:mysql://172.16.0.13:9030/demo.
2022-11-16 14:29:04.204 [job-0] INFO  JobContainer - DataX Reader.Job [mysqlreader] do post work.
2022-11-16 14:29:04.204 [job-0] INFO  JobContainer - DataX jobId [0] completed successfully.
2022-11-16 14:29:04.204 [job-0] INFO  HookInvoker - No hook invoked, because base dir not exists or is a file: /data/datax/hook
2022-11-16 14:29:04.205 [job-0] INFO  JobContainer -
         [total cpu info] =>
                averageCpu                     | maxDeltaCpu                    | minDeltaCpu
                -1.00%                         | -1.00%                         | -1.00%


         [total gc info] =>
                 NAME                 | totalGCCount       | maxDeltaGCCount    | minDeltaGCCount    | totalGCTime        | maxDeltaGCTime     | minDeltaGCTime
                 PS MarkSweep         | 1                  | 1                  | 1                  | 0.017s             | 0.017s             | 0.017s
                 PS Scavenge          | 1                  | 1                  | 1                  | 0.007s             | 0.007s

2022-11-16 14:29:04.205 [job-0] INFO  JobContainer - PerfTrace not enable!
2022-11-16 14:29:04.206 [job-0] INFO  StandAloneJobContainerCommunicator - Total 2 records, 214 bytes | Speed 21B/s, 0 records/s | Error 0 records, 0 bytes |  All Task WaitWriterTime 0.000s |  All Task WaitReaderTime 0.000s | Percentage 100.00%
2022-11-16 14:29:04.206 [job-0] INFO  JobContainer -
Job start time                  : 2022-11-16 14:28:53
Job end time                    : 2022-11-16 14:29:04
Total job duration              :                 10s
Average job throughput          :               21B/s
Record write speed              :              0rec/s
Total records read              :                   2
Total read/write failures       :                   0
```

## Import considerations and best practices

- Do not set `flushInterval` too small. If it is too small, Doris writes can block and return error code `-235`, and the import may also be triggered before reaching the `maxBatchRows` or `batchSize` threshold.
- When using the CSV format, carefully check whether `column_separator` and `line_delimiter` conflict with values in your data. Use hidden characters to lower the chance of conflicts.
- When using the JSON format with a batch that is an array, set `strip_outer_array = true` so that Doris parses each Object in the array as a row.
- `labelPrefix` combines with a UUID to form a globally unique label, which prevents duplicate imports.
- `loadUrl` can take multiple FE addresses separated by commas; doriswriter accesses them in round-robin fashion.

## FAQ

### Can DataX Doriswriter only synchronize MySQL data?

No. DataX supports many data sources. The full example in this document uses MySQL, but other DataX-supported sources can also be written to Doris through Doriswriter.

### Which port should `loadUrl` use?

`loadUrl` uses the `http_port` of an FE node, in the format `ip:port`. If you specify multiple addresses, doriswriter accesses them in round-robin fashion.

### Why pay attention to delimiters when importing in JSON or CSV format?

`line_delimiter` or `column_separator` can conflict with characters in your data and cause import errors. Use special or invisible characters as delimiters to lower the chance of conflicts.
