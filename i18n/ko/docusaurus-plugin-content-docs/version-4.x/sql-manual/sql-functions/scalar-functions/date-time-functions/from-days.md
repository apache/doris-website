---
{
    "title": "FROM_DAYS",
    "language": "ko",
    "description": "FROMDAYS 함수는 정수로 지정한 일수를 해당 날짜(DATE 타입)로 변환하는 데 사용됩니다. 이 함수는 \"첫 달 1일,"
}
---

## 설명 {#description}

FROM_DAYS 함수는 정수로 지정한 일수를 해당 날짜(DATE 타입)로 변환하는 데 사용됩니다. 이 함수는 "1년의 첫 달 1일"을 기준점으로 사용하며(즉, 0일째는 0000-01-01에 해당), 기준일로부터 지정한 일수가 지난 날짜를 계산합니다.

참고: MySQL과 동작의 일관성을 유지하기 위해 FROM_DAYS 함수는 "1년의 둘째 달 29일"(0000-02-29)을 지원하지 않습니다. 이론적으로는 이 해가 윤년 규칙에 부합하지만, 해당 날짜는 자동으로 건너뜁니다.
과거 날짜에 대한 제한: 이 함수는 역산 그레고리력을 기준으로 계산하므로, 그레고리력이 도입된 1582년 이전의 날짜(실제로는 율리우스력을 사용하던 시기)에는 적합하지 않으며, 결과가 실제 역사적 날짜와 다를 수 있습니다.

이 함수는 MySQL의 [from_days 함수](https://dev.mysql.com/doc/refman/8.4/en/date-and-time-functions.html#function_from-days)와 동일하게 동작합니다.

## 구문 {#syntax}

```sql
FROM_DAYS(<days>)
```

## 매개변수 {#parameters}

| 매개변수 | 설명 |
| -- | -- |
| `<days>` | 입력 일수. 타입은 `INT`입니다. |

## 반환값 {#return-value}

기준일(0000-01-01)로부터 days만큼의 일수가 지난 날짜를 YYYY-MM-DD 형식의 DATE 타입 값으로 반환합니다.
days가 음수이면 NULL을 반환합니다.
days가 유효한 날짜 범위(일반적으로 1부터 3652424까지이며, 약 10000년에 해당)를 초과하면 오류를 반환합니다.

## 예제 {#examples}

```sql
-- Calculate days from the reference date
select from_days(730669),from_days(5),from_days(59), from_days(60);

+-------------------+--------------+---------------+---------------+
| from_days(730669) | from_days(5) | from_days(59) | from_days(60) |
+-------------------+--------------+---------------+---------------+
| 2000-07-03        | 0000-01-05   | 0000-02-28    | 0000-03-01    |
+-------------------+--------------+---------------+---------------+

-- If the input parameter is negative, an error is returned
select from_days(-60);
ERROR 1105 (HY000): errCode = 2, detailMessage = (10.16.10.3)[E-218]Operation from_days of -60 out of range

-- If the input is NULL, returns NULL
select from_days(NULL);
+-----------------+
| from_days(NULL) |
+-----------------+
| NULL            |
+-----------------+

-- If days exceeds the valid date range (typically 1 to 3652424, corresponding to approximately year 10000), an error is returned
select from_days(99999999);
ERROR 1105 (HY000): errCode = 2, detailMessage = (10.16.10.3)[E-218]Operation from_days of 99999999 out of range
```
