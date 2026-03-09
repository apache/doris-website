---
{
  "title": "TPC-DSベンチマーク",
  "language": "ja",
  "description": "TPC-DS（Transaction Processing Performance Council Decision Support Benchmark）は、意思決定支援に焦点を当てたベンチマークテストであり、"
}
---
# TPC-DS Benchmark

TPC-DS（Transaction Processing Performance Council Decision Support Benchmark）は、意思決定支援に焦点を当てたベンチマークテストであり、データウェアハウスや分析システムの性能を評価することを目的としています。これは、複雑なクエリや大規模データ分析の処理において、異なるシステムの能力を比較するために、Transaction Processing Performance Council（TPC）組織によって開発されました。

TPC-DSの設計目標は、現実世界の複雑な意思決定支援ワークロードをシミュレートすることです。結合、集計、ソート、フィルタリング、サブクエリなどを含む一連の複雑なクエリやデータ操作を通じて、システムの性能をテストします。これらのクエリパターンは、レポート生成、データマイニング、OLAP（Online Analytical Processing）など、単純なものから複雑なものまで様々なシナリオをカバーしています。

この文書では主に、TPC-DS 1000Gテストセットにおけるの性能を紹介します。

TPC-DS標準テストデータセットの99クエリについて、Compute-Storage Decoupled Modeで動作するApache Doris 3.0.3-rc03と従来の統合ストレージ・コンピューティングモードで動作するApache Doris 2.1.7-rc03との間で比較テストを実施し、2.1.x統合モードを以前の3.x統合モード結果のパフォーマンスベースラインとして使用しました。

![TPCDS_1000G](/images/tpcds_3.0.png)

## 1. ハードウェア環境

| ハードウェア | 設定説明 |
|--------------------|------------------------------------------|
| マシン数 | 4台のAliyun仮想マシン（1FE、3BEs） |
| CPU                | Intel Xeon (Ice Lake) Platinum 8369B 32C |
| メモリ             | 128G                                     |
| ディスク               | Enterprise SSD (PL0)                     |

## 2. ソフトウェア環境

- Dorisは3BEと1FEをデプロイ
- カーネルバージョン: Linux version 5.15.0-101-generic
- OSバージョン: Ubuntu 20.04 LTS (Focal Fossa)
- Dorisソフトウェアバージョン: Apache Doris 3.0.3-rc03（Compute-Storage Decoupled Mode）、Apache Doris 2.1.7-rc03
- JDK: openjdk version "17.0.2"

## 3. テストデータ量

テスト全体のシミュレーションによって生成されたTPC-DS 1000Gデータを、それぞれApache Doris 3.0.3-rc03（Compute-Storage Decoupled Mode）とApache Doris 2.1.7-rc03にインポートしてテストを実施しました。以下は、テーブルの関連説明とデータ量です。

| TPC-DSテーブル名      | 行数          |
|------------------------|---------------|
| customer_demographics  | 1,920,800     |
| reason                 | 65            |
| warehouse              | 20            |
| date_dim               | 73,049        |
| catalog_sales          | 1,439,980,416 |
| call_center            | 42            |
| inventory              | 783,000,000   |
| catalog_returns        | 143,996,756   |
| household_demographics | 7,200         |
| customer_address       | 6,000,000     |
| income_band            | 20            |
| catalog_page           | 30,000        |
| item                   | 300,000       |
| web_returns            | 71,997,522    |
| web_site               | 54            |
| promotion              | 1,500         |
| web_sales              | 720,000,376   |
| store                  | 1,002         |
| web_page               | 3,000         |
| time_dim               | 86,400        |
| store_returns          | 287,999,764   |
| store_sales            | 2,879,987,999 |
| ship_mode              | 20            |
| customer               | 12,000,000    |

## 4. テストSQL

