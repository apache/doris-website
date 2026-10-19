---
{
    "title": "SUB_TIME",
    "language": "ko",
    "description": "날짜/시간 또는 시간 표현식에서 지정된 시간 간격을 뺍니다. 두 번째 매개변수가 음수이면,"
}
---

## 설명 {#description}

날짜/시간 또는 시간 표현식에서 지정된 시간 간격을 뺍니다. 두 번째 매개변수가 음수이면 첫 번째 매개변수에 해당 시간 간격을 더하는 것과 같습니다.

## 구문 {#syntax}

```sql
SUB_TIME(`<date_or_time_expr>`, `<time>`)
```

## 매개변수 {#parameters}

| 매개변수             | 설명 |
| ---------------------| ----------- |
| `<date_or_time_expr>`| 유효한 날짜 표현식입니다. TIMESTAMPTZ/TIMESTAMP_NS/DATETIME/DATE/TIME 타입의 입력을 지원합니다. date 타입이면 해당 날짜의 시작 시각(00:00:00)으로 변환됩니다. 구체적인 형식은 [timestamptz 변환](../../../../sql-manual/basic-element/sql-data-types/conversion/timestamptz-conversion), [datetime 변환](../../../../sql-manual/basic-element/sql-data-types/conversion/datetime-conversion) 및 [time 변환](../../../../sql-manual/basic-element/sql-data-types/conversion/time-conversion)을 참조하세요. |
| `<time>`             | 유효한 시간 표현식으로, `<date_or_time_expr>`에서 뺄 시간 값을 나타냅니다. 음수이면 덧셈을 의미합니다. time 타입의 입력을 지원합니다. |

## 반환 값 {#return-value}

`TIMESTAMP_NS` 타입의 입력은 소수점 이하 초 정밀도가 아홉 자리로 고정된 `TIMESTAMP_NS`를 반환합니다. 결과가 반환 타입의 범위 내에 있는지 검증합니다. `TIMESTAMP_NS`에는 `[1677-09-21 00:12:43.145224192, 2262-04-11 23:47:16.854775807]` 범위가 적용됩니다.

`<time>`을 `<date_or_time_expr>`에서 뺀 결과를 반환합니다. 반환 타입은 첫 번째 매개변수의 타입에 따라 달라집니다.
- 첫 번째 매개변수가 timestamp 타입이면 timestamp 타입을 반환합니다.
- 첫 번째 매개변수가 datetime 타입이면 datetime 타입을 반환합니다.
- 첫 번째 매개변수가 time 타입이면 time 타입을 반환합니다.

특수한 경우:
- 입력 매개변수 중 하나라도 null이면 null을 반환합니다.
- 첫 번째 매개변수가 time 타입이고 결과가 time 타입의 범위를 벗어나면 시간의 최댓값(또는 최솟값)을 반환합니다.
- 첫 번째 매개변수가 datetime 또는 timestamptz 타입이고 결과가 datetime 타입의 범위를 벗어나면 오류가 발생합니다.

## 예제 {#examples}

```sql
-- Subtract time when the first parameter is datetime type
SELECT SUB_TIME('2025-09-19 12:00:00', '01:30:00'); 
+---------------------------------------------+
| SUB_TIME('2025-09-19 12:00:00', '01:30:00') |
+---------------------------------------------+
| 2025-09-19 10:30:00                         |
+---------------------------------------------+

-- Subtract time when the first parameter is time type
SELECT SUB_TIME(cast('12:15:20' as time), '00:10:40'); 
+------------------------------------------------+
| SUB_TIME(cast('12:15:20' as time), '00:10:40') |
+------------------------------------------------+
| 12:04:40                                       |
+------------------------------------------------+   

-- SET time_zone = '+08:00'
select sub_time('2025-10-10 11:22:33+03:00', '3:22:33.123');
+------------------------------------------------------+
| sub_time('2025-10-10 11:22:33+03:00', '3:22:33.123') |
+------------------------------------------------------+
| 2025-10-10 12:59:59.877+08:00                        |
+------------------------------------------------------+
         
-- NULL parameter test
SELECT SUB_TIME(NULL, '01:00:00');
+----------------------------+
| SUB_TIME(NULL, '01:00:00') |
+----------------------------+
| NULL                       |
+----------------------------+    

SELECT SUB_TIME('2025-09-19 12:00:00', NULL); 
+---------------------------------------+
| SUB_TIME('2025-09-19 12:00:00', NULL) |
+---------------------------------------+
| NULL                                  |
+---------------------------------------+

SELECT SUB_TIME(NULL, NULL);
+----------------------+
| SUB_TIME(NULL, NULL) |
+----------------------+
| NULL                 |
+----------------------+                        

-- Time type out-of-range test (returns max/min value)
SELECT SUB_TIME(cast('835:30:00' as time), '-21:00:00');
+--------------------------------------------------+
| SUB_TIME(cast('835:30:00' as time), '-21:00:00') |
+--------------------------------------------------+
| 838:59:59                                        |
+--------------------------------------------------+

SELECT SUB_TIME(cast('-832:30:00' as time), '31:00:00');   
+---------------------------------------------------+
| SUB_TIME(cast('-832:30:00' as time), '31:00:00') |
+---------------------------------------------------+
| -838:59:59                                        |
+---------------------------------------------------+       

-- Datetime type out-of-range test (throws error)
SELECT SUB_TIME('0000-01-01 00:00:00', '00:00:01');  
ERROR 1105 (HY000): errCode = 2, detailMessage = (10.16.10.3)[INVALID_ARGUMENT]datetime value is out of range in function sub_time

SELECT SUB_TIME('9999-12-31 23:59:59', '-00:00:01');
ERROR 1105 (HY000): errCode = 2, detailMessage = (10.16.10.3)[INVALID_ARGUMENT]datetime value is out of range in function sub_time
```
