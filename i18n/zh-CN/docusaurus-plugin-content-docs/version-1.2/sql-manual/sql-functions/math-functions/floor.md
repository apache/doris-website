---
{
    "title": "FLOOR",
    "language": "zh-CN"
}
---

## floor

## 描述
## 语法

`BIGINT floor(DOUBLE x)`
返回小于或等于`x`的最大整数值.

:::tip
该函数的另一个别名为 `dfloor`。
:::

## 举例

```
mysql> select floor(1);
+------------+
| floor(1.0) |
+------------+
|          1 |
+------------+
mysql> select floor(2.4);
+------------+
| floor(2.4) |
+------------+
|          2 |
+------------+
mysql> select floor(-10.3);
+--------------+
| floor(-10.3) |
+--------------+
|          -11 |
+--------------+
```

### keywords
	FLOOR, DFLOOR
