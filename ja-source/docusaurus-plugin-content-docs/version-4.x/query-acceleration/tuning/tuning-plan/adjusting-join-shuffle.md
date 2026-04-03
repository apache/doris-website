---
{
  "title": "Hintを使用したJoin Shuffle Modeの調整",
  "description": "Dorisは、Join操作におけるデータshuffleの種類を調整するためのhintの使用をサポートしており、これによりクエリパフォーマンスを最適化します。",
  "language": "ja"
}
---
## 概要

DorisはhintをサポートしてJoin操作においてデータシャッフルの種類を調整することで、クエリパフォーマンスを最適化できます。このセクションでは、Dorisでhintを使用してJoin Shuffleタイプを指定する方法について詳細な手順を提供します。

:::caution Note
現在、Dorisには優れたout-of-the-box機能があります。つまり、ほとんどのシナリオにおいて、Dorisは様々なシナリオでパフォーマンスを適応的に最適化するため、ユーザーがパフォーマンスチューニングのためにhintを手動で制御する必要はありません。この章で紹介する内容は主に専門のチューナー向けであり、ビジネス担当者は簡単な理解のみで十分です。
:::

現在、DorisはJoinにおける右側のtableのDistribute タイプを指定するため、2つの独立した[Distribute Hint](../../../query-acceleration/hints/distribute-hint.md)、`[shuffle]`と`[broadcast]`をサポートしています。Distribute タイプはJoinの右側のtableの前に配置し、角括弧`[]`で囲む必要があります。さらに、DorisはLeading HintをDistribute Hintと組み合わせて使用することでシャッフルモードを指定できます（詳細については、[Reordering Join With Leading Hint](reordering-join-with-leading-hint.md)を参照してください）。

例は以下の通りです：

```sql
SELECT COUNT(*) FROM t2 JOIN [broadcast] t1 ON t1.c1 = t2.c2;
SELECT COUNT(*) FROM t2 JOIN [shuffle] t1 ON t1.c1 = t2.c2;
```
## Case

次に、例を通してDistribute Hintsの使用方法を説明します：

```sql
EXPLAIN SHAPE PLAN SELECT COUNT(*) FROM t1 JOIN t2 ON t1.c1 = t2.c2;
```
元のSQLのプランは以下の通りであり、t1とt2間の結合がハッシュ分散方式を使用していることを示しており、これは`DistributionSpecHash`によって示されています。

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
[broadcast] ヒントを追加した後：

```sql
EXPLAIN SHAPE PLAN SELECT COUNT(*) FROM t1 JOIN [broadcast] t2 ON t1.c1 = t2.c2;
```
t1とt2間のjoinの配布方法が、`DistributionSpecReplicated`で示されるbroadcast方式に変更されていることが確認できます。

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
## 概要

Distribute Hintsを適切に使用することで、Join操作のshuffleモードを最適化し、クエリパフォーマンスを向上させることができます。実際には、まずEXPLAINを使用してクエリ実行計画を分析し、実際の状況に基づいて適切なshuffleタイプを指定することが推奨されます。
