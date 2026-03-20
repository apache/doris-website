---
{
  "title": "Metabase",
  "language": "ja",
  "description": "Metabaseは、シンプルで使いやすいデータ分析と可視化機能を提供し、豊富なデータソース接続をサポートし、インタラクティブなダッシュボードの迅速な構築を可能にするオープンソースのビジネスインテリジェンスツールです。"
}
---
Metabaseは、シンプルで使いやすいデータ分析および可視化機能を提供し、豊富なデータソース接続をサポートし、インタラクティブなダッシュボードの迅速な構築を可能にするオープンソースのビジネスインテリジェンスツールです。主な機能には、ユーザーフレンドリーなインターフェース、使いやすさ、セルフサービス分析のサポート、可視化ダッシュボードの作成、データドリルダウン探索、SQLクエリとデータエクスポートのための統合SQLクエリエディタが含まれます。

Metabase Apache Doris Driverにより、MetabaseをApache Dorisデータベースに接続し、Dorisの内部および外部データのクエリと可視化が可能になります。

このドライバーにより、MetabaseがApache Dorisデータベースとテーブルをデータソースとして統合できます。この機能を有効にするには、以下のセットアップガイドに従ってください：

- ドライバーのインストールと設定
- MetabaseでのApache Dorisデータソースの設定
- Metabaseでの可視化の構築
- 接続と使用のヒント

## MetabaseとDoris Driverのインストール

### 前提条件

