---
title: Superset
language: ja
description: Apache Superset 3.1 で Apache Doris をデータソースとして設定し、データの可視化とダッシュボードの作成に利用する方法を説明します。インストールと設定、接続手順、可視化の例、一般的なトラブルシューティングを扱います。
keywords:
  - Apache Superset から Doris に接続
  - Superset のデータソース設定
  - Doris の可視化
  - BI ツール連携
  - SQLAlchemy による Doris への接続
---

<!-- Knowledge type: How-to guide -->
<!-- Applicable scenario: Data visualization configuration / BI tool integration -->

[Apache Superset](https://superset.apache.org/) は、さまざまなデータソースへの接続、複数の可視化形式、きめ細かなユーザー権限管理に対応したオープンソースのデータ探索プラットフォームです。主な機能には、セルフサービス分析、カスタムダッシュボード、分析結果の可視化とエクスポート、ユーザーとロールの権限管理、組み込みの SQL エディターがあります。

**この記事の目的**：Apache Superset 3.1 で Apache Doris のデータソースを設定し、データのクエリと可視化を行えるようにします。

<!-- Knowledge type: Version requirements -->
| コンポーネント | 推奨バージョン | 備考 |
|------|----------|------|
| Apache Superset | 3.1 以降 | Apache Doris への接続を公式にサポート |
| Apache Doris | 2.0.4 以降 | 推奨 |
| Python | 3.9 / 3.10 / 3.11 | 安定版を使用 |
| pydoris | 1.1.0 | Doris の Python クライアント |

---

## 前提条件

設定を始める前に、次の準備を完了してください。

1. Apache Superset 3.1 以降をインストールします。

    [Superset の公式インストールガイド](https://superset.apache.org/docs/installation/installing-superset-from-pypi)を参照してください。

2. Apache Doris の Python クライアントをインストールします。

    ```bash
    pip install pydoris
    ```

3. インストールを確認します。

    ```bash
    pip list | grep pydoris
    # Expected output:
    # pydoris                       1.1.0
    ```

---

## ステップ 1：Doris データソースを設定する

環境の準備ができたら、次の手順で Superset に Doris データソースを追加します。

### 1. SQLAlchemy 接続文字列を取得する

Doris では、次の形式の SQLAlchemy URI を使用します。

```
doris://<username>:<password>@<host>:<port>/<Catalog>.<database>
```

**パラメーターの説明：**

| パラメーター | 意味 | 例 |
|------|------|------|
| username | Doris に接続するユーザー名 | testuser |
| password | ユーザーのパスワード | xxxxxx |
| host | データベースのホスト | 127.0.1.28 |
| port | クエリポート | 9030 |
| Catalog | Doris の Catalog。内部テーブルには `internal` を使用します。外部テーブル経由でデータレイクにクエリを実行する場合は、対応する Catalog を指定します。 | internal |
| database | データベース名 | tpch |

### 2. Superset にデータソースを追加する

1. Superset の Web インターフェースを開き、右上の **Settings**（設定）、**Database Connectors**（データベースコネクター）の順にクリックします。

    ![Database Connectors を開く](/images/next/connection-integration/superset/02-superset-connect.png)

2. **+ Add Database**（データベースを追加）をクリックし、**Connect a Database**（データベースに接続）ダイアログで **Apache Doris** を選択します。

    ![Apache Doris を選択](/images/next/connection-integration/superset/03-superset-choose-db.png)

3. 接続情報に SQLAlchemy URI を入力します。接続テストが成功したら、**Connect**（接続）をクリックします。

    ![接続情報を入力](/images/next/connection-integration/superset/04-superset-choose-test-connect.png)

4. 追加に成功すると、データソースが画面に表示されます。

    ![追加後の画面](/images/next/connection-integration/superset/05-superset-after-connect.png)

---

## ステップ 2：可視化チャートを作成する

データソースを設定したら、データの可視化を作成できます。

この記事では、TPC-H データセットを使用し、配送方法ごとの注文金額が時間とともにどう変化するかを分析する例を示します。

> **前提条件**：TPC-H データセットが Apache Doris にロードされている必要があります。[TPC-H データの構築ガイド](../../lakehouse/best-practices/tpch.md)を参照してください。

### 1. データセットを作成する

1. 左側のナビゲーションバーで **Datasets**（データセット）、**+ Add Dataset**（データセットを追加）の順にクリックします。

    ![データセットを追加](/images/next/connection-integration/superset/06-superset-add-dataset.png)

2. 次の項目を設定し、右下の **Create dataset and create chart**（データセットとチャートを作成）をクリックします。

    - **Database**（データベース）：Doris
    - **Schema**（スキーマ）：tpch
    - **Table**（テーブル）：lineitem

    ![データテーブルを選択](/images/next/connection-integration/superset/07-superset-add-db.png)

### 2. カスタムメトリクスを追加する

1. データセットの編集ページで **Metrics**（メトリクス）、**Add item**（項目を追加）の順にクリックし、計算メトリクスを追加します。

    - **Metric Key**（メトリクスキー）：Revenue
    - **SQL Expression**（SQL 式）：`SUM(l_extendedprice * (1 - l_discount))`

    ![メトリクスを追加](/images/next/connection-integration/superset/09-superset-metrics.png)

### 3. チャートを作成する

1. **Chart**（チャート）ページに移動し、**+ Add Chart**（チャートを追加）をクリックします。データセットに **lineitem**、チャートの種類に **Line Chart**（折れ線グラフ）を選択します。

    ![チャートの種類を選択](/images/next/connection-integration/superset/10-superset-add-chart.png)

2. チャートのパラメーターを設定します。

    - **l_shipdate** を X 軸にドラッグし、時間の粒度を設定します。
    - **Revenue** メトリクスを **Metrics**（メトリクス）領域にドラッグします。
    - **l_shipmode** 列を **Dimensions**（ディメンション）領域にドラッグします。

    ![チャートを設定](/images/next/connection-integration/superset/11-superset-edit-chart.png)

3. **Update chart**（チャートを更新）をクリックしてチャートをプレビューします。内容を確認したら、**Save**（保存）をクリックしてダッシュボードを保存します。

    ![ダッシュボードを保存](/images/next/connection-integration/superset/12-superset-edit-save-chart.png)

---

## よくある質問とヒント

<!-- Knowledge type: Troubleshooting / Best practices -->

### 前提条件

- 事前に Superset の環境へ `pydoris` をインストールする必要があります。インストールしていない場合、データベースの作成時に Apache Doris の選択肢が表示されません。

### パフォーマンスの最適化

| 最適化項目 | 説明 |
|--------|------|
| テーブルスキーマの設計 | 実際の要件に合わせて Doris のデータベースとテーブルを設計し、時間に基づいてパーティションとバケットを設定します。 |
| 述語プッシュダウン | 述語による絞り込みと転送するデータ量を効果的に減らします。 |
| ネットワークセキュリティ | パブリックネットワークへのアクセスに伴うセキュリティリスクを避けるため、VPC のプライベート接続を使用します。 |
| 権限管理 | Doris のユーザーアカウントのロールとアクセス権限を細かく設定し、過剰な権限を付与しないようにします。 |

### トラブルシューティング

**Q：データベースを追加するときに Apache Doris が選択肢に表示されません。**

A：新しい環境に `pydoris` がインストールされているか確認してください。Superset は実行時に Doris ドライバーを検出した場合にのみ、この選択肢を表示します。インストール後に Superset サービスの再起動が必要になる場合があります。

**Q：接続テストに失敗します。**

A：SQLAlchemy URI の形式が正しいか確認し、Host、Port、ユーザー名、パスワードを使って接続できるか確認してください。先に Doris BE または MySQL Client を使用して接続を検証できます。
