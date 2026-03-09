---
{
  "title": "Tableau バック | Bi",
  "language": "ja",
  "description": "VeloDBは公式のTableau Dorisコネクタを提供しています。このコネクタはMySQL JDBC Driverに基づいてデータにアクセスします。",
  "sidebar_label": "Tableau Back"
}
---
# Tableau Back

VeloDBは公式のTableau Dorisコネクタを提供しています。このコネクタはMySQL JDBC Driverに基づいてデータにアクセスします。

このコネクタは[TDVTフレームワーク](https://tableau.github.io/connector-plugin-sdk/docs/tdvt)によって100%のパス率でテストされています。

このコネクタを使用することで、TableauはApache Dorisデータベースとテーブルをデータソースとして統合できます。これを有効にするには、以下のセットアップガイドに従ってください：

- TableauとDorisコネクタのインストール
- TableauでのApache Dorisデータソースの構成
- Tableauでの可視化の構築
- 接続と使用のヒント
- まとめ

## TableauとDorisコネクタのインストール

1. [Tableau desktop](https://www.tableau.com/products/desktop/download)をダウンロードしてインストールします。
2. [tableau-doris](https://velodb-bi-connector-1316291683.cos.ap-hongkong.myqcloud.com/Tableau/latest/doris_jdbc-latest.taco)カスタムコネクタ（doris_jdbc-***.taco）を取得します。
3. [MySQL JDBC](https://velodb-bi-connector-1316291683.cos.ap-hongkong.myqcloud.com/Tableau/latest/mysql-connector-j-8.3.0.jar)（バージョン8.3.0）を取得します。
4. ConnectorとJDBCドライバを配置する場所
   MacOS:
    - このパス：`~/Documents/My Tableau Repository/Connectors`を参照し、`doris_jdbc-latest.taco`カスタムコネクタファイルを配置します（パスが存在しない場合は、必要に応じて手動で作成してください）。
    - JDBCドライバjarの配置パス：`~/Library/Tableau/Drivers`
      Windows:
      `tableau_path`をWindowsでのTableauインストールディレクトリと仮定し、
      通常のデフォルト値：`tableau_path = C:\Program Files\Tableau`
    - このパス：`%tableau_path%``\Connectors\`を参照し、`doris_jdbc-latest.taco`カスタムコネクタファイルを配置します（パスが存在しない場合は、必要に応じて手動で作成してください）。
    - JDBCドライバjarの配置パス：`%tableau_path%\Drivers\`

次に、TableauでDorisデータソースを構成し、データ可視化の構築を開始できます！

## TableauでのDorisデータソースの構成

**JDBCとConnector**ドライバをインストールして設定したので、Dorisのtpchデータベースに接続するTableauでのデータソースの定義方法を見てみましょう。

1. 接続詳細を収集する

JDBC経由でApache Dorisに接続するには、以下の情報が必要です：

| パラメータ            | 意味                                                                 | 例                        |
| -------------------- | -------------------------------------------------------------------- | ----------------------------- |
| Server               | データベースホスト                                                           | 127.0.1.28                    |
| Port                 | データベースMySQLポート                                                     | 9030                          |
| Catalog              | Doris Catalog、外部テーブルとデータレイクのクエリ時に使用、Advancedで設定 | internal                      |
| Database             | データベース名                                                           | tpch                          |
| Authentication       | データベース認証方法を選択：Username / Username and Password | Username and Password         |
| Username             | ユーザー名                                                                 | testuser                      |
| Password             | パスワード                                                                 | 空白のまま                   |
| Init SQL Statement   | 初期SQL文                                                    | `select * from database.table` |

2. Tableauを起動します。（コネクタを配置する前に既に実行していた場合は、再起動してください。）
3. 左側のメニューから、**To a Server**セクションの下にある**More**をクリックします。利用可能なコネクタのリストで、**Doris JDBC by VeloDB**を検索します：

![](/images/ecomsystem/tableau/p01.png)

4. **Doris by VeloDB**をクリックすると、以下のダイアログがポップアップします：

![](/images/ecomsystem/tableau/p02.png)

5. ダイアログのプロンプトに従って対応する接続情報を入力します。
6. オプションの高度な構成：

   - データソースを定義するためにInitial SQLでプリセットSQLを入力できます
       ![](/images/ecomsystem/tableau/p03.png)
   - Advancedでは、Catalogを使用してデータレイクデータソースにアクセスできます；デフォルト値はinternalです、
       ![](/images/ecomsystem/tableau/p04.png)
7. 上記の入力フィールドを完了した後、**Sign In**ボタンをクリックすると、新しいTableauワークブックが表示されます：
   ![](/images/ecomsystem/tableau/p05.png)

次に、Tableauでいくつかの可視化を構築できます！

## Tableauでの可視化の構築

データソースとしてTPC-Hデータを選択し、Doris TPC-Hデータソースの構築方法については[このドキュメント](../../benchmark/tpch.md)を参照してください

TableauでDorisデータソースを構成したので、データを可視化してみましょう

1. customerテーブルとordersテーブルをワークブックにドラッグします。そして下でテーブル結合フィールドCustkeyを選択します

![](/images/ecomsystem/tableau/p06.png)

2. nationテーブルをワークブックにドラッグし、customerテーブルとのテーブル結合フィールドNationkeyを選択します
   ![](/images/ecomsystem/tableau/p07.png)
3. customerテーブル、ordersテーブル、nationテーブルをデータソースとして関連付けたので、この関係を使用してデータに関する質問を処理できます。ワークブックの下部にある`Sheet 1`タブを選択してワークスペースに入ります。
   ![](/images/ecomsystem/tableau/p08.png)
4. 年別のユーザー数の要約を知りたいとします。ordersからOrderDateを`Columns`エリア（水平フィールド）にドラッグし、次にcustomerからcustomer(count)を`Rows`にドラッグします。Tableauは以下の線グラフを生成します：
   ![](/images/ecomsystem/tableau/p09.png)

簡単な線グラフが完成しましたが、このデータセットはtpchスクリプトとデフォルトルールによって自動生成されており、実際のデータではありません。参考用ではなく、可用性をテストすることを意図しています。

5. 地域（国）と年別の平均注文額（USD）を知りたいとします：
    - `New Worksheet`タブをクリックして新しいシートを作成します
    - nationテーブルからNameを`Rows`にドラッグします
    - ordersテーブルからOrderDateを`Columns`にドラッグします

以下が表示されます：
![](/images/ecomsystem/tableau/p10.png)

6. 注意：`Abc`値は単なるプレースホルダー値です。そのマークに対して集計ロジックを定義していないため、テーブルにメジャーをドラッグする必要があります。ordersテーブルからTotalpriceをテーブルの中央にドラッグします。デフォルトの計算はTotalpricesでSUMを実行することに注意してください：
   ![](/images/ecomsystem/tableau/p11.png)
7. `SUM`をクリックし、`Measure`を`Average`に変更します。
   ![](/images/ecomsystem/tableau/p12.png)
8. 同じドロップダウンメニューから、`Format`を選択し、`Numbers`を`Currency (Standard)`に変更します：
   ![](/images/ecomsystem/tableau/p13.png)
9. 期待に適うテーブルを取得します：
   ![](/images/ecomsystem/tableau/p14.png)

これまでに、TableauはApache Dorisに正常に接続され、データ分析と可視化ダッシュボードの作成が実現されました。

## 接続と使用のヒント

**パフォーマンス最適化**

- 実際のニーズに応じて、合理的にdorisデータベースとテーブルを作成し、時間でパーティションとバケットを分割することで、述語フィルタリングと大部分のデータ送信を効果的に削減できます
- Doris側でマテリアライズドビューを作成することで適切なデータ事前集計を行うことができます。
- リフレッシュの計算リソース消費とダッシュボードデータの適時性のバランスを取るために、合理的なリフレッシュ計画を設定します

**セキュリティ構成**

- パブリックネットワークアクセスによって導入されるセキュリティリスクを避けるため、VPCプライベート接続の使用を推奨します。
- アクセスを制限するためにセキュリティグループを構成します。
- SSL/TLS接続などのアクセス方法を有効にします。
- 過度な権限委譲を避けるため、Dorisユーザーアカウントの役割とアクセス許可を細分化します。

## まとめ

このコネクタは、汎用のODBC/JDBCドライバベースのコネクタの接続設定プロセスを簡素化し、Apache Dorisに対してより互換性の高いコネクタを提供します。コネクタの使用時に問題が発生した場合は、[GitHub](https://github.com/apache/doris/issues)でお気軽にご連絡ください。
