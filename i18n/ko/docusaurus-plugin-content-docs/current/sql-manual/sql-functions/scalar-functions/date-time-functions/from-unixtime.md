---
{
    "title": "FROM_UNIXTIME",
    "language": "ko",
    "description": "FROMUNIXTIME 함수는 Unix 타임스탬프(초 단위)를 지정된 형식의 날짜 및 시간 문자열 또는 VARCHAR 타입 값으로 변환하는 데 사용됩니다."
}
---

## 설명 {#description}


FROM_UNIXTIME 함수는 Unix 타임스탬프(초 단위)를 지정된 형식의 날짜 및 시간 문자열 또는 VARCHAR 타입 값으로 변환하는 데 사용됩니다. Unix 타임스탬프의 기준 시각은 1970-01-01 00:00:00 UTC이며, 이 함수는 입력 타임스탬프와 형식 문자열에 따라 해당 날짜 및 시간 표현을 생성합니다. `%f`는 마이크로초를 출력하며 값을 소수점 이하 여섯 자리로 반올림합니다. `%n`은 소수점 이하 최대 아홉 자리까지 유지하여 나노초 단위로 출력합니다.

이 함수는 MySQL의 [from_unixtime 함수](https://dev.mysql.com/doc/refman/8.4/en/date-and-time-functions.html#function_from-unixtime)와 일관되게 동작합니다.

## 구문 {#syntax}

```sql
FROM_UNIXTIME(<unix_timestamp> [, <string_format>])
```

## 매개변수 {#parameters}

| 매개변수 | 설명 |
| -- | -- |
| `<unix_timestamp>` | BIGINT 또는 DECIMAL 타입의 입력 Unix 타임스탬프로, 1970-01-01 00:00:00 UTC부터 경과한 초를 나타냅니다. 소수 초를 포함할 수 있습니다. |
| `<string_format>` | 형식 문자열로, varchar 및 string 타입을 지원하며 기본값은 %Y-%m-%d %H:%i:%s입니다. 구체적인 형식은 [date-format](./date-format)을 참조하세요. |

## 반환값 {#return-value}

지정된 형식의 날짜를 VARCHAR 타입으로 반환하며, 반환값은 UTC 시간대의 Unix 타임스탬프를 현재 시간대의 시간으로 변환한 결과입니다. 입력에 소수 부분이 포함되어 있으면 결과에도 초 미만 단위의 정밀도가 포함됩니다(예: `2007-12-01 00:30:19.500000`).
- 현재 지원되는 unix_timestamp 범위는 [0, 253402271999.999999]이며, 이는 1970-01-01 00:00:00부터 9999-12-31 23:59:59.999999까지의 날짜에 해당합니다. 이 범위를 벗어나는 unix_timestamp는 오류를 반환합니다.
- string_format이 유효하지 않으면 예상과 다른 문자열을 반환합니다.
- `%f`와 `%n`은 서로 다른 반올림 정밀도를 사용하므로 하나의 형식에 둘 다 포함할 수 없습니다.
- 매개변수 중 하나라도 NULL이면 NULL을 반환합니다.
- 형식의 길이가 128자를 초과하면 오류를 반환합니다.

## 예제 {#examples}

```sql

----Since the current timezone is East 8th zone, the returned time is 8 hours ahead of UTC
select from_unixtime(0);
+---------------------+
| from_unixtime(0)    |
+---------------------+
| 1970-01-01 08:00:00 |
+---------------------+

---Default format %Y-%m-%d %H:%i:%s return
mysql> select from_unixtime(1196440219);
+---------------------------+
| from_unixtime(1196440219) |
+---------------------------+
| 2007-12-01 00:30:19       |
+---------------------------+

---Specify yyyy-MM-dd HH:mm:ss format return
mysql> select from_unixtime(1196440219, 'yyyy-MM-dd HH:mm:ss');
+--------------------------------------------------+
| from_unixtime(1196440219, 'yyyy-MM-dd HH:mm:ss') |
+--------------------------------------------------+
| 2007-12-01 00:30:19                              |
+--------------------------------------------------+


---Specify %Y-%m-%d date-only format return
mysql> select from_unixtime(1196440219, '%Y-%m-%d');
+-----------------------------------------+
| from_unixtime(1196440219, '%Y-%m-%d') |
+-----------------------------------------+
| 2007-12-01                              |
+-----------------------------------------+

---Specify %Y-%m-%d %H:%i:%s format return
mysql> select from_unixtime(1196440219, '%Y-%m-%d %H:%i:%s');
+--------------------------------------------------+
| from_unixtime(1196440219, '%Y-%m-%d %H:%i:%s') |
+--------------------------------------------------+
| 2007-12-01 00:30:19                              |
+--------------------------------------------------+

---Exceeds maximum range, returns error
select from_unixtime(253402281999);
ERROR 1105 (HY000): errCode = 2, detailMessage = (10.16.10.3)[INVALID_ARGUMENT]Operation from_unixtime_new of 253402281999, yyyy-MM-dd HH:mm:ss is invalid

---result over max length
select from_unixtime(32536799,repeat('a',129));
ERROR 1105 (HY000): errCode = 2, detailMessage = (10.16.10.3)[INVALID_ARGUMENT]Operation from_unixtime_new of invalid or oversized format is invalid

---string-format does not reference any time values
mysql> select from_unixtime(32536799,"gdaskpdp");
+------------------------------------+
| from_unixtime(32536799,"gdaskpdp") |
+------------------------------------+
| gdaskpdp                           |
+------------------------------------+

---Fractional timestamp input, result includes sub-second precision
mysql> select from_unixtime(1196440219.5);
+-----------------------------+
| from_unixtime(1196440219.5) |
+-----------------------------+
| 2007-12-01 00:30:19.500000  |
+-----------------------------+

---Fractional timestamp with microsecond precision
mysql> select from_unixtime(1196440219.123456);
+----------------------------------+
| from_unixtime(1196440219.123456) |
+----------------------------------+
| 2007-12-01 00:30:19.123456       |
+----------------------------------+

---Use %f format specifier to display microseconds explicitly
mysql> select from_unixtime(1196440219.123456, '%Y-%m-%d %H:%i:%s.%f');
+----------------------------------------------------------+
| from_unixtime(1196440219.123456, '%Y-%m-%d %H:%i:%s.%f') |
+----------------------------------------------------------+
| 2007-12-01 00:30:19.123456                               |
+----------------------------------------------------------+

---Use %n to preserve nanoseconds
mysql> select from_unixtime(1196440219.123456789, '%Y-%m-%d %H:%i:%s.%n');
+-------------------------------------------------------------+
| from_unixtime(1196440219.123456789, '%Y-%m-%d %H:%i:%s.%n') |
+-------------------------------------------------------------+
| 2007-12-01 00:30:19.123456789                               |
+-------------------------------------------------------------+

---Input is NULL, returns NULL
mysql> select from_unixtime(NULL);
+---------------------+
| from_unixtime(NULL) |
+---------------------+
| NULL                |
+---------------------+

```
