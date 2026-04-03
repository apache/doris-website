---
{
  "title": "ベストプラクティス | Async Materialized View",
  "language": "ja",
  "description": "以下の条件が満たされる場合、パーティション化されたマテリアライズドビューを作成することが推奨されます：",
  "sidebar_label": "Best Practices"
}
---
# ベストプラクティス

## 非同期マテリアライズドビューの使用原則
- **適時性の考慮:** 非同期マテリアライズドビューは通常、データの適時性が重要でないシナリオ、通常はT+1データで使用されます。高い適時性が要求される場合は、同期マテリアライズドビューの使用を検討してください。

-  **加速効果と一貫性の考慮:** クエリ加速シナリオにおいて、マテリアライズドビューを作成する際、DBAは共通のクエリSQLパターンをグループ化し、グループ間の重複を最小化することを目指すべきです。SQLパターンのグループ化が明確であるほど、マテリアライズドビュー構築の品質が向上します。1つのクエリは複数のマテリアライズドビューを使用でき、1つのマテリアライズドビューは複数のクエリで使用される可能性があります。マテリアライズドビューの構築には、レスポンス時間（加速効果）、構築コスト、データ一貫性要件の包括的な検討が必要です。

-  **マテリアライズドビューの定義と構築コストの考慮:**

    - マテリアライズドビューの定義が元のクエリに近いほど、クエリ加速効果は良くなりますが、マテリアライゼーションの汎用性と再利用性は低くなり、構築コストが高くなります。

    - マテリアライズドビューの定義がより汎用的である場合（例：WHERE条件がなく、より多くの集約次元を持つ）、クエリ加速効果は低くなりますが、マテリアライゼーションの汎用性と再利用性は向上し、構築コストが低くなります。

:::caution Note
- **マテリアライズドビュー数の制御:** マテリアライズドビューは多ければ多いほど良いというわけではありません。マテリアライズドビューの構築と更新にはリソースが必要です。マテリアライズドビューは透明リライトに参加し、CBOコストモデルが最適なマテリアライズドビューを選択するのに時間を要します。理論的には、マテリアライズドビューが多いほど、透明リライト時間が長くなります。

- **マテリアライズドビューの使用状況を定期的にチェック:** 使用されていない場合は、タイムリーに削除すべきです。

- **ベーステーブルデータの更新頻度:** マテリアライズドビューのベーステーブルデータが頻繁に更新される場合、マテリアライズドビューの使用には適さない可能性があります。これにより、マテリアライズドビューが頻繁に無効になり、透明リライト（直接クエリ）に使用できなくなるためです。このようなマテリアライズドビューを透明リライトに使用する必要がある場合は、クエリされるデータに一定の適時性遅延を許可し、`grace_period`を設定できます。詳細については、`grace_period`の適用可能な紹介を参照してください。
  :::


## マテリアライズドビューのリフレッシュ方法選択の原則

以下の条件が満たされる場合、パーティションマテリアライズドビューの作成を推奨します：

- マテリアライズドビューのベーステーブルのデータ量が大きく、ベーステーブルがパーティションテーブルである。

- マテリアライズドビューで使用されるテーブルのうち、パーティションテーブル以外は頻繁に変更されない。

