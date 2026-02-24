---
{
    "title": "Kafka",
    "language": "zh-CN",
    "description": "Doris 提供以下方式从 Kafka 导入数据："
}
---

Doris 提供以下方式从 Kafka 导入数据：

- **使用 Routine Load 消费 Kafka 数据**

Doris 通过 Routine Load 持续消费 Kafka Topic 中的数据。提交 Routine Load 作业后，Doris 会实时生成导入任务，消费 Kafka 集群中指定 Topic 的消息。Routine Load 支持 CSV 和 JSON 格式，具备 Exactly-Once 语义，确保数据不丢失且不重复。更多信息请参考 [Routine Load](../import-way/routine-load-manual.md)。

- **Doris Kafka Connector 消费 Kafka 数据**

Doris Kafka Connector 是将 Kafka 数据流导入 Doris 数据库的工具。用户可通过 Kafka Connect 插件轻松导入多种序列化格式（如 JSON、Avro、Protobuf），并支持解析 Debezium 组件的数据格式。更多信息请参考 [Doris Kafka Connector](../../../ecosystem/doris-kafka-connector.md)。

在大多数情况下，可以直接选择 Routine Load 进行数据导入，无需集成外部组件即可消费 Kafka 数据。当需要加载 Avro、Protobuf 格式的数据，或通过 Debezium 采集的上游数据库数据时，可以使用 Doris Kafka Connector。

## 使用 Routine Load 消费 Kafka 数据

### 使用限制

1. 支持的消息格式为 CSV 和 JSON。CSV 每个消息为一行，且行尾不包含换行符；
2. 默认支持 Kafka 0.10.0.0 及以上版本。若需使用旧版本（如 0.9.0，0.8.2，0.8.1，0.8.0），需修改 BE 配置，将 `kafka_broker_version_fallback` 设置为兼容的旧版本，或在创建 Routine Load 时设置 `property.broker.version.fallback`。使用旧版本可能导致部分新特性无法使用，如根据时间设置 Kafka 分区的 offset。

### 操作示例

在 Doris 中通过 CREATE ROUTINE LOAD 命令创建常驻 Routine Load 导入任务，分为单表导入和多表导入。详细语法请参考 [CREATE ROUTINE LOAD](../../../sql-manual/sql-statements/data-modification/load-and-export/CREATE-ROUTINE-LOAD)。

#### 单表导入

**第 1 步：准备数据**

在 Kafka 中，样本数据如下：

```SQL
kafka-console-consumer.sh --bootstrap-server localhost:9092 --topic test-routine-load-csv --from-beginning
1,Emily,25
```

**第 2 步：在库中创建表**

在 Doris 中创建被导入的表，具体语法如下：

```SQL
CREATE TABLE testdb.test_routineload_tbl(
    user_id            BIGINT       NOT NULL COMMENT "user id",
    name               VARCHAR(20)           COMMENT "name",
    age                INT                   COMMENT "age"
)
DUPLICATE KEY(user_id)
DISTRIBUTED BY HASH(user_id) BUCKETS 10;
```

**第 3 步：创建 Routine Load job 导入数据至单表**

在 Doris 中，使用 CREATE ROUTINE LOAD 命令创建导入作业：

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

**第 4 步：检查导入数据**

```SQL
select * from test_routineload_tbl;
+-----------+----------------+------+
| user_id   | name           | age  |
+-----------+----------------+------+
|  1        | Emily          | 25   |
+-----------+----------------+------+
```

#### 多表导入

对于需要同时导入多张表的场景，Kafka 中的数据必须包含表名信息，格式为：`table_name|data`。例如，导入 CSV 数据时，格式应为：`table_name|val1,val2,val3`。请注意，表名必须与 Doris 中的表名完全一致，否则导入将失败，并且不支持后面介绍的 column_mapping 配置。

**第 1 步：准备数据**

在 Kafka 中，样本数据如下：

```SQL
kafka-console-consumer.sh --bootstrap-server localhost:9092 --topic test-multi-table-load --from-beginning
test_multi_table_load1|1,Emily,25
test_multi_table_load2|2,Benjamin,35
```

**第 2 步：在库中创建表**

