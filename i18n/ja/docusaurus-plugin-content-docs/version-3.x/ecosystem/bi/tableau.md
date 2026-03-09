---
{
  "title": "Tableau",
  "language": "ja",
  "description": "TableauでApache Dorisアクセスを有効にするには、TableauのオフィシャルMySQLコネクタがお客様のニーズを満たすことができます。"
}
---
TableauでApache Dorisへのアクセスを有効にするには、TableauのオフィシャルMySQLコネクターがニーズを満たします。このコネクターはMySQL JDBCドライバーを使用してデータにアクセスします。

MySQLコネクターを通じて、TableauはApache Dorisデータベースとテーブルをデータソースとして統合できます。この機能を有効にするには、以下のセットアップガイドに従ってください：

- 使用前に必要なセットアップ
- TableauでのApache Dorisデータソースの設定
- Tableauでの可視化の構築
- 接続と使用のヒント

## TableauとJDBCドライバーのインストール

1. [Tableau desktop](https://www.tableau.com/products/desktop/download)をダウンロードしてインストールします。
2. [MySQL JDBC](https://velodb-bi-connector-1316291683.cos.ap-hongkong.myqcloud.com/Tableau/latest/mysql-connector-j-8.3.0.jar)（バージョン8.3.0）を取得します。
3. JDBCドライバー配置パス
    - macOS：JDBCドライバーJARファイル配置パス：`~/Library/Tableau/Drivers`
    - Windows：`tableau_path`がWindows OSでのTableauインストールディレクトリで、通常デフォルトは：`tableau_path = C:\Program Files\Tableau`、JDBCドライバーJARファイル配置パスは：`%tableau_path%\Drivers\`

次に、TableauでDorisデータソースを設定し、データ可視化の構築を開始できます！

## TableauでのDorisデータソースの設定

**JDBCとConnector**ドライバーをインストールしてセットアップしたので、Dorisのtpchデータベースに接続するTableauのデータソースを定義する方法を見てみましょう。

1. 接続詳細の収集

JDBCを介してApache Dorisに接続するには、次の情報が必要です：

| Parameter            | Meaning                                                                 | Example                        |
| -------------------- | -------------------------------------------------------------------- | ----------------------------- |
| Server               | Database host                                                           | 127.0.1.28                    |
| Port                 | Database MySQL port                                                     | 9030                          |
| Database             | Database name                                                           | tpch                          |
| Username             | Username                                                                 | testuser                      |
| Password             | Password                                                                 | Leave blank                   |
| Init SQL Statement   | Initial SQL statement                                                    | `select * from database.table` |

2. Tableauを起動します。（すでに実行している場合は再起動してください。）
3. 左側のメニューから、**To a Server**セクションの下の**More**をクリックします。利用可能なコネクターのリストで**mysql**を検索します。

![](/images/ecomsystem/tableau/QSrsbadm0oEiuHxyGv3clFhTnLh.png)

4. **MySQL**をクリックすると、次のダイアログボックスが表示されます：

![](/images/ecomsystem/tableau/DN47bCp5ZovHCmxH0DAc3fBonR3.png)

5. ダイアログボックスのプロンプトに従って、対応する接続情報を入力します。
6. 上記の入力ボックスを完了したら、**Sign In**ボタンをクリックします。新しいTableauワークブックが表示されます。
   ![](/images/ecomsystem/tableau/LJK9bPMptoAGjGxzoCtcY8Agnye.png)

次に、Tableauでいくつかの可視化を構築できます！

## Tableauでの可視化の構築

データソースとしてTPC-Hデータを選択しました。Doris TPC-Hデータソースの構築手順については、[この文書](../../benchmark/tpch.md)を参照してください。

TableauでDorisデータソースを設定したので、データを可視化してみましょう。

1. `customer`と`orders`テーブルをワークブックにドラッグします。次に、下のテーブル関連付けで`Custkey`フィールドを選択します。
   ![](/images/ecomsystem/tableau/ZJuBbDBc5o2Gnyxhn7icv30xnXw.png)
2. `nation`テーブルをワークブックにドラッグし、`Nationkey`フィールドを選択して`customer`テーブルと関連付けます。
   ![](/images/ecomsystem/tableau/GPXQbcNUnobHtLx5sIocMHAwn2d.png)
3. これで`customer`、`orders`、`nation`テーブルをデータソースとして関連付けたので、この関係を使用してデータ関連の問題に取り組むことができます。ワークブック下部の`Sheet 1`タブを選択してワークベンチにアクセスします。
   ![](/images/ecomsystem/tableau/FsHmbUOKIoFT5YxWmGecLArLnjd.png)
4. 毎年のユーザー総数を知りたいとします。ordersからOrderDateをColumnsエリア（横フィールド）にドラッグし、次にcustomerからcustomer(count)をRowsにドラッグします。Tableauは次の線グラフを生成します：
   ![](/images/ecomsystem/tableau/I9SCbCFzoo7TgLx6BP1cHdtRnWc.png)

シンプルな線グラフが完成しました。ただし、このデータセットは実データではなく、tpchスクリプトとデフォルトルールによって自動生成されたものです；使用可能性をテストすることを意図しています。

5. 地域（国）と年別の平均注文金額（USD）を知りたいとします：
    - `New Worksheet`タブをクリックして新しいテーブルを作成
    - nationテーブルからNameを`Rows`にドラッグ
    - ordersテーブルからOrderDateを`Columns`にドラッグ

次のように表示されます：

6. 注意：`Abc`値は単なる入力値です。このアイコンに集約ロジックを定義していないため、テーブルにメジャーをドラッグする必要があります。ordersテーブルからTotalpriceをテーブルの中央にドラッグします。デフォルトの計算はTotalpricesのSUMであることに注意してください：
   ![](/images/ecomsystem/tableau/Am9IbyUo4o30DixVi2ccoZvKn8b.png)
7. `SUM`をクリックし、`Measure`を`Average`に変更します。
   ![](/images/ecomsystem/tableau/AaFwbMOKTo86NaxU54mcVYs1nJd.png)
8. 同じドロップダウンメニューから`Format`を選択し、`Numbers`を`Currency (Standard)`に変更します
   ![](/images/ecomsystem/tableau/ZmRDbjws9o5Ampx4YZYcS6Umnqf.png)
9. 期待に合うテーブルが得られます。
   ![](/images/ecomsystem/tableau/MNb0bjoB2ozn4kxfKx9cVj2hnhb.png)

この時点で、TableauはApache Dorisに正常に接続され、データ分析とダッシュボード作成が可能になりました。

## 接続と使用のヒント

**パフォーマンス最適化**

- 実際のニーズに基づいて適切にDorisデータベーステーブルを作成し、時間によってパーティショニングとバケッティングを行い、述語フィルタリングと大部分のデータ転送を効果的に削減します。
- Doris側でマテリアライズドビューを作成することで、適切なデータ事前集約を実現できます。
- 更新計算リソース消費とダッシュボードデータの適時性のバランスを取るため、合理的な更新スケジュールを設定します。

**セキュリティ設定**

- パブリックネットワークアクセスによるセキュリティリスクを避けるため、VPCプライベート接続の使用を推奨します。
- アクセス制限のためにセキュリティグループを設定します。
- SSL/TLS接続およびその他のアクセス方法を有効にします。
- 権限の過度な委任を避けるため、Dorisユーザーアカウントの役割とアクセス権限を細かく調整します。
