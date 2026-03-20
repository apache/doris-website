---
{
  "title": "ランタイムフィルター",
  "description": "Runtime Filterは主に2つのタイプで構成されています：Join Runtime FilterとTopN Runtime Filterです。",
  "language": "ja"
}
---
Runtime Filterは主にJoin Runtime FilterとTopN Runtime Filterの2つの種類で構成されます。本記事では、これら2種類のRuntime Filterの動作原理、使用ガイドライン、チューニング方法について詳細に説明します。

## Join Runtime Filter

Join Runtime Filter（以下JRFと呼ぶ）は、Join条件を活用して、ランタイムデータに基づいてJoinノードで動的にフィルタを生成する最適化技術です。この技術は、Join Probeのサイズを削減するだけでなく、データI/Oとネットワーク転送を効果的に最小化します。

### 原理

TPC-H Schemaにあるようなjoin操作を使用して、JRFの動作原理を説明しましょう。

データベースに2つのtableがあると仮定します：

- Orders table：1億行のデータを含み、注文キー（`o_orderkey`）、顧客キー（`o_custkey`）、その他の注文情報を記録しています。

- Customer table：10万行のデータを含み、顧客キー（`c_custkey`）、顧客の国（`c_nation`）、その他の顧客情報を記録しています。このtableには25か国の顧客が記録されており、1か国につき約4,000人の顧客がいます。

中国の顧客からの注文数を数えるために、クエリ文は次のようになります：

```sql
select count(*)
from orders join customer on o_custkey = c_custkey
where c_nation = "china"
```
このクエリの実行プランの主要なコンポーネントはJoinです。以下に図示します：

![Join Runtime Filter](/images/join-runtime-filter-1.jpg)

JRFなし：ScanノードがordersTableをスキャンし、1億行のデータを読み取ります。その後、Joinノードがこれらの1億行に対してHash Probeを実行してJoin結果を生成します。

**1. 最適化**

フィルタ条件`c_nation = 'china'`により、中国以外の顧客がすべて除外されるため、customerTableの一部分（約1/25）のみがJoinに関与します。後続のJoin条件`o_custkey = c_custkey`を考慮すると、フィルタ結果で選択された`c_custkey`値に注目する必要があります。フィルタされた`c_custkey`値を集合Aとして表します。以下のテキストでは、集合AはJoinに参加する`c_custkey`の集合を特に指すものとして使用します。

集合AをIN条件としてordersTableにプッシュダウンした場合、ordersTableのScanノードはそれに応じてordersをフィルタできます。これは、フィルタ条件`o_custkey IN (c001, c003)`を追加することと同様です。

この最適化の概念に基づいて、SQLは以下のように最適化できます：

```sql
select count(*)
from orders join customer on o_custkey = c_custkey
where c_nation = "china" and o_custkey in (c001, c003)
```
最適化された実行計画を以下に示します：

![join-runtime-filter-2](/images/join-runtime-filter-2.jpg)

ordersTableにフィルタ条件を追加することで、Joinに参加する実際の注文数が1億件から40万件に削減され、クエリ速度が大幅に向上します。

**2. 実装**

上記で説明した最適化は重要ですが、オプティマイザーは選択される実際の`c_custkey`値（セットA）を知らないため、最適化フェーズ中に固定のin-predicate filterオペレータを静的に生成することはできません。

実際のアプリケーションでは、Joinノードで右側のデータを収集し、実行時にセットAを生成し、セットAをordersTableのScanノードにプッシュダウンします。通常、このJRFを`RF(c_custkey -> [o_custkey])`と表記します。

Dorisは分散データベースであるため、JRFは分散シナリオに対応するため追加のマージステップが必要です。例のJoinがShuffle Joinであると仮定すると、このJoinの複数のインスタンスがordersTableとcustomerTableの個々のシャードを処理します。そのため、各JoinインスタンスはセットAの一部のみを取得します。