1. Metabaseバージョン0.48.0以降をダウンロードしてインストールします。詳細については[Metabase Installation Documentation](https://www.metabase.com/docs/latest/installation-and-operation/installing-metabase)を参照してください。
2. Apache Dorisクラスターを準備します。

### Doris Driverのインストール

まず、最新の[metabase-doris-driver](https://velodb-bi-connector-1316291683.cos.ap-hongkong.myqcloud.com/Metabase/latest/doris.metabase-driver.jar)をダウンロードする必要があります。

次に、ドライバーをインストールします。インストール方法は、Metabaseのデプロイメント方法によって異なります：

#### Metabase標準デプロイメント

1. Driverをダウンロードします

2. Metabaseプラグインディレクトリを作成します（存在しない場合）：

```bash
mkdir -p $path_metabase/plugins
```
3. JARファイルをプラグインディレクトリにコピーします：

```bash
cp doris.metabase-driver.jar $path_metabase/plugins
```
4. Metabaseサービスを再起動します

#### Metabase Dockerデプロイメント

MetabaseをDockerを使用して起動する場合は、`doris.metabase-driver.jar`をマウントして起動することを推奨します。Dockerコンテナ内のプラグインパスは`/plugins/`です。

1. Driverをダウンロードします

2. 次のコマンドを使用してMetabaseを起動します：

```bash
docker run -d -p 3000:3000 --name metabase  -v $host_path/doris.metabase-driver.jar:/plugins/doris.metabase-driver.jar  metabase/metabase
```
## MetabaseでDorisデータソースを設定する

**Metabase**と**metabase-doris-driver**がインストールされたので、Dorisのtpchデータベースに接続するMetabaseのデータソースを定義する方法を見てみましょう。

### 接続パラメータの説明

Apache Dorisに接続する際に設定する必要があるパラメータは以下の通りです：

| Parameters | Meaning | Example |
|------|------|------|
| **Display Name** | データソース表示名 | Doris-TPCH |
| **Host** | Doris FEノードアドレス | 127.0.0.1 |
| **Port** | Doris Query Port（MySQLプロトコルポート） | 9030 |
| **Catalog name** | Catalog名（オプション、デフォルトはinternal） | internal |
| **Database name** | データベース名（必須） | tpch |
| **Username** | ユーザー名 | root |
| **Password** | パスワード | your_password |

**Database Name形式の説明：**

- **Internal Tables**: データベース名を直接入力します（例：`tpch`）。システムは自動的に`internal`カタログを使用します。
- **External Tables/Data Lake**: Catalog設定を入力します。内部テーブルのみをリンクする場合、この項目は不要です。

### 設定手順

1. Metabaseを起動してログインします。

2. 右上の歯車アイコンをクリックして、**Admin Settings**を選択します。

![Metabase Admin Settings](/images/ecomsystem/metabase/metabase-01.png)

3. 左側のメニューで**Databases**を選択し、右上の**Add database**ボタンをクリックします。

![Add database](/images/ecomsystem/metabase/metabase-02.png)

4. **Database type**ドロップダウンメニューから**Apache Doris**を選択します。

![Select Apache Doris](/images/ecomsystem/metabase/metabase-03.png)

5. 接続情報を入力します：

- **Display name**: Doris-TPCH
- **Host**: 127.0.0.1
- **Port**: 9030
- **Database name**: tpch
- **Username**: admin
- **Password**: ******

![Fill in connection information](/images/ecomsystem/metabase/metabase-04.png)

6. **Save**をクリックして設定を保存します。

7. Metabaseは自動的に接続をテストし、データベースメタデータを同期します。接続が成功すると、成功メッセージが表示されます。

![Connection successful](/images/ecomsystem/metabase/metabase-05.png)

これでデータソース設定は完了です！次に、Metabaseで可視化を構築できます。

## Metabaseでの可視化の構築

データソースとしてTPC-Hデータを選択します。Doris TPC-Hデータソースの構築手順については[このドキュメント](../../benchmark/tpch)を参照してください。

MetabaseでDorisデータソースを設定したので、データを可視化してみましょう...

コスト分析のために、異なる配送方法の時系列での注文金額の成長曲線を分析する必要があるとします。

### Questionの作成

1. ホームページの右上の**New +**ボタンをクリックして**Question**を選択します。

![Create a new question](/images/ecomsystem/metabase/metabase-06.png)

2. データソースを選択します：
    - **Database**: Doris TPCH
    - **Table**: lineitem

![Select the table](/images/ecomsystem/metabase/metabase-07.png)

### SQLを使用したカスタムメトリクスの構築

収益を計算するには、カスタムSQL式を使用する必要があります：

1. 右上の**view sql**スイッチをクリックし、次に**convert this question to SQL**をクリックしてSQLを編集します。

![Switch to SQL mode](/images/ecomsystem/metabase/metabase-08.png)

2. 以下のSQLクエリを入力します：

```sql
SELECT 
  DATE_FORMAT(l_shipdate, '%Y-%m') AS ship_month,
  l_shipmode,
  SUM(l_extendedprice * (1 - l_discount)) AS revenue
FROM lineitem
WHERE l_shipdate >= '1995-01-01' 
  AND l_shipdate < '1997-01-01'
GROUP BY 
  DATE_FORMAT(l_shipdate, '%Y-%m'),
  l_shipmode
ORDER BY ship_month, l_shipmode
```
3. 右下隅の**Visualize**ボタンをクリックして結果を表示します。

![View Results](/images/ecomsystem/metabase/metabase-09.png)


### 可視化チャートの設定

1. デフォルトの表示はテーブルです。左下隅の**Visualization**ボタンをクリックして、**Line**チャートタイプを選択します。

![Select Line Chart](/images/ecomsystem/metabase/metabase-10.png)

2. 必要に応じてチャートパラメータを設定します（metabaseは以下のように自動設定します）：
    - **X軸**: ship_month（出荷月）
    - **Y軸**: revenue（収益）
    - **シリーズ**: l_shipmode（出荷モード）

3. チャートスタイルをカスタマイズします：
    - **Settings**アイコンをクリックして、色、ラベル、凡例の位置などを調整します。
    - **Display**タブでは、軸のタイトル、値の形式などを設定できます。

4. チャートの設定後、右上隅の**Save**をクリックします。

5. 課題名を入力します：**my-tpch**、および保存先のコレクションを選択します。

![Naming the issue](/images/ecomsystem/metabase/metabase-11.png)

### Dashboardの作成

1. **+ New** → **Dashboard**をクリックして新しいダッシュボードを作成します。ダッシュボード名を入力します：**my-tpch**

![Creating a Dashboard](/images/ecomsystem/metabase/metabase-12.png)

2. **Add a chart**をクリックして、保存したクエスチョンをダッシュボードに追加します。

![Adding a Question](/images/ecomsystem/metabase/metabase-13.png)

3. チャートの位置とサイズを調整し、右上隅の**Save**をクリックしてダッシュボードを保存します。

![Saving the Dashboard](/images/ecomsystem/metabase/metabase-14.png)

この時点で、MetabaseはApache Dorisへの接続に成功し、データ分析と可視化ダッシュボードの作成が実装されました！

## 高度な機能

### Catalogsを使用した外部データへのアクセス

Dorisはマルチcatalog機能をサポートしており、外部データソースへのクエリやデータソース間のクエリが可能です。Metabaseで使用する場合：

1. Links設定画面で`Catalog`を設定し、そのcatalog配下の外部データベースを`Database`に設定します。例：  
   `catalog: hive_catalog`、`database: warehouse` - hive_catalogという名前のwarehouseデータベースにアクセス

![Configuring catalog](/images/ecomsystem/metabase/metabase-15.png)

2. または、SQLクエリ内でCatalogを明示的に指定します：

```sql
SELECT * FROM hive.warehouse.orders LIMIT 100;
```
### パラメータ化クエリの使用

Metabaseは、SQLクエリでの変数の使用をサポートしており、インタラクティブなダッシュボードを簡単に作成できます：

```sql
SELECT 
  l_shipmode,
  SUM(l_extendedprice * (1 - l_discount)) AS revenue
FROM lineitem
WHERE l_shipdate BETWEEN {{start_date}} AND {{end_date}}
  AND l_shipmode = {{ship_mode}}
GROUP BY l_shipmode
```
保存後、ドロップダウンメニューや日付ピッカーを使用してダッシュボードでデータを動的にフィルタリングできます。

### パフォーマンス最適化の推奨事項

1. **Partition Clippingを使用**: WHERE句にパーティション列のフィルタ条件を追加します。

   ```sql
   WHERE date >= '2024-01-01' AND date < '2024-02-01'
   ```
2. **Materialized Viewの活用:** 複雑な集計クエリの場合、Dorisでmaterialized viewを作成することでクエリプロセスを高速化できます。

3. **結果セットサイズの制御:** LIMITを使用して返される行数を制限し、一度に大量のデータを読み込むことを避けます。

4. **クエリキャッシング:** Metabaseは自動的にクエリ結果をキャッシュします。適切なキャッシュ時間を設定することでパフォーマンスを向上させることができます。

### 接続と使用のヒント

- **ドライバーインストール:** `doris.metabase-driver.jar`がMetabaseの`plugins`ディレクトリに配置されていることを確認し、Metabaseを再起動してください。
- **タイムゾーン設定:** タイムゾーンの問題が発生した場合は、JDBC接続文字列に`serverTimezone=Asia/Shanghai`を追加してください。
- **パーティションテーブル最適化:** 時間で分割し、バケット化した適切なDorisパーティションテーブルを作成することで、クエリでスキャンされるデータ量を効果的に削減できます。
- **ネットワーク接続:** VPCプライベート接続の使用を推奨します。パブリックネットワークアクセスによるセキュリティリスクを回避できます。
- **アクセス制御:** Dorisユーザーアカウントのロールとアクセス権限を細かく調整し、最小権限の原則に従ってください。
- **メタデータ同期:** Dorisのテーブル構造が変更された場合は、Metabase管理ページで「Sync database schema now」をクリックして手動で同期してください。
- **パフォーマンス監視**: 遅いクエリについては、Dorisで`SHOW QUERY PROFILE`を使用してパフォーマンスのボトルネックを分析できます。

### データタイプ表示の異常

- Doris Driverの最新バージョンを使用していることを確認してください。
- Dorisのlargeintタイプは、SQLで明示的に変換する必要があります。

  ```sql
  SELECT CAST(large_int_col AS STRING) FROM table
  ```
