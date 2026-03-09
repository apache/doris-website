---
{
  "title": "データスキュー処理",
  "language": "ja",
  "description": "Dorisは並列コンピューティング高速化のためにデータシャッフルに依存するMPPデータベースです。しかし、実際の本番環境シナリオでは、"
}
---
# データスキュー処理

## 概要

DorisはMPPデータベースであり、並列コンピューティングの高速化のためにデータshuffleに依存しています。しかし、実際の本番環境のシナリオでは、データスキューが原因でクエリ並列処理の単一スレッドにおけるパフォーマンスのボトルネックがよく発生します。以下のセクションでは、このような問題を特定する方法を紹介し、一般的な解決策をいくつか提供します。

## ケース1: 最適でないShuffle手法につながるバケットデータスキュー

テーブルのJoin Keyでデータスキューが発生すると、データが異なるBEインスタンス間で不均等に分散され、単一ポイントでの実行ボトルネックが生じ、全体的なクエリ実行時間が遅くなります。

```SQL
HASH_JOIN_OPERATOR  (id=27): 
      -  PlanInfo 
            -  join  op: INNER  JOIN(PARTITIONED)[] 
            -  equal  join  conjunct:  (customer_number  =  customer_number) 
            -  runtime  filters:  RF001[bloom]  <-  customer_number(200/256/2048) 
            -  cardinality=200         
            -  vec  output  tuple  id:  28 
            -  output  tuple  id:  28  
            -  vIntermediate  tuple  ids:  27 
            -  hash  output  slot  ids:  192  193  194  195  196  197  198  199  200  201  174  175  240  176  177  178  179  180  181  182  183  184  185  186  187  188  189  190  191 
            -  project  output  tuple  id:  28 
      -  BlocksProduced:  sum  4.883K  (4883),  avg  33,  max  39,  min  29 
      -  CloseTime:  avg  37.28us,  max  132.653us,  min  13.945us  
      -  ExecTime:  avg  166.206ms,  max  10s947.344ms,  min  8.845ms 
      -  InitTime:  avg  0ns,  max  0ns,  min  0ns  
      -  MemoryUsage:  sum ,  avg ,  max ,  min 
          -  PeakMemoryUsage:  sum  11.81  MB,  avg  84.00  KB,  max  84.00  KB,  min  84.00  KB 
          -  ProbeKeyArena:  sum  11.81  MB,  avg  84.00  KB,  max  84.00  KB,  min  84.00  KB 
      -  OpenTime:  avg  194.970us,  max  497.685us,  min  93.738us  
      -  ProbeRows:  sum  23.884018M  (23884018),  avg  165.861K  (165861),  max  219.346276M  (219346276),  min  1984  (1984) 
      -  ProjectionTime:  avg  7.336ms,  max  33.540ms,  min  3.760ms 
      -  RowsProduced:  sum  28.8K  (28800),  avg  200,  max  200,  min  200 
```
上記のJoinのProfileのmax indicatorsから、実行時間とProbeRowsに明らかな偏りがあります。

```Bash
ExecTime:  avg  166.206ms,  max  10s947.344ms,  min  8.845ms 
ProbeRows:  sum  23.884018M  (23884018),  avg  165.861K  (165861),  max  219.346276M  (219346276),  min  1984  (1984) 
```
ただし、join keyに基づくシャッフル後のデータの不均等な分散により、あるスレッドは2億行のデータを処理する一方で、別のスレッドは数千行しか処理しない場合があります。
上記のシナリオの理想的なケースでは、各スレッドはほぼ同量のデータを処理するべきです。しかし、Join列のデータスキュー問題により、大量の計算作業が単一のスレッドによって完了される可能性があります。このパフォーマンスボトルネックを解決するには、「Hintを使用してJoin Shuffle方式を制御する」セクションで言及されているチューニング技術を参照し、以下のようにbroadcast joinヒントを指定して左テーブルがデータをシャッフルすることを防ぎ、Join列のデータスキューによって引き起こされるパフォーマンスボトルネックを効果的に回避します。

```SQL
SELECT COUNT(*) FROM orders o JOIN [broadcast] customer c ON o.customer_number = c.customer_number;
```
## ケース2: 列データスキューによるJoin側の逆転

現在のDorisオプティマイザーは、データ分布が均一であるという仮定に基づいて選択性を推定します。フィルタリング後の推定行数の大きな偏差は、オペレーターのプラン選択に影響を与える可能性があります。以下のSQLを例に取ります：

```SQL
select count(*) 
from orders, customer 
where o_custkey = c_custkey
and o_orderdate < '1920-01-02';
```
一様分布の仮定の下では、オプティマイザは`o_orderdate < '1920-01-02'`によるフィルタリング後の出力行数が`customer`テーブルの行数より少なくなると判断する可能性があります。そのため、`customer` join `orders`の結合順序を選択する可能性があります。
しかし、実際のデータに偏りがあり、条件を満たす`orders`テーブルの行数が`customer`テーブルより多い場合、より合理的な結合順序は`orders` join `customer`となるはずです。このパフォーマンス問題を解決するには、「Leading Hintを使用した結合順序の制御」セクションで説明されているチューニング技法を参照し、以下のようにleading hintを指定して`customer` join `orders`の結合順序の生成を強制します。

SQLを以下のように書き換えます：

```SQL
select /*+leading(orders customer)*/ count(*) 
from orders, customer 
where o_custkey = c_custkey
and o_orderdate < '1920-01-02'
```
## 概要

データスキューは本番環境における一般的なパフォーマンス問題です。EXPLAINとPROFILEツールの出力を通じてプランと実行ボトルネックを観察し、スキューの原因を特定し、その後Hintツールを使用して対応するプラン調整を行うことで、データスキューがパフォーマンスに与える影響を回避できます。