現在のバージョンのDorisでは、Runtime Filter Managerとして機能するノードを選択します。各Joinインスタンスは、そのシャード内の`c_custkey`値に基づいてPartial JRFを生成し、それをManagerに送信します。ManagerはすべてのPartial JRFを収集してGlobal JRFにマージし、その後Global JRFをordersTableのすべてのScanインスタンスに送信します。

Global JRFの生成プロセスを以下に示します：

![Global JRF](/images/global-JRF.jpg)

### フィルタタイプ

JRF（Join Runtime Filter）を実装するために使用できるさまざまなデータ構造があり、それぞれ生成、マージ、送信、適用における効率性が異なり、異なるシナリオに適しています。

**1. In Filter**

JRFを実装する最もシンプルなアプローチは、In Filterの使用です。前の例を使用して、In Filterを使用する場合、実行エンジンは左側のTableで述語`o_custkey in (...セットA内の要素のリスト...)`を生成します。このIn filterの条件を適用してordersTableをフィルタできます。セットA内の要素数が少ない場合、In Filterは効率的です。

しかし、セットA内の要素数が多い場合、In Filterの使用は問題となります：

1. まず、In Filterの生成コストが高く、特にJRFマージが必要な場合です。異なるデータパーティションに対応するJoinノードから収集された値には重複が含まれる可能性があります。例えば、`c_custkey`がTableの主キーでない場合、`c001`や`c003`のような値が複数回出現する可能性があり、時間のかかる重複排除プロセスが必要になります。

2. 次に、セットAに多くの要素が含まれている場合、JoinノードとordersTableのScanノード間でのデータ送信コストが大きくなります。

3. 最後に、ordersTableのScanノードでIn述語を実行するのにも時間がかかります。

これらの要因を考慮して、Bloom Filterを導入します。

**2. Bloom Filter**

Bloom Filterに馴染みのない方は、重ね合わせたハッシュTableのセットと考えることができます。フィルタリングにBloom Filter（またはハッシュTable）を使用すると、以下の特性を活用できます：

- セットAに基づいてハッシュTableTが生成されます。要素がハッシュTableTにない場合、その要素がセットAにないことを確実に結論付けることができます。しかし、その逆は成り立ちません。

  したがって、`o_orderkey`がBloom Filterによってフィルタリングされた場合、Joinの右側に一致する`c_custkey`がないと結論付けることができます。しかし、ハッシュ衝突のため、一致する`c_custkey`がない場合でも、一部の`o_custkey`がBloom Filterを通過する可能性があります。

  Bloom Filterは正確なフィルタリングを実現できませんが、それでも一定レベルのフィルタリング効果を提供します。

- ハッシュTable内のバケット数がフィルタリングの精度を決定します。バケット数が多いほど、Filterはより大きく、より正確になりますが、生成、送信、使用における計算オーバーヘッドの増加というコストがかかります。

  したがって、Bloom Filterのサイズは、フィルタリング効果と使用コストの間のバランスを取る必要があります。この目的のため、`RUNTIME_BLOOM_FILTER_MIN_SIZE`と`RUNTIME_BLOOM_FILTER_MAX_SIZE`によって定義される、Bloom Filterのサイズに対する設定可能な範囲を設定しました。

**3. Min/Max Filter**

Bloom Filterに加えて、Min-Max Filterも近似フィルタリングに使用できます。データ列が順序付けられている場合、Min-Max Filterは優れたフィルタリング結果を実現できます。さらに、Min-Max Filterの生成、マージ、使用のコストは、In FilterやBloom Filterのコストよりも大幅に低くなります。

非等価Joinの場合、In FilterとBloom Filterの両方が無効になりますが、Min-Max Filterは依然として機能できます。前の例のクエリを以下のように変更したとします：

```sql
select count(*)
from orders join customer on o_custkey > c_custkey
where c_name = "China"
```
この場合、フィルター処理された`c_custkey`の最大値を選択し、それをnとして表記し、ordersTableのScanノードに渡すことができます。そうすると、Scanノードは`o_custkey > n`の行のみを出力します。

### Join Runtime Filterの表示

