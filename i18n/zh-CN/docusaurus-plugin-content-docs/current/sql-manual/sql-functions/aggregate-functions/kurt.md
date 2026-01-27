---
{
    "title": "KURT,KURT_POP,KURTOSIS",
    "language": "zh-CN",
    "description": "KURTOSIS 函数用于计算数据的峰度值。此函数使用的公式为 第四阶中心矩 / (方差的平方) - 3。"
}
---

## 描述

KURTOSIS 函数用于计算数据的[峰度值](https://en.wikipedia.org/wiki/Kurtosis)。此函数使用的公式为 第四阶中心矩 / (方差的平方) - 3。

## 别名

KURT_POP,KURTOSIS

## 语法

```sql
KURTOSIS(<expr>)
KURT_POP(<expr>)
KURT(<expr>)
```

## 参数说明

| 参数 | 说明 |
| -- | -- |
| `<expr>` | 需要获取值的表达式，支持类型为 Double 。 |

## 返回值

返回 DOUBLE 类型的值。
当方差为零时，返回 NULL 。
组内没有合法数据时，返回 NULL 。

## 举例

```sql
-- setup
create table statistic_test(
    tag int,
    val1 double,
    val2 double
) distributed by hash(tag) buckets 1
properties ("replication_num"="1");
insert into statistic_test values
    (1, -10, -10),
    (2, -20, null),
    (3, 100, null),
    (4, 100, null),
    (5, 1000, 1000);
```

```sql
select kurt(val1), kurt(val2) from statistic_test;
```

```text
+---------------------+------------+
| kurt(val1)          | kurt(val2) |
+---------------------+------------+
| 0.16212458373485106 |         -2 |
+---------------------+------------+
```

```sql
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

