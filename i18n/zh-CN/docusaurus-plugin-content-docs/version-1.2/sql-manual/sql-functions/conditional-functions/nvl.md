---
{
    "title": "NVL",
    "language": "zh-CN"
}
---

## nvl

nvl

## 描述
## 语法

`nvl(expr1, expr2)`


如果 expr1 的值不为 NULL 则返回 expr1，否则返回 expr2

## 举例

```
mysql> select nvl(1,0);
+--------------+
| nvl(1, 0) |
+--------------+
|            1 |
+--------------+

mysql> select nvl(null,10);
+------------------+
| nvl(NULL, 10) |
+------------------+
|               10 |
+------------------+
```
### keywords
NVL
