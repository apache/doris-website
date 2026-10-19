---
{
    "title": "LAST_DAY",
    "language": "ko",
    "description": "입력 날짜가 속한 달의 마지막 날짜를 반환합니다. 달에 따라 마지막 날짜는 다음과 같습니다:"
}
---

## 설명 {#description}

입력 날짜가 속한 달의 마지막 날짜를 반환합니다. 달에 따라 마지막 날짜는 다음과 같습니다:

- 28일: 평년(윤년이 아닌 해)의 이월
- 29일: 윤년의 이월
- 30일: 사월, 유월, 구월, 십일월
- 31일: 일월, 삼월, 오월, 칠월, 팔월, 시월, 십이월

이 함수는 MySQL의 [LAST_DAY 함수](https://dev.mysql.com/doc/refman/8.4/en/date-and-time-functions.html#function_last-day)와 동일하게 동작합니다.

## 구문 {#syntax}

```sql
LAST_DAY(`<date_or_time_expr>`)
```

## 인수 {#arguments}

| 매개변수 | 설명 |
| --- | --- |
| `<date_or_time_expr>` | 유효한 `DATE`, `DATETIME` 또는 `TIMESTAMP_NS` 표현식입니다. |

## 반환값 {#return-value}

입력 날짜가 속한 달의 마지막 날짜를 나타내는 `DATE` 타입의 값을 반환합니다(형식: `YYYY-MM-DD`).

- 입력이 `NULL`이면 `NULL`을 반환합니다.

## 예제 {#examples}

```sql
-- Input is DATE; returns the last day of February in a leap year
mysql> SELECT LAST_DAY('2000-02-03');
+------------------------+
| LAST_DAY('2000-02-03') |
+------------------------+
| 2000-02-29             |
+------------------------+

-- Input is DATETIME; time part is ignored
mysql> SELECT LAST_DAY('2023-04-15 12:34:56');
+---------------------------------+
| LAST_DAY('2023-04-15 12:34:56') |
+---------------------------------+
| 2023-04-30                      |
+---------------------------------+

-- February in a common (non‑leap) year
mysql> SELECT LAST_DAY('2021-02-01');
+------------------------+
| LAST_DAY('2021-02-01') |
+------------------------+
| 2021-02-28             |
+------------------------+

-- Example of a 31‑day month
mysql> SELECT LAST_DAY('2023-01-10');
+------------------------+
| LAST_DAY('2023-01-10') |
+------------------------+
| 2023-01-31             |
+------------------------+

-- Input is NULL; returns NULL
mysql> SELECT LAST_DAY(NULL);
+----------------+
| LAST_DAY(NULL) |
+----------------
