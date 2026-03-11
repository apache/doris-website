---
{
  "title": "ベストプラクティス | Async Materialized View",
  "language": "ja",
  "description": "以下の条件が満たされた場合、パーティション化されたマテリアライズドビューを作成することを推奨します：",
  "sidebar_label": "Best Practices"
}
---
# ベストプラクティス

## 非同期マテリアライズドビューの使用原則
- **適時性の考慮：** 非同期マテリアライズドビューは通常、データの適時性が重要でないシナリオ、通常はT+1データで使用されます。高い適時性が要求される場合は、同期マテリアライズドビューの使用を検討してください。

-  **高速化効果と一貫性の考慮：** クエリ高速化シナリオにおいて、マテリアライズドビューを作成する際、DBAは共通のクエリSQLパターンをグループ化し、グループ間の重複を最小化することを目指すべきです。SQLパターンのグループ化が明確であるほど、マテリアライズドビュー構築の品質が高くなります。クエリは複数のマテリアライズドビューを使用する可能性があり、マテリアライズドビューは複数のクエリで使用される可能性があります。マテリアライズドビューの構築には、応答時間（高速化効果）、構築コスト、およびデータ一貫性要件を総合的に考慮する必要があります。

-  **マテリアライズドビュー定義と構築コストの考慮：**
    
    - マテリアライズドビュー定義が元のクエリに近いほど、クエリ高速化効果は良くなりますが、マテリアライゼーションの汎用性と再利用性は低くなり、構築コストが高くなります。
    
    - マテリアライズドビュー定義がより汎用的である（例：WHERE条件がなく、より多くの集約次元を持つ）ほど、クエリ高速化効果は低くなりますが、マテリアライゼーションの汎用性と再利用性は良くなり、構築コストが低くなります。

:::caution Note
- **マテリアライズドビュー数の制御：** マテリアライズドビューは多ければ良いというものではありません。マテリアライズドビューの構築と更新にはリソースが必要です。マテリアライズドビューは透過的リライトに参加し、CBOコストモデルは最適なマテリアライズドビューを選択するのに時間が必要です。理論的には、マテリアライズドビューが多いほど、透過的リライト時間が長くなります。

- **マテリアライズドビューの使用状況を定期的に確認：** 使用されていない場合は、適時削除すべきです。

- **ベーステーブルデータ更新頻度：** マテリアライズドビューのベーステーブルデータが頻繁に更新される場合、マテリアライズドビューの使用は適さない可能性があります。これによりマテリアライズドビューが頻繁に無効になり、透過的リライト（直接クエリ）に使用できなくなるためです。このようなマテリアライズドビューを透過的リライトに使用する必要がある場合は、クエリされるデータにある程度の適時性遅延を許可し、`grace_period`を設定できます。詳細は`grace_period`の適用説明を参照してください。
:::


## マテリアライズドビューリフレッシュ方法の選択原則

以下の条件を満たす場合、パーティション化されたマテリアライズドビューの作成を推奨します：

- マテリアライズドビューのベーステーブルデータ量が大きく、ベーステーブルがパーティションテーブルである。

- マテリアライズドビューで使用されるテーブルのうち、パーティションテーブル以外は頻繁に変更されない。