特定のクエリに対してどのJRF（Join Runtime Filter）が生成されたかを確認するには、`explain`、`explain shape plan`、または`explain physical plan`コマンドを使用できます。

TPC-Hスキーマを例として、これら3つのコマンドを使用してJRFを表示する方法を詳しく説明します。

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

  これは、ID 000のBloom Filterが生成されており、`c_custkey`を入力として使用してJRFを作成していることを示しています。続く3つの数値はBloom Filterのサイズ計算に関連するものであり、現時点では無視して構いません。

- Scan Side: `runtime filters: RF000[bloom] -> o_custkey[#10]`

  これは、JRF 000がordersTableのScanノードに適用され、`o_custkey`フィールドをフィルタリングすることを示しています。

**2. Shape Planの説明**

Explain Planシリーズでは、JRFの表示方法を示す例としてShape Planを使用します。

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

- Join Side: `build RFs: RF0 c_custkey -> [o_custkey]`は、JRF 0が`c_custkey`データを使用して生成され、`o_custkey`に適用されることを示しています。

- Scan Side: `PhysicalOlapScan[orders] apply RFs: RF0`は、ordersTableがJRF 0によってフィルタリングされることを示しています。

**3. Profile**

実際の実行中、BEはJRF使用の詳細をProfile（`set enable_profile=true`が必要）に出力します。同じSQLクエリを例として、ProfileでJRF実行の詳細を確認できます。

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
これはJoinのBuild側のプロファイルです。この例では、617行の入力データでJRFの生成に70.741us要しました。JRFのサイズと種類はScan側に表示されます。

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
注意:

  1. 5-6行目は入力行数とフィルタされた行数を示します。フィルタされた行数が多いほど、JRFの効果が高いことを示します。
  
  2. 10行目の `IsPushDown = true` は、JRF計算がストレージ層にプッシュダウンされていることを示し、これにより遅延マテリアライゼーションを通じてIOを削減できます。
  
  3. 10行目の `RuntimeFilterState = READY` は、ScanノードがJRFを適用したかどうかを示します。JRFはベストエフォート機構を使用するため、JRF生成に時間がかかりすぎる場合、Scanノードは待機期間後にデータのスキャンを開始し、フィルタされていないデータを出力する可能性があります。
  
  4. 12行目の `BloomFilterSize: 1024` は、Bloom Filterのサイズをバイト単位で示します。

### チューニング

Join Runtime Filterのチューニングにおいて、ほとんどの場合、機能は適応的であり、ユーザーが手動でチューニングする必要はありません。ただし、パフォーマンスを最適化するためにいくつかの調整を行うことができます。

**1. JRFの有効化または無効化**

セッション変数 `runtime_filter_mode` は、JRFが生成されるかどうかを制御します。

- JRFを有効にする: `set runtime_filter_mode = GLOBAL`

- JRFを無効にする: `set runtime_filter_mode = OFF`

**2. JRFタイプの設定**

セッション変数 `runtime_filter_type` は、以下を含むJRFのタイプを制御します:

- `IN(1)`

- `BLOOM(2)`

- `MIN_MAX(4)`

- `IN_OR_BLOOM(8)`

`IN_OR_BLOOM` FilterはBEが実際のデータ行数に基づいて `IN` Filterまたは `BLOOM` Filterの生成を適応的に選択することを可能にします。

単一のJoin条件に対して複数のJRFタイプを生成するには、対応する列挙値の合計に `runtime_filter_type` を設定します。

例えば:

- 各Join条件に対して `BLOOM` Filterと `MIN_MAX` Filterの両方を生成する: `set runtime_filter_type = 6`

- バージョン2.1では、`runtime_filter_type` のデフォルト値は12で、`MIN_MAX` Filterと `IN_OR_BLOOM` Filterの両方を生成します。

括弧内の整数は、Runtime Filter Typesの列挙値を表します。

**3. 待機時間の設定**

