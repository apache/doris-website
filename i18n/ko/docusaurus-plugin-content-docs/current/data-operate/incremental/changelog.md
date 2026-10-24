---
{
    "title": "변경 로그",
    "language": "ko",
    "description": "Doris 변경 로그의 행 단위 삽입, 업데이트, 삭제 기록과 테이블 속성, TTL 보존 기간, 자동 정리, 지원되는 테이블 모델, 문제 해결 방법을 설명합니다.",
    "keywords": [
        "Changelog",
        "Doris changelog",
        "row-level change log",
        "changelog.enable",
        "changelog.need_historical_value",
        "changelog.ttl_seconds",
        "changelog TTL",
        "before image",
        "historical value",
        "commit TSO",
        "__DORIS_CHANGELOG_OP__",
        "__DORIS_COMMIT_TSO_COL__",
        "changelog() table function",
        "Merge-on-Write change records",
        "Duplicate Key change records",
        "light schema change",
        "enable_mow_light_delete",
        "enable_feature_changelog",
        "change data capture",
        "Doris CDC",
        "Incremental View Maintenance",
        "IVM",
        "Not allowed to perform current operation on Table With changelog",
        "Only duplicate and mow table model support changelog"
    ]
}
---

<!-- Knowledge type: Feature description + Parameter reference -->
<!-- Use cases: Enabling row-level change recording on a table / Checking whether a table model is supported / Inspecting change records -->

Changelog는 Doris 내부 테이블의 행 단위 변경 로그입니다. 활성화하면 쓰기 작업(삽입, 업데이트, 삭제)으로 발생하는 모든 행 단위 변경이 변경 전후 값과 커밋 타임스탬프와 함께 저장됩니다. Changelog는 [Table Stream](table-stream), [증분 쿼리](incremental-query), [증분 뷰 유지 관리(IVM)](../../query-acceleration/materialized-view/async-materialized-view/incremental-materialized-view)의 데이터 소스이며, [Flink Doris Connector](../../connection-integration/data-integration/flink-doris-connector/incremental-read)(Connector 26.4.0 이상)를 통해 Flink에서도 소비할 수 있습니다.

변경 레코드는 기본적으로 하루 동안 보존됩니다. 예상되는 최장 소비 지연 시간을 포함하도록 `changelog.ttl_seconds`를 설정하세요. 변경 레코드가 만료되어도 기본 테이블의 데이터는 삭제되지 않습니다.

