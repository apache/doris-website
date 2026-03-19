---
{
  "title": "データスキュー処理 | 実行チューニング",
  "sidebar_label": "データスキュー処理",
  "description": "Dorisは並列計算の高速化にデータシャッフルに依存するMPPデータベースです。しかし、実際の本番環境のシナリオでは、",
  "language": "ja"
}
---
# Data Skew Handling

## 概要

DorisはMPPデータベースであり、並列計算の高速化のためにdata shuffleに依存しています。しかし、実際の本番環境では、データの偏りによりクエリ並列処理の単一スレッドでパフォーマンスのボトルネックが発生することがよくあります。以下のセクションでは、このような問題を特定する方法を紹介し、一般的な解決策を提供します。

## Case 1: バケット Data SkewによるSuboptimal Shuffle Method

tableのJoin Keyでデータの偏りが発生すると、データは異なるBEインスタンス間で不均等に分散され、その結果、単一ポイントの実行ボトルネックが発生し、全体的なクエリ実行時間が遅くなります。

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
上記のJoinのProfileのmax indicatorsから、実行時間とProbeRowsに明らかな偏りがあることがわかります。

```Bash
ExecTime:  avg  166.206ms,  max  10s947.344ms,  min  8.845ms 
ProbeRows:  sum  23.884018M  (23884018),  avg  165.861K  (165861),  max  219.346276M  (219346276),  min  1984  (1984) 
```
ただし、結合キーに基づくシャッフル後のデータの不均等な分散により、1つのスレッドが2億行のデータを処理する一方で、別のスレッドは数千行しか処理しないという状況が発生する可能性があります。

上記のシナリオの理想的なケースでは、各スレッドがほぼ同じ量のデータを処理する必要があります。しかし、Join列のデータスキュー問題により、大量の計算作業が単一のスレッドによって完了される可能性があります。このパフォーマンスボトルネックを解決するには、「Using Hint to Control Join Shuffle Method」セクションで言及されているチューニング技法を参照し、以下のようにbroadcast joinヒントを指定して左側のTableがデータをシャッフルすることを防ぎ、Join列でのデータスキューによるパフォーマンスボトルネックを効果的に回避します。

```SQL
SELECT COUNT(*) FROM orders o JOIN [broadcast] customer c ON o.customer_number = c.customer_number;
```
## Case 2: Column Data Skew Leading to Reversed Join Sides

現在のDorisオプティマイザは、データの均等分散を前提として選択性を推定します。フィルタリング後の推定行数に大きな偏差があると、オペレータのプラン選択に影響を与える可能性があります。以下のSQLを例に説明します：

```SQL
select count(*) 
from orders, customer 
where o_custkey = c_custkey
and o_orderdate < '1920-01-02';
```
均等分布を仮定した場合、オプティマイザは`o_orderdate < '1920-01-02'`でフィルタリング後に出力される行数が`customer`Tableの行数よりも少なくなると判断する可能性があります。そのため、`customer` join `orders`の結合順序を選択する場合があります。
しかし、実際のデータに偏りがあり、条件を満たす`orders`Tableの行数が`customer`Tableよりも多い場合、より合理的な結合順序は`orders` join `customer`となります。このパフォーマンス問題を解決するには、「Leading Hintを使用した結合順序の制御」セクションで説明されているチューニング技法を参照し、以下のようにleading hintを指定して`customer` join `orders`の結合順序の生成を強制してください。

SQLを以下のように書き換えます：

```SQL
select /*+leading(orders customer)*/ count(*) 
from orders, customer 
where o_custkey = c_custkey
and o_orderdate < '1920-01-02'
```
## 要約

データスキューは本番環境でよく見られるパフォーマンスの問題です。EXPLAINとPROFILEツールの出力を通じてプランと実行のボトルネックを観察し、スキューの原因を特定した上で、Hintツールを使用して対応するプラン調整を行うことで、データスキューがパフォーマンスに与える影響を回避できます。
