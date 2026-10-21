---
{
    "title": "데이터 적재 FAQ",
    "language": "ko",
    "description": "문제 설명: 데이터 적재 중 데이터 품질 오류가 발생합니다."
}
---

## 일반적인 데이터 적재 FAQ {#general-load-faq}

### 오류 "[DATA_QUALITY_ERROR] Encountered unqualified data" {#error-data_quality_error-encountered-unqualified-data}
**문제 설명**: 데이터 적재 중 데이터 품질 오류가 발생합니다.

**해결 방법**:
- Stream Load와 Insert Into 작업은 오류 URL을 반환하며, Broker Load의 경우 `Show Load` 명령으로 오류 URL을 확인할 수 있습니다.
- 브라우저나 curl 명령으로 오류 URL에 접속하여 데이터 품질 오류의 구체적인 원인을 확인합니다.
- strict_mode와 max_filter_ratio 매개변수로 허용 가능한 오류 비율을 제어합니다.

### 오류 "[E-235] Failed to init rowset builder" {#error-e-235-failed-to-init-rowset-builder}
**문제 설명**: 데이터 적재 빈도가 너무 높아 데이터가 제때 compaction되지 않으면 버전 수 한도를 초과하여 -235 오류가 발생합니다.

**해결 방법**:
- 데이터 적재 배치 크기를 늘리고 적재 빈도를 줄입니다.
- `max_tablet_version_num` 매개변수 값을 `be.conf`에서 늘립니다. 5000을 초과하지 않는 것이 좋습니다.

### 오류 "[E-238] Too many segments in rowset" {#error-e-238-too-many-segments-in-rowset}
**문제 설명**: 단일 rowset에 포함된 segment 수가 한도를 초과하면 -238 오류가 발생합니다.

**일반적인 원인**:
- 테이블 생성 시 설정한 버킷 수가 너무 적습니다.
- 데이터 쏠림이 발생합니다. 데이터를 더 균등하게 분산할 수 있는 버킷 키를 사용하는 것을 고려하세요.

### 오류 "Transaction commit successfully, BUT data will be visible later" {#error-transaction-commit-successfully-but-data-will-be-visible-later}
**문제 설명**: 데이터 적재는 성공했지만 일시적으로 데이터가 보이지 않습니다.

**원인**: 일반적으로 시스템 리소스 부족으로 트랜잭션 publish가 지연되어 발생합니다.

### 오류 "Failed to commit kv txn [...] Transaction exceeds byte limit" {#error-failed-to-commit-kv-txn--transaction-exceeds-byte-limit}
**문제 설명**: shared-nothing 모드에서 단일 데이터 적재에 너무 많은 파티션과 tablet이 포함되어 트랜잭션 크기 한도를 초과합니다.

**해결 방법**:
- 데이터를 파티션별로 나누어 배치로 적재하여 단일 데이터 적재에 포함되는 파티션 수를 줄입니다.
- 테이블 구조를 최적화하여 파티션과 tablet 수를 줄입니다.

### CSV 파일의 마지막 열에 불필요한 "\r"이 포함됨 {#extra-r-in-the-last-column-of-csv-file}
**문제 설명**: 일반적으로 Windows 줄바꿈 문자로 인해 발생합니다.

**해결 방법**:
올바른 줄 구분자를 지정합니다: `-H "line_delimiter:\r\n"`

### 따옴표가 포함된 CSV 데이터를 가져오면 null로 변환됨 {#csv-data-with-quotes-imported-as-null}
**문제 설명**: 따옴표가 포함된 CSV 데이터를 가져온 후 값이 null로 변환됩니다.

**해결 방법**:
`trim_double_quotes` 매개변수를 사용하여 필드를 둘러싼 큰따옴표를 제거합니다.

## Stream Load {#stream-load}

