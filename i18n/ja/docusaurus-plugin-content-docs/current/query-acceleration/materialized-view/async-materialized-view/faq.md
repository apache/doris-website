---
title: 非同期マテリアライズドビュー FAQ
description: "非同期マテリアライズドビューに関する FAQ のクイックリファレンス。作成時のエラー、リフレッシュの異常、透過的リライトが適用されない問題、利用不可の状態を調査して解決する方法を説明します。"
keywords:
    - 非同期マテリアライズドビュー FAQ
    - マテリアライズドビューのリフレッシュ失敗
    - 透過的リライトが適用されない
    - パーティションマテリアライズドビューのエラー
    - Unable to find a suitable base table for partitioning
    - MaterializedViewRewriteFail
    - grace_period
    - excluded_trigger_tables
language: ja
---

<!-- Knowledge type: Troubleshooting / FAQ -->
<!-- Applicable scenarios: Diagnosing issues during async materialized view build, refresh, and query rewrite -->

このドキュメントでは、非同期マテリアライズドビューの使用時によくある質問とトラブルシューティング方法をまとめます。**非同期マテリアライズドビュー**とは、ベーステーブルのデータから事前計算され、必要に応じて、またはスケジュールに従ってリフレッシュされる結果セットです。クエリを透過的にリライトして高速化するために使用できます。

## クイックナビゲーション {#quick-navigation}

<!-- Knowledge type: Index -->
<!-- Applicable scenarios: Quickly locating issues and the corresponding sections -->

問題を利用段階に応じて二つのカテゴリに分け、原因の参照表を付録にまとめています。

