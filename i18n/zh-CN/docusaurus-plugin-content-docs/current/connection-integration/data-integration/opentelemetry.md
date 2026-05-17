---
{
    "title": "OpenTelemetry",
    "language": "zh-CN",
    "description": "介绍如何通过 OpenTelemetry Collector Doris Exporter 将日志、Trace 和 Metrics 写入 Apache Doris，进行统一可观测性分析。",
    "keywords": [
        "OpenTelemetry Doris",
        "OpenTelemetry Collector",
        "Doris Exporter",
        "可观测性数据",
        "日志采集",
        "Trace 数据"
    ]
}
---

<!-- 知识类型: 操作指南 / 配置参考 -->
<!-- 适用场景: 使用 OpenTelemetry 将日志、Trace 和 Metrics 写入 Apache Doris -->

OpenTelemetry（简称 OTel）是一个中立厂商的开源可观测性框架，用于监测、生成、收集和导出日志、链路追踪和指标等可观测性数据。OpenTelemetry 定义了一套可观测性标准和协议，被可观测性社区和厂商广泛采纳，逐渐成为可观测性领域的事实标准。

OpenTelemetry 提供框架和可观测性数据采集 SDK，使应用程序和系统可以在不同编程语言、基础设施和运行时环境中完成监测。Doris 可以作为 OpenTelemetry 的存储后端，提供高性能、低成本、统一的可观测性数据存储和分析能力。整体架构如下：

![Doris Opentelemetry Integration](/images/next/connection-integration/data-integration/opentelemetry/opentelemetry.jpg)

## 适用场景与接入流程

<!-- 知识类型: 架构选型决策 -->
<!-- 适用场景: 根据可观测性数据类型选择 OpenTelemetry Collector 配置 -->

你可以根据数据类型选择对应的接入方式：