### 데이터 적재 속도가 느린 원인 {#reasons-for-slow-loading}
- CPU, IO, 메모리 또는 네트워크 카드 리소스의 병목 현상.
- 클라이언트 머신과 BE 머신 간의 느린 네트워크. 클라이언트에서 BE 머신으로 ping을 보내 지연 시간을 확인하면 일차적으로 진단할 수 있습니다.
- Webserver 스레드 수 병목 현상. 단일 BE에서 동시 Stream Load 수가 너무 많으면(be.conf의 webserver_num_workers 설정을 초과하면) 스레드 수 병목 현상이 발생할 수 있습니다.
- Memtable Flush 스레드 수 병목 현상. BE 메트릭인 doris_be_flush_thread_pool_queue_size를 확인하여 대기열 적체가 심한지 살펴봅니다. be.conf의 flush_thread_num_per_store 매개변수 값을 늘려 해결할 수 있습니다.

### 열 이름에 포함된 특수 문자 처리 {#handling-special-characters-in-column-names}
열 이름에 특수 문자가 포함된 경우 백틱과 작은따옴표를 사용하여 columns 매개변수를 지정합니다:
```shell
curl --location-trusted -u root:"" \
    -H 'columns:`@coltime`,colint,colvar' \
    -T a.csv \
    -H "column_separator:," \
    http://127.0.0.1:8030/api/db/loadtest/_stream_load
```

### Kafka Connect 또는 Confluent를 통한 데이터 적재 시 작은 배치 문제 {#small-batches-when-loading-through-kafka-connect-or-confluent}

Doris Kafka Connector 작업이 작은 Stream Load 요청을 자주 전송한다면 작업의 버퍼 설정을 확인하세요. 예를 들어 기존 설정이 `buffer.count.records=10000` 및 `buffer.size.bytes=5000000`이라면 더 큰 배치로 테스트해 보세요:

```properties
buffer.count.records=50000
buffer.size.bytes=104857600
```

이 옵션은 일반적인 Confluent 설정이 아닌 Doris Kafka Connector 옵션입니다. 배치의 레코드 수와 바이트 크기 임계값을 제어합니다. 버퍼를 늘리면 데이터 적재 요청 수를 줄일 수 있지만 Kafka Connect 작업에 더 많은 메모리가 필요하고 지연 시간이 늘어날 수 있습니다. 두 크기 임계값 중 어느 것에도 도달하기 전에 배치를 플러시할 수 있는 `buffer.flush.time`도 확인하세요. 사용하는 Connector 버전의 옵션과 기본값은 [Doris Kafka Connector](../connection-integration/data-integration/doris-kafka-connector.md)에서 확인하세요.

## Routine Load {#routine-load}

### 주요 버그 수정 {#major-bug-fixes}

