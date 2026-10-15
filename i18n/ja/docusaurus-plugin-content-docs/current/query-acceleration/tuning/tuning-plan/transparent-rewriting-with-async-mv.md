---
{
    "title": "非同期マテリアライズドビューによる透過的な書き換え：複雑なクエリの高速化",
    "sidebar_label": "非同期 MV による透過的な書き換え",
    "language": "ja",
    "description": "Doris の非同期マテリアライズドビューを使用して透過的な書き換えを行う方法を説明します。SPJG に基づく書き換えアルゴリズム、実践例、ビューの使用を確認する方法を通じて、複雑な結合・集約クエリの高速化を支援します。",
    "keywords": ["Doris 非同期マテリアライズドビュー", "透過的な書き換え", "SPJG", "クエリの高速化", "explain shape plan", "マテリアライズドビューの使用確認"]
}
---

<!-- Knowledge type: Concept + How-to guide -->
<!-- Applicable scenario: Performance optimization for complex JOIN/aggregation queries -->

非同期マテリアライズドビューによる透過的な書き換えでは、Doris がクエリの SQL 構造を自動的に解析し、既存のマテリアライズドビューを使用する同等のクエリに書き換えます。事前計算された結果を再利用することで、クエリを高速化できます。

## 事前に確認すること

- [非同期マテリアライズドビュー](../../materialized-view/async-materialized-view/overview.md)の基本概念を理解していること。
- SQL と `EXPLAIN` の使用経験があること。
- クエリが SPJG（SELECT-PROJECT-JOIN-GROUP-BY）パターンに従っていること。
- マテリアライズドビューを作成し、テーブルをクエリする権限があること。

## 概要

<!-- Knowledge type: Concept -->
<!-- Applicable scenario: Understanding the principles of transparent rewriting -->

[非同期マテリアライズドビュー](../../materialized-view/async-materialized-view/overview.md)では、SPJG（SELECT-PROJECT-JOIN-GROUP-BY）パターンに基づく透過的な書き換えアルゴリズムを使用します。

このアルゴリズムの主な機能は次のとおりです。

- **構造の解析**：クエリの SQL の論理構造を自動的に解析します。
- **ビューの照合**：既存のマテリアライズドビューから、利用できる候補を探します。
- **透過的な書き換え**：元の SQL を変更せずに、マテリアライズドビューを使用する同等のクエリに書き換えます。
- **性能の向上**：事前計算された結果を再利用し、クエリを高速化して計算コストを削減します。

## 適用シナリオ

<!-- Knowledge type: Decision reference -->
<!-- Applicable scenario: Deciding whether to use transparent rewriting -->

| シナリオの特徴 | 透過的な書き換えの推奨度 | 説明 |
| --- | --- | --- |
| 複雑な JOIN と GROUP BY を含むクエリ | 推奨 | SPJG パターンに自然に適合します |
| 集約クエリを高頻度で繰り返す場合 | 推奨 | 事前計算の効果が高くなります |
| ベーステーブルのデータ変更頻度が低い場合 | 推奨 | メンテナンスコストを抑えられます |
| ベーステーブルのデータ変更頻度が高い場合 | 非推奨 | マテリアライズドビューの更新負荷が高くなります |
| 単純なポイントクエリのみの場合 | 非推奨 | 事前計算による効果は限定的です |
| ストレージ容量に余裕がない場合 | 慎重に使用 | マテリアライズドビューには追加のストレージが必要です |

## 実践例：マテリアライズドビューによるクエリの高速化

<!-- Knowledge type: How-to guide -->
<!-- Applicable scenario: End-to-end implementation of transparent rewriting -->

次の一連の例では、TPC-H データセットを使用して、透過的な書き換えの手順全体を示します。

### ステップ 1：ベーステーブルを作成する

**目的**：デモ用の `orders` テーブルと `lineitem` テーブルを作成し、データをロードします。

**コマンド**：

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

**補足**：どちらのテーブルも日付でパーティション分割されているため、マテリアライズドビューをパーティション単位で更新しやすくなります。

### ステップ 2：非同期マテリアライズドビューを作成する

**目的**：事前集約された非同期マテリアライズドビュー `mv1` を、`lineitem` と `orders` に基づいて作成します。

**コマンド**：

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

**主なパラメータ**：

| パラメータ | 値 | 説明 |
| --- | --- | --- |
| `BUILD IMMEDIATE` | 即時ビルド | 作成直後にデータをマテリアライズします |
| `REFRESH COMPLETE ON MANUAL` | 手動による全量更新 | ユーザーが更新を実行します |
| `PARTITION BY(l_shipdate)` | パーティションキーによる分割 | ベーステーブルのパーティションと揃え、増分メンテナンスを可能にします |
| `DISTRIBUTED BY RANDOM BUCKETS 2` | ランダムなバケット分割 | 分散設定を簡単にします |

