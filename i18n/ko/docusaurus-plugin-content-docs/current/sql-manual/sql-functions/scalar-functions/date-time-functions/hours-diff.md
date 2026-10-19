---
{
    "title": "HOURS_DIFF",
    "language": "ko",
    "description": "DATE, DATETIME 또는 TIMESTAMP_NS 값 사이의 차이를 온전한 시간 단위로 계산합니다."
}
---

## 설명 {#description}

HOURS_DIFF 함수는 두 `DATE`, `DATETIME` 또는 `TIMESTAMP_NS` 값 사이의 차이를 온전한 시간 단위로 계산하며, 시작 시각부터 종료 시각까지 경과한 시간을 나타냅니다. 일, 월, 연도가 바뀌는 경우의 차이도 자동으로 처리합니다. `DATE` 입력은 시각이 00:00:00인 것으로 처리됩니다.

## 구문 {#syntax}

```sql
HOURS_DIFF(`<date_or_time_expr1>`, `<date_or_time_expr2>`)
```

## 매개변수 {#parameters}

| 매개변수 | 설명 |
| ---- | ---- |
| `<date_or_time_expr1>` | 종료 시각입니다. DATE/DATETIME/TIMESTAMP_NS 타입을 지원하는 유효한 날짜 표현식입니다. 구체적인 날짜·시간 형식과 날짜 형식은 [날짜·시간 변환](../../../../sql-manual/basic-element/sql-data-types/conversion/datetime-conversion) 및 [날짜 변환](../../../../sql-manual/basic-element/sql-data-types/conversion/date-conversion)을 참조하세요. |
| `<date_or_time_expr2>` | 시작 시각입니다. DATE/DATETIME/TIMESTAMP_NS 타입과 날짜·시간 형식의 문자열을 지원하는 유효한 날짜 표현식입니다. |

## 반환값 {#return-value}

BIGINT 타입을 반환하며, `<date_or_time_expr1>`과 `<date_or_time_expr2>` 사이의 시간 차이를 나타냅니다.

- `<date_or_time_expr1>`이 `<date_or_time_expr2>`보다 늦으면 양수를 반환하고, 빠르면 음수를 반환합니다.
- 입력 매개변수 중 하나라도 NULL이면 NULL을 반환합니다.
- 분 이하 단위를 포함하는 경우, 실제 차이가 한 시간 미만이면 계산 결과가 하나 줄어듭니다.

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
