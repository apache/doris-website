---
{
  "title": "FineBI",
  "language": "ja",
  "description": "ビジネスインテリジェンス製品として、FineBIはデータ処理、リアルタイム分析の系統アーキテクチャを持っています、"
}
---
## FineBI 概要

ビジネスインテリジェンス製品として、FineBIはデータ処理、リアルタイム分析、多次元分析Dashboard等の機能を持つシステムアーキテクチャを有しています。FineBIは豊富なデータソース接続と複数ビューを持つテーブルの分析・管理をサポートします。FineBIはApache Dorisの内部および外部データのモデリングと可視化を正常にサポートできます。

## 前提条件

FineBI 5.0以降をインストール、ダウンロードリンク：https://intl.finebi.com/

## ログインと接続

1. アカウントを作成してFineBIにログインします

   ![login page](/images/bi-finebi-en-1.png)

2. 内蔵データベースを選択します。外部データベース設定を選択する必要がある場合は、ドキュメントが利用可能です：https://help.fanruan.com/finebi-en/doc-view-4437.html

   :::info Note
   FineBIの情報リポジトリとして内蔵データベースを選択することを推奨します。ここで選択されるデータベースタイプは、データの照会と分析の対象データベースではなく、FineBIのモデル、dashboard、その他の情報を格納・維持するためのデータベースです。FineBIはこれに対して追加、削除、変更、チェックを行う必要があります。
   :::

   ![select database](/images/bi-finebi-en-2.png)

3. 管理システムボタンをクリックし、Data Connectionsのデータベース接続管理を選択して新しいデータベース接続を作成します。

   ![data connection](/images/bi-finebi-en-3.png)

4. 新しいデータベース接続ページで、MySQLデータベースを選択します

   ![select connection](/images/bi-finebi-en-4.png)

5. Dorisデータベースのリンク情報を入力します

    - パラメータは以下のように説明されます：

        - Username：Dorisへのログイン用ユーザー名。

        - Password：現在のユーザーのパスワード。

        - Host：DorisクラスタのFEホストのIPアドレス。

        - Port：DorisクラスタのFEクエリポート。

        - Coding：Dorisクラスタのエンコーディング形式。

        - Name Database：Dorisクラスタのターゲットデータベース。

   ![connection information](/images/bi-finebi-en-5-1.png)

6. テストリンクをクリックします。接続情報が正しい場合、接続成功が表示されます

   ![connection test](/images/bi-finebi-en-6.png)

## モデル作成

1. 「パブリックデータ」セクションで、新しいデータセットの作成をクリックします。次にデータベーステーブルをクリックします

   ![new dataset](/images/bi-finebi-en-7.png)

2. 既存のデータベース接続のテーブルをインポートする必要があります

   ![select table](/images/bi-finebi-en-8-2.png)

3. テーブルをインポートした後、インポートした各テーブルを更新する必要があります。テーブルを更新した後でのみ、トピック内でテーブルを分析できます

   ![refresh table](/images/bi-finebi-en-9.png)

4. インポートしたパブリックデータを編集済みトピックに追加し、ビジネスロジックに従ってcompass分析と設定を実行します。

   ![data analysis](/images/bi-finebi-en-10.png)
