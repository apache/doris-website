---
{
  "title": "ランタイムフィルタ",
  "language": "ja",
  "description": "Runtime Filterは主に2つのタイプで構成されます：Join Runtime FilterとTopN Runtime Filterです。"
}
---
Runtime Filterは主にJoin Runtime FilterとTopN Runtime Filterの2つのタイプで構成されています。この記事では、これら2つのタイプのRuntime Filterの動作原理、使用ガイドライン、およびチューニング方法について詳しく説明します。

## Join Runtime Filter

Join Runtime Filter（以下JRFと呼ぶ）は、Join条件を活用して、実行時データに基づいてJoinノードで動的にフィルターを生成する最適化技術です。この技術は、Join Probeのサイズを削減するだけでなく、データI/Oやネットワーク伝送を効果的に最小化します。

### 原理

TPC-H Schemaに見られるものと類似したJoin操作を使用して、JRFの動作原理を説明しましょう。

データベースに2つのテーブルがあると仮定します：

- Ordersテーブル：1億行のデータを含み、注文キー（`o_orderkey`）、顧客キー（`o_custkey`）、およびその他の注文情報を記録します。

- Customerテーブル：10万行のデータを含み、顧客キー（`c_custkey`）、顧客の国（`c_nation`）、およびその他の顧客情報を記録します。このテーブルは25か国の顧客を記録しており、1か国あたり約4,000人の顧客がいます。

中国の顧客からの注文数をカウントするためのクエリ文は次のようになります：

```sql
select count(*)
from orders join customer on o_custkey = c_custkey
where c_nation = "china"
```
このクエリの実行計画の主要コンポーネントはJoinです。以下に示すとおりです：

![Join Runtime Filter](/images/join-runtime-filter-1.jpg)

JRFなし：Scanノードがordersテーブルをスキャンし、1億行のデータを読み取ります。その後、Joinノードがこれらの1億行に対してHash Probeを実行し、Join結果を生成します。

**1. 最適化**

フィルタ条件`c_nation = 'china'`は中国以外の顧客をすべて除外するため、customerテーブルの一部（約1/25）のみがJoinに関与します。その後のJoin条件`o_custkey = c_custkey`を考慮すると、フィルタ結果で選択された`c_custkey`値に注目する必要があります。フィルタされた`c_custkey`値をセットAとします。以下のテキストでは、セットAを具体的にJoinに参加する`c_custkey`セットを指すために使用します。

セットAをIN条件としてordersテーブルにプッシュダウンすると、ordersテーブルのScanノードは対応するordersをフィルタできます。これは、フィルタ条件`o_custkey IN (c001, c003)`を追加することに似ています。

この最適化のコンセプトに基づいて、SQLは以下のように最適化できます：

```sql
select count(*)
from orders join customer on o_custkey = c_custkey
where c_nation = "china" and o_custkey in (c001, c003)
```
最適化された実行計画を以下に示します:

![join-runtime-filter-2](/images/join-runtime-filter-2.jpg)

ordersテーブルにフィルター条件を追加することで、Joinに参加する実際の注文数が1億件から40万件に削減され、クエリ速度が大幅に向上します。

**2. 実装**

上記で説明した最適化は重要ですが、オプティマイザーは実際に選択される`c_custkey`の値（集合A）を知らないため、最適化フェーズ中に固定のin述語フィルター演算子を静的に生成することができません。

実際のアプリケーションでは、Joinノードで右側のデータを収集し、実行時に集合Aを生成し、集合AをordersテーブルのScanノードにプッシュダウンします。通常、このJRFを`RF(c_custkey -> [o_custkey])`と表記します。

DorisはDistributedデータベースであるため、JRFは分散シナリオに対応するために追加のマージステップが必要です。例のJoinがShuffle Joinであると仮定すると、このJoinの複数のインスタンスがordersテーブルとcustomerテーブルの個々のシャードを処理します。その結果、各Joinインスタンスは集合Aの一部のみを取得します。

