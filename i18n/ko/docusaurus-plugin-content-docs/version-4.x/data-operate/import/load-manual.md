---
{
    "title": "데이터 적재 개요",
    "language": "ko",
    "description": "실시간 쓰기, 스트리밍 동기화, 배치 데이터 적재, 외부 데이터 소스 통합의 네 가지 시나리오에 맞는 Apache Doris 데이터 적재 방식 선택 방법을 설명합니다.",
    "keywords": [
        "Doris 데이터 적재",
        "Stream Load",
        "Broker Load",
        "Routine Load",
        "INSERT INTO",
        "Group Commit",
        "Flink Doris Connector",
        "Kafka Connector",
        "Flink CDC",
        "Streaming Job",
        "연속 데이터 적재",
        "실시간 쓰기",
        "배치 데이터 적재",
        "Catalog 외부 데이터 소스"
    ]
}
---

<!-- Knowledge type: Architecture selection decision -->
<!-- Applicable scenario: Data load method selection / Data integration solution design -->

Apache Doris는 다양한 소스의 데이터를 데이터베이스에 쓸 수 있도록 여러 데이터 적재 및 통합 방식을 제공합니다. 이 문서에서는 일반적인 비즈니스 시나리오를 바탕으로 **실시간 쓰기**, **스트리밍 동기화**, **배치 데이터 적재**, **외부 데이터 소스 통합**의 네 가지 범주에서 가장 적합한 솔루션을 선택하는 방법을 설명합니다.

## 빠른 탐색 {#quick-navigation}

데이터 소스와 데이터 반영 주기 요구 사항에 따라 다음 표에서 권장 데이터 적재 방식을 빠르게 찾을 수 있습니다.

| 비즈니스 시나리오                                                | 데이터 소스                    | 권장 데이터 적재 방식                                                                                                                                                  |
| :--------------------------------------------------------------- | :----------------------------- | :----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 애플리케이션 실시간 쓰기(매우 적은 양, 5분마다) | JDBC 클라이언트                    | [JDBC INSERT](./import-way/insert-into-manual.md)                                                                                                                        |
| 애플리케이션의 높은 동시성 또는 고빈도 소규모 배치 쓰기 | JDBC / HTTP                    | [Group Commit](./load-best-practices/group-commit-manual.md) + JDBC INSERT 또는 Stream Load                                                                                |
| 애플리케이션 고처리량 쓰기                                | HTTP                           | [Stream Load](./import-way/stream-load-manual)                                                                                                                           |
| 실시간 데이터 스트림 수집                                  | Flink                          | [Flink Doris Connector](../../connection-integration/data-integration/flink-doris-connector.md)                                                                          |
| 실시간 메시지 큐 수집                                | Kafka                          | [Routine Load](./import-way/routine-load-manual.md) 또는 [Doris Kafka Connector](../../connection-integration/data-integration/doris-kafka-connector.md)                   |
| 트랜잭션 데이터베이스 실시간 동기화(외부 구성 요소 불필요)   | MySQL / PostgreSQL             | [Streaming Job 연속 데이터 적재](./import-way/streaming-job/continuous-load-overview.md)                                                                                  |
| 트랜잭션 데이터베이스 CDC 동기화                                  | MySQL / PostgreSQL 등       | [Flink CDC](../../connection-integration/data-integration/flink-doris-connector.md) 또는 [DataX](../../connection-integration/data-integration/datax.md)                   |
| 객체 스토리지 연속 데이터 적재(증분 파일 자동 데이터 적재) | S3                             | [Streaming Job 연속 데이터 적재](./import-way/streaming-job/continuous-load-overview.md)                                                                                  |
| 객체 스토리지 / HDFS 파일 배치 데이터 적재                            | S3 / OSS / HDFS                | [Broker Load](./import-way/broker-load-manual.md) 또는 [INSERT INTO SELECT](./import-way/insert-into-manual.md)                                                            |
| 로컬 파일 배치 데이터 적재                                            | 로컬 디스크                     | [Stream Load](./import-way/stream-load-manual) 또는 [Doris Streamloader](../../connection-integration/data-integration/doris-streamloader.md)                              |
| 외부 데이터 소스(데이터 레이크 / 외부 테이블) 쿼리 및 데이터 적재 | Hive / Iceberg / JDBC 등    | [Catalog](../../lakehouse/lakehouse-overview.md) + [INSERT INTO SELECT](./import-way/insert-into-manual.md)                                                              |

