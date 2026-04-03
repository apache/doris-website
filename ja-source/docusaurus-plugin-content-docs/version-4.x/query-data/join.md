---
{
  "title": "結合",
  "description": "リレーショナルデータベースでは、データは複数のtableに分散され、これらのtableは特定の関係を通じて相互接続されています。",
  "language": "ja"
}
---
## JOINとは

リレーショナルデータベースでは、データは複数のtableに分散されており、これらは特定の関係を通じて相互に接続されています。SQL JOIN操作により、ユーザーはこれらの関係に基づいて異なるtableを組み合わせ、より完全な結果セットを作成できます。

## DorisでサポートされるJOINタイプ

- **INNER JOIN**: JOIN条件に基づいて左tableの各行を右tableのすべての行と比較し、両tableから一致する行を返します。詳細については、[SELECT](../sql-manual/sql-statements/data-query/SELECT)のJOINクエリの構文定義を参照してください。

- **LEFT JOIN**: INNER JOINの結果セットに基づき、左tableの行が右tableで一致しない場合、左tableのすべての行が返され、右tableの対応する列はNULLとして表示されます。

- **RIGHT JOIN**: LEFT JOINの反対で、右tableの行が左tableで一致しない場合、右tableのすべての行が返され、左tableの対応する列はNULLとして表示されます。

- **FULL JOIN**: INNER JOINの結果セットに基づいて、両tableのすべての行を返し、一致しない部分はNULLで埋められます。

- **CROSS JOIN**: JOIN条件がなく、2つのtableのデカルト積を返します。左tableの各行が右tableの各行と組み合わされます。

- **LEFT SEMI JOIN**: JOIN条件に基づいて左tableの各行を右tableのすべての行と比較します。一致が存在する場合、左tableの対応する行が返されます。

- **RIGHT SEMI JOIN**: LEFT SEMI JOINの反対で、右tableの各行を左tableのすべての行と比較し、一致が存在する場合に右tableの対応する行を返します。

- **LEFT ANTI JOIN**: JOIN条件に基づいて左tableの各行を右tableのすべての行と比較します。一致しない場合、左tableの対応する行が返されます。

- **RIGHT ANTI JOIN**: LEFT ANTI JOINの反対で、右tableの各行を左tableのすべての行と比較し、一致しない右tableの行を返します。

- **NULL AWARE LEFT ANTI JOIN**: LEFT ANTI JOINと似ていますが、一致列がNULLである左tableの行は無視されます。

## DorisでのJOINの実装

Dorisは2つのJOIN実装方法をサポートしています：**Hash Join**と**Nested Loop Join**です。

- **Hash Join**: 等価JOIN列に基づいて右tableにハッシュtableを構築し、左tableのデータをこのハッシュtableを通じてストリーミングしてJOIN計算を行います。この方法は等価JOIN条件が適用可能な場合に限定されます。
- **Nested Loop Join**: この方法は2つの入れ子ループを使用し、左tableを駆動として左tableの各行を反復処理し、JOIN条件に基づいて右tableのすべての行と比較します。Hash Joinでは処理できないGREATER THANやLESS THANの比較を含むクエリやデカルト積が必要なケースなど、すべてのJOINシナリオに適用可能です。ただし、Hash Joinと比較してNested Loop Joinはパフォーマンスが劣る場合があります。

### DorisでのHash Joinの実装

分散MPPデータベースとして、Apache DorisはJOIN結果の正確性を確保するためにHash Joinプロセス中にデータシャッフリングが必要です。以下はいくつかのデータシャッフリング方法です：

**Broadcast Join** 図に示すように、Broadcast Joinプロセスでは、右tableのすべてのデータを左tableのデータをスキャンするノードを含むJOIN計算に参加するすべてのノードに送信し、左tableのデータは静止したままです。このプロセスでは、各ノードが右tableデータの完全なコピー（総ボリュームT(R)）を受信し、すべてのノードがJOIN操作を実行するために必要なデータを確実に持てるようにします。

