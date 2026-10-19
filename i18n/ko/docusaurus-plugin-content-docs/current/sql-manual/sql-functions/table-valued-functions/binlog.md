---
{
    "title": "BINLOG",
    "language": "ko",
    "description": "변경 레코드를 확인할 수 있도록 Row Binlog를 활성화한 내부 테이블의 원시 행 수준 변경 레코드를 반환하는 테이블 함수입니다."
}
---

## 설명 {#description}

이 테이블 함수는 Row Binlog를 활성화한 내부 테이블의 원시 행 수준 변경 레코드를 반환합니다. 각 레코드에는 기본 테이블에 표시되는 열(변경 후 값), 작업 유형, 커밋 타임스탬프, 트랜잭션 내 시퀀스 번호가 포함되며, 선택적으로 변경 전 값도 포함됩니다.

이 함수는 저장된 원시 레코드를 병합하거나 필터링하지 않고 읽습니다.

:::caution
`binlog()`은 주로 내부 디버깅용이며 프로덕션 데이터 파이프라인에서는 사용을 권장하지 않습니다. 출력 형식과 매개변수는 버전에 따라 변경될 수 있으므로, 실제 증분 데이터 처리에는 [Table Stream](../../../data-operate/incremental/table-stream) 또는 [`@incr` 증분 쿼리](../../../data-operate/incremental/incremental-query)를 사용하세요.
:::

이 기능은 버전 5.0.0부터 사용할 수 있으며 실험적 기능입니다.

## 구문 {#syntax}

```sql
BINLOG(
    "table" = "<table_name>"
    [, "db" = "<db_name>"]
    [, "partition" = "<partition_name>[, ...]"]
    [, "tablet" = "<tablet_id>[, ...]"]
)
```

## 필수 매개변수 {#required-parameters}

| 필드 | 설명 |
|---|---|
| **`<table_name>`** | 테이블 이름입니다. 테이블은 Row Binlog를 활성화한 내부 테이블이어야 합니다 (`"binlog.enable" = "true"`, `"binlog.format" = "ROW"`) |

## 선택적 매개변수 {#optional-parameters}

| 필드 | 설명 |
|---|---|
| **`<db_name>`** | 데이터베이스 이름입니다. 기본값은 현재 데이터베이스입니다 |
| **`<partition_name>`** | 쉼표로 구분하여 지정한 파티션만 읽습니다. 기본값은 모든 파티션입니다 |
| **`<tablet_id>`** | 쉼표로 구분하여 지정한 태블릿만 읽습니다. 기본값은 모든 태블릿입니다 |

## 반환값 {#return-value}

| 필드 | 유형 | 설명 |
|---|---|---|
| 기본 테이블에 표시되는 열 | 기본 테이블과 동일 | 변경 후 값입니다. 삭제 레코드의 경우 `binlog.need_historical_value`가 활성화되어 있으면 삭제 전 값이 반환되며, 그렇지 않으면 키 열에만 값이 있습니다 |
| `__DORIS_BINLOG_OP__` | TINYINT | 작업 유형: `0` 삽입, `1` 업데이트, `2` 삭제 |
| `__DORIS_BINLOG_TSO__` | BIGINT | 커밋 타임스탬프(TSO) |
| `__DORIS_BINLOG_LSN__` | BIGINT | 트랜잭션 내 시퀀스 번호 |
| `__BEFORE__<column>__` | 원래 열과 동일 | 변경 전 값으로, 키가 아닌 열마다 하나씩 제공됩니다. 기본 테이블에서 `binlog.need_historical_value`가 활성화된 경우에만 존재하며, 삽입 레코드에서는 NULL입니다 |

## 예제 {#examples}

주문 1의 전체 변경 이력을 `demo.orders`에서 조회합니다:

```sql
SELECT __DORIS_BINLOG_OP__ AS op, __DORIS_BINLOG_TSO__ AS tso,
       order_id, status, amount, __BEFORE__status__, __BEFORE__amount__
FROM BINLOG("db" = "demo", "table" = "orders")
WHERE order_id = 1
ORDER BY __DORIS_BINLOG_TSO__, __DORIS_BINLOG_LSN__;
```

```text
+------+--------------------+----------+---------+--------+--------------------+--------------------+
| op   | tso                | order_id | status  | amount | __BEFORE__status__ | __BEFORE__amount__ |
+------+--------------------+----------+---------+--------+--------------------+--------------------+
|    0 | 469067680972800000 |        1 | created | 100.00 | NULL               |               NULL |
|    1 | 469067681287372800 |        1 | paid    | 100.00 | created            |             100.00 |
|    2 | 469067681628160003 |        1 | paid    | 100.00 | paid               |             100.00 |
+------+--------------------+----------+---------+--------+--------------------+--------------------+
```

특정 파티션 하나의 변경 건수를 집계합니다:

```sql
SELECT __DORIS_BINLOG_OP__, COUNT(*)
FROM BINLOG("table" = "orders", "partition" = "p20260914")
GROUP BY __DORIS_BINLOG_OP__;
```

Row Binlog를 활성화하지 않은 테이블에서는 다음 오류가 발생합니다:

```text
ERROR 1105 (HY000): errCode = 2, detailMessage = binlog<row> is not enabled for table=orders
```
