---
{
    "title": "Doris Kafka Connector",
    "language": "ko",
    "description": "Doris Kafka Connector를 사용해 Kafka 토픽을 Apache Doris에 실시간으로 저장하세요. 배포 모드, 구성 옵션, 타입 매핑, Debezium 동기화, 문제 해결 방법을 알아봅니다.",
    "keywords": [
        "Doris Kafka Connector",
        "Kafka Connect",
        "Kafka에서 Doris로",
        "Apache Doris 실시간 데이터 수집",
        "Debezium에서 Doris로"
    ]
}
---

<!-- Knowledge type: Operations guide / Configuration reference -->
<!-- Applicable scenarios: Real-time ingestion of Kafka data into Doris / Kafka Connect Sink Connector deployment and troubleshooting -->

[Kafka Connect](https://docs.confluent.io/platform/current/connect/index.html)는 Apache Kafka와 다른 시스템 간에 데이터를 이동하는 확장성과 안정성을 갖춘 데이터 통합 도구입니다. Doris 커뮤니티는 Kafka 토픽의 데이터를 Doris에 저장하는 [doris-kafka-connector](https://github.com/apache/doris-kafka-connector) 플러그인을 제공합니다.

## 적용 시나리오 {#applicable-scenarios}

Kafka의 데이터를 Doris에 지속적으로 저장하려면 데이터 소스와 실행 환경에 맞는 구성을 선택하세요.

| 사용 시나리오 | 사용할 기능 | 참조 섹션 |
| --- | --- | --- |
| 로컬 검증 또는 개발 테스트 | Kafka Connect를 Standalone 모드로 시작하고 로컬 구성 파일로 Doris Sink Connector 생성 | [Standalone 모드 배포](#standalone-mode-deployment) |
| 프로덕션 또는 클러스터 배포 | Kafka Connect를 Distributed 모드로 시작하고 REST API로 Connector 관리 | [Distributed 모드 배포](#distributed-mode-deployment) |
| 일반 JSON 데이터 동기화 | `JsonConverter` 또는 `StringConverter`를 사용해 Kafka 토픽을 소비하고 Doris 테이블에 저장 | [일반 JSON 데이터 동기화](#synchronizing-plain-json-data) |
| Debezium으로 캡처한 CDC 데이터 동기화 | `converter.mode=debezium_ingestion`을 설정하고 필요에 따라 삭제 동기화 활성화 | [Debezium으로 캡처한 데이터 동기화](#synchronizing-data-captured-by-debezium) |
| Avro 또는 Protobuf로 직렬화된 데이터 동기화 | Confluent Avro 또는 Protobuf Converter를 사용하고 Schema Registry 주소 구성 | [Avro로 직렬화된 데이터 동기화](#synchronizing-avro-serialized-data), [Protobuf로 직렬화된 데이터 동기화](#synchronizing-protobuf-serialized-data) |
| 저장 전 Kafka 메시지 변환 | Kafka Connect SMT를 사용해 메시지에 필드를 추가하거나 시간 형식 변환 | [Kafka Connect SMT를 사용한 데이터 변환](#transforming-data-with-kafka-connect-smt) |
| SSL 인증을 사용하는 Kafka 클러스터에 연결 | Kafka Connect Worker와 내장 컨슈머에서 SSL 매개변수 구성 | [SSL 인증을 사용하는 Kafka 클러스터에 연결](#accessing-an-ssl-authenticated-kafka-cluster) |
| 변환에 실패한 레코드 기록 | Kafka Connect dead letter queue 구성 | [dead letter queue 구성](#configuring-a-dead-letter-queue) |

## 버전 안내 {#version-notes}

| Connector 버전 | Kafka 버전 | Doris 버전 | Java 버전 |
| --- | --- | --- | --- |
| 1.0.0 | 2.4+ | 2.0+ | 8 |
| 1.1.0 | 2.4+ | 2.0+ | 8 |
| 24.0.0 | 2.4+ | 2.0+ | 8 |
| 25.0.0 | 2.4+ | 2.0+ | 8 |
| 26.0.0 | 2.4+ | 2.0+ | 8 |

## Doris Kafka Connector 준비 {#preparing-the-doris-kafka-connector}

JAR 패키지를 다운로드하거나 Maven 의존성을 추가해 Doris Kafka Connector를 사용할 수 있습니다.

### JAR 패키지 다운로드 {#downloading-the-jar-package}

[Doris 다운로드 페이지](https://doris.apache.org/download)에서 doris-kafka-connector JAR 패키지를 다운로드하세요. Kafka Connect를 배포할 때 JAR 패키지를 `$KAFKA_HOME/plugins` 디렉터리에 넣으세요.

### Maven 의존성 사용 {#using-a-maven-dependency}

Maven 프로젝트에 다음 의존성을 추가하세요.

```xml
<dependency>
    <groupId>org.apache.doris</groupId>
    <artifactId>doris-kafka-connector</artifactId>
    <version>25.0.0</version>
</dependency>
```

## Standalone 모드 배포 {#standalone-mode-deployment}

Standalone 모드는 로컬 검증이나 개발 테스트에 적합합니다. 일반적으로 프로덕션 환경에서는 권장하지 않습니다.

### 1. 플러그인 디렉터리 준비 {#1-prepare-the-plugin-directory}

`plugins` 디렉터리를 `$KAFKA_HOME` 아래에 만들고 다운로드한 doris-kafka-connector JAR 패키지를 넣으세요.

### 2. Kafka Connect Worker 구성 {#2-configure-the-kafka-connect-worker}

`$KAFKA_HOME/config/connect-standalone.properties`를 수정하세요.

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

### 3. Doris Sink Connector 구성 {#3-configure-the-doris-sink-connector}

`doris-connector-sink.properties` 파일을 `$KAFKA_HOME/config` 디렉터리에 만드세요.

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

### 4. Standalone 모드 시작 {#4-start-standalone-mode}

```shell
$KAFKA_HOME/bin/connect-standalone.sh -daemon $KAFKA_HOME/config/connect-standalone.properties $KAFKA_HOME/config/doris-connector-sink.properties
```

## Distributed 모드 배포 {#distributed-mode-deployment}

Distributed 모드는 여러 노드로 구성된 Kafka Connect 클러스터에 적합합니다. 이 모드에서는 먼저 Kafka Connect Worker를 시작한 다음 REST API로 Connector를 생성하고 관리합니다.

### 1. 플러그인 디렉터리 준비 {#1-prepare-the-plugin-directory-1}

`plugins` 디렉터리를 `$KAFKA_HOME` 아래에 만들고 다운로드한 doris-kafka-connector JAR 패키지를 넣으세요.

### 2. Kafka Connect Worker 구성 {#2-configure-the-kafka-connect-worker-1}

`$KAFKA_HOME/config/connect-distributed.properties`를 수정하세요.

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

### 3. Distributed 모드 시작 {#3-start-distributed-mode}

```shell
$KAFKA_HOME/bin/connect-distributed.sh -daemon $KAFKA_HOME/config/connect-distributed.properties
```

:::note
Kafka Connect는 처음 시작할 때 Kafka 클러스터에 `config.storage.topic`, `offset.storage.topic`, `status.storage.topic`이라는 세 개의 토픽을 생성합니다. 이 토픽은 공유 Connector 구성, 오프셋 데이터, 상태 업데이트를 기록하는 데 사용됩니다. 자세한 내용은 [Kafka Connect 사용 방법 - 시작하기](https://docs.confluent.io/platform/current/connect/userguide.html)를 참조하세요.
:::

### 4. Connector 생성 {#4-create-a-connector}

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

### 5. Connector 관리 {#5-manage-the-connector}

Kafka Connect REST API로 Connector를 조회, 일시 중지, 재개, 삭제하거나 다시 시작할 수 있습니다. API에 대한 자세한 내용은 [Connect REST 인터페이스](https://docs.confluent.io/platform/current/connect/references/restapi.html#kconnect-rest-interface)를 참조하세요.

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

## 프로덕션 환경을 위한 추가 설정 {#production-environment-enhancements}

### SSL 인증을 사용하는 Kafka 클러스터에 연결 {#accessing-an-ssl-authenticated-kafka-cluster}

Kafka Connect를 통해 SSL 인증을 사용하는 Kafka 클러스터에 연결하려면 Kafka 브로커의 공개 키를 인증하는 데 사용되는 인증서 파일(예: `client.truststore.jks`)을 제공해야 합니다. `connect-distributed.properties`에 다음 구성을 추가하세요.

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

Kafka Connect를 통해 SSL 인증을 사용하는 Kafka 클러스터에 연결하는 방법에 대한 자세한 내용은 [Kafka Connect 구성](https://docs.confluent.io/platform/current/security/security_tutorial.html#configure-kafka-connect)을 참조하세요.

### dead letter queue 구성 {#configuring-a-dead-letter-queue}

기본적으로 변환 중 오류가 발생하면 Connector가 실패합니다. 다음 구성을 사용하면 이러한 오류가 발생해도 처리를 계속하고, 각 오류와 실패한 작업의 세부 정보를 문제가 있는 레코드와 함께 dead letter queue에 기록할 수 있습니다.

```properties
errors.tolerance=all
errors.deadletterqueue.topic.name=test_error_topic
errors.deadletterqueue.context.headers.enable=true
errors.deadletterqueue.topic.replication.factor=1
```

## 구성 옵션 {#configuration-options}

다음 구성은 Doris Sink Connector를 생성할 때 사용합니다. 그 밖의 Kafka Connect Sink 공통 구성 옵션은 [connect_configuring](https://kafka.apache.org/documentation/#connect_configuring)을 참조하세요.

| 키 | 열거값 | 기본값 | 필수 | 설명 |
| --- | --- | --- | --- | --- |
| `name` | - | - | Y | Connect 애플리케이션 이름입니다. Kafka Connect 환경 내에서 고유해야 합니다. |
| `connector.class` | - | - | Y | `org.apache.doris.kafka.connector.DorisSinkConnector`. |
| `topics` | - | - | Y | 구독할 토픽 목록입니다. 여러 토픽은 쉼표로 구분합니다. 예: `topic1,topic2`. |
| `doris.urls` | - | - | Y | Doris FE 연결 주소입니다. 여러 주소는 쉼표로 구분합니다. 예: `10.20.30.1,10.20.30.2,10.20.30.3`. |
| `doris.http.port` | - | - | Y | Doris HTTP 프로토콜 포트입니다. |
| `doris.query.port` | - | - | Y | Doris MySQL 프로토콜 포트입니다. |
| `doris.user` | - | - | Y | Doris 사용자 이름입니다. |
| `doris.password` | - | - | Y | Doris 비밀번호입니다. |
| `doris.database` | - | - | Y | 데이터를 저장할 데이터베이스입니다. 여러 데이터베이스에 저장할 때는 비워 둘 수 있으며, 이 경우 `topic2table.map`에 데이터베이스 이름을 지정해야 합니다. |
| `doris.topic2table.map` | - | - | Y | 토픽과 테이블 간의 매핑입니다. 예: `topic1:tb1,topic2:tb2`. 비워 두면 기본적으로 토픽 이름을 대상 테이블 이름으로 사용합니다. 여러 데이터베이스에 대한 형식은 `topic1:db1.tbl1,topic2:db2.tbl2`입니다. |
| `buffer.count.records` | - | 50000 | N | Stream Load 한 번에 저장하는 레코드 수입니다. |
| `buffer.flush.time` | - | 120 | N | 버퍼 플러시 간격이며 단위는 초입니다. 기본값은 120초입니다. |
| `buffer.size.bytes` | - | 104857600(100MB) | N | Stream Load 한 번에 저장하는 데이터 크기입니다. |
| `enable.combine.flush` | `true`,<br />`false` | false | N | 모든 파티션의 데이터를 합쳐 한 번에 저장할지 여부입니다. 기본값은 `false`입니다. 활성화하면 `at_least_once` 시맨틱만 보장할 수 있습니다. |
| `jmx` | - | true | N | JMX를 통해 Connector 내부 모니터링 지표를 가져올지 여부입니다. [Doris-Connector-JMX](https://github.com/apache/doris-kafka-connector/blob/master/docs/en/Doris-Connector-JMX.md)를 참조하세요. |
| `label.prefix` | - | `${name}` | N | 데이터 적재 시 Stream Load에 사용하는 레이블 접두사입니다. 기본값은 Connector 애플리케이션 이름입니다. |
| `auto.redirect` | - | true | N | Stream Load 요청을 리디렉션할지 여부입니다. 활성화하면 Stream Load가 FE를 거쳐 데이터를 저장할 BE로 리디렉션되며, BE 정보는 더 이상 표시되지 않습니다. |
| `sink.properties.*` | - | `'sink.properties.format':'json'`,<br />`'sink.properties.read_json_by_line':'true'` | N | Stream Load 데이터 적재 매개변수입니다. 예를 들어 `'sink.properties.column_separator':','`로 열 구분자를 정의합니다. 자세한 매개변수는 [Stream Load 매뉴얼](../../data-operate/import/import-way/stream-load-manual.md)을 참조하세요.<br /><br />Group Commit을 활성화하려면, 예를 들어 `sync_mode`를 활성화하려면 `"sink.properties.group_commit":"sync_mode"`를 설정합니다. Group Commit은 `off_mode`, `sync_mode`, `async_mode`의 세 가지 모드를 지원합니다. 자세한 사용법은 [Group Commit](https://doris.apache.org/docs/data-operate/import/group-commit-manual/)을 참조하세요.<br /><br />일부 열 업데이트를 활성화하려면, 예를 들어 `col2` 열만 업데이트하려면 `"sink.properties.partial_columns":"true"`, `"sink.properties.columns":"col2"`를 설정합니다. |
| `delivery.guarantee` | `at_least_once`,<br />`exactly_once` | at_least_once | N | Kafka 데이터를 소비해 Doris에 적재할 때의 데이터 일관성 보장 방식입니다. `at_least_once`와 `exactly_once`를 지원합니다. 기본값은 `at_least_once`입니다. Doris를 2.1.0 이상으로 업그레이드해야 `exactly_once`를 보장할 수 있습니다. |
| `converter.mode` | `normal`,<br />`debezium_ingestion` | normal | N | Connector가 Kafka 데이터를 소비할 때 사용하는 상위 시스템 데이터의 타입 변환 모드입니다. `normal`은 특별한 타입 변환 없이 Kafka 데이터를 일반적인 방식으로 소비한다는 의미입니다. `debezium_ingestion`은 Debezium과 같은 CDC(Change Data Capture) 도구로 상위 시스템의 Kafka 데이터를 수집하므로 특별한 타입 변환이 필요하다는 의미입니다. |
| `debezium.schema.evolution` | `none`,<br />`basic` | none | N | Debezium을 통해 상위 데이터베이스 시스템(예: MySQL)에서 데이터를 수집할 때 스키마가 변경되면 추가된 필드를 Doris에 동기화할 수 있습니다. `none`은 상위 데이터베이스 시스템의 스키마 변경을 Doris에 동기화하지 않는다는 의미입니다. `basic`은 상위 데이터베이스의 데이터 변경 작업을 동기화한다는 의미입니다. 열 스키마 변경은 Doris 테이블 스키마에서 의도치 않게 열을 삭제할 수 있는 위험한 작업이므로 현재는 상위 시스템에서 추가된 열만 지원합니다. 열 이름이 변경되면 기존 열은 그대로 유지되며, Connector는 대상 테이블에 새 열을 추가하고 이름이 변경된 새 데이터를 새 열에 저장합니다. |
| `enable.delete` | - | false | N | Debezium 동기화 시 삭제 레코드를 동기화할지 여부입니다. 기본값은 `false`입니다. Debezium을 사용하지 않는 동기화에서는 메시지에 삭제 표시를 추가해야 합니다. |
| `database.time_zone` | - | UTC | N | `converter.mode`가 `normal` 이외의 모드로 설정되어 있을 때, 이 옵션은 `datetime`, `date`, `timestamp`와 같은 날짜 및 시간 데이터 타입의 시간대 변환을 지정합니다. 기본값은 UTC입니다. |
| `avro.topic2schema.filepath` | - | - | N | 로컬 Avro 스키마 파일을 읽어 토픽의 Avro 파일 내용을 파싱하므로 Confluent Schema Registry에 의존하지 않습니다. 이 구성은 `key.converter` 또는 `value.converter` 접두사와 함께 사용해야 합니다. 예를 들어 `avro-user` 및 `avro-product` 토픽의 로컬 Avro 스키마 파일은 `"value.converter.avro.topic2schema.filepath":"avro-user:file:///opt/avro_user.avsc, avro-product:file:///opt/avro_product.avsc"`로 구성합니다. 자세한 사용법은 [#32](https://github.com/apache/doris-kafka-connector/pull/32)를 참조하세요. |
| `record.tablename.field` | - | - | N | 이 옵션을 활성화하면 하나의 토픽에서 여러 Doris 테이블로 데이터를 보낼 수 있습니다. 자세한 구성 방법은 [#58](https://github.com/apache/doris-kafka-connector/pull/58)을 참조하세요. |
| `max.retries` | - | 10 | N | 작업이 실패하기 전에 오류에 대해 재시도하는 최대 횟수입니다. |
| `retry.interval.ms` | - | 6000 | N | 오류 발생 후 재시도하기 전까지의 대기 시간이며 단위는 밀리초입니다. 기본값은 6000밀리초입니다. |
| `behavior.on.null.values` | `ignore`,<br />`fail` | ignore | N | 값이 `null`인 레코드의 처리 방식입니다. 기본적으로 건너뜁니다. |

## 타입 매핑 {#type-mapping}

Doris Kafka Connector는 Kafka Connect의 기본 타입이나 논리 타입을 사용해 열의 데이터 타입을 파싱합니다. 기본 타입은 Kafka Connect `Schema`로 표현하는 단순한 데이터 타입입니다. 논리 타입은 일반적으로 `Struct`를 사용해 복합 타입이나 날짜 및 시간 타입을 표현합니다.

### Kafka 기본 타입 {#kafka-primitive-types}

| Kafka 기본 타입 | Doris 타입 |
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

### Kafka 논리 타입 {#kafka-logical-types}

| Kafka 논리 타입 | Doris 타입 |
| --- | --- |
| `org.apache.kafka.connect.data.Decimal` | DECIMAL |
| `org.apache.kafka.connect.data.Date` | DATE |
| `org.apache.kafka.connect.data.Time` | STRING |
| `org.apache.kafka.connect.data.Timestamp` | DATETIME |

### Debezium 논리 타입 {#debezium-logical-types}

| Debezium 논리 타입 | Doris 타입 |
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

## 데이터 시나리오별 Connector 구성 {#configuring-the-connector-by-data-scenario}

### 일반 JSON 데이터 동기화 {#synchronizing-plain-json-data}

이 시나리오는 Kafka 토픽의 일반 JSON 메시지를 Doris 테이블에 저장하는 경우에 해당합니다.

1. Kafka의 샘플 데이터를 확인하세요.

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

2. Doris에 대상 테이블을 생성하세요.

    ```sql
    CREATE TABLE test_db.test_kafka_connector_tbl (
        user_id BIGINT NOT NULL COMMENT "user id",
        name VARCHAR(20) COMMENT "name",
        age INT COMMENT "age"
    )
    DUPLICATE KEY(user_id)
    DISTRIBUTED BY HASH(user_id) BUCKETS 12;
    ```

3. Kafka Connect가 배포된 머신에서 `curl`로 데이터 적재 작업을 제출하세요.

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

### Debezium으로 캡처한 데이터 동기화 {#synchronizing-data-captured-by-debezium}

이 시나리오는 Debezium으로 캡처한 MySQL CDC 데이터를 Kafka를 통해 Doris에 저장하는 경우에 해당합니다.

1. MySQL 데이터베이스에 다음 테이블과 데이터가 있습니다.

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

2. Doris에 대상 테이블을 생성하세요.

    ```sql
    CREATE TABLE test_db.test_user (
        user_id BIGINT NOT NULL COMMENT "user id",
        name VARCHAR(20) COMMENT "name",
        age INT COMMENT "age"
    )
    UNIQUE KEY(user_id)
    DISTRIBUTED BY HASH(user_id) BUCKETS 12;
    ```

3. Debezium connector for MySQL 컴포넌트를 배포하세요. 자세한 단계는 [MySQL용 Debezium 커넥터](https://debezium.io/documentation/reference/stable/connectors/mysql.html)를 참조하세요.

4. doris-kafka-connector 데이터 적재 작업을 생성하세요. Debezium으로 캡처한 MySQL 테이블 데이터가 `mysql_debezium.test.test_user` 토픽에 있다고 가정합니다.

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

### Avro로 직렬화된 데이터 동기화 {#synchronizing-avro-serialized-data}

이 시나리오는 Avro로 직렬화된 Kafka 토픽을 소비하고 Confluent Avro Converter로 데이터를 파싱하는 경우에 해당합니다.

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

### Protobuf로 직렬화된 데이터 동기화 {#synchronizing-protobuf-serialized-data}

이 시나리오는 Protobuf로 직렬화된 Kafka 토픽을 소비하고 Confluent Protobuf Converter로 데이터를 파싱하는 경우에 해당합니다.

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

### Kafka Connect SMT를 사용한 데이터 변환 {#transforming-data-with-kafka-connect-smt}

이 시나리오는 Doris에 저장하기 전에 개별 Kafka 메시지에 필드를 추가하거나 형식을 변환하는 경우에 해당합니다. 다음 예제에서는 `InsertField`로 정적 필드를 추가하고, `TimestampConverter`로 Bigint 타임스탬프를 시간 문자열로 변환합니다.

원본 데이터 예제:

```json
{
    "registertime": 1513885135404,
    "userid": "User_9",
    "regionid": "Region_3",
    "gender": "MALE"
}
```

Connector를 생성하세요.

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

SMT 처리 후 샘플 데이터는 다음과 같이 바뀝니다.

```json
{
    "userid": "User_9",
    "regionid": "Region_3",
    "gender": "MALE",
    "repo": "Apache Doris",
    "registertime": "2017-12-21 03:38:55.404"
}
```

여기서 `repo`는 `InsertField`로 추가한 정적 필드이며, `registertime`은 `TimestampConverter`로 변환한 시간 문자열입니다. Kafka Connect Single Message Transforms(SMT)의 추가 예제는 [SMT 문서](https://docs.confluent.io/cloud/current/connectors/transforms/overview.html)를 참조하세요.

## 자주 묻는 질문 {#faq}

### JSON 데이터를 읽을 때 `JsonConverter with schemas.enable requires "schema" and "payload" fields` 오류 발생 {#reading-json-data-reports-jsonconverter-with-schemasenable-requires-schema-and-payload-fields}

**오류 메시지:**

```shell
Caused by: org.apache.kafka.connect.errors.DataException: JsonConverter with schemas.enable requires "schema" and "payload" fields and may not contain additional fields. If you are trying to deserialize plain JSON data, set schemas.enable=false in your converter configuration.
    at org.apache.kafka.connect.json.JsonConverter.toConnectData(JsonConverter.java:337)
    at org.apache.kafka.connect.storage.Converter.toConnectData(Converter.java:91)
    at org.apache.kafka.connect.runtime.WorkerSinkTask.lambda$convertAndTransformRecord$4(WorkerSinkTask.java:536)
    at org.apache.kafka.connect.runtime.errors.RetryWithToleranceOperator.execAndRetry(RetryWithToleranceOperator.java:180)
    at org.apache.kafka.connect.runtime.errors.RetryWithToleranceOperator.execAndHandleError(RetryWithToleranceOperator.java:214)
```

**원인:**

`org.apache.kafka.connect.json.JsonConverter`를 사용할 때는 데이터가 `schema` 및 `payload` 필드에 맞는 형식이어야 합니다.

**해결 방법:**

다음 방법 중 하나를 사용하세요.

1. `org.apache.kafka.connect.json.JsonConverter`를 `org.apache.kafka.connect.storage.StringConverter`로 교체하세요.
2. 해당 구성 파일에서 `value.converter.schemas.enable` 또는 `key.converter.schemas.enable`을 `false`로 설정하세요.
    - Standalone 모드: `config/connect-standalone.properties`를 수정하세요.
    - Distributed 모드: `config/connect-distributed.properties`를 수정하세요.

### 소비 시간 초과로 컨슈머가 컨슈머 그룹에서 제외됨 {#consumption-timeout-consumer-is-kicked-out-of-the-consumer-group}

**오류 메시지:**

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

**해결 방법:**

사용 환경에 맞게 Kafka의 `max.poll.interval.ms`를 늘리세요. 기본값은 `300000`입니다.

- Standalone 모드: `max.poll.interval.ms`와 `consumer.max.poll.interval.ms`를 `config/connect-standalone.properties`에 추가하고 값을 설정하세요.
- Distributed 모드: `max.poll.interval.ms`와 `consumer.max.poll.interval.ms`를 `config/connect-distributed.properties`에 추가하고 값을 설정하세요.

매개변수를 조정한 후 Kafka Connect를 다시 시작하세요.

### Doris Kafka Connector를 1.0.0 또는 1.1.0에서 24.0.0으로 업그레이드할 때 `cleanup.policy=compact` 오류 발생 {#upgrading-the-doris-kafka-connector-from-100-or-110-to-2400-reports-cleanuppolicycompact-errors}

**오류 메시지:**

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

**해결 방법:**

`connect-configs` 및 `connect-status` 토픽의 정리 정책을 `compact`로 변경하세요.

```shell
$KAFKA_HOME/bin/kafka-configs.sh --alter --entity-type topics --entity-name connect-configs --add-config cleanup.policy=compact --bootstrap-server 127.0.0.1:9092
$KAFKA_HOME/bin/kafka-configs.sh --alter --entity-type topics --entity-name connect-status --add-config cleanup.policy=compact --bootstrap-server 127.0.0.1:9092
```

### `debezium_ingestion` 변환 모드에서 스키마 변경 실패 {#schema-change-fails-under-debezium_ingestion-conversion-mode}

**오류 메시지:**

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

**해결 방법:**

스키마 변경은 기본적으로 `debezium_ingestion` 변환 모드에서 비활성화되어 있습니다. `debezium.schema.evolution=basic`을 설정해 스키마 변경을 활성화하세요.

스키마 변경을 활성화하더라도 Doris 테이블에 변경된 열이 하나만 존재한다고 엄격하게 보장되지는 않습니다. 구체적인 제한 사항은 `debezium.schema.evolution` 매개변수 설명을 참조하세요. 상위 및 하위 시스템 양쪽에 열을 하나만 유지하려면 먼저 Doris 테이블에 변경된 열을 수동으로 추가한 다음 Connector 작업을 다시 시작하는 것이 좋습니다. Connector는 마지막으로 소비하지 않은 `offset`부터 소비를 계속해 데이터 일관성을 유지합니다.