現在のバージョンのDorisでは、Runtime Filter Managerとして機能するノードを選択します。各Joinインスタンスは、そのシャード内の`c_custkey`値に基づいてPartial JRFを生成し、それをManagerに送信します。Managerはすべての Partial JRFを収集し、それらをGlobal JRFにマージし、次にGlobal JRFをordersテーブルのすべてのScanインスタンスに送信します。

Global JRFを生成するプロセスを以下に示します:

![Global JRF](/images/global-JRF.jpg)

### フィルタータイプ

JRF（Join Runtime Filter）の実装に使用できるさまざまなデータ構造があり、それぞれ生成、マージ、送信、適用における効率が異なるため、異なるシナリオに適しています。

**1. In Filter**

JRFを実装する最もシンプルなアプローチは、In Filterの使用です。前の例を例に取ると、In Filterを使用する場合、実行エンジンは左側のテーブルに対して述語`o_custkey in (...集合A内の要素のリスト...)`を生成します。このInフィルター条件は、ordersテーブルをフィルタリングするために適用できます。集合A内の要素数が少ない場合、In Filterは効率的です。

しかし、集合A内の要素数が多い場合、In Filterの使用は問題となります:

1. まず、In Filterの生成コストが高く、特にJRFマージが必要な場合です。異なるデータパーティションに対応するJoinノードから収集された値には重複が含まれる可能性があります。例えば、`c_custkey`がテーブルの主キーでない場合、`c001`や`c003`などの値が複数回出現する可能性があり、時間のかかる重複除去プロセスが必要になります。

2. 次に、集合Aに多くの要素が含まれる場合、JoinノードとordersテーブルのScanノード間でのデータ送信コストが大きくなります。

3. 最後に、ordersテーブルのScanノードでIn述語を実行することも時間がかかります。

これらの要因を考慮して、Bloom Filterを導入します。

**2. Bloom Filter**

Bloom Filterに馴染みのない方は、それを重ね合わされたハッシュテーブルのセットと考えることができます。フィルタリングにBloom Filter（またはハッシュテーブル）を使用することは、以下の特性を活用します:

- 集合Aに基づいてハッシュテーブルTが生成されます。要素がハッシュテーブルTに存在しない場合、その要素が集合Aに存在しないと確実に結論できます。しかし、その逆は真ではありません。

  したがって、`o_orderkey`がBloom Filterによってフィルタリングされた場合、Joinの右側に一致する`c_custkey`が存在しないと結論できます。それにもかかわらず、ハッシュ衝突のため、一致する`c_custkey`が存在しない場合でも、一部の`o_custkey`がBloom Filterを通過する可能性があります。

  Bloom Filterは精密なフィルタリングを実現できませんが、それでも一定レベルのフィルタリング効果を提供します。

- ハッシュテーブル内のバケット数がフィルタリングの精度を決定します。バケット数が多いほど、Filterは大きくより正確になりますが、生成、送信、使用における計算オーバーヘッドが増加するという代償があります。

  したがって、Bloom Filterのサイズは、フィルタリング効果と使用コストのバランスを取る必要があります。この目的のため、`RUNTIME_BLOOM_FILTER_MIN_SIZE`と`RUNTIME_BLOOM_FILTER_MAX_SIZE`によって定義される、Bloom Filterのサイズの設定可能な範囲を設けています。

**3. Min/Max Filter**

Bloom Filterに加えて、Min-Max Filterも近似フィルタリングに使用できます。データ列が順序付けられている場合、Min-Max Filterは優れたフィルタリング結果を実現できます。さらに、Min-Max Filterの生成、マージ、使用のコストは、In FilterやBloom Filterよりもはるかに低くなります。

非等価Joinの場合、In FilterとBloom Filterの両方が無効になりますが、Min-Max Filterは依然として機能します。前の例のクエリを以下のように変更したとします:

```sql
select count(*)
from orders join customer on o_custkey > c_custkey
where c_name = "China"
```
この場合、フィルタリングされた`c_custkey`の最大値を選択し、それをnとして表記し、ordersテーブルのScanノードに渡すことができます。そうすると、Scanノードは`o_custkey > n`である行のみを出力します。

