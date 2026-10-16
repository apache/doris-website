---
{
    "title": "同期マテリアライズドビュー",
    "language": "ja",
    "description": "Doris の同期マテリアライズドビューを使用して、集約、プレフィックスインデックスの照合、式の計算を高速化する方法を説明します。適用シナリオ、構文、ビューが使用されたかどうかの確認方法、よくある質問を取り上げます。",
    "keywords": ["Doris 同期マテリアライズドビュー", "マテリアライズドビュー", "クエリ高速化", "bitmap_union", "プレフィックスインデックス", "集約の事前計算"]
}
---

<!-- Knowledge type: concept + how-to guide -->
<!-- Applicable scenarios: aggregation precomputation, prefix index matching, prefiltering, expression precomputation -->

同期マテリアライズドビュー（Sync Materialized View）は、ベーステーブルに対する SELECT 文の結果を事前に計算して保存する、Doris の特別なテーブルです。Doris が自動的に維持し、書き込み時にはベーステーブルとの強い整合性を保ちます。クエリ時には最適なビューを自動的に選択して、読み取りを高速化します。

## 使用上の注意

同期マテリアライズドビューを使用する前に、次の点を確認してください。

- 対象は**単一テーブル**の SELECT 文に限られ、JOIN、HAVING、LIMIT、LATERAL VIEW は使用できません
- SELECT リストに、自動増分列、定数、重複する式、ウィンドウ関数、VARBINARY 型の列を含めることはできません
- SELECT リストの集約関数は式のルートに置く必要があります（`sum(a + 1)` はサポートされますが、`sum(a) + 1` はサポートされません）
- マテリアライズドビューの列名は、ベーステーブルの列名や他のビューの列名と重複できません（`col as xxx` のようなエイリアスで回避できます）
- 一つのテーブルに作成するビューの数がロード性能に与える影響を評価しておく必要があります
- Unique Key モデルでは列の順序のみ変更でき、集約はできません

## 同期マテリアライズドビューとは

<!-- Knowledge type: concept -->

同期マテリアライズドビューは、定義した SELECT 文に基づく事前計算済みデータセットを保存する Doris の特別なテーブルです。ビューのデータは Doris が自動的に維持します。データの追加時も削除時も、ベーステーブルとマテリアライズドビューが同期して更新され、整合性が保たれます。関連するコマンドが完了するのは同期が終わった後で、追加の手動メンテナンスは不要です。クエリ時には最適なマテリアライズドビューが自動的に選択され、そのデータが直接読み取られます。

## 適用シナリオ

<!-- Applicable scenarios: when to choose a sync materialized view -->

| シナリオ | 説明 |
| --- | --- |
| 集約の高速化 | SUM、COUNT、BITMAP_UNION など、計算に時間がかかる集約を事前に計算します |
| 異なるプレフィックスインデックスへの対応 | クエリのフィルター列がベーステーブルのプレフィックスインデックスに一致しない場合、その列を先頭に配置したビューを作成します |
| 事前フィルタリングによるスキャン量の削減 | WHERE 条件で事前に絞り込み、データ量を減らします |
| 複雑な式の事前計算 | `abs(k1)+k2+1` などの複雑な式を事前に計算し、クエリ時に結果を再利用します |

## 制限事項

<!-- Knowledge type: constraints -->

| カテゴリ | 制限 |
| --- | --- |
| 構文の範囲 | WHERE、GROUP BY、ORDER BY を含む単一テーブルの SELECT のみサポートします。JOIN、HAVING、LIMIT、LATERAL VIEW はサポートしません |
| クエリ方法 | 同期マテリアライズドビューを直接クエリすることはできません（非同期マテリアライズドビューとは異なります） |
| SELECT リスト | 自動増分列、定数、重複する式、ウィンドウ関数、VARBINARY 型の列を含めることはできません |
| 列名の要件 | ベーステーブルの列名や、そのテーブル上の他のマテリアライズドビューの列名と重複できません。`col as xxx` のようなエイリアスで回避できます |
| 集約関数 | 集約関数は式のルートに置く必要があります（`sum(a) + 1` はサポートされませんが、`sum(a + 1)` はサポートされます）。また、集約関数の後に集約を伴わない式を置くことはできません（`SELECT x, sum(a)` は可能ですが、`SELECT sum(a), x` はできません） |
| 削除の制限 | DELETE 条件で参照する列がマテリアライズドビューに存在する場合、データを削除する前にそのビューを削除してください |
| ロード性能 | 一つのテーブルに多数のマテリアライズドビューを作成すると、ベーステーブルと同時に更新されるため、ロードが遅くなります |
| データモデル | Unique Key モデル上のマテリアライズドビューでは、列の順序のみ変更でき、集約はできません |

