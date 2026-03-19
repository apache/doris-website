---
{
  "title": "結合",
  "language": "ja",
  "description": "リレーショナルデータベースでは、データは複数のテーブルに分散されており、これらのテーブルは特定の関係を通じて相互接続されています。"
}
---
## JOINとは

リレーショナルデータベースでは、データは複数のテーブルに分散され、特定の関係によって相互接続されています。SQL JOIN操作により、ユーザーはこれらの関係に基づいて異なるテーブルをより完全な結果セットに結合できます。

## DorisでサポートされているJOINタイプ

- **INNER JOIN**: JOIN条件に基づいて左テーブルの各行を右テーブルのすべての行と比較し、両テーブルから一致する行を返します。詳細については、[SELECT](../sql-manual/sql-statements/data-query/SELECT)のJOINクエリの構文定義を参照してください。

- **LEFT JOIN**: INNER JOINの結果セットを基に、左テーブルの行が右テーブルで一致しない場合、左テーブルのすべての行が返され、右テーブルの対応する列はNULLとして表示されます。

- **RIGHT JOIN**: LEFT JOINの逆で、右テーブルの行が左テーブルで一致しない場合、右テーブルのすべての行が返され、左テーブルの対応する列はNULLとして表示されます。

- **FULL JOIN**: INNER JOINの結果セットを基に、両テーブルのすべての行を返し、一致しない部分はNULLで埋められます。

- **CROSS JOIN**: JOIN条件がなく、2つのテーブルのデカルト積を返し、左テーブルの各行が右テーブルの各行と組み合わされます。

- **LEFT SEMI JOIN**: JOIN条件に基づいて左テーブルの各行を右テーブルのすべての行と比較します。一致が存在する場合、左テーブルの対応する行が返されます。

- **RIGHT SEMI JOIN**: LEFT SEMI JOINの逆で、右テーブルの各行を左テーブルのすべての行と比較し、一致が存在する場合は右テーブルの対応する行を返します。

- **LEFT ANTI JOIN**: JOIN条件に基づいて左テーブルの各行を右テーブルのすべての行と比較します。一致しない場合、左テーブルの対応する行が返されます。

- **RIGHT ANTI JOIN**: LEFT ANTI JOINの逆で、右テーブルの各行を左テーブルのすべての行と比較し、一致しない右テーブルの行を返します。

- **NULL AWARE LEFT ANTI JOIN**: LEFT ANTI JOINと似ていますが、一致する列がNULLである左テーブルの行を無視します。

## DorisでのJOINの実装

Dorisは、JOINの実装方法として**Hash Join**と**Nested Loop Join**の2つをサポートしています。

- **Hash Join**: 等価JOIN列に基づいて右テーブル上にハッシュテーブルを構築し、左テーブルのデータをこのハッシュテーブルを通してストリーミングしてJOIN計算を行います。この方法は等価JOIN条件が適用可能な場合に限定されます。
- **Nested Loop Join**: この方法は2つのネストしたループを使用し、左テーブルによって駆動され、左テーブルの各行を反復処理し、JOIN条件に基づいて右テーブルのすべての行と比較します。Hash Joinが処理できないGREATER THANやLESS THANの比較を含むクエリやデカルト積が必要なケースなど、すべてのJOINシナリオに適用できます。ただし、Hash Joinと比較して、Nested Loop Joinはパフォーマンスが劣る場合があります。

### DorisでのHash Joinの実装

分散MPPデータベースとして、Apache DorisはJOIN結果の正確性を確保するため、Hash Joinプロセス中にデータのシャッフリングが必要です。以下はいくつかのデータシャッフリング方法です：

**Broadcast Join** 図に示すように、Broadcast Joinプロセスは、左テーブルのデータをスキャンするノードを含む、JOIN計算に参加するすべてのノードに右テーブルのすべてのデータを送信し、左テーブルのデータは静止したままです。このプロセスでは、各ノードがJOIN操作を実行するために必要なデータを確保するため、右テーブルのデータの完全なコピー（総ボリュームT(R)）を受信します。

この方法は様々なシナリオに適していますが、RIGHT OUTER、RIGHT ANTI、RIGHT SEMIタイプのHash Joinには適用できません。ネットワークオーバーヘッドは、JOINノード数Nに右テーブルのデータボリュームT(R)を掛けたものとして計算されます。