| 場面のカテゴリ | 扱う問題 | キーワード |
| --- | --- | --- |
| [作成とリフレッシュ](#build-and-refresh) | 作成時のエラー、リフレッシュ戦略、スキーマ変更、リソース消費 | `BUILD`、`REFRESH`、`workload_group` |
| [クエリと透過的リライト](#query-and-transparent-rewrite) | 適用されたかどうか、適用されない理由、利用不可の状態 | `explain`、`MaterializedViewRewrite`、`grace_period` |
| [付録](#appendix) | 透過的リライトの失敗原因、パーティション作成の失敗原因の一覧 | 原因の参照表 |

よくある問題を調べる際のチェックリスト：

- パーティションマテリアライズドビューの作成時に `Unable to find a suitable base table for partitioning` が発生した場合は、[Q12](#q12-error-when-building-a-partition-materialized-view) と [付録 2](#appendix-2-async-materialized-view-partition-build-failure-causes) を参照してください。
- 作成文で `Syntax error` が報告された場合は、[Q13](#q13-syntax-error-when-creating-a-materialized-view) を参照してください。
- リフレッシュが成功してもマテリアライズドビューにデータがない場合は、[Q14](#q14-the-materialized-view-still-has-no-data-after-a-successful-refresh) を参照してください。
- パーティションマテリアライズドビューで毎回全量リフレッシュが実行される場合は、[Q15](#q15-why-does-a-partition-materialized-view-do-a-full-refresh-every-time) を参照してください。
- 透過的リライトが適用されない場合は、[クエリと透過的リライトの Q1/Q2](#q1-how-to-confirm-whether-a-query-hits-the-materialized-view) と [付録 1](#appendix-1-transparent-rewrite-failure-summary-information) を参照してください。

## 作成とリフレッシュ {#build-and-refresh}

<!-- Knowledge type: Troubleshooting -->
<!-- Applicable scenarios: Issues during materialized view creation, refresh, and modification -->

### Q1: マテリアライズドビューはリフレッシュが必要なパーティションをどのように判断しますか？ {#q1-how-does-the-materialized-view-determine-which-partitions-need-to-be-refreshed}

Doris は内部でマテリアライズドビューとベーステーブルのパーティション間の対応関係を計算し、最後にリフレッシュが成功したときに使用したベーステーブルのパーティションバージョンを記録します。次回のリフレッシュ時には、現在のバージョンと比較して、パーティションのリフレッシュが必要かどうかを判断します。

**例**：マテリアライズドビュー `mv1` をベーステーブル `t1` と `t2` から作成し、`t1` に基づいてパーティション分割します。パーティション `p202003` は `mv1` に属し、`p20200301` と `p20200302` という `t1` のパーティションに対応するとします。

- `p202003` のリフレッシュ後、`p20200301`、`p20200302`、およびテーブル `t2` の現在のバージョンが記録されます。
- 次回のリフレッシュ時に `p20200301`、`p20200302`、または `t2` のバージョンが変わっていれば、`p202003` をリフレッシュする必要があります。

**業務上の除外**：業務上、`t2` の変更によって `mv1` のリフレッシュをトリガーしたくない場合は、マテリアライズドビューのプロパティ `excluded_trigger_tables` で設定できます。

### Q2: マテリアライズドビューが大量のリソースを消費し、ほかのワークロードに影響する場合はどうすればよいですか？ {#q2-what-if-the-materialized-view-consumes-too-many-resources-and-affects-other-workloads}

マテリアライズドビューのプロパティで [workload_group](../../../admin-manual/workload-management/workload-group.md) を指定し、リフレッシュタスクのリソース使用量を制御できます。

**注意事項**：単一パーティションのリフレッシュに必要なメモリより小さなメモリ設定にすると、リフレッシュタスクは失敗します。業務上の要件に応じて設定のバランスを取ってください。

### Q3: 既存のマテリアライズドビューを基に新しいマテリアライズドビューを作成できますか？ {#q3-can-a-new-materialized-view-be-created-based-on-an-existing-materialized-view}

はい。Doris 2.1.3 以降でサポートされています。

**注記**：各マテリアライズドビューのリフレッシュ処理は独立しています。たとえば、`mv2` の作成元が `mv1` で、さらに `mv1` の作成元が `t1` の場合、`mv2` のリフレッシュでは `mv1` と `t1` のデータが同期しているかどうかは考慮されません。

### Q4: Doris はどの外部テーブルをマテリアライズドビューでサポートしますか？ {#q4-which-external-tables-does-doris-support-for-materialized-views}

Doris がサポートするすべての外部テーブルを使用して、マテリアライズドビューを作成できます。ただし、現時点で**パーティション単位のリフレッシュをサポートするのは Hive のみ**です。ほかの種類は今後のリリースでサポートされる予定です。

### Q5: マテリアライズドビューのデータが Hive のデータと一致しているように見えても、実際には一致しないのはなぜですか？ {#q5-the-materialized-view-appears-consistent-with-hive-data-but-is-actually-inconsistent}

マテリアライズドビューで保証されるのは、Catalog 経由でクエリした結果との整合性だけです。

Catalog にはメタデータやデータのキャッシュがあるため、マテリアライズドビューと Hive のデータを一致させるには、`Refresh Catalog` などを使用して、Catalog 内のデータと Hive 内のデータが一致するようにする必要があります。

### Q6: マテリアライズドビューはスキーマ変更をサポートしますか？ {#q6-does-the-materialized-view-support-schema-change}

変更はサポートされていません。マテリアライズドビューの列属性は定義 SQL から推論され、明示的なカスタム変更は現時点でサポートされていません。

### Q7: マテリアライズドビューのベーステーブルをスキーマ変更できますか？ {#q7-are-schema-changes-allowed-on-the-base-tables-used-by-a-materialized-view}

はい。ただし、変更後には次の状態遷移が発生します。

- そのベーステーブルを使用するマテリアライズドビューの状態は `NORMAL` から `SCHEMA_CHANGE` に変わります。
- `SCHEMA_CHANGE` 状態では透過的リライトに使用できませんが、マテリアライズドビューを直接クエリすることはできます。
- 次のリフレッシュタスクが成功すると、状態は `SCHEMA_CHANGE` から `NORMAL` に戻ります。

### Q8: Unique Key モデルのテーブルを使用してマテリアライズドビューを作成できますか？ {#q8-can-a-table-with-the-unique-key-model-be-used-to-create-a-materialized-view}

はい。ベーステーブルのデータモデルに制限はありませんが、**マテリアライズドビュー自体には Duplicate Key モデルしか使用できません**。

### Q9: マテリアライズドビューにインデックスを作成できますか？ {#q9-can-indexes-still-be-created-on-a-materialized-view}

はい、作成できます。

### Q10: マテリアライズドビューのリフレッシュ中にテーブルはロックされますか？ {#q10-does-refreshing-a-materialized-view-lock-the-table}

リフレッシュ処理では、ごく短い段階でのみテーブルがロックされ、継続的にロックを保持することはありません。ロック時間は、データロード時のロック時間とほぼ同じです。

### Q11: マテリアライズドビューは準リアルタイムの用途に適していますか？ {#q11-are-materialized-views-suitable-for-near-real-time-scenarios}

非同期マテリアライズドビューはリアルタイムの整合性を提供しません。通常のパーティション単位の増分リフレッシュでは、計算の最小単位はパーティションです。Doris 5.0.0 以降、[増分ビュー保守（IVM）](incremental-materialized-view) は二回のリフレッシュ間に生じた行単位の変更だけを処理できるため、少量の変更が頻繁に発生する場合の計算コストを下げられます。ただし、データの鮮度はトリガー、キューイング、リフレッシュにかかる時間に依存します。結果とベーステーブル間にトランザクション単位の整合性が必要な場合は、同期マテリアライズドビューを使用してください。

### Q12: パーティションマテリアライズドビューの作成時にエラーが発生する {#q12-error-when-building-a-partition-materialized-view}

**エラーメッセージ**：

```text
Unable to find a suitable base table for partitioning
```

**原因の分析**：

通常は、マテリアライズドビューの SQL 定義とパーティション列の選択により、パーティション単位の増分更新が不可能になることが原因で、パーティションマテリアライズドビューの作成時にエラーが発生します。

- マテリアライズドビューでパーティション単位の増分更新を行うには、対応する要件を満たす必要があります。詳細は[マテリアライズドビューのリフレッシュモード](../../../sql-manual/sql-statements/table-and-view/async-materialized-view/CREATE-ASYNC-MATERIALIZED-VIEW.md#optional-parameters)を参照してください。
- 最新バージョンでは、パーティション作成の失敗理由が具体的に報告されます。原因と説明の一覧は[付録 2](#appendix-2-async-materialized-view-partition-build-failure-causes)を参照してください。

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

マテリアライズドビューは次のように定義します。`orders.o_orderdate` をパーティション列に選ぶと、パーティション単位の増分更新がサポートされます。一方、`lineitem.l_shipdate` を使用しても、増分更新はできません。

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
2. `lineitem.l_shipdate` は、`null` 値が生成される `outer join` 操作の側にある列です。

### Q13: マテリアライズドビューの作成時に構文エラーが発生する {#q13-syntax-error-when-creating-a-materialized-view}

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

2. マテリアライズドビューの作成文に**キーワードのスペルミス**があるか、**定義 SQL に構文上の問題**があります。マテリアライズドビューの定義 SQL と作成文が正しいか確認してください。

### Q14: リフレッシュが成功してもマテリアライズドビューにデータがない {#q14-the-materialized-view-still-has-no-data-after-a-successful-refresh}

マテリアライズドビューは、データを更新する必要があるかどうかを判断する際に、ベーステーブルまたはそのパーティションのバージョン情報を取得できることを前提とします。

現時点でバージョン情報の取得をサポートしていないデータレイク（JDBC Catalog など）では、リフレッシュ時にマテリアライズドビューの更新は不要と判断されます。**そのため、このようなマテリアライズドビューを作成またはリフレッシュする際は、`complete` を指定し、`auto` は指定しないでください**。

データレイクに対するマテリアライズドビューのサポート状況は、[データレイクのサポート](./overview.md)を参照してください。

### Q15: パーティションマテリアライズドビューが毎回全量リフレッシュされるのはなぜですか？ {#q15-why-does-a-partition-materialized-view-do-a-full-refresh-every-time}

マテリアライズドビューのパーティション単位の増分リフレッシュは、ベーステーブルのパーティションバージョン情報に依存します。マテリアライズドビューのパーティションに対応するベーステーブルのパーティションデータが前回のリフレッシュ以降に変更されていれば、そのパーティションだけがリフレッシュされます。

**考えられる原因**：

マテリアライズドビューの定義 SQL に含まれる**パーティション追跡対象ではないテーブル**のデータが変更された場合、リフレッシュ時に更新が必要なパーティションを特定できないため、全量リフレッシュしかできません。

**例**：

このマテリアライズドビューは、`o_orderdate` によってパーティション分割された `orders` テーブルを追跡します。ただし、`lineitem` または `partsupp` のデータが変更された場合、更新が必要なパーティションを特定できず、全量リフレッシュしかできません。

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

- **説明**：結果の `MvPartitionInfo.partitionType` が `FOLLOW_BASE_TABLE` であれば、マテリアライズドビューのパーティションがベーステーブルのパーティションに追従していることを示します。`relatedCol` が `o_orderdate` であれば、この列に基づいてパーティション分割されていることを示します。

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

`lineitem` または `partsupp` テーブルのデータ変更がマテリアライズドビューに影響しない場合は、`excluded_trigger_tables` プロパティを設定して、これらのテーブルの変更による全量リフレッシュを除外できます。

```sql
ALTER MATERIALIZED VIEW partition_mv set("excluded_trigger_tables"="lineitem,partsupp");
```

### Q16: IVM とパーティション単位の増分リフレッシュの違いは何ですか？ {#q16-what-is-the-difference-between-ivm-and-partitioned-incremental-refresh}

IVM は `INCREMENTAL` に対応し、二回のリフレッシュ間に生じたベーステーブルの行単位の変更だけを計算します。パーティション単位の増分リフレッシュは `PARTITIONS` に対応し、影響を受けたマテリアライズドビューの各パーティションを全体的に再計算します。変更された行数が影響を受けるパーティション内の行数よりはるかに少ない場合、通常は IVM によって計算量を減らせます。詳しい比較は[増分ビュー保守（IVM）](incremental-materialized-view#differences-from-partition-level-incremental-refresh)を参照してください。

### Q17: IVM が完全リフレッシュにフォールバックするのはなぜですか？ {#q17-why-does-an-ivm-fall-back-to-a-complete-refresh}

`INCREMENTAL FALLBACK` と `AUTO` は、増分結果を安全に計算できない場合にフォールバックします。たとえば、値の削除によって `MIN` または `MAX` が変わる場合、削除が Bitmap 集約に影響する場合、Row Binlog の連続性が途切れた場合、デルタプランのレイアウトが変わった場合です。安定したフォールバック理由は、`IvmFallbackReason` フィールドで確認できます。このフィールドは `tasks("type"="mv")` で取得します。[リフレッシュとフォールバック](incremental-materialized-view#refresh-and-fallback)も参照してください。

## クエリと透過的リライト {#query-and-transparent-rewrite}

<!-- Knowledge type: Troubleshooting -->
<!-- Applicable scenarios: Diagnosing materialized view hit rate and transparent rewrite failures -->

### Q1: クエリにマテリアライズドビューが適用されたかどうかを確認する方法 {#q1-how-to-confirm-whether-a-query-hits-the-materialized-view}

`explain query_sql` を使用すると、マテリアライズドビューの適用状況の概要を確認できます。

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

マテリアライズドビューの適用情報は、プランの最後に表示されます。主なフィールドの意味は次のとおりです。

| フィールド | 意味 |
| --- | --- |
| `MaterializedViewRewriteSuccessAndChose` | 透過的リライトに成功し、最終的に CBO が使用を選択したマテリアライズドビューの名前の一覧 |
| `MaterializedViewRewriteSuccessButNotChose` | 透過的リライトには成功したものの、CBO が選択しなかったマテリアライズドビューの名前の一覧（実行プランでは使用されない） |
| `MaterializedViewRewriteFail` | 透過的リライトに失敗したマテリアライズドビューと、その理由の概要の一覧 |

`MaterializedView` 関連の情報が `explain` の末尾に表示されない場合、マテリアライズドビューは利用不可の状態にあり、透過的リライトには参加できません。利用不可になる状況については「利用と実践 - マテリアライズドビューの状態の確認」を参照してください。

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

### Q2: マテリアライズドビューが適用されない理由は何ですか？ {#q2-what-are-the-reasons-for-a-materialized-view-not-being-hit}

まず、[Q1](#q1-how-to-confirm-whether-a-query-hits-the-materialized-view) の手順で、適用されたかどうかを確認します。

```sql
explain
your_query_sql;
```

**適用されない場合に考えられる理由**：

1. Doris 2.1.3 より前のバージョンでは、マテリアライズドビューの透過的リライト機能はデフォルトで無効です。透過的リライトを有効にするには、対応するスイッチをオンにする必要があります。具体的なスイッチについては、非同期マテリアライズドビュー関連のスイッチを参照してください。
2. マテリアライズドビューが利用不可の状態にある可能性があります。作成状態を確認する方法については「マテリアライズドビューの状態の確認」を参照してください。
3. 前の二点を確認しても適用されない場合、マテリアライズドビューの定義 SQL とクエリ SQL が、現時点の透過的リライト機能の対応範囲外である可能性があります。詳細は[マテリアライズドビューの透過的リライト機能](../../../query-acceleration/materialized-view/async-materialized-view/functions-and-demands.md#22-transparent-query-rewrite)を参照してください。
4. 適用に失敗した理由の概要と詳しい説明は、[付録 1](#appendix-1-transparent-rewrite-failure-summary-information)を参照してください。

次の二つの例は、透過的リライトが失敗する一般的なケースを示します。

#### ケース 1: 結合順序が一致せず、リライトに失敗する {#case-1-inconsistent-join-order-causes-rewrite-failure}

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

**explain の出力**：

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

`MaterializedViewRewriteFail` の失敗概要 `The graph logic between query and view is not consistent` は、クエリとマテリアライズドビューの結合ロジックが一致しないこと（結合の種類または結合するテーブルが異なること）を示します。この例では、クエリとマテリアライズドビューでテーブルの結合順序が一致しないため、このエラーが報告されます。失敗概要の説明一覧は[付録 1](#appendix-1-transparent-rewrite-failure-summary-information)を参照してください。

#### ケース 2: マテリアライズドビューがディメンションを網羅していない {#case-2-dimensions-not-covered-by-the-materialized-view}

**クエリの実行**：

```sql
explain
SELECT l_shipdate, l_linestatus, O_ORDERDATE, count(*)
FROM lineitem
LEFT OUTER JOIN orders on l_orderkey = o_orderkey
GROUP BY l_shipdate, l_linestatus, O_ORDERDATE;
```

**explain の出力**：

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

失敗概要 `View dimensions doesn't not cover the query dimensions` は、クエリの `group by` 列をマテリアライズドビューの `group by` 列から取得できないため、このエラーが報告されることを示します。

### Q3: どのような場合にマテリアライズドビューの状態が変わり、利用不可になりますか？ {#q3-what-situations-cause-a-materialized-views-state-to-change-and-become-unavailable}

「利用不可」とは、**マテリアライズドビューを透過的リライトに使用できない**ことを意味します。ただし、マテリアライズドビュー自体を直接クエリすることはできます。

| マテリアライズドビューの種類 | 利用不可になる契機 | 影響範囲 |
| --- | --- | --- |
| 全量マテリアライズドビュー | ベーステーブルのデータ変更 / ベーステーブルのスキーマ変更 | マテリアライズドビュー全体が利用不可 |
| パーティションマテリアライズドビュー | ベーステーブルのデータ変更 | 対応するパーティションが利用不可 |
| パーティションマテリアライズドビュー | ベーステーブルのスキーマ変更 | マテリアライズドビュー全体が利用不可 |

現時点では、リフレッシュの失敗によってもマテリアライズドビューは利用不可になります。今後は、リフレッシュに失敗しても、既存のマテリアライズドビューを透過的リライトに引き続き使用できるよう改善される予定です。

### Q4: マテリアライズドビューを直接クエリしてもデータが返されない {#q4-direct-query-on-the-materialized-view-returns-no-data}

考えられる原因：

- マテリアライズドビューを作成中です。
- マテリアライズドビューの作成に失敗しました。

マテリアライズドビューの状態をクエリして確認できます。詳細は「マテリアライズドビューの状態の確認」を参照してください。

### Q5: ベーステーブルのデータが変更され、マテリアライズドビューがまだリフレッシュされていない場合、透過的リライトはどう動作しますか？ {#q5-when-base-table-data-changes-but-the-materialized-view-has-not-been-refreshed-what-is-the-transparent-rewrite-behavior}

非同期マテリアライズドビューのデータには、ベーステーブルに対して一定の遅延があります。透過的リライトの動作は、ベーステーブルの種類と `grace_period` のしきい値によって異なります。

**1. 内部テーブルと、データ変更を検出できる外部テーブル（Hive など）**：

`grace_period` は、マテリアライズドビューとベーステーブルのデータが不一致でも許容される最大期間です。

| `grace_period` の設定 | リライトの動作 |
| --- | --- |
| `0` | 透過的リライトに使用するには、マテリアライズドビューとベーステーブルのデータが完全に一致する必要があります。データ変更を検出できない外部テーブル（Hive 以外）では、データが最新かどうかにかかわらず透過的リライトに使用できます（データが一致しない可能性があります） |
| `10`（秒） | マテリアライズドビューとベーステーブルのデータに最大 10 秒の遅延を許容します。遅延が 10 秒以内であれば、引き続き透過的リライトに使用できます |

**2. 一部のパーティションが無効なパーティションマテリアライズドビュー**：

- クエリが無効なパーティションのデータを使用しない場合、マテリアライズドビューは引き続き利用できます。
- クエリが無効なパーティションのデータを使用しても、データの鮮度が `grace_period` の範囲内であれば、引き続き利用できます。
- データの鮮度が `grace_period` を超える場合、元のテーブルとマテリアライズドビューを組み合わせてクエリに応答できます。この動作には、ユニオンリライトのスイッチ `enable_materialized_view_union_rewrite` を有効にする必要があります（バージョン 2.1.5 以降はデフォルトで有効です）。

## 付録 {#appendix}

### 付録 1: 透過的リライトの失敗概要 {#appendix-1-transparent-rewrite-failure-summary-information}

<!-- Knowledge type: Reference table -->
<!-- Applicable scenarios: Locating the cause of transparent rewrite failure based on the FailSummary in explain output -->

| 概要情報 | 説明 |
| --- | --- |
| View struct info is invalid | マテリアライズドビューの構造情報が無効です。現時点でリライトをサポートする SQL パターンは、クエリとマテリアライズドビューが両方とも結合である場合、またはクエリが集約であり、マテリアライズドビューに結合が不要な場合です。各透過的リライトルールは特定の SQL パターンを処理し、要件に一致しないルールはこのエラーを報告するため、多くの場合に表示されます。通常は透過的リライトの失敗の主因ではありません |
| Materialized view rule exec fail | 透過的リライトルールの実行中に例外が発生しました。`Explain memo plan query_sql` を使用して、具体的な例外スタックを確認してください |
| Match mode is invalid | クエリとマテリアライズドビューのテーブル数が一致しません。現時点ではリライトをサポートしていません |
| Query to view table mapping is null | クエリとマテリアライズドビュー間のテーブルマッピングの生成に失敗しました |
| queryToViewTableMappings are over the limit and be intercepted | クエリ内に自己結合されたテーブルが多すぎるため、透過的リライトの探索空間が大きくなりすぎ、透過的リライトが停止されました |
| Query to view slot mapping is null | クエリのテーブルとマテリアライズドビューのテーブル間のスロットマッピングの生成に失敗しました |
| The graph logic between query and view is not consistent | クエリとマテリアライズドビューで結合の種類、または結合するテーブルが異なります |
| Predicate compensate fail | 通常、クエリ条件の範囲がマテリアライズドビューの範囲外です。たとえば、クエリが `a > 10` で、マテリアライズドビューが `a > 15` の場合です |
| Rewrite compensate predicate by view fail | 述語の補償に失敗しました。通常、クエリにはマテリアライズドビューより多くの条件があり、それらを補償する必要がありますが、条件に使われる列がマテリアライズドビューの select 句にありません |
| Calc invalid partitions fail | クエリで使用するパーティションが有効かどうかの計算中に、パーティションマテリアライズドビューで失敗しました |
| mv can not offer any partition for query | クエリはマテリアライズドビューの無効なパーティションだけを使用します。`show partitions from mv_name` でパーティションの `SyncWithBaseTables` フィールドが true か確認してください。false なら対応するパーティションを手動でリフレッシュします。マテリアライズドビューとクエリデータ間の遅延を許容できる場合は、マテリアライズドビューの `grace_period` プロパティを秒単位で設定してください |
| Add filter to base table fail when union rewrite | クエリがマテリアライズドビューの無効なパーティションを使用しており、マテリアライズドビューと元のテーブルを union all で結合する試みが失敗しました |
| RewrittenPlan output logical properties is different with target group | リライトは完了しましたが、マテリアライズドビューの出力が元のクエリと一致しません |
| Rewrite expressions by view in join fail | 結合のリライト時に、クエリで使われるフィールドまたは式がマテリアライズドビューにありません |
| Rewrite expressions by view in scan fail | 単一テーブルのリライト時に、クエリで使われるフィールドまたは式がマテリアライズドビューにありません |
| Split view to top plan and agg fail, view doesn't not contain aggregate | 集約のリライト時に、マテリアライズドビューに集約がありません |
| Split query to top plan and agg fail | 集約のリライト時に、クエリに集約がありません |
| rewritten expression contains aggregate functions when group equals aggregate rewrite | クエリとマテリアライズドビューの `group by` 句が同じ場合に、リライト後の式に集約関数が含まれています |
| Can not rewrite expression when no roll up | クエリとマテリアライズドビューの `group by` 句が同じ場合に、式のリライトに失敗しました |
| Query function roll up fail | 集約のリライト時に、集約関数のロールアップに失敗しました |
| View dimensions do not cover the query dimensions | クエリの `group by` 句で使われる一部のディメンションが、マテリアライズドビューの `group by` 句にありません |
| View dimensions don't not cover the query dimensions in bottom agg | クエリの `group by` 句で使われる一部のディメンションが、マテリアライズドビューの `group by` 句にありません |
| View dimensions do not cover the query group set dimensions | クエリの `group sets` で使われる一部のディメンションが、マテリアライズドビューの `group by` 句にありません |
| The only one of query or view is scalar aggregate and can not rewrite expression meanwhile | クエリには `group by` がありますが、マテリアライズドビューにはありません |
| Both query and view have group sets, or query doesn't have but view has, not supported | クエリとマテリアライズドビューの両方に `group sets` があるか、クエリには `group sets` がなくマテリアライズドビューにだけあります。この場合、透過的リライトはサポートされません |

### 付録 2: 非同期マテリアライズドビューのパーティション作成に失敗する原因 {#appendix-2-async-materialized-view-partition-build-failure-causes}

<!-- Knowledge type: Reference table -->
<!-- Applicable scenarios: Locating causes when an error is reported while creating a partition materialized view -->

パーティションマテリアライズドビューのリフレッシュは、パーティション単位の増分更新に基づきます。

1. **ステップ 1**：マテリアライズドビューのパーティション列を、ベーステーブルのパーティションに対応付けられるか計算します。
2. **ステップ 2**：パーティションの対応関係が 1:1 か 1:n かを計算します。

| 概要情報 | 説明 |
| --- | --- |
| partition column can not be found in the SQL select column | マテリアライズドビューの定義で `partition by` の後に指定した列は、定義 SQL の select 句に含まれている必要があります |
| can't not find valid partition track column, because %s | 適切なパーティション列が見つかりません。具体的な理由は `because` の後に示されます |
| partition track doesn't support mark join | マテリアライズドビューのパーティション列が参照する列は、mark join の入力テーブルのパーティション列です。このケースはサポートされません |
| partition column is in un supported join null generate side | マテリアライズドビューのパーティション列が参照する列は、結合で null が生成される側（たとえば left join の右側）にあります |
| relation should be LogicalCatalogRelation | マテリアライズドビューのパーティションベーステーブルが参照するスキャンの種類は `LogicalCatalogRelation` である必要があります。ほかの種類はサポートされません |
| self join doesn't support partition update | 自己結合を含む SQL によるマテリアライズドビューの作成は、まだサポートされません |
| partition track already has a related base table column | 現時点で、マテリアライズドビューのパーティション列は一つのベーステーブルのパーティション列のみを参照できます |
| relation base table is not MTMVRelatedTableIf | マテリアライズドビューが参照するパーティションベーステーブルは、テーブルがパーティション分割可能かどうかを示すインターフェース `MTMVRelatedTableIf` を継承していません |
| The related base table is not partition table | マテリアライズドビューが使用するベーステーブルはパーティション分割されていません |
| The related base table partition column doesn't contain the mv partition | マテリアライズドビューで `partition by` の後に指定した列が、パーティションベーステーブルに存在しません |
| group by sets is empty, doesn't contain the target partition | マテリアライズドビューの定義 SQL は集約を使用していますが、`group by` が空です |
| window partition sets don't contain the target partition | ウィンドウ関数を使用していますが、マテリアライズドビューが参照するパーティション列が `partition by` 句に含まれていません |
| Unsupported plan operate in track partition | マテリアライズドビューの定義 SQL で、`order by` などのサポートされていない操作を使用しています |
| context partition column should be slot from column | ウィンドウ関数を使用しており、`partition by` 句でマテリアライズドビューが参照するパーティション列が単純な列ではなく式になっています |
| partition expressions use more than one slot reference | `group by` または `partition by` の後に指定したパーティション列が、単純な列ではなく、複数の列を含む式になっています。たとえば `group by partition_col + other_col` です |
| column to check using invalid implicit expression | マテリアライズドビューのパーティション列には `date_trunc` のみ使用できます。パーティション列に適用する式は `date_trunc` などに制限されます |
| partition column time unit level should be greater than SQL select column | マテリアライズドビューの `date_trunc` の時間粒度（`partition by` の後に指定するもの）が、定義 SQL の select 句に現れる時間粒度より細かくなっています。たとえば、マテリアライズドビューで `partition by(date_trunc(col, 'day'))` を使用し、定義 SQL の select 句に `date_trunc(col, 'month')` が含まれる場合です |
