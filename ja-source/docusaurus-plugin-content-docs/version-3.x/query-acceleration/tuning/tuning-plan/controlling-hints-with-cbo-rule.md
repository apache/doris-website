---
{
  "title": "Hintを使用したCBOルールの制御",
  "description": "クエリオプティマイザーは、実行プランを生成する際に一連のルールを適用します。",
  "language": "ja"
}
---
## 概要

クエリオプティマイザーは実行プランを生成する際に一連のルールを適用します。これらのルールは主に2つのタイプに分類されます：Rule-Based Optimizer（RBO）とCost-Based Optimizer（CBO）です。

- RBO：この最適化タイプは、特定のデータ統計を考慮せずに事前定義されたヒューリスティックルールのセットを適用することで、クエリプランを改善します。predicate pushdownやprojection pushdownなどの戦略がこのカテゴリに含まれます。
- CBO：この最適化タイプは、データ統計を活用して異なる実行プランのコストを推定し、実行のために最もコストの低いプランを選択します。これには、アクセスパスとjoinアルゴリズムの選択が含まれます。

場合によっては、データベース管理者や開発者がクエリ最適化プロセスをより細かく制御する必要があるかもしれません。これに基づいて、本ドキュメントではクエリヒントを使用してCBOルールを管理する方法を紹介します。

:::caution Note
現在、Dorisは優れたout-of-the-box機能を持っています。これは、ほとんどのシナリオにおいて、Dorisが様々なシナリオで適応的にパフォーマンスを最適化することを意味し、ユーザーはパフォーマンスチューニングのためにヒントを手動で制御する必要がありません。この章で紹介する内容は主に専門のチューナー向けであり、ビジネス担当者は簡単な理解があれば十分です。
:::

CBOルール制御ヒントの基本構文は以下の通りです：

```sql
SELECT /*+ USE_CBO_RULE(rule1, rule2, ...) */ ...
```
このヒントは`SELECT`キーワードの直後に続き、括弧内で有効にするルールの名前を指定します（ルール名は大文字小文字を区別しません）。

現在、Dorisオプティマイザーは複数のコストベース書き換えをサポートしており、`USE_CBO_RULE`ヒントを使用して明示的に有効にできます。例えば：

- PUSH_DOWN_AGG_THROUGH_JOIN
- PUSH_DOWN_AGG_THROUGH_JOIN_ONE_SIDE
- PUSH_DOWN_DISTINCT_THROUGH_JOIN

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
この例では、集約プッシュダウンのためのCBOルールが有効になっています。この操作により、結合操作の前にTableaを集約することができ、結合のコストを削減してクエリを高速化します。プッシュダウン後のプランは以下の通りです：

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
## 要約

`USE_CBO_RULE`ヒントを適切に使用することで、特定の高度なCBO最適化ルールを手動で有効にし、特定のシナリオにおけるパフォーマンスを最適化することができます。ただし、CBO最適化ルールの使用には、クエリ最適化プロセスとデータ特性の深い理解が必要です。ほとんどの場合、Dorisオプティマイザの自動決定に依存することが依然として最良の選択です。
