---
{
  "title": "概要",
  "language": "ja",
  "description": "ウィンドウ関数（分析関数とも呼ばれる）は、元の行を保持しながら計算を実行する特別な組み込み関数です。"
}
---
## 説明

[ウィンドウ関数](../../../query-data/window-function)（分析関数とも呼ばれる）は、元の行を保持しながら計算を実行する特別な組み込み関数です。集計関数とは異なり、ウィンドウ関数は以下の特徴があります：

- GROUP BY グループ化ではなく、特定のウィンドウ範囲内でデータを処理する
- 結果セットの各行に対して値を計算する
- SELECT リストに追加の列を追加できる
- クエリ処理の最後に実行される（JOIN、WHERE、GROUP BY の後）

ウィンドウ関数は、トレンド分析、外れ値計算、データのバケット化のために、金融および科学計算で一般的に使用されます。

## 構文

```sql
<FUNCTION> ( [ <ARGUMENTS> ] ) OVER ( [ <windowDefinition> ] )
```
そして：

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
> ウィンドウ関数の名前。すべての集約関数と特殊なウィンドウ関数が含まれます: DENSE_RANK(), FIRST_VALUE(), LAG(), LAST_VALUE(), LEAD(), RANK(), ROW_NUMBER(), NTH_VALUE(), PERCENT_RANK(), CUME_DIST(), NTILE()。

`<ARGUMENTS>`
> オプション。ウィンドウ関数の入力引数。引数の型と数量は、使用される特定の関数によって異なります。

`<PARTITION_BY>`
> オプション。GROUP BYと類似しており、指定された列でデータをグループ化し、各パーティション内で計算を実行します。

`<ORDER_BY>`
> オプション。各パーティション内でデータをソートするために使用されます。パーティションが指定されていない場合は、データセット全体をソートします。ただし、この`ORDER BY`はSQLステートメントの末尾に表示される一般的な`ORDER BY`とは異なります。`OVER`句で指定されるソートは、そのパーティション内のデータにのみ適用されますが、SQLステートメントの末尾の`ORDER BY`は最終的なクエリ結果のすべての行の順序を制御します。これら2つは共存できます。
> さらに、`OVER`句で`ORDER BY`が明示的に指定されていない場合、パーティション内のデータはランダムになる可能性があり、最終結果が予測不可能になる可能性があります。ソート列が明示的に提供されているが重複値が含まれている場合、結果が不安定になる可能性があります。具体例については、以下の[ケーススタディ](#section1)を参照してください。

`<windowFrameClause>`
> オプション。ウィンドウフレームを定義するために使用されます。現在、2つのタイプがサポートされています: `RANGE`と`ROWS`。
> `N PRECEDING/FOLLOWING`の場合、ここで`N`は正の整数であり、現在の行に対する相対的なスライディングウィンドウ範囲を表します。現在、これは`ROWS`ウィンドウでのみサポートされているため、現在の行に対する物理的なオフセットを示します。`RANGE`タイプには現在いくつかの制限があります: `BOTH UNBOUNDED BOUNDARY`または`ONE UNBOUNDED BOUNDARY AND ONE CURRENT ROW`のいずれかでなければなりません。フレームが指定されていない場合、デフォルトの暗黙フレームは`RANGE BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW`です。

## 戻り値

入力式と同じデータ型を返します。

<a id="section1"></a>
## 分析関数データの一意な順序付け

**1. 一貫性のない戻り結果の問題**

ウィンドウ関数の`ORDER BY`句がデータの一意な順序付けを生成できない場合、例えば`ORDER BY`式が重複値を生成する場合、行の順序は不確定になります。これは、これらの行の戻り順序が複数のクエリ実行間で異なる可能性があることを意味し、ウィンドウ関数から一貫性のない結果が生じます。

以下の例は、連続した実行でクエリが異なる結果を返す方法を示しています。不整合は主に`ORDER BY dateid`が`SUM`ウィンドウ関数に対して一意な順序付けを提供しないために発生します。

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
ソート列 `date_time` に重複する値があるため、以下の2つのクエリ結果が観測される可能性があります：

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

この問題に対処するには、`item_id`などの一意の値を持つカラムを`ORDER BY`句に追加して、順序の一意性を確保することができます。

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
