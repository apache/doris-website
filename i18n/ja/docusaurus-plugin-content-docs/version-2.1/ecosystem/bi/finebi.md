---
{
  "title": "FineBI",
  "language": "ja",
  "description": "ビジネスインテリジェンス製品として、FineBIはデータ処理、リアルタイム分析の システムアーキテクチャを持っています、"
}
---
## FineBI 紹介

ビジネスインテリジェンス製品として、FineBIはデータ処理、リアルタイム分析、多次元分析Dashboardなどの機能を持つシステムアーキテクチャを備えています。FineBIは豊富なデータソース接続と複数のビューを持つテーブルの分析および管理をサポートします。FineBIはApache Dorisの内部および外部データのモデリングと可視化を正常にサポートできます。

## 前提条件

FineBI 5.0以降をインストールしてください。ダウンロードリンク：https://intl.finebi.com/

## ログインと接続

1. アカウントを作成してFineBIにログインします

   ![login page](/images/bi-finebi-en-1.png)

2. 内蔵データベースを選択します。外部データベース設定を選択する必要がある場合は、以下のドキュメントをご利用ください：https://help.fanruan.com/finebi-en/doc-view-4437.html

   :::info Note
   FineBIの情報リポジトリとして内蔵データベースを選択することを推奨します。ここで選択するデータベースタイプは、データをクエリおよび分析するターゲットデータベースではなく、FineBIモデル、dashboardなどの情報を保存・維持するためのデータベースです。FineBIはこれに対して追加、削除、修正、確認を行う必要があります。
   :::

   ![select database](/images/bi-finebi-en-2.png)

3. 管理システムボタンをクリックし、Data Connectionsのデータベース接続管理を選択して新しいデータベース接続を作成します。

   ![data connection](/images/bi-finebi-en-3.png)

4. 新しいデータベース接続ページで、MySQLデータベースを選択します

   ![select connection](/images/bi-finebi-en-4.png)

5. Dorisデータベースのリンク情報を入力します

    - パラメータの説明は以下の通りです：

        - Username：Dorisへのログイン用ユーザー名。

        - Password：現在のユーザーのパスワード。

        - Host：DorisクラスターのFEホストのIPアドレス。

        - Port：DorisクラスターのFEクエリポート。

        - Coding：Dorisクラスターのエンコーディング形式。

        - Name Database：Dorisクラスター内のターゲットデータベース。

   ![connection information](/images/bi-finebi-en-5-1.png)

6. テストリンクをクリックします。接続情報が正しい場合、接続成功が表示されます

   ![connection test](/images/bi-finebi-en-6.png)

## モデルの作成

1. 「公開データ」セクションで、新しいデータセットの作成をクリックします。次に、データベーステーブルをクリックします

   ![new dataset](/images/bi-finebi-en-7.png)

2. 既存のデータベース接続でテーブルをインポートする必要があります

   ![select table](/images/bi-finebi-en-8-2.png)

3. テーブルをインポートした後、インポートした各テーブルを更新する必要があります。テーブルを更新した後でのみ、トピック内でテーブルを分析できます

   ![refresh table](/images/bi-finebi-en-9.png)

4. インポートした公開データを編集されたトピックに追加し、その後ビジネスロジックに従ってコンパス分析と設定を実行します。

   ![data analysis](/images/bi-finebi-en-10.png)
