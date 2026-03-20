---
{
  "title": "FAQ",
  "description": "Dorisは内部的にマテリアライズドビューとベースtable間のパーティション対応を計算し、ベースtableのバージョンを記録します",
  "language": "ja"
}
---
## Build and Refresh

### Q1: Dorisはマテリアライズドビューに対して、どのパーティションをリフレッシュする必要があるかをどのように判断しますか？

Dorisは内部的にマテリアライズドビューとベースtable間のパーティション対応関係を計算し、最後の正常なリフレッシュ後にマテリアライズドビューで使用されたベースtableパーティションのバージョンを記録します。例えば、マテリアライズドビューmv1がベースTablet1とt2から作成され、t1に基づいてパーティショニングされている場合を考えます。

mv1のパーティションp202003がベースTablet1のパーティションp20200301とp20200302に対応していると仮定すると、p202003をリフレッシュした後、Dorisはパーティションp20200301とp20200302、およびTablet2の現在のバージョンを記録します。

次のリフレッシュ時に、Dorisはp20200301、p20200302、およびt2のバージョンが変更されたかどうかをチェックします。それらのいずれかが変更されていれば、p202003をリフレッシュする必要があることを示しています。

または、t2への変更をmv1のリフレッシュをトリガーせずに受け入れることができる場合は、マテリアライズドビューの`excluded_trigger_tables`プロパティを使用してこれを設定することができます。

### Q2: マテリアライズドビューが多くのリソースを消費し、他のビジネス操作に影響を与える場合、どうすればよいですか？

マテリアライズドビューのプロパティを通じてworkload_groupを指定することで、マテリアライズドビューのリフレッシュタスクに割り当てられるリソースを制御することができます。

メモリ割り当てが少なすぎて、単一パーティションのリフレッシュにより多くのメモリが必要な場合、タスクが失敗する可能性があることに注意することが重要です。このトレードオフはビジネス要件に基づいて慎重に考慮する必要があります。

### Q3: 既存のマテリアライズドビューに基づいて新しいマテリアライズドビューを作成できますか？

はい、これはDoris 2.1.3以降でサポートされています。ただし、各マテリアライズドビューはデータを更新する際に独自のリフレッシュロジックを採用します。例えば、mv2がmv1に基づき、mv1がt1に基づいている場合、mv2のリフレッシュ中にmv1とt1間の同期は考慮されません。

### Q4: Dorisではどの外部tableがサポートされていますか？

Dorisでサポートされているすべての外部tableをマテリアライズドビューの作成に使用できます。ただし、現在パーティションリフレッシュをサポートしているのはHiveのみで、他のタイプのサポートは将来予定されています。

### Q5: マテリアライズドビューはHiveと同じデータを表示しますが、実際には一貫していません。

マテリアライズドビューはカタログを通じて得られた結果との一貫性のみを保証します。カタログにはメタデータとデータキャッシングが含まれているため、マテリアライズドビューとHiveデータの一貫性を保つために、`REFRESH CATALOG`などの方法を使用してカタログをリフレッシュし、カタログデータをHiveと同期する必要がある場合があります。

### Q6: マテリアライズドビューはスキーマ変更をサポートしていますか？

いいえ、マテリアライズドビューの列属性はマテリアライズドビュー自体のSQL定義から派生するため、スキーマ変更はサポートされていません。明示的なカスタム変更は許可されていません。

### Q7: マテリアライズドビューで使用されるベースtableはスキーマ変更を行うことができますか？

はい、スキーマ変更は許可されています。ただし、変更後、このベースtableを使用するマテリアライズドビューのステータスはNORMALからSCHEMA_CHANGEに変わり、この時点でマテリアライズドビューは透過的なリライティングに使用できませんが、マテリアライズドビューへの直接クエリは影響を受けません。マテリアライズドビューの次のリフレッシュタスクが成功すれば、ステータスはNORMALに戻ります。

### Q8: プライマリキーモデルのtableをマテリアライズドビューの作成に使用できますか？

マテリアライズドビューのベースtableのデータモデルに制限はありません。ただし、マテリアライズドビュー自体は詳細モデルのみ可能です。

### Q9: マテリアライズドビューにインデックスを作成できますか？

はい。

### Q10: マテリアライズドビューはリフレッシュ中にtableをロックしますか？

リフレッシュ中に短期間tableロックが発生しますが、tableロックを継続的に占有することはありません（データインポート中のロック時間とほぼ同等）。

