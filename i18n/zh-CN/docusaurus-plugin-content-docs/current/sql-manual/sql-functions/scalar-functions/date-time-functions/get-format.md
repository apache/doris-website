---
{
    "title": "GET_FORMAT",
    "language": "zh-CN",
    "description": "返回特定的格式字符串"
}
---

## 描述

返回特定的格式字符串

该函数与 mysql 中的 [GET_FORMAT 函数](https://dev.mysql.com/doc/refman/8.4/en/date-and-time-functions.html#function_get-format) 行为一致


## 语法

```sql
GET_FORMAT({DATE|DATETIME|TIME}, {'EUR'|'USA'|'JIS'|'ISO'|'INTERNAL'})
```

## 返回值

返回一个格式字符串，不同参数最终的结果值如下表所示：
| 函数调用                        | 结果                |
| ------------------------------- | ------------------- |
| GET_FORMAT(DATE,'USA')          | '%m.%d.%Y'          |
| GET_FORMAT(DATE,'JIS')          | '%Y-%m-%d'          |
| GET_FORMAT(DATE,'ISO')          | '%Y-%m-%d'          |
| GET_FORMAT(DATE,'EUR')          | '%d.%m.%Y'          |
| GET_FORMAT(DATE,'INTERNAL')     | '%Y%m%d'            |
| GET_FORMAT(DATETIME,'USA')      | '%Y-%m-%d %H.%i.%s' |
| GET_FORMAT(DATETIME,'JIS')      | '%Y-%m-%d %H:%i:%s' |
| GET_FORMAT(DATETIME,'ISO')      | '%Y-%m-%d %H:%i:%s' |
| GET_FORMAT(DATETIME,'EUR')      | '%Y-%m-%d %H.%i.%s' |
| GET_FORMAT(DATETIME,'INTERNAL') | '%Y%m%d%H%i%s'      |
| GET_FORMAT(TIME,'USA')          | '%h:%i:%s %p'       |
| GET_FORMAT(TIME,'JIS')          | '%H:%i:%s'          |
| GET_FORMAT(TIME,'ISO')          | '%H:%i:%s'          |
| GET_FORMAT(TIME,'EUR')          | '%H.%i.%s'          |
| GET_FORMAT(TIME,'INTERNAL')     | '%H%i%s'            |

当第二个参数不为 `'USA', 'JIS', 'ISO', 'EUR', 'INTERNAL'` 之一或者为 NULL 时返回 NULL

## 举例
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