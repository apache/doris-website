---
{
"title": "BITNOT",
"language": "zh-CN"
}
---

## bitnot
## 描述
## 语法

`BITNOT(Integer-type value)`

返回一个整数取反运算的结果.

整数范围：TINYINT、SMALLINT、INT、BIGINT、LARGEINT

## 举例

```
mysql> select bitnot(7) ans;
+------+
| ans  |
+------+
|   -8 |
+------+

mysql> select bitxor(-127) ans;
+------+
| ans  |
+------+
|  126 |
+------+
```

### keywords

    BITNOT
