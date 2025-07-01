---
{
    "title": "CEIL",
    "language": "zh-CN"
}
---

## ceil

## 描述
## 语法

`BIGINT ceil(DOUBLE x)`
返回大于或等于`x`的最小整数值.

:::tip
该函数的其他别名为 `dceil` 和 `ceiling`。
:::

## 举例

```
mysql> select ceil(1);
+-----------+
| ceil(1.0) |
+-----------+
|         1 |
+-----------+
mysql> select ceil(2.4);
+-----------+
| ceil(2.4) |
+-----------+
|         3 |
+-----------+
mysql> select ceil(-10.3);
+-------------+
| ceil(-10.3) |
+-------------+
|         -10 |
+-------------+
```

### keywords
	CEIL, DCEIL, CEILING
