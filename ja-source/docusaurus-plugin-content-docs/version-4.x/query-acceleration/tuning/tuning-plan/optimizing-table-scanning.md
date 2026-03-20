---
{
  "title": "tableスキャンの最適化",
  "description": "Dorisは、高性能リアルタイム分析データウェアハウスとして、",
  "language": "ja"
}
---
## 概要

Dorisは、高性能なリアルタイム分析データウェアハウスとして、クエリパフォーマンスを大幅に向上させることができる強力なpartition pruning機能を提供しています。

パーティション pruningは、クエリの条件を分析することでクエリに関連するパーティションをインテリジェントに特定し、これらのパーティション内のデータのみをスキャンすることで、無関係なパーティションの不要なスキャンを回避するクエリ最適化技術です。このアプローチにより、I/O操作と計算負荷を大幅に削減し、クエリ実行を高速化することができます。

## ケース

以下は、Dorisのpartition pruning機能を実証する使用例です。

日付によってパーティション分割され、各日のデータが個別のパーティションに保存される`sales`という名前の売上データtableがあるとします。table構造は以下のように定義されています：

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
次に、2023年1月15日から2023年2月15日までの売上合計金額をクエリする必要があります。クエリステートメントは以下の通りです：

```sql
SELECT SUM(amount) AS total_amount
FROM sales
WHERE date BETWEEN '2023-01-15' AND '2023-02-15';
```
上記のクエリに対して、Dorisのpartition pruning最適化プロセスは以下の通りです：

1. Dorisはクエリ条件内のpartition列`date`を賢く分析し、クエリの日付範囲が'2023-01-15'から'2023-02-15'の間であることを特定します。
2. クエリ条件をpartition定義と比較することで、Dorisはスキャンが必要なpartitionの範囲を正確に特定します。この例では、partition `p2`と`p3`のみをスキャンする必要があります。これらの日付範囲がクエリ条件を完全にカバーしているためです。
3. Dorisは`p1`や`p4`など、クエリ条件に関係のないpartitionを自動的にスキップし、不要なデータスキャンを回避してI/Oオーバーヘッドを削減します。
4. 最後に、Dorisはpartition `p2`と`p3`内でのみデータスキャンと集計計算を実行し、クエリ結果を迅速に取得します。

`EXPLAIN`コマンドを使用することで、クエリ実行計画を確認し、Dorisのpartition pruning最適化が効果を発揮していることを確認できます。実行計画では、`OlapScanNode`ノードの`partition`属性が実際にスキャンされたpartitionとして`p2`と`p3`を表示します。

```sql
|   0:VOlapScanNode(212)                                                     |
|      TABLE: cir.sales(sales), PREAGGREGATION: ON                           |
|      PREDICATES: (date[#0] >= '2023-01-15') AND (date[#0] <= '2023-02-15') |
|      partitions=2/4 (p2,p3)                                                |
```
## 要約

要約すると、Dorisのパーティション剪定機能は、クエリ条件とパーティション間の関連性をインテリジェントに識別し、無関係なパーティションを自動的に剪定して、必要なデータのみをスキャンすることで、クエリパフォーマンスを大幅に向上させます。パーティション剪定機能を適切に活用することで、ユーザーは効率的なリアルタイム分析システムを構築し、大規模データのクエリ要求を容易に処理できます。
