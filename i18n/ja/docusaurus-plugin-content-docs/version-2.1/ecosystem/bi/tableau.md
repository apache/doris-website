---
{
  "title": "Tableau",
  "language": "ja",
  "description": "TableauでApache Dorisへのアクセスを有効にするには、TableauのオフィシャルMySQLコネクターがお客様のニーズを満たすことができます。"
}
---
TableauでApache Dorisへのアクセスを有効にするには、Tableauの公式MySQLコネクタが要件を満たします。このコネクタはMySQL JDBCドライバを使用してデータにアクセスします。

MySQLコネクタを通じて、TableauはApache Dorisのデータベースとテーブルをデータソースとして統合できます。この機能を有効にするには、以下のセットアップガイドに従ってください：

- 使用前の必要なセットアップ
- TableauでのApache Dorisデータソースの設定
- Tableauでの可視化の構築
- 接続と使用のヒント

## TableauとJDBCドライバのインストール

1. [Tableau desktop](https://www.tableau.com/products/desktop/download)をダウンロードしてインストールします。
2. [MySQL JDBC](https://velodb-bi-connector-1316291683.cos.ap-hongkong.myqcloud.com/Tableau/latest/mysql-connector-j-8.3.0.jar)（バージョン8.3.0）を取得します。
3. JDBCドライバ配置パス
    - macOS：JDBCドライバJARファイルの配置パス：`~/Library/Tableau/Drivers`
    - Windows：`tableau_path`をWindowsオペレーティングシステム上のTableauインストールディレクトリとすると、一般的にデフォルトは：`tableau_path = C:\Program Files\Tableau`、JDBCドライバJARファイルの配置パスは：`%tableau_path%\Drivers\`

次に、TableauでDorisデータソースを設定し、データ可視化の構築を開始できます！

## TableauでのDorisデータソースの設定

**JDBCとConnector**ドライバをインストールして設定したので、Dorisのtpchデータベースに接続するTableauのデータソースを定義する方法を見てみましょう。

1. 接続詳細の収集

JDBC経由でApache Dorisに接続するには、以下の情報が必要です：

| Parameter            | Meaning                                                                 | Example                        |
| -------------------- | -------------------------------------------------------------------- | ----------------------------- |
| Server               | データベースホスト                                                           | 127.0.1.28                    |
| Port                 | データベースMySQLポート                                                     | 9030                          |
| Database             | データベース名                                                           | tpch                          |
| Username             | ユーザー名                                                                 | testuser                      |
| Password             | パスワード                                                                 | 空白のままにする                   |
| Init SQL Statement   | 初期SQL文                                                    | `select * from database.table` |


2. Tableauを起動します。（既に実行中の場合は、再起動してください。）
3. 左側のメニューから、**To a Server**セクション下の**More**をクリックします。利用可能なコネクタのリストで**mysql**を検索します。

![](/images/ecomsystem/tableau/QSrsbadm0oEiuHxyGv3clFhTnLh.png)

4. **MySQL**をクリックすると、以下のダイアログボックスが表示されます：

![](/images/ecomsystem/tableau/DN47bCp5ZovHCmxH0DAc3fBonR3.png)

5. ダイアログボックスのプロンプトに従って、対応する接続情報を入力します。
6. 上記の入力ボックスを完了した後、**Sign In**ボタンをクリックします。新しいTableauワークブックが表示されるはずです。
   ![](/images/ecomsystem/tableau/LJK9bPMptoAGjGxzoCtcY8Agnye.png)

次に、Tableauでいくつかの可視化を構築できます！

## Tableauでの可視化の構築

データソースとしてTPC-Hデータを選択しました。Doris TPC-Hデータソースの構築手順については、[このドキュメント](../../benchmark/tpch.md)を参照してください。

TableauでDorisデータソースを設定したので、データを可視化してみましょう。

1. `customer`と`orders`テーブルをワークブックにドラッグします。次に、下のテーブル関連付けで`Custkey`フィールドを選択します。
   ![](/images/ecomsystem/tableau/ZJuBbDBc5o2Gnyxhn7icv30xnXw.png)
2. `nation`テーブルをワークブックにドラッグし、`Nationkey`フィールドを選択して`customer`テーブルと関連付けます。
   ![](/images/ecomsystem/tableau/GPXQbcNUnobHtLx5sIocMHAwn2d.png)
3. これで`customer`、`orders`、`nation`テーブルをデータソースとしてリンクしたので、この関係を使用してデータ関連の問題に取り組むことができます。ワークベンチにアクセスするには、ワークブックの下部にある`Sheet 1`タブを選択します。
   ![](/images/ecomsystem/tableau/FsHmbUOKIoFT5YxWmGecLArLnjd.png)
4. 各年のユーザー総数を知りたいとします。ordersからOrderDateをColumns領域（水平フィールド）にドラッグし、次にcustomerからcustomer(count)をRowsにドラッグします。Tableauは以下の折れ線グラフを生成します：
   ![](/images/ecomsystem/tableau/I9SCbCFzoo7TgLx6BP1cHdtRnWc.png)

簡単な折れ線グラフが完成しました。ただし、このデータセットは実際のデータではなく、tpchスクリプトとデフォルトルールによって自動生成されたもので、使用性のテスト用です。

5. 地域（国）と年別の平均注文金額（USD）を知りたいとします：
    - 新しいテーブルを作成するために`New Worksheet`タブをクリック
    - nationテーブルからNameを`Rows`にドラッグ
    - ordersテーブルからOrderDateを`Columns`にドラッグ

以下が表示されるはずです：

6. 注意：`Abc`の値は、このアイコンに集計ロジックを定義していないため、単に入力された値です。そのため、メジャーをテーブルにドラッグする必要があります。ordersテーブルからTotalpriceをテーブルの中央にドラッグします。デフォルトの計算はTotalpricesのSUMであることに注意してください：
   ![](/images/ecomsystem/tableau/Am9IbyUo4o30DixVi2ccoZvKn8b.png)
7. `SUM`をクリックし、`Measure`を`Average`に変更します。
   ![](/images/ecomsystem/tableau/AaFwbMOKTo86NaxU54mcVYs1nJd.png)
8. 同じドロップダウンメニューから`Format`を選択し、`Numbers`を`Currency (Standard)`に変更します
   ![](/images/ecomsystem/tableau/ZmRDbjws9o5Ampx4YZYcS6Umnqf.png)
9. 期待に沿ったテーブルが得られます。
   ![](/images/ecomsystem/tableau/MNb0bjoB2ozn4kxfKx9cVj2hnhb.png)

この時点で、TableauがApache Dorisに正常に接続され、データ分析とダッシュボード作成が可能になりました。

## 接続と使用のヒント

**パフォーマンス最適化**

- 実際のニーズに基づいてDorisデータベーステーブルを適切に作成し、時間でパーティション化とバケット化を行い、述語フィルタリングと大部分のデータ転送を効果的に削減します。
- Doris側でマテリアライズドビューを作成することで、適切なデータ事前集計を実現できます。
- 更新計算リソース消費とダッシュボードデータの適時性のバランスを取るために、合理的な更新スケジュールを設定します。

**セキュリティ設定**

- パブリックネットワークアクセスによるセキュリティリスクを回避するため、VPCプライベート接続の使用を推奨します。
- アクセスを制限するためにセキュリティグループを設定します。
- SSL/TLS接続およびその他のアクセス方法を有効にします。
- 過度な権限委譲を避けるため、Dorisユーザーアカウントの役割とアクセス権限を細かく調整します。
