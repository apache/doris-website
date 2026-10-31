---
{
    "title": "NUMBERS",
    "language": "zh-CN"
}
---

## `numbers`

## 描述

表函数，生成一张只含有一列的临时表，列名为`number`，如果指定了`const_value`，则所有元素值均为`const_value`，否则为[0,`number`)递增。

## 语法
```sql
numbers(
  "number" = "n"
  <, "const_value" = "x">
  );
```

参数：
- `number`: 行数。
- `const_value` : 常量值。

## 举例
```
mysql> select * from numbers("number" = "5");
+--------+
| number |
+--------+
|      0 |
|      1 |
|      2 |
|      3 |
|      4 |
+--------+
5 rows in set (0.11 sec)

mysql> select * from numbers("number" = "5", "const_value" = "-123");
+--------+
| number |
+--------+
|   -123 |
|   -123 |
|   -123 |
|   -123 |
|   -123 |
+--------+
5 rows in set (0.12 sec)
```

### keywords

    numbers, const_value


