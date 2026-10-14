---
{
    "title": "LEAD",
    "language": "ja",
    "description": "LEAD() は、自己結合を行わずに後続の行のデータを参照するウィンドウ関数です。"
}
---

## 説明

LEAD() は、自己結合を行わずに後続の行のデータを参照するウィンドウ関数です。パーティション内で現在の行より N 行後にある行の値を取得します。

## 構文

```sql
LEAD ( <expr> [ , <offset> [ , <default> ] ] )
```

## パラメータ
| パラメータ | 説明 |
| --- | --- |
| expr | 取得する値を表す式。対応する型: tinyint/smallint/int/bigint/float/double/decimal/string/date/datetime/ |
| offset | 省略可能な BIGINT 型の引数。現在の行から何行後の値を取得するかを指定します。デフォルトは 1 です。 |
| default | 省略可能な引数。型は expr と同じです。指定した行がウィンドウの範囲外にある場合に返す値です。デフォルトは NULL です。 |

## 戻り値

入力式と同じデータ型の値を返します。指定した行がウィンドウの範囲外にある場合は default の値を返し、default を省略した場合は NULL を返します。

## 例

<!-- setup-sql
CREATE TABLE stock_ticker (stock_symbol VARCHAR(10), closing_date DATETIME, closing_price DOUBLE) DISTRIBUTED BY HASH(stock_symbol) BUCKETS 1 PROPERTIES("replication_num"="1");
INSERT INTO stock_ticker VALUES ('JDR','2014-09-13 00:00:00',12.86),('JDR','2014-09-14 00:00:00',12.89),('JDR','2014-09-15 00:00:00',12.94),('JDR','2014-09-16 00:00:00',12.55),('JDR','2014-09-17 00:00:00',14.03),('JDR','2014-09-18 00:00:00',14.75),('JDR','2014-09-19 00:00:00',13.98);
-->

各銘柄について、当日の終値と翌日の終値を比較します。

```sql
select stock_symbol, closing_date, closing_price,    
case   
(lead(closing_price,1, 0)   
over (partition by stock_symbol order by closing_date)-closing_price) > 0   
when true then "higher"   
when false then "flat or lower"    
end as "trending"   
from stock_ticker    
order by closing_date;
```

```text
+--------------+---------------------+---------------+---------------+
| stock_symbol | closing_date        | closing_price | trending      |
| ------------ | ------------------- | ------------- | ------------- |
| JDR          | 2014-09-13 00:00:00 | 12.86         | higher        |
| JDR          | 2014-09-14 00:00:00 | 12.89         | higher        |
| JDR          | 2014-09-15 00:00:00 | 12.94         | flat or lower |
| JDR          | 2014-09-16 00:00:00 | 12.55         | higher        |
| JDR          | 2014-09-17 00:00:00 | 14.03         | higher        |
| JDR          | 2014-09-18 00:00:00 | 14.75         | flat or lower |
| JDR          | 2014-09-19 00:00:00 | 13.98         | flat or lower |
+--------------+---------------------+---------------+---------------+
```