前述のように、JRFはベストエフォート機構を使用し、ScanノードはJRFを待ってから開始します。Dorisは実行時の条件に基づいて待機時間を計算します。ただし、場合によっては、計算された待機時間が十分でない可能性があり、その結果JRFが完全に効果的でなくなり、Scanノードが予想よりも多くの行を出力する可能性があります。Profileセクションで説明されているように、ScanノードのProfileで `RuntimeFilterState = false` の場合、ユーザーは手動でより長い待機時間を設定できます。

セッション変数 `runtime_filter_wait_time_ms` は、ScanノードがJRFを待つ待機時間を制御します。デフォルト値は1000ミリ秒です。

**4. JRFのプルーニング**

場合によっては、JRFがフィルタリング効果を提供しない可能性があります。例えば、`orders` Tableと `customer` Tableが主外部キー関係にあるが、`customer` Tableにフィルタリング条件がない場合、JRFへの入力はすべての `custkeys` となり、`orders` Tableのすべての行がJRFを通過することを可能にします。オプティマイザは列統計に基づいて効果のないJRFをプルーニングします。

セッション変数 `enable_runtime_filter_prune = true/false` は、プルーニングが実行されるかどうかを制御します。デフォルト値は `true` です。

## TopN Runtime Filter

### 原理

Dorisでは、データはブロックストリーミング方式で処理されます。そのため、SQL文が `topN` オペレータを含む場合、Dorisはすべての結果を計算するのではなく、代わりに動的フィルタを生成して早期にデータを事前フィルタリングします。

次のSQL文を例として考えてみましょう:

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
`topn filter`がない場合、scanノードは`orders`Tableから各データブロックを順次読み取り、TopNノードに渡します。TopNノードはヒープソートを通じて`orders`Tableから現在の上位5行を維持します。

データブロックには通常約1024行が含まれているため、TopNノードは最初のデータブロックを処理した後、そのブロック内で5番目にランクされた行を特定できます。

この`o_orderdate`が`1995-01-01`であると仮定すると、scanノードは2番目のデータブロックを出力する際に`1995-01-01`をフィルター条件として使用でき、`o_orderdate`が`1995-01-01`より大きい行をTopNノードに送信してさらに処理する必要がなくなります。

この閾値は動的に更新されます。例えば、TopNノードが2番目のフィルタリングされたデータブロックを処理する際により小さい`o_orderdate`を発見した場合、最初の2つのデータブロックの中で5番目にランクされた`o_orderdate`に閾値を更新します。

### TopN Runtime Filterの確認

Explainコマンドを使用して、オプティマイザーによって計画されたTopN Runtime Filterを確認できます。

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
上記の例に示すように：

1. TopNノードは`TOPN OPT`を表示し、このTopNノードがTopN Runtime Filterを生成することを示しています。

2. ScanノードはどのTopNノードが使用するTopN Runtime Filterを生成するかを示します。例えば、この例では11行目で`orders`TableのScanノードがTopNノード1によって生成されたRuntime Filterを使用することを示し、プランでは`TOPN OPT: 1`として表示されます。

分散データベースとして、DorisはTopNノードとScanノードが実際に動作する物理マシンを考慮します。BE間通信のコストが高いため、BEはTopN Runtime Filterを使用するかどうか、どの程度使用するかを適応的に決定します。現在、TopNとScanが同一BE上に存在するBEレベルのTopN Runtime Filterを実装しています。これは、TopN Runtime Filterの閾値を更新するにはスレッド間通信のみが必要で、比較的低コストだからです。

### チューニング

セッション変数`topn_filter_ratio`は、TopN Runtime Filterを生成するかどうかを制御します。

SQLの`limit`句で指定される行数が少ないほど、TopN Runtime Filterのフィルタリング効果は強くなります。そのため、デフォルトでは、Dorisは`limit`数がTable内のデータの半分未満の場合にのみ、対応するTopN Runtime Filterの生成を有効にします。

例えば、`set topn_filter_ratio=0`を設定すると、以下のクエリでTopN Runtime Filterの生成が防止されます：

```sql
select o_orderkey from orders order by o_orderdate limit 20;
```
