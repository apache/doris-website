---
{
    "title": "빠른 시작",
    "language": "ko",
    "description": "Doris changelog와 Table Stream을 10분 만에 살펴봅니다. changelog를 활성화한 테이블 생성, Stream 생성, 데이터 쓰기, 변경 사항 확인, 다운스트림에서의 소비 과정을 안내합니다.",
    "keywords": [
        "Doris Table Stream 빠른 시작",
        "changelog 예제",
        "CREATE STREAM",
        "changelog.enable",
        "changelog.need_historical_value",
        "min_delta",
        "show_initial_rows",
        "__DORIS_STREAM_CHANGE_TYPE_COL__",
        "__DORIS_STREAM_SEQUENCE_COL__",
        "Stream에서 INSERT INTO SELECT",
        "table_stream_consumption",
        "소비 오프셋 LAG",
        "증분 소비 튜토리얼",
        "Doris CDC 예제"
    ]
}
---

<!-- Knowledge type: Operations guide -->
<!-- Use cases: First use of changelog / Table Stream -->

이 페이지에서는 주문 테이블을 예로 들어 changelog와 Table Stream의 기본 사용법을 설명합니다. 주문의 삽입, 업데이트, 삭제를 기록하고, 그 변경 사항을 정확히 한 번씩 소비하여 다운스트림 테이블에 반영합니다. MySQL 클라이언트와 약 10분만 있으면 됩니다.

## 사전 요구 사항 {#prerequisites}

<!-- Knowledge type: Environment requirements -->

- Doris 5.0.0 이상.
- 모든 FE의 `fe.conf`에 다음 설정을 추가하고 FE를 재시작합니다(두 설정 모두 동적 설정이 아닙니다):

    ```text
    enable_feature_changelog = true
    enable_table_stream = true
    ```

- Doris에 연결할 수 있는 MySQL 클라이언트.

## 진행 단계 개요 {#overview-of-the-steps}

1. changelog를 활성화한 `orders` 테이블을 생성하고 첫 번째 배치 데이터를 씁니다.
2. `min_delta` Table Stream을 `orders`에 생성합니다.
3. 업데이트, 삭제, 삽입이 포함된 두 번째 배치 데이터를 씁니다.
4. Stream을 통해 변경 사항을 확인하고 각 행의 변경 유형을 이해합니다.
5. `INSERT INTO ... SELECT`로 변경 사항을 다운스트림 테이블에 반영하여 소비합니다.
6. `information_schema.table_stream_consumption`에서 소비 진행 상황을 확인합니다.

## 1단계: changelog를 활성화한 테이블 생성 {#step-1-create-a-table-with-row-binlog-enabled}

<!-- Knowledge type: Operational steps -->

Changelog는 테이블 생성 시에만 활성화할 수 있습니다. Unique Key Merge-on-Write 테이블을 생성하고 `changelog.need_historical_value`를 활성화하여 업데이트와 삭제 시 변경 전 값도 기록하도록 합니다:

```sql
CREATE DATABASE IF NOT EXISTS demo;
USE demo;

CREATE TABLE orders (
    order_id BIGINT,
    status   VARCHAR(16),
    amount   DECIMAL(10, 2)
)
UNIQUE KEY(order_id)
DISTRIBUTED BY HASH(order_id) BUCKETS 1
PROPERTIES (
    "replication_num" = "1",
    "enable_unique_key_merge_on_write" = "true",
    "changelog.enable" = "true",
    "changelog.need_historical_value" = "true"
);
```

첫 번째 배치 데이터를 씁니다:

```sql
INSERT INTO orders VALUES
    (1, 'created', 100.00),
    (2, 'created', 200.00),
    (3, 'created', 300.00);
```

## 2단계: Table Stream 생성 {#step-2-create-a-table-stream}

<!-- Knowledge type: Operational steps -->

`orders` 테이블에 Stream을 생성합니다. 이후에는 이 Stream을 통해 `orders`의 변경 사항을 읽고 소비합니다:

```sql
CREATE STREAM orders_stream ON TABLE orders
PROPERTIES (
    "type" = "min_delta",
    "show_initial_rows" = "false"
);
```

- `type = min_delta`: 두 번의 소비 사이에 발생한 각 키의 순변경 사항을 내보냅니다.
- `show_initial_rows = false`: 이미 존재하는 3개 행은 변경 사항으로 내보내지 않습니다. 이 시점 이후의 변경 사항만 대상이 됩니다.

이 시점에 Stream을 쿼리하면 아무것도 반환되지 않습니다:

```sql
SELECT * FROM orders_stream;
```

```text
Empty set
```

