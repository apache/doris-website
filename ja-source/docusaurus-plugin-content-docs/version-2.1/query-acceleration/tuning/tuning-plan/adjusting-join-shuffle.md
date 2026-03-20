---
{
  "title": "ヒントによるJoin Shuffle Modeの調整",
  "language": "ja",
  "description": "Dorisは、Join操作におけるデータシャッフルのタイプを調整するためのヒントの使用をサポートしており、これによりクエリパフォーマンスを最適化します。"
}
---
<!-- 
Licensed to the Apache Software Foundation (ASF) under one
or more contributor license agreements.  See the NOTICE file
distributed with this work for additional information
regarding copyright ownership.  The ASF licenses this file
to you under the Apache License, Version 2.0 (the
"License"); you may not use this file except in compliance
with the License.  You may obtain a copy of the License at

  http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing,
software distributed under the License is distributed on an
"AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
KIND, either express or implied.  See the License for the
specific language governing permissions and limitations
under the License.
-->

## 概要

Dorisは、Join操作におけるデータshuffle形式を調整するためのhintの使用をサポートしており、これによりクエリパフォーマンスを最適化できます。このセクションでは、hintを使用してDorisでJoin Shuffle形式を指定する方法について詳細な手順を説明します。

:::caution 注意
現在、Dorisは優れたout-of-the-box機能を持っています。これは、ほとんどのシナリオにおいて、Dorisが様々な場面でパフォーマンスを適応的に最適化し、ユーザーがパフォーマンスチューニングのためにhintを手動で制御する必要がないことを意味します。この章で紹介する内容は主に専門的なチューナー向けであり、ビジネス担当者は簡単に理解するだけで十分です。
:::

現在、DorisはJoinにおける右側テーブルのDistribute タイプを指定するために、`[shuffle]`と`[broadcast]`の2つの独立した[Distribute Hint](../../../query-acceleration/hints/distribute-hint.md)をサポートしています。Distribute タイプは、Joinの右側テーブルの前に配置し、角括弧`[]`で囲む必要があります。さらに、DorisはLeading HintとDistribute Hintを組み合わせて使用することで、shuffle modeを指定できます（詳細については、[Reordering Join With Leading Hint](reordering-join-with-leading-hint.md)を参照してください）。

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
元のSQLのプランは以下の通りで、t1とt2間の結合が`DistributionSpecHash`で示されるハッシュ分散方式を使用していることを示しています。

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
t1とt2間のjoinの分散方式が、`DistributionSpecReplicated`で示されるブロードキャスト方式に変更されたことが確認できます。

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
## 要約

Distribute Hintsを適切に使用することで、Join操作のshuffle modeを最適化し、クエリのパフォーマンスを向上させることができます。実際には、まずEXPLAINを使用してクエリ実行計画を分析し、実際の状況に基づいて適切なshuffle typeを指定することが推奨されます。
