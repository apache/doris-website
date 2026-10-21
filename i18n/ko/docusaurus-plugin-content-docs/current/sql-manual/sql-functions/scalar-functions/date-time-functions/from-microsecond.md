---
{
    "title": "FROM_MICROSECOND",
    "language": "ko",
    "description": "FROMMICROSECOND 함수는 Unix 타임스탬프(마이크로초 단위)를 DATETIME 타입의 날짜 및 시간 값으로 변환하는 데 사용됩니다."
}
---

## 설명 {#description}

FROM_MICROSECOND 함수는 Unix 타임스탬프(마이크로초 단위)를 `DATETIME` 타입의 날짜 및 시간 값으로 변환하는 데 사용됩니다. Unix 타임스탬프의 기준 시각은 1970-01-01 00:00:00 UTC이며, 이 함수는 입력된 마이크로초를 해당 기준 시각 이후의 날짜와 시간으로 변환합니다(초의 소수 부분을 포함하며 마이크로초 단위까지 정확하게 변환합니다).

## 구문 {#syntax}

```sql
FROM_MICROSECOND(<unix_timestamp>)
```

## 매개변수 {#parameters}

| 매개변수 | 설명 |
| -- | -- |
| `<unix_timestamp>` | 정수 타입(BIGINT)의 입력 Unix 타임스탬프로, 1970-01-01 00:00:00 UTC부터 경과한 마이크로초 수를 나타냅니다. |

## 반환 값 {#return-value}

UTC 시간대의 Unix 타임스탬프를 현재 시간대의 시각으로 변환한 결과를 나타내는 DATETIME 타입 값을 반환합니다.
- <unix_timestamp>가 NULL이면 함수는 NULL을 반환합니다.
- 입력된 <unix_timestamp>를 정수 초 단위로 변환할 수 있으면 scale이 없는 datetime을 반환하고, 그렇지 않으면 scale이 있는 datetime을 반환합니다.
- <unix_timestamp>가 0보다 작으면 오류를 반환합니다.
- 반환되는 datetime이 최대 시각인 9999-12-31 23:59:59를 초과하면 오류를 반환합니다.

## 예제 {#examples}

```sql

-- Current machine is in East 8th timezone, so the returned time is 8 hours ahead of UTC
SELECT FROM_MICROSECOND(0);
+----------------------------+
| FROM_MICROSECOND(0)        |
+----------------------------+
| 1970-01-01 08:00:00.000000 |
+----------------------------+

-- Convert 1700000000000000 microseconds added to reference time to datetime
SELECT FROM_MICROSECOND(1700000000000000);

+------------------------------------+
| from_microsecond(1700000000000000) |
+------------------------------------+
| 2023-11-15 06:13:20                |
+------------------------------------+

-- Timestamp contains non-integer seconds (1700000000 seconds + 123456 microseconds)
select from_microsecond(1700000000123456) as dt_with_micro;

+----------------------------+
| dt_with_micro              |
+----------------------------+
| 2023-11-15 06:13:20.123456 |
+----------------------------+

-- Input negative number, returns error
 select from_microsecond(-1);
ERROR 1105 (HY000): errCode = 2, detailMessage = (10.16.10.3)[E-218]Operation from_microsecond of -1 out of range


-- Input NULL, returns NULL
select from_microsecond(NULL);
+------------------------+
| from_microsecond(NULL) |
+------------------------+
| NULL                   |
+------------------------+

-- Exceeds maximum time range 9999-12-31 23:59:59, returns error
select from_microsecond(999999999999999999);
ERROR 1105 (HY000): errCode = 2, detailMessage = (10.16.10.3)[E-218]Operation from_microsecond of 999999999999999999 out of range
```
