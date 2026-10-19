---
{
    "title": "REFRESH MATERIALIZED VIEW",
    "language": "ko",
    "description": "IVM 행 수준 증분 새로 고침, 파티션 새로 고침, 전체 새로 고침 또는 자동으로 선택된 새로 고침 방식으로 비동기 구체화된 뷰를 수동으로 새로 고칩니다."
}
---

## 설명 {#description}

이 문은 지정된 비동기 구체화된 뷰를 수동으로 새로 고치는 데 사용합니다. 새로 고침 작업은 비동기로 실행되며, `tasks("type"="mv")`로 상태를 확인할 수 있습니다.

## 구문 {#syntax}

```sql
REFRESH MATERIALIZED VIEW <mv_name>
{
    PARTITIONS (<partition_name> [, <partition_name> [, ... ] ])
  | COMPLETE
  | AUTO
  | PARTITIONS [FALLBACK]
  | INCREMENTAL [FALLBACK]
  | INCREMENTAL WITH DRY RUN [LIMIT <limit> [OFFSET <offset>]]
}
```

새로 고침을 실행하지 않고 새로 고침 계획을 확인하려면 다음 구문을 사용합니다.

```sql
EXPLAIN REFRESH MATERIALIZED VIEW <mv_name> INCREMENTAL [WITH ALL STREAMS]
EXPLAIN REFRESH MATERIALIZED VIEW <mv_name> COMPLETE
```

## 필수 매개변수 {#required-parameters}

**1. `<mv_name>`**

> 구체화된 뷰의 이름을 지정합니다.

**2. 새로 고침 방식**

| 새로 고침 방식 | 설명 |
|---|---|
| `INCREMENTAL` | Incremental View Maintenance (IVM)를 사용하여 두 번의 새로 고침 사이에 발생한 기본 테이블의 행 수준 변경 사항을 처리합니다. IVM을 활성화하여 생성한 구체화된 뷰에만 적용됩니다 |
| `PARTITIONS` | Doris가 변경된 구체화된 뷰 파티션을 계산하고 해당 파티션을 다시 계산합니다 |
| `COMPLETE` | 파티션이 기본 테이블과 동기화되어 있는지 확인하지 않고 구체화된 뷰의 모든 데이터를 강제로 다시 계산합니다 |
| `AUTO` | Doris가 사용 가능한 방식을 자동으로 선택합니다. IVM을 지원하는 구체화된 뷰에서는 IVM, 파티션 새로 고침, 전체 새로 고침을 차례로 시도합니다 |
| `PARTITIONS (<partition_name>, ...)` | 지정된 구체화된 뷰 파티션이 기본 테이블과 동기화되어 있는지 확인하지 않고 해당 파티션을 강제로 새로 고칩니다 |

## 선택적 매개변수 {#optional-parameters}

**1. `FALLBACK`**

우선적으로 선택한 방식을 안전하게 실행할 수 없을 때 이번 새로 고침에서 대체 방식을 사용할 수 있도록 허용합니다.

- `INCREMENTAL FALLBACK`은 기본적으로 IVM, 파티션 새로 고침, 전체 새로 고침을 차례로 시도합니다. 일부 IVM 오류가 발생하면 바로 전체 새로 고침으로 전환합니다.
- `PARTITIONS FALLBACK`은 파티션 새로 고침을 실행할 수 없을 때 전체 새로 고침으로 전환합니다.
- `INCREMENTAL` 또는 `PARTITIONS`에 `FALLBACK`을 지정하지 않으면 엄격 모드로 동작하며, 우선적으로 선택한 방식이 실패하면 작업이 실패합니다.

**2. `WITH DRY RUN`**

`INCREMENTAL`에만 사용할 수 있습니다. 다음 IVM 새로 고침의 델타 쿼리를 실행하고 기록될 행을 반환합니다. 이때 구체화된 뷰 데이터를 변경하거나, 내부 Table Stream 오프셋을 진행시키거나, IVM 메타데이터를 수정하지 않습니다.

