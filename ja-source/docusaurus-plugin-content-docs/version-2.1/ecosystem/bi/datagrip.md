---
{
  "title": "DataGrip",
  "language": "ja",
  "description": "DataGripは、JetBrains製のリレーショナルデータベースとNoSQLデータベース用の強力なクロスプラットフォームデータベースツールです。"
}
---
## 紹介

DataGripは、JetBrains製のリレーショナルデータベースとNoSQLデータベース向けの強力なクロスプラットフォームデータベースツールです。

Apache DorisはMySQLプロトコルと高い互換性があります。DataGripのMySQLデータソースを使用してApache Dorisに接続し、internal catalogとexternal catalog内のデータをクエリできます。

## 前提条件

DataGripがインストールされていること
www.jetbrains.com/datagrip/ にアクセスしてDataGripをダウンロードおよびインストールできます

## データソースの追加

:::info Note
現在DataGripバージョン2023.3.4を使用して検証済み
:::

1. DataGripを起動します
2. DataGripウィンドウの左上角のプラス記号（**+**）アイコンをクリックし、MySQLデータソースを選択します

    ![add data source](/images/datagrip1.png)

3. Doris接続を設定します

    Data Sources and DriversウィンドウのGeneralタブで、以下の接続情報を設定します：

  - Host：DorisクラスターのFEホストIPアドレス
  - Port：DorisクラスターのFEクエリポート（例：9030）
  - Database：Dorisクラスター内のターゲットデータベース
  - User：Dorisクラスターへのログインに使用するユーザー名（例：admin）
  - Password：Dorisクラスターへのログインに使用するユーザーパスワード

    :::tip
    Databaseはinternal catalogとexternal catalogを区別するために使用できます。Database名のみが入力されている場合、現在のデータソースはデフォルトでinternal catalogに接続されます。catalog.dbの形式の場合、現在のデータソースはDatabaseに入力されたcatalogにデフォルトで接続され、DataGripに表示されるデータベーステーブルも接続されたcatalog内のデータベーステーブルになります。この方法で、DataGripのMySQLデータソースを使用して複数のDorisデータソースを作成し、Doris内の異なるカタログを管理できます。
    :::

    :::info Note
    catalog.dbのDatabase形式を通じてDorisに接続されたexternal catalogを管理するには、Dorisバージョン2.1.0以上が必要です。
    :::

  - internal catalog

    ![connect internal catalog](/images/datagrip2.png)

  - external catalog

    ![connect external catalog](/images/datagrip3.png)

5. データソース接続をテストします

    接続情報を入力後、左下角のTest Connectionをクリックしてデータベース接続情報の正確性を検証します。DBeaverが以下のポップアップウィンドウを返す場合、テスト接続は成功です。その後、右下角のOKをクリックして接続設定を完了します。

   ![test connection](/images/datagrip4.png)

6. データベースに接続します

    データベース接続が確立された後、左側のデータベース接続ナビゲーションで作成されたデータソース接続を確認でき、DataGripを通じてデータベースに接続して管理できます。

   ![create connection](/images/datagrip5.png)

## 機能サポート

基本的にほとんどのビジュアル表示操作およびSQLコンソールでのSQL操作の記述をサポートしています。Dorisはデータベーステーブルの作成、スキーマ変更、データの追加・削除・変更などの様々な操作をサポートしていない、または検証されていません。
