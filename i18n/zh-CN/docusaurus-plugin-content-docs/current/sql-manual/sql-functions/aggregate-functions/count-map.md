---
{
    "title": "COUNT_MAP",
    "language": "zh-CN",
    "description": "COUNT_MAP 函数按键聚合 MAP 值，并返回每个键对应的非 NULL 值数量。"
}
---

## 描述

COUNT_MAP 函数按键聚合 MAP 值，返回一个 MAP，其中每个键对应的值为该键下非 NULL 值的数量。

## 使用说明

返回 MAP 中条目的顺序不保证稳定。如果需要稳定的输出顺序，请使用 `map_keys`、`map_values`、`array_sort` 和 `array_sortby` 对结果进行排序。NULL key 会作为普通 key 参与聚合；所有 NULL key 会归并到同一个结果条目中。

## 语法

```sql
COUNT_MAP(<map_expr>)
```

## 参数

| 参数 | 描述 |
| --- | --- |
| `<map_expr>` | MAP 表达式。 |

## 返回值

返回一个 MAP，key 类型与 `<map_expr>` 相同，value 类型为 BIGINT。

如果组内没有有效输入行，返回空 MAP。如果某个 key 存在但该 key 下所有 value 均为 NULL，则该 key 对应的返回值为 0。

## 示例

```sql
-- setup
CREATE TABLE map_agg_example (
    id INT,
    m MAP<INT, INT>,
    ms MAP<INT, STRING>
) DISTRIBUTED BY HASH(id) BUCKETS 1
PROPERTIES ("replication_num" = "1");

INSERT INTO map_agg_example VALUES
    (1, MAP(1, 10, 2, 20), MAP(1, 'b', 2, 'x')),
    (1, MAP(2, 5, 3, 30), MAP(1, 'a', 3, NULL)),
    (2, MAP(1, 7, 4, NULL), MAP(2, 'z')),
    (2, CAST(MAP() AS MAP<INT, INT>), CAST(MAP() AS MAP<INT, STRING>));
```

```text
Query OK
```

```sql
SELECT id,
       array_sort(map_keys(result)) AS keys,
       array_sortby(map_values(result), map_keys(result)) AS values
FROM (
    SELECT id, COUNT_MAP(m) AS result
    FROM map_agg_example
    GROUP BY id
) t
ORDER BY id;
```

```text
+------+-----------+-----------+
| id   | keys      | values    |
+------+-----------+-----------+
|    1 | [1, 2, 3] | [1, 2, 1] |
|    2 | [1, 4]    | [1, 0]    |
+------+-----------+-----------+
```

```sql
SELECT id,
       array_sort(map_keys(result)) AS keys,
       array_sortby(map_values(result), map_keys(result)) AS values
FROM (
    SELECT id, COUNT_MAP(ms) AS result
    FROM map_agg_example
    GROUP BY id
) t
ORDER BY id;
```

```text
+------+-----------+-----------+
| id   | keys      | values    |
+------+-----------+-----------+
|    1 | [1, 2, 3] | [2, 1, 0] |
|    2 | [2]       | [1]       |
+------+-----------+-----------+
```

```sql
SELECT array_sort(map_keys(result)) AS keys,
       array_sortby(map_values(result), map_keys(result)) AS values
FROM (
    SELECT COUNT_MAP(m) AS result
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