Changelog는 클러스터 간 복제(CCR)에 사용되는 binlog와 독립적입니다. 별도의 `changelog.*` 속성과 활성화 설정을 사용하며, 하나의 테이블에서 두 기능을 동시에 활성화할 수 없습니다. [CCR binlog](#ccr-binlog)를 참조하세요.

:::caution 실험적 기능
이 기능은 버전 5.0.0부터 제공되는 실험적 기능입니다. FE 구성에서 `enable_feature_changelog = true`로 설정해야 합니다.
:::

:::info row binlog에서 이름 변경
초기 개발 빌드에서는 이 기능을 "row binlog"라고 부르고 `"binlog.enable" = "true"` 및 `"binlog.format" = "ROW"`로 활성화했습니다. 첫 릴리스 전에 changelog로 이름이 변경되었습니다. 해당 빌드에서 이 방식으로 만든 테이블은 더 이상 사용할 수 없습니다. 테이블을 삭제한 뒤 `"changelog.enable" = "true"`로 다시 생성하세요.
:::

## 사전 요구 사항 {#prerequisites}

<!-- Knowledge type: Environment requirements -->

- Doris 5.0.0 이상.
- FE의 `fe.conf`에서 `enable_feature_changelog = true`로 설정해야 합니다. 동적 구성이 아니므로 FE를 재시작해야 합니다. 이 설정은 changelog가 있는 테이블, 커밋 타임스탬프(TSO) 할당, Table Stream 소비를 제어합니다. `enable_feature_binlog`는 CCR binlog만 제어하므로 changelog에는 필요하지 않습니다.
- 자동 정리를 사용하려면 BE의 `be.conf`에서도 `enable_feature_changelog = true`로 설정해야 합니다. 동적 구성이 아니므로 BE를 재시작해야 합니다.
- Duplicate Key 테이블 또는 클러스터 키가 없는 Unique Key Merge-on-Write(MoW) 테이블이 필요합니다. [지원 범위와 제한 사항](#supported-scope-and-limitations)을 참조하세요.
- Changelog는 테이블을 생성할 때만 활성화할 수 있으므로 테이블 생성 전에 사용 여부를 결정하세요.

## 기본 개념 {#basic-concepts}

<!-- Knowledge type: Concept description -->

| 개념 | 설명 |
|---|---|
| 변경 레코드 | 기본 테이블에서 트랜잭션이 커밋될 때마다 변경된 각 행에 대해 작업 유형(삽입 / 업데이트 / 삭제), 변경 후 값, 선택적으로 변경 전 값(before image)을 담은 레코드가 하나씩 생성됩니다. |
| 커밋 타임스탬프(TSO) | 쓰기 트랜잭션이 커밋될 때 FE에서 얻는 전역 단조 증가 타임스탬프로, 물리적 부분(밀리초)과 논리 카운터로 구성됩니다. 한 트랜잭션의 모든 변경은 같은 TSO를 공유합니다. Table Stream 오프셋과 `@incr` 시간 창은 모두 TSO로 측정됩니다. |
| LSN | 트랜잭션 내 변경 레코드의 순서 번호입니다. TSO와 함께 변경 레코드의 순서를 정의합니다. |

## Changelog 활성화 {#enabling-changelog}

<!-- Knowledge type: Operational steps + Configuration parameters -->

Changelog는 `CREATE TABLE`의 테이블 속성으로만 활성화할 수 있으며, 이후에는 비활성화할 수 없습니다.

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
    "changelog.enable" = "true",
    "changelog.need_historical_value" = "true",
    "changelog.ttl_seconds" = "86400"
);
```

`binlog.*` 속성(`binlog.enable`, `binlog.ttl_seconds` 등)은 changelog가 아닌 CCR binlog를 구성합니다. [CCR binlog](#ccr-binlog)를 참조하세요.

### 속성 {#properties}

| 속성 | 값 | 기본값 | 생성 후 변경 가능 여부 | 설명 |
|---|---|---|---|---|
| `changelog.enable` | `true` / `false` | `false` | 아니요 | Changelog 활성화 여부입니다. `CREATE TABLE`에서만 설정하거나 [데이터베이스 기본값](#database-default)에서 상속할 수 있습니다. |
| `changelog.need_historical_value` | `true` / `false` | `false` | 아니요 | 변경 전 값(before image)을 기록할지 여부입니다. Changelog가 활성화되어 있어야 합니다. Unique Key MoW 테이블에서만 `true`로 설정할 수 있습니다. 업데이트나 삭제를 처리해야 하는 `min_delta` / `detail` Table Stream, `MIN_DELTA` 증분 쿼리, IVM은 이 값에 의존합니다. |
| `changelog.ttl_seconds` | 양의 정수(초) | `86400`(하루) | 예 | 변경 레코드의 보존 기간입니다. Changelog가 활성화되어 있어야 합니다. 만료된 레코드는 증분 읽기에서 필터링되고 백그라운드 compaction을 통해 회수됩니다. `0`과 음수는 허용되지 않습니다. [보존 및 정리](#retention-and-cleanup)를 참조하세요. |

### 변경할 수 없는 속성 {#changing-immutable-properties}

기존 테이블에서는 `changelog.enable`과 `changelog.need_historical_value`를 변경할 수 없습니다. 따라서 기존 테이블에서 changelog를 켜거나 끌 수 없습니다. 이러한 변경은 즉시 실패합니다.

```sql
ALTER TABLE orders SET ("changelog.enable" = "false");
-- ERROR: not support change changelog.enable from true to false

ALTER TABLE orders SET ("changelog.need_historical_value" = "false");
-- ERROR: not support change changelog.need_historical_value from true to false

ALTER TABLE t_without_changelog SET ("changelog.enable" = "true");
-- ERROR: not support change changelog.enable from false to true
```

Changelog가 없는 기존 테이블에는 changelog를 활성화한 새 테이블을 만들고 데이터를 적재한 뒤, [`ALTER TABLE ... REPLACE WITH TABLE`](../../sql-manual/sql-statements/table-and-view/table/ALTER-TABLE-REPLACE)을 사용해 두 테이블을 원자적으로 교체하세요.

### 속성 확인 {#viewing-the-properties}

`SHOW CREATE TABLE`은 changelog가 활성화된 테이블의 `changelog.*` 속성을 표시합니다.

```sql
SHOW CREATE TABLE orders\G
```

```text
...
"changelog.enable" = "true",
"changelog.ttl_seconds" = "86400",
"changelog.need_historical_value" = "true",
...
```

### 데이터베이스 기본값 {#database-default}

데이터베이스에서 새로 생성하는 테이블에 changelog를 기본으로 활성화할 수 있습니다.

```sql
CREATE DATABASE changelog_db PROPERTIES ("changelog.enable" = "true");
```

이후 `changelog_db`에서 생성하는 테이블은 `"changelog.enable" = "false"`를 설정하지 않는 한 changelog가 활성화되며, 자체 값을 설정하지 않으면 데이터베이스의 `changelog.ttl_seconds`와 `changelog.need_historical_value`를 사용합니다. Aggregate Key 테이블처럼 changelog를 지원하지 않는 모델의 테이블에는 이러한 데이터베이스에서 `"changelog.enable" = "false"`를 설정해야 합니다. `ALTER DATABASE ... SET PROPERTIES`는 이후 생성되는 테이블의 기본값만 변경합니다.

기본값으로 changelog를 활성화하는 데이터베이스에서는 changelog가 없는 테이블의 `SHOW CREATE TABLE` 결과에 `"changelog.enable" = "false"`가 표시됩니다. 따라서 `CREATE TABLE ... LIKE`나 해당 출력에서 복사한 문장으로도 changelog가 없는 테이블이 생성됩니다.

## 지원 범위와 제한 사항 {#supported-scope-and-limitations}

<!-- Knowledge type: Support matrix -->
<!-- Use cases: Checking table model / column type support before creating the table -->

### 테이블 모델 {#table-models}

| 테이블 모델 | 지원 여부 | 참고 |
|---|---|---|
| Duplicate Key | 예 | 삽입된 행만 기록됩니다. `changelog.need_historical_value = true`는 `Duplicate table model don't support record historical value` 오류로 거부됩니다. |
| Unique Key, Merge-on-Write | 예 | 삽입, 업데이트, 삭제가 기록되며 before image를 활성화할 수 있습니다. **클러스터 키가 있는 테이블은 지원되지 않으며** `Unique merge-on-write tables with cluster keys do not support changelog` 오류가 발생합니다. |
| Unique Key, Merge-on-Read | 아니요 | `Only duplicate and mow table model support changelog` 오류가 발생합니다. |
| Aggregate Key | 아니요 | 위와 같은 오류가 발생합니다. |

### 컬럼 유형 {#column-types}

| 제한 사항 | 참고 |
|---|---|
| 자동 증가 컬럼 | 지원되지 않으며, `CREATE TABLE`과 `ADD COLUMN` 모두 거부됩니다. |
| VARIANT 컬럼 | 지원되지 않으며, `CREATE TABLE`과 `ADD COLUMN` 모두 거부됩니다. |

### 배포 모드 {#deployment-modes}

Changelog는 스토리지·컴퓨팅 통합 모드와 컴퓨팅·스토리지 분리 모드 모두에서 활성화할 수 있습니다.

### 쓰기 방식 {#write-methods}

모든 쓰기 방식(`INSERT`, `UPDATE`, `DELETE`, Stream Load, Broker Load, Routine Load, Flink / Spark 커넥터 등)으로 발생한 변경이 기록되며, 컬럼 부분 업데이트와 유연한 컬럼 부분 업데이트도 포함됩니다.

### 임시 테이블 {#temporary-tables}

임시 테이블에는 changelog가 적용되지 않습니다. 임시 테이블에 `"changelog.enable" = "true"`를 설정하면 `Cannot create temporary table with changelog enable` 오류가 발생하며, 임시 테이블은 데이터베이스의 changelog 기본값을 무시합니다.

### CCR binlog {#ccr-binlog}

Changelog와 클러스터 간 복제(CCR)에 사용되는 binlog는 함께 사용할 수 없습니다.

- 테이블에 `"binlog.enable" = "true"`와 `"changelog.enable" = "true"`를 모두 설정할 수 없으며, changelog가 있는 테이블의 `binlog.*` 속성은 변경할 수 없습니다.
- CCR binlog가 활성화된 데이터베이스에서는 changelog가 있는 테이블을 생성하거나 복구할 수 없으며, changelog가 있는 테이블이 포함된 데이터베이스에서는 CCR binlog를 활성화할 수 없습니다.
- 데이터베이스에서 두 기능을 동시에 활성화할 수 없습니다.

Changelog가 있는 테이블은 백업과 복원도 지원하지 않습니다.

## 변경 레코드 모델 {#change-record-model}

<!-- Knowledge type: Behavior rules -->
<!-- Use cases: Understanding which change records each write operation produces -->

### 작업 유형과 숨겨진 컬럼 {#operation-types-and-hidden-columns}

각 변경 레코드에는 기본 테이블의 모든 표시 컬럼(변경 후 값)과 다음 숨겨진 컬럼이 포함됩니다.

| 숨겨진 컬럼 | 유형 | 설명 |
|---|---|---|
| `__DORIS_CHANGELOG_OP__` | BIGINT | 작업 유형입니다. `changelog()` 테이블 함수가 반환하는 원시 레코드에서는 `0`이 삽입, `1`이 업데이트, `2`가 삭제를 뜻합니다. `@incr` 증분 쿼리에서는 업데이트가 두 행으로 나뉘며, `0`은 삽입, `1`은 삭제, `2`는 업데이트 전, `3`은 업데이트 후를 뜻합니다. |
| `__DORIS_CHANGELOG_TSO__` | BIGINT | 커밋 타임스탬프입니다. |
| `__DORIS_CHANGELOG_LSN__` | BIGINT | 트랜잭션 내 순서 번호입니다. |
| `__DORIS_CHANGELOG_BEFORE_<column>__` | 원본 컬럼과 동일 | 변경 전 값이며 키가 아닌 각 컬럼마다 하나씩 있습니다. `changelog.need_historical_value = true`인 경우에만 존재합니다. |

기본 테이블 자체에는 각 행의 마지막 쓰기 작업에 대한 커밋 타임스탬프를 담는 숨겨진 컬럼 `__DORIS_COMMIT_TSO_COL__`이 추가됩니다. `SET show_hidden_columns = true`를 실행한 후 직접 쿼리할 수 있습니다.

```sql
SET show_hidden_columns = true;
SELECT order_id, status, __DORIS_COMMIT_TSO_COL__ FROM orders;
```

### Duplicate Key 테이블 {#duplicate-key-tables}

Duplicate Key 테이블에서는 삽입만 발생합니다. 모든 쓰기 작업의 모든 행이 삽입 레코드로 기록되며, 같은 키를 가진 행도 병합되지 않습니다.

Duplicate Key 테이블에서 `DELETE FROM ... WHERE ...`를 실행하면 행에 삭제 조건자가 표시되며 **변경 레코드는 생성되지 않습니다**. Table Stream이나 `@incr`를 사용하는 다운스트림 소비자는 이러한 삭제를 확인할 수 없습니다. 삭제를 다운스트림에 전달해야 한다면 Unique Key MoW 테이블을 사용하세요.

### Unique Key MoW 테이블 {#unique-key-mow-tables}

| 쓰기 작업 | 기록 방식 |
|---|---|
| 존재하지 않는 키 쓰기 | 삽입 레코드 하나 |
| 이미 존재하는 키 쓰기(같은 키로 `INSERT`, `UPDATE`, 컬럼 부분 업데이트) | 업데이트 후 전체 행을 담은 업데이트 레코드 하나. before image가 활성화된 경우 업데이트 전 값도 포함합니다. |
| 기존 키 삭제(`DELETE`, 삭제 표시를 포함한 데이터 적재) | 삭제 레코드 하나. before image가 활성화된 경우 삭제 전 값을 담으며, 그렇지 않으면 키 컬럼에만 값이 있습니다. |
| 키를 삭제한 후 같은 키 다시 쓰기 | 삽입 레코드 하나(이전 버전은 활성 행이 아닌 삭제 마커입니다). |
| 표시되는 행보다 낮은 시퀀스 컬럼 값 쓰기 | 쓰기 작업이 버려지고 변경 레코드는 생성되지 않습니다. |

MoW 테이블의 `DELETE`는 기본적으로 삭제 마커를 쓰는 방식으로 구현되므로 삭제 레코드를 생성합니다. 테이블 속성 `enable_mow_light_delete`가 `true`이면 `DELETE`가 대신 삭제 조건자를 사용하며, Duplicate Key 테이블에서와 마찬가지로 변경 레코드를 생성하지 않습니다. Changelog가 있는 테이블에서는 이 속성을 기본값인 `false`로 유지하세요.

컬럼 부분 업데이트는 업데이트된 컬럼만이 아니라 병합된 전체 행을 기록합니다. 유연한 컬럼 부분 업데이트(`unique_key_update_mode = UPDATE_FLEXIBLE_COLUMNS`)에서 한 배치 안에 같은 키를 삭제한 뒤 다시 쓰면 업데이트 레코드 하나로 기록됩니다. before image에는 삭제 전의 기존 행이, after image에는 새로 쓴 행이 담기며, 제공하지 않은 컬럼에는 기존 값 대신 기본값 또는 NULL이 들어갑니다.

다음 예제는 before image가 활성화된 MoW 테이블의 원시 변경 레코드를 보여줍니다.

```sql
INSERT INTO orders VALUES (1, 'created', 100.00);
INSERT INTO orders VALUES (1, 'paid', 100.00);
DELETE FROM orders WHERE order_id = 1;
INSERT INTO orders VALUES (1, 'created', 150.00);

SELECT __DORIS_CHANGELOG_OP__ AS op, order_id, status, amount,
       __DORIS_CHANGELOG_BEFORE_status__ AS before_status,
       __DORIS_CHANGELOG_BEFORE_amount__ AS before_amount
FROM changelog("table" = "orders")
ORDER BY __DORIS_CHANGELOG_TSO__, __DORIS_CHANGELOG_LSN__;
```

```text
+------+----------+---------+--------+---------------+---------------+
| op   | order_id | status  | amount | before_status | before_amount |
+------+----------+---------+--------+---------------+---------------+
|    0 |        1 | created | 100.00 | NULL          |          NULL |
|    1 |        1 | paid    | 100.00 | created       |        100.00 |
|    2 |        1 | paid    | 100.00 | paid          |        100.00 |
|    0 |        1 | created | 150.00 | NULL          |          NULL |
+------+----------+---------+--------+---------------+---------------+
```

## DDL 제한 사항 {#ddl-restrictions}

<!-- Knowledge type: Behavior rules -->
<!-- Use cases: Checking which ALTER TABLE operations remain available with changelog enabled -->

Changelog가 활성화된 테이블에서는 다음 `ALTER TABLE` 작업만 허용됩니다.

| 허용되는 작업 | 참고 |
|---|---|
| `ADD COLUMN` / `DROP COLUMN` | light schema change로만 허용됩니다. 테이블에서 `light_schema_change`가 활성화되어 있어야 하며, 기본적으로 활성화됩니다. 새 컬럼은 변경 레코드에 자동으로 추가됩니다. |
| `CREATE INDEX` / `DROP INDEX` | light index 변경만 허용됩니다. |
| `ADD ROLLUP` / `DROP ROLLUP` / `RENAME ROLLUP` | |
| 파티션 작업: `ADD PARTITION`, `DROP PARTITION`, `MODIFY PARTITION`, `RENAME PARTITION`, `REPLACE PARTITION` | |
| 테이블 `RENAME`, `REPLACE WITH TABLE` | |
| 테이블 주석 또는 컬럼 주석 수정 | |
| 버킷 구성 수정 | |
| 테이블 속성 수정 | `bloom_filter_columns` / `bloom_filter_fpp` 제외 |
| `ENABLE FEATURE`(`SEQUENCE_LOAD` 등) | 내부적으로 `ADD COLUMN`으로 변환됩니다. |

다른 작업은 `Not allowed to perform current operation on Table With changelog` 오류로 거부됩니다. 대표적인 예는 다음과 같습니다.

- `MODIFY COLUMN`(컬럼 유형이나 위치 변경 등)
- `RENAME COLUMN`
- `ORDER BY`(컬럼 순서 변경)
- `BUILD INDEX`
- bloom filter 속성 수정

Changelog가 있는 테이블에서도 `TRUNCATE TABLE`은 평소처럼 작동하지만, 백업과 복원은 지원되지 않습니다. 기본 테이블의 스키마 및 파티션 변경이 기존 Table Stream에 미치는 영향은 [Table Stream 고급 기능](table-stream-advanced#effect-of-base-table-changes)에 설명되어 있습니다.

## 보존 및 정리 {#retention-and-cleanup}

<!-- Knowledge type: Behavior rules -->
<!-- Use cases: Setting retention / Handling expired offsets / Capacity planning -->

Doris 5.0.0부터 `changelog.ttl_seconds`는 스토리지·컴퓨팅 통합 모드와 컴퓨팅·스토리지 분리 모드 모두에서 changelog 보존 기간을 제어합니다. 보존 기간은 커밋 TSO의 물리적 시간을 기준으로 하며, 현재 Master FE TSO를 참조 시간으로 사용합니다. 커밋 시간이 참조 시간에서 TTL을 뺀 시점 이전이거나 같은 레코드는 만료됩니다. 테이블에 새 쓰기 작업이 없어도 보존 기간의 시간 창은 앞으로 이동합니다.

### 보존 기간 구성 {#configuring-retention}

기본 TTL은 `86400`초(하루)입니다. 데이터베이스에 `changelog.ttl_seconds`가 설정되어 있으면 changelog가 있는 새 테이블은 자체 테이블 속성으로 재정의하지 않는 한 이 값을 상속합니다. 데이터베이스 설정을 변경해도 기존 테이블에는 영향을 주지 않습니다. `CREATE TABLE ... LIKE`는 원본 테이블의 TTL을 복사합니다.

앞에서 만든 `orders` 테이블의 변경을 일주일 동안 보존하려면 다음을 실행하세요.

```sql
ALTER TABLE orders SET ("changelog.ttl_seconds" = "604800");
```

문장이 성공하면 `SHOW CREATE TABLE orders` 결과에 다음이 포함됩니다.

```text
"changelog.ttl_seconds" = "604800"
```

TTL은 `0`보다 커야 하며, `0`이나 `-1`로 만료를 비활성화할 수 없습니다. TTL을 줄이면 기존 레코드가 즉시 만료될 수 있습니다. TTL을 늘리면 물리적으로 아직 남아 있는 레코드를 다시 읽을 수 있지만, 이미 정리된 레코드는 복구할 수 없습니다. 파티션에 설정을 게시하는 중 `ALTER TABLE`이 실패했다면 더 짧은 TTL이 이미 적용되었을 수 있습니다. `SHOW CREATE TABLE`을 확인하고 같은 문장을 다시 실행해 업데이트를 완료하세요.

### 읽기에 미치는 영향 {#effect-on-reads}

증분 읽기는 물리적 정리가 완료되기 전이라도 문장 계획 단계에서 보존 기간의 시간 창을 적용합니다. 한 문장은 하나의 참조 TSO를 사용하며, 새 문장마다 시간 창을 다시 계산합니다.

| 읽기 방식 | 요청한 시작 지점이 만료되었을 때의 동작 |
|---|---|
| `startTimestamp`가 없는 `@incr` | `MIN_DELTA` 모드를 포함해 보존 중인 변경만 읽습니다. |
| `incrementType = MIN_DELTA`이고 `startTimestamp`를 명시한 `@incr` | 불완전한 순변경 결과를 반환하지 않도록 `Changelog offset has expired according to changelog.ttl_seconds` 오류가 발생합니다. |
| `incrementType = DETAIL` 또는 `APPEND_ONLY`인 `@incr` | 실제 시작 지점을 보존 중인 첫 TSO로 옮기고 요청한 시간 창에서 보존 중인 부분만 반환합니다. |
| `type = min_delta`인 Table Stream | 파티션의 소비 오프셋이 만료되었다면 같은 오류가 발생합니다. |
| `type = detail` 또는 `append_only`인 Table Stream | 만료된 변경을 건너뛰고 보존 중인 첫 TSO부터 읽습니다. |
| MoW 스냅샷 읽기(`FOR TIME AS OF`, `FOR VERSION AS OF`, 또는 Stream의 `@snapshot()`) | 재구성에 changelog가 필요할 때 대상 스냅샷이 만료되었다면, 해당 before image가 보존 기간의 시간 창에 더 이상 없으므로 같은 오류가 발생합니다. |
| `changelog()` 테이블 함수 | TTL 필터를 적용하지 않습니다. 물리적 정리로 제거되기 전까지 만료된 원시 레코드가 표시될 수 있습니다. |

만료는 소비자를 기다리지 않습니다. Stream이 `IS_STALE` / `STALE_REASON`에서 여전히 사용 가능한 것으로 표시되더라도 보존 기간 안에 변경을 소비하세요. 현재 구현에서는 이 필드들이 TTL 만료를 보고하지 않습니다. 필요한 변경이 만료되었다면 전체 스냅샷에서 다운스트림 데이터를 다시 구축하세요. Table Stream에서는 [재설정 절차](table-stream-advanced#reset-reset)를 사용해 다운스트림을 다시 데이터 적재하고 오프셋을 진행시키세요. IVM의 내부 Stream은 [구체화된 뷰 새로 고침 작업](../../query-acceleration/materialized-view/async-materialized-view/incremental-materialized-view#internal-table-streams)을 통해 관리하세요.

### 예제: 기본 데이터는 보존되고 변경은 만료되는 경우 {#example-expired-changes-with-base-data-preserved}

`CREATE` 및 `LOAD` 권한과 쿼리에 필요한 `SELECT` 권한이 있는 기존 데이터베이스에서 이 예제를 실행하세요.

```sql
CREATE TABLE changelog_ttl_demo (id INT, value INT)
DUPLICATE KEY(id)
DISTRIBUTED BY HASH(id) BUCKETS 1
PROPERTIES (
    "replication_num" = "1",
    "changelog.enable" = "true",
    "changelog.ttl_seconds" = "30"
);

INSERT INTO changelog_ttl_demo VALUES (1, 10);

SELECT COUNT(*) AS change_count
FROM changelog_ttl_demo@incr("incrementType" = "DETAIL");
```

삽입 직후 쿼리는 다음을 반환합니다.

```text
+--------------+
| change_count |
+--------------+
|            1 |
+--------------+
```

30초 넘게 기다린 후 증분 쿼리를 다시 실행하세요.

```sql
SELECT COUNT(*) AS change_count
FROM changelog_ttl_demo@incr("incrementType" = "DETAIL");
```

```text
+--------------+
| change_count |
+--------------+
|            0 |
+--------------+
```

기본 테이블의 행은 여전히 남아 있습니다.

```sql
SELECT id, value FROM changelog_ttl_demo;
```

```text
+------+-------+
| id   | value |
+------+-------+
|    1 |    10 |
+------+-------+
```

### 물리적 정리 및 용량 계획 {#physical-cleanup-and-capacity-planning}

백그라운드 compaction은 사용하지 않는 테이블을 포함해 완전히 만료된 changelog Rowset을 회수합니다. 만료되지 않은 레코드도 포함된 Rowset은 모든 레코드가 만료될 때까지 보존됩니다. 정리 작업은 기본 테이블의 데이터와 버전 연속성을 유지합니다. 스토리지는 비동기적으로 회수되므로 TTL은 파일이 사라지는 시한이나 엄격한 스토리지 크기 제한이 아닙니다.

자동 정리를 사용하려면 BE에서 `enable_feature_changelog = true`로 설정하고 자동 compaction을 활성화해야 합니다. BE 구성이나 테이블 속성 `disable_auto_compaction = true`를 설정하면 자동 정리가 일시 중지되지만, 증분 읽기는 만료된 레코드를 계속 필터링합니다. BE를 재시작한 후에는 Master FE의 heartbeat에서 유효한 참조 TSO를 받을 때까지 정리를 기다립니다.

Changelog 보존은 시간으로만 제한되며 크기나 개수 제한은 없습니다. 쓰기량, TTL, 정리 지연을 고려해 스토리지 용량을 확보하세요. Before image가 활성화된 MoW 테이블에서는 업데이트할 때마다 이전 값의 사본이 추가로 저장됩니다. 복구에 필요한 시간을 고려하여 TTL을 최대 소비 지연, 새로 고침 간격, 예상 장애 시간보다 길게 설정하세요.

## 쓰기 작업의 오버헤드 {#write-overhead}

<!-- Knowledge type: Performance notes -->
<!-- Use cases: Evaluating load throughput before going to production -->

Changelog를 활성화하면 모든 쓰기 작업에서 변경 레코드를 추가로 생성하고 저장합니다. MoW 테이블에서는 업데이트와 삭제 시 before image를 만들기 위해 이전 값도 읽습니다. 데이터 적재 처리량이 눈에 띄게 감소하며, 실제 감소 폭은 테이블 스키마와 업데이트 비율에 따라 달라집니다. 권장 사항은 다음과 같습니다.

- 증분 소비가 실제로 필요한 테이블에서만 활성화하세요.
- 프로덕션에 적용하기 전에 실제와 비슷한 쓰기 작업으로 처리량 변화를 평가하세요.
- 변경 전 값이 필요하지 않다면(예: `append_only` 소비 또는 최신 값만 중요한 경우) `changelog.need_historical_value`를 활성화하지 마세요.

## changelog() 테이블 함수로 문제 해결 {#troubleshooting-with-the-changelog-table-function}

<!-- Knowledge type: Troubleshooting -->
<!-- Use cases: Confirming whether a write produced the expected changes / Inspecting the change history of a key -->

`changelog()` 테이블 함수는 테이블의 원시 변경 레코드를 반환합니다. 이를 통해 쓰기 작업에서 예상한 변경이 생성되었는지 확인하거나 특정 키의 변경 이력을 조사할 수 있습니다.

:::caution
`changelog()`는 주로 내부 디버깅용이며 프로덕션 데이터 파이프라인에는 권장되지 않습니다. 출력 형식과 매개변수는 버전마다 바뀔 수 있습니다. 실제 증분 소비에는 [Table Stream](table-stream)이나 [`@incr`](incremental-query)를 사용하세요.
:::

```sql
SELECT __DORIS_CHANGELOG_OP__, __DORIS_CHANGELOG_TSO__, __DORIS_CHANGELOG_LSN__,
       order_id, status, amount
FROM changelog(
    "db" = "demo",
    "table" = "orders",
    "partition" = "p20260914"
)
WHERE order_id = 1
ORDER BY __DORIS_CHANGELOG_TSO__, __DORIS_CHANGELOG_LSN__;
```

| 매개변수 | 필수 여부 | 설명 |
|---|---|---|
| `table` | 예 | 테이블 이름 |
| `db` | 아니요 | 데이터베이스 이름. 기본값은 현재 데이터베이스입니다. |
| `partition` | 아니요 | 쉼표로 구분한 파티션 이름. 기본값은 모든 파티션입니다. |
| `tablet` | 아니요 | 쉼표로 구분한 Tablet ID. 기본값은 모든 Tablet입니다. |

`changelog()`는 변경을 합치거나 TTL로 필터링하지 않고 저장된 원시 레코드를 읽으며, `__DORIS_CHANGELOG_OP__`는 원시 인코딩(`0` 삽입, `1` 업데이트, `2` 삭제)을 사용합니다. 물리적 정리가 끝날 때까지 만료된 레코드도 여기에서 보일 수 있습니다. `changelog.need_historical_value = true`인 테이블에서 `changelog()`에 `SELECT *`를 실행하면 이름이 예약된 접두사 `__DORIS_`로 시작하는 before-image 컬럼도 반환됩니다. `changelog()`를 기반으로 뷰, CTAS 테이블 또는 구체화된 뷰를 정의하려면 컬럼을 나열하고 숨겨진 컬럼과 before-image 컬럼에 별칭을 지정하세요. 전체 구문은 [CHANGELOG 테이블 함수](../../sql-manual/sql-functions/table-valued-functions/changelog)를 참조하세요.

## 일반적인 오류 {#common-errors}

<!-- Knowledge type: Troubleshooting -->

| 오류 메시지 | 원인 | 조치 |
|---|---|---|
| `Property binlog.format is no longer supported, use "changelog.enable" = "true" to enable changelog, or remove it for CCR binlog` | 문장에서 초기 개발 빌드가 changelog 활성화에 사용했던 `binlog.format`을 사용했습니다. | `"changelog.enable" = "true"`로 changelog를 활성화하세요. CCR binlog를 사용하려면 해당 속성을 제거하세요. |
| `Property binlog.need_historical_value is no longer supported, use changelog.need_historical_value instead` | 문장에서 초기 개발 빌드의 속성 이름을 사용했습니다. | `changelog.need_historical_value`를 사용하세요. |
| `Table <db>.<table> was created with "binlog.format" = "ROW", which is no longer supported; drop the table and create it again with "changelog.enable" = "true"` | 초기 개발 빌드에서 테이블을 생성했습니다. | 테이블을 삭제한 뒤 `"changelog.enable" = "true"`로 다시 생성하세요. |
| `Cannot create table <table> with changelog when enable_feature_changelog=false` | FE에서 changelog가 활성화되지 않았습니다. | `fe.conf`에서 `enable_feature_changelog = true`로 설정하고 FE를 재시작하세요. |
| `changelog.ttl_seconds must be greater than 0` | TTL이 `0`이거나 음수입니다. | 양의 정수로 초 단위 값을 설정하세요. 기본값은 `86400`입니다. |
| `Changelog offset has expired according to changelog.ttl_seconds` | `MIN_DELTA` 시작 지점이나 MoW 스냅샷이 보존 기간의 시간 창을 벗어났습니다. | 전체 스냅샷에서 다운스트림을 다시 구축하고 소비 위치를 재조정하세요. [읽기에 미치는 영향](#effect-on-reads)을 참조하세요. |
| `not support change changelog.enable from false to true` | 기존 테이블에서 changelog를 활성화하려고 `ALTER TABLE`을 사용했습니다. | Changelog는 테이블 생성 시에만 활성화할 수 있습니다. Changelog가 활성화된 새 테이블을 만들고 데이터를 적재한 뒤 `ALTER TABLE ... REPLACE WITH TABLE`로 두 테이블을 교체하세요. |
| `not support change changelog.enable from true to false` | Changelog가 활성화된 테이블에 `changelog.enable = false`를 설정했습니다. | 활성화된 changelog는 비활성화할 수 없습니다. |
| `not support change changelog.need_historical_value from true to false` | `changelog.need_historical_value`를 수정했습니다. | 이 속성은 테이블 생성 후 변경할 수 없습니다. |
| `Property <property> requires "changelog.enable" = "true"` | Changelog를 활성화하지 않은 테이블의 `CREATE TABLE`에서 `changelog.ttl_seconds` 또는 `changelog.need_historical_value`를 설정했습니다. | 테이블에서 changelog를 활성화하거나 해당 속성을 제거하세요. |
| `changelog.ttl_seconds can not be set because changelog is not enabled for table: <table>` | Changelog가 없는 테이블에서 `ALTER TABLE`로 `changelog.ttl_seconds`를 설정했습니다. | Changelog 보존 기간은 changelog가 있는 테이블에만 적용됩니다. |
| `Duplicate table model don't support record historical value` | Duplicate Key 테이블에 `changelog.need_historical_value = true`를 설정했습니다. | Duplicate Key 테이블에는 before image가 없습니다. 해당 속성을 제거하거나, before image가 필요하면 Unique Key MoW 테이블을 사용하세요. |
| `Unique merge-on-write tables with cluster keys do not support changelog` | MoW 테이블에 클러스터 키가 있습니다. | 클러스터 키 없이 테이블을 생성하세요. |
| `Only duplicate and mow table model support changelog` | 테이블 모델이 Aggregate Key 또는 Unique Key Merge-on-Read입니다. | Duplicate Key 또는 Unique Key MoW 테이블을 사용하세요. 기본값으로 changelog가 활성화되는 데이터베이스에서는 이러한 테이블에 `"changelog.enable" = "false"`를 설정하세요. |
| `Table <table> can not enable both binlog and changelog` | `CREATE TABLE`에서 `binlog.enable`과 `changelog.enable`을 모두 `true`로 설정했습니다. | 둘 중 하나를 선택하세요. [CCR binlog](#ccr-binlog)를 참조하세요. |
| `Can not create table <table> with changelog in database <db> because the database enables binlog` | 데이터베이스에서 CCR binlog가 활성화되어 있습니다. | CCR binlog가 없는 데이터베이스에서 테이블을 생성하세요. |
| `Cannot create temporary table with changelog enable` | 임시 테이블에 `"changelog.enable" = "true"`를 설정했습니다. | 임시 테이블에는 changelog를 사용할 수 없습니다. |
| `Not allowed to perform current operation on Table With changelog` | `MODIFY COLUMN`, `RENAME COLUMN`, `ORDER BY`, `BUILD INDEX`, bloom filter 속성 수정 등 허용되지 않는 DDL을 실행했습니다. | [DDL 제한 사항](#ddl-restrictions)의 허용 목록을 참조하세요. |
