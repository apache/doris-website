---
{
  "title": "Power BI",
  "language": "ja",
  "description": "Microsoft Power BIは、Apache Dorisからクエリを実行するか、データをメモリにロードすることができます。"
}
---
Microsoft Power BI は Apache Doris からクエリを実行したり、データをメモリにロードしたりできます。

ダッシュボードと可視化を作成するための Windows デスクトップアプリケーションである Power BI Desktop を使用できます。

このチュートリアルでは以下のプロセスを説明します：

- MySQL ODBC ドライバーのインストール
- Doris Power BI コネクタを Power BI Desktop にインストール
- Doris からデータをクエリして Power BI Desktop で可視化

## 前提条件

### Power BI のインストール

このチュートリアルでは、Windows コンピュータに Microsoft Power BI Desktop がインストールされていることを前提としています。Power BI Desktop は[こちら](https://www.microsoft.com/en-us/download/details.aspx?id=58494)からダウンロードしてインストールできます。

Power BI の最新バージョンへの更新をお勧めします。

### 接続情報

Apache Doris の接続詳細を収集してください

Apache Doris インスタンスに接続するには以下の詳細が必要です：

| Parameter | 詳細 | Example                      |
| ---- | ---- |------------------------------|
| **Doris Data Source** | データベース接続文字列、ホスト + ポート | 127.0.1.28:9030              |
| **Database** | データベース名 | test_db                      |
| **Data Connectivity Mode** | データ接続モード、Import と DirectQuery を含む |      DirectQuery                        |
| **SQL Statement** | Database を含む必要がある SQL ステートメント、Import モードのみ | select * from database.table |
| **User Name** | ユーザー名 | admin                        |
| **Password** | パスワード | xxxxxx                       |

## Power BI Desktop

Power BI Desktop でデータクエリを開始するには、以下の手順を完了してください：

1. MySQL ODBC ドライバーのインストール
2. Doris コネクタを見つける
3. Doris に接続
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

ドライバーのインストールが完了した後、以下のように成功したことを確認できます：

スタートメニューで ODBC と入力し、「ODBC データ ソース **(64-bit)**」を選択してください。

![](/images/ecomsystem/powerbi/QhVVbjalNoIwvdxd1u7cX3UAnEf.png)

MySQL ドライバーがリストされていることを確認してください。

![](/images/ecomsystem/powerbi/OzVSbojxto9SpRxP3sLcnqHmnme.png)

### Doris コネクタのインストール

Power BI カスタムコネクタの認証チャンネルは現在閉鎖されているため、Doris カスタムコネクタは未認証です。未認証のコネクタについては、以下のように設定してください（[https://learn.microsoft.com/en-us/power-bi/connect-data/desktop-connector-extensibility#custom-connectors](https://learn.microsoft.com/en-us/power-bi/connect-data/desktop-connector-extensibility#custom-connectors)）：

1. `power_bi_path` を Windows オペレーティングシステムの Power BI Desktop のディレクトリとすると、デフォルトは通常：`power_bi_path = C:\Program Files\Power BI Desktop` です。このパス `%power_bi_path%\Custom Connectors folder` を参照し、[Doris.mez](https://velodb-bi-connector-1316291683.cos.ap-hongkong.myqcloud.com/PowerBI/latest/Doris.mez) カスタムコネクタファイルを配置してください（パスが存在しない場合は、必要に応じて手動で作成してください）。
2. Power BI Desktop で `ファイル` > `オプションと設定` > `オプション` > `セキュリティ` を選択します。`データ拡張機能` の下で `（推奨されません）検証や警告なしに任意の拡張機能の読み込みを許可する` をチェックして、未認証のコネクタの制限を回避してください。

まず、`ファイル` を選択

![](/images/ecomsystem/powerbi/YeQDbcIoQoI5RtxU0mjcNXuJnrg.png)

次に `オプションと設定` > `オプション` を選択

![](/images/ecomsystem/powerbi/LV6Tbdw54o5pqtxC2bCctM30nbe.png)

`オプション` ダイアログで、`グローバル` > `セキュリティ` に移動します。`データ拡張機能` の下で、

`（推奨されません）検証や警告なしに任意の拡張機能の読み込みを許可する` をチェックしてください。

![](/images/ecomsystem/powerbi/Tg5cbS75HoBGIMxpcKScJ9WXnRg.png)

`OK` をクリックし、Power BI Desktop を再起動してください。

### Doris コネクタを見つける

1. Power BI Desktop を起動
2. Power BI Desktop 開始画面で「新しいレポート」をクリックします。既にローカルレポートがある場合は、既存のレポートを開くことができます。

![](/images/ecomsystem/powerbi/FuXNb5hb2oOq7cxNpPEcR1dKnyg.png)

3. 「データを取得」をクリックし、ポップアップウィンドウで Doris データベースを選択します。

![](/images/ecomsystem/powerbi/G9UWbT1P6otb53xlgj4cljUInz1.png)

### Doris に接続

コネクタを選択し、Doris インスタンスの認証情報を入力してください：

- Doris Data Source（必須）- インスタンスドメイン/アドレスまたは host:port。
- Database（必須）- データベース名。
- SQL statement - 事前実行される SQL ステートメント（「Import」モードでのみ利用可能）
- Data connectivity mode - DirectQuery/Import

![](/images/ecomsystem/powerbi/KiM2bVPWhoYBg5xGQUQcJFNcntg.png)

**注記**

Doris を直接クエリするために DirectQuery を選択することをお勧めします。

少量のデータのユースケースがある場合は、Import モードを選択でき、データセット全体が Power BI にロードされます。

- ユーザー名とパスワードを指定

![](/images/ecomsystem/powerbi/KZXxbDPTBo2O3FxqgZdcE9I6ndc.png)

### データのクエリと可視化

最後に、ナビゲータービューでデータベースとテーブルが表示されるはずです。目的のテーブルを選択し、「読み込み」をクリックしてテーブル構造を読み込み、Apache Doris からデータをプレビューします。

![](/images/ecomsystem/powerbi/J7xObwqSYoTdTQx3hjgcAjQznS5.png)

インポートが完了した後、Doris データは通常通り Power BI でアクセス可能になるはずです。必要な統計コンパスを設定してください。

![](/images/ecomsystem/powerbi/JvIgbbyo2oWPlgxcb6Cct5ssnld.png)

## Power BI での可視化の構築

データソースとして TPC-H データを選択しました。Doris TPC-H データソースの構築手順については、[このドキュメント](../../benchmark/tpch)を参照してください。
Power BI で Doris データソースを設定したので、データを可視化しましょう...

各地域の注文収益統計を知る必要があるとしましょう。この要件に基づいてダッシュボードを構築します。

1. まず、テーブルモデルの関係を作成します。モデルビューをクリックします。

![](/images/ecomsystem/powerbi/V7PsbP3oKoJpLjxK5HdcPsnLnKf.png)

2. 必要に応じてこれら4つのテーブルを同じ画面にドラッグアンドドロップで配置し、関連フィールドをドラッグアンドドロップします。

![](/images/ecomsystem/powerbi/FZL5b2kJcoifIaxI7Eocpak7nvf.png)

![](/images/ecomsystem/powerbi/UxL2b1OV2or1LhxZjHsc0JG7ntb.png)

4つのテーブル間の関係は以下の通りです：

- **customer**：c_nationkey  --  **nation**：n_nationkey
- **customer**：c_custkey  --  **orders**：o_custkey
- **nation**：n_regionkey  --  **region**：r_regionkey

3. 関連付け後の結果は以下の通りです：

![](/images/ecomsystem/powerbi/LomhbQTPPoZr58xp8f3cxcTen8d.png)

4. レポートビューワークベンチに戻り、ダッシュボードを構築します。
5. `orders` テーブルから `o_totalprice` フィールドをダッシュボードにドラッグします。

![](/images/ecomsystem/powerbi/MB34bks6woK3mDx0eVccivKEngc.png)

6. `region` テーブルから `r_name` フィールドを列 X にドラッグします。

![](/images/ecomsystem/powerbi/JxpJbihDHoHGwixjWQScNyxvn4e.png)

7. これで期待されるダッシュボードコンテンツが表示されるはずです。

![](/images/ecomsystem/powerbi/CfGWb6oaYoj4LyxpPIGcz3Binzb.png)

8. ワークベンチの左上の保存ボタンをクリックして、作成した統計コンパスをローカルマシンに保存します。

![](/images/ecomsystem/powerbi/WozGbmqAOoP2mqxq2NmcJRFyntc.png)

この時点で、Power BI を Apache Doris に正常に接続し、データ分析とダッシュボード作成を実装しました。