### Q11: マテリアライズドビューはニアリアルタイムシナリオに適していますか？

特に適してはいません。マテリアライズドビューのリフレッシュの最小単位はパーティションであり、大量のデータに対しては大量のリソースを消費し、リアルタイム性に欠けます。代わりに同期マテリアライズドビューや他の方法の使用を検討してください。

### Q12: パーティションドマテリアライズドビューの構築時にエラーが発生しました

エラーメッセージ:

```sql
Unable to find a suitable base table for partitioning
```
このエラーは通常、マテリアライズドビューのSQL定義とパーティション化フィールドの選択が増分パーティション更新を許可しないため、パーティション化されたマテリアライズドビューの作成中にエラーが発生することを示しています。

- 増分パーティション更新の場合、マテリアライズドビューのSQL定義とパーティション化フィールドの選択は特定の要件を満たす必要があります。詳細については、[Materialized View Refresh Modes](../../../sql-manual/sql-statements/table-and-view/async-materialized-view/CREATE-ASYNC-MATERIALIZED-VIEW#optional-parameters)を参照してください。

- 最新のコードはパーティション構築失敗の理由を示すことができ、エラーの要約と説明は付録2に記載されています。

例：

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
以下のマテリアライズドビューの定義では、`orders.o_orderdate`をマテリアライズドビューのパーティショニングフィールドとして選択した場合、インクリメンタルパーティション更新が可能になります。逆に、`lineitem.l_shipdate`を使用した場合、インクリメンタル更新は有効になりません。

理由：

1. `lineitem.l_shipdate`はベースTableのパーティショニングカラムではなく、`lineitem`にはパーティショニングカラムが定義されていません。

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
理由は以下の通りです：

1. 非同期マテリアライズドビューを作成するステートメントは、新しいoptimizerでのみサポートされています。新しいoptimizerを使用していることを確認してください：

    ```sql
    SET enable_nereids_planner = true;
    ```
2. refresh キーワードにタイポグラフィックエラーがあるか、マテリアライズドビューのSQL定義に構文エラーがある可能性があります。マテリアライズドビューのSQL定義と作成文の正確性を確認してください。

### Q14: マテリアライズドビューが正常にリフレッシュされた後でも、まだデータがない

マテリアライズドビューは、ベースTableまたはベースTableパーティションからバージョン情報を取得する能力に基づいて、データを更新する必要があるかどうかを判断します。

JDBC カタログ などの現在バージョン情報の取得をサポートしていないデータレイクに遭遇した場合、リフレッシュプロセスはマテリアライズドビューを更新する必要がないと仮定します。そのため、マテリアライズドビューを作成またはリフレッシュする際は、auto ではなく complete を指定する必要があります。

データレイクに対するマテリアライズドビューサポートの進捗については、[Data Lake Support Status.](./overview.md) を参照してください。


### Q15: パーティション化されたマテリアライズドビューが常にフルリフレッシュされるのはなぜですか？
マテリアライズドビューのパーティションの増分リフレッシュは、ベースTableパーティションからのバージョン情報に依存します。前回のリフレッシュ以降にベースTableパーティション内のデータが変更された場合、マテリアライズドビューは対応するパーティションをリフレッシュします。
パーティション化されたマテリアライズドビューがフルリフレッシュされている場合、考えられる理由は以下の通りです：

マテリアライズドビューの定義SQLで参照されているパーティション追跡されていないTableで変更が発生し、どのパーティションを更新する必要があるかを判断できないため、フルリフレッシュが強制されます。
例：
このマテリアライズドビューは orders Tableの o_orderdate パーティションを追跡していますが、lineitem や partsupp のデータが変更された場合、システムはどのパーティションを更新する必要があるかを判断できないため、フルリフレッシュが実行されます。

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
マテリアライズドビューが追跡しているベースTableを確認するには、以下を実行します

```sql
SELECT *
FROM mv_infos('database'='db_name')
WHERE Name = 'partition_mv' \G
```
戻された結果はMvPartitionInfoにpartitionType=FOLLOW_BASE_TABLEを表示しており、これはマテリアライズドビューのパーティションがベースTableのパーティションに従うことを示しています。
relatedColはo_orderdateを表示しており、これはマテリアライズドビューのパーティションがo_orderdate列に基づいていることを意味しています。

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
解決策:

lineitemTableやpartssuppTableの変更がマテリアライズドビューに影響しない場合、`excluded_trigger_tables`プロパティを設定することで、これらのTableを完全リフレッシュのトリガーから除外できます:
`ALTER MATERIALIZED VIEW partition_mv set("excluded_trigger_tables"="lineitem,partsupp");`


## クエリと透過的リライト

### Q1: マテリアライズドビューがヒットしたかどうかを確認する方法、およびヒットしなかった理由を見つける方法は？

`explain query_sql`を使用してマテリアライズドビューのヒット状況のサマリーを表示できます。

例えば、以下のマテリアライズドビューを考えてみます:

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
クエリは以下のようになります：

```sql
explain
SELECT l_shipdate, l_orderkey, O_ORDERDATE, count(*)
FROM lineitem  
LEFT OUTER JOIN orders on l_orderkey = o_orderkey
GROUP BY l_shipdate, l_orderkey, O_ORDERDATE;
```
- マテリアライズドビューのヒット情報はプランの末尾にあります。

- **MaterializedViewRewriteSuccessAndChose:** 透過的リライトが成功したことを示し、Cost-Based Optimizer (CBO) によって選択されたマテリアライズドビューの名前をリストします。

- **MaterializedViewRewriteSuccessButNotChose:** 透過的リライトが成功したことを示しますが、CBO によって選択されなかったマテリアライズドビューの名前をリストします。選択されなかったということは、実行プランでこれらのマテリアライズドビューが使用されないことを意味します。

- **MaterializedViewRewriteFail:** 透過的リライトの失敗と、失敗理由の概要をリストします。

- `explain` 出力の末尾に `MaterializedView` 情報がない場合、マテリアライズドビューが使用不可能な状態にあるため、透過的リライトに参加できないことを意味します。（マテリアライズドビューが使用不可能になる場合の詳細については、「利用と実践 - マテリアライズドビューステータスの確認」セクションを参照してください。）

出力例は以下の通りです：

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
### Q2: Materialized Viewがヒットしない理由は何ですか？

まず、materialized viewがヒットしているかどうかを確認するために、以下のSQLを実行してください（詳細については[Queries and Transparent Rewriting - Q1](#q1-how-does-doris-determine-which-partitions-need-to-be-refreshed-for-a-materialized-view)を参照してください）：

```Plain
explain
your_query_sql;
```
ヒットしない場合は、以下の理由が考えられます：

- Doris 2.1.3より前のバージョンでは、マテリアライズドビューの透明リライト機能はデフォルトで無効になっています。透明リライトを実現するには、対応するスイッチを有効にする必要があります。具体的なスイッチの値については、async-materialized viewに関連するスイッチを参照してください。

- マテリアライズドビューが使用不可能な状態にある可能性があり、透明リライトがヒットしない原因となっています。マテリアライズドビューのビルド状況を確認するには、マテリアライズドビューの状態を確認するセクションを参照してください。

- 最初の2つのステップを確認した後でも、マテリアライズドビューがヒットしない場合は、SQLで定義されたマテリアライズドビューとクエリSQLが、マテリアライズドビューの現在のリライト機能の範囲外にある可能性があります。詳細については[Materialized View Transparent Rewriting Capabilities](../../../query-acceleration/materialized-view/async-materialized-view/functions-and-demands#transparent-rewriting-capability)を参照してください。

- ヒット失敗の詳細情報と説明については、[付録 1](#reference)を参照してください。

以下は、マテリアライズドビューの透明リライト失敗例です：

**Case 1:**

Materialized view creation SQL:

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
クエリ実行:

```sql
explain
SELECT l_shipdate, l_linestatus, O_ORDERDATE, count(*)
FROM orders 
LEFT OUTER JOIN lineitem on l_orderkey = o_orderkey
GROUP BY l_shipdate, l_linestatus, O_ORDERDATE;
```
`Explain`出力:

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
出力において、`MaterializedViewRewriteFail`は失敗の概要を示し、`The graph logic between query and view is not consistent`は、クエリとマテリアライズドビューの間の結合ロジックが同一でないことを示します。これは、結合タイプまたは結合されるTableが異なることを意味します。

上記の例では、クエリとマテリアライズドビューにおけるTable結合順序が一致していないため、エラーが発生しています。透過的書き換え失敗の概要と説明については、付録1を参照してください。

**ケース2:**

クエリ実行:

```sql
explain
SELECT l_shipdate, l_linestatus, O_ORDERDATE, count(*)
FROM lineitem  
LEFT OUTER JOIN orders on l_orderkey = o_orderkey
GROUP BY l_shipdate, l_linestatus, O_ORDERDATE;
```
`Explain` 出力:

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
失敗サマリ `View dimensions doesn't cover the query dimensions` は、クエリ内の `GROUP BY` フィールドがマテリアライズドビューの `GROUP BY` フィールドから取得できないため、エラーが発生していることを示しています。

### Q3: マテリアライズドビューの状態が変化して使用不可になるのはどのような状況ですか？

「使用不可」とは、マテリアライズドビューが透過的な書き換えに使用できないことを意味しますが、直接クエリすることは可能です。

- 完全なマテリアライズドビューの場合、基底Tableのデータの変更やSchema Changeによってマテリアライズドビューが使用不可になることがあります。

- パーティションマテリアライズドビューの場合、基底Tableのデータの変更によって対応するパーティションが使用不可になり、基底TableのSchema Changeによってマテリアライズドビュー全体が使用不可になることがあります。

現在、マテリアライズドビューの更新に失敗した場合も使用不可になります。しかし、失敗したマテリアライズドビューでも透過的な書き換えに使用できるように最適化を行う予定です。

### Q4: マテリアライズドビューへの直接クエリでデータが返されない場合はどうすればよいですか？

マテリアライズドビューがまだ構築中である可能性や、構築に失敗した可能性があります。

マテリアライズドビューのステータスを確認してこれを確認できます。具体的な方法については、マテリアライズドビューステータスの確認に関するセクションを参照してください。

### Q5: マテリアライズドビューで使用される基底Tableのデータが変更されたが、マテリアライズドビューがまだ更新されていない場合、透過的な書き換えの動作はどうなりますか？

async-materialized viewsと基底Tableのデータ間には一定の遅延があります。

**1. 内部Tableとデータ変更を感知できる外部Table（Hiveなど）の場合：基底Tableのデータが変更された場合、マテリアライズドビューが使用可能かどうかは** **`grace_period`** **の閾値に依存します。**

`grace_period` はマテリアライズドビューと基底Table間のデータ不整合を許可する時間です。例えば：

- `grace_period` が0に設定されている場合、マテリアライズドビューが透過的な書き換えに使用されるためには、基底Tableのデータと一致している必要があります。外部Table（Hiveを除く）の場合、データ変更を感知できないため、それらを使用するマテリアライズドビューは透過的な書き換えに使用できます（ただし、データが不整合である可能性があります）。

- `grace_period` が10秒に設定されている場合、マテリアライズドビューのデータと基底Tableのデータ間で最大10秒の遅延を許可します。遅延が10秒以内であれば、マテリアライズドビューは透過的な書き換えに使用できます。

**2. パーティションマテリアライズドビューで一部のパーティションが無効になった場合、2つのシナリオがあります：**

- クエリが無効なパーティションのデータを使用しない場合、マテリアライズドビューは使用可能です。

- クエリが無効なパーティションのデータを使用し、データ遅延が `grace_period` 以内である場合、マテリアライズドビューは使用可能です。遅延が `grace_period` を超える場合、元のTableとマテリアライズドビューをunionすることでクエリに応答できます。これには `enable_materialized_view_union_rewrite` スイッチを有効にする必要があり、バージョン2.1.5以降はデフォルトで有効になっています。

## リファレンス

### 1 マテリアライズドビュー関連設定

| 設定                                                          | 説明                                                          |
| ------------------------------------------------------------ | ------------------------------------------------------------ |
| SET enable_nereids_planner = true;                           | マテリアライズドビューの書き換えに必要な新しいオプティマイザを有効にします。 |
| SET enable_materialized_view_rewrite = true;                 | クエリ書き換えを有効または無効にします。デフォルト：有効。       |
| SET materialized_view_rewrite_enable_contain_external_table = true; | 外部Tableを含むマテリアライズドビューが書き換えに参加することを許可します。デフォルト：無効。 |
| SET materialized_view_rewrite_success_candidate_num = 3;     | CBOが考慮する成功した書き換え候補の最大数。デフォルト：3。 |
| SET enable_materialized_view_union_rewrite = true;           | データが不十分な場合に基底Tableとマテリアライズドビュー間でUNION ALLを許可します。デフォルト：有効。 |
| SET enable_materialized_view_nest_rewrite = true;            | ネストしたマテリアライズドビューの書き換えを有効にします。デフォルト：無効。 |
| SET materialized_view_relation_mapping_max_count = 8;        | 書き換え時の関係マッピングの最大数。デフォルト：8。 |

### 2 透過的な書き換え失敗のサマリと説明

| サマリ                                                      | 説明                                                 |
| ------------------------------------------------------------ | ----------------------------------------------------------- |
| View struct info is invalid                                  | マテリアライズドビューの構造情報が無効です。現在書き換えでサポートされているSQLパターンには、クエリとマテリアライズドビューの両方でのjoin、およびマテリアライズドビューでjoinありまたはなしでのクエリでの集約が含まれます。このエラーは透過的な書き換え中によく表示されます。各書き換えルールは特定のSQLパターンを担当しているためです。必要なパターンに一致しないルールがヒットした場合、このエラーが発生しますが、一般的に書き換え失敗の主な原因ではありません。 |
| Materialized view rule exec fail                             | 通常、透過的な書き換えルールの実行中の例外を示します。調査するには、EXPLAIN memo plan query_sqlを使用して具体的な例外スタックを確認してください。 |
| Match mode is invalid                                        | クエリ内のTable数がマテリアライズドビュー内のTable数と一致せず、書き換えがサポートされていません。 |
| Query to view table mapping is null                          | クエリとマテリアライズドビューTable間のマッピングの生成に失敗しました。 |
| queryToViewTableMappings are over the limit and be intercepted | クエリ内の自己結合Tableが多すぎて書き換え空間の過度な拡張を引き起こし、透過的な書き換えが停止されました。 |
| Query to view slot mapping is null                           | クエリとマテリアライズドビューTable間のスロットマッピングに失敗しました。 |
| The graph logic between query and view is not consistent     | クエリとマテリアライズドビュー間でjoinタイプまたは結合されるTableが異なります。 |
| Predicate compensate fail                                    | 通常、クエリの条件範囲がマテリアライズドビューの条件範囲を超える場合に発生します。例：クエリがa > 10だがマテリアライズドビューがa > 15の場合。 |
| Rewrite compensate predicate by view fail                    | 述語補償が失敗しました。通常、クエリに補償が必要な追加条件があるが、それらの条件で使用される列がマテリアライズドビューのSELECT句に現れない場合です。 |
| Calc invalid partitions fail                                 | パーティションマテリアライズドビューで、クエリで使用されるパーティションが有効かどうかの計算に失敗しました。 |
| mv can not offer any partition for query                     | クエリがマテリアライズドビューの無効なパーティションのみを使用しています（最後の更新以降にデータが変更されました）。show partitions from mv_name でパーティションの有効性を確認してください（SyncWithBaseTables=falseは更新が必要であることを示します）。データ遅延を許可するためにgrace_period（秒）を設定してください。 |
| Add filter to base table fail when union rewrite             | クエリがマテリアライズドビューの無効なパーティションを使用し、マテリアライズドビューと基底Tableのunion allの試行が失敗しました。 |
| RewrittenPlan output logical properties is different with target group | 書き換え後、マテリアライズドビューの出力論理プロパティが元のクエリのものと一致しません。 |
| Rewrite expressions by view in join fail                     | join書き換えで、クエリで使用されるフィールドまたは式がマテリアライズドビューに存在しません。 |
| Rewrite expressions by view in scan fail                     | 単一Table書き換えで、クエリで使用されるフィールドまたは式がマテリアライズドビューに存在しません。 |
| Split view to top plan and agg fail, view doesn't not contain aggregate | 集約書き換え中、マテリアライズドビューに集約関数が含まれていません。 |
| Split query to top plan and agg fail                         | 集約書き換え中、クエリに集約関数が含まれていません。 |
| rewritten expression contains aggregate functions when group equals aggregate rewrite | クエリとマテリアライズドビューが同じGROUP BYを持つ場合、書き換えられた式に集約関数が含まれています。 |
| Can not rewrite expression when no roll up                   | クエリとマテリアライズドビューが同じGROUP BYを持つ場合、式の書き換えに失敗しました。 |
| Query function roll up fail                                  | 集約書き換え中、集約関数のロールアップに失敗しました。 |
| View dimensions do not cover the query dimensions            | クエリのGROUP BYがマテリアライズドビューのGROUP BYに存在しないディメンションを使用しています。 |
| View dimensions don't not cover the query dimensions in bottom agg | 上記と同様ですが、底レベルの集約に固有です。 |
| View dimensions do not cover the query group set dimensions  | クエリのGROUP SETSがマテリアライズドビューのGROUP BYに存在しないディメンションを使用しています。 |
| The only one of query or view is scalar aggregate and can not rewrite expression meanwhile | クエリにGROUP BYがありますが、マテリアライズドビューにはありません。 |
| Both query and view have group sets, or query doesn't have but view has, not supported | クエリとマテリアライズドビューの両方にGROUP SETSがある場合、またはマテリアライズドビューにのみある場合のサポートされていない透過的書き換えシナリオです。 |

### 3 非同期マテリアライズドビューパーティション構築失敗の理由

パーティションマテリアライズドビューの更新メカニズムは増分パーティション更新に依存しています：

- まず、マテリアライズドビューのパーティション列が基底Tableのパーティション列にマップできるかどうかを計算します。

- 次に、具体的なマッピング関係（1:1または1:n）を決定します。

| 概要                                                     | 説明                                                  |
| ------------------------------------------------------------ | ------------------------------------------------------------ |
| パーティション column cannot be found in the SQL SELECT column    | マテリアライズドビュー定義でPARTITION BY後に使用される列は、マテリアライズドビューを定義するSQLのSELECT句に現れる必要があります。 |
| Cannot find a valid partition track column, because %s       | 適切なパーティション列を見つけることができません；具体的な理由は「because」の後に続きます。 |
| パーティション track does not support mark join                   | マテリアライズドビューのパーティションフィールドで参照される列が、mark joinでの入力Tableのパーティション列であり、現在サポートされていません。 |
| パーティション column is in an unsupported join null generation side | マテリアライズドビューのパーティションフィールドで参照される列が、LEFT JOINの右側などjoinのnull生成側にあります。 |
| Relation should be LogicalCatalogRelation                    | マテリアライズドビューで参照されるパーティション基底TableのスキャンタイプはLogicalCatalogRelationである必要があります；他のタイプは現在サポートされていません。 |
| Self join does not support partition update                  | 自己結合を含むSQLクエリでは、マテリアライズドビューの構築は現在サポートされていません。 |
| パーティション track already has a related base table column      | マテリアライズドビューで参照されるパーティション列は、現在単一の基底Tableのパーティション列の参照のみをサポートしています。 |
| Relation base table is not MTMVRelatedTableIf                | マテリアライズドビューで参照されるパーティション基底TableがMTMVRelatedTableIfを継承していません。これはTableがパーティション化可能かどうかを示します。 |
| The related base table is not a partition table              | マテリアライズドビューで使用される基底TableがパーティションTableではありません。 |
| The related base table partition column doesn't contain the MV partition | マテリアライズドビューでPARTITION BY後に参照される列がパーティション基底Tableに存在しません。 |
| Group BY sets are empty, does not contain the target partition | マテリアライズドビューを定義するSQLが集約を使用していますが、GROUP BY句が空です。 |
| Window partition sets do not contain the target partition    | ウィンドウ関数が使用されていますが、マテリアライズドビューで参照されるパーティション列がPARTITION BY句にありません。 |
| Unsupported plan operation in track partition                | マテリアライズドビューを定義するSQLがORDER BYなどのサポートされていない操作を使用しています。 |
| Context partition column should be a slot from column        | ウィンドウ関数が使用され、PARTITION BY句でマテリアライズドビューで参照されるパーティション列が単純な列ではなく式です。 |
| パーティション expressions use more than one slot reference       | GROUP BYまたはPARTITION BY後のパーティション列が、単純な列ではなく複数の列を含む式です。例：GROUP BY partition_col + other_col。 |
| Column to check using invalid implicit expression            | マテリアライズドビューのパーティション列はdate_trunc でのみ使用でき、パーティション列を使用する式はdate_trunc などのみ可能です。 |
| パーティション column time unit level should be greater than SQL SELECT column | マテリアライズドビューで、PARTITION BY後のdate_trunc の時間単位粒度が、マテリアライズドビューを定義するSQLでSELECT後に現れる時間単位粒度よりも小さいです。例えば、マテリアライズドビューが `PARTITION BY(date_trunc(col, 'day'))` を使用しているが、マテリアライズドビューを定義するSQLのSELECT後に `date_trunc(col, 'month')` がある場合。 |
