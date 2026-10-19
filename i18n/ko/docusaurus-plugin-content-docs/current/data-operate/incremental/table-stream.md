---
{
    "title": "Table Stream 기본 사항",
    "language": "ko",
    "description": "Doris Table Stream 가이드: Stream 생성, 조회 및 삭제, append_only / min_delta / detail 소비 유형, show_initial_rows, 읽기와 소비의 차이.",
    "keywords": [
        "Table Stream",
        "Doris Stream",
        "CREATE STREAM",
        "DROP STREAM",
        "SHOW STREAMS",
        "SHOW CREATE STREAM",
        "ALTER STREAM",
        "append_only",
        "min_delta",
        "detail",
        "show_initial_rows",
        "소비 오프셋",
        "오프셋",
        "__DORIS_STREAM_CHANGE_TYPE_COL__",
        "__DORIS_STREAM_SEQUENCE_COL__",
        "__DORIS_STREAM_LSN_COL__",
        "APPEND UPDATE_BEFORE UPDATE_AFTER DELETE",
        "증분 ETL",
        "다운스트림 테이블 동기화",
        "__DORIS_DELETE_SIGN__",
        "information_schema.table_streams",
        "enable_table_stream",
        "Incremental View Maintenance",
        "IVM",
        "변경 데이터 소비"
    ]
}
---

<!-- Knowledge type: Operations guide + Feature description -->
<!-- Use cases: Incremental ETL / Downstream table sync / Change auditing / Exactly-once consumption of table changes -->

Table Stream(이하 Stream)은 [Row Binlog](row-binlog)를 기반으로 하는 변경 데이터 소비 객체입니다. 소비 진행 위치를 기억하므로, 읽을 때마다 마지막 소비 이후 기본 테이블에서 발생한 변경 사항만 반환합니다. 소비 오프셋은 변경 사항을 대상 테이블에 쓰는 트랜잭션 내에서 함께 이동하므로, 변경 사항이 누락되거나 중복 소비되지 않습니다.

:::caution 실험적 기능
이 기능은 버전 5.0.0부터 제공되는 실험적 기능입니다. FE 구성에서 `enable_feature_binlog = true`와 `enable_table_stream = true`를 설정해야 합니다.
:::

## 기본 개념 {#basic-concepts}

<!-- Knowledge type: Concept description -->

