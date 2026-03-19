---
{
  "title": "非同期マテリアライズドビューによる透過的リライト",
  "language": "ja",
  "description": "Async-materialized viewは、SPJG（SELECT-PROJECT-JOIN-GROUP-BY）パターンに基づく透過的な書き換えアルゴリズムを採用している。"
}
---
## 概要

[Async-materialized view](../../materialized-view/async-materialized-view/overview.md)は、SPJG（SELECT-PROJECT-JOIN-GROUP-BY）パターンに基づく透過的な書き換えアルゴリズムを採用しています。このアルゴリズムはクエリSQLの構造情報を分析し、適切なmaterialized viewを自動的に見つけ、最適なmaterialized viewを使用してクエリSQLを表現するための透過的な書き換えを試行することができます。materialized viewの事前計算された結果を使用することで、クエリパフォーマンスを大幅に向上させ、計算コストを削減することができます。

## ケース

次に、async-materialized viewを活用してクエリを高速化する方法を詳細に実演するために、例を使用します。

### ベーステーブルの作成

まず、tpchデータベースを作成し、その中に`orders`と`lineitem`という2つのテーブルを作成して、対応するデータを挿入します。

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

tpchベンチマークのいくつかの元のテーブルに基づいて、`mv1`という名前の非同期マテリアライズドビューを作成します。

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
### 透明な書き換えにマテリアライズドビューを使用する

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
`explain shape plan`から、`mv1`によって透過的に書き換えられた後のプランが既に`mv1`にヒットしていることが確認できます。また、`explain`を使用してマテリアライズドビューによって書き換えられた後のプランの現在の状態を確認することもできます。これには、ヒットしたかどうか、どのマテリアライズドビューにヒットしたかなどが含まれます。以下に示すとおりです：

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

async-materialized viewsを使用することで、特に複雑なjoinや集約クエリにおいて、クエリパフォーマンスを大幅に向上させることができます。これらを使用する際は、以下の点に注意する必要があります：

:::tip 使用上の提案
- 事前計算済み結果：Materialized viewsは事前にクエリ結果を計算して保存し、各クエリごとの繰り返し計算のオーバーヘッドを回避します。これは、頻繁に実行される必要がある複雑なクエリに対して特に効果的です。
- Join操作の削減：Materialized viewsは複数のテーブルのデータを1つのviewに結合することができ、クエリ時のjoin操作を削減してクエリ効率を向上させます。
- 自動更新：ベーステーブルのデータが変更された際、materialized viewsは自動的に更新されてデータの一貫性を維持できます。これにより、クエリ結果が常に最新のデータ状態を反映することが保証されます。
- ストレージオーバーヘッド：Materialized viewsは事前計算済み結果を保存するために追加のストレージスペースが必要です。Materialized viewsを作成する際は、クエリパフォーマンスの向上とストレージスペースの消費のバランスを取ることが必要です。
- メンテナンスコスト：Materialized viewsのメンテナンスには一定のシステムリソースと時間が必要です。頻繁に更新されるベーステーブルは、materialized viewsの更新オーバーヘッドが比較的高くなる可能性があります。そのため、実際の状況に応じて適切なリフレッシュ戦略を選択する必要があります。
- 適用シナリオ：Materialized viewsは、データ変更頻度が低く、クエリ頻度が高いシナリオに適しています。頻繁に変更されるデータについては、リアルタイム計算の方が適切な場合があります。
  :::

async-materialized viewsを合理的に活用することで、特に複雑なクエリと大量データの場合において、データベースのクエリパフォーマンスを大幅に向上させることができます。同時に、ストレージやメンテナンスなどの要素も総合的に考慮して、パフォーマンスとコストのバランスを実現する必要があります。
