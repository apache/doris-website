---
{
    "title": "LoongCollector",
    "language": "en",
    "description": "Use the LoongCollector Doris Flusher to write TEXT or JSON logs into Apache Doris in real time through Stream Load, with support for multi-line logs, failure retries, and concurrent ingestion.",
    "keywords": [
        "LoongCollector",
        "iLogtail",
        "Doris Flusher",
        "Doris Stream Load",
        "log collection",
        "write logs to Doris"
    ]
}
---

<!-- Knowledge type: Capability definition -->
<!-- Applicable scenario: Use LoongCollector to write logs into Apache Doris in real time -->

[LoongCollector (iLogtail)](https://github.com/alibaba/loongcollector) is an open-source, high-performance log collection and processing framework originating from Alibaba Cloud. Before version 3.0, it was named Logtail/iLogtail. It supports writing data into storage systems through custom output plugins. The LoongCollector Doris Flusher is the output plugin for writing into Apache Doris, suitable for ingesting TEXT or JSON logs into Doris in real time for log search and analysis.

The Doris Flusher calls the [Doris Stream Load](../../data-operate/import/import-way/stream-load-manual) HTTP interface to write data in real time, and provides the following capabilities:

- Multi-threaded concurrent writes.
- Retries on Doris Stream Load request failures.
- Customizable Stream Load formats and parameters.
- Output of write speed statistics.

## Use Cases and Workflow

<!-- Knowledge type: Architecture decision -->
<!-- Applicable scenario: Choose a LoongCollector-based log collection method for writing into Doris -->

You can choose the corresponding example based on the log format:

| User scenario | Applicable data | Recommended reading |
| --- | --- | --- |
| Collect Doris FE TEXT logs that contain `stacktrace` | TEXT logs, where one business log entry may span multiple lines | [Collect Doris FE TEXT logs](#collect-doris-fe-text-logs) |
| Collect event logs with one JSON object per line | JSON line logs, where each line can be parsed directly into fields | [Collect JSON line logs](#collect-json-line-logs) |

The full workflow for using the LoongCollector Doris Flusher is as follows:

1. Install LoongCollector.
2. Create the target database and table in Doris.
3. Configure LoongCollector input, transformation, and Doris output parameters.
4. Start LoongCollector and write logs into Doris in real time.

## Install LoongCollector

<!-- Knowledge type: Operation steps -->
<!-- Applicable scenario: Prepare the LoongCollector runtime environment -->

You can either download the precompiled installation package directly, or build LoongCollector from source.

### Download from the official site

Download the precompiled installation package:

```bash
wget https://apache-doris-releases.oss-cn-beijing.aliyuncs.com/extension/loongcollector-linux-amd64.tar.gz
```

### Build from source

Clone the LoongCollector repository and build it:

```shell
# Clone the repository
git clone https://github.com/alibaba/loongcollector.git
cd loongcollector
git submodule update --init

# Build LoongCollector
make all
cd output
```

## Configure Doris Output Parameters

<!-- Knowledge type: Configuration parameters -->
<!-- Applicable scenario: Configure the LoongCollector Doris Flusher to write into Doris -->

The LoongCollector Doris Flusher Plugin supports the following configuration items:

| Configuration item | Description |
| --- | --- |
| `Addresses` | Stream Load HTTP addresses, in the form of a string array that can contain one or more elements. Each element has the format `host:port`, for example `["http://fe1:8030", "http://fe2:8030"]`. |
| `Database` | The Doris database name to write into. |
| `Table` | The Doris table name to write into. |
| `Authentication.PlainText.Username` | The Doris username. This user must have import privileges on the corresponding Doris database and table. |
| `Authentication.PlainText.Password` | The password of the Doris user. |
| `LoadProperties` | Header parameters of Doris Stream Load. The syntax is a map, for example `LoadProperties: {"format": "json", "read_json_by_line": "true"}`. |
| `LogProgressInterval` | The interval, in seconds, at which the write speed is logged. The default value is `10`; set it to `0` to disable this log. |
| `GroupCommit` | The group commit mode. Allowed values are `sync`, `async`, or `off`. The default value is `off`. |
| `Concurrency` | The number of goroutines that send data concurrently. The default value is `1` (synchronous mode). |
| `QueueCapacity` | The task queue capacity in asynchronous mode. The default value is `1024`. |
| `Convert.Protocol` | The data conversion protocol. The default value is `custom_single`. |
| `Convert.Encoding` | The data conversion encoding. The default value is `json`. |
| `Convert.TagFieldsRename` | Rename one or more fields from tags. |
| `Convert.ProtocolFieldsRename` | Rename protocol fields. Allowed protocol field values are `contents`, `tags`, and `time`. |

## Collect Doris FE TEXT Logs

<!-- Knowledge type: Operation steps -->
<!-- Applicable scenario: Collect multi-line Java TEXT logs and write them into Doris -->

This scenario uses Doris FE logs as an example to show how to collect TEXT logs. For multi-line exception logs that contain a `stacktrace`, you need to first merge the main log and the `stacktrace` into a single record, then parse the fields and write them into Doris.

### 1. Prepare a Log Sample

FE log files are usually located at `fe/log/fe.log` under the Doris installation directory. FE logs are typical Java application logs and contain fields such as the timestamp, log level, thread name, code position, and log content. The logs include both normal entries and exception entries with a `stacktrace`. Because a `stacktrace` spans multiple lines, the main log and the `stacktrace` must be combined into a single log entry when collected and stored.

```text
2024-07-08 21:18:01,432 INFO (Statistics Job Appender|61) [StatisticsJobAppender.runAfterCatalogReady():70] Stats table not available, skip
2024-07-08 21:18:53,710 WARN (STATS_FETCH-0|208) [StmtExecutor.executeInternalQuery():3332] Failed to run internal SQL: OriginStatement{originStmt='SELECT * FROM __internal_schema.column_statistics WHERE part_id is NULL  ORDER BY update_time DESC LIMIT 500000', idx=0}
org.apache.doris.common.UserException: errCode = 2, detailMessage = tablet 10031 has no queryable replicas. err: replica 10032's backend 10008 does not exist or not alive
        at org.apache.doris.planner.OlapScanNode.addScanRangeLocations(OlapScanNode.java:931) ~[doris-fe.jar:1.2-SNAPSHOT]
        at org.apache.doris.planner.OlapScanNode.computeTabletInfo(OlapScanNode.java:1197) ~[doris-fe.jar:1.2-SNAPSHOT]
```

### 2. Create the Doris Table

The target table contains fields such as the log generation time, collection time, hostname, log file path, log type, log level, thread name, code position, and log content.

```sql
CREATE TABLE `doris_log` (
    `log_time` datetime NULL COMMENT 'log content time',
    `collect_time` datetime NULL COMMENT 'log agent collect time',
    `host` text NULL COMMENT 'hostname or ip',
    `path` text NULL COMMENT 'log file path',
    `type` text NULL COMMENT 'log type',
    `level` text NULL COMMENT 'log level',
    `thread` text NULL COMMENT 'log thread',
    `position` text NULL COMMENT 'log code position',
    `message` text NULL COMMENT 'log message',
    INDEX idx_host (`host`) USING INVERTED COMMENT '',
    INDEX idx_path (`path`) USING INVERTED COMMENT '',
    INDEX idx_type (`type`) USING INVERTED COMMENT '',
    INDEX idx_level (`level`) USING INVERTED COMMENT '',
    INDEX idx_thread (`thread`) USING INVERTED COMMENT '',
    INDEX idx_position (`position`) USING INVERTED COMMENT '',
    INDEX idx_message (`message`) USING INVERTED PROPERTIES("parser" = "unicode", "support_phrase" = "true") COMMENT ''
) ENGINE=OLAP
DUPLICATE KEY(`log_time`)
COMMENT 'OLAP'
PARTITION BY RANGE(`log_time`) ()
DISTRIBUTED BY RANDOM BUCKETS 10
PROPERTIES (
    "replication_num" = "1",
    "dynamic_partition.enable" = "true",
    "dynamic_partition.time_unit" = "DAY",
    "dynamic_partition.start" = "-7",
    "dynamic_partition.end" = "1",
    "dynamic_partition.prefix" = "p",
    "dynamic_partition.buckets" = "10",
    "dynamic_partition.create_history_partition" = "true",
    "compaction_policy" = "time_series"
);
```

### 3. Configure LoongCollector

A LoongCollector configuration file consists of three main parts:

1. `inputs`: read raw data.
2. `processors`: transform and parse log content.
3. `flushers`: output data to Doris.

Place the configuration file under the `conf/continuous_pipeline_config/local/` directory, for example by creating `loongcollector_doris_log.yaml`:

```yaml
enable: true

inputs:
  # 1. inputs are responsible for reading raw data
  # input_file is an input plugin where you can configure the log file path to read
  # The multiline configuration appends lines that do not start with a timestamp to the previous line, so the stacktrace is merged with the main log
  - Type: input_file
    FilePaths:
      - /path/fe.log
    Multiline:
      Mode: custom
      StartPattern: '^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}'

processors:
  # 2. processors are responsible for data transformation
  # processor_regex is a commonly used data transformation plugin that extracts fields with regular expressions
  - Type: processor_regex
    SourceKey: content
    Regex: '(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2},\d{3}) ([A-Z]+) \(([^\)]*)\) \[([^\]]*)\] (.*)'
    Keys:
      - log_time
      - level
      - thread
      - position
      - message
  # Add extra fields
  - Type: processor_add_fields
    Fields:
      type: fe.log
    IgnoreIfExist: false

flushers:
  # 3. flushers are responsible for data output
  # flusher_doris outputs data to Doris through the Stream Load HTTP interface
  # The LoadProperties parameter sets the Stream Load data format to JSON
  - Type: flusher_doris
    Addresses:
      - "http://fe_ip:http_port"
    Database: log_db
    Table: doris_log
    Authentication:
      PlainText:
        Username: root
        Password: ""
    LoadProperties:
      format: json
      read_json_by_line: "true"
      load_to_single_tablet: "true"
      columns: "log_time,collect_time,host,path,type,level,thread,position,message,log_time=replace(log_time,',','.'),collect_time=from_unixtime(collect_time)"
    Convert:
      Protocol: custom_single_flatten
      Encoding: json
      TagFieldsRename:
        host.ip: host
        log.file.path: path
      ProtocolFieldsRename:
        time: collect_time
    LogProgressInterval: 10
```

### 4. Start LoongCollector

Start LoongCollector:

```bash
nohup ./loongcollector > stdout.log 2> stderr.log &
```

By default, the write speed is logged every 10 seconds, including the data volume since startup (in MB and ROWS), the overall speed (in MB/s and R/s), and the speed over the last 10 seconds. An example log line is:

```text
total 11 MB 18978 ROWS, total speed 0 MB/s 632 R/s, last 10 seconds speed 1 MB/s 1897 R/s
```

## Collect JSON Line Logs

<!-- Knowledge type: Operation steps -->
<!-- Applicable scenario: Collect single-line JSON event logs and write them into Doris -->

This scenario uses data from the GitHub Events Archive as an example to show how to collect event logs with one JSON object per line.

### 1. Prepare JSON Data

The [GitHub Events Archive](https://www.gharchive.org/) is the archived data of GitHub user action events, in JSON format. You can download the data for 15:00 on January 1, 2024. The file path in the configuration example below should point to the decompressed JSON file:

```bash
wget https://data.gharchive.org/2024-01-01-15.json.gz
```

The actual data has one JSON object per line. The sample below is formatted for readability:

```json
{
  "id": "37066529221",
  "type": "PushEvent",
  "actor": {
    "id": 46139131,
    "login": "Bard89",
    "display_login": "Bard89",
    "gravatar_id": "",
    "url": "https://api.github.com/users/Bard89",
    "avatar_url": "https://avatars.githubusercontent.com/u/46139131?"
  },
  "repo": {
    "id": 780125623,
    "name": "Bard89/talk-to-me",
    "url": "https://api.github.com/repos/Bard89/talk-to-me"
  },
  "payload": {
    "repository_id": 780125623,
    "push_id": 17799451992,
    "size": 1,
    "distinct_size": 1,
    "ref": "refs/heads/add_mvcs",
    "head": "f03baa2de66f88f5f1754ce3fa30972667f87e81",
    "before": "85e6544ede4ae3f132fe2f5f1ce0ce35a3169d21"
  },
  "public": true,
  "created_at": "2024-04-01T23:00:00Z"
}
```

### 2. Create the Doris Table

Create the target database and table to store GitHub event logs.

```sql
CREATE DATABASE log_db;
USE log_db;

CREATE TABLE github_events
(
    `created_at` DATETIME,
    `id` BIGINT,
    `type` TEXT,
    `public` BOOLEAN,
    `actor` VARIANT,
    `repo` VARIANT,
    `payload` TEXT,
    INDEX `idx_id` (`id`) USING INVERTED,
    INDEX `idx_type` (`type`) USING INVERTED,
    INDEX `idx_actor` (`actor`) USING INVERTED,
    INDEX `idx_host` (`repo`) USING INVERTED,
    INDEX `idx_payload` (`payload`) USING INVERTED PROPERTIES("parser" = "unicode", "support_phrase" = "true")
)
ENGINE = OLAP
DUPLICATE KEY(`created_at`)
PARTITION BY RANGE(`created_at`) ()
DISTRIBUTED BY RANDOM BUCKETS 10
PROPERTIES (
    "replication_num" = "1",
    "inverted_index_storage_format" = "v2",
    "compaction_policy" = "time_series",
    "dynamic_partition.enable" = "true",
    "dynamic_partition.create_history_partition" = "true",
    "dynamic_partition.time_unit" = "DAY",
    "dynamic_partition.start" = "-30",
    "dynamic_partition.end" = "1",
    "dynamic_partition.prefix" = "p",
    "dynamic_partition.buckets" = "10",
    "dynamic_partition.replication_num" = "1"
);
```

### 3. Configure LoongCollector

The main differences between this configuration and the TEXT log collection example are as follows:

1. `input_file` uses JSON parsing mode, so LoongCollector parses each line of text as JSON.
2. The JSON data already contains structured fields, so a complex processor plugin is not needed.

Place the configuration file under the `conf/continuous_pipeline_config/local/` directory, for example by creating `loongcollector_doris_log.yaml`:

```yaml
enable: true

inputs:
  # input_file reads JSON-format log files
  - Type: input_file
    FilePaths:
      - /path/2024-01-01-15.json

processors:
  # Parse content and expand only the first level (actor and repo remain as JSON strings for the VARIANT type)
  - Type: processor_json
    SourceKey: content
    KeepSource: false
    ExpandDepth: 1
    ExpandConnector: ""

flushers:
  # flusher_doris outputs data to Doris
  - Type: flusher_doris
    Addresses:
      - "http://fe_ip:http_port"
    Database: log_db
    Table: github_events
    Authentication:
      PlainText:
        Username: root
        Password: ""
    LoadProperties:
      format: json
      read_json_by_line: "true"
      load_to_single_tablet: "true"
    Convert:
      Protocol: custom_single_flatten
      Encoding: json
    LogProgressInterval: 10
    Concurrency: 3
```

### 4. Start LoongCollector

```bash
nohup ./loongcollector > stdout.log 2> stderr.log &
```
