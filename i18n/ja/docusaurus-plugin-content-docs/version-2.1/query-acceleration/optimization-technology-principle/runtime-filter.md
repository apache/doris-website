---
{
  "title": "ランタイムフィルタ",
  "language": "ja",
  "description": "ランタイムフィルターは主に2つのタイプで構成されます：Join Runtime FilterとTopN Runtime Filterです。"
}
---
Runtime Filterは主にJoin Runtime FilterとTopN Runtime Filterの2種類で構成されています。本記事では、この2種類のRuntime Filterの動作原理、使用ガイドライン、チューニング方法について詳細に紹介します。

## Join Runtime Filter

Join Runtime Filter（以下JRFと記す）は、Join条件を活用してランタイムデータに基づいてJoinノードでフィルターを動的に生成する最適化技術です。この技術はJoin Probeのサイズを削減するだけでなく、データI/Oやネットワーク送信も効果的に最小化します。

### 原理

TPC-H Schemaに見られるような結合操作を使用してJRFの動作原理を説明します。

データベースに2つのテーブルがあると仮定します：

- Orders Table：1億行のデータを含み、注文キー（`o_orderkey`）、顧客キー（`o_custkey`）、その他の注文情報を記録。

- Customer Table：10万行のデータを含み、顧客キー（`c_custkey`）、顧客の国（`c_nation`）、その他の顧客情報を記録。このテーブルは25カ国の顧客を記録しており、国あたり約4,000人の顧客がいます。

中国の顧客からの注文数をカウントするには、クエリステートメントは次のようになります：

```sql
select count(*)
from orders join customer on o_custkey = c_custkey
where c_nation = "china"
```
このクエリの実行計画の主要コンポーネントはJoinであり、以下に示されています：

![Join Runtime Filter](/images/join-runtime-filter-1.jpg)

JRF無し：Scanノードはordersテーブルをスキャンし、1億行のデータを読み取ります。その後、Joinノードがこれらの1億行に対してHash Probeを実行してJoin結果を生成します。

**1. 最適化**

フィルタ条件`c_nation = 'china'`は中国以外の顧客をすべて除外するため、customerテーブルの一部（約1/25）のみがJoinに関与します。後続のJoin条件`o_custkey = c_custkey`を考慮すると、フィルタされた結果で選択された`c_custkey`の値に焦点を当てる必要があります。フィルタされた`c_custkey`の値を集合Aとしましょう。以下のテキストでは、集合AはJoinに参加する`c_custkey`集合を特に指すために使用します。

集合AがIN条件としてordersテーブルにプッシュダウンされると、ordersテーブルのScanノードは対応してordersをフィルタできます。これは、フィルタ条件`o_custkey IN (c001, c003)`を追加することに似ています。

この最適化の概念に基づいて、SQLは以下のように最適化できます：

```sql
select count(*)
from orders join customer on o_custkey = c_custkey
where c_nation = "china" and o_custkey in (c001, c003)
```
最適化された実行計画を以下に示します：

![join-runtime-filter-2](/images/join-runtime-filter-2.jpg)

ordersテーブルにフィルタ条件を追加することで、Joinに参加する実際の注文数が1億から40万に削減され、クエリ速度が大幅に向上します。

**2. 実装**

上記で説明した最適化は重要ですが、オプティマイザは選択された実際の`c_custkey`値（セットA）を知らないため、最適化段階で固定のin-predicateフィルタオペレータを静的に生成することはできません。

実際のアプリケーションでは、Joinノードで右側のデータを収集し、実行時にセットAを生成し、セットAをordersテーブルのScanノードにプッシュダウンします。通常、このJRFを`RF(c_custkey -> [o_custkey])`と表記します。

Dorisは分散データベースであるため、JRFは分散シナリオに対応するための追加のマージステップが必要です。例のJoinがShuffle Joinであると仮定すると、このJoinの複数のインスタンスがorders テーブルとcustomerテーブルの個別のシャードを処理します。その結果、各JoinインスタンスはセットAの一部のみを取得します。

