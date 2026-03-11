---
{
  "title": "DataGrip",
  "language": "ja",
  "description": "DataGripは、JetBrains製のリレーショナルデータベースおよびNoSQLデータベース用の強力なクロスプラットフォームデータベースツールです。"
}
---
## 概要

DataGripは、JetBrains製の関係データベースとNoSQLデータベース向けの強力なクロスプラットフォームデータベースツールです。

Apache DorisはMySQLプロトコルとの高い互換性を持っています。DataGripのMySQLデータソースを使用してApache Dorisに接続し、internal catalogとexternal catalog内のデータをクエリできます。

## 前提条件

DataGripがインストールされていること
www.jetbrains.com/datagrip/ にアクセスしてDataGripをダウンロード・インストールできます

## データソースの追加

:::info Note
現在、DataGripバージョン2023.3.4を使用して検証済み
:::

1. DataGripを起動
2. DataGripウィンドウの左上にあるプラス記号（**+**）アイコンをクリックし、MySQLデータソースを選択

    ![add data source](/images/datagrip1.png)

3. Doris接続の設定

    Data Sources and DriversウィンドウのGeneralタブで、以下の接続情報を設定します：

  - Host: DorisクラスタのFEホストIPアドレス
  - Port: Dorisクラスタのクエリポート（例：9030）
  - Database: Dorisクラスタ内のターゲットデータベース
  - User: Dorisクラスタへのログインに使用するユーザー名（例：admin）
  - Password: Dorisクラスタへのログインに使用するユーザーパスワード

    :::tip
    Databaseはinternal catalogとexternal catalogを区別するために使用できます。Database名のみが記入されている場合、現在のデータソースはデフォルトでinternal catalogに接続されます。catalog.dbの形式の場合、現在のデータソースはDatabaseに記入されたcatalogにデフォルトで接続され、DataGripに表示されるデータベーステーブルも接続されたcatalog内のデータベーステーブルになります。この方法により、DataGripのMySQLデータソースを使用して複数のDorisデータソースを作成し、Doris内の異なるカタログを管理できます。
    :::

    :::info Note
    catalog.dbのDatabase形式でDorisに接続されたexternal catalogを管理するには、Dorisバージョン2.1.0以上が必要です。
    :::

  - internal catalog

    ![connect internal catalog](/images/datagrip2.png)

  - external catalog

    ![connect external catalog](/images/datagrip3.png)

5. データソース接続のテスト

    接続情報を入力後、左下のTest Connectionをクリックして、データベース接続情報の正確性を検証します。DataGripが以下のポップアップウィンドウを返した場合、テスト接続は成功です。その後、右下のOKをクリックして接続設定を完了します。

   ![test connection](/images/datagrip4.png)

6. データベースへの接続

    データベース接続が確立された後、左側のデータベース接続ナビゲーションで作成されたデータソース接続を確認でき、DataGripを通じてデータベースに接続し管理できます。

   ![create connection](/images/datagrip5.png)

## 機能サポート

基本的にほとんどの視覚的な閲覧操作とSQLコンソールでのSQL操作の記述をサポートしています。Dorisはデータベーステーブルの作成、スキーマ変更、データの追加・削除・変更などの各種操作をサポートしていないか、検証されていません。
