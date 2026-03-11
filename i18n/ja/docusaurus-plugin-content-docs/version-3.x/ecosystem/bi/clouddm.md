---
{
  "title": "CloudDM",
  "language": "ja",
  "description": "Clougenceによって開発されたCloudDMは、チームと個人ユーザーの両方向けに設計された強力なクロスプラットフォームデータベース管理ツールです。"
}
---
## はじめに
Clougence によって開発された CloudDM は、チームと個人ユーザーの両方を対象に設計された強力なクロスプラットフォームデータベース管理ツールです。

Apache Doris の主要機能に対する専用サポートを提供し、データアクセス、データマスキング、ビジュアル編集、データベース CI/CD ワークフローなどの機能を提供します。

## 前提条件
CloudDM をインストールします。CloudDM は https://www.cdmgr.com/ からダウンロードしてインストールできます。

## データソースの追加

:::info Note
CloudDM のバージョンは 2.8.0.0 以上である必要があります。
:::

1. CloudDM にログインします。
2. **DataSources** > **Add DataSources** をクリックします。
3. タイプ で **Doris** を選択します。

   ![add datasource](/images/clouddm1-en.png)

4. Doris インスタンスに接続するために以下の必要な情報を入力します。
   - Client Address: Doris クラスターの FE クエリポート、例：hostID:9030
   - Account: Doris クラスターにログインするためのユーザー名、例：admin
   - Password: Doris クラスターにログインするためのパスワード

  :::tip
  CloudDM は Doris の内部カタログと外部カタログの両方を管理できます。
  :::

  :::info Note
  catalog.db の Database フォームを通じて Doris に接続された外部カタログの管理には、Doris バージョン 2.1.0 以上が必要です。
  :::

5. 上部のナビゲーションバーで **Query Settings** をクリックします。そして **Data Management** を有効にします。

   ![enable data manage](/images/clouddm2-en.png)

6. データにアクセスします。
   左側のデータベース接続ナビゲーションパネルで、追加された Doris 接続を表示できます。その後、**CloudDM** を通じてデータの管理を開始できます。

   ![connect to data source](/images/clouddm3-en.png)

## 機能サポート
- Query Client
  - Doris のデータベースオブジェクトをビジュアルに管理
  - コンソールで SQL の記述と実行
  - クエリ結果のエクスポート

- Team Collaboration
  - テーブルレベルの粒度でのステートメントレベル認証
  - SQL リクエストのワークフローと承認
  - Database CI/CD
  - 機密情報のデータマスキング
  - SQL レビュールール
