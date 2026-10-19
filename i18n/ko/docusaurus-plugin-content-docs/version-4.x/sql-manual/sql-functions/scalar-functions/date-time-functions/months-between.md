---
{
    "title": "MONTHS_BETWEEN",
    "language": "ko",
    "description": "MONTHSDIFF 함수와 달리 MONTHSBETWEEN 함수는 일 부분을 무시하지 않고 차이를 나타내는 부동 소수점 수를 반환합니다."
}
---

## 설명 {#description}

[MONTHS_DIFF 함수](./months-diff)와 달리 MONTHS_BETWEEN 함수는 일 부분을 무시하지 않으며, 날짜에 표시된 월 단위의 단순한 차이가 아니라 실제 개월 수 차이를 나타내는 부동 소수점 수를 반환합니다.

MONTHS_BETWEEN 함수는 두 datetime 값 사이의 개월 수 차이를 계산하며 부동 소수점 결과를 반환합니다. 이 함수는 DATE와 DATETIME 타입을 지원하며, 선택적 매개변수로 결과의 반올림 여부를 제어할 수 있습니다.

이 함수는 Oracle의 [MONTHS_BETWEEN 함수](https://docs.oracle.com/cd/E11882_01/olap.112/e23381/row_functions042.htm#OLAXS434)와 동일하게 동작합니다.

## 구문 {#syntax}

```sql
MONTHS_BETWEEN(`<date_or_time_expr1>`, `<date_or_time_expr2>` [, `<round_type>`])
```

## 매개변수 {#parameters}

| 매개변수 | 설명 |
| --------- | ----------- |
| `<date_or_time_expr1>` | 종료 날짜입니다. date/datetime 타입을 지원합니다. 구체적인 datetime 및 date 형식은 [datetime 변환](../../../../sql-manual/basic-element/sql-data-types/conversion/datetime-conversion)과 [date 변환](../../../../sql-manual/basic-element/sql-data-types/conversion/date-conversion)을 참조하세요. |
| `<date_or_time_expr2>` | 시작 날짜입니다. date/datetime 타입과 datetime 형식에 맞는 문자열을 지원합니다. |
| `<round_type>` | 결과를 소수점 이하 8자리까지 반올림할지 여부입니다. `true` 또는 `false`를 지원합니다. 기본값은 `true`입니다. |

## 반환값 {#return-value}

`<date_or_time_expr2>`를 `<date_or_time_expr1>`에서 뺀 개월 수를 DOUBLE 타입으로 반환합니다.

결과 = (`<date_or_time_expr1>`.year - `<date_or_time_expr2>`.year) * 12 + `<date_or_time_expr1>`.month - `<date_or_time_expr2>`.month + (`<date_or_time_expr1>`.day - `<date_or_time_expr2>`.day) / 31.0

- `<date_or_time_expr1>` 또는 `<date_or_time_expr2>`가 NULL이거나 둘 다 NULL이면 NULL을 반환합니다
- `<round_type>`이 true이면 결과를 소수점 이하 8자리까지 반올림하고, 그렇지 않으면 DOUBLE 정밀도(소수점 이하 15자리)를 유지합니다
- `<date_or_time_expr1>`이 `<date_or_time_expr2>`보다 이르면 음수를 반환합니다
- 시간 구성 요소(시, 분, 초)는 계산에 영향을 주지 않으며, 날짜 구성 요소(년, 월, 일)만 사용됩니다

`<date_or_time_expr1>`과 `<date_or_time_expr2>`가 다음 조건을 충족하면 함수는 개월 수 차이를 정수로 반환합니다(일 차이로 인한 소수 부분은 무시).

- 두 날짜가 각각 해당 월의 마지막 날인 경우(예: 2024-01-31과 2024-02-29)
- 두 날짜의 일 부분이 같은 경우(예: 2024-01-15와 2024-03-15)

## 예제 {#examples}

```sql
--- Month difference between two dates
SELECT MONTHS_BETWEEN('2020-12-26', '2020-10-25') AS result;
+------------+
| result     |
+------------+
| 2.03225806 |
+------------+

--- Including time components (does not affect result)
SELECT MONTHS_BETWEEN('2020-12-26 15:30:00', '2020-10-25 08:15:00') AS result;
+------------+
| result     |
+------------+
| 2.03225806 |
+------------+

--- Disable rounding (preserve original precision)
SELECT MONTHS_BETWEEN('2020-10-25', '2020-12-26', false) AS result;
+---------------------+
| result              |
+---------------------+
| -2.032258064516129  |
+---------------------+

--- Both are month-end dates (special handling, returns integer)
SELECT MONTHS_BETWEEN('2024-02-29', '2024-01-31') AS result;
+--------+
| result |
+--------+
|      1 |
+--------+

--- Same day component (special handling, returns integer)
SELECT MONTHS_BETWEEN('2024-03-15', '2024-01-15') AS result;
+--------+
| result |
+--------+
|      2 |
+--------+

--- Different day components and not month-end
SELECT MONTHS_BETWEEN('2024-02-29', '2024-01-30') AS result;
+------------+
| result     |
+------------+
| 0.96774194 |
+------------+

--- Input is NULL (returns NULL)
SELECT MONTHS_BETWEEN(NULL, '2024-01-01') AS result;
+--------+
| result |
+--------+
| NULL   |
+--------+
```
