---
{
    "title": "MILLISECONDS_SUB",
    "language": "ko",
    "description": "MILLISECONDSSUB 함수는 입력 datetime 값에서 지정된 밀리초 수를 빼고 그 결과인 새 datetime 값을 반환합니다."
}
---

## 설명 {#description}

`MILLISECONDS_SUB` 함수는 입력 datetime 값에서 지정된 밀리초 수를 빼고 그 결과인 새 datetime 값을 반환합니다. 이 함수는 `DATETIME` 타입을 처리할 수 있습니다.

## 구문 {#syntax}

```sql
MILLISECONDS_SUB(`<datetime>`, `<delta>`)
```

## 매개변수 {#parameters}

| 매개변수    | 설명                                                                                   |
|--------------|-----------------------------------------------------------------------------------------------|
| `<datetime>` | 입력 datetime 값으로, 타입은 `DATETIME`입니다. 구체적인 datetime 형식은 [datetime 변환](../../../../sql-manual/basic-element/sql-data-types/conversion/datetime-conversion)을 참조하세요. |
| `<delta>`    | 뺄 밀리초 수로, 타입은 `BIGINT`입니다. 1초 = 1,000밀리초 = 1,000,000마이크로초입니다. |

## 반환값 {#return-value}

기준 시간에서 지정된 밀리초 수를 뺀 결과를 나타내는 `DATETIME` 타입의 값을 반환합니다.

- `<delta>`가 음수이면 기준 시간에 해당 밀리초 수를 더하는 것과 동일하게 동작합니다.
- 입력이 `DATE` 타입이면(연도, 월, 일만 포함) 시간 부분의 기본값은 `00:00:00.000`으로 설정됩니다.
- 계산 결과가 `DATETIME` 타입의 유효 범위(`0000-01-01 00:00:00`부터 `9999-12-31 23:59:59.999999`까지)를 벗어나면 예외가 발생합니다.
- 매개변수 중 하나라도 `NULL`이면 함수는 `NULL`을 반환합니다.

## 예제 {#examples}

```sql
-- Subtract 1 millisecond
SELECT MILLISECONDS_SUB('2023-09-08 16:02:08.435123', 1);
+---------------------------------------------------+
| MILLISECONDS_SUB('2023-09-08 16:02:08.435123', 1) |
+---------------------------------------------------+
| 2023-09-08 16:02:08.434123                        |
+---------------------------------------------------+

-- Negative delta (equivalent to addition)
SELECT MILLISECONDS_SUB('2023-05-01 10:00:00.200', -300);
+---------------------------------------------------+
| MILLISECONDS_SUB('2023-05-01 10:00:00.200', -300) |
+---------------------------------------------------+
| 2023-05-01 10:00:00.500000                        |
+---------------------------------------------------+

-- Input is of DATE type (default time is 00:00:00.000)
SELECT MILLISECONDS_SUB('2023-01-01', 1500);
+--------------------------------------+
| MILLISECONDS_SUB('2023-01-01', 1500) |
+--------------------------------------+
| 2022-12-31 23:59:58.500000           |
+--------------------------------------+

-- Calculation result exceeds the datetime range, throws an exception
SELECT MILLISECONDS_SUB('0000-01-01', 1500);
ERROR 1105 (HY000): errCode = 2, detailMessage = (10.16.10.3)[E-218]Operation millisecond_add of 0000-01-01 00:00:00, -1500 out of range

-- Any parameter is NULL, returns NULL
SELECT MILLISECONDS_SUB(NULL, 100), MILLISECONDS_SUB('2023-01-01', NULL) AS after_sub;
+------------------------------+----------------------------+
| milliseconds_sub(NULL, 100)  | after_sub                  |
+------------------------------+----------------------------+
| NULL                         | NULL                       |
+------------------------------+----------------------------+

```
