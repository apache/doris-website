---
{
    "title": "Logstash",
    "language": "en",
    "description": "Use the Logstash Doris output plugin to collect TEXT or JSON logs and write them to Apache Doris in real time through Stream Load, suitable for log ETL and search analytics.",
    "keywords": [
        "Logstash",
        "Logstash Doris output plugin",
        "Doris Stream Load",
        "log collection",
        "log ETL"
    ]
}
---

# Logstash Doris output plugin

<!-- Knowledge type: Capability definition -->
<!-- Applicable scenario: Use Logstash to collect, preprocess, and write logs to Doris in real time -->

Logstash is a log ETL framework responsible for collecting, preprocessing, and sending data to storage systems. The Logstash Doris output plugin is the output plugin that Logstash uses to write to Apache Doris. It is suitable for importing TEXT or JSON logs into Doris in real time for log search and analytics.

The plugin calls the [Doris Stream Load](../../data-operate/import/import-way/stream-load-manual) HTTP interface to write data in real time, and provides multi-thread concurrency, failure retry, custom Stream Load formats and parameters, and write-speed logging.

## Use cases and workflow

<!-- Knowledge type: Architecture selection decision -->
<!-- Applicable scenario: Choose Logstash as the log collection method for writing to Doris -->

You can choose the appropriate example based on the log format:

