---
{
    "title": "DataX Doriswriter",
    "language": "zh-CN",
    "description": "介绍如何使用 DataX Doriswriter 通过 Stream Load 将 MySQL、Oracle、SQL Server 等数据源同步到 Apache Doris，并配置参数与导入示例。",
    "keywords": [
        "DataX Doriswriter",
        "DataX 导入 Doris",
        "Stream Load",
        "MySQL 同步 Doris"
    ]
}
---

<!-- 知识类型: 操作步骤 -->
<!-- 适用场景: 数据集成 / 离线批量同步 -->

[DataX](https://github.com/alibaba/DataX) Doriswriter 插件支持通过 Stream Load 将 MySQL、Oracle、SQL Server 等多种数据源中的数据同步到 Doris。

当你已经使用 DataX 做离线数据同步，或者需要将 DataX 支持的数据源写入 Doris 时，可以使用 Doriswriter 作为 DataX 的 Writer 插件。本文按用户配置链路介绍如何获取插件、配置参数、运行任务，并说明 JSON 与 CSV 导入格式的注意事项。

使用 DataX Doriswriter 主要包含以下步骤：

1. 获取 DataX 安装包，或自行编译 Doriswriter 插件。
2. 配置 Doriswriter 写入 Doris 所需的连接、批次和 Stream Load 参数。
3. 编写 DataX 任务脚本，并执行同步任务。
4. 根据数据格式调整 `loadProps`，避免分隔符冲突。

## 使用前确认

| 检查项 | 说明 |
| --- | --- |
| DataX 服务 | Doriswriter 需要配合 DataX 服务一起使用。 |
| 数据源支持 | DataX 支持多种数据源，支持列表请参考 [DataX 支持的数据通道](https://github.com/alibaba/DataX#support-data-channels)。 |
| Doris 导入入口 | Doriswriter 使用 Stream Load 写入 Doris，`loadUrl` 需要配置 FE 节点的 `http_port`。 |

## 获取 DataX 与 Doriswriter

### 直接下载 DataX 安装包

DataX 官方提供了可直接使用的安装包。下载地址请参考 [DataX 安装包下载说明](https://github.com/alibaba/DataX?tab=readme-ov-file#download-datax%E4%B8%8B%E8%BD%BD%E5%9C%B0%E5%9D%80)。

### 自行编译 Doriswriter 插件

如需自行编译 Doriswriter 插件，请先下载 [Doriswriter 插件源码](https://github.com/apache/doris/tree/master/extension/DataX)。

1. 运行 `init-env.sh`。
2. 单独编译 `doriswriter` 插件：

    ```shell
    mvn clean install -pl plugin-rdbms-util,doriswriter -DskipTests
    ```

如需编译整个 DataX 项目，请参考 [DataX Quick Start](https://github.com/alibaba/DataX/blob/master/userGuid.md#quick-start)。

#### 处理 `datax-all` 依赖错误

如果编译时出现以下错误：

```text
Could not find artifact com.alibaba.datax:datax-all:pom:0.0.1-SNAPSHOT ...
```

可以按以下方式处理：

1. 下载 [alibaba-datax-maven-m2-20210928.tar.gz](https://doris-thirdparty-repo.bj.bcebos.com/thirdparty/alibaba-datax-maven-m2-20210928.tar.gz)。
2. 解压后，将得到的 `alibaba/datax/` 目录复制到当前 Maven 使用的 `.m2/repository/com/alibaba/` 目录下，然后再次编译。

## 配置 Doriswriter 参数

<!-- 知识类型: 配置参数 -->
<!-- 适用场景: DataX 任务配置 -->

Doriswriter 参数用于控制 Doris 连接、目标库表、批次大小、失败重试和 Stream Load 请求属性。

| 参数 | 必选 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `jdbcUrl` | 是 | 无 | Doris 的 JDBC 连接串，用于执行 `preSql` 或 `postSql`。 |
| `loadUrl` | 是 | 无 | Stream Load 的连接目标，格式为 `ip:port`。其中 `ip` 是 FE 节点 IP，`port` 是 FE 节点的 `http_port`。可以填写多个地址，多个地址之间使用英文逗号 `,` 分隔，doriswriter 会轮询访问。 |
| `username` | 是 | 无 | 访问 Doris 数据库的用户名。 |
| `password` | 否 | 空 | 访问 Doris 数据库的密码。 |
| `connection.selectedDatabase` | 是 | 无 | 需要写入的 Doris 数据库名称。 |
| `connection.table` | 是 | 无 | 需要写入的 Doris 表名称。 |
| `flushInterval` | 否 | `30000` ms | 数据写入批次的时间间隔。设置过小时可能导致 Doris 写入阻塞，并返回错误码 `-235`。如果该值过小，即使 `maxBatchRows` 和 `batchSize` 设置较大，也可能在未达到行数或大小阈值前触发导入。 |
| `column` | 是 | 无 | 目标表需要写入数据的字段，这些字段会作为生成的 JSON 数据字段名。字段之间使用英文逗号分隔，例如 `"column": ["id", "name", "age"]`。 |
| `preSql` | 否 | 无 | 写入数据到目标表前执行的标准 SQL 语句。 |
| `postSql` | 否 | 无 | 写入数据到目标表后执行的标准 SQL 语句。 |
| `maxBatchRows` | 否 | `500000` | 每批次导入数据的最大行数。该参数和 `batchSize` 共同控制每批次的导入规模，每批次数据达到任一阈值后即开始导入。 |
| `batchSize` | 否 | `94371840` | 每批次导入数据的最大数据量。该参数和 `maxBatchRows` 共同控制每批次的导入规模，每批次数据达到任一阈值后即开始导入。 |
| `maxRetries` | 否 | `3` | 每批次导入数据失败后的重试次数。 |
| `labelPrefix` | 否 | `datax_doris_writer_` | 每批次导入任务的 label 前缀。最终 label 由 `labelPrefix + UUID` 组成，保证全局唯一，避免数据重复导入。 |
| `loadProps` | 否 | 无 | Stream Load 的请求参数。可配置导入数据格式、分隔符等属性。默认导入格式为 CSV，也支持 JSON。更多参数请参考 [Stream Load 文档](../../data-operate/import/import-way/stream-load-manual.md)。 |

## 使用示例

### 场景一：通过 Stream 读取数据后导入 Doris

通过 Stream 读取数据并导入 Doris 的插件使用说明，请参考 [Doriswriter 官方示例](https://github.com/apache/doris/blob/master/extension/DataX/doriswriter/doc/doriswriter.md)。

### 场景二：从 MySQL 读取数据后导入 Doris

以下示例展示如何使用 DataX 从 MySQL 读取数据，并通过 Doriswriter 写入 Doris。

#### 1. 准备 MySQL 源表

```sql
CREATE TABLE `t_test` (
    `id` bigint(30) NOT NULL,
    `order_code` varchar(30) DEFAULT NULL COMMENT '',
    `line_code` varchar(30) DEFAULT NULL COMMENT '',
    `remark` varchar(30) DEFAULT NULL COMMENT '',
    `unit_no` varchar(30) DEFAULT NULL COMMENT '',
    `unit_name` varchar(30) DEFAULT NULL COMMENT '',
    `price` decimal(12,2) DEFAULT NULL COMMENT '',
    PRIMARY KEY (`id`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 ROW_FORMAT=DYNAMIC COMMENT='';
```

#### 2. 准备 Doris 目标表

```sql
CREATE TABLE `ods_t_test` (
    `id` bigint(30) NOT NULL,
    `order_code` varchar(30) DEFAULT NULL COMMENT '',
    `line_code` varchar(30) DEFAULT NULL COMMENT '',
    `remark` varchar(30) DEFAULT NULL COMMENT '',
    `unit_no` varchar(30) DEFAULT NULL COMMENT '',
    `unit_name` varchar(30) DEFAULT NULL COMMENT '',
    `price` decimal(12,2) DEFAULT NULL COMMENT ''
) ENGINE=OLAP
UNIQUE KEY(`id`, `order_code`)
DISTRIBUTED BY HASH(`order_code`) BUCKETS 1
PROPERTIES (
    "replication_allocation" = "tag.location.default: 3",
    "in_memory" = "false",
    "storage_format" = "V2"
);
```

#### 3. 创建 DataX 任务脚本

创建 `my_import.json`。实际使用时，请将 `reader` 中的源库表、`writer` 中的 Doris 目标库表、用户名和密码替换为你的环境配置。

```json
{
    "job": {
        "content": [
            {
                "reader": {
                    "name": "mysqlreader",
                    "parameter": {
                        "column": ["id", "order_code", "line_code", "remark", "unit_no", "unit_name", "price"],
                        "connection": [
                            {
                                "jdbcUrl": ["jdbc:mysql://localhost:3306/demo"],
                                "table": ["employees_1"]
                            }
                        ],
                        "username": "root",
                        "password": "xxxxx",
                        "where": ""
                    }
                },
                "writer": {
                    "name": "doriswriter",
                    "parameter": {
                        "loadUrl": ["127.0.0.1:8030"],
                        "column": ["id", "order_code", "line_code", "remark", "unit_no", "unit_name", "price"],
                        "username": "root",
                        "password": "xxxxxx",
                        "postSql": ["select count(1) from all_employees_info"],
                        "preSql": [],
                        "flushInterval": 30000,
                        "connection": [
                            {
                                "jdbcUrl": "jdbc:mysql://127.0.0.1:9030/demo",
                                "selectedDatabase": "demo",
                                "table": ["all_employees_info"]
                            }
                        ],
                        "loadProps": {
                            "format": "json",
                            "strip_outer_array": "true",
                            "line_delimiter": "\\x02"
                        }
                    }
                }
            }
        ],
        "setting": {
            "speed": {
                "channel": "1"
            }
        }
    }
}
```

#### 4. 配置导入数据格式

上面的示例使用 JSON 格式导入数据：

```json
"loadProps": {
    "format": "json",
    "strip_outer_array": "true",
    "line_delimiter": "\\x02"
}
```

JSON 格式相关说明如下：

1. `line_delimiter` 默认是换行符，可能会和数据中的值冲突。可以使用特殊字符或不可见字符，避免导入错误。
2. `strip_outer_array` 表示一批导入数据中包含多行数据。Doris 解析时会展开数组，并将其中的每个 Object 依次解析为一行数据。
3. 更多 Stream Load 参数请参考 [Stream Load 文档](../../data-operate/import/import-way/stream-load-manual.md)。

如果使用 CSV 格式，可以按如下方式配置：

```json
"loadProps": {
    "format": "csv",
    "column_separator": "\\x01",
    "line_delimiter": "\\x02"
}
```

CSV 格式需要特别注意行分隔符和列分隔符，避免与数据中的特殊字符冲突。建议使用隐藏字符。默认列分隔符为 `\t`，默认行分隔符为 `\n`。

#### 5. 执行 DataX 任务

执行任务命令如下。更多运行方式请参考 [DataX 用户指南](https://github.com/alibaba/DataX/blob/master/userGuid.md)。

```shell
python bin/datax.py my_import.json
```

执行成功后，可以看到类似如下日志：

```text
2022-11-16 14:28:54.012 [job-0] INFO  JobContainer - jobContainer starts to do prepare ...
2022-11-16 14:28:54.012 [job-0] INFO  JobContainer - DataX Reader.Job [mysqlreader] do prepare work .
2022-11-16 14:28:54.013 [job-0] INFO  JobContainer - DataX Writer.Job [doriswriter] do prepare work .
2022-11-16 14:28:54.020 [job-0] INFO  JobContainer - jobContainer starts to do split ...
2022-11-16 14:28:54.020 [job-0] INFO  JobContainer - Job set Channel-Number to 1 channels.
2022-11-16 14:28:54.023 [job-0] INFO  JobContainer - DataX Reader.Job [mysqlreader] splits to [1] tasks.
2022-11-16 14:28:54.023 [job-0] INFO  JobContainer - DataX Writer.Job [doriswriter] splits to [1] tasks.
2022-11-16 14:28:54.033 [job-0] INFO  JobContainer - jobContainer starts to do schedule ...
2022-11-16 14:28:54.036 [job-0] INFO  JobContainer - Scheduler starts [1] taskGroups.
2022-11-16 14:28:54.037 [job-0] INFO  JobContainer - Running by standalone Mode.
2022-11-16 14:28:54.041 [taskGroup-0] INFO  TaskGroupContainer - taskGroupId=[0] start [1] channels for [1] tasks.
2022-11-16 14:28:54.043 [taskGroup-0] INFO  Channel - Channel set byte_speed_limit to -1, No bps activated.
2022-11-16 14:28:54.043 [taskGroup-0] INFO  Channel - Channel set record_speed_limit to -1, No tps activated.
2022-11-16 14:28:54.049 [taskGroup-0] INFO  TaskGroupContainer - taskGroup[0] taskId[0] attemptCount[1] is started
2022-11-16 14:28:54.052 [0-0-0-reader] INFO  CommonRdbmsReader$Task - Begin to read record by Sql: [select taskid,projectid,taskflowid,templateid,template_name,status_task from dwd_universal_tb_task
] jdbcUrl:[jdbc:mysql://localhost:3306/demo?yearIsDateType=false&zeroDateTimeBehavior=convertToNull&tinyInt1isBit=false&rewriteBatchedStatements=true].
Wed Nov 16 14:28:54 GMT+08:00 2022 WARN: Establishing SSL connection without server's identity verification is not recommended. According to MySQL 5.5.45+, 5.6.26+ and 5.7.6+ requirements SSL connection must be established by default if explicit option isn't set. For compliance with existing applications not using SSL the verifyServerCertificate property is set to 'false'. You need either to explicitly disable SSL by setting useSSL=false, or set useSSL=true and provide truststore for server certificate verification.
2022-11-16 14:28:54.071 [0-0-0-reader] INFO  CommonRdbmsReader$Task - Finished read record by Sql: [select taskid,projectid,taskflowid,templateid,template_name,status_task from dwd_universal_tb_task
] jdbcUrl:[jdbc:mysql://localhost:3306/demo?yearIsDateType=false&zeroDateTimeBehavior=convertToNull&tinyInt1isBit=false&rewriteBatchedStatements=true].
2022-11-16 14:28:54.104 [Thread-1] INFO  DorisStreamLoadObserver - Start to join batch data: rows[2] bytes[438] label[datax_doris_writer_c4e08cb9-c157-4689-932f-db34acc45b6f].
2022-11-16 14:28:54.104 [Thread-1] INFO  DorisStreamLoadObserver - Executing stream load to: 'http://127.0.0.1:8030/api/demo/dwd_universal_tb_task/_stream_load', size: '441'
2022-11-16 14:28:54.224 [Thread-1] INFO  DorisStreamLoadObserver - StreamLoad response :{"Status":"Success","BeginTxnTimeMs":0,"Message":"OK","NumberUnselectedRows":0,"CommitAndPublishTimeMs":17,"Label":"datax_doris_writer_c4e08cb9-c157-4689-932f-db34acc45b6f","LoadBytes":441,"StreamLoadPutTimeMs":1,"NumberTotalRows":2,"WriteDataTimeMs":11,"TxnId":217056,"LoadTimeMs":31,"TwoPhaseCommit":"false","ReadDataTimeMs":0,"NumberLoadedRows":2,"NumberFilteredRows":0}
2022-11-16 14:28:54.225 [Thread-1] INFO  DorisWriterManager - Async stream load finished: label[datax_doris_writer_c4e08cb9-c157-4689-932f-db34acc45b6f].
2022-11-16 14:28:54.249 [taskGroup-0] INFO  TaskGroupContainer - taskGroup[0] taskId[0] is successed, used[201]ms
2022-11-16 14:28:54.250 [taskGroup-0] INFO  TaskGroupContainer - taskGroup[0] completed it's tasks.
2022-11-16 14:29:04.048 [job-0] INFO  StandAloneJobContainerCommunicator - Total 2 records, 214 bytes | Speed 21B/s, 0 records/s | Error 0 records, 0 bytes |  All Task WaitWriterTime 0.000s |  All Task WaitReaderTime 0.000s | Percentage 100.00%
2022-11-16 14:29:04.049 [job-0] INFO  AbstractScheduler - Scheduler accomplished all tasks.
2022-11-16 14:29:04.049 [job-0] INFO  JobContainer - DataX Writer.Job [doriswriter] do post work.
Wed Nov 16 14:29:04 GMT+08:00 2022 WARN: Establishing SSL connection without server's identity verification is not recommended. According to MySQL 5.5.45+, 5.6.26+ and 5.7.6+ requirements SSL connection must be established by default if explicit option isn't set. For compliance with existing applications not using SSL the verifyServerCertificate property is set to 'false'. You need either to explicitly disable SSL by setting useSSL=false, or set useSSL=true and provide truststore for server certificate verification.
2022-11-16 14:29:04.187 [job-0] INFO  DorisWriter$Job - Start to execute preSqls:[select count(1) from dwd_universal_tb_task]. context info:jdbc:mysql://172.16.0.13:9030/demo.
2022-11-16 14:29:04.204 [job-0] INFO  JobContainer - DataX Reader.Job [mysqlreader] do post work.
2022-11-16 14:29:04.204 [job-0] INFO  JobContainer - DataX jobId [0] completed successfully.
2022-11-16 14:29:04.204 [job-0] INFO  HookInvoker - No hook invoked, because base dir not exists or is a file: /data/datax/hook
2022-11-16 14:29:04.205 [job-0] INFO  JobContainer -
         [total cpu info] =>
                averageCpu                     | maxDeltaCpu                    | minDeltaCpu
                -1.00%                         | -1.00%                         | -1.00%


         [total gc info] =>
                 NAME                 | totalGCCount       | maxDeltaGCCount    | minDeltaGCCount    | totalGCTime        | maxDeltaGCTime     | minDeltaGCTime
                 PS MarkSweep         | 1                  | 1                  | 1                  | 0.017s             | 0.017s             | 0.017s
                 PS Scavenge          | 1                  | 1                  | 1                  | 0.007s             | 0.007s

2022-11-16 14:29:04.205 [job-0] INFO  JobContainer - PerfTrace not enable!
2022-11-16 14:29:04.206 [job-0] INFO  StandAloneJobContainerCommunicator - Total 2 records, 214 bytes | Speed 21B/s, 0 records/s | Error 0 records, 0 bytes |  All Task WaitWriterTime 0.000s |  All Task WaitReaderTime 0.000s | Percentage 100.00%
2022-11-16 14:29:04.206 [job-0] INFO  JobContainer -
任务启动时刻                    : 2022-11-16 14:28:53
任务结束时刻                    : 2022-11-16 14:29:04
任务总计耗时                    :                 10s
任务平均流量                    :               21B/s
记录写入速度                    :              0rec/s
读出记录总数                    :                   2
读写失败总数                    :                   0
```

## 导入注意事项与最佳实践

- `flushInterval` 不宜设置过小。设置过小时可能导致 Doris 写入阻塞并返回错误码 `-235`，也可能在未达到 `maxBatchRows` 或 `batchSize` 阈值前提前触发导入。
- 使用 CSV 格式时，需要重点检查 `column_separator` 和 `line_delimiter` 是否与数据内容冲突。可以使用隐藏字符降低冲突概率。
- 使用 JSON 格式且一批数据是数组时，可以配置 `strip_outer_array = true`，让 Doris 将数组中的每个 Object 解析为一行。
- `labelPrefix` 会和 UUID 共同组成全局唯一的 label，用于避免数据重复导入。
- `loadUrl` 可以配置多个 FE 地址，多个地址之间使用英文逗号分隔，doriswriter 会轮询访问。

## 常见问题

### DataX Doriswriter 是否只能同步 MySQL 数据？

不是。DataX 支持多种数据源。本文的完整示例使用 MySQL，其他 DataX 支持的数据源也可以通过 Doriswriter 写入 Doris。

### `loadUrl` 应该配置哪个端口？

`loadUrl` 使用 FE 节点的 `http_port`，格式为 `ip:port`。如果配置多个地址，doriswriter 会轮询访问。

### JSON 或 CSV 导入时为什么要关注分隔符？

`line_delimiter` 或 `column_separator` 可能和数据中的字符冲突，导致导入错误。可以使用特殊字符或不可见字符作为分隔符，降低冲突概率。
