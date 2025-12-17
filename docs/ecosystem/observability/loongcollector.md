---
{
    "title": "LoongCollector (iLogtail) Doris Flusher",
    "language": "en"
}
---

# LoongCollector (iLogtail) Doris Flusher 

## Introduction

[LoongCollector (iLogtail)](https://github.com/alibaba/loongcollector) is an open-source, high-performance log collection and processing framework originating from Alibaba Cloud. Before version 3.0, it was named Logtail/iLogtail. It supports custom output plugins to write data into storage systems, and the LoongCollector Doris Flusher is the plugin for outputting data to Doris.

The Doris Flusher calls the Doris Stream Load HTTP interface to write data into Doris in real-time, providing capabilities such as multi-threaded concurrency, failure retries, custom Stream Load formats and parameters, and output write speed monitoring.

There are three main steps to use the Doris Flusher:
1. Install LoongCollector
2. Configure the Doris output address and other parameters
3. Start LoongCollector to write data into Doris in real-time

## Installation

### Download from Official Website

```bash
wget https://apache-doris-releases.oss-cn-beijing.aliyuncs.com/extension/loongcollector-linux-amd64.tar.gz
```

### Compile from Source Code

```shell
# Clone the repository
git clone https://github.com/alibaba/loongcollector.git
cd loongcollector
git submodule update --init

# Build LoongCollector
make all
cd output
```

## Configuration

The configuration for the LoongCollector Doris Flusher Plugin is as follows:

Configuration | Description
--- | ---
`Addresses` | Stream Load HTTP addresses, formatted as a string array with one or more elements, each element being host:port. For example: ["http://fe1:8030", "http://fe2:8030"]
`Database` | The Doris database name to write into
`Table` | The Doris table name to write into
`Authentication.PlainText.Username` | Doris username, this user needs to have import permissions for the corresponding Doris database and table
`Authentication.PlainText.Password` | Doris user's password
`LoadProperties` | Doris Stream Load header parameters, formatted as a map. For example: `LoadProperties: {"format": "json", "read_json_by_line": "true"}`
`LogProgressInterval` | Time interval for outputting speed in logs, unit is seconds, default is 10, setting to 0 can disable this type of logging
`GroupCommit` | Group commit mode, optional values are "sync", "async", or "off", default is "off"
`Concurrency` | Number of goroutines for concurrent data sending, default is 1 (synchronous mode)
`QueueCapacity` | Task queue capacity in asynchronous mode, default is 1024
`Convert.Protocol` | Data conversion protocol, default is custom_single
`Convert.Encoding` | Data conversion encoding, default is json
`Convert.TagFieldsRename` | Rename one or more fields from tags
`Convert.ProtocolFieldsRename` | Rename protocol fields, protocol field options can only be: contents, tags, time


## Usage Examples

### TEXT Log Collection Example

This example demonstrates TEXT log collection using Doris FE logs as an example.

**1. Data**

FE log files are typically located at the fe/log/fe.log file under the Doris installation directory. They are typical Java program logs, including fields such as timestamp, log level, thread name, code location, and log content. Not only do they contain normal logs, but also exception logs with stacktraces, which are multiline. Log collection and storage need to combine the main log and stacktrace into a single log entry.

```
2024-07-08 21:18:01,432 INFO (Statistics Job Appender|61) [StatisticsJobAppender.runAfterCatalogReady():70] Stats table not available, skip
2024-07-08 21:18:53,710 WARN (STATS_FETCH-0|208) [StmtExecutor.executeInternalQuery():3332] Failed to run internal SQL: OriginStatement{originStmt='SELECT * FROM __internal_schema.column_statistics WHERE part_id is NULL  ORDER BY update_time DESC LIMIT 500000', idx=0}
org.apache.doris.common.UserException: errCode = 2, detailMessage = tablet 10031 has no queryable replicas. err: replica 10032's backend 10008 does not exist or not alive
        at org.apache.doris.planner.OlapScanNode.addScanRangeLocations(OlapScanNode.java:931) ~[doris-fe.jar:1.2-SNAPSHOT]
        at org.apache.doris.planner.OlapScanNode.computeTabletInfo(OlapScanNode.java:1197) ~[doris-fe.jar:1.2-SNAPSHOT]
```

**2. Table Creation**

The table structure includes fields such as the log's creation time, collection time, hostname, log file path, log type, log level, thread name, code location, and log content.

```
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

**3. LoongCollector Configuration**

The LoongCollector configuration file consists of 3 main parts:
1. inputs - responsible for reading raw data
2. processors - responsible for data transformation
3. flushers - responsible for data output

Configuration file location: `conf/continuous_pipeline_config/local/`
Create configuration file: `loongcollector_doris_log.yaml`

```yaml
enable: true

inputs:
  # 1. inputs section is responsible for reading raw data
  # file_log input is an input plugin that can configure the log file path to read
  # Using multiline configuration to append lines not starting with timestamp to the previous line,
  # achieving the effect of merging stacktrace with the main log
  - Type: input_file
    FilePaths:
      - /path/fe.log
    Multiline:
      Mode: custom
      StartPattern: '^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}'

processors:
  # 2. processors section is responsible for data transformation
  # processor_regex is a commonly used data transformation plugin that extracts fields using regular expressions
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
  # 3. flushers section is responsible for data output
  # flusher_doris outputs data to Doris using the Stream Load HTTP interface
  # The LoadProperties parameter specifies the Stream Load data format as JSON
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


**4. Running LoongCollector**

```
nohup ./loongcollector > stdout.log 2> stderr.log &

# By default, speed information is logged every 10 seconds, including data volume since startup (MB and ROWS), total speed (MB/s and R/s), and speed for the last 10 seconds
total 11 MB 18978 ROWS, total speed 0 MB/s 632 R/s, last 10 seconds speed 1 MB/s 1897 R/s
```


### JSON Log Collection Example

This example demonstrates JSON log collection using data from the GitHub events archive.

**1. Data**

The GitHub events archive contains archived data of GitHub user actions, formatted as JSON. It can be downloaded from https://www.gharchive.org/, for example, the data for January 1, 2024, at 3 PM.

```
wget https://data.gharchive.org/2024-01-01-15.json.gz

```

Below is a sample of the data. Normally, each piece of data is on a single line, but for ease of display, it has been formatted here.

```
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


**2. Table Creation**

```
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
"inverted_index_storage_format"= "v2",
"compaction_policy" = "time_series",
"enable_single_replica_compaction" = "true",
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

**3. LoongCollector Configuration**

This configuration differs from the previous TEXT log collection in the following ways:

1. input_file uses JSON mode for parsing, LoongCollector will parse each line of text as JSON format
2. No complex processor plugins are used because JSON data already has structured fields

Configuration file location: `conf/continuous_pipeline_config/local/`
Create configuration file: `loongcollector_doris_log.yaml`

```yaml
enable: true

inputs:
  # file_log input reads JSON format log files
  - Type: input_file
    FilePaths:
      - /path/2024-01-01-15.json

processors:
  # Parse content, only expand the first level (actor, repo remain as JSON strings for VARIANT type usage)
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

**4. Running LoongCollector**

```bash
nohup ./loongcollector > stdout.log 2> stderr.log &
```
