---
{
    "title": "Row Binlog",
    "language": "ko",
    "description": "Doris Row Binlog는 행 수준의 삽입, 갱신, 삭제를 기록합니다. 테이블 속성, TTL 보존 기간, 자동 정리, 지원하는 테이블 모델, 문제 해결 방법을 설명합니다.",
    "keywords": [
        "Row Binlog",
        "행 수준 binlog",
        "Doris binlog",
        "binlog.enable",
        "binlog.format ROW",
        "binlog.need_historical_value",
        "binlog.ttl_seconds",
        "Row Binlog TTL",
        "before image",
        "이전 값",
        "커밋 TSO",
        "__DORIS_BINLOG_OP__",
        "__DORIS_COMMIT_TSO_COL__",
        "binlog() 테이블 함수",
        "Merge-on-Write 변경 레코드",
        "Duplicate Key 변경 레코드",
        "light schema change",
        "enable_mow_light_delete",
        "변경 데이터 캡처",
        "Doris CDC",
        "Incremental View Maintenance",
        "IVM",
        "Not allowed to perform current operation on Table With binlog",
        "Only duplicate and mow table model support binlog"
    ]
}
---

<!-- Knowledge type: Feature description + Parameter reference -->
<!-- Use cases: Enabling row-level change recording on a table / Checking whether a table model is supported / Inspecting change records -->

Row Binlog는 Doris 내부 테이블의 행 수준 변경 로그입니다. 활성화하면 쓰기(삽입, 갱신, 삭제)로 발생한 모든 행 수준 변경 사항이 변경 전후 값 및 커밋 타임스탬프와 함께 영구 저장됩니다. [Table Stream](table-stream), [증분 쿼리](incremental-query), [Incremental View Maintenance (IVM)](../../query-acceleration/materialized-view/async-materialized-view/incremental-materialized-view)의 데이터 소스이며, Flink에서도 [Flink Doris Connector](../../connection-integration/data-integration/flink-doris-connector/incremental-read)를 통해 소비할 수 있습니다(Connector 26.3.0 이상).

변경 레코드는 기본적으로 하루 동안 보존됩니다. 예상되는 최대 소비 지연 시간을 포함하도록 `binlog.ttl_seconds`를 설정하세요. 변경 레코드가 만료되어도 기본 테이블의 데이터는 삭제되지 않습니다.

:::caution 실험적 기능
이 기능은 5.0.0 버전부터 사용할 수 있는 실험적 기능입니다. FE 설정에 `enable_feature_binlog = true`가 필요합니다.
:::

## 사전 요구 사항 {#prerequisites}

<!-- Knowledge type: Environment requirements -->

