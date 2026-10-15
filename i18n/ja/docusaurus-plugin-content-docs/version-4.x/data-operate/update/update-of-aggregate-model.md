---
{
    "title": "集約モデルにおけるロードによる更新",
    "language": "ja",
    "description": "Doris の Aggregate Key モデルで、データロードによって行全体または一部の列を更新する方法と、集約時の書き込み動作について説明します。"
}
---

<!-- Knowledge type: Operational guide -->
<!-- Applicable scenario: Data writes into the Aggregate model / Incremental data merging -->

Doris の Aggregate Key モデルを使用する場合、一般に次のような状況があります。

- 集約テーブルに新しいデータを書き込み続け、集約ルールに従って新しい値を既存の値とマージしたい。
- 他の列の既存の集約結果を維持しながら、一部の列だけを更新したい。

このドキュメントでは、これらの状況に対応するために Doris の集約モデルがサポートする二つの更新方法、**行全体の更新**と**一部の列の更新**について説明します。

## 更新方法の概要

| 更新方法 | 適用する状況 | 対応するロード方法 | 動作 |
| --- | --- | --- | --- |
| 行全体の更新 | 完全な行を書き込み、各列の集約関数に従って新旧の値をマージする | Stream Load、Broker Load、Routine Load、Insert Into など | 集約関数によって新しい値と既存の値を結合し、新しい集約値を生成する |
| 一部の列の更新 | 他の列の既存の集約結果を維持しながら、一部の列だけを更新する | [一部の列の更新](./partial-column-update.md#column-update-on-the-aggregate-key-model)を参照 | 指定した列だけが集約のためのマージに参加する |

## 行全体の更新

<!-- Knowledge type: Behavior description -->

Stream Load、Broker Load、Routine Load、Insert Into など、Doris がサポートするいずれかのロード方法で集約モデル（Agg モデル）にデータを書き込むと、エンジンは各列に定義された集約関数を使用して新しい値と既存の集約値を結合し、新しい集約値を生成します。

集約値は、次のいずれかのタイミングで生成されます。

1. **ロード時**：データの書き込み中にリアルタイムでマージされます。
2. **非同期 Compaction 中**：バックグラウンドでのマージ処理中に集約が完了します。

集約値がどの段階で生成されても、クエリ時にユーザーに返される結果は同じです。

## 一部の列の更新

<!-- Knowledge type: Capability index -->

Aggregate Key モデルでは、他の列の既存の集約結果を維持しながら、テーブル内の一部の列だけを更新できます。テーブルの作成方法、データの書き込み例、使用上の注意については、[一部の列の更新](./partial-column-update.md#column-update-on-the-aggregate-key-model)を参照してください。
