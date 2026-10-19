---
{
    "title": "GET_FORMAT",
    "language": "ko",
    "description": "지정된 형식 문자열을 반환합니다."
}
---

## 설명 {#description}

지정된 형식 문자열을 반환합니다.

이 함수는 MySQL의 [GET_FORMAT 함수](https://dev.mysql.com/doc/refman/8.4/en/date-and-time-functions.html#function_get-format)와 동일하게 동작합니다.


## 구문 {#syntax}

```sql
GET_FORMAT({DATE|DATETIME|TIME}, {'EUR'|'USA'|'JIS'|'ISO'|'INTERNAL'})
```

## 반환 값 {#return-value}

형식 문자열을 반환합니다. 인수별 결과는 아래 테이블과 같습니다:
| 함수 호출                        | 결과               |
| ------------------------------------ | -------------------- |
| GET_FORMAT(DATE,'USA')               | '%m.%d.%Y'           |
| GET_FORMAT(DATE,'JIS')               | '%Y-%m-%d'           |
| GET_FORMAT(DATE,'ISO')               | '%Y-%m-%d'           |
| GET_FORMAT(DATE,'EUR')               | '%d.%m.%Y'           |
| GET_FORMAT(DATE,'INTERNAL')          | '%Y%m%d'             |
| GET_FORMAT(DATETIME,'USA')           | '%Y-%m-%d %H.%i.%s'  |
| GET_FORMAT(DATETIME,'JIS')           | '%Y-%m-%d %H:%i:%s'  |
| GET_FORMAT(DATETIME,'ISO')           | '%Y-%m-%d %H:%i:%s'  |
| GET_FORMAT(DATETIME,'EUR')           | '%Y-%m-%d %H.%i.%s'  |
| GET_FORMAT(DATETIME,'INTERNAL')      | '%Y%m%d%H%i%s'       |
| GET_FORMAT(TIME,'USA')               | '%h:%i:%s %p'        |
| GET_FORMAT(TIME,'JIS')               | '%H:%i:%s'           |
| GET_FORMAT(TIME,'ISO')               | '%H:%i:%s'           |
| GET_FORMAT(TIME,'EUR')               | '%H.%i.%s'           |
| GET_FORMAT(TIME,'INTERNAL')          | '%H%i%s'             |

두 번째 인수가 `'USA', 'JIS', 'ISO', 'EUR', 'INTERNAL'` 중 하나가 아니거나 NULL이면 함수는 NULL을 반환합니다.

## 예제 {#examples}
<!-- setup-sql
CREATE TABLE get_format_test (id INT, lc VARCHAR(20)) DISTRIBUTED BY HASH(id) BUCKETS 1 PROPERTIES("replication_num"="1");
INSERT INTO get_format_test VALUES (1,'USA'),(2,'JIS'),(3,'ISO'),(4,'EUR'),(5,'INTERNAL'),(6,'Doris');
-->

```sql
SELECT * FROM get_format_test
```
```text
+------+----------+
| id   | lc       |
+------+----------+
|    1 | USA      |
|    2 | JIS      |
|    3 | ISO      |
|    4 | EUR      |
|    5 | INTERNAL |
|    6 | Doris    |
+------+----------+
```

```sql
SELECT lc, GET_FORMAT(DATE, lc) FROM get_format_test;
```
```text
+----------+----------------------+
| lc       | GET_FORMAT(DATE, lc) |
+----------+----------------------+
| USA      | %m.%d.%Y             |
| JIS      | %Y-%m-%d             |
| ISO      | %Y-%m-%d             |
| EUR      | %d.%m.%Y             |
| INTERNAL | %Y%m%d               |
| Doris    | NULL                 |
+----------+----------------------+
```

```sql
SELECT lc, GET_FORMAT(DATETIME, lc) FROM get_format_test;
```
```text
+----------+--------------------------+
| lc       | GET_FORMAT(DATETIME, lc) |
+----------+--------------------------+
| USA      | %Y-%m-%d %H.%i.%s        |
| JIS      | %Y-%m-%d %H:%i:%s        |
| ISO      | %Y-%m-%d %H:%i:%s        |
| EUR      | %Y-%m-%d %H.%i.%s        |
| INTERNAL | %Y%m%d%H%i%s             |
| Doris    | NULL                     |
+----------+--------------------------+
```

```sql
SELECT lc, GET_FORMAT(TIME, lc) FROM get_format_test;
```
```text
+----------+----------------------+
| lc       | GET_FORMAT(TIME, lc) |
+----------+----------------------+
| USA      | %h:%i:%s %p          |
| JIS      | %H:%i:%s             |
| ISO      | %H:%i:%s             |
| EUR      | %H.%i.%s             |
| INTERNAL | %H%i%s               |
| Doris    | NULL                 |
+----------+----------------------+
```

```sql
mysql> SELECT GET_FROMAT(ILLEGAL, 'USA');
ERROR 1105 (HY000): errCode = 2, detailMessage = 
rule primaryExpression failed predicate: { $functionName.text.equalsIgnoreCase("get_format") }?(line 1, pos 17)
```