| 문제 설명 | 발생 조건 | 영향 범위 | 임시 해결 방법 | 영향받는 버전 | 수정 버전 | 수정 PR |
|------------------|-------------------|--------------|-------------------|------------------|----------------|---------|
| 하나 이상의 작업에서 Kafka 연결 시간이 초과되면 다른 작업의 데이터 적재에도 영향을 주어 전체 Routine Load 데이터 적재 속도가 느려집니다. | 하나 이상의 작업에서 Kafka 연결 시간이 초과되는 경우. | Shared-nothing 및 shared-storage | 해당 작업을 중지하거나 수동으로 일시 중지하여 문제를 해결합니다. | <2.1.9 <3.0.5 | 2.1.9 3.0.5 | [#47530](https://github.com/apache/doris/pull/47530) |
| FE Master를 재시작한 후 사용자 데이터가 손실될 수 있습니다. | 작업의 offset이 OFFSET_END로 설정된 상태에서 FE를 재시작하는 경우. | Shared-storage | 소비 모드를 OFFSET_BEGINNING으로 변경합니다. | 3.0.2-3.0.4 | 3.0.5 | [#46149](https://github.com/apache/doris/pull/46149) |
| 데이터 적재 중 작은 트랜잭션이 대량으로 생성되어 compaction이 실패하고 -235 오류가 계속 발생합니다. | Doris의 데이터 소비 속도가 너무 빠르거나 Kafka 데이터가 작은 배치로 유입되는 경우. | Shared-nothing 및 shared-storage | Routine Load 작업을 일시 중지하고 다음 명령을 실행합니다: `ALTER ROUTINE LOAD FOR jobname FROM kafka ("property.enable.partition.eof" = "false");` | <2.1.8 <3.0.4 | 2.1.8 3.0.4 | [#45528](https://github.com/apache/doris/pull/45528), [#44949](https://github.com/apache/doris/pull/44949), [#39975](https://github.com/apache/doris/pull/39975) |
| Kafka 서드파티 라이브러리의 소멸자가 멈추어 데이터 소비가 실패합니다. | Kafka 토픽이 삭제되는 경우(다른 조건에서도 발생할 수 있음). | Shared-nothing 및 shared-storage | 모든 BE 노드를 재시작합니다. | <2.1.8 <3.0.4 | 2.1.8 3.0.4 | [#44913](https://github.com/apache/doris/pull/44913) |
| Routine Load 스케줄링이 멈춥니다. | FE가 Meta Service에서 트랜잭션을 중단할 때 시간 초과가 발생하는 경우. | Shared-storage | FE 노드를 재시작합니다. | <3.0.2 | 3.0.2 | [#41267](https://github.com/apache/doris/pull/41267) |
| Routine Load 재시작 문제. | BE 노드를 재시작하는 경우. | Shared-nothing 및 shared-storage | 작업을 수동으로 재개합니다. | <2.1.7 <3.0.2 | 2.1.7 3.0.2 | [#40728](https://github.com/apache/doris/pull/40728) |

### 기본 설정 최적화 {#default-configuration-optimizations}

| 최적화 내용 | 적용 버전 | 관련 PR |
|---------------------|------------------|------------------|
| Routine Load의 시간 초과 시간을 늘렸습니다. | 2.1.7 3.0.3 | [#42042](https://github.com/apache/doris/pull/42042), [#40818](https://github.com/apache/doris/pull/40818) |
| `max_batch_interval`의 기본값을 조정했습니다. | 2.1.8 3.0.3 | [#42491](https://github.com/apache/doris/pull/42491) |
| `max_batch_interval`에 대한 제한을 제거했습니다. | 2.1.5 3.0.0 | [#29071](https://github.com/apache/doris/pull/29071) |
| `max_batch_rows`와 `max_batch_size`의 기본값을 조정했습니다. | 2.1.5 3.0.0 | [#36632](https://github.com/apache/doris/pull/36632) |

### 관측 가능성 최적화 {#observability-optimizations}

| 최적화 내용 | 적용 버전 | 관련 PR |
|---------------------|------------------|------------------|
| 관측 가능성 관련 메트릭을 추가했습니다. | 3.0.5 | [#48209](https://github.com/apache/doris/pull/48209), [#48171](https://github.com/apache/doris/pull/48171), [#48963](https://github.com/apache/doris/pull/48963) |

### 오류 "failed to get latest offset" {#error-failed-to-get-latest-offset}
**문제 설명**: Routine Load가 최신 Kafka offset을 가져오지 못합니다.

**일반적인 원인**:
- 일반적으로 Kafka와의 네트워크 연결 문제로 인해 발생합니다. Kafka 도메인 이름에 ping을 보내거나 telnet으로 연결을 테스트하여 확인합니다.
- 서드파티 라이브러리 버그로 인한 시간 초과. 오류: java.util.concurrent.TimeoutException: Waited X seconds

### 오류 "failed to get partition meta: Local:'Broker transport failure" {#error-failed-to-get-partition-meta-localbroker-transport-failure}
**문제 설명**: Routine Load가 Kafka Topic Partition Meta를 가져오지 못합니다.

**일반적인 원인**:
- 일반적으로 Kafka와의 네트워크 연결 문제로 인해 발생합니다. Kafka 도메인 이름에 ping을 보내거나 telnet으로 연결을 테스트하여 확인합니다.
- 도메인 이름을 사용하는 경우 /etc/hosts에 도메인 이름 매핑을 설정해 보세요.

### 오류 "Broker: Offset out of range" {#error-broker-offset-out-of-range}
**문제 설명**: 소비하려는 offset이 Kafka에 존재하지 않습니다. Kafka에서 이미 정리했을 수 있습니다.

**해결 방법**:
- 데이터를 소비할 새로운 offset을 지정해야 합니다. 예를 들어 offset을 OFFSET_BEGINNING으로 설정합니다.
- 데이터 적재 속도에 맞게 log.retention.hours, log.retention.bytes 등의 Kafka 로그 정리 매개변수를 적절히 설정해야 합니다.
