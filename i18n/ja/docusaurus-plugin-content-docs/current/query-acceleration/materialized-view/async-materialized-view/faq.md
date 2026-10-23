---
title: 非同期マテリアライズドビュー FAQ
description: "非同期マテリアライズドビューに関する FAQ のクイックリファレンス。作成エラー、リフレッシュ時の例外、透過的リライトが適用されない問題、利用不可の状態について、調査方法と解決方法を説明します。"
keywords:
    - Async Materialized View FAQ
    - materialized view refresh failure
    - transparent rewrite miss
    - partition materialized view error
    - Unable to find a suitable base table for partitioning
    - MaterializedViewRewriteFail
    - grace_period
    - excluded_trigger_tables
---

<!-- Knowledge type: Troubleshooting / FAQ -->
<!-- Applicable scenarios: Diagnosing issues during async materialized view build, refresh, and query rewrite -->

このドキュメントでは、非同期マテリアライズドビューの利用時によくある質問とトラブルシューティングの方法をまとめます。非同期マテリアライズドビューとは、ベーステーブルのデータから事前計算され、必要に応じて、またはスケジュールに従ってリフレッシュされる結果セットで、クエリを透過的にリライトして高速化するためにも使用できます。

## クイックナビゲーション {#quick-navigation}

<!-- Knowledge type: Index -->
<!-- Applicable scenarios: Quickly locating issues and the corresponding sections -->

問題は、利用段階に応じた二つのカテゴリと、原因を参照するための付録に分けています。

