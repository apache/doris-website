---
{
    "title": "MAX_MAP",
    "language": "ja",
    "description": "MAX_MAP 関数は MAP の値をキーごとに集約し、各キーの最大値を返します。"
}
---

## 説明

MAX_MAP 関数は MAP の値をキーごとに集約し、各キーの NULL 以外の最大値を含む MAP を返します。

## 使用上の注意

返される MAP のエントリの順序は保証されません。安定した順序が必要な場合は `map_keys`、`map_values`、`array_sort`、`array_sortby` を使用してください。NULL キーは通常のキーとして集約され、すべての NULL キーは同じ結果エントリに属します。

## 構文

```sql
MAX_MAP(<map_expr>)
```

## パラメータ

| パラメータ | 説明 |
| --- | --- |
| `<map_expr>` | MAP 式。MAP の値型は MAX 集約関数で比較可能である必要があります。 |

## 戻り値

`<map_expr>` と同じキー型の MAP を返します。DecimalV2 の値型では、戻り値の値型は対応する DecimalV3 型になります。それ以外の値型では、入力 MAP と同じ値型を返します。

グループ内に有効な入力行がない場合は空の MAP を返します。キーが存在しても、そのキーに対応する値がすべて NULL の場合、そのキーの値は NULL になります。

## 使用例

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
    SELECT id, MAX_MAP(m) AS result
    FROM map_agg_example
    GROUP BY id
) t
ORDER BY id;
```

```text
+------+-----------+--------------+
| id   | keys      | values       |
+------+-----------+--------------+
|    1 | [1, 2, 3] | [10, 20, 30] |
|    2 | [1, 4]    | [7, null]    |
+------+-----------+--------------+
```

```sql
SELECT id,
       array_sort(map_keys(result)) AS keys,
       array_sortby(map_values(result), map_keys(result)) AS values
FROM (
    SELECT id, MAX_MAP(ms) AS result
    FROM map_agg_example
    GROUP BY id
) t
ORDER BY id;
```

```text
+------+-----------+----------------+
| id   | keys      | values         |
+------+-----------+----------------+
|    1 | [1, 2, 3] | ["b", "x", null] |
|    2 | [2]       | ["z"]          |
+------+-----------+----------------+
```

```sql
SELECT array_sort(map_keys(result)) AS keys,
       array_sortby(map_values(result), map_keys(result)) AS values
FROM (
    SELECT MAX_MAP(m) AS result
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
