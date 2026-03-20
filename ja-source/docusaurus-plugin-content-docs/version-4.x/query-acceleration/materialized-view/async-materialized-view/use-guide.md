---
{
  "title": "ベストプラクティス | Async Materialized View",
  "sidebar_label": "ベストプラクティス",
  "description": "以下の条件が満たされる場合、パーティション化されたマテリアライズドビューを作成することが推奨されます：",
  "language": "ja"
}
---
# ベストプラクティス

## 非同期マテリアライズドビューの使用原則
- **適時性の考慮：** 非同期マテリアライズドビューは通常、データの適時性がそれほど重要でないシナリオで使用され、一般的にT+1データです。高い適時性が必要な場合は、同期マテリアライズドビューの使用を検討してください。

- **高速化効果と一貫性の考慮：** クエリ高速化のシナリオでは、マテリアライズドビューを作成する際、DBAは共通のクエリSQLパターンをグループ化し、グループ間の重複を最小限に抑えることを目指すべきです。SQLパターンのグループ化が明確であるほど、マテリアライズドビュー構築の品質が高くなります。1つのクエリは複数のマテリアライズドビューを使用する可能性があり、1つのマテリアライズドビューは複数のクエリによって使用される可能性があります。マテリアライズドビューの構築では、レスポンス時間（高速化効果）、構築コスト、データ一貫性要件を総合的に考慮する必要があります。

- **マテリアライズドビューの定義と構築コストの考慮：**
    
    - マテリアライズドビューの定義が元のクエリに近いほど、クエリ高速化効果は向上しますが、マテリアライゼーションの汎用性と再利用性は低下し、構築コストが高くなります。
    
    - マテリアライズドビューの定義がより汎用的である場合（例：WHERE条件なし、より多くの集約次元）、クエリ高速化効果は低下しますが、マテリアライゼーションの汎用性と再利用性が向上し、構築コストが低下します。

:::caution 注意
- **マテリアライズドビュー数の制御：** マテリアライズドビューは多いほど良いというわけではありません。マテリアライズドビューの構築と更新にはリソースが必要です。マテリアライズドビューは透過的リライトに参加し、CBOコストモデルが最適なマテリアライズドビューを選択するのに時間が必要です。理論的には、マテリアライズドビューが多いほど、透過的リライトの時間が長くなります。

- **マテリアライズドビューの使用状況を定期的に確認：** 使用されていない場合は、速やかに削除する必要があります。

- **ベースtableのデータ更新頻度：** マテリアライズドビューのベースtableデータが頻繁に更新される場合、マテリアライズドビューの使用は適さない可能性があります。これにより、マテリアライズドビューが頻繁に無効になり、透過的リライト（直接クエリ）に使用できなくなるためです。このようなマテリアライズドビューを透過的リライトに使用する必要がある場合、クエリされるデータに一定の適時性の遅延を許可し、`grace_period`を設定することができます。`grace_period`の適用に関する詳細な説明を参照してください。
:::

## マテリアライズドビューの更新方法選択原則

以下の条件が満たされる場合、パーティション化マテリアライズドビューの作成を推奨します：

- マテリアライズドビューのベースtableのデータ量が大きく、ベースtableがパーティションtableである。

- マテリアライズドビューが使用するtableのうち、パーティションtable以外は頻繁に変更されない。

