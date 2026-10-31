---
{
    "title": "IFNULL",
    "language": "zh-CN"
}
---

## ifnull
## 描述
## 语法

`ifnull(expr1, expr2)`


如果 expr1 的值不为 NULL 则返回 expr1，否则返回 expr2

## 举例

```
mysql> select ifnull(1,0);
+--------------+
| ifnull(1, 0) |
+--------------+
|            1 |
+--------------+

mysql> select ifnull(null,10);
+------------------+
| ifnull(NULL, 10) |
+------------------+
|               10 |
+------------------+
```
### keywords
IFNULL
