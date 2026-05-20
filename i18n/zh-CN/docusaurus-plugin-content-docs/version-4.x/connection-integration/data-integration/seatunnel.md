---
{
    "title": "SeaTunnel",
    "language": "zh-CN",
    "toc_min_heading_level": 2,
    "toc_max_heading_level": 4,
    "description": "介绍如何使用 SeaTunnel Doris Sink 将数据同步到 Apache Doris，并配置 Connector-V2、Flink、Spark 与 Stream Load 参数。",
    "keywords": [
        "SeaTunnel Doris Sink",
        "SeaTunnel 写入 Doris",
        "Doris Stream Load",
        "Doris 数据同步",
        "Connector-V2"
    ]
}
---

<!-- 知识类型: 操作步骤 -->
<!-- 适用场景: 数据集成 / SeaTunnel 写入 Doris -->

SeaTunnel 是一个非常简单易用的超高性能分布式数据集成平台，支持海量数据的实时同步，可以每天稳定高效地同步数百亿条数据。

本文面向需要将 SeaTunnel 数据同步到 Doris 的用户，按使用场景介绍 Doris Sink 的选择方式、参数配置和使用示例。

## 如何选择连接器

| 使用场景 | 推荐方式 | 适用版本或引擎 | 说明 |
| --- | --- | --- | --- |
| 需要 exactly-once 写入或 CDC 数据同步 | Connector-V2 Doris Sink | SeaTunnel 2.3.1 及以上 | 支持 Doris Sink、exactly-once 精准一次写入和 CDC 数据同步。 |
| 通过 Flink 引擎同步数据到 Doris | Connector-V1 Flink Doris Sink | SeaTunnel 2.1.0，Flink 引擎 | 适用于已有 Flink 引擎链路的 SeaTunnel 任务。 |
| 通过 Spark 引擎同步数据到 Doris | Connector-V1 Spark Sink Doris | SeaTunnel 2.1.0，Spark 引擎 | 适用于已有 Spark 引擎链路，例如从 Hive 迁移数据到 Doris。 |

## 场景一：使用 Connector-V2 写入 Doris

<!-- 知识类型: 配置参数 -->
<!-- 适用场景: 实时同步 / exactly-once 写入 / CDC 数据同步 -->

