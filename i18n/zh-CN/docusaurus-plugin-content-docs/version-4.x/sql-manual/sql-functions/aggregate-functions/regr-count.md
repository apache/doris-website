---
{
    "title": "REGR_COUNT",
    "language": "zh-CN",
    "description": "REGRCOUNT 函数用于返回组内非空值对的数量。"
}
---

## 描述

返回组内非空 `(y, x)` 值对的数量，其中 `x` 为自变量，`y` 为因变量。如果不存在有效的非空值对，函数返回 `0`。

## 语法

```sql
REGR_COUNT(<y>, <x>)
```

## 参数

| 参数 | 说明 |
| -- | -- |
| `<y>` | 因变量，支持类型为 Double。 |
| `<x>` | 自变量，支持类型为 Double。 |

## 返回值

返回 BIGINT 类型的值，表示非空 `(y, x)` 值对的数量。
如果组内没有行，或者不存在有效的非空 `(y, x)` 值对，函数返回 `0`。

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
SELECT id, REGR_COUNT(y, x) FROM test_regr GROUP BY id ORDER BY id;
```

```text
+------+---------------------+
| id   | REGR_COUNT(y, x)    |
+------+---------------------+
|    1 |                   0 |
|    2 |                   4 |
+------+---------------------+
```

REGR_COUNT 仅统计非空 `(y, x)` 值对，因此分组 1 返回 `0`。
