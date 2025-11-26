---
{
    "title": "GET_FORMAT",
    "language": "en"
}
---

## Description

Returns a specific format string.

This function behaves the same as the MySQL [GET_FORMAT function](https://dev.mysql.com/doc/refman/8.4/en/date-and-time-functions.html#function_get-format).


## Syntax

```sql
GET_FORMAT({DATE|DATETIME|TIME}, {'EUR'|'USA'|'JIS'|'ISO'|'INTERNAL'})
```

## Return Value

Returns a format string. The results for different arguments are shown in the table below:
| Function Call                        | Result               |
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

If the second argument is not one of `'USA', 'JIS', 'ISO', 'EUR', 'INTERNAL'` or is NULL, the function returns NULL.

## Examples
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