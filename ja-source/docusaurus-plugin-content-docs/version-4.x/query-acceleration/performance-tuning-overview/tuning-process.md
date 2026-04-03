---
{
  "title": "チューニングプロセス",
  "description": "パフォーマンスチューニングは、体系的な診断のための包括的な方法論と実装フレームワークを必要とする体系的なプロセスです。",
  "language": "ja"
}
---
## 概要

パフォーマンスチューニングは、体系的な診断と最適化のための包括的な方法論と実装フレームワークを必要とする体系的なプロセスです。[診断ツール](diagnostic-tools.md)と[分析ツール](analysis-tools.md)の強力なサポートにより、Dorisシステムはパフォーマンス問題を効率的に診断、分析、特定、解決することができます。チューニングの完全な4ステッププロセスは以下の通りです：

![Tuning process](/images/query-tuning-steps.jpg)

## ステップ1：パフォーマンス診断ツールを使用してスロークエリを特定する

Doris上で動作するビジネスシステムの場合、前述の[パフォーマンス診断ツール](diagnostic-tools.md)を使用してスローSQLクエリを特定します。

- Doris Managerがインストールされている場合、Managerのログページを使用してスロークエリを便利に視覚的に特定することが推奨されます。
- Managerがインストールされていない場合、FEノードの`fe.audit.log`ファイルまたはaudit_logシステムtableを直接チェックしてスローSQLクエリのリストを取得し、チューニングの優先順位を付けることができます。

## ステップ2：スキーマ設計とチューニング

特定のスローSQLクエリを特定した後、最優先事項は、不合理なスキーマ設計によるパフォーマンス問題を排除するためにビジネススキーマ設計を検査しチューニングすることです。

スキーマ設計チューニングは3つの側面に分けることができます：

- [tableレベルスキーマ設計チューニング](../tuning/tuning-plan/optimizing-table-schema.md)、パーティションとバケット数の調整、フィールド最適化など
- [インデックス設計とチューニング](../tuning/tuning-plan/optimizing-table-index.md)
- [Colocate GroupによるJoin最適化](../tuning/tuning-plan/optimizing-join-with-colocate-group.md)などの特定の最適化技術の使用。主な目標は、不合理なスキーマ設計やDorisの既存の最適化機能を十分に活用できなかったことによるパフォーマンス問題を排除することです。

詳細なチューニング例については、[Plan Tuning](../tuning/tuning-plan/optimizing-table-schema.md)のドキュメントを参照してください。

## ステップ3：プランチューニング

ビジネススキーマの検査とチューニングの後、チューニングの主要タスクが始まります：プランチューニングと実行チューニングです。上述のように、この段階では、主要タスクはDorisが提供する様々なレベルのExplainツールを最大限に活用して、スローSQLクエリの実行プランを体系的に分析し、的確な最適化のための主要な最適化ポイントを特定することです。

- 単一tableクエリと分析シナリオでは、実行プランを分析して[パーティションプルーニング](../tuning/tuning-plan/optimizing-table-scanning.md)が適切に動作しているかチェックし、[単一tableマテリアライズドビューをクエリ高速化に使用](../tuning/tuning-plan/transparent-rewriting-with-sync-mv.md)することができます。
- 複雑なマルチtable分析シナリオでは、Join Orderを分析してそれが合理的かどうかを判断し、特定のパフォーマンスボトルネックを特定することができます。また、[マルチtableマテリアライズドビューを透明なリライティングに使用してクエリを高速化](../tuning/tuning-plan/transparent-rewriting-with-async-mv.md)することもできます。不合理なJoin Orderなどの予期しない状況が発生した場合、Join Hintを手動で指定して実行プランをバインドすることができます。例えば、[Leading hintを使用してJoin Orderを制御](../tuning/tuning-plan/reordering-join-with-leading-hint.md)、[Shuffle Hintを使用してJoin shuffleメソッドを調整](../tuning/tuning-plan/adjusting-join-shuffle.md)、[Hintsを使用してコストベース最適化ルールを制御](../tuning/tuning-plan/controlling-hints-with-cbo-rule.md)して、実行プランをチューニングする目標を達成します。
- 特定のシナリオでは、[SQL Cacheを使用してクエリを高速化](../tuning/tuning-plan/accelerating-queries-with-sql-cache.md)などのDorisが提供する高度な機能を活用することもできます。

詳細なチューニング例については、[Plan Tuning](../tuning/tuning-plan/optimizing-table-schema.md)のドキュメントを参照してください。

## ステップ4：実行チューニング

実行チューニング段階では、SQLクエリの実際の実行に基づいてプランチューニングの有効性を検証する必要があります。さらに、既存のプランのフレームワーク内で、実行側のボトルネックの分析を継続し、どの実行段階が遅いか、または最適でない並列性などの他の一般的な問題を特定します。

マルチtable分析クエリを例に取ると、Profileを分析して、計画されたJoin順序が合理的か、Runtime Filtersが効果的か、並列性が期待に沿っているかをチェックできます。さらに、Profileは遅いI/Oや予期しないネットワーク送信パフォーマンスなどのマシン負荷についてのフィードバックを提供できます。このような問題を確認し診断する際は、診断とチューニングを支援するシステムレベルツールが必要です。

詳細なチューニング例については、[Execution Tuning](../tuning/tuning-execution/adjustment-of-runtimefilter-wait-time.md)のドキュメントを参照してください。

:::tip
特定のパフォーマンス問題を分析する際は、まずプランをチェックしてから実行をチューニングすることが推奨されます。まずExplainツールを使用して実行プランを確認し、次にProfileツールを使用して実行パフォーマンスを特定しチューニングします。順序を逆にすると非効率になり、パフォーマンス問題の迅速な特定を阻害する可能性があります。
:::

## まとめ

クエリチューニングは体系的なプロセスであり、Dorisはユーザーに様々な次元のツールを提供して、さまざまなレベルでのパフォーマンス問題の診断、特定、分析、解決を促進します。これらの診断・分析ツールに精通し、合理的なチューニング方法を採用することで、ビジネス担当者やDBAはパフォーマンスボトルネックを迅速かつ効果的に対処し、Dorisの強力なパフォーマンス上の利点をより良く引き出し、ビジネス支援のためのビジネスシナリオによりよく適応することができます。
