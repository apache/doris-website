---
{
    "title": "パフォーマンスチューニングの進め方",
    "language": "ja",
    "description": "Doris で遅いクエリを体系的にチューニングする方法を説明します。低速 SQL の特定、スキーマのチューニング、実行計画のチューニング、実行時のチューニングという四つの手順と、各手順で使うツールや適用場面を紹介します。",
    "keywords": ["Doris のパフォーマンスチューニング", "低速クエリの特定", "スキーマのチューニング", "実行計画のチューニング", "Profile の分析", "チューニング手順"]
}
---

<!-- Knowledge type: process methodology -->
<!-- Applicable scenarios: slow query tuning, performance bottleneck identification, systematic performance optimization -->

Doris のパフォーマンスチューニングは、手順に沿って体系的に進める必要があります。Doris が提供する[診断ツール](diagnostic-tools.md)と[分析ツール](analysis-tools.md)を使うことで、パフォーマンス上の問題を効率的に特定、分析、解決できます。

**チューニング前の確認事項:**

- 低速 SQL またはパフォーマンスの低下が発生していることを確認している。
- FE ノードのログまたは Doris Manager にアクセスできる。
- 対象となる業務テーブルのスキーマ設計とクエリパターンを把握している。
- `EXPLAIN` や `Profile` など、基本的な分析ツールの使い方を理解している。

チューニングは、次の四つの手順で進めます。

![パフォーマンスチューニングの手順](/images/query-tuning-steps.jpg)

| 手順 | フェーズ | 主な目的 | 主なツール |
| --- | --- | --- | --- |
| 手順 1 | 低速クエリの特定 | チューニングが必要な SQL 文を特定する | Doris Manager、`fe.audit.log`、`audit_log` テーブル |
| 手順 2 | スキーマのチューニング | 設計上のボトルネックを解消する | パーティション分割とバケット分割、インデックス、Colocate Group |
| 手順 3 | 実行計画のチューニング | 実行計画を最適化する | `EXPLAIN`、マテリアライズドビュー、Hint |
| 手順 4 | 実行時のチューニング | 実行時のパフォーマンスを最適化する | `Profile`、Runtime Filter、並列度のパラメータ |

## 手順 1: 低速クエリの特定

<!-- Knowledge type: operational guide -->
<!-- Applicable scenarios: identifying slow SQL that needs tuning -->

**目的**: 業務システムでチューニングが必要な低速 SQL 文を絞り込みます。

**方法**:

| 状況 | 推奨する方法 | 説明 |
| --- | --- | --- |
| Doris Manager を導入している | Manager のログページを使用する | 画面上で絞り込みや並べ替えを行いやすい |
| Doris Manager を導入していない | FE ノードの `fe.audit.log` または `audit_log` システムテーブルを照会する | 低速 SQL の一覧を取得した後、優先順位を付けて順にチューニングする |

ツールの使い方については、[診断ツール](diagnostic-tools.md)を参照してください。

## 手順 2: スキーマの設計とチューニング

<!-- Knowledge type: tuning method -->
<!-- Applicable scenarios: performance issues caused by unreasonable table structure or index design -->

低速 SQL を特定したら、まず業務テーブルのスキーマ設計を確認し、設計上の問題に起因するパフォーマンス低下がないかを調べます。スキーマのチューニングは、次の三つの領域に分かれます。

| チューニングの方向 | 主な内容 | 参照ドキュメント |
| --- | --- | --- |
| テーブルのスキーマのチューニング | パーティションとバケットの数、フィールドの型 | [テーブルのスキーマの最適化](../tuning/tuning-plan/optimizing-table-schema.md) |
| インデックス設計のチューニング | プレフィックスインデックス、Bloom Filter、転置インデックスなど | [テーブルのインデックスの最適化](../tuning/tuning-plan/optimizing-table-index.md) |
| 特定の最適化手法 | Colocate Group など | [Colocate Group を使用した Join の最適化](../colocation-join.md) |

詳しい事例については、[実行計画のチューニング](../tuning/tuning-plan/optimizing-table-schema.md)を参照してください。

## 手順 3: 実行計画のチューニング

<!-- Knowledge type: tuning method -->
<!-- Applicable scenarios: performance bottlenecks caused by unreasonable execution plans -->

スキーマの確認を終えたら、チューニングの中心となる実行計画の分析に進みます。この段階では、Doris の各レベルで `EXPLAIN` を活用して低速 SQL の実行計画を体系的に分析し、重要な最適化箇所を特定します。

**状況別のチューニング方法:**

