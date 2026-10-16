---
{
    "title": "ヒントによる Join シャッフルモードの調整",
    "language": "ja",
    "description": "Doris で Distribute Hint を使用して Join のシャッフルモードを調整する方法を説明します。[shuffle] と [broadcast] のヒントの構文、実行プランの比較、チューニングの実践を紹介します。",
    "keywords": ["Doris Join シャッフル", "Distribute Hint", "broadcast ヒント", "shuffle ヒント", "Join チューニング", "Nereids 実行プラン"]
}
---

<!-- Knowledge type: concept + operation -->
<!-- Applicable scenario: manually adjust the Join data distribution mode to optimize query performance -->

Distribute Hint は、Join の右側のテーブルのデータ分散方式を手動で指定するために Doris が提供するヒント構文です。特定の状況でオプティマイザのデフォルトの選択を上書きし、Join の性能を最適化できます。

**チューニング前の確認事項**:

- `EXPLAIN SHAPE PLAN` を使用して、現在の Join の分散方式を確認していること。
- デフォルトのプランに性能上のボトルネックがあることを確認していること（例えば、小さいテーブルがシャッフルされている、または大きいテーブルがブロードキャストされている場合）。
- 両方のテーブルのデータ量を把握し、Broadcast と Shuffle のどちらが適切か判断できること。
- ヒントは専門的なチューニングの場面でのみ使用します。業務側での手動介入は必要ありません。

:::caution 注意
Doris はそのままでも高い性能を発揮します。ほとんどの場合、業務上のチューニングのためにユーザーがヒントを手動で制御しなくても、Doris が適応的に性能を最適化します。この章は主に専門のチューニング担当者を対象としており、業務ユーザーは基本的な内容を理解するだけで十分です。
:::

## Distribute Hint の構文

<!-- Knowledge type: reference -->
<!-- Applicable scenario: specify the distribution mode of the Join right table when writing SQL -->

Doris は、独立した二種類の [Distribute Hint](../../../query-acceleration/hints/distribute-hint.md) をサポートします。ヒントは Join の右側のテーブルの前に配置し、角括弧 `[]` で囲む必要があります。

### ヒントの種類の比較

| ヒントの種類 | 分散方式（DistributionSpec） | 主な適用シナリオ | データ転送コスト |
| :--- | :--- | :--- | :--- |
| `[shuffle]` | `DistributionSpecHash` | 両方のテーブルが大きく、Join キーのハッシュ値に基づいて再分散する場合 | 両方のテーブルをキーに基づいて再分散する |
| `[broadcast]` | `DistributionSpecReplicated` | 右側のテーブルが小さく、各 BE ノードに複製する場合 | 右側のテーブル全体を各 BE ノードに複製する |

> ヒント: Leading Hint と Distribute Hint を組み合わせて、シャッフルモードを指定することもできます。詳しくは、[Leading Hint による Join 順序の制御](reordering-join-with-leading-hint.md)を参照してください。

### 最小構成の例

```sql
-- Force the right table to use Broadcast distribution
SELECT COUNT(*) FROM t2 JOIN [broadcast] t1 ON t1.c1 = t2.c2;

-- Force the right table to use Shuffle distribution
SELECT COUNT(*) FROM t2 JOIN [shuffle] t1 ON t1.c1 = t2.c2;
```

## 例: EXPLAIN でヒントの効果を確認する

<!-- Knowledge type: operational example -->
<!-- Applicable scenario: verify whether a hint takes effect during tuning -->

次の例では、同じクエリを使用して、ヒントの適用前後で実行プランがどのように変わるかを示します。

### ステップ 1: デフォルトの実行プランを確認する

**目的**: オプティマイザがデフォルトで選択した分散方式を確認します。

**コマンド**:

```sql
EXPLAIN SHAPE PLAN SELECT COUNT(*) FROM t1 JOIN t2 ON t1.c1 = t2.c2;
```

**説明**: デフォルトのプランでは、`t2` に `DistributionSpecHash` が使用されます。つまり、ハッシュ値に基づく Shuffle 分散です。

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

### ステップ 2: [broadcast] ヒントを追加する

**目的**: 右側のテーブル `t2` の分散方式を Broadcast に変更します。

**コマンド**:

```sql
EXPLAIN SHAPE PLAN SELECT COUNT(*) FROM t1 JOIN [broadcast] t2 ON t1.c1 = t2.c2;
```

**説明**: 実行プランでは、`t2` の分散方式が `DistributionSpecHash` から `DistributionSpecReplicated` に変わり、ヒントが有効になったことが分かります。

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

## FAQ

<!-- Knowledge type: FAQ / Troubleshooting -->
<!-- Applicable scenario: the hint does not take effect as expected, or it is hard to choose between hints -->

### Q1: ヒントを追加しても有効にならないのはなぜですか？

- ヒントが **Join の右側のテーブル** の前に配置されていることを確認してください。例えば、左側のテーブルの前ではなく、`JOIN [broadcast] t1` のように記述します。
- `EXPLAIN SHAPE PLAN` を使用して、`DistributionSpec` が `PhysicalDistribute` ノードで期待どおりの値か確認してください。
- 角括弧の欠落や入力ミスなどの構文エラーは、通知されずに無視されます。SQL の構文を確認してください。

### Q2: [broadcast] と [shuffle] はどのように使い分けますか？

| シナリオ | 推奨されるヒント | 理由 |
| :--- | :--- | :--- |
| 右側のテーブルが小さい場合（ディメンションテーブルなど） | `[broadcast]` | 大きいテーブルをシャッフルする際のネットワーク負荷を回避できる |
| 両方のテーブルが大きく、データが均等に分布している場合 | `[shuffle]` | Broadcast では右側のテーブルの転送コストが増大する |
| Join キーに著しいデータの偏りがある場合 | `[broadcast]` | Shuffle 後に特定のノードへ負荷が集中するのを回避できる |

### Q3: ヒントを手動で指定する必要はありますか？

ほとんどの場合、必要ありません。Doris のオプティマイザは適切な分散方式を適応的に選択します。性能が期待に達せず、オプティマイザの選択が最適でないと明確に判断できた場合にのみ、ヒントを使用してください。

## まとめ

Distribute Hint を適切に使用すると、Join 操作のシャッフルモードを最適化し、クエリ性能を改善できます。実際には、まず `EXPLAIN SHAPE PLAN` で実行プランを分析し、データ量と分布の特性に基づいて `[shuffle]` または `[broadcast]` を選択することを推奨します。
