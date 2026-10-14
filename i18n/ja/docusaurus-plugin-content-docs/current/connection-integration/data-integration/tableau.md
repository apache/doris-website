---
{
    "title": "Tableau",
    "language": "ja",
    "description": "Tableau の公式 MySQL コネクタと MySQL JDBC ドライバーを介して Apache Doris に接続し、データソースの統合、視覚的な分析、ダッシュボードの作成を行います。",
    "keywords": [
        "Tableau",
        "Apache Doris",
        "BI",
        "データ可視化",
        "MySQL JDBC",
        "データソース統合"
    ],
    "sidebar_label": "Tableau"
}
---

<!-- Knowledge Type: Operational Steps -->
<!-- Applicable Scenario: Connect to Apache Doris in Tableau for data visualization and dashboard development -->

# Tableau

[Tableau](https://www.tableau.com/) は、主要なビジネスインテリジェンス（BI）とデータ可視化のツールです。Apache Doris は MySQL プロトコルと互換性があるため、専用のプラグインを使わずに、Tableau の公式 **MySQL コネクタ**（MySQL JDBC ドライバーを使用）から直接接続できます。

このドキュメントは、次のようなケースを対象としています。

- 既存の Apache Doris クラスターのデータを Tableau で探索し、レポートを作成したい場合。
- Doris の明細データや集計結果を Tableau のワークブックのデータソースとして使いたい場合。
- Doris の分析結果を Tableau のダッシュボードで公開したい場合。

このドキュメントの手順を完了すると、次のことができるようになります。

1. ローカル環境に Tableau Desktop と MySQL JDBC ドライバーをインストールして設定する。
2. Tableau から Apache Doris へのデータソース接続を作成する。
3. Doris のデータソースを使って、Tableau でグラフとダッシュボードを作成する。

## 前提条件

作業を始める前に、次の要件を満たしていることを確認してください。

| 項目 | 要件 |
| --- | --- |
| Apache Doris クラスター | アクセス可能で、FE の MySQL プロトコル用ポート（デフォルトは `9030`）が開いていること |
| データベースアカウント | 対象データベースに対する読み取り権限があること |
| Tableau Desktop | 最新バージョンがインストールされていること（[ダウンロードページ](https://www.tableau.com/products/desktop/download)） |
| MySQL JDBC ドライバー | バージョン 8.3.0（[ダウンロードリンク](https://velodb-bi-connector-1316291683.cos.ap-hongkong.myqcloud.com/Tableau/latest/mysql-connector-j-8.3.0.jar)） |

## ステップ 1：Tableau と JDBC ドライバーをインストールする

1. [Tableau Desktop](https://www.tableau.com/products/desktop/download) をダウンロードしてインストールします。
2. [MySQL JDBC Driver 8.3.0](https://velodb-bi-connector-1316291683.cos.ap-hongkong.myqcloud.com/Tableau/latest/mysql-connector-j-8.3.0.jar) をダウンロードします。
3. JDBC ドライバーの jar ファイルを、Tableau が指定するディレクトリに配置します。

    | OS | ドライバーの配置先 |
    | --- | --- |
    | macOS | `~/Library/Tableau/Drivers` |
    | Windows | `%tableau_path%\Drivers\`（デフォルトは `tableau_path = C:\Program Files\Tableau`） |

4. ドライバーを読み込むために Tableau Desktop を再起動します。

## ステップ 2：Tableau で Apache Doris データソースを設定する

ドライバーのインストール後、Tableau で Doris に接続するデータソースを作成できます。以下の例では `tpch` データベースを使用します。

### 1. 接続情報を準備する

JDBC を介して Apache Doris に接続するために必要なパラメーターは次のとおりです。

| パラメーター | 説明 | 例 |
| --- | --- | --- |
| Server | Doris FE のホストアドレス | `127.0.0.1` |
| Port | Doris FE の MySQL プロトコル用ポート | `9030` |
| Database | データベース名 | `tpch` |
| Username | ユーザー名 | `testuser` |
| Password | パスワード | （アカウントに応じて入力） |
| Init SQL Statement | 接続の確立後に自動実行される初期化 SQL | `select * from database.table` |

### 2. 接続を作成する

1. Tableau Desktop を起動します。すでに起動している場合は、ドライバーを読み込むために再起動します。
2. 左側のメニューにある **To a Server** の下で **More** をクリックし、コネクタの一覧から **MySQL** を検索します。

    ![MySQL コネクタを検索する](/images/next/connection-integration/data-integration/tableau/QSrsbadm0oEiuHxyGv3clFhTnLh.png)

3. **MySQL** をクリックして接続設定ダイアログを開きます。

    ![MySQL の接続設定ダイアログ](/images/next/connection-integration/data-integration/tableau/DN47bCp5ZovHCmxH0DAc3fBonR3.png)

4. ダイアログの案内に従って、前の手順で準備した接続情報を入力します。
5. **Sign In** をクリックします。接続に成功すると、新しい Tableau ワークブックが開きます。

    ![Tableau のワークブック](/images/next/connection-integration/data-integration/tableau/LJK9bPMptoAGjGxzoCtcY8Agnye.png)

## ステップ 3：Tableau で可視化を作成する

以下では、TPC-H データセットを使って、Doris データソースから可視化を作成する方法を説明します。TPC-H データの作成方法については、[TPC-H ベンチマークのドキュメント](../../lakehouse/best-practices/tpch.md)を参照してください。

### 1. データテーブルを結合する

1. `customer` テーブルと `orders` テーブルをワークブックにドラッグし、下部のパネルで結合フィールドを `Custkey` に設定します。

    ![customer と orders を結合する](/images/next/connection-integration/data-integration/tableau/ZJuBbDBc5o2Gnyxhn7icv30xnXw.png)

2. `nation` テーブルをワークブックにドラッグし、`customer` との結合フィールドを `Nationkey` に設定します。

    ![nation と customer を結合する](/images/next/connection-integration/data-integration/tableau/GPXQbcNUnobHtLx5sIocMHAwn2d.png)

3. 三つのテーブルを結合すると、分析に使用できるデータソースができます。ワークシートに移るには、ワークブック下部の `Sheet 1` タブをクリックします。

    ![ワークシートを開く](/images/next/connection-integration/data-integration/tableau/FsHmbUOKIoFT5YxWmGecLArLnjd.png)

### 2. シナリオ A：年別顧客数の集計（折れ線グラフ）

`OrderDate`（`orders` テーブル）を `Columns` に、`customer(count)`（`customer` テーブル）を `Rows` にドラッグします。Tableau が折れ線グラフを生成します。

![年別顧客数の折れ線グラフ](/images/next/connection-integration/data-integration/tableau/I9SCbCFzoo7TgLx6BP1cHdtRnWc.png)

:::note
TPC-H データセットはスクリプトによってデフォルトのルールで生成されたもので、実際の業務データではありません。結果は機能の説明と接続確認のみを目的としています。
:::

### 3. シナリオ B：地域別・年別の平均注文金額

1. `New Worksheet` をクリックして新しいシートを作成します。
2. `Name`（`nation` テーブル）を `Rows` にドラッグします。
3. `OrderDate`（`orders` テーブル）を `Columns` にドラッグします。

    この時点では集計対象のメジャーが指定されていないため、表にはプレースホルダーの `Abc` が表示されます。

4. `Totalprice`（`orders` テーブル）を表の中央にドラッグします。デフォルトの集計方法は `SUM` です。

    ![デフォルトの SUM 集計](/images/next/connection-integration/data-integration/tableau/Am9IbyUo4o30DixVi2ccoZvKn8b.png)

5. `SUM` をクリックし、`Measure` を `Average` に変更します。

    ![Average に変更する](/images/next/connection-integration/data-integration/tableau/AaFwbMOKTo86NaxU54mcVYs1nJd.png)

6. 同じドロップダウンメニューで `Format` を選択し、`Numbers` を `Currency (Standard)` に設定します。

    ![通貨形式に設定する](/images/next/connection-integration/data-integration/tableau/ZmRDbjws9o5Ampx4YZYcS6Umnqf.png)

7. 最終的なレポートは、次の想定結果のようになります。

    ![最終的なレポート](/images/next/connection-integration/data-integration/tableau/MNb0bjoB2ozn4kxfKx9cVj2hnhb.png)

これで Tableau を Apache Doris に接続し、データ分析と可視化のダッシュボードを作成できました。

## ベストプラクティス

### パフォーマンスの最適化

- **テーブルスキーマを慎重に設計する**：クエリのパターンに基づいて Doris テーブルのパーティションとバケットを設計し、スキャンするデータ量とデータ転送のコストを削減します。
- **マテリアライズドビューを使用する**：集計クエリを頻繁に実行する場合は、Doris でマテリアライズドビューを作成して集計結果を事前に計算し、Tableau ダッシュボードの応答を速くします。
- **適切な更新スケジュールを設定する**：ダッシュボードのデータを最新の状態に保ちながらクラスターの負荷を抑えるため、更新頻度と計算リソースの消費量のバランスを取ります。

### セキュリティ設定

- **ネットワーク分離**：パブリックネットワークから Doris に直接アクセスする代わりに、VPC のプライベート接続を使用します。
- **アクセス制御**：セキュリティグループを使って Doris のポートへのアクセス元を制限します。
- **通信の暗号化**：SSL/TLS による暗号化接続を有効にします。
- **最小権限の原則**：過剰な権限付与を避けるため、Doris のユーザーロールと権限を細かく設定します。
