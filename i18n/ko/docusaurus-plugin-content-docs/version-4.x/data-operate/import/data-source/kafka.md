---
{
    "title": "Kafka에서 데이터 적재하기",
    "language": "ko",
    "description": "Kafka에서 Apache Doris로 데이터를 적재하는 방법을 설명하며, Routine Load와 Doris Kafka Connector의 선택 기준, 구성 및 예제를 다룹니다.",
    "keywords": [
        "Kafka 데이터 적재",
        "Routine Load",
        "Doris Kafka Connector",
        "Kafka Connect",
        "Debezium",
        "Avro",
        "Protobuf",
        "CDC 동기화"
    ]
}
---

<!-- Knowledge type: Operational steps / Architecture selection decision -->
<!-- Applicable scenarios: Real-time data ingestion / Importing Kafka data into Doris -->

Apache Doris는 Kafka의 데이터를 실시간으로 소비하는 기능을 지원하며, 이 기능은 로그, 주문, IoT 이벤트, CDC 동기화와 같은 실시간 데이터 수집 시나리오에 널리 사용됩니다. 이 문서에서는 주로 사용되는 두 가지 방식의 선택 기준, 사용 제약 사항, 전체 작업 예제를 설명합니다.

## 방식 선택 {#approach-selection}

Doris는 Kafka에서 데이터를 적재하는 다음 두 가지 방식을 제공합니다.

| 방식 | 적용 시나리오 | 지원 형식 | 특징 |
| --- | --- | --- | --- |
| [Routine Load](../import-way/routine-load-manual.md) | 외부 구성 요소를 도입할 필요가 없는 일반적인 시나리오 | CSV, JSON | Kafka Topic을 지속적으로 소비하고 실시간으로 데이터 적재 작업을 생성하며, exactly-once 시맨틱을 제공하여 데이터 손실이나 중복을 방지합니다 |
| [Doris Kafka Connector](../../../connection-integration/data-integration/doris-kafka-connector.md) | Avro나 Protobuf와 같은 직렬화 형식의 데이터를 적재하거나, Debezium이 수집한 업스트림 데이터베이스의 CDC 데이터를 소비하는 시나리오 | JSON, Avro, Protobuf, Debezium | Kafka Connect 플러그인 메커니즘을 기반으로 하며, 수평 확장성과 내결함성을 제공합니다 |

방식 선택 시 권장 사항:

- 기본적으로 Doris가 Kafka를 직접 소비하는 **Routine Load**를 우선 사용하세요. 배포 구성이 가장 간단합니다.
- **Avro / Protobuf**와 같은 형식을 소비하거나 **Debezium**과 같은 Kafka Connect 생태계 구성 요소와 통합해야 한다면 **Doris Kafka Connector**를 선택하세요.

## 방식 1: Routine Load로 Kafka 데이터 소비하기 {#approach-1-use-routine-load-to-consume-kafka-data}

Routine Load는 Doris에 장기 실행 작업을 제출하여 지정된 Kafka Topic의 메시지를 지속적으로 소비하고 Doris 테이블에 실시간으로 기록합니다.

### 사용 제약 사항 {#usage-limitations}

1. **CSV**와 **JSON** 메시지 형식만 지원합니다. CSV에서는 메시지 하나가 한 행에 해당하며, 행 끝에 줄바꿈 문자가 포함되지 않습니다.
2. 기본적으로 **Kafka 0.10.0.0 이상**을 지원합니다. 이전 버전(예: 0.9.0, 0.8.2, 0.8.1, 0.8.0)을 사용하려면 BE 구성 `kafka_broker_version_fallback`을 호환되는 이전 버전으로 변경하거나, Routine Load를 생성할 때 `property.broker.version.fallback`을 설정해야 합니다. 이전 버전을 사용하면 시간을 기준으로 Kafka 파티션 오프셋을 설정하는 기능과 같은 일부 새로운 기능을 사용하지 못할 수 있습니다.

### 작업 예제 {#operational-example}

`CREATE ROUTINE LOAD` 명령으로 장기 실행 Routine Load 데이터 적재 작업을 생성합니다. 단일 테이블 데이터 적재와 다중 테이블 데이터 적재의 두 가지 시나리오가 있습니다. 자세한 구문은 [CREATE ROUTINE LOAD](../../../sql-manual/sql-statements/data-modification/load-and-export/CREATE-ROUTINE-LOAD)를 참조하세요.

