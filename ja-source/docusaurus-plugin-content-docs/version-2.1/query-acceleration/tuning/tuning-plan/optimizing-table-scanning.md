---
{
  "title": "テーブルスキャンの最適化",
  "language": "ja",
  "description": "Dorisは高性能なリアルタイム分析データウェアハウスとして、"
}
---
## 概要

高性能リアルタイム分析データウェアハウスであるDorisは、クエリパフォーマンスを大幅に向上させる強力なpartition pruning機能を提供しています。

パーティション pruningは、クエリの条件を分析してクエリに関連するパーティションを智能的に特定し、これらのパーティション内のデータのみをスキャンすることで、無関係なパーティションの不要なスキャンを回避するクエリ最適化技術です。このアプローチにより、I/O操作と計算負荷を大幅に削減し、クエリ実行を高速化できます。

## ケース

以下は、Dorisのpartition pruning機能を実演する使用例です。

日付でパーティション化され、各日のデータが個別のパーティションに格納されている`sales`という名前の売上データテーブルがあるとします。テーブル構造は以下のように定義されています：

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
次に、2023年1月15日から2023年2月15日までの総売上金額を照会する必要があります。クエリステートメントは以下の通りです：

```sql
SELECT SUM(amount) AS total_amount
FROM sales
WHERE date BETWEEN '2023-01-15' AND '2023-02-15';
```
上記のクエリに対して、Dorisのpartition pruning最適化プロセスは以下の通りです：

1. Dorisはクエリ条件内のpartition列`date`を知能的に解析し、クエリの日付範囲が'2023-01-15'と'2023-02-15'の間であることを識別します。
2. クエリ条件をpartition定義と比較することで、Dorisはスキャンが必要なpartitionの範囲を正確に特定します。この例では、partition `p2`と`p3`のみをスキャンする必要があります。これらの日付範囲がクエリ条件を完全にカバーしているためです。
3. Dorisは`p1`や`p4`など、クエリ条件に関係のないpartitionを自動的にスキップし、不要なデータスキャンを回避してI/Oオーバーヘッドを削減します。
4. 最終的に、Dorisはpartition `p2`と`p3`内でのみデータスキャンと集約計算を実行し、クエリ結果を迅速に取得します。

`EXPLAIN`コマンドを使用することで、クエリ実行計画を確認し、Dorisのpartition pruning最適化が有効になっていることを確認できます。実行計画では、`OlapScanNode`ノードの`partition`属性に実際にスキャンされるpartitionとして`p2`と`p3`が表示されます。

```sql
|   0:VOlapScanNode(212)                                                     |
|      TABLE: cir.sales(sales), PREAGGREGATION: ON                           |
|      PREDICATES: (date[#0] >= '2023-01-15') AND (date[#0] <= '2023-02-15') |
|      partitions=2/4 (p2,p3)                                                |
```
## 概要

要約すると、Dorisのパーティションプルーニング機能は、クエリ条件とパーティション間の関連性を賢く識別し、無関係なパーティションを自動的にプルーニングし、必要なデータのみをスキャンすることで、クエリパフォーマンスを大幅に向上させることができます。パーティションプルーニング機能を適切に活用することで、ユーザーは効率的なリアルタイム分析システムを構築し、大量データのクエリ要求を簡単に処理することができます。
