---
{
    "title": "증분 쿼리",
    "language": "ko",
    "description": "Table Stream 없이 @incr로 시간 구간에 따른 Doris 테이블의 행 수준 변경 사항을 읽는 방법: APPEND_ONLY, MIN_DELTA, DETAIL의 구문, 예제 및 제한 사항.",
    "keywords": [
        "@incr",
        "Doris 증분 쿼리",
        "증분 쿼리",
        "startTimestamp",
        "endTimestamp",
        "incrementType",
        "APPEND_ONLY",
        "MIN_DELTA",
        "DETAIL",
        "시간 구간별 변경 사항",
        "상태 비저장 증분 읽기",
        "__DORIS_CHANGELOG_OP__",
        "Changelog 쿼리",
        "외부 스케줄러 기반 증분 ETL",
        "INCR query requires changelog enabled on base table",
        "Table Stream과 @incr 비교"
    ]
}
---

<!-- Knowledge type: Operations guide + Syntax description -->
<!-- Use cases: Ad-hoc incremental reads by time range / External systems managing their own positions -->

[changelog](changelog)가 활성화된 테이블에서는 [Table Stream](table-stream)으로 변경 사항을 소비하는 것 외에도, 쿼리에 `@incr`를 사용하여 특정 시간 구간의 테이블 변경 사항을 직접 읽을 수 있습니다. 별도의 객체를 생성하거나 소비 오프셋을 기록할 필요가 없습니다. 상태를 저장하지 않는 일반 쿼리이므로 WHERE, JOIN, 집계 등과 자유롭게 조합할 수 있습니다.

:::caution 실험적 기능
이 기능은 5.0.0 버전부터 제공되는 실험적 기능입니다. 현재는 스토리지와 컴퓨팅이 통합된 모드에서 `@incr`를 사용하세요. 컴퓨팅과 스토리지가 분리된 모드에 대한 지원은 아직 개발 중입니다.
:::

## Table Stream과의 차이점 {#differences-from-table-stream}

<!-- Knowledge type: Comparison + Selection guide -->

| | `@incr` 증분 쿼리 | Table Stream |
|---|---|---|
| 객체 생성 필요 여부 | 아니요 | 예 |
| 읽기 범위 | 사용자가 지정한 시간 구간 | 마지막 소비 오프셋부터 현재까지 |
| 처리 위치 추적 주체 | 사용자(예: 외부 스케줄러가 마지막 시간 구간을 기록) | Doris가 파티션별로 추적하며, 소비 트랜잭션과 원자적으로 갱신 |
| 반복 읽기 | 같은 시간 구간을 여러 번 읽을 수 있음 | 소비한 변경 사항은 다시 반환되지 않음 |
| 적합한 용도 | 임시 분석, 특정 기간의 변경 사항 조회, 자체적으로 처리 위치를 관리하는 외부 시스템 | exactly-once 처리가 필요한 지속적인 증분 ETL |

## 사전 요구 사항 {#prerequisites}

<!-- Knowledge type: Environment requirements -->

- Doris 5.0.0 이상이며, FE에서 `enable_feature_changelog = true`가 설정되어 있어야 합니다.
- 기본 테이블에서 changelog가 활성화되어 있어야 합니다. 그렇지 않으면 `INCR query requires changelog enabled on base table.` 오류와 함께 쿼리가 실패합니다.
- `MIN_DELTA` 모드에서는 Unique Key MoW 기본 테이블에 `changelog.need_historical_value`가 활성화되어 있어야 합니다.
- 현재는 스토리지와 컴퓨팅이 통합된 모드가 필요합니다.

## 구문 {#syntax}

<!-- Knowledge type: Syntax reference -->

```sql
SELECT ... FROM <table_name>@incr(
    ["startTimestamp" = "<datetime>",]
    ["endTimestamp"   = "<datetime>",]
    ["incrementType"  = "<APPEND_ONLY | MIN_DELTA | DETAIL>"]
) [PARTITION (<partition_name>, ...)] [<alias>]
[WHERE ...]
```

