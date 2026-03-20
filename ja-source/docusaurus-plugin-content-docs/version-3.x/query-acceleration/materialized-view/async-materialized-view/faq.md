---
{
  "title": "FAQ",
  "description": "Dorisは内部的にマテリアライズドビューとベースtable間のパーティション対応関係を計算し、ベースtableのバージョンを記録します",
  "language": "ja"
}
---
## Build and Refresh

### Q1: Dorisはマテリアライズドビューでどのパーティションをリフレッシュする必要があるかをどのように判断しますか？

Dorisは内部的にマテリアライズドビューとベースtable間のパーティション対応を計算し、最後に成功したリフレッシュ後にマテリアライズドビューが使用したベースtableパーティションのバージョンを記録します。例えば、マテリアライズドビューmv1がベースTablet1とt2から作成され、t1に基づいてパーティション化されている場合。

mv1のパーティションp202003がベースTablet1のパーティションp20200301とp20200302に対応すると仮定すると、p202003をリフレッシュした後、Dorisはパーティションp20200301とp20200302、およびTablet2の現在のバージョンを記録します。

次のリフレッシュ時に、Dorisはp20200301、p20200302、t2のバージョンが変更されたかどうかをチェックします。いずれかが変更された場合、p202003をリフレッシュする必要があることを示します。

alternatively、t2の変更がmv1のリフレッシュをトリガーせずに受け入れられる場合は、マテリアライズドビューの`excluded_trigger_tables`プロパティを使用してこれを設定できます。

### Q2: マテリアライズドビューがリソースを大量に消費し、他のビジネス運用に影響を与える場合、どうすればよいですか？

マテリアライズドビューのプロパティを通じてworkload_groupを指定することで、マテリアライズドビューのリフレッシュタスクに割り当てられるリソースを制御できます。

メモリ割り当てが少なすぎて、単一パーティションのリフレッシュにより多くのメモリが必要な場合、タスクが失敗する可能性があることに注意が必要です。このトレードオフはビジネス要件に基づいて慎重に検討する必要があります。

### Q3: 既存のマテリアライズドビューに基づいて新しいマテリアライズドビューを作成できますか？

はい、これはDoris 2.1.3以降でサポートされています。ただし、各マテリアライズドビューはデータを更新する際に独自のリフレッシュロジックを使用します。例えば、mv2がmv1に基づいており、mv1がt1に基づいている場合、mv2のリフレッシュ時にmv1とt1間の同期は考慮されません。

### Q4: Dorisがサポートする外部tableはどれですか？

Dorisがサポートするすべての外部tableがマテリアライズドビューの作成に使用できます。ただし、現在パーティションリフレッシュをサポートしているのはHiveのみで、他のタイプのサポートは将来予定されています。

### Q5: マテリアライズドビューはHiveと同じデータを表示しますが、実際には一貫性がありません。

マテリアライズドビューはカタログを通じて取得された結果との一貫性のみを保証します。カタログにはメタデータとデータキャッシングが含まれているため、マテリアライズドビューとHiveデータの一貫性を確保するには、`REFRESH CATALOG`などの方法を使用してカタログをリフレッシュし、カタログデータをHiveと同期する必要がある場合があります。

### Q6: マテリアライズドビューはスキーマ変更をサポートしますか？

いいえ、マテリアライズドビューの列属性はマテリアライズドビュー自体のSQL定義から派生するため、スキーマ変更はサポートされていません。明示的なカスタム変更は許可されていません。

### Q7: マテリアライズドビューが使用するベースtableでスキーマ変更を行うことはできますか？

はい、スキーマ変更は可能です。ただし、変更後、このベースtableを使用するマテリアライズドビューのステータスはNORMALからSCHEMA_CHANGEに変更され、この時点でマテリアライズドビューは透過的な書き換えに使用できませんが、マテリアライズドビューへの直接クエリは影響を受けません。マテリアライズドビューの次のリフレッシュタスクが成功した場合、ステータスはNORMALに戻ります。

### Q8: プライマリキーモデルのtableでマテリアライズドビューを作成できますか？

マテリアライズドビューのベースtableのデータモデルに制限はありません。ただし、マテリアライズドビュー自体は詳細モデルのみ可能です。

