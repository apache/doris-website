---
{
    "title": "MOD",
    "language": "zh-CN"
}
---

## mod

## 描述
## 语法

`mod(col_a, col_b)`  

`column`支持以下类型：`TINYINT` `SMALLINT` `INT` `BIGINT` `LARGEINT` `FLOAT` `DOUBLE` `DECIMAL`

求a / b的余数。浮点类型请使用fmod函数。

## 举例

```
mysql> select mod(10, 3);
+------------+
| mod(10, 3) |
+------------+
|          1 |
+------------+

mysql> select fmod(10.1, 3.2);
+-----------------+
| fmod(10.1, 3.2) |
+-----------------+
|      0.50000024 |
+-----------------+
```

### keywords
	MOD，FMOD
