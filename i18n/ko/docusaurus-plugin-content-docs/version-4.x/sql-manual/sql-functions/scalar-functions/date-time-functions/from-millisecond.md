---
{
    "title": "FROM_MILLISECOND",
    "language": "ko",
    "description": "FROMMILLISECOND 함수는 Unix 타임스탬프(밀리초 단위)를 DATETIME 타입의 날짜 및 시간 값으로 변환하는 데 사용됩니다."
}
---

## 설명 {#description}

FROM_MILLISECOND 함수는 Unix 타임스탬프(밀리초 단위)를 DATETIME 타입의 날짜 및 시간 값으로 변환하는 데 사용됩니다. Unix 타임스탬프의 기준 시각은 1970-01-01 00:00:00 UTC이며, 이 함수는 입력된 밀리초 값을 기준 시각 이후의 해당 날짜와 시간으로 밀리초 단위까지 정확하게 변환합니다.

## 구문 {#syntax}

```sql
FROM_MILLISECOND(<millisecond>)
```

## 매개변수 {#parameters}

| 매개변수 | 설명 |
| -- | -- |
| `<millisecond>` | 정수 타입(BIGINT)의 입력 Unix 타임스탬프로, 1970-01-01 00:00:00 UTC부터 경과한 밀리초 수를 나타냅니다. |

## 반환값 {#return-value}

입력된 UTC 시간대의 Unix 타임스탬프를 현재 시간대의 시간으로 변환한 결과를 DATETIME 타입의 값으로 반환합니다.
- millisecond가 NULL이면 함수는 NULL을 반환합니다.
- millisecond가 유효 범위를 벗어나면(결과 datetime이 9999-12-31 23:59:59를 초과하면) 함수는 오류를 반환합니다.
- 입력 millisecond를 정수 초로 변환할 수 있으면 scale이 없는 datetime을 반환하고, 그렇지 않으면 scale이 있는 datetime을 반환합니다.
- 입력값이 음수이면 오류를 반환합니다.

## 예제 {#examples}

```sql

----Since the current machine is in East 8th timezone, the returned time is 8 hours ahead of UTC
SELECT FROM_MILLISECOND(0);
+-------------------------+
| FROM_MILLISECOND(0)     |
+-------------------------+
| 1970-01-01 08:00:00.000 |
+-------------------------+

-- Convert 1700000000000 milliseconds to datetime
SELECT FROM_MILLISECOND(1700000000000);

+---------------------------------+
| from_millisecond(1700000000000) |
+---------------------------------+
| 2023-11-15 06:13:20             |
+---------------------------------+

-- Timestamp contains non-zero milliseconds (1700000000 seconds + 123 milliseconds)
select from_millisecond(1700000000123) as dt_with_milli;

+----------------------------+
| dt_with_milli              |
+----------------------------+
| 2023-11-15 06:13:20.123000 |
+----------------------------+

---Input is NULL, result returns NULL
select from_millisecond(NULL);
+------------------------+
| from_millisecond(NULL) |
+------------------------+
| NULL                   |
+------------------------+

---Input is negative, result returns error
 select from_millisecond(-1);
ERROR 1105 (HY000): errCode = 2, detailMessage = (10.16.10.3)[E-218]Operation from_millisecond of -1 out of range


--Result exceeds maximum date, returns error
select from_millisecond(999999999999999999);
ERROR 1105 (HY000): errCode = 2, detailMessage = (10.16.10.3)[E-218]Operation from_millisecond of 999999999999999999 out of range
```
