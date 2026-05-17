---
{
    "title": "从 Kafka 导入数据",
    "language": "zh-CN",
    "description": "介绍如何从 Kafka 导入数据到 Apache Doris，涵盖 Routine Load 与 Doris Kafka Connector 两种方式的选型、配置与示例。",
    "keywords": [
        "Kafka 导入",
        "Routine Load",
        "Doris Kafka Connector",
        "Kafka Connect",
        "Debezium",
        "Avro",
        "Protobuf",
        "CDC 同步"
    ]
}
---

<!-- 知识类型: 操作步骤 / 架构选型决策 -->
<!-- 适用场景: 实时数据接入 / Kafka 数据导入 Doris -->

Apache Doris 支持从 Kafka 实时消费数据，常用于日志、订单、IoT 事件、CDC 同步等实时数据接入场景。本文介绍两种主流方式的选型建议、使用限制以及完整的操作示例。

## 方案选型

Doris 提供以下两种从 Kafka 导入数据的方式：

| 方式 | 适用场景 | 支持格式 | 特性 |
| --- | --- | --- | --- |
| [Routine Load](../import-way/routine-load-manual.md) | 大多数常规场景，无需引入外部组件 | CSV、JSON | 持续消费 Kafka Topic，实时生成导入任务，具备 Exactly-Once 语义，数据不丢不重 |
| [Doris Kafka Connector](../../../connection-integration/data-integration/doris-kafka-connector.md) | 需要导入 Avro / Protobuf 等多种序列化格式，或消费 Debezium 采集的上游数据库 CDC 数据 | JSON、Avro、Protobuf、Debezium | 基于 Kafka Connect 插件机制，可水平扩展和容错 |

选型建议：

- 默认优先选择 **Routine Load**，由 Doris 直接消费 Kafka，部署最简单。
- 当需要消费 **Avro / Protobuf** 等格式，或对接 **Debezium** 等 Kafka Connect 生态组件时，选择 **Doris Kafka Connector**。

## 方式一：使用 Routine Load 消费 Kafka 数据

Routine Load 通过在 Doris 中提交一个常驻作业，持续消费指定 Kafka Topic 中的消息，并实时写入 Doris 表中。

### 使用限制

1. 仅支持 **CSV** 和 **JSON** 两种消息格式。CSV 每条消息为一行，且行尾不包含换行符。
2. 默认支持 **Kafka 0.10.0.0 及以上版本**。如需使用旧版本（如 0.9.0、0.8.2、0.8.1、0.8.0），需修改 BE 配置项 `kafka_broker_version_fallback` 为兼容的旧版本，或在创建 Routine Load 时设置 `property.broker.version.fallback`。使用旧版本可能导致部分新特性无法使用，例如根据时间设置 Kafka 分区的 offset。

### 操作示例

通过 `CREATE ROUTINE LOAD` 命令创建常驻 Routine Load 导入任务，分为单表导入与多表导入两种场景。详细语法请参考 [CREATE ROUTINE LOAD](../../../sql-manual/sql-statements/data-modification/load-and-export/CREATE-ROUTINE-LOAD)。

#### 场景 1：单表导入

将 Kafka 中的一个 Topic 数据导入到 Doris 中的一张表。

**第 1 步：准备 Kafka 数据**

在 Kafka 中，样本数据如下：

```SQL
kafka-console-consumer.sh --bootstrap-server localhost:9092 --topic test-routine-load-csv --from-beginning
1,Emily,25
```

**第 2 步：在 Doris 中创建目标表**

```SQL
CREATE TABLE testdb.test_routineload_tbl(
    user_id            BIGINT       NOT NULL COMMENT "user id",
    name               VARCHAR(20)           COMMENT "name",
    age                INT                   COMMENT "age"
)
DUPLICATE KEY(user_id)
DISTRIBUTED BY HASH(user_id) BUCKETS 10;
```

**第 3 步：创建 Routine Load 作业**