### Q9: マテリアライズドビューにインデックスを作成できますか？

はい。

### Q10: マテリアライズドビューはリフレッシュ中にtableをロックしますか？

リフレッシュ中に短時間tableロックが発生しますが、tableロックを継続的に占有することはありません（データインポート中のロック時間とほぼ同等）。

### Q11: マテリアライズドビューはニアリアルタイムシナリオに適していますか？

特に適していません。マテリアライズドビューをリフレッシュする最小単位はパーティションで、大量データでは大幅なリソースを消費し、リアルタイム性に欠けます。代わりに同期マテリアライズドビューや他の方法の使用を検討してください。

### Q12: パーティション化されたマテリアライズドビューの構築時にエラーが発生しました

Error Message:

```sql
Unable to find a suitable base table for partitioning
```
このエラーは通常、マテリアライズドビューのSQL定義とパーティショニングフィールドの選択が増分パーティション更新を許可しないため、パーティション化されたマテリアライズドビューの作成中にエラーが発生することを示しています。

- 増分パーティション更新の場合、マテリアライズドビューのSQL定義とパーティショニングフィールドの選択は特定の要件を満たす必要があります。詳細については、Materialized View Refresh Modesを参照してください。

- 最新のコードはパーティションビルド失敗の理由を示すことができ、エラーの要約と説明が付録 2で提供されています。

Example:

```sql
CREATE TABLE IF NOT EXISTS orders (
  o_orderkey INTEGER NOT NULL, 
  o_custkey INTEGER NOT NULL, 
  o_orderstatus CHAR(1) NOT NULL, 
  o_totalprice DECIMALV3(15, 2) NOT NULL, 
  o_orderdate DATE NOT NULL, 
  o_orderpriority CHAR(15) NOT NULL, 
  o_clerk CHAR(15) NOT NULL, 
  o_shippriority INTEGER NOT NULL, 
  O_COMMENT VARCHAR(79) NOT NULL
) DUPLICATE KEY(o_orderkey, o_custkey) PARTITION BY RANGE(o_orderdate) (
  FROM 
    ('2024-05-01') TO ('2024-06-30') INTERVAL 1 DAY
) DISTRIBUTED BY HASH(o_orderkey) BUCKETS 3 PROPERTIES ("replication_num" = "1");


CREATE TABLE IF NOT EXISTS lineitem (
  l_orderkey INTEGER NOT NULL, 
  l_partkey INTEGER NOT NULL, 
  l_suppkey INTEGER NOT NULL, 
  l_linenumber INTEGER NOT NULL, 
  l_quantity DECIMALV3(15, 2) NOT NULL, 
  l_extendedprice DECIMALV3(15, 2) NOT NULL, 
  l_discount DECIMALV3(15, 2) NOT NULL, 
  l_tax DECIMALV3(15, 2) NOT NULL, 
  l_returnflag CHAR(1) NOT NULL, 
  l_linestatus CHAR(1) NOT NULL, 
  l_shipdate DATE NOT NULL, 
  l_commitdate DATE NOT NULL, 
  l_receiptdate DATE NOT NULL, 
  l_shipinstruct CHAR(25) NOT NULL, 
  l_shipmode CHAR(10) NOT NULL, 
  l_comment VARCHAR(44) NOT NULL
) DUPLICATE KEY(
  l_orderkey, l_partkey, l_suppkey, 
  l_linenumber
) DISTRIBUTED BY HASH(l_orderkey) BUCKETS 3 PROPERTIES ("replication_num" = "1");
```
以下のマテリアライズドビューの定義では、`orders.o_orderdate`をマテリアライズドビューのパーティション化フィールドとして選択した場合、増分パーティション更新が可能になります。逆に、`lineitem.l_shipdate`を使用した場合は、増分更新が有効になりません。

理由：

1. `lineitem.l_shipdate`はベースTableのパーティション化カラムではなく、`lineitem`にはパーティション化カラムが定義されていません。

2. `lineitem.l_shipdate`は、`outer join`操作中に`null`値を生成するカラムです。

