---
{
    "title": "Vector",
    "language": "en",
    "description": "Introduces how to use Vector Doris Sink to write observability data such as logs, metrics, and traces into Apache Doris in real time through Stream Load, with examples for TEXT and JSON log collection.",
    "keywords": [
        "Vector",
        "Vector Doris Sink",
        "Apache Doris log collection",
        "Stream Load",
        "observability data pipeline",
        "JSON log collection",
        "multi-line log collection"
    ]
}
---

<!-- Knowledge type: Operational steps / Configuration parameters -->
<!-- Applicable scenario: Use Vector to write observability data such as logs, metrics, and traces into Apache Doris -->

[Vector](https://vector.dev/) is a high-performance observability data pipeline written in Rust, designed for collecting, transforming, and routing logs, metrics, and trace data. To better support the Doris ecosystem, the Doris community developed the **Doris Sink** component for Vector, which efficiently writes data from various sources into Apache Doris through [Stream Load](../../data-operate/import/import-way/stream-load-manual.md) for analytical processing.

### Applicable Scenarios

Vector + Doris Sink primarily applies to the following data ingestion scenarios:

- **Application log collection**: Write multi-line or single-line text logs produced by applications, web servers, databases, and similar sources into Doris in real time.
- **JSON-structured logs**: Collect NDJSON event streams, such as GitHub Events or Nginx access logs in JSON format.
- **Metrics and trace data**: Land observability data from sources such as Prometheus and OpenTelemetry into Doris for analysis.
- **Multi-source data aggregation**: Use Vector's Source and Transform capabilities to convert heterogeneous data sources and write the results uniformly into Doris.

### Data Pipeline

A typical data flow looks as follows:

```text
Data source (Source) -> Vector Transform -> Doris Sink (Stream Load) -> Apache Doris
```

## Installation and Deployment

### Option 1: Download the Pre-Compiled Package

Suitable for x86_64 Linux environments. Extract the package after downloading and use it directly:

```shell
wget https://apache-doris-releases.oss-cn-beijing.aliyuncs.com/extension/vector-x86_64-unknown-linux-gnu.tar.gz
```

### Option 2: Compile from Source

Suitable for scenarios that require custom builds or non-x86_64 platforms:

```shell
cd ${VECTOR_HOME}

# Choose a target based on the deployment environment. The Makefile provides multiple target platform options.
make package-x86_64-unknown-linux-gnu
```

## Quick Start

The minimal example below demonstrates how to use Vector to write the contents of a file into Doris through Doris Sink:

```toml
[sources.demo]
    type = "file"
    include = ["/path/to/input.json"]

[sinks.doris]
    type = "doris"
    inputs = ["demo"]
    endpoints = ["http://fe_ip:8030"]
    database = "log_db"
    table = "demo_table"

[sinks.doris.auth]
    strategy = "basic"
    user = "root"
    password = ""

[sinks.doris.encoding]
    codec = "json"
```

Start Vector:

```shell
${VECTOR_HOME}/bin/vector --config vector_config.toml
```

## Examples

### Example 1: TEXT Multi-Line Log Collection (Doris FE Logs)

This example demonstrates how to collect Java application logs from Doris FE. FE logs contain fields such as timestamp, log level, thread name, code position, and log content, and frequently include multi-line stacktrace exception information. The main log line and its stacktrace must be merged into a single record.

#### 1. Sample Data

FE logs are usually located at `fe/log/fe.log` under the Doris installation directory:

```text
2024-07-08 21:18:01,432 INFO (Statistics Job Appender|61) [StatisticsJobAppender.runAfterCatalogReady():70] Stats table not available, skip
2024-07-08 21:18:53,710 WARN (STATS_FETCH-0|208) [StmtExecutor.executeInternalQuery():3332] Failed to run internal SQL: OriginStatement{originStmt='SELECT * FROM __internal_schema.column_statistics WHERE part_id is NULL  ORDER BY update_time DESC LIMIT 500000', idx=0}
org.apache.doris.common.UserException: errCode = 2, detailMessage = tablet 10031 has no queryable replicas. err: replica 10032's backend 10008 does not exist or not alive
        at org.apache.doris.planner.OlapScanNode.addScanRangeLocations(OlapScanNode.java:931) ~[doris-fe.jar:1.2-SNAPSHOT]
        at org.apache.doris.planner.OlapScanNode.computeTabletInfo(OlapScanNode.java:1197) ~[doris-fe.jar:1.2-SNAPSHOT]
```

#### 2. Create the Doris Table

The table schema includes fields such as the log generation time, collection time, host name, log file path, log type, log level, thread name, code position, and log content, with inverted indexes on commonly queried fields:

```sql
CREATE TABLE `doris_log` (
    `log_time`     datetime NULL COMMENT 'log content time',
    `collect_time` datetime NULL COMMENT 'log agent collect time',
    `host`         text     NULL COMMENT 'hostname or ip',
    `path`         text     NULL COMMENT 'log file path',
    `type`         text     NULL COMMENT 'log type',
    `level`        text     NULL COMMENT 'log level',
    `thread`       text     NULL COMMENT 'log thread',
    `position`     text     NULL COMMENT 'log code position',
    `message`      text     NULL COMMENT 'log message',
    INDEX idx_host     (`host`)     USING INVERTED,
    INDEX idx_path     (`path`)     USING INVERTED,
    INDEX idx_type     (`type`)     USING INVERTED,
    INDEX idx_level    (`level`)    USING INVERTED,
    INDEX idx_thread   (`thread`)   USING INVERTED,
    INDEX idx_position (`position`) USING INVERTED,
    INDEX idx_message  (`message`)  USING INVERTED PROPERTIES("parser" = "unicode", "support_phrase" = "true")
) ENGINE=OLAP
DUPLICATE KEY(`log_time`)
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

#### 3. Vector Configuration

```toml
# ==================== Sources ====================
[sources.fe_log_input]
    type = "file"
    include = ["/path/fe/log/fe.log"]
    start_at_beginning = true
    max_line_bytes = 102400
    ignore_older_secs = 0
    fingerprint.strategy = "device_and_inode"

    # Multi-line log handling: lines that start with a timestamp are treated as a new log; other lines are merged into the previous line (handles stacktraces).
    multiline.start_pattern     = "^\\d{4}-\\d{2}-\\d{2} \\d{2}:\\d{2}:\\d{2},\\d{3}"
    multiline.mode              = "halt_before"
    multiline.condition_pattern = "^\\d{4}-\\d{2}-\\d{2} \\d{2}:\\d{2}:\\d{2},\\d{3}"
    multiline.timeout_ms        = 10000

# ==================== Transforms ====================
# Use VRL to parse log content
[transforms.parse_log]
    inputs = ["fe_log_input"]
    type = "remap"
    source = '''
        # Add the type field
        .type = "fe.log"

        # Add collect_time (use the Asia/Shanghai time zone, consistent with log_time)
        .collect_time = format_timestamp!(.timestamp, format: "%Y-%m-%d %H:%M:%S", timezone: "Asia/Shanghai")

        # Parse the log format: 2024-01-01 12:00:00,123 INFO (thread-name) [position] message
        # Use (?s) to enable DOTALL mode so that .* matches newlines (handles multi-line logs)
        parsed, err = parse_regex(.message, r'(?s)^(?P<log_time>\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2},\d{3}) (?P<level>[A-Z]+) \((?P<thread>[^\)]+)\) \[(?P<position>[^\]]+)\] (?P<content>.*)')

        if err == null {
            .log_time = parsed.log_time
            .level    = parsed.level
            .thread   = parsed.thread
            .position = parsed.position
            # Keep the full original message (including multi-line stacktrace information)
        } else {
            # On parse failure, set default values to avoid NULL causing partition errors
            .log_time = .collect_time
            .level    = "UNKNOWN"
            .thread   = ""
            .position = ""
        }

        # Extract host and path (Vector adds these metadata automatically)
        .host = .host
        .path = .file
    '''

# ==================== Sinks ====================
[sinks.doris]
    inputs = ["parse_log"]
    type = "doris"
    endpoints = ["http://fe_ip:http_port"]
    database = "log_db"
    table = "doris_log"
    label_prefix = "vector_fe_log"
    log_request = true

[sinks.doris.auth]
    strategy = "basic"
    user = "root"
    password = ""

[sinks.doris.encoding]
    codec = "json"

[sinks.doris.framing]
    method = "newline_delimited"

[sinks.doris.request]
    concurrency = 10

[sinks.doris.headers]
    format = "json"
    read_json_by_line = "true"
    load_to_single_tablet = "true"

[sinks.doris.batch]
    max_events = 10000
    timeout_secs = 3
    max_bytes = 100000000
```

#### 4. Start Vector

```shell
${VECTOR_HOME}/bin/vector --config vector_fe_log.toml
```

When `log_request = true`, Vector prints the parameters and response of every Stream Load request, which helps with debugging:

```text
2025-11-19T10:14:40.822071Z  INFO sink{component_kind="sink" component_id=doris component_type=doris}:request{request_id=82}: vector::sinks::doris::service: Doris stream load response received. status_code=200 OK stream_load_status=Successful response={
  "TxnId": 169721,
  "Label": "vector_fe_log_log_db_doris_log_1763547280791_e2e619ee-4067-4fe8-974e-9f35f0d4e48e",
  "Comment": "",
  "TwoPhaseCommit": "false",
  "Status": "Success",
  "Message": "OK",
  "NumberTotalRows": 10,
  "NumberLoadedRows": 10,
  "NumberFilteredRows": 0,
  "NumberUnselectedRows": 0,
  "LoadBytes": 7301,
  "LoadTimeMs": 30,
  "BeginTxnTimeMs": 0,
  "StreamLoadPutTimeMs": 1,
  "ReadDataTimeMs": 0,
  "WriteDataTimeMs": 8,
  "ReceiveDataTimeMs": 2,
  "CommitAndPublishTimeMs": 18
} internal_log_rate_limit=true
```

### Example 2: JSON Log Collection (GitHub Events)

This example demonstrates how to collect NDJSON-formatted structured logs, using [GitHub Events Archive](https://www.gharchive.org/) data as the source.

#### 1. Sample Data

GitHub Events Archive contains archived data of GitHub user action events in JSON format. For example, download the data for 15:00 on January 1, 2024:

```shell
wget https://data.gharchive.org/2024-01-01-15.json.gz
```

In the actual data, each line is a complete JSON object. The example below is formatted for readability:

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

#### 2. Create the Doris Table

Use the `VARIANT` type to store nested JSON objects directly, and create inverted indexes on the queried fields:

```sql
CREATE DATABASE log_db;
USE log_db;

CREATE TABLE github_events
(
    `created_at` DATETIME,
    `id`         BIGINT,
    `type`       TEXT,
    `public`     BOOLEAN,
    `actor`      VARIANT,
    `repo`       VARIANT,
    `payload`    TEXT,
    INDEX `idx_id`      (`id`)      USING INVERTED,
    INDEX `idx_type`    (`type`)    USING INVERTED,
    INDEX `idx_actor`   (`actor`)   USING INVERTED,
    INDEX `idx_host`    (`repo`)    USING INVERTED,
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

#### 3. Vector Configuration

```toml
# ==================== Sources ====================
[sources.github_events_reload]
    type = "file"
    include = ["/path/2024-01-01-15.json"]
    read_from = "beginning"
    ignore_checkpoints = true
    max_line_bytes = 10485760
    ignore_older_secs = 0
    line_delimiter = "\n"
    fingerprint.strategy = "device_and_inode"

# ==================== Transforms ====================
# Parse the JSON-formatted GitHub Events data. The VARIANT type can store nested objects directly.
[transforms.parse_json]
    inputs = ["github_events_reload"]
    type = "remap"
    source = '''
        # Parse the JSON data (each line is a complete JSON object)
        . = parse_json!(.message)

        # Convert the payload field to a JSON string (TEXT type)
        .payload = encode_json(.payload)

        # Keep only the fields required by the table
        . = {
            "created_at": .created_at,
            "id":         .id,
            "type":       .type,
            "public":     .public,
            "actor":      .actor,
            "repo":       .repo,
            "payload":    .payload
        }
    '''

# ==================== Sinks ====================
[sinks.doris]
    inputs = ["parse_json"]
    type = "doris"
    endpoints = ["http://fe_ip:http_port"]
    database = "log_db"
    table = "github_events"
    label_prefix = "vector_github_events"
    log_request = true

[sinks.doris.auth]
    strategy = "basic"
    user = "root"
    password = ""

[sinks.doris.encoding]
    codec = "json"

[sinks.doris.framing]
    method = "newline_delimited"

[sinks.doris.request]
    concurrency = 10

[sinks.doris.headers]
    format = "json"
    read_json_by_line = "true"
    load_to_single_tablet = "true"

[sinks.doris.batch]
    max_events = 10000
    timeout_secs = 3
    max_bytes = 100000000
```

#### 4. Start Vector

```shell
vector --config vector_config.toml
```

## Configuration Parameter Reference

<!-- Knowledge type: Configuration parameters -->

Doris Sink supports a rich set of configuration options that meet data writing needs across different scenarios. The configurable items below are grouped by function.

### Basic Configuration

| Parameter      | Type             | Default    | Description                                                                                          |
| -------------- | ---------------- | ---------- | ---------------------------------------------------------------------------------------------------- |
| `type`         | string           | -          | Fixed as `doris`                                                                                     |
| `inputs`       | array            | -          | List of upstream data source names                                                                   |
| `endpoints`    | array\<string\>  | -          | Doris FE HTTP/HTTPS addresses. Must include the protocol and port, for example `["https://fe1:8030"]` |
| `database`     | string / template | -         | Target database name. Supports [Template](https://vector.dev/docs/reference/configuration/template-syntax/) |
| `table`        | string / template | -         | Target table name. Supports templates                                                                |
| `label_prefix` | string           | `"vector"` | Stream Load label prefix. The final label takes the form `{label_prefix}_{database}_{table}_{timestamp}_{uuid}` |

### Authentication Configuration

| Parameter       | Type   | Default   | Description                                                          |
| --------------- | ------ | --------- | -------------------------------------------------------------------- |
| `auth.strategy` | string | `"basic"` | Authentication strategy. Doris currently supports only Basic Auth    |
| `auth.user`     | string | -         | Doris username                                                       |
| `auth.password` | string | -         | Doris password. Can be combined with environment variables or a secrets management system |

### Request and Concurrency Configuration

| Parameter                             | Type             | Default       | Description                                                                          |
| ------------------------------------- | ---------------- | ------------- | ------------------------------------------------------------------------------------ |
| `request.concurrency`                 | string / integer | `"adaptive"`  | Concurrency strategy. Supports `"adaptive"`, `"none"` (serial), or a positive integer concurrency limit |
| `request.timeout_secs`                | integer          | `60`          | Timeout in seconds for a single Stream Load request                                  |
| `request.rate_limit_duration_secs`    | integer          | `1`           | Rate limit time window in seconds                                                    |
| `request.rate_limit_num`              | integer          | `i64::MAX`    | Number of requests allowed per time window. The default is effectively unlimited    |
| `request.retry_attempts`              | integer          | `usize::MAX`  | Maximum retry attempts for the Tower middleware. The default means unlimited retries |
| `request.retry_initial_backoff_secs`  | integer          | `1`           | Wait time in seconds before the first retry. Subsequent retries follow Fibonacci backoff |
| `request.retry_max_duration_secs`     | integer          | `30`          | Maximum wait time in seconds for a single retry backoff                              |
| `request.retry_jitter_mode`           | string           | `"full"`      | Retry jitter mode. Supports `full` or `none`                                         |

#### Adaptive Concurrency

Effective only when `request.concurrency = "adaptive"`.

| Parameter                                             | Type    | Default | Description                                |
| ----------------------------------------------------- | ------- | ------- | ------------------------------------------ |
| `request.adaptive_concurrency.initial_concurrency`    | integer | `1`     | Starting value of adaptive concurrency     |
| `request.adaptive_concurrency.max_concurrency_limit`  | integer | `200`   | Upper bound of adaptive concurrency, used to prevent overload |
| `request.adaptive_concurrency.decrease_ratio`         | float   | `0.9`   | Reduction ratio applied when slow-down is triggered |
| `request.adaptive_concurrency.ewma_alpha`             | float   | `0.4`   | Exponential moving average weight for the RTT metric |
| `request.adaptive_concurrency.rtt_deviation_scale`    | float   | `2.5`   | RTT deviation scale factor, used to ignore normal fluctuations |

### Encoding and Data Format

Doris Sink uses the `encoding` section to control event serialization. The default output is NDJSON (newline-delimited JSON):

| Parameter                                         | Type             | Default    | Description                                                                  |
| ------------------------------------------------- | ---------------- | ---------- | ---------------------------------------------------------------------------- |
| `encoding.codec`                                  | string           | `"json"`   | Serialization encoding. Available values include `json`, `text`, `csv`, and others |
| `encoding.timestamp_format`                       | string           | -          | Timestamp output format. Supports `rfc3339`, `unix`, and others              |
| `encoding.only_fields` / `encoding.except_fields` | array\<string\>  | -          | Controls the field allowlist or denylist                                     |
| `encoding.framing.method`                         | string           | inferred   | Custom framing format, such as `newline_delimited` or `character_delimited`  |

#### Stream Load Headers (`headers`)

`headers` is a key-value map that is passed through directly as HTTP headers of the Doris Stream Load request. It accepts every header parameter supported by Stream Load (all values must be strings). Common settings include:

| Parameter                      | Type   | Default  | Description                                                          |
| ------------------------------ | ------ | -------- | -------------------------------------------------------------------- |
| `headers.format`               | string | `"json"` | Data format. Supports `json`, `csv`, `parquet`, and others           |
| `headers.read_json_by_line`    | string | `"true"` | Whether to read JSON line by line (NDJSON)                           |
| `headers.strip_outer_array`    | string | `"false"`| Whether to strip the outermost array                                 |
| `headers.column_separator`     | string | -        | CSV column separator (effective when `format = csv`)                 |
| `headers.columns`              | string | -        | Column order for CSV/JSON mapping, such as `timestamp,client_ip,status_code` |
| `headers.where`                | string | -        | Stream Load `where` filter condition                                 |

### Batch Configuration

| Parameter             | Type             | Default     | Description                                                  |
| --------------------- | ---------------- | ----------- | ------------------------------------------------------------ |
| `batch.max_bytes`     | integer          | `10485760`  | Maximum bytes per batch (10 MB)                              |
| `batch.max_events`    | integer / `null` | `null`      | Maximum events per batch. Unlimited by default; bytes drive batching |
| `batch.timeout_secs`  | float            | `1`         | Maximum wait time for a batch in seconds                     |

### Reliability and Security Configuration

| Parameter                                                                                                       | Type     | Default       | Description                                                                          |
| --------------------------------------------------------------------------------------------------------------- | -------- | ------------- | ------------------------------------------------------------------------------------ |
| `max_retries`                                                                                                   | integer  | `-1`          | Maximum retry attempts at the sink level. `-1` means unlimited                       |
| `log_request`                                                                                                   | boolean  | `false`       | Whether to print every Stream Load request and response (enable as needed in production) |
| `compression`                                                                                                   | -        | not supported | -                                                                                    |
| `distribution.retry_initial_backoff_secs`                                                                       | integer  | `1`           | Initial backoff time in seconds for endpoint health check recovery                   |
| `distribution.retry_max_duration_secs`                                                                          | integer  | `3600`        | Maximum backoff duration in seconds for health checks                                |
| `tls.verify_certificate`                                                                                        | boolean  | `true`        | Enable or disable upstream certificate validation                                    |
| `tls.verify_hostname`                                                                                           | boolean  | `true`        | Enable or disable hostname validation                                                |
| `tls.ca_file` / `tls.crt_file` / `tls.key_file` / `tls.key_pass` / `tls.alpn_protocols` / `tls.server_name`     | various  | -             | Standard Vector TLS client configuration items, used for custom CAs, mutual authentication, or SNI |
| `acknowledgements.enabled`                                                                                      | boolean  | `false`       | Enable end-to-end acknowledgements, used in combination with Sources that support acknowledgements |

## Best Practices

- **Batch size**: For high-throughput log scenarios, set `batch.max_bytes` to around 100 MB and increase `batch.timeout_secs` accordingly to reduce the number of Stream Load requests.
- **Concurrency strategy**: For stable upstream traffic, set `request.concurrency` to a fixed integer explicitly. When traffic fluctuates significantly, use `"adaptive"` so that Vector tunes concurrency automatically.
- **Single-tablet writes**: Set `load_to_single_tablet = "true"` in `headers` to reduce BE-side resource overhead when writing many small files in large batches.
- **Dynamic partitioning + time-series compaction**: Enable `dynamic_partition` and set `compaction_policy = "time_series"` for log tables to significantly reduce storage and merge overhead.
- **Production debugging**: Keep `log_request` disabled by default and enable it only when troubleshooting, to avoid log bloat.
- **TLS and authentication**: Use `tls.*` configuration to enable HTTPS validation. Inject `auth.password` through environment variables or a secrets management system to avoid storing credentials in plaintext.