## 同期マテリアライズドビューの使用方法

Doris には、作成、確認、削除など、マテリアライズドビューを操作するための一連の DDL 文が用意されています。次の例では、マテリアライズドビューを使用して集約を高速化する方法を示します。

### ベーステーブルのデータを準備する

各取引の取引 ID、販売担当者、店舗、販売日時、金額を記録した売上明細テーブルがあるとします。

```sql
-- Create a test_db
create database test_db;
use test_db;

-- Create the table
create table sales_records
(
    record_id int, 
    seller_id int, 
    store_id int, 
    sale_date date, 
    sale_amt bigint
) 
distributed by hash(record_id) 
properties("replication_num" = "1");

-- Insert data
insert into sales_records values(1,1,1,"2020-02-02",1), (1,1,1,"2020-02-02",2);
```

### マテリアライズドビューを作成する

**目的**：店舗別の売上を頻繁に分析するクエリ向けに、事前集約したビューを作成します。

**コマンド**：

```sql
create materialized view store_amt as 
select store_id as store_id_, sum(sale_amt) from sales_records group by store_id;
```

**説明**：このビューは `store_id` でグループ化し、店舗ごとに `sale_amt` を合計します。店舗単位の集約クエリを高速化できます。

### マテリアライズドビューの作成状態を確認する

**目的**：マテリアライズドビューの作成は非同期で行われるため、タスクの状態を確認します。

**コマンド**：

```sql
show alter table materialized view from test_db;
```

**説明**：結果には、このデータベースのすべてのマテリアライズドビュー作成タスクが表示されます。出力例：

```sql
+--------+---------------+---------------------+---------------------+---------------+-----------------+----------+---------------+----------+------+----------+---------+
| JobId  | TableName     | CreateTime          | FinishTime          | BaseIndexName | RollupIndexName | RollupId | TransactionId | State    | Msg  | Progress | Timeout |
+--------+---------------+---------------------+---------------------+---------------+-----------------+----------+---------------+----------+------+----------+---------+
| 494349 | sales_records | 2020-07-30 20:04:56 | 2020-07-30 20:04:57 | sales_records | store_amt       | 494350   | 133107        | FINISHED |      | NULL     | 2592000 |
+--------+---------------+---------------------+---------------------+---------------+-----------------+----------+---------------+----------+------+----------+---------+
```

主なフィールドの説明：

| フィールド | 意味 |
| --- | --- |
| TableName | マテリアライズドビューの元となるテーブル |
| RollupIndexName | マテリアライズドビューの名前 |
| State | タスクの状態。`FINISHED` はビューの作成が成功し、クエリによる自動的な選択の対象になったことを示します |

### マテリアライズドビューの作成をキャンセルする

**目的**：バックグラウンドの非同期タスクが実行中の場合に、作成をキャンセルします。

**コマンド**：

```sql
cancel alter table materialized view from test_db.sales_records;
```

**説明**：マテリアライズドビューがすでに作成されている場合、このコマンドでは作成をキャンセルできません。削除コマンドでビューを削除できます。

### マテリアライズドビューのスキーマを確認する

**目的**：対象テーブル上のすべてのマテリアライズドビューとそのスキーマを確認します。

**コマンド**：

```sql
desc sales_records all;
```

**説明**：出力は次のとおりです。

