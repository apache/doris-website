---
{
    "title": "DML プランのチューニング：ロードとクエリのパフォーマンスボトルネックを特定する",
    "sidebar_label": "DML プランのチューニング",
    "language": "ja",
    "description": "Doris の DML プランをチューニングする方法を説明します。ロードとクエリのボトルネックを見分け、それぞれのチューニングのベストプラクティスへの入口を示します。",
    "keywords": ["Doris DML チューニング", "ロードのパフォーマンスボトルネック", "クエリのパフォーマンスボトルネック", "DML プランのチューニング", "Doris ロードのベストプラクティス"]
}
---

<!-- Knowledge type: concept + operational guide -->
<!-- Applicable scenario: performance tuning of DML (INSERT / UPDATE / DELETE / load) execution plans -->

## チューニング前のチェックリスト

DML プランのチューニングを始める前に、次の点を確認してください。

-   **ロードフェーズ**と**クエリフェーズ**で費やした時間を明確に区別できること。
-   Profile / Query Plan を確認し、実行時間が最も長いオペレーターまたはフェーズを特定していること。
-   [ロードの概要](../../../data-operate/import/load-manual.md)を読み、用途に適したロード方式を把握していること。

## チューニング対象の特定：ロードのボトルネックとクエリのボトルネック

<!-- Knowledge type: methodology -->
<!-- Applicable scenario: initial diagnosis of slow DML SQL -->

DML 文（`INSERT INTO ... SELECT` など）のパフォーマンスボトルネックは、通常、ロードとクエリのいずれかにあります。**まず、どちらのフェーズにボトルネックがあるかを特定し**、その結果に応じてチューニングします。

| ボトルネックの種類 | 典型的な症状 | チューニングの入口 |
| :---------------- | :-------------------------------------------------------- | :------------------------------------------------------------------------------------------------------------------ |
| ロードフェーズのボトルネック | 書き込みスループットが低く、Sink オペレーターにかかる時間が長い | 適切なロード方式とベストプラクティスを選ぶには、[ロードの概要](../../../data-operate/import/load-manual.md)を参照してください |
| クエリフェーズのボトルネック | Scan、Join、集約などのオペレーターにかかる時間が長い | 診断とチューニングについては、[プランのチューニング](optimizing-table-schema.md)の他のセクションを参照してください |

## ロード側のチューニング

<!-- Knowledge type: practical guide -->
<!-- Applicable scenario: efficient loading of the data source in DML -->

Doris はさまざまなデータソースからのロードに対応しています。Doris が提供するロード機能を状況に応じて使い分けることで、異なるソースのデータを効率的に Doris に取り込み、分析に利用できます。

-   **目的**：データソースとデータの即時性に関する要件に応じて適切なロード方式を選び、DML 全体のパフォーマンスを向上させます。
-   **参照先**：[ロードの概要](../../../data-operate/import/load-manual.md)。
-   **注記**：ロード方式には Stream Load、Broker Load、Routine Load、INSERT などがあります。詳しいベストプラクティスは上記のリンクを参照してください。

## クエリ側のチューニング

<!-- Knowledge type: practical guide -->
<!-- Applicable scenario: tuning the SELECT clause or query execution plan within DML -->

ボトルネックがクエリフェーズにある場合は、プランのチューニングに関する他のセクションに従って診断と最適化を進めます。たとえば、テーブルスキーマの最適化、統計情報、結合順序、オペレーターの書き換えを検討します。詳しくは[プランのチューニング](optimizing-table-schema.md)を参照してください。

## よくある質問

<!-- Knowledge type: frequently asked questions -->
<!-- Applicable scenario: common questions during DML tuning -->

**Q1：DML 文の実行が遅い原因がロードフェーズとクエリフェーズのどちらにあるか、すばやく見分けるにはどうすればよいですか？**
Profile で各オペレーターにかかった時間を確認します。Sink/Load 関連のオペレーターに時間がかかっている場合、ボトルネックはロード側にあります。Scan/Join/Agg オペレーターに時間がかかっている場合は、クエリ側にあります。

**Q2：`INSERT INTO ... SELECT` が遅い場合、最初にどこを確認すればよいですか？**
まず SELECT サブクエリが遅いかどうかを確認します。SELECT 単体では速く実行できる場合、ボトルネックは通常、書き込み側にあります。

**Q3：すべてのロード方式を同じ方法でチューニングする必要がありますか？**
いいえ。Stream Load、Broker Load、Routine Load、INSERT など、ロード方式によって必要なチューニング方法は異なります。[ロードの概要](../../../data-operate/import/load-manual.md)を参照してください。
