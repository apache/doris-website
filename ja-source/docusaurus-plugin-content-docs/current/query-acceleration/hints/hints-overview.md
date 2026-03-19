---
{
  "title": "ヒントの概要",
  "language": "ja",
  "description": "データベースヒントは、データベースクエリオプティマイザに特定のプランを生成する方法を指示するために使用されるクエリ最適化技術です。ヒントを提供することにより、"
}
---
Database Hintsは、データベースクエリオプティマイザが特定のプランを生成する方法を導くために使用されるクエリ最適化技術です。Hintsを提供することで、ユーザーはより良いパフォーマンスの実現や特定の要件を満たすことを期待して、クエリオプティマイザのデフォルト動作を細かく調整できます。
:::caution Note
現在、Dorisは優れた開封即用機能を備えています。ほとんどのシナリオにおいて、Dorisはユーザーがビジネス調整のためにhintsを手動で制御する必要なく、様々な状況において適応的にパフォーマンスを最適化します。この章で紹介する内容は、主に専門的な調整担当者を対象としています。ビジネスユーザーは簡単に理解しておく程度で構いません。
:::

## Hint分類

Dorisは現在、leading hint、ordered hint、distribute hintなど、いくつかのタイプのhintsをサポートしています：

- [Leading Hint](leading-hint.md)：leading hintで提供された順序に従って結合順序を指定します。
- [Ordered Hint](leading-hint.md)：元のテキストシーケンスとして結合順序を指定するleading hintの特定のタイプです。
- [Distribute Hint](distribute-hint.md)：結合のデータ分散方法をshuffleまたはbroadcastとして指定します。

## Hint例
大量のデータを持つテーブルを想像してください。特定の場合において、テーブルの結合順序がクエリパフォーマンスに影響を与える可能性があることを知っているかもしれません。そのような状況では、Leading Hintによって、オプティマイザに従わせたいテーブル結合順序を指定できます。

以下のSQLクエリを例に取ります。実行効率が理想的でない場合、ユーザーの元のシナリオに影響を与えることなく調整目標を達成するために、元のSQLを変更せずに結合順序を調整したい場合があるかもしれません。

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
この場合、Leading Hintを使用してt1とt2の結合順序を任意に変更できます。例えば：

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
この例では、Leading Hint `/*+ leading(t2 t1) */` が使用されています。Leading Hint は、指定されたテーブル（t2）をドライビングテーブルとして使用し、実行計画において（t1）より前に配置するようオプティマイザーに指示します。

## Hint Log

Hint Log は主に `EXPLAIN` を実行する際に、ヒントが有効かどうかを表示するために使用されます。通常、`EXPLAIN` の出力の下部に配置されます。

Hint Log には3つのステータスがあります：

```sql
+---------------------------------+
| Hint log:                       |
| Used:                           |
| UnUsed:                         |
| SyntaxError:                    |
+---------------------------------+
```
- `Used`：ヒントが有効であることを示します。
- `UnUsed` と `SyntaxError`：どちらもヒントが有効でないことを示します。SyntaxError は、ヒントの使用に構文エラーがあるか、構文がサポートされていないことを示し、サポートされていない理由に関する追加情報が提供されます。

ユーザーは Hint ログを通じて有効性と無効な理由を確認でき、調整と検証を容易にします。

## まとめ

ヒントは実行計画を手動で管理するための強力なツールです。現在、Doris は leading hint、ordered hint、distribute hint などをサポートしており、ユーザーが結合順序、shuffle メソッド、その他の変数設定を手動で管理できるようにし、より便利で効果的な操作機能をユーザーに提供します。