```sql
+---------------+---------------+---------------------+--------+--------------+------+-------+---------+-------+---------+------------+-------------+
| IndexName     | IndexKeysType | Field               | Type   | InternalType | Null | Key   | Default | Extra | Visible | DefineExpr | WhereClause |
+---------------+---------------+---------------------+--------+--------------+------+-------+---------+-------+---------+------------+-------------+
| sales_records | DUP_KEYS      | record_id           | INT    | INT          | Yes  | true  | NULL    |       | true    |            |             |
|               |               | seller_id           | INT    | INT          | Yes  | true  | NULL    |       | true    |            |             |
|               |               | store_id            | INT    | INT          | Yes  | true  | NULL    |       | true    |            |             |
|               |               | sale_date           | DATE   | DATEV2       | Yes  | false | NULL    | NONE  | true    |            |             |
|               |               | sale_amt            | BIGINT | BIGINT       | Yes  | false | NULL    | NONE  | true    |            |             |
|               |               |                     |        |              |      |       |         |       |         |            |             |
| store_amt     | AGG_KEYS      | mv_store_id         | INT    | INT          | Yes  | true  | NULL    |       | true    | `store_id` |             |
|               |               | mva_SUM__`sale_amt` | BIGINT | BIGINT       | Yes  | false | NULL    | SUM   | true    | `sale_amt` |             |
+---------------+---------------+---------------------+--------+--------------+------+-------+---------+-------+---------+------------+-------------+
```

`sales_records` に、前の手順で作成した `store_amt` というマテリアライズドビューがあることがわかります。

### マテリアライズドビューの CREATE 文を確認する

**目的**：マテリアライズドビューの元の DDL を確認します。

**コマンド**：

```sql
show create materialized view store_amt on sales_records;
```

**説明**：出力は次のとおりです。

```sql
+---------------+-----------+------------------------------------------------------------------------------------------------------------+
| TableName     | ViewName  | CreateStmt                                                                                                 |
+---------------+-----------+------------------------------------------------------------------------------------------------------------+
| sales_records | store_amt | create materialized view store_amt as select store_id, sum(sale_amt) from sales_records group by store_id |
+---------------+-----------+------------------------------------------------------------------------------------------------------------+
```

### マテリアライズドビューを使用してクエリする

**目的**：クエリの対象は引き続きベーステーブルです。Doris が自動的にクエリを書き換えてマテリアライズドビューを使用します。

**コマンド**：

```sql
select store_id, sum(sale_amt) from sales_records group by store_id;
```

上記のクエリには `store_amt` が自動的に選択されます。`EXPLAIN` コマンドを使用すると、現在のクエリでマテリアライズドビューが使用されるかどうかを確認できます。

```sql
explain select store_id, sum(sale_amt) from sales_records group by store_id;
```

**説明**：結果は次のとおりです。

```sql
+------------------------------------------------------------------------+
| Explain String (Nereids Planner)                                       |
+------------------------------------------------------------------------+
| PLAN FRAGMENT 0                                                        |
|   OUTPUT EXPRS:                                                        |
|     store_id[#11]                                                      |
|     sum(sale_amt)[#12]                                                 |
|   PARTITION: HASH_PARTITIONED: store_id_[#7]                           |
|                                                                        |
|   HAS_COLO_PLAN_NODE: true                                             |
|                                                                        |
|   VRESULT SINK                                                         |
|      MYSQL_PROTOCAL                                                    |
|                                                                        |
|   3:VAGGREGATE (merge finalize)(384)                                   |
|   |  output: sum(partial_sum(__sum_1)[#8])[#10]                        |
|   |  group by: store_id_[#7]                                           |
|   |  sortByGroupKey: false                                             |
|   |  cardinality = 1                                                   |
|   |  final projections: store_id_[#9], sum(__sum_1)[#10]               |
|   |  final project output tuple id: 4                                  |
|   |  distribute expr lists: store_id_[#7]                              |
|   |                                                                    |
|   2:VEXCHANGE                                                          |
|      offset: 0                                                         |
|      distribute expr lists:                                            |
|                                                                        |
| PLAN FRAGMENT 1                                                        |
|                                                                        |
|   PARTITION: HASH_PARTITIONED: record_id[#2]                           |
|                                                                        |
|   HAS_COLO_PLAN_NODE: false                                            |
|                                                                        |
|   STREAM DATA SINK                                                     |
|     EXCHANGE ID: 02                                                    |
|     HASH_PARTITIONED: store_id_[#7]                                    |
|                                                                        |
|   1:VAGGREGATE (update serialize)(374)                                 |
|   |  STREAMING                                                         |
|   |  output: partial_sum(__sum_1[#1])[#8]                              |
|   |  group by: store_id_[#0]                                           |
|   |  sortByGroupKey: false                                             |
|   |  cardinality = 1                                                   |
|   |  distribute expr lists:                                            |
|   |                                                                    |
|   0:VOlapScanNode(369)                                                 |
|      TABLE: test_db.sales_records(store_amt), PREAGGREGATION: ON       |
|      partitions = 1/1 (sales_records)                                  |
|      tablets = 10/10, tabletList = 266568, 266570, 266572 ...          |
|      cardinality = 1, avgRowSize = 1805.0, numNodes = 1                |
|      pushAggOp = NONE                                                  |
|                                                                        |
|                                                                        |
| ========== MATERIALIZATIONS ==========                                 |
|                                                                        |
| MaterializedView                                                       |
| MaterializedViewRewriteSuccessAndChose:                                |
|   internal.test_db.sales_records.store_amt chose,                      |
|                                                                        |
| MaterializedViewRewriteSuccessButNotChose:                             |
|   not chose: none,                                                     |
|                                                                        |
| MaterializedViewRewriteFail:                                           |
|                                                                        |
|                                                                        |
| ========== STATISTICS ==========                                       |
| planned with unknown column statistics                                 |
+------------------------------------------------------------------------+
```