現在のバージョンのDorisでは、Runtime Filter Managerとして機能するノードを選択します。各Joinインスタンスはそのシャードの`c_custkey`値に基づいてPartial JRFを生成し、それをManagerに送信します。ManagerはすべてのPartial JRFを収集し、それらをGlobal JRFにマージして、Global JRFをordersテーブルのすべてのScanインスタンスに送信します。

Global JRFの生成プロセスを以下に示します：

![Global JRF](/images/global-JRF.jpg)

### フィルタタイプ

JRF（Join Runtime Filter）の実装には様々なデータ構造を採用でき、生成、マージ、伝送、適用における効率がそれぞれ異なるため、異なるシナリオに適しています。

**1. In Filter**

JRFを実装する最も単純なアプローチは、In Filterの使用です。前の例を参考に、In Filterを使用する場合、実行エンジンは左テーブルに述語`o_custkey in (...セットA内の要素のリスト...)`を生成します。このInフィルタ条件は、ordersテーブルをフィルタリングするために適用できます。セットAの要素数が少ない場合、In Filterは効率的です。

しかし、セットAの要素数が多い場合、In Filterの使用は問題となります：

1. まず、In Filterの生成コストが高く、特にJRFマージが必要な場合です。異なるデータパーティションに対応するJoinノードから収集される値には重複が含まれる可能性があります。例えば、`c_custkey`がテーブルの主キーではない場合、`c001`や`c003`などの値が複数回現れる可能性があり、時間のかかる重複除去プロセスが必要になります。

2. 次に、セットAに多くの要素が含まれる場合、JoinノードとordersテーブルのScanノード間のデータ伝送コストが大きくなります。

3. 最後に、ordersテーブルのScanノードでのIn述語の実行にも時間がかかります。

これらの要因を考慮して、Bloom Filterを導入します。

**2. Bloom Filter**

Bloom Filterに馴染みのない方は、それを重ね合わされたハッシュテーブルのセットと考えることができます。フィルタリングにBloom Filter（またはハッシュテーブル）を使用することは、以下の特性を活用します：

- セットAに基づいてハッシュテーブルTが生成されます。要素がハッシュテーブルTに含まれていない場合、その要素がセットAに含まれていないと確実に結論付けることができます。しかし、その逆は真ではありません。

  したがって、`o_orderkey`がBloom Filterによってフィルタアウトされた場合、Joinの右側に一致する`c_custkey`がないと結論付けることができます。しかし、ハッシュ衝突により、一致する`c_custkey`がない場合でも、一部の`o_custkey`がBloom Filterを通過する可能性があります。

  Bloom Filterは精密なフィルタリングを実現できませんが、一定レベルのフィルタリング効果を提供します。

- ハッシュテーブルのバケット数がフィルタリングの精度を決定します。バケット数が多いほど、Filterはより大きく、より正確になりますが、生成、伝送、使用における計算オーバーヘッドが増加します。

  したがって、Bloom Filterのサイズは、フィルタリング効果と使用コストのバランスを取る必要があります。この目的のために、`RUNTIME_BLOOM_FILTER_MIN_SIZE`と`RUNTIME_BLOOM_FILTER_MAX_SIZE`によって定義される、Bloom Filterのサイズに対する設定可能な範囲を設けています。

**3. Min/Max Filter**

Bloom Filter以外にも、Min-Max Filterを近似フィルタリングに使用できます。データ列が順序付けられている場合、Min-Max Filterは優れたフィルタリング結果を実現できます。さらに、Min-Max Filterの生成、マージ、使用のコストは、In FilterやBloom Filterよりも大幅に低くなります。

非等価Joinの場合、In FilterとBloom Filterの両方が無効になりますが、Min-Max Filterは引き続き機能します。前の例のクエリを次のように変更したとします：

