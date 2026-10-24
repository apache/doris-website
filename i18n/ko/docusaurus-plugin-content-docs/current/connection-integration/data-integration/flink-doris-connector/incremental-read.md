---
{
    "title": "Doris Changelog를 사용한 증분 읽기",
    "language": "ko",
    "description": "Flink Doris Connector를 통해 changelog가 활성화된 Doris 테이블의 행 단위 변경 사항을 지속적으로 읽는 방법을 설명합니다. 시작 모드, 변경 유형, 전달 보장, 오프셋 테이블, 옵션을 다룹니다."
}
---

# Doris Changelog를 사용한 증분 읽기 {#incremental-reading-with-doris-changelog}

changelog가 활성화된 Doris 테이블(`"changelog.enable" = "true"`)에서는 Flink Doris Connector가 행 단위 변경 사항을 지속적으로 읽을 수 있습니다. 새 컨슈머가 `initial` 모드로 시작하면 먼저 현재 테이블 스냅샷을 읽고 증분 읽기로 전환합니다. 이 전환에 필요한 변경 사항이 소스 테이블의 changelog 보존 기간 안에 남아 있어야 합니다.

:::info 버전 요구 사항
이 기능을 사용하려면 Flink Doris Connector 26.4.0 이상과 Doris 5.0.0 이상이 필요합니다. Doris changelog는 Doris 5.0.0의 실험적 기능이며, FE 설정에서 `enable_feature_changelog = true`로 활성화해야 합니다. 테이블에서 활성화하는 방법, 지원하는 테이블 모델, 제한 사항은 [Changelog](../../../data-operate/incremental/changelog.md)를 참조하세요.
:::

## 예제 {#example}

먼저 Doris 소스 테이블을 만들 때 changelog를 활성화합니다. 컨슈머가 업데이트된 행의 변경 전 값을 필요로 한다면 `changelog.need_historical_value`를 설정해야 합니다.

```sql
CREATE DATABASE IF NOT EXISTS test;

CREATE TABLE test.student_changelog_source (
    id INT,
    name VARCHAR(50),
    age INT
)
UNIQUE KEY(id)
DISTRIBUTED BY HASH(id) BUCKETS 1
PROPERTIES (
    "replication_num" = "1",
    "changelog.enable" = "true",
    "changelog.need_historical_value" = "true",
    "changelog.ttl_seconds" = "86400"
);

INSERT INTO test.student_changelog_source VALUES (1, 'Alice', 18);
```

그런 다음 Flink Checkpoint를 활성화하고 Doris 소스 테이블을 만듭니다.

```sql
SET 'execution.checkpointing.interval' = '10s';

CREATE TABLE student_changelog (
    id INT,
    name STRING,
    age INT,
    PRIMARY KEY (id) NOT ENFORCED
) WITH (
    'connector' = 'doris',
    'fenodes' = '127.0.0.1:8030',
    'table.identifier' = 'test.student_changelog_source',
    'username' = 'root',
    'password' = '',
    'source.scan.mode' = 'initial'
);

SELECT * FROM student_changelog;
```

## 시작 모드 {#scan-mode}

작업이 시작되면 `test.student_changelog_source`의 변경 사항이 Flink changelog 레코드로 지속적으로 출력됩니다. 새 컨슈머의 시작 모드는 `source.scan.mode`로 선택합니다.

| 모드 | 동작 |
| ---- | -------- |
| `snapshot` | 현재 스냅샷을 읽고 중지합니다. 기본 모드입니다. |
| `initial` | 현재 스냅샷을 읽고, 스냅샷 읽기가 완료되면 Doris changelog를 지속적으로 읽도록 전환합니다. |
| `latest` | 스냅샷을 건너뛰고 작업 시작 후 생성된 변경 사항을 읽습니다. |
| `from-timestamp` | 스냅샷을 건너뛰고 `source.scan.timestamp`에 `yyyy-MM-dd HH:mm:ss` 형식으로 지정한 시각부터 변경 사항을 읽습니다. 지정한 시각도 포함됩니다. |

