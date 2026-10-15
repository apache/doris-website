---
{
    "title": "Power BI",
    "language": "ja",
    "description": "Power BI Desktop から Apache Doris に接続し、DirectQuery モードまたは Import モードを設定して、Doris のデータを基に可視化ダッシュボードを作成する方法を説明します。",
    "keywords": [
        "Power BI から Doris に接続",
        "Apache Doris Power BI",
        "Doris Power BI コネクタ",
        "Power BI DirectQuery Doris",
        "Power BI Import Doris"
    ]
}
---

<!-- Knowledge type: Operation guide -->
<!-- Applicable scenario: Use Power BI Desktop to connect to Apache Doris and build visualization dashboards -->

Microsoft Power BI では、Apache Doris のデータをクエリしたり、データをメモリに読み込んだりできます。Power BI Desktop を使用して Apache Doris のデータソースに接続し、レポート、ダッシュボード、視覚的な分析を作成できます。

この記事では、ユーザーの作業手順に沿って、次の操作を説明します。

| ユースケース | 目的 | 主な操作 |
|----------|-----------|-----------------|
| 接続環境を準備する | Power BI Desktop から Doris に接続できるようにする | MySQL ODBC ドライバーと Doris Power BI コネクタをインストールする |
| Doris のデータソースに接続する | Power BI Desktop から Apache Doris インスタンスにアクセスする | Doris Data Source、Database、認証情報、データ接続モードを入力する |
| クエリモードを選択する | データ量と分析方法に応じて接続モードを選ぶ | DirectQuery で Doris に直接クエリするか、Import で少量のデータを Power BI に読み込む |
| 可視化ダッシュボードを作成する | Doris の TPC-H データを基に分析レポートを作成する | テーブルのリレーションシップを作成し、フィールドをドラッグアンドドロップして、ダッシュボードを生成・保存する |

## 接続環境を準備する

<!-- Knowledge type: Pre-deployment check -->
<!-- Applicable scenario: Install Power BI Desktop and prepare Doris connection information -->

### Power BI Desktop をインストールする