- マテリアライズドビューの定義SQLとパーティションフィールドがパーティション派生の要件を満たす、すなわちパーティション増分更新の要件を満たす。詳細な要件は[CREATE-ASYNC-MATERIALIZED-VIEW](../../../sql-manual/sql-statements/table-and-view/async-materialized-view/CREATE-ASYNC-MATERIALIZED-VIEW#optional-parameters)で確認できます。

- マテリアライズドビューのパーティション数が多すぎない。パーティション数が多すぎると、パーティション化されたマテリアライズドビューの構築時間が過度に長くなります。

マテリアライズドビューの一部のパーティションが無効になった場合、透過的リライトはマテリアライズドビューの有効なパーティションUNION ALLベーステーブルを使用してデータを返すことができます。

パーティション化されたマテリアライズドビューを構築できない場合は、完全リフレッシュされたマテリアライズドビューの選択を考慮できます。

## パーティション化されたマテリアライズドビューの一般的な使用法

マテリアライズドビューのベーステーブルデータ量が大きく、ベーステーブルがパーティションテーブルである場合、マテリアライズドビューの定義SQLとパーティションフィールドがパーティション派生の要件を満たすなら、このシナリオはパーティション化されたマテリアライズドビューの構築に適しています。パーティション派生の詳細な要件については、[CREATE-ASYNC-MATERIALIZED-VIEW](../../../sql-manual/sql-statements/table-and-view/async-materialized-view/CREATE-ASYNC-MATERIALIZED-VIEW#optional-parameters)および[Async Materialized View FAQ Building Question 12](../../../query-acceleration/materialized-view/async-materialized-view/faq#q12-error-when-building-partitioned-materialized-view)を参照してください。

マテリアライズドビューのパーティションは、ベーステーブルのパーティションマッピングに従って作成され、一般的にベーステーブルのパーティションと1:1または1:nの関係を持ちます。

- ベーステーブルのパーティションがデータ変更（パーティションの追加や削除など）を受けた場合、マテリアライズドビューの対応するパーティションも無効になります。無効なパーティションは透過的リライトには使用できませんが、直接クエリは可能です。透過的リライトがマテリアライズドビューのパーティションデータが無効であることを発見した場合、無効なパーティションはベーステーブルとの結合によって処理され、クエリに応答します。

  マテリアライズドビューパーティション状況を確認するコマンドについては、マテリアライズドビュー状況の表示を参照し、主に`show partitions from mv_name`コマンドを使用します。

- マテリアライズドビューによって参照される非パーティションテーブルがデータ変更を受けた場合、マテリアライズドビューのすべてのパーティションが無効になり、マテリアライズドビューが透過的リライトに使用できなくなります。`REFRESH MATERIALIZED VIEW mv1 AUTO;`コマンドを使用してマテリアライズドビューのすべてのパーティションデータをリフレッシュする必要があります。このコマンドは、データが変更されたマテリアライズドビューのすべてのパーティションをリフレッシュしようとします。

  そのため、一般的にはパーティション化されたマテリアライズドビューによって参照されるパーティションテーブルに頻繁に変更されるデータを配置し、参照されない非パーティションテーブル位置に変更頻度の低いディメンションテーブルを配置することを推奨します。
- マテリアライズドビューによって参照される非パーティションテーブルがデータ変更を受け、非パーティションテーブルデータが変更なしの追加のみの場合、マテリアライズドビュー作成時に属性`excluded_trigger_tables = 'non_partition_table_name1,non_partition_table_name2'`を指定できます。これにより、非パーティションテーブルでのデータ変更がマテリアライズドビューのすべてのパーティションを無効にすることがなくなり、次回のリフレッシュではパーティションテーブルに対応するマテリアライズドビューの無効なパーティションのみをリフレッシュします。

パーティション化されたマテリアライズドビューの透過的リライトはパーティション粒度で行われます。マテリアライズドビューの一部のパーティションが無効になっても、マテリアライズドビューは依然として透過的リライトに使用できます。ただし、1つのパーティションのみがクエリされ、そのパーティションのマテリアライズドビュー内のデータが無効な場合、マテリアライズドビューは透過的リライトに使用できません。

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
この例では、ordersテーブルのo_ordertimeフィールドがパーティションフィールドで、タイプはDATETIMEであり、日単位でパーティション化されています。
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
マテリアライズドビューで毎回多くのパーティションをリフレッシュすることを避けるため、パーティションの粒度はベーステーブル orders と一致させ、「day」でパーティショニングすることもできます。

マテリアライズドビューの定義 SQL では「day」粒度を使用し、「day」でデータを集約できます：

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
## 最新のパーティションデータのみを保持するパーティション化マテリアライズドビュー
:::tip Note
この機能はApache Dorisバージョン2.1.1以降でサポートされています。
:::

マテリアライズドビューは最新のパーティションからのデータのみを保持するように設定でき、リフレッシュの度に期限切れのパーティションデータを自動的に削除します。
これは、マテリアライズドビューに以下のプロパティを設定することで実現できます：
partition_sync_limit、partition_sync_time_unit、およびpartition_sync_date_format。

`partition_sync_limit`: ベーステーブルのパーティションフィールドが時間ベースの場合、このプロパティはベーステーブルパーティションの同期範囲を設定し、partition_sync_time_unitと連携して動作します。例えば、partition_sync_time_unitをDAYに設定して3に設定すると、ベーステーブルの過去3日間のパーティションとデータのみが同期されることを意味します。

`partition_sync_time_unit`: パーティションリフレッシュの時間単位で、DAY/MONTH/YEAR（デフォルトはDAY）をサポートします。

`partition_date_format`: ベーステーブルのパーティションフィールドが文字列型の場合、partition_sync_limit機能を使用したい場合にこのプロパティで日付フォーマットを設定します。

例：
以下で定義されるマテリアライズドビューは、過去3日間のデータのみを保持します。最近3日間にデータがない場合、このマテリアライズドビューを直接クエリしても結果は返されません。

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

クエリ高速化のためにmaterialized viewを使用するには、まずプロファイルファイルをチェックして、クエリで最も時間を消費する操作を見つけます。これは通常、Join、Aggregate、Filter、またはCalculated Expressionsに現れます。

Join、Aggregate、Filters、およびCalculated Expressionsについては、materialized viewを構築することでクエリの高速化に役立ちます。クエリ内のJoin操作が大量のコンピューティングリソースを消費し、Aggregateが比較的少ないリソースを消費する場合、Join操作をターゲットとしたmaterialized viewを構築できます。

次に、これら4つの操作に対してmaterialized viewを構築する方法を詳しく説明します：

1. **Joinの場合**

    クエリで使用される一般的なテーブル結合パターンを抽出して、materialized viewを構築できます。透過的な書き換えがこのmaterialized viewを使用する場合、Join計算を節約できます。より汎用的なJoin materialized viewを作成するために、クエリからFiltersを削除します。

2. **Aggregateの場合**
        
    materialized viewを構築する際は、低カーディナリティフィールドを次元として使用することが推奨されます。次元が関連している場合、集約後の数を可能な限り削減できます。
    
    例えば、テーブルt1で、元のテーブルに1,000,000レコードがあり、SQLクエリに`group by a, b, c`がある場合を考えます。a、b、cのカーディナリティがそれぞれ100、50、15である場合、集約されたデータは約75,000となり、このmaterialized viewが効果的であることを示します。a、b、cが相関している場合、集約されたデータの量はさらに削減されます。
    
    a、b、cが高カーディナリティを持つ場合、集約されたデータが急速に拡大することになります。集約されたデータが元のテーブルデータよりも多い場合、このシナリオはmaterialized viewの構築に適さない可能性があります。例えば、cのカーディナリティが3,500の場合、集約されたデータは約17,000,000となり、元のテーブルデータよりもはるかに大きくなるため、このようなmaterialized viewを構築することの性能向上効果は低くなります。
    
    materialized viewの集約粒度はクエリよりも細かくする必要があります。つまり、materialized viewの集約次元はクエリの集約次元を含む必要があり、クエリに必要なデータを提供します。クエリはGroup Byを書かない場合もあり、同様に、materialized viewの集約関数はクエリの集約関数を含む必要があります。
    
    aggregateクエリ高速化を例にとると：
    
    Query 1：

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
上記の2つのSQLクエリに基づいて、Aggregateを含むより汎用的なマテリアライズドビューを構築できます。このマテリアライズドビューでは、集約のgroup by次元としてl_partkeyとl_suppkeyの両方を含め、フィルタ条件としてo_orderdateを使用します。o_orderdateはマテリアライズドビューの条件補償で使用されるだけでなく、マテリアライズドビューの集約group by次元にも含める必要があることに注意してください。

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
3. **Filterに関して**
    
    同じフィールドに対するフィルターがクエリに頻繁に現れる場合、マテリアライズドビューに対応するFiltersを追加することで、マテリアライズドビュー内のデータ量を削減し、クエリがマテリアライズドビューにヒットした際のパフォーマンスを向上させることができます。
    
    マテリアライズドビューのFiltersは、クエリに現れるFiltersよりも少なくする必要があり、クエリのFiltersはマテリアライズドビューのFiltersを含む必要があることに注意してください。例えば、クエリが`a > 10 and b > 5`の場合、マテリアライズドビューはFilterを持たないか、Filtersを持つ場合はクエリよりも大きなデータ範囲でaとbをフィルタリングする必要があります。例：`a > 5 and b > 5`、`b > 0`、または単に`a > 5`など。
    
    **4. 計算式に関して**
    
    case whenや文字列処理関数などの例を取ると、これらの式計算は非常にパフォーマンス集約的です。これらがマテリアライズドビューで事前計算できる場合、透過的なリライトを通じて事前計算されたマテリアライズドビューを使用することで、クエリパフォーマンスを向上させることができます。
    
    マテリアライズドビューの列数は多すぎないことが推奨されます。クエリが複数のフィールドを使用する場合、初期のSQLパターングループ化に基づいて異なる列に対応するマテリアライズドビューを構築し、単一のマテリアライズドビューの列数が多くなりすぎることを避けるべきです。

## 使用シナリオ

### シナリオ1：クエリの高速化

BIレポートシナリオやその他の高速化シナリオでは、ユーザーはクエリレスポンス時間に敏感で、通常は秒単位で結果が返されることを要求します。クエリは通常、複数のテーブルの結合に続いて集計計算を行うため、大量の計算リソースを消費し、時として適時性を保証することが困難になります。非同期マテリアライズドビューはこれを適切に処理でき、直接クエリと透過的リライトの両方をサポートし、オプティマイザーはリライトアルゴリズムとコストモデルに基づいて自動的に最適なマテリアライズドビューを選択してリクエストに応答します。

#### ユースケース1：複数テーブル結合集計クエリの高速化
より汎用的なマテリアライズドビューを構築することで、複数テーブル結合集計クエリを高速化できます。

以下の3つのクエリSQLを例として：

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
上記のクエリに対して、すべてのクエリを満たすために以下のマテリアライズドビューを構築できます。

マテリアライズドビューの定義では、より一般的なJoinを得るためにQuery 1とQuery 2からフィルター条件を削除し、式`l_extendedprice * (1 - l_discount)`を事前計算します。これにより、クエリがマテリアライズドビューにヒットした際に式の計算を節約できます。

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
上記のマテリアライズドビューがQuery 2のアクセラレーション性能要件を満たせない場合、集約マテリアライズドビューを構築できます。汎用性を保つために、`o_orderdate`フィールドのフィルター条件を削除できます：

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
#### Use Case 2: ログクエリの高速化

ログクエリの高速化シナリオでは、非同期マテリアライズドビューのみの使用に限定せず、同期マテリアライズドビューと組み合わせることを推奨します。

一般的に、ベーステーブルはパーティションテーブルで、主に時間単位でパーティション化され、単一テーブルの集約クエリであり、フィルタ条件は通常時間といくつかのフラグビットに基づいています。クエリレスポンス速度が要件を満たせない場合、通常は高速化のために同期マテリアライズドビューを構築できます。

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

データ分析作業では、複数のテーブルを結合して集約する処理が必要になることが多く、このプロセスでは通常、複雑で頻繁に繰り返されるクエリが発生します。これらのタイプのクエリは、クエリレイテンシの増大やリソース消費量の増加といった問題を引き起こす可能性があります。ただし、非同期マテリアライズドビューを使用して階層化されたデータモデルを構築する場合、これらの問題を適切に回避することができます。既存のマテリアライズドビューをベースにして、より高レベルのマテリアライズドビューを作成することができ（バージョン2.1.3以降でサポート）、さまざまな要件に柔軟に対応できます。

マテリアライズドビューのレベルごとに、独自のトリガー方法を設定できます。例えば：

- 第1層のマテリアライズドビューを定期的にリフレッシュするように設定し、第2層をトリガーリフレッシュに設定できます。この方法では、第1層のマテリアライズドビューがリフレッシュを完了すると、自動的に第2層のマテリアライズドビューのリフレッシュがトリガーされます。
- マテリアライズドビューの各層を定期的にリフレッシュするように設定した場合、第2層のマテリアライズドビューがリフレッシュする際に、第1層のマテリアライズドビューデータがベーステーブルと同期されているかどうかは考慮されず、第1層のマテリアライズドビューデータを処理して第2層に同期するだけです。

次に、TPC-Hデータセットを使用して、地域と国別の月次注文数量と利益分析を例として、データモデリングにおける非同期マテリアライズドビューの適用について説明します：

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
階層化モデリングでの非同期マテリアライズドビューの使用：

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
materialized viewsを使用した最適化されたクエリは以下の通りです：

```sql
SELECT
nation_name,
month,
bitmap_union_count(order_count),
sum(net_revenue) as revenue
FROM dws_daily_sales
GROUP BY nation_name, month;
```
### シナリオ3：レイクウェアハウス統合フェデレーテッドデータクエリ

現代のデータアーキテクチャにおいて、企業はデータストレージコストとクエリパフォーマンスのバランスを取るために、レイクウェアハウス統合設計を採用することが多くあります。このアーキテクチャの下で、以下の2つの主要な課題が頻繁に発生します：
- 限定的なクエリパフォーマンス：データレイクからデータを頻繁にクエリする際、ネットワーク遅延やサードパーティサービスによってパフォーマンスが影響を受け、クエリの遅延を引き起こし、ユーザーエクスペリエンスに影響を与える可能性があります。
- データ層モデリングの複雑性：データレイクからリアルタイムデータウェアハウスへのデータフローおよび変換プロセスにおいて、通常複雑なETLプロセスが必要となり、これによりメンテナンスコストと開発難易度が増加します。

Doris非同期マテリアライズドビューを使用することで、これらの課題を効果的に解決できます：
- 透過的リライトによるクエリ高速化：よく使用されるデータレイククエリの結果をDoris内部ストレージにマテリアライズし、透過的リライトを使用してクエリパフォーマンスを効果的に向上させます。
- 層モデリングの簡素化：データレイク内のテーブルに基づいたマテリアライズドビューの作成をサポートし、データレイクからリアルタイムデータウェアハウスへの便利な変換を可能にし、データモデリングプロセスを大幅に簡素化します。

例として、Hiveを使用する場合：

TPC-Hデータセットを使用してHiveに基づいたCatalogを作成

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
次のクエリを実行してください。これにより、透過的な書き換えを通じてマテリアライズドビューが自動的に高速化に使用されます。

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
Doris は現在、Hive 以外の外部テーブルでのデータ変更を検出することができません。外部テーブルのデータに不整合がある場合、マテリアライズドビューを使用するとデータの不整合が発生する可能性があります。以下のスイッチは、透過的リライトに参加するマテリアライズドビューが外部テーブルを含むことを許可するかどうかを示します。デフォルトは false です。データの不整合を受け入れるか、定期的なリフレッシュによって外部テーブルのデータ整合性を保証する場合、このスイッチを true に設定できます。
外部テーブルを含むマテリアライズドビューを透過的リライトに使用できるかどうかを設定します。デフォルトでは許可されていません。データの不整合を受け入れることができるか、自分でデータ整合性を保証できる場合は有効にできます。

`SET materialized_view_rewrite_enable_contain_external_table = true;`

マテリアライズドビューが MaterializedViewRewriteSuccessButNotChose ステータスの場合、リライトは成功したが CBO によってプランが選択されなかったことを意味します。これは外部テーブルの統計が不完全であることが原因の可能性があります。
統計のためにファイルリストから行数を取得することを有効にする

``SET enable_get_row_count_from_file_list = true;``
   
外部テーブルの統計を表示して完全かどうか確認する

``SHOW TABLE STATS external_table_name;``
:::

### シナリオ4：書き込み効率の向上、リソース競合の軽減
高スループットのデータ書き込みシナリオでは、システムの安定性と効率的なデータ処理が同様に重要です。非同期マテリアライズドビューの柔軟なリフレッシュ戦略により、ユーザーは特定のシナリオに基づいて適切なリフレッシュ方法を選択でき、それによって書き込み圧力を軽減し、リソース競合を回避できます。

同期マテリアライズドビューと比較して、非同期マテリアライズドビューは手動トリガー、トリガーベース、定期トリガーの3つの柔軟なリフレッシュ戦略を提供します。ユーザーはシナリオ要件に基づいて適切なリフレッシュ戦略を選択できます。ベーステーブルのデータが変更されても、即座にマテリアライズドビューのリフレッシュをトリガーすることはなく、遅延リフレッシュはリソース圧力の軽減に役立ち、書き込みリソース競合を効果的に回避します。

以下に示すように、選択されたリフレッシュ方法は定期リフレッシュで、2時間ごとにリフレッシュします。orders と lineitem がデータをインポートしても、即座にマテリアライズドビューのリフレッシュをトリガーしません。

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
透明な書き換えはクエリSQLを書き換えてクエリの高速化を実現でき、同時にimport SQLを書き換えてインポート効率を向上させることもできます。バージョン2.1.6以降、materialized viewとベーステーブルのデータが強く一致している場合、Insert IntoやInsert OverwriteなどのDML操作を透明に書き換えることができ、これによりデータインポートシナリオのパフォーマンスが大幅に向上します。

1. Insert Intoデータのターゲットテーブルを作成する

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
透明な書き換えの後、そのステートメントは以下のようになります：

```sql
INSERT INTO target_table
SELECT *
FROM common_schedule_join_mv;
```
注意: DML操作でデータ変更を検出できない外部テーブルが関わる場合、透過的な書き換えにより最新のベーステーブルデータがリアルタイムでターゲットテーブルにインポートされない可能性があります。ユーザーがデータの不整合を許容できる場合、または自身でデータの整合性を保証できる場合は、以下のスイッチを有効にできます:

DMLにおいて、マテリアライズドビューにリアルタイムでデータを検出できない外部テーブルが含まれる場合に、構造情報に基づいたマテリアライズドビューの透過的書き換えを有効にするかどうか、デフォルトは無効

`SET enable_dml_materialized_view_rewrite_when_base_table_unawareness = true;`
