---
{
  "title": "Sync-Materialized View",
  "description": "Dorisにおける同期マテリアライズドビューは、定義されたSELECT文に基づいて事前計算されたデータセットを格納する特殊なタイプのtableです。",
  "language": "ja"
}
---
## Synchronous Materialized Viewとは

Synchronous Materialized Viewは、定義されたSELECT文に基づいて事前計算されたデータセットを格納するDorisの特殊なtableタイプです。Dorisはsynchronous materialized view内のデータを自動的に維持し、ベースtableでの新しいインポートや削除がリアルタイムでmaterialized viewに反映されることを保証し、追加の手動メンテナンスを必要とせずにデータの整合性を維持します。クエリ時に、Dorisは自動的に最適なmaterialized viewを選択し、そこから直接データを取得します。

## 適用シナリオ

- 時間のかかる集約操作の高速化

- プレフィックスインデックスマッチングが必要なクエリ

- 事前フィルタリングによるスキャンデータ量の削減

- 複雑な式の事前計算によるクエリの高速化

## 制限事項

- Synchronous materialized viewは、WHERE、GROUP BY、ORDER BY句を含む単一tableのSELECT文のみをサポートし、JOIN、HAVING、LIMIT句、LATERAL VIEWはサポートしません。

- Asynchronous materialized viewとは異なり、synchronous materialized viewは直接クエリできません。

- SELECT列には自動増分列、定数、重複する式、またはウィンドウ関数を含めることはできません。

- SELECT列に集約関数が含まれる場合、これらはルート式である必要があります（例：`sum(a + 1)`はサポートされますが、`sum(a) + 1`はサポートされません）。また、集約関数の後に非集約関数の式を続けることはできません（例：`SELECT x, sum(a)`は許可されますが、`SELECT sum(a), x`は許可されません）。

- DELETE文の条件列がmaterialized viewに存在する場合、DELETE操作を実行できません。データの削除が必要な場合は、まずmaterialized viewを削除する必要があります。

- 単一table上の過剰なmaterialized viewはインポート効率に影響を与える可能性があります。データのインポート時に、materialized viewとベースtableの両方が同期的に更新されます。table上の過剰なmaterialized viewは、複数のtableに同時にデータをインポートするのと同様に、インポートを遅くする可能性があります。

- Unique Keyデータモデル上のmaterialized viewは列の並び替えのみ可能で、集約はサポートしません。したがって、Unique Keyモデル上のmaterialized viewを通じて粗粒度の集約操作を実行することはできません。

## Materialized Viewの使用

Dorisは作成、表示、削除を含むmaterialized view用の包括的なDDL構文を提供します。以下は、materialized viewを使用して集約計算を高速化する方法を示す例です。ユーザーが取引ID、営業担当者、店舗、売上日、金額を格納する売上記録詳細tableを持っているとします。table作成とデータ挿入文は以下の通りです：

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
### Materialized Viewの作成

ユーザーが異なる店舗ごとの売上高を頻繁に分析する必要がある場合、`sales_records`Tableに対して、店舗IDでグループ化し各店舗の売上金額を合計するmaterialized viewを作成できます。作成文は以下の通りです：

```sql
create materialized view store_amt as   
select store_id, sum(sale_amt) from sales_records group by store_id;
```
### Materialized Viewが作成されているかの確認

materialized viewの作成は非同期操作であるため、ユーザーはタスクを送信した後に、materialized view作成タスクのステータスを非同期で確認する必要があります。コマンドは以下の通りです：

```sql
show alter table materialized view from test_db;
```
その出力では、そのデータベースに対するすべてのマテリアライズドビュー作成タスクが表示されます。サンプル出力は以下の通りです：

```sql
+--------+---------------+---------------------+---------------------+---------------+-----------------+----------+---------------+----------+------+----------+---------+  
| JobId  | TableName     | CreateTime          | FinishTime          | BaseIndexName | RollupIndexName | RollupId | TransactionId | State    | Msg  | Progress | Timeout |  
+--------+---------------+---------------------+---------------------+---------------+-----------------+----------+---------------+----------+------+----------+---------+  
| 494349 | sales_records | 2020-07-30 20:04:56 | 2020-07-30 20:04:57 | sales_records | store_amt       | 494350   | 133107        | FINISHED |      | NULL     | 2592000 |  
+--------+---------------+---------------------+---------------------+---------------+-----------------+----------+---------------+----------+------+----------+---------+
```
`State`列はステータスを示します。ステータスが`FINISHED`に変わると、マテリアライズドビューが正常に作成されます。

### マテリアライズドビュー作成のキャンセル

マテリアライズドビューを作成するバックグラウンド非同期タスクがまだ完了していない場合、以下のコマンドでキャンセルできます：

```sql
cancel alter table materialized view from test_db.sales_records;
```
マテリアライズドビューが既に作成されている場合、キャンセルすることはできませんが、DROPコマンドを使用して削除することができます。

### マテリアライズドビュー構造の表示

対象Tableに作成されたすべてのマテリアライズドビューの構造は、以下のコマンドを使用して表示できます：