この方法は様々なシナリオに適していますが、RIGHT OUTER、RIGHT ANTI、RIGHT SEMIタイプのHash Joinには適用できません。ネットワークオーバーヘッドは、JOINノード数Nに右tableデータのボリュームT(R)を掛けた値として計算されます。

![Implementation of Hash Join in Doris](/images/broadcast-join.jpg)

### パーティション Shuffle Join

この方法は、JOIN条件に基づいてハッシュ値を計算し、バケット化を実行します。具体的には、左右両tableのデータがJOIN条件から計算されたハッシュ値に従ってパーティション分割され、これらのパーティション分割されたデータセットが対応するパーティションノードに送信されます（図に示すように）。

この方法のネットワークオーバーヘッドは主に2つの部分を含みます：左tableデータの転送コストT(S)と右tableデータの転送コストT(R)です。この方法は、JOIN条件を使用してデータバケット化を実行するため、Hash JOIN操作のみをサポートします。

![パーティション Shuffle Join](/images/partition-shuffle-join.jpg)

### バケット Shuffle Join

JOIN条件が左tableのバケット列を含む場合、左tableのデータ位置は変更されず、右tableのデータが左tableのノードに分散されてJOINが行われ、ネットワークオーバーヘッドが削減されます。

JOIN操作に関与するtableの一方が、JOIN条件列に従ってすでにハッシュ分散されている場合、ユーザーはこの側のデータ位置を変更せずに保持し、同じJOIN条件列とハッシュ分散に基づいて他方のデータを分散することを選択できます。（ここでの「table」は物理的に保存されたtableだけでなく、SQLクエリ内の任意の演算子の出力結果も指します。ユーザーは左または右tableのデータ位置を変更せずに保持し、他方のtableのみを移動・分散することを柔軟に選択できます。）

例えば、Dorisの物理tableの場合、tableデータはハッシュ計算を通じてバケット化された方法で保存されているため、ユーザーはこの機能を直接活用してJOIN操作のデータシャッフルプロセスを最適化できます。JOINが必要な2つのtableがあり、JOIN列が左tableのバケット列である場合を想定します。この場合、左tableのデータを移動する必要はなく、左tableのバケット情報に基づいて右tableのデータを適切な場所に分散するだけでJOIN計算を完了できます。

このプロセスの主なネットワークオーバーヘッドは、T(R)として示される右tableデータの移動から生じます。

![バケット Shuffle Join](/images/bucket-shuffle-join.png)

### Colocate Join

バケット Shuffle Joinと同様に、Joinに関与する両tableがJoin条件列に従ってHashによってすでに分散されている場合、Shuffleプロセスをスキップしてローカルデータで直接Join計算を実行できます。これは物理tableで説明できます：

DorisでDISTRIBUTED BY HASHの指定でtableを作成する場合、システムはデータインポート時にHash分散キーに基づいてデータを分散します。両tableのHash分散キーがJoin条件列と一致する場合、これら2つのtableのデータはJoin要件に従ってすでに事前分散されており、追加のShuffle操作が不要であると言えます。したがって、実際のクエリ時には、これら2つのtableで直接Join計算を実行できます。

:::caution
データを直接スキャンした後にJoinを実行するシナリオでは、table作成時に特定の条件を満たす必要があります。2つの物理table間のColocate Joinに関する後続の制限を参照してください。
:::

![Colocate Join](/images/colocate-join.png)

## バケット Shuffle Join VS Colocate Join

前述のように、バケット Shuffle JoinとColocate Joinの両方について、参加tableの分散が特定の条件を満たす限り、join操作を実行できます（ここでの「table」はSQLクエリ演算子からの任意の出力を指します）。

次に、2つのTablet1とt2および関連するSQL例を使用して、一般化されたバケット Shuffle JoinとColocate Joinについてより詳細に説明します。まず、両tableのtable作成文を以下に示します：