`MaterializedViewRewriteSuccessAndChose` には、正常に選択されたマテリアライズドビューが表示されます。具体例：

```sql
+------------------------------------------------------------------------+
| MaterializedViewRewriteSuccessAndChose:                                |  
|   internal.test_db.sales_records.store_amt chose,                      |
+------------------------------------------------------------------------+
```

上記の出力は、クエリで `store_amt` というマテリアライズドビューが正常に選択されたことを示します。対象テーブルにデータがない場合は、マテリアライズドビューが選択されないことがあります。

#### MATERIALIZATIONS フィールドの説明

| フィールド | 意味 |
| --- | --- |
| MaterializedViewRewriteSuccessAndChose | 正常に選択され、クエリの最適化に使用されたマテリアライズドビュー |
| MaterializedViewRewriteSuccessButNotChose | 照合には成功したものの選択されなかったマテリアライズドビュー（コスト評価では最適でなかったもの） |
| MaterializedViewRewriteFail | 照合に失敗したマテリアライズドビュー。元の SQL が既存のビューに一致しなかったことを示します |

### マテリアライズドビューを削除する

**目的**：不要になったマテリアライズドビューを削除します。

**コマンド**：

```sql
drop materialized view store_amt on sales_records;
```

## 例

### 例 1：集約クエリを高速化する

<!-- Applicable scenarios: exact deduplication aggregation such as UV/PV -->

**業務シナリオ**：広告の UV（ユニーク訪問者数）と PV（ページビュー数）を計算します。

**手順**：

1. 広告クリックの詳細を保存する元テーブルを作成します。

    ```sql
    create table advertiser_view_record
    (
        click_time datetime, 
        advertiser varchar(10), 
        channel varchar(10), 
        user_id int
    ) distributed by hash(user_id) properties("replication_num" = "1");
    insert into advertiser_view_record values("2020-02-02 02:02:02",'a','a',1), ("2020-02-02 02:02:02",'a','a',2);
    ```

2. 広告の UV（同じ広告についてユーザーを重複なく数えた値）を取得します。典型的なクエリは次のとおりです。

    ```sql
    select 
        advertiser, 
        channel, 
        count(distinct user_id) 
    from 
        advertiser_view_record 
    group by 
        advertiser, channel;
    ```

3. UV を計算するために、`bitmap_union` を使って事前に重複を除去するマテリアライズドビューを作成します。Doris では `count(distinct)` の結果は `bitmap_union_count` の結果と同じため、`bitmap_union` で集約したビューを使ってクエリを高速化できます。

    ```sql
    create materialized view advertiser_uv as 
    select 
        advertiser as advertiser_, 
        channel as channel_, 
        bitmap_union(to_bitmap(user_id)) 
    from 
        advertiser_view_record 
    group by 
        advertiser, channel;
    ```

4. マテリアライズドビューを作成したら、元の UV クエリを再実行します。Doris は `advertiser_uv` のデータを自動的に読み取ります。

    ```sql
    select 
        advertiser, 
        channel, 
        count(distinct user_id) 
    from 
        advertiser_view_record 
    group by 
        advertiser, channel;
    ```

5. マテリアライズドビューが選択されると、実際のクエリは次のように書き換えられます。

    ```sql
    select 
        advertiser, 
        channel, 
        bitmap_union_count(to_bitmap(user_id)) 
    from 
        advertiser_uv 
    group by 
        advertiser, channel;
    ```

