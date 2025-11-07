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

当前的日期。

## 示例 

```sql
SELECT CURDATE();
```

```text
+------------+
| CURDATE()  |
+------------+
| 2019-12-20 |
+------------+
```

```sql
SELECT CURDATE() + 0;
```

```text
+---------------+
| CURDATE() + 0 |
+---------------+
|      20191220 |
+---------------+
```