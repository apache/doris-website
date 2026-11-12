---
{
    "title": "CURDATE,CURRENT_DATE",
    "language": "zh-CN"
}
---

## curdate,current_date
## 描述
## 语法

`DATE CURDATE()`

获取当前的日期，以DATE类型返回

## 举例s

```
mysql> SELECT CURDATE();
+------------+
| CURDATE()  |
+------------+
| 2019-12-20 |
+------------+

mysql> SELECT CURDATE() + 0;
+---------------+
| CURDATE() + 0 |
+---------------+
|      20191220 |
+---------------+
```

### keywords

    CURDATE,CURRENT_DATE
