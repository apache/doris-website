---
{
    "title": "COUNT_MAP",
    "language": "ja",
    "description": "COUNT_MAP 関数は MAP 値をキーごとに集約し、各キーに対応する NULL 以外の値の件数を返します。"
}
---

## 説明

COUNT_MAP 関数は MAP 値をキーごとに集約し、各キーに対応する NULL 以外の値の件数を格納した MAP を返します。

## 使用上の注意

返される MAP のエントリの順序は保証されません。出力順序を一定にする必要がある場合は、`map_keys`、`map_values`、`array_sort`、`array_sortby` を使用してください。NULL キーは通常のキーと同様に集約され、すべての NULL キーは結果の同じエントリにまとめられます。

## 構文

```sql
COUNT_MAP(<map_expr>)
```

## パラメータ

| パラメータ | 説明 |
| --- | --- |
| `<map_expr>` | MAP 式。 |

## 戻り値

`<map_expr>` と同じキー型、BIGINT 型の値を持つ MAP を返します。

グループに有効な入力行がない場合は、空の MAP を返します。あるキーが存在しても、そのキーに対応する値がすべて NULL の場合、そのキーの値は 0 になります。

## 例

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