```sql
create table t1
(
    c1 bigint, 
    c2 bigint
)
DISTRIBUTED BY HASH(c1) BUCKETS 3
PROPERTIES ("replication_num" = "1");

create table t2
(
    c1 bigint, 
    c2 bigint
)
DISTRIBUTED BY HASH(c1) BUCKETS 3
PROPERTIES ("replication_num" = "1");
```
### バケット Shuffle Joinの例

以下の例では、Tablet1とt2の両方がGROUP BY演算子によって処理され、新しいTableが生成されています（この時点で、txTableはc1によってハッシュ分散され、tyTableはc2によってハッシュ分散されています）。その後のJOIN条件はtx.c1 = ty.c2であり、これはBucket Shuffle Joinの条件を完全に満たしています。

```sql
explain select *
from 
    (
        -- The t1 table is hash-distributed by c1, and after the GROUP BY operator, it still maintains the hash distribution by c1.
        select c1 as c1, sum(c2) as c2
        from t1
        group by c1 
    ) tx
join 
    (
        -- The t2 table is hash-distributed by c1, but after the GROUP BY operator, the data is redistributed to be hash-distributed by c2.
        select c2 as c2, sum(c1) as c1
        from t2
        group by c2 
    ) ty
on tx.c1 = ty.c2;
```
以下のExplain execution planから、Hash Joinノード7の左子ノードが集約ノード6であり、右子ノードがExchangeノード4であることが観察できます。これは、左子ノードからのデータが集約後に同じ場所に残る一方で、右子ノードからのデータがBucket Shuffleメソッドを使用して左子ノードが存在するノードに分散され、後続のHash Join操作を実行するためであることを示しています。

```sql
+------------------------------------------------------------+
| Explain String(Nereids Planner)                            |
+------------------------------------------------------------+
| PLAN FRAGMENT 0                                            |
|   OUTPUT EXPRS:                                            |
|     c1[#18]                                                |
|     c2[#19]                                                |
|     c2[#20]                                                |
|     c1[#21]                                                |
|   PARTITION: HASH_PARTITIONED: c1[#8]                      |
|                                                            |
|   HAS_COLO_PLAN_NODE: true                                 |
|                                                            |
|   VRESULT SINK                                             |
|      MYSQL_PROTOCAL                                        |
|                                                            |
|   7:VHASH JOIN(364)                                        |
|   |  join op: INNER JOIN(BUCKET_SHUFFLE)[]                 |
|   |  equal join conjunct: (c1[#12] = c2[#6])               |
|   |  cardinality=10                                        |
|   |  vec output tuple id: 8                                |
|   |  output tuple id: 8                                    |
|   |  vIntermediate tuple ids: 7                            |
|   |  hash output slot ids: 6 7 12 13                       |
|   |  final projections: c1[#14], c2[#15], c2[#16], c1[#17] |
|   |  final project output tuple id: 8                      |
|   |  distribute expr lists: c1[#12]                        |
|   |  distribute expr lists: c2[#6]                         |
|   |                                                        |
|   |----4:VEXCHANGE                                         |
|   |       offset: 0                                        |
|   |       distribute expr lists: c2[#6]                    |
|   |                                                        |
|   6:VAGGREGATE (update finalize)(342)                      |
|   |  output: sum(c2[#9])[#11]                              |
|   |  group by: c1[#8]                                      |
|   |  sortByGroupKey:false                                  |
|   |  cardinality=10                                        |
|   |  final projections: c1[#10], c2[#11]                   |
|   |  final project output tuple id: 6                      |
|   |  distribute expr lists: c1[#8]                         |
|   |                                                        |
|   5:VOlapScanNode(339)                                     |
|      TABLE: tt.t1(t1), PREAGGREGATION: ON                  |
|      partitions=1/1 (t1)                                   |
|      tablets=1/1, tabletList=491188                        |
|      cardinality=21, avgRowSize=0.0, numNodes=1            |
|      pushAggOp=NONE                                        |
|                                                            |
| PLAN FRAGMENT 1                                            |
|                                                            |
|   PARTITION: HASH_PARTITIONED: c2[#2]                      |
|                                                            |
|   HAS_COLO_PLAN_NODE: true                                 |
|                                                            |
|   STREAM DATA SINK                                         |
|     EXCHANGE ID: 04                                        |
|     BUCKET_SHFFULE_HASH_PARTITIONED: c2[#6]                |
|                                                            |
|   3:VAGGREGATE (merge finalize)(355)                       |
|   |  output: sum(partial_sum(c1)[#3])[#5]                  |
|   |  group by: c2[#2]                                      |
|   |  sortByGroupKey:false                                  |
|   |  cardinality=5                                         |
|   |  final projections: c2[#4], c1[#5]                     |
|   |  final project output tuple id: 3                      |
|   |  distribute expr lists: c2[#2]                         |
|   |                                                        |
|   2:VEXCHANGE                                              |
|      offset: 0                                             |
|      distribute expr lists:                                |
|                                                            |
| PLAN FRAGMENT 2                                            |
|                                                            |
|   PARTITION: HASH_PARTITIONED: c1[#0]                      |
|                                                            |
|   HAS_COLO_PLAN_NODE: false                                |
|                                                            |
|   STREAM DATA SINK                                         |
|     EXCHANGE ID: 02                                        |
|     HASH_PARTITIONED: c2[#2]                               |
|                                                            |
|   1:VAGGREGATE (update serialize)(349)                     |
|   |  STREAMING                                             |
|   |  output: partial_sum(c1[#0])[#3]                       |
|   |  group by: c2[#1]                                      |
|   |  sortByGroupKey:false                                  |
|   |  cardinality=5                                         |
|   |  distribute expr lists: c1[#0]                         |
|   |                                                        |
|   0:VOlapScanNode(346)                                     |
|      TABLE: tt.t2(t2), PREAGGREGATION: ON                  |
|      partitions=1/1 (t2)                                   |
|      tablets=1/1, tabletList=491198                        |
|      cardinality=10, avgRowSize=0.0, numNodes=1            |
|      pushAggOp=NONE                                        |
|                                                            |
|                                                            |
| Statistics                                                 |
|  planed with unknown column statistics                     |
+------------------------------------------------------------+
97 rows in set (0.01 sec)
```
### Colocate Joinの例