```sql
select count(*)
from orders join customer on o_custkey > c_custkey
where c_name = "China"
```
この場合、フィルタリングされた `c_custkey` の最大値を選択し、それを n として表し、orders テーブルの Scan ノードに渡すことができます。その後、Scan ノードは `o_custkey > n` である行のみを出力します。

### Join Runtime Filter の表示

特定のクエリに対してどの JRF（Join Runtime Filter）が生成されたかを確認するには、`explain`、`explain shape plan`、または `explain physical plan` コマンドを使用できます。

TPC-H Schema を例として、これら3つのコマンドを使用して JRF を表示する方法を詳しく説明します。

```sql
select count(*) from orders join customer on o_custkey=c_custkey;
```
**1. Explain**

従来のExplain出力では、JRF情報は通常JoinノードとScanノードに表示されます。以下の例に示すとおりです：

```sql
4: VHASH JOIN(258)  
| join op: INNER JOIN(PARTITIONED)[]  
|  equal join conjunct: (o_custkey[#10] = c_custkey[#0])  
|  runtime filters: RF000[bloom] <- c_custkey[#0] (150000000/134217728/16777216)  
|  cardinality=1,500,000,000  
|  vec output tuple id: 3  
|  output tuple id: 3  
|  vIntermediate tuple ids: 2  
|  hash output slot ids: 10  
|  final projections: o_custkey[#17]  
|  final project output tuple id: 3  
|  distribute expr lists: o_custkey[#10]
|  distribute expr lists: c_custkey[#0]  
|  
|---1: VEXCHANGE  
|      offset: 0  
|      distribute expr lists: c_custkey[#0]   
3: VEXCHANGE  
|  offset: 0  
|  distribute expr lists:  
  
PLAN FRAGMENT 2  
| PARTITION: HASH_PARTITIONED: o_orderkey[#8]  
| HAS_COLO_PLAN_NODE: false  
| STREAM DATA SINK  
|   EXCHANGE ID: 03  
|   HASH_PARTITIONED: o_custkey[#10]  
  
2: VOlapScanNode(242)  
|  TABLE: regression_test_nereids_tpch_shape_sf1000_p0.orders(orders)  
|  PREAGGREGATION: ON  
|  runtime filters: RF000[bloom] -> o_custkey[#10]  
|  partitions=1/1 (orders)  
|  tablets=96/96, tabletList=54990,54992,54994 ...  
|  cardinality=0, avgRowSize=0.0, numNodes=1  
|  pushAggOp=NONE
```
- Join Side: `runtime filters: RF000[bloom] <- c_custkey[#0] (150000000/134217728/16777216)`

  これは、ID 000のBloom Filterが生成され、`c_custkey`を入力として使用してJRFを作成することを示しています。後に続く3つの数値はBloom Filterのサイズ計算に関連しており、現在のところ無視できます。

- Scan Side: `runtime filters: RF000[bloom] -> o_custkey[#10]`

  これは、JRF 000がordersテーブルのScanノードに適用され、`o_custkey`フィールドをフィルタリングすることを示しています。

**2. Shape Planの説明**

Explain Planシリーズでは、JRFの確認方法を示すためにShape Planを例として使用します。

```sql
mysql> explain shape plan select count(*) from orders join customer on o_custkey=c_custkey where c_nationkey=5;  
+--------------------------------------------------------------------------------------------------------------------------+
Explain String(Nereids Planner)                                                                                            ｜
+--------------------------------------------------------------------------------------------------------------------------+
PhysicalResultSink                                                                                                         ｜  
--hashAgg[GLOBAL]                                                                                                          ｜  
----PhysicalDistribute[DistributionSpecGather]                                                                             ｜   
------hashAgg[LOCAL]                                                                                                       ｜ 
--------PhysicalProject                                                                                                    ｜
----------hashJoin[INNER_JOIN shuffle]                                                                                     ｜
------------hashCondition=((orders.o_custkey=customer.c_custkey)) otherCondition=() buildRFs:RF0 c_custkey->[o_custkey]    ｜  
--------------PhysicalProject                                                                                              ｜  
----------------Physical0lapScan[orders] apply RFs: RF0                                                                    ｜
--------------PhysicalProject                                                                                              ｜ 
----------------filter((customer.c_nationkey=5))                                                                           ｜ 
------------------Physical0lapScan[customer]                                                                               ｜
+--------------------------------------------------------------------------------------------------------------------------+
11 rows in set (0.02 sec)
```
上記に示すように：

