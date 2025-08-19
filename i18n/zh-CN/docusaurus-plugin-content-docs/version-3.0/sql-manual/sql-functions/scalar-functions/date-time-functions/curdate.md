---
{
    "title": "CURDATE,CURRENT_DATE",
    "language": "zh-CN"
}
---

## 描述

获取当前的日期，以 DATE 类型返回。

## 别名

- curdate
- current_date

## 语法

```sql
CURDATE()
```

## 返回值

当前的日期,返回值为 date 类型。

## 示例 

```sql
---获取当前的日期
SELECT CURDATE();
```

```text
+------------+
| CURDATE()  |
+------------+
| 2019-12-20 |
+------------+
```
