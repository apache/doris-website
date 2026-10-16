---
title: 非同期マテリアライズドビュー FAQ
description: "非同期マテリアライズドビューの構築エラー、リフレッシュの例外、透過的な書き換えの失敗、利用不可状態の調査と解決に関する FAQ。"
language: ja
keywords:
    - 非同期マテリアライズドビュー FAQ
    - マテリアライズドビューのリフレッシュ失敗
    - 透過的な書き換えの失敗
    - パーティションマテリアライズドビューのエラー
    - Unable to find a suitable base table for partitioning
    - MaterializedViewRewriteFail
    - grace_period
    - excluded_trigger_tables
---

<!-- Knowledge type: Troubleshooting / FAQ -->
<!-- Applicable scenarios: Diagnosing issues during async materialized view build, refresh, and query rewrite -->

このドキュメントでは、非同期マテリアライズドビューの利用時によくある質問とトラブルシューティング方法をまとめます。**非同期マテリアライズドビュー**とは、ベーステーブルのデータを基に事前計算した結果セットです。必要に応じて、またはスケジュールに従ってリフレッシュされ、クエリを透過的に書き換えて高速化するために使用できます。

## クイックナビゲーション {#quick-navigation}

<!-- Knowledge type: Index -->
<!-- Applicable scenarios: Quickly locating issues and the corresponding sections -->

問題を利用段階に応じた二つのカテゴリに分け、原因を参照するための付録を設けています。

