---
{
  "title": "CloudDM",
  "language": "ja",
  "description": "Clougenceが開発したCloudDMは、チームと個人ユーザーの両方に向けて設計された強力なクロスプラットフォームデータベース管理ツールです。"
}
---
## はじめに
Clougenceが開発したCloudDMは、チームと個人ユーザーの両方向けに設計された強力なクロスプラットフォーム データベース管理ツールです。

Apache Dorisの主要機能に専用のサポートを提供し、データアクセス、データマスキング、ビジュアル編集、データベースCI/CDワークフローなどの機能を提供します。

## 前提条件
CloudDMをインストールしてください。CloudDMは https://www.cdmgr.com/ からダウンロードしてインストールできます。

## データソースの追加

:::info Note
CloudDMのバージョンは2.8.0.0以上である必要があります。
:::

1. CloudDMにログインします。
2. **DataSources** > **Add DataSources**をクリックします。
3. タイプで**Doris**を選択します。

   ![add datasource](/images/clouddm1-en.png)

4. Dorisインスタンスに接続するために以下の必要な情報を入力します。
   - Client Address: Dorisクラスターのクエリポート。例: hostID:9030
   - Account: Dorisクラスターにログインするために使用されるユーザー名。例: admin
   - Password: Dorisクラスターにログインするために使用されるパスワード

  :::tip
  CloudDMはDoris内の内部カタログと外部カタログの両方を管理できます。
  :::

  :::info Note
  catalog.dbのDatabaseフォームを通じてDorisに接続された外部カタログを管理するには、Dorisバージョン2.1.0以上が必要です。
  :::

5. トップナビゲーションバーの**Query Settings**をクリックします。その後、**Data Management**を有効にします。

   ![enable data manage](/images/clouddm2-en.png)

6. データへのアクセス
   左側のデータベース接続ナビゲーションパネルで、追加されたDoris接続を確認できます。その後、**CloudDM**を通じてデータの管理を開始できます。

   ![connect to data source](/images/clouddm3-en.png)

## 機能サポート
- Query Client
  - Doris内のデータベースオブジェクトのビジュアル管理
  - コンソールでのSQL記述と実行
  - クエリ結果のエクスポート

- Team Collaboration
  - テーブルレベルの粒度を持つステートメントレベルの認可
  - SQLリクエストのワークフローと承認
  - データベースCI/CD
  - 機密情報のデータマスキング
  - SQLレビュールール
