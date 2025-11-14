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
wget https://zyk-bj-1316291683.cos.accelerate.myqcloud.com/vector-0.49.0.custom.9eb55ef09-x86_64-unknown-linux-gnu.tar.gz
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
| `request.rate_limit_num` | integer | `9_223_372_036_854_775_807` | 每个时间窗内允许的请求数，默认近似无限制 |
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

`headers` 是一个键值对映射，直接透传为 Doris Stream Load 的 HTTP 头。常见设置如下（所有值均需为字符串）：

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

| 参数名称 | 类型 | 默认值 | 说明 |
|--------|------|------|-----|
| `max_retries` | integer | `-1` | Sink 级别的最大重试次数，`-1` 表示无限制 |
| `log_request` | boolean | `false` | 是否打印每次 Stream Load 请求与响应（生产环境建议按需开启） |
| `compression` | string/object | `"none"` | HTTP 请求体压缩算法，支持 `none`、`gzip`、`zlib`、`zstd`、`snappy`，可通过对象形式指定压缩级别 |
| `distribution.retry_initial_backoff_secs` | integer | `1` | 端点健康检查恢复的初始回退时间（秒） |
| `distribution.retry_max_duration_secs` | integer | `3600` | 健康检查最大回退时长（秒） |
| `tls.verify_certificate` | boolean | `true` | 启用/禁用上游证书校验 |
| `tls.verify_hostname` | boolean | `true` | 启用/禁用主机名校验 |
| `tls.ca_file` / `tls.crt_file` / `tls.key_file` / `tls.key_pass` / `tls.alpn_protocols` / `tls.server_name` | 各类 | - | 标准 Vector TLS 客户端配置项，用于自定义 CA、双向认证或 SNI |
| `acknowledgements.enabled` | boolean | `false` | 启用端到端确认，用于与支持 acknowledgements 的 Source 组合 |
## 使用示例

以下将通过一个完整的 Web 服务器访问日志采集示例，展示如何使用 Vector 将日志数据实时写入 Doris。

### Web 服务器访问日志采集

#### 准备数据源

在开始之前，我们需要准备 Web 服务器的访问日志文件。这些日志文件通常采用管道符（|）分隔格式。

1. **创建日志目录**：
   ```bash
   mkdir -p /var/log/webserver
   ```

2. **日志文件格式说明**：
   
   每行记录采用管道符（|）分隔，包含以下字段：

   | 字段序号 | 字段名称 | 类型 | 示例值 | 说明 |
   |---------|----------|------|--------|------|
   | 1 | 时间戳 | DATETIME | `2024-01-15 10:30:25` | 请求发生时间 |
   | 2 | 客户端IP | VARCHAR | `192.168.1.100` | 发起请求的客户端地址 |
   | 3 | HTTP方法 | VARCHAR | `GET` | HTTP 请求方法 |
   | 4 | 请求URL | VARCHAR | `/api/users` | 请求的资源路径 |
   | 5 | HTTP版本 | VARCHAR | `HTTP/1.1` | HTTP 协议版本 |
   | 6 | 状态码 | INT | `200` | HTTP 响应状态码 |
   | 7 | 响应大小 | BIGINT | `1024` | 响应内容字节数 |
   | 8 | 来源页面 | VARCHAR | `https://example.com/dashboard` | HTTP Referer 头 |
   | 9 | 用户代理 | VARCHAR | `Mozilla/5.0...` | User-Agent 信息 |
   | 10 | 请求处理时间 | DECIMAL | `0.045` | 服务器处理时间（秒） |
   | 11 | 上游响应时间 | DECIMAL | `0.032` | 后端服务响应时间（秒） |
   | 12 | 日志级别 | VARCHAR | `INFO` | 日志记录级别 |

   **示例数据**：
   ```text
   2024-01-15 10:30:25|192.168.1.100|GET|/api/users|HTTP/1.1|200|1024|https://example.com/dashboard|Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36|0.045|0.032|INFO
   2024-01-15 10:30:26|10.0.0.50|POST|/api/login|HTTP/1.1|401|256|-|curl/7.68.0|0.012|0.008|WARN
   2024-01-15 10:30:27|172.16.0.25|GET|/static/css/main.css|HTTP/1.1|200|4096|https://example.com/|Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)|0.003|0.001|INFO
   ```