> Doris의 각 데이터 적재는 기본적으로 암시적 트랜잭션입니다. 트랜잭션에 관한 자세한 내용은 [트랜잭션](../transaction.md)을 참조하세요.

## 시나리오별 데이터 적재 방식 선택 {#choosing-a-load-method-by-scenario}

### 실시간 쓰기: 애플리케이션에서 직접 쓰기 {#real-time-write-direct-application-write}

<!-- Knowledge type: Operation steps -->

애플리케이션이 HTTP 또는 JDBC를 통해 Doris 테이블에 **데이터를 실시간으로 쓰는** 시나리오에 해당하며, 실시간 분석과 쿼리가 필요한 업무에서 주로 사용됩니다.

- **매우 적은 양의 데이터(약 5분에 한 번)**: [JDBC INSERT](./import-way/insert-into-manual.md)를 사용하여 데이터를 씁니다.
- **높은 동시성 또는 높은 빈도(동시 요청이 20개를 초과하거나 1분 이내에 여러 번 쓰는 경우)**: [Group Commit](./load-best-practices/group-commit-manual.md)을 활성화하고 JDBC INSERT 또는 Stream Load와 함께 사용합니다.
- **고처리량 쓰기**: [Stream Load](./import-way/stream-load-manual)를 사용하여 HTTP 프로토콜로 데이터를 씁니다.

### 스트리밍 동기화: 실시간 데이터 스트림 수집 {#streaming-sync-real-time-data-stream-ingestion}

<!-- Knowledge type: Architecture selection decision -->

실시간 데이터 스트림(예: Flink, Kafka 또는 트랜잭션 데이터베이스 CDC)을 통해 데이터를 Doris 테이블에 지속적으로 동기화하는 시나리오에 해당합니다.

1. **Flink 실시간 데이터 스트림**

    [Flink Doris Connector](../../connection-integration/data-integration/flink-doris-connector.md)를 사용하여 Flink 실시간 데이터 스트림을 Doris 테이블에 씁니다.

2. **Kafka 실시간 데이터 스트림**

    [Routine Load](./import-way/routine-load-manual.md)와 [Doris Kafka Connector](../../connection-integration/data-integration/doris-kafka-connector.md) 중에서 선택합니다. 두 방식의 차이는 다음과 같습니다.

    | 방식             | 데이터 흐름 방향                       | 지원 형식              |
    | :----------------- | :---------------------------------------- | :----------------------------- |
    | Routine Load       | Doris가 Kafka에서 데이터를 능동적으로 가져옴      | csv, json                      |
    | Kafka Connector    | Kafka가 Doris로 데이터를 능동적으로 전송함     | avro, json, csv, protobuf      |

3. **트랜잭션 데이터베이스 CDC 동기화**

    [Flink CDC](../../connection-integration/data-integration/flink-doris-connector.md) 또는 [DataX](../../connection-integration/data-integration/datax.md)를 사용하여 트랜잭션 데이터베이스의 CDC 데이터 스트림을 Doris에 씁니다.

4. **Streaming Job 연속 데이터 적재(외부 구성 요소 불필요)**

    Doris에 내장된 [Streaming Job](./import-way/streaming-job/continuous-load-overview.md)을 통해 **Flink나 Kafka 같은 외부 구성 요소에 의존하지 않고** MySQL, PostgreSQL, S3 등의 소스에서 데이터를 지속적으로 읽어 Doris에 쓸 수 있습니다. 다음 두 가지 동기화 방식을 지원합니다.

    | 동기화 방식              | 기반 메커니즘                       | 테이블 자동 생성 | 처리 보장 수준 | 일반적인 시나리오                                                       |
    | :----------------------- | :----------------------------------------- | :------------------ | :----------------- | :--------------------------------------------------------------------- |
    | SQL Mapping Sync         | Job + TVF (INSERT INTO SELECT)             | 사전 생성 필요 | exactly-once       | 컬럼 선택, 필드 이름 변경, 타입 변환 또는 조건 필터링이 필요한 경우 |
    | Auto Table Creation Sync | Job + 데이터베이스 전체에 대한 네이티브 DDL            | 첫 실행 시 자동 생성 | at-least-once | 전체 데이터베이스 또는 테이블 그룹을 미러 복제하며, 다운스트림 테이블 스키마가 업스트림을 자동으로 따르는 경우 |

