---
{
    "title": "UTC_TIME",
    "language": "ko",
    "description": "UTCTIME 함수는 UTC 시간대의 현재 시간을 반환합니다."
}
---

## 설명 {#description}
UTC_TIME 함수는 UTC 시간대의 현재 시간을 반환합니다. 이 함수는 로컬 시간대의 영향을 받지 않으며 항상 UTC 시간대를 기준으로 현재 시간을 반환하므로, 서로 다른 시간대 환경에서도 시간의 일관성을 보장합니다.

이 함수는 MySQL의 [utc_time 함수](https://dev.mysql.com/doc/refman/8.4/en/date-and-time-functions.html#function_utc-time)와 동일하게 동작합니다.

## 구문 {#syntax}

```sql
UTC_TIME([<`precision`>])
```

## 매개변수 {#parameters}

| 매개변수 | 설명 |
|-----------|-------------|
| `<precision>` | 반환되는 시간 값의 정밀도는 [0, 6] 범위의 정수를 지원합니다. 정수 타입 상수만 허용됩니다. |

## 반환 값 {#return-value}
현재 UTC 시간을 반환합니다.

반환 타입은 Time입니다(형식: HH:mm:ss). 반환 결과를 수치 연산에 사용하면 [정수 형식](../../../../sql-manual/basic-element/sql-data-types/conversion/int-conversion#from-time)(00:00:00부터 경과한 시간 값, 단위: 마이크로초)으로 변환됩니다.

입력값이 NULL이거나 정밀도가 허용 범위를 벗어나면 오류가 발생합니다.

## 예제 {#examples}

```sql
-- Assume the current local time is UTC+8 2025-10-27 14:39:01
SELECT UTC_TIME(), UTC_TIME() + 1, UTC_TIME(6), UTC_TIME(6) + 1;
```
```text
+------------+----------------+-----------------+-----------------+
| UTC_TIME() | UTC_TIME() + 1 | UTC_TIME(6)     | UTC_TIME(6) + 1 |
+------------+----------------+-----------------+-----------------+
| 06:39:01   |    23941000001 | 06:39:01.934119 |     23941934120 |
+------------+----------------+-----------------+-----------------+
```

```sql
SELECT UTC_TIME(7);
-- ERROR 1105 (HY000): errCode = 2, detailMessage = scale must be between 0 and 6

SELECT UTC_TIME(NULL);
-- ERROR 1105 (HY000): errCode = 2, detailMessage = UTC_TIME argument cannot be NULL.
```
