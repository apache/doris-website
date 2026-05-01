---
{
    "title": "Doris Kafka Connector",
    "language": "en",
    "description": "Use the Doris Kafka Connector to write Kafka topics into Apache Doris in real time. Learn about deployment modes, configuration options, type mapping, Debezium synchronization, and troubleshooting.",
    "keywords": [
        "Doris Kafka Connector",
        "Kafka Connect",
        "Kafka to Doris",
        "Apache Doris real-time ingestion",
        "Debezium to Doris"
    ]
}
---

<!-- Knowledge type: Operations guide / Configuration reference -->
<!-- Applicable scenarios: Real-time ingestion of Kafka data into Doris / Kafka Connect Sink Connector deployment and troubleshooting -->

[Kafka Connect](https://docs.confluent.io/platform/current/connect/index.html) is a scalable and reliable data integration tool for moving data between Apache Kafka and other systems. The Doris community provides the [doris-kafka-connector](https://github.com/apache/doris-kafka-connector) plugin, which writes data from Kafka topics into Doris.

## Applicable scenarios

To continuously write data from Kafka into Doris, choose the configuration that matches your data source and runtime environment:

| User scenario | Capability to use | Reference section |
| --- | --- | --- |
| Local validation or development testing | Start Kafka Connect in Standalone mode and create a Doris Sink Connector with a local configuration file | [Standalone mode deployment](#standalone-mode-deployment) |
| Production or cluster deployment | Start Kafka Connect in Distributed mode and manage Connectors through the REST API | [Distributed mode deployment](#distributed-mode-deployment) |
| Synchronizing plain JSON data | Use `JsonConverter` or `StringConverter` to consume the Kafka topic and write to a Doris table | [Synchronizing plain JSON data](#synchronizing-plain-json-data) |
| Synchronizing CDC data captured by Debezium | Set `converter.mode=debezium_ingestion` and enable delete synchronization as needed | [Synchronizing data captured by Debezium](#synchronizing-data-captured-by-debezium) |
| Synchronizing Avro or Protobuf serialized data | Use the Confluent Avro or Protobuf Converter and configure the Schema Registry address | [Synchronizing Avro serialized data](#synchronizing-avro-serialized-data), [Synchronizing Protobuf serialized data](#synchronizing-protobuf-serialized-data) |
| Transforming Kafka messages before writing | Use Kafka Connect SMT to add fields or convert time formats in messages | [Transforming data with Kafka Connect SMT](#transforming-data-with-kafka-connect-smt) |
| Accessing an SSL-authenticated Kafka cluster | Configure SSL parameters in the Kafka Connect Worker and the embedded consumer | [Accessing an SSL-authenticated Kafka cluster](#accessing-an-ssl-authenticated-kafka-cluster) |
| Recording records that fail conversion | Configure a Kafka Connect dead letter queue | [Configuring a dead letter queue](#configuring-a-dead-letter-queue) |

## Version notes

| Connector Version | Kafka Version | Doris Version | Java Version |
| --- | --- | --- | --- |
| 1.0.0 | 2.4+ | 2.0+ | 8 |
| 1.1.0 | 2.4+ | 2.0+ | 8 |
| 24.0.0 | 2.4+ | 2.0+ | 8 |
| 25.0.0 | 2.4+ | 2.0+ | 8 |
| 26.0.0 | 2.4+ | 2.0+ | 8 |

## Preparing the Doris Kafka Connector

You can use the Doris Kafka Connector by downloading the JAR package or by adding a Maven dependency.

### Downloading the JAR package

Get the doris-kafka-connector JAR package from the [Doris download page](https://doris.apache.org/download). When deploying Kafka Connect, place the JAR package in the `$KAFKA_HOME/plugins` directory.

### Using a Maven dependency

In a Maven project, add the following dependency:

```xml
<dependency>
    <groupId>org.apache.doris</groupId>
    <artifactId>doris-kafka-connector</artifactId>
    <version>25.0.0</version>
</dependency>
```

## Standalone mode deployment

Standalone mode is suitable for local validation or development testing. It is generally not recommended for production environments.

### 1. Prepare the plugin directory

Create a `plugins` directory under `$KAFKA_HOME` and place the downloaded doris-kafka-connector JAR package in it.

### 2. Configure the Kafka Connect Worker

Edit `$KAFKA_HOME/config/connect-standalone.properties`:

```properties
# Modify the broker address
bootstrap.servers=127.0.0.1:9092

# Set this to the plugins directory you created
# Note: use Kafka's direct path here. For example: plugin.path=/opt/kafka/plugins
plugin.path=$KAFKA_HOME/plugins

# It is recommended to increase Kafka's max.poll.interval.ms to more than 30 minutes (default is 5 minutes)
# This avoids consumers being kicked out of the consumer group due to Stream Load consumption timeouts
max.poll.interval.ms=1800000
consumer.max.poll.interval.ms=1800000
```

### 3. Configure the Doris Sink Connector

Create `doris-connector-sink.properties` in the `$KAFKA_HOME/config` directory:

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

### 4. Start Standalone mode

```shell
$KAFKA_HOME/bin/connect-standalone.sh -daemon $KAFKA_HOME/config/connect-standalone.properties $KAFKA_HOME/config/doris-connector-sink.properties
```

## Distributed mode deployment

Distributed mode is suitable for multi-node Kafka Connect clusters. In this mode, you start the Kafka Connect Worker first, and then create and manage Connectors through the REST API.

### 1. Prepare the plugin directory

Create a `plugins` directory under `$KAFKA_HOME` and place the downloaded doris-kafka-connector JAR package in it.

### 2. Configure the Kafka Connect Worker

Edit `$KAFKA_HOME/config/connect-distributed.properties`:

```properties
# Modify the broker address
bootstrap.servers=127.0.0.1:9092

# Modify group.id; it must be the same across the same cluster
group.id=connect-cluster

# Set this to the plugins directory you created
# Note: use Kafka's direct path here. For example: plugin.path=/opt/kafka/plugins
plugin.path=$KAFKA_HOME/plugins

# It is recommended to increase Kafka's max.poll.interval.ms to more than 30 minutes (default is 5 minutes)
# This avoids consumers being kicked out of the consumer group due to Stream Load consumption timeouts
max.poll.interval.ms=1800000
consumer.max.poll.interval.ms=1800000
```

### 3. Start Distributed mode

```shell
$KAFKA_HOME/bin/connect-distributed.sh -daemon $KAFKA_HOME/config/connect-distributed.properties
```

:::note
When Kafka Connect starts for the first time, it creates three topics in the Kafka cluster: `config.storage.topic`, `offset.storage.topic`, and `status.storage.topic`. They are used to record shared connector configurations, offset data, and status updates. For more information, see [How to Use Kafka Connect - Get Started](https://docs.confluent.io/platform/current/connect/userguide.html).
:::

### 4. Create a Connector

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

### 5. Manage the Connector

You can view, pause, resume, delete, or restart a Connector through the Kafka Connect REST API. For more API details, see [Connect REST Interface](https://docs.confluent.io/platform/current/connect/references/restapi.html#kconnect-rest-interface).

```shell
# View Connector status
curl -i http://127.0.0.1:8083/connectors/test-doris-sink-cluster/status -X GET

# Delete the current Connector
curl -i http://127.0.0.1:8083/connectors/test-doris-sink-cluster -X DELETE

# Pause the current Connector
curl -i http://127.0.0.1:8083/connectors/test-doris-sink-cluster/pause -X PUT

# Resume the current Connector
curl -i http://127.0.0.1:8083/connectors/test-doris-sink-cluster/resume -X PUT

# Restart a task within the Connector
curl -i http://127.0.0.1:8083/connectors/test-doris-sink-cluster/tasks/0/restart -X POST
```

## Production environment enhancements

### Accessing an SSL-authenticated Kafka cluster

When accessing an SSL-authenticated Kafka cluster through Kafka Connect, you need to provide the certificate file used to authenticate the Kafka broker public key, such as `client.truststore.jks`. Add the following configuration to `connect-distributed.properties`:

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

For more details on connecting to an SSL-authenticated Kafka cluster through Kafka Connect, see [Configure Kafka Connect](https://docs.confluent.io/platform/current/security/security_tutorial.html#configure-kafka-connect).

### Configuring a dead letter queue

By default, any error encountered during conversion causes the Connector to fail. You can use the following configuration to tolerate such errors and write the details of each error and failed operation, along with the problematic record, to a dead letter queue:

```properties
errors.tolerance=all
errors.deadletterqueue.topic.name=test_error_topic
errors.deadletterqueue.context.headers.enable=true
errors.deadletterqueue.topic.replication.factor=1
```

## Configuration options

The following configurations are used to create a Doris Sink Connector. For other Kafka Connect Sink common configuration options, see [connect_configuring](https://kafka.apache.org/documentation/#connect_configuring).

| Key | Enum | Default Value | Required | Description |
| --- | --- | --- | --- | --- |
| `name` | - | - | Y | The Connect application name. It must be unique within the Kafka Connect environment. |
| `connector.class` | - | - | Y | `org.apache.doris.kafka.connector.DorisSinkConnector`. |
| `topics` | - | - | Y | The list of subscribed topics. Separate multiple topics with commas, for example `topic1,topic2`. |
| `doris.urls` | - | - | Y | Doris FE connection address. Separate multiple addresses with commas, for example `10.20.30.1,10.20.30.2,10.20.30.3`. |
| `doris.http.port` | - | - | Y | Doris HTTP protocol port. |
| `doris.query.port` | - | - | Y | Doris MySQL protocol port. |
| `doris.user` | - | - | Y | Doris username. |
| `doris.password` | - | - | Y | Doris password. |
| `doris.database` | - | - | Y | The database to write to. It can be left empty when writing to multiple databases, in which case the database name must be specified in `topic2table.map`. |
| `doris.topic2table.map` | - | - | Y | The mapping between topics and tables, for example `topic1:tb1,topic2:tb2`. If left empty, the topic name is used as the target table name by default. The format for multiple databases is `topic1:db1.tbl1,topic2:db2.tbl2`. |
| `buffer.count.records` | - | 50000 | N | The number of records written per Stream Load. |
| `buffer.flush.time` | - | 120 | N | The buffer flush interval in seconds. The default value is 120 seconds. |
| `buffer.size.bytes` | - | 104857600(100MB) | N | The data size written per Stream Load. |
| `enable.combine.flush` | `true`,<br />`false` | false | N | Whether to combine data from all partitions into one write. The default value is `false`. When enabled, only `at_least_once` semantics can be guaranteed. |
| `jmx` | - | true | N | Whether to obtain Connector internal monitoring metrics through JMX. See [Doris-Connector-JMX](https://github.com/apache/doris-kafka-connector/blob/master/docs/en/Doris-Connector-JMX.md). |
| `label.prefix` | - | `${name}` | N | The label prefix for Stream Load when importing data. The default value is the Connector application name. |
| `auto.redirect` | - | true | N | Whether to redirect Stream Load requests. When enabled, Stream Load is redirected through the FE to the BE that needs to write the data, and BE information is no longer displayed. |
| `sink.properties.*` | - | `'sink.properties.format':'json'`,<br />`'sink.properties.read_json_by_line':'true'` | N | Stream Load import parameters. For example, define the column separator with `'sink.properties.column_separator':','`. For detailed parameters, see [Stream Load manual](../../data-operate/import/import-way/stream-load-manual.md).<br /><br />To enable Group Commit, for example to enable `sync_mode`: `"sink.properties.group_commit":"sync_mode"`. Group Commit supports three modes: `off_mode`, `sync_mode`, and `async_mode`. For detailed usage, see [Group Commit](https://doris.apache.org/docs/data-operate/import/group-commit-manual/).<br /><br />To enable partial column update, for example to update the partial column `col2`: `"sink.properties.partial_columns":"true"`, `"sink.properties.columns":"col2"`. |
| `delivery.guarantee` | `at_least_once`,<br />`exactly_once` | at_least_once | N | The data consistency guarantee when consuming Kafka data and importing it into Doris. Supports `at_least_once` and `exactly_once`. The default value is `at_least_once`. Doris must be upgraded to 2.1.0 or later to guarantee `exactly_once`. |
| `converter.mode` | `normal`,<br />`debezium_ingestion` | normal | N | The upstream data type conversion mode used when the Connector consumes Kafka data. `normal` means consuming Kafka data normally without special type conversion. `debezium_ingestion` means special type conversion is required when the upstream Kafka data is collected through CDC (Change Data Capture) tools such as Debezium. |
| `debezium.schema.evolution` | `none`,<br />`basic` | none | N | When collecting from upstream database systems (such as MySQL) through Debezium, if a schema change occurs, added fields can be synchronized to Doris. `none` means schema changes in the upstream database system are not synchronized to Doris. `basic` means data change operations in the upstream database are synchronized. Because column schema changes are dangerous operations and may accidentally drop columns from the Doris table schema, only adding columns from upstream is currently supported. When a column is renamed, the old column remains unchanged, and the Connector adds a new column in the target table and sinks the renamed new data into the new column. |
| `enable.delete` | - | false | N | Under Debezium synchronization, whether to synchronize delete records. The default value is `false`. Under non-Debezium synchronization, you need to add a delete marker in the message. |
| `database.time_zone` | - | UTC | N | When `converter.mode` is set to a non-`normal` mode, this option specifies the time zone conversion for date and time data types such as `datetime`, `date`, and `timestamp`. The default value is UTC. |
| `avro.topic2schema.filepath` | - | - | N | Parses the Avro file content in a topic by reading a local Avro schema file, decoupling from the Confluent Schema Registry. This configuration must be used together with the `key.converter` or `value.converter` prefix. For example, configure local Avro schema files for the `avro-user` and `avro-product` topics: `"value.converter.avro.topic2schema.filepath":"avro-user:file:///opt/avro_user.avsc, avro-product:file:///opt/avro_product.avsc"`. For detailed usage, see [#32](https://github.com/apache/doris-kafka-connector/pull/32). |
| `record.tablename.field` | - | - | N | When this option is enabled, data from one topic can flow into multiple Doris tables. For configuration details, see [#58](https://github.com/apache/doris-kafka-connector/pull/58). |
| `max.retries` | - | 10 | N | The maximum number of times an error is retried before the task fails. |
| `retry.interval.ms` | - | 6000 | N | The wait time before retrying after an error, in milliseconds. The default value is 6000 milliseconds. |
| `behavior.on.null.values` | `ignore`,<br />`fail` | ignore | N | How to handle records with `null` values. By default, they are skipped. |

## Type mapping

The Doris Kafka Connector uses Kafka Connect primitive types or logical types to parse the data type of a column. Primitive types are simple data types represented using Kafka Connect `Schema`. Logical types are usually represented with a `Struct` to represent complex types or date-time types.

### Kafka primitive types

| Kafka primitive type | Doris type |
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

### Kafka logical types

| Kafka logical type | Doris type |
| --- | --- |
| `org.apache.kafka.connect.data.Decimal` | DECIMAL |
| `org.apache.kafka.connect.data.Date` | DATE |
| `org.apache.kafka.connect.data.Time` | STRING |
| `org.apache.kafka.connect.data.Timestamp` | DATETIME |

### Debezium logical types

| Debezium logical type | Doris type |
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

## Configuring the Connector by data scenario

### Synchronizing plain JSON data

This scenario applies to writing plain JSON messages from a Kafka topic into a Doris table.

1. View sample data in Kafka:

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

2. Create the target table in Doris:

    ```sql
    CREATE TABLE test_db.test_kafka_connector_tbl (
        user_id BIGINT NOT NULL COMMENT "user id",
        name VARCHAR(20) COMMENT "name",
        age INT COMMENT "age"
    )
    DUPLICATE KEY(user_id)
    DISTRIBUTED BY HASH(user_id) BUCKETS 12;
    ```

3. On the machine where Kafka Connect is deployed, submit the import task with `curl`:

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

### Synchronizing data captured by Debezium

This scenario applies to writing MySQL CDC data captured by Debezium into Doris through Kafka.

1. The MySQL database has the following table and data:

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

2. Create the target table in Doris:

    ```sql
    CREATE TABLE test_db.test_user (
        user_id BIGINT NOT NULL COMMENT "user id",
        name VARCHAR(20) COMMENT "name",
        age INT COMMENT "age"
    )
    UNIQUE KEY(user_id)
    DISTRIBUTED BY HASH(user_id) BUCKETS 12;
    ```

3. Deploy the Debezium connector for MySQL component. For detailed steps, see [Debezium connector for MySQL](https://debezium.io/documentation/reference/stable/connectors/mysql.html).

4. Create the doris-kafka-connector import task. Assume that the MySQL table data captured by Debezium is in the `mysql_debezium.test.test_user` topic:

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

### Synchronizing Avro serialized data

This scenario applies to consuming a Kafka topic serialized with Avro and parsing the data through the Confluent Avro Converter.

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

### Synchronizing Protobuf serialized data

This scenario applies to consuming a Kafka topic serialized with Protobuf and parsing the data through the Confluent Protobuf Converter.

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

### Transforming data with Kafka Connect SMT

This scenario applies to adding fields or converting formats on individual Kafka messages before writing to Doris. The following example uses `InsertField` to add a static field, and uses `TimestampConverter` to convert a Bigint timestamp into a time string.

Original data example:

```json
{
    "registertime": 1513885135404,
    "userid": "User_9",
    "regionid": "Region_3",
    "gender": "MALE"
}
```

Create the Connector:

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

After SMT processing, the sample data becomes:

```json
{
    "userid": "User_9",
    "regionid": "Region_3",
    "gender": "MALE",
    "repo": "Apache Doris",
    "registertime": "2017-12-21 03:38:55.404"
}
```

Here, `repo` is the static field added by `InsertField`, and `registertime` is the time string converted by `TimestampConverter`. For more Kafka Connect Single Message Transforms (SMT) examples, see the [SMT documentation](https://docs.confluent.io/cloud/current/connectors/transforms/overview.html).

## FAQ

### Reading JSON data reports `JsonConverter with schemas.enable requires "schema" and "payload" fields`

**Error message:**

```shell
Caused by: org.apache.kafka.connect.errors.DataException: JsonConverter with schemas.enable requires "schema" and "payload" fields and may not contain additional fields. If you are trying to deserialize plain JSON data, set schemas.enable=false in your converter configuration.
    at org.apache.kafka.connect.json.JsonConverter.toConnectData(JsonConverter.java:337)
    at org.apache.kafka.connect.storage.Converter.toConnectData(Converter.java:91)
    at org.apache.kafka.connect.runtime.WorkerSinkTask.lambda$convertAndTransformRecord$4(WorkerSinkTask.java:536)
    at org.apache.kafka.connect.runtime.errors.RetryWithToleranceOperator.execAndRetry(RetryWithToleranceOperator.java:180)
    at org.apache.kafka.connect.runtime.errors.RetryWithToleranceOperator.execAndHandleError(RetryWithToleranceOperator.java:214)
```

**Cause:**

When using the `org.apache.kafka.connect.json.JsonConverter`, the data must match the `schema` and `payload` fields.

**Solution:**

Use either of the following approaches:

1. Replace `org.apache.kafka.connect.json.JsonConverter` with `org.apache.kafka.connect.storage.StringConverter`.
2. Set `value.converter.schemas.enable` or `key.converter.schemas.enable` to `false` in the corresponding configuration file.
    - Standalone mode: modify `config/connect-standalone.properties`.
    - Distributed mode: modify `config/connect-distributed.properties`.

### Consumption timeout, consumer is kicked out of the consumer group

**Error message:**

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

Increase Kafka's `max.poll.interval.ms` according to your scenario. The default value is `300000`.

- Standalone mode: add `max.poll.interval.ms` and `consumer.max.poll.interval.ms` to `config/connect-standalone.properties` and configure the values.
- Distributed mode: add `max.poll.interval.ms` and `consumer.max.poll.interval.ms` to `config/connect-distributed.properties` and configure the values.

After adjusting the parameters, restart Kafka Connect.

### Upgrading the Doris Kafka Connector from 1.0.0 or 1.1.0 to 24.0.0 reports `cleanup.policy=compact` errors

**Error message:**

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

**Solution:**

Change the cleanup policy of the `connect-configs` and `connect-status` topics to `compact`:

```shell
$KAFKA_HOME/bin/kafka-configs.sh --alter --entity-type topics --entity-name connect-configs --add-config cleanup.policy=compact --bootstrap-server 127.0.0.1:9092
$KAFKA_HOME/bin/kafka-configs.sh --alter --entity-type topics --entity-name connect-status --add-config cleanup.policy=compact --bootstrap-server 127.0.0.1:9092
```

### Schema change fails under `debezium_ingestion` conversion mode

**Error message:**

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

**Solution:**

Schema changes are disabled by default in `debezium_ingestion` conversion mode. Set `debezium.schema.evolution=basic` to enable schema changes.

Note that enabling schema change does not strictly guarantee that the changed column is the only column in the Doris table. For specific limitations, see the description of the `debezium.schema.evolution` parameter. To keep only one column on the upstream and downstream sides, it is best to manually add the changed column to the Doris table first, and then restart the Connector task. The Connector continues consuming from the last unconsumed `offset` to maintain data consistency.
