---
{
    "title": "Integrating Vector with Doris",
    "language": "en"
}
---

# Integrating Vector with Doris

## About Vector

Vector is a high-performance observability data pipeline written in Rust, specifically designed for collecting, transforming, and routing logs, metrics, and traces. To better support the Doris ecosystem, we have developed a dedicated Doris Sink component for Vector, enabling efficient data ingestion from various data sources into Doris for analysis.

## Installation

### Download Installation Package
```shell
wget https://apache-doris-releases.oss-cn-beijing.aliyuncs.com/extension/vector-x86_64-unknown-linux-gnu.tar.gz
```

### Build from Source
```shell
cd ${Vector_HOME}

## Choose the appropriate option based on your deployment environment. Multiple options are available in the Makefile.
make package-x86_64-unknown-linux-gnu
```


## Configuration Parameters

Doris Sink supports extensive configuration options to meet data writing requirements in different scenarios:

### Basic Configuration

| Parameter      | Type          | Default     | Description |
|---------------|-------------|----------|-----|
| `type`        | string      | -        | Fixed as `doris` |
| `inputs`      | array       | -        | List of upstream data source names |
| `endpoints`   | array\<string> | -     | Doris FE HTTP/HTTPS addresses, must include protocol and port, e.g., `["https://fe1:8030"]` |
| `database`    | string/template   | -        | Target database name, supports [Template](https://vector.dev/docs/reference/configuration/template-syntax/) |
| `table`       | string/template   | -        | Target table name, supports template |
| `label_prefix` | string    | `"vector"` | Stream Load label prefix, final label format is `{label_prefix}_{database}_{table}_{timestamp}_{uuid}` |

### Authentication Configuration

| Parameter        | Type   | Default    | Description |
|-----------------|------|---------|-----|
| `auth.strategy` | string | `"basic"` | Authentication strategy, Doris currently only supports Basic Auth |
| `auth.user`     | string | -         | Doris username |
| `auth.password` | string | -         | Doris password, can be used with environment variables or secret management systems |

### Request and Concurrency Configuration

| Parameter | Type | Default | Description |
|--------|------|------|-----|
| `request.concurrency` | string/integer | `"adaptive"` | Controls concurrency strategy, supports `"adaptive"`, `"none"` (serial), or a positive integer for concurrency limit |
| `request.timeout_secs` | integer | `60` | Timeout for a single Stream Load request (seconds) |
| `request.rate_limit_duration_secs` | integer | `1` | Rate limit time window (seconds) |
| `request.rate_limit_num` | integer | `i64::MAX` | Number of requests allowed per time window, default is virtually unlimited |
| `request.retry_attempts` | integer | `usize::MAX` | Maximum retry attempts for Tower middleware, default means unlimited retries |
| `request.retry_initial_backoff_secs` | integer | `1` | Wait time before the first retry (seconds), subsequent retries use Fibonacci backoff |
| `request.retry_max_duration_secs` | integer | `30` | Maximum wait time for a single retry backoff (seconds) |
| `request.retry_jitter_mode` | string | `"full"` | Retry jitter mode, supports `full` or `none` |

**Adaptive Concurrency (`request.adaptive_concurrency`, only effective when `request.concurrency = "adaptive"`)**

| Parameter | Type | Default | Description |
|--------|------|------|-----|
| `request.adaptive_concurrency.initial_concurrency` | integer | `1` | Initial value for adaptive concurrency |
| `request.adaptive_concurrency.max_concurrency_limit` | integer | `200` | Upper limit for adaptive concurrency to prevent overload |
| `request.adaptive_concurrency.decrease_ratio` | float | `0.9` | Reduction ratio used when triggering slowdown |
| `request.adaptive_concurrency.ewma_alpha` | float | `0.4` | Exponential moving average weight for RTT metrics |
| `request.adaptive_concurrency.rtt_deviation_scale` | float | `2.5` | RTT deviation amplification factor, used to ignore normal fluctuations |

### Encoding and Data Format

Doris Sink uses the `encoding` block to control event serialization behavior, defaulting to NDJSON (newline-delimited JSON):

| Parameter | Type | Default | Description |
|--------|------|------|-----|
| `encoding.codec` | string | `"json"` | Serialization encoding, options include `json`, `text`, `csv`, etc. |
| `encoding.timestamp_format` | string | - | Adjust timestamp output format, supports `rfc3339`, `unix`, etc. |
| `encoding.only_fields` / `encoding.except_fields` | array\<string> | - | Control field whitelist or blacklist |
| `encoding.framing.method` | string | auto-inferred | Set when custom framing format is needed, e.g., `newline_delimited`, `character_delimited` |

#### Stream Load Headers (`headers`)

`headers` is a key-value pair mapping that is passed directly as HTTP headers for Doris Stream Load. You can use all parameters available in stream load headers.
Common settings are as follows (all values must be strings):

| Parameter | Type | Default | Description |
|--------|------|------|-----|
| `headers.format` | string | `"json"` | Data format, supports `json`, `csv`, `parquet`, etc. |
| `headers.read_json_by_line` | string | `"true"` | Whether to read JSON line by line (NDJSON) |
| `headers.strip_outer_array` | string | `"false"` | Whether to remove the outermost array |
| `headers.column_separator` | string | - | CSV column separator (effective when `format = csv`) |
| `headers.columns` | string | - | Column order for CSV/JSON mapping, e.g., `timestamp,client_ip,status_code` |
| `headers.where` | string | - | Stream Load `where` filter condition |

### Batch Configuration

| Parameter | Type | Default | Description |
|--------|------|------|-----|
| `batch.max_bytes` | integer | `10485760` | Maximum bytes per batch (10 MB) |
| `batch.max_events` | integer/`null` | `null` | Maximum events per batch, default is unlimited, primarily controlled by byte count |
| `batch.timeout_secs` | float | `1` | Maximum wait time for a batch (seconds) |

### Reliability and Security Configuration

| Parameter | Type      | Default     | Description                                         |
|--------|---------|---------|--------------------------------------------|
| `max_retries` | integer | `-1`    | Maximum retries at Sink level, `-1` means unlimited                  |
| `log_request` | boolean | `false` | Whether to print each Stream Load request and response (enable as needed in production)       |
| `compression` | -       | `Not supported`   | -                                          |
| `distribution.retry_initial_backoff_secs` | integer | `1`     | Initial backoff time for endpoint health check recovery (seconds)                         |
| `distribution.retry_max_duration_secs` | integer | `3600`  | Maximum health check backoff duration (seconds)                              |
| `tls.verify_certificate` | boolean | `true`  | Enable/disable upstream certificate verification                                |
| `tls.verify_hostname` | boolean | `true`  | Enable/disable hostname verification                                 |
| `tls.ca_file` / `tls.crt_file` / `tls.key_file` / `tls.key_pass` / `tls.alpn_protocols` / `tls.server_name` | various      | -       | Standard Vector TLS client configuration options for custom CA, mutual authentication, or SNI    |
| `acknowledgements.enabled` | boolean | `false` | Enable end-to-end acknowledgements for use with Sources that support acknowledgements |

## Usage Examples

### TEXT Log Collection Example

This example demonstrates TEXT log collection using Doris FE logs as an example.

**1. Data**

FE log files are typically located at fe/log/fe.log under the Doris installation directory. This is a typical Java application log containing fields such as timestamp, log level, thread name, code position, and log message. In addition to regular logs, there are exception logs with stack traces that span multiple lines. Log collection and storage need to combine the main log and stack trace into a single log entry.

```
2024-07-08 21:18:01,432 INFO (Statistics Job Appender|61) [StatisticsJobAppender.runAfterCatalogReady():70] Stats table not available, skip
2024-07-08 21:18:53,710 WARN (STATS_FETCH-0|208) [StmtExecutor.executeInternalQuery():3332] Failed to run internal SQL: OriginStatement{originStmt='SELECT * FROM __internal_schema.column_statistics WHERE part_id is NULL  ORDER BY update_time DESC LIMIT 500000', idx=0}
org.apache.doris.common.UserException: errCode = 2, detailMessage = tablet 10031 has no queryable replicas. err: replica 10032's backend 10008 does not exist or not alive
        at org.apache.doris.planner.OlapScanNode.addScanRangeLocations(OlapScanNode.java:931) ~[doris-fe.jar:1.2-SNAPSHOT]
        at org.apache.doris.planner.OlapScanNode.computeTabletInfo(OlapScanNode.java:1197) ~[doris-fe.jar:1.2-SNAPSHOT]
```

**2. Create Table**

The table structure includes fields for log generation time, collection time, hostname, log file path, log type, log level, thread name, code position, and log message.

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

**3. Vector Configuration**

```toml
# ==================== Sources ====================
[sources.fe_log_input]
  type = "file"
  include = ["/path/fe/log/fe.log"]
  start_at_beginning = true
  max_line_bytes = 102400
  ignore_older_secs = 0
  fingerprint.strategy = "device_and_inode"
  
  # Multi-line log handling - corresponds to Logstash's multiline codec
  # Lines starting with a timestamp are new logs, other lines are merged with the previous line (handling stack traces)
  multiline.start_pattern = "^\\d{4}-\\d{2}-\\d{2} \\d{2}:\\d{2}:\\d{2},\\d{3}"
  multiline.mode = "halt_before"
  multiline.condition_pattern = "^\\d{4}-\\d{2}-\\d{2} \\d{2}:\\d{2}:\\d{2},\\d{3}"
  multiline.timeout_ms = 10000

# ==================== Transforms ====================
# Use grok to parse log content
[transforms.parse_log]
  inputs = ["fe_log_input"]
  type = "remap"
  source = '''
    # Add type field (corresponds to Logstash's add_field)
    .type = "fe.log"
    
    # Add collect_time (corresponds to Logstash's @timestamp)
    # Use Asia/Shanghai timezone, consistent with log_time
    .collect_time = format_timestamp!(.timestamp, format: "%Y-%m-%d %H:%M:%S", timezone: "Asia/Shanghai")
    
    # Parse log format: 2024-01-01 12:00:00,123 INFO (thread-name) [position] message
    # Use (?s) to enable DOTALL mode, allowing .* to match newlines (handling multi-line logs)
    parsed, err = parse_regex(.message, r'(?s)^(?P<log_time>\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2},\d{3}) (?P<level>[A-Z]+) \((?P<thread>[^\)]+)\) \[(?P<position>[^\]]+)\] (?P<content>.*)')
    
    # Extract parsed fields
    if err == null {
      .log_time = parsed.log_time
      .level = parsed.level
      .thread = parsed.thread
      .position = parsed.position
      # Keep the complete original message (including multi-line stack traces)
    } else {
      # If parsing fails, set default values to avoid NULL (avoid partition errors)
      .log_time = .collect_time
      .level = "UNKNOWN"
      .thread = ""
      .position = ""
    }
    
    # Extract host and path (Vector automatically adds these metadata)
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
  user = "root"
  password = ""
  strategy = "basic"

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

**4. Run Vector**

```

${VECTOR_HOME}/bin/vector --config vector_fe_log.toml

# When log_request is true, the log will output the request parameters and response results of each Stream Load
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

### JSON Log Collection Example

This example demonstrates JSON log collection using GitHub events archive data.

**1. Data**

GitHub events archive contains archived data of GitHub user operation events in JSON format. You can download it from https://www.gharchive.org/, for example, downloading data from 15:00 on January 1, 2024.

```
wget https://data.gharchive.org/2024-01-01-15.json.gz

```

Below is a sample data entry. The actual data is one entry per line; formatting is added here for display purposes.

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


**2. Create Doris Table**

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

**3. Vector Configuration**

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
# Parse JSON format GitHub Events data, VARIANT type can directly store nested objects
[transforms.parse_json]
inputs = ["github_events_reload"]
type = "remap"
source = '''
    # Parse JSON data (each line is a complete JSON object)
    . = parse_json!(.message)
    
    # Convert payload field to JSON string (TEXT type)
    .payload = encode_json(.payload)
    
    # Keep only the fields needed for the table
    . = {
      "created_at": .created_at,
      "id": .id,
      "type": .type,
      "public": .public,
      "actor": .actor,
      "repo": .repo,
      "payload": .payload
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
user = "root"
password = ""
strategy = "basic"

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

#### Start Vector

Use the following command to start the Vector service:

```bash
vector --config vector_config.toml
```