3. **设置文件权限**：
   ```bash
   chmod 644 /var/log/webserver/*.log
   ```


#### 创建 Doris 表

在 Doris 中创建用于存储访问日志的目标表：

```sql
CREATE DATABASE IF NOT EXISTS vector_test;

CREATE TABLE IF NOT EXISTS vector_test.web_access_logs (
    timestamp DATETIME,
    client_ip VARCHAR(45),
    method VARCHAR(10),
    url VARCHAR(2048),
    http_version VARCHAR(10),
    status_code INT,
    response_size BIGINT,
    referer VARCHAR(2048),
    user_agent VARCHAR(1024),
    request_time DECIMAL(10,3),
    upstream_time DECIMAL(10,3),
    log_level VARCHAR(20)
)
DUPLICATE KEY(timestamp, client_ip)
DISTRIBUTED BY HASH(client_ip) BUCKETS 10
PROPERTIES (
    "replication_num" = "1"
);
```

:::tip 表模型选择
这里使用 DUPLICATE KEY 模型，因为访问日志场景中可能存在相同时间戳的多个请求记录，DUPLICATE 模型能够很好地支持这种数据特征。
:::

#### Vector 配置

Vector 通过配置文件定义数据流处理管道，包括数据源（**sources**）、数据转换（**transforms**）和目标系统（**sinks**）。

以下是完整的 `vector.toml` 配置文件示例（也支持 YAML 格式），该配置实现了从日志文件读取数据、解析管道符分隔的访问日志，并将处理后的数据写入 Doris：

```toml
[sources.web_logs]
type = "file"
include = [
  "/var/log/webserver/*.log",
  "/var/log/nginx/access.log*",
  "/var/log/apache2/access.log*"
]
read_from = "end"  # Read new logs in real-time
line_delimiter = "\n"
ignore_checkpoints = false  # Keep checkpoints for production environment
ignore_older_secs = 0

[sources.web_logs.fingerprint]
strategy = "checksum"

[transforms.parse_access_logs]
type = "remap"
inputs = ["web_logs"]
source = '''
if !exists(.message) || is_null(.message) || .message == "" {
  abort
}
parts = split!(.message, "|")
. = {
  "timestamp": parse_timestamp!(parts[0], "%Y-%m-%d %H:%M:%S"),
  "client_ip": parts[1],
  "method": parts[2],
  "url": parts[3],
  "http_version": parts[4],
  "status_code": to_int!(parts[5]),
  "response_size": to_int!(parts[6]),
  "referer": if parts[7] == "-" { null } else { parts[7] },
  "user_agent": parts[8],
  "request_time": to_float!(parts[9]),
  "upstream_time": to_float!(parts[10]),
  "log_level": parts[11]
}
'''

[sinks.doris]
type = "doris"
inputs = ["parse_access_logs"]
endpoints = ["https://localhost:8030"]
database = "vector_test"
table = "web_access_logs"
label_prefix = "web_logs"
log_request = true

[sinks.doris.encoding]
codec = "json"

[sinks.doris.encoding.framing]
method = "newline_delimited"

[sinks.doris.auth]
user = "root"
password = ""
strategy = "basic"

[sinks.doris.headers]
format = "json"
strip_outer_array = "false"
read_json_by_line = "true"

[sinks.doris.batch]
max_events = 10000      # Moderate batch size for high log volume
max_bytes = 10485760    # 10MB
timeout_secs = 10       # Short timeout for real-time processing
```

#### 配置详解

**1. 数据源配置（Sources）**
- `type = "file"`: 使用文件类型数据源
- `include`: 指定要监控的日志文件路径，支持通配符
- `read_from = "end"`: 从文件末尾开始读取，适合实时日志处理
- `fingerprint.strategy = "checksum"`: 使用校验和策略来识别文件

**2. 数据转换配置（Transforms）**
- 使用 VRL（Vector Remap Language）编写转换逻辑
- 将管道符分隔的原始日志解析为结构化的 JSON 数据
- 包含数据类型转换和空值处理逻辑

**3. 数据写入配置（Sinks）**
- 配置 Doris 集群连接信息和认证
- 设置批处理参数以优化写入性能
- 启用请求日志记录便于问题排查

#### 启动 Vector

使用以下命令启动 Vector 服务：

```bash
vector --config vector.toml
```