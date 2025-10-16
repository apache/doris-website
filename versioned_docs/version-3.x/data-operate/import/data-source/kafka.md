---
{
    "title": "Kafka",
    "language": "en"
}
---

Doris provides the following methods to load data from Kafka:

- **Using Routine Load to consume Kafka data**

Doris continuously consumes data from Kafka Topics through Routine Load. After submitting a Routine Load job, Doris generates load tasks in real-time to consume messages from the specified Topic in the Kafka cluster. Routine Load supports CSV and JSON formats, with Exactly-Once semantics, ensuring that data is neither lost nor duplicated. For more documentation, please refer to [Routine Load](../import-way/routine-load-manual.md).

- **Doris Kafka Connector to consume Kafka data**

The Doris Kafka Connector is a tool for loading Kafka data streams into the Doris database. Users can easily load various serialization formats (such as JSON, Avro, Protobuf) through the Kafka Connect plugin, and it supports parsing data formats from the Debezium component. For more documentation, please refer to [Doris Kafka Connector](../../../ecosystem/doris-kafka-connector.md).

In most cases, you can directly choose Routine Load for loading data without the need to integrate external components to consume Kafka data. When you need to load data in Avro or Protobuf formats, or data collected from upstream databases via Debezium, you can use the Doris Kafka Connector.

## Using Routine Load to consume Kafka data

### Usage Restrictions

1. Supported message formats are CSV and JSON. Each CSV message is one line, and the line does not contain a newline character at the end;
2. By default, it supports Kafka version 0.10.0.0 and above. If you need to use older versions (such as 0.9.0, 0.8.2, 0.8.1, 0.8.0), you need to modify the BE configuration to set `kafka_broker_version_fallback` to a compatible older version, or set `property.broker.version.fallback` when creating the Routine Load. Using older versions may result in some new features being unavailable, such as setting Kafka partition offsets based on time.

### Operation Example

In Doris, create a persistent Routine Load load task through the CREATE ROUTINE LOAD command, which can be divided into single-table load and multi-table load. For detailed syntax, please refer to [CREATE ROUTINE LOAD](../../../sql-manual/sql-statements/data-modification/load-and-export/CREATE-ROUTINE-LOAD).

#### Single Table Load

**Step 1: Prepare Data**

In Kafka, sample data is as follows:

```SQL
kafka-console-consumer.sh --bootstrap-server localhost:9092 --topic test-routine-load-csv --from-beginning
1,Emily,25
```

**Step 2: Create Table in Database**

Create the table to be loaded in Doris, with the following syntax:

```SQL
CREATE TABLE testdb.test_routineload_tbl(
    user_id            BIGINT       NOT NULL COMMENT "user id",
    name               VARCHAR(20)           COMMENT "name",
    age                INT                   COMMENT "age"
)
DUPLICATE KEY(user_id)
DISTRIBUTED BY HASH(user_id) BUCKETS 10;
```

**Step 3: Create Routine Load job to load data into a single table**

In Doris, use the CREATE ROUTINE LOAD command to create the load job:

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

**Step 4: Check Loaded Data**

```SQL
select * from test_routineload_tbl;
+-----------+----------------+------+
| user_id   | name           | age  |
+-----------+----------------+------+
|  1        | Emily          | 25   |
+-----------+----------------+------+
```

#### Multi-Table Load

In scenarios where multiple tables need to be loaded simultaneously, the data in Kafka must include table name information, formatted as: `table_name|data`. For example, when loading CSV data, the format should be: `table_name|val1,val2,val3`. Please note that the table name must exactly match the table name in Doris; otherwise, the loading will fail, and the column_mapping configuration introduced later is not supported.

**Step 1: Prepare Data**

In Kafka, sample data is as follows:

```SQL
kafka-console-consumer.sh --bootstrap-server localhost:9092 --topic test-multi-table-load --from-beginning
test_multi_table_load1|1,Emily,25
test_multi_table_load2|2,Benjamin,35
```

**Step 2: Create Tables in Database**

Create the tables to be loaded in Doris, with the following syntax:

Table 1:

```SQL
CREATE TABLE test_multi_table_load1(
    user_id            BIGINT       NOT NULL COMMENT "User ID",
    name               VARCHAR(20)           COMMENT "User Name",
    age                INT                   COMMENT "User Age"
)
DUPLICATE KEY(user_id)
DISTRIBUTED BY HASH(user_id) BUCKETS 10;
```

Table 2:

```SQL
CREATE TABLE test_multi_table_load2(
    user_id            BIGINT       NOT NULL COMMENT "User ID",
    name               VARCHAR(20)           COMMENT "User Name",
    age                INT                   COMMENT "User Age"
)
DUPLICATE KEY(user_id)
DISTRIBUTED BY HASH(user_id) BUCKETS 10;
```

**Step 3: Create Routine Load job to load data into multiple tables**

In Doris, use the CREATE ROUTINE LOAD command to create the load job:

```SQL
CREATE ROUTINE LOAD example_multi_table_load
COLUMNS TERMINATED BY ","
FROM KAFKA(
    "kafka_broker_list" = "192.168.88.62:9092",
    "kafka_topic" = "test-multi-table-load",
    "property.kafka_default_offsets" = "OFFSET_BEGINNING"
);
```

**Step 4: Check Loaded Data**

```SQL
select * from test_multi_table_load1;
+------+----------------+------+
| id   | name           | age  |
+------+----------------+------+
|  1   | Emily          | 25   |
+------+----------------+------+

select * from test_multi_table_load2;
+------+----------------+------+
| id   | name           | age  |
+------+----------------+------+
|  2   | Benjamin       | 35   |
+------+----------------+------+
```

#### **Configure Security Authentication**

For methods of configuring Kafka with authentication, please refer to [Kafka Security Authentication](../import-way/routine-load-manual.md#kafka-security-authentication).

## Using Doris Kafka Connector to consume Kafka data

The Doris Kafka Connector is a tool for loading Kafka data streams into the Doris database. Users can easily load various serialization formats (such as JSON, Avro, Protobuf) through the Kafka Connect plugin, and it supports parsing data formats from the Debezium component.

### Start in Distributed Mode

[Distributed](https://docs.confluent.io/platform/current/connect/index.html#distributed-workers) mode provides scalability and automatic fault tolerance for Kafka Connect. In this mode, multiple worker processes can be started using the same `group.id`, which will coordinate the execution of connectors and tasks across all available worker processes.

1. Create a plugins directory under `$KAFKA_HOME` and place the downloaded doris-kafka-connector jar package inside.
2. Configure `config/connect-distributed.properties`:

```Bash
# Modify kafka server address
bootstrap.servers=127.0.0.1:9092

# Modify group.id, which needs to be consistent across the same cluster
group.id=connect-cluster

# Modify to the created plugins directory
# Note: Please fill in the direct path of Kafka here. For example: plugin.path=/opt/kafka/plugins
plugin.path=$KAFKA_HOME/plugins

# It is recommended to increase Kafka's max.poll.interval.ms time to over 30 minutes, default is 5 minutes
# To avoid Stream Load data load consumption timeout, causing the consumer to be kicked out of the consumption group
max.poll.interval.ms=1800000
consumer.max.poll.interval.ms=1800000
```

3. Start:

```Bash
$KAFKA_HOME/bin/connect-distributed.sh -daemon $KAFKA_HOME/config/connect-distributed.properties
```

4. Consume Kafka data:

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

**Operate Kafka Connect**

```Bash
# View connector status
curl -i http://127.0.0.1:8083/connectors/test-doris-sink-cluster/status -X GET
# Delete current connector
curl -i http://127.0.0.1:8083/connectors/test-doris-sink-cluster -X DELETE
# Pause current connector
curl -i http://127.0.0.1:8083/connectors/test-doris-sink-cluster/pause -X PUT
# Resume current connector
curl -i http://127.0.0.1:8083/connectors/test-doris-sink-cluster/resume -X PUT
# Restart tasks within the connector
curl -i http://127.0.0.1:8083/connectors/test-doris-sink-cluster/tasks/0/restart -X POST
```

For an introduction to Distributed mode, please refer to [Distributed Workers](https://docs.confluent.io/platform/current/connect/index.html#distributed-workers).

### Load Ordinary Data

1. Load sample data:

In Kafka, sample data is as follows:

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

2. Create the table to be loaded:

Create the table to be loaded in Doris, with the following syntax:

```SQL
CREATE TABLE test_db.test_kafka_connector_tbl(
    user_id            BIGINT       NOT NULL COMMENT "user id",
    name               VARCHAR(20)           COMMENT "name",
    age                INT                   COMMENT "age"
)
DUPLICATE KEY(user_id)
DISTRIBUTED BY HASH(user_id) BUCKETS 12;
```

3. Create the load task:

On the machine where Kafka Connect is deployed, submit the following load task via curl command:

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

### Load Data Collected by Debezium Component

1. The MySQL database has the following table:

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

2. Create the table to be loaded in Doris:

```SQL
CREATE TABLE test_db.test_user(
    user_id            BIGINT       NOT NULL COMMENT "user id",
    name               VARCHAR(20)           COMMENT "name",
    age                INT                   COMMENT "age"
)
UNIQUE KEY(user_id)
DISTRIBUTED BY HASH(user_id) BUCKETS 12;
```

3. Deploy the Debezium connector for MySQL component, refer to: [Debezium connector for MySQL](https://debezium.io/documentation/reference/stable/connectors/mysql.html).

4. Create the doris-kafka-connector load task:

Assuming the data from the MySQL table collected by Debezium is in the `mysql_debezium.test.test_user` Topic:

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

### Load Data in AVRO Serialization Format

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

### Load Data in Protobuf Serialization Format

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