-   **単一テーブルのクエリや分析**
    -   実行計画を分析し、[パーティションプルーニング](../tuning/tuning-plan/optimizing-table-scanning.md)が有効になっているか確認します。
    -   [単一テーブルのマテリアライズドビューを使用してクエリを高速化します](../tuning/tuning-plan/transparent-rewriting-with-sync-mv.md)。

-   **複数テーブルを使う複雑な分析**
    -   Join Order が適切かを分析し、パフォーマンスのボトルネックを特定します。
    -   [複数テーブルのマテリアライズドビューを使用した透過的な書き換え](../tuning/tuning-plan/transparent-rewriting-with-async-mv.md)でクエリを高速化します。
    -   Hint を使用して実行計画を手動で指定します。
        -   [Leading Hint で Join Order を制御する](../tuning/tuning-plan/reordering-join-with-leading-hint.md)
        -   [Shuffle Hint で Join の shuffle 方式を調整する](../tuning/tuning-plan/adjusting-join-shuffle.md)
        -   [Hint でコストベースの書き換え動作を制御する](../tuning/tuning-plan/controlling-hints-with-cbo-rule.md)

-   **特定の高速化が必要な場合**
    -   [SQL Cache を使用してクエリを高速化する](../sql-cache-manual.md)

詳しい事例については、[実行計画のチューニング](../tuning/tuning-plan/optimizing-table-schema.md)を参照してください。

## 手順 4: 実行時のチューニング

<!-- Knowledge type: tuning method -->
<!-- Applicable scenarios: the execution plan is reasonable but runtime performance does not meet expectations -->

実行時のチューニングでは、SQL の実際の実行状況に基づいて実行計画のチューニング効果を確認します。そのうえで、実行ステージごとの所要時間の分布や並列度の不足など、実行時のボトルネックを引き続き分析します。

**複数テーブルを使う分析クエリを例にすると、Profile で次の点を確認できます:**

-   プランナーが選択した Join の順序は適切か。
-   Runtime Filter は有効になっているか。
-   並列度は想定どおりか。
-   マシンの負荷に問題はないか（IO が遅い、ネットワーク転送性能が期待に届かないなど）。

マシンの負荷に関する問題の診断には、システムレベルのツールも使用する必要があります。詳しい事例については、[実行時のチューニング](../tuning/tuning-execution/adjustment-of-runtimefilter-wait-time.md)を参照してください。

:::tip ヒント
特定のパフォーマンス上の問題を分析するときは、**まず実行計画を確認し、次に実行時のチューニングを行う**ことを推奨します。最初に `EXPLAIN` で実行計画を確認し、その後 `Profile` で実行時のパフォーマンス上の問題を特定します。順序を逆にすると作業効率が下がり、問題を素早く特定しにくくなる可能性があります。
:::

## よくある質問

<!-- Knowledge type: FAQ -->
<!-- Applicable scenarios: common questions during the tuning process -->

**Q1: スキーマと実行計画のどちらを先にチューニングすべきですか？**

スキーマを先にチューニングします。スキーマの設計が不適切だと（パーティション分割やバケット分割に使うフィールドが適切でない、必要なインデックスがないなど）、実行計画自体を最適化できません。スキーマの問題を先に解決すれば、問題のある設計を前提にチューニングを繰り返さずに済みます。

**Q2: `EXPLAIN` と `Profile` はどう違いますか？**

| ツール | 出力 | 使用するフェーズ |
| --- | --- | --- |
| `EXPLAIN` | 静的な実行計画（実際には実行しない） | 実行計画のチューニング |
| `Profile` | 実際の実行における所要時間とリソースの指標 | 実行時のチューニング |

**Q3: Join Order が適切でない場合はどうすればよいですか？**

`EXPLAIN` の出力を調べ、[Leading Hint](../tuning/tuning-plan/reordering-join-with-leading-hint.md)を使用して Join の順序を手動で指定します。

**Q4: IO やネットワークが遅い場合はどう対処しますか？**

`Profile` からマシンの負荷を把握できますが、根本原因の特定には、OS レベルのツール（`iostat`、`sar`、`netstat` など）を併用して、ハードウェアやネットワークのボトルネックを調べる必要があります。

## まとめ

Doris は、低速クエリの特定からスキーマ設計、実行計画、実行時のパフォーマンスまで、一連の診断を支援する多面的なチューニングツールを提供します。業務ユーザーや DBA は、「特定 → スキーマ → 実行計画 → 実行時」の四つの手順に沿って体系的にチューニングすることで、Doris のパフォーマンスを十分に引き出せます。
