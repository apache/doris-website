---
{
"title": "BITAND",
"language": "zh-CN"
}
---

## bitand
## 描述
## 语法

`BITAND(Integer-type lhs, Integer-type rhs)`

返回两个整数与运算的结果.

整数范围：TINYINT、SMALLINT、INT、BIGINT、LARGEINT

## 举例

```
mysql> select bitand(3,5) ans;
+------+
| ans  |
+------+
|    1 |
+------+

mysql> select bitand(4,7) ans;
+------+
| ans  |
+------+
|    4 |
+------+
```

### keywords

    BITAND
