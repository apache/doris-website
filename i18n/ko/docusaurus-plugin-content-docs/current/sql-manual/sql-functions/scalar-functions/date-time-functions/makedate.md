---
{
    "title": "MAKEDATE",
    "language": "ko",
    "description": "MAKEDATE 함수는 지정한 연도와 해당 연도의 몇 번째 날인지 나타내는 값(dayofyear)을 기준으로 날짜를 생성하여 반환합니다."
}
---

## 설명 {#description}

MAKEDATE 함수는 지정한 연도와 해당 연도의 몇 번째 날인지 나타내는 값(`dayofyear`)을 기준으로 날짜를 생성하여 반환합니다. 지정한 연도의 첫날에 일수 오프셋을 더해 결과를 계산합니다. 입력값이 해당 연도의 총일수를 초과하면 자동으로 조정합니다.

이 함수는 MySQL의 [makedate 함수](https://dev.mysql.com/doc/refman/8.4/en/date-and-time-functions.html#function_makedate)와 동일하게 동작합니다.

## 구문 {#syntax}

```sql
MAKEDATE(`<year>`, `<day_of_year>`)
```

## 매개변수 {#parameters}

| 매개변수    | 설명                                                                 |
|--------------|-----------------------------------------------------------------------------|
| `year`       | 지정할 연도입니다. INT 타입이며 유효 범위는 0부터 9999까지입니다.          |
| `dayofyear`  | 해당 연도의 몇 번째 날인지 나타내는 값(1-366)입니다. INT 타입입니다.                                  |

## 반환값 {#return-value}

입력한 연도와 해당 연도의 일차를 기준으로 계산한 날짜를 `DATE` 타입으로 반환합니다(형식: `YYYY-MM-DD`).

- `<day_of_year>`가 0 이하이면 오류를 반환합니다.
- `<day_of_year>`가 지정한 연도의 총일수(평년은 365일, 윤년은 366일)를 초과하면 다음 해 또는 그 이후 연도로 자동 조정합니다(예: 평년인 2021년의 366번째 날은 2022-01-01로 조정됩니다).
- 계산 결과가 유효한 날짜 범위(0000-01-01부터 9999-12-31까지)를 벗어나면 오류를 반환합니다.
- 매개변수 중 하나라도 `NULL`이면 함수는 `NULL`을 반환합니다.

## 예제 {#examples}

```sql
--- Calculate the Nth day of the year (Note: 2021 is a common year with 365 days, and the 365th day is December 31)
SELECT MAKEDATE(2021, 1), MAKEDATE(2021, 100), MAKEDATE(2021, 365);
+-------------------+---------------------+----------------------+
| makedate(2021, 1) | makedate(2021, 100) | makedate(2021, 365)  |
+-------------------+---------------------+----------------------+
| 2021-01-01        | 2021-04-10          | 2021-12-31           |
+-------------------+---------------------+----------------------+

--- Leap year handling: 2020 is a leap year (366 days)
SELECT MAKEDATE(2020, 366);
+----------------------+
| makedate(2020, 366)  |
+----------------------+
| 2020-12-31           |
+----------------------+

--- Days exceeding the total days of the year are automatically adjusted to the next year
SELECT MAKEDATE(2021, 366), MAKEDATE(2021, 400);
+----------------------+----------------------+
| makedate(2021, 366)  | makedate(2021, 400)  |
+----------------------+----------------------+
| 2022-01-01           | 2022-02-04           |
+----------------------+----------------------+

--- Non-positive day values return an error
SELECT MAKEDATE(2020, 0);
ERROR 1105 (HY000): errCode = 2, detailMessage = (10.16.10.3)[INVALID_ARGUMENT]The function makedate Argument value 2020, 0 must larger than zero ,and year between 1 and 9999

--- Parameters are NULL, returns NULL
SELECT MAKEDATE(NULL, 100), MAKEDATE(2023, NULL);
+---------------------+----------------------+
| makedate(NULL, 100) | makedate(2023, NULL) |
+---------------------+----------------------+
| NULL                | NULL                 |
+---------------------+----------------------+

--- Year exceeds the valid range
SELECT MAKEDATE(9999, 366);
ERROR 1105 (HY000): errCode = 2, detailMessage = (10.16.10.3)[E-218]Operation makedate of 9999, 366 out of range
```
