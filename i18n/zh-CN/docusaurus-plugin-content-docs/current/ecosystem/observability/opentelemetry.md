---
{
    "title": "OpenTelemetry",
    "language": "zh-CN",
    "description": "OpenTelemetry（简称OTel），是一个中立厂商的开源可观测性框架，用于监测、生成、收集和导出日志、调用链追踪和指标等可观测性数据。OpenTelemetry 定义了一套可观测性的标准和协议，被可观测性社区和厂商广泛采纳，逐渐成为可观测性领域的事实标准。"
}
---

# OpenTelemetry Doris Integration

## 介绍

OpenTelemetry（简称OTel），是一个中立厂商的开源可观测性框架，用于监测、生成、收集和导出日志、调用链追踪和指标等可观测性数据。OpenTelemetry 定义了一套可观测性的标准和协议，被可观测性社区和厂商广泛采纳，逐渐成为可观测性领域的事实标准。

OpenTelemetry 本身实现了框架和可观测性数据采集 SDK，使应用程序和系统易于进行监测，无论使用何种编程语言、基础设施和运行时环境，而可观测性存储后端和可视化前端则留给其他工具来处理。Doris 作为一个存储后端与 OpenTelemetry 集成，提供高性能、低成本、统一的可观测性数据存储和分析能力，整体架构如下。

<img src="/zh-CN/images/observability/otel_demo_doris.png" alt="Doris OpenTelemetry Integration" />


## 安装

