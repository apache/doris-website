---
{
  "title": "同期マテリアライズドビュー",
  "language": "ja",
  "description": "同期マテリアライズドビューは、定義されたSELECT文に基づいて事前計算されたデータセットを格納するDorisの特別なテーブルタイプです。"
}
---
## 同期マテリアライズドビューとは

同期マテリアライズドビューは、定義されたSELECT文に基づいて事前計算されたデータセットを格納するDorisの特別なテーブル型です。Dorisは同期マテリアライズドビュー内のデータを自動的に維持し、ベーステーブルでの新しいインポートや削除が、追加の手動メンテナンスを必要とせずに、データの整合性を保ちながらリアルタイムでマテリアライズドビューに反映されることを保証します。クエリ時に、Dorisは自動的に最適なマテリアライズドビューを選択し、そこから直接データを取得します。

## 適用シナリオ

- 時間のかかる集約操作の加速

- プレフィックスインデックスマッチングを必要とするクエリ

- 事前フィルタリングによるスキャンデータ量の削減

- 複雑な式の事前計算によるクエリの高速化

## 制限事項

- 同期マテリアライズドビューは、WHERE、GROUP BY、ORDER BY句を含む単一テーブルのSELECT文のみをサポートし、JOIN、HAVING、LIMIT句、LATERAL VIEWはサポートしません。

- 非同期マテリアライズドビューとは異なり、同期マテリアライズドビューは直接クエリできません。

- SELECT リストには自動増分カラム、定数、重複式、ウィンドウ関数を含められません。

- SELECT リストにはVARBINARY型のカラムを含められません。

- 同期マテリアライズドビューのselect リスト内のカラム名は、ベーステーブルの既存カラムや、同じベーステーブル上の他の同期マテリアライズドビューのカラム名と同じであってはなりません。エイリアスを指定することで名前の競合を回避できます（例：col as xxx）。

- SELECT リストに集約関数が含まれる場合、これらはルート式でなければならず（例：`sum(a + 1)`はサポートされますが、`sum(a) + 1`はサポートされません）、集約関数の後に非集約関数式を続けることはできません（例：`SELECT x, sum(a)`は許可されますが、`SELECT sum(a), x`は許可されません）。

- DELETE文の条件カラムがマテリアライズドビューに存在する場合、DELETE操作は実行できません。データの削除が必要な場合は、まずマテリアライズドビューを削除する必要があります。

- 単一テーブル上に過剰なマテリアライズドビューがあると、インポート効率に影響を与える可能性があります。データのインポート時に、マテリアライズドビューとベーステーブルの両方が同期的に更新されます。テーブル上に過剰なマテリアライズドビューがあると、複数のテーブルに同時にデータをインポートするのと同様に、インポートが遅くなる可能性があります。

- Unique Keyデータモデル上のマテリアライズドビューはカラムの並び替えのみが可能で、集約はサポートしません。そのため、Unique Keyモデル上のマテリアライズドビューを通じて粗粒度の集約操作は実行できません。

## マテリアライズドビューの使用

Dorisは、作成、表示、削除を含むマテリアライズドビューのための包括的なDDL構文を提供します。以下は、マテリアライズドビューを使用して集約計算を加速する方法を示す例です。ユーザーが取引ID、営業担当者、店舗、販売日、金額を格納する販売記録詳細テーブルを持っているとします。テーブル作成とデータ挿入文は以下の通りです：