![Implementation of Hash Join in Doris](/images/broadcast-join.jpg)

### パーティション Shuffle Join

この方法は、JOIN条件に基づいてハッシュ値を計算し、バケッティングを実行します。具体的には、左テーブルと右テーブル両方のデータがJOIN条件から計算されたハッシュ値に従って分割され、これらの分割されたデータセットが対応する分割ノードに送信されます（図に示すとおり）。

この方法のネットワークオーバーヘッドは主に2つの部分を含みます：左テーブルのデータT(S)の転送コストと右テーブルのデータT(R)の転送コストです。この方法は、JOIN条件を使用してデータバケッティングを実行するため、Hash JOIN操作のみをサポートします。

![パーティション Shuffle Join](/images/partition-shuffle-join.jpg)

### バケット Shuffle Join

JOIN条件が左テーブルのバケット列を含む場合、左テーブルのデータ位置は変更されず、右テーブルのデータが左テーブルのノードに分散されてJOINが実行され、ネットワークオーバーヘッドが削減されます。

JOIN操作に関わるテーブルの一方がJOIN条件列に従ってすでにハッシュ分散されている場合、ユーザーはこの側のデータ位置を変更せずに保ち、同じJOIN条件列とハッシュ分散に基づいて他方のデータを分散することを選択できます。（ここでの「テーブル」は物理的に格納されたテーブルだけでなく、SQLクエリの任意のオペレーターの出力結果も指します。ユーザーは左テーブルまたは右テーブルのデータ位置を変更せずに保ち、他方のテーブルのみを移動・分散することを柔軟に選択できます。）

例えば、Dorisの物理テーブルの場合、テーブルデータはハッシュ計算によってバケット化された方法で格納されているため、ユーザーはこの機能を直接活用してJOIN操作のデータシャッフルプロセスを最適化できます。JOINが必要な2つのテーブルがあり、JOIN列が左テーブルのバケット列である場合を想定します。この場合、左テーブルのデータを移動する必要はなく、左テーブルのバケット情報に基づいて右テーブルのデータを適切な場所に分散するだけで、JOIN計算を完了できます。

このプロセスの主なネットワークオーバーヘッドは、T(R)として表される右テーブルのデータの移動から発生します。

![バケット Shuffle Join](/images/bucket-shuffle-join.png)

### Colocate Join

バケット Shuffle Joinと同様に、Joinに関わる両テーブルがJoin条件列に従ってHashによってすでに分散されている場合、Shuffleプロセスをスキップして、ローカルデータで直接Join計算を実行できます。これは物理テーブルで説明できます：

DorisでDISTRIBUTED BY HASHを指定してテーブルを作成する場合、システムはデータインポート中にHash分散キーに基づいてデータを分散します。両テーブルのHash分散キーがJoin条件列と一致する場合、これらの2つのテーブルのデータはすでにJoin要件に従って事前分散されており、追加のShuffle操作が不要であると言えます。したがって、実際のクエリ中に、これらの2つのテーブルでJoin計算を直接実行できます。

:::caution
データを直接スキャンした後にJoinが実行されるシナリオでは、テーブル作成時に特定の条件を満たす必要があります。2つの物理テーブル間のColocate Joinに関する後続の制限を参照してください。
:::

![Colocate Join](/images/colocate-join.png)

## バケット Shuffle Join VS Colocate Join

前述のように、バケット Shuffle JoinとColocate Joinの両方において、参加するテーブルの分散が特定の条件を満たす限り、join操作を実行できます（ここでの「テーブル」はSQLクエリオペレーターからの任意の出力を指します）。

次に、2つのテーブルt1とt2、および関連するSQLの例を使用して、一般化されたバケット Shuffle JoinとColocate Joinをより詳しく説明します。まず、両テーブルのテーブル作成文は次のとおりです：

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
### Bucket Shuffle Joinの例

以下の例では、テーブルt1とt2の両方がGROUP BY演算子によって処理され、新しいテーブルが生成されています（この時点で、txテーブルはc1によってハッシュ分散され、tyテーブルはc2によってハッシュ分散されています）。その後のJOIN条件はtx.c1 = ty.c2であり、これはBucket Shuffle Joinの条件を完全に満たしています。

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
以下のExplain execution planから、Hash Joinノード7の左子ノードは集約ノード6であり、右子ノードはExchangeノード4であることが確認できます。これは、左子ノードのデータが集約後も同じ場所に留まる一方で、右子ノードのデータは、後続のHash Join操作を実行するために、Bucket Shuffle方式を使用して左子ノードが存在するノードに分散されることを示しています。

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

