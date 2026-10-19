---
{
    "title": "HOURS_DIFF",
    "language": "ko",
    "description": "HOURSDIFF 함수는 두 datetime 또는 date 값 사이의 차이를 시간 단위로 계산합니다."
}
---

## 설명 {#description}

HOURS_DIFF 함수는 두 datetime 또는 date 값 사이의 차이를 계산하여 시작 시간부터 종료 시간까지 경과한 시간을 시간 단위로 나타냅니다. 이 함수는 DATE와 DATETIME 입력 타입을 모두 지원하며, 일, 월, 연도 경계를 넘는 시간 차이도 자동으로 처리하고 정수 결과를 반환합니다. 입력이 DATE 타입(연도, 월, 일만 포함)이면 시간 부분의 기본값은 00:00:00입니다.

## 구문 {#syntax}

```sql
HOURS_DIFF(`<date_or_time_expr1>`, `<date_or_time_expr2>`)
```

## 매개변수 {#parameters}

| 매개변수 | 설명 |
| ---- | ---- |
| `<date_or_time_expr1>` | 종료 시간으로, date/datetime 타입을 지원하는 유효한 날짜 표현식입니다. 구체적인 datetime 및 date 형식은 [datetime 변환](../../../../sql-manual/basic-element/sql-data-types/conversion/datetime-conversion)과 [date 변환](../../../../sql-manual/basic-element/sql-data-types/conversion/date-conversion)을 참고하세요. |
| `<date_or_time_expr2>` | 시작 시간으로, date/datetime 타입과 datetime 형식의 문자열을 지원하는 유효한 날짜 표현식입니다. |

## 반환값 {#return-value}

BIGINT 타입을 반환하며, 이 값은 `<date_or_time_expr1>`과 `<date_or_time_expr2>` 사이의 차이를 시간 단위로 나타냅니다.

- `<date_or_time_expr1>`이 `<date_or_time_expr2>`보다 늦으면 양수를 반환하고, 이르면 음수를 반환합니다.
- 입력 매개변수 중 하나라도 NULL이면 NULL을 반환합니다.
- 분 이하 단위가 포함되어 실제 차이가 한 시간보다 작으면 계산 결과에서 하나를 뺍니다.

## 예제 {#examples}

```sql

-- End time is later than start time, returns positive number
SELECT HOURS_DIFF('2020-12-25 22:00:00', '2020-12-25 21:00:00');
+----------------------------------------------------------+
| HOURS_DIFF('2020-12-25 22:00:00', '2020-12-25 21:00:00') |
+----------------------------------------------------------+
|                                                        1 |
+----------------------------------------------------------+

-- End time is earlier than start time, returns negative number
select hours_diff('2020-12-25 20:00:00', '2020-12-25 21:00:00');
+----------------------------------------------------------+
| hours_diff('2020-12-25 20:00:00', '2020-12-25 21:00:00') |
+----------------------------------------------------------+
|                                                       -1 |
+----------------------------------------------------------+

-- Contains minute time, if actual difference is less than one hour, calculation result is reduced by one
select hours_diff('2020-12-25 20:59:00', '2020-12-25 21:00:00');
+----------------------------------------------------------+
| hours_diff('2020-12-25 20:59:00', '2020-12-25 21:00:00') |
+----------------------------------------------------------+
|                                                        0 |
+----------------------------------------------------------+

-- End time is date type, defaults to 00:00:00 start
select hours_diff('2023-12-31', '2023-12-30 12:00:00');
+-------------------------------------------------+
| hours_diff('2023-12-31', '2023-12-30 12:00:00') |
+-------------------------------------------------+
|                                              12 |
+-------------------------------------------------+

-- Any parameter is NULL, return NULL
select hours_diff(null, '2023-10-01') ;
+--------------------------------+
| hours_diff(null, '2023-10-01') |
+--------------------------------+
|                           NULL |
+--------------------------------+

select hours_diff('2023-12-31', NULL);
+--------------------------------+
| hours_diff('2023-12-31', NULL) |
+--------------------------------+
|                           NULL |
+--------------------------------+

```
