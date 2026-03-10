---
{
  "title": "よくある質問",
  "language": "ja",
  "description": "Dorisは内部的にマテリアライズドビューとベーステーブル間のパーティション対応を計算し、ベーステーブルのバージョンを記録する"
}
---
## Build and Refresh

### Q1: Dorisはマテリアライズドビューに対してどのパーティションを更新する必要があるかをどのように判定しますか？

Dorisは内部的にマテリアライズドビューとベーステーブル間のパーティション対応関係を計算し、最後に成功した更新後にマテリアライズドビューが使用したベーステーブルパーティションのバージョンを記録します。例えば、マテリアライズドビューmv1がベーステーブルt1とt2から作成され、t1に基づいてパーティション化されている場合。

mv1のパーティションp202003がベーステーブルt1のパーティションp20200301とp20200302に対応していると仮定すると、p202003を更新した後、Dorisはパーティションp20200301とp20200302、およびテーブルt2の現在のバージョンを記録します。

次の更新時、Dorisはp20200301、p20200302、およびt2のバージョンが変更されているかを確認します。これらのいずれかが変更されている場合、p202003を更新する必要があることを示します。

または、t2への変更がmv1の更新をトリガーすることなく受け入れられる場合、マテリアライズドビューの`excluded_trigger_tables`プロパティを使用してこれを設定できます。

### Q2: マテリアライズドビューが過多のリソースを消費し、他のビジネス操作に影響を与える場合、どのような対処が可能ですか？

マテリアライズドビューのプロパティを通じて[workload_group](../../../admin-manual/workload-management/workload-group)を指定することで、マテリアライズドビュー更新タスクに割り当てられるリソースを制御できます。

メモリ割り当てが少なすぎて単一パーティションの更新により多くのメモリが必要な場合、タスクが失敗する可能性があることに注意することが重要です。このトレードオフはビジネス要件に基づいて慎重に検討する必要があります。

### Q3: 既存のマテリアライズドビューに基づいて新しいマテリアライズドビューを作成できますか？

はい、これはDoris 2.1.3以降でサポートされています。ただし、各マテリアライズドビューはデータ更新時に独自の更新ロジックを使用します。例えば、mv2がmv1に基づき、mv1がt1に基づいている場合、mv2の更新中にmv1とt1間の同期は考慮されません。

### Q4: Dorisがサポートしている外部テーブルはどれですか？

Dorisがサポートするすべての外部テーブルをマテリアライズドビューの作成に使用できます。ただし、現在パーティション更新をサポートしているのはHiveのみで、他のタイプのサポートは将来予定されています。

### Q5: マテリアライズドビューがHiveと同じデータを表示しているが、実際には一貫性がありません。

マテリアライズドビューはCatalogを通じて取得した結果との一貫性のみを保証します。Catalogにはメタデータとデータキャッシングが含まれているため、マテリアライズドビューとHiveデータの一貫性を保証するには、`REFRESH CATALOG`などの方法を使用してCatalogを更新し、CatalogデータをHiveと同期する必要がある場合があります。

### Q6: マテリアライズドビューはschema変更をサポートしていますか？

いいえ、マテリアライズドビューの列属性はマテリアライズドビュー自体のSQL定義から派生するため、schema変更はサポートされていません。明示的なカスタム修正は許可されていません。

### Q7: マテリアライズドビューが使用するベーステーブルでschema変更を行うことはできますか？

はい、schema変更は許可されています。ただし、変更後、このベーステーブルを使用するマテリアライズドビューのステータスはNORMALからSCHEMA_CHANGEに変更され、この時点でマテリアライズドビューは透過的な書き換えに使用できませんが、マテリアライズドビューへの直接クエリは影響を受けません。マテリアライズドビューの次の更新タスクが成功すると、そのステータスはNORMALに戻ります。

### Q8: primary keyモデルのテーブルをマテリアライズドビューの作成に使用できますか？

マテリアライズドビューのベーステーブルのデータモデルに制限はありません。ただし、マテリアライズドビュー自体はdetailed modelのみ可能です。

### Q9: マテリアライズドビューにインデックスを作成できますか？

はい。

### Q10: マテリアライズドビューは更新中にテーブルをロックしますか？

更新中にテーブルロックが短時間発生しますが、テーブルロックを継続的に占有することはありません（データインポート時のロック時間とほぼ同等）。

