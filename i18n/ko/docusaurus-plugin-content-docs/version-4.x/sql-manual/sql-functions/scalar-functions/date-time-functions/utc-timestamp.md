---
{
    "title": "UTC_TIMESTAMP",
    "language": "ko",
    "description": "UTCTIMESTAMP 함수는 UTC 시간대의 현재 날짜와 시간을 반환합니다."
}
---

## 설명 {#description}
UTC_TIMESTAMP 함수는 UTC 시간대의 현재 날짜와 시간을 반환합니다. 이 함수는 로컬 시간대의 영향을 받지 않으며 항상 UTC 시간대를 기준으로 현재 시간을 반환하므로, 서로 다른 시간대를 사용하는 환경에서도 시간의 일관성을 보장합니다.

이 함수는 MySQL의 [utc_timestamp 함수](https://dev.mysql.com/doc/refman/8.4/en/date-and-time-functions.html#function_utc-timestamp)와 동일하게 동작합니다.

## 구문 {#syntax}

```sql
UTC_TIMESTAMP([`<precision>`])
```

## 매개변수 {#parameters}

| 매개변수 | 설명 |
|-----------|-------------|
| `<precision>` | 반환되는 날짜 및 시간 값의 정밀도로, [0, 6] 범위의 정수 타입을 지원합니다. 정수 타입 상수만 허용됩니다. |

## 반환값 {#return-value}
현재 UTC 날짜와 시간을 반환합니다.

DATETIME 타입을 반환합니다(형식: YYYY-MM-DD HH:mm:ss[.ssssss]). 반환된 결과를 수치 연산에 사용하면 [정수 형식](../../../../sql-manual/basic-element/sql-data-types/conversion/int-conversion#from-datetime)으로 변환됩니다(형식: YYYYMMDDHHmmss).

입력이 NULL이거나 정밀도가 허용 범위를 벗어나면 오류가 발생합니다.

## 예제 {#examples}

```sql
-- Current local time is UTC+8 2025-10-27 14:43:21
SELECT UTC_TIMESTAMP(), UTC_TIMESTAMP() + 0, UTC_TIMESTAMP(5), UTC_TIMESTAMP(5) + 0;
```
```text
+---------------------+---------------------+---------------------------+----------------------+
| UTC_TIMESTAMP()     | UTC_TIMESTAMP() + 0 | UTC_TIMESTAMP(5)          | UTC_TIMESTAMP(5) + 0 |
+---------------------+---------------------+---------------------------+----------------------+
| 2025-10-27 06:43:21 |      20251027064321 | 2025-10-27 06:43:21.88177 |       20251027064321 |
+---------------------+---------------------+---------------------------+----------------------+
```

```sql
SELECT UTC_TIMESTAMP(7);
-- ERROR 1105 (HY000): errCode = 2, detailMessage = scale must be between 0 and 6

SELECT UTC_TIMESTAMP(NULL);
-- ERROR 1105 (HY000): errCode = 2, detailMessage = UTC_TIMESTAMP argument cannot be NULL.
```