以下の例では、テーブルt1とt2の両方がGROUP BY演算子によって処理され、新しいテーブルが生成されています（この時点で、txとtyの両方がc2によってハッシュ分散されています）。その後のJOIN条件はtx.c2 = ty.c2であり、これはColocate Joinの条件を完全に満たしています。

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
以下のExplain実行計画の結果から、Hash Joinノード8の左子ノードが集約ノード7、右子ノードが集約ノード3であり、Exchangeノードが存在しないことが分かります。これは、左右の子ノード両方からの集約データが元の場所に残っており、データ移動の必要性を排除し、後続のHash Join操作を直接ローカルで実行できることを示しています。

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
| Bucket Shuffle  | T(R)             | Hash Join                 | JOIN条件に左テーブルのbucketed columnが含まれ、左テーブルが単一パーティションである場合。 |
| Colocate        | 0                | Hash Join                 | JOIN条件に左テーブルのbucketed columnが含まれ、両テーブルが同じColocate Groupに属している場合。 |

:::info NOTE
N: Join計算に参加するインスタンス数

T(Relation): リレーション内のタプル数
:::

4つのShuffleメソッドの柔軟性は順次減少し、データ分散に対する要件はますます厳しくなります。ほとんどの場合、データ分散に対する要件が高くなるにつれて、Join計算のパフォーマンスは徐々に向上する傾向があります。重要な点として、テーブル内のbucket数が少ない場合、Bucket ShuffleやColocate Joinは並列度が低いためパフォーマンスが低下し、Shuffle Joinより遅くなる可能性があります。これは、Shuffle操作がデータ分散をより効果的にバランスさせることで、後続の処理でより高い並列度を提供できるためです。

## FAQ

Bucket Shuffle JoinとColocate Joinは、適用時にデータ分散とJOIN条件に関して特定の制限があります。以下では、これらのJOINメソッドそれぞれの具体的な制限について詳しく説明します。

### Bucket Shuffle Joinの制限

2つの物理テーブルを直接スキャンしてBucket Shuffle Joinを実行する場合、以下の条件を満たす必要があります：

1. **等価Join条件**: Bucket Shuffle Joinは、データ分散を決定するためにハッシュ計算に依存するため、JOIN条件が等価性に基づくシナリオにのみ適用されます。

2. **等価条件へのbucketed columnsの含有**: 等価JOIN条件には、両テーブルのbucketed columnsが含まれている必要があります。左テーブルのbucketed columnが等価JOIN条件として使用される場合、Bucket Shuffle Joinとして計画される可能性が高くなります。

3. **テーブルタイプの制限**: Bucket Shuffle JoinはDorisのネイティブOLAPテーブルにのみ適用されます。ODBC、MySQL、ESなどの外部テーブルが左テーブルとして使用される場合、Bucket Shuffle Joinは有効になりません。

4. **単一パーティション要件**: パーティション化されたテーブルの場合、パーティション間でデータ分散が異なる可能性があるため、Bucket Shuffle Joinは左テーブルが単一パーティションの場合にのみ有効性が保証されます。したがって、SQLを実行する際は、可能な限り`WHERE`条件を使用してパーティションプルーニング戦略を有効にすることをお勧めします。

### Colocate Joinの制限

2つの物理テーブルを直接スキャンする場合、Colocate JoinはBucket Shuffle Joinと比較してより厳しい制限があります。Bucket Shuffle Joinのすべての条件を満たすことに加えて、以下の要件も満たす必要があります：

1. **bucket columnのタイプと数が同じ**: bucketed columnsのタイプが一致するだけでなく、データ分散の一貫性を確保するためにbucket数も同じである必要があります。

2. **Colocation Groupの明示的な指定**: Colocation Groupを明示的に指定する必要があり、同じColocation Group内のテーブルのみがColocate Joinに参加できます。

3. **レプリカ修復やバランシング中の不安定状態**: レプリカ修復やバランシングなどの操作中、Colocation Groupは不安定状態になる可能性があります。この場合、Colocate Joinは通常のJoin操作にデグレードされます。
