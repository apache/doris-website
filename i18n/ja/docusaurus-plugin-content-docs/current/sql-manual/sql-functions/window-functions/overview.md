---
{
    "title": "概要",
    "language": "ja",
    "description": "ウィンドウ関数（分析関数とも呼ばれます）は、元の行を保持したまま計算を行う特殊な組み込み関数です。"
}
---

## 説明

[ウィンドウ関数](../../../query-data/window-function)（分析関数とも呼ばれます）は、元の行を保持したまま計算を行う特殊な組み込み関数です。集約関数とは異なり、ウィンドウ関数には次の特徴があります。

- GROUP BY でグループ化するのではなく、指定したウィンドウ範囲内のデータを処理します
- 結果セットの各行に対して値を計算します
- SELECT リストに列を追加できます
- クエリ処理の最後に実行されます（JOIN、WHERE、GROUP BY の後）

ウィンドウ関数は、金融計算や科学計算で、傾向分析、外れ値の計算、データの区分けによく使用されます。

## 構文

```sql
<FUNCTION> ( [ <ARGUMENTS> ] ) OVER ( [ <windowDefinition> ] )
```

また、次のように定義します。
```sql
windowDefinition ::=

[ PARTITION BY <expr1> [, ...] ]
[ ORDER BY <expr2> [ ASC | DESC ] [ NULLS { FIRST | LAST } ] [, ...] ]
[ <windowFrameClause> ]
```

さらに、次のように定義します。
```sql
windowFrameClause ::=
{
  | { ROWS } <n> PRECEDING
  | { ROWS } CURRENT ROW
  | { ROWS } BETWEEN CURRENT ROW AND UNBOUNDED FOLLOWING
  | { ROWS | RANGE } UNBOUNDED PRECEDING
  | { ROWS | RANGE } BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
  | { ROWS | RANGE } BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING
  | { ROWS } BETWEEN <n> { PRECEDING | FOLLOWING } AND <n> { PRECEDING | FOLLOWING }
  | { ROWS } BETWEEN UNBOUNDED PRECEDING AND <n> { PRECEDING | FOLLOWING }
  | { ROWS } BETWEEN <n> { PRECEDING | FOLLOWING } AND UNBOUNDED FOLLOWING
}
```

## パラメータ

`<FUNCTION>`
> ウィンドウ関数の名前です。すべての集約関数に加え、次の専用のウィンドウ関数を指定できます：DENSE_RANK()、FIRST_VALUE()、LAG()、LAST_VALUE()、LEAD()、RANK()、ROW_NUMBER()、NTH_VALUE()、PERCENT_RANK()、CUME_DIST()、NTILE()。

`<ARGUMENTS>`
> 省略可能です。ウィンドウ関数の入力引数です。引数の型と数は、使用する関数によって異なります。

`<PARTITION_BY>`
> 省略可能です。GROUP BY と同様に、指定した列でデータをグループ化し、各パーティション内で計算を行います。

`<ORDER_BY>`
> 省略可能です。各パーティション内のデータを並べ替えるために使用します。パーティションを指定しない場合は、データセット全体を並べ替えます。ただし、この `ORDER BY` は SQL 文の末尾にある通常の `ORDER BY` とは異なります。`OVER` 句で指定した並べ替えは、そのパーティション内のデータにのみ適用されます。一方、SQL 文の末尾にある `ORDER BY` は、最終的なクエリ結果のすべての行の順序を制御します。両者は併用できます。
> また、`ORDER BY` を `OVER` 句で明示的に指定しない場合、パーティション内のデータの順序は不定になり、最終的な結果が予測できなくなる可能性があります。並べ替えに使う列を明示的に指定しても、値が重複している場合は結果が安定しないことがあります。具体例については、以下の[ケーススタディ](#section1)を参照してください。

`<windowFrameClause>`
> 省略可能です。ウィンドウフレームを定義するために使用します。現在、`RANGE` と `ROWS` の二種類がサポートされています。
> `N PRECEDING/FOLLOWING` では、`N` は正の整数で、現在の行を基準としたスライディングウィンドウの範囲を表します。現在、これは `ROWS` ウィンドウでのみサポートされるため、現在の行からの物理的なオフセットを示します。`RANGE` 型には現在、境界が `BOTH UNBOUNDED BOUNDARY` または `ONE UNBOUNDED BOUNDARY AND ONE CURRENT ROW` でなければならないという制限があります。フレームを指定しない場合、デフォルトの暗黙的なフレームは `RANGE BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW` です。

## 戻り値

入力式と同じデータ型の値を返します。

<a id="section1"></a>
## 分析関数のデータを一意に並べ替える

**1. 返される結果が一致しない問題**

ウィンドウ関数の `ORDER BY` 句でデータを一意に並べ替えられない場合、たとえば `ORDER BY` 式の結果に重複する値がある場合、行の順序は不定になります。そのため、クエリを複数回実行すると、これらの行が返される順序が変わり、ウィンドウ関数の結果が一致しないことがあります。

次の例は、連続してクエリを実行したときに異なる結果が返されることを示しています。主な原因は、`ORDER BY date_time` では `SUM` ウィンドウ関数の並べ替え順序が一意にならないことです。

```sql
CREATE TABLE test_window_order 
    (item_id int,
    date_time date,
    sales double)
distributed BY hash(item_id)
properties("replication_num" = 1);

INSERT INTO test_window_order VALUES
(1, '2024-07-01', 100),
(2, '2024-07-01', 100),
(3, '2024-07-01', 140);

SELECT
    item_id, date_time, sales,
    sum(sales) OVER (ORDER BY date_time ROWS BETWEEN 
        UNBOUNDED PRECEDING AND CURRENT ROW) sum
FROM
    test_window_order;
```

並べ替えに使う列 `date_time` に重複する値があるため、次のような二通りのクエリ結果が観測される可能性があります。

```sql
+---------+------------+-------+------+
| item_id | date_time  | sales | sum  |
+---------+------------+-------+------+
|       1 | 2024-07-01 |   100 |  100 |
|       3 | 2024-07-01 |   140 |  240 |
|       2 | 2024-07-01 |   100 |  340 |
+---------+------------+-------+------+
3 rows in set (0.03 sec)
```

**2. 解決方法**

この問題を解決するには、`item_id` のような一意の値を持つ列を `ORDER BY` 句に追加して、並べ替え順序を一意にします。

```sql
SELECT
        item_id,
        date_time,
        sales,
        sum(sales) OVER (
        ORDER BY item_id,
        date_time ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW) sum
FROM
        test_window_order;
```

これにより、クエリの出力は一貫したものになります。

```sql
+---------+------------+-------+------+
| item_id | date_time  | sales | sum  |
+---------+------------+-------+------+
|       1 | 2024-07-01 |   100 |  100 |
|       2 | 2024-07-01 |   100 |  200 |
|       3 | 2024-07-01 |   140 |  340 |
+---------+------------+-------+------+
3 rows in set (0.03 sec)
```
