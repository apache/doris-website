---
{
    "title": "REGR_SLOPE",
    "language": "zh-CN",
    "description": "REGRSLOPE 函数用于计算线性回归方程中的斜率。它返回组内非空值对的单变量线性回归线的斜率。"
}
---

## 描述

返回基于组内非空 `(y, x)` 值对计算得到的线性回归线斜率，其中 `x` 为自变量，`y` 为因变量。它等价于 `COVAR_POP(y, x) / VAR_POP(x)`。

## 语法

```sql
REGR_SLOPE(<y>, <x>)
```

## 参数

| 参数 | 说明 |
| -- | -- |
| `<y>` | 因变量，支持类型为 Double。 |
| `<x>` | 自变量，支持类型为 Double。 |

## 返回值

返回 Double 类型的值，表示线性回归线的斜率。
如果组内没有行，或者表达式都为 `NULL`，函数返回 `NULL`。

## 举例

```sql
CREATE TABLE test_regr (
  `id` int,
  `x` double,
  `y` double
) DUPLICATE KEY (`id`)
DISTRIBUTED BY HASH(`id`) BUCKETS AUTO
PROPERTIES (
  "replication_allocation" = "tag.location.default: 1"
);

INSERT INTO test_regr VALUES
(1, 0, NULL),
(2, 1, 3),
(2, 2, 5),
(2, 3, 7),
(2, 4, 9),
(2, 5, NULL);
```

```sql
SELECT id, REGR_SLOPE(y, x) FROM test_regr GROUP BY id ORDER BY id;
```

```text
+------+--------------------+
| id   | REGR_SLOPE(y, x)   |
+------+--------------------+
|    1 |               NULL |
|    2 |                2.0 |
+------+--------------------+
```