SeaTunnel 2.3.1 版本的 [Apache SeaTunnel Connector-V2](https://seatunnel.apache.org/docs/2.3.1/category/sink-v2) 支持 Doris Sink，并支持 exactly-once 精准一次写入和 CDC 数据同步。

插件代码请参考 [SeaTunnel Doris Sink 插件代码](https://github.com/apache/seatunnel/tree/dev/seatunnel-connectors-v2/connector-doris)。

### 参数配置

| 参数 | 类型 | 是否必填 | 默认值 | 说明 |
| --- | --- | --- | --- | --- |
| `fenodes` | string | 是 | - | Doris 集群 FE 节点地址，格式为 `fe_ip:fe_http_port,...`。 |
| `username` | string | 是 | - | Doris 用户名。 |
| `password` | string | 是 | - | Doris 用户密码。 |
| `table.identifier` | string | 是 | - | Doris 表名称，格式为 `DBName.TableName`。 |
| `sink.label-prefix` | string | 是 | - | Stream Load 导入使用的标签前缀。在 2PC 场景下，该前缀需要全局唯一，以保证 SeaTunnel 的 EOS 语义。 |
| `sink.enable-2pc` | bool | 否 | `true` | 是否启用两阶段提交（2PC）。默认值为 `true`，用于保证 exactly-once 语义。两阶段提交请参考 [Stream Load 手册](../../data-operate/import/import-way/stream-load-manual.md)。 |
| `sink.enable-delete` | bool | 否 | `false` | 是否启用删除。该选项要求 Doris 表开启批量删除功能，Doris 0.15+ 版本默认开启该功能，并且只支持 Unique 表模型。更多信息请参考 [批量删除](../../data-operate/delete/batch-delete-manual.md)。 |
| `doris.config` | map | 是 | - | Stream Load `data_desc` 参数。更多参数请参考 [Stream Load 手册](../../data-operate/import/import-way/stream-load-manual.md)。 |

### 使用 JSON 格式导入数据

```text
sink {
    Doris {
        fenodes = "doris_fe:8030"
        username = root
        password = ""
        table.identifier = "test.table_sink"
        sink.enable-2pc = "true"
        sink.label-prefix = "test_json"
        doris.config = {
            format = "json"
            read_json_by_line = "true"
        }
    }
}
```

### 使用 CSV 格式导入数据

```text
sink {
    Doris {
        fenodes = "doris_fe:8030"
        username = root
        password = ""
        table.identifier = "test.table_sink"
        sink.enable-2pc = "true"
        sink.label-prefix = "test_csv"
        doris.config = {
            format = "csv"
            column_separator = ","
            line_delimiter = "\n"
        }
    }
}
```

## 场景二：使用 Connector-V1 写入 Doris

<!-- 知识类型: 配置参数 -->
<!-- 适用场景: SeaTunnel 2.1.0 / Flink 引擎 / Spark 引擎 -->

Apache SeaTunnel 2.1.0 支持 Doris 连接器，可以通过 Flink 引擎和 Spark 引擎将数据同步到 Doris。

### 使用 Flink 引擎写入 Doris

插件代码请参考 [SeaTunnel Flink Sink Doris 插件代码](https://github.com/apache/seatunnel)。

#### 参数配置

| 参数 | 类型 | 是否必填 | 默认值 | 支持引擎 | 说明 |
| --- | --- | --- | --- | --- | --- |
| `fenodes` | string | 是 | - | Flink | Doris FE HTTP 访问地址，例如 `127.0.0.1:8030`。 |
| `database` | string | 是 | - | Flink | 写入 Doris 的库名。 |
| `table` | string | 是 | - | Flink | 写入 Doris 的表名。 |
| `user` | string | 是 | - | Flink | Doris 访问用户。 |
| `password` | string | 是 | - | Flink | Doris 访问用户密码。 |
| `batch_size` | int | 否 | `100` | Flink | 单次写入 Doris 的最大行数。 |
| `interval` | int | 否 | `1000` | Flink | flush 间隔时间，单位为毫秒。超过该时间后，异步线程会将缓存中的数据写入 Doris。设置为 `0` 表示关闭定期写入。 |
| `max_retries` | int | 否 | `1` | Flink | 写入 Doris 失败后的重试次数。 |
| `doris.*` | string | 否 | - | Flink | Stream Load 导入参数，例如 `doris.column_separator = ','`。更多参数请参考 [Stream Load 手册](../../data-operate/import/import-way/stream-load-manual.md)。 |

#### 示例：Socket 数据写入 Doris

```text
env {
    execution.parallelism = 1
}

source {
    SocketStream {
        host = 127.0.0.1
        port = 9999
        result_table_name = "socket"
        field_name = "info"
    }
}

transform {
}

sink {
    DorisSink {
        fenodes = "127.0.0.1:8030"
        user = root
        password = 123456
        database = test
        table = test_tbl
        batch_size = 5
        max_retries = 1
        interval = 5000
    }
}
```

启动任务：

```shell
sh bin/start-seatunnel-flink.sh --config config/flink.streaming.conf
```

### 使用 Spark 引擎写入 Doris

插件代码请参考 [SeaTunnel Spark Sink Doris 插件代码](https://github.com/apache/seatunnel)。

#### 参数配置

| 参数 | 类型 | 是否必填 | 默认值 | 支持引擎 | 说明 |
| --- | --- | --- | --- | --- | --- |
| `fenodes` | string | 是 | - | Spark | Doris FE 节点地址，例如 `127.0.0.1:8030`。 |
| `database` | string | 是 | - | Spark | 写入 Doris 的库名。 |
| `table` | string | 是 | - | Spark | 写入 Doris 的表名。 |
| `user` | string | 是 | - | Spark | Doris 访问用户。 |
| `password` | string | 是 | - | Spark | Doris 访问用户密码。 |
| `batch_size` | int | 是 | `100` | Spark | Spark 通过 Stream Load 写入 Doris 时，每个批次提交的行数。 |
| `doris.*` | string | 否 | - | Spark | Stream Load HTTP 参数。在 Stream Load 参数前增加 `doris.` 前缀即可使用，例如 `doris.column_separator`。更多参数请参考 [Stream Load 手册](../../data-operate/import/import-way/stream-load-manual.md)。 |

#### 示例：Hive 迁移数据至 Doris

```text
env {
    spark.app.name = "hive2doris-template"
}

spark {
    spark.sql.catalogImplementation = "hive"
}

source {
    hive {
        preSql = "select * from tmp.test"
        result_table_name = "test"
    }
}

transform {
}

sink {
    Console {
    }

    Doris {
        fenodes = "xxxx:8030"
        database = "tmp"
        table = "test"
        user = "root"
        password = "root"
        batch_size = 1000
        doris.column_separator = "\t"
        doris.columns = "date_key,date_value,day_in_year,day_in_month"
    }
}
```

启动任务：

```shell
sh bin/start-waterdrop-spark.sh --master local[4] --deploy-mode client --config ./config/spark.conf
```