```sql
CREATE MATERIALIZED VIEW mv_1 BUILD IMMEDIATE REFRESH AUTO ON MANUAL partition by(o_orderdate) DISTRIBUTED BY RANDOM BUCKETS 2 PROPERTIES ('replication_num' = '1') AS 
SELECT 
  l_linestatus, 
  sum(
    l_extendedprice * (1 - l_discount)
  ) AS revenue, 
  o_orderdate, 
  o_shippriority 
FROM 
  orders 
  LEFT JOIN lineitem ON l_orderkey = o_orderkey 
WHERE 
  o_orderdate <= DATE '2024-06-30' 
  AND o_orderdate >= DATE '2024-05-01' 
GROUP BY 
  l_linestatus, 
  o_orderdate, 
  o_shippriority;
```
### Q13: マテリアライズドビューの作成時にエラーが発生

エラーメッセージ：

```sql
ERROR 1105 (HY000): errCode = 2, detailMessage = Syntax error in line 1:
BUILD IMMEDIATE REFRESH AUTO ON MANUAL
```
理由として以下が考えられます：

1. 非同期materialized viewを作成するステートメントは、新しいoptimizerでのみサポートされています。新しいoptimizerを使用していることを確認してください：

    ```sql
    SET enable_nereids_planner = true;
    ```
2. refresh キーワードにタイポグラフィエラーがあるか、マテリアライズドビューのSQL定義に構文エラーがある可能性があります。マテリアライズドビューのSQL定義と作成文の正確性を確認してください。

### Q14: マテリアライズドビューのrefreshが成功した後もデータが存在しない

マテリアライズドビューは、ベースTableまたはベースTableパーティションからバージョン情報を取得する能力に基づいて、データの更新が必要かどうかを判断します。

JDBC Catalogなど、現在バージョン情報の取得をサポートしていないデータレイクに遭遇した場合、refreshプロセスはマテリアライズドビューの更新が不要であると仮定します。そのため、マテリアライズドビューを作成またはrefreshする際は、autoではなくcompleteを指定する必要があります。

データレイクに対するマテリアライズドビューサポートの進捗については、[Data Lake Support Status.](./overview.md)を参照してください。


### Q15: なぜパーティション化されたマテリアライズドビューが常に完全にrefreshされるのか？
マテリアライズドビューのパーティションの増分refreshは、ベースTableパーティションからのバージョン情報に依存します。前回のrefresh以降にベースTableパーティションのデータが変更された場合、マテリアライズドビューは対応するパーティションをrefreshします。
パーティション化されたマテリアライズドビューが完全にrefreshされている場合、考えられる理由は以下の通りです：

マテリアライズドビューの定義SQLで参照されているパーティション追跡されていないTableで変更が発生し、どのパーティションを更新する必要があるかを判断できないため、完全なrefreshが強制されます。
例：
このマテリアライズドビューはordersTableのo_orderdateパーティションを追跡していますが、lineitemまたはpartsuppのデータが変更された場合、システムはどのパーティションを更新する必要があるかを判断できないため、完全なrefreshが実行されます。

```sql

CREATE MATERIALIZED VIEW partition_mv
BUILD IMMEDIATE
REFRESH AUTO
ON SCHEDULE EVERY 1 DAY STARTS '2024-12-01 20:30:00'
PARTITION BY (DATE_TRUNC(o_orderdate, 'MONTH'))
DISTRIBUTED BY HASH (l_orderkey) BUCKETS 2
PROPERTIES
("replication_num" = "3")
AS
SELECT
o_orderdate,
l_orderkey,
l_partkey
FROM
orders
LEFT JOIN lineitem ON l_orderkey = o_orderkey
LEFT JOIN partsupp ON ps_partkey = l_partkey
and l_suppkey = ps_suppkey;
```
materialized viewがどのベースTableを追跡しているかは、以下を実行することで確認できます

```sql
SELECT *
FROM mv_infos('database'='db_name')
WHERE Name = 'partition_mv' \G
```
返された結果では、MvPartitionInfoにpartitionType=FOLLOW_BASE_TABLEが表示されており、これはマテリアライズドビューのパーティションがベースTableのパーティションに従うことを示しています。
relatedColにはo_orderdateが表示されており、これはマテリアライズドビューのパーティションがo_orderdate列に基づいていることを意味します。

