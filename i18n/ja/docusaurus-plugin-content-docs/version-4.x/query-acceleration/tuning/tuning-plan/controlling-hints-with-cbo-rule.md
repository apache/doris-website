---
{
    "title": "ヒントによるコストベースの書き換え用 CBO ルールの制御",
    "sidebar_label": "CBO ルールの制御",
    "language": "ja",
    "description": "Doris で USE_CBO_RULE ヒントを使い、CBO のコストベース書き換えルールを明示的に有効化する方法を説明します。構文、利用可能なルール、集約のプッシュダウンなどの代表的な利用場面を扱います。",
    "keywords": ["Doris CBO ヒント", "USE_CBO_RULE", "コストベースの書き換え", "集約のプッシュダウン", "クエリオプティマイザ", "RBO と CBO"]
}
---

<!-- Knowledge type: Concept + How-to guide -->
<!-- Applicable scenarios: Explicitly controlling CBO rules with hints for query tuning -->

## 事前確認

- Doris オプティマイザの基本的な処理の流れを理解している
- 特定のクエリで、集約のプッシュダウンなどの CBO ルールを有効化する必要がある
- 一般的な業務アプリケーション開発者ではなく、DBA またはチューニングの専門担当者である

:::caution 注意
Doris は標準で高い最適化能力を備え、ほとんどの場面で性能を適応的に最適化するため、ヒントを使った手動チューニングが必要になることはまれです。この記事は主に**チューニングの専門担当者**を対象としています。業務アプリケーションの利用者は、概念を理解するだけで十分です。
:::

## 概要

<!-- Knowledge type: Concept -->

`USE_CBO_RULE` は、単一の SQL 文の中で指定した CBO のコストベース書き換えルールを明示的に有効化するクエリヒントです。

Doris オプティマイザは、実行プランを生成する際に二種類のルールを適用します。

| 最適化の種類 | 正式名称 | 判断基準 | 代表的な手法 |
|----------|------|----------|----------|
| RBO | Rule-Based Optimizer | 統計情報に依存しない、事前定義されたヒューリスティックルール | 述語のプッシュダウン、射影のプッシュダウン |
| CBO | Cost-Based Optimizer | データの統計情報を基にコストを推定し、最もコストの低いプランを選択 | アクセスパスの選択、結合アルゴリズムの選択 |

細かなチューニングが必要な場合、DBA や開発者が CBO ルールを有効にするかどうかを手動で制御することがあります。その場合はクエリヒントを使用できます。

## 構文

<!-- Knowledge type: Reference -->
<!-- Applicable scenarios: Writing SQL with hints -->

**目的**: 単一の SELECT 文で一つ以上の CBO ルールを明示的に有効化します。

**コマンド**:

```sql
SELECT /*+ USE_CBO_RULE(rule1, rule2, ...) */ ...
```

**注意事項**:

- ヒントは `SELECT` キーワードの直後に配置します。
- 括弧内に有効化するルール名を列挙します。複数ある場合はコンマで区切ります。
- ルール名は**大文字と小文字を区別しません**。

## サポートされる CBO ルール

<!-- Knowledge type: Reference -->

Doris オプティマイザでは現在、`USE_CBO_RULE` で明示的に有効化できるコストベースの書き換えルールとして、次のルールをサポートしています。

| ルール名 | 効果 |
|----------|------|
| `PUSH_DOWN_AGG_THROUGH_JOIN` | 集約処理を結合の両側にプッシュダウンします |
| `PUSH_DOWN_AGG_THROUGH_JOIN_ONE_SIDE` | 集約処理を結合の片側にプッシュダウンします |
| `PUSH_DOWN_DISTINCT_THROUGH_JOIN` | Distinct 処理を結合の下にプッシュダウンします |

## 使用例: 集約のプッシュダウンによる結合クエリの高速化

<!-- Knowledge type: Example -->
<!-- Applicable scenarios: Queries that join and then aggregate, where you want to aggregate earlier to reduce the data volume processed by the join -->

**場面**: テーブル `a` とテーブル `b` を `device_id` で結合し、その結果を `event_id` と `group_id` で集約します。結合が処理するデータ量を減らすため、結合前にテーブル `a` を集約します。

**SQL の例**:

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

**書き換え後の実行プラン**:

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

追加の `hashAgg[LOCAL]` がテーブル `a` のスキャンの上に配置され、結合前に集約が行われていることが分かります。これにより結合への入力データ量が減り、クエリが高速化されます。

## FAQ

<!-- Knowledge type: FAQ / Troubleshooting -->

**Q1: `USE_CBO_RULE` はどのような場合に使用しますか？**

Doris が特定の CBO ルールをデフォルトで適用しない一方、現在のデータ分布ではそのルールが有効だと判断できる場合にのみ、手動で有効化する必要があります。ほとんどの場合は、オプティマイザの自動的な判断に任せてください。

**Q2: ヒント内のルール名は大文字と小文字を区別しますか？**

いいえ、区別しません。`PUSH_DOWN_AGG_THROUGH_JOIN_ONE_SIDE` と `push_down_agg_through_join_one_side` は同じ意味です。

**Q3: 複数のルールを同時に有効化できますか？**

はい。`/*+ USE_CBO_RULE(rule1, rule2) */` のように、ルールをコンマで区切ります。

**Q4: ヒントの位置が間違っている場合や、ルール名にスペルミスがある場合はどうなりますか？**

ヒントは `SELECT` キーワードの直後に配置する必要があります。ルール名にスペルミスがある場合、ヒントは効果を発揮しませんが、SQL はデフォルトのプランで実行されます。

## RBO と CBO の比較

<!-- Knowledge type: Comparison -->

| 比較項目 | RBO | CBO |
|------|-----|-----|
| 判断基準 | ヒューリスティックルール | データの統計情報（コスト推定） |
| 統計情報への依存 | いいえ | はい |
| 適用場面 | 一般的で、決定的な最適化 | データ分布に密接に関係する最適化 |
| `USE_CBO_RULE` による制御 | できません | できます |

## まとめ

`USE_CBO_RULE` ヒントを適切に使用すると、特定の場面で高度な CBO 最適化ルールを手動で有効化し、クエリ性能を改善できます。使いこなすには、クエリ最適化とデータの特性を深く理解する必要があります。**ほとんどの場合は、Doris オプティマイザの自動的な判断に任せるのが最善です**。
