---
{
  "title": "ヒントの概要",
  "language": "ja",
  "description": "データベースヒントは、データベースクエリオプティマイザに対して特定のプランを生成する方法を指示するために使用されるクエリ最適化技術です。ヒントを提供することにより、"
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

Database Hintは、データベースクエリオプティマイザに対して特定のプランを生成する方法を指示するクエリ最適化技術です。Hintを提供することで、ユーザーはクエリオプティマイザのデフォルト動作を微調整し、より良いパフォーマンスの実現や特定の要件を満たすことを目指すことができます。
:::caution Note
現在、Dorisは優れた開封即用の機能を持っています。ほとんどのシナリオでは、Dorisはユーザーがビジネス調整のためにhintを手動で制御する必要なく、さまざまな状況でパフォーマンスを適応的に最適化します。この章で紹介する内容は主に専門的な調整担当者を対象としています。ビジネスユーザーは簡単に理解しておく程度で構いません。
:::

## Hint分類

Dorisは現在、leading hint、ordered hint、distribute hintを含む複数タイプのhintをサポートしています：

- [Leading Hint](leading-hint.md)：leading hintで提供された順序に従って結合順序を指定します。
- [Ordered Hint](leading-hint.md)：元のテキストシーケンスとして結合順序を指定するleading hintの特定のタイプです。
- [Distribute Hint](distribute-hint.md)：結合のデータ分散方法をshuffleまたはbroadcastとして指定します。

## Hint例
大量のデータを持つテーブルを想像してください。特定のケースでは、テーブルの結合順序がクエリパフォーマンスに影響することを知っている場合があります。このような状況では、Leading Hintを使用してオプティマイザに従わせたいテーブル結合順序を指定できます。

以下のSQLクエリを例に取ります。実行効率が理想的でない場合、ユーザーの元のシナリオに影響を与えることなく元のSQLを変更せずに結合順序を調整し、調整目標を達成したい場合があります。

```sql
mysql> explain shape plan select * from t1 join t2 on t1.c1 = c2;
+-------------------------------------------+
| Explain String                            |
+-------------------------------------------+
| PhysicalResultSink                        |
| --PhysicalDistribute                      |
| ----PhysicalProject                       |
| ------hashJoin[INNER_JOIN](t1.c1 = t2.c2) |
| --------PhysicalOlapScan[t2]              |
| --------PhysicalDistribute                |
| ----------PhysicalOlapScan[t1]            |
+-------------------------------------------+
```
この場合、Leading Hintを使用してt1とt2の結合順序を任意に変更することができます。例えば：

```sql
mysql> explain shape plan select  /*+ leading(t2 t1) */ * from t1 join t2 on t1.c1 = c2;
+-----------------------------------------------------------------------------------------------------+
| Explain String(Nereids Planner)                                                                     |
+-----------------------------------------------------------------------------------------------------+
| PhysicalResultSink                                                                                  |
| --PhysicalDistribute                                                                                |
| ----PhysicalProject                                                                                 |
| ------hashJoin[INNER_JOIN] hashCondition=((t1.c1 = t2.c2)) otherCondition=() build RFs:RF0 c1->[c2] |
| --------PhysicalOlapScan[t2] apply RFs: RF0                                                         |
| --------PhysicalDistribute                                                                          |
| ----------PhysicalOlapScan[t1]                                                                      |
|                                                                                                     |
| Hint log:                                                                                           |
| Used: leading(t2 t1)                                                                                |
| UnUsed:                                                                                             |
| SyntaxError:                                                                                        |
+-----------------------------------------------------------------------------------------------------+
```
この例では、Leading Hint `/*+ leading(t2 t1) */` が使用されています。Leading Hintは、指定されたテーブル（t2）を駆動表として使用し、実行計画において（t1）より前に配置するようオプティマイザーに指示します。

## Hint Log

Hint Logは主に、`EXPLAIN`実行時にhintが有効かどうかを表示するために使用されます。通常、`EXPLAIN`出力の下部に表示されます。

Hint Logには3つのステータスがあります：

```sql
+---------------------------------+
| Hint log:                       |
| Used:                           |
| UnUsed:                         |
| SyntaxError:                    |
+---------------------------------+
```
- `Used`：ヒントが有効であることを示します。
- `UnUsed` と `SyntaxError`：どちらもヒントが有効でないことを示します。SyntaxErrorは、ヒントの使用に構文エラーがある、または構文がサポートされていないことを示し、サポートされていない理由に関する追加情報が提供されます。

ユーザーはHintログを通じて有効性と無効性の理由を確認できるため、調整と検証が容易になります。

## まとめ

ヒントは実行プランを手動で管理するための強力なツールです。現在、Dorisはleading hint、ordered hint、distribute hintなどをサポートしており、ユーザーは結合順序、shuffleメソッド、その他の変数設定を手動で管理できるため、より便利で効果的な操作機能をユーザーに提供します。
