---
{
    "title": "Table Stream 고급 기능",
    "language": "ko",
    "description": "Doris Table Stream 고급 기능: 파티션별 오프셋과 LAG, @snapshot() 및 @reset(), 일관된 차원 테이블 조인, 동시성, 기본 테이블 DDL의 영향, 오류.",
    "keywords": [
        "Table Stream 고급 기능",
        "table_stream_consumption",
        "LAG",
        "CONSUMPTION_STATUS",
        "파티션별 소비 오프셋",
        "파티션별 소비",
        "@snapshot()",
        "@reset()",
        "스냅샷 읽기",
        "전체 데이터 다시 적재",
        "차원 테이블과의 증분 조인",
        "동시 소비",
        "target offset already consumed",
        "cloud_table_stream_max_partitions_per_insert",
        "IS_STALE",
        "STALE_REASON",
        "DROP STREAM FORCE",
        "Stream 모니터링 및 알림",
        "소비 복구",
        "기본 테이블 스키마 변경이 Stream에 미치는 영향"
    ]
}
---

<!-- Knowledge type: Operations guide + Operations manual -->
<!-- Use cases: Consuming large tables partition by partition / Incremental joins with dimension tables / Rebuilding downstream / Operating consumption pipelines -->

이 페이지는 [Table Stream 기본 개념](table-stream)을 읽었다고 가정하며, 예제에서는 해당 문서의 `orders` 테이블과 `orders_stream`을 다시 사용합니다.

## 사용 사례 {#use-cases}

<!-- Knowledge type: Navigation -->

