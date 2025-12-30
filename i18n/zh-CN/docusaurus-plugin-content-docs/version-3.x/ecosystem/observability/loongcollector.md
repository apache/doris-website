---
{
    "title": "LoongCollector (iLogtail) Doris Flusher",
    "language": "zh-CN",
    "description": "LoongCollector (iLogtail) 是一个开源高性能日志采集与处理框架，来源于阿里云，3.0版本之前的命名为：Logtail/iLogtail。支持自定义输出插件将数据写入存储系统，LoongCollector Doris Flusher 是输出到 Doris 的插件。"
}
---

# LoongCollector (iLogtail) Doris Flusher 

## 介绍

[LoongCollector (iLogtail)](https://github.com/alibaba/loongcollector) 是一个开源高性能日志采集与处理框架，来源于阿里云，3.0版本之前的命名为：Logtail/iLogtail。支持自定义输出插件将数据写入存储系统，LoongCollector Doris Flusher 是输出到 Doris 的插件。

Doris Flusher 调用 Doris Stream Load HTTP 接口将数据实时写入 Doris，提供多线程并发，失败重试，自定义 Stream Load 格式和参数，输出写入速度等能力。

使用 Doris Flusher 主要有三个步骤：
1. 安装 LoongCollector
2. 配置 Doris 输出地址和其他参数
3. 启动 LoongCollector 将数据实时写入 Doris

## 安装

### 从官网下载

```bash
wget https://apache-doris-releases.oss-cn-beijing.aliyuncs.com/extension/loongcollector-linux-amd64.tar.gz
```

### 从源码编译

```shell
# Clone the repository
git clone https://github.com/alibaba/loongcollector.git
cd loongcollector
git submodule update --init

# Build LoongCollector
make all
cd output
```

## 参数配置

LoongCollector Doris Flusher Plugin 的配置如下：

配置 | 说明
--- | ---
`Addresses` | Stream Load HTTP 地址，格式是字符串数组，可以有一个或者多个元素，每个元素是 host:port。例如：["http://fe1:8030", "http://fe2:8030"]
`Database` | 要写入的 Doris 库名
`Table` | 要写入的 Doris 表名
`Authentication.PlainText.Username` | Doris 用户名，该用户需要有 Doris 对应库表的导入权限
`Authentication.PlainText.Password` | Doris 用户的密码
`LoadProperties` | Doris Stream Load 的 header 参数，语法格式为 map，例如：`LoadProperties: {"format": "json", "read_json_by_line": "true"}`
`LogProgressInterval` | 日志中输出速度的时间间隔，单位是秒，默认为 10，设置为 0 可以关闭这种日志
`GroupCommit` | Group commit 模式，可选值为 "sync"、"async" 或 "off"，默认为 "off"
`Concurrency` | 并发发送数据的 goroutine 数量，默认为 1（同步模式）
`QueueCapacity` | 异步模式下任务队列容量，默认为 1024
`Convert.Protocol` | 数据转换协议，默认为 custom_single
`Convert.Encoding` | 数据转换编码，默认为 json
`Convert.TagFieldsRename` | 从 tags 重命名一个或多个字段
`Convert.ProtocolFieldsRename` | 重命名协议字段，协议字段选项只能是：contents、tags、time


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

```
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

**3. LoongCollector 配置**

LoongCollector 配置文件主要由 3 部分组成：
1. inputs 负责读取原始数据
2. processors 负责做数据转换
3. flushers 负责将数据输出

配置文件位置 `conf/continuous_pipeline_config/local/`
创建配置文件 `loongcollector_doris_log.yaml `

```yaml
enable: true

inputs:
  # 1. inputs 负责读取原始数据
  # file_log input 是一个 input plugin，可以配置读取的日志文件路径
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
  # 通过 LoadProperties 参数指定了 Stream Load 的数据格式为 JSON
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


**4. 运行 LoongCollector**

```

nohup ./loongcollector > stdout.log 2> stderr.log &

# 默认每隔 10s 会日志输出速度信息，包括自启动以来的数据量（MB 和 ROWS），总速度（MB/s 和 R/S），最近 10s 速度
total 11 MB 18978 ROWS, total speed 0 MB/s 632 R/s, last 10 seconds speed 1 MB/s 1897 R/s
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

**3. LoongCollector 配置**

这个配置文件和之前 TEXT 日志采集不同的有下面几点：

1. input_file 使用 JSON 模式解析，LoongCollector 会将每一行文本当作 JSON 格式解析
2. 没有用复杂的 processor plugin，因为 JSON 数据已经有结构化字段

配置文件位置 `conf/continuous_pipeline_config/local/`
创建配置文件 `loongcollector_doris_log.yaml`

```yaml
enable: true

inputs:
  # file_log input 读取 JSON 格式日志文件
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

**4. 运行 LoongCollector**

```bash
nohup ./loongcollector > stdout.log 2> stderr.log &
```
