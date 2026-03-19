---
{
  "title": "DataGrip",
  "language": "ja",
  "description": "DataGripは、JetBrains社が開発したリレーショナルデータベースとNoSQLデータベース用の強力なクロスプラットフォームデータベースツールです。"
}
---
## 紹介

DataGripはJetBrainsによるリレーショナルデータベースとNoSQLデータベース用の強力なクロスプラットフォームデータベースツールです。

Apache DorisはMySQLプロトコルとの高い互換性を持っています。DataGripのMySQLデータソースを使用してApache Dorisに接続し、internal catalogとexternal catalog内のデータをクエリできます。

## 前提条件

DataGripがインストール済み
www.jetbrains.com/datagrip/ にアクセスしてDataGripをダウンロードしてインストールできます

## データソースの追加

:::info Note
現在DataGripバージョン2023.3.4を使用して検証済み
:::

1. DataGripを開始
2. DataGripウィンドウの左上角にあるプラスサイン（**+**）アイコンをクリックし、MySQLデータソースを選択

    ![add data source](/images/datagrip1.png)

3. Doris接続の設定

    Data Sources and DriversウィンドウのGeneralタブで、以下の接続情報を設定します：

  - Host: DorisクラスターのFEホストIPアドレス。
  - Port: Dorisクラスターの FEクエリポート、例：9030。
  - Database: Dorisクラスター内のターゲットデータベース。
  - User: Dorisクラスターにログインするために使用するユーザー名、例：admin。
  - Password: Dorisクラスターにログインするために使用するユーザーパスワード。

    :::tip
    Databaseはinternal catalogとexternal catalogを区別するために使用できます。Database名のみが入力されている場合、現在のデータソースはデフォルトでinternal catalogに接続されます。形式がcatalog.dbの場合、現在のデータソースはDatabaseに入力されたcatalogにデフォルトで接続され、DataGripに表示されるデータベーステーブルも接続されたcatalog内のデータベーステーブルになります。この方法により、DataGripのMySQLデータソースを使用して複数のDorisデータソースを作成し、Doris内の異なるカタログを管理できます。
    :::

    :::info Note
    catalog.db形式のDatabaseを通じてDorisに接続されたexternal catalogを管理するにはDorisバージョン2.1.0以上が必要です。
    :::

  - internal catalog

    ![connect internal catalog](/images/datagrip2.png)

  - external catalog

    ![connect external catalog](/images/datagrip3.png)

5. データソース接続のテスト

    接続情報を入力後、左下角のTest Connectionをクリックしてデータベース接続情報の正確性を確認します。DataGripが以下のポップアップウィンドウを返す場合、テスト接続は成功です。その後、右下角のOKをクリックして接続設定を完了します。

   ![test connection](/images/datagrip4.png)

6. データベースへの接続

    データベース接続が確立された後、左側のデータベース接続ナビゲーションで作成されたデータソース接続を確認でき、DataGripを通じてデータベースに接続して管理できます。

   ![create connection](/images/datagrip5.png)

## 機能サポート

基本的にほとんどのビジュアル表示操作と、SQLコンソールでのSQL記述操作をサポートします。Dorisではサポートされていない、または検証されていない、データベーステーブルの作成、スキーマ変更、データの追加、削除、変更などの各種操作があります。
