---
{
    "title": "CURTIME,CURRENT_TIME",
    "language": "zh-CN"
}
---

## 描述

获取当前时间并返回为 TIME 类型。

## 别名

- CURTIME
- CURRENT_TIME

## 语法

```sql
CURTIME()
```

## 返回值

返回当前时间。

## 示例

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