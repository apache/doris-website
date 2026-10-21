---
{
    "title": "DATE | 날짜 및 시간 함수",
    "language": "ko",
    "description": "DATETIME 또는 TIMESTAMP_NS 값에서 날짜 부분을 추출하고 시간 및 소수 초 필드를 무시합니다.",
    "sidebar_label": "DATE"
}
---

# DATE {#date}

## 설명 {#description}

DATE 함수는 `DATETIME` 또는 `TIMESTAMP_NS` 값에서 날짜 부분을 추출하고 시간 및 소수 초 필드를 무시합니다.

이 함수는 MySQL의 [date 함수](https://dev.mysql.com/doc/refman/8.4/en/date-and-time-functions.html#function_date)와 동일하게 동작합니다.

## 구문 {#syntax}

```sql
DATE(<date_or_time_part>)
```

## 매개변수 {#parameters}

| 매개변수 | 설명 |
| -- | -- |
| `<date_or_time_part>` | `DATETIME` 또는 `TIMESTAMP_NS` 표현식입니다. |

## 반환 값 {#return-value}

입력이 유효하면 시간 부분 없이 날짜만 포함하는 DATE 타입의 값(YYYY-MM-DD 형식)을 반환합니다.
특수한 경우:
- 입력이 NULL이면 NULL을 반환합니다;

## 예제 {#examples}

```sql
-- Extract the date part from a datetime
mysql> select date(cast('2010-12-02 19:28:30' as datetime));
+-----------------------------------------------+
| date(cast('2010-12-02 19:28:30' as datetime)) |
+-----------------------------------------------+
| 2010-12-02                                    |
+-----------------------------------------------+

-- Extract the date part from a date
mysql> select date(cast('2015-11-02' as date));
+----------------------------------+
| date(cast('2015-11-02' as date)) |
+----------------------------------+
| 2015-11-02                       |
+----------------------------------+

-- Input is NULL
mysql> select date(NULL);
+------------+
| date(NULL) |
+------------+
| NULL       |
+------------+

```
