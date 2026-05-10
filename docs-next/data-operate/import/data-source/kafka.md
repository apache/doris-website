---
{
    "title": "Importing Data from Kafka",
    "language": "en",
    "description": "Describes how to import data from Kafka into Apache Doris, covering selection, configuration, and examples for Routine Load and Doris Kafka Connector.",
    "keywords": [
        "Kafka import",
        "Routine Load",
        "Doris Kafka Connector",
        "Kafka Connect",
        "Debezium",
        "Avro",
        "Protobuf",
        "CDC sync"
    ]
}
---

<!-- Knowledge type: Operational steps / Architecture selection decision -->
<!-- Applicable scenarios: Real-time data ingestion / Importing Kafka data into Doris -->

Apache Doris supports consuming data from Kafka in real time, which is commonly used for real-time data ingestion scenarios such as logs, orders, IoT events, and CDC sync. This document describes selection recommendations, usage limitations, and complete operational examples for the two mainstream approaches.

## Approach Selection

Doris provides the following two ways to import data from Kafka:

| Approach | Applicable Scenario | Supported Formats | Features |
| --- | --- | --- | --- |
| [Routine Load](../import-way/routine-load-manual.md) | Most common scenarios, with no need to introduce external components | CSV, JSON | Continuously consumes a Kafka Topic, generates import tasks in real time, provides exactly-once semantics, and ensures no data loss or duplication |
| [Doris Kafka Connector](../../../connection-integration/data-integration/doris-kafka-connector.md) | Importing data in serialization formats such as Avro or Protobuf, or consuming upstream database CDC data collected by Debezium | JSON, Avro, Protobuf, Debezium | Built on the Kafka Connect plugin mechanism, with horizontal scalability and fault tolerance |

Selection recommendations:

- By default, prefer **Routine Load**, where Doris consumes Kafka directly. This is the simplest deployment.
- When you need to consume formats such as **Avro / Protobuf**, or integrate with Kafka Connect ecosystem components such as **Debezium**, choose the **Doris Kafka Connector**.

## Approach 1: Use Routine Load to Consume Kafka Data

Routine Load submits a long-running job in Doris that continuously consumes messages from a specified Kafka Topic and writes them into a Doris table in real time.

### Usage Limitations

1. Only **CSV** and **JSON** message formats are supported. For CSV, each message is one row and the row does not include a trailing newline.
2. **Kafka 0.10.0.0 and above** is supported by default. To use older versions (such as 0.9.0, 0.8.2, 0.8.1, 0.8.0), you need to modify the BE configuration `kafka_broker_version_fallback` to a compatible older version, or set `property.broker.version.fallback` when creating the Routine Load. Using older versions may make some new features unavailable, for example setting Kafka partition offsets by time.

### Operational Example

Use the `CREATE ROUTINE LOAD` command to create a long-running Routine Load import task. There are two scenarios: single-table import and multi-table import. For detailed syntax, refer to [CREATE ROUTINE LOAD](../../../sql-manual/sql-statements/data-modification/load-and-export/CREATE-ROUTINE-LOAD).

#### Scenario 1: Single-Table Import

Import data from one Kafka Topic into one table in Doris.

**Step 1: Prepare Kafka data**

Sample data in Kafka is as follows:

```SQL
kafka-console-consumer.sh --bootstrap-server localhost:9092 --topic test-routine-load-csv --from-beginning
1,Emily,25
```

**Step 2: Create the target table in Doris**

```SQL
CREATE TABLE testdb.test_routineload_tbl(
    user_id            BIGINT       NOT NULL COMMENT "user id",
    name               VARCHAR(20)           COMMENT "name",
    age                INT                   COMMENT "age"
)
DUPLICATE KEY(user_id)
DISTRIBUTED BY HASH(user_id) BUCKETS 10;
```

**Step 3: Create the Routine Load job**

Use the `CREATE ROUTINE LOAD` command to create the import job:

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

**Step 4: Check the import result**

```SQL
select * from test_routineload_tbl;
+-----------+----------------+------+
| user_id   | name           | age  |
+-----------+----------------+------+
|  1        | Emily          | 25   |
+-----------+----------------+------+
```

#### Scenario 2: Multi-Table Import

Use this scenario when you need to import data from the same Kafka Topic into multiple Doris tables at once.

Requirements and limitations:

- The data in Kafka must include the table name, in the format `table_name|data`. For example, the CSV format is `table_name|val1,val2,val3`.
- **The table name must exactly match the table name in Doris**, otherwise the import will fail.
- Multi-table import **does not support** the `column_mapping` configuration described later.

