---
{
    "title": "Doris에 데이터 쓰기",
    "language": "ko",
    "description": "Flink Doris Connector의 Stream Load를 통해 Doris에 데이터를 쓰는 방법을 설명합니다. 스트리밍 및 배치 쓰기 모드, S3 TVF 쓰기, 부분 컬럼 업데이트, Bitmap 데이터 적재, 지정된 컬럼을 기준으로 한 삭제, Sink 옵션, 모니터링 메트릭을 다룹니다."
}
---

# Doris에 데이터 쓰기 {#writing-data-to-doris}

Flink Doris Connector는 Flink에서 데이터를 배치로 묶어 Stream Load를 통해 Doris에 씁니다. 이 페이지에서는 쓰기 모드, FlinkSQL을 사용한 쓰기, 일반적인 쓰기 시나리오, Sink 옵션을 설명합니다. DataStream API를 사용한 쓰기는 [DataStream API](./datastream-api.md#sink)를 참고하세요.

## 쓰기 모드 {#write-modes}

Flink Doris Connector는 데이터를 쓸 때 Flink 메모리에서 데이터를 배치로 묶은 다음 Stream Load를 통해 Doris에 일괄 적재합니다. Connector는 두 가지 배치 처리 모드를 제공하며, 기본값은 Flink Checkpoint를 기반으로 하는 스트리밍 쓰기입니다.

| 비교 항목 | 스트리밍 쓰기 | 배치 쓰기 |
| --------------------- | ---------------------------------------------------------------- | ------------------------------------------------------------ |
| 트리거 조건 | Flink Checkpoint에 의존하며 각 Checkpoint 주기마다 Doris에 기록 | Connector 내에서 시간 및 데이터 양의 임계값에 따라 주기적으로 커밋 |
| 일관성 | Exactly-Once | At-Least-Once. 기본 키 모델을 사용하면 Exactly-Once 보장 가능 |
| 지연 시간 | Checkpoint 간격의 제약을 받아 일반적으로 더 높음 | 독립적인 배치 처리 메커니즘으로 유연하게 조정 가능 |
| 내결함성 및 복구 | Flink 상태 복구와 완전히 일치 | 외부 중복 제거 로직에 의존(예: Doris 기본 키 중복 제거) |

- **스트리밍 쓰기**(기본값): Checkpoint를 활성화해야 합니다. 업스트림 데이터는 메모리에 보관되지 않고 Checkpoint 주기 내내 Doris에 지속적으로 기록되며, 두 단계 커밋으로 Exactly-Once를 보장합니다. 작업이 재시작되면 최신 Checkpoint/Savepoint에서 복구해야 합니다. 그렇지 않으면 레이블 중복 오류로 쓰기가 실패합니다([FAQ](./faq.md) 참고).
- **배치 쓰기**: Connector 1.5.0부터 지원됩니다. Checkpoint에 의존하지 않으며, 데이터를 메모리에 캐시한 뒤 `sink.buffer-flush.max-rows`, `sink.buffer-flush.max-bytes`, `sink.buffer-flush.interval`에 따라 플러시합니다. `'sink.enable.batch-mode' = 'true'`로 활성화합니다. Exactly-Once는 보장되지 않지만 Unique 모델을 사용하면 멱등성 있는 쓰기를 구현할 수 있습니다.

Stream Load 외에도 `'sink.write-mode' = 'TVF'`로 설정하여 먼저 S3 호환 객체 스토리지에 데이터를 임시 저장한 다음 S3 테이블 반환 함수를 통해 Doris에 적재할 수 있습니다. [S3 TVF로 쓰기](#tvf)를 참고하세요.

## FlinkSQL로 쓰기 {#flink-sql}

Flink의 [Datagen](https://nightlies.apache.org/flink/flink-docs-master/docs/connectors/table/datagen/)을 사용하여 업스트림에서 지속적으로 생성되는 데이터를 시뮬레이션합니다.

```sql
-- Enable checkpoint
SET 'execution.checkpointing.interval' = '30s';

CREATE TABLE student_source (
    id INT,
    name STRING,
    age INT
) WITH (
    'connector' = 'datagen',
    'rows-per-second' = '1',
    'fields.name.length' = '20',
    'fields.id.min' = '1',
    'fields.id.max' = '100000',
    'fields.age.min' = '3',
    'fields.age.max' = '30'
);

-- doris sink
CREATE TABLE student_sink (
    id INT,
    name STRING,
    age INT
)
WITH (
    'connector' = 'doris',
    'fenodes' = '10.16.10.6:28737',
    'table.identifier' = 'test.student',
    'username' = 'root',
    'password' = 'password',
    'sink.label-prefix' = 'doris_label'
    -- 'sink.enable.batch-mode' = 'true'  Add this configuration to use batch write
);

INSERT INTO student_sink SELECT * FROM student_source;
```

## S3 TVF로 쓰기 {#tvf}

TVF 쓰기 모드는 먼저 S3 객체 스토리지에 데이터를 JSON 형식으로 임시 저장한 다음 S3 테이블 반환 함수를 통해 Doris에 적재합니다. 객체 스토리지를 데이터 전송 경로로 우선 사용하거나 Stream Load 네트워크 경로를 사용할 수 없는 경우 이 모드를 사용합니다.

사용하기 전에 Flink와 Doris가 모두 S3에 접근할 수 있고, Doris에 대상 테이블이 이미 존재하는지 확인하세요.

```sql
SET 'execution.checkpointing.interval' = '30s';

CREATE TABLE student_tvf_sink (
    id INT,
    name STRING,
    age INT
) WITH (
    'connector' = 'doris',
    'fenodes' = '127.0.0.1:8030',
    'jdbc-url' = 'jdbc:mysql://127.0.0.1:9030',
    'table.identifier' = 'test.student_tvf',
    'username' = 'root',
    'password' = '',
    'sink.write-mode' = 'TVF',
    'sink.label-prefix' = 'student_tvf',
    'sink.s3.endpoint' = 'https://s3.example.com',
    'sink.s3.region' = 'us-east-1',
    'sink.s3.bucket' = 'staging-bucket',
    'sink.s3.prefix' = 'doris/student',
    'sink.s3.access-key' = 'access-key',
    'sink.s3.secret-key' = 'secret-key'
);

INSERT INTO student_tvf_sink VALUES (1, 'Alice', 18);
```

Connector는 S3에 임시 저장한 객체를 자동으로 삭제하지 않습니다. 필요에 따라 객체 스토리지의 수명 주기 정책을 설정하세요.

## 일반적인 쓰기 시나리오 {#common-write-scenarios}

### 부분 컬럼 업데이트 {#partial-column-update}

Stream Load 매개변수 `partial_columns`를 설정하여 부분 컬럼 업데이트를 활성화하고, `columns`에 업데이트할 컬럼을 나열합니다. 테이블 측 요구 사항은 [부분 컬럼 업데이트](../../../data-operate/update/partial-column-update.md)를 참고하세요.

```sql
CREATE TABLE doris_sink (
    id INT,
    name STRING,
    bank STRING,
    age int
)
WITH (
    'connector' = 'doris',
    'fenodes' = '127.0.0.1:8030',
    'table.identifier' = 'database.table',
    'username' = 'root',
    'password' = '',
    'sink.properties.format' = 'json',
    'sink.properties.read_json_by_line' = 'true',
    'sink.properties.columns' = 'id,name,bank,age', -- Columns to update
    'sink.properties.partial_columns' = 'true' -- Enable partial column update
);
```

### Bitmap 데이터 적재 {#bitmap}

정수 컬럼을 Bitmap으로 변환하려면 `to_bitmap` 함수를 `sink.properties.columns`에서 사용합니다.

```sql
CREATE TABLE bitmap_sink (
    dt int,
    page string,
    user_id int
)
WITH (
    'connector' = 'doris',
    'fenodes' = '127.0.0.1:8030',
    'table.identifier' = 'test.bitmap_test',
    'username' = 'root',
    'password' = '',
    'sink.label-prefix' = 'doris_label',
    'sink.properties.columns' = 'dt,page,user_id,user_id=to_bitmap(user_id)'
)
```

### 지정된 컬럼을 기준으로 데이터 삭제 {#delete-by-column}

Kafka 메시지는 특정 필드로 작업 유형을 표시하는 경우가 많습니다. 예를 들면 `{"op_type":"delete",data:{...}}`와 같습니다. 이러한 데이터에서는 `op_type=delete`인 레코드를 삭제해야 할 수 있습니다.

기본적으로 DorisSink는 RowKind를 기준으로 이벤트 유형을 구분합니다. CDC에서는 이벤트 유형을 직접 가져올 수 있으며, 숨겨진 컬럼 `__DORIS_DELETE_SIGN__`에 값을 할당하여 삭제를 수행합니다. Kafka의 경우 애플리케이션 로직에서 값을 결정한 뒤 숨겨진 컬럼에 명시적으로 전달해야 합니다.

```sql
-- For example, upstream data: {"op_type":"delete",data:{"id":1,"name":"zhangsan"}}
CREATE TABLE KAFKA_SOURCE(
    data STRING,
    op_type STRING
) WITH (
    'connector' = 'kafka',
    ...
);

CREATE TABLE DORIS_SINK(
    id INT,
    name STRING,
    __DORIS_DELETE_SIGN__ INT
) WITH (
    'connector' = 'doris',
    'fenodes' = '127.0.0.1:8030',
    'table.identifier' = 'db.table',
    'username' = 'root',
    'password' = '',
    'sink.enable-delete' = 'false',        -- false means do not get the event type from RowKind
    'sink.properties.columns' = 'id, name, __DORIS_DELETE_SIGN__'  -- Explicitly specify the import columns of Stream Load
);

INSERT INTO DORIS_SINK
SELECT json_value(data, '$.id') as id,
    json_value(data, '$.name') as name,
    if(op_type = 'delete', 1, 0) as __DORIS_DELETE_SIGN__
from KAFKA_SOURCE;
```

### CDC Changelog 데이터 쓰기 {#cdc-changelog}

업스트림 데이터가 Flink CDC 또는 Debezium 형식의 변경 데이터인 경우, DorisSink는 RowKind를 기준으로 삽입, 업데이트, 삭제 이벤트를 구분하며, 삭제 이벤트는 `sink.enable-delete`를 통해 Doris에 동기화됩니다(Unique 모델 필요). 전체 예제는 [전체 데이터베이스 동기화(Flink CDC)](./cdc-sync.md#single-table-sync)를 참고하세요. DataStream API에서는 `JsonDebeziumSchemaSerializer`를 사용하며, 자세한 내용은 [Debezium 형식](./datastream-api.md#debezium)을 참고하세요.

## 옵션 {#options}

다음은 Sink 옵션입니다. 일반 연결 옵션은 [연결 옵션 및 TLS](./connection.md#common-options)에 나와 있습니다.

| 키 | 기본값 | 필수 여부 | 설명 |
| --------------------------- | ------------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| sink.label-prefix | -- | Y | 데이터 적재에 사용하는 레이블 접두사입니다. 2PC 시나리오에서는 Flink EOS 시맨틱을 보장하기 위해 전역적으로 고유해야 합니다. |
| sink.properties.* | -- | N | Stream Load 데이터 적재 매개변수입니다. 예를 들어 `'sink.properties.column_separator' = ', '`는 컬럼 구분자를 정의하고, `'sink.properties.escape_delimiters' = 'true'`는 특수 문자를 구분자로 사용함을 나타내며, `\x01`은 바이너리 `0x01`로 변환됩니다. JSON 형식으로 데이터를 적재할 때는 `'sink.properties.format' = 'json'`, `'sink.properties.read_json_by_line' = 'true'`를 사용합니다. 자세한 매개변수는 [Stream Load](../../../data-operate/import/import-way/stream-load-manual.md#import-configuration-parameters)를 참고하세요. Group Commit 모드: `'sink.properties.group_commit' = 'sync_mode'`는 group commit을 동기 모드로 설정합니다. Flink Connector는 1.6.2부터 데이터 적재에 group commit을 설정하는 기능을 지원합니다. 자세한 사용법과 제한 사항은 [Group Commit](../../../data-operate/import/load-best-practices/group-commit-manual.md)을 참고하세요. 26.1.0부터 Stream Load에서 gz 압축이 기본적으로 활성화됩니다. `'sink.properties.compress_type' = ''`로 설정하면 비활성화할 수 있습니다. |
| sink.enable-delete | TRUE | N | 삭제를 활성화할지 여부입니다. 이 옵션을 사용하려면 Doris 테이블에서 배치 삭제가 활성화되어 있어야 하며(Doris 0.15+에서는 기본적으로 활성화됨), Unique 모델만 지원합니다. |
| sink.enable-2pc | TRUE | N | 두 단계 커밋(2pc)을 활성화할지 여부입니다. 기본값은 true이며 Exactly-Once 시맨틱을 보장합니다. 두 단계 커밋에 대한 자세한 내용은 [Stream Load 2PC](../../../data-operate/transaction.md#streamload-2pc)를 참고하세요. |
| sink.write-mode | STREAM_LOAD | N | 쓰기 모드입니다. 지원되는 값은 `STREAM_LOAD`, `STREAM_LOAD_BATCH`, `TVF`입니다. |
| sink.s3.endpoint | -- | TVF 쓰기 모드에서만 | S3 호환 객체 스토리지 엔드포인트입니다. |
| sink.s3.region | -- | TVF 쓰기 모드에서만 | 객체 스토리지 리전입니다. |
| sink.s3.bucket | -- | TVF 쓰기 모드에서만 | 파일을 임시 저장하는 버킷입니다. |
| sink.s3.prefix | -- | TVF 쓰기 모드에서만 | 임시 저장 파일의 객체 키 접두사입니다. 접두사에는 glob 문자를 포함할 수 없습니다. |
| sink.s3.access-key | -- | TVF 쓰기 모드에서만 | 객체 스토리지 액세스 키입니다. |
| sink.s3.secret-key | -- | TVF 쓰기 모드에서만 | 객체 스토리지 시크릿 키입니다. |
| sink.s3.path-style-access | FALSE | N | TVF 모드에서 path-style 객체 스토리지 접근을 사용할지 여부입니다. |
| sink.buffer-size | 1MB | N | 쓰기 데이터 캐시의 버퍼 크기이며, 단위는 바이트입니다. 변경하지 않는 것이 좋으며 기본 설정으로 충분합니다. |
| sink.buffer-count | 3 | N | 쓰기 데이터 캐시 버퍼의 개수입니다. 변경하지 않는 것이 좋으며 기본 설정으로 충분합니다. |
| sink.max-retries | 3 | N | Commit 실패 후 최대 재시도 횟수입니다. 기본값은 3입니다. |
| sink.enable.batch-mode | FALSE | N | 배치 모드로 Doris에 데이터를 쓸지 여부입니다. 활성화하면 쓰기 시점은 Checkpoint에 의존하지 않고 `sink.buffer-flush.max-rows`, `sink.buffer-flush.max-bytes`, `sink.buffer-flush.interval` 매개변수로 제어됩니다. 활성화하면 Exactly-Once 시맨틱이 더 이상 보장되지 않습니다. Unique 모델을 사용하면 멱등성을 구현할 수 있습니다. |
| sink.flush.queue-size | 2 | N | 배치 모드에서 캐시 큐의 크기입니다. |
| sink.buffer-flush.max-rows | 500000 | N | 배치 모드에서 단일 배치로 기록하는 최대 행 수입니다. |
| sink.buffer-flush.max-bytes | 100MB | N | 배치 모드에서 단일 배치로 기록하는 최대 바이트 수입니다. |
| sink.buffer-flush.interval | 10s | N | 배치 모드에서 캐시를 비동기적으로 플러시하는 간격입니다. |
| sink.ignore.update-before | TRUE | N | update-before 이벤트를 무시할지 여부입니다. 기본적으로 무시합니다. |

## 모니터링 메트릭 {#metrics}

Flink는 Flink 클러스터의 메트릭을 모니터링하기 위한 다양한 [메트릭](https://nightlies.apache.org/flink/flink-docs-master/docs/ops/metrics/#metrics)을 제공합니다. 다음은 Flink Doris Connector에서 새로 추가한 모니터링 메트릭입니다.

| 이름 | 메트릭 유형 | 설명 |
| ------------------------- | ----------- | ---------------------------------------------------- |
| totalFlushLoadBytes | Counter | 플러시되어 적재된 총 바이트 수입니다. |
| flushTotalNumberRows | Counter | 적재되어 처리된 총 행 수입니다. |
| totalFlushLoadedRows | Counter | 성공적으로 적재된 총 행 수입니다. |
| totalFlushTimeMs | Counter | 데이터 적재를 성공적으로 완료하는 데 걸린 총 시간입니다. |
| totalFlushSucceededNumber | Counter | 데이터 적재에 성공한 횟수입니다. |
| totalFlushFailedNumber | Counter | 데이터 적재에 실패한 횟수입니다. |
| totalFlushFilteredRows | Counter | 데이터 품질 기준을 충족하지 못한 총 행 수입니다. |
| totalFlushUnselectedRows | Counter | where 조건에 의해 필터링되어 제외된 총 행 수입니다. |
| beginTxnTimeMs | Histogram | FE에 트랜잭션 시작을 요청하는 데 걸린 시간이며, 단위는 밀리초입니다. |
| putDataTimeMs | Histogram | FE에 데이터 적재 실행 계획을 요청하여 가져오는 데 걸린 시간입니다. |
| readDataTimeMs | Histogram | 데이터를 읽는 데 걸린 시간입니다. |
| writeDataTimeMs | Histogram | 데이터 쓰기 작업을 수행하는 데 걸린 시간입니다. |
| commitAndPublishTimeMs | Histogram | FE에 트랜잭션 커밋 및 게시를 요청하는 데 걸린 시간입니다. |
| loadTimeMs | Histogram | 데이터 적재를 완료하는 데 걸린 시간입니다. |
