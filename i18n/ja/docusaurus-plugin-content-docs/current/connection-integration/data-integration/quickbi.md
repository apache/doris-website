---
{
    "title": "Quick BI",
    "language": "ja",
    "description": "Quick BI で Apache Doris のデータソースに接続し、Doris のデータセットを作成して、表、グラフ、地図などのコンポーネントで可視化レポートを作成する方法を説明します。BI ツール連携やデータ分析に適しています。",
    "keywords": [
        "Quick BI から Doris に接続",
        "Apache Doris と Quick BI",
        "Doris の可視化分析",
        "Quick BI のデータソース"
    ]
}
---

<!-- Knowledge type: Procedure -->
<!-- Applicable scenario: BI tool integration / Visualization analysis -->

Quick BI は、データウェアハウスを基盤とするビジネスインテリジェンスツールで、企業が可視化分析用のダッシュボードをすばやく構築するのに役立ちます。Quick BI は、MySQL、Oracle、SQL Server、Apache Doris などのデータベースに加え、Excel、CSV、JSON などのファイル形式を含むさまざまなデータソースに対応しています。表、グラフ、地図などの可視化コンポーネントを備えており、ドラッグアンドドロップ操作でデータを可視化して分析できます。

このドキュメントでは、Quick BI で Apache Doris のデータソースに接続し、そのデータソースを基にデータセットを作成して、レポートの分析に利用する方法を説明します。

## 適用シナリオ

| シナリオ | ユーザーの目的 | 結果 |
| --- | --- | --- |
| Doris データソースへの接続 | Quick BI のワークスペースに Apache Doris のデータソースを作成する | Quick BI から Doris のデータにアクセスできる |
| 分析用データセットの作成 | 作成したデータソースから Doris のテーブルを選択する | レポートの設定に使用できるデータセットを生成する |
| 可視化レポートの作成 | Quick BI の可視化コンポーネントを使って Doris のデータを分析する | 表、グラフ、地図などのコンポーネントで分析結果を表示する |

## Quick BI の機能概要

| 機能 | 説明 |
| --- | --- |
| データベースのデータソース | MySQL、Oracle、SQL Server、Apache Doris などのデータベースに対応 |
| ファイルのデータソース | Excel、CSV、JSON などのファイル形式に対応 |
| 可視化コンポーネント | 表、グラフ、地図などのコンポーネントを提供 |
| 分析方法 | ドラッグアンドドロップ操作によるデータの可視化分析に対応 |

## 前提条件

開始する前に、次の準備ができていることを確認してください。

- Quick BI にログイン済みで、ワークスペースを作成できること。
- Apache Doris の接続情報が用意されていること。
- データセットの作成に使用できるデータテーブルが Doris に存在すること。このドキュメントでは、TPC-H データセットを例として使用します。

## 手順

| ステップ | 目的 | 説明 |
| --- | --- | --- |
| ステップ 1 | ワークスペースを作成する | Quick BI にログインし、データソースとデータセットを管理するためのワークスペースを作成する |
| ステップ 2 | Doris データソースを作成する | ワークスペースで Apache Doris を選択し、Doris の接続情報を入力する |
| ステップ 3 | 接続結果を確認する | 接続に成功したら、データソース一覧で作成したデータソースを確認する |
| ステップ 4 | データセットを作成する | Doris データソースを基にデータセットを作成し、後続のレポート設定に使用する |

### ステップ 1：Quick BI のワークスペースを作成する

1. Quick BI にログインし、ワークスペースを作成します。

2. 現在のワークスペースで「Create Data Source」（データソースの作成）をクリックします。

    ![データソースを作成](/images/next/connection-integration/data-integration/quickbi/bi-quickbi-en-1.png)

### ステップ 2：Doris データソースを作成する

「Create Data Source」（データソースの作成）ページで **Apache Doris** を選択し、Doris の接続情報を入力します。

![Doris の接続情報を入力](/images/next/connection-integration/data-integration/quickbi/bi-quickbi-en-2.png)

### ステップ 3：データソースの接続結果を確認する

接続に成功すると、データソース一覧に作成した Doris データソースが表示されます。

![データソースを確認](/images/next/connection-integration/data-integration/quickbi/bi-quickbi-en-3.png)

### ステップ 4：データセットを作成してレポートを設定する

作成したデータソースを基にデータセットを作成します。このドキュメントでは、TPC-H データセットを例として使用します。データセットの作成後、対応するレポートを設定できます。

![Doris のデータセットを作成](/images/next/connection-integration/data-integration/quickbi/bi-quickbi-en-4.png)

## 結果

上記の設定を完了すると、Quick BI から作成した Doris データソースを通じて Doris のデータにアクセスし、そのデータセットを基に可視化分析レポートを設定できます。
