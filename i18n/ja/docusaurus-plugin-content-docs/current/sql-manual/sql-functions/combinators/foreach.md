---
{
    "title": "FOREACH",
    "language": "ja",
    "description": "テーブル用の集約関数を、対応する配列要素を集約して結果の配列を返す、配列用の集約関数に変換します。"
}
---

## 説明

テーブル用の集約関数を配列用の集約関数に変換します。対応する位置の配列要素を集約し、結果の配列を返します。例えば、sum_foreach を配列 [1, 2]、[3, 4, 5]、[6, 7] に適用すると、対応する位置の要素を加算して [10, 13, 5] を返します。

## 構文

`AGGREGATE_FUNCTION_FOREACH(arg...)`

## 例

サンプルデータを準備します。

```sql
CREATE TABLE db (
    id INT,
    a  ARRAY<INT>,
    s  ARRAY<STRING>
)
DUPLICATE KEY(id)
DISTRIBUTED BY HASH(id) BUCKETS 1
PROPERTIES ("replication_num" = "1");

INSERT INTO db VALUES
    (1, [1, 2, 3], ["ab", "123"]),
    (2, [20],      ["cd"]),
    (3, [100],     ["efg"]),
    (4, NULL,      NULL),
    (5, [null, 2], [null, "c"]);
```

次に、FOREACH コンビネータを実行します。

```
mysql [test]>select a , s from db;
+-----------+---------------+
| a         | s             |
+-----------+---------------+
| [1, 2, 3] | ["ab", "123"] |
| [20]      | ["cd"]        |
| [100]     | ["efg"]       |
| NULL      | NULL          |
| [null, 2] | [null, "c"]   |
+-----------+---------------+

mysql [test]>select sum_foreach(a) from db;
+----------------+
| sum_foreach(a) |
+----------------+
| [121, 4, 3]    |
+----------------+

mysql [test]>select count_foreach(s) from db;
+------------------+
| count_foreach(s) |
+------------------+
| [3, 2]           |
+------------------+

mysql [test]>select array_agg_foreach(a) from db;
+-----------------------------------+
| array_agg_foreach(a)              |
+-----------------------------------+
| [[1, 20, 100, null], [2, 2], [3]] |
+-----------------------------------+

mysql [test]>select map_agg_foreach(a,a) from db;
+---------------------------------------+
| map_agg_foreach(a, a)                 |
+---------------------------------------+
| [{1:1, 20:20, 100:100}, {2:2}, {3:3}] |
+---------------------------------------+
```
## 注意事項

- 各引数は ARRAY 型である必要があり、その要素型は内部の集約関数の対応する引数の型と一致する必要があります。戻り値は、各位置で計算した内部の集約関数の戻り値を要素とする ARRAY 型です。
- 一度の呼び出しに複数の配列引数を渡す場合、同じ行にあるすべての配列の長さが等しい必要があります。長さが異なると、クエリは `Arrays passed to <function> aggregate function have different sizes` というエラーで失敗します。（配列の長さは行ごとに異なっていてもかまいません。）
- `percentile`、`percentile_array`、`percentile_approx`、`percentile_approx_weighted` 関数は `foreach` コンビネータに対応していません。

### キーワード
FOREACH