6. `explain` コマンドで、クエリがマテリアライズドビューに一致したかどうかを確認します。

    ```sql
    explain select 
        advertiser, 
        channel, 
        count(distinct user_id) 
    from 
        advertiser_view_record 
    group by 
        advertiser, channel;
    ```

7. 出力は次のとおりです。

    ```sql
    +---------------------------------------------------------------------------------------------------------------------------------------------------------+
    | Explain String(Nereids Planner)                                                                                                                         |
    +---------------------------------------------------------------------------------------------------------------------------------------------------------+
    | PLAN FRAGMENT 0                                                                                                                                         |
    |   OUTPUT EXPRS:                                                                                                                                         |
    |     advertiser[#13]                                                                                                                                     |
    |     channel[#14]                                                                                                                                        |
    |     count(DISTINCT user_id)[#15]                                                                                                                        |
    |   PARTITION: HASH_PARTITIONED: advertiser_[#7], channel_[#8]                                                                                            |
    |                                                                                                                                                         |
    |   HAS_COLO_PLAN_NODE: true                                                                                                                              |
    |                                                                                                                                                         |
    |   VRESULT SINK                                                                                                                                          |
    |      MYSQL_PROTOCAL                                                                                                                                     |
    |                                                                                                                                                         |
    |   3:VAGGREGATE (merge finalize)(440)                                                                                                                    |
    |   |  output: bitmap_union_count(partial_bitmap_union_count(__bitmap_union_2)[#9])[#12]                                                                  |
    |   |  group by: advertiser_[#7], channel_[#8]                                                                                                            |
    |   |  sortByGroupKey:false                                                                                                                               |
    |   |  cardinality=1                                                                                                                                      |
    |   |  final projections: advertiser_[#10], channel_[#11], bitmap_union_count(__bitmap_union_2)[#12]                                                      |
    |   |  final project output tuple id: 4                                                                                                                   |
    |   |  distribute expr lists: advertiser_[#7], channel_[#8]                                                                                               |
    |   |                                                                                                                                                     |
    |   2:VEXCHANGE                                                                                                                                           |
    |      offset: 0                                                                                                                                          |
    |      distribute expr lists:                                                                                                                             |
    |                                                                                                                                                         |
    | PLAN FRAGMENT 1                                                                                                                                         |
    |                                                                                                                                                         |
    |   PARTITION: HASH_PARTITIONED: user_id[#6]                                                                                                              |
    |                                                                                                                                                         |
    |   HAS_COLO_PLAN_NODE: false                                                                                                                             |
    |                                                                                                                                                         |
    |   STREAM DATA SINK                                                                                                                                      |
    |     EXCHANGE ID: 02                                                                                                                                     |
    |     HASH_PARTITIONED: advertiser_[#7], channel_[#8]                                                                                                     |
    |                                                                                                                                                         |
    |   1:VAGGREGATE (update serialize)(430)                                                                                                                  |
    |   |  STREAMING                                                                                                                                          |
    |   |  output: partial_bitmap_union_count(__bitmap_union_2[#2])[#9]                                                                                       |
    |   |  group by: advertiser_[#0], channel_[#1]                                                                                                            |
    |   |  sortByGroupKey:false                                                                                                                               |
    |   |  cardinality=1                                                                                                                                      |
    |   |  distribute expr lists:                                                                                                                             |
    |   |                                                                                                                                                     |
    |   0:VOlapScanNode(425)                                                                                                                                  |
    |      TABLE: test_db.advertiser_view_record(advertiser_uv), PREAGGREGATION: ON                                                                           |
    |      partitions=1/1 (advertiser_view_record)                                                                                                            |
    |      tablets=10/10, tabletList=266637,266639,266641 ...                                                                                                 |
    |      cardinality=1, avgRowSize=0.0, numNodes=1                                                                                                          |
    |      pushAggOp=NONE                                                                                                                                     |
    |                                                                                                                                                         |
    |                                                                                                                                                         |
    | ========== MATERIALIZATIONS ==========                                                                                                                  |
    |                                                                                                                                                         |
    | MaterializedView                                                                                                                                        |
    | MaterializedViewRewriteSuccessAndChose:                                                                                                                 |
    |   internal.test_db.advertiser_view_record.advertiser_uv chose,                                                                                          |
    |                                                                                                                                                         |
    | MaterializedViewRewriteSuccessButNotChose:                                                                                                              |
    |   not chose: none,                                                                                                                                      |
    |                                                                                                                                                         |
    | MaterializedViewRewriteFail:                                                                                                                            |
    |                                                                                                                                                         |
    |                                                                                                                                                         |
    | ========== STATISTICS ==========                                                                                                                        |
    | planed with unknown column statistics                                                                                                                   |
    +---------------------------------------------------------------------------------------------------------------------------------------------------------+
    ```

