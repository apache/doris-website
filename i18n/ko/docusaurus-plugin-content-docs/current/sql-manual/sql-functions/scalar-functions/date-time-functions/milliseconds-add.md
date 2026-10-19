---
{
    "title": "MILLISECONDS_ADD",
    "language": "ko",
    "description": "DATETIME, TIMESTAMP_NS 또는 TIMESTAMPTZ 값에 지정한 밀리초 수를 더합니다."
}
---

## 설명 {#description}

`MILLISECONDS_ADD` 함수는 `DATETIME`, `TIMESTAMP_NS` 또는 `TIMESTAMPTZ` 값에 지정한 밀리초 수를 더하고 동일한 타입의 결과값을 반환합니다.

## 구문 {#syntax}

```sql
MILLISECONDS_ADD(`<datetime>`, `<delta>`)
```

## 매개변수 {#parameters}

| 매개변수    | 설명                                                                                   |
|--------------|-----------------------------------------------------------------------------------------------|
| `<datetime>` | 입력 날짜 및 시간 값입니다. `DATETIME`, `TIMESTAMP_NS`, `TIMESTAMPTZ`를 지원합니다. 구체적인 형식은 [datetime 변환](../../../../sql-manual/basic-element/sql-data-types/conversion/datetime-conversion), [TIMESTAMP_NS 변환](../../../basic-element/sql-data-types/conversion/timestamp-ns-conversion.md), [TIMESTAMPTZ 변환](../../../../sql-manual/basic-element/sql-data-types/conversion/timestamptz-conversion)을 참조하세요. |
| `<delta>`    | 추가할 밀리초 수이며, 타입은 `BIGINT`입니다. 1초 = 1,000밀리초 = 1,000,000마이크로초입니다. |

## 반환값 {#return-value}

`TIMESTAMP_NS` 값을 입력하면 초의 소수부 정밀도가 아홉 자리로 고정된 `TIMESTAMP_NS` 값을 반환합니다. 결과가 반환 타입의 범위 내에 있는지 검증하며, `TIMESTAMP_NS`에는 `[1677-09-21 00:12:43.145224192, 2262-04-11 23:47:16.854775807]` 범위를 적용합니다.

기준 시간에 지정한 밀리초 수를 더한 결과를 입력과 동일한 시간 타입으로 반환합니다.

- `<delta>`가 음수이면 기준 시간에서 해당 밀리초 수를 빼는 것과 동일하게 동작합니다. 즉, `MILLISECONDS_ADD(basetime, -n)`은 `MILLISECONDS_SUB(basetime, n)`과 같습니다.
- 입력이 `DATE` 타입이면(연, 월, 일만 포함) 시간 부분의 기본값은 `00:00:00.000`으로 설정됩니다.
- 계산 결과가 `DATETIME` 타입의 유효 범위(`0000-01-01 00:00:00`부터 `9999-12-31 23:59:59.999999`까지)를 벗어나면 예외가 발생합니다.
- 매개변수 중 하나라도 `NULL`이면 함수는 `NULL`을 반환합니다.

## 예제 {#examples}

```sql
-- Add one millisecond
SELECT MILLISECONDS_ADD('2023-09-08 16:02:08.435123', 1);

+---------------------------------------------------+
| MILLISECONDS_ADD('2023-09-08 16:02:08.435123', 1) |
+---------------------------------------------------+
| 2023-09-08 16:02:08.436123                        |
+---------------------------------------------------+

-- Negative milliseconds, subtracts the corresponding milliseconds from the datetime
SELECT MILLISECONDS_ADD('2023-05-01 10:00:00.800', -300);
+---------------------------------------------------+
| MILLISECONDS_ADD('2023-05-01 10:00:00.800', -300) |
+---------------------------------------------------+
| 2023-05-01 10:00:00.500000                        |
+---------------------------------------------------+

-- Input is of DATE type (default time is 00:00:00.000)
SELECT MILLISECONDS_ADD('2023-01-01', 1500);
+--------------------------------------+
| MILLISECONDS_ADD('2023-01-01', 1500) |
+--------------------------------------+
| 2023-01-01 00:00:01.500000           |
+--------------------------------------+

-- Calculation result exceeds the datetime range, throws an exception
SELECT MILLISECONDS_ADD('9999-12-31 23:59:59.999', 2000) AS after_add;
ERROR 1105 (HY000): errCode = 2, detailMessage = (10.16.10.3)[E-218]Operation milliseconds_add of 9999-12-31 23:59:59.999000, 2000 out of range

-- Any parameter is NULL, returns NULL
SELECT MILLISECONDS_ADD('2023-10-01 12:00:00.500', NULL) AS after_add;
+-----------+
| after_add |
+-----------+
| NULL      |
+-----------+

```
