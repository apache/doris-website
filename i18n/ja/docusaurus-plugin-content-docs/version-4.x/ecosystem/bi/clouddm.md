---
{
  "title": "CloudDM",
  "language": "ja",
  "description": "Clougenceによって開発されたCloudDMは、チームと個人ユーザーの両方に向けて設計された強力なクロスプラットフォームデータベース管理ツールです。"
}
---
## はじめに
Clougenceが開発したCloudDMは、チームと個人ユーザー両方向けに設計された強力なクロスプラットフォームデータベース管理ツールです。

Apache Dorisの主要機能に専用サポートを提供し、データアクセス、データマスキング、ビジュアル編集、データベースCI/CDワークフローなどの機能を提供します。

## 前提条件
CloudDMをインストールします。CloudDMは https://www.cdmgr.com/ からダウンロードおよびインストールできます。

## データソースの追加

:::info 注意
CloudDMのバージョンは2.8.0.0以上である必要があります。
:::

1. CloudDMにログインします。
2. **DataSources** > **Add DataSources**をクリックします。
3. Typeで**Doris**を選択します。

   ![add datasource](/images/clouddm1-en.png)

4. Dorisインスタンスに接続するために、以下の必要な情報を入力します。
   - Client Address: DorisクラスターのFEクエリポート、例：hostID:9030
   - Account: Dorisクラスターにログインするためのユーザー名、例：admin
   - Password: Dorisクラスターにログインするためのパスワード

  :::tip
  CloudDMはDorisの内部カタログと外部カタログの両方を管理できます。
  :::

  :::info 注意
  catalog.dbのDatabaseフォームを通じてDorisに接続された外部カタログの管理には、Dorisバージョン2.1.0以上が必要です。
  :::

5. 上部ナビゲーションバーの**Query Settings**をクリックします。次に**Data Management**を有効にします。

   ![enable data manage](/images/clouddm2-en.png)

6. データにアクセスします。
   左側のデータベース接続ナビゲーションパネルで、追加されたDoris接続を確認できます。その後、**CloudDM**を通じてデータの管理を開始できます。

   ![connect to data source](/images/clouddm3-en.png)

## 機能サポート
- Query Client
  - Dorisのデータベースオブジェクトを視覚的に管理
  - コンソールでSQLを記述・実行
  - クエリ結果のエクスポート

- Team Collaboration
  - テーブルレベルの粒度でのステートメントレベル認証
  - SQLリクエストのワークフローと承認
  - データベースCI/CD
  - 機密情報のデータマスキング
  - SQLレビュールール
