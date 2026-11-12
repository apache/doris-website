---
{
    "title": "SPACE",
    "language": "zh-CN"
}
---

## space
## 描述
## 语法

`VARCHAR space(Int num)`

返回由num个空格组成的字符串。

## 举例

```
mysql> select length(space(10));
+-------------------+
| length(space(10)) |
+-------------------+
|                10 |
+-------------------+
1 row in set (0.01 sec)

mysql> select length(space(-10));
+--------------------+
| length(space(-10)) |
+--------------------+
|                  0 |
+--------------------+
1 row in set (0.02 sec)
```
### keywords
    space