```text
Id: 1752809156450
Name: partition_mv
JobName: inner_mtmv_1752809156450
State: NORMAL
SchemaChangeDetail:
RefreshState: SUCCESS
RefreshInfo: BUILD IMMEDIATE REFRESH AUTO ON SCHEDULE EVERY 1 DAY STARTS "2025-12-01 20:30:00"
QuerySql: SELECT
`internal`.`doc_db`.`orders`.`o_orderdate`,
`internal`.`doc_db`.`lineitem`.`l_orderkey`,
`internal`.`doc_db`.`lineitem`.`l_partkey`
FROM
`internal`.`doc_db`.`orders`
LEFT JOIN `internal`.`doc_db`.`lineitem` ON `internal`.`doc_db`.`lineitem`.`l_orderkey` = `internal`.`doc_db`.`orders`.`o_orderkey`
LEFT JOIN `internal`.`doc_db`.`partsupp` ON `internal`.`doc_db`.`partsupp`.`ps_partkey` = `internal`.`doc_db`.`lineitem`.`l_partkey`
and `internal`.`doc_db`.`lineitem`.`l_suppkey` = `internal`.`doc_db`.`partsupp`.`ps_suppkey`
MvPartitionInfo: MTMVPartitionInfo{partitionType=EXPR, relatedTable=orders, relatedCol='o_orderdate', partitionCol='o_orderdate'}
SyncWithBaseTables: 1
```
解決策：

lineitemまたはpartsuppTableの変更がマテリアライズドビューに影響しない場合、`excluded_trigger_tables`プロパティを設定することで、これらのTableを完全リフレッシュのトリガー対象から除外できます：
`ALTER MATERIALIZED VIEW partition_mv set("excluded_trigger_tables"="lineitem,partsupp");`


## クエリと透過的リライティング

### Q1: マテリアライズドビューがヒットしたことを確認する方法、および非ヒットの理由を見つける方法は？

`explain query_sql`を使用して、マテリアライズドビューヒットの概要を表示できます。

例えば、次のマテリアライズドビューを考えてみます：

```sql
CREATE MATERIALIZED VIEW mv11
BUILD IMMEDIATE REFRESH AUTO ON MANUAL
partition by(l_shipdate)
DISTRIBUTED BY HASH(l_orderkey) BUCKETS 10
PROPERTIES ('replication_num' = '1') 
AS
SELECT l_shipdate, l_orderkey, O_ORDERDATE, count(*)
FROM lineitem  
LEFT OUTER JOIN orders on l_orderkey = o_orderkey
GROUP BY l_shipdate, l_orderkey, O_ORDERDATE;
```
クエリには以下が可能です：

```sql
explain
SELECT l_shipdate, l_orderkey, O_ORDERDATE, count(*)
FROM lineitem  
LEFT OUTER JOIN orders on l_orderkey = o_orderkey
GROUP BY l_shipdate, l_orderkey, O_ORDERDATE;
```
- マテリアライズドビューのヒット情報はプランの末尾にあります。

- **MaterializedViewRewriteSuccessAndChose:** 透過的な書き換えが成功したことを示し、Cost-Based Optimizer (CBO) によって選択されたマテリアライズドビューの名前を一覧表示します。

- **MaterializedViewRewriteSuccessButNotChose:** 透過的な書き換えが成功したことを示しますが、CBOによって選択されなかったマテリアライズドビューの名前を一覧表示します。それらが選択されないということは、実行プランがこれらのマテリアライズドビューを使用しないことを意味します。

- **MaterializedViewRewriteFail:** 透過的な書き換えの失敗とその理由の要約を一覧表示します。

- `explain`出力の末尾に`MaterializedView`情報がない場合、マテリアライズドビューが使用不可能な状態にあり、そのため透過的な書き換えに参加できないことを意味します。（マテリアライズドビューが使用不可能になる場合の詳細については、「使用方法と実践 - マテリアライズドビューのステータス確認」セクションを参照してください。）

以下は出力例です：

```sql
| MaterializedView                                                                   |
| MaterializedViewRewriteSuccessAndChose:                                            |
| internal#regression_test_nereids_rules_p0_mv#mv11,                                 |
|                                                                                    |
| MaterializedViewRewriteSuccessButNotChose:                                         |
|                                                                                    |
| MaterializedViewRewriteFail:                                                       |
+------------------------------------------------------------------------------------+
```
### Q2: マテリアライズドビューがヒットしない理由とは？

