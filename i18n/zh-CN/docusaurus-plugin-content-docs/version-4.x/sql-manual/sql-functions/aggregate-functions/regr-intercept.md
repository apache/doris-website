---
{
    "title": "REGR_INTERCEPT",
    "language": "zh-CN",
    "description": "REGRINTERCEPT 函数用于计算线性回归方程中的截距（y 轴截距）。它返回组内非空值对的单变量线性回归线的截距。对于非空值对，使用以下公式计算："
}
---

## 描述

`REGR_INTERCEPT` 函数用于计算线性回归方程中的截距（y 轴截距）。它返回组内非空值对的单变量线性回归线的截距。对于非空值对，使用以下公式计算：

`AVG(y) - REGR_SLOPE(y, x) * AVG(x)`

其中 `x` 是自变量，`y` 是因变量。

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
如果没有行，或者只有包含空值的行，函数返回 NULL。

## 举例

```sql
-- setup
CREATE TABLE test_regr_intercept (
  `id` int,
  `x` int,
  `y` int
) DUPLICATE KEY (`id`)
DISTRIBUTED BY HASH(`id`) BUCKETS AUTO
PROPERTIES (
  "replication_allocation" = "tag.location.default: 1"
);

-- 插入示例数据
INSERT INTO test_regr_intercept VALUES
(1, 18, 13),
(2, 14, 27),
(3, 12, 2),
(4, 5, 6),
(5, 10, 20);
```

```sql
SELECT REGR_INTERCEPT(y, x) FROM test_regr_intercept;
```

计算 x 和 y 的线性回归截距。

```text
+-------------------------+
| regr_intercept(y, x)    |
+-------------------------+
|      5.512931034482759  | 
+-------------------------+
```

```sql
SELECT REGR_INTERCEPT(y, x) FROM test_regr_intercept where x>100;
```

组内没有数据时，返回 NULL 。

```text
+----------------------+
| REGR_INTERCEPT(y, x) |
+----------------------+
|                 NULL |
+----------------------+
```