| 개념 | 설명 |
|---|---|
| 기본 테이블 | Stream이 추적하는 테이블로, Row Binlog가 활성화되어 있어야 합니다. 하나의 기본 테이블에 여러 Stream을 둘 수 있으며, 각 Stream은 독립적으로 소비합니다 |
| 소비 오프셋 | Stream은 기본 테이블의 각 파티션에 대해 지금까지 소비한 커밋 타임스탬프(TSO)를 기록합니다. Stream을 읽으면 각 파티션의 오프셋부터 문 실행 시작 시점의 최신 커밋까지 발생한 변경 사항을 반환합니다 |
| 변경 유형 | `APPEND`(삽입), `UPDATE_BEFORE`(업데이트 전 값), `UPDATE_AFTER`(업데이트 후 값), `DELETE`(삭제, 삭제 전 값 포함) |
| 소비 유형 | Stream 생성 시 지정하는 `type`으로, 변경 사항을 출력하는 세분화 수준을 결정합니다. [소비 유형](#consumption-types)을 참조하세요 |
| 읽기와 소비의 차이 | 일반 `SELECT`는 변경 사항을 읽기만 하며 오프셋을 이동시키지 않습니다. `INSERT INTO ... SELECT ... FROM <stream>`은 쓰기가 성공하면 오프셋을 이동시킵니다. [읽기와 소비](#reading-and-consuming)를 참조하세요 |

:::info IVM 내부 Stream
[Incremental View Maintenance (IVM)](../../query-acceleration/materialized-view/async-materialized-view/incremental-materialized-view)는 이름이 `__doris_ivm_stream_`으로 시작하는 내부 Stream을 자동으로 생성합니다. 이러한 Stream은 직접 생성하거나 소비하거나 삭제할 필요가 없으며, Doris는 일반 `INSERT INTO` 문에서 이러한 Stream을 사용하는 것을 허용하지 않습니다.
:::

## 사전 요구 사항 {#prerequisites}

<!-- Knowledge type: Environment requirements -->

- Doris 5.0.0 이상이며, FE에서 `enable_feature_binlog = true`와 `enable_table_stream = true`가 설정되어 있어야 합니다.
- Row Binlog가 활성화된 내부 기본 테이블이 필요합니다. `min_delta` / `detail` 유형에는 추가로 `binlog.need_historical_value`가 활성화된 Unique Key MoW 테이블이 필요합니다. [Row Binlog](row-binlog#supported-scope-and-limitations)를 참조하세요.
- Stream이 속한 데이터베이스에 대한 `CREATE_PRIV`와 기본 테이블에 대한 `SELECT_PRIV`가 필요합니다.

## Stream 생성 및 관리 {#creating-and-managing-streams}

<!-- Knowledge type: Operational steps + Syntax reference -->

### Stream 생성 {#creating-a-stream}

```sql
CREATE STREAM [IF NOT EXISTS] [<db_name>.]<stream_name>
ON TABLE [<db_name>.]<table_name>
[COMMENT '<comment>']
[PROPERTIES (
    "type" = "<append_only | min_delta | detail>",
    "show_initial_rows" = "<true | false>"
)]
```

| 속성 | 기본값 | 설명 |
|---|---|---|
| `type` | `min_delta` | 소비 유형입니다. `min_delta`와 `detail`은 기본 테이블이 `binlog.need_historical_value`가 활성화된 Unique Key MoW 테이블이어야 합니다. Duplicate Key 테이블에서 `min_delta`는 `append_only`로 동작합니다 |
| `show_initial_rows` | `false` | Stream 생성 시 이미 존재하는 데이터를 변경 사항으로 출력할지 여부입니다. [초기 행](#initial-rows)을 참조하세요 |

예시:

```sql
CREATE STREAM orders_stream ON TABLE orders
COMMENT 'sync order changes to dwd'
PROPERTIES (
    "type" = "min_delta",
    "show_initial_rows" = "false"
);
```

Stream 생성 요구 사항과 각 요구 사항을 충족하지 못했을 때 발생하는 오류는 다음과 같습니다.

| 요구 사항 | 충족하지 못했을 때 발생하는 오류 |
|---|---|
| 기본 테이블에서 Row Binlog 활성화 | `Base Olap table ... need to enable row binlog for table stream` |
| `type = min_delta`인 경우, `binlog.need_historical_value`가 활성화된 MoW 기본 테이블 | `MIN_DELTA table stream requires base mow table to enable binlog.need_historical_value=true` |
| Stream이 속한 데이터베이스에 대한 `CREATE_PRIV`와 기본 테이블에 대한 `SELECT_PRIV` | - |

Stream과 기본 테이블은 서로 다른 데이터베이스에 있어도 됩니다. Stream은 테이블이나 뷰와 같은 이름을 사용할 수 없습니다. `CREATE OR REPLACE STREAM`은 아직 지원되지 않습니다. 전체 구문은 [CREATE STREAM](../../sql-manual/sql-statements/table-and-view/stream/CREATE-STREAM)을 참조하세요.

### Stream 조회 {#viewing-streams}

```sql
-- List the Streams in the current database
SHOW STREAMS;
SHOW STREAMS FROM demo LIKE 'orders%';

-- Show the CREATE STREAM statement
SHOW CREATE STREAM orders_stream;

-- Show the columns of the Stream (the same as the current visible columns of the base table)
DESC orders_stream;
```

```text
mysql> SHOW CREATE STREAM orders_stream\G
*************************** 1. row ***************************
       Stream: orders_stream
Create Stream: CREATE STREAM `orders_stream`
ON TABLE internal.demo.orders
COMMENT 'sync order changes to dwd'
PROPERTIES (
"type" = "MIN_DELTA",
"show_initial_rows" = "false"
);
```

`information_schema.table_streams`는 모든 Stream과 그 상태를 나열하며, `information_schema.table_stream_consumption`은 각 파티션의 소비 오프셋과 소비 대기량을 보여줍니다.

```sql
SELECT STREAM_NAME, CONSUME_TYPE, BASE_TABLE_DB, BASE_TABLE_NAME, ENABLED, IS_STALE, STALE_REASON
FROM information_schema.table_streams
WHERE DB_NAME = 'demo';
```

```text
+---------------+--------------+---------------+-----------------+---------+----------+--------------+
| STREAM_NAME   | CONSUME_TYPE | BASE_TABLE_DB | BASE_TABLE_NAME | ENABLED | IS_STALE | STALE_REASON |
+---------------+--------------+---------------+-----------------+---------+----------+--------------+
| orders_stream | MIN_DELTA    | demo          | orders          |       1 |        0 | N/A          |
+---------------+--------------+---------------+-----------------+---------+----------+--------------+
```

두 시스템 테이블의 전체 열 설명은 [table_streams](../../admin-manual/system-tables/information_schema/table_streams)와 [table_stream_consumption](../../admin-manual/system-tables/information_schema/table_stream_consumption)을 참조하세요. 각 문에 대한 설명은 [SHOW STREAMS](../../sql-manual/sql-statements/table-and-view/stream/SHOW-STREAMS)와 [SHOW CREATE STREAM](../../sql-manual/sql-statements/table-and-view/stream/SHOW-CREATE-STREAM)을 참조하세요.

### Stream 수정 {#modifying-a-stream}

현재는 설명만 수정할 수 있습니다.

```sql
ALTER STREAM orders_stream SET COMMENT 'new comment';
```

소비 유형과 `show_initial_rows`는 생성 후 변경할 수 없습니다. 변경하려면 Stream을 삭제한 뒤 다시 생성하세요. 이 문에 대한 설명은 [ALTER STREAM](../../sql-manual/sql-statements/table-and-view/stream/ALTER-STREAM)을 참조하세요.

### Stream 삭제 {#dropping-a-stream}

```sql
DROP STREAM [IF EXISTS] [<db_name>.]<stream_name> [FORCE];
```

- Stream을 삭제해도 기본 테이블이나 해당 테이블의 Row Binlog에는 영향을 주지 않습니다.
- 기본 테이블이 삭제된 Stream은 Catalog에 남습니다. `FORCE`를 사용하여 삭제하세요.
- 컴퓨팅과 스토리지가 분리된 모드에서는 반드시 `DROP STREAM ... FORCE`를 사용해야 합니다.
- Stream에 `DROP TABLE`을 실행하면 실패하며, `DROP STREAM`을 사용하라는 안내가 표시됩니다.

이 문에 대한 설명은 [DROP STREAM](../../sql-manual/sql-statements/table-and-view/stream/DROP-STREAM)을 참조하세요.

## 소비 유형 {#consumption-types}

<!-- Knowledge type: Behavior rules + Selection guide -->
<!-- Use cases: Choosing between append_only / min_delta / detail -->

| 소비 유형 | 출력 | 적합한 용도 | 기본 테이블 요구 사항 |
|---|---|---|---|
| `append_only` | 삽입된 행만 출력하며, 업데이트와 삭제는 출력하지 않음 | 추가 전용 로그 및 이벤트 테이블, 다운스트림에서 새 데이터만 필요한 경우 | Row Binlog 활성화 |
| `min_delta`(기본값) | 두 소비 사이의 모든 변경 사항을 키별로 통합하여 최종 변경 사항만 출력 | 최소한의 행을 처리하여 다운스트림 테이블을 동기화하는 경우 | `binlog.need_historical_value`가 활성화된 Unique Key MoW 테이블 |
| `detail` | 변경 사항을 통합하지 않고 모든 변경을 행 단위로 출력 | 감사, 재생 등 전체 수정 이력이 필요한 모든 경우 | `binlog.need_historical_value`가 활성화된 Unique Key MoW 테이블 |

아래에서는 동일한 데이터로 세 소비 유형을 비교합니다. 기본 테이블 `orders`는 before image가 활성화된 Unique Key MoW 테이블이며, Stream을 생성한 후 다음 문을 실행합니다.

```sql
INSERT INTO orders VALUES (1, 'paid', 100.00);      -- update existing order 1
DELETE FROM orders WHERE order_id = 2;              -- delete existing order 2
INSERT INTO orders VALUES (4, 'created', 400.00);   -- new order 4
INSERT INTO orders VALUES (5, 'created', 500.00);   -- new order 5
DELETE FROM orders WHERE order_id = 5;              -- delete order 5 again
```

그런 다음 다음 쿼리를 실행합니다.

```sql
SELECT order_id, status, amount, __DORIS_STREAM_CHANGE_TYPE_COL__ AS change_type
FROM <stream>
ORDER BY __DORIS_STREAM_SEQUENCE_COL__, __DORIS_STREAM_LSN_COL__;
```

### append_only {#append_only}

삽입된 행만 출력하며, 업데이트와 삭제는 출력하지 않습니다. 추가 전용 로그 및 이벤트 테이블이나 다운스트림에서 새 데이터만 필요한 경우에 적합합니다.

```text
+----------+---------+--------+-------------+
| order_id | status  | amount | change_type |
+----------+---------+--------+-------------+
|        4 | created | 400.00 | APPEND      |
|        5 | created | 500.00 | APPEND      |
+----------+---------+--------+-------------+
```

- 주문 1의 업데이트와 주문 2의 삭제는 걸러집니다.
- 주문 5의 삽입은 출력되며, 이후 삭제로 취소되지 않습니다.
- MoW 테이블에서는 존재하지 않는 키를 쓰는 경우만 삽입으로 간주합니다. 기존 키를 쓰는 경우는 업데이트이므로 출력하지 않습니다.

### min_delta (기본값) {#min_delta-default}

두 소비 사이의 모든 변경 사항을 키별로 통합하여 최종 변경 사항만 출력합니다.

| 소비 시작 시 키 존재 여부 | 현재 존재 여부 | 출력 |
|---|---|---|
| 아니요 | 예 | 현재 값을 담은 `APPEND` 한 행 |
| 예 | 예(그사이에 수정됨) | `UPDATE_BEFORE` 한 행(시작 시점의 값) + `UPDATE_AFTER` 한 행(현재 값) |
| 예 | 아니요 | 시작 시점의 값을 담은 `DELETE` 한 행 |
| 아니요 | 아니요 | 없음 |

```text
+----------+---------+--------+---------------+
| order_id | status  | amount | change_type   |
+----------+---------+--------+---------------+
|        1 | created | 100.00 | UPDATE_BEFORE |
|        1 | paid    | 100.00 | UPDATE_AFTER  |
|        2 | created | 200.00 | DELETE        |
|        4 | created | 400.00 | APPEND        |
+----------+---------+--------+---------------+
```

- 주문 5는 삽입된 후 삭제되어 최종 변경 사항이 없으므로 아무것도 출력하지 않습니다.
- 두 소비 사이에 여러 번 업데이트된 키는 `UPDATE_BEFORE` / `UPDATE_AFTER` 한 쌍만 출력하며, 중간 값은 통합 과정에서 제외됩니다.
- 통합은 파티션의 현재 소비 오프셋부터 시작합니다. 이번 소비 이후 주문 4가 다시 수정되면, 다음 읽기의 `UPDATE_BEFORE`는 이번 소비 시점의 값이 됩니다.

`min_delta`는 다운스트림 테이블을 동기화할 때 가장 흔히 사용하는 유형입니다. 다운스트림에서 `APPEND` / `UPDATE_AFTER` 행을 쓰고 `DELETE` 행에 따라 삭제를 적용하면, 최소한의 행을 처리하면서 기본 테이블과 일관성을 유지할 수 있습니다.

### detail {#detail}

모든 변경 사항을 행 단위로 출력합니다. 업데이트는 `UPDATE_BEFORE` 행과 `UPDATE_AFTER` 행으로 나뉘며, 변경 사항을 통합하지 않습니다. 감사, 재생 등 전체 수정 이력이 필요한 모든 경우에 적합합니다.

```text
+----------+---------+--------+---------------+
| order_id | status  | amount | change_type   |
+----------+---------+--------+---------------+
|        1 | created | 100.00 | UPDATE_BEFORE |
|        1 | paid    | 100.00 | UPDATE_AFTER  |
|        2 | created | 200.00 | DELETE        |
|        4 | created | 400.00 | APPEND        |
|        5 | created | 500.00 | APPEND        |
|        5 | created | 500.00 | DELETE        |
+----------+---------+--------+---------------+
```

### Duplicate Key 테이블에서의 동작 {#behavior-on-duplicate-key-tables}

Duplicate Key 테이블은 삽입만 기록하므로 세 유형의 출력이 동일합니다. 쓰인 각 행이 하나의 `APPEND`가 되고, 동일한 키를 여러 번 써도 병합되지 않으며, `DELETE` 문으로 삭제된 행은 출력되지 않습니다([Row Binlog](row-binlog#duplicate-key-tables) 참조). Duplicate Key 테이블에 생성한 `min_delta` Stream은 자동으로 `append_only`로 처리됩니다.

## 초기 행 {#initial-rows}

<!-- Knowledge type: Configuration parameters + Behavior rules -->
<!-- Use cases: Syncing the existing data first, then the increments -->

`show_initial_rows`는 Stream 생성 시 이미 존재하는 데이터를 출력할지 결정합니다.

| 값 | 동작 |
|---|---|
| `false`(기본값) | 소비 오프셋을 생성 시점의 각 파티션 최신 커밋으로 초기화하며, 생성 이후의 변경 사항만 출력합니다 |
| `true` | 첫 읽기에서 기본 테이블의 현재 전체 데이터를 `APPEND` 행으로 출력합니다. 각 행의 `__DORIS_STREAM_SEQUENCE_COL__`은 해당 파티션의 커밋 타임스탬프입니다. 해당 소비 이후 Stream은 증분 모드로 전환됩니다 |

`show_initial_rows = true`는 별도의 전체 데이터 적재 없이 "기존 데이터를 먼저 동기화한 다음 증분 데이터를 계속 동기화"하는 패턴에 적합합니다. 첫 읽기는 **읽기 시점의** 전체 이미지를 반환한다는 점에 유의하세요. Stream 생성부터 첫 소비 사이에 발생한 변경 사항은 별도의 변경 사항으로 출력되지 않고 해당 이미지에 반영됩니다.

이 값과 관계없이 Stream 생성 후 추가된 파티션은 모든 데이터가 변경 사항으로 출력됩니다.

## 읽기와 소비 {#reading-and-consuming}

<!-- Knowledge type: Behavior rules + Operational examples -->
<!-- Use cases: Understanding which operations advance the consumption offset -->

### 읽기만으로는 오프셋이 이동하지 않음 {#reads-do-not-advance-the-offset}

Stream에 대한 일반 `SELECT`는 각 파티션의 소비 오프셋부터 문 실행 시작 시점의 최신 커밋까지 발생한 변경 사항을 반환합니다. 오프셋은 이동하지 않으므로, 쿼리를 반복하면 동일한 결과를 반환합니다. 단, 그사이에 기본 테이블에 새로운 쓰기가 없어야 합니다. 두 쿼리 사이에 반영된 쓰기는 이후 쿼리에 나타납니다.

Stream은 일반 테이블처럼 WHERE, JOIN, 집계, CTE 등과 함께 사용할 수 있습니다.

```sql
-- Only deletes
SELECT order_id FROM orders_stream
WHERE __DORIS_STREAM_CHANGE_TYPE_COL__ = 'DELETE';

-- Count the pending changes
SELECT __DORIS_STREAM_CHANGE_TYPE_COL__, COUNT(*)
FROM orders_stream GROUP BY 1;
```

### INSERT ... SELECT는 오프셋을 이동시킴 {#insert--select-advances-the-offset}

`INSERT INTO <target> SELECT ... FROM <stream>`은 쓰기 트랜잭션이 커밋될 때 관련 파티션의 소비 오프셋을 이번 읽기 범위의 상한으로 이동시킵니다.

```sql
INSERT INTO dwd_orders
SELECT order_id, status, amount
FROM orders_stream
WHERE __DORIS_STREAM_CHANGE_TYPE_COL__ IN ('APPEND', 'UPDATE_AFTER');
```

소비 시 동작은 다음과 같습니다.

| 동작 특성 | 설명 |
|---|---|
| 원자성 | 대상 테이블에 쓰는 작업과 오프셋 이동은 하나의 트랜잭션에서 수행됩니다. 문이 실패하거나 취소되면 오프셋은 그대로 유지되며, 다음 소비에서 같은 배치를 다시 읽습니다 |
| 중복 없음 | 소비된 변경 사항 배치는 다시 반환되지 않습니다. 두 세션이 같은 Stream의 같은 파티션을 동시에 소비하면, 나중에 커밋하는 트랜잭션은 실패하고(`target offset already consumed`) 롤백되므로 중복 소비가 발생하지 않습니다 |
| 필터링된 행은 건너뜀 | SELECT가 WHERE로 일부 행을 걸러냈는지와 관계없이, 오프셋은 읽기 범위를 기준으로 이동합니다. 위 예시에서 걸러진 `UPDATE_BEFORE` 및 `DELETE` 행은 다시 나타나지 않습니다. 다운스트림에 삭제도 필요하다면 같은 문에서 함께 쓰거나 별도의 Stream으로 소비하세요 |
| 결과가 비어 있어도 이동 | 읽기 결과에 행이 없어도 오프셋은 이번 읽기 범위의 상한으로 이동합니다 |
| 하나의 문으로 여러 Stream 소비 가능 | 모든 관련 Stream의 오프셋이 이동합니다. 하나의 문에서 같은 Stream을 여러 번 참조하더라도(별칭, CTE, 하위 쿼리) 오프셋은 한 번만 이동하며, 모든 참조에서 동일한 데이터를 읽습니다 |

대상 테이블은 Doris 내부 테이블이어야 합니다. 컴퓨팅과 스토리지가 분리된 모드에서는 소비 문이 일반 `INSERT INTO ... SELECT`여야 합니다. 명시적 트랜잭션(`BEGIN ... COMMIT`) 내에서 실행하거나 Group Commit과 함께 실행하면 `Cloud Table Stream consumption only supports a normal INSERT into a local OLAP table` 오류가 발생합니다.

### 일반적인 소비 패턴 {#a-typical-consumption-pattern}

`min_delta` 변경 사항을 Unique Key 대상 테이블에 동기화합니다. 삽입 및 업데이트 후 값은 직접 쓰고, 삭제는 삭제 표시를 통해 적용합니다.

```sql
CREATE TABLE dwd_orders (
    order_id BIGINT,
    status   VARCHAR(16),
    amount   DECIMAL(10, 2)
)
UNIQUE KEY(order_id)
DISTRIBUTED BY HASH(order_id) BUCKETS 8
PROPERTIES ("enable_unique_key_merge_on_write" = "true");

INSERT INTO dwd_orders (order_id, status, amount, __DORIS_DELETE_SIGN__)
SELECT order_id, status, amount,
       CASE WHEN __DORIS_STREAM_CHANGE_TYPE_COL__ = 'DELETE' THEN 1 ELSE 0 END
FROM orders_stream
WHERE __DORIS_STREAM_CHANGE_TYPE_COL__ IN ('APPEND', 'UPDATE_AFTER', 'DELETE');
```

이 문을 일정에 따라 실행하면 가장 간단한 증분 동기화 파이프라인을 구성할 수 있습니다. 예를 들어 Doris [Job Scheduler](../../admin-manual/workload-management/job-scheduler)나 외부 스케줄러를 사용할 수 있습니다. Unique Key 대상 테이블에 대한 쓰기는 본질적으로 멱등성을 가지므로, 커밋 후 스케줄러가 상태를 기록하기 전에 실행이 실패하여 다시 실행되더라도 잘못된 데이터가 생성되지 않습니다.

## 가상 열 {#virtual-columns}

<!-- Knowledge type: Parameter reference -->

Stream의 열은 기본 테이블의 현재 표시되는 열과 가상 열 세 개로 구성됩니다. 기본 테이블에서 `ADD COLUMN` / `DROP COLUMN`을 실행하면 자동으로 동기화됩니다. 가상 열은 `SELECT *`에 포함되지 않으므로 명시적으로 나열해야 합니다.

| 가상 열 | 유형 | 설명 |
|---|---|---|
| `__DORIS_STREAM_CHANGE_TYPE_COL__` | STRING | 변경 유형: `APPEND` / `UPDATE_BEFORE` / `UPDATE_AFTER` / `DELETE` |
| `__DORIS_STREAM_SEQUENCE_COL__` | BIGINT | 변경 사항의 커밋 타임스탬프(TSO)입니다. 같은 트랜잭션에서 발생한 변경 사항은 동일한 값을 갖습니다 |
| `__DORIS_STREAM_LSN_COL__` | BIGINT | 트랜잭션 내 변경 사항의 순서 번호입니다. `ORDER BY __DORIS_STREAM_SEQUENCE_COL__, __DORIS_STREAM_LSN_COL__`은 변경 사항이 발생한 순서입니다 |

`<stream>@snapshot()`과 `<stream>@reset()`은 변경 사항 대신 테이블 이미지를 읽으며, 가상 열을 제공하지 않습니다. [Table Stream 고급 기능](table-stream-advanced)을 참조하세요.

## 제한 사항 {#limitations}

<!-- Knowledge type: Usage limitations -->

- 기본 테이블은 Row Binlog가 활성화된 내부 테이블이어야 합니다. 지원되는 테이블 모델과 열 유형 제한은 [Row Binlog](row-binlog#supported-scope-and-limitations)를 참조하세요.
- Stream은 기본 테이블의 기본 인덱스만 읽습니다. rollup / 구체화된 뷰는 지정할 수 없으며, `TABLET (...)` 절은 지원하지 않습니다.
- Stream은 `INSERT`, `UPDATE`, `DELETE`의 대상이 될 수 없습니다.
- 소비 유형과 `show_initial_rows`는 생성 후 변경할 수 없습니다.
- Row Binlog 보존 기간은 소비 진행 상황과 관계없이 `binlog.ttl_seconds`로 제어되며, 기본값은 하루입니다. 오프셋이 만료되면 `min_delta` 읽기는 실패하고, `detail`과 `append_only`는 만료된 변경 사항을 건너뜁니다. 현재 구현에서 `IS_STALE` / `STALE_REASON`은 TTL 만료를 보고하지 않습니다. 보존 기간 내에 소비하세요. [보존 및 정리](row-binlog#retention-and-cleanup)를 참조하세요.
- 기본 테이블 삭제, 파티션 삭제 또는 교체와 같은 작업이 Stream에 미치는 영향은 [Table Stream 고급 기능](table-stream-advanced#effect-of-base-table-changes)을 참조하세요.

## 자주 묻는 질문 {#faq}

<!-- Knowledge type: FAQ -->

| 질문 | 답변 |
|---|---|
| 방금 생성한 Stream이 비어 있는 이유는 무엇인가요? | `show_initial_rows = false`(기본값)에서는 생성 시 이미 존재하는 데이터가 변경 사항으로 출력되지 않습니다. 기존 데이터가 필요하다면 `show_initial_rows = true`로 Stream을 생성하세요. [초기 행](#initial-rows)을 참조하세요 |
| `SELECT *`에 변경 유형이 표시되지 않는 이유는 무엇인가요? | 가상 열은 `SELECT *`에 포함되지 않습니다. `__DORIS_STREAM_CHANGE_TYPE_COL__`과 다른 가상 열을 명시적으로 나열하세요 |
| 소비 중 WHERE로 걸러진 행을 다시 읽을 수 있나요? | 아니요. 필터링 여부와 관계없이 오프셋은 읽기 범위를 기준으로 이동합니다. 필요한 모든 변경 유형을 같은 문에서 쓰세요 |
| 두 작업이 같은 Stream을 동시에 소비하면 어떻게 되나요? | 나중에 커밋하는 트랜잭션은 `target offset already consumed` 오류와 함께 실패하고 롤백됩니다. 각 파티션을 한 번에 하나의 소비자만 소비하도록 하세요. [여러 Stream과 동시 소비](table-stream-advanced#multiple-streams-and-concurrent-consumption)를 참조하세요 |
| Duplicate Key 테이블에 `min_delta` Stream을 생성할 수 있나요? | 예. 다만 자동으로 `append_only`로 처리되며, `DELETE` 문으로 삭제된 행은 출력되지 않습니다 |
| Stream의 소비 유형을 변경할 수 있나요? | 아니요. 현재 `ALTER STREAM`은 설명만 수정할 수 있습니다. Stream을 삭제한 뒤 다시 생성하세요 |
| 다른 오류에 대한 설명은 어디에 있나요? | [일반적인 오류](table-stream-advanced#common-errors)를 참조하세요 |