- Join Side: `build RFs: RF0 c_custkey -> [o_custkey]`は、`c_custkey`データを使用してJRF 0が生成され、`o_custkey`に適用されることを示します。

- Scan Side: `PhysicalOlapScan[orders] apply RFs: RF0`は、ordersテーブルがJRF 0によってフィルタリングされることを示します。

**3. Profile**

実際の実行中、BEはJRF使用詳細をProfile（`set enable_profile=true`が必要）に出力します。同じSQLクエリを例として使用し、ProfileでJRF実行詳細を確認できます。

- Join Side

  ```sql
  HASH_JOIN_SINK_OPERATOR  (id=3  ,  nereids_id=367):(ExecTime:  703.905us)
        -  JoinType:  INNER_JOIN
        。。。
        -  BuildRows:  617
        。。。
        -  RuntimeFilterComputeTime:  70.741us
        -  RuntimeFilterInitTime:  10.882us
  ```
これはJoinのBuild側プロファイルです。この例では、617行の入力データでJRFの生成に70.741us かかりました。JRFのサイズとタイプはScan側に表示されます。

- Scan側

  ```sql
  OLAP_SCAN_OPERATOR  (id=2.  nereids_id=351.  table  name  =  orders(orders)):(ExecTime:  13.32ms)
              -  RuntimeFilters:  :  RuntimeFilter:  (id  =  0,  type  =  bloomfilter,  need_local_merge:  false,  is_broadcast:  true,  build_bf_cardinality:  false,  
              。。。
              -  RuntimeFilterInfo:  
                  -  filter  id  =  0  filtered:  714.761K  (714761)
                  -  filter  id  =  0  input:  747.862K  (747862)
              。。。
              -  WaitForRuntimeFilter:  6.317ms
            RuntimeFilter:  (id  =  0,  type  =  bloomfilter):
                  -  Info:  [IsPushDown  =  true,  RuntimeFilterState  =  READY,  HasRemoteTarget  =  false,  HasLocalTarget  =  true,  Ignored  =  false]
                  -  RealRuntimeFilterType:  bloomfilter
                  -  BloomFilterSize:  1024
  ```
注意:

  1. 5-6行は入力行数とフィルタされた行数を示しています。フィルタされた行数が多いほど、JRFの有効性が高いことを示します。
  
  2. 10行目の`IsPushDown = true`は、JRF計算がストレージレイヤーにプッシュダウンされたことを示し、遅延マテリアライゼーションによってIOの削減に役立ちます。
  
  3. 10行目の`RuntimeFilterState = READY`は、ScanノードがJRFを適用したかどうかを示します。JRFはtry-bestメカニズムを使用するため、JRF生成に時間がかかりすぎる場合、Scanノードは待機期間後にデータのスキャンを開始し、フィルタされていないデータを出力する可能性があります。
  
  4. 12行目の`BloomFilterSize: 1024`は、Bloom Filterのサイズをバイト単位で示しています。

### チューニング

Join Runtime Filterのチューニングについては、ほとんどの場合、機能は適応的であり、ユーザーが手動でチューニングする必要はありません。ただし、パフォーマンスを最適化するために行える調整がいくつかあります。

**1. JRFの有効化または無効化**

セッション変数`runtime_filter_mode`は、JRFが生成されるかどうかを制御します。

- JRFを有効にする: `set runtime_filter_mode = GLOBAL`

- JRFを無効にする: `set runtime_filter_mode = OFF`

**2. JRFタイプの設定**