### ステップ 3：クエリを実行し、透過的な書き換えを確認する

**目的**：クエリが `mv1` を使用する実行プランに書き換えられたことを確認します。

**コマンド**：

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

**補足**：実行プランの末尾に `PhysicalOlapScan[mv1]` が表示されます。これは、クエリが透過的に書き換えられ、`mv1` が使用されたことを示します。

### ステップ 4：書き換えの状態を詳しく確認する

**目的**：`explain` を使用し、書き換えの状態をさらに詳しく確認します。

**コマンド**：

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

**主なフィールド**：

| フィールド | 意味 |
| --- | --- |
| `MaterializedViewRewriteSuccessAndChose` | 書き換えに成功し、オプティマイザに選択されました |
| `MaterializedViewRewriteSuccessButNotChose` | 書き換えに成功しましたが、選択されませんでした（コストが最適ではありません） |
| `MaterializedViewRewriteFail` | 書き換えに失敗しました |

## 利用時の推奨事項

<!-- Knowledge type: Best practice -->
<!-- Applicable scenario: Materialized view design and operations -->

:::tip 利用時の推奨事項

- **事前計算された結果**：マテリアライズドビューはクエリ結果を事前に計算して保存するため、クエリのたびに計算を繰り返す必要がありません。頻繁に実行する複雑なクエリに適しています。
- **結合処理の削減**：複数のテーブルのデータを単一のビューにまとめることで、クエリ実行時の結合処理を減らし、効率を向上できます。
- **自動更新**：ベーステーブルのデータが変わったとき、マテリアライズドビューを自動更新し、クエリ結果に最新のデータを反映できます。
- **ストレージ負荷**：マテリアライズドビューには追加のストレージが必要です。作成時には、クエリ性能とストレージコストのバランスを考慮してください。
- **メンテナンスコスト**：マテリアライズドビューの維持にはシステムリソースを消費します。ベーステーブルの更新頻度が高い場合、更新負荷も高くなるため、適切な更新戦略を選んでください。
- **適用シナリオ**：マテリアライズドビューは、データ変更の頻度が低く、クエリの実行頻度が高い場合に適しています。データが頻繁に変わる場合は、リアルタイム計算のほうが適切なことがあります。

:::

## FAQ

<!-- Knowledge type: FAQ -->
<!-- Applicable scenario: Troubleshooting rewriting misses and lower-than-expected performance -->

### Q1：クエリでマテリアライズドビューが使用されない場合はどうすればよいですか？

次の順序で調査してください。

1. `explain` を使用し、`MATERIALIZATIONS` セクションに `RewriteFail` の情報があるか確認します。
2. クエリが SPJG（SELECT-PROJECT-JOIN-GROUP-BY）パターンに従っていることを確認します。
3. マテリアライズドビューのフィールドに、クエリが必要とする列がすべて含まれているか確認します。
4. マテリアライズドビューが使用可能な状態か確認します（ビルド済みで、無効化されていないこと）。

### Q2：書き換えに成功しても選択されないのはなぜですか？

`MaterializedViewRewriteSuccessButNotChose` は、オプティマイザが書き換え後のプランのコストを元のプランより高いと判断したことを意味します。次の方法を試してください。

- マテリアライズドビューのパーティション分割とバケット分割の戦略を調整します。
- `ANALYZE` で統計情報を収集し、オプティマイザのコスト推定の精度を高めます。

### Q3：マテリアライズドビューの更新が遅すぎる場合はどうすればよいですか？

- 全量更新より増分更新を優先します。
- マテリアライズドビューのパーティションキーをベーステーブルのキーと揃え、パーティション単位で更新します。
- ベーステーブルの書き込み頻度を評価し、ピーク時には更新を実行しないようにします。

### Q4：書き換えでマテリアライズドビューが使用されたことを確認するにはどうすればよいですか？

`EXPLAIN` または `EXPLAIN SHAPE PLAN` を実行し、次の点を確認します。

- プランに `PhysicalOlapScan[mv name]` が表示されているか。
- `RewriteSuccessAndChose` に対象のマテリアライズドビューが含まれているか（`MATERIALIZATIONS` セクション内）。

### よく見られるエラーのキーワード

- `MaterializedViewRewriteFail`：書き換えに失敗しました。一般的な原因は、SQL が SPJG パターンに適合しないこと、または必要なフィールドがないことです。
- `not chose`：書き換えに成功しましたが、選択されませんでした。通常はコスト推定の問題です。
- `MV is not in NORMAL state`：マテリアライズドビューが正常ではない状態です。更新履歴を確認してください。

## まとめ

非同期マテリアライズドビューを適切に使用すると、大規模なデータセットに対する複雑な結合・集約クエリの性能を大きく改善できます。導入時には、ストレージコスト、更新負荷、データの鮮度を合わせて検討し、性能とコストのバランスを取ってください。
