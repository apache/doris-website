---
{
    "title": "Logstash",
    "language": "zh-CN",
    "description": "使用 Logstash Doris output plugin 采集 TEXT 或 JSON 日志，通过 Stream Load 实时写入 Apache Doris，适用于日志 ETL 与检索分析。",
    "keywords": [
        "Logstash",
        "Logstash Doris output plugin",
        "Doris Stream Load",
        "日志采集",
        "日志 ETL"
    ]
}
---

# Logstash Doris output plugin

<!-- 知识类型: 能力定义 -->
<!-- 适用场景: 使用 Logstash 采集、预处理日志并实时写入 Doris -->

Logstash 是一个日志 ETL 框架，负责采集、预处理并将数据发送到存储系统。Logstash Doris output plugin 是 Logstash 写入 Apache Doris 的输出插件，适合将 TEXT 或 JSON 日志实时导入 Doris，用于日志检索与分析。

该插件调用 [Doris Stream Load](../../data-operate/import/import-way/stream-load-manual) HTTP 接口实时写入数据，并提供多线程并发、失败重试、自定义 Stream Load 格式和参数、输出写入速度等能力。

## 使用场景与流程

<!-- 知识类型: 架构选型决策 -->
<!-- 适用场景: 选择 Logstash 写入 Doris 的日志采集方式 -->

你可以根据日志格式选择对应的示例：

