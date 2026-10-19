---
{
    "title": "Doris Binlog를 사용한 증분 읽기",
    "language": "ko",
    "description": "Flink Doris Connector를 통해 ROW 형식 Binlog가 활성화된 Doris 테이블의 행 수준 변경 사항을 지속적으로 읽는 방법을 설명합니다. 시작 모드, 변경 유형, 전달 보장, 오프셋 테이블 및 옵션을 다룹니다."
}
---

# Doris Binlog를 사용한 증분 읽기 {#incremental-reading-with-doris-binlog}

ROW 형식 Binlog가 활성화된 Doris 테이블에서는 Flink Doris Connector를 통해 행 수준 변경 사항을 지속적으로 읽을 수 있습니다. `initial` 모드에서는 Connector가 먼저 현재 테이블의 스냅샷을 읽은 다음 증분 읽기로 전환합니다. 이 전환에 필요한 변경 사항은 소스 테이블의 Binlog 보존 기간 내에 남아 있어야 합니다.

:::info 버전 요구 사항
이 기능을 사용하려면 Flink Doris Connector 26.3.0 이상 및 Doris 5.0.0 이상이 필요합니다. Row Binlog는 Doris 5.0.0의 실험적 기능이며, FE 구성에서 `enable_feature_binlog = true`로 활성화해야 합니다. 테이블에서 활성화하는 방법, 지원되는 테이블 모델 및 제약 사항은 [Row Binlog](../../../data-operate/incremental/row-binlog.md)를 참조하세요.
:::

## 예제 {#example}

먼저 Doris 소스 테이블에서 행 형식 Binlog를 활성화합니다. 소비자가 업데이트된 행의 before-image를 필요로 하는 경우 `binlog.need_historical_value`가 필요합니다.

```sql
CREATE DATABASE IF NOT EXISTS test;

CREATE TABLE test.student_binlog_source (
    id INT,
    name VARCHAR(50),
    age INT
)
UNIQUE KEY(id)
DISTRIBUTED BY HASH(id) BUCKETS 1
PROPERTIES (
    "replication_num" = "1",
    "binlog.enable" = "true",
    "binlog.format" = "ROW",
    "binlog.need_historical_value" = "true",
    "binlog.ttl_seconds" = "86400"
);

INSERT INTO test.student_binlog_source VALUES (1, 'Alice', 18);
```

그런 다음 Flink Checkpoint를 활성화하고 Doris 소스 테이블을 생성합니다.

```sql
SET 'execution.checkpointing.interval' = '10s';

CREATE TABLE student_binlog (
    id INT,
    name STRING,
    age INT,
    PRIMARY KEY (id) NOT ENFORCED
) WITH (
    'connector' = 'doris',
    'fenodes' = '127.0.0.1:8030',
    'table.identifier' = 'test.student_binlog_source',
    'username' = 'root',
    'password' = '',
    'source.scan.mode' = 'initial'
);

SELECT * FROM student_binlog;
```

## 시작 모드 {#scan-mode}

작업이 시작되면 `test.student_binlog_source`의 변경 사항이 Flink changelog 레코드로 지속적으로 출력됩니다. `source.scan.mode`로 시작 모드를 선택합니다.

| 모드 | 동작 |
| ---- | -------- |
| `snapshot` | 현재 스냅샷을 읽고 중지합니다. 기본 모드입니다. |
| `initial` | 현재 스냅샷을 읽고, 스냅샷 읽기가 완료되면 지속적인 Binlog 읽기로 전환합니다. |
| `latest` | 스냅샷을 건너뛰고 작업 시작 이후에 생성된 변경 사항을 읽습니다. |
| `from-timestamp` | 스냅샷을 건너뛰고 `source.scan.timestamp`에 `yyyy-MM-dd HH:mm:ss` 형식으로 지정된 시각부터 해당 시각을 포함하여 변경 사항을 읽습니다. |

Flink Checkpoint 또는 Savepoint에서 복원하면 Connector는 저장된 소비 상태에서 다시 시작합니다. `source.scan.mode` 또는 `source.scan.timestamp`를 변경해도 해당 상태는 초기화되지 않습니다. 복원된 오프셋과 `from-timestamp` 시작 지점 모두 소스 테이블의 `binlog.ttl_seconds`에 따른 만료 규칙이 적용됩니다. 아래의 만료 시 동작을 참조하세요.

## 변경 유형 {#increment-type}

기본적으로 Connector는 `detail` 모드에서 전체 행 변경 내용을 출력합니다. 최소 변경 집합을 출력하려면 `source.binlog.increment-type`을 `min_delta`로, 추가 이벤트만 출력하려면 `append_only`로 설정합니다.

Connector는 Doris `@incr` 쿼리를 통해 변경 사항을 읽습니다. 요청된 시작 지점이 `binlog.ttl_seconds`에 따라 만료된 경우, 변경 유형에 따라 동작이 달라집니다.

