---
{
    "title": "SUM_MAP",
    "language": "zh-CN",
    "description": "SUM_MAP 函数按键聚合 MAP 值，并返回每个键对应值的总和。"
}
---

## 描述

SUM_MAP 函数按键聚合 MAP 值，返回一个 MAP，其中每个键对应的值为该键下所有非 NULL 值的总和。

## 使用说明

返回 MAP 中条目的顺序不保证稳定。如果需要稳定的输出顺序，请使用 `map_keys`、`map_values`、`array_sort` 和 `array_sortby` 对结果进行排序。NULL key 会作为普通 key 参与聚合；所有 NULL key 会归并到同一个结果条目中。

## 语法

```sql
SUM_MAP(<map_expr>)
```

## 参数

| 参数 | 描述 |
| --- | --- |
| `<map_expr>` | MAP 表达式。MAP 的 value 类型必须为数值类型。 |

## 返回值

返回一个 MAP，key 类型与 `<map_expr>` 相同。对于整数类、Boolean 和 NULL value 类型，返回的 value 类型为 BIGINT；对于 Float 和 Double value 类型，返回的 value 类型为 DOUBLE；对于 Decimal value 类型，返回的 value 类型为最大支持精度且 scale 不变的 Decimal；对于 LargeInt value 类型，返回的 value 类型为 LargeInt。

如果组内没有有效输入行，返回空 MAP。如果某个 key 存在但该 key 下所有 value 均为 NULL，则该 key 对应的返回值为 NULL。

## 示例

```sql
-- setup
CREATE TABLE map_agg_example (
    id INT,
    m MAP<INT, INT>,
    md MAP<STRING, DECIMAL(10, 2)>
) DISTRIBUTED BY HASH(id) BUCKETS 1
PROPERTIES ("replication_num" = "1");

INSERT INTO map_agg_example VALUES
    (1, MAP(1, 10, 2, 20), MAP('a', 1.20, 'b', 2.30)),
    (1, MAP(2, 5, 3, 30), MAP('b', 3.70, 'c', 4.00)),
    (2, MAP(1, 7, 4, NULL), MAP('a', NULL, 'c', 5.50)),
    (2, CAST(MAP() AS MAP<INT, INT>), CAST(MAP() AS MAP<STRING, DECIMAL(10, 2)>));
```

```text
Query OK
```

```sql
SELECT id,
       array_sort(map_keys(result)) AS keys,
       array_sortby(map_values(result), map_keys(result)) AS values
FROM (
    SELECT id, SUM_MAP(m) AS result
    FROM map_agg_example
    GROUP BY id
) t
ORDER BY id;
```

```text
+------+-----------+--------------+
| id   | keys      | values       |
+------+-----------+--------------+
|    1 | [1, 2, 3] | [10, 25, 30] |
|    2 | [1, 4]    | [7, null]    |
+------+-----------+--------------+
```

```sql
SELECT array_sort(map_keys(result)) AS keys,
       array_sortby(map_values(result), map_keys(result)) AS values
FROM (
    SELECT SUM_MAP(md) AS result
    FROM map_agg_example
) t;
```

```text
+-----------------+--------------------+
| keys            | values             |
+-----------------+--------------------+
| ["a", "b", "c"] | [1.20, 6.00, 9.50] |
+-----------------+--------------------+
```

```sql
SELECT array_sort(map_keys(result)) AS keys,
       array_sortby(map_values(result), map_keys(result)) AS values
FROM (
    SELECT SUM_MAP(m) AS result
    FROM map_agg_example
    WHERE id = 100
) t;
```

```text
+------+--------+
| keys | values |
+------+--------+
| []   | []     |
+------+--------+
```
