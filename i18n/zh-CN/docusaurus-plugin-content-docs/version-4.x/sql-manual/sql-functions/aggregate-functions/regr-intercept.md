---
{
    "title": "REGR_INTERCEPT",
    "language": "zh-CN",
    "description": "REGRINTERCEPT 函数用于计算线性回归方程中的截距（y 轴截距）。它返回组内非空值对的单变量线性回归线的截距。对于非空值对，使用以下公式计算："
}
---

## 描述

返回基于组内非空 `(y, x)` 值对计算得到的线性回归线截距，其中 `x` 为自变量，`y` 为因变量。它等价于 `AVG(y) - REGR_SLOPE(y, x) * AVG(x)`。

## 语法

```sql
REGR_INTERCEPT(<y>, <x>)
```

## 参数

| 参数 | 说明 |
| -- | -- |
| `<y>` | 因变量，支持类型为 Double。 |
| `<x>` | 自变量，支持类型为 Double。 |

## 返回值

返回 Double 类型的值，表示线性回归线与 `y` 轴的交点。
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
SELECT id, REGR_INTERCEPT(y, x) FROM test_regr GROUP BY id ORDER BY id;
```

```text
+------+----------------------+
| id   | REGR_INTERCEPT(y, x) |
+------+----------------------+
|    1 |                 NULL |
|    2 |                  1.0 |
+------+----------------------+
```