| カテゴリ | 対象となる問題 | キーワード |
| --- | --- | --- |
| [構築とリフレッシュ](#build-and-refresh) | 作成エラー、リフレッシュ方法、スキーマ変更、リソース消費 | `BUILD`, `REFRESH`, `workload_group` |
| [クエリと透過的な書き換え](#query-and-transparent-rewrite) | ヒットの有無、ヒットしない理由、利用不可状態 | `explain`, `MaterializedViewRewrite`, `grace_period` |
| [付録](#appendix) | 透過的な書き換えの失敗原因、パーティションの構築失敗原因の一覧 | 原因の参照表 |

よくある問題の早見表：

- パーティションマテリアライズドビューの作成時に `Unable to find a suitable base table for partitioning` が発生する場合は、[Q12](#q12-error-when-building-a-partition-materialized-view) と [付録 2](#appendix-2-async-materialized-view-partition-build-failure-causes) を参照してください。
- 作成文で `Syntax error` が報告される場合は、[Q13](#q13-syntax-error-when-creating-a-materialized-view) を参照してください。
- リフレッシュは成功してもマテリアライズドビューにデータがない場合は、[Q14](#q14-the-materialized-view-still-has-no-data-after-a-successful-refresh) を参照してください。
- パーティションマテリアライズドビューが毎回フルリフレッシュされる場合は、[Q15](#q15-why-does-a-partition-materialized-view-do-a-full-refresh-every-time) を参照してください。
- 透過的な書き換えがヒットしない場合は、[「クエリと透過的な書き換え」の Q1/Q2](#q1-how-to-confirm-whether-a-query-hits-the-materialized-view) と [付録 1](#appendix-1-transparent-rewrite-failure-summary-information) を参照してください。

## 構築とリフレッシュ {#build-and-refresh}

<!-- Knowledge type: Troubleshooting -->
<!-- Applicable scenarios: Issues during materialized view creation, refresh, and modification -->

### Q1: リフレッシュが必要なパーティションはどのように判定されますか？ {#q1-how-does-the-materialized-view-determine-which-partitions-need-to-be-refreshed}

Doris はマテリアライズドビューとベーステーブルの間のパーティション対応関係を内部で計算し、前回成功したリフレッシュで使用したベーステーブルのパーティションバージョンを記録します。次回のリフレッシュ時に現在のバージョンと比較し、各パーティションをリフレッシュする必要があるかどうかを判定します。

**例**：マテリアライズドビュー `mv1` がベーステーブル `t1` と `t2` から作成され、`t1` に基づいてパーティション分割されているとします。パーティション `p202003`（`mv1`）が、パーティション `p20200301` と `p20200302`（`t1`）に対応する場合：

- `p202003` のリフレッシュ後、`p20200301`、`p20200302`、テーブル `t2` の現在のバージョンが記録されます。
- 次回のリフレッシュ時に `p20200301`、`p20200302`、または `t2` のバージョンが変わっていれば、`p202003` のリフレッシュが必要です。

**業務上の除外設定**：業務要件上、`t2` の変更によって `mv1` をリフレッシュする必要がない場合は、マテリアライズドビューのプロパティ `excluded_trigger_tables` で設定できます。

### Q2: マテリアライズドビューが多くのリソースを消費し、ほかのワークロードに影響する場合はどうすればよいですか？ {#q2-what-if-the-materialized-view-consumes-too-many-resources-and-affects-other-workloads}

マテリアライズドビューのプロパティで [workload_group](../../../admin-manual/workload-management/workload-group.md) を指定すると、リフレッシュタスクのリソース使用量を制御できます。

**注意事項**：単一パーティションのリフレッシュに必要なメモリよりも設定値が小さい場合、リフレッシュタスクは失敗します。業務要件に合わせて設定を調整してください。

### Q3: 既存のマテリアライズドビューを基に新しいマテリアライズドビューを作成できますか？ {#q3-can-a-new-materialized-view-be-created-based-on-an-existing-materialized-view}

はい。Doris 2.1.3 以降でサポートされています。

**注記**：各マテリアライズドビューのリフレッシュ処理は独立しています。たとえば、`mv2` が `mv1` を基に作成され、`mv1` が `t1` を基に作成されている場合、`mv2` をリフレッシュしても、`mv1` と `t1` のデータが同期しているかどうかは考慮されません。

### Q4: Doris では、どの外部テーブルをマテリアライズドビューに使用できますか？ {#q4-which-external-tables-does-doris-support-for-materialized-views}

Doris がサポートするすべての外部テーブルからマテリアライズドビューを作成できます。ただし、現在**パーティション単位のリフレッシュをサポートするのは Hive のみ**です。ほかの種類は今後のリリースでサポートされる予定です。

### Q5: マテリアライズドビューが Hive のデータと一致しているように見えても、実際には一致していない場合 {#q5-the-materialized-view-appears-consistent-with-hive-data-but-is-actually-inconsistent}

マテリアライズドビューが保証できるのは、そのデータと Catalog 経由のクエリ結果との整合性だけです。

Catalog にはメタデータやデータのキャッシュが含まれるため、マテリアライズドビューを Hive のデータと整合させるには、`Refresh Catalog` などの方法で Catalog のデータと Hive のデータの整合性を確保する必要があります。

### Q6: マテリアライズドビューはスキーマ変更をサポートしますか？ {#q6-does-the-materialized-view-support-schema-change}

変更はサポートされていません。マテリアライズドビューの列属性は定義 SQL から推定され、明示的な変更は現在サポートされていません。

### Q7: マテリアライズドビューが使用するベーステーブルのスキーマは変更できますか？ {#q7-are-schema-changes-allowed-on-the-base-tables-used-by-a-materialized-view}

はい。ただし、変更後には次の状態遷移が発生します。

- このベーステーブルを使用するマテリアライズドビューの状態は、`NORMAL` から `SCHEMA_CHANGE` に変わります。
- `SCHEMA_CHANGE` 状態のマテリアライズドビューは透過的な書き換えには使用できませんが、直接クエリすることはできます。
- 次回のリフレッシュタスクが成功すると、状態は `SCHEMA_CHANGE` から `NORMAL` に戻ります。

### Q8: Unique Key モデルのテーブルからマテリアライズドビューを作成できますか？ {#q8-can-a-table-with-the-unique-key-model-be-used-to-create-a-materialized-view}

はい。ベーステーブルのデータモデルに制限はありません。ただし、**マテリアライズドビュー自体は Duplicate Key モデルしか使用できません**。

### Q9: マテリアライズドビューにインデックスを作成できますか？ {#q9-can-indexes-still-be-created-on-a-materialized-view}

はい。

### Q10: マテリアライズドビューのリフレッシュ時にテーブルはロックされますか？ {#q10-does-refreshing-a-materialized-view-lock-the-table}

リフレッシュ処理でテーブルがロックされるのは、ごく短い段階だけです。テーブルロックが継続して保持されることはありません（ロック時間はデータロード時とほぼ同程度です）。

### Q11: マテリアライズドビューは準リアルタイムの用途に適していますか？ {#q11-are-materialized-views-suitable-for-near-real-time-scenarios}

あまり適していません。マテリアライズドビューのリフレッシュはパーティション単位が最小であり、データ量が多いと相当のリソースを消費し、十分な鮮度も得られません。代わりに同期マテリアライズドビューなどの方法を推奨します。

### Q12: パーティションマテリアライズドビューの構築時にエラーが発生する場合 {#q12-error-when-building-a-partition-materialized-view}

**エラーメッセージ**：

```text
Unable to find a suitable base table for partitioning
```

**原因の分析**：

通常、マテリアライズドビューの SQL 定義とパーティション列の選択によって、パーティションの増分更新ができないことが原因です。このため、パーティションマテリアライズドビューの作成時にエラーが発生します。

- パーティションの増分更新を行うには、対応する要件を満たす必要があります。詳細は [マテリアライズドビューのリフレッシュモード](../../../sql-manual/sql-statements/table-and-view/async-materialized-view/CREATE-ASYNC-MATERIALIZED-VIEW.md#optional-parameters) を参照してください。
- 最新バージョンでは、パーティションの構築が失敗した具体的な理由が報告されます。原因と説明の一覧は [付録 2](#appendix-2-async-materialized-view-partition-build-failure-causes) を参照してください。

**例**：

次の二つのベーステーブルは、パーティション分割された `orders` と、パーティション分割されていない `lineitem` です。

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
) DISTRIBUTED BY HASH(o_orderkey) BUCKETS 3;


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
) DISTRIBUTED BY HASH(l_orderkey) BUCKETS 3;
```

マテリアライズドビューを次のように定義します。`orders.o_orderdate` をパーティション列に選ぶとパーティションの増分更新がサポートされます。一方、`lineitem.l_shipdate` を使用しても増分更新はできません。

```sql
CREATE MATERIALIZED VIEW mv_1 
       BUILD IMMEDIATE 
       REFRESH AUTO ON MANUAL 
       partition by(o_orderdate) 
       DISTRIBUTED BY RANDOM BUCKETS 2
       AS 
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

**`lineitem.l_shipdate` をパーティション列に選べない理由**：

1. `lineitem.l_shipdate` はベーステーブルのパーティション列ではありません。実際、`lineitem` テーブルにはパーティション列が設定されていません。
2. `lineitem.l_shipdate` は、`null` 値が生成される `outer join` の片側にある列です。

### Q13: マテリアライズドビューの作成時に構文エラーが発生する場合 {#q13-syntax-error-when-creating-a-materialized-view}

**エラーメッセージ**：

```text
ERROR 1105 (HY000): errCode = 2, detailMessage = Syntax error in line 1:
BUILD IMMEDIATE REFRESH AUTO ON MANUAL
```

**考えられる原因**：

1. 非同期マテリアライズドビューの文は、新しいオプティマイザでのみサポートされます。新しいオプティマイザを使用していることを確認してください。

    ```sql
    SET enable_nereids_planner = true;
    ```

2. マテリアライズドビューの構築文に**キーワードのスペルミス**があるか、**定義 SQL に構文上の問題**があります。マテリアライズドビューの定義 SQL と作成文が正しいか確認してください。

### Q14: リフレッシュが成功してもマテリアライズドビューにデータがない場合 {#q14-the-materialized-view-still-has-no-data-after-a-successful-refresh}

マテリアライズドビューがデータの更新要否を判定するには、ベーステーブルまたはそのパーティションのバージョン情報を取得できる必要があります。

現在バージョン情報を取得できないデータレイク（JDBC Catalog など）では、リフレッシュ時にマテリアライズドビューの更新は不要と判定されます。**そのため、このようなマテリアライズドビューを作成またはリフレッシュする際は、`complete` を指定し、`auto` は指定しないでください**。

データレイクに対するマテリアライズドビューのサポート状況は、[データレイクのサポート](./overview.md) を参照してください。

### Q15: パーティションマテリアライズドビューが毎回フルリフレッシュされるのはなぜですか？ {#q15-why-does-a-partition-materialized-view-do-a-full-refresh-every-time}

マテリアライズドビューのパーティションの増分リフレッシュは、ベーステーブルのパーティションのバージョン情報に依存します。マテリアライズドビューのパーティションに対応するベーステーブルのパーティションデータが前回のリフレッシュから変更された場合、そのパーティションだけがリフレッシュされます。

**考えられる原因**：

マテリアライズドビューの定義 SQL に含まれる**パーティション追跡の対象ではないテーブル**のデータが変更された場合、リフレッシュ時に更新が必要なパーティションを判定できなくなるため、フルリフレッシュしかできません。

**例**：

このマテリアライズドビューは、`o_orderdate` パーティション（`orders` テーブル）を追跡します。ただし、`lineitem` または `partsupp` のデータが変わると、更新すべきパーティションを判定できず、フルリフレッシュしかできません。

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

**トラブルシューティングの手順**：

- **目的**：マテリアライズドビューが追跡するベーステーブルとパーティション列を確認します。
- **コマンド**：

    ```sql
    SELECT * 
    FROM mv_infos('database'='db_name')
    WHERE Name = 'partition_mv' \G 
    ```

- **説明**：結果の `MvPartitionInfo.partitionType` が `FOLLOW_BASE_TABLE` であることは、マテリアライズドビューのパーティションがベーステーブルのパーティションに従うことを示し、`relatedCol` が `o_orderdate` であることは、この列に基づいてパーティション分割されていることを示します。

    ```text
                    Id: 1752809156450
                  Name: partition_mv
               JobName: inner_mtmv_1752809156450
                 State: NORMAL
    SchemaChangeDetail: 
          RefreshState: SUCCESS
           RefreshInfo: BUILD IMMEDIATE REFRESH AUTO ON SCHEDULE EVERY 1 DAY STARTS "2024-12-01 20:30:00"
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

**解決方法**：

`lineitem` または `partsupp` テーブルのデータ変更がマテリアライズドビューに影響しない場合は、`excluded_trigger_tables` プロパティを設定して、これらのテーブルの変更に伴うフルリフレッシュを除外できます。

```sql
ALTER MATERIALIZED VIEW partition_mv set("excluded_trigger_tables"="lineitem,partsupp");
```

## クエリと透過的な書き換え {#query-and-transparent-rewrite}

<!-- Knowledge type: Troubleshooting -->
<!-- Applicable scenarios: Diagnosing materialized view hit rate and transparent rewrite failures -->

### Q1: クエリがマテリアライズドビューにヒットしたか確認する方法 {#q1-how-to-confirm-whether-a-query-hits-the-materialized-view}

`explain query_sql` を使用すると、マテリアライズドビューへのヒット状況の概要を確認できます。

**マテリアライズドビューの例**：

```sql
CREATE MATERIALIZED VIEW mv11
BUILD IMMEDIATE REFRESH AUTO ON MANUAL
partition by(l_shipdate)
DISTRIBUTED BY HASH(l_orderkey) BUCKETS 10
AS
SELECT l_shipdate, l_orderkey, O_ORDERDATE, count(*)
FROM lineitem  
LEFT OUTER JOIN orders on l_orderkey = o_orderkey
GROUP BY l_shipdate, l_orderkey, O_ORDERDATE;
```

**explain の実行**：

```sql
explain
SELECT l_shipdate, l_orderkey, O_ORDERDATE, count(*)
FROM lineitem  
LEFT OUTER JOIN orders on l_orderkey = o_orderkey
GROUP BY l_shipdate, l_orderkey, O_ORDERDATE;
```

**結果の読み方**：

マテリアライズドビューへのヒット情報は、プランの最後に表示されます。主なフィールドの意味は次のとおりです。

| フィールド | 意味 |
| --- | --- |
| `MaterializedViewRewriteSuccessAndChose` | 透過的な書き換えに成功し、CBO が最終的に使用を選択したマテリアライズドビュー名の一覧 |
| `MaterializedViewRewriteSuccessButNotChose` | 透過的な書き換えには成功したものの、CBO が選択しなかったマテリアライズドビュー名の一覧（実行プランでは使用されません） |
| `MaterializedViewRewriteFail` | 透過的な書き換えに失敗したマテリアライズドビューと、その理由の概要の一覧 |

`MaterializedView` 関連の情報が `explain` の末尾に表示されない場合、そのマテリアライズドビューは利用不可状態にあり、透過的な書き換えには参加できません（利用不可状態になる状況については、「使用方法と実践」の「マテリアライズドビューの状態の確認」を参照してください）。

**出力例**：

```text
| MaterializedView                                                                   |
| MaterializedViewRewriteSuccessAndChose:                                            |
| internal#regression_test_nereids_rules_p0_mv#mv11,                                 |
|                                                                                    |
| MaterializedViewRewriteSuccessButNotChose:                                         |
|                                                                                    |
| MaterializedViewRewriteFail:                                                       |
+------------------------------------------------------------------------------------+
```

### Q2: マテリアライズドビューにヒットしない原因は何ですか？ {#q2-what-are-the-reasons-for-a-materialized-view-not-being-hit}

まず、[Q1](#q1-how-to-confirm-whether-a-query-hits-the-materialized-view) の手順でヒットしたか確認してください。

```sql
explain
your_query_sql;
```

**ヒットしない場合に考えられる原因**：

1. Doris 2.1.3 より前のバージョンでは、マテリアライズドビューの透過的な書き換え機能はデフォルトで無効です。機能を有効にするには、対応するスイッチをオンにする必要があります。具体的なスイッチについては、非同期マテリアライズドビュー関連のスイッチを参照してください。
2. マテリアライズドビューが利用不可状態にある可能性があります。構築状態の確認方法については、「マテリアライズドビューの状態の確認」を参照してください。
3. 上記の項目を確認してもヒットしない場合、マテリアライズドビューの定義 SQL とクエリ SQL が、現在の透過的な書き換え機能の対象外である可能性があります。詳細は [マテリアライズドビューの透過的な書き換え機能](../../../query-acceleration/materialized-view/async-materialized-view/functions-and-demands.md#22-transparent-query-rewrite) を参照してください。
4. ヒットしなかった場合の概要情報とその説明は、[付録 1](#appendix-1-transparent-rewrite-failure-summary-information) を参照してください。

以下の二つの例は、透過的な書き換えが失敗する代表的なケースを示します。

#### ケース 1: 結合順序の不一致による書き換えの失敗 {#case-1-inconsistent-join-order-causes-rewrite-failure}

**マテリアライズドビューの作成**：

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

**クエリの実行**：

```sql
explain
SELECT l_shipdate, l_linestatus, O_ORDERDATE, count(*)
FROM orders 
LEFT OUTER JOIN lineitem on l_orderkey = o_orderkey
GROUP BY l_shipdate, l_linestatus, O_ORDERDATE;
```

**Explain の出力**：

```text
| MaterializedView                                                                                          |
| MaterializedViewRewriteSuccessAndChose:                                                                   |
|                                                                                                           |
| MaterializedViewRewriteSuccessButNotChose:                                                                |
|                                                                                                           |
| MaterializedViewRewriteFail:                                                                              |
|   Name: internal#doc_test#mv11                                                                            |
|   FailSummary: View struct info is invalid, The graph logic between query and view is not consistent      |
```

`MaterializedViewRewriteFail` の失敗概要 `The graph logic between query and view is not consistent` は、クエリとマテリアライズドビューの結合ロジックが一致しないこと（結合の種類または結合するテーブルが異なること）を示します。この例では、クエリとマテリアライズドビューでテーブルの結合順序が異なるため、このエラーが報告されます。失敗概要の詳しい説明は [付録 1](#appendix-1-transparent-rewrite-failure-summary-information) を参照してください。

#### ケース 2: マテリアライズドビューでカバーされないディメンション {#case-2-dimensions-not-covered-by-the-materialized-view}

**クエリの実行**：

```sql
explain
SELECT l_shipdate, l_linestatus, O_ORDERDATE, count(*)
FROM lineitem
LEFT OUTER JOIN orders on l_orderkey = o_orderkey
GROUP BY l_shipdate, l_linestatus, O_ORDERDATE;
```

**Explain の出力**：

```text
| MaterializedView                                                                                                          |
| MaterializedViewRewriteSuccessAndChose:                                                                                   |
|                                                                                                                           |
| MaterializedViewRewriteSuccessButNotChose:                                                                                |
|                                                                                                                           |
| MaterializedViewRewriteFail:                                                                                              |
|   Name: internal#doc_test#mv11                                                                                            |
|   FailSummary: View struct info is invalid, View dimensions doesn't not cover the query dimensions                        |
```

失敗概要 `View dimensions doesn't not cover the query dimensions` は、クエリの `group by` 列をマテリアライズドビューの `group by` 列から取得できないことを示します。そのため、このエラーが報告されます。

### Q3: マテリアライズドビューが利用不可状態になるのはどのような場合ですか？ {#q3-what-situations-cause-a-materialized-views-state-to-change-and-become-unavailable}

「利用不可」とは、**マテリアライズドビューを透過的な書き換えに使用できない**ことを意味します。ただし、マテリアライズドビューを直接クエリすることはできます。

| マテリアライズドビューの種類 | 利用不可になるきっかけ | 影響範囲 |
| --- | --- | --- |
| フルマテリアライズドビュー | ベーステーブルのデータ変更 / スキーマ変更 | マテリアライズドビュー全体が利用不可 |
| パーティションマテリアライズドビュー | ベーステーブルのデータ変更 | 対応するパーティションが利用不可 |
| パーティションマテリアライズドビュー | ベーステーブルのスキーマ変更 | マテリアライズドビュー全体が利用不可 |

現在は、リフレッシュの失敗によってもマテリアライズドビューは利用不可になります。今後は、リフレッシュに失敗しても既存のマテリアライズドビューを透過的な書き換えに使用できるよう改善される予定です。

### Q4: マテリアライズドビューを直接クエリしてもデータが返らない場合 {#q4-direct-query-on-the-materialized-view-returns-no-data}

考えられる原因：

- マテリアライズドビューの構築中です。
- マテリアライズドビューの構築に失敗しました。

マテリアライズドビューの状態を照会して確認できます。詳細は「マテリアライズドビューの状態の確認」を参照してください。

### Q5: ベーステーブルのデータが変更されてもマテリアライズドビューがリフレッシュされていない場合、透過的な書き換えはどう動作しますか？ {#q5-when-base-table-data-changes-but-the-materialized-view-has-not-been-refreshed-what-is-the-transparent-rewrite-behavior}

非同期マテリアライズドビューのデータには、ベーステーブルに対して一定の遅延があります。透過的な書き換えの動作は、ベーステーブルの種類と `grace_period` のしきい値によって異なります。

**1. 内部テーブルおよびデータ変更を検出できる外部テーブル（Hive など）**：

`grace_period` は、マテリアライズドビューとベーステーブルのデータの不整合が許容される最大時間です。

| `grace_period` の設定値 | 書き換えの動作 |
| --- | --- |
| `0` | 透過的な書き換えに使用するには、マテリアライズドビューとベーステーブルのデータが完全に一致する必要があります。データ変更を検出できない外部テーブル（Hive 以外）の場合は、データが最新かどうかにかかわらず透過的な書き換えに使用できます（データが一致しない可能性があります） |
| `10`（秒） | マテリアライズドビューとベーステーブルのデータ間で最大 10 秒の遅延を許容します。遅延が 10 秒以内であれば、引き続き透過的な書き換えに使用できます |

**2. パーティションマテリアライズドビューで一部のパーティションが無効な場合**：

- クエリが無効なパーティションのデータを使用しない場合、マテリアライズドビューは引き続き利用できます。
- クエリが無効なパーティションのデータを使用しても、データの遅延が `grace_period` の範囲内であれば、マテリアライズドビューは引き続き利用できます。
- データの遅延が `grace_period` を超える場合は、元のテーブルとマテリアライズドビューを組み合わせてクエリに応答できます。これには、UNION 書き換えスイッチ `enable_materialized_view_union_rewrite` を有効にする必要があります（このスイッチはバージョン 2.1.5 以降、デフォルトで有効です）。

## 付録 {#appendix}

### 付録 1: 透過的な書き換えに失敗した場合の概要情報 {#appendix-1-transparent-rewrite-failure-summary-information}

<!-- Knowledge type: Reference table -->
<!-- Applicable scenarios: Locating the cause of transparent rewrite failure based on the FailSummary in explain output -->

| 概要情報 | 説明 |
| --- | --- |
| View struct info is invalid | マテリアライズドビューの構造情報が無効です。現在サポートされる書き換え SQL のパターンは、クエリとマテリアライズドビューがともに結合を含む場合、またはクエリが集約を含み、マテリアライズドビューには結合が必須ではない場合です。透過的な書き換えでは、多くの場合にこの問題が表示されます。各書き換えルールは特定の SQL パターンを処理するため、要件に一致しないルールがこのエラーを報告するからです。通常、書き換え失敗の主な原因ではありません |
| Materialized view rule exec fail | 透過的な書き換えルールの実行中に例外が発生しました。`Explain memo plan query_sql` で具体的な例外スタックを確認してください |
| Match mode is invalid | クエリとマテリアライズドビューのテーブル数が一致しません。現在、この書き換えはサポートされていません |
| Query to view table mapping is null | クエリとマテリアライズドビューの間のテーブル対応関係を生成できませんでした |
| queryToViewTableMappings are over the limit and be intercepted | クエリ内の自己結合テーブルが多すぎて書き換えの探索空間が過度に広がるため、透過的な書き換えが停止されました |
| Query to view slot mapping is null | クエリのテーブルとマテリアライズドビューのテーブルの間のスロット対応関係を生成できませんでした |
| The graph logic between query and view is not consistent | クエリとマテリアライズドビューで結合の種類が異なるか、結合するテーブルが異なります |
| Predicate compensate fail | 通常、クエリの条件範囲がマテリアライズドビューの範囲外です。たとえば、クエリが `a > 10` で、マテリアライズドビューが `a > 15` の場合です |
| Rewrite compensate predicate by view fail | 述語の補完に失敗しました。通常、クエリにはマテリアライズドビューより多くの条件があり、それらを補完する必要がありますが、条件に使用する列がマテリアライズドビューの select 句にありません |
| Calc invalid partitions fail | パーティションマテリアライズドビューで、クエリが使用するパーティションの有効性の計算に失敗しました |
| mv can not offer any partition for query | クエリがマテリアライズドビューの無効なパーティションのみを使用しています。`show partitions from mv_name` でパーティションの `SyncWithBaseTables` フィールドが true か確認してください。false の場合は、該当するパーティションを手動でリフレッシュしてください。マテリアライズドビューとクエリのデータ間に一定の遅延を許容できる場合は、マテリアライズドビューの `grace_period` プロパティを秒単位で設定してください |
| Add filter to base table fail when union rewrite | クエリがマテリアライズドビューの無効なパーティションを使用しており、マテリアライズドビューと元のテーブルを UNION ALL で結合する処理に失敗しました |
| RewrittenPlan output logical properties is different with target group | 書き換えは完了しましたが、マテリアライズドビューの出力が元のクエリと一致しません |
| Rewrite expressions by view in join fail | 結合の書き換え時に、クエリで使用するフィールドまたは式がマテリアライズドビューにありません |
| Rewrite expressions by view in scan fail | 単一テーブルの書き換え時に、クエリで使用するフィールドまたは式がマテリアライズドビューにありません |
| Split view to top plan and agg fail, view doesn't not contain aggregate | 集約の書き換え時に、マテリアライズドビューに集約がありません |
| Split query to top plan and agg fail | 集約の書き換え時に、クエリに集約がありません |
| rewritten expression contains aggregate functions when group equals aggregate rewrite | クエリとマテリアライズドビューの `group by` 句が同じとき、書き換え後の式に集約関数が含まれています |
| Can not rewrite expression when no roll up | クエリとマテリアライズドビューの `group by` 句が同じとき、式の書き換えに失敗しました |
| Query function roll up fail | 集約の書き換え時に、集約関数のロールアップに失敗しました |
| View dimensions do not cover the query dimensions | クエリの `group by` 句に、マテリアライズドビューの `group by` 句にないディメンションが使われています |
| View dimensions don't not cover the query dimensions in bottom agg | クエリの `group by` 句に、マテリアライズドビューの `group by` 句にないディメンションが使われています |
| View dimensions do not cover the query group set dimensions | クエリの `group sets` に、マテリアライズドビューの `group by` 句にないディメンションが使われています |
| The only one of query or view is scalar aggregate and can not rewrite expression meanwhile | クエリには `group by` がありますが、マテリアライズドビューにはありません |
| Both query and view have group sets, or query doesn't have but view has, not supported | クエリとマテリアライズドビューの両方に `group sets` があるか、クエリには `group sets` がなくマテリアライズドビューにだけあります。この場合、透過的な書き換えはサポートされません |

### 付録 2: 非同期マテリアライズドビューのパーティション構築が失敗する原因 {#appendix-2-async-materialized-view-partition-build-failure-causes}

<!-- Knowledge type: Reference table -->
<!-- Applicable scenarios: Locating causes when an error is reported while creating a partition materialized view -->

パーティションマテリアライズドビューは、パーティションの増分更新という原理でリフレッシュします。

1. **ステップ 1**：マテリアライズドビューのパーティション列をベーステーブルのパーティションに対応付けられるか計算します。
2. **ステップ 2**：具体的な対応関係、つまりパーティションが 1:1 と 1:n のどちらで対応するかを計算します。

| 概要情報 | 説明 |
| --- | --- |
| partition column can not be found in the SQL select column | マテリアライズドビューの定義で `partition by` の後に使用する列は、定義 SQL の select 句にも含まれている必要があります |
| can't not find valid partition track column, because %s | 適切なパーティション列が見つかりませんでした。具体的な理由は `because` の後に続きます |
| partition track doesn't support mark join | マテリアライズドビューのパーティション列が参照する列は、マーク結合の入力テーブルのパーティション列ですが、これはサポートされていません |
| partition column is in un supported join null generate side | マテリアライズドビューのパーティション列が参照する列は、結合で null が生成される側（たとえば左結合の右側）にあります |
| relation should be LogicalCatalogRelation | マテリアライズドビューが参照するパーティションのベーステーブルのスキャン種別は `LogicalCatalogRelation` である必要があります。ほかの種類はサポートされていません |
| self join doesn't support partition update | 自己結合を使用した SQL によるマテリアライズドビューの構築は、まだサポートされていません |
| partition track already has a related base table column | マテリアライズドビューのパーティション列は現在、一つのベーステーブルのパーティション列の参照のみをサポートします |
| relation base table is not MTMVRelatedTableIf | マテリアライズドビューが参照するパーティションのベーステーブルは、テーブルをパーティション分割できるかどうかを示すインターフェース `MTMVRelatedTableIf` を継承していません |
| The related base table is not partition table | マテリアライズドビューが使用するベーステーブルは、パーティション分割されたテーブルではありません |
| The related base table partition column doesn't contain the mv partition | マテリアライズドビューの `partition by` の後で参照する列は、パーティションのベーステーブルに存在しません |
| group by sets is empty, doesn't contain the target partition | マテリアライズドビューの定義 SQL では集約を使用していますが、`group by` が空です |
| window partition sets don't contain the target partition | ウィンドウ関数を使用していますが、マテリアライズドビューが参照するパーティション列が `partition by` 句にありません |
| Unsupported plan operate in track partition | マテリアライズドビューの定義 SQL で、`order by` などのサポートされていない操作を使用しています |
| context partition column should be slot from column | ウィンドウ関数を使用しており、マテリアライズドビューが `partition by` 句で参照するパーティション列が、単純な列ではなく式です |
| partition expressions use more than one slot reference | `group by` または `partition by` の後に指定されたパーティション列が、単純な列ではなく複数の列を含む式です。例：`group by partition_col + other_col` |
| column to check using invalid implicit expression | マテリアライズドビューのパーティション列には `date_trunc` のみを使用できます。パーティション列に対する式は、`date_trunc` や類似のものに制限されます |
| partition column time unit level should be greater than SQL select column | マテリアライズドビューの `date_trunc`（`partition by` 句）の時間粒度が、定義 SQL の select 句に現れる時間粒度より細かくなっています。たとえば、マテリアライズドビューでは `partition by(date_trunc(col, 'day'))` を使用し、定義 SQL の select 句では `date_trunc(col, 'month')` を使用する場合です |
