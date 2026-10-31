---
{
    "title": "CURTIME,CURRENT_TIME",
    "language": "zh-CN",
    "description": "获得当前的时间，以 TIME 类型返回"
}
---

## 描述

获得当前的时间，以 TIME 类型返回

## 别名

- CURTIME
- CURRENT_TIME

## 语法

```sql
CURTIME()
```

## 返回值

返回当前的时间

## 举例

```sql
mysql> select current_time();
```

```text
+----------------+
| current_time() |
+----------------+
| 15:25:47       |
+----------------+
```