**Step 1: Prepare Kafka data**

Sample data in Kafka is as follows (the prefix is the target table name):

```SQL
kafka-console-consumer.sh --bootstrap-server localhost:9092 --topic test-multi-table-load --from-beginning
test_multi_table_load1|1,Emily,25
test_multi_table_load2|2,Benjamin,35
```

**Step 2: Create the target tables in Doris**

Table 1:

```SQL
CREATE TABLE test_multi_table_load1(
    user_id            BIGINT       NOT NULL COMMENT "user id",
    name               VARCHAR(20)           COMMENT "user name",
    age                INT                   COMMENT "user age"
)
DUPLICATE KEY(user_id)
DISTRIBUTED BY HASH(user_id) BUCKETS 10;
```

Table 2:

```SQL
CREATE TABLE test_multi_table_load2(
    user_id            BIGINT       NOT NULL COMMENT "user id",
    name               VARCHAR(20)           COMMENT "user name",
    age                INT                   COMMENT "user age"
)
DUPLICATE KEY(user_id)
DISTRIBUTED BY HASH(user_id) BUCKETS 10;
```

**Step 3: Create the multi-table Routine Load job**

```SQL
CREATE ROUTINE LOAD example_multi_table_load
COLUMNS TERMINATED BY ","
FROM KAFKA(
    "kafka_broker_list" = "192.168.88.62:9092",
    "kafka_topic" = "test-multi-table-load",
    "property.kafka_default_offsets" = "OFFSET_BEGINNING"
);
```

**Step 4: Check the import result**

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

### Configuring Security Authentication