TPC-DS 99テストクエリステートメント : [TPC-DS-Query-SQL](https://github.com/apache/doris/tree/master/tools/tpcds-tools/queries/sf1000)

## 5. テスト結果

ここでは、Apache Doris 3.0.3-rc03（Compute-Storage Decoupled Mode）とApache Doris 2.1.7-rc03を使用して比較テストを実施しました。テストでは、Query Time（ms）を主要なパフォーマンス指標として使用しています。
テスト結果は以下の通りです：

| クエリ     | Apache Doris 3.0.3-rc03 Compute-Storage Decoupled Mode (ms) | Apache Doris 2.1.7-rc03 (ms) |
|-----------|-----------------------------------------------------------|------------------------------|
| query01   | 580                                                       | 630                          |
| query02   | 5540                                                      | 4930                         |
| query03   | 350                                                       | 360                          |
| query04   | 10790                                                     | 11070                        |
| query05   | 710                                                       | 620                          |
| query06   | 230                                                       | 220                          |
| query07   | 590                                                       | 550                          |
| query08   | 350                                                       | 330                          |
| query09   | 7520                                                      | 6830                         |
| query10   | 390                                                       | 370                          |
| query11   | 6560                                                      | 6960                         |
| query12   | 120                                                       | 100                          |
| query13   | 780                                                       | 790                          |
| query14   | 13200                                                     | 13470                        |
| query15   | 400                                                       | 510                          |
| query16   | 410                                                       | 520                          |
| query17   | 1300                                                      | 1310                         |
| query18   | 650                                                       | 560                          |
| query19   | 250                                                       | 200                          |
| query20   | 110                                                       | 100                          |
| query21   | 110                                                       | 80                           |
| query22   | 1570                                                      | 2300                         |
| query23   | 37180                                                     | 38240                        |
| query24   | 7470                                                      | 8340                         |
| query25   | 920                                                       | 780                          |
| query26   | 200                                                       | 200                          |
| query27   | 550                                                       | 530                          |
| query28   | 7300                                                      | 5940                         |
| query29   | 920                                                       | 940                          |
| query30   | 300                                                       | 270                          |
| query31   | 2000                                                      | 1890                         |
| query32   | 70                                                        | 60                           |
| query33   | 400                                                       | 350                          |
| query34   | 760                                                       | 750                          |
| query35   | 1290                                                      | 1370                         |
| query36   | 460                                                       | 530                          |
| query37   | 80                                                        | 60                           |
| query38   | 5450                                                      | 7520                         |
| query39   | 760                                                       | 560                          |
| query40   | 140                                                       | 150                          |
| query41   | 50                                                        | 50                           |
| query42   | 110                                                       | 100                          |
| query43   | 1170                                                      | 1150                         |
| query44   | 2120                                                      | 2020                         |
| query45   | 280                                                       | 430                          |
| query46   | 1390                                                      | 1250                         |
| query47   | 2160                                                      | 2660                         |
| query48   | 660                                                       | 630                          |
| query49   | 810                                                       | 730                          |
| query50   | 1570                                                      | 1640                         |
| query51   | 6030                                                      | 6430                         |
| query52   | 120                                                       | 110                          |
| query53   | 280                                                       | 250                          |
| query54   | 1540                                                      | 1280                         |
| query55   | 130                                                       | 110                          |
| query56   | 300                                                       | 290                          |
| query57   | 1240                                                      | 1480                         |
| query58   | 260                                                       | 240                          |
| query59   | 10120                                                     | 7760                         |
| query60   | 370                                                       | 380                          |
| query61   | 560                                                       | 540                          |
| query62   | 920                                                       | 740                          |
| query63   | 230                                                       | 210                          |
| query64   | 1660                                                      | 5790                         |
| query65   | 4800                                                      | 4900                         |
| query66   | 400                                                       | 480                          |
| query67   | 24190                                                     | 27320                        |
| query68   | 1400                                                      | 1600                         |
| query69   | 1170                                                      | 380                          |
| query70   | 3160                                                      | 3480                         |
| query71   | 440                                                       | 460                          |
| query72   | 4090                                                      | 3160                         |
| query73   | 660                                                       | 660                          |
| query74   | 5720                                                      | 5990                         |
| query75   | 4560                                                      | 4610                         |
| query76   | 1800                                                      | 1590                         |
| query77   | 330                                                       | 300                          |
| query78   | 16300                                                     | 17970                        |
| query79   | 3160                                                      | 3040                         |
| query80   | 590                                                       | 570                          |
| query81   | 540                                                       | 460                          |
| query82   | 320                                                       | 270                          |
| query83   | 230                                                       | 220                          |
| query84   | 130                                                       | 130                          |
| query85   | 780                                                       | 520                          |
| query86   | 660                                                       | 760                          |
| query87   | 6200                                                      | 8000                         |
| query88   | 5620                                                      | 5560                         |
| query89   | 400                                                       | 430                          |
| query90   | 150                                                       | 150                          |
| query91   | 160                                                       | 150                          |
| query92   | 50                                                        | 40                           |
| query93   | 2380                                                      | 2440                         |
| query94   | 290                                                       | 340                          |
| query95   | 410                                                       | 350                          |
| query96   | 680                                                       | 660                          |
| query97   | 4870                                                      | 5020                         |
| query98   | 200                                                       | 190                          |
| query99   | 1940                                                      | 1560                         |
| **合計** | **251620**                                                | **261320**                   |

## 6. 環境準備

正常に動作するDorisクラスタ（最低1 FE 1 BE、推奨は1 FE 3 BE）を取得するために、[公式ドキュメント](../install/deploy-manually/integrated-storage-compute-deploy-manually)を参照してDorisのインストールとデプロイを行ってください。

## 7. データ準備

### 7.1 TPC-DSデータ生成ツールのダウンロードとインストール

以下のスクリプトを実行して、[tpcds-tools](https://github.com/apache/doris/tree/master/tools/tpcds-tools)ツールをダウンロードおよびコンパイルしてください。

```shell
sh bin/build-tpcds-dbgen.sh
```
### 7.2 TPC-DSテストセットの生成

以下のスクリプトを実行してTPC-Hデータセットを生成します：

```shell
sh bin/gen-tpcds-data.sh -s 1000
```
> Note 1: `sh gen-tpcds-data.sh -h` でスクリプトのヘルプを確認してください。
>
> Note 2: データは `tpcds-data/` ディレクトリ配下に `.dat` 拡張子で生成されます。総ファイルサイズは約1000GBで、生成には数分から1時間程度かかる場合があります。
>
> Note 3: デフォルトでは100Gの標準テストデータセットが生成されます。

### 7.3 テーブル作成

#### 7.3.1 `doris-cluster.conf` ファイルの準備

スクリプトをインポートする前に、`doris-cluster.conf` ファイルにFEのIPポートおよびその他の情報を記述する必要があります。

このファイルは `${DORIS_HOME}/tools/tpcds-tools/conf/` にあります。

ファイルの内容には、FEのIP、HTTPポート、ユーザー名、パスワード、およびインポート対象データのDB名が含まれます：

```shell
# Any of FE host
export FE_HOST='127.0.0.1'
# http_port in fe.conf
export FE_HTTP_PORT=8030
# query_port in fe.conf
export FE_QUERY_PORT=9030
# Doris username
export USER='root'
# Doris password
export PASSWORD=''
# The database where TPC-H tables located
export DB='tpcds'
```
#### TPC-Hテーブルを生成・作成するために以下のスクリプトを実行する

```shell
sh bin/create-tpcds-tables.sh -s 1000
```
または、[create-tpcds-tables](https://github.com/apache/doris/blob/master/tools/tpcds-tools/ddl/create-tpcds-tables-sf1000)のテーブル作成文をコピーしてDorisで実行してください。


### 7.4 データのインポート

以下のコマンドでデータインポートを実行してください：

```shell
sh bin/load-tpcds-data.sh
```
### 7.5 クエリテスト

#### 7.5.1 クエリスクリプトの実行

上記のテストSQLを実行するか、以下のコマンドを実行してください

```
sh bin/run-tpcds-queries.sh -s 1000
```
#### 7.5.2 単一SQL実行

コードリポジトリから最新のSQLを取得することもできます。[TPC-DS](https://github.com/apache/doris/tree/master/tools/tpcds-tools/queries/sf1000)の最新テストクエリステートメントのアドレスです。