セッション変数`runtime_filter_type`は、以下を含むJRFのタイプを制御します:

- `IN(1)`

- `BLOOM(2)`

- `MIN_MAX(4)`

- `IN_OR_BLOOM(8)`

`IN_OR_BLOOM` FilterはBEが実際のデータ行数に基づいて`IN` Filterまたは`BLOOM` Filterの生成を適応的に選択することを可能にします。

単一のJoin条件に対して複数のJRFタイプを生成するには、`runtime_filter_type`を対応する列挙値の合計に設定します。

例:

- 各Join条件に対して`BLOOM` Filterと`MIN_MAX` Filterの両方を生成する: `set runtime_filter_type = 6`

- バージョン2.1では、`runtime_filter_type`のデフォルト値は12で、`MIN_MAX` Filterと`IN_OR_BLOOM` Filterの両方を生成します。

括弧内の整数は、Runtime Filter Typesの列挙値を表します。

**3. 待機時間の設定**

前述の通り、JRFはTry-bestメカニズムを使用し、Scanノードは開始前にJRFを待機します。Dorisは実行時条件に基づいて待機時間を計算します。ただし、一部のケースでは、計算された待機時間が十分でない可能性があり、JRFが完全に有効でなくなり、Scanノードが期待よりも多くの行を出力する可能性があります。Profileセクションで説明したように、ScanノードのProfileで`RuntimeFilterState = false`の場合、ユーザーは手動でより長い待機時間を設定できます。

セッション変数`runtime_filter_wait_time_ms`は、ScanノードがJRFを待機する待機時間を制御します。デフォルト値は1000ミリ秒です。

**4. JRFのプルーニング**

一部のケースでは、JRFがフィルタリング効果を提供しない場合があります。例えば、`orders`テーブルと`customer`テーブルに主キー-外部キー関係があるが、`customer`テーブルにフィルタリング条件がない場合、JRFへの入力はすべての`custkeys`となり、`orders`テーブルのすべての行がJRFを通過できます。オプティマイザーは列統計に基づいて無効なJRFをプルーニングします。

セッション変数`enable_runtime_filter_prune = true/false`は、プルーニングが実行されるかどうかを制御します。デフォルト値は`true`です。

## TopN Runtime Filter

### 原理

Dorisでは、データはブロックストリーミング方式で処理されます。そのため、SQL文に`topN`オペレーターが含まれている場合、Dorisはすべての結果を計算するのではなく、代わりに動的フィルターを生成してデータを早期に事前フィルタリングします。

例として、次のSQL文を考えてみましょう:

```sql
select o_orderkey from orders order by o_orderdate limit 5;
```
このSQL文の実行計画を以下に示します：

```sql
mysql> explain select o_orderkey from orders order by o_orderdate limit 5;
+-----------------------------------------------------+
| Explain String(Nereids Planner)                     |
+-----------------------------------------------------+
| PLAN FRAGMENT 0                                     |
|   OUTPUT EXPRS:                                     |
|     o_orderkey[#11]                                 |
|   PARTITION: UNPARTITIONED                          |
|                                                     |
|   HAS_COLO_PLAN_NODE: false                         |
|                                                     |
|   VRESULT SINK                                      |
|      MYSQL_PROTOCAL                                 |
|                                                     |
|   2:VMERGING-EXCHANGE                               |
|      offset: 0                                      |
|      limit: 5                                       |
|      final projections: o_orderkey[#9]              |
|      final project output tuple id: 2               |
|      distribute expr lists:                         |
|                                                     |
| PLAN FRAGMENT 1                                     |
|                                                     |
|   PARTITION: HASH_PARTITIONED: O_ORDERKEY[#0]       |
|                                                     |
|   HAS_COLO_PLAN_NODE: false                         |
|                                                     |
|   STREAM DATA SINK                                  |
|     EXCHANGE ID: 02                                 |
|     UNPARTITIONED                                   |
|                                                     |
|   1:VTOP-N(119)                                     |
|   |  order by: o_orderdate[#10] ASC                 |
|   |  TOPN OPT                                       |
|   |  offset: 0                                      |
|   |  limit: 5                                       |
|   |  distribute expr lists: O_ORDERKEY[#0]          |
|   |                                                 |
|   0:VOlapScanNode(113)                              |
|      TABLE: tpch.orders(orders), PREAGGREGATION: ON |
|      TOPN OPT:1                                     |
|      partitions=1/1 (orders)                        |
|      tablets=3/3, tabletList=135112,135114,135116   |
|      cardinality=150000, avgRowSize=0.0, numNodes=1 |
|      pushAggOp=NONE                                 |
+-----------------------------------------------------+
41 rows in set (0.06 sec)
```
`topn filter`がない場合、scanノードは`orders`テーブルから各データブロックを順次読み取り、TopNノードに渡します。TopNノードはヒープソートを通じて`orders`テーブルから現在の上位5行を維持します。

