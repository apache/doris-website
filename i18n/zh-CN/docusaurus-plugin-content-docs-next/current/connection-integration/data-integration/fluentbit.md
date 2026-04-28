---
{
    "title": "Fluent Bit",
    "language": "zh-CN",
    "description": "介绍如何使用 Fluent Bit Doris Output Plugin 通过 Stream Load 将 TEXT 和 JSON 日志实时写入 Apache Doris。",
    "keywords": [
        "Fluent Bit",
        "Doris Stream Load",
        "日志采集",
        "日志写入 Doris",
        "Fluent Bit Doris Output Plugin"
    ]
}
---

<!-- 知识类型: 一句话定义 -->
<!-- 适用场景: 使用 Fluent Bit 将日志实时写入 Apache Doris -->

[Fluent Bit](https://fluentbit.io/) 是一个快速的日志处理器和转发器，支持通过自定义输出插件将数据写入存储系统。Fluent Bit Doris Output Plugin 是 Fluent Bit 写入 Doris 的输出插件，它调用 [Doris Stream Load](../../data-operate/import/import-way/stream-load-manual) HTTP 接口将数据实时写入 Doris。

主要能力包括：

- 多线程并发写入。
- Doris Stream Load 请求失败重试。
- 自定义 Stream Load 格式和参数。
- 输出写入速度统计。

## 适用场景与接入流程

<!-- 知识类型: 架构选型决策 -->
<!-- 适用场景: 日志采集方案选择 -->

你可以根据日志类型选择对应的接入方式：

| 用户场景 | 推荐方式 | 本文示例 |
| --- | --- | --- |
| 采集包含 `stacktrace` 的 TEXT 日志 | 使用 `tail` 输入、多行解析器和日志字段解析器，将多行日志合并为一条记录后写入 Doris | [采集 Doris FE TEXT 日志](#采集-doris-fe-text-日志) |
| 采集单行 JSON 事件日志 | 使用 `tail` 输入和 JSON Parser，直接将 JSON 记录写入 Doris | [采集 JSON 日志](#采集-json-日志) |

使用 Fluent Bit Doris Output Plugin 接入 Doris 的基本流程如下：

1. 下载或编译包含 Doris Output Plugin 的 Fluent Bit 二进制程序。
2. 根据日志类型配置 Fluent Bit 输入、解析器和 Doris 输出参数。
3. 启动 Fluent Bit，将日志实时写入 Doris。

## 安装 Fluent Bit Doris Output Plugin（alpha 版本）

<!-- 知识类型: 操作步骤 -->
<!-- 适用场景: 准备 Fluent Bit Doris Output Plugin 运行环境 -->

你可以直接下载预编译二进制程序，也可以从源码编译。

### 从官网下载

下载 [fluent-bit-doris-3.1.9](https://download.selectdb.com/integrations/fluent-bit-doris-3.1.9)。

### 从源码编译

克隆 [fluent-bit](https://github.com/joker-star-l/fluent-bit) 仓库的 `dev` 分支，然后在 `build/` 目录下执行：

```shell
cmake -DFLB_RELEASE=ON ..
make
```

编译产物为 `build/bin/fluent-bit`。

## 配置 Doris 输出参数

<!-- 知识类型: 配置参数 -->
<!-- 适用场景: 配置 Fluent Bit 写入 Doris -->

Fluent Bit Doris Output Plugin 的配置项如下：

| 配置 | 说明 |
| --- | --- |
| `host` | Stream Load HTTP Host。 |
| `port` | Stream Load HTTP Port。 |
| `user` | Doris 用户名，该用户需要有对应库表的导入权限。 |
| `password` | Doris 用户的密码。 |
| `database` | 要写入的 Doris 库名。 |
| `table` | 要写入的 Doris 表名。 |
| `label_prefix` | Doris Stream Load Label 前缀，最终生成的 Label 为 `{label_prefix}_{timestamp}_{uuid}`。默认值为 `fluentbit`；如果设置为 `false`，则不会添加 Label。 |
| `time_key` | 数据中要添加的时间戳列名称，默认值为 `date`；如果设置为 `false`，则不会添加该列。 |
| `header` | Doris Stream Load 的 Header 参数，可以设置多个。 |
| `log_request` | 日志中是否输出 Doris Stream Load 请求和响应元数据，用于排查问题。默认值为 `true`。 |
| `log_progress_interval` | 日志中输出写入速度的时间间隔，单位为秒。默认值为 `10`；设置为 `0` 可以关闭该日志。 |
| `retry_limit` | Doris Stream Load 请求失败后的重试次数。默认值为 `1`；如果设置为 `false`，则不限制重试次数。 |
| `workers` | 执行 Doris Stream Load 的 Worker 数量，默认值为 `2`。 |

## 采集 Doris FE TEXT 日志

<!-- 知识类型: 操作步骤 -->
<!-- 适用场景: 采集多行 Java 日志并写入 Doris -->

该场景以 Doris FE 日志为例，展示如何采集 TEXT 日志。对于包含 `stacktrace` 的多行异常日志，需要先将主日志和 `stacktrace` 合并为一条记录，再解析字段并写入 Doris。

### 1. 准备日志样例

FE 日志文件一般位于 Doris 安装目录下的 `fe/log/fe.log` 文件，是典型的 Java 程序日志，包括时间戳、日志级别、线程名、代码位置、日志内容等字段。日志中既包含正常日志，也包含带 `stacktrace` 的异常日志；由于 `stacktrace` 跨多行，日志采集存储时需要把主日志和 `stacktrace` 组合成一条日志。

```text
2024-07-08 21:18:01,432 INFO (Statistics Job Appender|61) [StatisticsJobAppender.runAfterCatalogReady():70] Stats table not available, skip
2024-07-08 21:18:53,710 WARN (STATS_FETCH-0|208) [StmtExecutor.executeInternalQuery():3332] Failed to run internal SQL: OriginStatement{originStmt='SELECT * FROM __internal_schema.column_statistics WHERE part_id is NULL  ORDER BY update_time DESC LIMIT 500000', idx=0}
org.apache.doris.common.UserException: errCode = 2, detailMessage = tablet 10031 has no queryable replicas. err: replica 10032's backend 10008 does not exist or not alive
        at org.apache.doris.planner.OlapScanNode.addScanRangeLocations(OlapScanNode.java:931) ~[doris-fe.jar:1.2-SNAPSHOT]
        at org.apache.doris.planner.OlapScanNode.computeTabletInfo(OlapScanNode.java:1197) ~[doris-fe.jar:1.2-SNAPSHOT]
```

### 2. 创建 Doris 表

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

### 3. 配置 Fluent Bit

该场景需要两个配置文件：

| 配置文件 | 作用 |
| --- | --- |
| `doris_log.conf` | 定义 Fluent Bit Service、输入、过滤和 Doris 输出。 |
| `parsers.conf` | 定义多行日志解析器和 FE 日志字段解析器。 |

`doris_log.conf`：

```ini
# config for Fluent Bit service
[SERVICE]
    log_level info
    # parsers file
    parsers_file parsers.conf

# use input tail
[INPUT]
    name tail
    path /path/to/your/log
    # add log file name to the record, key is 'path'
    path_key path
    # set multiline parser
    multiline.parser multiline_java

# parse log
[FILTER]
    match *
    name parser
    key_name log
    parser fe_log
    reserve_data true

# add host info
[FILTER]
    name sysinfo
    match *
    # add hostname to the record, key is 'host'
    hostname_key host

# output to doris
[OUTPUT]
    name doris
    match *
    host fehost
    port feport
    user your_username
    password your_password
    database your_db
    table your_table
    # add 'collect_time' to the record
    time_key collect_time
    # 'collect_time' is timestamp, change it to datatime
    header columns collect_time=from_unixtime(collect_time)
    log_request true
    log_progress_interval 10
```

`parsers.conf`：

```ini
[MULTILINE_PARSER]
    name          multiline_java
    type          regex
    flush_timeout 1000
    # Regex rules for multiline parsing
    # ---------------------------------
    #
    # configuration hints:
    #
    #  - first state always has the name: start_state
    #  - every field in the rule must be inside double quotes
    #
    # rules   |   state name   | regex pattern | next state name
    # --------|----------------|---------------|-----------------
    rule         "start_state"   "/(^[0-9]{4}-[0-9]{2}-[0-9]{2} [0-9]{2}:[0-9]{2}:[0-9]{2})(.*)/"  "cont"
    rule         "cont"          "/(^(?![0-9]{4}-[0-9]{2}-[0-9]{2}))(.*)/"     "cont"


[PARSER]
    name        fe_log
    format      regex
    # parse and add 'log_time', 'level', 'thread', 'position', 'message' to the record
    regex       ^(?<log_time>[0-9]{4}-[0-9]{2}-[0-9]{2} [0-9]{2}:[0-9]{2}:[0-9]{2},[0-9]{3}) (?<level>[^ ]+) \((?<thread>[^\)]+)\) \[(?<position>[^\]]+)\] (?<message>(\n|.)*)\n$
```

### 4. 启动 Fluent Bit 并查看写入结果

```shell
fluent-bit -c doris_log.conf
```

日志中会输出 Stream Load 响应元数据：

```text
[2024/10/31 18:39:55] [ info] [output:doris:doris.1] 127.0.0.1:8040, HTTP status=200
{
    "TxnId": 32155,
    "Label": "fluentbit_1730371195_91cca1aa-c15f-45d2-b503-fe7d2e839c2a",
    "Comment": "",
    "TwoPhaseCommit": "false",
    "Status": "Success",
    "Message": "OK",
    "NumberTotalRows": 1,
    "NumberLoadedRows": 1,
    "NumberFilteredRows": 0,
    "NumberUnselectedRows": 0,
    "LoadBytes": 836,
    "LoadTimeMs": 298,
    "BeginTxnTimeMs": 0,
    "StreamLoadPutTimeMs": 3,
    "ReadDataTimeMs": 0,
    "WriteDataTimeMs": 268,
    "CommitAndPublishTimeMs": 25
}
```

日志中也会输出写入速度：

```text
[2024/10/31 18:40:13] [ info] [output:doris:doris.1] total 0 MB 2 ROWS, total speed 0 MB/s 0 R/s, last 10 seconds speed 0 MB/s 0 R/s
```

## 采集 JSON 日志

<!-- 知识类型: 操作步骤 -->
<!-- 适用场景: 采集单行 JSON 事件日志并写入 Doris -->

该场景以 GitHub Events Archive 数据为例，展示如何采集 JSON 日志。与 TEXT 日志采集相比，JSON 日志不需要额外的 `FILTER` 进行处理转换。

### 1. 准备数据

[GitHub Events Archive](https://www.gharchive.org/) 是 GitHub 用户操作事件的归档数据，格式为 JSON。下面以下载 2024 年 1 月 1 日 15 点的数据为例：

```shell
wget https://data.gharchive.org/2024-01-01-15.json.gz
```

实际数据是一行一个 JSON 对象。下面是一条格式化后的数据样例：

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

```sql
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

### 3. 配置 Fluent Bit

该场景需要两个配置文件：

| 配置文件 | 作用 |
| --- | --- |
| `github_events.conf` | 定义 Fluent Bit Service、输入和 Doris 输出。 |
| `github_parsers.conf` | 定义 JSON Parser。 |

`github_events.conf`：

```ini
[SERVICE]
    log_level info
    parsers_file github_parsers.conf

[INPUT]
    name tail
    parser github
    path /path/to/your/log

[OUTPUT]
    name doris
    match *
    host fehost
    port feport
    user your_username
    password your_password
    database your_db
    table your_table
    time_key false
    log_request true
    log_progress_interval 10
```

`github_parsers.conf`：

```ini
[PARSER]
    name github
    format json
```

### 4. 启动 Fluent Bit

```shell
fluent-bit -c github_events.conf
```