| User scenario | Applicable data | Recommended reading |
| --- | --- | --- |
| Collect plain text logs and handle multi-line logs such as Java stacktraces | TEXT logs, where one business log entry may span multiple lines | [Collect TEXT multi-line logs](#collect-text-multi-line-logs) |
| Collect structured logs with one JSON object per line | JSON line logs, where each line can be parsed directly into fields | [Collect JSON line logs](#collect-json-line-logs) |

The complete workflow for using the Logstash Doris output plugin is as follows:

1. Obtain and install the Logstash Doris output plugin.
2. Create the target database and table in Doris.
3. Configure the Logstash input, transformation, and Doris output parameters.
4. Start Logstash to write logs to Doris in real time.
5. Observe import results through the Stream Load response and write-speed logs.

## Install the plugin

<!-- Knowledge type: Operation steps -->
<!-- Applicable scenario: Deploy the Logstash Doris output plugin -->

### Obtain the plugin

You can obtain the Logstash Doris output plugin by downloading the installation package or by building it from source.

| Method | Applicable scenario | Operation |
| --- | --- | --- |
| Download from the official site | You need to directly obtain an installation package that includes dependencies | Download `logstash-output-doris-1.2.0-java.gem` |
| Build from source | You already have the plugin source and need to build the package yourself | Run `gem build` in the `extension/logstash/` directory |

Download from the official site:

```shell
# Installation package that includes dependencies
wget https://apache-doris-releases.oss-cn-beijing.aliyuncs.com/extension/logstash-output-doris-1.2.0-java.gem
```

Build from source:

```shell
cd extension/logstash/
gem build logstash-output-doris.gemspec
```

### Standard installation

`${LOGSTASH_HOME}` is the Logstash installation directory. Run the `${LOGSTASH_HOME}/bin/logstash-plugin` command to install the plugin, replacing `<plugin_file>.gem` with the actual plugin package file name:

```shell
${LOGSTASH_HOME}/bin/logstash-plugin install <plugin_file>.gem
```

After successful installation, Logstash outputs results similar to the following:

```text
Validating logstash-output-doris-1.2.0.gem
Installing logstash-output-doris
Installation successful
```

The standard installation mode automatically installs the Ruby modules that the plugin depends on. If the network is unavailable, the installation may hang or fail to complete. In that case, you can download the installation package that includes dependencies and perform an offline installation.

### Offline installation

For offline installation, first skip JAR dependency processing, and then use the plugin installation package from the local file system. When using a local path, specify the package location through `file://` as required by Logstash:

```shell
export JARS_SKIP="true"
${LOGSTASH_HOME}/bin/logstash-plugin install file:///path/to/<plugin_file>.gem
```

## Configuration parameters

<!-- Knowledge type: Configuration parameters -->
<!-- Applicable scenario: Configure the Logstash Doris output plugin to write to Doris -->

The Logstash Doris output plugin supports the following configuration items:

| Configuration item | Description |
| --- | --- |
| `http_hosts` | The Stream Load HTTP address. The format is a string array that can contain one or more elements. Each element is in the form `host:port`, for example `["http://fe1:8030", "http://fe2:8030"]`. |
| `user` | The Doris username. This user must have import permissions on the target Doris database and table. |
| `password` | The password of the Doris user. |
| `db` | The Doris database to write to. |
| `table` | The Doris table to write to. |
| `label_prefix` | The Doris Stream Load Label prefix. The final generated Label is in the form `<label_prefix>_<db>_<table>_<yyyymmdd_hhmmss>_<uuid>`. The default value is `logstash`. |
| `headers` | The headers parameter of Doris Stream Load. The syntax is a Ruby map, for example `headers => { "format" => "json" "read_json_by_line" => "true" }`. |
| `mapping` | The mapping from Logstash fields to Doris table fields. See the examples below for usage. |
| `message_only` | A special form of `mapping` that outputs only the Logstash `@message` field to Doris. The default value is `false`. |
| `max_retries` | The number of retries after a Doris Stream Load request fails. The default value is `-1`, which means infinite retries to ensure data reliability. |
| `log_request` | Whether to output the Doris Stream Load request and response metadata in the log for troubleshooting. The default value is `false`. |
| `log_speed_interval` | The interval at which the write speed is output to the log, in seconds. The default value is `10`. Set it to `0` to disable speed logging. |

## Collect TEXT multi-line logs

<!-- Knowledge type: Operation steps -->
<!-- Applicable scenario: Use Logstash to collect Java TEXT logs and write them to Doris -->

This example uses Doris FE logs to demonstrate how to collect TEXT logs and write them to Doris.

### Scenario description

The FE log file is typically located at `fe/log/fe.log` under the Doris installation directory. This kind of Java application log contains fields such as timestamp, log level, thread name, code position, and log content.

FE logs include both single-line entries and exception logs that contain stacktraces. Because a stacktrace spans multiple lines, the main log entry and the stacktrace need to be merged into a single log during collection.

A log sample is as follows:

```text
2024-07-08 21:18:01,432 INFO (Statistics Job Appender|61) [StatisticsJobAppender.runAfterCatalogReady():70] Stats table not available, skip
2024-07-08 21:18:53,710 WARN (STATS_FETCH-0|208) [StmtExecutor.executeInternalQuery():3332] Failed to run internal SQL: OriginStatement{originStmt='SELECT * FROM __internal_schema.column_statistics WHERE part_id is NULL  ORDER BY update_time DESC LIMIT 500000', idx=0}
org.apache.doris.common.UserException: errCode = 2, detailMessage = tablet 10031 has no queryable replicas. err: replica 10032's backend 10008 does not exist or not alive
        at org.apache.doris.planner.OlapScanNode.addScanRangeLocations(OlapScanNode.java:931) ~[doris-fe.jar:1.2-SNAPSHOT]
        at org.apache.doris.planner.OlapScanNode.computeTabletInfo(OlapScanNode.java:1197) ~[doris-fe.jar:1.2-SNAPSHOT]
```

### Create the table in Doris

The target table contains fields such as the log generation time, collection time, hostname, log file path, log type, log level, thread name, code position, and log content:

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

### Configure Logstash

Logstash uses two main types of configuration files:

| Configuration file | Purpose |
| --- | --- |
| `config/logstash.yml` | The Logstash global configuration file. You can configure the batch size and batch delay to improve write performance to Doris. |
| `logstash_doris_log.conf` | The configuration file for a single log collection task. It typically contains three sections: `input`, `filter`, and `output`. |

For logs that average a few hundred bytes per entry, set the batch size to 1,000,000 rows and the batch delay to 10s. You can configure these in `config/logstash.yml`:

```yaml
pipeline.batch.size: 1000000
pipeline.batch.delay: 10000
```

`logstash_doris_log.conf` contains the following three sections:

| Section | Purpose | Key configuration in this example |
| --- | --- | --- |
| `input` | Reads raw data. | Uses the `file` input to read FE logs and uses the `multiline` codec to append lines that do not start with a timestamp to the previous line. |
| `filter` | Performs data transformation. | Uses `grok` to extract `log_time`, `level`, `thread`, and `position` from the `message` field. |
| `output` | Outputs to Doris. | Uses the `doris` output to write to Doris through Stream Load and maps fields through `mapping`. |

A configuration example is as follows:

```text
# 1. input: read FE logs and merge stacktraces using the multiline codec
input {
    file {
        path => "/mnt/disk2/xiaokang/opt/doris_master/fe/log/fe.log"
        add_field => {"type" => "fe.log"}
        codec => multiline {
            # valid line starts with timestamp
            pattern => "^%{TIMESTAMP_ISO8601} "
            # any line not starting with a timestamp should be merged with the previous line
            negate => true
            what => "previous"
        }
    }
}

# 2. filter: extract log fields from the message using grok
filter {
    grok {
        match => {
            # parse log_time, level, thread, position fields from message
            "message" => "%{TIMESTAMP_ISO8601:log_time} (?<level>[A-Z]+) \((?<thread>[^\[]*)\) \[(?<position>[^\]]*)\]"
        }
    }
}

# 3. output: write to Doris through Doris Stream Load
output {
    doris {
        http_hosts => ["http://localhost:8630"]
        user => "root"
        password => ""
        db => "log_db"
        table => "doris_log"
        headers => {
            "format" => "json"
            "read_json_by_line" => "true"
            "load_to_single_tablet" => "true"
        }
        mapping => {
            "log_time" => "%{log_time}"
            "collect_time" => "%{@timestamp}"
            "host" => "%{[host][name]}"
            "path" => "%{[log][file][path]}"
            "type" => "%{type}"
            "level" => "%{level}"
            "thread" => "%{thread}"
            "position" => "%{position}"
            "message" => "%{message}"
        }
        log_request => true
    }
}
```

In the `output` configuration, `headers` specifies that the Stream Load data format is JSON, and `mapping` specifies the mapping from Logstash fields to JSON fields. Because `headers` sets `"format" => "json"`, Stream Load automatically parses the JSON fields and writes them to the corresponding fields in the Doris table.

### Run Logstash

Run the following command to start Logstash:

```shell
${LOGSTASH_HOME}/bin/logstash -f config/logstash_doris_log.conf
```

When `log_request` is `true`, the log outputs the request parameters and response result of each Stream Load. A response example is as follows:

```json
{
    "TxnId": 45464,
    "Label": "logstash_log_db_doris_log_20240708_223532_539_6c20a0d1-dcab-4b8e-9bc0-76b46a929bd1",
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

By default, every 10s, Logstash outputs write-speed information in the log, including the cumulative data volume since startup (MB and ROWS), the total speed (MB/s and R/s), and the speed over the last 10s:

```text
[2024-07-08T22:35:38,285][INFO ][logstash.outputs.doris   ][main] total 11 MB 18978 ROWS, total speed 0 MB/s 632 R/s, last 10 seconds speed 1 MB/s 1897 R/s
```

## Collect JSON line logs

<!-- Knowledge type: Operation steps -->
<!-- Applicable scenario: Use Logstash to collect JSON line logs and write them to Doris -->

This example uses GitHub Events Archive data to demonstrate how to collect JSON line logs and write them to Doris.

### Scenario description

GitHub Events Archive is the archived data of GitHub user activity events. The format is JSON, and you can download it from <https://www.gharchive.org/>. Each event occupies one line, which makes it suitable for parsing with the Logstash `json` codec.

Download the data for 23:00 on April 1, 2024, and decompress it into a `.json` file that Logstash can read:

```shell
mkdir -p /tmp/github_events
cd /tmp/github_events
wget https://data.gharchive.org/2024-04-01-23.json.gz
gunzip 2024-04-01-23.json.gz
```

The following is a data sample. In the actual file, each entry occupies one line; it is formatted here for readability:

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

### Create the table in Doris

Create the `github_events` table to store GitHub event fields, the collection host, and the file path:

```sql
CREATE DATABASE log_db;
USE log_db;

CREATE TABLE github_events
(
    `created_at` DATETIME,
    `id` BIGINT,
    `type` TEXT,
    `public` BOOLEAN,
    `actor.id` BIGINT,
    `actor.login` TEXT,
    `actor.display_login` TEXT,
    `actor.gravatar_id` TEXT,
    `actor.url` TEXT,
    `actor.avatar_url` TEXT,
    `repo.id` BIGINT,
    `repo.name` TEXT,
    `repo.url` TEXT,
    `payload` TEXT,
    `host` TEXT,
    `path` TEXT,
    INDEX `idx_id` (`id`) USING INVERTED,
    INDEX `idx_type` (`type`) USING INVERTED,
    INDEX `idx_actor.id` (`actor.id`) USING INVERTED,
    INDEX `idx_actor.login` (`actor.login`) USING INVERTED,
    INDEX `idx_repo.id` (`repo.id`) USING INVERTED,
    INDEX `idx_repo.name` (`repo.name`) USING INVERTED,
    INDEX `idx_host` (`host`) USING INVERTED,
    INDEX `idx_path` (`path`) USING INVERTED,
    INDEX `idx_payload` (`payload`) USING INVERTED PROPERTIES("parser" = "unicode", "support_phrase" = "true")
)
ENGINE = OLAP
DUPLICATE KEY(`created_at`)
PARTITION BY RANGE(`created_at`) ()
DISTRIBUTED BY RANDOM BUCKETS 10
PROPERTIES (
    "replication_num" = "1",
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

### Configure Logstash

The configuration for JSON line logs differs from the configuration for TEXT multi-line logs in two main ways:

1. The `codec` parameter of the `file` input is set to `json`. Logstash parses each line of text as JSON, and the parsed fields are used in subsequent processing.
2. A `filter` plugin is not required, because JSON data can already be parsed directly into fields.

A configuration example is as follows:

```text
input {
    file {
        path => "/tmp/github_events/2024-04-01-23.json"
        codec => json
    }
}

output {
    doris {
        http_hosts => ["http://fe1:8630", "http://fe2:8630", "http://fe3:8630"]
        user => "root"
        password => ""
        db => "log_db"
        table => "github_events"
        headers => {
            "format" => "json"
            "read_json_by_line" => "true"
            "load_to_single_tablet" => "true"
        }
        mapping => {
            "created_at" => "%{created_at}"
            "id" => "%{id}"
            "type" => "%{type}"
            "public" => "%{public}"
            "actor.id" => "%{[actor][id]}"
            "actor.login" => "%{[actor][login]}"
            "actor.display_login" => "%{[actor][display_login]}"
            "actor.gravatar_id" => "%{[actor][gravatar_id]}"
            "actor.url" => "%{[actor][url]}"
            "actor.avatar_url" => "%{[actor][avatar_url]}"
            "repo.id" => "%{[repo][id]}"
            "repo.name" => "%{[repo][name]}"
            "repo.url" => "%{[repo][url]}"
            "payload" => "%{[payload]}"
            "host" => "%{[host][name]}"
            "path" => "%{[log][file][path]}"
        }
        log_request => true
    }
}
```

### Run Logstash

Run the following command to start Logstash:

```shell
${LOGSTASH_HOME}/bin/logstash -f logstash_github_events.conf
```

## Common issues and troubleshooting

<!-- Knowledge type: Troubleshooting -->
<!-- Applicable scenario: Check the installation, import, and runtime status of Logstash writing to Doris -->

| Issue | Resolution |
| --- | --- |
| The standard installation hangs because of a network failure | Use the installation package that includes dependencies for offline installation, and specify the local file system path through `file://`. |
| You need to view each request and response written to Doris | Set `log_request => true` in the `doris` output. The log then outputs the Stream Load request parameters and response result. |
| You need to observe the write speed | Use the default `log_speed_interval`. Logstash outputs the cumulative data volume, the total speed, and the speed over the last 10s every 10s. |
| You need to disable the write-speed log | Set `log_speed_interval` to `0`. |
| Stacktraces in TEXT logs are split into multiple log entries | Use the `multiline` codec in the `file` input to merge lines that do not start with a timestamp into the previous line. |
