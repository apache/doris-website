---
{
  "title": "非同期マテリアライズドビューによる透過的リライト",
  "language": "ja",
  "description": "非同期マテリアライズドビューは、SPJG（SELECT-PROJECT-JOIN-GROUP-BY）パターンに基づく透過的な書き換えアルゴリズムを採用している。"
}
---
## 概要

[Async-materialized view](../../materialized-view/async-materialized-view/overview.md)は、SPJG（SELECT-PROJECT-JOIN-GROUP-BY）パターンに基づく透過的な書き換えアルゴリズムを採用しています。このアルゴリズムはクエリSQLの構造情報を分析し、適切なマテリアライズドビューを自動的に見つけ、最適なマテリアライズドビューを使用してクエリSQLを表現するための透過的な書き換えを試行します。マテリアライズドビューの事前計算された結果を使用することで、クエリパフォーマンスを大幅に改善し、計算コストを削減できます。

## ケース

次に、async-materialized viewを活用してクエリを高速化する方法を詳細に実演する例を示します。

### ベーステーブルの作成

まず、tpchデータベースを作成し、その中に`orders`と`lineitem`の2つのテーブルを作成し、対応するデータを挿入します。

```sql
CREATE DATABASE IF NOT EXISTS tpch;
USE tpch;

CREATE TABLE IF NOT EXISTS orders (
    o_orderkey       integer not null,
    o_custkey        integer not null,
    o_orderstatus    char(1) not null,
    o_totalprice     decimalv3(15,2) not null,
    o_orderdate      date not null,
    o_orderpriority  char(15) not null,
    o_clerk          char(15) not null,
    o_shippriority   integer not null,
    o_comment        varchar(79) not null
)
DUPLICATE KEY(o_orderkey, o_custkey)
PARTITION BY RANGE(o_orderdate)(
    FROM ('2023-10-17') TO ('2023-10-20') INTERVAL 1 DAY
)
DISTRIBUTED BY HASH(o_orderkey) BUCKETS 3
PROPERTIES ("replication_num" = "1");

INSERT INTO orders VALUES
    (1, 1, 'o', 99.5, '2023-10-17', 'a', 'b', 1, 'yy'),
    (2, 2, 'o', 109.2, '2023-10-18', 'c','d',2, 'mm'),
    (3, 3, 'o', 99.5, '2023-10-19', 'a', 'b', 1, 'yy');

CREATE TABLE IF NOT EXISTS lineitem (
    l_orderkey    integer not null,
    l_partkey     integer not null,
    l_suppkey     integer not null,
    l_linenumber  integer not null,
    l_quantity    decimalv3(15,2) not null,
    l_extendedprice  decimalv3(15,2) not null,
    l_discount    decimalv3(15,2) not null,
    l_tax         decimalv3(15,2) not null,
    l_returnflag  char(1) not null,
    l_linestatus  char(1) not null,
    l_shipdate    date not null,
    l_commitdate  date not null,
    l_receiptdate date not null,
    l_shipinstruct char(25) not null,
    l_shipmode     char(10) not null,
    l_comment      varchar(44) not null
)
DUPLICATE KEY(l_orderkey, l_partkey, l_suppkey, l_linenumber)
PARTITION BY RANGE(l_shipdate)
(FROM ('2023-10-17') TO ('2023-10-20') INTERVAL 1 DAY)
DISTRIBUTED BY HASH(l_orderkey) BUCKETS 3
PROPERTIES ("replication_num" = "1");

INSERT INTO lineitem VALUES
    (1, 2, 3, 4, 5.5, 6.5, 7.5, 8.5, 'o', 'k', '2023-10-17', '2023-10-17', '2023-10-17', 'a', 'b', 'yyyyyyyyy'),
    (2, 2, 3, 4, 5.5, 6.5, 7.5, 8.5, 'o', 'k', '2023-10-18', '2023-10-18', '2023-10-18', 'a', 'b', 'yyyyyyyyy'),
    (3, 2, 3, 6, 7.5, 8.5, 9.5, 10.5, 'k', 'o', '2023-10-19', '2023-10-19', '2023-10-19', 'c', 'd', 'xxxxxxxxx');
```
### 非同期マテリアライズドビューの作成

tpchベンチマークの複数の元テーブルに基づいて、`mv1`という名前の非同期マテリアライズドビューを作成します。

