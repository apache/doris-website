---
{
    "title": "UTC_DATE",
    "language": "ko",
    "description": "UTCDATE 함수는 UTC 시간대의 현재 날짜를 반환합니다."
}
---

## 설명 {#description}
UTC_DATE 함수는 UTC 시간대의 현재 날짜를 반환합니다. 이 함수는 로컬 시간대의 영향을 받지 않으며, 항상 UTC 시간대를 기준으로 현재 날짜를 반환하므로 서로 다른 시간대에서도 날짜의 일관성을 보장합니다.

이 함수는 MySQL의 [utc_date 함수](https://dev.mysql.com/doc/refman/8.4/en/date-and-time-functions.html#function_utc-date)와 동일하게 동작합니다.

## 구문 {#syntax}

```sql
UTC_DATE()
```

## 반환 값 {#return-value}
현재 UTC 날짜를 DATE 타입으로 반환합니다.

반환 타입은 Date입니다(형식: YYYY-MM-DD). 반환된 결과에 대해 수치 연산을 수행하면 타입 변환이 이루어져 [정수 형식](../../../../sql-manual/basic-element/sql-data-types/conversion/int-conversion#from-date)(형식: YYYYMMDD)으로 반환됩니다.

## 예제 {#examples}

```sql
-- Assume the current local time is UTC+8 2025-10-27 10:55:35
SELECT UTC_DATE(), UTC_DATE() + 0;
```
```text
+------------+----------------+
| UTC_DATE() | UTC_DATE() + 0 |
+------------+----------------+
| 2025-10-27 |       20251027 |
+------------+----------------+
```