8. `explain` の出力に `internal.test_db.advertiser_view_record.advertiser_uv chose` と表示されます。これは、クエリがマテリアライズドビューのデータを直接スキャンし、照合に成功したことを意味します。また、`count(distinct)` は `user_id` 列に対して使用される場合、`bitmap_union_count(to_bitmap)` に書き換えられ、Bitmap による正確な重複排除が行われます。

### 例 2：異なるプレフィックスインデックスに対応する

<!-- Applicable scenarios: filter conditions not covered by the base table prefix index -->

**業務シナリオ**：プレフィックスインデックスを使用します。

元テーブルには三つの列（k1、k2、k3）があり、k1 と k2 はプレフィックスインデックスの列として設定されています。クエリ条件が `where k1=1 and k2=2` の場合、そのインデックスで高速化できます。一方、`where k3=3` のような条件ではプレフィックスインデックスを使用できません。そこで、`k3` を最初の列にしたマテリアライズドビューを作成します。

**手順**：

1. テーブルを作成し、データを挿入します。

    ```sql
    create table test_table
    (
        k1 int, 
        k2 int, 
        k3 int, 
        kx int
    ) 
    distributed by hash(k1) 
    properties("replication_num" = "1");
    
    insert into test_table values(1,1,1,1),(3,3,3,3);
    ```

2. k3 をプレフィックスインデックスに使用するマテリアライズドビューを作成します。

    ```sql
    create materialized view mv_1 as SELECT k3 as k3_, k2 as k2_, k1 as k1_ FROM test_table;
    ```

3. `EXPLAIN` を使用して、クエリにマテリアライズドビューが選択されるかどうかを確認します。

    ```sql
    explain select k1, k2, k3 from test_table where k3=3;
    ```

4. 出力は次のとおりです。

    ```sql
    +----------------------------------------------------------+
    | Explain String(Nereids Planner)                          |
    +----------------------------------------------------------+
    | PLAN FRAGMENT 0                                          |
    |   OUTPUT EXPRS:                                          |
    |     k1[#7]                                               |
    |     k2[#8]                                               |
    |     k3[#9]                                               |
    |   PARTITION: HASH_PARTITIONED: k1_[#2]                   |
    |                                                          |
    |   HAS_COLO_PLAN_NODE: false                              |
    |                                                          |
    |   VRESULT SINK                                           |
    |      MYSQL_PROTOCAL                                      |
    |                                                          |
    |   0:VOlapScanNode(256)                                   |
    |      TABLE: test_db.test_table(mv_1), PREAGGREGATION: ON |
    |      PREDICATES: (mv_k3[#0] = 3)                         |
    |      partitions=1/1 (test_table)                         |
    |      tablets=10/10, tabletList=271177,271179,271181 ...  |
    |      cardinality=1, avgRowSize=0.0, numNodes=1           |
    |      pushAggOp=NONE                                      |
    |      final projections: k1_[#2], mv_k2[#1], mv_k3[#0]    |
    |      final project output tuple id: 2                    |
    |                                                          |
    |                                                          |
    | ========== MATERIALIZATIONS ==========                   |
    |                                                          |
    | MaterializedView                                         |
    | MaterializedViewRewriteSuccessAndChose:                  |
    |   internal.test_db.test_table.mv_1 chose,                |
    |                                                          |
    | MaterializedViewRewriteSuccessButNotChose:               |
    |   not chose: none,                                       |
    |                                                          |
    | MaterializedViewRewriteFail:                             |
    |                                                          |
    |                                                          |
    | ========== STATISTICS ==========                         |
    | planed with unknown column statistics                    |
    +----------------------------------------------------------+
    ```