### 배치 데이터 적재: 외부 스토리지의 파일 데이터 적재 {#batch-load-loading-files-from-external-storage}

<!-- Knowledge type: Operation steps -->

객체 스토리지, HDFS, 로컬 파일, NAS 등 외부 스토리지 시스템의 파일을 Doris 테이블에 **배치로 데이터 적재**하는 비실시간 시나리오에 해당합니다.

- **객체 스토리지 / HDFS 파일**: [Broker Load](./import-way/broker-load-manual.md)를 사용하여 Doris에 데이터를 씁니다.
- **객체 스토리지 / HDFS / NAS 파일(동기식 또는 비동기식)**: 동기식 쓰기에는 [INSERT INTO SELECT](./import-way/insert-into-manual.md)를 사용합니다. 비동기식으로 실행하려면 [JOB](../../admin-manual/workload-management/job-scheduler) 스케줄링과 함께 사용합니다.
- **로컬 파일**: [Stream Load](./import-way/stream-load-manual) 또는 [Doris Streamloader](../../connection-integration/data-integration/doris-streamloader)를 사용하여 Doris에 데이터를 씁니다.

### 외부 데이터 소스 통합: Catalog 연합 쿼리 및 데이터 적재 {#external-data-source-integration-catalog-federated-query-and-load}

<!-- Knowledge type: Architecture selection decision -->

Hive, JDBC, Iceberg 등의 외부 데이터 소스와 통합하여 외부 데이터를 쿼리하고, Doris 테이블에 **필요에 따라 데이터 적재**하는 시나리오에 해당합니다.

- [Catalog](../../lakehouse/lakehouse-overview.md)를 생성하여 외부 데이터 소스에서 데이터를 읽습니다.
- [INSERT INTO SELECT](./import-way/insert-into-manual.md)를 사용하여 외부 데이터 소스의 데이터를 Doris에 동기식으로 씁니다. 비동기식으로 실행하려면 [JOB](../../admin-manual/workload-management/job-scheduler) 스케줄링과 함께 사용합니다.

## 데이터 적재 중 부분 컬럼 업데이트 {#partial-column-update-during-load}

<!-- Knowledge type: Configuration parameters -->

Doris는 데이터 적재 중 **부분 컬럼 업데이트**를 지원하므로, 모든 컬럼의 값을 제공하지 않고도 테이블의 특정 컬럼만 업데이트할 수 있습니다. 이 기능은 특히 다음과 같은 시나리오에서 유용합니다.

- 컬럼 수가 많은 테이블에서 소수의 필드 업데이트
- 증분 업데이트 수행(부분 컬럼에 대한 Upsert)

Unique Key 테이블과 Aggregate 테이블에서 부분 컬럼 업데이트를 수행하는 방법은 [컬럼 업데이트](../update/partial-column-update.md)를 참조하세요.

## 데이터 적재 방식 개요 {#load-method-overview}

Doris의 데이터 적재에는 데이터 소스, 데이터 형식, 데이터 적재 방식, 오류 데이터 처리, 데이터 변환, 트랜잭션 등 여러 측면이 포함됩니다. 다음 표는 각 방식에 적합한 시나리오, 지원 파일 형식, 데이터 적재 모드를 요약합니다.

| 데이터 적재 방식                                              | 사용 사례                                              | 지원 파일 형식   | 데이터 적재 모드    |
| :------------------------------------------------------- | :---------------------------------------------------- | :----------------------- | :----------- |
| [Stream Load](./import-way/stream-load-manual)           | 로컬 파일 데이터 적재 또는 애플리케이션 쓰기             | csv, json, parquet, orc  | 동기식  |
| [Broker Load](./import-way/broker-load-manual.md)        | 객체 스토리지, HDFS 등에서 데이터 적재               | csv, json, parquet, orc  | 비동기식 |
| [INSERT INTO VALUES](./import-way/insert-into-manual.md) | JDBC 등의 인터페이스를 통한 데이터 적재               | SQL                      | 동기식  |
| [INSERT INTO SELECT](./import-way/insert-into-manual.md) | 외부 테이블, 객체 스토리지 또는 HDFS에서 데이터 적재 | SQL                      | 동기식  |
| [Routine Load](./import-way/routine-load-manual.md)      | Kafka에서 실시간 데이터 적재                          | csv, json                | 비동기식 |
| [MySQL Load](./import-way/mysql-load-manual.md)          | 로컬 데이터 적재                               | csv                      | 동기식  |
| [Group Commit](./load-best-practices/group-commit-manual.md) | 고빈도 소규모 배치 데이터 적재                | 사용하는 데이터 적재 방식에 따라 다름 | -      |
| [Streaming Job](./import-way/streaming-job/continuous-load-overview.md) | MySQL, PostgreSQL, S3 등의 소스에서 연속 데이터 적재 | 데이터 소스에 따라 다름 | 비동기식 |

