---
{
    "title": "MINUTES_DIFF",
    "language": "ko",
    "description": "MINUTESDIFF 함수는 두 날짜 및 시간 값 사이의 차이를 분 단위로 계산합니다."
}
---

## 설명 {#description}

MINUTES_DIFF 함수는 두 날짜 및 시간 값 사이의 차이를 분 단위로 계산합니다. 결과는 종료 시간에서 시작 시간을 뺀 값을 분 단위로 나타낸 것입니다. 이 함수는 `DATE`, `DATETIME`, `TIMESTAMP_NS`를 지원합니다.

## 구문 {#syntax}

```sql
MINUTES_DIFF(`<date_or_time_expr1>`, `<date_or_time_expr2>`)
```

## 매개변수 {#parameters}

| 매개변수 | 설명 |
| --------- | ----------- |
| `<date_or_time_expr1>` | 종료 시간입니다. 타입은 `DATE`, `DATETIME`, `TIMESTAMP_NS` 중 하나입니다. |
| `<date_or_time_expr2>` | 시작 시간입니다. 타입은 `DATE`, `DATETIME`, `TIMESTAMP_NS` 중 하나입니다. |

## 반환값 {#return-value}

`<date_or_time_expr1>`과 `<date_or_time_expr2>` 사이의 분 단위 차이를 나타내는 INT 타입 정수를 반환합니다(1시간 = 60분).

- `<date_or_time_expr1>`이 `<date_or_time_expr2>`보다 늦으면 양수를 반환합니다.
- `<date_or_time_expr1>`이 `<date_or_time_expr2>`보다 이르면 음수를 반환합니다.
- 실제 시간 차이를 기준으로 계산하며, 초나 마이크로초를 무시하지 않습니다.
- 입력값이 DATE 타입이면(연, 월, 일만 포함) 시간 부분의 기본값은 00:00:00입니다.
- 입력한 날짜 및 시간 값에 영이 아닌 scale, 초 또는 마이크로초 부분이 포함되어 있으면 계산 시 이를 무시하지 않습니다.
- 매개변수 중 하나라도 NULL이면 NULL을 반환합니다.

## 예제 {#examples}

```sql
-- Minute difference when end time is greater than start time
SELECT MINUTES_DIFF('2020-12-25 22:00:00', '2020-12-25 21:00:00') AS result;
+--------+
| result |
+--------+
|     60 |
+--------+

-- Includes scale, calculation does not ignore it
SELECT MINUTES_DIFF('2020-12-25 21:00:00.999', '2020-12-25 22:00:00.923');
+--------------------------------------------------------------------+
| MINUTES_DIFF('2020-12-25 21:00:00.999', '2020-12-25 22:00:00.923') |
+--------------------------------------------------------------------+
|                                                                -59 |
+--------------------------------------------------------------------+

-- End time is earlier than start time, returns negative number
SELECT MINUTES_DIFF('2023-07-13 21:50:00', '2023-07-13 22:00:00') AS result;
+--------+
| result |
+--------+
|    -10 |
+--------+

-- Input is of DATE type (default time 00:00:00)
SELECT MINUTES_DIFF('2023-07-14', '2023-07-13') AS result;
+--------+
| result |
+--------+
|   1440 |
+--------+

-- Two times have different seconds, seconds are also calculated
SELECT MINUTES_DIFF('2023-07-13 22:30:59', '2023-07-13 22:31:01') AS result;
+--------+
| result |
+--------+
|      0 |
+--------+

-- Any parameter is NULL, returns NULL
SELECT MINUTES_DIFF(NULL, '2023-07-13 22:00:00'), MINUTES_DIFF('2023-07-13 22:00:00', NULL) AS result;
+-------------------------------------------+--------+
| MINUTES_DIFF(NULL, '2023-07-13 22:00:00') | result |
+-------------------------------------------+--------+
|                                      NULL |   NULL |
+-------------------------------------------+--------+
```
