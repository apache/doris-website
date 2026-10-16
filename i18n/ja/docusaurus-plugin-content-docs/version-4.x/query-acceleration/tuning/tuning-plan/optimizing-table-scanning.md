---
{
    "title": "パーティションプルーニングによる最適化: Doris のクエリ性能チューニング",
    "sidebar_label": "パーティションプルーニングによる最適化",
    "language": "ja",
    "description": "Doris のパーティションプルーニングを使ってスキャンするデータ量を減らし、クエリを高速化する方法を、仕組み、SQL パターン、EXPLAIN による確認方法とともに例を交えて説明します。",
    "keywords": ["Doris のパーティションプルーニング", "パーティションプルーニング", "テーブルスキャンの最適化", "クエリ性能チューニング", "EXPLAIN パーティション"]
}
---

<!-- Knowledge type: Tuning guide -->
<!-- Applicable scenario: Slow large-table queries, high I/O overhead, need to filter data by partition columns -->

**パーティションプルーニング**は、クエリ条件に基づいて対象のパーティションを特定し、対象外のパーティションをスキップして必要なパーティションだけをスキャンするクエリ最適化手法です。

パーティションプルーニングにより、Doris は I/O と計算量を大幅に削減し、大規模テーブルに対するクエリを高速化できます。

**適用条件のチェックリスト**:

- テーブルが日付などの業務上の列でパーティション分割されている。
- クエリ条件にパーティション列のフィルターが含まれる（例: `WHERE date BETWEEN ...`）。
- スキャンするパーティション数を減らし、I/O を削減したい。
- プルーニングが有効かどうかを `EXPLAIN` で確認したい。

## 事例: 日付でパーティション分割された売上テーブル

<!-- Knowledge type: Operational example -->
<!-- Applicable scenario: Date-range queries, time-series data analysis -->

次の例で、Doris のパーティションプルーニングを説明します。

### 1. テーブルの作成: 日付による範囲パーティション分割

**目的**: 日付でパーティション分割し、ひと月ごとにパーティションを持つ売上データテーブル `sales` を作成します。

**コマンド**:

```sql
CREATE TABLE sales (
    date DATE,
    product VARCHAR(50),
    amount DECIMAL(10, 2)
)
PARTITION BY RANGE(date) (
    PARTITION p1 VALUES LESS THAN ('2023-01-01'),
    PARTITION p2 VALUES LESS THAN ('2023-02-01'),
    PARTITION p3 VALUES LESS THAN ('2023-03-01'),
    PARTITION p4 VALUES LESS THAN ('2023-04-01')
)
DISTRIBUTED BY HASH(date) BUCKETS 16
PROPERTIES
(
    "replication_num" = "1"
);
```

**説明**: パーティション列は `date` です。パーティションは全部で 4 つあり、それぞれひと月分のデータを対象とします。

### 2. クエリ: パーティション列でのフィルター

**目的**: 2023 年の一月 15 日から 2023 年の二月 15 日までの売上合計を取得します。

**コマンド**:

```sql
SELECT SUM(amount) AS total_amount
FROM sales
WHERE date BETWEEN '2023-01-15' AND '2023-02-15';
```

**説明**: `WHERE` 句にはパーティション列 `date` の範囲フィルターが含まれています。これがパーティションプルーニングを発動させる鍵です。

### 3. パーティションプルーニングの実行過程

| ステップ | Doris の動作 | 結果 |
| :--- | :--- | :--- |
| 1 | クエリ条件に含まれるパーティション列 `date` を解析する | `2023-01-15` から `2023-02-15` までの日付範囲を特定する |
| 2 | クエリ条件とパーティション定義を比較する | パーティション `p2` と `p3` が対象になる |
| 3 | 対象外のパーティションを自動的にスキップする | `p1` と `p4` をスキップする |
| 4 | 対象のパーティションだけをスキャンして集計する | 結果を迅速に返す |

