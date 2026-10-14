---
{
    "title": "Smartbi",
    "language": "ja",
    "description": "Smartbi で Apache Doris データソースに接続し、データ接続、モデリング、可視化分析を行って、データ分析レポートを作成する方法を説明します。",
    "keywords": [
        "Smartbi から Doris に接続",
        "Apache Doris と Smartbi",
        "Doris データソース",
        "Smartbi データ可視化"
    ]
}
---

<!-- Knowledge type: Operating procedure -->
<!-- Applicable scenario: BI tool integration / Visual analysis -->

[Smartbi](https://www.smartbi.com.cn/) は、Oracle、SQL Server、MySQL、Apache Doris など、さまざまなデータソースに接続できるソフトウェアサービスとアプリケーションコネクタのスイートです。データの統合とクレンジングにも役立ちます。

このドキュメントでは、Smartbi で Apache Doris データソースに接続し、Doris のデータを使ってモデリング、分析、可視化を行う方法を説明します。

## 適用シナリオ

| シナリオ | 目的 | 結果 |
| --- | --- | --- |
| Doris データソースへの接続 | Smartbi で Doris へのデータ接続を作成する | Smartbi から Doris のデータにアクセスできる |
| 分析モデルの構築 | Doris のデータに基づいてリレーショナルモデルを作成し、データ分析式を記述して、データ間の関係を構築する | 高度なデータ分析と可視化の基盤を整えられる |
| 可視化レポートの作成 | Smartbi のグラフ、地理マップ、インタラクティブなダッシュボード、カスタム可視化ツールを使ってデータを表示する | データをより直感的かつ包括的に理解し、伝えられる |

## Smartbi の機能概要

| 機能 | 説明 |
| --- | --- |
| データソース接続 | Oracle、SQL Server、MySQL、Apache Doris など、さまざまなデータソースへの接続をサポートする |
| データモデリング | 複雑なリレーショナルモデルの作成、データ分析式の記述、データ間の関係の構築をサポートする |
| 可視化分析 | グラフ、地理マップ、インタラクティブなダッシュボード、カスタム可視化ツールを提供する |
| データの提示 | データをより直感的かつ包括的に理解し、伝えるのに役立ち、データ分析の効果と効率を高める |

## 前提条件

開始する前に、次の情報を用意してください。

- Smartbi にログインできること。
- Apache Doris データベースの接続情報があること。
- e-service ダッシュボードで設定するレポート情報を決めていること。

## 操作手順

| ステップ | 目的 | 説明 |
| --- | --- | --- |
| ステップ 1 | データ接続ページを開く | Smartbi にログインし、データ接続の入口を開く |
| ステップ 2 | Doris データベースを選択する | 接続可能なデータベースの一覧から Doris を選択する |
| ステップ 3 | 接続情報を入力する | Doris データベースの接続情報を入力する |
| ステップ 4 | 接続をテストする | 接続情報が正しいことを確認し、接続テストを実行する |
| ステップ 5 | レポートを設定する | データ分析モジュールに移動し、e-service ダッシュボードでレポート情報を設定する |

### ステップ 1: データ接続ページを開く

Smartbi にログインしたら、Data Connection をクリックします。

![データ接続ページを開く](/images/next/connection-integration/data-integration/smartbi/bi-smartbi-en-1.png)

### ステップ 2: Doris データベースを選択する

データ接続ページで、接続可能なデータベースの一覧を確認し、Doris データベースを選択します。

![Doris データベースを選択する](/images/next/connection-integration/data-integration/smartbi/bi-smartbi-en-2.png)

### ステップ 3: Doris の接続情報を入力する

Doris データベースを選択したら、その接続情報を入力します。

![Doris の接続情報を入力する](/images/next/connection-integration/data-integration/smartbi/bi-smartbi-en-3.png)

### ステップ 4: 接続をテストする

接続情報が正しく、接続に成功すると、ページにテスト合格と表示されます。

![接続テストに合格した画面](/images/next/connection-integration/data-integration/smartbi/bi-smartbi-en-4.png)

### ステップ 5: データ分析レポートを設定する

接続に成功したら、データ分析モジュールの e-service ダッシュボードに移動し、必要に応じてレポート情報をカスタマイズします。

![データ分析レポートを設定する](/images/next/connection-integration/data-integration/smartbi/bi-smartbi-en-5.png)

## 結果

上記の設定が完了すると、Smartbi は作成した Doris へのデータ接続を通じて Doris のデータにアクセスし、データ分析モジュールで必要なレポートを設定できます。
