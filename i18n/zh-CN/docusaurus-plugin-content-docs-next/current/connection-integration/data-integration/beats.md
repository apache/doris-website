---
{
    "title": "Beats",
    "language": "zh-CN",
    "description": "介绍如何使用 Beats Doris output plugin 通过 Stream Load 将 Filebeat 等 Beats 数据实时写入 Apache Doris。"
}
---

[Beats](https://github.com/elastic/beats) 是一个数据采集 Agent，支持通过自定义输出插件将数据写入存储系统。Beats Doris output plugin 是用于将 Beats 采集的数据输出到 Doris 的插件。

如果需要将 Filebeat 等 Beats 采集的数据实时写入 Doris，可以使用 Beats Doris output plugin。该插件调用 [Doris Stream Load](../../data-operate/import/import-way/stream-load-manual) HTTP 接口写入数据，并提供多线程并发、失败重试、自定义 Stream Load 格式和参数、输出写入速度等能力。

Beats Doris output plugin 支持以下 Beats 组件：

| Beats 组件 | 说明 |
| --- | --- |
| [Filebeat](https://github.com/elastic/beats/tree/master/filebeat) | 采集日志文件 |
| [Metricbeat](https://github.com/elastic/beats/tree/master/metricbeat) | 采集指标数据 |
| [Packetbeat](https://github.com/elastic/beats/tree/master/packetbeat) | 采集网络数据 |
| [Winlogbeat](https://github.com/elastic/beats/tree/master/winlogbeat) | 采集 Windows 事件日志 |
| [Auditbeat](https://github.com/elastic/beats/tree/master/auditbeat) | 采集审计数据 |
| [Heartbeat](https://github.com/elastic/beats/tree/master/heartbeat) | 采集可用性探测数据 |

使用 Beats Doris output plugin 通常包括三个步骤：

1. 下载或编译包含 Doris output plugin 的 Beats 二进制程序。
2. 在 Beats 配置文件中配置 Doris 输出地址和其他参数。
3. 启动 Beats，将数据实时写入 Doris。

## 安装

可以直接下载包含 Doris output plugin 的 Beats 二进制程序，也可以从源码编译。

### 从官网下载

下载 [filebeat-doris-2.1.1](https://download.selectdb.com/extension/filebeat-doris-2.1.1)。

### 从源码编译

在 Doris 源码的 `extension/beats/` 目录下执行以下命令：

```bash
cd doris/extension/beats

go build -o filebeat-doris filebeat/filebeat.go
go build -o metricbeat-doris metricbeat/metricbeat.go
go build -o winlogbeat-doris winlogbeat/winlogbeat.go
go build -o packetbeat-doris packetbeat/packetbeat.go
go build -o auditbeat-doris auditbeat/auditbeat.go
go build -o heartbeat-doris heartbeat/heartbeat.go
```

## 配置 Doris 输出

在 Beats 配置文件中，通过 `output.doris` 配置 Doris 输出。常用配置项如下：

| 配置项 | 默认值 | 说明 |
| --- | --- | --- |
| `fenodes` | 无 | Stream Load HTTP 地址，格式是字符串数组，可以配置一个或多个地址。例如：`["http://fe1:8030", "http://fe2:8030"]`。 |
| `user` | 无 | Doris 用户名。该用户需要具有对应库表的导入权限。 |
| `password` | 无 | Doris 用户的密码。 |
| `database` | 无 | 要写入的 Doris 库名。 |
| `table` | 无 | 要写入的 Doris 表名。 |
| `label_prefix` | `beats` | Doris Stream Load Label 前缀。最终生成的 Label 格式为 `{label_prefix}_{db}_{table}_{yyyymmdd_hhmmss}_{uuid}`。 |
| `headers` | 无 | Doris Stream Load 的 headers 参数，语法格式为 YAML map。 |
| `codec_format_string` | 无 | 输出到 Doris Stream Load 的 format string。使用 `%{[a][b]}` 引用输入中的 `a.b` 字段。 |
| `bulk_max_size` | `100000` | Doris Stream Load 的 batch size。 |
| `max_retries` | `-1` | Doris Stream Load 请求失败后的重试次数。`-1` 表示无限重试，用于保证数据可靠性。 |
| `log_request` | `true` | 是否在日志中输出 Doris Stream Load 请求和响应元数据，用于排查问题。 |
| `log_progress_interval` | `10` | 在日志中输出写入速度的时间间隔，单位为秒。设置为 `0` 可以关闭该日志。 |

## 场景一：采集 TEXT 日志

该场景以 Doris FE 日志为例，展示如何采集普通文本日志和跨行 stacktrace，并写入 Doris。

### 步骤 1：准备数据

Doris FE 日志文件通常位于 Doris 安装目录下的 `fe/log/fe.log`。FE 日志是典型的 Java 程序日志，包含时间戳、日志级别、线程名、代码位置、日志内容等字段。日志中既有普通日志，也有带 stacktrace 的异常日志。由于 stacktrace 跨多行，采集时需要将主日志和对应的 stacktrace 合并为一条日志。

```text
2024-07-08 21:18:01,432 INFO (Statistics Job Appender|61) [StatisticsJobAppender.runAfterCatalogReady():70] Stats table not available, skip
2024-07-08 21:18:53,710 WARN (STATS_FETCH-0|208) [StmtExecutor.executeInternalQuery():3332] Failed to run internal SQL: OriginStatement{originStmt='SELECT * FROM __internal_schema.column_statistics WHERE part_id is NULL  ORDER BY update_time DESC LIMIT 500000', idx=0}
org.apache.doris.common.UserException: errCode = 2, detailMessage = tablet 10031 has no queryable replicas. err: replica 10032's backend 10008 does not exist or not alive
        at org.apache.doris.planner.OlapScanNode.addScanRangeLocations(OlapScanNode.java:931) ~[doris-fe.jar:1.2-SNAPSHOT]
        at org.apache.doris.planner.OlapScanNode.computeTabletInfo(OlapScanNode.java:1197) ~[doris-fe.jar:1.2-SNAPSHOT]
```

### 步骤 2：创建 Doris 表

表结构包括日志产生时间、采集时间、主机名、日志文件路径、日志类型、日志级别、线程名、代码位置、日志内容等字段。

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

### 步骤 3：配置 Filebeat

Filebeat 日志采集配置文件（例如 `filebeat_doris_log.yml`）使用 YAML 格式，主要包含四部分：

1. `input`：读取原始日志文件。
2. `processors`：转换和解析日志内容。
3. `queue.mem`：配置 Filebeat 内部缓冲队列。
4. `output`：将数据输出到 Doris。

```yaml
# 1. input 负责读取原始数据。
# type: log 是 log input plugin，可以配置要读取的日志文件路径。
# multiline 将非时间开头的行拼接到上一行后面，用于合并 stacktrace 和主日志。
# log input 会将日志内容保存在 message 字段中，同时生成 agent.host、log.file.path 等元数据字段。
filebeat.inputs:
- type: log
  enabled: true
  paths:
    - /path/to/your/log
  multiline:
    type: pattern
    # 以 yyyy-mm-dd HH:MM:SS 开头的行会被识别为一条新日志，其他行拼接到上一条日志。
    pattern: '^[0-9]{4}-[0-9]{2}-[0-9]{2} [0-9]{2}:[0-9]{2}:[0-9]{2}'
    negate: true
    match: after
    skip_newline: true

# 2. processors 负责数据转换。
processors:
# 使用 js script 插件将日志中的 \t 替换为空格，避免 JSON 解析报错。
- script:
    lang: javascript
    source: >
        function process(event) {
            var msg = event.Get("message");
            msg = msg.replace(/\t/g, "  ");
            event.Put("message", msg);
        }
# 使用 dissect 插件做简单日志解析。
- dissect:
    # 2024-06-08 18:26:25,481 INFO (report-thread|199) [ReportHandler.cpuReport():617] begin to handle
    tokenizer: "%{day} %{time} %{log_level} (%{thread}) [%{position}] %{content}"
    target_prefix: ""
    ignore_failure: true
    overwrite_keys: true

# 3. queue.mem 配置内部缓冲队列总条数、flush batch 条数和 flush 时间间隔。
queue.mem:
  events: 1000000
  flush.min_events: 100000
  flush.timeout: 10s

# 4. output 负责将数据输出到 Doris。
# doris output 使用 Stream Load HTTP 接口写入 Doris。
# headers 指定 Stream Load 数据格式为 JSON。
# codec_format_string 以类似 printf 的方式格式化输出内容。
# 示例中可以引用 Filebeat 内置字段（如 agent.hostname）或 processor 生成的字段（如 day）。
output.doris:
  fenodes: [ "http://fehost1:http_port", "http://fehost2:http_port", "http://fehost3:http_port" ]
  user: "your_username"
  password: "your_password"
  database: "your_db"
  table: "your_table"
  # output string format
  ## %{[agent][hostname]}、%{[log][file][path]} 是 Filebeat 自带的 metadata。
  ## 常用的 Filebeat metadata 还包括采集时间戳 %{[@timestamp]}。
  ## %{[day]}、%{[time]} 是上面 dissect 解析得到的字段。
  codec_format_string: '{"ts": "%{[day]} %{[time]}", "host": "%{[agent][hostname]}", "path": "%{[log][file][path]}", "message": "%{[message]}"}'
  headers:
    format: "json"
    read_json_by_line: "true"
    load_to_single_tablet: "true"
```

### 步骤 4：运行 Filebeat

执行以下命令启动 Filebeat：

```bash
./filebeat-doris -f config/filebeat_doris_log.yml
```

当 `log_request` 为 `true` 时，日志会输出每次 Stream Load 的请求参数和响应结果。

```text
doris stream load response:
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

默认每隔 10 秒会在日志中输出写入速度信息，包括自启动以来的数据量（MB 和 ROWS）、总速度（MB/s 和 R/s）以及最近 10 秒速度。

```text
total 11 MB 18978 ROWS, total speed 0 MB/s 632 R/s, last 10 seconds speed 1 MB/s 1897 R/s
```

## 场景二：采集 JSON 日志

该场景以 GitHub Events Archive 数据为例，展示如何采集 JSON 日志并写入 Doris。

### 步骤 1：准备数据

GitHub Events Archive 是 GitHub 用户操作事件的归档数据，格式为 JSON。可以从 [GitHub Archive](https://www.gharchive.org/) 下载数据。例如，下载 2024 年 1 月 1 日 15 点的数据：

```bash
wget https://data.gharchive.org/2024-01-01-15.json.gz
```

下面是一条数据样例。实际数据为一行一条 JSON，这里为了方便展示进行了格式化。

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

### 步骤 2：创建 Doris 表

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

### 步骤 3：配置 Filebeat

与 TEXT 日志采集配置相比，JSON 场景有两点差异：

1. 不使用 `processors`，因为不需要额外的处理转换。
2. `codec_format_string` 直接输出整个 `message`，也就是原始 JSON 内容。

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
  ## 直接把原始文件每一行的 message 原样输出。
  ## headers 指定了 format: "json"，Stream Load 会自动解析 JSON 字段并写入 Doris 表的对应字段。
  codec_format_string: '%{[message]}'
  headers:
    format: "json"
    read_json_by_line: "true"
    load_to_single_tablet: "true"
```

### 步骤 4：运行 Filebeat

执行以下命令启动 Filebeat：

```bash
./filebeat-doris -f config/filebeat_github_events.yml
```
