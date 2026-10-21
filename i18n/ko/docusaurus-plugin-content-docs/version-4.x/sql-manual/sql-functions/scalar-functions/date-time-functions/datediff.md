---
{
    "title": "DATEDIFF",
    "language": "ko",
    "description": "DATEDIFF 함수는 두 date 또는 datetime 값의 차이를 일 단위로 계산하는 데 사용됩니다. 즉,"
}
---

## 설명 {#description}

DATEDIFF 함수는 두 date 또는 datetime 값의 차이를 일 단위로 계산하는 데 사용됩니다. 즉, `expr2`를 `expr1`에서 뺀 일수를 반환합니다. 이 함수는 날짜 부분만 사용하며 시간 부분의 시, 분, 초는 무시합니다.

이 함수는 MySQL의 [datediff 함수](https://dev.mysql.com/doc/refman/8.4/en/date-and-time-functions.html#function_datediff)와 동일하게 동작합니다.

## 구문 {#syntax}

```sql
DATEDIFF(<expr1>, <expr2>)
```

## 매개변수 {#parameters}

| 매개변수 | 설명 |
| -- | -- |
| `<expr1>` | 빼기의 기준이 되는 날짜로, datetime 또는 date 타입을 지원합니다. 구체적인 datetime 및 date 형식은 [datetime 변환](../../../../sql-manual/basic-element/sql-data-types/conversion/datetime-conversion) 및 [date 변환](../../../../sql-manual/basic-element/sql-data-types/conversion/date-conversion)을 참조하세요. |
| `<expr2>` | 빼려는 날짜로, date 및 datetime 타입을 지원합니다. |

## 반환값 {#return-value}

expr1 - expr2의 값을 일 단위로 반환하며, 반환 타입은 INT입니다.

특수한 경우:
- expr1이 expr2보다 크면 양수를 반환하고, 그렇지 않으면 음수를 반환합니다.
- 매개변수 중 하나라도 NULL이면 NULL을 반환합니다.
- 시간 부분은 무시합니다.

## 예제 {#examples}

```sql
-- The two dates differ by 1 day (ignoring the time part)
select datediff(CAST('2007-12-31 23:59:59' AS DATETIME), CAST('2007-12-30' AS DATETIME));
+-----------------------------------------------------------------------------------+
| datediff(CAST('2007-12-31 23:59:59' AS DATETIME), CAST('2007-12-30' AS DATETIME)) |
+-----------------------------------------------------------------------------------+
|                                                                                 1 |
+-----------------------------------------------------------------------------------+

-- The first date is earlier than the second date, returning a negative number
select datediff(CAST('2010-11-30 23:59:59' AS DATETIME), CAST('2010-12-31' AS DATETIME));
+-----------------------------------------------------------------------------------+
| datediff(CAST('2010-11-30 23:59:59' AS DATETIME), CAST('2010-12-31' AS DATETIME)) |
+-----------------------------------------------------------------------------------+
|                                                                               -31 |
+-----------------------------------------------------------------------------------+

-- Any parameter is NULL
mysql> select datediff('2023-01-01', NULL);
+------------------------------+
| datediff('2023-01-01', NULL) |
+------------------------------+
|                         NULL |
+------------------------------+

-- If input datetime type, will ignore time part
select datediff('2023-01-02 13:00:00', '2023-01-01 12:00:00');
+--------------------------------------------------------+
| datediff('2023-01-02 13:00:00', '2023-01-01 12:00:00') |
+--------------------------------------------------------+
|                                                      1 |
+--------------------------------------------------------+

select datediff('2023-01-02 12:00:00', '2023-01-01 13:00:00');
+--------------------------------------------------------+
| datediff('2023-01-02 12:00:00', '2023-01-01 13:00:00') |
+--------------------------------------------------------+
|                                                      1 |
+--------------------------------------------------------+
1 row in set (0.01 sec)
```