| 수행하려는 작업 | 해당 절 |
|---|---|
| 각 파티션의 소비 진행 상황과 미처리량을 확인하고, 대규모 테이블의 활성 파티션만 소비하기 | [파티션별 소비 오프셋](#partition-level-consumption-offsets) |
| 소비 전에 데이터를 대조하거나 손상된 다운스트림 테이블 재구축하기 | [스냅샷 읽기 @snapshot()](#snapshot-reads-snapshot) |
| 다운스트림 데이터를 전체적으로 다시 적재한 후 현재 시점부터 증분 처리 이어가기 | [리셋 @reset()](#reset-reset) |
| 차원 테이블 상태를 소비 주기에 맞춰 주문 변경 사항을 사용자 테이블과 조인하기 | [차원 테이블 조인](#joining-dimension-tables) |
| 여러 다운스트림 시스템에 데이터를 제공하거나, 하나의 문에서 여러 테이블을 소비하거나, 병렬로 소비하기 | [여러 Stream과 동시 소비](#multiple-streams-and-concurrent-consumption) |
| 기본 테이블에 열이나 파티션을 추가하거나, 데이터를 비우거나, 테이블을 교체 또는 삭제했을 때 Stream에 미치는 영향 알아보기 | [기본 테이블 변경의 영향](#effect-of-base-table-changes) |
| 미처리량 알림을 설정하거나 소비 작업 실패 후 복구하기 | [모니터링 및 복구](#monitoring-and-recovery) |
| 오류 메시지의 원인과 조치 찾아보기 | [일반적인 오류](#common-errors) |

## 파티션별 소비 오프셋 {#partition-level-consumption-offsets}

<!-- Knowledge type: Behavior rules + Operations monitoring -->
<!-- Use cases: Checking consumption progress / Consuming large tables partition by partition -->

Stream 오프셋은 기본 테이블의 파티션별로 유지되며, `information_schema.table_stream_consumption`의 각 행은 하나의 파티션에 해당합니다.

```sql
SELECT UNIT, CONSUMPTION_STATUS, LAG, LAST_CONSUMPTION_TIME
FROM information_schema.table_stream_consumption
WHERE DB_NAME = 'demo' AND STREAM_NAME = 'orders_stream'
ORDER BY UNIT;
```

```text
+-----------+--------------------+-----------+-----------------------+
| UNIT      | CONSUMPTION_STATUS | LAG       | LAST_CONSUMPTION_TIME |
+-----------+--------------------+-----------+-----------------------+
| p20260912 | 469015470080000000 | 0         |         1789180806000 |
| p20260913 | 469041123123200000 | 0         |         1789267206000 |
| p20260914 | 469067681628160003 | 262144000 |         1789351206000 |
| p20260915 | N/A                | 0         |                    -1 |
+-----------+--------------------+-----------+-----------------------+
```

| 열 | 설명 |
|---|---|
| `UNIT` | 소비 단위, 즉 파티션 이름입니다. 파티션을 명시적으로 지정하지 않은 테이블에는 테이블 이름과 같은 이름의 파티션이 하나 있습니다 |
| `CONSUMPTION_STATUS` | 파티션이 소비된 마지막 지점을 나타내는 커밋 타임스탬프(TSO)입니다. `N/A`는 해당 파티션을 한 번도 소비하지 않았음을 의미합니다 |
| `LAG` | 파티션의 최신 커밋 TSO와 소비된 TSO 간의 차이입니다. `0`은 미처리량이 없음을, `N/A`는 파티션에 데이터가 있지만 한 번도 소비하지 않았음을 의미합니다 |
| `LAST_CONSUMPTION_TIME` | 파티션을 가장 최근에 소비한 시간(밀리초 타임스탬프)입니다. `-1`은 한 번도 소비하지 않았음을 의미합니다 |

TSO의 상위 비트는 밀리초 단위의 물리적 시간이고 하위 18비트는 논리 카운터이므로, `LAG`를 262144(2의 18제곱)로 나눈 값은 대략 밀리초 단위의 미처리 지연 시간입니다. 위 예에서 `p20260914`는 약 1초 뒤처져 있습니다.

### 파티션별 소비 {#consuming-by-partition}

대규모 테이블의 변경 사항이 일부 활성 파티션에 집중되어 있다면 `PARTITION` 절을 사용해 해당 파티션만 소비합니다. 소비한 파티션의 오프셋만 진행됩니다.

```sql
INSERT INTO dwd_orders
SELECT order_id, status, amount
FROM orders_stream PARTITION (p20260914)
WHERE __DORIS_STREAM_CHANGE_TYPE_COL__ IN ('APPEND', 'UPDATE_AFTER');
```

하나의 문에서 동일한 Stream의 서로 다른 파티션을 여러 번 참조하면 오프셋 업데이트는 하나로 합쳐집니다.

컴퓨팅과 스토리지가 분리된 모드에서는 하나의 `INSERT`에서 소비할 수 있는 파티션 수가 FE 설정 `cloud_table_stream_max_partitions_per_insert`(기본값 10000)를 초과할 수 없습니다. 이 한도를 초과하면 `Cloud Table Stream consumes N partitions, exceeding cloud_table_stream_max_partitions_per_insert=...` 오류로 실패하므로, `PARTITION`을 사용해 나누어 소비합니다.

### 파티션 추가 및 삭제 {#adding-and-removing-partitions}

- Stream 생성 후 추가된 파티션(동적 파티셔닝과 자동 파티셔닝으로 생성된 파티션 포함)은 모든 데이터가 변경 사항으로 출력됩니다. 이러한 파티션을 처음 소비할 때는 처음부터 읽습니다.
- 파티션을 삭제하면 FE가 해당 오프셋 레코드를 주기적으로 정리합니다(`table_stream_partition_offset_cleanup_interval_second`, 기본값 3600초). 수동 조치는 필요하지 않습니다. 삭제된 파티션의 미소비 변경 사항도 함께 사라집니다.

## 스냅샷 읽기 @snapshot() {#snapshot-reads-snapshot}

<!-- Knowledge type: Behavior rules + Operational examples -->
<!-- Use cases: Reconciliation before consuming / Rebuilding downstream / Reading the base table image before the pending changes -->

`<stream>@snapshot()`은 Stream의 **현재 소비 오프셋**에 해당하는 기본 테이블 이미지를 반환합니다. 즉, 이번 소비를 기다리는 변경 사항이 발생하기 전의 기본 테이블 상태입니다.

```sql
SELECT order_id, status, amount FROM orders_stream@snapshot() ORDER BY order_id;
```

[Table Stream 기본 개념](table-stream#consumption-types)의 데이터를 예로 들어 보겠습니다. Stream을 생성할 때 기본 테이블에 주문 1, 2, 3이 있고, 이후 주문 1을 업데이트하고 주문 2를 삭제하고 주문 4를 삽입했으며 아직 아무것도 소비하지 않았다고 가정합니다. `@snapshot()`은 여전히 주문 1(업데이트 전), 2, 3을 반환하고, 일반 읽기는 해당 변경 사항을 반환합니다. 두 결과의 관계는 다음과 같습니다. **스냅샷 + 소비 대기 중인 변경 사항 = 기본 테이블의 현재 상태**.

`@snapshot()`의 특징은 다음과 같습니다.

- 오프셋을 진행시키지 않습니다. `INSERT INTO ... SELECT FROM <stream>@snapshot()`으로 결과를 다른 테이블에 기록하더라도 마찬가지입니다.
- 테이블 이미지를 반환하며 `__DORIS_STREAM_*` 가상 열을 제공하지 않습니다.
- 이미지는 파티션별로 각자의 소비 오프셋을 기준으로 생성됩니다.
- `show_initial_rows = true`인 Stream에서 한 번도 소비하지 않은 파티션의 스냅샷은 비어 있습니다(소비가 "아무 데이터도 없는 상태"에서 시작하며, 기존 데이터는 모두 소비 대기 중인 변경 사항에 속합니다).

대표적인 용도는 다음과 같습니다.

| 용도 | 방법 |
|---|---|
| 데이터 대조 | 소비 전에 `@snapshot()` 결과를 다운스트림 테이블과 비교하여 다운스트림이 이전 소비 직후의 기본 테이블 상태와 일치하는지 확인한 다음, 이번 변경 사항을 소비합니다 |
| 다운스트림 재구축 | 다운스트림 테이블이 손상되면 `@snapshot()`에서 소비 오프셋에 해당하는 상태로 복원한 다음 정상적으로 소비를 이어갑니다. 오프셋 이후의 변경 사항은 누락되거나 중복 처리되지 않습니다 |
| 증분 조인의 "변경 전" 이미지 | 아래의 [차원 테이블 조인](#joining-dimension-tables)을 참조하세요 |

## 리셋 @reset() {#reset-reset}

<!-- Knowledge type: Behavior rules + Operational examples -->
<!-- Use cases: Full reload of downstream / Skipping the accumulated backlog -->

`<stream>@reset()`은 기본 테이블의 **현재** 전체 이미지를 반환합니다. 일반 `SELECT`로 읽으면 데이터만 표시됩니다. `INSERT INTO ... SELECT FROM <stream>@reset()`으로 소비하면 Stream의 모든 파티션 오프셋이 현재 시점으로 진행되며, 이후 Stream은 이번 소비 이후에 발생한 변경 사항만 출력합니다.

```sql
-- Clear downstream, reload it in full, and advance the offset to now
TRUNCATE TABLE dwd_orders;
INSERT INTO dwd_orders
SELECT order_id, status, amount FROM orders_stream@reset();

-- Continue with incremental consumption
SELECT COUNT(*) FROM orders_stream;   -- 0
```

대표적인 용도는 다음과 같습니다.

- 다운스트림에서 전체 동기화를 다시 수행한 후 현재 시점부터 증분 처리를 이어가야 하는 경우.
- Stream을 `show_initial_rows = false`로 생성했지만 기존 데이터도 동기화해야 하는 경우.
- Stream에 미처리량이 너무 많이 누적되어 다운스트림에서 과거 변경 사항이 더 이상 필요하지 않은 경우. 현재 시점으로 바로 건너뜁니다.

`@snapshot()`과 마찬가지로 `@reset()`은 `__DORIS_STREAM_*` 가상 열을 제공하지 않습니다.

## 세 가지 읽기 형식 비교 {#comparison-of-the-three-read-forms}

<!-- Knowledge type: Comparison -->

| | `<stream>` | `<stream>@snapshot()` | `<stream>@reset()` |
|---|---|---|---|
| 반환 내용 | 소비 오프셋 이후의 변경 사항 | 소비 오프셋에 해당하는 기본 테이블 이미지 | 기본 테이블의 현재 전체 이미지 |
| 일반 `SELECT`가 오프셋을 진행시키는지 | 아니요 | 아니요 | 아니요 |
| `INSERT INTO ... SELECT`가 오프셋을 진행시키는지 | 예, 읽기 범위의 상한까지 | 아니요 | 예, 모든 파티션을 현재 시점까지 |
| `__DORIS_STREAM_*` 가상 열 | 있음 | 없음 | 없음 |
| 대표적인 용도 | 증분 소비 | 데이터 대조, 다운스트림 재구축, 증분 조인의 "변경 전" 이미지 | 전체 데이터 다시 적재, 미처리 변경 사항 건너뛰기 |

## 차원 테이블 조인 {#joining-dimension-tables}

<!-- Knowledge type: Operational examples -->
<!-- Use cases: Joining incremental data with dimension tables / Aligning the dimension state with the consumption cadence -->

Stream은 다른 테이블과 직접 조인할 수 있으며, 이때 차원 테이블은 현재 상태로 읽습니다.

```sql
INSERT INTO dwd_orders_wide
SELECT o.order_id, o.status, o.amount, u.user_name, u.city
FROM orders_stream AS o
JOIN users AS u ON o.user_id = u.user_id
WHERE o.__DORIS_STREAM_CHANGE_TYPE_COL__ IN ('APPEND', 'UPDATE_AFTER');
```

차원 테이블 자체도 변경되며 그 상태를 소비 주기에 맞춰야 한다면, 차원 테이블에도 Stream을 생성하고 같은 소비 작업에서 사용합니다.

| 읽기 형식 | 반환하는 차원 테이블 상태 |
|---|---|
| `users_stream@snapshot()` | 이전 소비 시점의 차원 테이블 이미지 |
| `users_stream` | 이전 소비 이후의 차원 테이블 변경 사항 |
| `users_stream@reset()` | 차원 테이블의 현재 이미지 |

예를 들어 주문 변경 사항을 이전 소비 시점의 사용자 정보와 조인하고, 사용자 테이블의 변경 사항은 별도로 처리합니다.

```sql
INSERT INTO dwd_orders_wide
SELECT o.order_id, o.status, o.amount, u.user_name, u.city
FROM orders_stream AS o
JOIN users_stream@snapshot() AS u ON o.user_id = u.user_id
WHERE o.__DORIS_STREAM_CHANGE_TYPE_COL__ IN ('APPEND', 'UPDATE_AFTER');
```

이 문은 `orders_stream`의 오프셋만 진행시킵니다. `users_stream`의 오프셋은 `users_stream`을 소비하는 문에 의해 진행됩니다. 두 Stream의 소비 주기는 작업 오케스트레이션에서 결정합니다.

## 여러 Stream과 동시 소비 {#multiple-streams-and-concurrent-consumption}

<!-- Knowledge type: Behavior rules -->
<!-- Use cases: Several downstream systems / Parallel consumption / Consumption concurrent with writes -->

| 상황 | 동작 | 권장 사항 |
|---|---|---|
| 하나의 기본 테이블에 여러 Stream 생성 | 각 Stream은 자체 오프셋을 유지하며 서로 영향을 주지 않습니다 | 다운스트림 시스템마다 Stream을 생성하여 각자의 속도로 소비할 수 있습니다 |
| 하나의 문에서 여러 Stream 소비 | 예를 들어 두 테이블의 변경 사항을 UNION으로 합쳐 하나의 대상 테이블에 기록할 수 있습니다. 관련된 모든 Stream의 오프셋은 동일한 트랜잭션에서 진행됩니다 | - |
| 하나의 Stream에 여러 소비자 사용 | 두 세션이 동일한 Stream의 동일한 파티션을 동시에 소비하면, 나중에 커밋하는 트랜잭션은 `target offset already consumed` 오류와 함께 실패하고 롤백됩니다 | Stream의 각 파티션을 한 번에 하나의 소비자만 소비하도록 합니다. 병렬로 처리하려면 작업을 파티션별로 나누거나 소비자마다 별도의 Stream을 생성합니다 |
| 쓰기와 동시에 소비 | Stream을 소비하는 동안에도 기본 테이블에 정상적으로 쓸 수 있습니다. 소비 문은 시작 시점까지 커밋된 변경 사항을 읽으며, 이후에 커밋된 쓰기는 다음 소비 때 처리합니다 | - |

## 기본 테이블 변경의 영향 {#effect-of-base-table-changes}

<!-- Knowledge type: Behavior rules -->
<!-- Use cases: Assessing the effect on Streams before running DDL on the base table -->

| 기본 테이블 작업 | Stream에 미치는 영향 |
|---|---|
| `ADD COLUMN` / `DROP COLUMN` | Stream의 열이 자동으로 동기화됩니다. 새 열은 이후 변경 레코드에 실제 값이 포함되며, 삭제된 열은 더 이상 출력되지 않습니다 |
| `ADD PARTITION`, 동적 파티셔닝, 자동 파티셔닝 | 새 파티션은 처음부터 소비되며, 모든 데이터가 변경 사항으로 출력됩니다 |
| `DROP PARTITION` | 파티션의 미소비 변경 사항이 함께 사라지며, FE가 오프셋 레코드를 주기적으로 정리합니다 |
| `TRUNCATE TABLE` / `TRUNCATE PARTITION` | 데이터를 비운 파티션에는 새 파티션 ID가 부여되며, 이후에 기록된 데이터는 처음부터 변경 사항으로 출력됩니다. 데이터를 비우기 전의 미소비 변경 사항은 사라집니다. 다른 파티션에는 영향이 없습니다 |
| `REPLACE PARTITION`(임시 파티션 교체) | 교체에 사용된 새 파티션은 처음부터 소비되며, 교체된 기존 파티션의 미소비 변경 사항은 사라집니다 |
| `RENAME`으로 테이블 또는 파티션 이름 변경 | 영향이 없습니다. Stream은 ID로 기본 테이블을 참조합니다 |
| `REPLACE WITH TABLE` | Stream은 원래 테이블 객체(이제 다른 이름을 갖게 된 객체)를 계속 가리키므로, 대개 원하는 동작이 아닙니다. 기본 테이블을 교체한 후 Stream을 삭제하고 다시 생성합니다 |
| `DROP TABLE`로 기본 테이블 삭제 | Stream은 남아 있지만 더 이상 읽을 수 없습니다. `DROP STREAM ... FORCE`로 삭제합니다 |
| `DROP DATABASE` | 해당 데이터베이스의 Stream도 함께 삭제됩니다. 기본 테이블은 삭제된 데이터베이스에 있었지만 Stream은 다른 데이터베이스에 있는 경우, Stream은 남아 있으며 이를 삭제할 때도 `FORCE`가 필요합니다 |

Changelog가 활성화된 기본 테이블에서 허용되지 않는 DDL(예: `MODIFY COLUMN`)은 [Changelog](changelog#ddl-restrictions)에 나와 있습니다.

## 모니터링 및 복구 {#monitoring-and-recovery}

<!-- Knowledge type: Operations manual -->
<!-- Use cases: Alerting on the consumption pipeline / Handling failed consumption jobs -->

### 모니터링 {#monitoring}

IVM이 생성한 내부 Stream도 이 시스템 테이블에 표시됩니다. 상태와 미처리량을 확인할 수 있지만 수동으로 소비하거나 리셋하거나 삭제하지 마세요. 구체화된 뷰 새로 고침 작업과 [IVM 운영 지침](../../query-acceleration/materialized-view/async-materialized-view/incremental-materialized-view#internal-table-streams)을 통해 관리하세요.

| 모니터링 항목 | 출처 | 참고 사항 |
|---|---|---|
| 미처리량 | `LAG` 필드(`information_schema.table_stream_consumption`) | 정기적으로 쿼리하고, 미처리량이 영이 아닌 상태로 유지되거나 계속 증가하는 파티션에 대해 알림을 설정합니다 |
| 상태 | `ENABLED`, `IS_STALE`, `STALE_REASON` 필드(`information_schema.table_streams`) | Stream의 상태를 보여 주지만 현재 구현에서는 TTL 만료를 보고하지 않습니다. 기본 테이블의 `changelog.ttl_seconds`와 비교하여 소비 지연을 모니터링하고 오프셋 만료 오류가 발생하는지 확인합니다. [보존 및 정리](changelog#retention-and-cleanup)를 참조하세요 |
| 소비 이력 | `LAST_CONSUMPTION_TIME` 필드(`information_schema.table_stream_consumption`) | 소비 작업이 예정대로 실행되는지 알려 줍니다 |

### 복구 {#recovery}

| 상황 | 조치 |
|---|---|
| 소비 문 실패 | 오프셋은 변경되지 않습니다. 필요한 변경 사항이 보존 기간 내에 있는 동안 다시 실행합니다 |
| 필요한 변경 사항이 `changelog.ttl_seconds`에 따라 만료됨 | `@reset()`으로 다운스트림 데이터를 전체적으로 다시 적재하고 오프셋을 다시 맞춥니다. `min_delta` 읽기는 오프셋이 만료되면 실패하며, `detail`과 `append_only`는 만료된 변경 사항을 건너뜁니다 |
| 소비는 성공했지만 스케줄러가 이를 기록하지 못함 | 다시 실행하면 다음 변경 사항 묶음을 읽으며, 이전 묶음을 다시 소비하지 않습니다. 반복 실행 시 부수 효과가 전혀 없도록 하려면 대상 테이블에 Unique Key 모델을 사용합니다(기본 키를 기준으로 한 쓰기는 본래 멱등성을 갖습니다) |
| 다운스트림 데이터가 잘못되어 재구축해야 함 | `@snapshot()`으로 소비 오프셋에 해당하는 상태를 복원한 후 증분 소비를 이어가거나, `@reset()`으로 전체 데이터를 다시 적재하면서 오프셋도 현재 시점으로 진행시킵니다 |
| FE 재시작 또는 마스터 전환 | 오프셋은 메타데이터에 영구 저장되며, 재시작 후에도 소비를 이어갑니다 |

## 일반적인 오류 {#common-errors}

<!-- Knowledge type: Troubleshooting -->

| 오류 메시지 | 원인 | 조치 |
|---|---|---|
| `Table Stream is experimental. Please set enable_table_stream=true to enable it.` | FE에서 `enable_table_stream`이 활성화되지 않음 | `fe.conf`를 수정하고 FE를 재시작합니다 |
| `Insert plan with Table stream failed. should enable changelog feature in FE config.` | FE에서 `enable_feature_changelog`가 활성화되지 않음 | `fe.conf`를 수정하고 FE를 재시작합니다 |
| `Base Olap table ... need to enable changelog for table stream` | 기본 테이블에서 Changelog가 활성화되지 않음 | `"changelog.enable" = "true"` 설정으로 기본 테이블을 다시 생성합니다 |
| `MIN_DELTA table stream requires base mow table to enable changelog.need_historical_value=true` | 기본 유형인 `min_delta`에는 변경 전 이미지가 필요함 | `changelog.need_historical_value`를 활성화하여 기본 테이블을 다시 생성하거나 `append_only`를 사용합니다 |
| `not supported type: xxx` | 잘못된 `type` 값 | `append_only` / `min_delta` / `detail`을 사용합니다 |
| `target offset already consumed` | 동일한 파티션을 동시에 소비하여 이 트랜잭션이 커밋되기 전에 오프셋이 진행됨 | 다시 실행하여 다음 변경 사항 묶음을 읽습니다. 여러 소비자가 동시에 소비하지 않도록 합니다 |
| `Cloud Table Stream consumption only supports a normal INSERT into a local OLAP table` | 컴퓨팅과 스토리지가 분리된 모드에서 명시적 트랜잭션 내부 또는 Group Commit으로 소비하거나, 대상이 내부 테이블이 아님 | 일반 `INSERT INTO ... SELECT`를 사용합니다 |
| `Cloud Table Stream consumes N partitions, exceeding cloud_table_stream_max_partitions_per_insert=...` | 하나의 문에서 너무 많은 파티션을 소비함 | `PARTITION`을 사용해 나누어 소비하거나 설정값을 높입니다 |
| `Cloud Table Stream only supports DROP STREAM ... FORCE` | 컴퓨팅과 스토리지가 분리된 모드에서 `DROP STREAM`을 `FORCE` 없이 실행함 | `DROP STREAM ... FORCE`를 사용합니다 |
| `Unknown column '__DORIS_STREAM_CHANGE_TYPE_COL__' ...` | `@snapshot()` / `@reset()`에서 가상 열을 참조함 | 이미지 읽기에서는 가상 열을 제공하지 않습니다 |