この記事では、Windows コンピューターに Microsoft Power BI Desktop がインストール済みであることを前提としています。まだインストールしていない場合は、[Power BI Desktop のダウンロードページ](https://www.microsoft.com/en-us/download/details.aspx?id=58494)からダウンロードしてインストールしてください。

Power BI Desktop を最新バージョンに更新することを推奨します。

### Doris の接続情報を準備する

Apache Doris に接続する前に、次の情報を確認してください。

| パラメーター | 意味 | 例 |
|-----------|---------|---------|
| **Doris Data Source** | `host:port` 形式のデータベース接続文字列 | `127.0.1.28:9030` |
| **Database** | データベース名 | `test_db` |
| **Data Connectivity Mode** | `Import` または `DirectQuery` のデータ接続モード | `DirectQuery` |
| **SQL Statement** | データベース名を含める必要がある SQL 文。`Import` モードでのみ使用可能 | `select * from database.table` |
| **User Name** | ユーザー名 | `admin` |
| **Password** | パスワード | `xxxxxx` |

## MySQL ODBC ドライバーをインストールする

<!-- Knowledge type: Operation steps -->
<!-- Applicable scenario: Allow Power BI Desktop to connect to Doris through the MySQL ODBC driver -->

Power BI Desktop から Doris に接続するには、先に MySQL ODBC ドライバーをインストールする必要があります。

### ドライバーをインストールする

1. [MySQL ODBC](https://downloads.mysql.com/archives/c-odbc/) をダウンロードしてインストールします。

2. バージョン 5.3 を選択して設定します。

3. ダウンロードした `.msi` インストーラーを実行し、インストールウィザードの指示に従ってインストールを完了します。

![](/images/next/connection-integration/data-integration/powerbi/WYRLb9JmcoEHeuxr41Ec8yMQnff.png)

![](/images/next/connection-integration/data-integration/powerbi/LYh9bi780o3DaCxwF3BcuPrknlh.png)

![](/images/next/connection-integration/data-integration/powerbi/E1i7buBzHoquRCxT6VAc1FjCnNf.png)

インストールが完了すると、次の画面が表示されます。

![](/images/next/connection-integration/data-integration/powerbi/PURIbSCFhoara3xodBBc5xaNnjc.png)

### ドライバーを確認する

ドライバーのインストール後、次の手順で確認できます。

1. Windows のスタートメニューで `ODBC` と入力し、**ODBC Data Sources (64-bit)** を選択します。

![](/images/next/connection-integration/data-integration/powerbi/QhVVbjalNoIwvdxd1u7cX3UAnEf.png)

2. ドライバー一覧に MySQL ドライバーが表示されることを確認します。

![](/images/next/connection-integration/data-integration/powerbi/OzVSbojxto9SpRxP3sLcnqHmnme.png)

## Doris Power BI コネクタをインストールする

<!-- Knowledge type: Operation steps -->
<!-- Applicable scenario: Load the Doris custom connector in Power BI Desktop -->

Power BI のカスタムコネクタ認定チャネルは現在閉鎖されているため、Doris が提供するカスタムコネクタは未認定です。未認定コネクタについては、[Power BI のカスタムコネクタ設定ドキュメント](https://learn.microsoft.com/en-us/power-bi/connect-data/desktop-connector-extensibility#custom-connectors)を参照して、次の設定を行ってください。

### コネクタファイルを配置する

1. `power_bi_path` を Windows 上の Power BI Desktop のインストールディレクトリとします。通常、既定のパスは次のとおりです。

    ```text
    power_bi_path = C:\Program Files\Power BI Desktop
    ```

2. カスタムコネクタファイル [Doris.mez](https://velodb-bi-connector-1316291683.cos.ap-hongkong.myqcloud.com/PowerBI/latest/Doris.mez) を `%power_bi_path%\Custom Connectors folder` パスに配置します。

3. 上記のパスが存在しない場合は、必要に応じて手動で作成します。

### 未認定コネクタの読み込みを許可する

1. Power BI Desktop で **File** を選択します。

![](/images/next/connection-integration/data-integration/powerbi/YeQDbcIoQoI5RtxU0mjcNXuJnrg.png)

2. **Options and settings** > **Options** を選択します。

![](/images/next/connection-integration/data-integration/powerbi/LV6Tbdw54o5pqtxC2bCctM30nbe.png)

3. **Options** 画面で **GLOBAL** > **Security** を選択します。**Data Extensions** で **(Not Recommended) Allow any extension to load without validation or warning** にチェックを入れ、未認定コネクタの制限を解除します。

![](/images/next/connection-integration/data-integration/powerbi/Tg5cbS75HoBGIMxpcKScJ9WXnRg.png)

4. **OK** を選択してから、Power BI Desktop を再起動します。

## Power BI Desktop から Doris に接続する

<!-- Knowledge type: Operation steps + Configuration parameters -->
<!-- Applicable scenario: Select the Doris connector in Power BI Desktop and fill in connection information -->

ドライバーとコネクタをインストールすると、Power BI Desktop で Doris コネクタを見つけて、Doris のデータソースを作成できます。

### Doris コネクタを探す

1. Power BI Desktop を起動します。

2. Power BI Desktop のスタート画面で **New Report** をクリックします。ローカルにレポートがある場合は、既存のレポートを開くこともできます。

![](/images/next/connection-integration/data-integration/powerbi/FuXNb5hb2oOq7cxNpPEcR1dKnyg.png)

3. **Get Data** をクリックし、ポップアップウィンドウで Doris データベースを選択します。

![](/images/next/connection-integration/data-integration/powerbi/G9UWbT1P6otb53xlgj4cljUInz1.png)

### 接続情報を入力する

Doris コネクタを選択したら、Doris インスタンスの接続情報を入力します。

| パラメーター | 必須 | 説明 |
|-----------|----------|-------------|
| **Doris Data Source** | 必須 | Doris インスタンスのドメイン名、アドレス、または `host:port` |
| **Database** | 必須 | Doris のデータベース名 |
| **SQL statement** | 任意 | 事前に実行する SQL 文。`Import` モードでのみ使用可能 |
| **Data connectivity mode** | 必須 | `DirectQuery` または `Import` を選択する |

![](/images/next/connection-integration/data-integration/powerbi/KiM2bVPWhoYBg5xGQUQcJFNcntg.png)

接続モードの選択目安は次のとおりです。

| モード | 適した用途 | 説明 |
|------|---------------------|-------------|
| **DirectQuery** | Doris に直接クエリする場合に推奨 | Power BI はデータセット全体を読み込まず、クエリを Doris に直接送信する |
| **Import** | データ量が少ない場合に適する | データセット全体を Power BI に読み込む |

:::note

Doris に直接クエリするには、`DirectQuery` を選択することを推奨します。扱うデータ量が少ない場合は、`Import` モードを選択できます。

:::

### ユーザー名とパスワードを入力する

Doris のユーザー名とパスワードを指定します。

![](/images/next/connection-integration/data-integration/powerbi/KZXxbDPTBo2O3FxqgZdcE9I6ndc.png)

### テーブルスキーマを読み込み、データをプレビューする

ナビゲータービューにデータベースとテーブルが表示されます。目的のテーブルを選択して **Load** をクリックし、Apache Doris からテーブルスキーマとプレビューデータを読み込みます。

![](/images/next/connection-integration/data-integration/powerbi/J7xObwqSYoTdTQx3hjgcAjQznS5.png)

インポートが完了すると、Power BI から Doris のデータにアクセスできます。その後、必要な集計ダッシュボードを設定できます。

![](/images/next/connection-integration/data-integration/powerbi/JvIgbbyo2oWPlgxcb6Cct5ssnld.png)

## Power BI で可視化ダッシュボードを作成する

<!-- Knowledge type: Operation example -->
<!-- Applicable scenario: Use Doris TPC-H data to create an order revenue statistics dashboard in Power BI -->

この例では、TPC-H データをデータソースとして使用します。Doris の TPC-H データソースの構築方法については、[Doris TPC-H Benchmark のドキュメント](../../lakehouse/best-practices/tpch.md)を参照してください。

地域別の注文売上を集計する場合を想定します。次の手順でダッシュボードを作成できます。

### テーブルモデルのリレーションシップを作成する

1. **Model view** をクリックして、テーブルモデルのリレーションシップ設定画面を開きます。

![](/images/next/connection-integration/data-integration/powerbi/V7PsbP3oKoJpLjxK5HdcPsnLnKf.png)

2. `customer`、`nation`、`orders`、`region` の四つのテーブルを必要に応じて同じ画面にドラッグし、関連するフィールドをドラッグして接続します。

![](/images/next/connection-integration/data-integration/powerbi/FZL5b2kJcoifIaxI7Eocpak7nvf.png)

![](/images/next/connection-integration/data-integration/powerbi/UxL2b1OV2or1LhxZjHsc0JG7ntb.png)

四つのテーブル間のリレーションシップは次のとおりです。

| ソーステーブル | ソースフィールド | ターゲットテーブル | ターゲットフィールド |
|--------------|--------------|--------------|--------------|
| `customer` | `c_nationkey` | `nation` | `n_nationkey` |
| `customer` | `c_custkey` | `orders` | `o_custkey` |
| `nation` | `n_regionkey` | `region` | `r_regionkey` |

3. リレーションシップの設定後、次の結果が表示されます。

![](/images/next/connection-integration/data-integration/powerbi/LomhbQTPPoZr58xp8f3cxcTen8d.png)

### 注文売上ダッシュボードを設定する

1. **Report view** ワークスペースに戻り、ダッシュボードの作成を開始します。

2. `o_totalprice` を `orders` テーブルからダッシュボードにドラッグします。

![](/images/next/connection-integration/data-integration/powerbi/MB34bks6woK3mDx0eVccivKEngc.png)

3. `r_name` を `region` テーブルから X 列にドラッグします。

![](/images/next/connection-integration/data-integration/powerbi/JxpJbihDHoHGwixjWQScNyxvn4e.png)

4. 想定されるダッシュボードの内容が表示されます。

![](/images/next/connection-integration/data-integration/powerbi/CfGWb6oaYoj4LyxpPIGcz3Binzb.png)

5. ワークスペースの左上にある保存ボタンをクリックして、作成した集計ダッシュボードをローカルに保存します。

![](/images/next/connection-integration/data-integration/powerbi/WozGbmqAOoP2mqxq2NmcJRFyntc.png)

これで、Power BI と Apache Doris の接続、データ分析、可視化ダッシュボードの作成が完了しました。