작업을 재개할 때는 저장된 소비 진행 상태가 시작 모드보다 우선합니다. 복구 규칙은 [Doris에 소비 진행 상태 저장](#offset-table)을 참조하세요. 복원된 오프셋과 `from-timestamp` 시작 시점 모두 소스 테이블의 `changelog.ttl_seconds`에 영향을 받습니다. 만료 시 동작은 아래를 참조하세요.

## 변경 유형 {#increment-type}

기본적으로 Connector는 `detail` 모드에서 전체 행의 변경 사항을 출력합니다. 최소 변경 집합을 사용하려면 `source.changelog.increment-type`을 `min_delta`로, 추가 이벤트만 사용하려면 `append_only`로 설정합니다.

Connector는 Doris `@incr` 쿼리를 통해 변경 사항을 읽습니다. 요청한 시작 시점이 `changelog.ttl_seconds`에 따라 만료되었다면 동작은 변경 유형에 따라 달라집니다.

| 변경 유형 | 시작 시점이 만료된 경우의 동작 |
| ---- | ---- |
| `detail`(기본값), `append_only` | Doris가 실제 시작 시점을 보존된 첫 TSO로 옮기고 만료된 변경 사항을 건너뜁니다. 작업은 만료 오류 없이 계속될 수 있지만 해당 변경 사항은 출력에서 누락됩니다. |
| `min_delta` | 불완전한 순변경 사항을 반환하는 대신 `Changelog offset has expired according to changelog.ttl_seconds` 오류와 함께 읽기가 실패합니다. |

이 규칙은 일반적인 소비 중, 초기 스냅샷 이후, 저장된 상태에서 복원할 때 모두 적용됩니다. 작업이 실행 중이거나 Checkpoint가 성공했다고 해서 변경 사항이 만료되지 않았다는 뜻은 아닙니다. `source.changelog.visible-wait-timeout`은 만료 오류에 대해 재시도하지 않습니다.

## 참고 사항 {#notes}

- 증분 읽기에는 Arrow Flight SQL을 사용합니다. Connector가 이를 기본적으로 활성화하고 포트를 자동으로 찾습니다.
- Flink Checkpoint를 활성화하세요.
- Doris `changelog.ttl_seconds`의 기본값은 `86400`초(하루)이며, `0`보다 커야 합니다. 만료는 Flink 작업이나 Checkpoint를 기다리지 않습니다. TTL을 늘려도 물리적으로 정리된 레코드는 복구할 수 없습니다.
- 초기 스냅샷 소요 시간, 소비 지연으로 쌓인 변경 사항, 장애 후 복구하여 최신 상태를 따라잡는 데 필요한 시간을 모두 포함하고 여유를 더해 TTL을 설정하세요. 이전 Checkpoint나 Savepoint에서 복원할 때를 포함해 작업에 아직 필요한 가장 오래된 변경 사항의 경과 시간을 모니터링하세요.
- 자동 물리 정리를 사용하려면 BE에서도 `enable_feature_changelog = true`를 설정하고 자동 compaction을 활성화한 상태로 유지하세요. 물리 정리가 완료되기 전에도 증분 쿼리는 만료된 레코드를 필터링합니다. [Changelog 보존 및 정리](../../../data-operate/incremental/changelog.md#retention-and-cleanup)를 참조하세요.
- 증분 읽기를 수행할 때 Doris는 읽기 범위 내에서 소스 테이블에 영향을 주는 진행 중인 트랜잭션이 완료되기를 기다립니다. 대기 시간이 초과되면 읽기가 오류를 반환합니다. Connector는 이 오류에 한해서만 동일한 읽기 범위를 `source.changelog.visible-wait-timeout`까지 재시도합니다(기본값: `5m`). Connector 재시도를 비활성화하려면 `0s`로 설정하세요. 다른 오류가 발생하면 즉시 실패합니다.

### Changelog 만료 후 복구 {#changelog-expiration-recovery}

필요한 변경 사항이 만료되었다면 기존 오프셋으로는 전체 변경 사항을 복구할 수 없습니다. 다운스트림 데이터를 현재 소스 테이블과 일치시켜야 하는 작업이라면, 만료된 Checkpoint나 Savepoint를 복원하지 말고 `source.scan.mode = 'initial'`로 새 초기 적재를 시작한 뒤 새 스냅샷에서 다운스트림 데이터를 다시 구축하세요. 오프셋 테이블을 설정했다면 저장된 레코드가 없는 새 `source.changelog.consumer-id`를 사용하거나, `source.changelog.offset-table`과 `source.changelog.consumer-id`를 모두 제거하세요. 그렇지 않으면 이전 Flink 상태나 외부 오프셋이 여전히 `initial`보다 우선하여 새 전체 스냅샷을 읽지 못합니다.

새 스냅샷은 현재 테이블 상태를 다시 구축하지만 만료된 과거 이벤트를 재현할 수는 없습니다. `latest`나 더 최근 시각의 `from-timestamp`로 시작해도 누락된 구간을 건너뜁니다. 해당 구간을 건너뛰어도 되거나 누락된 데이터를 별도로 복구한 경우에만 이 모드를 사용하세요.

## 전달 보장 및 중복 제거 {#delivery}

필요한 변경 레코드가 모두 Doris에 보존되어 있는 동안 Doris 소스는 증분 읽기에 대해 at-least-once 전달을 제공합니다. 장애 후 변경 이벤트가 재생될 수 있으며 Flink 쿼리 결과에 영향을 줄 수 있습니다. Flink의 CDC 이벤트 중복 제거 기능은 기본적으로 비활성화되어 있습니다. 사용하려면 쿼리를 제출하기 전에 다음 옵션을 설정하세요.

```sql
SET 'table.exec.source.cdc-events-duplicate' = 'true';
```

이 옵션을 활성화하면 위 예제처럼 소스 테이블에 기본 키를 선언해야 합니다. Flink는 추가적인 상태 저장 연산자를 사용해 Flink changelog를 정규화합니다. 자세한 내용은 [Flink 설정 참고 문서](https://nightlies.apache.org/flink/flink-docs-release-2.3/zh/docs/dev/table/config/#table-exec-source-cdc-events-duplicate)를 참조하세요.

Checkpoint는 소비 상태를 저장하고 CDC 중복 제거 기능은 재생된 이벤트를 처리합니다. 어느 기능도 Doris changelog의 만료를 막거나 만료로 이미 손실된 이벤트를 복구하지는 못합니다.

## Doris에 소비 진행 상태 저장(선택 사항) {#offset-table}

선택 사항인 오프셋 테이블은 소비 진행 상태를 Doris에 저장합니다. 이를 통해 진행 상태를 확인하고, Checkpoint나 Savepoint에서 복원하지 않은 작업을 자동으로 재개할 수 있습니다.

작업을 제출하기 전에 다음 오프셋 테이블을 만드세요. `username`과 `password`로 설정한 Doris 계정에는 이 테이블에 대한 `SELECT` 및 `INSERT` 권한이 필요합니다.

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

Flink Checkpoint를 활성화한 상태로 유지하고 위 예제의 소스 테이블 `WITH` 절에 다음 옵션을 추가하세요.

```sql
'jdbc-url' = 'jdbc:mysql://127.0.0.1:9030',
'source.changelog.offset-table' = 'ops.flink_source_offsets',
'source.changelog.consumer-id' = 'student-sync'
```

작업을 다시 시작할 때는 동일한 오프셋 테이블과 `source.changelog.consumer-id`를 유지하세요. 서로 다른 작업이나 소스 테이블에는 서로 다른 ID를 사용하여 소비 진행 상태가 덮어써지지 않도록 하세요.

`offset_timestamp`는 증분 읽기의 다음 시작 시점이며 이 시점도 읽기 범위에 포함됩니다. Checkpoint가 성공하면 Connector는 해당 Checkpoint에 포함된 소비 진행 상태를 비동기적으로 저장하고 쓰기에 실패하면 재시도합니다. 저장된 진행 상태가 실제 진행 상태보다 뒤처질 수 있으므로 재개할 때 일부 데이터가 다시 처리될 수 있습니다.

진행 상태가 저장된 후 Doris에서 다음과 같이 조회할 수 있습니다.

```sql
SELECT consumer_id, offset_timestamp
FROM ops.flink_source_offsets
WHERE consumer_id = 'student-sync';
```

결과 예시:

```text
+--------------+---------------------+
| consumer_id  | offset_timestamp    |
+--------------+---------------------+
| student-sync | 2026-10-09 10:00:00 |
+--------------+---------------------+
```

시작 시점은 다음 순서에서 처음 일치하는 규칙에 따라 결정됩니다.

| 조건 | 동작 |
| ---- | ---- |
| Checkpoint 또는 Savepoint에서 작업을 복원한 경우 | 저장된 소비 상태를 사용합니다. |
| 오프셋 테이블에 현재 `consumer-id`의 레코드가 있는 경우 | 시작 모드에서 정한 시작 시점 대신 `offset_timestamp`부터 재개합니다. `initial`에서도 스냅샷을 건너뜁니다. |
| 오프셋 테이블이 설정되지 않았거나 해당 컨슈머의 레코드가 없는 경우 | `source.scan.mode`에 따라 시작합니다. |

설정된 오프셋 테이블이 없거나 읽을 수 없는 경우, 또는 해당 컨슈머의 레코드가 중복되거나 타임스탬프가 유효하지 않은 경우에는 시작 모드로 대체하지 않고 시작이 실패합니다.

오프셋 테이블은 소비 시작 시점만 저장하며, 다운스트림 Flink 연산자나 싱크의 상태는 저장하지 않습니다. 이러한 상태를 복구하려면 Checkpoint나 Savepoint를 복원하세요. 만료된 오프셋은 [Changelog 만료 후 복구](#changelog-expiration-recovery)를 참조하세요.

## 옵션 {#options}

다음 옵션은 증분 읽기를 제어합니다. 다른 소스 옵션은 [Doris에서 데이터 읽기](./read.md#options)에 나와 있습니다.

| 키                         | 기본값 | 필수 여부 | 설명                                                                                                                                                |
| --------------------------- | ------------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| source.scan.mode            | snapshot      | N        | 소스 시작 모드입니다. 지원하는 값은 `snapshot`, `initial`, `latest`, `from-timestamp`입니다.                                                           |
| source.scan.timestamp       | --            | N        | `from-timestamp`에 필요합니다. `yyyy-MM-dd HH:mm:ss` 형식의 시작 시각이며 해당 시각도 포함됩니다. 저장된 소비 진행 상태가 우선합니다. [복구 규칙](#offset-table)을 참조하세요. |
| source.changelog.increment-type | detail    | N        | 변경 유형은 `detail`, `min_delta`, `append_only`입니다. 시작 시점이 만료되면 `detail` / `append_only`는 만료된 변경 사항을 건너뛰고 `min_delta`는 실패합니다. |
| source.changelog.poll-interval | 10s        | N        | 새 변경 사항을 폴링하는 간격입니다. 최솟값은 1초입니다.                                                                                        |
| source.changelog.visible-wait-timeout | 5m         | N        | Doris가 트랜잭션 가시성 대기 시간 초과 오류를 반환한 후 Connector가 동일한 읽기 범위를 재시도하는 최대 시간입니다. 재시도를 비활성화하려면 `0s`로 설정하세요. 음수 값은 유효하지 않습니다. |
| source.changelog.offset-table  | --         | N        | 소비 진행 상태를 저장하고 읽기를 재개하는 데 사용하는 Doris 테이블입니다. `database.table` 형식으로 미리 만들고 `source.changelog.consumer-id` 및 `jdbc-url`과 함께 설정하세요. 증분 모드에서만 지원됩니다. |
| source.changelog.consumer-id   | --         | N        | 오프셋 테이블에서 사용하는 고유한 컨슈머 작업 식별자입니다. 동일한 작업을 다시 시작할 때는 변경하지 마세요. |