## 3단계: 두 번째 배치의 변경 사항 쓰기 {#step-3-write-the-second-batch-of-changes}

<!-- Knowledge type: Operational steps -->

이 배치에는 업데이트, 삭제, 삽입, 삽입 직후 삭제라는 네 가지 경우가 포함됩니다:

```sql
-- Update order 1 (writing the same key into a Unique Key table is an update)
INSERT INTO orders VALUES (1, 'paid', 100.00);
-- Delete order 2
DELETE FROM orders WHERE order_id = 2;
-- New order 4
INSERT INTO orders VALUES (4, 'created', 400.00);
-- New order 5, deleted right after
INSERT INTO orders VALUES (5, 'created', 500.00);
DELETE FROM orders WHERE order_id = 5;
```

## 4단계: 변경 사항 확인 {#step-4-view-the-changes}

<!-- Knowledge type: Operational steps + Result interpretation -->

두 개의 가상 컬럼을 명시하여 Stream을 쿼리합니다. `__DORIS_STREAM_CHANGE_TYPE_COL__`은 변경 유형이고, `__DORIS_STREAM_SEQUENCE_COL__`은 변경 사항의 커밋 타임스탬프(TSO)입니다. 가상 컬럼은 `SELECT *`에 포함되지 않으므로 명시적으로 나열해야 합니다.

```sql
SELECT order_id, status, amount,
       __DORIS_STREAM_CHANGE_TYPE_COL__ AS change_type,
       __DORIS_STREAM_SEQUENCE_COL__ AS change_tso
FROM orders_stream
ORDER BY order_id, change_type DESC;
```

```text
+----------+---------+--------+---------------+--------------------+
| order_id | status  | amount | change_type   | change_tso         |
+----------+---------+--------+---------------+--------------------+
|        1 | created | 100.00 | UPDATE_BEFORE | 469067680972800000 |
|        1 | paid    | 100.00 | UPDATE_AFTER  | 469067680972800000 |
|        2 | created | 200.00 | DELETE        | 469067681287372800 |
|        4 | created | 400.00 | APPEND        | 469067681628160003 |
+----------+---------+--------+---------------+--------------------+
```

3단계의 작업과 비교하면 다음과 같습니다:

| 3단계의 작업 | Stream의 출력 |
|---|---|
| 주문 1 업데이트 | `UPDATE_BEFORE`(업데이트 전 값)와 `UPDATE_AFTER`(업데이트 후 값) 한 쌍 |
| 주문 2 삭제 | 삭제 전 값이 담긴 `DELETE` 하나 |
| 주문 4 삽입 | `APPEND`(새 키) 하나 |
| 주문 5 삽입 후 삭제 | 두 번의 소비 사이에 발생한 순변경 사항이 없으므로 `min_delta`는 아무것도 내보내지 않음 |

같은 쿼리를 다시 실행하면 정확히 같은 결과가 반환됩니다. **일반 SELECT는 변경 사항을 읽기만 하며 소비 오프셋을 앞으로 이동시키지 않습니다.**

## 5단계: 변경 사항 소비 {#step-5-consume-the-changes}

<!-- Knowledge type: Operational steps -->

`INSERT INTO ... SELECT ... FROM <stream>`을 사용하여 변경 사항을 다운스트림 테이블에 씁니다. 이 문은 데이터 쓰기와 동일한 트랜잭션에서 소비 오프셋을 앞으로 이동시킵니다:

```sql
CREATE TABLE orders_changes (
    order_id    BIGINT,
    status      VARCHAR(16),
    amount      DECIMAL(10, 2),
    change_type VARCHAR(16),
    change_tso  BIGINT
)
DUPLICATE KEY(order_id)
DISTRIBUTED BY HASH(order_id) BUCKETS 1
PROPERTIES ("replication_num" = "1");

INSERT INTO orders_changes
SELECT order_id, status, amount,
       __DORIS_STREAM_CHANGE_TYPE_COL__,
       __DORIS_STREAM_SEQUENCE_COL__
FROM orders_stream;
```

소비 후에는 Stream에 처리 대기 중인 변경 사항이 없습니다:

```sql
SELECT COUNT(*) FROM orders_stream;
```

```text
+----------+
| count(*) |
+----------+
|        0 |
+----------+
```

변경 사항을 더 쓰면 Stream은 앞서 소비한 시점 이후에 발생한 변경 사항만 반환합니다:

```sql
INSERT INTO orders VALUES (4, 'paid', 400.00);

SELECT order_id, status, __DORIS_STREAM_CHANGE_TYPE_COL__ AS change_type
FROM orders_stream ORDER BY change_type DESC;
```

