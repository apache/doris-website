---
{
  "title": "Hintの概要",
  "description": "Database Hintsは、データベースクエリオプティマイザーに対して特定のプランを生成する方法を指示するために使用されるクエリ最適化技術です。Hintsを提供することにより、",
  "language": "ja"
}
---
Database Hintsは、データベースクエリオプティマイザーが特定のプランを生成する方法をガイドするために使用されるクエリ最適化技術です。Hintsを提供することで、ユーザーはクエリオプティマイザーのデフォルトの動作を微調整し、より良いパフォーマンスを実現したり、特定の要件を満たしたりすることを期待できます。

:::caution Note
現在、Dorisは優れたout-of-the-box機能を備えています。ほとんどのシナリオにおいて、Dorisはユーザーがビジネスチューニングのためにhintsを手動で制御する必要なく、様々な状況でパフォーマンスを適応的に最適化します。この章で紹介する内容は、主に専門的なチューニング担当者を対象としています。ビジネスユーザーは概要を理解していただければ十分です。
:::

## Hintの分類

Dorisは現在、leading hint、ordered hint、distribute hintを含む複数のタイプのhintsをサポートしています：

- [Leading Hint](leading-hint.md)：leading hintで提供された順序に従って結合順序を指定します。
- [Ordered Hint](leading-hint.md)：元のテキストシーケンスとして結合順序を指定する特定のタイプのleading hintです。
- [Distribute Hint](distribute-hint.md)：結合のデータ配布方法をshuffleまたはbroadcastのいずれかとして指定します。

## Hintの例
大量のデータを持つtableを想像してください。特定のケースにおいて、tableの結合順序がクエリパフォーマンスに影響を与える可能性があることを知っている場合があります。このような状況では、Leading Hintを使用してオプティマイザーに従わせたいtable結合順序を指定することができます。

以下のSQLクエリを例として取り上げます。実行効率が理想的でない場合、ユーザーの元のシナリオに影響を与えることを避け、チューニング目標を達成するために、元のSQLを変更することなく結合順序を調整したいと考えるかもしれません。

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
この例では、Leading Hint `/*+ leading(t2 t1) */` が使用されています。Leading Hintは、指定されたTable（t2）を駆動Tableとして使用し、実行計画において（t1）よりも前に配置するようにオプティマイザに指示します。

## Hint ログ

Hint Logは主に`EXPLAIN`実行時にヒントが有効かどうかを表示するために使用されます。通常、`EXPLAIN`出力の下部に配置されています。

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
- `UnUsed` 和 `SyntaxError`：いずれもヒントが無効であることを示します。SyntaxErrorは、ヒントの使用において構文エラーがある、または構文がサポートされていないことを示し、サポートされていない理由に関する追加情報が提供されます。

ユーザーは、Hintログを通じて有効性と無効である理由を確認でき、調整と検証が容易になります。

## 要約

Hintは実行プランを手動で管理するための強力なツールです。現在、Dorisはleading hint、ordered hint、distribute hintなどをサポートしており、ユーザーが結合順序、シャッフル方法、その他の可変設定を手動で管理できるようにし、より便利で効果的な操作機能をユーザーに提供します。