从 [OpenTelemetry 官方 Release 页面](https://github.com/open-telemetry/opentelemetry-collector-releases/releases) 下载 OpenTelemetry Collector Contrib 安装包，例如 https://github.com/open-telemetry/opentelemetry-collector-releases/releases/download/v0.132.2/otelcol-contrib_0.132.2_linux_amd64.tar.gz，安装包解压缩得到 otelcol-contrib 可执行文件。


## 参数配置

OpenTelemetry Collector Doris Exporter 的核心配置如下：

配置 | 说明
--- | ---
`endpoint` | Doris FE HTTP 地址，格式是 host:port，例如："127.0.0.1:8030"
`mysql_endpoint` | Doris FE MySQL 地址，格式是 host:port，例如："127.0.0.1:9030"
`username` | Doris 用户名，该用户需要有对应库表的写入权限
`password` | Doris 用户的密码
`database` | 要写入的 Doris 库名
`table.logs` | logs 数据写入的 Doris 表名，默认值是 otel_logs
`table.traces` | traces 数据写入的 Doris 表名，默认值是 otel_traces
`table.metrics` | metrics 数据写入的 Doris 表名，默认值是 otel_metrics
`create_schema` | 是否自动创建 Doris 库表，默认值是 true
`history_days` | 自动创建的 Doris 表的历史数据保留天数，默认值是 0 表示永久保留
`create_history_days` | 自动创建的 Doris 表的初始分区天数，默认值是 0 表示不创建分区
`label_prefix` | Doris Stream Load Label 前缀，最终生成的 Label 为 *{label_prefix}_{db}_{table}_{yyyymmdd_hhmmss}_{uuid}* ，默认值是 open_telemetry
`headers` | Doris Stream Load 的 headers 参数，语法格式为 YAML map
`log_progress_interval` | 日志中输出速度的时间间隔，单位是秒，默认为 10，设置为 0 可以关闭这种日志

更多配置请参考 https://github.com/open-telemetry/opentelemetry-collector-contrib/tree/main/exporter/dorisexporter 。


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

**2. OpenTelemetry 配置**


日志采集的配置文件如 opentelemetry_java_log.yml 主要由 3 部分组成，分别对应 ETL 的各个部分：
1. receivers 负责读取原始数据
2. processors 负责做数据转换
3. exporters 负责将数据输出

```
54.36.149.41 - - [22/Jan/2019:03:56:14 +0330] "GET
/filter/27|13%20%D9%85%DA%AF%D8%A7%D9%BE%DB%8C%DA%A9%D8%B3%D9%84,27|%DA%A9%D9%85%D8%AA%D8%B1%20%D8%A7%D8%B2%205%20%D9%85%DA%AF%D8%A7%D9%BE%DB%8C%DA%A9%D8%B3%D9%84,p53 HTTP/1.1" 200 30577 "-" "Mozilla/5.0 (compatible; AhrefsBot/6.1; +http://ahrefs.com/robot/)" "-"
```

```yaml
# 1. receivers 负责读取原始数据
# filelog 是一个本地 receiver，可以配置读取本地文件系统的日志文件路径，通过 multiline 将非时间开头的行拼接到上一行后面，实现 stacktrace 和主日志合并的效果。
receivers:
  filelog:
    include:
      - /path/to/fe.log
    start_at: beginning
    multiline:
      line_start_pattern: '^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2},\d{3}'  # 匹配时间戳作为新日志开始
    operators:
      # 解析日志
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

# 2. processors 负责做数据转换
# 这里使用了简单的 batch processor，将数据攒成批次发送。
processors:
  batch:
    send_batch_size: 100000 # 每个批次的数据条数，建议 batch 的数据量在 100M-1G 之间
    timeout: 10s

# 3. exporters 负责将数据输出
# doris exporter 将数据输出到 Doris，使用的是 Stream Load HTTP 接口，默认使用 Stream Load 的数据格式为 JSON，Stream Load 会自动解析 JSON 字段写入对应的 Doris 表的字段。
exporters:
  doris:
    endpoint: http://localhost:8030 # FE HTTP 地址
    mysql_endpoint: localhost:9030  # FE MySQL 地址
    database: doris_db_name
    username: doris_username
    password: doris_password
    table:
      logs: otel_logs
    create_schema: true # 是否自动创建 schema，如果设置为 false，则需要手动建表
    history_days: 10
    create_history_days: 10
    timezone: Asia/Shanghai
    timeout: 60s # http stream load 客户端超时时间
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

**3. 运行 OpenTelemetry**

```
./otelcol-contrib --config config/opentelemetry_java_log.yml

# log_response 为 true 时日志会输出每次 Stream Load 的请求参数和响应结果

2025-08-18T00:33:22.543+0800	info	dorisexporter@v0.132.0/exporter_logs.go:181	log response:
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

# 默认每隔 10s 会日志输出速度信息，包括自启动以来的数据量（MB 和 ROWS），总速度（MB/s 和 R/S），最近 10s 速度
2025-08-18T00:05:00.017+0800	info	dorisexporter@v0.132.0/progress_reporter.go:63	[LOG] total 11 MB 18978 ROWS, total speed 0 MB/s 632 R/s, last 10 seconds speed 1 MB/s 1897 R/s
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


**2. OpenTelemetry 配置**

这个配置文件和之前 TEXT 日志采集不同的是 filelog 的 type 参数是 json_parser，它会将每一行文本当作 JSON 格式解析，解析出来的字段用于后续处理。
```
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
    mysql_endpoint: localhost:9030  # FE MySQL 地址
    database: doris_db_name
    username: doris_username
    password: doris_password
    table:
      logs: otel_logs
    create_schema: true # 是否自动创建 schema，如果设置为 false，则需要手动建表
    history_days: 10
    create_history_days: 10
    timezone: Asia/Shanghai
    timeout: 60s # http stream load 客户端超时时间
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

**3. 运行 OpenTelemetry**

```
./otelcol-contrib --config config/opentelemetry_json_log.yml
```

### Trace 采集示例

**1. OpenTelemetry 配置**

创建 `otel_trace.yml` 配置文件如下

```yaml
receivers:
  otlp: # otlp 协议，接收 OpenTelemetry Java Agent 发送的数据
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
    mysql_endpoint: localhost:9030  # FE MySQL 地址
    history_days: 10
    create_history_days: 10
    timezone: Asia/Shanghai
    timeout: 60s # http stream load 客户端超时时间
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

**2. 运行 OpenTelemetry**

```Bash
  ./otelcol-contrib --config otel_trace.yaml
```

**3. 应用侧接入 OpenTelemetry SDK**

这里我们使用一个 Spring Boot 示例应用接入 OpenTelemetry Java SDK，示例应用来自官方 [demo](https://docs.spring.io/spring-boot/tutorial/first-application/index.html)，对路径 "/" 返回简单的 "Hello World!" 字符串。
下载 [OpenTelemetry Java Agent](https://github.com/open-telemetry/opentelemetry-java-instrumentation/releases)，使用 Java Agent 的优势在于无需对现有的应用做任何的修改。其他语言及其他接入方式详见 OpenTelemetry 官网：[Language APIs & SDKs](https://opentelemetry.io/docs/languages/) 或 [Zero-code Instrumentation](https://opentelemetry.io/docs/zero-code/)。

在启动应用之前只需要添加几个环境变量，无需修改任何代码。
```Bash
export JAVA_TOOL_OPTIONS="${JAVA_TOOL_OPTIONS} -javaagent:/your/path/to/opentelemetry-javaagent.jar" # OpenTelemetry Java Agent 的路径
export OTEL_JAVAAGENT_LOGGING="none" # 禁用 otel log，防止干扰服务本身的日志
export OTEL_SERVICE_NAME="myproject"
export OTEL_TRACES_EXPORTER="otlp" # 使用 otlp 协议发送 trace 数据
export OTEL_EXPORTER_OTLP_ENDPOINT="http://localhost:4317" # OpenTelemetry Collector 的地址

java -jar myproject-0.0.1-SNAPSHOT.jar
```


