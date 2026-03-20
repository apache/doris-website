---
{
  "title": "QuickSight",
  "language": "ja",
  "description": "QuickSightは、直接クエリまたはインポートモードで公式のMySQLデータソース経由でApache Dorisに接続できます"
}
---
QuickSightは、Directly queryまたはImportモードで公式MySQLデータソース経由でApache Dorisに接続できます

## 前提条件

- Apache Dorisのバージョンは3.1.2以上である必要があります
- ネットワーク接続（VPC、セキュリティグループ設定）は、AWSサーバーがDorisクラスターにアクセスできるよう、Dorisのデプロイ環境に応じて設定する必要があります。
- 宣言されたMySQL互換性バージョンを調整するために、Dorisに接続するMySQLクライアント上で以下のSQLを実行してください：

  ```sql
  SET GLOBAL version = '8.3.99';
  ```
検証結果:

  ```sql
  mysql> show variables like "version";
  +---------------+--------+---------------+---------+
  | Variable_name | Value  | Default_Value | Changed |
  +---------------+--------+---------------+---------+
  | version       | 8.3.99 | 5.7.99        | 1       |
  +---------------+--------+---------------+---------+
  1 row in set (0.01 sec)
  ```
## QuickSight を Apache Doris に接続する

まず、[https://quicksight.aws.amazon.com](https://quicksight.aws.amazon.com/) にアクセスし、Datasets に移動して「New dataset」をクリックします。

![](/images/ecomsystem/quicksight/Cm8EbaeoIoYDeAxGDR8cuSFhns1.png)

![](/images/ecomsystem/quicksight/XngnbqKxhouZHIxgVYhcyta5n3f.png)

QuickSight にバンドルされている公式 MySQL コネクタを検索します。

![](/images/ecomsystem/quicksight/Pjf5bRheroLmtKxcZ2PcFYMkn7d.png)

接続の詳細を指定します。MySQL インターフェースポートは既定で 9030 ですが、FE の `query_port` 設定によって異なる場合があることに注意してください。

![](/images/ecomsystem/quicksight/DlJobTycDoqhDOxdUtCcqZCxnkc.png)

これで、リストからテーブルを選択できます。

![](/images/ecomsystem/quicksight/LAFXbSSnwop5C7xn3kPcEcBZnmc.png)

「Directly query」モードを選択することを推奨します。

![](/images/ecomsystem/quicksight/RN4fbtJU5o89gQxePQKcOGRBnyh.png)

さらに、「Edit/Preview data」をクリックすることで、内部テーブル構造を表示したり、カスタム SQL を調整したりできるはずです。ここでデータセットを調整できます。

![](/images/ecomsystem/quicksight/DoVOMbQTxBrRBpx3Bbgn2gcUXLd.png)

これで、データセットをパブリッシュして新しい可視化を作成できます！

![](/images/ecomsystem/quicksight/MXgObQbdDoLBVTxBrRBcUpx3n2g.png)

## QuickSight での可視化の構築

データソースとして TPC-H データを選択しました。Doris TPC-H データソースの構築手順については、[このドキュメント](../../benchmark/tpch) を参照してください。

QuickSight で Doris データソースを設定したので、データを可視化しましょう...

Doris の複数テーブル結合シナリオでの優れたパフォーマンスにより、このシナリオに基づいたダッシュボードを設計することを選択しました。異なるステータスの異なる国の注文統計を知る必要があるとします。この要件に従ってダッシュボードを構築します。

1. 上記の手順で作成したデータソースに、以下のテーブルを Dataset として追加します。

- customer
- nation
- orders

2. 'Create Dataset' をクリックします

![](/images/ecomsystem/quicksight/LDeebS3RdoB6hPxcYkacV88VnMd.png)

3. 上記の手順で作成したデータソースを選択します

![](/images/ecomsystem/quicksight/LQlLb26gZoXOurxO3AJc0xCBnqd.png)

4. 必要なテーブルを選択します

![](/images/ecomsystem/quicksight/W7bDb42r4ovxr3xGDU0cRxmbnsf.png)

Directly Query モードを選択します

![](/images/ecomsystem/quicksight/Nllyb7GkJo8ToCxXSuDc4gNgnvg.png)

'Visualize' をクリックしてデータソースを作成します。これらの手順に従って、他のテーブルのデータソースも作成してください。

5. ダッシュボード作成ワークベンチに入り、現在の Dataset ドロップダウンメニューをクリックして、Add New Dataset を選択します。

![](/images/ecomsystem/quicksight/D18HbY2PWoQvMOxlJTRcOfZenEh.png)

6. すべてのデータセットを順番に選択し、Select をクリックしてダッシュボードに追加します。

![](/images/ecomsystem/quicksight/TzM6boK9No1wD0xBBeAcaJGcnDd.png)

7. 完了後、nation の操作インターフェースをクリックしてデータセット編集インターフェースに入ります。データセット上で列結合を実行します。

![](/images/ecomsystem/quicksight/Y0GpbCY0oo6xeYxfufAcPAC6n1e.png)

8. 図に示すように、Add data をクリックしてデータソースを追加します。

![](/images/ecomsystem/quicksight/ZNKgbdPivoM3y7xwr8kcZbWPn8c.png)

9. 3つのテーブルを追加した後、結合を実行します。結合関係は以下の通りです：
    - **customer**：c_nationkey  --  **nation**：n_nationkey
    - **customer**：c_custkey  --  **orders**：o_custkey

![](/images/ecomsystem/quicksight/HVNIbL0yDouA8axQmIocXFhFnmc.png)

10. 結合が完了したら、右上の Save & Publish をクリックしてパブリッシュします。

![](/images/ecomsystem/quicksight/CD9pbqFIOouYFtxUrs9cMlyAnph.png)

11. 3つのデータソースを追加した Analyses インターフェースに戻り、n_name をクリックして国名別の注文総数を表示します。

![](/images/ecomsystem/quicksight/D6Yrb7Igwo5520x3WBbcZ8T9n9f.png)

12. VALUE をクリックして o_orderkey を選択し、GROUP/COLOR をクリックして o_orderstatus を選択し、要求ダッシュボードを取得します。

![](/images/ecomsystem/quicksight/Sl8nbfrszok2bexesfwcsNqbngc.png)

13. 右上の Publish をクリックしてダッシュボードのパブリッシュを完了します。

この時点で、QuickSight は Apache Doris に正常に接続され、データ分析と可視化ダッシュボードの作成が実装されました。
