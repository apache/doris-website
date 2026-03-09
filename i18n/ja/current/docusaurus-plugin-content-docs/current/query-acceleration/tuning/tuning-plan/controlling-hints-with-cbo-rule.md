---
{
  "title": "ヒントでCBOルールを制御する",
  "language": "ja",
  "description": "クエリオプティマイザは実行プランを生成する際に一連のルールを適用します。"
}
---
## 概要

クエリオプティマイザーは実行プランを生成する際に一連のルールを適用します。これらのルールは主に2つのタイプに分類されます：Rule-Based Optimizer (RBO) と Cost-Based Optimizer (CBO) です。

-   RBO：このタイプの最適化は、特定のデータ統計を考慮せずに、事前定義されたヒューリスティックルールのセットを適用してクエリプランを改善します。predicate pushdownやprojection pushdownなどの戦略がこのカテゴリに含まれます。
-   CBO：このタイプの最適化は、データ統計を活用して異なる実行プランのコストを推定し、実行に最もコストの低いプランを選択します。これには、アクセスパスやjoinアルゴリズムの選択が含まれます。

場合によっては、データベース管理者や開発者がクエリ最適化プロセスをより細かく制御する必要があります。これに基づいて、このドキュメントではCBOルールを管理するためのクエリヒントの使用方法を紹介します。

:::caution Note
現在、Dorisは優れたout-of-the-box機能を持っています。これは、ほとんどのシナリオにおいて、Dorisが様々なシナリオでパフォーマンスを適応的に最適化し、ユーザーがパフォーマンスチューニングのためにヒントを手動で制御する必要がないことを意味します。本章で紹介する内容は主に専門的なチューナー向けであり、業務担当者は簡単な理解のみで十分です。
:::

CBOルール制御ヒントの基本的な構文は以下の通りです：

```sql
SELECT /*+ USE_CBO_RULE(rule1, rule2, ...) */ ...
```
このhintは`SELECT`キーワードの直後に記述し、括弧内で有効にするルールの名前を指定します（ルール名は大文字小文字を区別しません）。

現在、Dorisオプティマイザは複数のコストベース書き換えをサポートしており、`USE_CBO_RULE`hintを使用して明示的に有効化できます。例えば：

-   PUSH_DOWN_AGG_THROUGH_JOIN
-   PUSH_DOWN_AGG_THROUGH_JOIN_ONE_SIDE
-   PUSH_DOWN_DISTINCT_THROUGH_JOIN

## Case

クエリの例を以下に示します：

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
この例では、集約プッシュダウンのためのCBOルールが有効になっています。この操作により、結合操作の前にテーブルaを集約することができ、結合のコストを削減してクエリを高速化します。プッシュダウン後のプランは以下の通りです：

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
## まとめ

`USE_CBO_RULE`ヒントを適切に使用することで、特定の高度なCBO最適化ルールを手動で有効化し、特定のシナリオでパフォーマンスを最適化できます。ただし、CBO最適化ルールの使用には、クエリ最適化プロセスとデータ特性に対する深い理解が必要です。ほとんどの場合、Dorisオプティマイザーの自動判断に依存することが依然として最良の選択です。
