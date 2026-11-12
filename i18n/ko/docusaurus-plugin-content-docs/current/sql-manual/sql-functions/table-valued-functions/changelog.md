---
{
    "title": "CHANGELOG",
    "language": "ko",
    "description": "changelog가 활성화된 내부 테이블의 원시 행 수준 변경 레코드를 반환하여 변경 내역을 확인할 수 있게 하는 테이블 함수입니다."
}
---

## 설명 {#description}

이 테이블 함수는 [changelog](../../../data-operate/incremental/changelog)가 활성화된 내부 테이블의 원시 행 수준 변경 레코드를 반환합니다. 각 레코드에는 기본 테이블의 표시 열(변경 후 값), 작업 유형, 커밋 타임스탬프, 트랜잭션 내 순번, 그리고 선택적으로 변경 전 값이 포함됩니다.

이 함수는 저장된 원시 레코드를 병합하거나 필터링하지 않고 읽습니다.

:::caution
`changelog()`는 주로 내부 디버깅에 사용하며, 운영 환경의 데이터 파이프라인에는 권장하지 않습니다. 출력 형식과 매개변수는 버전에 따라 변경될 수 있습니다. 실제 증분 데이터 소비에는 [Table Stream](../../../data-operate/incremental/table-stream) 또는 [`@incr` 증분 쿼리](../../../data-operate/incremental/incremental-query)를 사용하세요.
:::

이 기능은 버전 5.0.0부터 사용할 수 있으며 실험적 기능입니다. 초기 개발 빌드에서는 이 함수의 이름이 `binlog()`였습니다.

## 구문 {#syntax}

```sql
CHANGELOG(
    "table" = "<table_name>"
    [, "db" = "<db_name>"]
    [, "partition" = "<partition_name>[, ...]"]
    [, "tablet" = "<tablet_id>[, ...]"]
)
```

## 필수 매개변수 {#required-parameters}

| 필드 | 설명 |
|---|---|
| **`<table_name>`** | 테이블 이름입니다. 테이블은 changelog가 활성화된 내부 테이블이어야 합니다(`"changelog.enable" = "true"`). |

## 선택적 매개변수 {#optional-parameters}

| 필드 | 설명 |
|---|---|
| **`<db_name>`** | 데이터베이스 이름입니다. 기본값은 현재 데이터베이스입니다. |
| **`<partition_name>`** | 쉼표로 구분해 지정한 파티션만 읽습니다. 기본값은 모든 파티션입니다. |
| **`<tablet_id>`** | 쉼표로 구분해 지정한 태블릿만 읽습니다. 기본값은 모든 태블릿입니다. |

## 반환 값 {#return-value}

| 필드 | 유형 | 설명 |
|---|---|---|
| 기본 테이블의 표시 열 | 기본 테이블과 동일 | 변경 후 값입니다. 삭제 레코드의 경우 `changelog.need_historical_value`가 활성화되어 있으면 삭제 전 값이 들어가고, 그렇지 않으면 키 열에만 값이 들어갑니다. |
| `__DORIS_CHANGELOG_OP__` | BIGINT | 작업 유형: `0` 삽입, `1` 업데이트, `2` 삭제 |
| `__DORIS_CHANGELOG_TSO__` | BIGINT | 커밋 타임스탬프(TSO) |
| `__DORIS_CHANGELOG_LSN__` | BIGINT | 트랜잭션 내 순번 |
| `__DORIS_CHANGELOG_BEFORE_<column>__` | 원래 열과 동일 | 변경 전 값입니다. 키가 아닌 각 열에 하나씩 있습니다. 기본 테이블에서 `changelog.need_historical_value`가 활성화된 경우에만 존재하며, 삽입 레코드에서는 NULL입니다. |

`SELECT *`는 기본 테이블의 표시 열을 반환하며, `changelog.need_historical_value`가 활성화되어 있으면 `__DORIS_CHANGELOG_BEFORE_<column>__` 열도 반환합니다. 다른 숨김 열은 명시적으로 나열해야 합니다. 모든 숨김 열과 변경 전 값 열의 이름은 예약된 접두사 `__DORIS_`로 시작합니다. 뷰, CTAS 테이블 또는 구체화된 뷰에서는 이 접두사로 시작하는 이름을 열 이름으로 사용할 수 없습니다. `changelog()`를 대상으로 이러한 항목 중 하나를 정의하려면 열을 나열하고 해당 열에 별칭을 지정하세요.

## 예제 {#examples}

`demo.orders`에서 주문 1의 전체 변경 이력을 표시합니다.

```sql
SELECT __DORIS_CHANGELOG_OP__ AS op, __DORIS_CHANGELOG_TSO__ AS tso,
       order_id, status, amount,
       __DORIS_CHANGELOG_BEFORE_status__ AS before_status,
       __DORIS_CHANGELOG_BEFORE_amount__ AS before_amount
FROM CHANGELOG("db" = "demo", "table" = "orders")
WHERE order_id = 1
ORDER BY __DORIS_CHANGELOG_TSO__, __DORIS_CHANGELOG_LSN__;
```

```text
+------+--------------------+----------+---------+--------+---------------+---------------+
| op   | tso                | order_id | status  | amount | before_status | before_amount |
+------+--------------------+----------+---------+--------+---------------+---------------+
|    0 | 469067680972800000 |        1 | created | 100.00 | NULL          |          NULL |
|    1 | 469067681287372800 |        1 | paid    | 100.00 | created       |        100.00 |
|    2 | 469067681628160003 |        1 | paid    | 100.00 | paid          |        100.00 |
+------+--------------------+----------+---------+--------+---------------+---------------+
```

파티션 하나의 변경 건수만 집계합니다.

```sql
SELECT __DORIS_CHANGELOG_OP__, COUNT(*)
FROM CHANGELOG("table" = "orders", "partition" = "p20260914")
GROUP BY __DORIS_CHANGELOG_OP__;
```

changelog가 활성화되지 않은 테이블에서는 다음 오류가 발생합니다.

```text
ERROR 1105 (HY000): errCode = 2, detailMessage = changelog is not enabled for table=orders
```