```sql
-- Create a test_db  
create database test_db;  
use test_db;  
  
-- Create table  
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
### マテリアライズドビューの作成

ユーザーが異なる店舗別の売上高を頻繁に分析する必要がある場合、`sales_records`テーブルに対してマテリアライズドビューを作成し、店舗IDでグループ化して各店舗の売上金額を合計することができます。作成文は以下の通りです：

```sql
create materialized view store_amt as   
select store_id as store_id_, sum(sale_amt) from sales_records group by store_id;
```
### マテリアライズドビューが作成されているかの確認

マテリアライズドビューの作成は非同期操作であるため、ユーザーはタスクを送信した後、マテリアライズドビュー作成タスクのステータスを非同期で確認する必要があります。コマンドは次のとおりです：

```sql
show alter table materialized view from test_db;
```
出力では、そのデータベースのすべてのマテリアライズドビュー作成タスクが表示されます。サンプル出力は次のとおりです：

```sql
+--------+---------------+---------------------+---------------------+---------------+-----------------+----------+---------------+----------+------+----------+---------+  
| JobId  | TableName     | CreateTime          | FinishTime          | BaseIndexName | RollupIndexName | RollupId | TransactionId | State    | Msg  | Progress | Timeout |  
+--------+---------------+---------------------+---------------------+---------------+-----------------+----------+---------------+----------+------+----------+---------+  
| 494349 | sales_records | 2020-07-30 20:04:56 | 2020-07-30 20:04:57 | sales_records | store_amt       | 494350   | 133107        | FINISHED |      | NULL     | 2592000 |  
+--------+---------------+---------------------+---------------------+---------------+-----------------+----------+---------------+----------+------+----------+---------+
```
`State`列はステータスを示します。状態が`FINISHED`に変わると、マテリアライズドビューが正常に作成されます。

### マテリアライズドビュー作成のキャンセル

マテリアライズドビューを作成するためのバックグラウンド非同期タスクがまだ完了していない場合、以下のコマンドでキャンセルできます：

```sql
cancel alter table materialized view from test_db.sales_records;
```
マテリアライズドビューが既に作成されている場合、キャンセルすることはできませんが、DROPコマンドを使用して削除することができます。

### マテリアライズドビュー構造の表示

対象テーブルに作成されたすべてのマテリアライズドビューの構造は、以下のコマンドを使用して表示できます：

```sql
desc sales_records all;
```
### マテリアライズドビューの作成文の表示

マテリアライズドビューの作成文は以下のコマンドで表示できます：

```sql
show create materialized view store_amt on sales_records;
```
### Materialized Viewのクエリ

Materialized Viewが作成されると、ユーザーが異なる店舗の売上高をクエリする際、Dorisは新しく作成されたmaterialized view `store_amt`から直接集計データを読み取り、それによってクエリ効率を向上させます。ユーザーは引き続きクエリで`sales_records`テーブルを指定します。例えば：

```sql
SELECT store_id, SUM(sale_amt) FROM sales_records GROUP BY store_id;
```
上記のクエリは自動的に`store_amt`マテリアライズドビューにマッチします。ユーザーは以下のコマンドを使用して、現在のクエリが適切なマテリアライズドビューにマッチしているかどうかを確認できます。

```sql
EXPLAIN SELECT store_id, SUM(sale_amt) FROM sales_records GROUP BY store_id;
```
結果は以下の通りです：

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
`MaterializedViewRewriteSuccessAndChose`は、以下の例に示すように、正常にマッチしたマテリアライズドビューを表示します：

```sql
+------------------------------------------------------------------------+  
| MaterializedViewRewriteSuccessAndChose:                                |  
|   internal.test_db.sales_records.store_amt chose,                      |  
+------------------------------------------------------------------------+
```
上記の内容は、クエリが`store_amt`という名前のマテリアライズドビューに正常にマッチしたことを示しています。ターゲットテーブルにデータがない場合、マテリアライズドビューがヒットしない可能性があることに注意が必要です。

MATERIALIZATIONSの詳細説明：

- **MaterializedViewRewriteSuccessAndChose**: クエリ最適化のために正常に選択され使用されたマテリアライズドビューを表示します。

- **MaterializedViewRewriteSuccessButNotChose**: クエリにマッチしたが選択されなかったマテリアライズドビューを表示します（オプティマイザはコストに基づいて最適なマテリアライズドビューを選択するため、これらのマッチしたが選択されなかったビューは最適な選択ではなかったことを示します）。

- **MaterializedViewRewriteFail**: クエリへのマッチに失敗したマテリアライズドビューを表示します。これは元のSQLクエリが既存のマテリアライズドビューにマッチできず、そのためそれらを使用して最適化できなかったことを意味します。


### マテリアライズドビューの削除

```sql
drop materialized view store_amt on sales_records;
```
## 使用例

以下は、マテリアライズドビューの使用方法を示す追加の例です。

### 例1: 集計クエリの高速化

ビジネスシナリオ: 広告のUV（Unique Visitors）とPV（Page Views）の計算。

1. 生の広告クリックデータがDorisに保存されていると仮定し、`bitmap_union`を使用したマテリアライズドビューを作成することで、広告のPVとUVのクエリを高速化できます。まず、広告クリックの詳細を保存するテーブルを作成します：

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
2. ユーザーは広告のUV値を照会したいため、同一広告に対するユーザーの正確な重複排除が必要であり、典型的なクエリは以下のようになります：

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
3. このUV計算シナリオでは、`bitmap_union`を使用して事前正確重複排除を実現するマテリアライズドビューを作成できます。Dorisでは、`count(distinct)`集約の結果は`bitmap_union_count`集約の結果と同一です。そして`bitmap_union_count`は`bitmap_union`の結果をカウントすることと等価です。したがって、クエリが`count(distinct)`を含む場合、`bitmap_union`集約を使用したマテリアライズドビューを作成することでクエリを高速化できます。現在の使用シナリオに基づいて、広告とチャネルでグループ化し、`user_id`の正確な重複排除を行うマテリアライズドビューを作成できます。

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
4. マテリアライズドビューテーブルが作成されると、広告のUVをクエリする際に、Dorisは新しく作成されたマテリアライズドビュー`advertiser_uv`から自動的にデータを取得します。前のSQLが実行される場合：

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
5. マテリアライズドビューを選択した後、実際のクエリは次のように変換されます：

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
6. `explain`コマンドを使用して、クエリがマテリアライズドビューと一致するかどうかを確認します：

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
7. 出力は次のようになります：

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
8. explainコマンドの結果で、`internal.test_db.advertiser_view_record.advertiser_uv`が選択されたことが確認できます。これは、クエリがマテリアライズドビューから直接データをスキャンすることを示しています。これによりマッチが成功したことが確認されます。次に、`user_id`フィールドでのcount(distinct)操作が`bitmap_union_count(to_bitmap)`に書き換えられています。これは、Bitmapの使用により正確な重複排除効果が実現されることを意味します。

### 例2: 異なるプレフィックスインデックスのマッチング

ビジネスシナリオ: プレフィックスインデックスのマッチング。

1. テーブルにk1とk2のプレフィックスインデックスがあるものの、クエリで時々k3が使用される場合、k3を最初の列とするマテリアライズドビューを作成してインデックスを活用できます:

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
2. k3をプレフィックスインデックスとしてマテリアライズドビューを作成する：

   ```sql
   create materialized view mv_1 as SELECT k3 as k3_, k2 as k2_, k1 as k1_ FROM test_table;
   ```
3. `WHERE k3 = 3`を含むクエリは、`explain`で確認されるように、マテリアライズドビューにマッチします。

   ```sql
   explain select k1, k2, k3 from test_table where k3=3;
   ```
4. 出力は以下のようになります：

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
5. explain コマンドの結果で、`internal.test_db.test_table.mv_1` が選択されたことを確認でき、クエリがマテリアライズドビューにヒットしたことを示しています。


### 例 3: 事前フィルタリングと式計算によるクエリの高速化

ビジネスシナリオ: データの事前フィルタリングまたは式計算の高速化。

1. 事前フィルタリングと式計算用のテーブルとマテリアライズドビューを作成します:

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
2. いくつかのMaterialized Viewの作成:

   ```sql
   -- mv1 Perform expression calculations ahead of time
   create materialized view mv1 as 
   select 
       abs(k1)+k2+1,        
       sum(abs(k2+2)+k3+3) 
   from 
       d_table 
   group by 
       abs(k1)+k2+1;
   
   -- mv2 Use where expressions to filter in advance to reduce the amount of data in materialized views
   create materialized view mv2 as 
   select 
       year(k4),
       month(k4) 
   from 
       d_table 
   where 
       year(k4) = 2020;
   ```
3. いくつかのクエリでマテリアライズドビューが正常にヒットするかどうかをテストする:

   ```sql
   -- Hit mv1
   select 
       abs(k1)+k2+1,
       sum(abs(k2+2)+k3+3) 
   from 
       d_table 
   group by 
       abs(k1)+k2+1;
       
   -- Hit mv1
   select 
       bin(abs(k1)+k2+1),
       sum(abs(k2+2)+k3+3) 
   from 
       d_table 
   group by 
       bin(abs(k1)+k2+1);
   
   -- Hit mv2
   select 
       year(k4) + month(k4) 
   from 
       d_table 
   where 
       year(k4) = 2020;
   
   -- Hit table d_table but not hit mv2, because where condition does not match
   select 
       year(k4),
       month(k4) 
   from 
       d_table;
   
   ```
## FAQ


1. マテリアライズドビューを作成した後、リライトが成功しないのはなぜですか？

   マッチするデータが見つからない場合、マテリアライズドビューがまだビルド処理中である可能性があります。この場合、以下のコマンドを使用してマテリアライズドビューのビルド状態を確認できます：

   ```sql
   show alter table materialized view from test_db;
   ```
クエリ結果で `status` フィールドが `FINISHED` でないことが示されている場合は、マテリアライズドビューが利用可能になる前に、ステータスが `FINISHED` になるまで待つ必要があります。

2. 2.x から 3.0.0 にアップグレードする際に、以前の同期マテリアライズドビューがヒットしないのはなぜですか？

   バージョン 3.0.0 以降、同期マテリアライズドビューの透過的な書き換えは、デフォルトでプラン構造情報を使用します。2.x で以前動作していたマテリアライズドビューが 3.0.0 でヒットしていないことがわかった場合は、以下のスイッチを無効にできます（デフォルトで有効になっています）：

   ```sql
   `SET enable_sync_mv_cost_based_rewrite = true;`
