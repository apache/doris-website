---
{
    "title": "Doris Kafka Connector",
    "language": "zh-CN",
    "description": "使用 Doris Kafka Connector 将 Kafka Topic 实时写入 Apache Doris，了解部署模式、配置项、类型映射、Debezium 同步和故障处理。",
    "keywords": [
        "Doris Kafka Connector",
        "Kafka Connect",
        "Kafka 导入 Doris",
        "Apache Doris 实时导入",
        "Debezium 同步 Doris"
    ]
}
---

<!-- 知识类型: 操作指南 / 配置参考 -->
<!-- 适用场景: Kafka 数据实时写入 Doris / Kafka Connect Sink Connector 部署与故障排查 -->

[Kafka Connect](https://docs.confluent.io/platform/current/connect/index.html) 是一款可扩展、可靠的数据集成工具，用于在 Apache Kafka 和其他系统之间迁移数据。Doris 社区提供了 [doris-kafka-connector](https://github.com/apache/doris-kafka-connector) 插件，可以将 Kafka Topic 中的数据写入 Doris。

## 适用场景

如果需要将 Kafka 中的数据持续写入 Doris，可以根据数据来源和运行环境选择对应配置：

| 用户场景 | 应使用的能力 | 参考章节 |
| --- | --- | --- |
| 本地验证或开发测试 | Standalone 模式启动 Kafka Connect，并通过本地配置文件创建 Doris Sink Connector | [Standalone 模式部署](#standalone-模式部署) |
| 生产或集群部署 | Distributed 模式启动 Kafka Connect，并通过 REST API 管理 Connector | [Distributed 模式部署](#distributed-模式部署) |
| 同步普通 JSON 数据 | 使用 `JsonConverter` 或 `StringConverter` 消费 Kafka Topic，并写入 Doris 表 | [同步普通 JSON 数据](#同步普通-json-数据) |
| 同步 Debezium 采集的 CDC 数据 | 配置 `converter.mode=debezium_ingestion`，并按需开启删除同步 | [同步 Debezium 组件采集的数据](#同步-debezium-组件采集的数据) |
| 同步 Avro 或 Protobuf 序列化数据 | 使用 Confluent Avro 或 Protobuf Converter，并配置 Schema Registry 地址 | [同步 Avro 序列化数据](#同步-avro-序列化数据)、[同步 Protobuf 序列化数据](#同步-protobuf-序列化数据) |
| 在写入前转换 Kafka 消息 | 使用 Kafka Connect SMT 为消息补充字段或转换时间格式 | [使用 Kafka Connect SMT 转换数据](#使用-kafka-connect-smt-转换数据) |
| 访问 SSL 认证的 Kafka 集群 | 在 Kafka Connect Worker 和内置 Consumer 中配置 SSL 参数 | [访问 SSL 认证的 Kafka 集群](#访问-ssl-认证的-kafka-集群) |
| 记录转换失败的数据 | 配置 Kafka Connect 死信队列 | [配置死信队列](#配置死信队列) |

## 版本说明

| Connector Version | Kafka Version | Doris Version | Java Version |
| --- | --- | --- | --- |
| 1.0.0 | 2.4+ | 2.0+ | 8 |
| 1.1.0 | 2.4+ | 2.0+ | 8 |
| 24.0.0 | 2.4+ | 2.0+ | 8 |
| 25.0.0 | 2.4+ | 2.0+ | 8 |
| 26.0.0 | 2.4+ | 2.0+ | 8 |

## 准备 Doris Kafka Connector

可以通过下载 Jar 包或 Maven 依赖使用 Doris Kafka Connector。

### 下载 Jar 包

从 [Doris 下载页面](https://doris.apache.org/download) 获取 doris-kafka-connector Jar 包。部署 Kafka Connect 时，需要将该 Jar 包放入 `$KAFKA_HOME/plugins` 目录。

### 使用 Maven 依赖

在 Maven 项目中，可以添加以下依赖：

```xml
<dependency>
    <groupId>org.apache.doris</groupId>
    <artifactId>doris-kafka-connector</artifactId>
    <version>25.0.0</version>
</dependency>
```

## Standalone 模式部署

Standalone 模式适合本地验证或开发测试。一般不建议在生产环境中使用 Standalone 模式。

### 1. 准备插件目录

在 `$KAFKA_HOME` 下创建 `plugins` 目录，并将下载好的 doris-kafka-connector Jar 包放入该目录。

### 2. 配置 Kafka Connect Worker

编辑 `$KAFKA_HOME/config/connect-standalone.properties`：

```properties
# 修改 broker 地址
bootstrap.servers=127.0.0.1:9092

# 修改为创建的 plugins 目录
# 注意：此处请填写 Kafka 的直接路径。例如：plugin.path=/opt/kafka/plugins
plugin.path=$KAFKA_HOME/plugins

# 建议将 Kafka 的 max.poll.interval.ms 时间调大到 30 分钟以上，默认 5 分钟
# 避免 Stream Load 导入数据消费超时，消费者被踢出消费群组
max.poll.interval.ms=1800000
consumer.max.poll.interval.ms=1800000
```

### 3. 配置 Doris Sink Connector

在 `$KAFKA_HOME/config` 目录下创建 `doris-connector-sink.properties`：

```properties
name=test-doris-sink
connector.class=org.apache.doris.kafka.connector.DorisSinkConnector
topics=topic_test
doris.topic2table.map=topic_test:test_kafka_tbl
doris.urls=10.10.10.1
doris.http.port=8030
doris.query.port=9030
doris.user=root
doris.password=
doris.database=test_db
buffer.count.records=10000
buffer.flush.time=120
buffer.size.bytes=5000000
enable.combine.flush=true
key.converter=org.apache.kafka.connect.storage.StringConverter
value.converter=org.apache.kafka.connect.json.JsonConverter
value.converter.schemas.enable=false
```

### 4. 启动 Standalone 模式

```shell
$KAFKA_HOME/bin/connect-standalone.sh -daemon $KAFKA_HOME/config/connect-standalone.properties $KAFKA_HOME/config/doris-connector-sink.properties
```

## Distributed 模式部署

Distributed 模式适合多节点 Kafka Connect 集群。该模式先启动 Kafka Connect Worker，再通过 REST API 创建和管理 Connector。

### 1. 准备插件目录

在 `$KAFKA_HOME` 下创建 `plugins` 目录，并将下载好的 doris-kafka-connector Jar 包放入该目录。

### 2. 配置 Kafka Connect Worker

编辑 `$KAFKA_HOME/config/connect-distributed.properties`：

```properties
# 修改 broker 地址
bootstrap.servers=127.0.0.1:9092

# 修改 group.id，同一集群的需要一致
group.id=connect-cluster

# 修改为创建的 plugins 目录
# 注意：此处请填写 Kafka 的直接路径。例如：plugin.path=/opt/kafka/plugins
plugin.path=$KAFKA_HOME/plugins

# 建议将 Kafka 的 max.poll.interval.ms 时间调大到 30 分钟以上，默认 5 分钟
# 避免 Stream Load 导入数据消费超时，消费者被踢出消费群组
max.poll.interval.ms=1800000
consumer.max.poll.interval.ms=1800000
```

### 3. 启动 Distributed 模式

```shell
$KAFKA_HOME/bin/connect-distributed.sh -daemon $KAFKA_HOME/config/connect-distributed.properties
```

:::note
Kafka Connect 首次启动时，会在 Kafka 集群中创建 `config.storage.topic`、`offset.storage.topic`、`status.storage.topic` 三个 Topic，用于记录共享连接器配置、偏移数据和状态更新。更多说明请参考 [How to Use Kafka Connect - Get Started](https://docs.confluent.io/platform/current/connect/userguide.html)。
:::

### 4. 创建 Connector

```shell
curl -i http://127.0.0.1:8083/connectors -H "Content-Type: application/json" -X POST -d '{
    "name":"test-doris-sink-cluster",
    "config":{
        "connector.class":"org.apache.doris.kafka.connector.DorisSinkConnector",
        "topics":"topic_test",
        "doris.topic2table.map":"topic_test:test_kafka_tbl",
        "doris.urls":"10.10.10.1",
        "doris.user":"root",
        "doris.password":"",
        "doris.http.port":"8030",
        "doris.query.port":"9030",
        "doris.database":"test_db",
        "enable.combine.flush":"true",
        "buffer.count.records":"10000",
        "buffer.flush.time":"120",
        "buffer.size.bytes":"5000000",
        "key.converter":"org.apache.kafka.connect.storage.StringConverter",
        "value.converter":"org.apache.kafka.connect.json.JsonConverter",
        "value.converter.schemas.enable":"false"
    }
}'
```

### 5. 管理 Connector

可通过 Kafka Connect REST API 查看、暂停、恢复、删除或重启 Connector。更多接口说明请参考 [Connect REST Interface](https://docs.confluent.io/platform/current/connect/references/restapi.html#kconnect-rest-interface)。

```shell
# 查看 Connector 状态
curl -i http://127.0.0.1:8083/connectors/test-doris-sink-cluster/status -X GET

# 删除当前 Connector
curl -i http://127.0.0.1:8083/connectors/test-doris-sink-cluster -X DELETE

# 暂停当前 Connector
curl -i http://127.0.0.1:8083/connectors/test-doris-sink-cluster/pause -X PUT

# 恢复当前 Connector
curl -i http://127.0.0.1:8083/connectors/test-doris-sink-cluster/resume -X PUT

# 重启 Connector 内的 Task
curl -i http://127.0.0.1:8083/connectors/test-doris-sink-cluster/tasks/0/restart -X POST
```

## 生产环境增强配置

### 访问 SSL 认证的 Kafka 集群

通过 Kafka Connect 访问 SSL 认证的 Kafka 集群时，需要提供用于认证 Kafka Broker 公钥的证书文件，例如 `client.truststore.jks`。可以在 `connect-distributed.properties` 文件中增加以下配置：

```properties
# Connect worker
security.protocol=SSL
ssl.truststore.location=/var/ssl/private/client.truststore.jks
ssl.truststore.password=test1234

# Embedded consumer for sink connectors
consumer.security.protocol=SSL
consumer.ssl.truststore.location=/var/ssl/private/client.truststore.jks
consumer.ssl.truststore.password=test1234
```

关于通过 Kafka Connect 连接 SSL 认证 Kafka 集群的配置说明，请参考 [Configure Kafka Connect](https://docs.confluent.io/platform/current/security/security_tutorial.html#configure-kafka-connect)。

### 配置死信队列

默认情况下，转换过程中遇到的任何错误都会导致 Connector 失败。可以通过以下配置容忍此类错误，并将每个错误和失败操作的详细信息以及有问题的记录写入死信队列：

```properties
errors.tolerance=all
errors.deadletterqueue.topic.name=test_error_topic
errors.deadletterqueue.context.headers.enable=true
errors.deadletterqueue.topic.replication.factor=1
```

## 配置项

以下配置用于创建 Doris Sink Connector。其他 Kafka Connect Sink 通用配置项请参考 [connect_configuring](https://kafka.apache.org/documentation/#connect_configuring)。

| Key | Enum | Default Value | Required | Description |
| --- | --- | --- | --- | --- |
| `name` | - | - | Y | Connect 应用名称，必须在 Kafka Connect 环境中唯一。 |
| `connector.class` | - | - | Y | `org.apache.doris.kafka.connector.DorisSinkConnector`。 |
| `topics` | - | - | Y | 订阅的 Topic 列表，多个 Topic 用逗号分隔，例如 `topic1,topic2`。 |
| `doris.urls` | - | - | Y | Doris FE 连接地址。多个地址用逗号分隔，例如 `10.20.30.1,10.20.30.2,10.20.30.3`。 |
| `doris.http.port` | - | - | Y | Doris HTTP 协议端口。 |
| `doris.query.port` | - | - | Y | Doris MySQL 协议端口。 |
| `doris.user` | - | - | Y | Doris 用户名。 |
| `doris.password` | - | - | Y | Doris 密码。 |
| `doris.database` | - | - | Y | 要写入的数据库。多个库时可以为空，同时需要在 `topic2table.map` 中配置具体库名。 |
| `doris.topic2table.map` | - | - | Y | Topic 和表的对应关系，例如 `topic1:tb1,topic2:tb2`。如果留空，默认将 Topic 名称作为写入的表名。多个库的格式为 `topic1:db1.tbl1,topic2:db2.tbl2`。 |
| `buffer.count.records` | - | 50000 | N | 单次 Stream Load 写入的条数。 |
| `buffer.flush.time` | - | 120 | N | Buffer 刷新间隔，单位为秒，默认值为 120 秒。 |
| `buffer.size.bytes` | - | 104857600(100MB) | N | 单次 Stream Load 写入的数据大小。 |
| `enable.combine.flush` | `true`,<br />`false` | false | N | 是否将所有分区的数据合并写入。默认值为 `false`。开启后只能保证 `at_least_once` 语义。 |
| `jmx` | - | true | N | 是否通过 JMX 获取 Connector 内部监控指标。请参考 [Doris-Connector-JMX](https://github.com/apache/doris-kafka-connector/blob/master/docs/en/Doris-Connector-JMX.md)。 |
| `label.prefix` | - | `${name}` | N | Stream Load 导入数据时的 Label 前缀。默认值为 Connector 应用名称。 |
| `auto.redirect` | - | true | N | 是否重定向 Stream Load 请求。开启后，Stream Load 会通过 FE 重定向到需要写入数据的 BE，并且不再显示获取 BE 信息。 |
| `sink.properties.*` | - | `'sink.properties.format':'json'`,<br />`'sink.properties.read_json_by_line':'true'` | N | Stream Load 的导入参数。例如，通过 `'sink.properties.column_separator':','` 定义列分隔符。详细参数请参考 [Stream Load 手册](../../data-operate/import/import-way/stream-load-manual.md)。<br /><br />开启 Group Commit 时，例如开启 `sync_mode` 模式：`"sink.properties.group_commit":"sync_mode"`。Group Commit 可以配置 `off_mode`、`sync_mode`、`async_mode` 三种模式，具体使用请参考 [Group Commit](https://doris.apache.org/docs/data-operate/import/group-commit-manual/)。<br /><br />开启部分列更新时，例如开启更新指定 `col2` 的部分列：`"sink.properties.partial_columns":"true"`、`"sink.properties.columns":"col2"`。 |
| `delivery.guarantee` | `at_least_once`,<br />`exactly_once` | at_least_once | N | 消费 Kafka 数据并导入 Doris 时的数据一致性保障方式。支持 `at_least_once` 和 `exactly_once`，默认值为 `at_least_once`。Doris 需要升级至 2.1.0 以上，才能保障数据的 `exactly_once`。 |
| `converter.mode` | `normal`,<br />`debezium_ingestion` | normal | N | Connector 消费 Kafka 数据时的上游数据类型转换模式。`normal` 表示正常消费 Kafka 中的数据，不进行特殊类型转换；`debezium_ingestion` 表示当 Kafka 上游数据通过 Debezium 等 CDC（Change Data Capture，变更数据捕获）工具采集时，需要进行特殊类型转换。 |
| `debezium.schema.evolution` | `none`,<br />`basic` | none | N | 通过 Debezium 采集上游数据库系统（如 MySQL）时，如果发生结构变更，可以将增加的字段同步到 Doris 中。`none` 表示上游数据库系统发生结构变更时，不同步变更后的结构到 Doris 中。`basic` 表示同步上游数据库的数据变更操作。由于列结构变更是危险操作，可能导致误删 Doris 表结构中的列，目前仅支持同步上游增加列。当列被重命名后，旧列保持原样，Connector 会在目标表中新增一列，并将重命名后的新增数据 Sink 到新列中。 |
| `enable.delete` | - | false | N | Debezium 同步下，是否同步删除记录，默认值为 `false`。非 Debezium 同步下，需要在消息中拼接删除标记。 |
| `database.time_zone` | - | UTC | N | 当 `converter.mode` 为非 `normal` 模式时，对于 `datetime`、`date`、`timestamp` 等日期数据类型，指定时区转换方式。默认值为 UTC。 |
| `avro.topic2schema.filepath` | - | - | N | 通过读取本地 Avro Schema 文件解析 Topic 中的 Avro 文件内容，实现与 Confluent Schema Registry 解耦。此配置需要与 `key.converter` 或 `value.converter` 前缀一起使用。例如，为 `avro-user`、`avro-product` Topic 配置本地 Avro Schema 文件：`"value.converter.avro.topic2schema.filepath":"avro-user:file:///opt/avro_user.avsc, avro-product:file:///opt/avro_product.avsc"`。具体使用请参考 [#32](https://github.com/apache/doris-kafka-connector/pull/32)。 |
| `record.tablename.field` | - | - | N | 开启该参数后，可实现一个 Topic 的数据流向多个 Doris 表。配置详情请参考 [#58](https://github.com/apache/doris-kafka-connector/pull/58)。 |
| `max.retries` | - | 10 | N | 任务失败前重试错误的最大次数。 |
| `retry.interval.ms` | - | 6000 | N | 发生错误后，尝试重试前的等待时间，单位为毫秒，默认值为 6000 毫秒。 |
| `behavior.on.null.values` | `ignore`,<br />`fail` | ignore | N | 如何处理值为 `null` 的记录，默认跳过不处理。 |

## 类型映射

Doris Kafka Connector 使用 Kafka Connect 的原始类型或逻辑类型解析列的数据类型。原始类型是使用 Kafka Connect `Schema` 表示的简单数据类型。逻辑类型通常使用 `Struct` 结构表示复杂类型，或者表示日期时间类型。

### Kafka 原始类型

| Kafka 原始类型 | Doris 类型 |
| --- | --- |
| INT8 | TINYINT |
| INT16 | SMALLINT |
| INT32 | INT |
| INT64 | BIGINT |
| FLOAT32 | FLOAT |
| FLOAT64 | DOUBLE |
| BOOLEAN | BOOLEAN |
| STRING | STRING |
| BYTES | STRING |

### Kafka 逻辑类型

| Kafka 逻辑类型 | Doris 类型 |
| --- | --- |
| `org.apache.kafka.connect.data.Decimal` | DECIMAL |
| `org.apache.kafka.connect.data.Date` | DATE |
| `org.apache.kafka.connect.data.Time` | STRING |
| `org.apache.kafka.connect.data.Timestamp` | DATETIME |

### Debezium 逻辑类型

| Debezium 逻辑类型 | Doris 类型 |
| --- | --- |
| `io.debezium.time.Date` | DATE |
| `io.debezium.time.Time` | String |
| `io.debezium.time.MicroTime` | DATETIME |
| `io.debezium.time.NanoTime` | DATETIME |
| `io.debezium.time.ZonedTime` | DATETIME |
| `io.debezium.time.Timestamp` | DATETIME |
| `io.debezium.time.MicroTimestamp` | DATETIME |
| `io.debezium.time.NanoTimestamp` | DATETIME |
| `io.debezium.time.ZonedTimestamp` | DATETIME |
| `io.debezium.data.VariableScaleDecimal` | DOUBLE |

## 按数据场景配置 Connector

### 同步普通 JSON 数据

该场景适合将 Kafka Topic 中的普通 JSON 消息写入 Doris 表。

1. 查看 Kafka 中的样本数据：

    ```bash
    kafka-console-consumer.sh --bootstrap-server localhost:9092 --topic test-data-topic --from-beginning
    {"user_id":1,"name":"Emily","age":25}
    {"user_id":2,"name":"Benjamin","age":35}
    {"user_id":3,"name":"Olivia","age":28}
    {"user_id":4,"name":"Alexander","age":60}
    {"user_id":5,"name":"Ava","age":17}
    {"user_id":6,"name":"William","age":69}
    {"user_id":7,"name":"Sophia","age":32}
    {"user_id":8,"name":"James","age":64}
    {"user_id":9,"name":"Emma","age":37}
    {"user_id":10,"name":"Liam","age":64}
    ```

2. 在 Doris 中创建目标表：

    ```sql
    CREATE TABLE test_db.test_kafka_connector_tbl (
        user_id BIGINT NOT NULL COMMENT "user id",
        name VARCHAR(20) COMMENT "name",
        age INT COMMENT "age"
    )
    DUPLICATE KEY(user_id)
    DISTRIBUTED BY HASH(user_id) BUCKETS 12;
    ```

3. 在部署 Kafka Connect 的机器上，通过 `curl` 提交导入任务：

    ```shell
    curl -i http://127.0.0.1:8083/connectors -H "Content-Type: application/json" -X POST -d '{
        "name":"test-doris-sink-cluster",
        "config":{
            "connector.class":"org.apache.doris.kafka.connector.DorisSinkConnector",
            "tasks.max":"10",
            "topics":"test-data-topic",
            "doris.topic2table.map":"test-data-topic:test_kafka_connector_tbl",
            "doris.urls":"10.10.10.1",
            "doris.user":"root",
            "doris.password":"",
            "doris.http.port":"8030",
            "doris.query.port":"9030",
            "doris.database":"test_db",
            "buffer.count.records":"10000",
            "buffer.flush.time":"120",
            "buffer.size.bytes":"5000000",
            "enable.combine.flush":"true",
            "key.converter":"org.apache.kafka.connect.storage.StringConverter",
            "value.converter":"org.apache.kafka.connect.json.JsonConverter",
            "value.converter.schemas.enable":"false"
        }
    }'
    ```

### 同步 Debezium 组件采集的数据

该场景适合将 Debezium 采集的 MySQL CDC 数据通过 Kafka 写入 Doris。

1. MySQL 数据库中有如下表和数据：

    ```sql
    CREATE TABLE test.test_user (
        user_id int NOT NULL,
        name varchar(20),
        age int,
        PRIMARY KEY (user_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

    INSERT INTO test.test_user VALUES (1, 'zhangsan', 20);
    INSERT INTO test.test_user VALUES (2, 'lisi', 21);
    INSERT INTO test.test_user VALUES (3, 'wangwu', 22);
    ```

2. 在 Doris 中创建目标表：

    ```sql
    CREATE TABLE test_db.test_user (
        user_id BIGINT NOT NULL COMMENT "user id",
        name VARCHAR(20) COMMENT "name",
        age INT COMMENT "age"
    )
    UNIQUE KEY(user_id)
    DISTRIBUTED BY HASH(user_id) BUCKETS 12;
    ```

3. 部署 Debezium connector for MySQL 组件。具体步骤请参考 [Debezium connector for MySQL](https://debezium.io/documentation/reference/stable/connectors/mysql.html)。

4. 创建 doris-kafka-connector 导入任务。假设通过 Debezium 采集到的 MySQL 表数据在 `mysql_debezium.test.test_user` Topic 中：

    ```shell
    curl -i http://127.0.0.1:8083/connectors -H "Content-Type: application/json" -X POST -d '{
        "name":"test-debezium-doris-sink",
        "config":{
            "connector.class":"org.apache.doris.kafka.connector.DorisSinkConnector",
            "tasks.max":"10",
            "topics":"mysql_debezium.test.test_user",
            "doris.topic2table.map":"mysql_debezium.test.test_user:test_user",
            "doris.urls":"10.10.10.1",
            "doris.user":"root",
            "doris.password":"",
            "doris.http.port":"8030",
            "doris.query.port":"9030",
            "doris.database":"test_db",
            "buffer.count.records":"10000",
            "buffer.flush.time":"30",
            "buffer.size.bytes":"5000000",
            "enable.combine.flush":"true",
            "converter.mode":"debezium_ingestion",
            "enable.delete":"true",
            "key.converter":"org.apache.kafka.connect.json.JsonConverter",
            "value.converter":"org.apache.kafka.connect.json.JsonConverter"
        }
    }'
    ```

### 同步 Avro 序列化数据

该场景适合消费使用 Avro 序列化的 Kafka Topic，并通过 Confluent Avro Converter 解析数据。

```shell
curl -i http://127.0.0.1:8083/connectors -H "Content-Type: application/json" -X POST -d '{
    "name":"doris-avro-test",
    "config":{
        "connector.class":"org.apache.doris.kafka.connector.DorisSinkConnector",
        "topics":"avro_topic",
        "tasks.max":"10",
        "doris.topic2table.map":"avro_topic:avro_tab",
        "doris.urls":"127.0.0.1",
        "doris.user":"root",
        "doris.password":"",
        "doris.http.port":"8030",
        "doris.query.port":"9030",
        "doris.database":"test",
        "buffer.count.records":"100000",
        "buffer.flush.time":"120",
        "buffer.size.bytes":"10000000",
        "enable.combine.flush":"true",
        "key.converter":"io.confluent.connect.avro.AvroConverter",
        "key.converter.schema.registry.url":"http://127.0.0.1:8081",
        "value.converter":"io.confluent.connect.avro.AvroConverter",
        "value.converter.schema.registry.url":"http://127.0.0.1:8081"
    }
}'
```

### 同步 Protobuf 序列化数据

该场景适合消费使用 Protobuf 序列化的 Kafka Topic，并通过 Confluent Protobuf Converter 解析数据。

```shell
curl -i http://127.0.0.1:8083/connectors -H "Content-Type: application/json" -X POST -d '{
    "name":"doris-protobuf-test",
    "config":{
        "connector.class":"org.apache.doris.kafka.connector.DorisSinkConnector",
        "topics":"proto_topic",
        "tasks.max":"10",
        "doris.topic2table.map":"proto_topic:proto_tab",
        "doris.urls":"127.0.0.1",
        "doris.user":"root",
        "doris.password":"",
        "doris.http.port":"8030",
        "doris.query.port":"9030",
        "doris.database":"test",
        "buffer.count.records":"100000",
        "buffer.flush.time":"120",
        "buffer.size.bytes":"10000000",
        "enable.combine.flush":"true",
        "key.converter":"io.confluent.connect.protobuf.ProtobufConverter",
        "key.converter.schema.registry.url":"http://127.0.0.1:8081",
        "value.converter":"io.confluent.connect.protobuf.ProtobufConverter",
        "value.converter.schema.registry.url":"http://127.0.0.1:8081"
    }
}'
```

### 使用 Kafka Connect SMT 转换数据

该场景适合在写入 Doris 前，对单条 Kafka 消息做字段补充或格式转换。以下示例使用 `InsertField` 新增静态字段，并使用 `TimestampConverter` 将 Bigint 类型 timestamp 转换为时间字符串。

原始数据示例：

```json
{
    "registertime": 1513885135404,
    "userid": "User_9",
    "regionid": "Region_3",
    "gender": "MALE"
}
```

创建 Connector：

```shell
curl -i http://127.0.0.1:8083/connectors -H "Content-Type: application/json" -X POST -d '{
    "name":"insert_field_tranform",
    "config":{
        "connector.class":"org.apache.doris.kafka.connector.DorisSinkConnector",
        "tasks.max":"1",
        "topics":"users",
        "doris.topic2table.map":"users:kf_users",
        "buffer.count.records":"10000",
        "buffer.flush.time":"10",
        "buffer.size.bytes":"5000000",
        "doris.urls":"127.0.0.1:8030",
        "doris.user":"root",
        "doris.password":"123456",
        "doris.http.port":"8030",
        "doris.query.port":"9030",
        "doris.database":"testdb",
        "key.converter":"org.apache.kafka.connect.storage.StringConverter",
        "value.converter":"org.apache.kafka.connect.json.JsonConverter",
        "value.converter.schemas.enable":"false",
        "transforms":"InsertField,TimestampConverter",
        "transforms.InsertField.type":"org.apache.kafka.connect.transforms.InsertField$Value",
        "transforms.InsertField.static.field":"repo",
        "transforms.InsertField.static.value":"Apache Doris",
        "transforms.TimestampConverter.type":"org.apache.kafka.connect.transforms.TimestampConverter$Value",
        "transforms.TimestampConverter.field":"registertime",
        "transforms.TimestampConverter.format":"yyyy-MM-dd HH:mm:ss.SSS",
        "transforms.TimestampConverter.target.type":"string"
    }
}'
```

样例数据经过 SMT 处理后，变为：

```json
{
    "userid": "User_9",
    "regionid": "Region_3",
    "gender": "MALE",
    "repo": "Apache Doris",
    "registertime": "2017-12-21 03:38:55.404"
}
```

其中，`repo` 为 `InsertField` 增加的静态字段，`registertime` 为 `TimestampConverter` 转换后的时间字符串。更多 Kafka Connect Single Message Transforms (SMT) 使用案例，请参考 [SMT documentation](https://docs.confluent.io/cloud/current/connectors/transforms/overview.html)。

## 常见问题

### 读取 JSON 类型数据时报 `JsonConverter with schemas.enable requires "schema" and "payload" fields`

**报错信息：**

```shell
Caused by: org.apache.kafka.connect.errors.DataException: JsonConverter with schemas.enable requires "schema" and "payload" fields and may not contain additional fields. If you are trying to deserialize plain JSON data, set schemas.enable=false in your converter configuration.
    at org.apache.kafka.connect.json.JsonConverter.toConnectData(JsonConverter.java:337)
    at org.apache.kafka.connect.storage.Converter.toConnectData(Converter.java:91)
    at org.apache.kafka.connect.runtime.WorkerSinkTask.lambda$convertAndTransformRecord$4(WorkerSinkTask.java:536)
    at org.apache.kafka.connect.runtime.errors.RetryWithToleranceOperator.execAndRetry(RetryWithToleranceOperator.java:180)
    at org.apache.kafka.connect.runtime.errors.RetryWithToleranceOperator.execAndHandleError(RetryWithToleranceOperator.java:214)
```

**原因：**

使用 `org.apache.kafka.connect.json.JsonConverter` 转换器时，数据需要匹配 `schema` 和 `payload` 字段。

**解决方案：**

可任选以下一种方式处理：

1. 将 `org.apache.kafka.connect.json.JsonConverter` 更换为 `org.apache.kafka.connect.storage.StringConverter`。
2. 将对应配置文件中的 `value.converter.schemas.enable` 或 `key.converter.schemas.enable` 改为 `false`。
    - Standalone 模式：修改 `config/connect-standalone.properties`。
    - Distributed 模式：修改 `config/connect-distributed.properties`。

### 消费超时，消费者被踢出消费群组

**报错信息：**

```shell
org.apache.kafka.clients.consumer.CommitFailedException: Offset commit cannot be completed since the consumer is not part of an active group for auto partition assignment; it is likely that the consumer was kicked out of the group.
        at org.apache.kafka.clients.consumer.internals.ConsumerCoordinator.sendOffsetCommitRequest(ConsumerCoordinator.java:1318)
        at org.apache.kafka.clients.consumer.internals.ConsumerCoordinator.doCommitOffsetsAsync(ConsumerCoordinator.java:1127)
        at org.apache.kafka.clients.consumer.internals.ConsumerCoordinator.commitOffsetsAsync(ConsumerCoordinator.java:1093)
        at org.apache.kafka.clients.consumer.KafkaConsumer.commitAsync(KafkaConsumer.java:1590)
        at org.apache.kafka.connect.runtime.WorkerSinkTask.doCommitAsync(WorkerSinkTask.java:361)
        at org.apache.kafka.connect.runtime.WorkerSinkTask.doCommit(WorkerSinkTask.java:376)
        at org.apache.kafka.connect.runtime.WorkerSinkTask.commitOffsets(WorkerSinkTask.java:467)
        at org.apache.kafka.connect.runtime.WorkerSinkTask.commitOffsets(WorkerSinkTask.java:381)
        at org.apache.kafka.connect.runtime.WorkerSinkTask.iteration(WorkerSinkTask.java:221)
        at org.apache.kafka.connect.runtime.WorkerSinkTask.execute(WorkerSinkTask.java:206)
        at org.apache.kafka.connect.runtime.WorkerTask.doRun(WorkerTask.java:204)
        at org.apache.kafka.connect.runtime.WorkerTask.run(WorkerTask.java:259)
        at org.apache.kafka.connect.runtime.isolation.Plugins.lambda$withClassLoader$1(Plugins.java:181)
        at java.base/java.util.concurrent.Executors$RunnableAdapter.call(Executors.java:539)
        at java.base/java.util.concurrent.FutureTask.run(FutureTask.java:264)
        at java.base/java.util.concurrent.ThreadPoolExecutor.runWorker(ThreadPoolExecutor.java:1136)
        at java.base/java.util.concurrent.ThreadPoolExecutor$Worker.run(ThreadPoolExecutor.java:635)
        at java.base/java.lang.Thread.run(Thread.java:833)
```

**解决方案：**

根据场景调大 Kafka 的 `max.poll.interval.ms`，默认值为 `300000`。

- Standalone 模式：在 `config/connect-standalone.properties` 中增加 `max.poll.interval.ms` 和 `consumer.max.poll.interval.ms`，并配置参数值。
- Distributed 模式：在 `config/connect-distributed.properties` 中增加 `max.poll.interval.ms` 和 `consumer.max.poll.interval.ms`，并配置参数值。

调整参数后，重启 Kafka Connect。

### Doris Kafka Connector 从 1.0.0 或 1.1.0 升级到 24.0.0 时报 `cleanup.policy=compact` 相关错误

**报错信息：**

```shell
org.apache.kafka.common.config.ConfigException: Topic 'connect-status' supplied via the 'status.storage.topic' property is required to have 'cleanup.policy=compact' to guarantee consistency and durability of connector and task statuses, but found the topic currently has 'cleanup.policy=delete'. Continuing would likely result in eventually losing connector and task statuses and problems restarting this Connect cluster in the future. Change the 'status.storage.topic' property in the Connect worker configurations to use a topic with 'cleanup.policy=compact'.
    at org.apache.kafka.connect.util.TopicAdmin.verifyTopicCleanupPolicyOnlyCompact(TopicAdmin.java:581)
    at org.apache.kafka.connect.storage.KafkaTopicBasedBackingStore.lambda$topicInitializer$0(KafkaTopicBasedBackingStore.java:47)
    at org.apache.kafka.connect.util.KafkaBasedLog.start(KafkaBasedLog.java:247)
    at org.apache.kafka.connect.util.KafkaBasedLog.start(KafkaBasedLog.java:231)
    at org.apache.kafka.connect.storage.KafkaStatusBackingStore.start(KafkaStatusBackingStore.java:228)
    at org.apache.kafka.connect.runtime.AbstractHerder.startServices(AbstractHerder.java:164)
    at org.apache.kafka.connect.runtime.distributed.DistributedHerder.run
```

**解决方案：**

将 `connect-configs` 和 `connect-status` Topic 的清除策略调整为 `compact`：

```shell
$KAFKA_HOME/bin/kafka-configs.sh --alter --entity-type topics --entity-name connect-configs --add-config cleanup.policy=compact --bootstrap-server 127.0.0.1:9092
$KAFKA_HOME/bin/kafka-configs.sh --alter --entity-type topics --entity-name connect-status --add-config cleanup.policy=compact --bootstrap-server 127.0.0.1:9092
```

### `debezium_ingestion` 转换模式下，表结构变更失败

**报错信息：**

```shell
[2025-01-07 14:26:20,474] WARN [doris-normal_test_sink-connector|task-0] Table 'test_sink' cannot be altered because schema evolution is disabled. (org.apache.doris.kafka.connector.converter.RecordService:183)
[2025-01-07 14:26:20,475] ERROR [doris-normal_test_sink-connector|task-0] WorkerSinkTask{id=doris-normal_test_sink-connector-0} Task threw an uncaught and unrecoverable exception. Task is being killed and will not recover until manually restarted. Error: Cannot alter table org.apache.doris.kafka.connector.model.TableDescriptor@67cd8027 because schema evolution is disabled (org.apache.kafka.connect.runtime.WorkerSinkTask:612)
org.apache.doris.kafka.connector.exception.SchemaChangeException: Cannot alter table org.apache.doris.kafka.connector.model.TableDescriptor@67cd8027 because schema evolution is disabled
    at org.apache.doris.kafka.connector.converter.RecordService.alterTableIfNeeded(RecordService.java:186)
    at org.apache.doris.kafka.connector.converter.RecordService.checkAndApplyTableChangesIfNeeded(RecordService.java:150)
    at org.apache.doris.kafka.connector.converter.RecordService.processStructRecord(RecordService.java:100)
    at org.apache.doris.kafka.connector.converter.RecordService.getProcessedRecord(RecordService.java:305)
    at org.apache.doris.kafka.connector.writer.DorisWriter.putBuffer(DorisWriter.java:155)
    at org.apache.doris.kafka.connector.writer.DorisWriter.insertRecord(DorisWriter.java:124)
    at org.apache.doris.kafka.connector.writer.StreamLoadWriter.insert(StreamLoadWriter.java:151)
    at org.apache.doris.kafka.connector.service.DorisDefaultSinkService.insert(DorisDefaultSinkService.java:154)
    at org.apache.doris.kafka.connector.service.DorisDefaultSinkService.insert(DorisDefaultSinkService.java:135)
    at org.apache.doris.kafka.connector.DorisSinkTask.put(DorisSinkTask.java:97)
    at org.apache.kafka.connect.runtime.WorkerSinkTask.deliverMessages(WorkerSinkTask.java:583)
    at org.apache.kafka.connect.runtime.WorkerSinkTask.poll(WorkerSinkTask.java:336)
    at org.apache.kafka.connect.runtime.WorkerSinkTask.iteration(WorkerSinkTask.java:237)
    at org.apache.kafka.connect.runtime.WorkerSinkTask.execute(WorkerSinkTask.java:206)
    at org.apache.kafka.connect.runtime.WorkerTask.doRun(WorkerTask.java:202)
    at org.apache.kafka.connect.runtime.WorkerTask.run(WorkerTask.java:257)
    at org.apache.kafka.connect.runtime.isolation.Plugins.lambda$withClassLoader$1(Plugins.java:177)
    at java.base/java.util.concurrent.Executors$RunnableAdapter.call(Executors.java:515)
    at java.base/java.util.concurrent.FutureTask.run(FutureTask.java:264)
    at java.base/java.util.concurrent.ThreadPoolExecutor.runWorker(ThreadPoolExecutor.java:1128)
    at java.base/java.util.concurrent.ThreadPoolExecutor$Worker.run(ThreadPoolExecutor.java:628)
    at java.base/java.lang.Thread.run(Thread.java:829)
```

**解决方案：**

在 `debezium_ingestion` 转换模式下，默认关闭表结构变更。需要配置 `debezium.schema.evolution=basic`，以便开启表结构变更。

需要注意的是，开启表结构变更并不能准确保证变更列是 Doris 表中的唯一列，具体限制请参考 `debezium.schema.evolution` 参数说明。如需保持上下游只存在唯一列，最好先手动将变更列添加到 Doris 表中，再重新启动 Connector 任务。Connector 会接着未消费的 `offset` 继续消费，以保持数据一致性。