If the Kafka cluster has SSL, SASL, or other security authentication enabled, refer to [Kafka Security Authentication](../import-way/routine-load-manual.md#kafka-安全认证) to configure the corresponding authentication parameters.

## Approach 2: Use Doris Kafka Connector to Consume Kafka Data

Doris Kafka Connector is a tool built on the Kafka Connect framework that writes Kafka data streams into Doris. Through its plugin mechanism, it can easily import data in multiple serialization formats (such as JSON, Avro, and Protobuf), and supports parsing CDC data collected by Debezium.

### Starting in Distributed Mode

[Distributed](https://docs.confluent.io/platform/current/connect/index.html#distributed-workers) mode provides scalability and automatic fault tolerance for Kafka Connect. In this mode, you can start multiple worker processes with the same `group.id`, and they coordinate scheduling of connectors and tasks.

**Step 1: Place the plugin JAR**

Create a `plugins` directory under `$KAFKA_HOME` and put the downloaded `doris-kafka-connector` JAR into it.

**Step 2: Configure `config/connect-distributed.properties`**

```Bash
# Modify the broker address
bootstrap.servers=127.0.0.1:9092

# Modify the group.id; it must be the same within the same cluster
group.id=connect-cluster

# Change to the plugins directory you created
# Note: enter the direct path under Kafka here. For example: plugin.path=/opt/kafka/plugins
plugin.path=$KAFKA_HOME/plugins

# It is recommended to increase Kafka's max.poll.interval.ms to more than 30 minutes (default is 5 minutes)
# This avoids consumers being kicked out of the consumer group due to Stream Load import timeouts
max.poll.interval.ms=1800000
consumer.max.poll.interval.ms=1800000
```

**Step 3: Start Kafka Connect**

```Bash
$KAFKA_HOME/bin/connect-distributed.sh -daemon $KAFKA_HOME/config/connect-distributed.properties
```

**Step 4: Submit the import task (consume Kafka data)**

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

**Common Kafka Connect operations commands**

| Operation | Command |
| --- | --- |
| Check connector status | `curl -i http://127.0.0.1:8083/connectors/test-doris-sink-cluster/status -X GET` |
| Delete the current connector | `curl -i http://127.0.0.1:8083/connectors/test-doris-sink-cluster -X DELETE` |
| Pause the current connector | `curl -i http://127.0.0.1:8083/connectors/test-doris-sink-cluster/pause -X PUT` |
| Restart the current connector | `curl -i http://127.0.0.1:8083/connectors/test-doris-sink-cluster/resume -X PUT` |
| Restart a task within the connector | `curl -i http://127.0.0.1:8083/connectors/test-doris-sink-cluster/tasks/0/restart -X POST` |

For more information about Distributed mode, refer to [Distributed Workers](https://docs.confluent.io/platform/current/connect/index.html#distributed-workers).

### Consuming Plain JSON Data

Use this for the scenario where Kafka stores plain JSON messages.

**Step 1: Prepare Kafka data**

Sample data in Kafka is as follows:

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

**Step 2: Create the target table in Doris**

```SQL
CREATE TABLE test_db.test_kafka_connector_tbl(
    user_id            BIGINT       NOT NULL COMMENT "user id",
    name               VARCHAR(20)           COMMENT "name",
    age                INT                   COMMENT "age"
)
DUPLICATE KEY(user_id)
DISTRIBUTED BY HASH(user_id) BUCKETS 12;
```

**Step 3: Submit the import task**

On the machine where Kafka Connect is deployed, submit the following import task using `curl`:

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

### Consuming Data Collected by Debezium

Use this for the scenario where Debezium collects change data (CDC) in real time from upstream databases such as MySQL or PostgreSQL and writes it into Doris.

**Step 1: Prepare the source table and data in MySQL**

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

**Step 2: Create the target table in Doris**

CDC scenarios require the `UNIQUE KEY` table model to support primary key deduplication and deletion:

```SQL
CREATE TABLE test_db.test_user(
    user_id            BIGINT       NOT NULL COMMENT "user id",
    name               VARCHAR(20)           COMMENT "name",
    age                INT                   COMMENT "age"
)
UNIQUE KEY(user_id)
DISTRIBUTED BY HASH(user_id) BUCKETS 12;
```

**Step 3: Deploy Debezium MySQL Connector**

Deploy the Debezium connector for MySQL component. Refer to [Debezium connector for MySQL](https://debezium.io/documentation/reference/stable/connectors/mysql.html).

**Step 4: Create the doris-kafka-connector import task**

Suppose the MySQL table data collected by Debezium is stored in the `mysql_debezium.test.test_user` Topic:

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

Key parameters:

- `converter.mode=debezium_ingestion`: enables parsing of the Debezium data format.
- `enable.delete=true`: synchronously executes delete operations in Doris.

### Consuming Data in Avro Serialization Format

Use this for the scenario where Kafka stores data in Avro format together with a Schema Registry.

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

### Consuming Data in Protobuf Serialization Format

Use this for the scenario where Kafka stores data in Protobuf format together with a Schema Registry.

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

**Q1: How should I choose between Routine Load and Doris Kafka Connector?**

- In most scenarios, Routine Load is sufficient: it requires no extra components and supports CSV and JSON.
- If you need to consume Avro / Protobuf formats, or integrate with Kafka Connect ecosystem components such as Debezium, use the Doris Kafka Connector.

**Q2: Which Kafka versions does Routine Load support?**

Kafka 0.10.0.0 and above is supported by default. To consume older versions (0.9.0, 0.8.x), you need to modify the BE configuration `kafka_broker_version_fallback`, or set `property.broker.version.fallback` when creating the job. Note that using older versions makes some new features unavailable, for example setting Kafka partition offsets by time.

**Q3: What format should the Kafka data be in for multi-table import?**

The data format must be `table_name|data`. For example, the CSV multi-table import format is `table_name|val1,val2,val3`, and `table_name` must exactly match the table name in Doris, otherwise the import fails. Multi-table import does not support the `column_mapping` configuration.

**Q4: When using Kafka Connect to consume, why should `max.poll.interval.ms` be increased?**

Stream Load writes to Doris can take a long time. If `max.poll.interval.ms` (5 minutes by default) is too small, the consumer will be kicked out of the consumer group. It is recommended to increase it to **more than 30 minutes**, and set `consumer.max.poll.interval.ms` accordingly.

**Q5: How do I sync DELETE operations collected by Debezium to Doris?**

In the Doris Kafka Connector configuration, set `converter.mode=debezium_ingestion` and `enable.delete=true`, and use the `UNIQUE KEY` table model in Doris to store CDC data.

## Related Links

- [CREATE ROUTINE LOAD syntax reference](../../../sql-manual/sql-statements/data-modification/load-and-export/CREATE-ROUTINE-LOAD)
- [Routine Load operation manual](../import-way/routine-load-manual.md)
- [Doris Kafka Connector documentation](../../../connection-integration/data-integration/doris-kafka-connector.md)
- [Kafka security authentication configuration](../import-way/routine-load-manual.md#kafka-安全认证)
- [Kafka Connect Distributed Workers](https://docs.confluent.io/platform/current/connect/index.html#distributed-workers)
- [Debezium connector for MySQL](https://debezium.io/documentation/reference/stable/connectors/mysql.html)