### Q11: マテリアライズドビューはニアリアルタイムシナリオに適していますか？

特に適していません。マテリアライズドビューの更新の最小単位はパーティションであり、大量のデータボリュームに対して大量のリソースを消費する可能性があり、リアルタイム機能が不足しています。代わりに同期マテリアライズドビューや他の方法の使用を検討してください。

### Q12: パーティション化されたマテリアライズドビューの構築時にエラーが発生

Error Message:

```sql
Unable to find a suitable base table for partitioning
```
このエラーは通常、マテリアライズドビューのSQL定義とパーティショニングフィールドの選択が増分パーティション更新を許可しないため、パーティション化されたマテリアライズドビューの作成中にエラーが発生することを示しています。

- 増分パーティション更新については、マテリアライズドビューのSQL定義とパーティショニングフィールドの選択が特定の要件を満たす必要があります。詳細については、[Materialized View Refresh Modes](../../../sql-manual/sql-statements/table-and-view/async-materialized-view/CREATE-ASYNC-MATERIALIZED-VIEW#optional-parameters)を参照してください。

- 最新のコードではパーティションビルド失敗の理由を示すことができ、エラーの要約と説明が付録2に記載されています。

例:

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
以下のマテリアライズドビュー定義では、マテリアライズドビューのパーティショニングフィールドとして `orders.o_orderdate` を選択した場合、増分パーティション更新が可能になります。逆に、`lineitem.l_shipdate` を使用した場合は増分更新が有効になりません。

理由：

1. `lineitem.l_shipdate` はベーステーブルのパーティショニング列ではなく、`lineitem` にはパーティショニング列が定義されていません。

2. `lineitem.l_shipdate` は `outer join` 操作中に `null` 値を生成する列です。

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
理由は以下の通りです：

1. 非同期マテリアライズドビューを作成するステートメントは、新しいオプティマイザーでのみサポートされています。新しいオプティマイザーを使用していることを確認してください：

    ```sql
    SET enable_nereids_planner = true;
    ```
2. refresh キーワードにタイポグラフィエラーがあるか、マテリアライズドビューのSQL定義に構文エラーがある可能性があります。マテリアライズドビューのSQL定義と作成文の正確性を確認してください。

### Q14: マテリアライズドビューの更新が正常に完了したのにデータが存在しない

マテリアライズドビューは、ベーステーブルまたはベーステーブルパーティションからバージョン情報を取得する能力に基づいて、データを更新する必要があるかどうかを判断します。

現在バージョン情報の取得をサポートしていないデータレイク（JDBC Catalogなど）に遭遇した場合、更新プロセスはマテリアライズドビューを更新する必要がないと判断します。そのため、マテリアライズドビューを作成または更新する際は、autoではなくcompleteを指定する必要があります。

データレイクに対するマテリアライズドビューサポートの進捗については、[Data Lake Support Status.](./overview.md)を参照してください。


### Q15: パーティション化されたマテリアライズドビューが常に完全更新されるのはなぜですか？
マテリアライズドビューのパーティションの増分更新は、ベーステーブルパーティションからのバージョン情報に依存します。前回の更新以降にベーステーブルパーティションのデータが変更された場合、マテリアライズドビューは対応するパーティションを更新します。
パーティション化されたマテリアライズドビューが完全更新されている場合、考えられる理由は以下の通りです：

マテリアライズドビューの定義SQLで参照されているパーティション追跡されていないテーブルで変更が発生し、どのパーティションを更新する必要があるかを判断できないため、完全更新が強制されています。
例：
このマテリアライズドビューはordersテーブルのo_orderdateパーティションを追跡していますが、lineitemまたはpartsuppのデータが変更された場合、システムはどのパーティションを更新する必要があるかを判断できず、結果として完全更新が実行されます。

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
次のコマンドを実行することで、マテリアライズドビューが追跡しているベーステーブルを確認できます

```sql
SELECT *
FROM mv_infos('database'='db_name')
WHERE Name = 'partition_mv' \G
```
返される結果では、MvPartitionInfo で partitionType=FOLLOW_BASE_TABLE が表示されており、マテリアライズドビューのパーティションがベーステーブルのパーティションに従うことを示しています。
relatedCol には o_orderdate が表示されており、マテリアライズドビューのパーティションが o_orderdate カラムに基づいていることを意味します。

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

lineitemやpartsuppテーブルの変更がマテリアライズドビューに影響しない場合、`excluded_trigger_tables`プロパティを設定することで、これらのテーブルがフルリフレッシュをトリガーすることを除外できます:
`ALTER MATERIALIZED VIEW partition_mv set("excluded_trigger_tables"="lineitem,partsupp");`


## クエリと透過的な書き換え

### Q1: マテリアライズドビューがヒットしたことを確認する方法、および非ヒットの理由を見つける方法は？

`explain query_sql`を使用して、マテリアライズドビューのヒットのサマリーを表示できます。

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
- マテリアライズドビューのヒット情報は、プランの最後にあります。

- **MaterializedViewRewriteSuccessAndChose:** 透過的な書き換えが成功したことを示し、Cost-Based Optimizer (CBO) によって選択されたマテリアライズドビューの名前を一覧表示します。

- **MaterializedViewRewriteSuccessButNotChose:** 透過的な書き換えが成功したことを示しますが、CBOによって選択されなかったマテリアライズドビューの名前を一覧表示します。選択されなかったということは、実行プランではこれらのマテリアライズドビューが使用されないことを意味します。

- **MaterializedViewRewriteFail:** 透過的な書き換え失敗の失敗と理由の概要を一覧表示します。

- `explain` 出力の最後に `MaterializedView` 情報がない場合、マテリアライズドビューが使用不可能な状態にあり、そのため透過的な書き換えに参加できないことを意味します。（マテリアライズドビューが使用不可能になる場合の詳細については、「使用方法と実践 - マテリアライズドビューステータスの確認」セクションを参照してください。）

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
### Q2: マテリアライズドビューがヒットしない理由は何ですか？

まず、マテリアライズドビューがヒットするかどうかを確認するには、以下のSQLを実行してください（詳細は[Queries and Transparent Rewriting - Q1](#q1-how-does-doris-determine-which-partitions-need-to-be-refreshed-for-a-materialized-view)を参照）：

```Plain
explain
your_query_sql;
```
ヒットしない場合、以下の理由が考えられます：

- Doris バージョン 2.1.3 以前では、マテリアライズドビューの透明リライト機能はデフォルトで無効になっています。透明リライトを実現するには、対応するスイッチを有効にする必要があります。具体的なスイッチ値については、async-materialized view 関連のスイッチを参照してください。

- マテリアライズドビューが使用不可状態にあり、透明リライトがヒットできない可能性があります。マテリアライズドビューのビルド状況を確認するには、マテリアライズドビューの状態確認に関するセクションを参照してください。

- 最初の2つの手順を確認した後もマテリアライズドビューがヒットしない場合、マテリアライズドビューを定義する SQL とクエリ SQL が、マテリアライズドビューの現在のリライト機能の範囲外にある可能性があります。詳細については [Materialized View Transparent Rewriting Capabilities](../../../query-acceleration/materialized-view/async-materialized-view/functions-and-demands#transparent-rewriting-capability) を参照してください。

- ヒット失敗の詳細情報と説明については、[Appendix 1](#reference) を参照してください。

以下は、マテリアライズドビューの透明リライトが失敗した例です：

**ケース 1:**

マテリアライズドビュー作成 SQL：

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
`Explain`の出力:

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
出力では、`MaterializedViewRewriteFail`が失敗の概要を示しており、`The graph logic between query and view is not consistent`は、クエリとマテリアライズドビューの間の結合ロジックが同じでないことを示しています。これは結合タイプまたは結合されるテーブルが異なることを意味します。

上記の例では、クエリとマテリアライズドビューでのテーブル結合順序が一致していないため、エラーが発生しています。透過的書き換え失敗の概要と説明については、付録1を参照してください。

**ケース2:**

クエリ実行:

```sql
explain
SELECT l_shipdate, l_linestatus, O_ORDERDATE, count(*)
FROM lineitem  
LEFT OUTER JOIN orders on l_orderkey = o_orderkey
GROUP BY l_shipdate, l_linestatus, O_ORDERDATE;
```
`Explain`の出力:

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
失敗サマリ `View dimensions doesn't cover the query dimensions` は、クエリの `GROUP BY` フィールドがマテリアライズドビューの `GROUP BY` フィールドから取得できないため、エラーが発生していることを示しています。

### Q3: マテリアライズドビューの状態が変化して使用不可になる状況とは？

「使用不可」とは、マテリアライズドビューが透明な書き換えに使用できないことを意味しますが、直接クエリすることは可能です。

- 完全なマテリアライズドビューの場合、基盤テーブルのデータ変更やSchema Changeにより、マテリアライズドビューが使用不可になる可能性があります。

- パーティション化されたマテリアライズドビューの場合、基盤テーブルのデータ変更により対応するパーティションが使用不可になり、基盤テーブルのSchema Changeによりマテリアライズドビュー全体が使用不可になる可能性があります。

現在、マテリアライズドビューのリフレッシュ失敗も使用不可の原因となります。ただし、失敗したマテリアライズドビューでも透明な書き換えに使用できるよう最適化が計画されています。

### Q4: マテリアライズドビューへの直接クエリでデータが返されない場合は？

マテリアライズドビューがまだ構築中であるか、構築が失敗している可能性があります。

マテリアライズドビューのステータスを確認してこれを検証できます。具体的な方法については、マテリアライズドビューステータスの確認に関するセクションを参照してください。

### Q5: マテリアライズドビューで使用される基盤テーブルのデータが変更されたが、マテリアライズドビューがまだリフレッシュされていない場合、透明な書き換えの動作はどうなりますか？

async-materialized viewsと基盤テーブル間のデータには一定の遅延があります。

**1. 内部テーブルおよびデータ変更を知覚できる外部テーブル（Hiveなど）の場合：基盤テーブルデータが変更された際、マテリアライズドビューが使用可能かどうかは** **`grace_period`** **しきい値によって決まります。**

`grace_period` は、マテリアライズドビューと基盤テーブル間のデータ不整合を許容する時間です。例えば：

- `grace_period` が0に設定されている場合、透明な書き換えに使用するためにはマテリアライズドビューが基盤テーブルデータと一致している必要があります。外部テーブル（Hiveを除く）の場合、データ変更を知覚できないため、それらを使用するマテリアライズドビューは透明な書き換えに使用できます（ただしデータが不整合になる可能性があります）。

- `grace_period` が10秒に設定されている場合、マテリアライズドビューデータと基盤テーブルデータ間の最大10秒の遅延を許容します。遅延が10秒以内であれば、マテリアライズドビューは透明な書き換えに使用できます。

**2. パーティション化されたマテリアライズドビューで、一部のパーティションが無効になった場合、2つのシナリオがあります：**

- クエリが無効なパーティションのデータを使用しない場合、マテリアライズドビューは使用可能です。

- クエリが無効なパーティションのデータを使用し、データ遅延が `grace_period` 内の場合、マテリアライズドビューは使用可能です。遅延が `grace_period` を超える場合、元のテーブルとマテリアライズドビューをunionすることでクエリに応答できます。これには `enable_materialized_view_union_rewrite` スイッチを有効にする必要があり、バージョン2.1.5以降ではデフォルトで有効になっています。

## リファレンス

### 1 マテリアライズドビュー関連設定

| 設定                                                         | 説明                                                         |
| ------------------------------------------------------------ | ------------------------------------------------------------ |
| SET enable_nereids_planner = true;                           | マテリアライズドビューの書き換えに必要な新しいオプティマイザーを有効にします。 |
| SET enable_materialized_view_rewrite = true;                 | クエリ書き換えを有効または無効にします。デフォルト：有効。   |
| SET materialized_view_rewrite_enable_contain_external_table = true; | 外部テーブルを含むマテリアライズドビューの書き換えへの参加を許可します。デフォルト：無効。 |
| SET materialized_view_rewrite_success_candidate_num = 3;     | CBOで考慮される書き換え成功候補の最大数。デフォルト：3。     |
| SET enable_materialized_view_union_rewrite = true;          | データが不足している場合に基盤テーブルとマテリアライズドビュー間のUNION ALLを許可します。デフォルト：有効。 |
| SET enable_materialized_view_nest_rewrite = true;           | ネストされたマテリアライズドビューの書き換えを有効にします。デフォルト：無効。 |
| SET materialized_view_relation_mapping_max_count = 8;       | 書き換え中の関係マッピングの最大数。デフォルト：8。         |

### 2 透明な書き換え失敗のサマリと説明

| サマリ                                                       | 説明                                                         |
| ------------------------------------------------------------ | ------------------------------------------------------------ |
| View struct info is invalid                                  | マテリアライズドビューの構造情報が無効です。現在、書き換えでサポートされるSQLパターンには、クエリとマテリアライズドビュー両方でのjoin、およびクエリでの集約（マテリアライズドビューでjoinありまたはなし）が含まれます。このエラーは透明な書き換え中によく表示されます。各書き換えルールは特定のSQLパターンを担当しているため、必要なパターンに一致しないルールがヒットした場合、このエラーが発生しますが、一般的には書き換え失敗の主要な原因ではありません。 |
| Materialized view rule exec fail                             | 通常、透明な書き換えルールの実行中の例外を示します。調査するには、EXPLAIN memo plan query_sqlを使用して具体的な例外スタックを表示してください。 |
| Match mode is invalid                                        | クエリのテーブル数がマテリアライズドビューのテーブル数と一致せず、書き換えがサポートされていません。 |
| Query to view table mapping is null                          | クエリとマテリアライズドビューテーブル間のマッピング生成に失敗しました。 |
| queryToViewTableMappings are over the limit and be intercepted | クエリ内の自己結合テーブルが多すぎるため、書き換え空間の過度な拡張が発生し、透明な書き換えが停止されました。 |
| Query to view slot mapping is null                           | クエリとマテリアライズドビューテーブル間のスロットマッピングに失敗しました。 |
| The graph logic between query and view is not consistent     | クエリとマテリアライズドビュー間のjoin型または結合テーブルが異なります。 |
| Predicate compensate fail                                    | 通常、クエリの条件範囲がマテリアライズドビューの範囲を超えている場合に発生します。例：クエリが a > 10 だがマテリアライズドビューが a > 15。 |
| Rewrite compensate predicate by view fail                    | 述語補償に失敗しました。通常、クエリに補償が必要な追加条件があるが、それらの条件で使用される列がマテリアライズドビューのSELECT句に含まれていない場合に発生します。 |
| Calc invalid partitions fail                                 | パーティション化されたマテリアライズドビューで、クエリが使用するパーティションが有効かどうかの計算に失敗しました。 |
| mv can not offer any partition for query                     | クエリがマテリアライズドビューの無効なパーティションのみを使用しています（最後のリフレッシュ以降にデータが変更されました）。show partitions from mv_nameでパーティションの有効性を確認してください（SyncWithBaseTables=falseはリフレッシュが必要であることを示します）。データ遅延を許可するためにgrace_period（秒単位）を設定してください。 |
| Add filter to base table fail when union rewrite             | クエリがマテリアライズドビューの無効なパーティションを使用し、マテリアライズドビューと基盤テーブルのunion allの試行に失敗しました。 |
| RewrittenPlan output logical properties is different with target group | 書き換え後、マテリアライズドビューの出力論理プロパティが元のクエリのものと一致しません。 |
| Rewrite expressions by view in join fail                     | join書き換えで、クエリで使用されるフィールドまたは式がマテリアライズドビューに存在しません。 |
| Rewrite expressions by view in scan fail                     | 単一テーブル書き換えで、クエリで使用されるフィールドまたは式がマテリアライズドビューに存在しません。 |
| Split view to top plan and agg fail, view doesn't not contain aggregate | 集約書き換え中、マテリアライズドビューに集約関数が含まれていません。 |
| Split query to top plan and agg fail                         | 集約書き換え中、クエリに集約関数が含まれていません。        |
| rewritten expression contains aggregate functions when group equals aggregate rewrite | クエリとマテリアライズドビューが同じGROUP BYを持つ場合、書き換えられた式に集約関数が含まれています。 |
| Can not rewrite expression when no roll up                   | クエリとマテリアライズドビューが同じGROUP BYを持つ場合、式の書き換えに失敗しました。 |
| Query function roll up fail                                  | 集約書き換え中、集約関数のロールアップに失敗しました。       |
| View dimensions do not cover the query dimensions            | クエリのGROUP BYが、マテリアライズドビューのGROUP BYに存在しないディメンションを使用しています。 |
| View dimensions don't not cover the query dimensions in bottom agg | 上記と同様ですが、ボトムレベルの集約に固有です。             |
| View dimensions do not cover the query group set dimensions  | クエリのGROUP SETSが、マテリアライズドビューのGROUP BYに存在しないディメンションを使用しています。 |
| The only one of query or view is scalar aggregate and can not rewrite expression meanwhile | クエリにはGROUP BYがあるが、マテリアライズドビューにはありません。 |
| Both query and view have group sets, or query doesn't have but view has, not supported | クエリとマテリアライズドビュー両方でのGROUP SETS、またはマテリアライズドビューのみでのGROUP SETSを含む、サポートされていない透明な書き換えシナリオです。 |

### 3 Async-Materialized Viewパーティション構築失敗の理由

パーティション化されたマテリアライズドビューのリフレッシュメカニズムは、増分パーティション更新に依存しています：

- まず、マテリアライズドビューのパーティション列が基盤テーブルのパーティション列にマッピングできるかどうかを計算します。

- 次に、具体的なマッピング関係が1:1か1:nかを決定します。

| 概要                                                         | 説明                                                         |
| ------------------------------------------------------------ | ------------------------------------------------------------ |
| Partition column cannot be found in the SQL SELECT column    | マテリアライズドビュー定義でPARTITION BY後に使用される列は、マテリアライズドビューを定義するSQLのSELECT句に含まれている必要があります。 |
| Cannot find a valid partition track column, because %s       | 適切なパーティション列を見つけることができません。具体的な理由は「because」の後に続きます。 |
| Partition track does not support mark join                   | マテリアライズドビューのパーティションフィールドが参照する列が、mark joinでの入力テーブルのパーティション列であり、現在サポートされていません。 |
| Partition column is in an unsupported join null generation side | マテリアライズドビューのパーティションフィールドの参照列が、LEFT JOINの右側などのjoinのnull生成側にあります。 |
| Relation should be LogicalCatalogRelation                    | マテリアライズドビューが参照するパーティション基盤テーブルのスキャンタイプはLogicalCatalogRelationである必要があります。他のタイプは現在サポートされていません。 |
| Self join does not support partition update                  | 自己結合を含むSQLクエリでは、マテリアライズドビューの構築は現在サポートされていません。 |
| Partition track already has a related base table column      | マテリアライズドビューが参照するパーティション列は、現在単一の基盤テーブルのパーティション列の参照のみをサポートしています。 |
| Relation base table is not MTMVRelatedTableIf                | マテリアライズドビューが参照するパーティション基盤テーブルがMTMVRelatedTableIfを継承していません。これはテーブルがパーティション化できるかどうかを示します。 |
| The related base table is not a partition table              | マテリアライズドビューが使用する基盤テーブルがパーティションテーブルではありません。 |
| The related base table partition column doesn't contain the MV partition | マテリアライズドビューでPARTITION BY後に参照される列が、パーティション基盤テーブルに存在しません。 |
| Group BY sets are empty, does not contain the target partition | マテリアライズドビューを定義するSQLが集約を使用していますが、GROUP BY句が空です。 |
| Window partition sets do not contain the target partition    | ウィンドウ関数が使用されていますが、マテリアライズドビューが参照するパーティション列がPARTITION BY句に含まれていません。 |
| Unsupported plan operation in track partition                | マテリアライズドビューを定義するSQLが、ORDER BYなどのサポートされていない操作を使用しています。 |
| Context partition column should be a slot from column        | ウィンドウ関数が使用され、PARTITION BY句で、マテリアライズドビューが参照するパーティション列が単純な列ではなく式になっています。 |
| Partition expressions use more than one slot reference       | GROUP BYまたはPARTITION BY後のパーティション列が、単純な列ではなく複数の列を含む式になっています。例：GROUP BY partition_col + other_col。 |
| Column to check using invalid implicit expression            | マテリアライズドビューのパーティション列はdate_trunkでのみ使用でき、パーティション列を使用する式はdate_trunkなどのみ可能です。 |
| Partition column time unit level should be greater than SQL SELECT column | マテリアライズドビューで、PARTITION BY後のdate_trunkでの時間単位粒度が、マテリアライズドビューを定義するSQLのSELECT後に現れる時間単位粒度よりも小さくなっています。例えば、マテリアライズドビューが `PARTITION BY(date_trunc(col, 'day'))` を使用しているが、マテリアライズドビューを定義するSQLのSELECT後に `date_trunc(col, 'month')` がある場合。 |
