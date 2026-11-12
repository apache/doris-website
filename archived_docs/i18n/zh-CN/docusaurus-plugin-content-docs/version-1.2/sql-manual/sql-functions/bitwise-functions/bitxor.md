---
{
"title": "BITXOR",
"language": "zh-CN"
}
---

## bitxor
## 描述
## 语法

`BITXOR(Integer-type lhs, Integer-type rhs)`

返回两个整数异或运算的结果.

整数范围：TINYINT、SMALLINT、INT、BIGINT、LARGEINT

## 举例

```
mysql> select bitxor(3,5) ans;
+------+
| ans  |
+------+
|    7 |
+------+

mysql> select bitxor(1,7) ans;
+------+
| ans  |
+------+
|    6 |
+------+
```

### keywords

    BITXOR
