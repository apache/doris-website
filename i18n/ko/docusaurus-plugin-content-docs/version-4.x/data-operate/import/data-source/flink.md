---
{
    "title": "Flink",
    "language": "ko",
    "description": "Flink Doris Connector를 사용해 Flink의 실시간 데이터(Kafka, MySQL 등)를 Doris로 적재하려면 어떻게 해야 하나요? 테이블 생성, 동기화, 검증의 전체 절차를 안내합니다.",
    "keywords": [
        "Flink에서 Doris로 데이터 적재",
        "Flink Doris Connector",
        "Flink CDC를 통한 Doris 동기화",
        "FlinkSQL로 Doris에 데이터 쓰기",
        "Doris로 실시간 데이터 적재",
        "Kafka MySQL 데이터를 Doris로 동기화"
    ]
}
---

<!-- Knowledge type: Operational steps -->
<!-- Applicable scenarios: Real-time data import / Streaming ETL -->

**Flink Doris Connector**를 사용하면 Flink가 생성한 데이터(Kafka나 MySQL에서 Flink가 읽어 온 데이터 등)를 Doris로 실시간 적재할 수 있습니다. 실시간 데이터 수집 및 스트리밍 ETL 시나리오에 적합합니다.

## 활용 시나리오 {#applicable-scenarios}

| 시나리오 | 설명 |
| --- | --- |
| 실시간 데이터 수집 | Kafka나 Pulsar 같은 메시지 큐의 데이터를 Doris에 실시간으로 기록합니다 |
| 데이터베이스 동기화 | Flink CDC를 통해 MySQL이나 Oracle 같은 데이터베이스의 데이터를 Doris로 동기화합니다 |
| 스트리밍 ETL | Flink로 실시간 연산을 수행하고 결과를 Doris에 기록합니다 |

## 제약 사항 {#limitations}

- 미리 배포한 **Flink 클러스터**가 필요합니다.
- Flink에 해당 버전의 **Flink Doris Connector**를 배포해야 합니다.

## 절차 {#procedure}

Flink를 사용한 데이터 적재의 전체 지침은 [Flink-Doris-Connector](../../../connection-integration/data-integration/flink-doris-connector.md)를 참조하세요. 다음 최소 예제에서는 Flink를 통해 데이터를 빠르게 적재하는 방법을 보여 줍니다.

전체 작업 흐름은 다음 세 단계로 이루어집니다:

1. Doris에 대상 테이블 생성
2. Flink에서 FlinkSQL로 데이터 쓰기
3. Doris에서 데이터가 정상적으로 적재되었는지 확인

### 1단계: Doris에 테이블 생성 {#step-1-create-a-table-in-doris}

Flink에서 데이터를 받을 대상 테이블 `students`를 Doris에 생성합니다:

```sql
CREATE TABLE `students` (
    `id` INT NULL,
    `name` VARCHAR(256) NULL,
    `age` INT NULL
) ENGINE=OLAP
UNIQUE KEY(`id`)
COMMENT 'OLAP'
DISTRIBUTED BY HASH(`id`) BUCKETS 1
PROPERTIES (
    "replication_allocation" = "tag.location.default: 1"
);
```

### 2단계: Flink로 데이터 적재 {#step-2-import-data-with-flink}

`bin/sql-client.sh`를 실행해 FlinkSQL 콘솔을 열고, 다음 구문을 실행해 sink 테이블을 생성하고 데이터를 기록합니다:

```sql
CREATE TABLE student_sink (
    id INT,
    name STRING,
    age INT
    )
    WITH (
      'connector' = 'doris',
      'fenodes' = '10.16.10.6:28737',
      'table.identifier' = 'test.students',
      'username' = 'root',
      'password' = '',
      'sink.label-prefix' = 'doris_label'
);

INSERT INTO student_sink values(1,'zhangsan',123)
```

주요 매개변수는 다음과 같습니다:

| 매개변수 | 설명 |
| --- | --- |
| `connector` | `doris`로 고정되며, Flink Doris Connector를 사용함을 나타냅니다 |
| `fenodes` | Doris FE의 HTTP 주소이며, 형식은 `host:http_port`입니다 |
| `table.identifier` | 대상 테이블의 식별자이며, 형식은 `database.table`입니다 |
| `username` | Doris 로그인 사용자 이름 |
| `password` | Doris 로그인 비밀번호 |
| `sink.label-prefix` | Stream Load 데이터 적재 작업의 Label 접두사입니다. 전역적으로 고유해야 합니다 |

### 3단계: 적재된 데이터 확인 {#step-3-check-the-imported-data}

Doris에서 대상 테이블을 쿼리하여 데이터가 정상적으로 적재되었는지 확인합니다:

```sql
select * from test.students;
+------+----------+------+
| id   | name     | age  |
+------+----------+------+
|  1   | zhangsan |  123 |
+------+----------+------+
```

## 자주 묻는 질문 {#faq}

**Q1: Flink Doris Connector는 어떤 데이터 소스를 지원하나요?**

이론적으로 Flink가 지원하는 모든 데이터 소스(Kafka, MySQL CDC, 파일 시스템, 메시지 큐 등)를 업스트림 소스로 사용하여 Flink에서 처리한 뒤 Doris에 기록할 수 있습니다.

**Q2: `sink.label-prefix`는 왜 고유해야 하나요?**

Flink Doris Connector는 Doris Stream Load를 기반으로 데이터를 적재합니다. Exactly-Once 처리를 보장하려면 각 트랜잭션에 고유한 Label이 필요합니다. Label이 중복되면 데이터 적재 시 충돌이 발생합니다.

**Q3: `fenodes`에는 어떤 포트를 사용해야 하나요?**

`fenodes`에는 Doris FE의 **HTTP 포트**(기본값 `8030`)를 지정해야 하며, MySQL 프로토콜 포트(기본값 `9030`)를 지정하면 안 됩니다.

**Q4: MySQL이나 Oracle 같은 데이터베이스의 데이터를 Doris로 동기화하려면 어떻게 해야 하나요?**

Flink CDC와 함께 사용하면 됩니다. 자세한 내용은 [Flink-Doris-Connector](../../../connection-integration/data-integration/flink-doris-connector.md) 문서를 참조하세요.

## 관련 문서 {#related-documents}

- [Flink-Doris-Connector](../../../connection-integration/data-integration/flink-doris-connector.md)