以下の例では、Tablet1とt2の両方がGROUP BY演算子によって処理され、新しいTableが生成されています（この時点で、txとtyは両方ともc2によってハッシュ分散されています）。その後のJOIN条件はtx.c2 = ty.c2であり、これはColocate Joinの条件を完全に満たしています。

```sql
explain select *
from 
    (
        -- The t1 table is initially hash-distributed by c1, but after the GROUP BY operator, the data distribution changes to be hash-distributed by c2.
        select c2 as c2, sum(c1) as c1
        from t1
        group by c2 
    ) tx
join 
    (
        -- The t2 table is initially hash-distributed by c1, but after the GROUP BY operator, the data distribution changes to be hash-distributed by c2.
        select c2 as c2, sum(c1) as c1
        from t2
        group by c2 
    ) ty
on tx.c2 = ty.c2;
```
以下のExplain実行計画の結果から、Hash Joinノード8の左の子ノードが集約ノード7であり、右の子ノードが集約ノード3であることがわかり、Exchangeノードは存在しません。これは、左右の子ノードからの集約されたデータが元の場所に残っていることを示しており、データの移動が不要となり、後続のHash Join操作を直接ローカルで実行できることを意味します。

```sql
+------------------------------------------------------------+
| Explain String(Nereids Planner)                            |
+------------------------------------------------------------+
| PLAN FRAGMENT 0                                            |
|   OUTPUT EXPRS:                                            |
|     c2[#20]                                                |
|     c1[#21]                                                |
|     c2[#22]                                                |
|     c1[#23]                                                |
|   PARTITION: HASH_PARTITIONED: c2[#10]                     |
|                                                            |
|   HAS_COLO_PLAN_NODE: true                                 |
|                                                            |
|   VRESULT SINK                                             |
|      MYSQL_PROTOCAL                                        |
|                                                            |
|   8:VHASH JOIN(373)                                        |
|   |  join op: INNER JOIN(PARTITIONED)[]                    |
|   |  equal join conjunct: (c2[#14] = c2[#6])               |
|   |  cardinality=10                                        |
|   |  vec output tuple id: 9                                |
|   |  output tuple id: 9                                    |
|   |  vIntermediate tuple ids: 8                            |
|   |  hash output slot ids: 6 7 14 15                       |
|   |  final projections: c2[#16], c1[#17], c2[#18], c1[#19] |
|   |  final project output tuple id: 9                      |
|   |  distribute expr lists: c2[#14]                        |
|   |  distribute expr lists: c2[#6]                         |
|   |                                                        |
|   |----3:VAGGREGATE (merge finalize)(367)                  |
|   |    |  output: sum(partial_sum(c1)[#3])[#5]             |
|   |    |  group by: c2[#2]                                 |
|   |    |  sortByGroupKey:false                             |
|   |    |  cardinality=5                                    |
|   |    |  final projections: c2[#4], c1[#5]                |
|   |    |  final project output tuple id: 3                 |
|   |    |  distribute expr lists: c2[#2]                    |
|   |    |                                                   |
|   |    2:VEXCHANGE                                         |
|   |       offset: 0                                        |
|   |       distribute expr lists:                           |
|   |                                                        |
|   7:VAGGREGATE (merge finalize)(354)                       |
|   |  output: sum(partial_sum(c1)[#11])[#13]                |
|   |  group by: c2[#10]                                     |
|   |  sortByGroupKey:false                                  |
|   |  cardinality=10                                        |
|   |  final projections: c2[#12], c1[#13]                   |
|   |  final project output tuple id: 7                      |
|   |  distribute expr lists: c2[#10]                        |
|   |                                                        |
|   6:VEXCHANGE                                              |
|      offset: 0                                             |
|      distribute expr lists:                                |
|                                                            |
| PLAN FRAGMENT 1                                            |
|                                                            |
|   PARTITION: HASH_PARTITIONED: c1[#8]                      |
|                                                            |
|   HAS_COLO_PLAN_NODE: false                                |
|                                                            |
|   STREAM DATA SINK                                         |
|     EXCHANGE ID: 06                                        |
|     HASH_PARTITIONED: c2[#10]                              |
|                                                            |
|   5:VAGGREGATE (update serialize)(348)                     |
|   |  STREAMING                                             |
|   |  output: partial_sum(c1[#8])[#11]                      |
|   |  group by: c2[#9]                                      |
|   |  sortByGroupKey:false                                  |
|   |  cardinality=10                                        |
|   |  distribute expr lists: c1[#8]                         |
|   |                                                        |
|   4:VOlapScanNode(345)                                     |
|      TABLE: tt.t1(t1), PREAGGREGATION: ON                  |
|      partitions=1/1 (t1)                                   |
|      tablets=1/1, tabletList=491188                        |
|      cardinality=21, avgRowSize=0.0, numNodes=1            |
|      pushAggOp=NONE                                        |
|                                                            |
| PLAN FRAGMENT 2                                            |
|                                                            |
|   PARTITION: HASH_PARTITIONED: c1[#0]                      |
|                                                            |
|   HAS_COLO_PLAN_NODE: false                                |
|                                                            |
|   STREAM DATA SINK                                         |
|     EXCHANGE ID: 02                                        |
|     HASH_PARTITIONED: c2[#2]                               |
|                                                            |
|   1:VAGGREGATE (update serialize)(361)                     |
|   |  STREAMING                                             |
|   |  output: partial_sum(c1[#0])[#3]                       |
|   |  group by: c2[#1]                                      |
|   |  sortByGroupKey:false                                  |
|   |  cardinality=5                                         |
|   |  distribute expr lists: c1[#0]                         |
|   |                                                        |
|   0:VOlapScanNode(358)                                     |
|      TABLE: tt.t2(t2), PREAGGREGATION: ON                  |
|      partitions=1/1 (t2)                                   |
|      tablets=1/1, tabletList=491198                        |
|      cardinality=10, avgRowSize=0.0, numNodes=1            |
|      pushAggOp=NONE                                        |
|                                                            |
|                                                            |
| Statistics                                                 |
|  planed with unknown column statistics                     |
+------------------------------------------------------------+
105 rows in set (0.06 sec)
```
## 4つのshuffleメソッドの比較

