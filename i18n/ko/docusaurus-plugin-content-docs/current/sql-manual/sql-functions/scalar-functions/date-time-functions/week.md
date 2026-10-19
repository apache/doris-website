---
{
    "title": "WEEK",
    "language": "ko",
    "description": "WEEK 함수는 지정한 날짜의 주 번호를 반환하며, 기본 모드는 0입니다."
}
---

## 설명 {#description}

WEEK 함수는 지정한 날짜의 주 번호를 반환하며, 기본 모드는 0입니다. mode 매개변수를 통해 주 계산 규칙을 사용자 지정할 수 있습니다(예: 한 주의 시작일을 일요일 또는 월요일로 지정, 주 번호 범위 설정, 첫 번째 주를 결정하는 기준 설정 등).

mode 매개변수에 따른 동작은 다음 테이블과 같습니다.

|모드 |한 주의 시작일 |주 번호 범위 |첫 번째 주의 정의                     |
|:----|:-----------------|:-----------------|:------------------------------------------------|
|0    |일요일            |0-53             |해당 연도의 첫 번째 일요일이 포함된 주 |
|1    |월요일            |0-53             |해당 연도에 속하는 날이 4일 이상인 첫 번째 주  |
|2    |일요일            |1-53             |해당 연도의 첫 번째 일요일이 포함된 주 |
|3    |월요일            |1-53             |해당 연도에 속하는 날이 4일 이상인 첫 번째 주  |
|4    |일요일            |0-53             |해당 연도에 속하는 날이 4일 이상인 첫 번째 주  |
|5    |월요일            |0-53             |해당 연도의 첫 번째 월요일이 포함된 주 |
|6    |일요일            |1-53             |해당 연도에 속하는 날이 4일 이상인 첫 번째 주  |
|7    |월요일            |1-53             |해당 연도의 첫 번째 월요일이 포함된 주 |


이 함수는 MySQL의 [week 함수](https://dev.mysql.com/doc/refman/8.4/en/date-and-time-functions.html#function_week)와 동일하게 동작합니다.

## 구문 {#syntax}
```sql
WEEK(`<date_or_time_expr>`)
WEEK(`<date_or_time_expr>`, `<mode>`)
```

## 매개변수 {#parameters}

| 매개변수 | 설명 |
|-----------|-------------|
| `<date_or_time_expr>` | 입력 날짜 및 시간 값으로, DATE/DATETIME/TIMESTAMP_NS 타입을 지원합니다. 날짜 및 시간 형식과 날짜 형식은 [날짜 및 시간 변환](../../../../sql-manual/basic-element/sql-data-types/conversion/datetime-conversion)과 [날짜 변환](../../../../sql-manual/basic-element/sql-data-types/conversion/date-conversion)을 참조하세요.|
| `<mode>` | 선택적 INT 매개변수이며, 기본값은 0입니다. 계산 규칙은 `mode & 7`에 따라 결정되며, 위 테이블에서 모드 0-7 중 하나를 선택합니다. |

## 반환 값 {#return-value}
지정한 날짜의 주 번호를 나타내는 INT 타입을 반환하며, 구체적인 범위는 `<mode>`에 따라 결정됩니다(0-53 또는 1-53).

- `<mode>`가 0-7 범위를 벗어난 정수이면 하위 세 비트(`mode & 7`)가 계산 모드를 결정합니다. 예를 들어 8은 모드 0을, 9는 모드 1을, -1은 모드 7을 선택합니다.
- 매개변수 중 하나라도 NULL이면 NULL을 반환합니다.
- 연도가 바뀌는 시점의 날짜는 이전 연도의 마지막 주에 해당할 수 있습니다(예: 일부 모드에서 2023년 첫 달 1일은 2022년의 52주차에 속합니다).

## 예제 {#examples}

범위를 벗어난 모드는 하위 세 비트를 사용합니다. 예를 들어 8은 모드 0을 선택합니다.

```sql
SELECT WEEK('2021-01-01', 8) AS mode_8,
       WEEK('2021-01-01', 0) AS mode_0,
       WEEK('2021-01-01', 7) AS mode_7;
```
```text
+--------+--------+--------+
| mode_8 | mode_0 | mode_7 |
+--------+--------+--------+
|      0 |      0 |     52 |
+--------+--------+--------+
```

```sql
-- 2020-01-01 is Wednesday, the first Sunday of the year is 2020-01-05, so it belongs to week 0
SELECT WEEK('2020-01-01') AS week_result;
+-------------+
| week_result |
+-------------+
|           0 |
+-------------+

-- 2020-07-01 is Wednesday, its week contains ≥4 days belonging to 2020, so it's week 27
SELECT WEEK('2020-07-01', 1) AS week_result;
+-------------+
| week_result |
+-------------+
|          27 |
+-------------+

-- Compare mode=0 and mode=3 (differences between different rules)
SELECT 
  WEEK('2023-01-01', 0) AS mode_0, 
  WEEK('2023-01-01', 3) AS mode_3;  
+--------+--------+
| mode_0 | mode_3 |
+--------+--------+
|      1 |     52 |
+--------+--------+

-- -1 & 7 = 7, so mode 7 is used
SELECT WEEK('2023-01-01', -1) AS week_result;
+-------------+
| week_result |
+-------------+
|          52 |
+-------------+

-- Input is DATETIME type (ignores time portion)
SELECT WEEK('2023-12-31 23:59:59', 3) AS week_result;
+-------------+
| week_result |
+-------------+
|          52 |  
+-------------+

-- Any parameter is NULL, result returns NULL
SELECT WEEK('2023-12-31 23:59:59', NULL), WEEK(NULL, 3);
+-----------------------------------+--------------+
| WEEK('2023-12-31 23:59:59', NULL) | WEEK(NULL,3) |
+-----------------------------------+--------------+
|                              NULL |         NULL |
+-----------------------------------+--------------+
```
