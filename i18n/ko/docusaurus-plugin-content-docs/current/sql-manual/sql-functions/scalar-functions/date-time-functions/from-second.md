---
{
    "title": "FROM_SECOND",
    "language": "ko",
    "description": "FROMSECOND 함수는 Unix 타임스탬프(초 단위)를 DATETIME 타입의 날짜 및 시간 값으로 변환하는 데 사용됩니다."
}
---

## 설명 {#description}
FROM_SECOND 함수는 Unix 타임스탬프(초 단위)를 DATETIME 타입의 날짜 및 시간 값으로 변환하는 데 사용됩니다. Unix 타임스탬프의 기준 시각은 1970-01-01 00:00:00 UTC이며, 이 함수는 입력한 초 값을 기준 시각 이후의 해당 날짜와 시간으로 변환합니다(초 단위 정밀도).

## 구문 {#syntax}

```sql
FROM_SECOND(<unix_timestamp>)
```

## 매개변수 {#parameters}

| 매개변수 | 설명 |
| -- | -- |
| `<unix_timestamp>` | 입력 Unix 타임스탬프입니다. 정수 타입(BIGINT)이며, 1970-01-01 00:00:00 UTC부터 경과한 초 수를 나타냅니다. |

## 반환 값 {#return-value}

- 입력된 UTC 시간대의 Unix 타임스탬프를 현재 시간대의 시각으로 변환한 DATETIME 타입 값을 반환합니다.
- <unix_timestamp>가 NULL이면 함수는 NULL을 반환합니다.
- <unix_timestamp>가 유효한 범위를 벗어나면(결과 날짜 및 시간이 9999-12-31 23:59:59를 초과하면) 함수는 오류를 반환합니다.
- 입력한 초 값이 음수이면 함수는 오류를 반환합니다.

## 예제 {#examples}

```sql

----Since the current machine is in East 8th timezone, the returned time is 8 hours ahead of UTC
 SELECT FROM_SECOND(0);
+---------------------+
| FROM_SECOND(0)      |
+---------------------+
| 1970-01-01 08:00:00 |
+---------------------+

---Convert 1700000000 seconds to datetime
SELECT FROM_SECOND(1700000000);

+-------------------------+
| from_second(1700000000) |
+-------------------------+
| 2023-11-15 06:13:20     |
+-------------------------+

---Result exceeds maximum date range, returns error
select from_second(999999999999999);
ERROR 1105 (HY000): errCode = 2, detailMessage = (10.16.10.3)[INTERNAL_ERROR]The function from_second Argument value is out of DateTime range

---Input parameter is NULL, returns NULL
select from_second(NULL);
+-------------------+
| from_second(NULL) |
+-------------------+
| NULL              |
+-------------------+

--Input parameter is negative, result returns error
 select from_second(-1);
ERROR 1105 (HY000): errCode = 2, detailMessage = (10.16.10.3)[E-218]Operation from_second of -1 out of range
```