5. `EXPLAIN` の出力に `internal.test_db.test_table.mv_1 chose` と表示されます。これは、クエリでマテリアライズドビューが正常に選択されたことを意味します。

### 例 3：事前フィルタリングと式の計算でクエリを高速化する

<!-- Applicable scenarios: repeated computation of complex expressions or subset queries under fixed WHERE conditions -->

**業務シナリオ**：データを事前に絞り込むか、式の計算を高速化します。

**手順**：

1. テーブルを作成し、データを挿入します。

    ```sql
    create table d_table (
       k1 int null,
       k2 int not null,
       k3 bigint null,
       k4 date null
    )
    duplicate key (k1,k2,k3)
    distributed BY hash(k1) buckets 3
    properties("replication_num" = "1");
    
    insert into d_table select 1,1,1,'2020-02-20';
    insert into d_table select 2,2,2,'2021-02-20';
    insert into d_table select 3,-3,null,'2022-02-20';
    ```

2. 式の事前計算用とデータの事前フィルタリング用に、二つのマテリアライズドビューを作成します。

    ```sql
    -- mv1 performs expression computation in advance
    create materialized view mv1 as 
    select 
        abs(k1)+k2+1,        
        sum(abs(k2+2)+k3+3) 
    from 
        d_table 
    group by 
        abs(k1)+k2+1;
    
    -- mv2 filters with a where expression in advance to reduce the data volume in the materialized view
    create materialized view mv2 as 
    select 
        year(k4),
        month(k4) 
    from 
        d_table 
    where 
        year(k4) = 2020;
    ```

3. マテリアライズドビューが選択されるかどうかを確認します。

    ```sql
    -- Hits mv1
    select 
        abs(k1)+k2+1,
        sum(abs(k2+2)+k3+3) 
    from 
        d_table 
    group by 
        abs(k1)+k2+1;
        
    -- Hits mv1
    select 
        bin(abs(k1)+k2+1),
        sum(abs(k2+2)+k3+3) 
    from 
        d_table 
    group by 
        bin(abs(k1)+k2+1);
    
    -- Hits mv2
    select 
        year(k4) + month(k4) 
    from 
        d_table 
    where 
        year(k4) = 2020;
    
    -- Hits the original table d_table; does not hit mv2 because the where condition does not match
    select 
        year(k4),
        month(k4) 
    from 
        d_table;
    ```

## よくある質問

<!-- Knowledge type: FAQ -->

### Q1：マテリアライズドビューを作成したのに、クエリの書き換えに成功しないのはなぜですか？

**原因**：マテリアライズドビューの作成がまだ完了していない可能性があります。

**診断コマンド**：

```sql
show alter table materialized view from test_db;
```

**説明**：`State` フィールドが `FINISHED` でない場合は、作成が完了するまで待ってください。`FINISHED` になって初めて、クエリでマテリアライズドビューを使用できます。また、ベーステーブルにデータがない場合も、ビューが選択されないことがあります。

### Q2：2.x から 3.0.0 にアップグレードした後、以前の同期マテリアライズドビューが使用されなくなったのはなぜですか？

**原因**：バージョン 3.0.0 以降、同期マテリアライズドビューはデフォルトでプラン構造の情報に基づいて透過的に書き換えられます。

**解決策**：2.x ではビューが使用されていたクエリが 3.0.0 で使用されなくなった場合は、デフォルトで有効な次のスイッチをオフにします。

```sql
SET enable_sync_mv_cost_based_rewrite = false;
```

### Q3：同期マテリアライズドビューと非同期マテリアライズドビューの違いは何ですか？

| 比較項目 | 同期マテリアライズドビュー | 非同期マテリアライズドビュー |
| --- | --- | --- |
| データの整合性 | ベーステーブルとの強い整合性を保ち、書き込み時に同期して更新されます | 遅延を伴う非同期更新です |
| サポートする構文 | 単一テーブルの SELECT のみ | 複数テーブルの JOIN など、複雑なクエリをサポートします |
| 直接クエリ | サポートしません。ベーステーブルへのクエリが自動的に書き換えられることで使用されます | ビューを直接クエリできます |
| メンテナンス | 手動操作なしで自動的に維持されます | 更新ポリシーが必要です |
| 適用シナリオ | 単一テーブルの集約、プレフィックスインデックス、事前フィルタリング、式の事前計算 | 複数テーブルの JOIN やテーブル間の事前計算 |
