---
{
    "title": "LoongCollector",
    "language": "zh-CN",
    "description": "使用 LoongCollector Doris Flusher 通过 Stream Load 将 TEXT 或 JSON 日志实时写入 Apache Doris，支持多行日志、失败重试和并发导入。",
    "keywords": [
        "LoongCollector",
        "iLogtail",
        "Doris Flusher",
        "Doris Stream Load",
        "日志采集",
        "日志写入 Doris"
    ]
}
---

<!-- 知识类型: 能力定义 -->
<!-- 适用场景: 使用 LoongCollector 将日志实时写入 Apache Doris -->

[LoongCollector (iLogtail)](https://github.com/alibaba/loongcollector) 是一个开源高性能日志采集与处理框架，来源于阿里云，3.0 版本之前命名为 Logtail/iLogtail。它支持通过自定义输出插件将数据写入存储系统。LoongCollector Doris Flusher 是写入 Apache Doris 的输出插件，适合将 TEXT 或 JSON 日志实时导入 Doris，用于日志检索与分析。

Doris Flusher 调用 [Doris Stream Load](../../data-operate/import/import-way/stream-load-manual) HTTP 接口实时写入数据，并提供以下能力：

- 多线程并发写入。
- Doris Stream Load 请求失败重试。
- 自定义 Stream Load 格式和参数。
- 输出写入速度统计。

## 使用场景与流程

<!-- 知识类型: 架构选型决策 -->
<!-- 适用场景: 选择 LoongCollector 写入 Doris 的日志采集方式 -->

你可以根据日志格式选择对应的示例：

| 用户场景 | 适用数据 | 推荐阅读 |
| --- | --- | --- |
| 采集包含 `stacktrace` 的 Doris FE TEXT 日志 | TEXT 日志，一条业务日志可能跨多行 | [采集 Doris FE TEXT 日志](#采集-doris-fe-text-日志) |
| 采集每行一个 JSON 对象的事件日志 | JSON 行日志，每行可以直接解析为字段 | [采集 JSON 行日志](#采集-json-行日志) |

使用 LoongCollector Doris Flusher 的完整流程如下：

1. 安装 LoongCollector。
2. 在 Doris 中创建目标库表。
3. 配置 LoongCollector 的输入、转换和 Doris 输出参数。
4. 启动 LoongCollector，将日志实时写入 Doris。

## 安装 LoongCollector

<!-- 知识类型: 操作步骤 -->
<!-- 适用场景: 准备 LoongCollector 运行环境 -->

可以直接下载预编译安装包，也可以从源码编译 LoongCollector。

### 从官网下载

下载预编译安装包：

```bash
wget https://apache-doris-releases.oss-cn-beijing.aliyuncs.com/extension/loongcollector-linux-amd64.tar.gz
```

### 从源码编译

克隆 LoongCollector 仓库并编译：

```shell
# Clone the repository
git clone https://github.com/alibaba/loongcollector.git
cd loongcollector
git submodule update --init

# Build LoongCollector
make all
cd output
```

## 配置 Doris 输出参数

<!-- 知识类型: 配置参数 -->
<!-- 适用场景: 配置 LoongCollector Doris Flusher 写入 Doris -->

LoongCollector Doris Flusher Plugin 支持以下配置项：

| 配置项 | 说明 |
| --- | --- |
| `Addresses` | Stream Load HTTP 地址，格式为字符串数组，可以包含一个或多个元素。每个元素格式为 `host:port`，例如 `["http://fe1:8030", "http://fe2:8030"]`。 |
| `Database` | 要写入的 Doris 库名。 |
| `Table` | 要写入的 Doris 表名。 |
| `Authentication.PlainText.Username` | Doris 用户名。该用户需要具备对应 Doris 库表的导入权限。 |
| `Authentication.PlainText.Password` | Doris 用户的密码。 |
| `LoadProperties` | Doris Stream Load 的 Header 参数，语法格式为 map，例如 `LoadProperties: {"format": "json", "read_json_by_line": "true"}`。 |
| `LogProgressInterval` | 在日志中输出写入速度的时间间隔，单位为秒。默认值为 `10`；设置为 `0` 可以关闭该日志。 |
| `GroupCommit` | Group commit 模式，可选值为 `sync`、`async` 或 `off`，默认值为 `off`。 |
| `Concurrency` | 并发发送数据的 goroutine 数量，默认值为 `1`（同步模式）。 |
| `QueueCapacity` | 异步模式下的任务队列容量，默认值为 `1024`。 |
| `Convert.Protocol` | 数据转换协议，默认值为 `custom_single`。 |
| `Convert.Encoding` | 数据转换编码，默认值为 `json`。 |
| `Convert.TagFieldsRename` | 从 tags 重命名一个或多个字段。 |
| `Convert.ProtocolFieldsRename` | 重命名协议字段，协议字段可选值为 `contents`、`tags`、`time`。 |

## 采集 Doris FE TEXT 日志

<!-- 知识类型: 操作步骤 -->
<!-- 适用场景: 采集多行 Java TEXT 日志并写入 Doris -->

该场景以 Doris FE 日志为例，展示如何采集 TEXT 日志。对于包含 `stacktrace` 的多行异常日志，需要先将主日志和 `stacktrace` 合并为一条记录，再解析字段并写入 Doris。

### 1. 准备日志样例

FE 日志文件通常位于 Doris 安装目录下的 `fe/log/fe.log`。FE 日志是典型的 Java 程序日志，包含时间戳、日志级别、线程名、代码位置、日志内容等字段。日志中既包含正常日志，也包含带 `stacktrace` 的异常日志；由于 `stacktrace` 跨多行，采集存储时需要将主日志和 `stacktrace` 组合成一条日志。

```text
2024-07-08 21:18:01,432 INFO (Statistics Job Appender|61) [StatisticsJobAppender.runAfterCatalogReady():70] Stats table not available, skip
2024-07-08 21:18:53,710 WARN (STATS_FETCH-0|208) [StmtExecutor.executeInternalQuery():3332] Failed to run internal SQL: OriginStatement{originStmt='SELECT * FROM __internal_schema.column_statistics WHERE part_id is NULL  ORDER BY update_time DESC LIMIT 500000', idx=0}
org.apache.doris.common.UserException: errCode = 2, detailMessage = tablet 10031 has no queryable replicas. err: replica 10032's backend 10008 does not exist or not alive
        at org.apache.doris.planner.OlapScanNode.addScanRangeLocations(OlapScanNode.java:931) ~[doris-fe.jar:1.2-SNAPSHOT]
        at org.apache.doris.planner.OlapScanNode.computeTabletInfo(OlapScanNode.java:1197) ~[doris-fe.jar:1.2-SNAPSHOT]
```

### 2. 创建 Doris 表

目标表包含日志产生时间、采集时间、主机名、日志文件路径、日志类型、日志级别、线程名、代码位置和日志内容等字段。

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

### 3. 配置 LoongCollector

LoongCollector 配置文件主要由三部分组成：

1. `inputs`：读取原始数据。
2. `processors`：转换和解析日志内容。
3. `flushers`：将数据输出到 Doris。

将配置文件放在 `conf/continuous_pipeline_config/local/` 目录下，例如创建 `loongcollector_doris_log.yaml`：

```yaml
enable: true

inputs:
  # 1. inputs 负责读取原始数据
  # input_file 是一个 input plugin，可以配置读取的日志文件路径
  # 通过 multiline 配置将非时间开头的行拼接到上一行后面，实现 stacktrace 和主日志合并的效果
  - Type: input_file
    FilePaths:
      - /path/fe.log
    Multiline:
      Mode: custom
      StartPattern: '^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}'

processors:
  # 2. processors 部分负责数据转换
  # processor_regex 是一个常用的数据转换插件，使用正则表达式提取字段
  - Type: processor_regex
    SourceKey: content
    Regex: '(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2},\d{3}) ([A-Z]+) \(([^\)]*)\) \[([^\]]*)\] (.*)'
    Keys:
      - log_time
      - level
      - thread
      - position
      - message
  # 添加额外字段
  - Type: processor_add_fields
    Fields:
      type: fe.log
    IgnoreIfExist: false

flushers:
  # 3. flushers 部分负责数据输出
  # flusher_doris 将数据输出到 Doris，使用的是 Stream Load HTTP 接口
  # 通过 LoadProperties 参数指定 Stream Load 的数据格式为 JSON
  - Type: flusher_doris
    Addresses:
      - "http://fe_ip:http_port"
    Database: log_db
    Table: doris_log
    Authentication:
      PlainText:
        Username: root
        Password: ""
    LoadProperties:
      format: json
      read_json_by_line: "true"
      load_to_single_tablet: "true"
      columns: "log_time,collect_time,host,path,type,level,thread,position,message,log_time=replace(log_time,',','.'),collect_time=from_unixtime(collect_time)"
    Convert:
      Protocol: custom_single_flatten
      Encoding: json
      TagFieldsRename:
        host.ip: host
        log.file.path: path
      ProtocolFieldsRename:
        time: collect_time
    LogProgressInterval: 10
```

### 4. 启动 LoongCollector

启动 LoongCollector：

```bash
nohup ./loongcollector > stdout.log 2> stderr.log &
```

默认每隔 10s 输出一次写入速度信息，包括自启动以来的数据量（MB 和 ROWS）、总速度（MB/s 和 R/s）以及最近 10s 的速度。日志示例如下：

```text
total 11 MB 18978 ROWS, total speed 0 MB/s 632 R/s, last 10 seconds speed 1 MB/s 1897 R/s
```

## 采集 JSON 行日志

<!-- 知识类型: 操作步骤 -->
<!-- 适用场景: 采集单行 JSON 事件日志并写入 Doris -->

该场景以 GitHub Events Archive 的数据为例，展示如何采集每行一个 JSON 对象的事件日志。

### 1. 准备 JSON 数据

[GitHub Events Archive](https://www.gharchive.org/) 是 GitHub 用户操作事件的归档数据，格式为 JSON。可以下载 2024 年 1 月 1 日 15 点的数据，后续配置示例中的文件路径需要指向解压后的 JSON 文件：

```bash
wget https://data.gharchive.org/2024-01-01-15.json.gz
```

实际数据是一行一个 JSON 对象。下面的样例为了便于阅读进行了格式化：

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

### 2. 创建 Doris 表

创建目标库表，用于存储 GitHub 事件日志。

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
    "inverted_index_storage_format" = "v2",
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

### 3. 配置 LoongCollector

该配置与 TEXT 日志采集示例的主要区别如下：

1. `input_file` 使用 JSON 模式解析，LoongCollector 会将每一行文本按 JSON 格式解析。
2. JSON 数据已经包含结构化字段，因此不需要使用复杂的 processor plugin。

将配置文件放在 `conf/continuous_pipeline_config/local/` 目录下，例如创建 `loongcollector_doris_log.yaml`：

```yaml
enable: true

inputs:
  # input_file 读取 JSON 格式日志文件
  - Type: input_file
    FilePaths:
      - /path/2024-01-01-15.json

processors:
  # 解析 content，只展开第一层（actor, repo 保持为 JSON 字符串供 VARIANT 类型使用）
  - Type: processor_json
    SourceKey: content
    KeepSource: false
    ExpandDepth: 1
    ExpandConnector: ""

flushers:
  # flusher_doris 将数据输出到 Doris
  - Type: flusher_doris
    Addresses:
      - "http://fe_ip:http_port"
    Database: log_db
    Table: github_events
    Authentication:
      PlainText:
        Username: root
        Password: ""
    LoadProperties:
      format: json
      read_json_by_line: "true"
      load_to_single_tablet: "true"
    Convert:
      Protocol: custom_single_flatten
      Encoding: json
    LogProgressInterval: 10
    Concurrency: 3
```

### 4. 启动 LoongCollector

```bash
nohup ./loongcollector > stdout.log 2> stderr.log &
```
