---
{
  "title": "QuickSight",
  "language": "ja",
  "description": "QuickSightは、DirectlyクエリまたはImportモードで公式のMySQLデータソースを介してApache Dorisに接続できます"
}
---
QuickSightは、Directly queryまたはImportモードの公式MySQL data sourceを介してApache Dorisに接続できます

## Prerequisites

- Apache Dorisバージョンは3.1.2以上である必要があります
- Network connectivity（VPC、security group configuration）は、AWSサーバーがDorisクラスターにアクセスできるよう、Dorisデプロイメント環境に応じて設定する必要があります。
- Dorisに接続するMySQLクライアント上で以下のSQLを実行し、宣言されたMySQL互換性バージョンを調整してください：

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
## QuickSightをApache Dorisに接続する

まず、[https://quicksight.aws.amazon.com](https://quicksight.aws.amazon.com/)にアクセスし、Datasetsに移動して「New dataset」をクリックします：

![](/images/ecomsystem/quicksight/Cm8EbaeoIoYDeAxGDR8cuSFhns1.png)

![](/images/ecomsystem/quicksight/XngnbqKxhouZHIxgVYhcyta5n3f.png)

QuickSightにバンドルされている公式のMySQLコネクタを検索します：

![](/images/ecomsystem/quicksight/Pjf5bRheroLmtKxcZ2PcFYMkn7d.png)

接続の詳細を指定します。MySQLインターフェースのポートはデフォルトで9030ですが、FEの`query_port`設定によって異なる場合があります。

![](/images/ecomsystem/quicksight/DlJobTycDoqhDOxdUtCcqZCxnkc.png)

これで、リストからテーブルを選択できます：

![](/images/ecomsystem/quicksight/LAFXbSSnwop5C7xn3kPcEcBZnmc.png)

「Directly query」モードを選択することを推奨します：

![](/images/ecomsystem/quicksight/RN4fbtJU5o89gQxePQKcOGRBnyh.png)

さらに、「Edit/Preview data」をクリックすることで、内部テーブル構造を表示したり、カスタムSQLを調整したりできるはずです。ここでデータセットを調整できます：

![](/images/ecomsystem/quicksight/DoVOMbQTxBrRBpx3Bbgn2gcUXLd.png)

これで、データセットを公開して新しい可視化を作成できます！

![](/images/ecomsystem/quicksight/MXgObQbdDoLBVTxBrRBcUpx3n2g.png)

## QuickSightでの可視化の構築

データソースとしてTPC-Hデータを選択しました。Doris TPC-Hデータソースの構築手順については、[このドキュメント](../../benchmark/tpch)を参照してください。

QuickSightでDorisデータソースを設定したので、データを可視化してみましょう...

Dorisは複数テーブル結合シナリオでの優れたパフォーマンスを持つため、このシナリオに基づいてダッシュボードを設計することにしました。異なる国の異なるステータスでの注文統計を知りたいとしましょう。この要件に従ってダッシュボードを構築します。

1. 上記の手順で作成したデータソースに、以下のテーブルをDatasetとして追加します。

- customer
- nation
- orders

2. 「Create Dataset」をクリックします

![](/images/ecomsystem/quicksight/LDeebS3RdoB6hPxcYkacV88VnMd.png)

3. 上記の手順で作成したデータソースを選択します

![](/images/ecomsystem/quicksight/LQlLb26gZoXOurxO3AJc0xCBnqd.png)

4. 必要なテーブルを選択します

![](/images/ecomsystem/quicksight/W7bDb42r4ovxr3xGDU0cRxmbnsf.png)

Directly Queryモードを選択します

![](/images/ecomsystem/quicksight/Nllyb7GkJo8ToCxXSuDc4gNgnvg.png)

「Visualize」をクリックしてデータソースを作成します。これらの手順に従って、他のテーブルのデータソースも作成してください。

5. ダッシュボード作成ワークベンチに入り、現在のDatasetドロップダウンメニューをクリックし、Add New Datasetを選択します。

![](/images/ecomsystem/quicksight/D18HbY2PWoQvMOxlJTRcOfZenEh.png)

6. すべてのデータセットを順番に選択し、Selectをクリックして、ダッシュボードに追加します。

![](/images/ecomsystem/quicksight/TzM6boK9No1wD0xBBeAcaJGcnDd.png)

7. 完了後、nationの操作インターフェースをクリックして、データセット編集インターフェースに入ります。これから、データセット上で列結合を実行します。

![](/images/ecomsystem/quicksight/Y0GpbCY0oo6xeYxfufAcPAC6n1e.png)

8. 画像に示されているように、Add dataをクリックしてデータソースを追加します。

![](/images/ecomsystem/quicksight/ZNKgbdPivoM3y7xwr8kcZbWPn8c.png)

9. 3つのテーブルを追加後、結合を実行します。結合関係は以下の通りです：
    - **customer** ：c_nationkey  --  **nation** : n_nationkey
    - **customer** ：c_custkey  --  **orders** : o_custkey

![](/images/ecomsystem/quicksight/HVNIbL0yDouA8axQmIocXFhFnmc.png)

10. 結合が完了したら、右上のSave & Publishをクリックして公開します。

![](/images/ecomsystem/quicksight/CD9pbqFIOouYFtxUrs9cMlyAnph.png)

11. 3つのデータソースを追加したAnalysesインターフェースに戻り、n_nameをクリックして国名別の注文総数を表示します。

![](/images/ecomsystem/quicksight/D6Yrb7Igwo5520x3WBbcZ8T9n9f.png)

12. VALUEをクリックしてo_orderkeyを選択し、GROUP/COLORをクリックしてo_orderstatusを選択すると、要求されたダッシュボードが取得できます。

![](/images/ecomsystem/quicksight/Sl8nbfrszok2bexesfwcsNqbngc.png)

13. 右上のPublishをクリックして、ダッシュボードの公開を完了します。

この時点で、QuickSightはApache Dorisへの接続に成功し、データ分析と可視化ダッシュボード作成が実装されました。
