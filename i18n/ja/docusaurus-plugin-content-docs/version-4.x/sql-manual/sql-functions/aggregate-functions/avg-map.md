---
{
    "title": "AVG_MAP",
    "language": "ja",
    "description": "AVG_MAP 関数は MAP 型の値をキーごとに集約し、各キーの平均値を返します。"
}
---

## 説明

AVG_MAP 関数は MAP 型の値をキーごとに集約し、各キーについて NULL 以外の値の平均を含む MAP を返します。

## 使用上の注意

返される MAP 内の要素の順序は保証されません。出力順序を固定する必要がある場合は、`map_keys`、`map_values`、`array_sort`、`array_sortby` を使用してください。NULL キーは通常のキーと同様に集約され、すべての NULL キーは結果内の同じ要素にまとめられます。

## 構文

```sql
AVG_MAP(<map_expr>)
```

## パラメータ

| パラメータ | 説明 |
| --- | --- |
| `<map_expr>` | MAP 型の式。MAP の値の型は数値型である必要があります。 |

## 戻り値

`<map_expr>` と同じキー型の MAP を返します。Decimal 以外の数値型では、戻り値の値の型は DOUBLE です。Decimal 型では、戻り値の値の型は、サポートされる最大精度を持ち、AVG 用にスケールが調整された Decimal 型です。

グループ内に有効な入力行がない場合は、空の MAP を返します。キーが存在し、そのキーの値がすべて NULL の場合は、そのキーの値は NULL になります。

## 例

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
    SELECT id, AVG_MAP(m) AS result
    FROM map_agg_example
    GROUP BY id
) t
ORDER BY id;
```

```text
+------+-----------+----------------+
| id   | keys      | values         |
+------+-----------+----------------+
|    1 | [1, 2, 3] | [10, 12.5, 30] |
|    2 | [1, 4]    | [7, null]      |
+------+-----------+----------------+
```

```sql
SELECT array_sort(map_keys(result)) AS keys,
       array_sortby(map_values(result), map_keys(result)) AS values
FROM (
    SELECT AVG_MAP(md) AS result
    FROM map_agg_example
) t;
```

```text
+-----------------+------------------------+
| keys            | values                 |
+-----------------+------------------------+
| ["a", "b", "c"] | [1.2000, 3.0000, 4.7500] |
+-----------------+------------------------+
```

```sql
SELECT array_sort(map_keys(result)) AS keys,
       array_sortby(map_values(result), map_keys(result)) AS values
FROM (
    SELECT AVG_MAP(m) AS result
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
