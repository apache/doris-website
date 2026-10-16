---
{
    "title": "概要",
    "language": "ja",
    "description": "ウィンドウ関数（分析関数とも呼ばれます）は、元の行を保持したまま計算を行う特殊な組み込み関数です。"
}
---

## 説明

[ウィンドウ関数](../../../query-data/window-function)（分析関数とも呼ばれます）は、元の行を保持したまま計算を行う特殊な組み込み関数です。集約関数とは異なり、ウィンドウ関数には次の特徴があります。

- GROUP BY によるグループ化ではなく、指定したウィンドウ範囲内のデータを処理します
- 結果セットの各行について値を計算します
- SELECT リストに列を追加できます
- クエリ処理の最後（JOIN、WHERE、GROUP BY の後）に実行されます

ウィンドウ関数は、金融や科学技術計算における傾向分析、外れ値の計算、データの区分分けによく使用されます。

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
> ウィンドウ関数の名前です。すべての集約関数に加え、DENSE_RANK()、FIRST_VALUE()、LAG()、LAST_VALUE()、LEAD()、RANK()、ROW_NUMBER()、NTH_VALUE()、PERCENT_RANK()、CUME_DIST()、NTILE() などの特殊なウィンドウ関数が含まれます。

`<ARGUMENTS>`
> 省略可能。ウィンドウ関数への入力引数です。引数の型と個数は、使用する関数によって異なります。

`<PARTITION_BY>`
> 省略可能。GROUP BY と同様に、指定した列でデータをグループ化し、各パーティション内で計算を行います。

`<ORDER_BY>`
> 省略可能。各パーティション内のデータを並べ替えます。パーティションを指定しない場合は、データセット全体を並べ替えます。ただし、この `ORDER BY` は SQL 文の末尾に指定する通常の `ORDER BY` とは異なります。`OVER` 句内で指定する並べ替えは、そのパーティション内のデータにのみ適用されます。一方、SQL 文の末尾の `ORDER BY` は、最終的なクエリ結果に含まれる全行の順序を制御します。両方を併用できます。
> また、`ORDER BY` を `OVER` 句内で明示的に指定しない場合、パーティション内のデータの順序は不定となり、最終結果を予測できないことがあります。並べ替えに使う列を明示的に指定しても、値が重複していれば結果は不安定になる可能性があります。具体例については、以下の[事例](#section1)を参照してください。

`<windowFrameClause>`
> 省略可能。ウィンドウフレームを定義します。現在は `RANGE` と `ROWS` の二種類がサポートされています。
> スライディングウィンドウを指定する `N PRECEDING/FOLLOWING` では、`N` は正の整数で、現在の行を基準とする範囲を表します。現在、これは `ROWS` ウィンドウでのみサポートされるため、現在の行からの物理的なオフセットを示します。`RANGE` 型には現在、いくつかの制限があります。境界は `BOTH UNBOUNDED BOUNDARY`、または `ONE UNBOUNDED BOUNDARY AND ONE CURRENT ROW` のいずれかでなければなりません。フレームを指定しない場合、暗黙のデフォルトフレームは `RANGE BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW` です。

## 戻り値

入力式と同じデータ型を返します。

<a id="section1"></a>
## 分析関数で使用するデータの並び順を一意にする

**1. 戻り値が一致しない問題**

ウィンドウ関数の `ORDER BY` 句によってデータの並び順が一意に決まらない場合、たとえば `ORDER BY` 式の値が重複する場合、行の順序は不定になります。そのため、クエリを実行するたびにこれらの行の返却順序が変わり、ウィンドウ関数の結果が一致しないことがあります。

次の例は、同じクエリを続けて実行すると異なる結果が返ることを示しています。主な原因は、`ORDER BY date_time` だけでは `SUM` ウィンドウ関数に対して一意な並び順が定まらないことです。

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

並べ替えに使う列 `date_time` に重複する値があるため、次の二種類のクエリ結果が得られることがあります。

```sql
+---------+------------+-------+------+
| item_id | date_time  | sales | sum  |
+---------+------------+-------+------+
|       1 | 2024-07-01 |   100 |  100 |
|       3 | 2024-07-01 |   140 |  240 |
|       2 | 2024-07-01 |   100 |  340 |
+---------+------------+-------+------+
3 rows in set (0.03 sec)
+---------+------------+-------+------+
| item_id | date_time  | sales | sum  |
+---------+------------+-------+------+
|       2 | 2024-07-01 |   100 |  100 |
|       1 | 2024-07-01 |   100 |  200 |
|       3 | 2024-07-01 |   140 |  340 |
+---------+------------+-------+------+
3 rows in set (0.02 sec)
```

**2. 解決方法**

この問題に対処するには、`item_id` のような一意の値を持つ列を `ORDER BY` 句に追加し、並び順が一意に決まるようにします。

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

これにより、クエリ結果は毎回同じになります。

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