まず、マテリアライズドビューがヒットするかどうかを確認するために、以下のSQLを実行してください（詳細は[Queries and Transparent Rewriting - Q1](#q1-how-does-doris-determine-which-partitions-need-to-be-refreshed-for-a-materialized-view)を参照）：

```Plain
explain
your_query_sql;
```
ヒットしない場合、以下の理由が考えられます：

- Dorisバージョン2.1.3より前では、マテリアライズドビューの透過的リライト機能はデフォルトで無効になっています。透過的リライトを実現するには、対応するスイッチを有効にする必要があります。具体的なスイッチ値については、async-materialized view関連のスイッチを参照してください。

- マテリアライズドビューが使用不可能な状態にある可能性があり、透過的リライトがヒットしない場合があります。マテリアライズドビューのビルド状態を確認するには、マテリアライズドビューのステータス表示に関するセクションを参照してください。

- 最初の2つのステップを確認した後もマテリアライズドビューがヒットしない場合、SQLで定義されたマテリアライズドビューとクエリSQLが、マテリアライズドビューの現在のリライト機能の範囲外である可能性があります。詳細については、Materialized View Transparent Rewriting Capabilitiesを参照してください。

- ヒット失敗の詳細情報と説明については、[付録1](#reference)を参照してください。

以下は、マテリアライズドビューの透過的リライトが失敗した例です：

**ケース1：**

マテリアライズドビュー作成SQL：

```sql
CREATE MATERIALIZED VIEW mv11
BUILD IMMEDIATE REFRESH AUTO ON MANUAL
partition by(l_shipdate)
DISTRIBUTED BY HASH(l_orderkey) BUCKETS 10
PROPERTIES ('replication_num' = '1') 
AS
SELECT l_shipdate, l_orderkey, O_ORDERDATE, count(*)
FROM lineitem  
LEFT OUTER JOIN orders on l_orderkey = o_orderkey
GROUP BY l_shipdate, l_orderkey, O_ORDERDATE;
```
クエリの実行:

```sql
explain
SELECT l_shipdate, l_linestatus, O_ORDERDATE, count(*)
FROM orders 
LEFT OUTER JOIN lineitem on l_orderkey = o_orderkey
GROUP BY l_shipdate, l_linestatus, O_ORDERDATE;
```
`Explain` の出力:

```sql
| MaterializedView                                                                                          |
| MaterializedViewRewriteSuccessAndChose:                                                                   |
|                                                                                                           |
| MaterializedViewRewriteSuccessButNotChose:                                                                |
|                                                                                                           |
| MaterializedViewRewriteFail:                                                                              |
|   Name: internal#doc_test#mv11                                                                            |
|   FailSummary: View struct info is invalid, The graph logic between query and view is not consistent      |
```
出力では、`MaterializedViewRewriteFail`は失敗の概要を示し、`The graph logic between query and view is not consistent`は、クエリとマテリアライズドビューの間の結合ロジックが同一でないことを示します。これは、結合タイプまたは結合されるTableが異なることを意味します。

上記の例では、クエリとマテリアライズドビューのTable結合順序が一致していないため、エラーが発生しています。透過的リライトの失敗の概要と説明については、付録1を参照してください。

**ケース2:**

クエリ実行:

```sql
explain
SELECT l_shipdate, l_linestatus, O_ORDERDATE, count(*)
FROM lineitem  
LEFT OUTER JOIN orders on l_orderkey = o_orderkey
GROUP BY l_shipdate, l_linestatus, O_ORDERDATE;
```
`Explain`出力:

```sql
| MaterializedView                                                                                                          |
| MaterializedViewRewriteSuccessAndChose:                                                                                   |
|                                                                                                                           |
| MaterializedViewRewriteSuccessButNotChose:                                                                                |
|                                                                                                                           |
| MaterializedViewRewriteFail:                                                                                              |
|   Name: internal#doc_test#mv11                                                                                            |
|   FailSummary: View struct info is invalid, View dimensions doesn't not cover the query dimensions                        |
```
失敗の概要 `View dimensions doesn't cover the query dimensions` は、クエリ内の `GROUP BY` フィールドがマテリアライズドビューの `GROUP BY` フィールドから取得できないことを示しており、そのためエラーが発生しています。

### Q3: どのような状況でマテリアライズドビューの状態が変更され、使用不可能になりますか？

「使用不可能」とは、マテリアライズドビューが透過的なリライトに使用できない状態を意味しますが、直接クエリすることは可能です。

- フルマテリアライズドビューの場合、ベースTableのデータ変更やSchema Changeがマテリアライズドビューを使用不可能にする可能性があります。

- パーティション化されたマテリアライズドビューの場合、ベースTableのデータ変更は対応するパーティションを使用不可能にし、ベースTableのSchema Changeはマテリアライズドビュー全体を使用不可能にする可能性があります。

現在、マテリアライズドビューのリフレッシュ失敗も使用不可能にする可能性があります。ただし、失敗したマテリアライズドビューでも透過的なリライトに使用できるようにする最適化が計画されています。

### Q4: マテリアライズドビューへの直接クエリでデータが返されない場合はどうなりますか？

マテリアライズドビューがまだ構築中である可能性、または構築に失敗している可能性があります。

これを確認するには、マテリアライズドビューのステータスを確認できます。具体的な方法については、マテリアライズドビューのステータス表示に関するセクションを参照してください。

### Q5: マテリアライズドビューが使用するベースTableのデータが変更されたが、マテリアライズドビューがまだリフレッシュされていない場合、透過的なリライトの動作はどうなりますか？

async-materialized viewsとベースTable間のデータには一定の遅延があります。

**1. 内部Tableとデータ変更を感知できる外部Table（Hiveなど）の場合: ベースTableのデータが変更されると、マテリアライズドビューが使用可能かどうかは** **`grace_period`** **閾値に依存します。**

`grace_period`は、マテリアライズドビューとベースTable間のデータ不整合を許容する時間期間です。例えば：

- `grace_period`が0に設定されている場合、透過的なリライトに使用するためには、マテリアライズドビューがベースTableのデータと一致している必要があることを意味します。外部Table（Hiveを除く）の場合、データ変更を感知できないため、それらを使用するマテリアライズドビューは依然として透過的なリライトに使用できます（ただし、データが不整合の可能性があります）。

- `grace_period`が10秒に設定されている場合、マテリアライズドビューのデータとベースTableのデータ間で最大10秒の遅延を許容します。遅延が10秒以内であれば、マテリアライズドビューは依然として透過的なリライトに使用できます。

**2. パーティション化されたマテリアライズドビューで、一部のパーティションが無効になった場合、2つのシナリオがあります：**

- クエリが無効なパーティションからのデータを使用しない場合、マテリアライズドビューは依然として使用可能です。

- クエリが無効なパーティションからのデータを使用し、データ遅延が`grace_period`内の場合、マテリアライズドビューは依然として使用可能です。遅延が`grace_period`を超える場合、クエリは元のTableとマテリアライズドビューをユニオンすることで応答できます。これには`enable_materialized_view_union_rewrite`スイッチの有効化が必要で、バージョン2.1.5以降はデフォルトで有効です。

## リファレンス

### 1 マテリアライズドビュー関連設定

| 設定                                                | 説明                                                  |
| ------------------------------------------------------------ | ------------------------------------------------------------ |
| SET enable_nereids_planner = true;                           | マテリアライズドビューリライトに必要な新しいオプティマイザを有効にします。 |
| SET enable_materialized_view_rewrite = true;                 | クエリリライトを有効または無効にします。デフォルト: 有効。       |
| SET materialized_view_rewrite_enable_contain_external_table = true; | 外部Tableを含むマテリアライズドビューがリライトに参加することを許可します。デフォルト: 無効。 |
| SET materialized_view_rewrite_success_candidate_num = 3;     | CBOで考慮される成功したリライト候補の最大数。デフォルト: 3。 |
| SET enable_materialized_view_union_rewrite = true;           | データが不十分な場合にベースTableとマテリアライズドビュー間のUNION ALLを許可します。デフォルト: 有効。 |
| SET enable_materialized_view_nest_rewrite = true;            | ネストされたマテリアライズドビューリライトを有効にします。デフォルト: 無効。 |
| SET materialized_view_relation_mapping_max_count = 8;        | リライト中の関係マッピングの最大数。デフォルト: 8。 |

### 2 透過的リライト失敗の概要と説明

| 概要                                                      | 説明                                                  |
| ------------------------------------------------------------ | ------------------------------------------------------------ |
| View struct info is invalid                                  | マテリアライズドビューの構造情報が無効です。現在リライトでサポートされているSQLパターンには、クエリとマテリアライズドビュー両方でのjoin、クエリでの集約（マテリアライズドビューでjoinありまたはなし）が含まれます。このエラーは透過的リライト中によく表示されます。各リライトルールは特定のSQLパターンを担当しているためです。必要なパターンに一致しないルールがヒットした場合、このエラーが発生しますが、通常はリライト失敗の主要な原因ではありません。 |
| Materialized view rule exec fail                             | 通常、透過的リライトルールの実行中の例外を示します。調査するには、EXPLAIN memo plan query_sqlを使用して具体的な例外スタックを表示してください。 |
| Match mode is invalid                                        | クエリ内のTable数がマテリアライズドビュー内のTable数と一致せず、リライトがサポートされていません。 |
| Query to view table mapping is null                          | クエリとマテリアライズドビューTable間のマッピング生成に失敗しました。 |
| queryToViewTableMappings are over the limit and be intercepted | クエリ内の自己結合Tableが多すぎてリライト空間の過度な拡張を引き起こし、透過的リライトが停止されました。 |
| Query to view slot mapping is null                           | クエリとマテリアライズドビューTable間のスロットマッピングに失敗しました。 |
| The graph logic between query and view is not consistent     | クエリとマテリアライズドビュー間で結合タイプまたは結合されるTableが異なります。 |
| Predicate compensate fail                                    | 通常、クエリの条件範囲がマテリアライズドビューのそれを超えている場合に発生します。例：クエリはa > 10だがマテリアライズドビューはa > 15。 |
| Rewrite compensate predicate by view fail                    | 述語補償に失敗しました。通常、クエリに補償が必要な追加条件があるが、それらの条件で使用される列がマテリアライズドビューのSELECT句に現れない場合です。 |
| Calc invalid partitions fail                                 | パーティション化されたマテリアライズドビューで、クエリが使用するパーティションが有効かどうかの計算に失敗しました。 |
| mv can not offer any partition for query                     | クエリがマテリアライズドビューの無効なパーティションのみを使用しています（最後のリフレッシュ以降にデータが変更された）。show partitions from mv_name経由でパーティションの有効性を確認してください（SyncWithBaseTables=falseはリフレッシュが必要であることを示します）。データ遅延を許可するにはgrace_period（秒単位）を設定してください。 |
| Add filter to base table fail when union rewrite             | クエリがマテリアライズドビューの無効なパーティションを使用し、マテリアライズドビューとベースTableのunion all試行に失敗しました。 |
| RewrittenPlan output logical properties is different with target group | リライト後、マテリアライズドビューの出力論理プロパティが元のクエリのものと一致しません。 |
| Rewrite expressions by view in join fail                     | join リライトで、クエリで使用されているフィールドまたは式がマテリアライズドビューに存在しません。 |
| Rewrite expressions by view in scan fail                     | 単一Tableリライトで、クエリで使用されているフィールドまたは式がマテリアライズドビューに存在しません。 |
| Split view to top plan and agg fail, view doesn't not contain aggregate | 集約リライト中に、マテリアライズドビューに集約関数が含まれていません。 |
| Split query to top plan and agg fail                         | 集約リライト中に、クエリに集約関数が含まれていません。 |
| rewritten expression contains aggregate functions when group equals aggregate rewrite | クエリとマテリアライズドビューが同じGROUP BYを持つ場合、リライトされた式に集約関数が含まれています。 |
| Can not rewrite expression when no roll up                   | クエリとマテリアライズドビューが同じGROUP BYを持つ場合、式のリライトに失敗しました。 |
| Query function roll up fail                                  | 集約リライト中に、集約関数のロールアップに失敗しました。 |
| View dimensions do not cover the query dimensions            | クエリのGROUP BYが、マテリアライズドビューのGROUP BYに存在しないディメンションを使用しています。 |
| View dimensions don't not cover the query dimensions in bottom agg | 上記と同様ですが、底レベル集約に特有です。 |
| View dimensions do not cover the query group set dimensions  | クエリのGROUP SETSが、マテリアライズドビューのGROUP BYに存在しないディメンションを使用しています。 |
| The only one of query or view is scalar aggregate and can not rewrite expression meanwhile | クエリにはGROUP BYがあるがマテリアライズドビューにはありません。 |
| Both query and view have group sets, or query doesn't have but view has, not supported | クエリとマテリアライズドビュー両方にGROUP SETSがある場合、またはマテリアライズドビューのみにある場合の、サポートされていない透過的リライトシナリオです。 |

### 3 Async-Materialized Viewパーティション構築失敗の理由

パーティション化されたマテリアライズドビューのリフレッシュメカニズムは増分パーティション更新に依存しています：

- まず、マテリアライズドビューのパーティション列がベースTableのものにマッピングできるかを計算します。

- 次に、具体的なマッピング関係が1:1か1:nかを決定します。

| 要約                                                     | 説明                                                  |
| ------------------------------------------------------------ | ------------------------------------------------------------ |
| パーティション column cannot be found in the SQL SELECT column    | マテリアライズドビュー定義でPARTITION BY後に使用される列は、マテリアライズドビューを定義するSQLのSELECT句に現れる必要があります。 |
| Cannot find a valid partition track column, because %s       | 適切なパーティション列を特定できません；具体的な理由は"because"の後に続きます。 |
| パーティション track does not support mark join                   | マテリアライズドビューのパーティションフィールドが参照する列が、mark joinでの入力Tableのパーティション列であり、現在サポートされていません。 |
| パーティション column is in an unsupported join null generation side | マテリアライズドビューのパーティションフィールドの参照列が、LEFT JOINの右側などのjoinのnull生成側にあります。 |
| Relation should be LogicalCatalogRelation                    | マテリアライズドビューが参照するパーティションベースTableのスキャンタイプはLogicalCatalogRelationである必要があります；他のタイプは現在サポートされていません。 |
| Self join does not support partition update                  | 自己結合を含むSQLクエリの場合、マテリアライズドビューの構築は現在サポートされていません。 |
| パーティション track already has a related base table column      | マテリアライズドビューが参照するパーティション列は、現在単一のベースTableのパーティション列の参照のみをサポートしています。 |
| Relation base table is not MTMVRelatedTableIf                | マテリアライズドビューが参照するパーティションベースTableがMTMVRelatedTableIfを継承していません。これはTableがパーティション化可能かどうかを示します。 |
| The related base table is not a partition table              | マテリアライズドビューが使用するベースTableがパーティションTableではありません。 |
| The related base table partition column doesn't contain the MV partition | マテリアライズドビューでPARTITION BY後に参照される列が、パーティションベースTableに存在しません。 |
| Group BY sets are empty, does not contain the target partition | マテリアライズドビューを定義するSQLが集約を使用しているが、GROUP BY句が空です。 |
| Window partition sets do not contain the target partition    | ウィンドウ関数が使用されているが、マテリアライズドビューが参照するパーティション列がPARTITION BY句にありません。 |
| Unsupported plan operation in track partition                | マテリアライズドビューを定義するSQLが、ORDER BYなどのサポートされていない操作を使用しています。 |
| Context partition column should be a slot from column        | ウィンドウ関数が使用され、PARTITION BY句で、マテリアライズドビューが参照するパーティション列が単純な列ではなく式です。 |
| パーティション expressions use more than one slot reference       | GROUP BYまたはPARTITION BY後のパーティション列が、単純な列ではなく複数の列を含む式です。例：GROUP BY partition_col + other_col。 |
| Column to check using invalid implicit expression            | マテリアライズドビューのパーティション列はdate_trunkでのみ使用でき、パーティション列を使用する式はdate_trunkなどのみが可能です。 |
| パーティション column time unit level should be greater than SQL SELECT column | マテリアライズドビューで、PARTITION BY後のdate_trunc内の時間単位粒度が、マテリアライズドビューを定義するSQL内のSELECT後に現れる時間単位粒度より小さいです。例：マテリアライズドビューが`PARTITION BY(date_trunc(col, 'day'))`を使用しているが、マテリアライズドビューを定義するSQLのSELECT後に`date_trunc(col, 'month')`があります。 |