使用 `CREATE ROUTINE LOAD` 命令创建导入作业：

```SQL
CREATE ROUTINE LOAD testdb.example_routine_load_csv ON test_routineload_tbl
COLUMNS TERMINATED BY ",",
COLUMNS(user_id, name, age)
FROM KAFKA(
    "kafka_broker_list" = "192.168.88.62:9092",
    "kafka_topic" = "test-routine-load-csv",
    "property.kafka_default_offsets" = "OFFSET_BEGINNING"
);
```

**第 4 步：检查导入结果**

```SQL
select * from test_routineload_tbl;
+-----------+----------------+------+
| user_id   | name           | age  |
+-----------+----------------+------+
|  1        | Emily          | 25   |
+-----------+----------------+------+
```

#### 场景 2：多表导入

适用于需要从同一个 Kafka Topic 同时导入多张 Doris 表的场景。

要求与限制：

- Kafka 中的数据必须包含表名信息，格式为 `table_name|data`。例如，CSV 数据格式为 `table_name|val1,val2,val3`。
- **表名必须与 Doris 中的表名完全一致**，否则导入将失败。
- 多表导入**不支持**后文介绍的 `column_mapping` 配置。

**第 1 步：准备 Kafka 数据**

在 Kafka 中，样本数据如下（前缀为目标表名）：

```SQL
kafka-console-consumer.sh --bootstrap-server localhost:9092 --topic test-multi-table-load --from-beginning
test_multi_table_load1|1,Emily,25
test_multi_table_load2|2,Benjamin,35
```

**第 2 步：在 Doris 中创建目标表**

表 1：

```SQL
CREATE TABLE test_multi_table_load1(
    user_id            BIGINT       NOT NULL COMMENT "用户 ID",
    name               VARCHAR(20)           COMMENT "用户姓名",
    age                INT                   COMMENT "用户年龄"
)
DUPLICATE KEY(user_id)
DISTRIBUTED BY HASH(user_id) BUCKETS 10;
```

表 2：

```SQL
CREATE TABLE test_multi_table_load2(
    user_id            BIGINT       NOT NULL COMMENT "用户 ID",
    name               VARCHAR(20)           COMMENT "用户姓名",
    age                INT                   COMMENT "用户年龄"
)
DUPLICATE KEY(user_id)
DISTRIBUTED BY HASH(user_id) BUCKETS 10;
```

**第 3 步：创建多表 Routine Load 作业**

```SQL
CREATE ROUTINE LOAD example_multi_table_load
COLUMNS TERMINATED BY ","
FROM KAFKA(
    "kafka_broker_list" = "192.168.88.62:9092",
    "kafka_topic" = "test-multi-table-load",
    "property.kafka_default_offsets" = "OFFSET_BEGINNING"
);
```

**第 4 步：检查导入结果**

```SQL
mysql> select * from test_multi_table_load1;
+------+----------------+------+
| id   | name           | age  |
+------+----------------+------+
|  1   | Emily          | 25   |
+------+----------------+------+

mysql> select * from test_multi_table_load2;
+------+----------------+------+
| id   | name           | age  |
+------+----------------+------+
|  2   | Benjamin       | 35   |
+------+----------------+------+
```

### 配置安全认证

