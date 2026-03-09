---
{
  "title": "Power BI",
  "language": "ja",
  "description": "Microsoft Power BIは、Apache Dorisからクエリを実行するか、データをメモリに読み込むことができます。"
}
---
Microsoft Power BI は Apache Doris にクエリを実行したり、データをメモリに読み込むことができます。

ダッシュボードと可視化を作成するための Windows デスクトップアプリケーションである Power BI Desktop を使用できます。

このチュートリアルでは、以下のプロセスをガイドします：

- MySQL ODBC ドライバーのインストール
- Power BI Desktop への Doris Power BI コネクタのインストール
- Power BI Desktop で可視化するための Doris からのデータクエリ

## 前提条件

### Power BI のインストール

このチュートリアルは、Windows コンピュータに Microsoft Power BI Desktop がインストールされていることを前提としています。Power BI Desktop は[こちら](https://www.microsoft.com/en-us/download/details.aspx?id=58494)からダウンロードしてインストールできます。

Power BI の最新バージョンへの更新を推奨します。

### 接続情報

Apache Doris の接続詳細を収集します

Apache Doris インスタンスに接続するには、以下の詳細が必要です：

| Parameter | Description | Example                      |
| ---- | ---- |------------------------------|
| **Doris Data Source** | Database connection string, host + port | 127.0.1.28:9030              |
| **Database** | Database name | test_db                      |
| **Data Connectivity Mode** | Data connectivity mode, includes Import and DirectQuery |      DirectQuery                        |
| **SQL Statement** | SQL statement that must include the Database, only for Import mode | select * from database.table |
| **User Name** | User name | admin                        |
| **Password** | Password | xxxxxx                       |

## Power BI Desktop

Power BI Desktop でデータのクエリを開始するには、以下の手順を完了してください：

1. MySQL ODBC ドライバーのインストール
2. Doris コネクタの検索
3. Doris への接続
4. データのクエリと可視化

### ODBC ドライバーのインストール

[MySQL ODBC](https://downloads.mysql.com/archives/c-odbc/) をダウンロードしてインストールし、設定してください（バージョン 5.3）。

提供された `.msi` インストーラーを実行し、ウィザードに従ってください。

![](/images/ecomsystem/powerbi/WYRLb9JmcoEHeuxr41Ec8yMQnff.png)

![](/images/ecomsystem/powerbi/LYh9bi780o3DaCxwF3BcuPrknlh.png)

![](/images/ecomsystem/powerbi/E1i7buBzHoquRCxT6VAc1FjCnNf.png)

インストール完了

![](/images/ecomsystem/powerbi/PURIbSCFhoara3xodBBc5xaNnjc.png)

#### ODBC ドライバーの確認

ドライバーのインストールが完了したら、以下の方法で成功したかどうかを確認できます：

スタートメニューで ODBC と入力し、"ODBC Data Sources **(64-bit)**" を選択します。

![](/images/ecomsystem/powerbi/QhVVbjalNoIwvdxd1u7cX3UAnEf.png)

MySQL ドライバーがリストされていることを確認します。

![](/images/ecomsystem/powerbi/OzVSbojxto9SpRxP3sLcnqHmnme.png)

### Doris コネクタのインストール

Power BI カスタムコネクタの認証チャネルは現在クローズされているため、Doris カスタムコネクタは未認証です。未認証コネクタの場合、以下のように設定してください（[https://learn.microsoft.com/en-us/power-bi/connect-data/desktop-connector-extensibility#custom-connectors](https://learn.microsoft.com/en-us/power-bi/connect-data/desktop-connector-extensibility#custom-connectors)）：

1. `power_bi_path` を Windows オペレーティングシステムの Power BI Desktop のディレクトリとします。通常のデフォルトは：`power_bi_path = C:\Program Files\Power BI Desktop` です。このパス `%power_bi_path%\Custom Connectors folder` を参照し、[Doris.mez](https://velodb-bi-connector-1316291683.cos.ap-hongkong.myqcloud.com/PowerBI/latest/Doris.mez) カスタムコネクタファイルを配置してください（パスが存在しない場合は、必要に応じて手動で作成してください）。
2. Power BI Desktop で、`File` > `Options and settings` > `Options` > `Security` を選択します。`Data Extensions` の下で、`(Not Recommended) Allow any extension to load without validation or warning` をチェックして、未認証コネクタの制限を回避します。

まず、`File` を選択

![](/images/ecomsystem/powerbi/YeQDbcIoQoI5RtxU0mjcNXuJnrg.png)

次に `Options and settings` > `Options` を選択

![](/images/ecomsystem/powerbi/LV6Tbdw54o5pqtxC2bCctM30nbe.png)

`Options` ダイアログで、`GLOBAL` > `Security` に移動します。`Data Extensions` の下で、

`(Not Recommended) Allow any extension to load without validation or warning` をチェックします。

![](/images/ecomsystem/powerbi/Tg5cbS75HoBGIMxpcKScJ9WXnRg.png)

`OK` をクリックし、Power BI Desktop を再起動します。

### Doris コネクタの検索

1. Power BI Desktop を起動
2. Power BI Desktop のスタート画面で「New report」をクリックします。ローカルレポートが既にある場合は、既存のレポートを開くことができます。

![](/images/ecomsystem/powerbi/FuXNb5hb2oOq7cxNpPEcR1dKnyg.png)

3. 「Get Data」をクリックし、ポップアップウィンドウで Doris データベースを選択します。

![](/images/ecomsystem/powerbi/G9UWbT1P6otb53xlgj4cljUInz1.png)

### Doris への接続

コネクタを選択し、Doris インスタンスの認証情報を入力します：

- Doris Data Source（必須）- インスタンスドメイン/アドレスまたは host:port
- Database（必須）- データベース名
- SQL statement - 事前実行される SQL ステートメント（'Import' モードでのみ利用可能）
- Data connectivity mode - DirectQuery/Import

![](/images/ecomsystem/powerbi/KiM2bVPWhoYBg5xGQUQcJFNcntg.png)

**注記**

Doris に直接クエリを実行するため、DirectQuery の選択を推奨します。

少量のデータのユースケースがある場合は、Import モードを選択でき、データセット全体が Power BI に読み込まれます。

- ユーザー名とパスワードを指定

![](/images/ecomsystem/powerbi/KZXxbDPTBo2O3FxqgZdcE9I6ndc.png)

### データのクエリと可視化

最後に、ナビゲータビューでデータベースとテーブルが表示されるはずです。目的のテーブルを選択し、「Load」をクリックしてテーブル構造を読み込み、Apache Doris からデータをプレビューします。

![](/images/ecomsystem/powerbi/J7xObwqSYoTdTQx3hjgcAjQznS5.png)

インポートが完了すると、Doris データは通常通り Power BI でアクセスできるようになり、必要な統計コンパスを設定します。

![](/images/ecomsystem/powerbi/JvIgbbyo2oWPlgxcb6Cct5ssnld.png)

## Power BI での可視化の構築

データソースとして TPC-H データを選択しました。Doris TPC-H データソースの構築手順については、[このドキュメント](../../benchmark/tpch)を参照してください。
Power BI で Doris データソースを設定したので、データを可視化しましょう...

各地域の注文収益統計を知る必要があるとします。この要件に基づいてダッシュボードを構築します。

1. まず、テーブルモデルの関係を作成します。Model ビューをクリックします。

![](/images/ecomsystem/powerbi/V7PsbP3oKoJpLjxK5HdcPsnLnKf.png)

2. 必要に応じてこれら4つのテーブルを同じ画面上にドラッグアンドドロップして配置し、関連フィールドをドラッグアンドドロップします。

![](/images/ecomsystem/powerbi/FZL5b2kJcoifIaxI7Eocpak7nvf.png)

![](/images/ecomsystem/powerbi/UxL2b1OV2or1LhxZjHsc0JG7ntb.png)

4つのテーブル間の関係は以下の通りです：

- **customer** ：c_nationkey  --  **nation** : n_nationkey
- **customer** ：c_custkey  --  **orders** : o_custkey
- **nation** : n_regionkey  --  **region** : r_regionkey

3. 関連付け後の結果は以下の通りです：

![](/images/ecomsystem/powerbi/LomhbQTPPoZr58xp8f3cxcTen8d.png)

4. Report ビューワークベンチに戻り、ダッシュボードを構築します。
5. `orders` テーブルから `o_totalprice` フィールドをダッシュボードにドラッグします。

![](/images/ecomsystem/powerbi/MB34bks6woK3mDx0eVccivKEngc.png)

6. `region` テーブルから `r_name` フィールドを X 列にドラッグします。

![](/images/ecomsystem/powerbi/JxpJbihDHoHGwixjWQScNyxvn4e.png)

7. これで期待されるダッシュボードコンテンツが完成しているはずです。

![](/images/ecomsystem/powerbi/CfGWb6oaYoj4LyxpPIGcz3Binzb.png)

8. ワークベンチの左上隅にある保存ボタンをクリックして、作成した統計コンパスをローカルマシンに保存します。

![](/images/ecomsystem/powerbi/WozGbmqAOoP2mqxq2NmcJRFyntc.png)

これで、Power BI を Apache Doris に正常に接続し、データ分析とダッシュボード作成を実装できました。
