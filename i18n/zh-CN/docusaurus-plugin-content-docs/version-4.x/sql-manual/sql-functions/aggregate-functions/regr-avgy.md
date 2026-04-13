---
{
    "title": "REGR_AVGY",
    "language": "zh-CN",
    "description": "REGRAVGY 函数用于返回组内非空值对中因变量 (y) 的平均值。"
}
---

## 描述

返回组内非空 `(y, x)` 值对中因变量 `y` 的平均值，其中 `x` 为自变量，`y` 为因变量。

:::info
该函数从 Apache Doris 4.1.1 版本开始支持。
:::

## 语法

```sql
REGR_AVGY(<y>, <x>)
```

## 参数

| 参数 | 说明 |
| -- | -- |
| `<y>` | 因变量，支持类型为 Double。 |
| `<x>` | 自变量，支持类型为 Double。 |

## 返回值

返回 Double 类型的值，表示非空 `(y, x)` 值对中 `y` 的平均值。
如果没有行，或者只有包含空值的行，函数返回 `NULL`。

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
SELECT id, REGR_AVGY(y, x) FROM test_regr GROUP BY id ORDER BY id;
```

```text
+------+------------------+
| id   | REGR_AVGY(y, x) |
+------+------------------+
|    1 |             NULL |
|    2 |              6.0 |
+------+------------------+
```