### Join Runtime Filterの表示

特定のクエリに対してどのJRF（Join Runtime Filter）が生成されたかを確認するには、`explain`、`explain shape plan`、または`explain physical plan`コマンドを使用できます。

TPC-H Schemaを例として、これら3つのコマンドを使用してJRFを表示する方法を詳しく説明します。

```sql
select count(*) from orders join customer on o_custkey=c_custkey;
```
**1. Explain**

従来のExplain出力では、JRF情報は通常、以下の例に示すようにJoinノードとScanノードに表示されます：

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

  これは、ID 000のBloom Filterが生成され、`c_custkey`を入力として使用してJRFを作成することを示しています。後に続く3つの数値はBloom Filterのサイズ計算に関連しており、現時点では無視できます。

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

- Join Side: `build RFs: RF0 c_custkey -> [o_custkey]` は、JRF 0が`c_custkey`データを使用して生成され、`o_custkey`に適用されることを示しています。

- Scan Side: `PhysicalOlapScan[orders] apply RFs: RF0` は、ordersテーブルがJRF 0によってフィルタリングされることを示しています。

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
これはJoinのBuild側プロファイルです。この例では、617行の入力データでJRFの生成に70.741us要しました。JRFのサイズとタイプはScan側に表示されます。

- Scan Side

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
注意：

  1. 行 5-6 は入力行数とフィルタリングされた行数を示しています。フィルタリングされた行数が多いほど、JRF の効果が高いことを示します。
  
  2. 行 10、`IsPushDown = true` は、JRF の計算がストレージ層にプッシュダウンされていることを示しており、これは遅延マテリアライゼーションによって IO を削減するのに役立ちます。
  
  3. 行 10、`RuntimeFilterState = READY` は、Scan ノードが JRF を適用したかどうかを示します。JRF は try-best メカニズムを使用するため、JRF の生成に時間がかかりすぎる場合、Scan ノードは待機期間後にデータのスキャンを開始し、フィルタリングされていないデータを出力する可能性があります。
  
  4. 行 12、`BloomFilterSize: 1024` は、Bloom Filter のサイズをバイト単位で示しています。

### チューニング

Join Runtime Filter のチューニングについて、ほとんどの場合、この機能は適応的であり、ユーザーが手動でチューニングする必要はありません。ただし、パフォーマンスを最適化するために行うことができるいくつかの調整があります。

**1. JRF の有効化または無効化**

セッション変数 `runtime_filter_mode` は、JRF が生成されるかどうかを制御します。

- JRF を有効にする: `set runtime_filter_mode = GLOBAL`

- JRF を無効にする: `set runtime_filter_mode = OFF`

**2. JRF タイプの設定**

セッション変数 `runtime_filter_type` は、JRF のタイプを制御し、以下が含まれます：

- `IN(1)`

- `BLOOM(2)`

- `MIN_MAX(4)`

- `IN_OR_BLOOM(8)`

`IN_OR_BLOOM` Filter は、実際のデータ行数に基づいて `IN` Filter または `BLOOM` Filter の生成を適応的に選択することを BE に許可します。

単一の Join 条件に対して複数の JRF タイプを生成するには、`runtime_filter_type` を対応する列挙値の合計に設定します。

例：

- 各 Join 条件に対して `BLOOM` Filter と `MIN_MAX` Filter の両方を生成する: `set runtime_filter_type = 6`

- バージョン 2.1 では、`runtime_filter_type` のデフォルト値は 12 で、`MIN_MAX` Filter と `IN_OR_BLOOM` Filter の両方を生成します。

括弧内の整数は、Runtime Filter Types の列挙値を表します。

**3. 待機時間の設定**

前述のように、JRF は Try-best メカニズムを使用し、Scan ノードは開始前に JRF を待機します。Doris は実行時条件に基づいて待機時間を計算します。ただし、場合によっては、計算された待機時間が十分でない可能性があり、JRF が完全に効果的でない結果となり、Scan ノードは予想よりも多くの行を出力する場合があります。Profile セクションで説明したように、Scan ノードの Profile で `RuntimeFilterState = false` の場合、ユーザーは手動でより長い待機時間を設定できます。

