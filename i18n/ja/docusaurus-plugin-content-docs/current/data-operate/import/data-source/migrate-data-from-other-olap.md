---
{
    "title": "他の AP システムからのデータ移行",
    "language": "ja",
    "description": "Hive、Iceberg、Hudi などの OLAP/AP システムから Apache Doris にデータを移行する方法と、その選択基準を説明します。",
    "keywords": [
        "Doris データ移行",
        "OLAP データ移行",
        "AP システムの移行",
        "Hive から Doris への移行",
        "Iceberg から Doris への移行",
        "Hudi から Doris への移行",
        "Multi-Catalog",
        "Insert Into",
        "Doris Connector",
        "Spark Doris Connector",
        "Flink Doris Connector"
    ]
}
---

<!-- Knowledge type: Architecture selection decision -->
<!-- Applicable scenario: Migrating data from other AP/OLAP systems to Doris -->

このドキュメントでは、他の AP（分析処理）システムから Apache Doris にデータを移行する一般的な方法を説明します。移行元のシステムと既存の技術スタックに適した方法を選ぶ際に役立ちます。

## 移行方法の概要 {#migration-approaches-overview}

移行元のシステムと利用可能なツールに応じて、他の AP システムから Doris にデータを移行する方法は主に三つあります。

| 移行方法 | 適用場面 | 主な構成要素 |
| --- | --- | --- |
| Multi-Catalog + Insert Into | 移行元が Hive、Iceberg、Hudi、または外部カタログへのマッピングに対応するその他のシステムである場合 | Multi-Catalog、Insert Into |
| 中間ファイルを介した転送 | 移行元が CSV などの一般的なデータ形式へのエクスポートに対応している場合 | データエクスポートツール、Doris のファイルインポート |
| Connector による連携 | 既存の Spark または Flink ジョブがある場合、またはプログラムによる移行が必要な場合 | Spark/Flink AP Connector、Doris Connector |

## 移行方法の詳細 {#detailed-migration-approaches}

### 方法 1: Multi-Catalog で外部テーブルとしてマッピングしてからインポートする {#approach-1-map-as-an-external-table-via-multi-catalog-and-then-import}

この方法は、Hive、Iceberg、Hudi など、Doris Multi-Catalog が認識できるシステムに適用できます。

- Doris で Multi-Catalog を使用し、移行元のシステムを外部テーブルとしてマッピングします。
- `Insert Into` を使用し、外部テーブルのデータを Doris の内部テーブルに書き込みます。

### 方法 2: 中間ファイルを介して転送する {#approach-2-transfer-through-intermediate-files}

この方法は、移行元のシステムと直接連携しにくいものの、データのエクスポートには対応している場合に適用できます。

- 元の AP システムから、CSV などの一般的なデータ形式でデータをエクスポートします。
- エクスポートしたデータファイルを Doris にインポートします。

### 方法 3: Spark または Flink Connector を使用してデータを書き込む {#approach-3-write-data-through-a-spark-or-flink-connector}

この方法は、Spark または Flink のデータ処理パイプラインがすでにある場合や、移行中にデータのクレンジングや変換が必要な場合に適用できます。

- AP システムに対応する Spark または Flink Connector を使用して、移行元のデータを読み込みます。
- Doris Connector を使用して、そのデータを Doris に書き込みます。

## よくある質問 {#faq}

**Q: 使用している AP システムが上の一覧にない場合はどうすればよいですか？**

この一覧に追加できる移行ツールや方法をご存じの場合は、dev@doris.apache.org までご連絡ください。

:::info 注記
この一覧に追加できる移行ツールをご存じの場合は、dev@doris.apache.org までご連絡ください。
:::
