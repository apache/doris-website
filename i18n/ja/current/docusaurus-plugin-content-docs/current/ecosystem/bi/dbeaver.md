---
{
  "title": "DBeaver",
  "language": "ja",
  "description": "DBeaverは、開発者、データベース管理者、アナリスト、およびデータを扱うすべての人のためのクロスプラットフォームデータベースツールです。"
}
---
## 概要

DBeaver は、開発者、データベース管理者、アナリスト、およびデータを扱うすべての人のためのクロスプラットフォームデータベースツールです。

Apache Doris は MySQL プロトコルと高い互換性があります。DBeaver の MySQL ドライバーを使用して Apache Doris に接続し、internal catalog および external catalog のデータをクエリできます。

## 前提条件

Dbeaver がインストール済み
https://dbeaver.io にアクセスして DBeaver をダウンロードしてインストールできます

## データソースの追加

:::info Note
現在 DBeaver バージョン 24.0.0 を使用して検証済み
:::

1. DBeaver を起動

2. DBeaver ウィンドウの左上角にあるプラス記号（**+**）アイコンをクリックするか、メニューバーで **Database > New Database Connection** を選択して **Connect to a database** インターフェースを開きます。
   
    ![add connection 1](/images/dbeaver1.png)

    ![add connection 2](/images/dbeaver2.png)

3. MySQL ドライバーを選択

    **Select your database** ウィンドウで **MySQL** を選択します。

    ![chose driver](/images/dbeaver3.png)

4. Doris 接続の設定

    **Connection Settings** ウィンドウの **main** タブで、以下の接続情報を設定します：

  - Server Host: Doris クラスターの FE ホスト IP アドレス。
  - Port: Doris クラスターの FE クエリポート（例：9030）。
  - Database: Doris クラスター内のターゲットデータベース。
  - Username: Doris クラスターにログインするために使用するユーザー名（例：admin）。
  - Password: Doris クラスターにログインするために使用するユーザーパスワード。

   :::tip
   Database は internal catalog と external catalog を区別するために使用できます。Database 名のみが入力されている場合、現在のデータソースはデフォルトで internal catalog に接続されます。形式が catalog.db の場合、現在のデータソースはデフォルトで Database に入力された catalog に接続され、DBeaver に表示されるデータベーステーブルも接続された catalog 内のデータベーステーブルになるため、DBeaver の MySQL ドライバーを使用して複数の Doris データソースを作成し、Doris 内の異なる Catalog を管理できます。
   :::

   :::info Note
   catalog.db の Database 形式を通じて Doris に接続された external catalog を管理するには、Doris バージョン 2.1.0 以上が必要です。
   :::

  - internal catalog
    ![connect internal catalog](/images/dbeaver4.png)
  - external catalog
    ![connect external catalog](/images/dbeaver5.png)

5. データソース接続のテスト

   接続情報を入力後、左下の Test Connection をクリックしてデータベース接続情報の精度を検証します。DBeaver は以下のダイアログボックスを返して接続情報の設定を確認します。OK をクリックして設定された接続情報が正しいことを確認します。その後、右下の Finish をクリックして接続設定を完了します。
   ![test connection](/images/dbeaver6.png)

6. データベースに接続

   データベース接続が確立された後、左側のデータベース接続ナビゲーションで作成されたデータソース接続を確認でき、DBeaver を通じてデータベースに接続して管理できます。
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

    基本サポート部分は、エラーなしでクリックして表示できることを意味しますが、プロトコル互換性の問題により、表示が不完全な場合があります。

  - ビジュアル表示クラス
    - dash board
    - Users/user/properties
    - Session Status
    - Global Status
- 非サポート

  非サポート部分は、DBeaver を使用して Doris を管理する際に、特定のビジュアル操作を実行するとエラーが報告される場合があるか、一部のビジュアル操作が検証されていないことを意味します。
  例：データベーステーブルのビジュアル作成、schema change、データの追加・削除・変更など。