| 변경 유형 | 시작 지점이 만료되었을 때의 동작 |
| ---- | ---- |
| `detail`(기본값), `append_only` | Doris가 실제 시작 지점을 보관된 첫 번째 TSO로 이동하고 만료된 변경 사항을 건너뜁니다. 작업은 만료 오류 없이 계속될 수 있지만, 해당 변경 사항은 출력에서 누락됩니다. |
| `min_delta` | 불완전한 순 변경 내용을 반환하는 대신 `Row binlog offset has expired according to binlog.ttl_seconds` 오류와 함께 읽기가 실패합니다. |

이 규칙은 정상적인 소비 중, 초기 스냅샷 이후, 저장된 상태에서 복원할 때 모두 적용됩니다. 작업이 실행 중이거나 Checkpoint가 성공했다고 해서 변경 사항이 전혀 만료되지 않았다는 뜻은 아닙니다. `source.binlog.visible-wait-timeout`은 만료 오류에 대한 재시도를 수행하지 않습니다.

## 참고 사항 {#notes}

- 증분 읽기는 Arrow Flight SQL을 사용합니다. Connector는 기본적으로 이를 활성화하고 포트를 자동으로 검색합니다.
- Flink Checkpoint를 활성화하세요.
- Doris의 `binlog.ttl_seconds` 기본값은 `86400`초(하루)이며, `0`보다 커야 합니다. 만료는 Flink 작업이나 해당 Checkpoint를 기다리지 않습니다. TTL을 늘려도 물리적으로 정리된 레코드는 복원할 수 없습니다.
- 초기 스냅샷에 걸리는 시간, 소비 백로그, 장애 복구 후 밀린 변경 사항을 따라잡는 데 필요한 시간을 모두 포함하고 추가 여유도 확보하도록 TTL을 설정하세요. 이전 Checkpoint 또는 Savepoint에서 복원할 때를 포함하여, 작업에 여전히 필요한 가장 오래된 변경 사항이 생성된 후 얼마나 지났는지 모니터링하세요.
- 자동으로 물리적 정리가 수행되도록 하려면 BE에서도 `enable_feature_binlog = true`를 활성화하고 자동 compaction을 활성 상태로 유지하세요. 증분 쿼리는 물리적 정리가 완료되기 전에도 만료된 레코드를 필터링합니다. [Row Binlog 보존 및 정리](../../../data-operate/incremental/row-binlog.md#retention-and-cleanup)를 참조하세요.
- Binlog 증분 읽기를 수행할 때 Doris는 읽기 구간 내에서 소스 테이블에 영향을 주는 진행 중인 트랜잭션이 완료될 때까지 기다립니다. 대기 시간이 초과되면 읽기가 오류를 반환합니다. Connector는 이 오류에 대해서만 동일한 구간을 최대 `source.binlog.visible-wait-timeout`(기본값: `5m`) 동안 재시도합니다. Connector의 재시도를 비활성화하려면 이 값을 `0s`로 설정하세요. 다른 오류는 즉시 실패합니다.

### Binlog 만료 후 복구 {#binlog-expiration-recovery}

필요한 변경 사항이 만료된 경우 기존 오프셋으로는 완전한 증분 복구를 수행할 수 없습니다. 다운스트림 데이터를 현재 소스 테이블과 일관되게 유지해야 하는 작업이라면, 만료된 Checkpoint 또는 Savepoint를 복원하지 않고 `source.scan.mode = 'initial'`로 새 부트스트랩을 시작한 다음 새 스냅샷으로 다운스트림 데이터를 다시 구축하세요. 이전 상태를 복원하면서 `initial`을 설정하면 새 전체 스냅샷을 시작하는 대신 저장된 상태에서 다시 시작합니다.

새 스냅샷은 현재 테이블 상태를 다시 구축하지만, 만료된 과거 이벤트를 재현할 수는 없습니다. `latest` 또는 더 최근 시각의 `from-timestamp`로 시작하는 경우에도 누락된 구간을 건너뜁니다. 해당 구간을 건너뛰어도 괜찮거나 누락된 데이터를 별도로 복구한 경우에만 이 모드를 사용하세요.

## 전달 보장 및 중복 제거 {#delivery}

Doris Binlog Source는 필요한 모든 변경 레코드가 Doris에 보관되어 있는 동안 at-least-once 전달을 보장합니다. 장애 후 변경 이벤트가 재생될 수 있으며, 이로 인해 Flink 쿼리 결과가 영향을 받을 수 있습니다. Flink의 CDC 이벤트 중복 제거는 기본적으로 비활성화되어 있습니다. 이를 사용하려면 쿼리를 제출하기 전에 다음 옵션을 설정하세요.

```sql
SET 'table.exec.source.cdc-events-duplicate' = 'true';
```

이 옵션을 활성화하면 위 예제와 같이 소스 테이블에 기본 키를 선언해야 합니다. Flink는 상태를 유지하는 추가 연산자를 사용하여 changelog를 정규화합니다. 자세한 내용은 [Flink 구성 참조](https://nightlies.apache.org/flink/flink-docs-release-2.3/zh/docs/dev/table/config/#table-exec-source-cdc-events-duplicate)를 참조하세요.

Checkpoint는 소비 상태를 저장하고, CDC 중복 제거는 재생된 이벤트를 처리합니다. 어느 쪽도 Doris Binlog의 만료를 방지하거나 만료로 이미 유실된 이벤트를 복구하지는 못합니다.

## Doris에 소비 진행 상황 기록(선택 사항) {#offset-table}

소비 진행 상황은 Flink Checkpoint 상태에 저장됩니다. 선택 사항인 오프셋 테이블은 완료된 Checkpoint에 반영된 진행 상황을 관찰하는 용도로만 사용됩니다. Connector는 작업을 시작하거나 재시작할 때 이 테이블을 읽어 자동으로 소비를 재개하지 않습니다.

Doris에서 소비 진행 상황을 쿼리하려면 다음 오프셋 테이블을 생성하세요.

```sql
CREATE DATABASE IF NOT EXISTS ops;

CREATE TABLE ops.flink_source_offsets (
    consumer_id VARCHAR(256) NOT NULL,
    offset_timestamp DATETIME NOT NULL,
    update_time DATETIMEV2(3) NOT NULL
)
UNIQUE KEY(consumer_id)
DISTRIBUTED BY HASH(consumer_id) BUCKETS 1
PROPERTIES (
    "replication_num" = "1"
);
```

```sql
'jdbc-url' = 'jdbc:mysql://127.0.0.1:9030',
'source.binlog.offset-table' = 'ops.flink_source_offsets',
'source.binlog.consumer-id' = 'student-sync'
```

`source.binlog.consumer-id`는 오프셋 테이블에서 소비자 작업을 식별합니다. 동일한 작업을 재시작할 때 진행 상황을 추적할 수 있도록 이 값을 유지하세요.

Flink Checkpoint 또는 Savepoint에서 복원할 수 없고 저장된 `offset_timestamp`부터 필요한 모든 변경 사항이 여전히 보관되어 있다면, 해당 값을 `source.scan.timestamp`에 복사하고 `source.scan.mode`를 `from-timestamp`로 설정하여 해당 오프셋부터 수동으로 소비를 재개하세요. 이미 만료되었다면 [Binlog 만료 후 복구](#binlog-expiration-recovery)를 따르세요. 만료된 타임스탬프를 복사해도 누락된 변경 사항은 복원되지 않습니다. 예를 들어 다음 타임스탬프가 여전히 보존 기간 내에 있다면 다음과 같이 설정할 수 있습니다.

```sql
'source.scan.mode' = 'from-timestamp',
'source.scan.timestamp' = '2026-10-09 10:00:00'
```

## 옵션 {#options}

다음 옵션은 증분 읽기를 제어합니다. 다른 Source 옵션은 [Doris에서 데이터 읽기](./read.md#options)에 나와 있습니다.

| 키                         | 기본값 | 필수 여부 | 설명                                                                                                                                                |
| --------------------------- | ------------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| source.scan.mode            | snapshot      | N        | Source 시작 모드입니다. 지원되는 값은 `snapshot`, `initial`, `latest`, `from-timestamp`입니다.                                                           |
| source.scan.timestamp       | --            | N        | `yyyy-MM-dd HH:mm:ss` 형식의 시작 시각이며, 해당 시각을 포함합니다. `from-timestamp`에만 필요합니다. 시작 지점이 만료된 경우 [변경 유형](#increment-type)에 설명된 동작을 따르며, 만료된 변경 사항을 복구할 수는 없습니다. |
| source.binlog.increment-type | detail       | N        | Binlog 변경 유형으로, `detail`, `min_delta` 또는 `append_only`입니다. 시작 지점이 만료된 경우 `detail` / `append_only`는 만료된 변경 사항을 건너뛰고 `min_delta`는 실패합니다. |
| source.binlog.poll-interval | 10s           | N        | 새 Binlog 데이터를 폴링하는 간격입니다. 최솟값은 1초입니다.                                                                                    |
| source.binlog.visible-wait-timeout | 5m            | N        | Doris가 트랜잭션 가시성 대기 시간 초과 오류를 반환한 후 Connector가 동일한 읽기 구간을 재시도하는 최대 시간입니다. 재시도를 비활성화하려면 `0s`로 설정하세요. 음수 값은 유효하지 않습니다. |
| source.binlog.offset-table  | --            | N        | 완료된 Checkpoint에 반영된 오프셋을 기록하는 `database.table` 형식의 Doris 테이블입니다. 관찰 용도로만 사용되며 자동 복구에는 사용되지 않습니다. `source.binlog.consumer-id` 및 `jdbc-url`과 함께 구성하세요. |
| source.binlog.consumer-id   | --            | N        | `source.binlog.offset-table`에 기록되는 고정된 소비자 식별자입니다.                                                                                   |
