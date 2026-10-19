---
{
    "title": "SEC_TO_TIME",
    "language": "ko",
    "description": "SECTOTIME 함수는 초 단위의 숫자 값을 TIME 타입으로 변환하며, 반환 형식은 HH:MM:SS 또는 HH:MM:SS.ssssss입니다."
}
---

## 설명 {#description}

SEC_TO_TIME 함수는 초 단위의 숫자 값을 TIME 타입으로 변환하며, 반환 형식은 HH:MM:SS 또는 HH:MM:SS.ssssss입니다. 입력된 초는 하루의 시작 시점(00:00:00.000000)을 기준으로 계산한 시간을 나타내며, 양수와 음수뿐만 아니라 하루를 초과하는 시간 범위도 지원합니다.

이 함수는 MySQL의 [sec_to_time 함수](https://dev.mysql.com/doc/refman/8.4/en/date-and-time-functions.html#function_sec-to-time)와 동일하게 동작합니다.

## 구문 {#syntax}

```sql
SEC_TO_TIME(<seconds>)
```

## 매개변수 {#parameters}

| 매개변수   | 설명                                                                                                                                                   |
|-------------|---------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `<seconds>` | 필수입니다. 하루의 시작 시점(00:00:00)을 기준으로 계산한 초 단위의 입력값입니다. 양수 또는 음수 정수 타입을 지원합니다. |

## 반환 값 {#return-value}

초 단위의 값을 변환한 TIME 타입 값을 반환합니다.
- 입력된 초가 TIME 타입의 유효 범위(-838:59:59~838:59:59, 초 단위로 -3020399~3020399)를 벗어나면 TIME의 최댓값 또는 최솟값을 반환합니다.
- 입력값이 NULL이면 NULL을 반환합니다.
- 입력값이 정수이면 반환 형식은 HH:MM:SS이고, 부동 소수점 숫자이면 반환 형식은 HH:MM:SS.ssssss입니다.

## 예제 {#examples}

```sql
-- Positive seconds (time within the day)
SELECT SEC_TO_TIME(59738) AS result;
+----------+
| result   |
+----------+
| 16:35:38 |
+----------+

-- Seconds exceeding one day (automatically converted to multiple hours)
SELECT SEC_TO_TIME(90061) AS result;
+----------+
| result   |
+----------+
| 25:01:01 |
+----------+

-- Negative seconds (time from previous day)
SELECT SEC_TO_TIME(-3600) AS result;
+----------+
| result   |
+----------+
| -01:00:00 |
+----------+

-- Zero seconds (start time)
SELECT SEC_TO_TIME(0) AS result;
+----------+
| result   |
+----------+
| 00:00:00 |
+----------+

-- Decimal seconds
SELECT SEC_TO_TIME(3661.9) AS result;
+-----------------+
| result          |
+-----------------+
| 01:01:01.900000 |
+-----------------+

-- Input is NULL (returns NULL)
SELECT SEC_TO_TIME(NULL) AS result;
+--------+
| result |
+--------+
| NULL   |
+--------+

--- If the input seconds exceed the valid range of TIME type (-838:59:59 to 838:59:59, corresponding to seconds range -3020399 to 3020399), returns TIME max or min value
 SELECT SEC_TO_TIME(30245000) AS result;
+-----------+
| result    |
+-----------+
| 838:59:59 |
+-----------+

SELECT SEC_TO_TIME(-30245000) AS result;
+------------+
| result     |
+------------+
| -838:59:59 |
+------------+
```