#### 시나리오 1: 단일 테이블 데이터 적재 {#scenario-1-single-table-import}

하나의 Kafka Topic에서 Doris의 테이블 하나로 데이터를 적재합니다.

**1단계: Kafka 데이터 준비**

Kafka의 예제 데이터는 다음과 같습니다.

```SQL
kafka-console-consumer.sh --bootstrap-server localhost:9092 --topic test-routine-load-csv --from-beginning
1,Emily,25
```

**2단계: Doris에 대상 테이블 생성**

```SQL
CREATE TABLE testdb.test_routineload_tbl(
    user_id            BIGINT       NOT NULL COMMENT "user id",
    name               VARCHAR(20)           COMMENT "name",
    age                INT                   COMMENT "age"
)
DUPLICATE KEY(user_id)
DISTRIBUTED BY HASH(user_id) BUCKETS 10;
```

**3단계: Routine Load 작업 생성**

`CREATE ROUTINE LOAD` 명령으로 데이터 적재 작업을 생성합니다.

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

**4단계: 데이터 적재 결과 확인**

```SQL
select * from test_routineload_tbl;
+-----------+----------------+------+
| user_id   | name           | age  |
+-----------+----------------+------+
|  1        | Emily          | 25   |
+-----------+----------------+------+
```

#### 시나리오 2: 다중 테이블 데이터 적재 {#scenario-2-multi-table-import}

동일한 Kafka Topic의 데이터를 여러 Doris 테이블에 한 번에 적재해야 할 때 이 시나리오를 사용합니다.

요구 사항 및 제약 사항:

- Kafka의 데이터에는 테이블 이름이 포함되어야 하며, 형식은 `table_name|data`여야 합니다. 예를 들어 CSV 형식은 `table_name|val1,val2,val3`입니다.
- **테이블 이름은 Doris의 테이블 이름과 정확히 일치해야 합니다**. 그렇지 않으면 데이터 적재에 실패합니다.
- 다중 테이블 데이터 적재에서는 뒤에서 설명하는 `column_mapping` 구성을 **지원하지 않습니다**.

**1단계: Kafka 데이터 준비**

Kafka의 예제 데이터는 다음과 같습니다. 접두사는 대상 테이블 이름입니다.

```SQL
kafka-console-consumer.sh --bootstrap-server localhost:9092 --topic test-multi-table-load --from-beginning
test_multi_table_load1|1,Emily,25
test_multi_table_load2|2,Benjamin,35
```

**2단계: Doris에 대상 테이블 생성**

테이블 1:

```SQL
CREATE TABLE test_multi_table_load1(
    user_id            BIGINT       NOT NULL COMMENT "user id",
    name               VARCHAR(20)           COMMENT "user name",
    age                INT                   COMMENT "user age"
)
DUPLICATE KEY(user_id)
DISTRIBUTED BY HASH(user_id) BUCKETS 10;
```

테이블 2:

```SQL
CREATE TABLE test_multi_table_load2(
    user_id            BIGINT       NOT NULL COMMENT "user id",
    name               VARCHAR(20)           COMMENT "user name",
    age                INT                   COMMENT "user age"
)
DUPLICATE KEY(user_id)
DISTRIBUTED BY HASH(user_id) BUCKETS 10;
```

**3단계: 다중 테이블 Routine Load 작업 생성**

```SQL
CREATE ROUTINE LOAD example_multi_table_load
COLUMNS TERMINATED BY ","
FROM KAFKA(
    "kafka_broker_list" = "192.168.88.62:9092",
    "kafka_topic" = "test-multi-table-load",
    "property.kafka_default_offsets" = "OFFSET_BEGINNING"
);
```

**4단계: 데이터 적재 결과 확인**

```SQL
mysql> select * from test_multi_table_load1;
+---------+----------------+------+
| user_id | name           | age  |
+---------+----------------+------+
|  1      | Emily          | 25   |
+---------+----------------+------+

mysql> select * from test_multi_table_load2;
+---------+----------------+------+
| user_id | name           | age  |
+---------+----------------+------+
|  2      | Benjamin       | 35   |
+---------+----------------+------+
```

### 보안 인증 구성 {#configuring-security-authentication}

