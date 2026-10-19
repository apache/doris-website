---
{
    "title": "STR_TO_DATE",
    "language": "ko",
    "description": "이 함수는 지정된 형식에 따라 입력된 날짜 및 시간 문자열을 DATETIME 타입 값으로 변환합니다."
}
---

## 설명 {#description}

이 함수는 지정된 형식에 따라 입력된 날짜 및 시간 문자열을 DATETIME 타입 값으로 변환합니다.

이 함수는 MySQL의 [str_to_date 함수](https://dev.mysql.com/doc/refman/8.4/en/date-and-time-functions.html#function_str-to-date)와 동일하게 동작합니다.

## 구문 {#syntax}

```sql
STR_TO_DATE(<datetime_str>, <format>)
```

## 매개변수 {#parameters}

| 매개변수        | 설명                                                                                                                                                                                                                                                                                                      |
|------------------|------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `<datetime_str>` | 필수입니다. 변환할 날짜 또는 시간을 나타내는 입력 문자열입니다. 지원되는 입력 형식은 [날짜 및 시간 변환](../../../../sql-manual/basic-element/sql-data-types/conversion/datetime-conversion)과 [날짜 변환](../../../../sql-manual/basic-element/sql-data-types/conversion/date-conversion)을 참조하세요. |
| `<format>`       | 필수입니다. `%Y-%m-%d %H:%i:%s`와 같이 날짜 및 시간 형식을 지정하는 문자열입니다. 구체적인 형식 매개변수는 [DATE_FORMAT](./date-format#parameters) 문서를 참조하세요.                                                                                                                               |

또한 `<format>`은 다음과 같은 대체 형식을 지원하며, 이를 일반 형식으로 해석합니다.

| 대체 입력 형식          | 해석되는 형식       |
|----------------------------|----------------------|
| `yyyyMMdd`                 | `%Y%m%d`             |
| `yyyy-MM-dd`               | `%Y-%m-%d`           |
| `yyyy-MM-dd HH:mm:ss`      | `%Y-%m-%d %H:%i:%s`  |

## 반환 값 {#return-value}

변환된 날짜와 시간을 나타내는 DATETIME 값을 반환합니다.

날짜와 시간의 일치 여부는 각 문자열의 시작 부분을 가리키는 두 개의 포인터를 사용하여 다음과 같이 확인합니다.

1. 형식 문자열에서 % 기호를 만나면 % 다음의 문자를 사용하여 날짜/시간 문자열의 해당 부분과 일치하는지 확인합니다. 일치하지 않으면(예: %Y로 10:10:10과 같은 시간 부분을 일치시키려 하거나, % 뒤에 %*처럼 지원되지 않는 문자가 오는 경우) 오류를 반환합니다. 일치하면 다음 문자로 이동하여 파싱합니다.
2. 어느 시점이든 한쪽 문자열에서 공백 문자를 만나면 해당 문자를 건너뛰고 다음 문자를 파싱합니다.
3. 일반 문자를 비교할 때는 두 포인터가 가리키는 문자가 같은지 확인합니다. 다르면 오류를 반환하고, 같으면 다음 문자를 파싱합니다.
4. 날짜 포인터가 문자열 끝에 도달했을 때 날짜/시간 문자열에 날짜 부분만 있으면, 형식 문자열에 시간 부분을 나타내는 문자(예: %H)가 있는지 확인합니다. 있다면 시간 부분을 00:00:00으로 설정합니다.
5. 형식 문자열의 포인터가 끝에 도달하면 일치 여부 확인을 종료합니다.
6. 마지막으로 일치한 시간 부분이 유효한지 확인합니다(예: 월은 [1,12] 범위에 있어야 합니다). 유효하지 않으면 오류를 반환하고, 유효하면 파싱된 날짜와 시간을 반환합니다.

오류 처리:

- 매개변수 중 하나라도 NULL이면 NULL을 반환합니다.
- `<format>`이 빈 문자열이면 NULL을 반환합니다.
- `<datetime_str>`과 `<format>`이 일치하지 않으면 NULL을 반환합니다.

## 예제 {#examples}

```sql
-- Parse using standard format specifiers
SELECT STR_TO_DATE('2025-01-23 12:34:56', '%Y-%m-%d %H:%i:%s') AS result;
+---------------------+
| result              |
+---------------------+
| 2025-01-23 12:34:56 |
+---------------------+

-- Parse using alternative format
SELECT STR_TO_DATE('2025-01-23 12:34:56', 'yyyy-MM-dd HH:mm:ss') AS result;
+---------------------+
| result              |
+---------------------+
| 2025-01-23 12:34:56 |
+---------------------+

-- Date string only (time defaults to 00:00:00)
SELECT STR_TO_DATE('20230713', 'yyyyMMdd') AS result;
+---------------------+
| result              |
+---------------------+
| 2023-07-13 00:00:00 |
+---------------------+

-- Parse string with week number and weekday
SELECT STR_TO_DATE('200442 Monday', '%X%V %W') AS result;
+------------+
| result     |
+------------+
| 2004-10-18 |
+------------+

-- Parse abbreviated month name and 12-hour time
SELECT STR_TO_DATE('Oct 5 2023 3:45:00 PM', '%b %d %Y %h:%i:%s %p') AS result;
+---------------------+
| result              |
+---------------------+
| 2023-10-05 15:45:00 |
+---------------------+

-- Format does not match string (returns NULL)
SELECT STR_TO_DATE('2023/01/01', '%Y-%m-%d') AS result;
+--------+
| result |
+--------+
| NULL   |
+--------+

-- String contains extra characters (automatically ignored)
SELECT STR_TO_DATE('2023-01-01 10:00:00 (GMT)', '%Y-%m-%d %H:%i:%s') AS result;
+---------------------+
| result              |
+---------------------+
| 2023-01-01 10:00:00 |
+---------------------+

-- Parse microseconds (precision preserved)
SELECT STR_TO_DATE('2023-07-13 12:34:56.789', '%Y-%m-%d %H:%i:%s.%f') AS result;
+----------------------------+
| result                     |
+----------------------------+
| 2023-07-13 12:34:56.789000 |
+----------------------------+

-- Any parameter is NULL (returns NULL)
SELECT STR_TO_DATE(NULL, '%Y-%m-%d'), STR_TO_DATE('2023-01-01', NULL) AS result;
+--------------------------------+--------+
| str_to_date(NULL, '%Y-%m-%d')  | result |
+--------------------------------+--------+
| NULL                           | NULL   |
+--------------------------------+--------+

-- Format is an empty string (returns NULL)
SELECT STR_TO_DATE('2023-01-01', '') AS result;
+--------+
| result |
+--------+
| NULL   |
+--------+
```