### 매개변수 {#parameters}

<!-- Knowledge type: Parameter reference -->

| 매개변수 | 기본값 | 설명 |
|---|---|---|
| `startTimestamp` | 보존된 첫 TSO | 선택 사항입니다. 시간 구간의 시작 시각으로, 형식은 `yyyy-MM-dd HH:mm:ss`이며 세션의 `time_zone`을 기준으로 해석됩니다. 커밋 시각이 시작 시각보다 **크거나 같은** 변경 사항을 반환하며, 기본 테이블의 `changelog.ttl_seconds`에 따른 보존 범위가 적용됩니다 |
| `endTimestamp` | 제한 없음 | 선택 사항입니다. 시간 구간의 종료 시각으로, 시작 시각과 같은 형식을 사용합니다. 커밋 시각이 종료 시각보다 **작은** 변경 사항을 반환합니다 |
| `incrementType` | `MIN_DELTA` | 선택 사항입니다. 증분 모드로, [세 가지 증분 모드](#the-three-incremental-modes)를 참조하세요 |

세 매개변수는 모두 생략할 수 있습니다. `t@incr()`는 보존된 변경 사항을 `MIN_DELTA` 모드로 읽습니다. 보존 범위를 벗어난 시작 시각을 명시하면 `MIN_DELTA`에서는 쿼리가 실패합니다. `DETAIL`과 `APPEND_ONLY`에서는 실제 시작 시각을 보존된 첫 TSO로 조정합니다. [보존 및 정리](changelog#retention-and-cleanup)를 참조하세요. 시간 구간은 시작 경계를 포함하고 종료 경계를 제외하는 `[startTimestamp, endTimestamp)`입니다. 시작 시각이 보존 범위 검증을 통과한 경우, 시작 시각이 종료 시각보다 늦거나 미래이면 빈 결과를 반환합니다.

### 결과 열 {#result-columns}

결과에는 기본 테이블의 표시되는 열과 다음 숨겨진 열이 포함됩니다.

| 숨겨진 열 | 설명 |
|---|---|
| `__DORIS_CHANGELOG_OP__` | 변경 유형: `0` 삽입(APPEND), `1` 삭제(DELETE), `2` 업데이트 전(UPDATE_BEFORE), `3` 업데이트 후(UPDATE_AFTER) |
| `__DORIS_CHANGELOG_TSO__` | 변경 사항의 커밋 타임스탬프 |
| `__DORIS_CHANGELOG_LSN__` | 트랜잭션 내 시퀀스 번호로, TSO와 함께 정렬에 사용됨 |

## 세 가지 증분 모드 {#the-three-incremental-modes}

<!-- Knowledge type: Behavior rules + Selection guide -->

| 모드 | 출력 | 기본 테이블 요구 사항 |
|---|---|---|
| `APPEND_ONLY` | 시간 구간 내에 삽입된 행. 업데이트와 삭제는 출력되지 않음 | Changelog 활성화 |
| `MIN_DELTA` | 시간 구간 내 각 키의 순변경 사항. 아래 병합 규칙 참조 | MoW 테이블에서는 `changelog.need_historical_value`가 활성화되어 있어야 함 |
| `DETAIL` | 시간 구간 내 모든 변경 사항. 업데이트는 UPDATE_BEFORE 행과 UPDATE_AFTER 행으로 나뉨 | Changelog 활성화 |

`MIN_DELTA`는 시간 구간의 시작과 종료 시점에서 각 키의 상태를 비교합니다.

| 구간 시작 시 키 존재 여부 | 구간 종료 시 키 존재 여부 | 출력 |
|---|---|---|
| 없음 | 있음 | APPEND 하나 |
| 있음 | 있으며, 구간 내에서 수정됨 | UPDATE_BEFORE 하나(시작 시점의 값) + UPDATE_AFTER 하나(종료 시점의 값) |
| 있음 | 없음 | DELETE 하나 |
| 없음 | 없음 | 없음 |

Duplicate Key 테이블에서는 세 모드가 같은 결과를 반환합니다. Duplicate Key 테이블에는 삽입만 있으므로 병합할 변경 사항이 없습니다.

## 예제 {#examples}

<!-- Knowledge type: Operational examples -->
<!-- Use cases: Comparing the output of the three modes on the same batch of changes -->

### 데이터 준비 {#data-preparation}

예제에서는 `orders` 테이블을 사용합니다. 이 테이블은 [빠른 시작](quick-start)에 나온 Unique Key MoW 테이블로, before image가 활성화되어 있습니다. 두 배치가 다음 시각에 기록되었다고 가정합니다.

```sql
-- 10:00, first batch
INSERT INTO orders VALUES (1, 'created', 100.00), (2, 'created', 200.00), (3, 'created', 300.00);

-- 10:05, second batch
INSERT INTO orders VALUES (1, 'paid', 100.00);      -- update order 1
DELETE FROM orders WHERE order_id = 2;              -- delete order 2
INSERT INTO orders VALUES (4, 'created', 400.00);   -- new order 4
INSERT INTO orders VALUES (5, 'created', 500.00);   -- new order 5
DELETE FROM orders WHERE order_id = 5;              -- delete order 5 again
```

### MIN_DELTA: 10:03부터 10:10까지의 순변경 사항 {#min_delta-net-changes-between-1003-and-1010}

```sql
SELECT order_id, status, amount, __DORIS_CHANGELOG_OP__ AS op
FROM orders@incr(
    "startTimestamp" = "2026-09-14 10:03:00",
    "endTimestamp"   = "2026-09-14 10:10:00",
    "incrementType"  = "MIN_DELTA"
)
ORDER BY order_id, op;
```

```text
+----------+---------+--------+------+
| order_id | status  | amount | op   |
+----------+---------+--------+------+
|        1 | created | 100.00 |    2 |
|        1 | paid    | 100.00 |    3 |
|        2 | created | 200.00 |    1 |
|        4 | created | 400.00 |    0 |
+----------+---------+--------+------+
```

주문 5는 시간 구간 내에서 삽입된 후 삭제되었습니다. 순변경 사항이 없으므로 출력되지 않습니다.

### APPEND_ONLY: 같은 시간 구간에 삽입된 행 {#append_only-rows-inserted-within-the-same-window}

```sql
SELECT order_id, status, amount, __DORIS_CHANGELOG_OP__ AS op
FROM orders@incr(
    "startTimestamp" = "2026-09-14 10:03:00",
    "endTimestamp"   = "2026-09-14 10:10:00",
    "incrementType"  = "APPEND_ONLY"
)
ORDER BY order_id;
```

```text
+----------+---------+--------+------+
| order_id | status  | amount | op   |
+----------+---------+--------+------+
|        4 | created | 400.00 |    0 |
|        5 | created | 500.00 |    0 |
+----------+---------+--------+------+
```

주문 1의 업데이트와 주문 2의 삭제는 필터링됩니다. 주문 5의 삽입은 출력되며, 이후 삭제되어도 해당 삽입 기록은 취소되지 않습니다.

### DETAIL: 같은 시간 구간의 모든 변경 사항 {#detail-every-change-within-the-same-window}

```sql
SELECT order_id, status, amount, __DORIS_CHANGELOG_OP__ AS op
FROM orders@incr(
    "startTimestamp" = "2026-09-14 10:03:00",
    "endTimestamp"   = "2026-09-14 10:10:00",
    "incrementType"  = "DETAIL"
)
ORDER BY __DORIS_CHANGELOG_TSO__, __DORIS_CHANGELOG_LSN__, op;
```

```text
+----------+---------+--------+------+
| order_id | status  | amount | op   |
+----------+---------+--------+------+
|        1 | created | 100.00 |    2 |
|        1 | paid    | 100.00 |    3 |
|        2 | created | 200.00 |    1 |
|        4 | created | 400.00 |    0 |
|        5 | created | 500.00 |    0 |
|        5 | created | 500.00 |    1 |
+----------+---------+--------+------+
```

### 시간 구간 미지정: 테이블 생성 이후의 순변경 사항 {#no-window-net-changes-since-the-table-was-created}

이 예제에서는 테이블 생성 이후의 모든 변경 사항이 아직 보존 기간 내에 있다고 가정합니다. 그렇지 않으면 시간 구간을 생략해도 보존된 변경 사항만 읽습니다.

```sql
SELECT order_id, status, amount, __DORIS_CHANGELOG_OP__ AS op
FROM orders@incr()
ORDER BY order_id;
```

```text
+----------+---------+--------+------+
| order_id | status  | amount | op   |
+----------+---------+--------+------+
|        1 | paid    | 100.00 |    0 |
|        3 | created | 300.00 |    0 |
|        4 | created | 400.00 |    0 |
+----------+---------+--------+------+
```

테이블 생성 시점을 기준으로 하면 모든 키가 시작 시점에 존재하지 않습니다. 따라서 아직 존재하는 모든 키는 최신 값을 가진 APPEND로 출력되고, 삭제된 주문 2와 5는 출력되지 않습니다.

## 권장 사항 {#recommendations}

<!-- Knowledge type: Usage recommendations -->
<!-- Use cases: Periodic increments driven by an external scheduler -->

- 외부 스케줄러로 증분 처리를 수행할 때는 이전 `endTimestamp`를 다음 `startTimestamp`로 사용하세요. 보존 범위 내에서는 시작 경계를 포함하고 종료 경계를 제외하는 시간 구간을 사용하면 누락과 중복을 방지할 수 있습니다. 소비 지연은 `changelog.ttl_seconds`보다 짧게 유지하세요. 시간 구간은 커밋 시각을 기준으로 정의된다는 점에 유의하세요. 아직 실행 중인 트랜잭션은 현재 구간에 나타나지 않으며, 커밋 시점이 포함되는 구간에 나타납니다.
- 최신 값만 중요하고 업데이트 이전 값은 필요하지 않다면 `__DORIS_CHANGELOG_OP__ IN (0, 1, 3)`인 행만 유지하세요.
- `@incr` 쿼리는 시간 구간 내의 모든 변경 기록을 읽습니다. 구간이 클수록 읽는 양도 늘어납니다. 가능하면 시간 구간을 지정하세요.

## 제한 사항 및 일반적인 오류 {#limitations-and-common-errors}

<!-- Knowledge type: Troubleshooting -->

| 제한 사항 | 오류 메시지 | 조치 |
|---|---|---|
| 기본 테이블에서 changelog가 활성화되어 있어야 함 | `INCR query requires changelog enabled on base table.` | `"changelog.enable" = "true"`를 설정하여 기본 테이블을 다시 생성하세요. [Changelog](changelog#enabling-changelog)를 참조하세요 |
| `MIN_DELTA`에는 `changelog.need_historical_value`가 활성화된 Unique Key MoW 테이블이 필요함 | `MIN_DELTA INCR query requires base table to be UNIQUE KEY with enable_unique_key_merge_on_write=true` 또는 `... requires base table to enable changelog.need_historical_value=true` | 요구 사항에 맞게 기본 테이블을 다시 생성하거나 `APPEND_ONLY` / `DETAIL`을 사용하세요 |
| 기본 인덱스만 읽을 수 있음 | - | 구체화된 뷰와 롤업은 지정할 수 없습니다 |
| `PREAGGOPEN` 힌트는 지원되지 않음 | - | 힌트를 제거하세요 |
| `startTimestamp`, `endTimestamp`, `incrementType`만 허용됨 | `Unsupported parameter in incr query` | 매개변수 이름의 철자를 확인하세요 |
