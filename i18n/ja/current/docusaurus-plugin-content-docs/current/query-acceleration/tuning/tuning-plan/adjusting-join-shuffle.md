---
{
  "title": "ヒントによるJoin Shuffle Modeの調整",
  "language": "ja",
  "description": "DorisはJoin操作におけるデータshuffleの種類を調整するためのhintの使用をサポートし、それによりクエリパフォーマンスを最適化します。"
}
---
## 概要

Doris は Join 操作におけるデータシャッフルの種類を調整するためのヒントの使用をサポートしており、これによりクエリパフォーマンスを最適化できます。このセクションでは、ヒントを使用して Doris で Join Shuffle の種類を指定する方法について詳細な手順を提供します。

:::caution 注意
現在、Doris は優れた out-of-the-box 機能を持っています。これは、ほとんどのシナリオにおいて、Doris が様々なシナリオでパフォーマンスを適応的に最適化することを意味し、ユーザーはパフォーマンスチューニングのためにヒントを手動で制御する必要がありません。この章で紹介する内容は主に専門的なチューナー向けであり、業務担当者は簡単な理解のみが必要です。
:::

現在、Doris は 2 つの独立した [Distribute Hint](../../../query-acceleration/hints/distribute-hint.md)、`[shuffle]` と `[broadcast]` をサポートしており、Join における右側のテーブルの Distribute Type を指定できます。Distribute Type は Join における右側のテーブルの前に配置し、角括弧 `[]` で囲む必要があります。さらに、Doris は Leading Hint と Distribute Hint を組み合わせて使用することでシャッフルモードを指定できます（詳細については、[Reordering Join With Leading Hint](reordering-join-with-leading-hint.md) を参照してください）。

例は以下の通りです：

```sql
SELECT COUNT(*) FROM t2 JOIN [broadcast] t1 ON t1.c1 = t2.c2;
SELECT COUNT(*) FROM t2 JOIN [shuffle] t1 ON t1.c1 = t2.c2;
```
## Case

次に、例を通じてDistribute Hintsの使用方法を説明します：

```sql
EXPLAIN SHAPE PLAN SELECT COUNT(*) FROM t1 JOIN t2 ON t1.c1 = t2.c2;
```
元のSQLの実行プランは以下の通りで、t1とt2の結合がハッシュ分散方式を使用していることを示しており、これは`DistributionSpecHash`で表されています。

```sql
+----------------------------------------------------------------------------------+
| Explain String (Nereids Planner)                                                 |
+----------------------------------------------------------------------------------+
| PhysicalResultSink                                                               |
| --hashAgg [GLOBAL]                                                               |
| ----PhysicalDistribute [DistributionSpecGather]                                  |
| ------hashAgg [LOCAL]                                                            |
| --------PhysicalProject                                                          |
| ----------hashJoin [INNER_JOIN] hashCondition=((t1.c1 = t2.c2)) otherCondition=()|
| ------------PhysicalProject                                                      |
| --------------PhysicalOlapScan [t1]                                              |
| ------------PhysicalDistribute [DistributionSpecHash]                            |
| --------------PhysicalProject                                                    |
| ----------------PhysicalOlapScan [t2]                                            |
+----------------------------------------------------------------------------------+
```
[broadcast] ヒントを追加した後:

```sql
EXPLAIN SHAPE PLAN SELECT COUNT(*) FROM t1 JOIN [broadcast] t2 ON t1.c1 = t2.c2;
```
t1とt2間のjoinに対する分散方式が、`DistributionSpecReplicated`で示されるbroadcast方式に変更されていることがわかります。

```sql
+----------------------------------------------------------------------------------+
| Explain String (Nereids Planner)                                                 |
+----------------------------------------------------------------------------------+
| PhysicalResultSink                                                               |
| --hashAgg [GLOBAL]                                                               |
| ----PhysicalDistribute [DistributionSpecGather]                                  |
| ------hashAgg [LOCAL]                                                            |
| --------PhysicalProject                                                          |
| ----------hashJoin [INNER_JOIN] hashCondition=((t1.c1 = t2.c2)) otherCondition=()|
| ------------PhysicalProject                                                      |
| --------------PhysicalOlapScan [t1]                                              |
| ------------PhysicalDistribute [DistributionSpecReplicated]                      |
| --------------PhysicalProject                                                    |
| ----------------PhysicalOlapScan [t2]                                            |
+----------------------------------------------------------------------------------+
```
## まとめ

Distribute Hintsを適切に使用することで、Join操作のシャッフルモードを最適化し、クエリのパフォーマンスを向上させることができます。実際には、まずEXPLAINを使用してクエリ実行計画を分析し、実際の状況に基づいて適切なシャッフルタイプを指定することが推奨されます。