- Doris 5.0.0 이상.
- `enable_feature_binlog = true`를 FE의 `fe.conf`에 설정해야 합니다(동적 설정이 아니므로 FE를 재시작해야 합니다).
- 자동 정리를 사용하려면 `enable_feature_binlog = true`를 BE의 `be.conf`에도 설정해야 합니다(동적 설정이 아니므로 BE를 재시작해야 합니다).
- Duplicate Key 테이블 또는 cluster key가 없는 Unique Key Merge-on-Write(MoW) 테이블이어야 합니다. [지원 범위 및 제한 사항](#supported-scope-and-limitations)을 참조하세요.
- Row Binlog는 테이블을 생성할 때만 활성화할 수 있으므로 테이블을 생성하기 전에 사용 여부를 검토하세요.

## 기본 개념 {#basic-concepts}

<!-- Knowledge type: Concept description -->

| 개념 | 설명 |
|---|---|
| 변경 레코드 | 기본 테이블에서 트랜잭션이 커밋될 때마다 변경된 각 행에 대해 작업 유형(삽입 / 갱신 / 삭제), 변경 후 값, 선택적으로 변경 전 값(before image)을 포함하는 레코드가 하나씩 생성됩니다 |
| 커밋 타임스탬프(TSO) | 쓰기 트랜잭션이 커밋될 때 FE에서 가져오는 전역적으로 단조 증가하는 타임스탬프로, 물리적 시간 부분(밀리초)과 논리 카운터로 구성됩니다. 하나의 트랜잭션에 속한 모든 변경 사항은 동일한 TSO를 공유합니다. Table Stream 오프셋과 `@incr` 시간 구간은 모두 TSO를 기준으로 합니다 |
| LSN | 트랜잭션 내 변경 레코드의 순번입니다. TSO와 함께 변경 레코드의 순서를 결정합니다 |

## Row Binlog 활성화 {#enabling-row-binlog}

<!-- Knowledge type: Operational steps + Configuration parameters -->

Row Binlog는 `CREATE TABLE`의 테이블 속성을 통해서만 활성화할 수 있으며, 활성화한 후에는 비활성화할 수 없습니다.

```sql
CREATE TABLE orders (
    order_id BIGINT,
    status   VARCHAR(16),
    amount   DECIMAL(10, 2)
)
UNIQUE KEY(order_id)
DISTRIBUTED BY HASH(order_id) BUCKETS 8
PROPERTIES (
    "enable_unique_key_merge_on_write" = "true",
    "binlog.enable" = "true",
    "binlog.format" = "ROW",
    "binlog.need_historical_value" = "true",
    "binlog.ttl_seconds" = "86400"
);
```

`binlog.enable`과 `binlog.format = "ROW"`를 함께 설정해야 합니다. `binlog.enable`만 설정하면 Row Binlog가 활성화되지 않습니다.

### 속성 {#properties}

| 속성 | 값 | 기본값 | 생성 후 변경 가능 여부 | 설명 |
|---|---|---|---|---|
| `binlog.enable` | `true` / `false` | `false` | 활성화한 후에는 비활성화할 수 없음 | binlog 활성화 여부입니다. `binlog.format = "ROW"`와 함께 설정해야 합니다 |
| `binlog.format` | `ROW` | - | 불가 | 행 수준 변경을 기록한다는 의미의 `ROW`여야 합니다. 값은 대소문자를 구분하며, 소문자 `row`를 사용하면 `Invalid binlog format value: row` 오류가 발생합니다 |
| `binlog.need_historical_value` | `true` / `false` | `false` | 불가 | 변경 전 값(before image)을 기록할지 여부입니다. Unique Key MoW 테이블에서만 `true`로 설정할 수 있습니다. `min_delta` / `detail` Table Stream, `MIN_DELTA` 증분 쿼리, 갱신 또는 삭제를 처리해야 하는 IVM은 이 속성에 의존합니다 |
| `binlog.ttl_seconds` | 양의 정수(초) | `86400`(하루) | 가능 | 변경 레코드의 보존 기간입니다. 만료된 레코드는 증분 읽기에서 필터링되고 백그라운드 compaction을 통해 회수됩니다. `0`과 음수는 허용되지 않습니다. [보존 및 정리](#retention-and-cleanup)를 참조하세요 |
| `binlog.max_bytes` | 정수(바이트) | 무제한 | 가능 | 보존 크기 한도입니다. **현재 버전에서는 효과가 없습니다** |
| `binlog.max_history_nums` | 정수 | 무제한 | 가능 | 보존 개수 한도입니다. **현재 버전에서는 효과가 없습니다** |

### 변경 불가능한 속성 변경 {#changing-immutable-properties}

기존 테이블에서 변경 불가능한 속성을 변경하려고 하면 즉시 실패합니다.

```sql
ALTER TABLE orders SET ("binlog.enable" = "false");
-- ERROR: can't disable binlog when format is [Row]

ALTER TABLE orders SET ("binlog.need_historical_value" = "false");
-- ERROR: not support change binlog.need_historical_value from true to false

ALTER TABLE t_without_binlog SET ("binlog.format" = "ROW");
-- ERROR: not support change binlog format from STATEMENT_AND_SNAPSHOT to ROW
```

Row Binlog가 없는 기존 테이블의 경우, Row Binlog가 활성화된 새 테이블을 생성하고 데이터를 적재한 다음 [`ALTER TABLE ... REPLACE WITH TABLE`](../../sql-manual/sql-statements/table-and-view/table/ALTER-TABLE-REPLACE)을 사용하여 두 테이블을 원자적으로 교체하세요.

### 속성 확인 {#viewing-the-properties}

`SHOW CREATE TABLE`은 모든 `binlog.*` 속성을 표시합니다.

```sql
SHOW CREATE TABLE orders\G
```

```text
...
"binlog.enable" = "true",
"binlog.ttl_seconds" = "86400",
"binlog.max_bytes" = "9223372036854775807",
"binlog.max_history_nums" = "9223372036854775807",
"binlog.format" = "ROW",
"binlog.need_historical_value" = "true",
...
```

## 지원 범위 및 제한 사항 {#supported-scope-and-limitations}

<!-- Knowledge type: Support matrix -->
<!-- Use cases: Checking table model / column type support before creating the table -->

### 테이블 모델 {#table-models}

| 테이블 모델 | 지원 여부 | 참고 사항 |
|---|---|---|
| Duplicate Key | 지원 | 삽입된 행만 기록됩니다. `binlog.need_historical_value = true`를 설정하면 `Duplicate table model don't support record historical value` 오류와 함께 거부됩니다 |
| Unique Key, Merge-on-Write | 지원 | 삽입, 갱신, 삭제가 기록되며 before image를 활성화할 수 있습니다. **cluster key가 있는 테이블은 지원되지 않으며**, `Unique merge-on-write tables with cluster keys do not support binlog<Row>` 오류가 발생합니다 |
| Unique Key, Merge-on-Read | 미지원 | `Only duplicate and mow table model support binlog<Row>` 오류가 발생합니다 |
| Aggregate Key | 미지원 | 위와 동일 |

### 열 유형 {#column-types}

| 제한 사항 | 참고 사항 |
|---|---|
| 자동 증가 열 | 지원되지 않습니다. `CREATE TABLE`과 `ADD COLUMN` 모두 거부합니다 |
| VARIANT 열 | 지원되지 않습니다. `CREATE TABLE`과 `ADD COLUMN` 모두 거부합니다 |

### 배포 모드 {#deployment-modes}

Row Binlog는 스토리지와 컴퓨팅이 통합된 모드와 컴퓨팅과 스토리지가 분리된 모드 모두에서 활성화할 수 있습니다.

### 쓰기 방식 {#write-methods}

모든 쓰기 방식(`INSERT`, `UPDATE`, `DELETE`, Stream Load, Broker Load, Routine Load, Flink / Spark 커넥터 등)으로 발생한 변경 사항이 기록되며, 부분 열 갱신과 유연한 부분 열 갱신도 포함됩니다.

## 변경 레코드 모델 {#change-record-model}

<!-- Knowledge type: Behavior rules -->
<!-- Use cases: Understanding which change records each write operation produces -->

### 작업 유형 및 숨겨진 열 {#operation-types-and-hidden-columns}

각 변경 레코드에는 기본 테이블의 모든 표시 열(변경 후 값)과 다음 숨겨진 열이 포함됩니다.

| 숨겨진 열 | 유형 | 설명 |
|---|---|---|
| `__DORIS_BINLOG_OP__` | TINYINT | 작업 유형입니다. `binlog()` 테이블 함수가 반환하는 원시 레코드에서는 `0` 삽입, `1` 갱신, `2` 삭제를 나타냅니다. `@incr` 증분 쿼리에서는 갱신이 두 행으로 나뉩니다. `0` 삽입, `1` 삭제, `2` 갱신 전, `3` 갱신 후를 나타냅니다 |
| `__DORIS_BINLOG_TSO__` | BIGINT | 커밋 타임스탬프 |
| `__DORIS_BINLOG_LSN__` | BIGINT | 트랜잭션 내 순번 |
| `__BEFORE__<column>__` | 원래 열과 동일 | 변경 전 값으로, 키가 아닌 열마다 하나씩 존재합니다. `binlog.need_historical_value = true`인 경우에만 존재합니다 |

기본 테이블 자체에도 각 행의 마지막 쓰기 커밋 타임스탬프를 저장하는 숨겨진 열 `__DORIS_COMMIT_TSO_COL__`이 추가됩니다. `SET show_hidden_columns = true`를 실행한 후 직접 쿼리할 수 있습니다.

```sql
SET show_hidden_columns = true;
SELECT order_id, status, __DORIS_COMMIT_TSO_COL__ FROM orders;
```

### Duplicate Key 테이블 {#duplicate-key-tables}

Duplicate Key 테이블에는 삽입만 존재합니다. 모든 쓰기의 각 행은 삽입 레코드로 기록되며, 키가 같은 행도 병합되지 않습니다.

`DELETE FROM ... WHERE ...`를 Duplicate Key 테이블에서 실행하면 delete predicate로 행을 표시하며 **변경 레코드를 생성하지 않습니다**. 따라서 Table Stream 또는 `@incr`를 사용하는 다운스트림 소비자는 이러한 삭제를 확인할 수 없습니다. 삭제를 다운스트림에 전달해야 한다면 Unique Key MoW 테이블을 사용하세요.

### Unique Key MoW 테이블 {#unique-key-mow-tables}

| 쓰기 작업 | 기록 방식 |
|---|---|
| 존재하지 않는 키 쓰기 | 삽입 레코드 하나 |
| 이미 존재하는 키 쓰기(동일한 키를 사용한 `INSERT`, `UPDATE`, 부분 열 갱신) | 갱신 후 전체 행을 포함하는 갱신 레코드 하나. before image가 활성화되어 있으면 갱신 전 값도 포함합니다 |
| 기존 키 삭제(`DELETE`, 삭제 표시가 포함된 데이터 적재) | 삭제 레코드 하나. before image가 활성화되어 있으면 삭제 전 값을 포함하며, 그렇지 않으면 키 열에만 값이 있습니다 |
| 삭제한 키를 다시 쓰기 | 삽입 레코드 하나(이전 버전은 유효한 행이 아니라 delete marker입니다) |
| 현재 보이는 행보다 작은 sequence 열 값 쓰기 | 쓰기가 무시되며 변경 레코드가 생성되지 않습니다 |

`DELETE`는 MoW 테이블에서 기본적으로 delete marker를 기록하는 방식으로 구현되므로 삭제 레코드를 생성합니다. 테이블 속성 `enable_mow_light_delete`가 `true`이면 `DELETE`는 대신 delete predicate를 사용하며, Duplicate Key 테이블과 마찬가지로 변경 레코드를 생성하지 않습니다. Row Binlog를 사용하는 테이블에서는 이 속성을 기본값인 `false`로 유지하세요.

부분 열 갱신은 갱신된 열만 기록하는 대신 병합된 전체 행을 기록합니다. 유연한 부분 열 갱신(`unique_key_update_mode = UPDATE_FLEXIBLE_COLUMNS`)에서 하나의 배치 내에 동일한 키를 삭제한 후 다시 쓰면 갱신 레코드 하나로 기록됩니다. before image는 삭제 전의 기존 행이며, after image는 새로 기록된 행입니다. 이때 제공되지 않은 열에는 이전 값 대신 기본값이나 NULL이 사용됩니다.

다음 예제는 before image가 활성화된 MoW 테이블의 원시 변경 레코드를 보여 줍니다.

```sql
INSERT INTO orders VALUES (1, 'created', 100.00);
INSERT INTO orders VALUES (1, 'paid', 100.00);
DELETE FROM orders WHERE order_id = 1;
INSERT INTO orders VALUES (1, 'created', 150.00);

SELECT __DORIS_BINLOG_OP__ AS op, order_id, status, amount,
       __BEFORE__status__, __BEFORE__amount__
FROM binlog("table" = "orders")
ORDER BY __DORIS_BINLOG_TSO__, __DORIS_BINLOG_LSN__;
```

```text
+------+----------+---------+--------+--------------------+--------------------+
| op   | order_id | status  | amount | __BEFORE__status__ | __BEFORE__amount__ |
+------+----------+---------+--------+--------------------+--------------------+
|    0 |        1 | created | 100.00 | NULL               |               NULL |
|    1 |        1 | paid    | 100.00 | created            |             100.00 |
|    2 |        1 | paid    | 100.00 | paid               |             100.00 |
|    0 |        1 | created | 150.00 | NULL               |               NULL |
+------+----------+---------+--------+--------------------+--------------------+
```

## DDL 제한 사항 {#ddl-restrictions}

<!-- Knowledge type: Behavior rules -->
<!-- Use cases: Checking which ALTER TABLE operations remain available with Row Binlog enabled -->

Row Binlog가 활성화된 테이블에서는 다음 `ALTER TABLE` 작업만 허용됩니다.

| 허용되는 작업 | 참고 사항 |
|---|---|
| `ADD COLUMN` / `DROP COLUMN` | light schema change만 허용됩니다(테이블에서 기본적으로 활성화되는 `light_schema_change`가 활성화되어 있어야 합니다). 새 열은 변경 레코드에 자동으로 추가됩니다 |
| `CREATE INDEX` / `DROP INDEX` | 경량 인덱스 변경만 허용됩니다 |
| `ADD ROLLUP` / `DROP ROLLUP` / `RENAME ROLLUP` | |
| 파티션 작업: `ADD PARTITION`, `DROP PARTITION`, `MODIFY PARTITION`, `RENAME PARTITION`, `REPLACE PARTITION` | |
| `RENAME`으로 테이블 이름 변경, `REPLACE WITH TABLE` | |
| 테이블 주석 또는 열 주석 변경 | |
| 버킷 구성 변경 | |
| 테이블 속성 변경 | `bloom_filter_columns` / `bloom_filter_fpp` 제외 |
| `ENABLE FEATURE`(예: `SEQUENCE_LOAD`) | 내부적으로 `ADD COLUMN`으로 변환됩니다 |

그 밖의 작업은 `Not allowed to perform current operation on Table With binlog<row>` 오류와 함께 거부됩니다. 대표적인 예는 다음과 같습니다.

- `MODIFY COLUMN`(열 유형, 위치 등의 변경)
- `RENAME COLUMN`
- `ORDER BY`(열 순서 변경)
- `BUILD INDEX`
- bloom filter 속성 변경

`TRUNCATE TABLE`과 백업 / 복원 같은 테이블 수준 작업은 Row Binlog가 있는 테이블에서도 정상적으로 작동합니다. 기본 테이블의 스키마 및 파티션 변경이 기존 Table Stream에 미치는 영향은 [Table Stream 고급](table-stream-advanced#effect-of-base-table-changes)에 설명되어 있습니다.

## 보존 및 정리 {#retention-and-cleanup}

<!-- Knowledge type: Behavior rules -->
<!-- Use cases: Setting retention / Handling expired offsets / Capacity planning -->

Doris 5.0.0부터 `binlog.ttl_seconds`는 스토리지와 컴퓨팅이 통합된 모드와 컴퓨팅과 스토리지가 분리된 모드 모두에서 Row Binlog의 보존 기간을 제어합니다. 보존 기간은 커밋 TSO의 물리적 시간을 기반으로 하며, 현재 Master FE TSO를 기준으로 삼습니다. 커밋 시간이 기준 시간에서 TTL을 뺀 시점과 같거나 그보다 이른 레코드는 만료됩니다. 테이블에 새로운 쓰기가 없어도 보존 구간은 계속 앞으로 이동합니다.

### 보존 기간 설정 {#configuring-retention}

기본 TTL은 `86400`초(하루)입니다. 데이터베이스에 `binlog.ttl_seconds`를 명시적으로 설정하면 새 테이블은 테이블 속성에서 재정의하지 않는 한 이 값을 상속합니다. 데이터베이스 설정을 변경해도 기존 테이블은 변경되지 않습니다. `CREATE TABLE ... LIKE`는 원본 테이블의 TTL을 복사합니다.

위에서 생성한 `orders` 테이블의 변경 사항을 일주일 동안 보존하려면 다음을 실행하세요.

```sql
ALTER TABLE orders SET ("binlog.ttl_seconds" = "604800");
```

문장이 성공하면 `SHOW CREATE TABLE orders`에 다음 항목이 포함됩니다.

```text
"binlog.ttl_seconds" = "604800"
```

TTL은 `0`보다 커야 합니다. `0`과 `-1` 어느 값도 만료를 비활성화하지 않습니다. TTL을 줄이면 기존 레코드가 즉시 만료될 수 있습니다. TTL을 늘리면 물리적으로 남아 있는 레코드를 다시 읽을 수 있게 될 수 있지만, 이미 정리된 레코드는 복구할 수 없습니다. `ALTER TABLE`이 설정을 파티션에 반영하는 도중 실패하면 줄어든 TTL이 이미 적용되었을 수 있습니다. `SHOW CREATE TABLE`로 확인하고 동일한 문장을 다시 실행하여 업데이트를 완료하세요.

### 읽기에 미치는 영향 {#effect-on-reads}

증분 읽기는 물리적 정리가 완료되기 전이라도 문장의 실행 계획을 수립할 때 보존 구간을 적용합니다. 하나의 문장은 하나의 기준 TSO를 사용하며, 새 문장마다 구간을 다시 계산합니다.

| 읽기 방식 | 요청한 시작 시점이 만료된 경우의 동작 |
|---|---|
| `@incr`에 `startTimestamp`를 지정하지 않은 경우 | `MIN_DELTA` 모드를 포함하여 보존 중인 변경 사항만 읽습니다 |
| `@incr`에 `incrementType = MIN_DELTA`와 명시적 `startTimestamp`를 지정한 경우 | 불완전한 순 변경 사항을 반환하지 않도록 `Row binlog offset has expired according to binlog.ttl_seconds` 오류가 발생합니다 |
| `@incr`에 `incrementType = DETAIL` 또는 `APPEND_ONLY`를 지정한 경우 | 실제 시작 시점을 보존 중인 첫 TSO로 옮기고 요청한 구간 중 보존 중인 부분만 반환합니다 |
| Table Stream에 `type = min_delta`를 지정한 경우 | 파티션의 소비 오프셋이 만료되면 동일한 오류가 발생합니다 |
| Table Stream에 `type = detail` 또는 `append_only`를 지정한 경우 | 만료된 변경 사항을 건너뛰고 보존 중인 첫 TSO부터 읽습니다 |
| MoW 스냅샷 읽기(`FOR TIME AS OF`, `FOR VERSION AS OF` 또는 Stream의 `@snapshot()`) | 재구성에 Row Binlog가 필요한 경우, 대상 스냅샷이 만료되었다면 before image가 더 이상 보존 구간에 없으므로 동일한 오류가 발생합니다 |
| `binlog()` 테이블 함수 | TTL 필터를 적용하지 않습니다. 물리적 정리로 제거되기 전까지 만료된 원시 레코드가 계속 표시될 수 있습니다 |

레코드 만료는 소비자를 기다리지 않습니다. Stream이 `IS_STALE` / `STALE_REASON`에서 여전히 사용 가능한 것으로 표시되더라도 보존 구간 내에 변경 사항을 소비하세요. 현재 구현에서는 이 필드들이 TTL 만료를 보고하지 않습니다. 필요한 변경 사항이 만료된 후에는 전체 스냅샷에서 다운스트림 데이터를 다시 구축하세요. Table Stream의 경우 [재설정 절차](table-stream-advanced#reset-reset)에 따라 다운스트림에 데이터를 다시 적재하고 오프셋을 앞으로 이동하세요. IVM의 내부 Stream은 [구체화된 뷰 새로 고침 작업](../../query-acceleration/materialized-view/async-materialized-view/incremental-materialized-view#internal-table-streams)을 통해 관리하세요.

### 예제: 변경 사항 만료 후에도 유지되는 기본 데이터 {#example-expired-changes-with-base-data-preserved}

기존 데이터베이스에서 `CREATE` 및 `LOAD` 권한과 쿼리에 필요한 `SELECT` 권한을 갖춘 상태로 이 예제를 실행하세요.

```sql
CREATE TABLE row_binlog_ttl_demo (id INT, value INT)
DUPLICATE KEY(id)
DISTRIBUTED BY HASH(id) BUCKETS 1
PROPERTIES (
    "replication_num" = "1",
    "binlog.enable" = "true",
    "binlog.format" = "ROW",
    "binlog.ttl_seconds" = "30"
);

INSERT INTO row_binlog_ttl_demo VALUES (1, 10);

SELECT COUNT(*) AS change_count
FROM row_binlog_ttl_demo@incr("incrementType" = "DETAIL");
```

삽입 직후 쿼리는 다음을 반환합니다.

```text
+--------------+
| change_count |
+--------------+
|            1 |
+--------------+
```

30초보다 오래 기다린 다음 증분 쿼리를 다시 실행하세요.

```sql
SELECT COUNT(*) AS change_count
FROM row_binlog_ttl_demo@incr("incrementType" = "DETAIL");
```

```text
+--------------+
| change_count |
+--------------+
|            0 |
+--------------+
```

기본 행은 여전히 존재합니다.

```sql
SELECT id, value FROM row_binlog_ttl_demo;
```

```text
+------+-------+
| id   | value |
+------+-------+
|    1 |    10 |
+------+-------+
```

### 물리적 정리 및 용량 계획 {#physical-cleanup-and-capacity-planning}

백그라운드 compaction은 모든 레코드가 만료된 Row Binlog Rowset을 회수하며, 쓰기가 없는 테이블에서도 작동합니다. 만료되지 않은 레코드도 포함된 Rowset은 모든 레코드가 만료될 때까지 유지됩니다. 정리 과정에서는 기본 테이블의 데이터와 버전 연속성이 보존됩니다. 스토리지는 비동기적으로 회수되므로 TTL은 파일이 삭제되는 기한이나 엄격한 스토리지 크기 한도가 아닙니다.

자동 정리를 사용하려면 BE에서 `enable_feature_binlog = true`를 설정하고 자동 compaction을 활성화해야 합니다. BE 설정 또는 테이블 속성에 `disable_auto_compaction = true`를 설정하면 자동 정리가 일시 중지되지만, 증분 읽기는 여전히 만료된 레코드를 필터링합니다. BE를 재시작한 후에는 Master FE 하트비트에서 유효한 기준 TSO를 받을 때까지 정리가 대기합니다.

`binlog.max_bytes`와 `binlog.max_history_nums`는 여전히 Row Binlog에 효과가 없습니다. 쓰기 양, TTL, 정리 지연에 맞춰 스토리지를 확보하세요. before image가 활성화된 MoW 테이블에서는 갱신할 때마다 이전 값의 복사본이 추가로 저장됩니다. 최대 소비 지연 시간, 새로 고침 간격, 예상 장애 시간을 감당하고 복구 시간도 확보할 수 있도록 TTL을 충분히 길게 설정하세요.

## 쓰기 오버헤드 {#write-overhead}

<!-- Knowledge type: Performance notes -->
<!-- Use cases: Evaluating load throughput before going to production -->

Row Binlog를 활성화하면 모든 쓰기에서 변경 레코드를 추가로 생성하고 영구 저장합니다. MoW 테이블에서는 갱신과 삭제 시 before image를 구성하기 위해 이전 값도 읽습니다. 데이터 적재 처리량은 눈에 띄게 감소하며, 실제 감소 폭은 테이블 스키마와 갱신 비율에 따라 달라집니다. 권장 사항은 다음과 같습니다.

- 실제로 증분 소비가 필요한 테이블에서만 활성화하세요.
- 프로덕션에 적용하기 전에 실제와 유사한 쓰기 워크로드로 처리량 변화를 평가하세요.
- 변경 전 값이 필요하지 않다면 `binlog.need_historical_value`를 활성화하지 마세요(예: `append_only` 방식으로 소비하거나 최신 값만 필요한 경우).

## binlog() 테이블 함수를 사용한 문제 해결 {#troubleshooting-with-the-binlog-table-function}

<!-- Knowledge type: Troubleshooting -->
<!-- Use cases: Confirming whether a write produced the expected changes / Inspecting the change history of a key -->

`binlog()` 테이블 함수는 테이블의 원시 변경 레코드를 반환합니다. 예를 들어 쓰기가 예상한 변경 사항을 생성했는지 확인하거나 특정 키의 변경 이력을 살펴볼 때 사용할 수 있습니다.

:::caution
`binlog()`는 주로 내부 디버깅용이며 프로덕션 데이터 파이프라인에는 권장되지 않습니다. 출력 형식과 매개변수는 버전 간에 달라질 수 있습니다. 실제 증분 소비에는 [Table Stream](table-stream) 또는 [`@incr`](incremental-query)를 사용하세요.
:::

```sql
SELECT __DORIS_BINLOG_OP__, __DORIS_BINLOG_TSO__, __DORIS_BINLOG_LSN__,
       order_id, status, amount
FROM binlog(
    "db" = "demo",
    "table" = "orders",
    "partition" = "p20260914"
)
WHERE order_id = 1
ORDER BY __DORIS_BINLOG_TSO__, __DORIS_BINLOG_LSN__;
```

| 매개변수 | 필수 여부 | 설명 |
|---|---|---|
| `table` | 필수 | 테이블 이름 |
| `db` | 선택 | 데이터베이스 이름. 기본값은 현재 데이터베이스입니다 |
| `partition` | 선택 | 쉼표로 구분한 파티션 이름. 기본값은 모든 파티션입니다 |
| `tablet` | 선택 | 쉼표로 구분한 Tablet ID. 기본값은 모든 Tablet입니다 |

`binlog()`는 변경 사항 병합이나 TTL 필터링 없이 저장된 원시 레코드를 읽으며, `__DORIS_BINLOG_OP__`는 원시 인코딩(`0` 삽입, `1` 갱신, `2` 삭제)을 사용합니다. 물리적 정리가 완료되기 전까지 만료된 레코드가 여기에 계속 표시될 수 있습니다. 전체 구문은 [BINLOG 테이블 함수](../../sql-manual/sql-functions/table-valued-functions/binlog)에 설명되어 있습니다.

## 일반적인 오류 {#common-errors}

<!-- Knowledge type: Troubleshooting -->

| 오류 메시지 | 원인 | 조치 |
|---|---|---|
| `Invalid binlog format value: row` | `binlog.format`을 소문자로 지정했습니다 | 값은 대소문자를 구분하므로 대문자 `ROW`를 사용하세요 |
| `ROW binlog.ttl_seconds must be greater than 0` | TTL이 `0` 또는 음수입니다 | 초 단위의 양의 정수를 설정하세요. 기본값은 `86400`입니다 |
| `Row binlog offset has expired according to binlog.ttl_seconds` | `MIN_DELTA` 시작 시점이나 MoW 스냅샷이 보존 구간을 벗어났습니다 | 전체 스냅샷에서 다운스트림을 다시 구축하고 소비 위치를 다시 맞추세요. [읽기에 미치는 영향](#effect-on-reads)을 참조하세요 |
| `not support change binlog format from STATEMENT_AND_SNAPSHOT to ROW` | `ALTER TABLE`로 기존 테이블에서 Row Binlog를 활성화하려고 했습니다 | Row Binlog는 테이블을 생성할 때만 활성화할 수 있습니다. Row Binlog가 활성화된 새 테이블을 생성하고 데이터를 적재한 다음 `ALTER TABLE ... REPLACE WITH TABLE`로 두 테이블을 교체하세요 |
| `can't disable binlog when format is [Row]` | Row Binlog가 활성화된 테이블에 `binlog.enable = false`를 설정했습니다 | Row Binlog는 활성화한 후에는 비활성화할 수 없습니다 |
| `not support change binlog.need_historical_value from true to false` | `binlog.need_historical_value`를 변경했습니다 | 이 속성은 생성 후 변경할 수 없습니다 |
| `Duplicate table model don't support record historical value` | Duplicate Key 테이블에 `binlog.need_historical_value = true`를 설정했습니다 | Duplicate Key 테이블에는 before image가 없습니다. 해당 속성을 제거하거나, before image가 필요하면 Unique Key MoW 테이블을 사용하세요 |
| `Unique merge-on-write tables with cluster keys do not support binlog<Row>` | MoW 테이블에 cluster key가 있습니다 | cluster key 없이 테이블을 생성하세요 |
| `Only duplicate and mow table model support binlog<Row>` | 테이블 모델이 Aggregate Key 또는 Unique Key Merge-on-Read입니다 | Duplicate Key 또는 Unique Key MoW 테이블을 사용하세요 |
| `Not allowed to perform current operation on Table With binlog<row>` | `MODIFY COLUMN`, `RENAME COLUMN`, `ORDER BY`, `BUILD INDEX`, bloom filter 속성 변경 등 허용되지 않는 DDL을 실행했습니다 | [DDL 제한 사항](#ddl-restrictions)의 허용 목록을 참조하세요 |
