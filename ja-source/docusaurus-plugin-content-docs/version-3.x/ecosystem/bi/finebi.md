---
{
  "title": "FineBI",
  "language": "ja",
  "description": "ビジネスインテリジェンス製品として、FineBIはデータ処理、リアルタイム分析の系統アーキテクチャを持ち、"
}
---
## FineBI Introduction

ビジネス インテリジェンス製品として、FineBIはデータ処理、リアルタイム分析、多次元分析Dashboardなどの機能のシステム アーキテクチャを持っています。FineBIは豊富なデータソース接続と複数のビューを持つテーブルの分析および管理をサポートしています。FineBIはApache Dorisの内部および外部データのモデリングと可視化を正常にサポートできます。

## 前提条件

FineBI 5.0以降をインストールしてください。ダウンロードリンク: https://intl.finebi.com/

## ログインと接続

1. アカウントを作成してFineBIにログインします

   ![login page](/images/bi-finebi-en-1.png)

2. 内蔵データベースを選択します。外部データベース構成を選択する必要がある場合は、ドキュメントが利用可能です: https://help.fanruan.com/finebi-en/doc-view-4437.html

   :::info Note
   FineBIの情報リポジトリとして内蔵データベースを選択することを推奨します。ここで選択するデータベース タイプは、データをクエリおよび分析するターゲット データベースではなく、FineBIモデル、dashboardおよびその他の情報を格納および保守するためのデータベースです。FineBIはそれに対して追加、削除、変更、確認を行う必要があります。
   :::

   ![select database](/images/bi-finebi-en-2.png)

3. Management Systemボタンをクリックし、Data Connectionsでデータベース接続管理を選択して新しいデータベース接続を作成します。

   ![data connection](/images/bi-finebi-en-3.png)

4. 新しいデータベース接続ページで、MySQLデータベースを選択します

   ![select connection](/images/bi-finebi-en-4.png)

5. Dorisデータベースのリンク情報を入力します

    - パラメータは以下のように説明されます:

        - Username: Dorisにログインするためのユーザー名。

        - Password: 現在のユーザーのパスワード。

        - Host: DorisクラスターのFEホストのIPアドレス。

        - Port: DorisクラスターのFEクエリポート。

        - Coding: Dorisクラスターのエンコード形式。

        - Name Database: Dorisクラスター内のターゲット データベース。

   ![connection information](/images/bi-finebi-en-5-1.png)

6. テスト リンクをクリックします。接続情報が正しい場合、Connection succeededが表示されます

   ![connection test](/images/bi-finebi-en-6.png)

## モデルの作成

1. 「Public Data」セクションで、新しいデータセットを作成するためにクリックします。次に、データベース テーブルをクリックします

   ![new dataset](/images/bi-finebi-en-7.png)

2. 既存のデータベース接続でテーブルをインポートする必要があります

   ![select table](/images/bi-finebi-en-8-2.png)

3. テーブルをインポートした後、インポートした各テーブルを更新する必要があります。テーブルを更新した後でのみ、トピック内でテーブルを分析できます

   ![refresh table](/images/bi-finebi-en-9.png)

4. インポートしたパブリック データを編集したトピックに追加し、ビジネス ロジックに従ってコンパス分析と構成を実行します。

   ![data analysis](/images/bi-finebi-en-10.png)
