---
{
  "title": "概要",
  "description": "Window関数（analytic関数とも呼ばれます）は、元の行を保持しながら計算を実行する特別な組み込み関数です。",
  "language": "ja"
}
---
## 説明

ウィンドウ関数（分析関数とも呼ばれます）は、元の行を保持しながら計算を実行する特別な組み込み関数です。集約関数とは異なり、ウィンドウ関数は以下の特徴があります：

- GROUP BYグループ化ではなく、特定のウィンドウ範囲内でデータを処理する
- 結果セット内の各行に対して値を計算する
- SELECTリストに追加の列を加えることができる
- クエリ処理の最後に実行される（JOIN、WHERE、GROUP BYの後）

ウィンドウ関数は、トレンド分析、外れ値計算、データバケット化において、金融および科学計算で一般的に使用されています。

## 構文

```sql
function(<args>) OVER(
    [PARTITION BY <expr> [, <expr> ...]]
    [ORDER BY <expr> [ASC | DESC] [, <expr> [ASC | DESC] ...]]
    [<window_clause>]
)
```
## パラメータ

| Parameter | デスクリプション |
|-----------|-------------|
| `<args>` | ウィンドウ関数の入力パラメータ、使用される関数に固有 |
| `<function>` | サポートされる関数には以下が含まれます: AVG(), COUNT(), DENSE_RANK(), FIRST_VALUE(), LAG(), LAST_VALUE(), LEAD(), MAX(), MIN(), RANK(), ROW_NUMBER(), SUM() およびすべての集計関数 |
| `<partition_by>` | GROUP BYと同様、指定された列でデータをグループ化 |
| `<order_by>` | ウィンドウ内でのデータの順序を定義 |
| `<window_clause>` | ウィンドウの範囲を定義、構文: ROWS BETWEEN [ { m \| UNBOUNDED } PRECEDING \| CURRENT ROW] [ AND [CURRENT ROW \| { UNBOUNDED \| n } FOLLOWING] ] |

## Return Value

入力式と同じデータ型を返します。

## Examples

1. 株式シンボルJDRと日次終値を含む以下の株式データがあると仮定します:

```sql
create table stock_ticker (stock_symbol string, closing_price decimal(8,2), closing_date datetime);    
...load some data...    
select * from stock_ticker order by stock_symbol, closing_date
```
```text
 | stock_symbol | closing_price | closing_date        |
 |--------------|---------------|---------------------|
 | JDR          | 12.86         | 2014-10-02 00:00:00 |
 | JDR          | 12.89         | 2014-10-03 00:00:00 |
 | JDR          | 12.94         | 2014-10-04 00:00:00 |
 | JDR          | 12.55         | 2014-10-05 00:00:00 |
 | JDR          | 14.03         | 2014-10-06 00:00:00 |
 | JDR          | 14.75         | 2014-10-07 00:00:00 |
 | JDR          | 13.98         | 2014-10-08 00:00:00 |
```
2. このクエリは分析関数を使用してmoving_average列を生成し、3日間の平均株価（前日、当日、翌日）を計算します。最初の日には前日の値がなく、最後の日には翌日の値がないため、これらの行は2日間の平均のみを計算します。パーティション By句は、すべてのデータがJDR用であるため、ここでは効果がありませんが、他の株式情報がある場合、パーティション Byは分析関数が自身のパーティション内でのみ動作することを保証します。

```sql
select stock_symbol, closing_date, closing_price,    
avg(closing_price) over (partition by stock_symbol order by closing_date    
rows between 1 preceding and 1 following) as moving_average    
from stock_ticker;
```
```text
| stock_symbol | closing_date        | closing_price | moving_average |
|--------------|---------------------|---------------|----------------|
| JDR          | 2014-10-02 00:00:00 | 12.86         | 12.87          |
| JDR          | 2014-10-03 00:00:00 | 12.89         | 12.89          |
| JDR          | 2014-10-04 00:00:00 | 12.94         | 12.79          |
| JDR          | 2014-10-05 00:00:00 | 12.55         | 13.17          |
| JDR          | 2014-10-06 00:00:00 | 14.03         | 13.77          |
| JDR          | 2014-10-07 00:00:00 | 14.75         | 14.25          |
| JDR          | 2014-10-08 00:00:00 | 13.98         | 14.36          |
```
