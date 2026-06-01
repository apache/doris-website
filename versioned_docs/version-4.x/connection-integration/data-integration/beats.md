---
{
    "title": "Beats",
    "language": "en",
    "description": "Describes how to use the Beats Doris output plugin to write data collected by Filebeat and other Beats components into Apache Doris in real time via Stream Load."
}
---

[Beats](https://github.com/elastic/beats) is a data collection agent that supports writing data to storage systems through custom output plugins. The Beats Doris output plugin is a plugin that outputs data collected by Beats to Doris.

To write data collected by Filebeat and other Beats components into Doris in real time, you can use the Beats Doris output plugin. This plugin calls the [Doris Stream Load](../../data-operate/import/import-way/stream-load-manual) HTTP interface to write data, and provides capabilities such as multi-threaded concurrency, retry on failure, custom Stream Load format and parameters, and reporting of write speed.

The Beats Doris output plugin supports the following Beats components:

| Beats component | Description |
| --- | --- |
| [Filebeat](https://github.com/elastic/beats/tree/master/filebeat) | Collects log files |
| [Metricbeat](https://github.com/elastic/beats/tree/master/metricbeat) | Collects metric data |
| [Packetbeat](https://github.com/elastic/beats/tree/master/packetbeat) | Collects network data |
| [Winlogbeat](https://github.com/elastic/beats/tree/master/winlogbeat) | Collects Windows event logs |
| [Auditbeat](https://github.com/elastic/beats/tree/master/auditbeat) | Collects audit data |
| [Heartbeat](https://github.com/elastic/beats/tree/master/heartbeat) | Collects availability probe data |

Using the Beats Doris output plugin generally involves three steps:

1. Download or compile a Beats binary that includes the Doris output plugin.
2. Configure the Doris output address and other parameters in the Beats configuration file.
3. Start Beats to write data into Doris in real time.

## Installation

You can either download a Beats binary that already includes the Doris output plugin, or compile it from source.

### Download from the official site

Download [filebeat-doris-2.1.1](https://download.selectdb.com/extension/filebeat-doris-2.1.1).

### Compile from source

In the `extension/beats/` directory of the Doris source code, run the following commands:

```bash
cd doris/extension/beats

go build -o filebeat-doris filebeat/filebeat.go
go build -o metricbeat-doris metricbeat/metricbeat.go
go build -o winlogbeat-doris winlogbeat/winlogbeat.go
go build -o packetbeat-doris packetbeat/packetbeat.go
go build -o auditbeat-doris auditbeat/auditbeat.go
go build -o heartbeat-doris heartbeat/heartbeat.go
```

## Configure the Doris output

In the Beats configuration file, configure the Doris output through `output.doris`. Common configuration items are as follows:

| Configuration item | Default value | Description |
| --- | --- | --- |
| `fenodes` | None | Stream Load HTTP address. The format is a string array, and one or more addresses can be configured. For example: `["http://fe1:8030", "http://fe2:8030"]`. |
| `user` | None | Doris username. This user must have load privileges on the target database and table. |
| `password` | None | Password of the Doris user. |
| `database` | None | Name of the Doris database to write to. |
| `table` | None | Name of the Doris table to write to. |
| `label_prefix` | `beats` | Prefix for the Doris Stream Load Label. The final Label format is `{label_prefix}_{db}_{table}_{yyyymmdd_hhmmss}_{uuid}`. |
| `headers` | None | The headers parameter for Doris Stream Load. The syntax is a YAML map. |
| `codec_format_string` | None | The format string output to Doris Stream Load. Use `%{[a][b]}` to reference the `a.b` field in the input. |
| `bulk_max_size` | `100000` | The batch size for Doris Stream Load. |
| `max_retries` | `-1` | Number of retries after a Doris Stream Load request fails. `-1` means unlimited retries, used to ensure data reliability. |
| `log_request` | `true` | Whether to output Doris Stream Load request and response metadata in the log, used for troubleshooting. |
| `log_progress_interval` | `10` | Time interval, in seconds, for outputting write speed in the log. Set to `0` to disable this log. |

## Scenario 1: Collecting TEXT logs

This scenario uses Doris FE logs as an example to show how to collect plain text logs and multi-line stack traces and write them into Doris.

### Step 1: Prepare the data

Doris FE log files are typically located at `fe/log/fe.log` under the Doris installation directory. The FE log is a typical Java program log, containing fields such as timestamp, log level, thread name, code position, and log content. The log includes both regular log entries and exception entries with stack traces. Because a stack trace spans multiple lines, the main log entry and its corresponding stack trace must be merged into a single log entry during collection.

```text
2024-07-08 21:18:01,432 INFO (Statistics Job Appender|61) [StatisticsJobAppender.runAfterCatalogReady():70] Stats table not available, skip
2024-07-08 21:18:53,710 WARN (STATS_FETCH-0|208) [StmtExecutor.executeInternalQuery():3332] Failed to run internal SQL: OriginStatement{originStmt='SELECT * FROM __internal_schema.column_statistics WHERE part_id is NULL  ORDER BY update_time DESC LIMIT 500000', idx=0}
org.apache.doris.common.UserException: errCode = 2, detailMessage = tablet 10031 has no queryable replicas. err: replica 10032's backend 10008 does not exist or not alive
        at org.apache.doris.planner.OlapScanNode.addScanRangeLocations(OlapScanNode.java:931) ~[doris-fe.jar:1.2-SNAPSHOT]
        at org.apache.doris.planner.OlapScanNode.computeTabletInfo(OlapScanNode.java:1197) ~[doris-fe.jar:1.2-SNAPSHOT]
```

### Step 2: Create a Doris table

The table schema includes fields such as the time the log was generated, the time it was collected, hostname, log file path, log type, log level, thread name, code position, and log content.

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

### Step 3: Configure Filebeat

The Filebeat log collection configuration file (for example, `filebeat_doris_log.yml`) uses YAML format and consists of four main parts:

1. `input`: Reads the raw log file.
2. `processors`: Transforms and parses the log content.
3. `queue.mem`: Configures the internal Filebeat buffer queue.
4. `output`: Outputs the data to Doris.

```yaml
# 1. input is responsible for reading raw data.
# type: log is the log input plugin, which lets you configure the path of the log file to read.
# multiline appends lines that do not start with a timestamp to the previous line, used to merge stack traces with the main log entry.
# The log input stores the log content in the message field, and also generates metadata fields such as agent.host and log.file.path.
filebeat.inputs:
- type: log
  enabled: true
  paths:
    - /path/to/your/log
  multiline:
    type: pattern
    # A line starting with yyyy-mm-dd HH:MM:SS is recognized as a new log entry; other lines are appended to the previous entry.
    pattern: '^[0-9]{4}-[0-9]{2}-[0-9]{2} [0-9]{2}:[0-9]{2}:[0-9]{2}'
    negate: true
    match: after
    skip_newline: true

# 2. processors handle data transformation.
processors:
# Use the js script plugin to replace \t in the log with spaces, to avoid JSON parsing errors.
- script:
    lang: javascript
    source: >
        function process(event) {
            var msg = event.Get("message");
            msg = msg.replace(/\t/g, "  ");
            event.Put("message", msg);
        }
# Use the dissect plugin for simple log parsing.
- dissect:
    # 2024-06-08 18:26:25,481 INFO (report-thread|199) [ReportHandler.cpuReport():617] begin to handle
    tokenizer: "%{day} %{time} %{log_level} (%{thread}) [%{position}] %{content}"
    target_prefix: ""
    ignore_failure: true
    overwrite_keys: true

# 3. queue.mem configures the total number of events in the internal buffer queue, the flush batch size, and the flush time interval.
queue.mem:
  events: 1000000
  flush.min_events: 100000
  flush.timeout: 10s

# 4. output is responsible for sending data to Doris.
# doris output uses the Stream Load HTTP interface to write to Doris.
# headers specifies the Stream Load data format as JSON.
# codec_format_string formats the output content in a printf-like manner.
# In the example, you can reference Filebeat built-in fields (such as agent.hostname) or fields generated by processors (such as day).
output.doris:
  fenodes: [ "http://fehost1:http_port", "http://fehost2:http_port", "http://fehost3:http_port" ]
  user: "your_username"
  password: "your_password"
  database: "your_db"
  table: "your_table"
  # output string format
  ## %{[agent][hostname]} and %{[log][file][path]} are Filebeat built-in metadata.
  ## Other commonly used Filebeat metadata includes the collection timestamp %{[@timestamp]}.
  ## %{[day]} and %{[time]} are fields obtained from the dissect parsing above.
  codec_format_string: '{"ts": "%{[day]} %{[time]}", "host": "%{[agent][hostname]}", "path": "%{[log][file][path]}", "message": "%{[message]}"}'
  headers:
    format: "json"
    read_json_by_line: "true"
    load_to_single_tablet: "true"
```

### Step 4: Run Filebeat

Run the following command to start Filebeat:

```bash
./filebeat-doris -f config/filebeat_doris_log.yml
```

When `log_request` is `true`, the log outputs the request parameters and response result of each Stream Load.

```text
doris stream load response:
{
    "TxnId": 45464,
    "Label": "beats_log_db_doris_log_20240708_223532_539_6c20a0d1-dcab-4b8e-9bc0-76b46a929bd1",
    "Comment": "",
    "TwoPhaseCommit": "false",
    "Status": "Success",
    "Message": "OK",
    "NumberTotalRows": 452,
    "NumberLoadedRows": 452,
    "NumberFilteredRows": 0,
    "NumberUnselectedRows": 0,
    "LoadBytes": 277230,
    "LoadTimeMs": 1797,
    "BeginTxnTimeMs": 0,
    "StreamLoadPutTimeMs": 18,
    "ReadDataTimeMs": 9,
    "WriteDataTimeMs": 1758,
    "CommitAndPublishTimeMs": 18
}
```

By default, write speed information is output in the log every 10 seconds, including the data volume since startup (in MB and ROWS), the overall speed (in MB/s and R/s), and the speed over the last 10 seconds.

```text
total 11 MB 18978 ROWS, total speed 0 MB/s 632 R/s, last 10 seconds speed 1 MB/s 1897 R/s
```

## Scenario 2: Collecting JSON logs

This scenario uses GitHub Events Archive data as an example to show how to collect JSON logs and write them into Doris.

### Step 1: Prepare the data

GitHub Events Archive is archived data of GitHub user action events, in JSON format. You can download the data from [GitHub Archive](https://www.gharchive.org/). For example, to download the data for 15:00 on January 1, 2024:

```bash
wget https://data.gharchive.org/2024-01-01-15.json.gz
```

The following is a sample record. The actual data is one JSON record per line; it is formatted here for readability.

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

### Step 2: Create a Doris table

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

### Step 3: Configure Filebeat

Compared with the TEXT log collection configuration, the JSON scenario differs in two ways:

1. `processors` is not used, because no extra transformation is needed.
2. `codec_format_string` directly outputs the entire `message`, that is, the original JSON content.

```yaml
# input
filebeat.inputs:
- type: log
  enabled: true
  paths:
    - /path/to/your/log

# queue and batch
queue.mem:
  events: 1000000
  flush.min_events: 100000
  flush.timeout: 10s

# output
output.doris:
  fenodes: [ "http://fehost1:http_port", "http://fehost2:http_port", "http://fehost3:http_port" ]
  user: "your_username"
  password: "your_password"
  database: "your_db"
  table: "your_table"
  # output string format
  ## Output the message of each line in the original file as-is.
  ## headers specifies format: "json", so Stream Load automatically parses JSON fields and writes them into the corresponding fields of the Doris table.
  codec_format_string: '%{[message]}'
  headers:
    format: "json"
    read_json_by_line: "true"
    load_to_single_tablet: "true"
```

### Step 4: Run Filebeat

Run the following command to start Filebeat:

```bash
./filebeat-doris -f config/filebeat_github_events.yml
```
