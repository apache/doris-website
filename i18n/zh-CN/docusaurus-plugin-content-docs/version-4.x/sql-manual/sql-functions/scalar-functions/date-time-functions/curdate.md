---
{
    "title": "CURDATE,CURRENT_DATE",
    "language": "zh-CN",
    "description": "获取当前的日期，以 DATE 类型返回。"
}
---

## 描述

获取当前的日期，以 DATE 类型返回。

该函数与 mysql 中的 [curdate 函数](https://dev.mysql.com/doc/refman/8.4/en/date-and-time-functions.html#function_adddate) 行为一致

## 别名

- current_date

## 语法

```sql
CURDATE()
```

## 返回值

当前的日期，返回值为 date 类型。

## 示例 

```sql
---获取当前的日期
SELECT CURDATE();

+------------+
| CURDATE()  |
+------------+
| 2019-12-20 |
+------------+
```
