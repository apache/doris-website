---
{
  "title": "Hintsの概要",
  "description": "Database Hintsは、データベースクエリオプティマイザが特定のプランを生成する方法を導くために使用されるクエリ最適化技術です。Hintsを提供することにより、",
  "language": "ja"
}
---
Database Hintは、データベースクエリオプティマイザーに特定のプランを生成する方法を導くために使用されるクエリ最適化技術です。Hintを提供することで、ユーザーはクエリオプティマイザーのデフォルト動作を微調整し、より良いパフォーマンスの実現や特定の要件の満足を期待できます。

:::caution Note
現在、Dorisは優れたout-of-the-box機能を備えています。ほとんどのシナリオにおいて、Dorisはユーザーがビジネスチューニングのためにhintを手動で制御することを必要とせず、様々な状況に対してパフォーマンスを適応的に最適化します。本章で紹介する内容は、主に専門的なチューニング担当者を対象としています。ビジネスユーザーは簡単に理解していただければ十分です。
:::

## Hint分類

Dorisは現在、leading hint、ordered hint、distribute hintを含むいくつかのタイプのhintをサポートしています：

- [Leading Hint](leading-hint.md)：leading hintで提供された順序に従って結合順序を指定します。
- [Ordered Hint](leading-hint.md)：元のテキストシーケンスとして結合順序を指定するleading hintの特定のタイプです。
- [Distribute Hint](distribute-hint.md)：結合のデータ分散方法をshuffleまたはbroadcastとして指定します。

## Hint例
大量のデータを含むtableを想像してください。特定のケースにおいて、tableの結合順序がクエリパフォーマンスに影響を与えることがわかっている場合があります。このような状況では、Leading Hintによってオプティマイザーに従わせたいtable結合順序を指定できます。

以下のSQLクエリを例にとります。実行効率が理想的でない場合、ユーザーの元のシナリオに影響を与えることを避け、チューニング目標を達成するために、元のSQLを変更することなく結合順序を調整したいと思うかもしれません。

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
この例では、Leading Hint `/*+ leading(t2 t1) */` が使用されています。Leading Hintは、指定されたTable（t2）を駆動Tableとして使用し、実行計画において（t1）より前に配置するようにオプティマイザーに指示します。

## Hint ログ

Hint Logは主に `EXPLAIN` の実行時にヒントが有効かどうかを表示するために使用されます。通常、`EXPLAIN` の出力の最下部に配置されます。

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
- `UnUsed` と `SyntaxError`：どちらもヒントが有効でないことを示します。SyntaxErrorは、ヒントの使用において構文エラーがある、または構文がサポートされていないことを示し、サポートされていない理由に関する追加情報が提供されます。

ユーザーは、Hintログを通じて有効性と無効性の理由を確認でき、調整と検証が容易になります。

## 概要

Hintは、実行プランを手動で管理するための強力なツールです。現在、Dorisはleading hint、ordered hint、distribute hintなどをサポートしており、ユーザーが結合順序、shuffleメソッド、その他の可変構成を手動で管理できるようにし、ユーザーにより便利で効果的な操作機能を提供します。
