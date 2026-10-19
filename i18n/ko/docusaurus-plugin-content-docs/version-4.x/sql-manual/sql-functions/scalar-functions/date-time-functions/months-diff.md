---
{
    "title": "MONTHS_DIFF",
    "language": "ko",
    "description": "MONTHSDIFF 함수는 두 datetime 값 사이의 개월 수 차이를 정수로 계산하는 데 사용됩니다."
}
---

## 설명 {#description}

MONTHS_DIFF 함수는 두 datetime 값 사이의 개월 수 차이를 정수로 계산하며, `<startdate>`를 `<enddate>`에서 뺀 결과를 개월 수로 반환합니다. 이 함수는 DATE 및 DATETIME 타입을 지원하며, 날짜 부분(연, 월, 일)만을 기준으로 계산하고 시간 부분(시, 분, 초)은 무시합니다.

## 구문 {#syntax}

```sql
MONTHS_DIFF(`<date_or_time_expr1>`, `<date_or_time_expr2>`)
```

## 매개변수 {#parameters}

| 매개변수 | 설명 |
| --------- | ----------- |
| `<date_or_time_expr1>` | 종료 날짜입니다. date/datetime 타입을 지원합니다. 구체적인 datetime 및 date 형식은 [datetime 변환](../../../../sql-manual/basic-element/sql-data-types/conversion/datetime-conversion) 및 [date 변환](../../../../sql-manual/basic-element/sql-data-types/conversion/date-conversion)을 참조하세요. |
| `<date_or_time_expr2>` | 시작 날짜입니다. date/datetime 타입을 지원합니다. |

## 반환 값 {#return-value}

`<date_or_time_expr2>`를 `<date_or_time_expr1>`에서 빼서 구한 개월 수를 BIGINT 타입으로 반환합니다.

기본 차이 = (종료 연도 - 시작 연도) × 12 + (종료 월 - 시작 월);
종료 날짜의 일 값 < 시작 날짜의 일 값이면, 최종 결과 = 기본 차이 - 1;
그 외에는 최종 결과 = 기본 차이입니다.

- `<date_or_time_expr1>`이 `<date_or_time_expr2>`보다 이르면 음수를 반환합니다(계산 방식은 같고 부호만 반대입니다);
- 매개변수 중 하나라도 NULL이면 NULL을 반환합니다;
- 실제로 온전한 한 달의 차이가 있는지(일, 시 등 포함) 고려합니다.

## 예제 {#examples}

```sql
--- Year-month difference is 1, and end day < start day (result minus 1)
SELECT MONTHS_DIFF('2020-03-28', '2020-02-29') AS result;
+--------+
| result |
+--------+
|      0 |
+--------+

--- Year-month difference is 1, and end day = start day
SELECT MONTHS_DIFF('2020-03-29', '2020-02-29') AS result;
+--------+
| result |
+--------+
|      1 |
+--------+

--- Year-month difference is 1, and end day > start day
SELECT MONTHS_DIFF('2020-03-30', '2020-02-29') AS result;
+--------+
| result |
+--------+
|      1 |
+--------+

--- End date is earlier than start date (negative value logic is the same)
SELECT MONTHS_DIFF('2020-02-29', '2020-03-28') AS result;
+--------+
| result |
+--------+
|      0 |
+--------+

SELECT MONTHS_DIFF('2020-02-29', '2020-03-29') AS result;
+--------+
| result |
+--------+
|     -1 |
+--------+

--- Same month (result is 0)
SELECT MONTHS_DIFF('2023-07-15', '2023-07-30') AS result;
+--------+
| result |
+--------+
|      0 |
+--------+

--Takes into account whether there is an actual full month difference (including days, hours, etc.)
mysql> SELECT MONTHS_DIFF('2020-03-28', '2020-01-29') AS result;
+--------+
| result |
+--------+
|      1 |
+--------+

mysql> SELECT MONTHS_DIFF('2020-03-28 22:22:22', '2020-02-29 23:12:12') AS result;
+--------+
| result |
+--------+
|      0 |
+--------+

--- Input is NULL (returns NULL)
SELECT MONTHS_DIFF(NULL, '2023-01-01') AS result;
+--------+
| result |
+--------+
| NULL   |
+--------+
```
