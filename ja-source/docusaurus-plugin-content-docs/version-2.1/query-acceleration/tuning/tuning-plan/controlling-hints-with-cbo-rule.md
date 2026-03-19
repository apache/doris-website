---
{
  "title": "ヒントによるCBOルールの制御",
  "language": "ja",
  "description": "クエリオプティマイザーは実行プランを生成する際に一連のルールを適用します。"
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

クエリオプティマイザーは実行プランを生成する際に一連のルールを適用します。これらのルールは主に2つのタイプに分類されます：Rule-Based Optimizer（RBO）とCost-Based Optimizer（CBO）です。

- RBO：このタイプの最適化は、特定のデータ統計を考慮せずに事前定義されたヒューリスティックルールのセットを適用してクエリプランを改善します。述語プッシュダウンや射影プッシュダウンなどの戦略がこのカテゴリに該当します。
- CBO：このタイプの最適化は、データ統計を活用して異なる実行プランのコストを推定し、実行に最もコストの低いプランを選択します。これにはアクセスパスとjoinアルゴリズムの選択が含まれます。

場合によっては、データベース管理者や開発者がクエリ最適化プロセスをより細かく制御する必要があるかもしれません。これに基づいて、本ドキュメントではクエリヒントを使用してCBOルールを管理する方法について説明します。

:::caution 注意
現在、Dorisには優れたout-of-the-box機能があります。これは、ほとんどのシナリオにおいて、Dorisは様々なシナリオでパフォーマンスを適応的に最適化し、ユーザーがパフォーマンスチューニングのためにヒントを手動で制御する必要がないことを意味します。本章で紹介する内容は主に専門のチューナー向けであり、業務担当者は簡単な理解で十分です。
:::

CBOルール制御ヒントの基本構文は以下の通りです：

```sql
SELECT /*+ USE_CBO_RULE(rule1, rule2, ...) */ ...
```
このヒントは`SELECT`キーワードの直後に記述され、括弧内で有効にするルールの名前を指定します（ルール名は大文字小文字を区別しません）。

現在、Dorisオプティマイザーは複数のコストベースリライトをサポートしており、`USE_CBO_RULE`ヒントを使用して明示的に有効にすることができます。例えば：

- PUSH_DOWN_AGG_THROUGH_JOIN
- PUSH_DOWN_AGG_THROUGH_JOIN_ONE_SIDE
- PUSH_DOWN_DISTINCT_THROUGH_JOIN

## ケース

クエリの例は以下の通りです：

```sql
explain shape plan
    select /*+ USE_CBO_RULE(push_down_agg_through_join_one_side) */
            a.event_id,
            b.group_id,
            COUNT(a.event_id)
    from a
    join b on
            a.device_id = b.device_id
    group by
            a.event_id,
            b.group_id
    ;
```
この例では、集約プッシュダウンのCBOルールが有効になっています。この操作により、テーブルaを結合操作の前に集約することができ、結合のコストを削減してクエリを高速化します。プッシュダウン後のプランは以下の通りです：

```sql
PhysicalResultSink
--hashAgg[GLOBAL]
----hashAgg[LOCAL]
------hashJoin[INNER_JOIN] hashCondition=((a.device_id = b.device_id)) otherCondition=()
--------hashAgg[LOCAL]
----------PhysicalOlapScan[a]
--------filter((cast(experiment_id as DOUBLE) = 73.0))
----------PhysicalOlapScan[b]
```
## 概要

`USE_CBO_RULE`ヒントの適切な使用により、特定の高度なCBO最適化ルールを手動で有効にし、特定のシナリオでパフォーマンスを最適化することができます。ただし、CBO最適化ルールの使用には、クエリ最適化プロセスとデータ特性の深い理解が必要です。ほとんどの場合、Dorisオプティマイザーの自動決定に依存することが依然として最良の選択です。