| カテゴリ | 対象となる問題 | キーワード |
| --- | --- | --- |
| [作成とリフレッシュ](#build-and-refresh) | 作成エラー、リフレッシュ方式、スキーマ変更、リソース消費 | `BUILD`、`REFRESH`、`workload_group` |
| [クエリと透過的リライト](#query-and-transparent-rewrite) | マテリアライズドビューが使用されたかどうか、使用されない理由、利用不可の状態 | `explain`、`MaterializedViewRewrite`、`grace_period` |
| [付録](#appendix) | 透過的リライトの失敗原因とパーティション作成の失敗原因をまとめた表 | 原因の一覧表 |

よくある問題を調べる際は、次の項目を参照してください。

- パーティション化されたマテリアライズドビューの作成時に `Unable to find a suitable base table for partitioning` が表示される場合は、[Q12](#q12-error-when-building-a-partition-materialized-view) と [付録 2](#appendix-2-async-materialized-view-partition-build-failure-causes) を参照してください。
- 作成文で `Syntax error` が表示される場合は、[Q13](#q13-syntax-error-when-creating-a-materialized-view) を参照してください。
- リフレッシュが成功してもマテリアライズドビューにデータがない場合は、[Q14](#q14-the-materialized-view-still-has-no-data-after-a-successful-refresh) を参照してください。
- パーティション化されたマテリアライズドビューで毎回全体リフレッシュが実行される場合は、[Q15](#q15-why-does-a-partition-materialized-view-do-a-full-refresh-every-time) を参照してください。
- 透過的リライトでマテリアライズドビューが使用されない場合は、[「クエリと透過的リライト」の Q1/Q2](#q1-how-to-confirm-whether-a-query-hits-the-materialized-view) と [付録 1](#appendix-1-transparent-rewrite-failure-summary-information) を参照してください。

## 作成とリフレッシュ {#build-and-refresh}

<!-- Knowledge type: Troubleshooting -->
<!-- Applicable scenarios: Issues during materialized view creation, refresh, and modification -->

### Q1: リフレッシュが必要なパーティションはどのように判定されますか？ {#q1-how-does-the-materialized-view-determine-which-partitions-need-to-be-refreshed}

Doris はマテリアライズドビューとベーステーブルのパーティションの対応関係を内部で計算し、最後に成功したリフレッシュで使用したベーステーブルのパーティションのバージョンを記録します。次のリフレッシュ時には、現在のバージョンと比較して、パーティションをリフレッシュする必要があるかどうかを判定します。

**例**: マテリアライズドビュー `mv1` がベーステーブル `t1` と `t2` から作成され、`t1` に基づいてパーティション化されているとします。`mv1` のパーティション `p202003` が、`t1` のパーティション `p20200301` と `p20200302` に対応している場合を考えます。

- `p202003` のリフレッシュ後、`p20200301`、`p20200302`、およびテーブル `t2` の現在のバージョンが記録されます。
- 次のリフレッシュ時に `p20200301`、`p20200302`、または `t2` のバージョンが変わっていれば、`p202003` をリフレッシュする必要があります。

**業務上の除外設定**: 業務上、`t2` の変更によって `mv1` をリフレッシュする必要がない場合は、マテリアライズドビューのプロパティ `excluded_trigger_tables` で設定できます。

### Q2: マテリアライズドビューがリソースを大量に消費し、ほかのワークロードに影響する場合はどうすればよいですか？ {#q2-what-if-the-materialized-view-consumes-too-many-resources-and-affects-other-workloads}

マテリアライズドビューのプロパティで [workload_group](../../../admin-manual/workload-management/workload-group.md) を指定すると、リフレッシュタスクのリソース使用量を制御できます。

**注意点**: メモリ設定が小さすぎて、単一パーティションのリフレッシュに必要なメモリを確保できない場合、リフレッシュタスクは失敗します。業務上の要件に合わせて設定を調整してください。

### Q3: 既存のマテリアライズドビューを基に新しいマテリアライズドビューを作成できますか？ {#q3-can-a-new-materialized-view-be-created-based-on-an-existing-materialized-view}

はい。Doris 2.1.3 以降でサポートされています。

**注**: 各マテリアライズドビューのリフレッシュ処理は独立しています。たとえば、`mv2` が `mv1` を基に作成され、`mv1` が `t1` を基に作成されている場合、`mv2` のリフレッシュでは `mv1` と `t1` のデータが同期しているかどうかは考慮されません。

### Q4: マテリアライズドビューで使用できる外部テーブルは何ですか？ {#q4-which-external-tables-does-doris-support-for-materialized-views}

Doris がサポートするすべての外部テーブルを使用して、マテリアライズドビューを作成できます。ただし、現在**パーティション単位のリフレッシュをサポートするのは Hive のみ**です。ほかの種類については今後のリリースでサポートする予定です。

### Q5: マテリアライズドビューが Hive のデータと一致しているように見えても、実際には一致していない {#q5-the-materialized-view-appears-consistent-with-hive-data-but-is-actually-inconsistent}

マテリアライズドビューが保証できるのは、Catalog 経由でクエリした結果との整合性だけです。

Catalog にはメタデータとデータのキャッシュがあるため、マテリアライズドビューを Hive のデータと一致させるには、`Refresh Catalog` などを使用し、Catalog 内のデータを Hive 内のデータと一致させる必要があります。

### Q6: マテリアライズドビューは Schema Change をサポートしていますか？ {#q6-does-the-materialized-view-support-schema-change}

変更はサポートされていません。マテリアライズドビューの列属性は定義 SQL から推定され、明示的な変更は現在サポートされていません。

### Q7: マテリアライズドビューのベーステーブルに対して Schema Change を実行できますか？ {#q7-are-schema-changes-allowed-on-the-base-tables-used-by-a-materialized-view}

はい。ただし、変更後には次の状態遷移が発生します。

- そのベーステーブルを使用するマテリアライズドビューの状態が `NORMAL` から `SCHEMA_CHANGE` に変わります。
- `SCHEMA_CHANGE` 状態の間は透過的リライトに使用できませんが、マテリアライズドビューを直接クエリすることはできます。
- 次のリフレッシュタスクが成功すると、状態は `SCHEMA_CHANGE` から `NORMAL` に戻ります。

### Q8: Unique Key モデルのテーブルを使用してマテリアライズドビューを作成できますか？ {#q8-can-a-table-with-the-unique-key-model-be-used-to-create-a-materialized-view}

はい。ベーステーブルのデータモデルに制約はありません。ただし、**マテリアライズドビュー自体に使用できるのは Duplicate Key モデルのみ**です。

### Q9: マテリアライズドビューにインデックスを作成できますか？ {#q9-can-indexes-still-be-created-on-a-materialized-view}

はい。

### Q10: マテリアライズドビューのリフレッシュ中にテーブルはロックされますか？ {#q10-does-refreshing-a-materialized-view-lock-the-table}

リフレッシュ処理では、ごく短い段階でのみテーブルをロックします。処理中ずっとロックを保持するわけではありません。ロック時間は、データロード時のロック時間とほぼ同じです。

### Q11: マテリアライズドビューは準リアルタイムの用途に適していますか？ {#q11-are-materialized-views-suitable-for-near-real-time-scenarios}

非同期マテリアライズドビューはリアルタイムの整合性を提供しません。通常のパーティション単位の増分リフレッシュでは、計算の最小単位はパーティションです。Doris 5.0.0 以降では、[Incremental View Maintenance (IVM)](incremental-materialized-view) によって、リフレッシュ間に発生した行単位の変更だけを処理できます。これにより、少量の変更が頻繁に発生する場合の計算コストは下がりますが、データの鮮度はトリガー、キューでの待機、リフレッシュにかかる時間に依存します。結果をベーステーブルとトランザクション単位で一致させる必要がある場合は、同期マテリアライズドビューを使用してください。

### Q12: パーティション化されたマテリアライズドビューの作成時にエラーが発生する {#q12-error-when-building-a-partition-materialized-view}

**エラーメッセージ**:

```text
Unable to find a suitable base table for partitioning
```

**原因の分析**:

通常は、マテリアライズドビューの SQL 定義と選択したパーティション列の組み合わせでは、パーティション単位の増分更新を実行できないことが原因です。そのため、パーティション化されたマテリアライズドビューの作成時にエラーになります。

- パーティション単位の増分更新を実行するには、対応する要件を満たす必要があります。詳細は[マテリアライズドビューのリフレッシュモード](../../../sql-manual/sql-statements/table-and-view/async-materialized-view/CREATE-ASYNC-MATERIALIZED-VIEW.md#optional-parameters)を参照してください。
- 最新バージョンでは、パーティション作成に失敗した具体的な理由が報告されます。原因と説明の一覧は[付録 2](#appendix-2-async-materialized-view-partition-build-failure-causes)を参照してください。

**例**:

次のベーステーブルは、パーティション化された `orders` と、パーティション化されていない `lineitem` です。

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

マテリアライズドビューは次のように定義します。`orders.o_orderdate` をパーティション列に選ぶと、パーティション単位の増分更新がサポートされます。一方、`lineitem.l_shipdate` を使用しても増分更新はできません。

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

**`lineitem.l_shipdate` をパーティション列に選べない理由**:

1. `lineitem.l_shipdate` はベーステーブルのパーティション列ではありません。そもそも `lineitem` テーブルにはパーティション列が設定されていません。
2. `lineitem.l_shipdate` は、`outer join` で `null` 値が生成される側の列です。

### Q13: マテリアライズドビューの作成時に構文エラーが発生する {#q13-syntax-error-when-creating-a-materialized-view}

**エラーメッセージ**:

```text
ERROR 1105 (HY000): errCode = 2, detailMessage = Syntax error in line 1:
BUILD IMMEDIATE REFRESH AUTO ON MANUAL
```

**考えられる原因**:

1. 非同期マテリアライズドビューの文は、新しいオプティマイザでのみサポートされます。新しいオプティマイザが使用されていることを確認してください。

    ```sql
    SET enable_nereids_planner = true;
    ```

2. マテリアライズドビューの作成文に**キーワードのスペルミス**があるか、**定義 SQL に構文上の問題**があります。マテリアライズドビューの定義 SQL と作成文が正しいか確認してください。

### Q14: リフレッシュが成功してもマテリアライズドビューにデータがない {#q14-the-materialized-view-still-has-no-data-after-a-successful-refresh}

マテリアライズドビューは、データを更新する必要があるかどうかを判定する際に、ベーステーブルまたはそのパーティションのバージョン情報を取得できることを前提としています。

現在、バージョン情報の取得をサポートしていないデータレイク（JDBC Catalog など）では、リフレッシュ時にマテリアライズドビューの更新は不要と判定されます。**そのため、このようなマテリアライズドビューの作成時またはリフレッシュ時には、`auto` ではなく `complete` を指定してください**。

データレイクでのマテリアライズドビューのサポート状況は、[データレイクのサポート](./overview.md)を参照してください。

### Q15: パーティション化されたマテリアライズドビューで毎回全体リフレッシュが実行されるのはなぜですか？ {#q15-why-does-a-partition-materialized-view-do-a-full-refresh-every-time}

マテリアライズドビューのパーティション単位の増分リフレッシュは、ベーステーブルのパーティションのバージョン情報に依存します。前回のリフレッシュ以降に、マテリアライズドビューのパーティションに対応するベーステーブルのパーティションのデータが変わった場合、そのパーティションだけがリフレッシュされます。

**考えられる原因**:

マテリアライズドビューの定義 SQL に含まれる**パーティション追跡対象ではないテーブル**のデータが変わると、リフレッシュ時に更新すべきパーティションを特定できないため、全体リフレッシュしか実行できません。

**例**:

このマテリアライズドビューは、`orders` テーブルの `o_orderdate` パーティションを追跡します。しかし、`lineitem` または `partsupp` のデータが変わると、更新すべきパーティションを特定できず、全体リフレッシュしか実行できません。

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

**トラブルシューティングの手順**:

- **目的**: マテリアライズドビューが追跡するベーステーブルとパーティション列を確認します。
- **コマンド**:

    ```sql
    SELECT *
    FROM mv_infos('database'='db_name')
    WHERE Name = 'partition_mv' \G
    ```

- **説明**: 結果の `MvPartitionInfo.partitionType` が `FOLLOW_BASE_TABLE` であれば、マテリアライズドビューのパーティションがベーステーブルのパーティションに従うことを示します。`relatedCol` が `o_orderdate` であれば、この列に基づいてパーティション化されていることを示します。

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

**解決方法**:

`lineitem` または `partsupp` テーブルのデータ変更がマテリアライズドビューに影響しない場合は、`excluded_trigger_tables` プロパティを設定し、これらのテーブルの変更によって全体リフレッシュが実行されないようにできます。

```sql
ALTER MATERIALIZED VIEW partition_mv set("excluded_trigger_tables"="lineitem,partsupp");
```

### Q16: IVM とパーティション単位の増分リフレッシュの違いは何ですか？ {#q16-what-is-the-difference-between-ivm-and-partitioned-incremental-refresh}

IVM は `INCREMENTAL` に対応し、リフレッシュ間に発生したベーステーブルの行単位の変更だけを計算します。パーティション単位の増分リフレッシュは `PARTITIONS` に対応し、影響を受けるマテリアライズドビューの各パーティションをすべて再計算します。変更された行数が影響を受けるパーティション内の行数よりはるかに少ない場合、通常は IVM によって計算量を減らせます。詳しい比較は [Incremental View Maintenance (IVM)](incremental-materialized-view#differences-from-partition-level-incremental-refresh) を参照してください。

### Q17: IVM が完全リフレッシュにフォールバックするのはなぜですか？ {#q17-why-does-an-ivm-fall-back-to-a-complete-refresh}

`INCREMENTAL FALLBACK` と `AUTO` は、増分結果を安全に計算できない場合にフォールバックします。たとえば、値の削除によって `MIN` または `MAX` が変わる可能性がある場合、削除が Bitmap 集約に影響する場合、変更ログの連続性が失われた場合、差分プランのレイアウトが変わった場合などです。`tasks("type"="mv")` の `IvmFallbackReason` で、確定したフォールバック理由を確認してください。詳細は[リフレッシュとフォールバック](incremental-materialized-view#refresh-and-fallback)を参照してください。

## クエリと透過的リライト {#query-and-transparent-rewrite}

<!-- Knowledge type: Troubleshooting -->
<!-- Applicable scenarios: Diagnosing materialized view hit rate and transparent rewrite failures -->

### Q1: クエリでマテリアライズドビューが使用されたかどうかを確認する方法 {#q1-how-to-confirm-whether-a-query-hits-the-materialized-view}

`explain query_sql` を使用すると、マテリアライズドビューが使用されたかどうかの概要を確認できます。

**マテリアライズドビューの例**:

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

**explain の実行**:

```sql
explain
SELECT l_shipdate, l_orderkey, O_ORDERDATE, count(*)
FROM lineitem
LEFT OUTER JOIN orders on l_orderkey = o_orderkey
GROUP BY l_shipdate, l_orderkey, O_ORDERDATE;
```

**結果の読み方**:

マテリアライズドビューの使用状況は、プランの末尾に表示されます。主なフィールドの意味は次のとおりです。

| フィールド | 意味 |
| --- | --- |
| `MaterializedViewRewriteSuccessAndChose` | 透過的リライトに成功し、最終的に CBO が使用を選択したマテリアライズドビューの名前の一覧 |
| `MaterializedViewRewriteSuccessButNotChose` | 透過的リライトに成功したものの、CBO が使用を選択しなかったマテリアライズドビューの名前の一覧（実行プランでは使用されません） |
| `MaterializedViewRewriteFail` | 透過的リライトに失敗したマテリアライズドビューと、その理由の概要 |

`explain` の末尾に `MaterializedView` 関連の情報が表示されない場合、そのマテリアライズドビューは利用不可の状態にあり、透過的リライトに参加できません。利用不可になる状況については、「Usage and Practice - View Materialized View Status」を参照してください。

**出力例**:

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

### Q2: マテリアライズドビューが使用されない理由は何ですか？ {#q2-what-are-the-reasons-for-a-materialized-view-not-being-hit}

まず、[Q1](#q1-how-to-confirm-whether-a-query-hits-the-materialized-view) の方法で、マテリアライズドビューが使用されたかどうかを確認します。

```sql
explain
your_query_sql;
```

**使用されない場合に考えられる理由**:

1. Doris 2.1.3 より前のバージョンでは、マテリアライズドビューの透過的リライト機能はデフォルトで無効です。透過的リライトを有効にするには、対応するスイッチをオンにする必要があります。具体的なスイッチについては、非同期マテリアライズドビュー関連のスイッチを参照してください。
2. マテリアライズドビューが利用不可の状態にある可能性があります。作成状況の確認方法については、「View Materialized View Status」を参照してください。
3. 上記の確認後も使用されない場合、マテリアライズドビューの定義 SQL またはクエリ SQL が、現在の透過的リライト機能の対象外である可能性があります。詳細は[マテリアライズドビューの透過的リライト機能](../../../query-acceleration/materialized-view/async-materialized-view/functions-and-demands.md#22-transparent-query-rewrite)を参照してください。
4. 使用されない理由の詳しい概要と説明は、[付録 1](#appendix-1-transparent-rewrite-failure-summary-information)を参照してください。

以下の例は、透過的リライトが失敗する一般的な状況を示します。

#### ケース 1: 結合順序が一致せず、リライトが失敗する {#case-1-inconsistent-join-order-causes-rewrite-failure}

**マテリアライズドビューの作成**:

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

**クエリの実行**:

```sql
explain
SELECT l_shipdate, l_linestatus, O_ORDERDATE, count(*)
FROM orders
LEFT OUTER JOIN lineitem on l_orderkey = o_orderkey
GROUP BY l_shipdate, l_linestatus, O_ORDERDATE;
```

**explain の出力**:

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

`MaterializedViewRewriteFail` には失敗理由の概要として `The graph logic between query and view is not consistent` が含まれています。これは、クエリとマテリアライズドビューで結合ロジックが一致しないこと、つまり結合の種類または結合するテーブルが異なることを示します。この例では、クエリとマテリアライズドビューでテーブルの結合順序が異なるため、このエラーが報告されます。概要の説明をすべて確認するには、[付録 1](#appendix-1-transparent-rewrite-failure-summary-information)を参照してください。

#### ケース 2: マテリアライズドビューがディメンションを網羅していない {#case-2-dimensions-not-covered-by-the-materialized-view}

**クエリの実行**:

```sql
explain
SELECT l_shipdate, l_linestatus, O_ORDERDATE, count(*)
FROM lineitem
LEFT OUTER JOIN orders on l_orderkey = o_orderkey
GROUP BY l_shipdate, l_linestatus, O_ORDERDATE;
```

**explain の出力**:

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

失敗理由の概要 `View dimensions doesn't not cover the query dimensions` は、クエリの `group by` 列をマテリアライズドビューの `group by` 列から取得できないことを示します。そのため、このエラーが報告されます。

### Q3: どのような場合にマテリアライズドビューの状態が変わり、利用不可になりますか？ {#q3-what-situations-cause-a-materialized-views-state-to-change-and-become-unavailable}

「利用不可」とは、**マテリアライズドビューを透過的リライトに使用できない**ことを意味します。マテリアライズドビュー自体を直接クエリすることはできます。

| マテリアライズドビューの種類 | 利用不可になるイベント | 影響範囲 |
| --- | --- | --- |
| 全体マテリアライズドビュー | ベーステーブルのデータ変更 / ベーステーブルのスキーマ変更 | マテリアライズドビュー全体が利用不可 |
| パーティション化されたマテリアライズドビュー | ベーステーブルのデータ変更 | 対応するパーティションが利用不可 |
| パーティション化されたマテリアライズドビュー | ベーステーブルのスキーマ変更 | マテリアライズドビュー全体が利用不可 |

現在は、リフレッシュの失敗によってもマテリアライズドビューが利用不可になります。今後は、リフレッシュが失敗しても、既存のマテリアライズドビューを透過的リライトに使用できるよう改善する予定です。

### Q4: マテリアライズドビューを直接クエリしてもデータが返されない {#q4-direct-query-on-the-materialized-view-returns-no-data}

考えられる原因は次のとおりです。

- マテリアライズドビューを作成中です。
- マテリアライズドビューの作成に失敗しました。

マテリアライズドビューの状態をクエリして確認できます。詳細は「View Materialized View Status」を参照してください。

### Q5: ベーステーブルのデータが変わってもマテリアライズドビューがリフレッシュされていない場合、透過的リライトはどう動作しますか？ {#q5-when-base-table-data-changes-but-the-materialized-view-has-not-been-refreshed-what-is-the-transparent-rewrite-behavior}

非同期マテリアライズドビューのデータには、ベーステーブルに対して一定の遅延があります。透過的リライトの動作は、ベーステーブルの種類と `grace_period` のしきい値によって異なります。

**1. 内部テーブルと、データ変更を検出できる外部テーブル（Hive など）**:

`grace_period` は、マテリアライズドビューとベーステーブルのデータが一致しないことを許容する最大期間です。

| `grace_period` の設定 | リライトの動作 |
| --- | --- |
| `0` | 透過的リライトに使用するには、マテリアライズドビューとベーステーブルのデータが完全に一致している必要があります。ただし、データ変更を検出できない外部テーブル（Hive 以外）では、データが最新かどうかにかかわらず透過的リライトに使用できます。この場合、データが一致しない可能性があります |
| `10`（秒） | マテリアライズドビューとベーステーブルのデータに最大 10 秒の遅延を許容します。遅延が 10 秒以内であれば、引き続き透過的リライトに使用できます |

**2. 一部のパーティションが無効な、パーティション化されたマテリアライズドビュー**:

- クエリが無効なパーティションのデータを使用しない場合、マテリアライズドビューは引き続き利用できます。
- クエリが無効なパーティションのデータを使用しても、データの鮮度が `grace_period` の範囲内であれば、マテリアライズドビューは引き続き利用できます。
- データの鮮度が `grace_period` を超える場合、元のテーブルとマテリアライズドビューを組み合わせてクエリに応答できます。これには union リライトのスイッチ `enable_materialized_view_union_rewrite` を有効にする必要があります。このスイッチはバージョン 2.1.5 以降、デフォルトで有効です。

## 付録 {#appendix}

### 付録 1: 透過的リライトの失敗理由の概要 {#appendix-1-transparent-rewrite-failure-summary-information}

<!-- Knowledge type: Reference table -->
<!-- Applicable scenarios: Locating the cause of transparent rewrite failure based on the FailSummary in explain output -->

| 概要情報 | 説明 |
| --- | --- |
| View struct info is invalid | マテリアライズドビューの構造情報が無効です。現在サポートされるリライト対象の SQL パターンは、クエリとマテリアライズドビューがともに結合を含む場合、またはクエリが集約を含み、マテリアライズドビューには結合が必須ではない場合です。透過的リライトでは、各ルールが特定の SQL パターンを処理するため、条件に合わないルールが適用候補になるとこのエラーを報告します。そのため、この情報は多くの場合に表示され、通常は透過的リライト失敗の主な原因ではありません |
| Materialized view rule exec fail | 透過的リライトのルールで、実行中に例外が発生しました。`Explain memo plan query_sql` を使用すると、具体的な例外スタックを確認できます |
| Match mode is invalid | クエリとマテリアライズドビューでテーブル数が一致しません。現在、この場合のリライトはサポートされていません |
| Query to view table mapping is null | クエリとマテリアライズドビューの間でテーブルの対応付けを生成できませんでした |
| queryToViewTableMappings are over the limit and be intercepted | クエリ内で自己結合するテーブルが多すぎるため、透過的リライトの探索空間が大きくなりすぎ、処理が停止されました |
| Query to view slot mapping is null | クエリのテーブルとマテリアライズドビューのテーブルの間で、スロットの対応付けを生成できませんでした |
| The graph logic between query and view is not consistent | クエリとマテリアライズドビューで結合の種類が異なるか、結合するテーブルが異なります |
| Predicate compensate fail | 通常、クエリの条件範囲がマテリアライズドビューの範囲外です。たとえば、クエリが `a > 10` で、マテリアライズドビューが `a > 15` の場合です |
| Rewrite compensate predicate by view fail | 述語の補完に失敗しました。通常、クエリにはマテリアライズドビューより多くの条件があり、その補完が必要ですが、条件で使用する列がマテリアライズドビューの select 句にありません |
| Calc invalid partitions fail | パーティション化されたマテリアライズドビューで、クエリが使用するパーティションの有効性を計算する際に失敗しました |
| mv can not offer any partition for query | クエリが使用するマテリアライズドビューのパーティションが、すべて無効です。`show partitions from mv_name` で各パーティションの `SyncWithBaseTables` フィールドが true か確認してください。false の場合は、該当するパーティションを手動でリフレッシュします。マテリアライズドビューとクエリデータの間に一定の遅延を許容できる場合は、マテリアライズドビューの `grace_period` プロパティを秒単位で設定してください |
| Add filter to base table fail when union rewrite | クエリがマテリアライズドビューの無効なパーティションを使用し、マテリアライズドビューと元のテーブルを union all で結合する試みに失敗しました |
| RewrittenPlan output logical properties is different with target group | リライトは完了しましたが、マテリアライズドビューの出力が元のクエリと一致しません |
| Rewrite expressions by view in join fail | 結合のリライト時に、クエリで使用するフィールドまたは式がマテリアライズドビューにありません |
| Rewrite expressions by view in scan fail | 単一テーブルのリライト時に、クエリで使用するフィールドまたは式がマテリアライズドビューにありません |
| Split view to top plan and agg fail, view doesn't not contain aggregate | 集約のリライト時に、マテリアライズドビューに集約がありません |
| Split query to top plan and agg fail | 集約のリライト時に、クエリに集約がありません |
| rewritten expression contains aggregate functions when group equals aggregate rewrite | クエリとマテリアライズドビューの `group by` 句が同じ場合に、リライト後の式に集約関数が含まれます |
| Can not rewrite expression when no roll up | クエリとマテリアライズドビューの `group by` 句が同じ場合に、式のリライトに失敗しました |
| Query function roll up fail | 集約のリライト時に、集約関数のロールアップに失敗しました |
| View dimensions do not cover the query dimensions | クエリの `group by` 句で使用する一部のディメンションが、マテリアライズドビューの `group by` 句にありません |
| View dimensions don't not cover the query dimensions in bottom agg | クエリの `group by` 句で使用する一部のディメンションが、マテリアライズドビューの `group by` 句にありません |
| View dimensions do not cover the query group set dimensions | クエリの `group sets` で使用する一部のディメンションが、マテリアライズドビューの `group by` 句にありません |
| The only one of query or view is scalar aggregate and can not rewrite expression meanwhile | クエリには `group by` がありますが、マテリアライズドビューにはありません |
| Both query and view have group sets, or query doesn't have but view has, not supported | クエリとマテリアライズドビューの両方に `group sets` があるか、クエリにはなくマテリアライズドビューにだけあります。この場合、透過的リライトはサポートされていません |

### 付録 2: 非同期マテリアライズドビューのパーティション作成が失敗する原因 {#appendix-2-async-materialized-view-partition-build-failure-causes}

<!-- Knowledge type: Reference table -->
<!-- Applicable scenarios: Locating causes when an error is reported while creating a partition materialized view -->

パーティション化されたマテリアライズドビューのリフレッシュは、パーティション単位の増分更新を原則とします。

1. **ステップ 1**: マテリアライズドビューのパーティション列を、ベーステーブルのパーティションに対応付けられるか計算します。
2. **ステップ 2**: 具体的な対応関係、つまりパーティションの対応が 1:1 か 1:n かを計算します。

| 概要情報 | 説明 |
| --- | --- |
| partition column can not be found in the SQL select column | マテリアライズドビューの定義で `partition by` の後に指定した列は、定義 SQL の select 句にも含まれている必要があります |
| can't not find valid partition track column, because %s | 適切なパーティション列が見つかりませんでした。具体的な理由は `because` の後に続きます |
| partition track doesn't support mark join | マテリアライズドビューのパーティション列が参照する列は、mark join の入力テーブルのパーティション列です。これはサポートされていません |
| partition column is in un supported join null generate side | マテリアライズドビューのパーティション列が参照する列は、結合によって null が生成される側にあります。たとえば、左結合の右側です |
| relation should be LogicalCatalogRelation | マテリアライズドビューが参照するパーティションベーステーブルのスキャン種別は `LogicalCatalogRelation` である必要があります。ほかの種類はサポートされていません |
| self join doesn't support partition update | 自己結合を含む SQL によるマテリアライズドビューの作成では、パーティション更新はまだサポートされていません |
| partition track already has a related base table column | マテリアライズドビューのパーティション列が参照できるのは、現在、単一のベーステーブルのパーティション列のみです |
| relation base table is not MTMVRelatedTableIf | マテリアライズドビューが参照するパーティションベーステーブルは、テーブルをパーティション化できるかどうかを示すインターフェース `MTMVRelatedTableIf` を継承していません |
| The related base table is not partition table | マテリアライズドビューが使用するベーステーブルは、パーティション化されたテーブルではありません |
| The related base table partition column doesn't contain the mv partition | マテリアライズドビューで `partition by` の後に指定した列が、パーティションベーステーブルに存在しません |
| group by sets is empty, doesn't contain the target partition | マテリアライズドビューの定義 SQL で集約を使用していますが、`group by` が空です |
| window partition sets don't contain the target partition | ウィンドウ関数を使用していますが、マテリアライズドビューが参照するパーティション列が `partition by` 句にありません |
| Unsupported plan operate in track partition | マテリアライズドビューの定義 SQL で、`order by` など、サポートされていない操作を使用しています |
| context partition column should be slot from column | ウィンドウ関数を使用しており、`partition by` 句でマテリアライズドビューが参照するパーティション列が、単純な列ではなく式です |
| partition expressions use more than one slot reference | `group by` または `partition by` の後のパーティション列が、単純な列ではなく、複数の列を含む式です。たとえば、`group by partition_col + other_col` です |
| column to check using invalid implicit expression | マテリアライズドビューのパーティション列では `date_trunc` のみ使用できます。パーティション列に適用できる式は、`date_trunc` などに制限されています |
| partition column time unit level should be greater than SQL select column | マテリアライズドビューの `partition by` の後で指定した `date_trunc` の時間粒度が、定義 SQL の select 句にある時間粒度より細かくなっています。たとえば、マテリアライズドビューでは `partition by(date_trunc(col, 'day'))` を使用しているのに、定義 SQL の select 句では `date_trunc(col, 'month')` を使用している場合です |
