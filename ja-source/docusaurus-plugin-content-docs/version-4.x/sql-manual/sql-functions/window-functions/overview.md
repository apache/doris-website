---
{
  "title": "概要",
  "description": "Window関数（analytic関数とも呼ばれる）は、元の行を保持しながら計算を実行する特別な組み込み関数です。",
  "language": "ja"
}
---
## 説明

[Window functions](../../../query-data/window-function)（分析関数とも呼ばれます）は、元の行を保持しながら計算を実行する特別な組み込み関数です。集約関数とは異なり、window functions は以下の特徴があります：

- GROUP BY グループ化ではなく、特定のwindow範囲内でデータを処理します
- 結果セット内の各行に対して値を計算します
- SELECT リストに追加の列を加えることができます
- クエリ処理の最後に実行されます（JOIN、WHERE、GROUP BY の後）

Window functions は、トレンド分析、外れ値計算、データバケット化において、金融および科学計算で一般的に使用されます。

## 構文

```sql
<FUNCTION> ( [ <ARGUMENTS> ] ) OVER ( [ <windowDefinition> ] )
```
そして:

```sql
windowDefinition ::=

[ PARTITION BY <expr1> [, ...] ]
[ ORDER BY <expr2> [ ASC | DESC ] [ NULLS { FIRST | LAST } ] [, ...] ]
[ <windowFrameClause> ]
```
そして：

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
> ウィンドウ関数の名前。すべての集約関数と特別なウィンドウ関数を含みます：DENSE_RANK()、FIRST_VALUE()、LAG()、LAST_VALUE()、LEAD()、RANK()、ROW_NUMBER()、NTH_VALUE()、PERCENT_RANK()、CUME_DIST()、NTILE()。

`<ARGUMENTS>`
> オプション。ウィンドウ関数の入力引数。引数の型と数量は、使用される特定の関数に依存します。

`<PARTITION_BY>`
> オプション。GROUP BYと同様に、指定された列でデータをグループ化し、各パーティション内で計算を実行します。

`<ORDER_BY>`
> オプション。各パーティション内でデータをソートするために使用されます。パーティションが指定されていない場合、データセット全体をソートします。ただし、この`ORDER BY`は、SQL文の最後に出現する一般的な`ORDER BY`とは異なります。`OVER`句で指定されたソートは、そのパーティション内のデータにのみ適用されますが、SQL文の最後の`ORDER BY`は、最終的なクエリ結果のすべての行の順序を制御します。この2つは共存できます。
> さらに、`OVER`句で`ORDER BY`が明示的に指定されていない場合、パーティション内のデータはランダムになる可能性があり、予測不可能な最終結果につながる可能性があります。ソート列が明示的に提供されていても重複値が含まれている場合、結果は依然として不安定である可能性があります。具体的な例については、以下の[ケーススタディ](#section1)を参照してください。

`<windowFrameClause>`
> オプション。ウィンドウフレームを定義するために使用されます。現在、2つのタイプがサポートされています：`RANGE`と`ROWS`。
> `N PRECEDING/FOLLOWING`について、Nは正の整数で、現在の行に対する相対的なスライディングウィンドウの範囲を表します。現在、これは`ROWS`ウィンドウでのみサポートされているため、現在の行に対する物理的なオフセットを示します。`RANGE`タイプには現在いくつかの制限があります：`BOTH UNBOUNDED BOUNDARY`または`ONE UNBOUNDED BOUNDARY AND ONE CURRENT ROW`のいずれかである必要があります。フレームが指定されていない場合、デフォルトの暗黙的なフレームは`RANGE BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW`です。

## 戻り値

入力式と同じデータ型を返します。

<a id="section1"></a>
## 分析関数データの一意な順序付け

**1. 戻り結果の不整合の問題**

ウィンドウ関数の`ORDER BY`句がデータの一意な順序付けを生成できない場合、例えば`ORDER BY`式が重複値を生じる場合、行の順序が不確定になります。これは、これらの行の戻り順序が複数のクエリ実行間で変わる可能性があることを意味し、ウィンドウ関数から一貫性のない結果をもたらします。

以下の例は、クエリが連続した実行で異なる結果を返す方法を示しています。この不整合は主に、`ORDER BY dateid`が`SUM`ウィンドウ関数に対して一意な順序付けを提供しないことから生じます。

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
ソート列`date_time`に重複する値があるため、以下の2つのクエリ結果が観測される可能性があります：

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
**2. Solution**

この問題に対処するには、`item_id`などの一意な値の列を`ORDER BY`句に追加して、順序の一意性を確保することができます。

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
これにより、一貫したクエリ出力が得られます：

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