### 4. EXPLAIN によるプルーニングの確認

<!-- Knowledge type: Verification method -->
<!-- Applicable scenario: Confirm whether the optimization takes effect -->

**目的**: `EXPLAIN` コマンドで実行計画を表示し、実際にスキャンされるパーティション数を確認します。

**コマンド**:

```sql
EXPLAIN SELECT SUM(amount) AS total_amount
FROM sales
WHERE date BETWEEN '2023-01-15' AND '2023-02-15';
```

**主要な出力**:

```text
|   0:VOlapScanNode(212)                                                     |
|      TABLE: cir.sales(sales), PREAGGREGATION: ON                           |
|      PREDICATES: (date[#0] >= '2023-01-15') AND (date[#0] <= '2023-02-15') |
|      partitions=2/4 (p2,p3)                                                |
```

**説明**: `partitions=2/4 (p2,p3)` は `OlapScanNode` 上のフィールドで、4 つのパーティションのうち `p2` と `p3` の 2 つだけがスキャンされることを示します。つまり、パーティションプルーニングが有効です。

## 比較: プルーニングが有効な場合と無効な場合

<!-- Knowledge type: Comparison table -->
<!-- Applicable scenario: Quickly determine whether a query can benefit from pruning optimization -->

| 比較項目 | パーティションプルーニングが有効 | パーティションプルーニングが無効 |
| :--- | :--- | :--- |
| クエリ条件 | パーティション列のフィルターを含む | パーティション列の条件がない、またはパーティション列に関数を適用している |
| スキャンするパーティション数 | 対象のパーティションだけをスキャンする | すべてのパーティションをスキャンする |
| I/O 負荷 | 低い | 高い |
| EXPLAIN の出力 | `partitions=N/M` (N < M) | `partitions=M/M` |

## よくある質問

<!-- Knowledge type: FAQ -->
<!-- Applicable scenario: Troubleshooting when pruning is not effective -->

### Q1: クエリが遅く、パーティションプルーニングが有効になっていないと思われます。どう確認すればよいですか？

`EXPLAIN <query>` を実行し、`partitions=N/M` フィールドを `OlapScanNode` で確認します。`N == M` なら、すべてのパーティションがスキャンされており、プルーニングは有効になっていません。

### Q2: `WHERE` 句にパーティション列を指定しているのに、すべてのパーティションがスキャンされるのはなぜですか？

主な原因は次のとおりです。

- パーティション列に関数が適用されている（例: `DATE_FORMAT(date, ...)`）ため、オプティマイザーが範囲を導出できない。
- 型が一致していない（例: パーティション列が `DATE` 型で、フィルター値が暗黙的に変換できない文字列である）。
- パーティション列以外の条件が `OR` で結合されているため、条件をプッシュダウンできない。

### Q3: パーティションプルーニングとバケットプルーニングの違いは何ですか？

- **パーティションプルーニング**: `PARTITION BY` 列に基づいてパーティションを絞り込みます。
- **バケットプルーニング / タブレットプルーニング**: `DISTRIBUTED BY HASH` 列の等価条件に基づいてタブレットを絞り込みます。
両方を組み合わせることで、スキャンするデータ量をさらに減らせます。

## まとめ

<!-- Knowledge type: Key takeaways -->
<!-- Applicable scenario: Implementation recommendations -->

- パーティションプルーニングは、クエリ条件とパーティションの対応関係を自動的に特定し、必要なパーティションだけをスキャンします。
- 主な前提条件は、テーブルが業務上の列でパーティション分割され、クエリにパーティション列のプッシュダウン可能なフィルター条件が含まれることです。
- `partitions=N/M` フィールドを `EXPLAIN` で確認すると、プルーニングが有効かどうかを素早く判断できます。
- パーティションプルーニングを適切に活用すると、I/O と計算の負荷を大幅に削減し、大規模なデータセットに対するクエリを高速化できます。
