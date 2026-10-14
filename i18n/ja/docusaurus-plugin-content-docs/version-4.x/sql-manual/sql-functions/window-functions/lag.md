---
{
    "title": "LAG",
    "language": "ja",
    "description": "LAG() は、自己結合を行わずに前の行のデータを参照するウィンドウ関数です。"
}
---

## 説明

LAG() は、自己結合を行わずに前の行のデータを参照するウィンドウ関数です。パーティション内で現在の行より N 行前にある行の値を取得します。

## 構文

```sql
LAG ( <expr> [, <offset> [, <default> ] ] )
```

## パラメータ
| パラメータ | 説明 |
| --- | --- |
| expr | 取得する値を表す式。対応する型: tinyint/smallint/int/bigint/float/double/decimal/string/date/datetime/ |
| offset | 省略可能な BIGINT 型の引数。現在の行から何行前の値を取得するかを指定します。デフォルトは 1 です。 |
| default | 省略可能な引数。型は expr と同じです。指定した行がウィンドウの範囲外にある場合に返す値です。デフォルトは NULL です。 |

## 戻り値

入力式と同じデータ型の値を返します。指定した行がウィンドウの範囲外にある場合は default の値を返し、default を省略した場合は NULL を返します。

## 例

<!-- setup-sql
CREATE TABLE stock_ticker (stock_symbol VARCHAR(10), closing_date DATETIME, closing_price DOUBLE) DISTRIBUTED BY HASH(stock_symbol) BUCKETS 1 PROPERTIES("replication_num"="1");
INSERT INTO stock_ticker VALUES ('JDR','2014-09-13 00:00:00',12.86),('JDR','2014-09-14 00:00:00',12.89),('JDR','2014-09-15 00:00:00',12.94),('JDR','2014-09-16 00:00:00',12.55),('JDR','2014-09-17 00:00:00',14.03),('JDR','2014-09-18 00:00:00',14.75),('JDR','2014-09-19 00:00:00',13.98);
-->

各銘柄について、当日の終値と前日の終値を表示します。

```sql
select stock_symbol, closing_date, closing_price,    
lag(closing_price,1, 0) over (partition by stock_symbol order by closing_date) as "yesterday closing"   
from stock_ticker   
order by closing_date;
```

```text
+--------------+---------------------+---------------+-------------------+
| stock_symbol | closing_date        | closing_price | yesterday closing |
| ------------ | ------------------- | ------------- | ----------------- |
| JDR          | 2014-09-13 00:00:00 | 12.86         | 0                 |
| JDR          | 2014-09-14 00:00:00 | 12.89         | 12.86             |
| JDR          | 2014-09-15 00:00:00 | 12.94         | 12.89             |
| JDR          | 2014-09-16 00:00:00 | 12.55         | 12.94             |
| JDR          | 2014-09-17 00:00:00 | 14.03         | 12.55             |
| JDR          | 2014-09-18 00:00:00 | 14.75         | 14.03             |
| JDR          | 2014-09-19 00:00:00 | 13.98         | 14.75             |
+--------------+---------------------+---------------+-------------------+
```