`LIMIT`과 `OFFSET`을 사용하여 반환되는 결과의 범위를 제한할 수 있습니다. 반환되는 열에는 비즈니스 열과 IVM에서 사용하는 내부 열이 포함됩니다.

**3. `WITH ALL STREAMS`**

`EXPLAIN ... INCREMENTAL`에만 사용할 수 있습니다. 기본적으로 계획에는 현재 소비되지 않은 변경 사항이 있는 내부 Streams만 포함됩니다. 이 옵션을 사용하면 이미 완전히 소비된 Streams도 계획에 포함되므로 여러 테이블에 걸친 델타 계획의 전체 구조를 더 쉽게 살펴볼 수 있습니다.

## 접근 제어 요구 사항 {#access-control-requirements}

이 SQL 명령을 실행하는 사용자는 최소한 다음 권한이 있어야 합니다.

| 권한 | 객체 | 참고 |
|---|---|---|
| ALTER_PRIV | 구체화된 뷰 | `REFRESH`는 구체화된 뷰에 대한 `ALTER` 작업입니다 |

## 사용 시 참고 사항 {#usage-notes}

- `INCREMENTAL`은 Doris 5.0.0부터 사용할 수 있으며, 현재 실험적 기능입니다. 사전 요구 사항, 지원 범위, 대체 방식으로 전환되는 이유 및 기준 데이터 요구 사항은 [Incremental View Maintenance (IVM)](../../../../query-acceleration/materialized-view/async-materialized-view/incremental-materialized-view)를 참조하세요.
- IVM은 `PARTITIONS (<partition_name>, ...)`를 사용하여 특정 파티션을 강제로 새로 고치는 기능을 지원하지 않습니다. 파티션을 새로 고치려면 파티션 목록 없이 `PARTITIONS`를 사용하고, 전체를 새로 고치려면 `COMPLETE`를 사용하세요.
- 엄격 모드의 `INCREMENTAL` 새로 고침이 실패하면 구체화된 뷰 데이터도, 내부 Streams의 소비 오프셋도 진행되지 않습니다.
- 버전 변경을 감지할 수 없는 외부 테이블을 기반으로 하는 일반 비동기 구체화된 뷰에서는 `COMPLETE`를 지정하거나 파티션 이름을 명시적으로 지정하세요.
- `EXPLAIN`과 `WITH DRY RUN`은 모두 영구 저장된 상태를 변경하지 않습니다.

## 예제 {#examples}

IVM을 사용하여 엄격 모드로 증분 새로 고침을 수행합니다.

```sql
REFRESH MATERIALIZED VIEW mv1 INCREMENTAL;
```

증분 새로 고침이 실패하면 대체 방식으로 전환하도록 허용합니다.

```sql
REFRESH MATERIALIZED VIEW mv1 INCREMENTAL FALLBACK;
```

다음 증분 새로 고침에서 기록될 행을 최대 100개까지 미리 확인합니다.

```sql
REFRESH MATERIALIZED VIEW mv1 INCREMENTAL WITH DRY RUN LIMIT 100;
```

전체 IVM 델타 계획을 확인합니다.

```sql
EXPLAIN REFRESH MATERIALIZED VIEW mv1 INCREMENTAL WITH ALL STREAMS;
```

Doris가 변경된 파티션을 계산하고 새로 고치도록 합니다.

```sql
REFRESH MATERIALIZED VIEW mv1 PARTITIONS FALLBACK;
```

지정된 파티션을 새로 고칩니다.

```sql
REFRESH MATERIALIZED VIEW mv1 PARTITIONS (p_19950801_19950901, p_19950901_19951001);
```

모든 데이터를 강제로 새로 고칩니다.

```sql
REFRESH MATERIALIZED VIEW mv1 COMPLETE;
```