セッション変数 `runtime_filter_wait_time_ms` は、Scan ノードが JRF を待機する待機時間を制御します。デフォルト値は 1000 ミリ秒です。

**4. JRF の枝刈り**

場合によっては、JRF がフィルタリングの利益を提供しない可能性があります。例えば、`orders` と `customer` テーブルが主外部キー関係を持っているが、`customer` テーブルにフィルタリング条件がない場合、JRF への入力はすべての `custkeys` となり、`orders` テーブルのすべての行が JRF を通過することを許可します。オプティマイザーは、列統計に基づいて非効率な JRF を枝刈りします。

セッション変数 `enable_runtime_filter_prune = true/false` は、枝刈りが実行されるかどうかを制御します。デフォルト値は `true` です。

## TopN Runtime Filter

### 原理

Doris では、データはブロックストリーミング方式で処理されます。したがって、SQL 文に `topN` 演算子が含まれている場合、Doris はすべての結果を計算するのではなく、代わりに動的フィルターを生成して早期にデータを事前フィルタリングします。

例として、以下の SQL 文を考えてみましょう：

```sql
select o_orderkey from orders order by o_orderdate limit 5;
```
このSQL文の実行プランを以下に示します：

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
`topn filter`がない場合、scan nodeは`orders`テーブルから各データブロックを順次読み取り、TopN nodeに渡します。TopN nodeは、ヒープソートを通じて`orders`テーブルから現在のトップ5行を維持します。

データブロックは通常約1024行を含むため、TopN nodeは最初のデータブロックを処理した後、そのブロック内で5位にランクされた行を特定できます。

この`o_orderdate`が`1995-01-01`であると仮定すると、scan nodeは2番目のデータブロックを出力する際に`1995-01-01`をフィルタ条件として使用し、`o_orderdate`が`1995-01-01`より大きい行をTopN nodeに送信してさらなる処理を行う必要がなくなります。

この閾値は動的に更新されます。例えば、TopN nodeが2番目のフィルタリングされたデータブロックを処理する際により小さい`o_orderdate`を発見した場合、最初の2つのデータブロック間で5位にランクされた`o_orderdate`に閾値を更新します。

### TopN Runtime Filterの表示

Explainコマンドを使用して、オプティマイザによって計画されたTopN Runtime Filterを検査できます。

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
上記の例で示されているように：

1. TopNノードは`TOPN OPT`を表示し、このTopNノードがTopN Runtime Filterを生成することを示しています。

2. ScanノードはどのTopNノードが使用するTopN Runtime Filterを生成するかを示します。例えば、この例では11行目で、`orders`テーブルのScanノードがTopNノード1によって生成されたRuntime Filterを使用することを示しており、プランでは`TOPN OPT: 1`として表示されています。

分散データベースとして、DorisはTopNノードとScanノードが実際に動作する物理マシンを考慮します。BE間通信のコストが高いため、BEはTopN Runtime Filterを使用するかどうか、またどの程度使用するかを適応的に決定します。現在、TopNとScanが同じBE上に存在するBEレベルのTopN Runtime Filterを実装しています。これは、TopN Runtime Filterの閾値の更新にはスレッド間通信のみが必要で、比較的コストが低いためです。

### チューニング

セッション変数`topn_filter_ratio`は、TopN Runtime Filterを生成するかどうかを制御します。

SQLの`limit`句で指定される行数が少ないほど、TopN Runtime Filterのフィルタリング効果が強くなります。そのため、デフォルトでは、Dorisは`limit`数がテーブル内のデータの半分未満の場合にのみ、対応するTopN Runtime Filterの生成を有効にします。

例えば、`set topn_filter_ratio=0`を設定すると、以下のクエリに対してTopN Runtime Filterの生成が阻止されます：

```sql
select o_orderkey from orders order by o_orderdate limit 20;
```
