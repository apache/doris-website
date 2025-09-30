---
{
    "title": "CURTIME,CURRENT_TIME",
    "language": "zh-CN"
}
---

## 描述

获取当前时间并返回为 TIME 类型。

## 别名

- CURRENT_TIME

## 语法

```sql
CURTIME()
```

## 返回值

返回当前时间，类型为 TIME。

## 示例

```sql
mysql> select curtime();
+----------------+
| curtime()      |
+----------------+
| 15:25:47       |
+----------------+
```