---
{
  "title": "TPC-DSベンチマーク",
  "language": "ja",
  "description": "TPC-DS（Transaction Processing Performance Council Decision Support Benchmark）は、意思決定支援に焦点を当てたベンチマークテストであり、"
}
---
# TPC-DS Benchmark

TPC-DS (Transaction Processing Performance Council Decision Support Benchmark) は、意思決定支援に焦点を当てたベンチマークテストで、データウェアハウスおよび分析システムの性能を評価することを目的としています。これは、異なるシステムの複雑なクエリと大規模データ分析の処理能力を比較するために、Transaction Processing Performance Council (TPC) 組織によって開発されました。

TPC-DSの設計目標は、実世界の複雑な意思決定支援ワークロードをシミュレートすることです。結合、集約、ソート、フィルタリング、サブクエリなどを含む一連の複雑なクエリとデータ操作を通じて、システムの性能をテストします。これらのクエリパターンは、レポート生成、データマイニング、OLAP (Online Analytical Processing) などの単純なものから複雑なものまで、様々なシナリオをカバーしています。

このドキュメントでは主に、TPC-DS 1000Gテストセットでの Doris の性能を紹介します。

TPC-DS標準テストデータセットの99クエリについて、Apache Doris 2.1.7-rc03 と Apache Doris 2.0.15.1 バージョンに基づいて比較テストを実施しました。


![Doris on TPC-DS 1000G test set](/images/tpcds_2.1.png)

## 1. ハードウェア環境

| ハードウェア | 設定説明 |
|--------------------|------------------------------------------|
| マシン数 | 4 Aliyun Virtual Machine (1FE，3BEs) |
| CPU | Intel Xeon (Ice Lake) Platinum 8369B 32C |
| メモリ | 128G |
| ディスク | Enterprise SSD (PL0) |


## 2. ソフトウェア環境

- Doris デプロイ構成：3BEs と 1FE
- カーネルバージョン：Linux version 5.15.0-101-generic 
- OSバージョン：Ubuntu 20.04 LTS (Focal Fossa)
- Doris ソフトウェアバージョン：Apache Doris 2.1.7-rc03, Apache Doris 2.0.15.1
- JDK：openjdk version "1.8.0_352-352"

## 3. テストデータ量

テスト全体のシミュレーションによって生成された TPC-DS 1000G データを、それぞれ Apache Doris 2.1.7-rc03 と Apache Doris 2.0.15.1 にインポートしてテストを行いました。以下は、テーブルの関連説明とデータ量です。

| TPC-DS テーブル名 | 行数 |
|------------------------|---------------|
| customer_demographics | 1,920,800 |
| reason | 65 |
| warehouse | 20 |
| date_dim | 73,049 |
| catalog_sales | 1,439,980,416 |
| call_center | 42 |
| inventory | 783,000,000 |
| catalog_returns | 143,996,756 |
| household_demographics | 7,200 |
| customer_address | 6,000,000 |
| income_band | 20 |
| catalog_page | 30,000 |
| item | 300,000 |
| web_returns | 71,997,522 |
| web_site | 54 |
| promotion | 1,500 |
| web_sales | 720,000,376 |
| store | 1,002 |
| web_page | 3,000 |
| time_dim | 86,400 |
| store_returns | 287,999,764 |
| store_sales | 2,879,987,999 |
| ship_mode | 20 |
| customer | 12,000,000 |

## 4. テスト SQL