| 用户场景 | 推荐配置 | 参考章节 |
| --- | --- | --- |
| 采集 Doris FE 等普通 TEXT 日志，并处理 Java stacktrace 等多行日志 | 使用 `filelog` receiver、`multiline` 和 `regex_parser`，将多行日志合并并解析后写入 Doris | [采集 Doris FE TEXT 日志](#采集-doris-fe-text-日志) |
| 采集每行一个 JSON 对象的结构化日志 | 使用 `filelog` receiver 和 `json_parser`，将 JSON 行日志解析后写入 Doris | [采集 GitHub Events JSON 日志](#采集-github-events-json-日志) |
| 采集应用 Trace 数据 | 使用 `otlp` receiver 接收 OpenTelemetry Java Agent 上报的数据，再通过 Doris Exporter 写入 Doris | [采集应用 Trace 数据](#采集应用-trace-数据) |
| 配置 Doris 写入目标、自动建表、分区保留和 Stream Load 参数 | 在 Doris Exporter 中配置 `endpoint`、`database`、`table.*`、`create_schema`、`headers` 等参数 | [配置 Doris Exporter](#配置-doris-exporter) |

使用 OpenTelemetry Collector Doris Exporter 接入 Doris 的基本流程如下：

1. 下载并解压 OpenTelemetry Collector Contrib。
2. 配置 Doris Exporter，包括 Doris FE 地址、账号、目标库表和 Stream Load 参数。
3. 根据数据类型配置 receiver、processor 和 pipeline。
4. 启动 Collector，将日志、Trace 或 Metrics 数据写入 Doris。
5. 通过 Stream Load 响应日志和写入速度日志观察导入结果。

## 安装 OpenTelemetry Collector Contrib

<!-- 知识类型: 操作步骤 -->
<!-- 适用场景: 准备包含 Doris Exporter 的 OpenTelemetry Collector 运行环境 -->

从 [OpenTelemetry 官方 Release 页面](https://github.com/open-telemetry/opentelemetry-collector-releases/releases) 下载 OpenTelemetry Collector Contrib 安装包。Contrib 版本包含 Doris Exporter，例如：

```bash
wget https://github.com/open-telemetry/opentelemetry-collector-releases/releases/download/v0.132.2/otelcol-contrib_0.132.2_linux_amd64.tar.gz
```

下载后解压安装包，即可得到 `otelcol-contrib` 可执行文件。

## 配置 Doris Exporter

<!-- 知识类型: 配置参数 -->
<!-- 适用场景: 配置 OpenTelemetry Collector 将可观测性数据写入 Doris -->

OpenTelemetry Collector Doris Exporter 通过 [Doris Stream Load](../../data-operate/import/import-way/stream-load-manual) HTTP 接口写入数据。核心配置项如下：

| 配置项 | 默认值 | 说明 |
| --- | --- | --- |
| `endpoint` | 无 | Doris FE HTTP 地址，格式是 `host:port`，例如 `127.0.0.1:8030`。 |
| `mysql_endpoint` | 无 | Doris FE MySQL 地址，格式是 `host:port`，例如 `127.0.0.1:9030`。 |
| `username` | 无 | Doris 用户名。该用户需要具有对应库表的写入权限。 |
| `password` | 无 | Doris 用户的密码。 |
| `database` | 无 | 要写入的 Doris 库名。 |
| `table.logs` | `otel_logs` | logs 数据写入的 Doris 表名。 |
| `table.traces` | `otel_traces` | traces 数据写入的 Doris 表名。 |
| `table.metrics` | `otel_metrics` | metrics 数据写入的 Doris 表名。 |
| `create_schema` | `true` | 是否自动创建 Doris 库表。 |
| `history_days` | `0` | 自动创建的 Doris 表的历史数据保留天数。`0` 表示永久保留。 |
| `create_history_days` | `0` | 自动创建的 Doris 表的初始分区天数。`0` 表示不创建分区。 |
| `label_prefix` | `open_telemetry` | Doris Stream Load Label 前缀。最终生成的 Label 格式为 `{label_prefix}_{db}_{table}_{yyyymmdd_hhmmss}_{uuid}`。 |
| `headers` | 无 | Doris Stream Load 的 headers 参数，语法格式为 YAML map。 |
| `log_progress_interval` | `10` | 在日志中输出写入速度的时间间隔，单位为秒。设置为 `0` 可以关闭该日志。 |

更多配置请参考 [OpenTelemetry Collector Contrib Doris Exporter 文档](https://github.com/open-telemetry/opentelemetry-collector-contrib/tree/main/exporter/dorisexporter)。

## 采集 Doris FE TEXT 日志

<!-- 知识类型: 操作步骤 -->
<!-- 适用场景: 采集普通文本日志并处理跨行 stacktrace -->

该场景以 Doris FE 日志为例，展示如何采集 TEXT 日志并写入 Doris。

### 步骤 1：准备日志文件

Doris FE 日志文件通常位于 Doris 安装目录下的 `fe/log/fe.log`。FE 日志是典型的 Java 程序日志，包含时间戳、日志级别、线程名、代码位置、日志内容等字段。日志中既有普通日志，也有带 stacktrace 的异常日志。由于 stacktrace 跨多行，采集时需要将主日志和对应的 stacktrace 合并为一条日志。

```text
2024-07-08 21:18:01,432 INFO (Statistics Job Appender|61) [StatisticsJobAppender.runAfterCatalogReady():70] Stats table not available, skip
2024-07-08 21:18:53,710 WARN (STATS_FETCH-0|208) [StmtExecutor.executeInternalQuery():3332] Failed to run internal SQL: OriginStatement{originStmt='SELECT * FROM __internal_schema.column_statistics WHERE part_id is NULL  ORDER BY update_time DESC LIMIT 500000', idx=0}
org.apache.doris.common.UserException: errCode = 2, detailMessage = tablet 10031 has no queryable replicas. err: replica 10032's backend 10008 does not exist or not alive
        at org.apache.doris.planner.OlapScanNode.addScanRangeLocations(OlapScanNode.java:931) ~[doris-fe.jar:1.2-SNAPSHOT]
        at org.apache.doris.planner.OlapScanNode.computeTabletInfo(OlapScanNode.java:1197) ~[doris-fe.jar:1.2-SNAPSHOT]
```

### 步骤 2：编写 OpenTelemetry 配置

日志采集配置文件 `opentelemetry_java_log.yml` 主要包含三部分：

| 配置部分 | 作用 |
| --- | --- |
| `receivers` | 读取原始数据。 |
| `processors` | 对数据进行转换和批处理。 |
| `exporters` | 将数据输出到 Doris。 |

```yaml
# 1. receivers 负责读取原始数据。
# filelog 是本地 receiver，可以读取本地文件系统中的日志文件。
# multiline 会把非时间戳开头的行拼接到上一行后面，用于合并 stacktrace 和主日志。
receivers:
  filelog:
    include:
      - /path/to/fe.log
    start_at: beginning
    multiline:
      line_start_pattern: '^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2},\d{3}' # 匹配时间戳作为新日志开始
    operators:
      - type: regex_parser
        regex: '^(?P<time>\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2},\d{3}) (?P<severity>INFO|WARN|ERROR) (?P<message>.*)'
        timestamp:
          parse_from: attributes.time
          layout: '%Y-%m-%d %H:%M:%S,%f'
        severity:
          parse_from: attributes.severity
          trace: TRACE
          debug: DEBUG
          info: INFO
          warn: WARN
          error: ERROR
          fatal: FATAL

# 2. processors 负责做数据转换。
# batch processor 会将数据攒成批次后再发送。
processors:
  batch:
    send_batch_size: 100000 # 每个批次的数据条数，建议 batch 的数据量在 100M-1G 之间
    timeout: 10s

# 3. exporters 负责将数据输出。
# doris exporter 使用 Stream Load HTTP 接口写入 Doris。
# 默认 Stream Load 数据格式为 JSON，Stream Load 会解析 JSON 字段并写入 Doris 表中的对应字段。
exporters:
  doris:
    endpoint: http://localhost:8030 # FE HTTP 地址
    mysql_endpoint: localhost:9030 # FE MySQL 地址
    database: doris_db_name
    username: doris_username
    password: doris_password
    table:
      logs: otel_logs
    create_schema: true # 是否自动创建 schema，如果设置为 false，则需要手动建表
    history_days: 10
    create_history_days: 10
    timezone: Asia/Shanghai
    timeout: 60s # HTTP Stream Load 客户端超时时间
    log_response: true
    sending_queue:
      enabled: true
      num_consumers: 20
      queue_size: 1000
    retry_on_failure:
      enabled: true
      initial_interval: 5s
      max_interval: 30s
    headers:
      load_to_single_tablet: "true"

service:
  pipelines:
    logs:
      receivers: [filelog]
      processors: [batch]
      exporters: [doris]
```

### 步骤 3：运行 OpenTelemetry Collector

```bash
./otelcol-contrib --config config/opentelemetry_java_log.yml
```

### 步骤 4：查看写入结果

当 `log_response` 为 `true` 时，日志会输出每次 Stream Load 的请求参数和响应结果：

```text
2025-08-18T00:33:22.543+0800    info    dorisexporter@v0.132.0/exporter_logs.go:181    log response:
{
    "TxnId": 52,
    "Label": "open_telemetry_otel_otel_logs_20250818003321_498bb8ec-040c-4982-9eb4-452b15129782",
    "Comment": "",
    "TwoPhaseCommit": "false",
    "Status": "Success",
    "Message": "OK",
    "NumberTotalRows": 50355,
    "NumberLoadedRows": 50355,
    "NumberFilteredRows": 0,
    "NumberUnselectedRows": 0,
    "LoadBytes": 31130235,
    "LoadTimeMs": 680,
    "BeginTxnTimeMs": 0,
    "StreamLoadPutTimeMs": 3,
    "ReadDataTimeMs": 106,
    "WriteDataTimeMs": 653,
    "ReceiveDataTimeMs": 11,
    "CommitAndPublishTimeMs": 23
}
```

默认每隔 10 秒会输出写入速度信息，包括自启动以来的数据量（MB 和 ROWS）、总速度（MB/s 和 R/s）以及最近 10 秒速度：

```text
2025-08-18T00:05:00.017+0800    info    dorisexporter@v0.132.0/progress_reporter.go:63    [LOG] total 11 MB 18978 ROWS, total speed 0 MB/s 632 R/s, last 10 seconds speed 1 MB/s 1897 R/s
```

## 采集 GitHub Events JSON 日志

<!-- 知识类型: 操作步骤 -->
<!-- 适用场景: 采集每行一个 JSON 对象的结构化日志 -->

该场景以 GitHub Events Archive 数据为例，展示如何采集 JSON 日志并写入 Doris。

### 步骤 1：准备 JSON 数据

GitHub Events Archive 是 GitHub 用户操作事件的归档数据，格式是 JSON，可以从 [https://www.gharchive.org/](https://www.gharchive.org/) 下载。以下示例下载 2024 年 1 月 1 日 15 点的数据：

```bash
wget https://data.gharchive.org/2024-01-01-15.json.gz
```

下面是一条数据样例。实际数据是一行一个 JSON 对象，这里为了便于阅读进行了格式化。

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

### 步骤 2：编写 OpenTelemetry 配置

与 TEXT 日志采集不同，JSON 日志采集在 `filelog` receiver 中使用 `json_parser`。`json_parser` 会将每一行文本当作 JSON 解析，解析后的字段用于后续处理。

```yaml
receivers:
  filelog:
    include:
      - /path/to/2024-01-01-15.json
    start_at: beginning
    operators:
      - type: json_parser
        timestamp:
          parse_from: attributes.created_at
          layout: '%Y-%m-%dT%H:%M:%SZ'

processors:
  batch:
    send_batch_size: 100000 # 每个批次的数据条数，建议 batch 的数据量在 100M-1G 之间
    timeout: 10s

exporters:
  doris:
    endpoint: http://localhost:8030 # FE HTTP 地址
    mysql_endpoint: localhost:9030 # FE MySQL 地址
    database: doris_db_name
    username: doris_username
    password: doris_password
    table:
      logs: otel_logs
    create_schema: true # 是否自动创建 schema，如果设置为 false，则需要手动建表
    history_days: 10
    create_history_days: 10
    timezone: Asia/Shanghai
    timeout: 60s # HTTP Stream Load 客户端超时时间
    log_response: true
    sending_queue:
      enabled: true
      num_consumers: 20
      queue_size: 1000
    retry_on_failure:
      enabled: true
      initial_interval: 5s
      max_interval: 30s
    headers:
      load_to_single_tablet: "true"

service:
  pipelines:
    logs:
      receivers: [filelog]
      processors: [batch]
      exporters: [doris]
```

### 步骤 3：运行 OpenTelemetry Collector

```bash
./otelcol-contrib --config config/opentelemetry_json_log.yml
```

## 采集应用 Trace 数据

<!-- 知识类型: 操作步骤 -->
<!-- 适用场景: 使用 OpenTelemetry Java Agent 采集应用 Trace 并写入 Doris -->

该场景展示如何通过 OTLP 协议接收应用侧上报的 Trace 数据，并将 Trace 写入 Doris。

### 步骤 1：编写 OpenTelemetry 配置

创建 `otel_trace.yaml` 配置文件：

```yaml
receivers:
  otlp: # OTLP 协议，接收 OpenTelemetry Java Agent 发送的数据
    protocols:
      grpc:
        endpoint: 0.0.0.0:4317
      http:
        endpoint: 0.0.0.0:4318

processors:
  batch:
    send_batch_size: 100000 # 每个批次的数据条数，建议 batch 的数据量在 100M-1G 之间
    timeout: 10s

exporters:
  doris:
    endpoint: http://localhost:8030 # FE HTTP 地址
    database: doris_db_name
    username: doris_username
    password: doris_password
    table:
      traces: doris_table_name
    create_schema: true # 是否自动创建 schema，如果设置为 false，则需要手动建表
    mysql_endpoint: localhost:9030 # FE MySQL 地址
    history_days: 10
    create_history_days: 10
    timezone: Asia/Shanghai
    timeout: 60s # HTTP Stream Load 客户端超时时间
    log_response: true
    sending_queue:
      enabled: true
      num_consumers: 20
      queue_size: 1000
    retry_on_failure:
      enabled: true
      initial_interval: 5s
      max_interval: 30s
    headers:
      load_to_single_tablet: "true"

service:
  pipelines:
    traces:
      receivers: [otlp]
      processors: [batch]
      exporters: [doris]
```

### 步骤 2：运行 OpenTelemetry Collector

```bash
./otelcol-contrib --config otel_trace.yaml
```

### 步骤 3：应用侧接入 OpenTelemetry SDK

以下示例使用 Spring Boot 示例应用接入 OpenTelemetry Java SDK。示例应用来自官方 [demo](https://docs.spring.io/spring-boot/tutorial/first-application/index.html)，对路径 `/` 返回简单的 `Hello World!` 字符串。

下载 [OpenTelemetry Java Agent](https://github.com/open-telemetry/opentelemetry-java-instrumentation/releases)。使用 Java Agent 的优势是不需要修改现有应用代码。其他语言和接入方式请参考 OpenTelemetry 官网的 [Language APIs & SDKs](https://opentelemetry.io/docs/languages/) 或 [Zero-code Instrumentation](https://opentelemetry.io/docs/zero-code/)。

启动应用之前，添加以下环境变量：

```bash
export JAVA_TOOL_OPTIONS="${JAVA_TOOL_OPTIONS} -javaagent:/your/path/to/opentelemetry-javaagent.jar" # OpenTelemetry Java Agent 的路径
export OTEL_JAVAAGENT_LOGGING="none" # 禁用 OTel log，防止干扰服务本身的日志
export OTEL_SERVICE_NAME="myproject"
export OTEL_TRACES_EXPORTER="otlp" # 使用 OTLP 协议发送 Trace 数据
export OTEL_EXPORTER_OTLP_ENDPOINT="http://localhost:4317" # OpenTelemetry Collector 的地址

java -jar myproject-0.0.1-SNAPSHOT.jar
```
