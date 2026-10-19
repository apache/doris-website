---
{
    "title": "CENTURY",
    "language": "ko",
    "description": "주어진 날짜가 속한 세기를 반환합니다. 입력값이 유효하지 않거나 지원 범위를 벗어나면 NULL을 반환합니다."
}
---

## 설명 {#description}
주어진 날짜가 속한 세기를 반환합니다.
입력값이 유효하지 않거나 지원 범위를 벗어나면 NULL을 반환합니다.

## 구문 {#syntax}
```sql
CENTURY(`<date_or_time_expr>`)
```

## 매개변수 {#parameters}
| 매개변수     | 설명                                                   |
| ------------- | ------------------------------------------------------------- |
| `<date_or_time_expr>` | 세기를 계산할 날짜 또는 datetime 표현식입니다. |

## 반환 값 {#return-value}
입력 날짜가 속한 세기를 나타내는 정수(INT)를 반환합니다. 예를 들어, 1901년부터 2000년까지는 20세기에 속합니다. 입력값이 NULL이거나 유효하지 않은 날짜이면 NULL을 반환합니다.

## 예제 {#examples}
```sql
-- Extract the century from a DATE type
SELECT CENTURY('2024-01-01') AS century_date;
+-----------------+
| century_date    |
+-----------------+
| 21              |
+-----------------+

-- Extract the century from a DATETIME type (ignoring hours, minutes, and seconds)
SELECT CENTURY('2024-05-20 14:30:25') AS century_datetime;
+----------------------+ 
| century_datetime     |
+----------------------+
| 21                   |
+----------------------+

-- Input is NULL (returns NULL)
SELECT CENTURY(NULL) AS null_input;
+----------------+
| null_input     |
+----------------+
| NULL           |
+----------------+

-- Invalid date input (returns NULL)
SELECT CENTURY('10000-01-01') AS invalid_date;
+-------------------+
| invalid_date      |
+-------------------+
| NULL              |
+-------------------+


```