TPC-DS 99 テストクエリステートメント : [TPC-DS-Query-SQL](https://github.com/apache/doris/tree/master/tools/tpcds-tools/queries/sf1000)

## 5. テスト結果

ここでは Apache Doris 2.1.7-rc03 と Apache Doris 2.0.15.1 を使用して比較テストを行いました。テストでは、Query Time(ms) を主要な性能指標として使用しています。
テスト結果は以下の通りです：（Apache Doris 2.0.15.1 の q78 q79 は最新のメモリ最適化の不足により実行に失敗したため、合計値の計算時に除外されました）

| Query | Apache Doris 2.1.7-rc03 (ms) | Apache Doris 2.0.15.1 (ms) |
|-----------|-------------------------------|-----------------------------|
| query01 | 630 | 890 |
| query02 | 4930 | 6930 |
| query03 | 360 | 460 |
| query04 | 11070 | 42320 |
| query05 | 620 | 15360 |
| query06 | 220 | 1020 |
| query07 | 550 | 750 |
| query08 | 330 | 670 |
| query09 | 6830 | 7550 |
| query10 | 370 | 2900 |
| query11 | 6960 | 27380 |
| query12 | 100 | 80 |
| query13 | 790 | 2860 |
| query14 | 13470 | 42340 |
| query15 | 510 | 940 |
| query16 | 520 | 550 |
| query17 | 1310 | 2650 |
| query18 | 560 | 820 |
| query19 | 200 | 400 |
| query20 | 100 | 190 |
| query21 | 80 | 80 |
| query22 | 2300 | 3070 |
| query23 | 38240 | 75260 |
| query24 | 8340 | 26580 |
| query25 | 780 | 1190 |
| query26 | 200 | 220 |
| query27 | 530 | 750 |
| query28 | 5940 | 7400 |
| query29 | 940 | 1250 |
| query30 | 270 | 490 |
| query31 | 1890 | 2530 |
| query32 | 60 | 70 |
| query33 | 350 | 450 |
| query34 | 750 | 1380 |
| query35 | 1370 | 8970 |
| query36 | 530 | 570 |
| query37 | 60 | 60 |
| query38 | 7520 | 8710 |
| query39 | 560 | 1010 |
| query40 | 150 | 180 |
| query41 | 50 | 40 |
| query42 | 100 | 140 |
| query43 | 1150 | 1960 |
| query44 | 2020 | 3220 |
| query45 | 430 | 960 |
| query46 | 1250 | 2760 |
| query47 | 2660 | 5790 |
| query48 | 630 | 2570 |
| query49 | 730 | 800 |
| query50 | 1640 | 2200 |
| query51 | 6430 | 6270 |
| query52 | 110 | 160 |
| query53 | 250 | 490 |
| query54 | 1280 | 7790 |
| query55 | 110 | 160 |
| query56 | 290 | 410 |
| query57 | 1480 | 3510 |
| query58 | 240 | 550 |
| query59 | 7760 | 11870 |
| query60 | 380 | 490 |
| query61 | 540 | 670 |
| query62 | 740 | 1560 |
| query63 | 210 | 460 |
| query64 | 5790 | 6840 |
| query65 | 4900 | 7960 |
| query66 | 480 | 810 |
| query67 | 27320 | 46110 |
| query68 | 1600 | 2380 |
| query69 | 380 | 800 |
| query70 | 3480 | 5330 |
| query71 | 460 | 790 |
| query72 | 3160 | 5390 |
| query73 | 660 | 1250 |
| query74 | 5990 | 16450 |
| query75 | 4610 | 8410 |
| query76 | 1590 | 2950 |
| query77 | 300 | 480 |
| query78 | 17970 | - |
| query79 | 3040 | - |
| query80 | 570 | 910 |
| query81 | 460 | 760 |
| query82 | 270 | 330 |
| query83 | 220 | 290 |
| query84 | 130 | 110 |
| query85 | 520 | 470 |
| query86 | 760 | 1220 |
| query87 | 800 | 8760 |
| query88 | 5560 | 9690 |
| query89 | 430 | 750 |
| query90 | 150 | 400 |
| query91 | 150 | 120 |
| query92 | 40 | 40 |
| query93 | 2440 | 2670 |
| query94 | 340 | 310 |
| query95 | 350 | 1810 |
| query96 | 660 | 1680 |
| query97 | 5020 | 14990 |
| query98 | 190 | 330 |
| query99 | 1560 | 3230 |
| **合計** | **261320** | **507380** |

## 6. 環境準備

[公式ドキュメント](../install/deploy-manually/integrated-storage-compute-deploy-manually.md) を参照して Doris をインストールおよびデプロイし、正常に動作する Doris クラスター（最低 1 FE 1 BE、推奨は 1 FE 3 BE）を取得してください。

## 7. データ準備

### 7.1 TPC-DS データ生成ツールのダウンロードとインストール

以下のスクリプトを実行して、[tpcds-tools](https://github.com/apache/doris/tree/master/tools/tpcds-tools) ツールをダウンロードしてコンパイルします。

```shell
sh bin/build-tpcds-dbgen.sh
```
### 7.2 TPC-DSテストセットの生成

以下のスクリプトを実行してTPC-Hデータセットを生成します：

```shell
sh bin/gen-tpcds-data.sh -s 1000
```
> 注意1: `sh gen-tpcds-data.sh -h`でスクリプトヘルプを確認してください。
>
> 注意2: データは`tpcds-data/`ディレクトリ配下に`.dat`拡張子で生成されます。総ファイルサイズは約1000GBで、生成に数分から1時間程度かかる場合があります。
>
> 注意3: デフォルトでは100Gの標準テストデータセットが生成されます。

### 7.3 テーブル作成

#### 7.3.1 `doris-cluster.conf`ファイルの準備

スクリプトをインポートする前に、`doris-cluster.conf`ファイルにFEのipポートやその他の情報を記述する必要があります。

このファイルは`${DORIS_HOME}/tools/tpcds-tools/conf/`配下にあります。

ファイルの内容には、FEのip、HTTPポート、ユーザー名、パスワード、およびインポートするデータのDB名が含まれます：

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
または、[create-tpcds-tables](https://github.com/apache/doris/blob/master/tools/tpcds-tools/ddl/create-tpcds-tables-sf1000)のテーブル作成文をコピーして、Dorisで実行してください。


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

コードリポジトリから最新のSQLを取得することも可能です。[TPC-DS](https://github.com/apache/doris/tree/master/tools/tpcds-tools/queries/sf1000)の最新テストクエリステートメントのアドレス。