```sql
desc sales_records all;
```
### Materialized Viewの作成文の表示

Materialized Viewの作成文は以下のコマンドで表示できます：

```sql
show create materialized view store_amt on sales_records;
```
### マテリアライズドビューのクエリ

マテリアライズドビューが作成されると、ユーザーが異なる店舗の売上高をクエリする際、Dorisは新しく作成されたマテリアライズドビュー`store_amt`から集約データを直接読み取り、これによってクエリ効率を向上させます。ユーザーはクエリで引き続き`sales_records`Tableを指定します。例えば：

```sql
SELECT store_id, SUM(sale_amt) FROM sales_records GROUP BY store_id;
```
上記のクエリは`store_amt`マテリアライズドビューに自動的にマッチします。ユーザーは以下のコマンドを使用して、現在のクエリが適切なマテリアライズドビューにマッチしているかどうかを確認できます。

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
|   PARTITION: HASH_PARTITIONED: mv_store_id[#7]                         |  
|                                                                        |  
|   HAS_COLO_PLAN_NODE: true                                             |  
|                                                                        |  
|   VRESULT SINK                                                         |  
|      MYSQL_PROTOCAL                                                    |  
|                                                                        |  
|   3:VAGGREGATE (merge finalize)(384)                                   |  
|   |  output: sum(partial_sum(mva_SUM__`sale_amt`)[#8])[#10]            |  
|   |  group by: mv_store_id[#7]                                         |  
|   |  sortByGroupKey: false                                             |  
|   |  cardinality = 1                                                   |  
|   |  final projections: mv_store_id[#9], sum(mva_SUM__`sale_amt`)[#10] |  
|   |  final project output tuple id: 4                                  |  
|   |  distribute expr lists: mv_store_id[#7]                            |  
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
|     HASH_PARTITIONED: mv_store_id[#7]                                  |  
|                                                                        |  
|   1:VAGGREGATE (update serialize)(374)                                 |  
|   |  STREAMING                                                         |  
|   |  output: partial_sum(mva_SUM__`sale_amt`[#1])[#8]                  |  
|   |  group by: mv_store_id[#0]                                         |  
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
上記の内容は、クエリが`store_amt`という名前のマテリアライズドビューに正常にマッチしたことを示しています。ターゲットTableにデータがない場合、マテリアライズドビューがヒットしない可能性があることに注意してください。

MATERIALIZATIONSの詳細な説明：

- **MaterializedViewRewriteSuccessAndChose**: クエリ最適化のために正常に選択され使用されたマテリアライズドビューを表示します。

- **MaterializedViewRewriteSuccessButNotChose**: クエリにマッチしたが選択されなかったマテリアライズドビューを表示します（オプティマイザはコストに基づいて最適なマテリアライズドビューを選択するため、これらのマッチしたが選択されなかったビューは最適な選択ではなかったことを示します）。

- **MaterializedViewRewriteFail**: クエリへのマッチに失敗したマテリアライズドビューを表示します。つまり、元のSQLクエリが既存のマテリアライズドビューとマッチできず、そのためそれらを使用して最適化できなかったことを意味します。


### マテリアライズドビューの削除

```sql
drop materialized view store_amt on sales_records;
```
## 使用例

以下は、マテリアライズドビューの使用を実演する追加の例です。

### 例1: 集約クエリの高速化

ビジネスシナリオ: 広告のUV（Unique Visitors）とPV（Page Views）の計算。

1. 生の広告クリックデータがDorisに格納されていると仮定して、`bitmap_union`を使用したマテリアライズドビューを作成することで、広告のPVとUVのクエリを高速化できます。まず、広告クリック詳細を格納するTableを作成します：

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
2. ユーザーが広告のUV値を照会したいため、同じ広告に対してユーザーの正確な重複排除が必要になります。典型的なクエリは次のようになります：

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
3. このUV計算シナリオでは、`bitmap_union`を使用したマテリアライズドビューを作成して事前完全重複除去を実現できます。Dorisでは、`count(distinct)`集約の結果は`bitmap_union_count`集約の結果と同一です。そして`bitmap_union_count`は`bitmap_union`の結果をカウントすることと同等です。したがって、クエリが`count(distinct)`を含む場合、`bitmap_union`集約を使用したマテリアライズドビューを作成することでクエリを高速化できます。現在の使用シナリオに基づいて、広告とチャネルでグループ化し、`user_id`の完全重複除去を行うマテリアライズドビューを作成できます。

    ```sql
    create materialized view advertiser_uv as 
    select 
        advertiser, 
        channel, 
        bitmap_union(to_bitmap(user_id)) 
    from 
        advertiser_view_record 
    group by 
        advertiser, channel;
    ```
4. マテリアライズドビューTableが作成されると、広告のUVをクエリする際に、Dorisは新しく作成されたマテリアライズドビュー`advertiser_uv`から自動的にデータを取得します。以前のSQLが実行された場合：

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
5. materialized viewを選択した後、実際のクエリは以下のように変換されます：

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
6. `explain` コマンドを使用して、クエリがマテリアライズドビューと一致するかどうかを確認します：

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
    |   PARTITION: HASH_PARTITIONED: mv_advertiser[#7], mv_channel[#8]                                                                                        |
    |                                                                                                                                                         |
    |   HAS_COLO_PLAN_NODE: true                                                                                                                              |
    |                                                                                                                                                         |
    |   VRESULT SINK                                                                                                                                          |
    |      MYSQL_PROTOCAL                                                                                                                                     |
    |                                                                                                                                                         |
    |   3:VAGGREGATE (merge finalize)(440)                                                                                                                    |
    |   |  output: bitmap_union_count(partial_bitmap_union_count(mva_BITMAP_UNION__to_bitmap_with_check(CAST(`user_id` AS bigint)))[#9])[#12]                 |
    |   |  group by: mv_advertiser[#7], mv_channel[#8]                                                                                                        |
    |   |  sortByGroupKey:false                                                                                                                               |
    |   |  cardinality=1                                                                                                                                      |
    |   |  final projections: mv_advertiser[#10], mv_channel[#11], bitmap_union_count(mva_BITMAP_UNION__to_bitmap_with_check(CAST(`user_id` AS bigint)))[#12] |
    |   |  final project output tuple id: 4                                                                                                                   |
    |   |  distribute expr lists: mv_advertiser[#7], mv_channel[#8]                                                                                           |
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
    |     HASH_PARTITIONED: mv_advertiser[#7], mv_channel[#8]                                                                                                 |
    |                                                                                                                                                         |
    |   1:VAGGREGATE (update serialize)(430)                                                                                                                  |
    |   |  STREAMING                                                                                                                                          |
    |   |  output: partial_bitmap_union_count(mva_BITMAP_UNION__to_bitmap_with_check(CAST(`user_id` AS bigint))[#2])[#9]                                      |
    |   |  group by: mv_advertiser[#0], mv_channel[#1]                                                                                                        |
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
8. explainコマンドの結果で、`internal.test_db.advertiser_view_record.advertiser_uv`が選択されたことがわかります。これは、クエリがマテリアライズドビューから直接データをスキャンすることを示しています。これにより、マッチングが成功したことが確認されます。次に、`user_id`フィールドでのcount(distinct)操作が`bitmap_union_count(to_bitmap)`として書き換えられます。これは、Bitmapの使用により正確な重複排除効果が実現されることを意味します。

### Example 2: 異なるプレフィックスインデックスのマッチング

ビジネスシナリオ: プレフィックスインデックスのマッチング。

1. Tableがk1とk2にプレフィックスインデックスを持っているが、クエリが時々k3を含む場合、k3を最初の列とするマテリアライズドビューを作成してインデックスを活用できます:

   ```sql
   create table test_table  
   (  
       k1 int,   
       k2 int,   
       k3 int,   
       kx date  
   )   
   distributed by hash(k1)   
   properties("replication_num" = "1");  
     
   insert into test_table values(1,1,1,1),(3,3,3,3);
   ```
2. k3をプレフィックスインデックスとしてマテリアライズドビューを作成する：

   ```sql
   create materialized view mv_1 as SELECT k3, k2, k1 FROM test_table;
   ```
3. `WHERE k3 = 3`を含むクエリは、`explain`によって確認されるように、マテリアライズドビューにマッチします。

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
   |   PARTITION: HASH_PARTITIONED: mv_k1[#2]                 |
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
   |      final projections: mv_k1[#2], mv_k2[#1], mv_k3[#0]  |
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
5. explainコマンドの結果で、`internal.test_db.test_table.mv_1`が選択されていることが確認でき、クエリがマテリアライズドビューにヒットしたことを示しています。


### 例3: プリフィルタリングと式計算によるクエリの高速化

ビジネスシナリオ: データのプリフィルタリングまたは式計算の高速化。

1. プリフィルタリングと式計算用のTableとマテリアライズドビューを作成します:

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
3. いくつかのクエリでマテリアライズドビューが正常にヒットするかどうかをテストする：

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

1. materialized viewを作成した後、rewriteが成功しないのはなぜですか？

   一致するデータが見つからない場合、materialized viewがまだ構築プロセス中である可能性があります。この場合、以下のコマンドを使用してmaterialized viewの構築状況を確認できます：

   ```sql
   show alter table materialized view from test_db;
   ```
クエリ結果で`status`フィールドが`FINISHED`でない場合は、マテリアライズドビューが利用可能になる前にステータスが`FINISHED`になるまで待つ必要があります。

2. 2.xから3.0.0にアップグレードする際、以前の同期マテリアライズドビューがヒットしないのはなぜですか？

   バージョン3.0.0以降、同期マテリアライズドビューの透過的な書き換えはデフォルトでプラン構造情報を使用します。2.xで以前動作していたマテリアライズドビューが3.0.0でヒットしない場合は、以下のスイッチを無効にできます（デフォルトで有効になっています）：

   ```sql
   `SET enable_sync_mv_cost_based_rewrite = true;`
