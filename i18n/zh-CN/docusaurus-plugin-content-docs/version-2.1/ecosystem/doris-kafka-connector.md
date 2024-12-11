---
{
"title": "Doris Kafka Connector",
"language": "zh-CN"
}
---

<!--
Licensed to the Apache Software Foundation (ASF) under one
or more contributor license agreements.  See the NOTICE file
distributed with this work for additional information
regarding copyright ownership.  The ASF licenses this file
to you under the Apache License, Version 2.0 (the
"License"); you may not use this file except in compliance
with the License.  You may obtain a copy of the License at

  http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing,
software distributed under the License is distributed on an
"AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
KIND, either express or implied.  See the License for the
specific language governing permissions and limitations
under the License.
-->

[Kafka Connect](https://docs.confluent.io/platform/current/connect/index.html) 是一款可扩展、可靠的在 Apache Kafka 和其他系统之间进行数据传输的工具，可以定义 Connectors 将大量数据迁入迁出 Kafka。

Doris 社区提供了 [doris-kafka-connector](https://github.com/apache/doris-kafka-connector) 插件，可以将 Kafka topic 中的数据写入到 Doris 中。

## Doris Kafka Connector 使用

### 下载
[doris-kafka-connector](https://doris.apache.org/zh-CN/download)

maven 依赖
```xml
<dependency>
  <groupId>org.apache.doris</groupId>
  <artifactId>doris-kafka-connector</artifactId>
  <version>1.0.0</version>
</dependency>
```

### Standalone 模式启动
在 $KAFKA_HOME 下创建 plugins 目录，将下载好的 doris-kafka-connector jar 包放入其中

配置 config/connect-standalone.properties

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

配置 doris-connector-sink.properties

在 config 目录下创建 doris-connector-sink.properties，并配置如下内容：

```properties
name=test-doris-sink
connector.class=org.apache.doris.kafka.connector.DorisSinkConnector
topics=topic_test
doris.topic2table.map=topic_test:test_kafka_tbl
buffer.count.records=10000
buffer.flush.time=120
buffer.size.bytes=5000000
doris.urls=10.10.10.1
doris.http.port=8030
doris.query.port=9030
doris.user=root
doris.password=
doris.database=test_db
key.converter=org.apache.kafka.connect.storage.StringConverter
value.converter=org.apache.kafka.connect.json.JsonConverter
```

启动 Standalone

```shell
$KAFKA_HOME/bin/connect-standalone.sh -daemon $KAFKA_HOME/config/connect-standalone.properties $KAFKA_HOME/config/doris-connector-sink.properties
```
:::note
注意：一般不建议在生产环境中使用 standalone 模式
:::


### Distributed 模式启动
在 $KAFKA_HOME 下创建 plugins 目录，将下载好的 doris-kafka-connector jar 包放入其中

配置 config/connect-distributed.properties

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



启动 Distributed

```shell
$KAFKA_HOME/bin/connect-distributed.sh -daemon $KAFKA_HOME/config/connect-distributed.properties
```


增加 Connector

```shell
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
    "value.converter":"org.apache.kafka.connect.json.JsonConverter"
  }
}'
```

操作 Connector
```
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
参考：[Connect REST Interface](https://docs.confluent.io/platform/current/connect/references/restapi.html#kconnect-rest-interface)

:::note
注意 kafka-connect 首次启动时，会往 kafka 集群中创建 `config.storage.topic` `offset.storage.topic` `status.storage.topic` 三个 topic 用于记录 kafka-connect 的共享连接器配置、偏移数据和状态更新。[How to Use Kafka Connect - Get Started](https://docs.confluent.io/platform/current/connect/userguide.html)
:::

### 访问 SSL 认证的 Kafka 集群
通过 kafka-connect 访问 SSL 认证的 Kafka 集群需要用户提供用于认证 Kafka Broker 公钥的证书文件（client.truststore.jks）。您可以在 `connect-distributed.properties` 文件中增加以下配置：
```
# Connect worker
security.protocol=SSL
ssl.truststore.location=/var/ssl/private/client.truststore.jks
ssl.truststore.password=test1234

# Embedded consumer for sink connectors
consumer.security.protocol=SSL
consumer.ssl.truststore.location=/var/ssl/private/client.truststore.jks
consumer.ssl.truststore.password=test1234
```
关于通过 Kafka-Connect 连接 SSL 认证的 Kafka 集群配置说明可以参考：[Configure Kafka Connect](https://docs.confluent.io/5.1.2/tutorials/security_tutorial.html#configure-kconnect-long)


### 死信队列
默认情况下，转换过程中或转换过程中遇到的任何错误都会导致连接器失败。每个连接器配置还可以通过跳过它们来容忍此类错误，可选择将每个错误和失败操作的详细信息以及有问题的记录（具有不同级别的详细信息）写入死信队列以便记录。
```
errors.tolerance=all
errors.deadletterqueue.topic.name=test_error_topic
errors.deadletterqueue.context.headers.enable=true
errors.deadletterqueue.topic.replication.factor=1
```


## 配置项


| Key                         | Enum                                 | Default Value                                                                        | **Required** | **Description**                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
|-----------------------------|--------------------------------------|--------------------------------------------------------------------------------------|--------------|------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| name                        | -                                    | -                                                                                    | Y            | Connect 应用名称，必须是在 Kafka Connect 环境中唯一                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| connector.class             | -                                    | -                                                                                    | Y            | org.apache.doris.kafka.connector.DorisSinkConnector                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| topics                      | -                                    | -                                                                                    | Y            | 订阅的 topic 列表，逗号分隔：topic1,topic2                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| doris.urls                  | -                                    | -                                                                                    | Y            | Doris FE 连接地址。如果有多个，中间用逗号分割：10.20.30.1,10.20.30.2,10.20.30.3                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| doris.http.port             | -                                    | -                                                                                    | Y            | Doris HTTP 协议端口                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| doris.query.port            | -                                    | -                                                                                    | Y            | Doris MySQL 协议端口                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| doris.user                  | -                                    | -                                                                                    | Y            | Doris 用户名                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| doris.password              | -                                    | -                                                                                    | Y            | Doris 密码                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| doris.database              | -                                    | -                                                                                    | Y            | 要写入的数据库。多个库时可以为空，同时在 topic2table.map 需要配置具体的库名称                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| doris.topic2table.map       | -                                    | -                                                                                    | N            | topic 和 table 表的对应关系，例：topic1:tb1,topic2:tb2<br />默认为空，表示 topic 和 table 名称一一对应。 <br />  多个库的格式为 topic1:db1.tbl1,topic2:db2.tbl2                                                                                                                                                                                                                                                                                                                                                                                                                |
| buffer.count.records        | -                                    | 10000                                                                                | N            | 在 flush 到 doris 之前，每个 Kafka 分区在内存中缓冲的记录数。默认 10000 条记录                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| buffer.flush.time           | -                                    | 120                                                                                  | N            | buffer 刷新间隔，单位秒，默认 120 秒                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| buffer.size.bytes           | -                                    | 5000000(5MB)                                                                         | N            | 每个 Kafka 分区在内存中缓冲的记录的累积大小，单位字节，默认 5MB                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| jmx                         | -                                    | true                                                                                 | N            | 通过 JMX 获取 Connector 内部监控指标，请参考：[Doris-Connector-JMX](https://github.com/apache/doris-kafka-connector/blob/master/docs/zh-CN/Doris-Connector-JMX.md)                                                                                                                                                                                                                                                                                                                                                                                            |
| enable.2pc                  | -                                    | true                                                                                 | N            | 是否开启 Stream Load 的两阶段提交 (TwoPhaseCommit)，默认为 true。                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| enable.delete               | -                                    | false                                                                                | N            | 是否同步删除记录，默认 false                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| label.prefix                | -                                    | ${name}                                                                              | N            | Stream load 导入数据时的 label 前缀。默认为 Connector 应用名称。                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| auto.redirect               | -                                    | true                                                                                 | N            | 是否重定向 StreamLoad 请求。开启后 StreamLoad 将通过 FE 重定向到需要写入数据的 BE，并且不再显示获取 BE 信息                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| load.model                  | `stream_load`,<br/> `copy_into`      | stream_load                                                                          | N            | 导入数据的方式。支持 `stream_load` 直接数据导入到 Doris 中；同时支持 `copy_into` 的方式导入数据至对象存储中，然后将数据加载至 Doris 中                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| sink.properties.*           | -                                    | `'sink.properties.format':'json'`, <br/>`'sink.properties.read_json_by_line':'true'` | N            | Stream Load 的导入参数。<br />例如：定义列分隔符`'sink.properties.column_separator':','`  <br />详细参数参考[这里](../data-operate/import/stream-load-manual.md)。  <br/><br/> **开启 Group Commit**，例如开启 sync_mode 模式的 group commit：`"sink.properties.group_commit":"sync_mode"`。 Group Commit 可以配置 `off_mode`、`sync_mode`、`async_mode` 三种模式 ，具体使用参考：[Group-Commit](https://doris.apache.org/docs/data-operate/import/group-commit-manual/) <br/><br/>  **开启部分列更新**，例如开启更新指定 col2 的部分列：`"sink.properties.partial_columns":"true"`, `"sink.properties.columns": "col2",` |
| delivery.guarantee          | `at_least_once`,<br/> `exactly_once` | at_least_once                                                                        | N            | 消费 Kafka 数据导入至 doris 时，数据一致性的保障方式。支持 `at_least_once` `exactly_once`，默认为 `at_least_once` 。Doris 需要升级至 2.1.0 以上，才能保障数据的 `exactly_once`                                                                                                                                                                                                                                                                                                                                                                                                           |
| converter.mode              | `normal`,<br/> `debezium_ingestion`  | normal                                                                               | N            | 使用 Connector 消费 Kafka 数据时，上游数据的类型转换模式。 <br/> ```normal```表示正常消费 Kafka 中的数据，不经过任何类型转换。 <br/> ```debezium_ingestion```表示当 Kafka 上游的数据通过 Debezium 等 CDC （Changelog Data Capture，变更数据捕获）工具采集时，上游数据需要经过特殊的类型转换才能支持。                                                                                                                                                                                                                                                                                                                                 |
| debezium.schema.evolution   | `none`,<br/> `basic`                 | none                                                                                 | N            | 通过 Debezium 采集上游数据库系统（如 MySQL），发生结构变更时，可以将增加的字段同步到 Doris 中。<br/>`none`表示上游数据库系统发生结构变更时，不同步变更后的结构到 Doris 中。 <br/>  `basic`表示同步上游数据库的数据变更操作。由于列结构变更是一个危险操作（可能会导致误删 Doris 表结构的列），目前仅支持同步上游增加列的操作。当列被重命名后，则旧列保持原样，Connector 会在目标表中新增一列，将重命名后的新增数据 Sink 到新列中。                                                                                                                                                                                                                                                                                       |
| database.time_zone          | -                                    | UTC                                                                                  | N            | 当 `converter.mode` 为非 `normal` 模式时，对于日期数据类型（如 datetime, date, timestamp 等等）提供指定时区转换的方式，默认为 UTC 时区。                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| avro.topic2schema.filepath  | -                                    | -                                                                                    | N            | 通过读取本地提供的 Avro Schema 文件，来解析 Topic 中的 Avro 文件内容，实现与 Confluent 提供 Schema 注册中心解耦。<br/> 此配置需要与 `key.converter` 或 `value.converter` 前缀一起使用，例如配置 avro-user、avro-product Topic 的本地 Avro Schema 文件如下： `"value.converter.avro.topic2schema.filepath":"avro-user:file:///opt/avro_user.avsc, avro-product:file:///opt/avro_product.avsc"` <br/> 具体使用可以参考：[#32](https://github.com/apache/doris-kafka-connector/pull/32)                                                                                                                                 |

其他Kafka Connect Sink通用配置项可参考：[connect_configuring](https://kafka.apache.org/documentation/#connect_configuring)

## 类型映射
Doris-kafka-connector 使用逻辑或原始类型映射来解析列的数据类型。
<br />原始类型是指使用 Kafka connect 的 `Schema` 表示的简单数据类型。逻辑数据类型通常是采用 `Struct` 结构表示复杂类型，或者日期时间类型。

| Kafka 原始类型   | Doris 类型 |
|--------------|----------|
| INT8         | TINYINT  |
| INT16        | SMALLINT |
| INT32        | INT      |
| INT64        | BIGINT   |
| FLOAT32      | FLOAT    |
| FLOAT64      | DOUBLE   |
| BOOLEAN      | BOOLEAN  |
| STRING       | STRING   |
| BYTES        | STRING   |

| Kafka 逻辑类型                              | Doris 类型 |
|-----------------------------------------|----------|
| org.apache.kafka.connect.data.Decimal   | DECIMAL  |
| org.apache.kafka.connect.data.Date      | DATE     |
| org.apache.kafka.connect.data.Time      | STRING   |
| org.apache.kafka.connect.data.Timestamp | DATETIME |

| Debezium 逻辑类型                          | Doris 类型  |
|----------------------------------------|-----------|
| io.debezium.time.Date                  | DATE      |
| io.debezium.time.Time                  | String    |
| io.debezium.time.MicroTime             | DATETIME  |
| io.debezium.time.NanoTime              | DATETIME  |
| io.debezium.time.ZonedTime             | DATETIME  |
| io.debezium.time.Timestamp             | DATETIME  |
| io.debezium.time.MicroTimestamp        | DATETIME  |
| io.debezium.time.NanoTimestamp         | DATETIME  |
| io.debezium.time.ZonedTimestamp        | DATETIME  |
| io.debezium.data.VariableScaleDecimal  | DOUBLE    |


## 最佳实践
### 同步 JSON 序列化数据
```
curl -i http://127.0.0.1:8083/connectors -H "Content-Type: application/json" -X POST -d '{ 
  "name":"doris-json-test", 
  "config":{ 
    "connector.class":"org.apache.doris.kafka.connector.DorisSinkConnector", 
    "topics":"json_topic", 
    "tasks.max":"10",
    "doris.topic2table.map": "json_topic:json_tab", 
    "buffer.count.records":"100000", 
    "buffer.flush.time":"120", 
    "buffer.size.bytes":"10000000", 
    "doris.urls":"127.0.0.1", 
    "doris.user":"root", 
    "doris.password":"", 
    "doris.http.port":"8030", 
    "doris.query.port":"9030", 
    "doris.database":"test", 
    "load.model":"stream_load",
    "key.converter":"org.apache.kafka.connect.json.JsonConverter",
    "value.converter":"org.apache.kafka.connect.json.JsonConverter"
  } 
}'
```

### 同步 Avro 序列化数据
```
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
    "doris.urls":"127.0.0.1", 
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

### 同步 Protobuf 序列化数据
```
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
    "doris.urls":"127.0.0.1", 
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

## 常见问题
**1. 读取 JSON 类型的数据报如下错误：**
```
Caused by: org.apache.kafka.connect.errors.DataException: JsonConverter with schemas.enable requires "schema" and "payload" fields and may not contain additional fields. If you are trying to deserialize plain JSON data, set schemas.enable=false in your converter configuration.
	at org.apache.kafka.connect.json.JsonConverter.toConnectData(JsonConverter.java:337)
	at org.apache.kafka.connect.storage.Converter.toConnectData(Converter.java:91)
	at org.apache.kafka.connect.runtime.WorkerSinkTask.lambda$convertAndTransformRecord$4(WorkerSinkTask.java:536)
	at org.apache.kafka.connect.runtime.errors.RetryWithToleranceOperator.execAndRetry(RetryWithToleranceOperator.java:180)
	at org.apache.kafka.connect.runtime.errors.RetryWithToleranceOperator.execAndHandleError(RetryWithToleranceOperator.java:214)
```
**原因：**
    是因为使用 `org.apache.kafka.connect.json.JsonConverter` 转换器需要匹配 "schema" 和 "payload" 字段。

**两种解决方案，任选其一：**
  1. 将 `org.apache.kafka.connect.json.JsonConverter` 更换为 `org.apache.kafka.connect.storage.StringConverter`
  2. 启动模式为 **Standalone** 模式，则将 config/connect-standalone.properties 中 `value.converter.schemas.enable` 或 `key.converter.schemas.enable` 改成false；
    启动模式为 **Distributed** 模式，则将 config/connect-distributed.properties 中 `value.converter.schemas.enable` 或 `key.converter.schemas.enable` 改成false

**2. 消费超时，消费者被踢出消费群组：**

```
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

将 Kafka 中 `max.poll.interval.ms` 根据场景进行调大，默认值是 `300000`
- 如果是 Standalone 模式启动，则在 config/connect-standalone.properties 的配置文件中增加 `max.poll.interval.ms` 和 `consumer.max.poll.interval.ms` 参数，并配置参数值。
- 如果是 Distributed 模式启动，则在  config/connect-distributed.properties  的配置文件增加 `max.poll.interval.ms` 和 `consumer.max.poll.interval.ms` 参数，并配置参数值。

调整参数后，重启kafka-connect