Kafka 클러스터에 SSL, SASL 또는 기타 보안 인증이 활성화되어 있다면 [Kafka 보안 인증](../import-way/routine-load-manual.md#kafka-security-authentication)을 참조하여 해당 인증 매개변수를 구성하세요.

## 방식 2: Doris Kafka Connector로 Kafka 데이터 소비하기 {#approach-2-use-doris-kafka-connector-to-consume-kafka-data}

Doris Kafka Connector는 Kafka Connect 프레임워크를 기반으로 Kafka 데이터 스트림을 Doris에 기록하는 도구입니다. 플러그인 메커니즘을 통해 여러 직렬화 형식(예: JSON, Avro, Protobuf)의 데이터를 쉽게 적재할 수 있으며, Debezium이 수집한 CDC 데이터의 파싱을 지원합니다.

### 분산 모드로 시작하기 {#starting-in-distributed-mode}

[분산](https://docs.confluent.io/platform/current/connect/index.html#distributed-workers) 모드는 Kafka Connect에 확장성과 자동 내결함성을 제공합니다. 이 모드에서는 동일한 `group.id`를 사용하는 여러 워커 프로세스를 시작할 수 있으며, 워커들은 커넥터와 작업의 스케줄링을 조율합니다.

**1단계: 플러그인 JAR 배치**

`plugins` 디렉터리를 `$KAFKA_HOME` 아래에 생성하고, 다운로드한 `doris-kafka-connector` JAR 파일을 그 안에 넣습니다.

**2단계: `config/connect-distributed.properties` 구성**

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

**3단계: Kafka Connect 시작**

```Bash
$KAFKA_HOME/bin/connect-distributed.sh -daemon $KAFKA_HOME/config/connect-distributed.properties
```

**4단계: 데이터 적재 작업 제출(Kafka 데이터 소비)**

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

**자주 사용하는 Kafka Connect 관리 명령**

| 작업 | 명령 |
| --- | --- |
| 커넥터 상태 확인 | `curl -i http://127.0.0.1:8083/connectors/test-doris-sink-cluster/status -X GET` |
| 현재 커넥터 삭제 | `curl -i http://127.0.0.1:8083/connectors/test-doris-sink-cluster -X DELETE` |
| 현재 커넥터 일시 중지 | `curl -i http://127.0.0.1:8083/connectors/test-doris-sink-cluster/pause -X PUT` |
| 현재 커넥터 재시작 | `curl -i http://127.0.0.1:8083/connectors/test-doris-sink-cluster/resume -X PUT` |
| 커넥터 내 작업 재시작 | `curl -i http://127.0.0.1:8083/connectors/test-doris-sink-cluster/tasks/0/restart -X POST` |

분산 모드에 대한 자세한 내용은 [분산 워커](https://docs.confluent.io/platform/current/connect/index.html#distributed-workers)를 참조하세요.

### 일반 JSON 데이터 소비하기 {#consuming-plain-json-data}

Kafka에 일반 JSON 메시지를 저장하는 시나리오에 사용합니다.

**1단계: Kafka 데이터 준비**

Kafka의 예제 데이터는 다음과 같습니다.

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

**2단계: Doris에 대상 테이블 생성**

```SQL
CREATE TABLE test_db.test_kafka_connector_tbl(
    user_id            BIGINT       NOT NULL COMMENT "user id",
    name               VARCHAR(20)           COMMENT "name",
    age                INT                   COMMENT "age"
)
DUPLICATE KEY(user_id)
DISTRIBUTED BY HASH(user_id) BUCKETS 12;
```

**3단계: 데이터 적재 작업 제출**

Kafka Connect가 배포된 시스템에서 `curl`을 사용하여 다음 데이터 적재 작업을 제출합니다.

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

### Debezium이 수집한 데이터 소비하기 {#consuming-data-collected-by-debezium}

Debezium이 MySQL이나 PostgreSQL과 같은 업스트림 데이터베이스에서 변경 데이터(CDC)를 실시간으로 수집하고 Doris에 기록하는 시나리오에 사용합니다.

**1단계: MySQL에 원본 테이블과 데이터 준비**

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

**2단계: Doris에 대상 테이블 생성**

CDC 시나리오에서 기본 키 중복 제거와 삭제를 지원하려면 `UNIQUE KEY` 테이블 모델을 사용해야 합니다.

```SQL
CREATE TABLE test_db.test_user(
    user_id            BIGINT       NOT NULL COMMENT "user id",
    name               VARCHAR(20)           COMMENT "name",
    age                INT                   COMMENT "age"
)
UNIQUE KEY(user_id)
DISTRIBUTED BY HASH(user_id) BUCKETS 12;
```

**3단계: Debezium MySQL Connector 배포**

MySQL용 Debezium 커넥터 구성 요소를 배포합니다. [MySQL용 Debezium 커넥터](https://debezium.io/documentation/reference/stable/connectors/mysql.html)를 참조하세요.

**4단계: doris-kafka-connector 데이터 적재 작업 생성**

Debezium이 수집한 MySQL 테이블 데이터가 `mysql_debezium.test.test_user` Topic에 저장되어 있다고 가정합니다.

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

주요 매개변수:

- `converter.mode=debezium_ingestion`: Debezium 데이터 형식의 파싱을 활성화합니다.
- `enable.delete=true`: Doris에서 삭제 작업을 동기적으로 실행합니다.

### Avro 직렬화 형식의 데이터 소비하기 {#consuming-data-in-avro-serialization-format}

Kafka에 Avro 형식의 데이터를 저장하고 Schema Registry를 함께 사용하는 시나리오에 사용합니다.

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

### Protobuf 직렬화 형식의 데이터 소비하기 {#consuming-data-in-protobuf-serialization-format}

Kafka에 Protobuf 형식의 데이터를 저장하고 Schema Registry를 함께 사용하는 시나리오에 사용합니다.

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

## 자주 묻는 질문 {#faq}

**질문 1: Routine Load와 Doris Kafka Connector 중 어떤 것을 선택해야 하나요?**

- 대부분의 시나리오에서는 Routine Load로 충분합니다. 추가 구성 요소가 필요 없으며 CSV와 JSON을 지원합니다.
- Avro / Protobuf 형식을 소비하거나 Debezium과 같은 Kafka Connect 생태계 구성 요소와 통합해야 한다면 Doris Kafka Connector를 사용하세요.

**질문 2: Routine Load는 어떤 Kafka 버전을 지원하나요?**

기본적으로 Kafka 0.10.0.0 이상을 지원합니다. 이전 버전(0.9.0, 0.8.x)의 데이터를 소비하려면 BE 구성 `kafka_broker_version_fallback`을 변경하거나 작업을 생성할 때 `property.broker.version.fallback`을 설정해야 합니다. 이전 버전을 사용하면 시간을 기준으로 Kafka 파티션 오프셋을 설정하는 기능과 같은 일부 새로운 기능을 사용할 수 없습니다.

**질문 3: 다중 테이블 데이터 적재를 위한 Kafka 데이터는 어떤 형식이어야 하나요?**

데이터 형식은 `table_name|data`여야 합니다. 예를 들어 CSV의 다중 테이블 데이터 적재 형식은 `table_name|val1,val2,val3`이며, `table_name`은 Doris의 테이블 이름과 정확히 일치해야 합니다. 그렇지 않으면 데이터 적재에 실패합니다. 다중 테이블 데이터 적재에서는 `column_mapping` 구성을 지원하지 않습니다.

**질문 4: Kafka Connect로 데이터를 소비할 때 `max.poll.interval.ms`를 늘려야 하는 이유는 무엇인가요?**

Stream Load로 Doris에 데이터를 기록하는 데 오랜 시간이 걸릴 수 있습니다. `max.poll.interval.ms`(기본값 5분)가 너무 작으면 소비자가 소비자 그룹에서 제외됩니다. 이 값을 **30분보다 길게** 설정하고 `consumer.max.poll.interval.ms`도 그에 맞게 설정하는 것이 좋습니다.

**질문 5: Debezium이 수집한 DELETE 작업을 Doris에 동기화하려면 어떻게 해야 하나요?**

Doris Kafka Connector 구성에서 `converter.mode=debezium_ingestion`과 `enable.delete=true`를 설정하고, Doris에서 `UNIQUE KEY` 테이블 모델을 사용하여 CDC 데이터를 저장하세요.

## 관련 링크 {#related-links}

- [CREATE ROUTINE LOAD 구문 참조](../../../sql-manual/sql-statements/data-modification/load-and-export/CREATE-ROUTINE-LOAD)
- [Routine Load 사용 설명서](../import-way/routine-load-manual.md)
- [Doris Kafka Connector 문서](../../../connection-integration/data-integration/doris-kafka-connector.md)
- [Kafka 보안 인증 구성](../import-way/routine-load-manual.md#kafka-security-authentication)
- [Kafka Connect 분산 워커](https://docs.confluent.io/platform/current/connect/index.html#distributed-workers)
- [MySQL용 Debezium 커넥터](https://debezium.io/documentation/reference/stable/connectors/mysql.html)
