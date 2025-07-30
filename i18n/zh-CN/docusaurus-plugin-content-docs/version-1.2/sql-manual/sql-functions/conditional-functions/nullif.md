---
{
    "title": "NULLIF",
    "language": "zh-CN"
}
---

## nullif
## 描述
## 语法

`nullif(expr1, expr2)`


如果两个参数相等，则返回NULL。否则返回第一个参数的值。它和以下的 `CASE WHEN` 效果一样

```
CASE
     WHEN expr1 = expr2 THEN NULL
     ELSE expr1
END
```

## 举例

```
mysql> select nullif(1,1);
+--------------+
| nullif(1, 1) |
+--------------+
|         NULL |
+--------------+

mysql> select nullif(1,0);
+--------------+
| nullif(1, 0) |
+--------------+
|            1 |
+--------------+
```
### keywords
NULLIF