| Shuffle Methods | Network Overhead | Physical Operator         | Applicable Scenarios                                         |
| --------------- | ---------------- | ------------------------- | ------------------------------------------------------------ |
| Broadcast       | N * T(R)         | Hash Join /Nest Loop Join | General                                                      |
| Shuffle         | T(S) + T(R)      | Hash Join                 | General                                                      |
| バケット Shuffle  | T(R)             | Hash Join                 | JOIN condition includes the left table's bucketed column, with the left table being single-partitioned. |
| Colocate        | 0                | Hash Join                 | JOIN condition includes the left table's bucketed column, and both tables belong to the same Colocate Group. |

:::info NOTE
N: Join計算に参加するインスタンス数

T(Relation): リレーション内のタプル数
:::

4つのShuffleメソッドの柔軟性は順番に低下し、データ分散に対する要件がますます厳しくなります。ほとんどの場合、データ分散の要件が高くなるにつれて、Join計算のパフォーマンスは徐々に向上する傾向があります。Table内のバケット数が少ない場合、バケット ShuffleやColocate Joinは並列性が低くなることによりパフォーマンスが低下し、Shuffle Joinよりも遅いパフォーマンスになる可能性があることに注意することが重要です。これは、Shuffle操作がデータ分散をより効果的にバランスさせることができ、それにより後続の処理でより高い並列性を提供するためです。