```text
+----------+---------+---------------+
| order_id | status  | change_type   |
+----------+---------+---------------+
|        4 | created | UPDATE_BEFORE |
|        4 | paid    | UPDATE_AFTER  |
+----------+---------+---------------+
```

## 6단계: 소비 진행 상황 확인 {#step-6-check-the-consumption-progress}

<!-- Knowledge type: Operational steps + Operations monitoring -->

`information_schema.table_stream_consumption`은 각 Stream의 파티션별 소비 오프셋과 미처리량을 보여줍니다:

```sql
SELECT STREAM_NAME, UNIT, CONSUMPTION_STATUS, LAG, LAST_CONSUMPTION_TIME
FROM information_schema.table_stream_consumption
WHERE DB_NAME = 'demo' AND STREAM_NAME = 'orders_stream';
```

```text
+---------------+--------+--------------------+-----------+-----------------------+
| STREAM_NAME   | UNIT   | CONSUMPTION_STATUS | LAG       | LAST_CONSUMPTION_TIME |
+---------------+--------+--------------------+-----------+-----------------------+
| orders_stream | orders | 469067681628160003 | 262144000 |         1789351206000 |
+---------------+--------+--------------------+-----------+-----------------------+
```

| 컬럼 | 의미 |
|---|---|
| `UNIT` | 소비 단위, 즉 기본 테이블의 파티션입니다. `orders`에는 명시적 파티션이 없으므로 테이블과 같은 이름의 단일 파티션이 있습니다 |
| `CONSUMPTION_STATUS` | 해당 파티션에서 소비가 완료된 지점의 TSO |
| `LAG` | 해당 파티션의 가장 최근에 커밋된 TSO와 소비가 완료된 TSO의 차이입니다. `0`이면 미처리 변경 사항이 없습니다 |
| `LAST_CONSUMPTION_TIME` | 가장 최근 소비 시각(밀리초 타임스탬프)입니다. `-1`이면 아직 소비한 적이 없음을 뜻합니다 |

5단계의 `INSERT INTO orders_changes SELECT ...`를 다시 실행하면 `LAG`가 `0`으로 돌아갑니다.

## 정리 {#clean-up}

```sql
DROP STREAM orders_stream;
DROP TABLE orders_changes;
DROP TABLE orders;
```

## 자주 묻는 질문 {#faq}

<!-- Knowledge type: Troubleshooting -->

| 문제 | 원인 및 조치 |
|---|---|
| `Table Stream is experimental. Please set enable_table_stream=true to enable it.` 오류로 Stream 생성에 실패함 | FE에서 `enable_table_stream`이 활성화되지 않았거나, `fe.conf`를 수정한 후 FE를 재시작하지 않았습니다. [사전 요구 사항](#prerequisites)을 따르세요 |
| 생성 직후 Stream이 비어 있음 | `show_initial_rows = false`이면 Stream 생성 시 이미 존재하는 데이터는 변경 사항으로 내보내지 않습니다. 새 변경 사항을 쓴 후 다시 쿼리하세요 |
| `SELECT * FROM orders_stream`에 변경 유형이 표시되지 않음 | 가상 컬럼은 `SELECT *`에 포함되지 않습니다. `__DORIS_STREAM_CHANGE_TYPE_COL__`과 `__DORIS_STREAM_SEQUENCE_COL__`을 명시적으로 나열하세요 |
| 쿼리할 때마다 같은 변경 사항이 계속 반환됨 | 일반 `SELECT`는 변경 사항을 읽기만 하며 오프셋을 앞으로 이동시키지 않습니다. `INSERT INTO ... SELECT ... FROM orders_stream`으로 소비하면 더 이상 반환되지 않습니다 |
| 기존 테이블에서 changelog 활성화 | Changelog는 테이블 생성 시에만 활성화할 수 있습니다. changelog를 활성화한 새 테이블을 생성하고 데이터를 다시 적재하세요. [Changelog](changelog#enabling-changelog)를 참조하세요 |
| `LAST_CONSUMPTION_TIME`에 `-1`이 표시됨 | 해당 파티션은 아직 소비된 적이 없습니다 |

## 다음 단계 {#next-steps}

- 세 가지 소비 유형의 차이, `show_initial_rows`의 의미, 읽기와 소비의 트랜잭션 처리 방식: [Table Stream 기본](table-stream)
- 파티션별 소비, 스냅샷 읽기, 차원 테이블 조인, 기본 테이블 DDL이 Stream에 미치는 영향: [Table Stream 고급](table-stream-advanced)
- Changelog 속성, 지원 범위, 제한 사항: [Changelog](changelog)
- Stream을 생성하지 않고 시간 구간별로 변경 사항 읽기: [증분 쿼리](incremental-query)
