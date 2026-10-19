---
{
    "title": "ADD_TIME",
    "language": "ko",
    "description": "지정된 시간 간격을 날짜/시간 또는 시간 표현식에 더합니다. 두 번째 매개변수가 음수이면,"
}
---

## 설명 {#description}

지정된 시간 간격을 날짜/시간 또는 시간 표현식에 더합니다. 두 번째 매개변수가 음수이면 첫 번째 매개변수에서 해당 시간 간격을 빼는 것과 같습니다.

## 구문 {#syntax}

```sql
ADD_TIME(`<date_or_time_expr>`, `<time>`)
```

## 매개변수 {#parameters}

| 매개변수             | 설명 |
| ---------------------| ----------- |
| `<date_or_time_expr>`| 유효한 날짜 표현식입니다. timestamptz/datetime/date/time 타입의 입력을 지원합니다. date 타입이면 해당 날짜의 시작 시각(00:00:00)으로 변환됩니다. 구체적인 형식은 [timestamptz 변환](../../../../sql-manual/basic-element/sql-data-types/conversion/timestamptz-conversion), [datetime 변환](../../../../sql-manual/basic-element/sql-data-types/conversion/datetime-conversion) 및 [time 변환](../../../../sql-manual/basic-element/sql-data-types/conversion/time-conversion)을 참조하세요. |
| `<time>`             | 유효한 시간 표현식으로, `<date_or_time_expr>`에 더할 시간 값을 나타냅니다. 음수이면 뺄셈을 의미합니다. time 타입의 입력을 지원합니다. |

## 반환 값 {#return-value}

`<time>`을 `<date_or_time_expr>`에 더한 결과를 반환합니다. 반환 타입은 첫 번째 매개변수의 타입에 따라 달라집니다.
- 첫 번째 매개변수가 timestamptz 타입이면 timestamptz 타입을 반환합니다.
- 첫 번째 매개변수가 datetime 타입이면 datetime 타입을 반환합니다.
- 첫 번째 매개변수가 time 타입이면 time 타입을 반환합니다.

특수한 경우:
- 입력 매개변수 중 하나라도 null이면 null을 반환합니다.
- 첫 번째 매개변수가 time 타입이고 결과가 time 타입의 범위를 벗어나면 time의 최댓값(또는 최솟값)을 반환합니다.
- 첫 번째 매개변수가 datetime 또는 timestamptz 타입이고 결과가 datetime 타입의 범위를 벗어나면 오류가 발생합니다.

## 예제 {#examples}

```sql
-- Add time when the first parameter is datetime type
SELECT ADD_TIME('2025-09-19 12:00:00', '01:30:00'); 
+---------------------------------------------+
| ADD_TIME('2025-09-19 12:00:00', '01:30:00') |
+---------------------------------------------+
| 2025-09-19 13:30:00                         |
+---------------------------------------------+

-- Add time when the first parameter is time type
SELECT ADD_TIME(cast('12:15:20' as time), '00:10:40'); 
+------------------------------------------------+
| ADD_TIME(cast('12:15:20' as time), '00:10:40') |
+------------------------------------------------+
| 12:26:00                                       |
+------------------------------------------------+   

-- SET time_zone = '+08:00';
SELECT ADD_TIME('2025-10-10 11:22:33.1234567+03:00', '01:02:03');
+-----------------------------------------------------------+
| ADD_TIME('2025-10-10 11:22:33.1234567+03:00', '01:02:03') |
+-----------------------------------------------------------+
| 2025-10-10 17:24:36.123457+08:00                          |
+-----------------------------------------------------------+
         
-- NULL parameter test
SELECT ADD_TIME(NULL, '01:00:00');
+----------------------------+
| ADD_TIME(NULL, '01:00:00') |
+----------------------------+
| NULL                       |
+----------------------------+    

SELECT ADD_TIME('2025-09-19 12:00:00', NULL); 
+---------------------------------------+
| ADD_TIME('2025-09-19 12:00:00', NULL) |
+---------------------------------------+
| NULL                                  |
+---------------------------------------+

SELECT ADD_TIME(NULL, NULL);
+----------------------+
| ADD_TIME(NULL, NULL) |
+----------------------+
| NULL                 |
+----------------------+                        

-- Time type out-of-range test (returns max/min value)
SELECT ADD_TIME(cast('835:30:00' as time), '21:00:00'); 
+-------------------------------------------------+
| ADD_TIME(cast('835:30:00' as time), '21:00:00') |
+-------------------------------------------------+
| 838:59:59                                       |
+-------------------------------------------------+

SELECT ADD_TIME(cast('-832:30:00' as time), '-31:00:00');   
+---------------------------------------------------+
| ADD_TIME(cast('-832:30:00' as time), '-31:00:00') |
+---------------------------------------------------+
| -838:59:59                                        |
+---------------------------------------------------+       

-- Datetime type out-of-range test (throws error)
SELECT ADD_TIME('9999-12-31 23:59:59', '00:00:01');  
ERROR 1105 (HY000): errCode = 2, detailMessage = (10.16.10.3)[INVALID_ARGUMENT]datetime value is out of range in function add_time

SELECT ADD_TIME('0000-01-01 00:00:00', '-00:00:01');
ERROR 1105 (HY000): errCode = 2, detailMessage = (10.16.10.3)[INVALID_ARGUMENT]datetime value is out of range in function add_time
```
