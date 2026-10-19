---
{
    "title": "DATE | 날짜 및 시간 함수",
    "language": "ko",
    "description": "DATE 함수는 날짜와 시간을 모두 포함하는 datetime 값에서 시간 정보를 제외하고 날짜 부분만 추출하는 데 사용됩니다.",
    "sidebar_label": "DATE"
}
---

# DATE {#date}

## 설명 {#description}

DATE 함수는 날짜와 시간을 모두 포함하는 datetime 값에서 시간 정보를 제외하고 날짜 부분만 추출하는 데 사용됩니다. 이 함수는 DATETIME 타입을 DATE 타입으로 변환하여 연, 월, 일 정보만 유지할 수 있습니다.

이 함수는 MySQL의 [date 함수](https://dev.mysql.com/doc/refman/8.4/en/date-and-time-functions.html#function_date)와 동일하게 동작합니다.

## 구문 {#syntax}

```sql
DATE(<date_or_time_part>)
```

## 매개변수 {#parameters}

| 매개변수 | 설명 |
| -- | -- |
| `<date_or_time_part>` | datetime 타입의 유효한 날짜 표현식으로, datetime을 지원합니다. 구체적인 datetime 및 날짜 형식은 [datetime 변환](../../../../sql-manual/basic-element/sql-data-types/conversion/datetime-conversion)을 참조하세요. |

## 반환 값 {#return-value}

입력이 유효하면 시간 부분을 제외한 DATE 타입의 날짜 값(YYYY-MM-DD 형식)을 반환합니다.
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