- マテリアライズドビューの定義SQLとパーティションフィールドがパーティション派生の要件を満たしている、つまりパーティション増分更新の要件を満たしている。詳細な要件は[CREATE-ASYNC-MATERIALIZED-VIEW](../../../sql-manual/sql-statements/table-and-view/async-materialized-view/CREATE-ASYNC-MATERIALIZED-VIEW#optional-parameters)で確認できます。

- マテリアライズドビューのパーティション数が大きくない。パーティションが多すぎると、パーティションマテリアライズドビューの構築時間が過度に長くなります。

マテリアライズドビューの一部のパーティションが無効になった場合、透明リライトはマテリアライズドビューの有効なパーティション UNION ALL ベーステーブルを使用してデータを返すことができます。

パーティションマテリアライズドビューが構築できない場合は、フルリフレッシュマテリアライズドビューの選択を検討できます。

## パーティションマテリアライズドビューの一般的な使用方法

マテリアライズドビューのベーステーブルのデータ量が大きく、ベーステーブルがパーティションテーブルである場合、マテリアライズドビューの定義SQLとパーティションフィールドがパーティション派生の要件を満たしていれば、このシナリオはパーティションマテリアライズドビューの構築に適しています。パーティション派生の詳細な要件については、[CREATE-ASYNC-MATERIALIZED-VIEW](../../../sql-manual/sql-statements/table-and-view/async-materialized-view/CREATE-ASYNC-MATERIALIZED-VIEW#optional-parameters)と[Async Materialized View FAQ Building Question 12](../../../query-acceleration/materialized-view/async-materialized-view/faq#q12-error-when-building-partitioned-materialized-view)を参照してください。

マテリアライズドビューのパーティションは、ベーステーブルのパーティションマッピングに従って作成され、通常ベーステーブルのパーティションと1:1または1:nの関係を持ちます。

- ベーステーブルのパーティションがデータ変更を受けた場合、パーティションの追加や削除など、マテリアライズドビューの対応するパーティションも無効になります。無効なパーティションは透明リライトに使用できませんが、直接クエリは可能です。透明リライトがマテリアライズドビューのパーティションデータが無効であることを発見すると、無効なパーティションはベーステーブルと結合してクエリに応答します。

  マテリアライズドビューのパーティション状態をチェックするコマンドについては、マテリアライズドビューの状態表示を参照してください。主に`show partitions from mv_name`コマンドを使用します。

- マテリアライズドビューが参照する非パーティションテーブルがデータ変更を受けた場合、マテリアライズドビューのすべてのパーティションが無効になり、マテリアライズドビューが透明リライトに使用できなくなります。コマンド`REFRESH MATERIALIZED VIEW mv1 AUTO;`を使用して、マテリアライズドビューのすべてのパーティションデータをリフレッシュする必要があります。このコマンドは、データが変更されたマテリアライズドビューのすべてのパーティションのリフレッシュを試みます。

  したがって、一般的にはパーティションマテリアライズドビューが参照するパーティションテーブルに頻繁に変更されるデータを配置し、非参照パーティションテーブルの位置に頻繁に変更されないディメンションテーブルを配置することが推奨されます。
- マテリアライズドビューが参照する非パーティションテーブルがデータ変更を受け、非パーティションテーブルのデータが修正なしの追加のみの場合、マテリアライズドビューの作成時に属性`excluded_trigger_tables = 'non_partition_table_name1,non_partition_table_name2'`を指定できます。これにより、非パーティションテーブルでのデータ変更がマテリアライズドビューのすべてのパーティションを無効にすることがなくなり、次のリフレッシュではパーティションテーブルに対応するマテリアライズドビューの無効なパーティションのみがリフレッシュされます。

パーティションマテリアライズドビューの透明リライトはパーティション粒度で行われます。マテリアライズドビューの一部のパーティションが無効になった場合でも、マテリアライズドビューは透明リライトに使用できます。ただし、1つのパーティションのみがクエリされ、そのパーティションのマテリアライズドビューでのデータが無効な場合、マテリアライズドビューは透明リライトに使用できません。

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
この例では、ordersテーブルのo_ordertimeフィールドがパーティションフィールドで、型はDATETIMEで、日別でパーティション分割されています。
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
マテリアライズドビューで毎回多くのパーティションが更新されることを避けるため、パーティション粒度をベーステーブルordersと一致させ、同じく"day"でパーティショニングできます。

マテリアライズドビューの定義SQLでは"day"粒度を使用し、"day"でデータを集計できます：

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
## UNION ALLを使用したパーティション化マテリアライズドビューの作成
現在、Dorisにはパーティション化マテリアライズドビューの定義にUNION ALL句を含めることができないという制限があります。
UNION ALLを含むマテリアライズドビューを作成するには、次のアプローチを使用できます：UNION ALLの各入力部分について、
パーティション化マテリアライズドビューの作成を試行し、その後UNION ALL結果セット全体に対して通常のビューを作成します。

例：
以下のマテリアライズドビュー定義にはUNION ALL句が含まれており、パーティション化マテリアライズドビューを直接作成するために使用することはできません。

```sql

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
date_trunc(l_ordertime, 'day')
UNION ALL
SELECT
l_linestatus,
l_extendedprice,
ps_partkey,
date_trunc(l_ordertime, 'day') as order_date
FROM
lineitem
LEFT JOIN partsupp ON l_partkey = ps_partkey
and l_suppkey = ps_suppkey;
```
上記のSQL文を2つの部分に分割し、2つのパーティション化されたマテリアライズドビューを個別に作成することができます。

```sql

CREATE MATERIALIZED VIEW union_sub_mv1
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
```sql
CREATE MATERIALIZED VIEW union_sub_mv2
BUILD IMMEDIATE REFRESH AUTO ON MANUAL
partition by(order_date)
DISTRIBUTED BY RANDOM BUCKETS 2
AS
SELECT
l_linestatus,
l_extendedprice,
ps_partkey,
date_trunc(l_ordertime, 'day') as order_date
FROM
lineitem
LEFT JOIN partsupp ON l_partkey = ps_partkey
and l_suppkey = ps_suppkey;
```
次に、2つのパーティション化されたマテリアライズドビューの結果セットにUNION ALLを実行する通常のビューを作成します。
このビュー（union_all_view）は外部に公開することができます。

```sql
CREATE VIEW union_all_view
AS
SELECT *
FROM
union_sub_mv1
UNION ALL
SELECT *
FROM
union_sub_mv2;
```
## 最新のパーティションデータのみを保持するパーティション化マテリアライズドビュー
:::tip Note
この機能はApache Dorisバージョン2.1.1以降でサポートされています。
:::

マテリアライズドビューは、最新のパーティションからのデータのみを保持し、各リフレッシュ時に期限切れのパーティションデータを自動的に削除するよう設定できます。
これは、マテリアライズドビューに以下のプロパティを設定することで実現できます：
partition_sync_limit、partition_sync_time_unit、およびpartition_sync_date_format。

`partition_sync_limit`: ベーステーブルのパーティションフィールドが時間ベースの場合、このプロパティはベーステーブルパーティションの同期範囲を設定し、partition_sync_time_unitと連携して動作します。例えば、partition_sync_time_unitをDAYとして3に設定すると、ベーステーブルの過去3日間のパーティションとデータのみが同期されます。

`partition_sync_time_unit`: パーティションリフレッシュの時間単位で、DAY/MONTH/YEAR をサポートします（デフォルトはDAY）。

`partition_date_format`: ベーステーブルのパーティションフィールドが文字列型の場合、partition_sync_limit機能を使用したい場合にこのプロパティで日付フォーマットを設定します。

例：
以下で定義されたマテリアライズドビューは、過去3日間のデータのみを保持します。最近3日間にデータがない場合、このマテリアライズドビューを直接クエリしても結果は返されません。

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
## マテリアライズドビューを使用してクエリを高速化する方法

クエリ高速化のためにマテリアライズドビューを使用するには、まずプロファイルファイルをチェックして、クエリで最も時間を消費する操作を見つけます。通常、これはJoin、Aggregate、Filter、または計算式で現れます。

Join、Aggregate、Filter、計算式では、マテリアライズドビューを構築することでクエリの高速化に役立ちます。クエリのJoin操作が大量の計算リソースを消費する一方で、Aggregateが比較的少ないリソースを消費する場合、Join操作を対象としたマテリアライズドビューを構築できます。

次に、これら4つの操作に対するマテリアライズドビューの構築方法について詳しく説明します：

1. **Joinの場合**

   クエリで使用される共通のテーブル結合パターンを抽出して、マテリアライズドビューを構築できます。透過的な書き換えがこのマテリアライズドビューを使用する場合、Join計算を節約できます。クエリからFilterを削除して、より汎用的なJoinマテリアライズドビューを作成してください。

2. **Aggregateの場合**

   マテリアライズドビューを構築する際は、低カーディナリティのフィールドをディメンションとして使用することを推奨します。ディメンションが関連している場合、集約後の数を可能な限り削減できます。

   例えば、テーブルt1で、元のテーブルに1,000,000レコードがあり、SQLクエリに`group by a, b, c`がある場合を考えます。a、b、cのカーディナリティがそれぞれ100、50、15の場合、集約後のデータは約75,000となり、このマテリアライズドビューが効果的であることを示しています。a、b、cが相関している場合、集約データ量はさらに削減されます。

   a、b、cが高いカーディナリティを持つ場合、集約データが急速に拡張します。集約データが元のテーブルデータより多い場合、このシナリオはマテリアライズドビューの構築に適さない可能性があります。例えば、cのカーディナリティが3,500の場合、集約データは約17,000,000となり、元のテーブルデータよりもはるかに大きくなり、このようなマテリアライズドビューを構築することによるパフォーマンス高速化の効果は低くなります。

   マテリアライズドビューの集約粒度は、クエリよりも細かくする必要があります。つまり、マテリアライズドビューの集約ディメンションは、クエリに必要なデータを提供するために、クエリの集約ディメンションを含む必要があります。クエリはGroup Byを書かない場合があり、同様に、マテリアライズドビューの集約関数はクエリの集約関数を含む必要があります。

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
クエリ 2:

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
上記の2つのSQLクエリに基づき、Aggregateを含むより汎用的なマテリアライズドビューを構築することができます。このマテリアライズドビューでは、集約のためのgroup by次元としてl_partkeyとl_suppkeyの両方を含み、o_orderdateをフィルター条件として使用します。o_orderdateはマテリアライズドビューの条件補償で使用されるだけでなく、マテリアライズドビューの集約group by次元にも含める必要があることに注意してください。

   このようにマテリアライズドビューを構築した後、Query 1とQuery 2の両方がこのマテリアライズドビューにヒットできます。マテリアライズドビューの定義は以下の通りです：

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
3. **Filter用**

   同じフィールドに対するFilterがクエリに頻繁に出現する場合、マテリアライズドビューに対応するFilterを追加することで、マテリアライズドビュー内のデータ量を削減し、クエリがマテリアライズドビューにヒットした際のパフォーマンスを向上させることができます。

   マテリアライズドビューのFilterは、クエリに出現するものより少なくする必要があり、クエリのFilterはマテリアライズドビューのFilterを含む必要があることに注意してください。例えば、クエリが`a > 10 and b > 5`の場合、マテリアライズドビューにはFilterを設けないか、Filterを設ける場合は、`a > 5 and b > 5`、`b > 0`、または単に`a > 5`のように、クエリよりも大きなデータ範囲でaとbをフィルタリングする必要があります。

   **4. 計算式用**

   case whenや文字列処理関数などの例を取ると、これらの式計算は非常にパフォーマンス負荷が高くなります。これらをマテリアライズドビューで事前計算できる場合、透明なリライトを通じて事前計算されたマテリアライズドビューを使用することで、クエリのパフォーマンスを向上させることができます。

   マテリアライズドビューの列数は多すぎないことを推奨します。クエリが複数のフィールドを使用する場合は、初期のSQLパターングループ化に基づいて異なる列に対応するマテリアライズドビューを構築し、単一のマテリアライズドビューで列が多すぎることを避けるべきです。

## 使用シナリオ

### シナリオ1：クエリ高速化

BIレポートシナリオやその他の高速化シナリオでは、ユーザーはクエリの応答時間に敏感であり、通常は数秒での結果返却を要求します。クエリは通常、複数のテーブル結合に続いて集約計算を行いますが、これは大幅な計算リソースを消費し、適時性を保証することが困難な場合があります。非同期マテリアライズドビューはこれをうまく処理でき、直接クエリと透明なリライトの両方をサポートし、オプティマイザーはリライトアルゴリズムとコストモデルに基づいてリクエストに応答する最適なマテリアライズドビューを自動的に選択します。

#### ユースケース1：複数テーブル結合集約クエリの高速化
より汎用的なマテリアライズドビューを構築することで、複数テーブル結合集約クエリを高速化できます。

以下の3つのクエリSQLを例にとります：

Query 1：

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
クエリ 2:

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
クエリ 3:

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
上記のクエリに対して、すべてのクエリを満たすために以下のマテリアライズドビューを構築することができます。

マテリアライズドビューの定義では、より一般的なJoinを得るためにQuery 1とQuery 2からフィルター条件を削除し、式`l_extendedprice * (1 - l_discount)`を事前計算します。これにより、クエリがマテリアライズドビューにヒットした際に、式の計算を節約することができます。

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
上記のマテリアライズドビューがQuery 2の高速化性能要件を満たすことができない場合、集約マテリアライズドビューを構築できます。汎用性を保つために、`o_orderdate`フィールドのフィルタ条件を削除できます：

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
#### 使用例2: ログクエリ高速化

ログクエリ高速化のシナリオでは、非同期materialized viewのみの使用に限定せず、同期materialized viewと組み合わせることを推奨します。

一般的に、ベーステーブルはパーティションテーブルであり、主に時間単位でパーティション化され、単一テーブルの集計クエリを行い、フィルター条件は通常時間といくつかのフラグビットに基づいています。クエリの応答速度が要件を満たせない場合、通常は高速化のために同期materialized viewを構築できます。

例えば、ベーステーブルの定義は以下のようになります：

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
マテリアライズドビューは分単位でデータを集約でき、これによって一定の集約効果を実現することもできます。例えば：

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
クエリステートメントは以下のようになる可能性があります：

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
### シナリオ2: データモデリング（ETL）

データ分析作業では、複数のテーブルを結合・集約する必要があることが多く、これは通常、複雑で頻繁に繰り返されるクエリを含むプロセスです。これらのタイプのクエリは、クエリレイテンシの増大やリソース消費量の増加といった問題を引き起こす可能性があります。しかし、非同期マテリアライズドビューを使用して階層化されたデータモデルを構築すれば、これらの問題を適切に回避できます。既存のマテリアライズドビューに基づいて、より高次のマテリアライズドビューを作成し（バージョン2.1.3以降でサポート）、さまざまな要件に柔軟に対応することができます。

マテリアライズドビューの各レベルには、独自のトリガー方式を設定できます。例えば：

- 第1層のマテリアライズドビューを定期リフレッシュに設定し、第2層をトリガーリフレッシュに設定することができます。この方法では、第1層のマテリアライズドビューのリフレッシュが完了すると、第2層のマテリアライズドビューのリフレッシュが自動的にトリガーされます。
- 各層のマテリアライズドビューをすべて定期リフレッシュに設定した場合、第2層のマテリアライズドビューがリフレッシュする際に、第1層のマテリアライズドビューのデータがベーステーブルと同期されているかどうかを考慮せず、第1層のマテリアライズドビューのデータを処理して第2層に同期します。

次に、TPC-Hデータセットを使用して、データモデリングにおける非同期マテリアライズドビューの応用を説明します。地域と国別の月次注文数量と利益の分析を例に取ります：

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
階層化モデリングにおける非同期マテリアライズドビューの使用：

DWD層（詳細データ）の構築、注文詳細ワイドテーブルの処理

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
DWSレイヤー（サマリーデータ）を構築し、日次注文サマリーを実行する

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
### シナリオ3：Lake-Warehouse統合連合データクエリ

現代のデータアーキテクチャにおいて、企業はデータストレージコストとクエリパフォーマンスのバランスを取るためにlake-warehouse統合設計を採用することが多い。このアーキテクチャの下で、2つの主要な課題に頻繁に遭遇する：
- 限定的なクエリパフォーマンス：データレイクからのデータを頻繁にクエリする際、パフォーマンスがネットワークレイテンシとサードパーティサービスによって影響を受ける可能性があり、クエリの遅延を引き起こし、ユーザーエクスペリエンスに影響を与える。
- データレイヤーモデリングの複雑性：データレイクからリアルタイムデータウェアハウスへのデータフローと変換プロセスにおいて、通常複雑なETLプロセスが必要となり、メンテナンスコストと開発難易度が増加する。

Doris非同期マテリアライズドビューを使用することで、これらの課題を効果的に解決できる：
- 透過的な書き換えによるクエリの高速化：一般的に使用されるデータレイククエリ結果をDoris内部ストレージにマテリアライズし、透過的な書き換えを使用してクエリパフォーマンスを効果的に向上させる。
- レイヤーモデリングの簡素化：データレイク内のテーブルに基づいてマテリアライズドビューの作成をサポートし、データレイクからリアルタイムデータウェアハウスへの便利な変換を可能にし、データモデリングプロセスを大幅に簡素化する。

例えば、Hiveを使用する場合：

TPC-Hデータセットを使用してHiveベースのCatalogを作成する

```sql
CREATE CATALOG hive_catalog PROPERTIES (
'type'='hms', -- hive meta store address
'hive.metastore.uris' = 'thrift://172.21.0.1:7004'
);
```
Hive Catalogに基づくマテリアライズドビューの作成

```sql
-- Materialized views can only be created on internal catalog, switch to internal catalog
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
以下のクエリを実行してください。これにより、透過的な書き換えを通じてマテリアライズドビューが自動的に高速化のために使用されます。

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
Dorisは現在、Hive以外の外部テーブルのデータ変更を検出できません。外部テーブルデータに不整合がある場合、マテリアライズドビューを使用するとデータの不整合が生じる可能性があります。以下のスイッチは、透過的リライトに参加するマテリアライズドビューに外部テーブルを含めることを許可するかどうかを示します。デフォルトはfalseです。データの不整合を許容するか、定期的なリフレッシュによって外部テーブルデータの整合性を保証できる場合は、このスイッチをtrueに設定できます。
外部テーブルを含むマテリアライズドビューを透過的リライトに使用できるかどうかを設定します。デフォルトでは許可されていませんが、データの不整合を許容できるか、自分でデータの整合性を保証できる場合は有効にできます。

`SET materialized_view_rewrite_enable_contain_external_table = true;`

マテリアライズドビューがMaterializedViewRewriteSuccessButNotChoseステータスの場合、リライトは成功したがプランがCBOによって選択されなかったことを意味します。これは外部テーブルの統計情報が不完全である可能性があります。
統計情報のためにファイルリストから行数を取得することを有効化

``SET enable_get_row_count_from_file_list = true;``

外部テーブル統計情報を表示して完全であることを確認

``SHOW TABLE STATS external_table_name;``
:::

### シナリオ4：書き込み効率の改善、リソース競合の削減
高スループットなデータ書き込みシナリオでは、システムの安定性と効率的なデータ処理が同様に重要です。非同期マテリアライズドビューの柔軟なリフレッシュ戦略により、ユーザーは特定のシナリオに基づいて適切なリフレッシュ方法を選択でき、それによって書き込み圧力を削減し、リソース競合を回避できます。

同期マテリアライズドビューと比較して、非同期マテリアライズドビューは3つの柔軟なリフレッシュ戦略を提供します：手動トリガー、トリガーベース、定期トリガーです。ユーザーはシナリオ要件に基づいて適切なリフレッシュ戦略を選択できます。ベーステーブルデータが変更されても、即座にマテリアライズドビューのリフレッシュをトリガーすることはなく、遅延リフレッシュはリソース圧力を削減し、書き込みリソース競合を効果的に回避するのに役立ちます。

以下に示すように、選択されたリフレッシュ方法は定期リフレッシュで、2時間ごとにリフレッシュします。ordersとlineitemがデータをインポートしても、即座にマテリアライズドビューのリフレッシュをトリガーしません。

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
透明な書き換えはクエリSQLを書き換えてクエリの高速化を実現できる一方で、import SQLを書き換えてimport効率を向上させることもできます。バージョン2.1.6以降、マテリアライズドビューとベーステーブルのデータが強整合性を持つ場合、Insert IntoやInsert OverwriteなどのDML操作を透明に書き換えることができ、データimportシナリオのパフォーマンスを大幅に向上させます。

1. Insert Intoデータ用のターゲットテーブルを作成する

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
リライト前のimport文:

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
透明な書き換えの後、ステートメントは次のようになります：

```sql
INSERT INTO target_table
SELECT *
FROM common_schedule_join_mv;
```
注意点：DML操作がデータ変更を検出できない外部テーブルを含む場合、透過的リライトにより最新のベーステーブルデータがターゲットテーブルにリアルタイムでインポートされない可能性があります。ユーザーがデータ不整合を許容できる場合、または自分でデータ整合性を保証できる場合は、以下のスイッチを有効にできます：

DMLにおいて、マテリアライズドビューがリアルタイムでデータを検出できない外部テーブルを含む場合に、構造情報に基づいたマテリアライズドビューの透過的リライトを有効にするかどうか、デフォルトは無効

`SET enable_dml_materialized_view_rewrite_when_base_table_unawareness = true;`