データブロックは通常約1024行を含むため、TopNノードは最初のデータブロックを処理した後、その中で5番目にランクされた行を特定できます。

この`o_orderdate`が`1995-01-01`であると仮定すると、scanノードは2番目のデータブロックを出力する際に`1995-01-01`をフィルタ条件として使用でき、`o_orderdate`が`1995-01-01`より大きい行をTopNノードに送信してさらに処理する必要がなくなります。

この閾値は動的に更新されます。例えば、TopNノードが2番目のフィルタリングされたデータブロックを処理する際により小さい`o_orderdate`を発見した場合、最初の2つのデータブロックの中で5番目にランクされた`o_orderdate`に閾値を更新します。

### TopN Runtime Filterの表示

Explainコマンドを使用して、オプティマイザーによって計画されたTopN Runtime Filterを調査できます。

```sql
1:VTOP-N(119)
| order by: o_orderdate[#10] ASC  
| TOPN OPT  
| offset: 0
| limit: 5  
| distribute expr lists: O_ORDERKEY[#0]  
|
 
0:VLapScanNode[113]  
    TABLE: regression_test_nereids_tpch_p0.(orders), PREAGGREGATION: ON  
    TOPN OPT: 1  
    partitions=1/1 (orders)  
    tablets=3/3, tabletList=135112,135114,135116  
    cardinality=150000, avgRowSize=0.0, numNodes=1  
    pushAggOp: NONE
```
上記の例に示されているように：

1. TopNノードは`TOPN OPT`を表示し、このTopNノードがTopN Runtime Filterを生成することを示しています。

2. ScanノードはどのTopNノードが使用するTopN Runtime Filterを生成するかを示します。例えば、この例では、11行目は`orders`テーブルのScanノードがTopNノード1によって生成されたRuntime Filterを使用することを示しており、プランでは`TOPN OPT: 1`として表示されています。

分散データベースとして、DorisはTopNノードとScanノードが実際に実行される物理マシンを考慮します。BE間通信のコストが高いため、BEはTopN Runtime Filterを使用するかどうか、またどの程度使用するかを適応的に決定します。現在、TopNとScanが同じBE上に存在するBEレベルのTopN Runtime Filterを実装しています。これは、TopN Runtime Filterの閾値の更新にはスレッド間通信のみが必要で、比較的コストが安いためです。

### チューニング

セッション変数`topn_filter_ratio`はTopN Runtime Filterを生成するかどうかを制御します。

SQLの`limit`句で指定される行数が少ないほど、TopN Runtime Filterのフィルタリング効果が強くなります。そのため、デフォルトでは、Dorisは`limit`の数がテーブル内のデータの半分未満の場合にのみ、対応するTopN Runtime Filterの生成を有効にします。

例えば、`set topn_filter_ratio=0`と設定すると、次のクエリに対してTopN Runtime Filterの生成が阻止されます：

```sql
select o_orderkey from orders order by o_orderdate limit 20;
```
