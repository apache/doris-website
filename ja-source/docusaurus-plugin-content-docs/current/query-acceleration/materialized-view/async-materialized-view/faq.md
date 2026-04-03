---
{
  "title": "FAQ",
  "language": "ja",
  "description": "Dorisは内部的にマテリアライズドビューとベーステーブル間のパーティション対応を計算し、ベーステーブルのバージョンを記録する"
}
---
## ビルドとリフレッシュ

### Q1: Dorisはマテリアライズドビューのどのパーティションをリフレッシュする必要があるかをどのように判断しますか？

Dorisは内部的にマテリアライズドビューとベーステーブル間のパーティション対応を計算し、最後の成功したリフレッシュ後にマテリアライズドビューが使用したベーステーブルパーティションのバージョンを記録します。例えば、マテリアライズドビューmv1がベーステーブルt1とt2から作成され、t1に基づいてパーティション化されている場合。

mv1のパーティションp202003がベーステーブルt1のパーティションp20200301とp20200302に対応していると仮定すると、p202003をリフレッシュした後、Dorisはパーティションp20200301とp20200302、およびテーブルt2の現在のバージョンを記録します。

次回のリフレッシュ時、Dorisはp20200301、p20200302、およびt2のバージョンが変更されているかをチェックします。これらのいずれかが変更されている場合、p202003をリフレッシュする必要があることを示します。

または、t2の変更がmv1のリフレッシュをトリガーすることなく受け入れられる場合は、マテリアライズドビューの`excluded_trigger_tables`プロパティを使用してこれを設定できます。

### Q2: マテリアライズドビューが過度にリソースを消費し、他のビジネス運用に影響を与えている場合、どうすればよいでしょうか？

マテリアライズドビューのプロパティを通じて[workload_group](../../../admin-manual/workload-management/workload-group)を指定することで、マテリアライズドビューのリフレッシュタスクに割り当てられるリソースを制御できます。

メモリ割り当てが少なすぎて、単一パーティションのリフレッシュでより多くのメモリが必要な場合、タスクが失敗する可能性があることに注意することが重要です。このトレードオフはビジネス要件に基づいて慎重に検討する必要があります。

### Q3: 既存のマテリアライズドビューを基に新しいマテリアライズドビューを作成できますか？

はい、これはDoris 2.1.3以降でサポートされています。ただし、各マテリアライズドビューはデータを更新する際に独自のリフレッシュロジックを使用します。例えば、mv2がmv1を基にしており、mv1がt1を基にしている場合、mv2のリフレッシュ中にmv1とt1間の同期は考慮されません。

### Q4: Dorisはどの外部テーブルをサポートしていますか？

Dorisがサポートするすべての外部テーブルを使用してマテリアライズドビューを作成できます。ただし、現在パーティションリフレッシュをサポートしているのはHiveのみで、他のタイプのサポートは将来予定されています。

### Q5: マテリアライズドビューはHiveと同じデータを表示しますが、実際には一致していません。

マテリアライズドビューはカタログを通じて取得された結果との整合性のみを保証します。カタログにはメタデータとデータキャッシュが含まれているため、マテリアライズドビューとHiveデータの整合性を保つには、`REFRESH CATALOG`などの方法を使用してカタログをリフレッシュし、カタログデータをHiveと同期する必要がある場合があります。

### Q6: マテリアライズドビューはスキーマ変更をサポートしていますか？

いいえ、スキーマ変更はサポートされていません。マテリアライズドビューの列属性はマテリアライズドビュー自体のSQL定義から派生するため、明示的なカスタム変更は許可されていません。

### Q7: マテリアライズドビューが使用するベーステーブルのスキーマ変更は可能ですか？

はい、スキーマ変更は許可されています。ただし、変更後、このベーステーブルを使用するマテリアライズドビューのステータスはNORMALからSCHEMA_CHANGEに変わり、この時点でマテリアライズドビューは透過的な書き換えに使用できませんが、マテリアライズドビューへの直接クエリは影響を受けません。マテリアライズドビューの次のリフレッシュタスクが成功すると、ステータスはNORMALに戻ります。

### Q8: プライマリキーモデルのテーブルを使用してマテリアライズドビューを作成できますか？

マテリアライズドビューのベーステーブルのデータモデルに制限はありません。ただし、マテリアライズドビュー自体は詳細モデルのみ可能です。