## 자주 묻는 질문 {#faq}

<!-- Knowledge type: FAQ -->
<!-- Applicable scenario: Load method selection / Troubleshooting -->

**Q1: 동시성이 높은 소규모 배치 쓰기에는 어떤 데이터 적재 방식을 선택해야 하나요?**

[Group Commit](./load-best-practices/group-commit-manual.md)을 활성화하고 JDBC INSERT 또는 Stream Load와 함께 사용하세요. 동시 요청이 20개를 초과하거나 1분 이내에 여러 번 쓰기가 발생하는 경우 Group Commit으로 데이터 적재 부하를 크게 줄일 수 있습니다.

**Q2: Routine Load와 Doris Kafka Connector의 차이점은 무엇인가요?**

- Routine Load: Doris가 Kafka에서 데이터를 **능동적으로 가져오는** 작업을 스케줄링합니다. csv와 json 형식을 지원합니다.
- Doris Kafka Connector: Kafka가 Doris로 데이터를 **능동적으로 전송합니다**. avro, json, csv, protobuf 형식을 지원합니다.

**Q3: 로컬 파일을 Doris에 데이터 적재하려면 어떻게 해야 하나요?**

[Stream Load](./import-way/stream-load-manual)(중소형 파일에 적합) 또는 [Doris Streamloader](../../connection-integration/data-integration/doris-streamloader.md)(대용량 파일의 배치 처리 시나리오에 적합)를 사용할 수 있습니다.

**Q4: Hive나 Iceberg 같은 외부 데이터 소스의 데이터를 Doris에 데이터 적재할 수 있나요?**

네. 먼저 [Catalog](../../lakehouse/lakehouse-overview.md)를 통해 외부 데이터 소스에 연결한 다음, [INSERT INTO SELECT](./import-way/insert-into-manual.md)를 사용하여 데이터를 Doris에 동기식으로 씁니다. 비동기식으로 실행하려면 [JOB](../../admin-manual/workload-management/job-scheduler) 스케줄링과 함께 사용합니다.

**Q5: 데이터 적재 시 트랜잭션이 보장되나요?**

네. Doris의 각 데이터 적재는 기본적으로 암시적 트랜잭션입니다. 자세한 내용은 [트랜잭션](../transaction.md)을 참조하세요.

**Q6: Streaming Job과 Flink CDC 중에서 어떻게 선택해야 하나요?**

- **Streaming Job**: **Flink나 Kafka 같은 외부 구성 요소에 의존하지 않는** Doris 내장 기능입니다. MySQL과 PostgreSQL에 대해 SQL Mapping Sync와 Auto Table Creation Sync를 지원하며, S3의 연속 데이터 적재도 지원합니다. Auto Table Creation Sync는 다운스트림 테이블을 자동으로 생성하고, SQL Mapping Sync는 exactly-once 시맨틱을 제공하며 SQL 처리를 지원합니다.
- **Flink CDC**: Flink 클러스터를 배포해야 합니다. 이미 Flink 스트림 처리 시스템을 사용하고 있거나, 복잡한 ETL 처리가 필요하거나, 여러 대상으로 동기화해야 하는 시나리오에 적합합니다.

MySQL 또는 PostgreSQL 데이터를 Doris에 지속적으로 동기화하기만 하면 되고 외부 스트림 처리가 필요하지 않다면 **Streaming Job을 우선 선택하세요**. 자세한 내용은 [연속 데이터 적재 개요](./import-way/streaming-job/continuous-load-overview.md)를 참조하세요.
