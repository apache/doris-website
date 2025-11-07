---
{
    "title": "SIGN",
    "language": "zh-CN"
}
---

## sign

## 描述
## 语法

`TINYINT sign(DOUBLE x)`
返回`x`的符号.负数，零或正数分别对应-1，0或1.

## 举例

```
mysql> select sign(3);
+-----------+
| sign(3.0) |
+-----------+
|         1 |
+-----------+
mysql> select sign(0);
+-----------+
| sign(0.0) |
+-----------+
|         0 |
mysql> select sign(-10.0);
+-------------+
| sign(-10.0) |
+-------------+
|          -1 |
+-------------+
1 row in set (0.01 sec)
```

### keywords
	SIGN