## FAQ

バケット Shuffle JoinとColocate Joinは、適用時にデータ分散とJOIN条件に関して特定の制限があります。以下では、これらのJOINメソッドそれぞれの具体的な制限について詳しく説明します。

### バケット Shuffle Joinの制限事項

2つの物理Tableを直接スキャンしてBucket Shuffle Joinを行う場合、以下の条件を満たす必要があります：

1. **等価JOIN条件**: バケット Shuffle Joinは、データ分散を決定するためにハッシュ計算に依存するため、JOIN条件が等価性に基づくシナリオにのみ適用可能です。

2. **等価条件におけるバケットカラムの包含**: 等価JOIN条件には、両方のTableのバケットカラムが含まれている必要があります。左Tableのバケットカラムが等価JOIN条件として使用される場合、バケット Shuffle Joinとして計画される可能性が高くなります。

3. **Tableタイプの制限**: バケット Shuffle Joinは、DorisのネイティブOLAPTableにのみ適用可能です。ODBC、MySQL、ESなどの外部Tableについては、それらが左Tableとして使用される場合、バケット Shuffle Joinは効果的ではありません。

4. **単一パーティション要件**: パーティションTableについては、パーティション間でデータ分散が異なる可能性があるため、バケット Shuffle Joinは左Tableが単一パーティションの場合にのみ効果が保証されます。したがって、SQLを実行する際は、可能な限り`WHERE`条件を使用してパーティションプルーニング戦略を有効にすることが推奨されます。

### Colocate Joinの制限事項

2つの物理Tableを直接スキャンする場合、Colocate JoinはBucket Shuffle Joinと比較してより厳しい制限があります。バケット Shuffle Joinのすべての条件を満たすことに加えて、以下の要件も満たす必要があります：

1. **bucket columnの型と数が同一**: バケットカラムの型が一致するだけでなく、データ分散の一貫性を確保するために、バケット数も同じである必要があります。

2. **Colocation Groupの明示的な指定**: Colocation Groupを明示的に指定する必要があります。同じColocation Group内のTableのみがColocate Joinに参加できます。

3. **レプリカ修復やバランシング中の不安定状態**: レプリカ修復やバランシングなどの操作中、Colocation Groupは不安定な状態になる可能性があります。この場合、Colocate Joinは通常のJoin操作に降格されます。
