---
{
    "title": "KURT,KURT_POP,KURTOSIS",
    "language": "zh-CN"
}
---

## 描述

KURTOSIS 函数用于计算数据的[峰度值](https://en.wikipedia.org/wiki/Kurtosis)。此函数使用的公式为 第四阶中心矩 / (方差的平方) - 3。

## 别名

KURT_POP,KURTOSIS

## 语法

```sql
KURTOSIS(<expr>)
```

## 参数说明

| 参数 | 说明 |
| -- | -- |
| `<expr>` | 需要获取值的表达式 |

## 返回值

返回 DOUBLE 类型的值。特殊情况：

- 当方差为零时，返回 NULL

## 举例
```sql
select * from statistic_test;
```

```text
+-----+------+------+
| tag | val1 | val2 |
+-----+------+------+
|   1 |  -10 |   -10|
|   2 |  -20 |  NULL|
|   3 |  100 |  NULL|
|   4 |  100 |  NULL|
|   5 | 1000 |  1000|
+-----+------+------+
```

```sql
select kurt(val1), kurt(val2) from statistic_test;
```

```text
+-------------------+--------------------+
| kurt(val1)        | kurt(val2)         |
+-------------------+--------------------+
| 0.162124583734851 | -1.3330994719286338 |
+-------------------+--------------------+
```

```sql
// 每组只有一行数据，结果为 NULL
select kurt(val1), kurt(val2) from statistic_test group by tag;
```

```text
+------------+------------+
| kurt(val1) | kurt(val2) |
+------------+------------+
|       NULL |       NULL |
|       NULL |       NULL |
|       NULL |       NULL |
|       NULL |       NULL |
|       NULL |       NULL |
+------------+------------+
```

