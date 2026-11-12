---
{
    "title": "Integrating Vector with Doris",
    "language": "zh-CN"
}
---

# Integrating Vector with Doris

## 关于 Vector

Vector 是一个高性能的可观测性数据管道，采用 Rust 语言开发，专门用于收集、转换和路由日志、指标以及链路追踪数据。为了更好地支持 Doris 生态系统，我们专门为 Vector 开发了 Doris Sink 组件，能够将各类数据源的数据高效地写入 Doris 进行分析处理。

## 安装部署

### 下载安装包
```shell
wget https://apache-doris-releases.oss-cn-beijing.aliyuncs.com/extension/vector-x86_64-unknown-linux-gnu.tar.gz
```

### 从源码编译
```shell
cd ${Vector_HOME}

## 可根据部署环境自行选择，Makefile 中提供了多种选项
make package-x86_64-unknown-linux-gnu
```


## 配置参数

Doris Sink 支持丰富的配置选项，以满足不同场景下的数据写入需求：

### 基础配置

| 参数名称       | 类型          | 默认值     | 说明 |
|--------------|-------------|----------|-----|
| `type`       | string      | -        | 固定为 `doris` |
| `inputs`     | array       | -        | 上游数据源名称列表 |
| `endpoints`  | array\<string> | -     | Doris FE HTTP/HTTPS 地址，必须包含协议与端口，如 `["https://fe1:8030"]` |
| `database`   | string/模板   | -        | 目标数据库名称，支持 [Template](https://vector.dev/docs/reference/configuration/template-syntax/) |
| `table`      | string/模板   | -        | 目标表名称，支持模板 |
| `label_prefix` | string    | `"vector"` | Stream Load 标签前缀，最终标签形式为 `{label_prefix}_{database}_{table}_{timestamp}_{uuid}` |

### 认证配置

| 参数名称        | 类型   | 默认值    | 说明 |
|---------------|------|---------|-----|
| `auth.strategy` | string | `"basic"` | 认证策略，目前 Doris 仅支持 Basic Auth |
| `auth.user`     | string | -         | Doris 用户名 |
| `auth.password` | string | -         | Doris 密码，可配合环境变量或密钥管理系统 |

### 请求与并发配置

| 参数名称 | 类型 | 默认值 | 说明 |
|--------|------|------|-----|
| `request.concurrency` | string/integer | `"adaptive"` | 控制并发策略，支持 `"adaptive"`、`"none"`（串行）或正整数并发上限 |
| `request.timeout_secs` | integer | `60` | 单次 Stream Load 请求的超时（秒） |
| `request.rate_limit_duration_secs` | integer | `1` | 速率限制时间窗（秒） |
| `request.rate_limit_num` | integer | `i64::MAX` | 每个时间窗内允许的请求数，默认近似无限制 |
| `request.retry_attempts` | integer | `usize::MAX` | Tower 中间件的最大重试次数，缺省表示无限重试 |
| `request.retry_initial_backoff_secs` | integer | `1` | 第一次重试前的等待时间（秒），后续按 Fibonacci 退避 |
| `request.retry_max_duration_secs` | integer | `30` | 单次重试退避的最大等待时长（秒） |
| `request.retry_jitter_mode` | string | `"full"` | 重试抖动模式，支持 `full` 或 `none` |

**自适应并发 (`request.adaptive_concurrency`，仅在 `request.concurrency = "adaptive"` 时生效)**

| 参数名称 | 类型 | 默认值 | 说明 |
|--------|------|------|-----|
| `request.adaptive_concurrency.initial_concurrency` | integer | `1` | 自适应并发的起始值 |
| `request.adaptive_concurrency.max_concurrency_limit` | integer | `200` | 自适应并发的上限，防止过载 |
| `request.adaptive_concurrency.decrease_ratio` | float | `0.9` | 触发降速时使用的缩减比例 |
| `request.adaptive_concurrency.ewma_alpha` | float | `0.4` | RTT 指标的指数移动平均权重 |
| `request.adaptive_concurrency.rtt_deviation_scale` | float | `2.5` | RTT 偏差放大系数，用于忽略正常波动 |

### 编码与数据格式

Doris Sink 使用 `encoding` 区块控制事件序列化行为，默认发出 NDJSON（换行分隔的 JSON）：

| 参数名称 | 类型 | 默认值 | 说明 |
|--------|------|------|-----|
| `encoding.codec` | string | `"json"` | 序列化编码，可选 `json`、`text`、`csv` 等 |
| `encoding.timestamp_format` | string | - | 调整时间戳输出格式，支持 `rfc3339`、`unix` 等 |
| `encoding.only_fields` / `encoding.except_fields` | array\<string> | - | 控制字段白名单或黑名单 |
| `encoding.framing.method` | string | 自动推断 | 当需要自定义帧格式时设置，如 `newline_delimited`、`character_delimited` |

#### Stream Load 头部（`headers`）

`headers` 是一个键值对映射，直接透传为 Doris Stream Load 的 HTTP 头，你可以使用 stream load 中 header 可传入的所有参数。
常见设置如下（所有值均需为字符串）：

| 参数名称 | 类型 | 默认值 | 说明 |
|--------|------|------|-----|
| `headers.format` | string | `"json"` | 数据格式，支持 `json`、`csv`、`parquet` 等 |
| `headers.read_json_by_line` | string | `"true"` | 是否按行读取 JSON（NDJSON） |
| `headers.strip_outer_array` | string | `"false"` | 是否移除最外层数组 |
| `headers.column_separator` | string | - | CSV 列分隔符（`format = csv` 时生效） |
| `headers.columns` | string | - | CSV/JSON 映射的列顺序，如 `timestamp,client_ip,status_code` |
| `headers.where` | string | - | Stream Load `where` 过滤条件 |

### 批处理配置

| 参数名称 | 类型 | 默认值 | 说明 |
|--------|------|------|-----|
| `batch.max_bytes` | integer | `10485760` | 单批最大字节数（10 MB） |
| `batch.max_events` | integer/`null` | `null` | 单批最大事件数，默认不限制，以字节数为主 |
| `batch.timeout_secs` | float | `1` | 批次最长等待时间（秒） |

### 可靠性与安全配置

| 参数名称 | 类型      | 默认值     | 说明                                         |
|--------|---------|---------|--------------------------------------------|
| `max_retries` | integer | `-1`    | Sink 级别的最大重试次数，`-1` 表示无限制                  |
| `log_request` | boolean | `false` | 是否打印每次 Stream Load 请求与响应（生产环境建议按需开启）       |
| `compression` | -       | `未支持`   | -                                          |
| `distribution.retry_initial_backoff_secs` | integer | `1`     | 端点健康检查恢复的初始回退时间（秒）                         |
| `distribution.retry_max_duration_secs` | integer | `3600`  | 健康检查最大回退时长（秒）                              |
| `tls.verify_certificate` | boolean | `true`  | 启用/禁用上游证书校验                                |
| `tls.verify_hostname` | boolean | `true`  | 启用/禁用主机名校验                                 |
| `tls.ca_file` / `tls.crt_file` / `tls.key_file` / `tls.key_pass` / `tls.alpn_protocols` / `tls.server_name` | 各类      | -       | 标准 Vector TLS 客户端配置项，用于自定义 CA、双向认证或 SNI    |
| `acknowledgements.enabled` | boolean | `false` | 启用端到端确认，用于与支持 acknowledgements 的 Source 组合 |

## 使用示例

### TEXT 日志采集示例

该示例以 Doris FE 的日志为例展示 TEXT 日志采集。

**1. 数据**

FE 日志文件一般位于 Doris 安装目录下的 fe/log/fe.log 文件，是典型的 Java 程序日志，包括时间戳，日志级别，线程名，代码位置，日志内容等字段。不仅有正常的日志，还有带 stacktrace 的异常日志，stacktrace 是跨行的，日志采集存储需要把主日志和 stacktrace 组合成一条日志。

```
2024-07-08 21:18:01,432 INFO (Statistics Job Appender|61) [StatisticsJobAppender.runAfterCatalogReady():70] Stats table not available, skip
2024-07-08 21:18:53,710 WARN (STATS_FETCH-0|208) [StmtExecutor.executeInternalQuery():3332] Failed to run internal SQL: OriginStatement{originStmt='SELECT * FROM __internal_schema.column_statistics WHERE part_id is NULL  ORDER BY update_time DESC LIMIT 500000', idx=0}
org.apache.doris.common.UserException: errCode = 2, detailMessage = tablet 10031 has no queryable replicas. err: replica 10032's backend 10008 does not exist or not alive
        at org.apache.doris.planner.OlapScanNode.addScanRangeLocations(OlapScanNode.java:931) ~[doris-fe.jar:1.2-SNAPSHOT]
        at org.apache.doris.planner.OlapScanNode.computeTabletInfo(OlapScanNode.java:1197) ~[doris-fe.jar:1.2-SNAPSHOT]
```

**2. 建表**

表结构包括日志的产生时间，采集时间，主机名，日志文件路径，日志类型，日志级别，线程名，代码位置，日志内容等字段。

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

**3. Vector 配置**

```toml
# ==================== Sources ====================
[sources.fe_log_input]
  type = "file"
  include = ["/path/fe/log/fe.log"]
  start_at_beginning = true
  max_line_bytes = 102400
  ignore_older_secs = 0
  fingerprint.strategy = "device_and_inode"
  
  # 多行日志处理 - 对应 Logstash 的 multiline codec
  # 以时间戳开头的行是新日志，其他行合并到前一行（处理 stacktrace）
  multiline.start_pattern = "^\\d{4}-\\d{2}-\\d{2} \\d{2}:\\d{2}:\\d{2},\\d{3}"
  multiline.mode = "halt_before"
  multiline.condition_pattern = "^\\d{4}-\\d{2}-\\d{2} \\d{2}:\\d{2}:\\d{2},\\d{3}"
  multiline.timeout_ms = 10000

# ==================== Transforms ====================
# 使用 grok 解析日志内容
[transforms.parse_log]
  inputs = ["fe_log_input"]
  type = "remap"
  source = '''
    # 添加 type 字段（对应 Logstash 的 add_field）
    .type = "fe.log"
    
    # 添加 collect_time（对应 Logstash 的 @timestamp）
    # 使用 Asia/Shanghai 时区，与 log_time 保持一致
    .collect_time = format_timestamp!(.timestamp, format: "%Y-%m-%d %H:%M:%S", timezone: "Asia/Shanghai")
    
    # 解析日志格式：2024-01-01 12:00:00,123 INFO (thread-name) [position] message
    # 使用 (?s) 启用 DOTALL 模式，让 .* 可以匹配换行符（处理多行日志）
    parsed, err = parse_regex(.message, r'(?s)^(?P<log_time>\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2},\d{3}) (?P<level>[A-Z]+) \((?P<thread>[^\)]+)\) \[(?P<position>[^\]]+)\] (?P<content>.*)')
    
    # 提取解析出的字段
    if err == null {
      .log_time = parsed.log_time
      .level = parsed.level
      .thread = parsed.thread
      .position = parsed.position
      # 保留完整的原始 message（包括多行堆栈信息）
    } else {
      # 如果解析失败，设置默认值避免 NULL（避免分区错误）
      .log_time = .collect_time
      .level = "UNKNOWN"
      .thread = ""
      .position = ""
    }
    
    # 提取 host 和 path（Vector 会自动添加这些元数据）
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

**4. 运行 Vector**

```

${VECTOR_HOME}/bin/vector --config vector_fe_log.toml

# log_request 为 true 时日志会输出每次 Stream Load 的请求参数和响应结果
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

### JSON 日志采集示例

该样例以 github events archive 的数据为例展示 JSON 日志采集。

**1. 数据**

github events archive 是 github 用户操作事件的归档数据，格式是 JSON，可以从 https://www.gharchive.org/ 下载，比如下载 2024 年 1 月 1 日 15 点的数据。

```
wget https://data.gharchive.org/2024-01-01-15.json.gz

```

下面是一条数据样例，实际一条数据一行，这里为了方便展示进行了格式化。

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


**2. Doris 建表**

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

**3. Vector 配置**

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
# 解析 JSON 格式的 GitHub Events 数据，VARIANT 类型可直接存储嵌套对象
[transforms.parse_json]
inputs = ["github_events_reload"]
type = "remap"
source = '''
    # 解析 JSON 数据（每行是一个完整的 JSON 对象）
    . = parse_json!(.message)
    
    # payload 字段转为 JSON 字符串（TEXT 类型）
    .payload = encode_json(.payload)
    
    # 只保留表中需要的字段
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

#### 启动 Vector

使用以下命令启动 Vector 服务：

```bash
vector --config vector_config.toml
```