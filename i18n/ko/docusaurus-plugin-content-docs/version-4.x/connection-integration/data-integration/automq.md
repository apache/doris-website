---
{
    "title": "AutoMQ",
    "language": "ko",
    "description": "Apache Doris Routine Load를 사용하여 AutoMQ의 Kafka 호환 Topic에서 JSON 데이터를 읽어 와 실시간으로 데이터를 적재합니다."
}
---

[AutoMQ](https://github.com/AutoMQ/automq)는 클라우드 환경에 맞게 재설계된 클라우드 네이티브 Kafka입니다. 데이터 저장을 오브젝트 스토리지에 맡겨 Apache Kafka와 100% 호환되면서 비용 효율은 최대 10배, 탄력성은 100배 높입니다. 혁신적인 공유 스토리지 아키텍처를 통해 초 단위 파티션 마이그레이션, 트래픽 자동 균형 조정, 초 단위 자동 확장을 제공하며, 높은 처리량과 낮은 지연 시간을 유지합니다.

이 문서에서는 Apache Doris Routine Load를 사용하여 AutoMQ의 Kafka 호환 Topic에서 JSON 데이터를 읽어 와 Doris 테이블에 지속적으로 적재하는 방법을 설명합니다.

![AutoMQ 스토리지 아키텍처](/images/next/connection-integration/data-integration/automq-arch.jpg)

## 활용 사례 {#use-cases}

비즈니스 데이터가 AutoMQ에 기록되어 있고 이 실시간 데이터를 Apache Doris에서 지속적으로 분석하려는 경우, Routine Load를 사용하여 AutoMQ Topic에서 데이터를 읽어 올 수 있습니다. 이 문서의 예제에서는 JSON Topic과 Doris 테스트 테이블을 사용하여 데이터 준비부터 적재 결과 확인까지 전체 과정을 보여 줍니다.

전체 작업 흐름은 다음과 같습니다.

1. Apache Doris 테스트 데이터베이스와 테스트 테이블을 준비합니다.
2. AutoMQ 클러스터, Kafka 명령줄 도구, 테스트 Topic을 준비합니다.
3. AutoMQ Topic에 JSON 테스트 데이터를 기록합니다.
4. Doris에서 Routine Load 데이터 적재 작업을 생성합니다.
5. Doris 테이블을 쿼리하여 데이터가 성공적으로 적재되었는지 확인합니다.

## 사전 준비 사항 {#prerequisites}

시작하기 전에 다음 환경이 준비되어 있는지 확인하세요.

| 항목 | 설명 |
| --- | --- |
| Apache Doris 클러스터 | 사용 가능한 Apache Doris 클러스터가 있는지 확인하세요. 이 문서에서는 시연을 위해 [빠른 시작](../../getting-started/quick-start) 문서를 참고하여 Linux에 테스트 환경을 배포합니다. |
| AutoMQ 클러스터 | AutoMQ [공식 배포 문서](https://docs.automq.com/automq/deployment/deploy-multi-nodes-cluster-on-linux)를 참고하여 사용 가능한 클러스터를 배포하고, AutoMQ와 Apache Doris 간 네트워크가 연결되어 있는지 확인하세요. |
| Kafka 명령줄 도구 | [AutoMQ 릴리스](https://github.com/AutoMQ/automq/releases)에서 최신 TGZ 패키지를 다운로드하여 압축을 해제하세요. 이 문서에서는 압축을 해제한 디렉터리를 `$AUTOMQ_HOME`으로 가정하며, `$AUTOMQ_HOME/bin`에 있는 도구 명령을 사용하여 Topic을 생성하고 테스트 데이터를 만듭니다. |

## Doris 테스트 테이블 준비 {#prepare-the-doris-test-table}

Doris에서 데이터베이스와 테스트 테이블을 생성합니다. 이후 예제는 기본적으로 `automq_db`에서 실행합니다.

```sql
CREATE DATABASE automq_db;
USE automq_db;

CREATE TABLE automq_db.users (
    id BIGINT NOT NULL,
    name STRING NOT NULL,
    timestamp STRING NULL,
    status STRING NULL
) DISTRIBUTED BY HASH(id) PROPERTIES ("replication_num" = "1");
```

## AutoMQ Topic 및 테스트 데이터 준비 {#prepare-the-automq-topic-and-test-data}

이 문서에서는 다음 예시 매개변수를 사용합니다. 명령을 실행할 때 예시 주소를 실제 AutoMQ Bootstrap Server 주소로 바꾸세요.

| 매개변수 | 예시 값 | 설명 |
| --- | --- | --- |
| AutoMQ Bootstrap Server | `127.0.0.1:9092` | AutoMQ 클러스터의 접속 주소입니다. |
| Topic | `example_topic` | JSON 테스트 데이터를 저장하는 Topic입니다. |
| AutoMQ 압축 해제 디렉터리 | `$AUTOMQ_HOME` | AutoMQ TGZ 패키지의 압축을 해제한 디렉터리입니다. |

### Topic 생성 {#create-the-topic}

Apache Kafka 명령줄 도구를 사용하여 `example_topic`을 생성합니다.

```shell
$AUTOMQ_HOME/bin/kafka-topics.sh \
    --create \
    --topic example_topic \
    --bootstrap-server 127.0.0.1:9092 \
    --partitions 1 \
    --replication-factor 1
```

생성 후 다음 명령을 사용하여 Topic이 성공적으로 생성되었는지 확인합니다.

```shell
$AUTOMQ_HOME/bin/kafka-topics.sh \
    --describe \
    --topic example_topic \
    --bootstrap-server 127.0.0.1:9092
```

### 테스트 데이터 준비 {#prepare-the-test-data}

테스트 데이터는 JSON 형식을 사용합니다. 필드는 Doris 테이블 및 이후 Routine Load의 `jsonpaths`와 일치해야 합니다.

```json
{
    "id": 1,
    "name": "Test User",
    "timestamp": "2023-11-10T12:00:00",
    "status": "active"
}
```

### 테스트 데이터 기록 {#write-the-test-data}

Kafka 명령줄 도구를 사용하거나 프로그램을 통해 `example_topic`에 테스트 데이터를 기록합니다. 다음 예제에서는 명령줄 도구를 사용하여 데이터를 기록합니다.

```shell
echo '{"id": 1, "name": "Test User", "timestamp": "2023-11-10T12:00:00", "status": "active"}' | $AUTOMQ_HOME/bin/kafka-console-producer.sh \
    --bootstrap-server 127.0.0.1:9092 \
    --topic example_topic
```

다음 명령을 사용하여 방금 Topic에 기록한 데이터를 확인합니다.

```shell
$AUTOMQ_HOME/bin/kafka-console-consumer.sh \
    --bootstrap-server 127.0.0.1:9092 \
    --topic example_topic \
    --from-beginning
```

## Routine Load 데이터 적재 작업 생성 {#create-the-routine-load-ingestion-job}

Apache Doris 명령줄에서 Routine Load 작업을 생성하여 AutoMQ Topic에서 JSON 데이터를 지속적으로 읽어 옵니다. Routine Load 매개변수에 대한 자세한 설명은 [Doris Routine Load](../../data-operate/import/import-way/routine-load-manual)를 참고하세요.

```sql
CREATE ROUTINE LOAD automq_example_load ON users
COLUMNS(id, name, timestamp, status)
PROPERTIES
(
    "format" = "json",
    "jsonpaths" = "[\"$.id\",\"$.name\",\"$.timestamp\",\"$.status\"]"
)
FROM KAFKA
(
    "kafka_broker_list" = "127.0.0.1:9092",
    "kafka_topic" = "example_topic",
    "property.kafka_default_offsets" = "OFFSET_BEGINNING"
);
```

주요 설정은 다음과 같습니다.

| 설정 | 예시 값 | 설명 |
| --- | --- | --- |
| `format` | `json` | 적재할 데이터의 형식이 JSON임을 지정합니다. |
| `jsonpaths` | `["$.id","$.name","$.timestamp","$.status"]` | JSON 필드와 Doris 테이블 필드 간의 매핑을 지정합니다. |
| `kafka_broker_list` | `127.0.0.1:9092` | AutoMQ Bootstrap Server 주소입니다. 실행 시 실제 주소로 바꾸세요. |
| `kafka_topic` | `example_topic` | Routine Load가 데이터를 읽어 올 AutoMQ Topic입니다. |
| `property.kafka_default_offsets` | `OFFSET_BEGINNING` | Topic의 처음부터 데이터를 읽어 옵니다. |

## 데이터 적재 확인 {#verify-data-ingestion}

먼저 Routine Load 데이터 적재 작업의 상태를 확인하여 작업이 실행 중인지 확인합니다.

```sql
SHOW ROUTINE LOAD\G;
```

그런 다음 Doris 테이블을 쿼리하여 테스트 데이터가 적재되었는지 확인합니다.

```sql
SELECT * FROM users;
```

```text
+------+-----------+---------------------+--------+
| id   | name      | timestamp           | status |
+------+-----------+---------------------+--------+
|    1 | Test User | 2023-11-10T12:00:00 | active |
+------+-----------+---------------------+--------+
1 row in set (0.01 sec)
```

## 참고 사항 {#notes}

- 예제 명령을 실행할 때 `127.0.0.1:9092`를 실제 AutoMQ Bootstrap Server 주소로 바꾸세요.
- JSON 테스트 데이터의 필드는 Doris 테이블 필드 및 Routine Load의 `jsonpaths` 설정과 일치해야 합니다.
- Routine Load 작업을 생성하기 전에 Doris에서 AutoMQ 클러스터에 접근할 수 있는지 확인하세요.
