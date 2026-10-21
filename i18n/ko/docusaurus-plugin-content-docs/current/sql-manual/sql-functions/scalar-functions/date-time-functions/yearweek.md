---
{
    "title": "YEARWEEK",
    "language": "ko",
    "description": "YEARWEEK 함수는 지정된 날짜의 \"연도 + 주 번호\" 조합을 반환하는 데 사용됩니다(형식: YYYYWW, 예:"
}
---

## 설명 {#description}

YEARWEEK 함수는 지정된 날짜의 "연도 + 주 번호" 조합을 반환하는 데 사용됩니다(형식: YYYYWW, 예: 202301은 2023년 1주 차를 나타냅니다). 선택적 매개변수 mode를 통해 주의 시작 요일과 "첫째 주"를 결정하는 기준을 유연하게 설정할 수 있으며, 기본값은 mode=0입니다.

주 번호의 범위는 모드 설정에 따라 1-53입니다.

매개변수 mode에 따른 동작은 아래 테이블과 같습니다.

|모드 |주의 시작 요일 |주 번호 범위 |첫째 주의 정의                              |
|:----|:-----------------|:-----------------|:-----------------------------------------------------|
|0    |일요일            |1-53              |해당 연도의 첫 번째 일요일이 포함된 주     |
|1    |월요일            |1-53              |해당 연도에 속하는 날이 4일 이상인 첫 번째 주      |
|2    |일요일            |1-53              |해당 연도의 첫 번째 일요일이 포함된 주     |
|3    |월요일            |1-53              |해당 연도에 속하는 날이 4일 이상인 첫 번째 주      |
|4    |일요일            |1-53              |해당 연도에 속하는 날이 4일 이상인 첫 번째 주      |
|5    |월요일            |1-53              |해당 연도의 첫 번째 월요일이 포함된 주     |
|6    |일요일            |1-53              |해당 연도에 속하는 날이 4일 이상인 첫 번째 주      |
|7    |월요일            |1-53              |해당 연도의 첫 번째 월요일이 포함된 주     |

이 함수는 MySQL의 [yearweek 함수](https://dev.mysql.com/doc/refman/8.4/en/date-and-time-functions.html#function_yearweek)와 동일하게 동작합니다.

## 구문 {#syntax}

```sql
YEARWEEK(`<date_or_time_expr>`[, mode])
```

## 반환 값 {#return-value}

YYYYWW 형식의 INT 정수를 반환합니다(앞 4자리는 연도, 뒤 2자리는 주 번호). 예를 들어 202305는 2023년 5주 차를, 202052는 2020년 52주 차를 나타냅니다.

- 날짜가 속한 주가 이전 연도에 해당하면 이전 연도의 연도와 주 번호를 반환합니다(예: 2021년 첫 달 1일은 202052를 반환할 수 있습니다).
- 날짜가 속한 주가 다음 연도에 해당하면 다음 연도의 연도와 주 번호 1을 반환합니다(예: 2024년 마지막 달 30일은 202501을 반환할 수 있습니다).
- 입력이 NULL이면 NULL을 반환합니다.

## 예제 {#examples}

```sql
-- Default mode=0 (Sunday start, first week contains first Sunday)
-- 2021-01-01 is Friday, the first Sunday of the week is 2020-12-27, so it belongs to week 52 of 2020
SELECT YEARWEEK('2021-01-01') AS yearweek_mode0;
+----------------+
| yearweek_mode0 |
+----------------+
|         202052 |
+----------------+

-- mode=1 (Monday start, 4-day rule, consistent with WEEKOFYEAR)
SELECT YEARWEEK('2020-07-01', 1) AS yearweek_mode1;
+----------------+
| yearweek_mode1 |
+----------------+
|         202027 |
+----------------+

-- mode=1, cross-year week (2024-12-30 is Monday, the week has ≥4 days in 2025, belongs to week 1 of 2025)
SELECT YEARWEEK('2024-12-30', 1) AS cross_year_mode1;
+------------------+
| cross_year_mode1 |
+------------------+
|           202501 |
+------------------+

-- mode=5 (Monday start, first week contains first Monday)
-- 2023-01-02 is Monday (first Monday of the year), the week is week 1 of 2023
SELECT YEARWEEK('2023-01-02', 5) AS yearweek_mode5;
+----------------+
| yearweek_mode5 |
+----------------+
|         202301 |
+----------------+

-- Input DATE type
SELECT YEARWEEK('2023-12-25', 1) AS date_type_mode1;
+------------------+
| date_type_mode1  |
+------------------+
|           202352 |
+------------------+

-- Input NULL (returns NULL)
SELECT YEARWEEK(NULL) AS null_input;
+------------+
| null_input |
+------------+
|       NULL |
+------------+
```