在 Doris 中创建被导入的表，具体语法如下：

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

**第 3 步：创建 Routine Load job 导入数据至多表**

在 Doris 中，使用 CREATE ROUTINE LOAD 命令创建导入作业：

```SQL
CREATE ROUTINE LOAD example_multi_table_load
COLUMNS TERMINATED BY ","
FROM KAFKA(
    "kafka_broker_list" = "192.168.88.62:9092",
    "kafka_topic" = "test-multi-table-load",
    "property.kafka_default_offsets" = "OFFSET_BEGINNING"
);
```

**第 4 步：检查导入数据**

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

#### 配置安全认证

有关带有认证的 Kafka 配置方法，请参见 [Kafka 安全认证](../import-way/routine-load-manual.md#kafka-安全认证)。

## 使用 Doris Kafka Connector 消费 Kafka 数据

Doris Kafka Connector 是将 Kafka 数据流导入 Doris 数据库的工具。用户可通过 Kafka Connect 插件轻松导入多种序列化格式（如 JSON、Avro、Protobuf），并支持解析 Debezium 组件的数据格式。

### 以 Distributed 模式启动

[Distributed](https://docs.confluent.io/platform/current/connect/index.html#distributed-workers) 模式为 Kafka Connect 提供可扩展性和自动容错功能。在此模式下，可以使用相同的 `group.id` 启动多个工作进程，它们会协调在所有可用工作进程中安排连接器和任务的执行。

1. 在 `$KAFKA_HOME` 下创建 plugins 目录，将下载好的 doris-kafka-connector jar 包放入其中。
2. 配置 `config/connect-distributed.properties`：

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

3. 启动：

```Bash
$KAFKA_HOME/bin/connect-distributed.sh -daemon $KAFKA_HOME/config/connect-distributed.properties
```

4. 消费 Kafka 数据：

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

**操作 Kafka Connect**

```Bash
# 查看 connector 状态
curl -i http://127.0.0.1:8083/connectors/test-doris-sink-cluster/status -X GET
# 删除当前 connector
curl -i http://127.0.0.1:8083/connectors/test-doris-sink-cluster -X DELETE
# 暂停当前 connector
curl -i http://127.0.0.1:8083/connectors/test-doris-sink-cluster/pause -X PUT
# 重启当前 connector
curl -i http://127.0.0.1:8083/connectors/test-doris-sink-cluster/resume -X PUT
# 重启 connector 内的 tasks
curl -i http://127.0.0.1:8083/connectors/test-doris-sink-cluster/tasks/0/restart -X POST
```

关于 Distributed 模式的介绍请参见 [Distributed Workers](https://docs.confluent.io/platform/current/connect/index.html#distributed-workers)。

### 消费普通数据

1. 导入数据样本：

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

2. 创建需要导入的表：

在 Doris 中创建被导入的表，具体语法如下：

```SQL
CREATE TABLE test_db.test_kafka_connector_tbl(
    user_id            BIGINT       NOT NULL COMMENT "user id",
    name               VARCHAR(20)           COMMENT "name",
    age                INT                   COMMENT "age"
)
DUPLICATE KEY(user_id)
DISTRIBUTED BY HASH(user_id) BUCKETS 12;
```

3. 创建导入任务：

在部署 Kafka Connect 的机器上，通过 curl 命令提交如下导入任务：

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

### 消费 Debezium 组件采集的数据

1. MySQL 数据库中有如下表：

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

2. 在 Doris 创建被导入的表：

```SQL
CREATE TABLE test_db.test_user(
    user_id            BIGINT       NOT NULL COMMENT "user id",
    name               VARCHAR(20)           COMMENT "name",
    age                INT                   COMMENT "age"
)
UNIQUE KEY(user_id)
DISTRIBUTED BY HASH(user_id) BUCKETS 12;
```

3. 部署 Debezium connector for MySQL 组件，参考：[Debezium connector for MySQL](https://debezium.io/documentation/reference/stable/connectors/mysql.html)。

4. 创建 doris-kafka-connector 导入任务：

假设通过 Debezium 采集到的 MySQL 表数据在 `mysql_debezium.test.test_user` Topic 中：

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

### 消费 AVRO 序列化格式数据

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
