---
{
    "title": "MONTH",
    "language": "ko",
    "description": "MONTH 함수는 날짜 및 시간 값에서 월을 추출합니다. 반환값의 범위는 1부터 12까지이며, 한 해의 12개월을 나타냅니다."
}
---

## 설명 {#description}

MONTH 함수는 날짜 및 시간 값에서 월을 추출합니다. 반환값의 범위는 1부터 12까지이며, 한 해의 12개월을 나타냅니다. 이 함수는 DATE, DATETIME, TIMESTAMP_NS 타입을 지원합니다.

이 함수는 MONTH를 단위로 사용할 때 MySQL의 [month 함수](https://dev.mysql.com/doc/refman/8.4/en/date-and-time-functions.html#function_month)와 동일하게 동작합니다.

## 구문 {#syntax}

```sql
MONTH(`<date_or_time_expr>`)
```

## 매개변수 {#parameters}

| 매개변수 | 설명 |
| --------- | ----------- |
| `<date_or_time_expr>` | 입력 날짜 및 시간 값입니다. DATE/DATETIME/TIMESTAMP_NS 타입을 지원합니다. 구체적인 날짜 및 시간 형식과 날짜 형식은 [날짜 및 시간 변환](../../../../sql-manual/basic-element/sql-data-types/conversion/datetime-conversion)과 [날짜 변환](../../../../sql-manual/basic-element/sql-data-types/conversion/date-conversion)을 참조하세요. |

## 반환값 {#return-value}

월을 나타내는 TINYINT 타입의 값을 반환합니다:
- 범위: 1부터 12까지
- 1은 일월을, 12는 십이월을 나타냅니다
- 입력값이 NULL이면 NULL을 반환합니다

## 예제 {#examples}

```sql
-- Extract month from DATE type
SELECT MONTH('1987-01-01') AS result;
+--------+
| result |
+--------+
|      1 |
+--------+

-- Extract month from DATETIME type
SELECT MONTH('2023-07-13 22:28:18') AS result;
+--------+
| result |
+--------+
|      7 |
+--------+

-- Extract month from DATETIME with fractional seconds
SELECT MONTH('2023-12-05 10:15:30.456789') AS result;
+--------+
| result |
+--------+
|     12 |
+--------+

-- Returns NULL when input is NULL
SELECT MONTH(NULL) AS result;
+--------+
| result |
+--------+
| NULL   |
+--------+
```
