---
{
  "title": "FineBI",
  "language": "ja",
  "description": "ビジネスインテリジェンス製品として、FineBIはデータ処理、リアルタイム分析の"
}
---
## FineBI紹介

ビジネスインテリジェンス製品として、FineBIはデータ処理、リアルタイム分析、多次元分析Dashboardなどの機能を持つシステムアーキテクチャを有しています。FineBIは豊富なデータソース接続と複数のビューを持つテーブルの分析および管理をサポートします。FineBIはApache Dorisの内部および外部データのモデリングと可視化を正常にサポートできます。

## 前提条件

FineBI 5.0以降をインストールしてください。ダウンロードリンク：https://intl.finebi.com/

## ログインと接続

1. アカウントを作成してFineBIにログインします

   ![login page](/images/bi-finebi-en-1.png)

2. 内蔵データベースを選択します。外部データベース設定を選択する必要がある場合は、ドキュメントを参照してください：https://help.fanruan.com/finebi-en/doc-view-4437.html

   :::info Note
   FineBIの情報リポジトリとして内蔵データベースを選択することをお勧めします。ここで選択されるデータベースタイプは、データをクエリおよび分析するためのターゲットデータベースではなく、FineBIモデル、dashboardおよびその他の情報を格納および維持するためのデータベースです。FineBIはそれに対して追加、削除、変更、および確認を行う必要があります。
   :::

   ![select database](/images/bi-finebi-en-2.png)

3. Management Systemボタンをクリックし、Data Connectionsのデータベース接続管理を選択して新しいデータベース接続を作成します。

   ![data connection](/images/bi-finebi-en-3.png)

4. 新しいデータベース接続ページでMySQLデータベースを選択します

   ![select connection](/images/bi-finebi-en-4.png)

5. Dorisデータベースのリンク情報を入力します

    - パラメータの説明は以下の通りです：

        - Username：Dorisにログインするためのユーザー名

        - Password：現在のユーザーのパスワード

        - Host：DorisクラスターのFEホストのIPアドレス

        - Port：DorisクラスターのFEクエリポート

        - Coding：Dorisクラスターのエンコード形式

        - Name Database：Dorisクラスターのターゲットデータベース

   ![connection information](/images/bi-finebi-en-5-1.png)

6. テストリンクをクリックします。接続情報が正しい場合、接続成功が表示されます

   ![connection test](/images/bi-finebi-en-6.png)

## モデルの作成

1. 「パブリックデータ」セクションで、新しいデータセットの作成をクリックします。次にデータベーステーブルをクリックします

   ![new dataset](/images/bi-finebi-en-7.png)

2. 既存のデータベース接続でテーブルをインポートする必要があります

   ![select table](/images/bi-finebi-en-8-2.png)

3. テーブルをインポートした後、インポートした各テーブルを更新する必要があります。テーブルを更新した後でのみ、トピックでテーブルを分析できます

   ![refresh table](/images/bi-finebi-en-9.png)

4. インポートしたパブリックデータを編集されたトピックに追加し、ビジネスロジックに従ってコンパス分析と設定を行います。

   ![data analysis](/images/bi-finebi-en-10.png)
