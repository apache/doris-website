---
{
  "title": "DBeaver",
  "language": "ja",
  "description": "DBeaverは、開発者、データベース管理者、アナリスト、およびデータを扱うすべての人のためのクロスプラットフォームデータベースツールです。"
}
---
## はじめに

DBeaverは、開発者、データベース管理者、アナリスト、およびデータを扱うすべての人のためのクロスプラットフォームデータベースツールです。

Apache DorisはMySQLプロトコルとの高い互換性を持っています。DBeaverのMySQLドライバーを使用してApache Dorisに接続し、internal catalogおよびexternal catalog内のデータを照会できます。

## 前提条件

Dbeaverがインストールされている
https://dbeaver.io にアクセスしてDBeaverをダウンロードしてインストールできます

## データソースの追加

:::info Note
現在DBeaver version 24.0.0を使用して検証済み
:::

1. DBeaverを起動

2. DBeaverウィンドウの左上角のプラス記号（**+**）アイコンをクリックするか、メニューバーで**Database > New Database Connection**を選択して**Connect to a database**インターフェースを開きます。
   
    ![add connection 1](/images/dbeaver1.png)

    ![add connection 2](/images/dbeaver2.png)

3. MySQLドライバーを選択

    **Select your database**ウィンドウで、**MySQL**を選択します。

    ![chose driver](/images/dbeaver3.png)

4. Doris接続を構成

    **Connection Settings**ウィンドウの**main**タブで、以下の接続情報を構成します：

  - サーバー Host: DorisクラスターのFE host IPアドレス。
  - Port: DorisクラスターのFE query port（例：9030）。
  - Database: Dorisクラスター内のターゲットデータベース。
  - Username: Dorisクラスターへのログインに使用するユーザー名（例：admin）。
  - Password: Dorisクラスターへのログインに使用するユーザーパスワード。

   :::tip
   Databaseはinternal catalogとexternal catalogを区別するために使用できます。Database名のみが入力された場合、現在のデータソースはデフォルトでinternal catalogに接続されます。形式がcatalog.dbの場合、現在のデータソースはDatabaseに入力されたcatalogにデフォルトで接続され、DBeaverに表示されるデータベーステーブルは接続されたcatalog内のデータベーステーブルになるため、DBeaverのMySQLドライバーを使用して複数のDorisデータソースを作成し、Doris内の異なるカタログを管理できます。
   :::

   :::info Note
   catalog.dbのDatabase形式を通じてDorisに接続されたexternal catalogを管理するには、Doris version 2.1.0以上が必要です。
   :::

  - internal catalog
    ![connect internal catalog](/images/dbeaver4.png)
  - external catalog
    ![connect external catalog](/images/dbeaver5.png)

5. データソース接続をテスト

   接続情報を入力した後、左下角のTest Connectionをクリックしてデータベース接続情報の正確性を確認します。DBeaverは以下のダイアログボックスを返して接続情報の構成を確認します。OKをクリックして構成された接続情報が正しいことを確認します。その後、右下角のFinishをクリックして接続構成を完了します。
   ![test connection](/images/dbeaver6.png)

6. データベースに接続

   データベース接続が確立された後、左側のデータベース接続ナビゲーションで作成されたデータソース接続を確認でき、DBeaverを通じてデータベースに接続して管理できます。
   ![create connection](/images/dbeaver7.png)

## 機能サポート
- 完全サポート
  - ビジュアル表示クラス
    - Databases
      - Tables
      - Views
    - Users
      - Administer
    - Session Manager
    - System Info
      - Session Variables
      - Global Variables
      - Engines
      - Charsets
      - User Priviages
      - Plugin
    - 操作クラス
      - SQL editor
      - SQL console
- 基本サポート

    基本サポート部分は、エラーなしでクリックして表示できることを意味しますが、プロトコル互換性の問題により、表示が不完全になる場合があります。

  - ビジュアル表示クラス
    - dash board
    - Users/user/properties
    - Session Status
    - Global Status
- サポートなし

  サポートなし部分は、DBeaverを使用してDorisを管理する際、特定のビジュアル操作を実行するとエラーが報告される可能性があるか、一部のビジュアル操作が検証されていないことを意味します。
  データベーステーブルのビジュアル作成、schema change、データの追加、削除、変更などがあります。
