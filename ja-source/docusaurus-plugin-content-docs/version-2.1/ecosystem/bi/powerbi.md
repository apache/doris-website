---
{
  "title": "Power BI",
  "language": "ja",
  "description": "Microsoft Power BIは、Apache Dorisからクエリを実行するか、データをメモリに読み込むことができます。"
}
---
Microsoft Power BIはApache Dorisからクエリを実行したり、データをメモリにロードしたりできます。

ダッシュボードや視覚化を作成するためのWindowsデスクトップアプリケーションであるPower BI Desktopを使用できます。

このチュートリアルでは、以下のプロセスを案内します：

- MySQL ODBCドライバーのインストール
- Doris Power BI ConnectorをPower BI Desktopにインストール
- DorisからデータをクエリしてPower BI Desktopで視覚化

## 前提条件

### Power BIのインストール

このチュートリアルは、WindowsコンピューターにMicrosoft Power BI Desktopがインストールされていることを前提としています。Power BI Desktopは[こちら](https://www.microsoft.com/en-us/download/details.aspx?id=58494)からダウンロードしてインストールできます。

Power BIを最新バージョンに更新することをお勧めします。

### 接続情報

Apache Dorisの接続詳細を収集します

Apache Dorisインスタンスに接続するには、以下の詳細が必要です：

| Parameter | 詳細 | Example                      |
| ---- | ---- |------------------------------|
| **Doris Data Source** | データベース接続文字列、ホスト + ポート | 127.0.1.28:9030              |
| **Database** | データベース名 | test_db                      |
| **Data Connectivity Mode** | データ接続モード、ImportとDirectQueryを含む |      DirectQuery                        |
| **SQL Statement** | データベースを含む必要があるSQL文、Importモードのみ | select * from database.table |
| **User Name** | ユーザー名 | admin                        |
| **Password** | パスワード | xxxxxx                       |

## Power BI Desktop

Power BI Desktopでのデータクエリを開始するには、以下の手順を完了してください：

1. MySQL ODBCドライバーのインストール
2. Dorisコネクタの検索
3. Dorisへの接続
4. データのクエリと視覚化

### ODBCドライバーのインストール

[MySQL ODBC](https://downloads.mysql.com/archives/c-odbc/)をダウンロードしてインストールし、設定します（バージョン5.3）。

提供された`.msi`インストーラーを実行し、ウィザードに従います。

![](/images/ecomsystem/powerbi/WYRLb9JmcoEHeuxr41Ec8yMQnff.png)

![](/images/ecomsystem/powerbi/LYh9bi780o3DaCxwF3BcuPrknlh.png)

![](/images/ecomsystem/powerbi/E1i7buBzHoquRCxT6VAc1FjCnNf.png)

インストール完了

![](/images/ecomsystem/powerbi/PURIbSCFhoara3xodBBc5xaNnjc.png)

#### ODBCドライバーの確認

ドライバーのインストールが完了したら、以下の方法で正常にインストールされたか確認できます：

スタートメニューでODBCと入力し、「ODBC Data Sources **(64-bit)**」を選択します。

![](/images/ecomsystem/powerbi/QhVVbjalNoIwvdxd1u7cX3UAnEf.png)

MySQLドライバーがリストに表示されていることを確認します。

![](/images/ecomsystem/powerbi/OzVSbojxto9SpRxP3sLcnqHmnme.png)

### Dorisコネクタのインストール

Power BIカスタムコネクタの認証チャネルは現在閉鎖されているため、Dorisカスタムコネクタは未認証です。未認証コネクタの場合、以下のように設定します（[https://learn.microsoft.com/en-us/power-bi/connect-data/desktop-connector-extensibility#custom-connectors](https://learn.microsoft.com/en-us/power-bi/connect-data/desktop-connector-extensibility#custom-connectors)）：

1. `power_bi_path`がWindowsオペレーティングシステムでのPower BI Desktopのディレクトリと仮定すると、デフォルトは通常：`power_bi_path = C:\Program Files\Power BI Desktop`です。このパス`%power_bi_path%\Custom Connectors folder`を参照して、[Doris.mez](https://velodb-bi-connector-1316291683.cos.ap-hongkong.myqcloud.com/PowerBI/latest/Doris.mez)カスタムコネクタファイルを配置します（パスが存在しない場合は、必要に応じて手動で作成してください）。
2. Power BI Desktopで、`File` > `Options and settings` > `Options` > `Security`を選択します。`Data Extensions`の下で、`(Not Recommended) Allow any extension to load without validation or warning`をチェックして、未認証コネクタの制限をバイパスします。

まず、`File`を選択します

![](/images/ecomsystem/powerbi/YeQDbcIoQoI5RtxU0mjcNXuJnrg.png)

次に、`Options and settings` > `Options`を選択します

![](/images/ecomsystem/powerbi/LV6Tbdw54o5pqtxC2bCctM30nbe.png)

`Options`ダイアログで、`GLOBAL` > `Security`に移動します。`Data Extensions`の下で、

`(Not Recommended) Allow any extension to load without validation or warning`をチェックします。

![](/images/ecomsystem/powerbi/Tg5cbS75HoBGIMxpcKScJ9WXnRg.png)

`OK`をクリックし、Power BI Desktopを再起動します。

### Dorisコネクタの検索

1. Power BI Desktopを起動します
2. Power BI Desktopスタート画面で、「New report」をクリックします。既にローカルレポートがある場合は、既存のレポートを開くことができます。

![](/images/ecomsystem/powerbi/FuXNb5hb2oOq7cxNpPEcR1dKnyg.png)

3. 「Get Data」をクリックし、ポップアップウィンドウでDorisデータベースを選択します。

![](/images/ecomsystem/powerbi/G9UWbT1P6otb53xlgj4cljUInz1.png)

### Dorisへの接続

コネクタを選択し、Dorisインスタンスの認証情報を入力します：

- Doris Data Source（必須）- インスタンスドメイン/アドレス または host:port。
- Database（必須）- データベース名。
- SQL statement - 事前実行されるSQL文（'Import'モードでのみ利用可能）
- Data connectivity mode - DirectQuery/Import

![](/images/ecomsystem/powerbi/KiM2bVPWhoYBg5xGQUQcJFNcntg.png)

**注意**

Dorisを直接クエリするためにDirectQueryを選択することをお勧めします。

少量のデータのユースケースがある場合は、Importモードを選択でき、データセット全体がPower BIにロードされます。

- ユーザー名とパスワードを指定します

![](/images/ecomsystem/powerbi/KZXxbDPTBo2O3FxqgZdcE9I6ndc.png)

### データのクエリと視覚化

最後に、ナビゲータービューにデータベースとテーブルが表示されます。目的のテーブルを選択し、「Load」をクリックしてテーブル構造をロードし、Apache Dorisからデータをプレビューします。

![](/images/ecomsystem/powerbi/J7xObwqSYoTdTQx3hjgcAjQznS5.png)

インポートが完了したら、DorisデータはPower BIで通常通りアクセス可能になります。必要な統計コンパスを設定してください。

![](/images/ecomsystem/powerbi/JvIgbbyo2oWPlgxcb6Cct5ssnld.png)

## Power BIでの視覚化の構築

データソースとしてTPC-Hデータを選択しました。Doris TPC-Hデータソースの構築手順については、[このドキュメント](../../benchmark/tpch)を参照してください。
Power BIでDorisデータソースを設定したので、データを視覚化してみましょう...

各地域の注文収益統計を知る必要があると仮定し、この要件に基づいてダッシュボードを構築します。

1. まず、テーブルモデルの関係を作成します。Model viewをクリックします。

![](/images/ecomsystem/powerbi/V7PsbP3oKoJpLjxK5HdcPsnLnKf.png)

2. 必要に応じてこれら4つのテーブルを同じ画面にドラッグアンドドロップで配置し、関連するフィールドをドラッグアンドドロップします。

![](/images/ecomsystem/powerbi/FZL5b2kJcoifIaxI7Eocpak7nvf.png)

![](/images/ecomsystem/powerbi/UxL2b1OV2or1LhxZjHsc0JG7ntb.png)

4つのテーブル間の関係は以下の通りです：

- **customer**：c_nationkey  --  **nation**：n_nationkey
- **customer**：c_custkey  --  **orders**：o_custkey
- **nation**：n_regionkey  --  **region**：r_regionkey

3. 関連付け後の結果は以下の通りです：

![](/images/ecomsystem/powerbi/LomhbQTPPoZr58xp8f3cxcTen8d.png)

4. Report viewワークベンチに戻り、ダッシュボードを構築します。
5. `orders`テーブルから`o_totalprice`フィールドをダッシュボードにドラッグします。

![](/images/ecomsystem/powerbi/MB34bks6woK3mDx0eVccivKEngc.png)

6. `region`テーブルから`r_name`フィールドを列Xにドラッグします。

![](/images/ecomsystem/powerbi/JxpJbihDHoHGwixjWQScNyxvn4e.png)

7. これで期待するダッシュボードコンテンツが表示されます。

![](/images/ecomsystem/powerbi/CfGWb6oaYoj4LyxpPIGcz3Binzb.png)

8. ワークベンチの左上にある保存ボタンをクリックして、作成した統計コンパスをローカルマシンに保存します。

![](/images/ecomsystem/powerbi/WozGbmqAOoP2mqxq2NmcJRFyntc.png)

この時点で、Power BIをApache Dorisに正常に接続し、データ分析とダッシュボード作成を実装しました。
