---
{
    "title": "REGR_R2",
    "language": "zh-CN",
    "description": "REGRR2 函数用于返回组内非空值对的线性回归决定系数。"
}
---

## 描述

返回基于组内非空 `(y, x)` 值对计算得到的线性回归决定系数，其中 `x` 为自变量，`y` 为因变量。

## 语法

```sql
REGR_R2(<y>, <x>)
```

## 参数

| 参数 | 说明 |
| -- | -- |
| `<y>` | 因变量，支持类型为 Double。 |
| `<x>` | 自变量，支持类型为 Double。 |

## 返回值

返回 Double 类型的值，表示决定系数（R 平方）。
- 如果 `REGR_COUNT(y, x) < 1`，函数返回 `NULL`。
- 如果 `VAR_POP(x) = 0`，函数返回 `NULL`。
- 如果 `VAR_POP(y) = 0`，函数返回 `1`。
- 否则，函数返回 `POWER(CORR(y, x), 2)`。

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
(2, 5, NULL),
(3, 1, 5),
(3, 1, 7),
(4, 1, 5),
(4, 2, 5);
```

```sql
SELECT id, REGR_R2(y, x) FROM test_regr GROUP BY id ORDER BY id;
```

```text
+------+---------------------+
| id   | REGR_R2(y, x)       |
+------+---------------------+
|    1 |                NULL |
|    2 |                 1.0 |
|    3 |                NULL |
|    4 |                 1.0 |
+------+---------------------+
```

分组 3 展示了 `VAR_POP(x) = 0` 的情况，因此结果为 `NULL`；分组 4 展示了 `VAR_POP(y) = 0` 的情况，因此结果为 `1.0`。
