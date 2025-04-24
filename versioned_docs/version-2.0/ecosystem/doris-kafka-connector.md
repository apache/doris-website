---
{
"title": "Doris Kafka Connector",
"language": "en"
}
---

[Kafka Connect](https://docs.confluent.io/platform/current/connect/index.html) is a scalable and reliable tool for data transmission between Apache Kafka and other systems. Connectors can be defined Move large amounts of data in and out of Kafka.

The Doris community provides the [doris-kafka-connector](https://github.com/apache/doris-kafka-connector) plug-in, which can write data in the Kafka topic to Doris.

## Usage Doris Kafka Connector

### Download
[doris-kafka-connector](https://doris.apache.org/download)

maven dependencies
```xml
<dependency>
  <groupId>org.apache.doris</groupId>
  <artifactId>doris-kafka-connector</artifactId>
  <version>25.0.0</version>
</dependency>
```

### Standalone mode startup
Create the plugins directory under $KAFKA_HOME and put the downloaded doris-kafka-connector jar package into it
<br />
Configure config/connect-standalone.properties

```properties
# Modify broker address
bootstrap.servers=127.0.0.1:9092

# Modify to the created plugins directory
# Note: Please fill in the direct path to Kafka here. For example: plugin.path=/opt/kafka/plugins
plugin.path=$KAFKA_HOME/plugins

# It is recommended to increase the max.poll.interval.ms time of Kafka to more than 30 minutes, the default is 5 minutes
# Avoid Stream Load import data consumption timeout and consumers being kicked out of the consumer group
max.poll.interval.ms=1800000
consumer.max.poll.interval.ms=1800000
```

Configure doris-connector-sink.properties

Create doris-connector-sink.properties in the config directory and configure the following content:

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

Start Standalone

```shell
$KAFKA_HOME/bin/connect-standalone.sh -daemon $KAFKA_HOME/config/connect-standalone.properties $KAFKA_HOME/config/doris-connector-sink.properties
```
:::note
Note: It is generally not recommended to use standalone mode in a production environment.
:::

### Distributed mode startup
Create the plugins directory under $KAFKA_HOME and put the downloaded doris-kafka-connector jar package into it

Configure config/connect-distributed.properties

```properties
# Modify kafka server address
bootstrap.servers=127.0.0.1:9092

# Modify group.id, the same cluster needs to be consistent
group.id=connect-cluster

# Modify to the created plugins directory
# Note: Please fill in the direct path to Kafka here. For example: plugin.path=/opt/kafka/plugins
plugin.path=$KAFKA_HOME/plugins

# It is recommended to increase the max.poll.interval.ms time of Kafka to more than 30 minutes, the default is 5 minutes
# Avoid Stream Load import data consumption timeout and consumers being kicked out of the consumer group
max.poll.interval.ms=1800000
consumer.max.poll.interval.ms=1800000
```



Start Distributed

```shell
$KAFKA_HOME/bin/connect-distributed.sh -daemon $KAFKA_HOME/config/connect-distributed.properties
```


Add Connector

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

Operation Connector
```shell
# View connector status
curl -i http://127.0.0.1:8083/connectors/test-doris-sink-cluster/status -X GET
# Delete connector
curl -i http://127.0.0.1:8083/connectors/test-doris-sink-cluster -X DELETE
# Pause connector
curl -i http://127.0.0.1:8083/connectors/test-doris-sink-cluster/pause -X PUT
# Restart connector
curl -i http://127.0.0.1:8083/connectors/test-doris-sink-cluster/resume -X PUT
# Restart tasks within the connector
curl -i http://127.0.0.1:8083/connectors/test-doris-sink-cluster/tasks/0/restart -X POST
```
Refer to: [Connect REST Interface](https://docs.confluent.io/platform/current/connect/references/restapi.html#kconnect-rest-interface)

:::note
Note that when kafka-connect is started for the first time, three topics `config.storage.topic` `offset.storage.topic` and `status.storage.topic` will be created in the kafka cluster to record the shared connector configuration of kafka-connect. Offset data and status updates. [How to Use Kafka Connect - Get Started](https://docs.confluent.io/platform/current/connect/userguide.html)
:::

### Access an SSL-certified Kafka cluster
Accessing an SSL-certified Kafka cluster through kafka-connect requires the user to provide a certificate file (client.truststore.jks) used to authenticate the Kafka Broker public key. You can add the following configuration in the `connect-distributed.properties` file:
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
For instructions on configuring a Kafka cluster connected to SSL authentication through kafka-connect, please refer to: [Configure Kafka Connect](https://docs.confluent.io/5.1.2/tutorials/security_tutorial.html#configure-kconnect-long)


### Dead letter queue
By default, any errors encountered during or during the conversion will cause the connector to fail. Each connector configuration can also tolerate such errors by skipping them, optionally writing the details of each error and failed operation as well as the records in question (with varying levels of detail) to a dead-letter queue for logging.
```properties
errors.tolerance=all
errors.deadletterqueue.topic.name=test_error_topic
errors.deadletterqueue.context.headers.enable=true
errors.deadletterqueue.topic.replication.factor=1
```


## Configuration items


| Key                         | Enum                                 | Default Value                                                                        | **Required** | **Description**                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
|-----------------------------|--------------------------------------|--------------------------------------------------------------------------------------|--------------|-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| name                        | -                                    | -                                                                                    | Y            | Connect application name, must be unique within the Kafka Connect environment                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| connector.class             | -                                    | -                                                                                    | Y            | org.apache.doris.kafka.connector.DorisSinkConnector                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| topics                      | -                                    | -                                                                                    | Y            | List of subscribed topics, separated by commas. like: topic1, topic2                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| doris.urls                  | -                                    | -                                                                                    | Y            | Doris FE connection address. If there are multiple, separate them with commas. like: 10.20.30.1,10.20.30.2,10.20.30.3                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| doris.http.port             | -                                    | -                                                                                    | Y            | Doris HTTP protocol port                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| doris.query.port            | -                                    | -                                                                                    | Y            | Doris MySQL protocol port                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| doris.user                  | -                                    | -                                                                                    | Y            | Doris username                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| doris.password              | -                                    | -                                                                                    | Y            | Doris password                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| doris.database              | -                                    | -                                                                                    | Y            | The database to write to. It can be empty when there are multiple libraries. At the same time, the specific library name needs to be configured in topic2table.map.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| doris.topic2table.map       | -                                    | -                                                                                    | N            | The corresponding relationship between topic and table table, for example: topic1:tb1,topic2:tb2<br />The default is empty, indicating that topic and table names correspond one to one. <br />The format of multiple libraries is topic1:db1.tbl1,topic2:db2.tbl2                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| buffer.count.records        | -                                    | 50000                                                                                | N            | The number of records each Kafka partition buffers in memory before flushing to doris. Default 50000 records                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| buffer.flush.time           | -                                    | 120                                                                                  | N            | Buffer refresh interval, in seconds, default 120 seconds                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| buffer.size.bytes           | -                                    | 10485760(100MB)                                                                      | N            | The cumulative size of records buffered in memory for each Kafka partition, in bytes, default 100MB                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| jmx                         | -                                    | true                                                                                 | N            | To obtain connector internal monitoring indicators through JMX, please refer to: [Doris-Connector-JMX](https://github.com/apache/doris-kafka-connector/blob/master/docs/en/Doris-Connector-JMX.md)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| enable.2pc                  | -                                    | true                                                                                 | N            | Whether to enable two-phase commit (TwoPhaseCommit) of Stream Load, the default is true.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| enable.delete               | -                                    | false                                                                                | N            | Whether to delete records synchronously, default false                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| label.prefix                | -                                    | ${name}                                                                              | N            | Stream load label prefix when importing data. Defaults to the Connector application name.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| auto.redirect               | -                                    | true                                                                                 | N            | Whether to redirect StreamLoad requests. After being turned on, StreamLoad will redirect to the BE where data needs to be written through FE, and the BE information will no longer be displayed.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| load.model                  | `stream_load`,<br/> `copy_into`      | stream_load                                                                          | N            | How to import data. Supports `stream_load` to directly import data into Doris; also supports `copy_into` to import data into object storage, and then load the data into Doris.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| sink.properties.*           | -                                    | `'sink.properties.format':'json'`, <br/>`'sink.properties.read_json_by_line':'true'` | N            | Import parameters for Stream Load. <br />For example: define column separator `'sink.properties.column_separator':','` <br />Detailed parameter reference [here](https://doris.apache.org/docs/data-operate/import/stream-load-manual)  <br/><br/> **Enable Group Commit**, for example, enable group commit in sync_mode mode: `"sink.properties.group_commit":"sync_mode"`. Group Commit can be configured with three modes: `off_mode`, `sync_mode`, and `async_mode`. For specific usage, please refer to: [Group-Commit](https://doris.apache.org/docs/data-operate/import/group-commit-manual/)<br/><br/>  **Enable partial column update**, for example, enable update of partial columns of specified col2: `"sink.properties.partial_columns":"true"`, `"sink.properties.columns": " col2",` |
| delivery.guarantee          | `at_least_once`,<br/> `exactly_once` | at_least_once                                                                        | N            | How to ensure data consistency when consuming Kafka data is imported into Doris. Supports `at_least_once` `exactly_once`, default is `at_least_once`. Doris needs to be upgraded to 2.1.0 or above to ensure data `exactly_once`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| converter.mode              | `normal`,<br/> `debezium_ingestion`  | normal                                                                               | N            | Type conversion mode of upstream data when using Connector to consume Kafka data. <br/> ```normal``` means consuming data in Kafka normally without any type conversion. <br/> ```debezium_ingestion``` means that when Kafka upstream data is collected through CDC (Changelog Data Capture) tools such as Debezium, the upstream data needs to undergo special type conversion to support it.                                                                                                                                                                                                                                                                                                                                                                                                       |
| debezium.schema.evolution   | `none`,<br/> `basic`                 | none                                                                                 | N            | Use Debezium to collect upstream database systems (such as MySQL), and when structural changes occur, the added fields can be synchronized to Doris. <br/>`none` means that when the structure of the upstream database system changes, the changed structure will not be synchronized to Doris. <br/> `basic` means synchronizing the data change operation of the upstream database. Since changing the column structure is a dangerous operation (it may lead to accidentally deleting columns of the Doris table structure), currently only the operation of adding columns synchronously upstream is supported. When a column is renamed, the old column remains unchanged, and the Connector will add a new column in the target table and sink the renamed new data into the new column.       |
| database.time_zone          | -                                    | UTC                                                                                  | N            | When `converter.mode` is not `normal` mode, it provides a way to specify time zone conversion for date data types (such as datetime, date, timestamp, etc.). The default is UTC time zone.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| avro.topic2schema.filepath  | -                                    | -                                                                                    | N            | By reading the locally provided Avro Schema file, the Avro file content in the Topic is parsed to achieve decoupling from the Schema registration center provided by Confluent. <br/> This configuration needs to be used with the `key.converter` or `value.converter` prefix. For example, the local Avro Schema file for configuring avro-user and avro-product Topic is as follows: `"value.converter.avro.topic2schema. filepath":"avro-user:file:///opt/avro_user.avsc, avro-product:file:///opt/avro_product.avsc"` <br/> For specific usage, please refer to: [#32](https://github.com/apache/doris-kafka-connector/pull/32)                                                                                                                                                                  |
| record.tablename.field      | -                                    | -                                                                                    | N            | Configure this parameter, data from one kafka topic can flow to multiple doris tables. For configuration details, refer to: [#58](https://github.com/apache/doris-kafka-connector/pull/58)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |                                                                                                                                                                                         |
| enable.combine.flush        | `true`,<br/> `false`                 | false                                                                                | N            | Whether to merge all partition data before writing. The default value is false. Enabling this option (setting to true) is only supported for tables with unique keys. If the topic contains a large number of partitions, enabling this feature can reduce resource consumption.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| max.retries                 | -                                    | 10                                                                                   | N            | The maximum number of times to retry on errors before failing the task.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| retry.interval.ms           | -                                    | 6000                                                                                 | N            | The time in milliseconds to wait following an error before attempting a retry.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| behavior.on.null.values     | `ignore`,<br/> `fail`                | ignore                                                                               | N            | Defined how to handle records with null values.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |

For other Kafka Connect Sink common configuration items, please refer to: [connect_configuring](https://kafka.apache.org/documentation/#connect_configuring)

## Type mapping
Doris-kafka-connector uses logical or primitive type mapping to resolve the column's data type.
<br />Primitive types refer to simple data types represented using Kafka connect's `Schema`. Logical data types usually use the `Struct` structure to represent complex types, or date and time types.


| Kafka Primitive Type     | Doris Type |
|--------------------------|----------|
| INT8                     | TINYINT  |
| INT16                    | SMALLINT |
| INT32                    | INT      |
| INT64                    | BIGINT   |
| FLOAT32                  | FLOAT    |
| FLOAT64                  | DOUBLE   |
| BOOLEAN                  | BOOLEAN  |
| STRING                   | STRING   |
| BYTES                    | STRING   |

| Kafka Logical Type                        | Doris Type |
|-------------------------------------------|----------|
| org.apache.kafka.connect.data.Decimal     | DECIMAL  |
| org.apache.kafka.connect.data.Date        | DATE     |
| org.apache.kafka.connect.data.Time        | STRING   |
| org.apache.kafka.connect.data.Timestamp   | DATETIME |

| Debezium Logical Type                   | Doris Type  |
|-----------------------------------------|-----------|
| io.debezium.time.Date                   | DATE      |
| io.debezium.time.Time                   | String    |
| io.debezium.time.MicroTime              | DATETIME  |
| io.debezium.time.NanoTime               | DATETIME  |
| io.debezium.time.ZonedTime              | DATETIME  |
| io.debezium.time.Timestamp              | DATETIME  |
| io.debezium.time.MicroTimestamp         | DATETIME  |
| io.debezium.time.NanoTimestamp          | DATETIME  |
| io.debezium.time.ZonedTimestamp         | DATETIME  |
| io.debezium.data.VariableScaleDecimal   | DOUBLE    |


## Best Practices
### Load plain JSON data

1. Import data sample<br />
   In Kafka, there is the following sample data
   ```shell
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

2. Create the table that needs to be imported<br />
   In Doris, create the imported table, the specific syntax is as follows
    ```sql
   CREATE TABLE test_db.test_kafka_connector_tbl(
   user_id            BIGINT       NOT NULL COMMENT "user id",
   name               VARCHAR(20)           COMMENT "name",
   age                INT                   COMMENT "age"
   )
   DUPLICATE KEY(user_id)
   DISTRIBUTED BY HASH(user_id) BUCKETS 12;
   ```

3. Create an import task<br />
   On the machine where Kafka-connect is deployed, submit the following import task through the curl command
    ```shell
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

### Load data collected by Debezium components
1. The MySQL database has the following table
```sql
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

2. Create the imported table in Doris
```sql
   CREATE TABLE test_db.test_user(
   user_id            BIGINT       NOT NULL COMMENT "user id",
   name               VARCHAR(20)           COMMENT "name",
   age                INT                   COMMENT "age"
   )
   UNIQUE KEY(user_id)
   DISTRIBUTED BY HASH(user_id) BUCKETS 12;
```
3. Deploy the Debezium connector for MySQL component, refer to: [Debezium connector for MySQL](https://debezium.io/documentation/reference/stable/connectors/mysql.html)
4. Create doris-kafka-connector import task<br />
   Assume that the MySQL table data collected through Debezium is in the `mysql_debezium.test.test_user` Topic
```shell
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

### Load Avro serialized data
```shell
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

### Load Protobuf serialized data
```shell
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

### Loading Data with Kafka Connect Single Message Transforms

For example, consider data in the following format:
```shell
{
  "registertime": 1513885135404,
  "userid": "User_9",
  "regionid": "Region_3",
  "gender": "MALE"
}
```
If we want to add a hard-coded column that doesn't exist in the Kafka topic data, we can use InsertField to accomplish this. Additionally, if we need to convert a bigint timestamp to a formatted time string, we can use TimestampConverter.

```shell
curl -i http://127.0.0.1:8083/connectors -H "Content-Type: application/json" -X POST -d '{
  "name": "insert_field_tranform",
  "config": {
    "connector.class": "org.apache.doris.kafka.connector.DorisSinkConnector",
    "tasks.max": "1",  
    "topics": "users",  
    "doris.topic2table.map": "users:kf_users",  
    "buffer.count.records": "10",    
    "buffer.flush.time": "11",       
    "buffer.size.bytes": "5000000",  
    "doris.urls": "127.0.0.1:8030", 
    "doris.user": "root",                
    "doris.password": "123456",           
    "doris.http.port": "8030",           
    "doris.query.port": "9030",          
    "doris.database": "testdb",          
    "key.converter": "org.apache.kafka.connect.storage.StringConverter",
    "value.converter": "org.apache.kafka.connect.json.JsonConverter",
    "value.converter.schemas.enable": "false",  
    "transforms": "InsertField,TimestampConverter",  
    // Insert Static Field
    "transforms.InsertField.type": "org.apache.kafka.connect.transforms.InsertField$Value",
    "transforms.InsertField.static.field": "repo",    
    "transforms.InsertField.static.value": "Apache Doris",  
    // Convert Timestamp Format
    "transforms.TimestampConverter.type": "org.apache.kafka.connect.transforms.TimestampConverter$Value",
    "transforms.TimestampConverter.field": "registertime",  
    "transforms.TimestampConverter.format": "yyyy-MM-dd HH:mm:ss.SSS",
    "transforms.TimestampConverter.target.type": "string"
  }
}'
```

After InsertField and TimestampConverter transformations, the data becomes:
```shell
{
  "userid": "User_9",
  "regionid": "Region_3",
  "gender": "MALE",
  "repo": "Apache Doris",// Static field added   
   "registertime": "2017-12-21 03:38:55.404"  // Unix timestamp converted to string
}
```

For more examples of Kafka Connect Single Message Transforms (SMT), please refer to the [SMT documentation](https://docs.confluent.io/cloud/current/connectors/transforms/overview.html).


## FAQ
**1. The following error occurs when reading Json type data:**
```shell
Caused by: org.apache.kafka.connect.errors.DataException: JsonConverter with schemas.enable requires "schema" and "payload" fields and may not contain additional fields. If you are trying to deserialize plain JSON data, set schemas.enable=false in your converter configuration.
	at org.apache.kafka.connect.json.JsonConverter.toConnectData(JsonConverter.java:337)
	at org.apache.kafka.connect.storage.Converter.toConnectData(Converter.java:91)
	at org.apache.kafka.connect.runtime.WorkerSinkTask.lambda$convertAndTransformRecord$4(WorkerSinkTask.java:536)
	at org.apache.kafka.connect.runtime.errors.RetryWithToleranceOperator.execAndRetry(RetryWithToleranceOperator.java:180)
	at org.apache.kafka.connect.runtime.errors.RetryWithToleranceOperator.execAndHandleError(RetryWithToleranceOperator.java:214)
```
**reason:**
This is because using the `org.apache.kafka.connect.json.JsonConverter` converter requires matching the "schema" and "payload" fields.

**Two solutions, choose one:**
  1. Replace `org.apache.kafka.connect.json.JsonConverter` with `org.apache.kafka.connect.storage.StringConverter`
  2. If the startup mode is **Standalone** mode, change `value.converter.schemas.enable` or `key.converter.schemas.enable` in config/connect-standalone.properties to false;
   If the startup mode is **Distributed** mode, change `value.converter.schemas.enable` or `key.converter.schemas.enable` in config/connect-distributed.properties to false

**2. The consumption times out and the consumer is kicked out of the consumption group:**

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

**Solution:**

Increase `max.poll.interval.ms` in Kafka according to the scenario. The default value is `300000`
- If it is started in Standalone mode, add the `max.poll.interval.ms` and `consumer.max.poll.interval.ms` parameters in the configuration file of config/connect-standalone.properties, and configure the parameter values.
- If it is started in Distributed mode, add the `max.poll.interval.ms` and `consumer.max.poll.interval.ms` parameters in the configuration file of config/connect-distributed.properties, and configure the parameter values.

After adjusting the parameters, restart kafka-connect

**3. Doris-kafka-connector reports an error when upgrading version from 1.0.0 or 1.1.0 to 24.0.0**
```
org.apache.kafka.common.config.ConfigException: Topic 'connect-status' supplied via the 'status.storage.topic' property is required to have 'cleanup.policy=compact' to guarantee consistency and durability of connector and task statuses, but found the topic currently has 'cleanup.policy=delete'. Continuing would likely result in eventually losing connector and task statuses and problems restarting this Connect cluster in the future. Change the 'status.storage.topic' property in the Connect worker configurations to use a topic with 'cleanup.policy=compact'.
	at org.apache.kafka.connect.util.TopicAdmin.verifyTopicCleanupPolicyOnlyCompact(TopicAdmin.java:581)
	at org.apache.kafka.connect.storage.KafkaTopicBasedBackingStore.lambda$topicInitializer$0(KafkaTopicBasedBackingStore.java:47)
	at org.apache.kafka.connect.util.KafkaBasedLog.start(KafkaBasedLog.java:247)
	at org.apache.kafka.connect.util.KafkaBasedLog.start(KafkaBasedLog.java:231)
	at org.apache.kafka.connect.storage.KafkaStatusBackingStore.start(KafkaStatusBackingStore.java:228)
	at org.apache.kafka.connect.runtime.AbstractHerder.startServices(AbstractHerder.java:164)
	at org.apache.kafka.connect.runtime.distributed.DistributedHerder.run
```
**Solution:**
Adjust the clearing strategy of `connect-configs` `connect-status` Topic to compact
```
$KAFKA_HOME/bin/kafka-configs.sh --alter --entity-type topics --entity-name connect-configs --add-config cleanup.policy=compact --bootstrap-server 127.0.0.1:9092
$KAFKA_HOME/bin/kafka-configs.sh --alter --entity-type topics --entity-name connect-status --add-config cleanup.policy=compact --bootstrap-server 127.0.0.1:9092
```

**4. Table schema change failed in `debezium_ingestion` converter mode**
```
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

**Solution:**

In `debezium_ingestion` converter mode, table schema changes are turned off by default. You need to configure `debezium.schema.evolution` to `basic` to enable table schema changes. <br />
It should be noted that enabling table structure changes does not accurately keep this changed column as the only column in the Doris table (see `debezium.schema.evolution` parameter description for details). If you need to keep only unique columns in the upstream and downstream, it is best to manually add the changed columns to the Doris table, and then restart the Connector task. The Connector will continue to consume the unconsumed `offset` to maintain data consistency.