```sql
CREATE MATERIALIZED VIEW mv1   
BUILD IMMEDIATE REFRESH COMPLETE ON MANUAL
PARTITION BY(l_shipdate)  
DISTRIBUTED BY RANDOM BUCKETS 2  
PROPERTIES ('replication_num' = '1')   
AS   
SELECT l_shipdate, o_orderdate, l_partkey, l_suppkey, SUM(o_totalprice) AS sum_total  
FROM lineitem  
LEFT JOIN orders ON lineitem.l_orderkey = orders.o_orderkey AND l_shipdate = o_orderdate  
GROUP BY  
l_shipdate,  
o_orderdate,  
l_partkey,  
l_suppkey;
```
### Transparent RewritingでMaterialized Viewを使用する

```sql
mysql> explain shape plan SELECT l_shipdate, SUM(o_totalprice) AS total_price
    -> FROM lineitem
    -> LEFT JOIN orders ON lineitem.l_orderkey = orders.o_orderkey AND l_shipdate = o_orderdate
    -> WHERE l_partkey = 2 AND l_suppkey = 3
    -> GROUP BY l_shipdate;
+-------------------------------------------------------------------+
| Explain String(Nereids Planner)                                   |
+-------------------------------------------------------------------+
| PhysicalResultSink                                                |
| --PhysicalDistribute[DistributionSpecGather]                      |
| ----PhysicalProject                                               |
| ------hashAgg[GLOBAL]                                             |
| --------PhysicalDistribute[DistributionSpecHash]                  |
| ----------hashAgg[LOCAL]                                          |
| ------------PhysicalProject                                       |
| --------------filter((mv1.l_partkey = 2) and (mv1.l_suppkey = 3)) |
| ----------------PhysicalOlapScan[mv1]                             |
+-------------------------------------------------------------------+
```
`explain shape plan`から、`mv1`によって透過的に書き換えられた後のプランが既に`mv1`にヒットしていることが確認できます。また、`explain`を使用して、マテリアライズドビューによって書き換えられた後のプランの現在の状態を表示することもできます。これには、ヒットしているかどうか、どのマテリアライズドビューにヒットしているかなどが含まれます。以下に示すとおりです：

```sql
| ========== MATERIALIZATIONS ==========                                            |
|                                                                                   |
| MaterializedView                                                                  |
| MaterializedViewRewriteSuccessAndChose:                                           |
|   internal.tpch.mv1 chose,                                                        |
|                                                                                   |
| MaterializedViewRewriteSuccessButNotChose:                                        |
|   not chose: none,                                                                |
|                                                                                   |
| MaterializedViewRewriteFail:                                                      |
```
## 概要

async-materialized viewsを使用することで、特に複雑なjoinおよび集計クエリにおいて、クエリパフォーマンスを大幅に改善できます。使用する際は、以下の点に注意する必要があります：

:::tip 使用上の提案
- 事前計算された結果：Materialized viewsは事前にクエリ結果を計算して保存し、各クエリで繰り返し計算するオーバーヘッドを回避します。これは頻繁に実行する必要がある複雑なクエリに対して特に効果的です。
- Join操作の削減：Materialized viewsは複数のテーブルのデータを1つのビューに結合でき、クエリ時のjoin操作を削減し、クエリ効率を改善します。
- 自動更新：ベーステーブルのデータが変更されると、materialized viewsは自動的に更新され、データの整合性を維持できます。これにより、クエリ結果が常に最新のデータ状態を反映することが保証されます。
- 容量のオーバーヘッド：Materialized viewsは事前計算された結果を保存するために追加のストレージ容量が必要です。Materialized viewsを作成する際は、クエリパフォーマンスの向上とストレージ容量の消費のバランスを取る必要があります。
- メンテナンスコスト：Materialized viewsのメンテナンスには一定のシステムリソースと時間が必要です。頻繁に更新されるベーステーブルは、materialized viewsの更新オーバーヘッドが比較的高くなる可能性があります。したがって、実際の状況に応じて適切なリフレッシュ戦略を選択する必要があります。
- 適用シナリオ：Materialized viewsはデータ変更頻度が低く、クエリ頻度が高いシナリオに適しています。頻繁に変更されるデータに対しては、リアルタイム計算の方が適している場合があります。
:::

async-materialized viewsを合理的に利用することで、特に複雑なクエリと大容量データの場合において、データベースのクエリパフォーマンスを大幅に改善できます。同時に、ストレージやメンテナンスなどの要因も総合的に考慮し、パフォーマンスとコストのバランスを実現する必要があります。