| 用户场景 | 适用数据 | 推荐阅读 |
| --- | --- | --- |
| 采集普通文本日志，并处理 Java stacktrace 等多行日志 | TEXT 日志，一条业务日志可能跨多行 | [采集 TEXT 多行日志](#采集-text-多行日志) |
| 采集每行一个 JSON 对象的结构化日志 | JSON 行日志，每行可以直接解析为字段 | [采集 JSON 行日志](#采集-json-行日志) |

使用 Logstash Doris output plugin 的完整流程如下：

1. 获取并安装 Logstash Doris output plugin。
2. 在 Doris 中创建目标库表。
3. 配置 Logstash 的输入、转换和 Doris 输出参数。
4. 启动 Logstash，将日志实时写入 Doris。
5. 通过 Stream Load 响应和写入速度日志观察导入结果。

## 安装插件

<!-- 知识类型: 操作步骤 -->
<!-- 适用场景: 部署 Logstash Doris output plugin -->

### 获取插件

可以通过下载安装包或从源码编译两种方式获取 Logstash Doris output plugin。

| 获取方式 | 适用场景 | 操作 |
| --- | --- | --- |
| 从官网下载 | 需要直接获取包含依赖的安装包 | 下载 `logstash-output-doris-1.2.0-java.gem` |
| 从源码编译 | 已有插件源码，需要自行构建安装包 | 在 `extension/logstash/` 目录执行 `gem build` |

从官网下载：

```shell
# 包含依赖的安装包
wget https://apache-doris-releases.oss-cn-beijing.aliyuncs.com/extension/logstash-output-doris-1.2.0-java.gem
```

从源码编译：

```shell
cd extension/logstash/
gem build logstash-output-doris.gemspec
```

### 普通安装

`${LOGSTASH_HOME}` 是 Logstash 的安装目录。运行 `${LOGSTASH_HOME}/bin/logstash-plugin` 命令安装插件，并将 `<plugin_file>.gem` 替换为实际的插件安装包文件名：

```shell
${LOGSTASH_HOME}/bin/logstash-plugin install <plugin_file>.gem
```

安装成功后，Logstash 会输出类似如下结果：

```text
Validating logstash-output-doris-1.2.0.gem
Installing logstash-output-doris
Installation successful
```

普通安装模式会自动安装插件依赖的 Ruby 模块。如果网络不通，安装过程可能会卡住或无法完成，此时可以下载包含依赖的安装包进行离线安装。

### 离线安装

离线安装时，需要先跳过 JAR 依赖处理，再使用本地文件系统中的插件安装包。使用本地路径时，按 Logstash 要求通过 `file://` 指定安装包位置：

```shell
export JARS_SKIP="true"
${LOGSTASH_HOME}/bin/logstash-plugin install file:///path/to/<plugin_file>.gem
```

## 配置参数

<!-- 知识类型: 配置参数 -->
<!-- 适用场景: 配置 Logstash Doris output plugin 写入 Doris -->

Logstash Doris output plugin 支持以下配置项：

| 配置项 | 说明 |
| --- | --- |
| `http_hosts` | Stream Load HTTP 地址，格式为字符串数组，可以包含一个或多个元素。每个元素格式为 `host:port`，例如 `["http://fe1:8030", "http://fe2:8030"]`。 |
| `user` | Doris 用户名。该用户需要具备对应 Doris 库表的导入权限。 |
| `password` | Doris 用户的密码。 |
| `db` | 要写入的 Doris 库名。 |
| `table` | 要写入的 Doris 表名。 |
| `label_prefix` | Doris Stream Load Label 前缀。最终生成的 Label 格式为 `<label_prefix>_<db>_<table>_<yyyymmdd_hhmmss>_<uuid>`，默认值为 `logstash`。 |
| `headers` | Doris Stream Load 的 headers 参数，语法格式为 Ruby map，例如 `headers => { "format" => "json" "read_json_by_line" => "true" }`。 |
| `mapping` | Logstash 字段到 Doris 表字段的映射。具体用法请参考后续示例。 |
| `message_only` | 一种特殊的 `mapping` 形式，只将 Logstash 的 `@message` 字段输出到 Doris，默认为 `false`。 |
| `max_retries` | Doris Stream Load 请求失败后的重试次数。默认值为 `-1`，表示无限重试以保证数据可靠性。 |
| `log_request` | 是否在日志中输出 Doris Stream Load 请求和响应元数据，用于排查问题。默认值为 `false`。 |
| `log_speed_interval` | 在日志中输出写入速度的时间间隔，单位为秒。默认值为 `10`，设置为 `0` 可以关闭速度日志。 |

## 采集 TEXT 多行日志

<!-- 知识类型: 操作步骤 -->
<!-- 适用场景: 使用 Logstash 采集 Java TEXT 日志并写入 Doris -->

本示例以 Doris FE 日志为例，展示如何采集 TEXT 日志并写入 Doris。

### 场景说明

FE 日志文件通常位于 Doris 安装目录下的 `fe/log/fe.log`。这类 Java 程序日志包含时间戳、日志级别、线程名、代码位置和日志内容等字段。

FE 日志中既有普通单行日志，也有包含 stacktrace 的异常日志。由于 stacktrace 会跨多行，采集时需要将主日志和 stacktrace 合并为一条日志。

日志样例如下：

```text
2024-07-08 21:18:01,432 INFO (Statistics Job Appender|61) [StatisticsJobAppender.runAfterCatalogReady():70] Stats table not available, skip
2024-07-08 21:18:53,710 WARN (STATS_FETCH-0|208) [StmtExecutor.executeInternalQuery():3332] Failed to run internal SQL: OriginStatement{originStmt='SELECT * FROM __internal_schema.column_statistics WHERE part_id is NULL  ORDER BY update_time DESC LIMIT 500000', idx=0}
org.apache.doris.common.UserException: errCode = 2, detailMessage = tablet 10031 has no queryable replicas. err: replica 10032's backend 10008 does not exist or not alive
        at org.apache.doris.planner.OlapScanNode.addScanRangeLocations(OlapScanNode.java:931) ~[doris-fe.jar:1.2-SNAPSHOT]
        at org.apache.doris.planner.OlapScanNode.computeTabletInfo(OlapScanNode.java:1197) ~[doris-fe.jar:1.2-SNAPSHOT]
```

### 在 Doris 中建表

目标表包含日志产生时间、采集时间、主机名、日志文件路径、日志类型、日志级别、线程名、代码位置和日志内容等字段：

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

### 配置 Logstash

Logstash 主要有两类配置文件：

| 配置文件 | 作用 |
| --- | --- |
| `config/logstash.yml` | Logstash 全局配置文件。可以配置批处理大小和批处理延迟，用于提升写入 Doris 的性能。 |
| `logstash_doris_log.conf` | 单个日志采集任务的配置文件。通常包含 `input`、`filter` 和 `output` 三段配置。 |

对于平均每条几百字节的日志，推荐将批处理大小设置为 100 万行，将批处理延迟设置为 10s。你可以在 `config/logstash.yml` 中配置：

```yaml
pipeline.batch.size: 1000000
pipeline.batch.delay: 10000
```

`logstash_doris_log.conf` 包含以下三段：

| 配置段 | 作用 | 本示例中的关键配置 |
| --- | --- | --- |
| `input` | 读取原始数据。 | 使用 `file` input 读取 FE 日志，并通过 `multiline` codec 将非时间戳开头的行拼接到上一行。 |
| `filter` | 做数据转换。 | 使用 `grok` 从 `message` 字段中提取 `log_time`、`level`、`thread` 和 `position`。 |
| `output` | 输出到 Doris。 | 使用 `doris` output 通过 Stream Load 写入 Doris，并通过 `mapping` 映射字段。 |

配置示例如下：

```text
# 1. input：读取 FE 日志，并通过 multiline codec 合并 stacktrace
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

# 2. filter：通过 grok 从 message 中提取日志字段
filter {
    grok {
        match => {
            # parse log_time, level, thread, position fields from message
            "message" => "%{TIMESTAMP_ISO8601:log_time} (?<level>[A-Z]+) \((?<thread>[^\[]*)\) \[(?<position>[^\]]*)\]"
        }
    }
}

# 3. output：通过 Doris Stream Load 写入 Doris
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

在 `output` 配置中，`headers` 指定 Stream Load 的数据格式为 JSON，`mapping` 指定 Logstash 字段到 JSON 字段的映射。由于 `headers` 中指定了 `"format" => "json"`，Stream Load 会自动解析 JSON 字段并写入 Doris 表中的对应字段。

### 运行 Logstash

执行以下命令启动 Logstash：

```shell
${LOGSTASH_HOME}/bin/logstash -f config/logstash_doris_log.conf
```

当 `log_request` 为 `true` 时，日志会输出每次 Stream Load 的请求参数和响应结果。响应示例如下：

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

默认每隔 10s，Logstash 会在日志中输出写入速度信息，包括自启动以来的数据量（MB 和 ROWS）、总速度（MB/s 和 R/s）以及最近 10s 的速度：

```text
[2024-07-08T22:35:38,285][INFO ][logstash.outputs.doris   ][main] total 11 MB 18978 ROWS, total speed 0 MB/s 632 R/s, last 10 seconds speed 1 MB/s 1897 R/s
```

## 采集 JSON 行日志

<!-- 知识类型: 操作步骤 -->
<!-- 适用场景: 使用 Logstash 采集 JSON 行日志并写入 Doris -->

本示例以 GitHub Events Archive 数据为例，展示如何采集 JSON 行日志并写入 Doris。

### 场景说明

GitHub Events Archive 是 GitHub 用户操作事件的归档数据，格式为 JSON，可以从 <https://www.gharchive.org/> 下载。每条事件数据占一行，适合使用 Logstash 的 `json` codec 解析。

下载 2024 年 4 月 1 日 23 点的数据，并解压为 Logstash 可读取的 `.json` 文件：

```shell
mkdir -p /tmp/github_events
cd /tmp/github_events
wget https://data.gharchive.org/2024-04-01-23.json.gz
gunzip 2024-04-01-23.json.gz
```

下面是一条数据样例。实际文件中一条数据占一行，这里为了方便展示进行了格式化：

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

### 在 Doris 中建表

创建 `github_events` 表，用于保存 GitHub 事件字段、采集主机和文件路径：

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

### 配置 Logstash

JSON 行日志的配置与 TEXT 多行日志的配置有两个主要区别：

1. `file` input 的 `codec` 参数设置为 `json`。Logstash 会将每一行文本按 JSON 格式解析，解析出的字段用于后续处理。
2. 不需要使用 `filter` plugin，因为 JSON 数据已经可以直接解析为字段。

配置示例如下：

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

### 运行 Logstash

执行以下命令启动 Logstash：

```shell
${LOGSTASH_HOME}/bin/logstash -f logstash_github_events.conf
```

## 常见问题与排查

<!-- 知识类型: 故障排查 -->
<!-- 适用场景: 检查 Logstash 写入 Doris 的安装、导入和运行状态 -->

| 问题 | 处理方式 |
| --- | --- |
| 普通安装时因为网络不通而卡住 | 使用包含依赖的安装包进行离线安装，并通过 `file://` 指定本地文件系统中的安装包路径。 |
| 需要查看每次写入 Doris 的请求和响应 | 在 `doris` output 中设置 `log_request => true`，日志会输出 Stream Load 请求参数和响应结果。 |
| 需要观察写入速度 | 使用默认 `log_speed_interval`。Logstash 每隔 10s 输出累计数据量、总速度和最近 10s 速度。 |
| 需要关闭写入速度日志 | 将 `log_speed_interval` 设置为 `0`。 |
| TEXT 日志中的 stacktrace 被拆成多条日志 | 在 `file` input 中使用 `multiline` codec，将非时间戳开头的行合并到上一行。 |
