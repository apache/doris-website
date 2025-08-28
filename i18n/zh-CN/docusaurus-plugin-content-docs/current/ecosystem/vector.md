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

| 参数名称                                               | 类型      | 默认值      | 说明                                      |
|----------------------------------------------------|---------|----------|-----------------------------------------|
| `type`                                             | string  | -        | 固定为 "doris"                             |
| `inputs`                                           | array   | -        | 上游数据源名称列表                               |
| `endpoints`                                        | array   | -        | Doris FE 节点地址列表，如 ["http://fe1:8030"]   |
| `database`                                         | string  | -        | 目标数据库名称                                 |
| `table`                                            | string  | -        | 目标表名称                                   |
| `label_prefix`                                     | string  | "vector" | Stream Load 标签前缀，建议使用有意义的名称如 "web_logs" |

### 认证配置

| 参数名称                                               | 类型      | 默认值      | 说明                                      |
|----------------------------------------------------|---------|----------|-----------------------------------------|
| `auth.strategy`                                    | string  | "basic"  | 认证策略，通常为 "basic"                        |
| `auth.user`                                        | string  | -        | Doris 用户名                               |
| `auth.password`                                    | string  | -        | Doris 密码                                |

### 请求配置

| 参数名称                                               | 类型      | 默认值      | 说明                                      |
|----------------------------------------------------|---------|----------|-----------------------------------------|
| `request.concurrency`                              | integer | 1        | 并发请求数                                   |
| `request.timeout_secs`                             | integer | 60       | 单次请求超时时间（秒）                             |
| `request.adaptive_concurrency.initial_concurrency` | integer | 1        | 自适应并发初始值                                |

### 数据格式配置

| 参数名称                                               | 类型      | 默认值      | 说明                                      |
|----------------------------------------------------|---------|----------|-----------------------------------------|
| `headers.format`                                   | string  | "json"   | 数据格式，支持 "json", "csv" 等                 |
| `headers.strip_outer_array`                        | string  | "false"  | 是否移除外层数组                                |
| `headers.read_json_by_line`                        | string  | "true"   | 是否按行读取 JSON（NDJSON 格式）                  |
| `headers.column_separator`                         | string  | -        | CSV 列分隔符（当 format=csv 时）                |
| `headers.columns`                                  | string  | -        | 指定列名映射                                  |
| `headers.where`                                    | string  | -        | 过滤条件                                    |

### 批处理配置

| 参数名称                                               | 类型      | 默认值      | 说明                                      |
|----------------------------------------------------|---------|----------|-----------------------------------------|
| `batch.max_events`                                 | integer | 1000     | 单批最大事件数                                 |
| `batch.max_bytes`                                  | integer | 10485760 | 单批最大字节数（默认10MB）                         |
| `batch.timeout_secs`                               | integer | 1        | 批处理超时时间（秒）                              |

### 高级配置

| 参数名称                                               | 类型      | 默认值      | 说明                                      |
|----------------------------------------------------|---------|----------|-----------------------------------------|
| `log_request`                                      | boolean | false    | 是否记录 Stream Load 请求和响应                  |
| `log_progress_interval`                            | integer | 10       | 进度日志打印间隔（秒）                             |
| `buffer_bound`                                     | integer | 10000    | 内部事件缓冲上限（条数）                            |
| `skip_unknown_fields`                              | boolean | false    | 是否跳过未知字段                                |
| `compression`                                      | string  | -        | 压缩格式，支持 "gzip", "lz4" 等                 |
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
endpoints = ["http://172.20.50.127:8030"]
database = "vector_test"
table = "web_access_logs"
label_prefix = "web_logs"
log_request = true
log_progress_interval = 5

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