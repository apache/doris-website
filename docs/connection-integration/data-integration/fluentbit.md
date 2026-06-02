---
{
    "title": "Fluent Bit",
    "language": "en",
    "description": "Introduces how to use the Fluent Bit Doris Output Plugin to write TEXT and JSON logs into Apache Doris in real time via Stream Load.",
    "keywords": [
        "Fluent Bit",
        "Doris Stream Load",
        "log collection",
        "writing logs to Doris",
        "Fluent Bit Doris Output Plugin"
    ]
}
---

<!-- Knowledge type: One-sentence definition -->
<!-- Applicable scenario: Use Fluent Bit to write logs into Apache Doris in real time -->

[Fluent Bit](https://fluentbit.io/) is a fast log processor and forwarder that supports writing data to storage systems through custom output plugins. The Fluent Bit Doris Output Plugin is the output plugin that writes from Fluent Bit to Doris. It calls the [Doris Stream Load](../../data-operate/import/import-way/stream-load-manual) HTTP interface to write data into Doris in real time.

Key capabilities include:

- Multi-threaded concurrent writes.
- Retries when Doris Stream Load requests fail.
- Customizable Stream Load formats and parameters.
- Output write speed statistics.

## Applicable scenarios and onboarding flow

<!-- Knowledge type: Architecture selection decision -->
<!-- Applicable scenario: Choosing a log collection solution -->

You can choose the corresponding integration approach based on the log type:

| User scenario | Recommended approach | Example in this document |
| --- | --- | --- |
| Collect TEXT logs that contain `stacktrace` | Use the `tail` input, a multiline parser, and a log field parser to merge multi-line logs into a single record before writing to Doris | [Collect Doris FE TEXT logs](#collect-doris-fe-text-logs) |
| Collect single-line JSON event logs | Use the `tail` input and a JSON Parser to write JSON records directly to Doris | [Collect JSON logs](#collect-json-logs) |

The basic flow for using the Fluent Bit Doris Output Plugin to integrate with Doris is as follows:

1. Download or compile a Fluent Bit binary that includes the Doris Output Plugin.
2. Configure the Fluent Bit input, parser, and Doris output parameters according to the log type.
3. Start Fluent Bit to write logs into Doris in real time.

## Install the Fluent Bit Doris Output Plugin (alpha version)

<!-- Knowledge type: Operation steps -->
<!-- Applicable scenario: Prepare the runtime environment for the Fluent Bit Doris Output Plugin -->

You can either download a precompiled binary directly or build from source.

### Download from the official site

Download [fluent-bit-doris-3.1.9](https://download.selectdb.com/integrations/fluent-bit-doris-3.1.9).

### Build from source

Clone the `dev` branch of the [fluent-bit](https://github.com/joker-star-l/fluent-bit) repository, then run the following commands in the `build/` directory:

```shell
cmake -DFLB_RELEASE=ON ..
make
```

The build artifact is `build/bin/fluent-bit`.

## Configure Doris output parameters

<!-- Knowledge type: Configuration parameters -->
<!-- Applicable scenario: Configure Fluent Bit to write to Doris -->

The configuration items of the Fluent Bit Doris Output Plugin are as follows:

| Configuration | Description |
| --- | --- |
| `host` | Stream Load HTTP Host. |
| `port` | Stream Load HTTP Port. |
| `user` | Doris username. This user must have import privileges on the corresponding database and table. |
| `password` | Password of the Doris user. |
| `database` | Name of the Doris database to write to. |
| `table` | Name of the Doris table to write to. |
| `label_prefix` | Doris Stream Load Label prefix. The final generated Label is `{label_prefix}_{timestamp}_{uuid}`. The default value is `fluentbit`. If set to `false`, no Label is added. |
| `time_key` | Name of the timestamp column to add to the data. The default value is `date`. If set to `false`, this column is not added. |
| `header` | Header parameters for Doris Stream Load. Multiple values can be set. |
| `log_request` | Whether to output Doris Stream Load request and response metadata in the log, used for troubleshooting. The default value is `true`. |
| `log_progress_interval` | Time interval, in seconds, for outputting write speed in the log. The default value is `10`. Set to `0` to disable this log. |
| `retry_limit` | Number of retries after a Doris Stream Load request fails. The default value is `1`. If set to `false`, the number of retries is unlimited. |
| `workers` | Number of workers that execute Doris Stream Load. The default value is `2`. |

## Collect Doris FE TEXT logs

<!-- Knowledge type: Operation steps -->
<!-- Applicable scenario: Collect multi-line Java logs and write them to Doris -->

This scenario uses Doris FE logs as an example to show how to collect TEXT logs. For multi-line exception logs that contain a `stacktrace`, you must first merge the main log and the `stacktrace` into a single record, then parse the fields and write them to Doris.

### 1. Prepare a log sample

The FE log file is typically located at `fe/log/fe.log` under the Doris installation directory. It is a typical Java program log that includes fields such as timestamp, log level, thread name, code position, and log content. The logs contain both normal entries and exception entries with `stacktrace`. Because a `stacktrace` spans multiple lines, the log collection must combine the main log and the `stacktrace` into a single log entry.

```text
2024-07-08 21:18:01,432 INFO (Statistics Job Appender|61) [StatisticsJobAppender.runAfterCatalogReady():70] Stats table not available, skip
2024-07-08 21:18:53,710 WARN (STATS_FETCH-0|208) [StmtExecutor.executeInternalQuery():3332] Failed to run internal SQL: OriginStatement{originStmt='SELECT * FROM __internal_schema.column_statistics WHERE part_id is NULL  ORDER BY update_time DESC LIMIT 500000', idx=0}
org.apache.doris.common.UserException: errCode = 2, detailMessage = tablet 10031 has no queryable replicas. err: replica 10032's backend 10008 does not exist or not alive
        at org.apache.doris.planner.OlapScanNode.addScanRangeLocations(OlapScanNode.java:931) ~[doris-fe.jar:1.2-SNAPSHOT]
        at org.apache.doris.planner.OlapScanNode.computeTabletInfo(OlapScanNode.java:1197) ~[doris-fe.jar:1.2-SNAPSHOT]
```

### 2. Create a Doris table

The table schema includes fields such as the log generation time, collection time, hostname, log file path, log type, log level, thread name, code position, and log content.

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

### 3. Configure Fluent Bit

This scenario requires two configuration files:

| Configuration file | Purpose |
| --- | --- |
| `doris_log.conf` | Defines the Fluent Bit Service, input, filter, and Doris output. |
| `parsers.conf` | Defines the multi-line log parser and the FE log field parser. |

`doris_log.conf`:

```ini
# config for Fluent Bit service
[SERVICE]
    log_level info
    # parsers file
    parsers_file parsers.conf

# use input tail
[INPUT]
    name tail
    path /path/to/your/log
    # add log file name to the record, key is 'path'
    path_key path
    # set multiline parser
    multiline.parser multiline_java

# parse log
[FILTER]
    match *
    name parser
    key_name log
    parser fe_log
    reserve_data true

# add host info
[FILTER]
    name sysinfo
    match *
    # add hostname to the record, key is 'host'
    hostname_key host

# output to doris
[OUTPUT]
    name doris
    match *
    host fehost
    port feport
    user your_username
    password your_password
    database your_db
    table your_table
    # add 'collect_time' to the record
    time_key collect_time
    # 'collect_time' is timestamp, change it to datetime
    header columns collect_time=from_unixtime(collect_time)
    log_request true
    log_progress_interval 10
```

`parsers.conf`:

```ini
[MULTILINE_PARSER]
    name          multiline_java
    type          regex
    flush_timeout 1000
    # Regex rules for multiline parsing
    # ---------------------------------
    #
    # configuration hints:
    #
    #  - first state always has the name: start_state
    #  - every field in the rule must be inside double quotes
    #
    # rules   |   state name   | regex pattern | next state name
    # --------|----------------|---------------|-----------------
    rule         "start_state"   "/(^[0-9]{4}-[0-9]{2}-[0-9]{2} [0-9]{2}:[0-9]{2}:[0-9]{2})(.*)/"  "cont"
    rule         "cont"          "/(^(?![0-9]{4}-[0-9]{2}-[0-9]{2}))(.*)/"     "cont"


[PARSER]
    name        fe_log
    format      regex
    # parse and add 'log_time', 'level', 'thread', 'position', 'message' to the record
    regex       ^(?<log_time>[0-9]{4}-[0-9]{2}-[0-9]{2} [0-9]{2}:[0-9]{2}:[0-9]{2},[0-9]{3}) (?<level>[^ ]+) \((?<thread>[^\)]+)\) \[(?<position>[^\]]+)\] (?<message>(\n|.)*)\n$
```

### 4. Start Fluent Bit and check the write results

```shell
fluent-bit -c doris_log.conf
```

The log will output the Stream Load response metadata:

```text
[2024/10/31 18:39:55] [ info] [output:doris:doris.1] 127.0.0.1:8040, HTTP status=200
{
    "TxnId": 32155,
    "Label": "fluentbit_1730371195_91cca1aa-c15f-45d2-b503-fe7d2e839c2a",
    "Comment": "",
    "TwoPhaseCommit": "false",
    "Status": "Success",
    "Message": "OK",
    "NumberTotalRows": 1,
    "NumberLoadedRows": 1,
    "NumberFilteredRows": 0,
    "NumberUnselectedRows": 0,
    "LoadBytes": 836,
    "LoadTimeMs": 298,
    "BeginTxnTimeMs": 0,
    "StreamLoadPutTimeMs": 3,
    "ReadDataTimeMs": 0,
    "WriteDataTimeMs": 268,
    "CommitAndPublishTimeMs": 25
}
```

The log also outputs the write speed:

```text
[2024/10/31 18:40:13] [ info] [output:doris:doris.1] total 0 MB 2 ROWS, total speed 0 MB/s 0 R/s, last 10 seconds speed 0 MB/s 0 R/s
```

## Collect JSON logs

<!-- Knowledge type: Operation steps -->
<!-- Applicable scenario: Collect single-line JSON event logs and write them to Doris -->

This scenario uses GitHub Events Archive data as an example to show how to collect JSON logs. Compared with TEXT log collection, JSON logs do not require an additional `FILTER` for processing and conversion.

### 1. Prepare data

[GitHub Events Archive](https://www.gharchive.org/) is archive data of GitHub user action events, in JSON format. The following example downloads the data for 15:00 on January 1, 2024:

```shell
wget https://data.gharchive.org/2024-01-01-15.json.gz
```

The actual data is one JSON object per line. The following is a formatted data sample:

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

### 2. Create a Doris table

```sql
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

### 3. Configure Fluent Bit

This scenario requires two configuration files:

| Configuration file | Purpose |
| --- | --- |
| `github_events.conf` | Defines the Fluent Bit Service, input, and Doris output. |
| `github_parsers.conf` | Defines the JSON Parser. |

`github_events.conf`:

```ini
[SERVICE]
    log_level info
    parsers_file github_parsers.conf

[INPUT]
    name tail
    parser github
    path /path/to/your/log

[OUTPUT]
    name doris
    match *
    host fehost
    port feport
    user your_username
    password your_password
    database your_db
    table your_table
    time_key false
    log_request true
    log_progress_interval 10
```

`github_parsers.conf`:

```ini
[PARSER]
    name github
    format json
```

### 4. Start Fluent Bit

```shell
fluent-bit -c github_events.conf
```