- マテリアライズドビューの定義SQLとパーティションフィールドがパーティション派生の要件を満たしている、つまりパーティション増分更新の要件を満たしている。詳細な要件は[CREATE-ASYNC-MATERIALIZED-VIEW](../../../sql-manual/sql-statements/table-and-view/async-materialized-view/CREATE-ASYNC-MATERIALIZED-VIEW#optional-parameters)で確認できます。

- マテリアライズドビューのパーティション数が多くない。パーティションが多すぎると、パーティションマテリアライズドビューの構築時間が過度に長くなります。

マテリアライズドビューの一部のパーティションが無効になった場合、透過的リライトはマテリアライズドビューの有効なパーティションとベースtableのUNION ALLを使用してデータを返すことができます。

パーティション化マテリアライズドビューが構築できない場合は、完全更新マテリアライズドビューの選択を検討できます。

## パーティション化マテリアライズドビューの一般的な使用法

マテリアライズドビューのベースtableのデータ量が大きく、ベースtableがパーティションtableである場合、マテリアライズドビューの定義SQLとパーティションフィールドがパーティション派生の要件を満たしていれば、このシナリオはパーティション化マテリアライズドビューの構築に適しています。パーティション派生の詳細な要件については、[CREATE-ASYNC-MATERIALIZED-VIEW](../../../sql-manual/sql-statements/table-and-view/async-materialized-view/CREATE-ASYNC-MATERIALIZED-VIEW#optional-parameters)と[Async Materialized View FAQ Building Question 12](../../../query-acceleration/materialized-view/async-materialized-view/faq#q12-error-when-building-partitioned-materialized-view)を参照してください。

マテリアライズドビューのパーティションは、ベースtableのパーティションマッピングに従って作成され、一般的にベースtableのパーティションと1:1または1:nの関係を持ちます。

- ベースtableのパーティションでパーティションの追加や削除などのデータ変更が発生した場合、マテリアライズドビューの対応するパーティションも無効になります。無効なパーティションは透過的リライトには使用できませんが、直接クエリは可能です。透過的リライトがマテリアライズドビューのパーティションデータが無効であることを検出すると、無効なパーティションはベースtableとの結合によって処理され、クエリに応答します。

  マテリアライズドビューのパーティション状態を確認するコマンドについては、マテリアライズドビューの状態表示を参照してください。主に`show partitions from mv_name`コマンドを使用します。

- マテリアライズドビューが参照する非パーティションtableでデータ変更が発生した場合、マテリアライズドビューのすべてのパーティションが無効になり、マテリアライズドビューを透過的リライトに使用できなくなります。`REFRESH MATERIALIZED VIEW mv1 AUTO;`コマンドを使用して、マテリアライズドビューのすべてのパーティションデータを更新する必要があります。このコマンドは、データが変更されたマテリアライズドビューのすべてのパーティションの更新を試行します。

  したがって、一般的にはパーティション化マテリアライズドビューが参照するパーティションtableに頻繁に変更されるデータを配置し、非参照パーティションtableの位置に変更頻度の低いディメンションtableを配置することを推奨します。

- マテリアライズドビューが参照する非パーティションtableでデータ変更が発生し、非パーティションtableのデータが変更なしの追加のみの場合、マテリアライズドビュー作成時に属性`excluded_trigger_tables = 'non_partition_table_name1,non_partition_table_name2'`を指定できます。これにより、非パーティションtableでのデータ変更がマテリアライズドビューのすべてのパーティションを無効にすることがなくなり、次回の更新ではパーティションtableに対応するマテリアライズドビューの無効なパーティションのみが更新されます。

パーティション化マテリアライズドビューの透過的リライトはパーティション粒度で行われます。マテリアライズドビューの一部のパーティションが無効になっても、マテリアライズドビューは透過的リライトに使用できます。ただし、1つのパーティションのみがクエリされ、そのパーティションのマテリアライズドビューのデータが無効な場合、マテリアライズドビューは透過的リライトに使用できません。

例：

```sql
CREATE TABLE IF NOT EXISTS lineitem (
    l_orderkey INTEGER NOT NULL, 
    l_partkey INTEGER NOT NULL, 
    l_suppkey INTEGER NOT NULL, 
    l_linenumber INTEGER NOT NULL, 
    l_ordertime DATETIME NOT NULL, 
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
  ) PARTITION BY RANGE(l_ordertime) (
    FROM 
      ('2024-05-01') TO ('2024-06-30') INTERVAL 1 DAY
  )
DISTRIBUTED BY HASH(l_orderkey) BUCKETS 3;

INSERT INTO lineitem VALUES      
(1, 2, 3, 4, '2024-05-01 01:45:05', 5.5, 6.5, 0.1, 8.5, 'o', 'k', '2024-05-01', '2024-05-01', '2024-05-01', 'a', 'b', 'yyyyyyyyy'),    
(1, 2, 3, 4, '2024-05-15 02:35:05', 5.5, 6.5, 0.15, 8.5, 'o', 'k', '2024-05-15', '2024-05-15', '2024-05-15', 'a', 'b', 'yyyyyyyyy'),     
(2, 2, 3, 5, '2024-05-25 08:30:06', 5.5, 6.5, 0.2, 8.5, 'o', 'k', '2024-05-25', '2024-05-25', '2024-05-25', 'a', 'b', 'yyyyyyyyy'),     
(3, 4, 3, 6, '2024-06-02 09:25:07', 5.5, 6.5, 0.3, 8.5, 'o', 'k', '2024-06-02', '2024-06-02', '2024-06-02', 'a', 'b', 'yyyyyyyyy'),     
(4, 4, 3, 7, '2024-06-15 13:20:09', 5.5, 6.5, 0, 8.5, 'o', 'k', '2024-06-15', '2024-06-15', '2024-06-15', 'a', 'b', 'yyyyyyyyy'),     
(5, 5, 6, 8, '2024-06-25 15:15:36', 5.5, 6.5, 0.12, 8.5, 'o', 'k', '2024-06-25', '2024-06-25', '2024-06-25', 'a', 'b', 'yyyyyyyyy'),     
(5, 5, 6, 9, '2024-06-29 21:10:52', 5.5, 6.5, 0.1, 8.5, 'o', 'k', '2024-06-30', '2024-06-30', '2024-06-30', 'a', 'b', 'yyyyyyyyy'),     
(5, 6, 5, 10, '2024-06-03 22:05:50', 7.5, 8.5, 0.1, 10.5, 'k', 'o', '2024-06-03', '2024-06-03', '2024-06-03', 'c', 'd', 'xxxxxxxxx');     
  
CREATE TABLE IF NOT EXISTS partsupp (
    ps_partkey INTEGER NOT NULL, 
    ps_suppkey INTEGER NOT NULL, 
    ps_availqty INTEGER NOT NULL, 
    ps_supplycost DECIMALV3(15, 2) NOT NULL, 
    ps_comment VARCHAR(199) NOT NULL
  )
DUPLICATE KEY(ps_partkey, ps_suppkey)
DISTRIBUTED BY HASH(ps_partkey) BUCKETS 3;


INSERT INTO partsupp VALUES     
(2, 3, 9, 10.01, 'supply1'),     
(4, 3, 9, 10.01, 'supply2'),     
(5, 6, 9, 10.01, 'supply3'),     
(6, 5, 10, 11.01, 'supply4');
```
この例では、ordersTableのo_ordertimeフィールドがパーティションフィールドで、型はDATETIMEであり、日単位でパーティション化されています。
メインクエリは「日」の粒度に基づいています：

```sql
SELECT 
  l_linestatus, 
  sum(
    l_extendedprice * (1 - l_discount)
  ) AS revenue, 
  ps_partkey 
FROM 
  lineitem 
  LEFT JOIN partsupp ON l_partkey = ps_partkey 
  and l_suppkey = ps_suppkey 
WHERE 
  date_trunc(l_ordertime, 'day') <= DATE '2024-05-25' 
  AND date_trunc(l_ordertime, 'day') >= DATE '2024-05-05' 
GROUP BY 
  l_linestatus, 
  ps_partkey;
```
マテリアライズドビューで毎回多数のパーティションをリフレッシュすることを避けるため、パーティション粒度はベースTableのordersと一致させ、同様に"day"でパーティショニングすることができます。

マテリアライズドビューの定義SQLは"day"粒度を使用し、"day"でデータを集計できます：

```sql
CREATE MATERIALIZED VIEW rollup_partition_mv 
BUILD IMMEDIATE REFRESH AUTO ON MANUAL 
partition by(order_date) 
DISTRIBUTED BY RANDOM BUCKETS 2 
AS 
SELECT 
  l_linestatus, 
  sum(
    l_extendedprice * (1 - l_discount)
  ) AS revenue, 
  ps_partkey, 
  date_trunc(l_ordertime, 'day') as order_date 
FROM 
  lineitem 
  LEFT JOIN partsupp ON l_partkey = ps_partkey 
  and l_suppkey = ps_suppkey 
GROUP BY 
  l_linestatus, 
  ps_partkey, 
  date_trunc(l_ordertime, 'day');
```
## 最新のパーティションデータのみを保持するPartitioned Materialized Views
:::tip Note
この機能はApache Dorisバージョン2.1.1以降でサポートされています。
:::

Materialized viewsは最新のパーティションからのデータのみを保持するように設定でき、各リフレッシュ時に期限切れのパーティションデータを自動的に削除します。
これは、materialized viewに以下のプロパティを設定することで実現できます：
partition_sync_limit、partition_sync_time_unit、およびpartition_sync_date_format。

`partition_sync_limit`：ベースTableのパーティションフィールドが時間ベースの場合、このプロパティはベースTableパーティションの同期範囲を設定し、partition_sync_time_unitと連携して動作します。例えば、これを3に設定し、partition_sync_time_unitをDAYにした場合、ベースTableの過去3日間のパーティションとデータのみが同期されます。

`partition_sync_time_unit`：パーティションリフレッシュの時間単位で、DAY/MONTH/YEARをサポートします（デフォルトはDAY）。

`partition_date_format`：ベースTableのパーティションフィールドが文字列型の場合、partition_sync_limit機能を使用したい時にこのプロパティで日付フォーマットを設定します。

例：
以下で定義されたmaterialized viewは過去3日間のデータのみを保持します。最近3日間にデータが存在しない場合、このmaterialized viewを直接クエリしても結果は返されません。

```sql
CREATE MATERIALIZED VIEW latest_partition_mv
BUILD IMMEDIATE REFRESH AUTO ON MANUAL
PARTITION BY(order_date)
DISTRIBUTED BY RANDOM BUCKETS 2
PROPERTIES (
"partition_sync_limit" = "3",
"partition_sync_time_unit" = "DAY",
"partition_date_format" = "yyyy-MM-dd"
)       
AS
SELECT
l_linestatus,
sum(
l_extendedprice * (1 - l_discount)
) AS revenue,
ps_partkey,
date_trunc(l_ordertime, 'day') as order_date
FROM
lineitem
LEFT JOIN partsupp ON l_partkey = ps_partkey
AND l_suppkey = ps_suppkey
GROUP BY
l_linestatus,
ps_partkey,
date_trunc(l_ordertime, 'day');
```
## Materialized Viewを使用してクエリを高速化する方法

クエリ高速化のためにmaterialized viewを使用するには、まずプロファイルファイルをチェックして、クエリで最も時間を消費する操作を見つけます。これは通常、Join、Aggregate、Filter、またはCalculated Expressionsに表れます。

Join、Aggregate、Filters、およびCalculated Expressionsについては、materialized viewを構築することでクエリを高速化できます。クエリ内のJoin操作が大量のコンピューティングリソースを消費する一方で、Aggregateが比較的少ないリソースを消費する場合、Join操作をターゲットとするmaterialized viewを構築することができます。

次に、これら4つの操作に対するmaterialized viewの構築方法を詳しく説明します：

1. **Joinの場合**

    クエリで使用される共通のTable結合パターンを抽出して、materialized viewを構築できます。透過的な書き換えがこのmaterialized viewを使用する場合、Join計算を節約できます。クエリからFiltersを削除して、より汎用的なJoin materialized viewを作成してください。

2. **Aggregateの場合**
        
    materialized viewを構築する際は、低カーディナリティフィールドをディメンションとして使用することを推奨します。ディメンションが関連している場合、集約後の数を可能な限り削減できます。
    
    例えば、Tablet1において、元のTableに1,000,000レコードがあり、SQLクエリが`group by a, b, c`を持つ場合。a、b、cのカーディナリティがそれぞれ100、50、15の場合、集約されたデータは約75,000になり、このmaterialized viewが効果的であることを示します。a、b、cが相関している場合、集約データの量はさらに削減されます。
    
    a、b、cが高いカーディナリティを持つ場合、集約データが急速に拡大します。集約データが元のTableデータより多い場合、このシナリオはmaterialized viewの構築に適していない可能性があります。例えば、cのカーディナリティが3,500の場合、集約データは約17,000,000になり、元のTableデータよりもはるかに大きくなるため、このようなmaterialized viewを構築する性能向上の利益は低くなります。
    
    materialized viewの集約粒度はクエリよりも細かくする必要があります。つまり、materialized viewの集約ディメンションは、クエリに必要なデータを提供するために、クエリの集約ディメンションを含む必要があります。クエリはGroup Byを記述しない場合があり、同様に、materialized viewの集約関数はクエリの集約関数を含む必要があります。
    
    集約クエリ高速化の例：
    
    Query 1:

    ```sql
    SELECT 
      l_linestatus, 
      sum(
        l_extendedprice * (1 - l_discount)
      ) AS revenue, 
      o_shippriority 
    FROM 
      orders 
      LEFT JOIN lineitem ON l_orderkey = o_orderkey 
    WHERE 
      o_orderdate <= DATE '2024-06-30' 
      AND o_orderdate >= DATE '2024-05-01' 
    GROUP BY 
      l_linestatus, 
      o_shippriority,
      l_partkey;
    ```
Query 2:

    ```sql
    SELECT 
      l_linestatus, 
      sum(
        l_extendedprice * (1 - l_discount)
      ) AS revenue, 
      o_shippriority 
    FROM 
      orders 
      LEFT JOIN lineitem ON l_orderkey = o_orderkey 
    WHERE 
      o_orderdate <= DATE '2024-06-30' 
      AND o_orderdate >= DATE '2024-05-01' 
    GROUP BY 
      l_linestatus, 
      o_shippriority,
      l_suppkey;
    ```
上記の2つのSQLクエリに基づいて、Aggregateを含むより汎用的なマテリアライズドビューを構築できます。このマテリアライズドビューでは、集約のためのgroup by次元としてl_partkeyとl_suppkeyの両方を含め、フィルタ条件としてo_orderdateを使用します。o_orderdateはマテリアライズドビューの条件補償で使用されるだけでなく、マテリアライズドビューの集約group by次元にも含める必要があることに注意してください。

このようにマテリアライズドビューを構築すると、Query 1とQuery 2の両方がこのマテリアライズドビューにヒットできます。マテリアライズドビューの定義は以下の通りです：

    ```sql
    CREATE MATERIALIZED VIEW common_agg_mv
    BUILD IMMEDIATE REFRESH AUTO ON MANUAL
    DISTRIBUTED BY RANDOM BUCKETS 2
    AS 
    SELECT 
      l_linestatus, 
      sum(
        l_extendedprice * (1 - l_discount)
      ) AS revenue, 
      o_shippriority,
      l_suppkey,
      l_partkey,
      o_orderdate
    FROM 
      orders 
      LEFT JOIN lineitem ON l_orderkey = o_orderkey 
    GROUP BY 
      l_linestatus, 
      o_shippriority,
      l_suppkey,
      l_partkey,
      o_orderdate;
    ```
3. **Filterについて**
    
    同じフィールドに対するフィルターがクエリに頻繁に出現する場合、マテリアライズドビューに対応するFilterを追加することで、マテリアライズドビュー内のデータ量を削減でき、クエリがマテリアライズドビューにヒットした際のパフォーマンスを向上させることができます。
    
    マテリアライズドビューは、クエリに出現するFilterよりも少ないFilterを持つ必要があり、クエリのFilterはマテリアライズドビューのFilterを含む必要があることに注意してください。例えば、クエリが`a > 10 and b > 5`の場合、マテリアライズドビューはFilterを持たないか、Filterを持つ場合はクエリよりも大きなデータ範囲でaとbをフィルタリングする必要があります。例：`a > 5 and b > 5`、`b > 0`、または単に`a > 5`など。
    
    **4. 計算式について**
    
    case whenや文字列処理関数などを例に取ると、これらの式計算は非常にパフォーマンス負荷が高いものです。これらをマテリアライズドビューで事前計算できる場合、透過的な書き換えを通じて事前計算されたマテリアライズドビューを使用することで、クエリパフォーマンスを向上させることができます。
    
    マテリアライズドビューの列数はあまり多くしないことを推奨します。クエリが複数のフィールドを使用する場合、初期のSQLパターングループ化に基づいて異なる列に対して対応するマテリアライズドビューを構築し、単一のマテリアライズドビューで列数が多くなりすぎることを避けるべきです。

## 使用シナリオ

### シナリオ1：クエリアクセラレーション

BIレポートシナリオやその他のアクセラレーションシナリオでは、ユーザーはクエリの応答時間に敏感で、通常は秒単位での結果返却が求められます。クエリは通常、複数Tableのjoinの後に集計計算を含み、これらは大量の計算リソースを消費し、時にはタイムリー性を保証することが困難になります。非同期マテリアライズドビューはこれをうまく処理でき、直接クエリと透過的な書き換えの両方をサポートし、オプティマイザーが書き換えアルゴリズムとコストモデルに基づいて最適なマテリアライズドビューを自動選択してリクエストに応答します。

#### 使用例1：複数Tablejoin集計クエリのアクセラレーション
より汎用的なマテリアライズドビューを構築することで、複数Tablejoin集計クエリをアクセラレーションできます。

以下の3つのクエリSQLを例に取ります：

Query 1:

```sql
SELECT 
  l_linestatus, 
  l_extendedprice * (1 - l_discount)
  o_shippriority 
FROM 
  orders 
  LEFT JOIN lineitem ON l_orderkey = o_orderkey 
WHERE 
  o_orderdate <= DATE '2024-06-30' 
  AND o_orderdate >= DATE '2024-05-01';
```
Query 2:

```sql
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
Query 3:

```sql
SELECT 
  l_linestatus, 
  l_extendedprice * (1 - l_discount),
  o_orderdate, 
  o_shippriority 
FROM 
  orders 
  LEFT JOIN lineitem ON l_orderkey = o_orderkey;
```
上記のクエリに対して、すべてのクエリを満たすために以下のmaterialized viewを構築できます。

materialized viewの定義では、より一般的なJoinを取得するためにQuery 1とQuery 2からフィルタ条件を削除し、式`l_extendedprice * (1 - l_discount)`を事前計算します。これにより、クエリがmaterialized viewにヒットする際に、式計算を省略できます：

```sql
CREATE MATERIALIZED VIEW common_join_mv
BUILD IMMEDIATE REFRESH AUTO ON MANUAL
DISTRIBUTED BY RANDOM BUCKETS 2
AS 
SELECT 
  l_linestatus, 
  l_extendedprice * (1 - l_discount),
  o_orderdate, 
  o_shippriority 
FROM 
  orders 
  LEFT JOIN lineitem ON l_orderkey = o_orderkey;
```
上記のマテリアライズドビューがQuery 2の高速化パフォーマンス要件を満たすことができない場合、集約マテリアライズドビューを構築することができます。汎用性を維持するため、`o_orderdate`フィールドのフィルター条件を削除することができます：

```sql
CREATE MATERIALIZED VIEW target_agg_mv
BUILD IMMEDIATE REFRESH AUTO ON MANUAL
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
GROUP BY 
  l_linestatus, 
  o_orderdate, 
  o_shippriority;
```
#### ユースケース2: ログクエリ高速化

ログクエリ高速化のシナリオでは、非同期materialized viewsのみの使用に制限せず、同期materialized viewsと組み合わせることが推奨されます。

一般的に、ベースTableはパーティションTableであり、主に時間単位でパーティション分割され、単一Tableの集約クエリが行われ、フィルタ条件は通常時間といくつかのフラグビットに基づきます。クエリ応答速度が要件を満たせない場合、通常は同期materialized viewsを構築して高速化できます。

例えば、ベースTableの定義は以下のようになります：

```sql
CREATE TABLE IF NOT EXISTS test (
`app_name` VARCHAR(64) NULL COMMENT 'identifier', 
`event_id` VARCHAR(128) NULL COMMENT 'identifier', 
`decision` VARCHAR(32) NULL COMMENT 'enum value', 
`time` DATETIME NULL COMMENT 'query time', 
`id` VARCHAR(35) NOT NULL COMMENT 'od', 
`code` VARCHAR(64) NULL COMMENT 'identifier', 
`event_type` VARCHAR(32) NULL COMMENT 'event type' 
)
DUPLICATE KEY(app_name, event_id)
PARTITION BY RANGE(time)                                    
(                                                                                                                                      
    FROM ("2024-07-01 00:00:00") TO ("2024-07-15 00:00:00") INTERVAL 1 HOUR                                                                     
)     
DISTRIBUTED BY HASH(event_id)
BUCKETS 3;
```
マテリアライズドビューは分単位でデータを集約することができ、これにより一定の集約効果を実現することも可能です。例えば：

```sql
CREATE MATERIALIZED VIEW sync_mv
    AS
    SELECT 
      decision,
      code, 
      app_name, 
      event_id, 
      event_type, 
      date_trunc(time, 'minute'), 
      DATE_FORMAT(
        `time`, '%Y-%m-%d'
      ), 
      cast(FLOOR(MINUTE(time) / 15) as decimal(9, 0)),
      count(id) as cnt
    from 
      test 
    group by 
      code, 
      app_name, 
      event_id, 
      event_type, 
      date_trunc(time, 'minute'), 
      decision, 
      DATE_FORMAT(time, '%Y-%m-%d'), 
      cast(FLOOR(MINUTE(`time`) / 15) as decimal(9, 0));
```
クエリステートメントは以下のようになる場合があります：

```sql
SELECT 
    decision, 
    CONCAT(
        CONCAT(
          DATE_FORMAT(
            `time`, '%Y-%m-%d'
          ), 
          '', 
          LPAD(
            cast(FLOOR(MINUTE(`time`) / 15) as decimal(9, 0)) * 15, 
            5, 
            '00'
          ), 
          ':00'
        )
      ) as time, 
      count(id) as cnt 
    from 
      test 
    where 
    date_trunc(time, 'minute') BETWEEN '2024-07-02 18:00:00' 
      AND '2024-07-03 20:00:00' 
    group by 
      decision, 
      DATE_FORMAT(
        `time`, "%Y-%m-%d"
      ), 
      cast(FLOOR(MINUTE(`time`) / 15) as decimal(9, 0));
```
### シナリオ2: データモデリング (ETL)

データ分析作業では、複数のTableの結合と集約が必要になることが多く、このプロセスは通常、複雑で頻繁に繰り返されるクエリを伴います。これらの種類のクエリは、クエリのレイテンシが高くなったり、リソース消費が高くなったりする問題を引き起こす可能性があります。しかし、非同期のマテリアライズドビューを使用して階層化されたデータモデルを構築すると、これらの問題を適切に回避できます。既存のマテリアライズドビューに基づいて、より高レベルのマテリアライズドビューを作成することができ（バージョン2.1.3以降でサポート）、異なる要件に柔軟に対応できます。

異なるレベルのマテリアライズドビューには、それぞれ独自のトリガー方法を設定できます。例えば：

- 第1層のマテリアライズドビューを定期的にリフレッシュするように設定し、第2層をトリガーリフレッシュに設定します。この方法により、第1層のマテリアライズドビューがリフレッシュを完了すると、自動的に第2層のマテリアライズドビューのリフレッシュがトリガーされます。
- 各層のマテリアライズドビューを定期的にリフレッシュするように設定した場合、第2層のマテリアライズドビューがリフレッシュする際、第1層のマテリアライズドビューデータがベースTableと同期されているかどうかは考慮せず、単に第1層のマテリアライズドビューデータを処理して第2層に同期します。

次に、TPC-Hデータセットを使用して、データモデリングにおける非同期マテリアライズドビューの応用を説明します。地域と国別の月次注文数量と利益の分析を例として取り上げます：

元のクエリ（マテリアライズドビューを使用しない場合）：

```sql
SELECT
n_name,
date_trunc(o.o_orderdate, 'month') as month,
count(distinct o.o_orderkey) as order_count,
sum(l.l_extendedprice * (1 - l.l_discount)) as revenue
FROM orders o
JOIN lineitem l ON o.o_orderkey = l.l_orderkey
JOIN customer c ON o.o_custkey = c.c_custkey
JOIN nation n ON c.c_nationkey = n.n_nationkey
JOIN region r ON n.n_regionkey = r.r_regionkey
GROUP BY n_name, month;
```
階層化モデリングにおける非同期マテリアライズドビューの使用:

DWD層（詳細データ）の構築、注文詳細ワイドTableの処理

```sql
CREATE MATERIALIZED VIEW dwd_order_detail
BUILD IMMEDIATE REFRESH AUTO ON COMMIT
DISTRIBUTED BY RANDOM BUCKETS 16
AS
select
o.o_orderkey,
o.o_custkey,
o.o_orderstatus,
o.o_totalprice,
o.o_orderdate,
c.c_name,
c.c_nationkey,
n.n_name as nation_name,
r.r_name as region_name,
l.l_partkey,
l.l_quantity,
l.l_extendedprice,
l.l_discount,
l.l_tax
from orders o
join customer c on o.o_custkey = c.c_custkey
join nation n on c.c_nationkey = n.n_nationkey
join region r on n.n_regionkey = r.r_regionkey
join lineitem l on o.o_orderkey = l.l_orderkey;
```
DWSレイヤー（サマリデータ）を構築し、日次注文サマリを実行する

```sql
CREATE MATERIALIZED VIEW dws_daily_sales
BUILD IMMEDIATE REFRESH AUTO ON COMMIT
DISTRIBUTED BY RANDOM BUCKETS 16
AS
select
date_trunc(o_orderdate, 'month') as month,
nation_name,
region_name,
bitmap_union(to_bitmap(o_orderkey)) as order_count,
sum(l_extendedprice * (1 - l_discount)) as net_revenue
from dwd_order_detail
group by
date_trunc(o_orderdate, 'month'),
nation_name,
region_name;
```
マテリアライズドビューを使用した最適化されたクエリは以下の通りです：

```sql
SELECT
nation_name,
month,
bitmap_union_count(order_count),
sum(net_revenue) as revenue
FROM dws_daily_sales
GROUP BY nation_name, month;
```
### シナリオ3: Lake-Warehouse統合フェデレーテッドデータクエリ

現代のデータアーキテクチャにおいて、企業はデータストレージコストとクエリパフォーマンスのバランスを取るためにlake-warehouse統合設計を採用することがよくあります。このアーキテクチャにおいて、2つの主要な課題がよく発生します：
- 限定的なクエリパフォーマンス: データレイクからデータを頻繁にクエリする場合、ネットワーク遅延やサードパーティサービスの影響でパフォーマンスが低下し、クエリ遅延が発生してユーザーエクスペリエンスに影響を与える可能性があります。
- データレイヤーモデリングの複雑性: データレイクからリアルタイムデータウェアハウスへのデータフローと変換プロセスにおいて、通常複雑なETLプロセスが必要となり、メンテナンスコストと開発難易度が増加します。

Doris非同期マテリアライズドビューを使用することで、これらの課題を効果的に解決できます：
- 透過的リライトによるクエリ高速化: よく使用されるデータレイククエリ結果をDoris内部ストレージにマテリアライズし、透過的リライトを使用してクエリパフォーマンスを効果的に向上させます。
- レイヤーモデリングの簡素化: データレイク内のTableに基づいてマテリアライズドビューの作成をサポートし、データレイクからリアルタイムデータウェアハウスへの便利な変換を可能にして、データモデリングプロセスを大幅に簡素化します。

例として、Hiveを使用する場合：

TPC-Hデータセットを使用してHiveベースのCatalogを作成

```sql
CREATE CATALOG hive_catalog PROPERTIES (
'type'='hms', -- hive meta store address
'hive.metastore.uris' = 'thrift://172.21.0.1:7004'
);
```
Hive Catalogに基づいてマテリアライズドビューを作成する

```sql
-- Materialized views can only be created on 内部カタログ, switch to 内部カタログ
switch internal;
create database hive_mv_db;
use hive_mv_db;

CREATE MATERIALIZED VIEW external_hive_mv
BUILD IMMEDIATE REFRESH AUTO ON MANUAL
DISTRIBUTED BY RANDOM BUCKETS 12
AS
SELECT
n_name,
o_orderdate,
sum(l_extendedprice * (1 - l_discount)) AS revenue
FROM
customer,
orders,
lineitem,
supplier,
nation,
region
WHERE
c_custkey = o_custkey
AND l_orderkey = o_orderkey
AND l_suppkey = s_suppkey
AND c_nationkey = s_nationkey
AND s_nationkey = n_nationkey
AND n_regionkey = r_regionkey
AND r_name = 'ASIA'
GROUP BY
n_name,
o_orderdate;
```
以下のクエリを実行してください。このクエリは透過的な書き換えによってマテリアライズドビューを自動的に使用して高速化されます。

```sql
SELECT
n_name,
sum(l_extendedprice * (1 - l_discount)) AS revenue
FROM
customer,
orders,
lineitem,
supplier,
nation,
region
WHERE
c_custkey = o_custkey
AND l_orderkey = o_orderkey
AND l_suppkey = s_suppkey
AND c_nationkey = s_nationkey
AND s_nationkey = n_nationkey
AND n_regionkey = r_regionkey
AND r_name = 'ASIA'
AND o_orderdate >= DATE '1994-01-01'
AND o_orderdate < DATE '1994-01-01' + INTERVAL '1' YEAR
GROUP BY
n_name
ORDER BY
revenue DESC;
```
:::tip Note
Dorisは現在、Hive以外の外部Tableにおけるデータ変更を検出することができません。外部Tableのデータに不整合がある場合、マテリアライズドビューを使用するとデータの不整合が生じる可能性があります。以下のスイッチは、透明リライトに参加するマテリアライズドビューが外部Tableを含むことを許可するかどうかを示します。デフォルトはfalseです。データの不整合を受け入れるか、定期的なリフレッシュを通じて外部Tableのデータ整合性を保証できる場合は、このスイッチをtrueに設定できます。
外部Tableを含むマテリアライズドビューを透明リライトに使用できるかどうかを設定します。デフォルトでは許可されません。データの不整合を受け入れることができるか、データ整合性を自分で保証できる場合は、有効にできます

`SET materialized_view_rewrite_enable_contain_external_table = true;`

マテリアライズドビューがMaterializedViewRewriteSuccessButNotChoseステータスの場合、リライトは成功したものの、CBOによってプランが選択されなかったことを意味します。これは外部Tableの統計情報が不完全であることが原因の可能性があります。
統計情報のためにファイルリストから行数を取得することを有効にします

``SET enable_get_row_count_from_file_list = true;``

外部Tableの統計情報を表示して完全かどうかを確認します

``SHOW TABLE STATS external_table_name;``
:::

### シナリオ4：書き込み効率の向上、リソース競合の軽減
高スループットのデータ書き込みシナリオでは、システムの安定性と効率的なデータ処理が同様に重要です。非同期マテリアライズドビューの柔軟なリフレッシュ戦略を通じて、ユーザーは特定のシナリオに基づいて適切なリフレッシュ方法を選択でき、それにより書き込み圧力を軽減し、リソース競合を回避できます。

同期マテリアライズドビューと比較して、非同期マテリアライズドビューは3つの柔軟なリフレッシュ戦略を提供します：手動トリガー、トリガーベース、および定期トリガーです。ユーザーはシナリオの要件に基づいて適切なリフレッシュ戦略を選択できます。ベースTableのデータが変更されても、即座にマテリアライズドビューのリフレッシュをトリガーすることはなく、遅延リフレッシュがリソース圧力を軽減し、書き込みリソース競合を効果的に回避するのに役立ちます。

以下に示すように、選択されたリフレッシュ方法は定期リフレッシュで、2時間ごとにリフレッシュされます。ordersとlineitemがデータをインポートする際、即座にマテリアライズドビューのリフレッシュをトリガーすることはありません。

```sql
CREATE MATERIALIZED VIEW common_schedule_join_mv
BUILD IMMEDIATE REFRESH AUTO ON SCHEDULE EVERY 2 HOUR
DISTRIBUTED BY RANDOM BUCKETS 16
AS
SELECT
l_linestatus,
l_extendedprice * (1 - l_discount),
o_orderdate,
o_shippriority
FROM
orders
LEFT JOIN lineitem ON l_orderkey = o_orderkey;
```
透明リライトはクエリSQLをリライトしてクエリ高速化を実現できる一方、インポートSQLもリライトしてインポート効率を向上させることができます。バージョン2.1.6以降、マテリアライズドビューとベースTableのデータが強い一貫性を持つ場合、Insert IntoやInsert OverwriteなどのDML操作を透明にリライトすることができ、データインポートシナリオのパフォーマンスを大幅に向上させます。

1. Insert IntoデータのターゲットTableを作成する

```sql
CREATE TABLE IF NOT EXISTS target_table  (
orderdate      DATE NOT NULL,
shippriority   INTEGER NOT NULL,
linestatus     CHAR(1) NOT NULL,
sale           DECIMALV3(15,2) NOT NULL
)
DUPLICATE KEY(orderdate, shippriority)
DISTRIBUTED BY HASH(shippriority) BUCKETS 3;
```
2. common_schedule_join_mv

```sql
CREATE MATERIALIZED VIEW common_schedule_join_mv
BUILD IMMEDIATE REFRESH AUTO ON SCHEDULE EVERY 2 HOUR
DISTRIBUTED BY RANDOM BUCKETS 16
AS
SELECT
l_linestatus,
l_extendedprice * (1 - l_discount),
o_orderdate,
o_shippriority
FROM
orders
LEFT JOIN lineitem ON l_orderkey = o_orderkey;
```
書き換え前のimport文：

```sql
INSERT INTO target_table
SELECT
o_orderdate,
o_shippriority,
l_linestatus,
l_extendedprice * (1 - l_discount)
FROM
orders
LEFT JOIN lineitem ON l_orderkey = o_orderkey;
```
透過的な書き換えの後、ステートメントは次のようになります：

```sql
INSERT INTO target_table
SELECT *
FROM common_schedule_join_mv;
```
注意：DML操作がデータ変更を検出できない外部Tableを含む場合、透明な書き換えによって最新のベースTableデータがターゲットTableにリアルタイムでインポートされない可能性があります。ユーザーがデータの不整合を受け入れることができる場合、または自身でデータの整合性を保証できる場合は、次のスイッチを有効にできます：

DMLにおいて、マテリアライズドビューがリアルタイムでデータを検出できない外部Tableを含む場合に、構造情報に基づくマテリアライズドビューの透明な書き換えを有効にするかどうか（デフォルトは無効）

`SET enable_dml_materialized_view_rewrite_when_base_table_unawareness = true;`