### Q9: マテリアライズドビューにインデックスを作成できますか？

はい。

### Q10: マテリアライズドビューはリフレッシュ中にテーブルをロックしますか？

リフレッシュ中に短時間のテーブルロックが発生しますが、テーブルロックを継続的に占有することはありません（データインポート中のロック時間とほぼ同等）。

### Q11: マテリアライズドビューはニアリアルタイムシナリオに適していますか？

特に適していません。マテリアライズドビューのリフレッシュの最小単位はパーティションで、大量データに対しては大きなリソースを消費し、リアルタイム性に欠けます。代わりに同期マテリアライズドビューや他の方法の使用を検討してください。

### Q12: パーティション化されたマテリアライズドビューのビルド時にエラーが発生しました

エラーメッセージ：

```sql
Unable to find a suitable base table for partitioning
```
このエラーは通常、マテリアライズドビューのSQL定義とパーティション分割フィールドの選択が増分パーティション更新を許可しないため、パーティション分割されたマテリアライズドビューの作成中にエラーが発生することを示しています。

- 増分パーティション更新の場合、マテリアライズドビューのSQL定義とパーティション分割フィールドの選択は特定の要件を満たす必要があります。詳細については[Materialized View Refresh Modes](../../../sql-manual/sql-statements/table-and-view/async-materialized-view/CREATE-ASYNC-MATERIALIZED-VIEW#optional-parameters)を参照してください。

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
以下のマテリアライズドビュー定義では、マテリアライズドビューのパーティショニングフィールドとして`orders.o_orderdate`が選択された場合、増分パーティション更新が可能になります。逆に、`lineitem.l_shipdate`を使用した場合は増分更新ができません。

理由：

1. `lineitem.l_shipdate`はベーステーブルのパーティショニング列ではなく、`lineitem`にはパーティショニング列が定義されていません。

2. `lineitem.l_shipdate`は`outer join`操作中に`null`値を生成する列です。

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

Error Message:

```sql
ERROR 1105 (HY000): errCode = 2, detailMessage = Syntax error in line 1:
BUILD IMMEDIATE REFRESH AUTO ON MANUAL
```
理由として以下が考えられます：

1. 非同期マテリアライズドビューを作成するステートメントは、新しいoptimizerでのみサポートされています。新しいoptimizerを使用していることを確認してください：

    ```sql
    SET enable_nereids_planner = true;
    ```
2. refresh キーワードに入力ミスがあるか、マテリアライズドビューのSQL定義に構文エラーがある可能性があります。マテリアライズドビューのSQL定義と作成ステートメントが正しいかどうかを確認してください。

### Q14: マテリアライズドビューが正常にリフレッシュされた後も、まだデータがない

マテリアライズドビューは、ベーステーブルまたはベーステーブルパーティションからバージョン情報を取得する能力に基づいて、データを更新する必要があるかどうかを判断します。

JDBC Catalogなど、現在バージョン情報の取得をサポートしていないデータレイクに遭遇した場合、リフレッシュプロセスはマテリアライズドビューを更新する必要がないと想定します。そのため、マテリアライズドビューを作成またはリフレッシュする際は、autoではなくcompleteを指定する必要があります。

データレイクに対するマテリアライズドビューサポートの進捗については、[Data Lake Support Status.](./overview.md)を参照してください。


### Q15: パーティション化されたマテリアライズドビューが常にフルリフレッシュされるのはなぜですか？
マテリアライズドビューのパーティションの増分リフレッシュは、ベーステーブルパーティションからのバージョン情報に依存します。前回のリフレッシュ以降にベーステーブルパーティションのデータが変更された場合、マテリアライズドビューは対応するパーティションをリフレッシュします。
パーティション化されたマテリアライズドビューがフルリフレッシュされている場合、考えられる理由は以下のとおりです：

マテリアライズドビューの定義SQLで参照されているパーティション追跡されていないテーブルで変更が発生し、どのパーティションを更新する必要があるかを判断できないため、フルリフレッシュが強制されます。
例：
このマテリアライズドビューはordersテーブルのo_orderdateパーティションを追跡していますが、lineitemまたはpartsuppのデータが変更された場合、システムはどのパーティションを更新する必要があるかを判断できず、フルリフレッシュが発生します。

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
マテリアライズドビューが追跡しているベーステーブルを確認するには、次を実行します

```sql
SELECT *
FROM mv_infos('database'='db_name')
WHERE Name = 'partition_mv' \G
```
戻り値の結果では、MvPartitionInfo内でpartitionType=FOLLOW_BASE_TABLEが表示されており、これはマテリアライズドビューのパーティションがベーステーブルのパーティションに従うことを示しています。
relatedColにはo_orderdateが表示されており、これはマテリアライズドビューのパーティションがo_orderdate列に基づいていることを意味しています。

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

lineitemやpartsuppテーブルの変更がマテリアライズドビューに影響しない場合、`excluded_trigger_tables`プロパティを設定することで、これらのテーブルがフルリフレッシュをトリガーすることを除外できます：
`ALTER MATERIALIZED VIEW partition_mv set("excluded_trigger_tables"="lineitem,partsupp");`


## クエリと透過的リライト

### Q1: マテリアライズドビューがヒットしたことを確認する方法、および非ヒットの理由を見つける方法は？

`explain query_sql`を使用して、マテリアライズドビューヒットの概要を確認できます。

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
クエリは以下のいずれかになります：

```sql
explain
SELECT l_shipdate, l_orderkey, O_ORDERDATE, count(*)
FROM lineitem  
LEFT OUTER JOIN orders on l_orderkey = o_orderkey
GROUP BY l_shipdate, l_orderkey, O_ORDERDATE;
```
- マテリアライズドビューのヒット情報はプランの最後にあります。

- **MaterializedViewRewriteSuccessAndChose:** 透過的な書き換えが成功したことを示し、Cost-Based Optimizer (CBO) によって選択されたマテリアライズドビューの名前を一覧表示します。

- **MaterializedViewRewriteSuccessButNotChose:** 透過的な書き換えが成功したことを示しますが、CBOによって選択されなかったマテリアライズドビューの名前を一覧表示します。選択されないということは、実行プランがこれらのマテリアライズドビューを使用しないことを意味します。

- **MaterializedViewRewriteFail:** 透過的な書き換えの失敗と、その理由の要約を一覧表示します。

- `explain` 出力の最後に `MaterializedView` 情報がない場合、マテリアライズドビューが使用不可能な状態にあり、そのため透過的な書き換えに参加できないことを意味します。（マテリアライズドビューが使用不可能になる場合の詳細については、「使用方法と実践 - マテリアライズドビューステータスの表示」セクションを参照してください。）

出力例は次のとおりです：

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

まず、materialized viewがヒットするかどうかを確認するには、以下のSQLを実行してください（詳細は[Queries and Transparent Rewriting - Q1](#q1-how-does-doris-determine-which-partitions-need-to-be-refreshed-for-a-materialized-view)を参照）：

```Plain
explain
your_query_sql;
```
ヒットしない場合、以下の理由が考えられます：

- Doris バージョン 2.1.3 より前では、マテリアライズドビューの透過的書き換え機能はデフォルトで無効になっています。透過的書き換えを実現するには、対応するスイッチを有効にする必要があります。具体的なスイッチ値については、async-materialized view 関連スイッチを参照してください。

- マテリアライズドビューが使用不可状態にあり、透過的書き換えがヒットしない可能性があります。マテリアライズドビューのビルド状況を確認するには、マテリアライズドビューステータス表示セクションを参照してください。

- 最初の2つのステップを確認した後でも、マテリアライズドビューがヒットしない場合は、SQLで定義されたマテリアライズドビューとクエリSQLが、マテリアライズドビューの現在の書き換え機能の範囲外である可能性があります。詳細については、[Materialized View Transparent Rewriting Capabilities](../../../query-acceleration/materialized-view/async-materialized-view/functions-and-demands#transparent-rewriting-capability)を参照してください。

- ヒット失敗の詳細情報と説明については、[Appendix 1](#reference)を参照してください。

以下は、マテリアライズドビューの透過的書き換えが失敗した例です：

**Case 1:**

Materialized view 作成 SQL：

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
出力において、`MaterializedViewRewriteFail`は失敗の概要を示し、`The graph logic between query and view is not consistent`は、クエリとマテリアライズドビューの結合ロジックが同じでないこと、つまり結合タイプまたは結合されるテーブルが異なることを示しています。

上記の例では、クエリとマテリアライズドビューにおけるテーブル結合順序が一致していないため、エラーが発生します。透過的書き換え失敗の概要と説明については、付録1を参照してください。

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
失敗の概要`View dimensions doesn't cover the query dimensions`は、クエリ内の`GROUP BY`フィールドがマテリアライズドビューの`GROUP BY`フィールドから取得できないため、エラーが発生していることを示しています。

### Q3: マテリアライズドビューの状態が変更され、使用できなくなる状況とは？

「使用できない」とは、マテリアライズドビューが透過的書き換えに使用できないことを意味しますが、直接クエリは可能です。

- フル・マテリアライズドビューの場合、基礎テーブルデータの変更やSchema Changeにより、マテリアライズドビューが使用できなくなる可能性があります。

- パーティション・マテリアライズドビューの場合、基礎テーブルデータの変更により対応するパーティションが使用できなくなり、基礎テーブルのSchema Changeによりマテリアライズドビュー全体が使用できなくなる可能性があります。

現在、マテリアライズドビューのリフレッシュ失敗も使用不可を引き起こす可能性があります。ただし、失敗したマテリアライズドビューでも透過的書き換えに使用できるよう最適化が予定されています。

### Q4: マテリアライズドビューへの直接クエリでデータが返されない場合は？

マテリアライズドビューがまだ構築中であるか、構築が失敗している可能性があります。

マテリアライズドビューのステータスを確認してください。具体的な方法については、マテリアライズドビュー状態の確認に関するセクションを参照してください。

### Q5: マテリアライズドビューで使用される基礎テーブルのデータが変更されたが、マテリアライズドビューがまだリフレッシュされていない場合、透過的書き換えの動作はどうなる？

async-materialized viewと基礎テーブル間のデータには一定の遅延があります。

**1. 内部テーブルおよびデータ変更を認識できる外部テーブル（Hiveなど）の場合：基礎テーブルデータが変更された際、マテリアライズドビューが使用可能かどうかは** **`grace_period`** **閾値に依存します。**

`grace_period`は、マテリアライズドビューと基礎テーブル間のデータ不整合を許可する時間です。例：

- `grace_period`が0に設定されている場合、マテリアライズドビューが透過的書き換えに使用されるには、基礎テーブルデータと一致している必要があります。外部テーブル（Hiveを除く）の場合、データ変更を認識できないため、それらを使用するマテリアライズドビューは透過的書き換えに使用できます（ただし、データが不整合である可能性があります）。

- `grace_period`が10秒に設定されている場合、マテリアライズドビューデータと基礎テーブルデータ間で最大10秒の遅延を許可します。遅延が10秒以内であれば、マテリアライズドビューは透過的書き換えに使用できます。

**2. パーティション・マテリアライズドビューで一部のパーティションが無効になった場合、2つのシナリオがあります：**

- クエリが無効なパーティションからのデータを使用しない場合、マテリアライズドビューは使用可能です。

- クエリが無効なパーティションからのデータを使用し、データ遅延が`grace_period`内の場合、マテリアライズドビューは使用可能です。遅延が`grace_period`を超える場合、元のテーブルとマテリアライズドビューをunionしてクエリに応答できます。これには`enable_materialized_view_union_rewrite`スイッチの有効化が必要で、バージョン2.1.5以降はデフォルトで有効です。

## リファレンス

### 1 マテリアライズドビュー関連設定

| 設定                                                        | 説明                                                         |
| ------------------------------------------------------------ | ------------------------------------------------------------ |
| SET enable_nereids_planner = true;                           | マテリアライズドビュー書き換えに必要な新オプティマイザーを有効にします。 |
| SET enable_materialized_view_rewrite = true;                 | クエリ書き換えを有効または無効にします。デフォルト：有効。      |
| SET materialized_view_rewrite_enable_contain_external_table = true; | 外部テーブルを含むマテリアライズドビューの書き換えへの参加を許可します。デフォルト：無効。 |
| SET materialized_view_rewrite_success_candidate_num = 3;     | CBOが考慮する成功した書き換え候補の最大数。デフォルト：3。     |
| SET enable_materialized_view_union_rewrite = true;           | データが不十分な場合に基礎テーブルとマテリアライズドビュー間のUNION ALLを許可します。デフォルト：有効。 |
| SET enable_materialized_view_nest_rewrite = true;            | ネストしたマテリアライズドビューの書き換えを有効にします。デフォルト：無効。 |
| SET materialized_view_relation_mapping_max_count = 8;        | 書き換え中のリレーションマッピングの最大数。デフォルト：8。    |

### 2 透過的書き換え失敗の概要と説明

| 概要                                                        | 説明                                                         |
| ------------------------------------------------------------ | ----------------------------------------------------------- |
| View struct info is invalid                                  | マテリアライズドビューの構造情報が無効です。現在書き換えでサポートされるSQLパターンには、クエリとマテリアライズドビューの両方でのjoin、マテリアライズドビューでのjoinありまたはなしでのクエリでの集約が含まれます。このエラーは透過的書き換え中によく表示されます。各書き換えルールは特定のSQLパターンに対応しており、必要なパターンと一致しないルールがヒットした場合、このエラーが発生しますが、一般的には書き換え失敗の主な原因ではありません。 |
| Materialized view rule exec fail                             | 通常、透過的書き換えルールの実行中の例外を示します。調査するには、EXPLAIN memo plan query_sqlを使用して具体的な例外スタックを確認してください。 |
| Match mode is invalid                                        | クエリ内のテーブル数がマテリアライズドビュー内のテーブル数と一致せず、書き換えはサポートされません。 |
| Query to view table mapping is null                          | クエリとマテリアライズドビューテーブル間のマッピング生成に失敗しました。 |
| queryToViewTableMappings are over the limit and be intercepted | クエリ内の自己結合テーブルが多すぎて書き換え空間の過度な拡張につながり、透過的書き換えが停止されました。 |
| Query to view slot mapping is null                           | クエリとマテリアライズドビューテーブル間のスロットマッピングに失敗しました。 |
| The graph logic between query and view is not consistent     | クエリとマテリアライズドビュー間のjoin型または結合されるテーブルが異なります。 |
| Predicate compensate fail                                    | 通常、クエリの条件範囲がマテリアライズドビューの条件範囲を超える場合に発生します。例：クエリがa > 10だがマテリアライズドビューがa > 15の場合。 |
| Rewrite compensate predicate by view fail                    | 述語補償が失敗しました。通常、クエリに補償が必要な追加条件があるが、それらの条件で使用される列がマテリアライズドビューのSELECT句に現れない場合に発生します。 |
| Calc invalid partitions fail                                 | パーティション・マテリアライズドビューで、クエリで使用されるパーティションが有効かどうかの計算試行が失敗しました。 |
| mv can not offer any partition for query                     | クエリがマテリアライズドビューの無効なパーティションのみを使用します（最後のリフレッシュ以降にデータが変更）。show partitions from mv_name（SyncWithBaseTables=falseはリフレッシュ必要を示す）でパーティション有効性を確認してください。grace_period（秒単位）を設定してデータ遅延を許可してください。 |
| Add filter to base table fail when union rewrite             | クエリがマテリアライズドビューの無効なパーティションを使用し、マテリアライズドビューと基礎テーブルのunion all試行が失敗しました。 |
| RewrittenPlan output logical properties is different with target group | 書き換え後、マテリアライズドビューの出力論理プロパティが元のクエリのものと一致しません。 |
| Rewrite expressions by view in join fail                     | join書き換えで、クエリで使用されるフィールドまたは式がマテリアライズドビューに存在しません。 |
| Rewrite expressions by view in scan fail                     | 単一テーブル書き換えで、クエリで使用されるフィールドまたは式がマテリアライズドビューに存在しません。 |
| Split view to top plan and agg fail, view doesn't not contain aggregate | 集約書き換え中、マテリアライズドビューに集約関数が含まれていません。 |
| Split query to top plan and agg fail                         | 集約書き換え中、クエリに集約関数が含まれていません。 |
| rewritten expression contains aggregate functions when group equals aggregate rewrite | クエリとマテリアライズドビューが同じGROUP BYを持つ場合、書き換えられた式に集約関数が含まれます。 |
| Can not rewrite expression when no roll up                   | クエリとマテリアライズドビューが同じGROUP BYを持つ場合、式の書き換えが失敗します。 |
| Query function roll up fail                                  | 集約書き換え中、集約関数のロールアップが失敗します。 |
| View dimensions do not cover the query dimensions            | クエリのGROUP BYがマテリアライズドビューのGROUP BYに存在しないディメンションを使用しています。 |
| View dimensions don't not cover the query dimensions in bottom agg | 上記と同様ですが、ボトムレベルの集約に特有です。 |
| View dimensions do not cover the query group set dimensions  | クエリのGROUP SETSがマテリアライズドビューのGROUP BYに存在しないディメンションを使用しています。 |
| The only one of query or view is scalar aggregate and can not rewrite expression meanwhile | クエリにGROUP BYがあるがマテリアライズドビューにはない場合。 |
| Both query and view have group sets, or query doesn't have but view has, not supported | クエリとマテリアライズドビューの両方にGROUP SETS、またはマテリアライズドビューのみにあるサポートされない透過的書き換えシナリオ。 |

### 3 非同期マテリアライズドビュー・パーティション構築失敗の理由

パーティション・マテリアライズドビューのリフレッシュメカニズムは増分パーティション更新に依存します：

- 最初に、マテリアライズドビューのパーティション列が基礎テーブルのパーティション列にマップできるかを計算します。

- 次に、具体的なマッピング関係、1:1か1:nかを決定します。

| 抽象                                                        | 説明                                                         |
| ------------------------------------------------------------ | ------------------------------------------------------------ |
| Partition column cannot be found in the SQL SELECT column    | マテリアライズドビュー定義でPARTITION BY後に使用される列は、マテリアライズドビューを定義するSQLのSELECT句に現れる必要があります。 |
| Cannot find a valid partition track column, because %s       | 適切なパーティション列を見つけることができません；具体的な理由は「because」の後に続きます。 |
| Partition track does not support mark join                   | マテリアライズドビューのパーティションフィールドで参照される列が、mark joinでの入力テーブルのパーティション列であり、現在サポートされていません。 |
| Partition column is in an unsupported join null generation side | マテリアライズドビューのパーティションフィールドの参照列が、LEFT JOINの右側などのjoinのnull生成側にあります。 |
| Relation should be LogicalCatalogRelation                    | マテリアライズドビューで参照されるパーティション基礎テーブルのスキャン型はLogicalCatalogRelationである必要があります；他の型は現在サポートされていません。 |
| Self join does not support partition update                  | 自己結合を含むSQLクエリの場合、マテリアライズドビューの構築は現在サポートされていません。 |
| Partition track already has a related base table column      | マテリアライズドビューで参照されるパーティション列は現在、単一基礎テーブルのパーティション列の参照のみをサポートします。 |
| Relation base table is not MTMVRelatedTableIf                | マテリアライズドビューで参照されるパーティション基礎テーブルがMTMVRelatedTableIfを継承していません。これはテーブルがパーティション化可能かを示します。 |
| The related base table is not a partition table              | マテリアライズドビューで使用される基礎テーブルがパーティションテーブルではありません。 |
| The related base table partition column doesn't contain the MV partition | マテリアライズドビューでPARTITION BY後に参照される列がパーティション基礎テーブルに存在しません。 |
| Group BY sets are empty, does not contain the target partition | マテリアライズドビューを定義するSQLで集約を使用していますが、GROUP BY句が空です。 |
| Window partition sets do not contain the target partition    | ウィンドウ関数が使用されていますが、マテリアライズドビューで参照されるパーティション列がPARTITION BY句にありません。 |
| Unsupported plan operation in track partition                | マテリアライズドビューを定義するSQLでORDER BYなどサポートされていない操作を使用しています。 |
| Context partition column should be a slot from column        | ウィンドウ関数が使用され、PARTITION BY句で、マテリアライズドビューで参照されるパーティション列が単純な列ではなく式です。 |
| Partition expressions use more than one slot reference       | GROUP BYまたはPARTITION BY後のパーティション列が、単純な列ではなく複数の列を含む式です。例：GROUP BY partition_col + other_col。 |
| Column to check using invalid implicit expression            | マテリアライズドビューのパーティション列はdate_truncでのみ使用でき、パーティション列を使用する式はdate_truncなどのみ可能です。 |
| Partition column time unit level should be greater than SQL SELECT column | マテリアライズドビューで、PARTITION BY後のdate_trunc内の時間単位粒度が、マテリアライズドビューを定義するSQL内のSELECT後に現れる時間単位粒度より小さい場合。例：マテリアライズドビューが`PARTITION BY(date_trunc(col, 'day'))`を使用するが、マテリアライズドビューを定義するSQLのSELECT後に`date_trunc(col, 'month')`がある場合。 |