若 Kafka 集群启用了 SSL、SASL 等安全认证，请参考 [Kafka 安全认证](../import-way/routine-load-manual.md#kafka-安全认证) 配置对应的认证参数。

## 方式二：使用 Doris Kafka Connector 消费 Kafka 数据

Doris Kafka Connector 是一款基于 Kafka Connect 框架，将 Kafka 数据流写入 Doris 的工具。通过插件机制可以轻松导入多种序列化格式（如 JSON、Avro、Protobuf），并支持解析 Debezium 采集的 CDC 数据。

### 以 Distributed 模式启动

[Distributed](https://docs.confluent.io/platform/current/connect/index.html#distributed-workers) 模式为 Kafka Connect 提供可扩展性和自动容错能力。在该模式下，可以使用相同的 `group.id` 启动多个工作进程，它们会协同调度连接器与任务。

**第 1 步：放置插件 JAR**

在 `$KAFKA_HOME` 下创建 plugins 目录，将下载好的 `doris-kafka-connector` JAR 包放入其中。

**第 2 步：配置 `config/connect-distributed.properties`**

```Bash
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

**第 3 步：启动 Kafka Connect**

```Bash
$KAFKA_HOME/bin/connect-distributed.sh -daemon $KAFKA_HOME/config/connect-distributed.properties
```

**第 4 步：提交导入任务（消费 Kafka 数据）**

```Bash
curl -i http://127.0.0.1:8083/connectors -H "Content-Type: application/json" -X POST -d '{
  "name":"test-doris-sink-cluster",
  "config":{
    "connector.class":"org.apache.doris.kafka.connector.DorisSinkConnector",
    "topics":"topic_test",
    "doris.topic2table.map": "topic_test:test_kafka_tbl",
    "buffer.count.records":"10000",
    "buffer.flush.time":"120",
    "buffer.size.bytes":"5000000",
    "doris.urls":"10.10.10.1",
    "doris.user":"root",
    "doris.password":"",
    "doris.http.port":"8030",
    "doris.query.port":"9030",
    "doris.database":"test_db",
    "key.converter":"org.apache.kafka.connect.storage.StringConverter",
    "value.converter":"org.apache.kafka.connect.storage.StringConverter"
  }
}'
```

**Kafka Connect 常用运维命令**

| 操作 | 命令 |
| --- | --- |
| 查看 connector 状态 | `curl -i http://127.0.0.1:8083/connectors/test-doris-sink-cluster/status -X GET` |
| 删除当前 connector | `curl -i http://127.0.0.1:8083/connectors/test-doris-sink-cluster -X DELETE` |
| 暂停当前 connector | `curl -i http://127.0.0.1:8083/connectors/test-doris-sink-cluster/pause -X PUT` |
| 重启当前 connector | `curl -i http://127.0.0.1:8083/connectors/test-doris-sink-cluster/resume -X PUT` |
| 重启 connector 内的 task | `curl -i http://127.0.0.1:8083/connectors/test-doris-sink-cluster/tasks/0/restart -X POST` |

关于 Distributed 模式的更多介绍，请参考 [Distributed Workers](https://docs.confluent.io/platform/current/connect/index.html#distributed-workers)。

### 消费普通 JSON 数据

适用于 Kafka 中存储的是普通 JSON 消息的场景。

**第 1 步：准备 Kafka 数据**

在 Kafka 中，样本数据如下：

```Bash
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

**第 2 步：在 Doris 中创建目标表**

```SQL
CREATE TABLE test_db.test_kafka_connector_tbl(
    user_id            BIGINT       NOT NULL COMMENT "user id",
    name               VARCHAR(20)           COMMENT "name",
    age                INT                   COMMENT "age"
)
DUPLICATE KEY(user_id)
DISTRIBUTED BY HASH(user_id) BUCKETS 12;
```

**第 3 步：提交导入任务**

在部署 Kafka Connect 的机器上，通过 `curl` 命令提交如下导入任务：

```Bash
curl -i http://127.0.0.1:8083/connectors -H "Content-Type: application/json" -X POST -d '{
  "name":"test-doris-sink-cluster",
  "config":{
    "connector.class":"org.apache.doris.kafka.connector.DorisSinkConnector",
    "tasks.max":"10",
    "topics":"test-data-topic",
    "doris.topic2table.map": "test-data-topic:test_kafka_connector_tbl",
    "buffer.count.records":"10000",
    "buffer.flush.time":"120",
    "buffer.size.bytes":"5000000",
    "doris.urls":"10.10.10.1",
    "doris.user":"root",
    "doris.password":"",
    "doris.http.port":"8030",
    "doris.query.port":"9030",
    "doris.database":"test_db",
    "key.converter":"org.apache.kafka.connect.storage.StringConverter",
    "value.converter":"org.apache.kafka.connect.storage.StringConverter"
  }
}'
```

### 消费 Debezium 采集的数据

适用于通过 Debezium 实时采集 MySQL/PostgreSQL 等上游数据库的变更数据（CDC），写入 Doris 的场景。

**第 1 步：在 MySQL 中准备源表与数据**

```SQL
CREATE TABLE test.test_user (
  user_id int NOT NULL ,
  name varchar(20),
  age int,
  PRIMARY KEY (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

insert into test.test_user values(1,'zhangsan',20);
insert into test.test_user values(2,'lisi',21);
insert into test.test_user values(3,'wangwu',22);
```

**第 2 步：在 Doris 中创建目标表**

CDC 场景需要使用 `UNIQUE KEY` 表模型以支持主键去重和删除：

```SQL
CREATE TABLE test_db.test_user(
    user_id            BIGINT       NOT NULL COMMENT "user id",
    name               VARCHAR(20)           COMMENT "name",
    age                INT                   COMMENT "age"
)
UNIQUE KEY(user_id)
DISTRIBUTED BY HASH(user_id) BUCKETS 12;
```

**第 3 步：部署 Debezium MySQL Connector**

部署 Debezium connector for MySQL 组件，参考：[Debezium connector for MySQL](https://debezium.io/documentation/reference/stable/connectors/mysql.html)。

**第 4 步：创建 doris-kafka-connector 导入任务**

假设通过 Debezium 采集到的 MySQL 表数据存放在 `mysql_debezium.test.test_user` Topic 中：

```Bash
curl -i http://127.0.0.1:8083/connectors -H "Content-Type: application/json" -X POST -d '{
  "name":"test-debezium-doris-sink",
  "config":{
    "connector.class":"org.apache.doris.kafka.connector.DorisSinkConnector",
    "tasks.max":"10",
    "topics":"mysql_debezium.test.test_user",
    "doris.topic2table.map": "mysql_debezium.test.test_user:test_user",
    "buffer.count.records":"10000",
    "buffer.flush.time":"120",
    "buffer.size.bytes":"5000000",
    "doris.urls":"10.10.10.1",
    "doris.user":"root",
    "doris.password":"",
    "doris.http.port":"8030",
    "doris.query.port":"9030",
    "doris.database":"test_db",
    "converter.mode":"debezium_ingestion",
    "enable.delete":"true",
    "key.converter":"org.apache.kafka.connect.json.JsonConverter",
    "value.converter":"org.apache.kafka.connect.json.JsonConverter"
  }
}'
```

关键参数说明：

- `converter.mode=debezium_ingestion`：启用 Debezium 数据格式解析。
- `enable.delete=true`：在 Doris 中同步执行删除操作。

### 消费 Avro 序列化格式数据

适用于 Kafka 中存储 Avro 格式数据，且配合 Schema Registry 使用的场景。

```Bash
curl -i http://127.0.0.1:8083/connectors -H "Content-Type: application/json" -X POST -d '{ 
  "name":"doris-avro-test", 
  "config":{ 
    "connector.class":"org.apache.doris.kafka.connector.DorisSinkConnector", 
    "topics":"avro_topic", 
    "tasks.max":"10",
    "doris.topic2table.map": "avro_topic:avro_tab", 
    "buffer.count.records":"100000", 
    "buffer.flush.time":"120", 
    "buffer.size.bytes":"10000000", 
    "doris.urls":"10.10.10.1", 
    "doris.user":"root", 
    "doris.password":"", 
    "doris.http.port":"8030", 
    "doris.query.port":"9030", 
    "doris.database":"test", 
    "load.model":"stream_load",
    "key.converter":"io.confluent.connect.avro.AvroConverter",
    "key.converter.schema.registry.url":"http://127.0.0.1:8081",
    "value.converter":"io.confluent.connect.avro.AvroConverter",
    "value.converter.schema.registry.url":"http://127.0.0.1:8081"
  } 
}'
```

### 消费 Protobuf 序列化格式数据

适用于 Kafka 中存储 Protobuf 格式数据，且配合 Schema Registry 使用的场景。

```Bash
curl -i http://127.0.0.1:8083/connectors -H "Content-Type: application/json" -X POST -d '{ 
  "name":"doris-protobuf-test", 
  "config":{ 
    "connector.class":"org.apache.doris.kafka.connector.DorisSinkConnector", 
    "topics":"proto_topic", 
    "tasks.max":"10",
    "doris.topic2table.map": "proto_topic:proto_tab", 
    "buffer.count.records":"100000", 
    "buffer.flush.time":"120", 
    "buffer.size.bytes":"10000000", 
    "doris.urls":"10.10.10.1", 
    "doris.user":"root", 
    "doris.password":"", 
    "doris.http.port":"8030", 
    "doris.query.port":"9030", 
    "doris.database":"test", 
    "load.model":"stream_load",
    "key.converter":"io.confluent.connect.protobuf.ProtobufConverter",
    "key.converter.schema.registry.url":"http://127.0.0.1:8081",
    "value.converter":"io.confluent.connect.protobuf.ProtobufConverter",
    "value.converter.schema.registry.url":"http://127.0.0.1:8081"
  } 
}'
```

## FAQ

**Q1：Routine Load 与 Doris Kafka Connector 应该如何选择？**

- 大多数场景下，使用 Routine Load 即可：无需引入额外组件，且支持 CSV 和 JSON。
- 如果需要消费 Avro / Protobuf 格式，或对接 Debezium 等 Kafka Connect 生态组件，应使用 Doris Kafka Connector。

**Q2：Routine Load 支持哪些 Kafka 版本？**

默认支持 Kafka 0.10.0.0 及以上版本。如需消费旧版本（0.9.0、0.8.x），需要修改 BE 配置 `kafka_broker_version_fallback`，或在创建作业时设置 `property.broker.version.fallback`。需要注意，使用旧版本会导致部分新特性不可用，例如基于时间设置 Kafka 分区 offset。

**Q3：多表导入的 Kafka 数据应该是什么格式？**

数据格式必须为 `table_name|data`，例如 CSV 多表导入格式为 `table_name|val1,val2,val3`，且 `table_name` 必须与 Doris 中的表名完全一致，否则导入失败。多表导入不支持 `column_mapping` 配置。

**Q4：使用 Kafka Connect 消费时为何要调大 `max.poll.interval.ms`？**

Stream Load 写入 Doris 可能耗时较长，若 `max.poll.interval.ms`（默认 5 分钟）过小，会导致消费者被踢出消费群组。建议调大到 **30 分钟以上**，并同步设置 `consumer.max.poll.interval.ms`。

**Q5：如何同步 Debezium 采集的 DELETE 操作到 Doris？**

需要在 Doris Kafka Connector 配置中设置 `converter.mode=debezium_ingestion` 与 `enable.delete=true`，并在 Doris 中使用 `UNIQUE KEY` 表模型存储 CDC 数据。

## 相关链接

- [CREATE ROUTINE LOAD 语法参考](../../../sql-manual/sql-statements/data-modification/load-and-export/CREATE-ROUTINE-LOAD)
- [Routine Load 操作手册](../import-way/routine-load-manual.md)
- [Doris Kafka Connector 文档](../../../connection-integration/data-integration/doris-kafka-connector.md)
- [Kafka 安全认证配置](../import-way/routine-load-manual.md#kafka-安全认证)
- [Kafka Connect Distributed Workers](https://docs.confluent.io/platform/current/connect/index.html#distributed-workers)
- [Debezium connector for MySQL](https://debezium.io/documentation/reference/stable/connectors/mysql.html)
