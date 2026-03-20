---
{
  "title": "DorisとPaimonの使用",
  "language": "ja",
  "description": "新しいオープンデータ管理アーキテクチャとして、Data レイクハウスはdata warehouseの高いパフォーマンスとリアルタイム機能を統合し"
}
---
新しいオープンデータ管理アーキテクチャとして、Data レイクハウスはデータウェアハウスの高性能とリアルタイム機能を、データレイクの低コストと柔軟性と統合し、ユーザーが様々なデータ処理と分析のニーズをより便利に満たせるよう支援します。企業のビッグデータシステムでの適用が増加しています。

最近のバージョンでは、Apache Dorisはデータレイクとの統合を深め、成熟したData レイクハウスソリューションへと進化しました。

- バージョン0.15以降、Apache DorisはHiveとIceberg外部テーブルを導入し、データレイクにおけるApache Icebergとの組み合わせ機能を探求しています。
- バージョン1.2から、Apache Dorisは正式にMulti-カタログ機能を導入し、様々なデータソースに対する自動メタデータマッピングとデータアクセスを実現し、外部データ読み取りとクエリ実行に対する多くの性能最適化を行いました。現在、高速でユーザーフレンドリーなレイクハウスアーキテクチャを構築する能力を完全に備えています。
- バージョン2.1では、Apache DorisのData レイクハウスアーキテクチャが大幅に強化され、主要なデータレイク形式（Hudi、Iceberg、Paimonなど）の読み書き機能を強化し、複数のSQL方言との互換性を導入し、既存システムからApache Dorisへのシームレスな移行を実現しました。データサイエンスと大規模データ読み取りシナリオに対して、DorisはArrow Flight高速読み取りインターフェースを統合し、データ転送効率を100倍向上させました。

![Building lakehouse using Doris and Paimon](/images/lakehouse-architecture-for-doris-and-paimon.png)

## Apache Doris & Paimon

Apache Paimonは、データレイク形式とLSM構造の利点を革新的に組み合わせたデータレイク形式であり、効率的なリアルタイムストリーミング更新機能をデータレイクアーキテクチャに成功的に導入しています。これにより、Paimonは効率的にデータを管理し、リアルタイム分析を実行し、リアルタイムData レイクハウスアーキテクチャの構築に強力な支援を提供します。

Paimonの機能を最大限に活用し、Paimonデータのクエリ効率を向上させるため、Apache DorisはPaimonの最新機能のいくつかをネイティブでサポートしています：

- Hive MetastoreやFileSystemなど、様々なタイプのPaimon Catalogsをサポートします。
- Paimon 0.6のPrimary Key table Read Optimized機能をネイティブサポートします。
- Paimon 0.8のPrimary Key table Deletion Vector機能をネイティブサポートします。

Apache Dorisの高性能クエリエンジンとApache Paimonの効率的なリアルタイムストリーミング更新機能により、ユーザーは以下を実現できます：

- レイクへのリアルタイムデータ取り込み：PaimonのLSM-Treeモデルを活用することで、レイクへのデータ取り込みを分レベルの適時性に短縮できます。さらに、Paimonは集約、重複排除、部分列更新を含む様々なデータ更新機能をサポートし、データフローをより柔軟で効率的にします。
- 高性能データ処理と分析：PaimonのAppend Only table、Read Optimized、Deletion VectorなどのテクノロジーをDorisの強力なクエリエンジンとシームレスに統合し、レイクデータの高速クエリと分析応答を実現できます。

将来的には、Apache DorisはTime Travelや増分データ読み取りを含むApache Paimonのより高度な機能を段階的にサポートし、統一された高性能リアルタイムlakehouseプラットフォームを共同で構築します。

本記事では、Docker環境でApache Doris + Apache Paimonのテスト・デモンストレーション環境を素早く構築し、様々な機能の使用方法を実演する方法について説明します。

詳細については、[Paimon カタログ](../catalogs/paimon-catalog.mdx)を参照してください。

## ユーザーガイド

本記事で言及されるすべてのスクリプトとコードは、以下のアドレスから取得できます：[https://github.com/apache/doris/tree/master/samples/datalake/iceberg_and_paimon](https://github.com/apache/doris/tree/master/samples/datalake/iceberg_and_paimon)

### 01 環境準備

本記事ではDocker Composeを使用してデプロイメントを行い、以下のコンポーネントとバージョンを使用します：

| Component | Version |
| --- | --- |
| Apache Doris | デフォルト2.1.5、変更可能 |
| Apache Paimon | 0.8 |
| Apache Flink | 1.18 |
| MinIO | RELEASE.2024-04-29T09-56-05Z |

### 02 環境デプロイメント

1. 全コンポーネントを起動

	`bash ./start_all.sh`

2. 起動後、以下のスクリプトを使用してFlinkコマンドラインまたはDorisコマンドラインにログインできます：

	```
	-- login flink
	bash ./start_flink_client.sh
	
	-- login doris
	bash ./start_doris_client.sh
	```
### 03 データ準備

Flinkコマンドラインにログインすると、事前に構築されたテーブルが表示されます。このテーブルにはすでにいくつかのデータが含まれており、Flink SQLを使用して確認できます。

```
Flink SQL> use paimon.db_paimon;
[INFO] Execute statement succeed.

Flink SQL> show tables;
+------------+
| table name |
+------------+
|   customer |
+------------+
1 row in set

Flink SQL> show create table customer;
+------------------------------------------------------------------------+
|                                                                 result |
+------------------------------------------------------------------------+
| CREATE TABLE `paimon`.`db_paimon`.`customer` (
  `c_custkey` INT NOT NULL,
  `c_name` VARCHAR(25),
  `c_address` VARCHAR(40),
  `c_nationkey` INT NOT NULL,
  `c_phone` CHAR(15),
  `c_acctbal` DECIMAL(12, 2),
  `c_mktsegment` CHAR(10),
  `c_comment` VARCHAR(117),
  CONSTRAINT `PK_c_custkey_c_nationkey` PRIMARY KEY (`c_custkey`, `c_nationkey`) NOT ENFORCED
) PARTITIONED BY (`c_nationkey`)
WITH (
  'bucket' = '1',
  'path' = 's3://warehouse/wh/db_paimon.db/customer',
  'deletion-vectors.enabled' = 'true'
)
 |
+-------------------------------------------------------------------------+
1 row in set

Flink SQL> desc customer;
+--------------+----------------+-------+-----------------------------+--------+-----------+
|         name |           type |  null |                         key | extras | watermark |
+--------------+----------------+-------+-----------------------------+--------+-----------+
|    c_custkey |            INT | FALSE | PRI(c_custkey, c_nationkey) |        |           |
|       c_name |    VARCHAR(25) |  TRUE |                             |        |           |
|    c_address |    VARCHAR(40) |  TRUE |                             |        |           |
|  c_nationkey |            INT | FALSE | PRI(c_custkey, c_nationkey) |        |           |
|      c_phone |       CHAR(15) |  TRUE |                             |        |           |
|    c_acctbal | DECIMAL(12, 2) |  TRUE |                             |        |           |
| c_mktsegment |       CHAR(10) |  TRUE |                             |        |           |
|    c_comment |   VARCHAR(117) |  TRUE |                             |        |           |
+--------------+----------------+-------+-----------------------------+--------+-----------+
8 rows in set

Flink SQL> select * from customer order by c_custkey limit 4;
+-----------+--------------------+--------------------------------+-------------+-----------------+-----------+--------------+--------------------------------+
| c_custkey |             c_name |                      c_address | c_nationkey |         c_phone | c_acctbal | c_mktsegment |                      c_comment |
+-----------+--------------------+--------------------------------+-------------+-----------------+-----------+--------------+--------------------------------+
|         1 | Customer#000000001 |              IVhzIApeRb ot,c,E |          15 | 25-989-741-2988 |    711.56 |     BUILDING | to the even, regular platel... |
|         2 | Customer#000000002 | XSTf4,NCwDVaWNe6tEgvwfmRchLXak |          13 | 23-768-687-3665 |    121.65 |   AUTOMOBILE | l accounts. blithely ironic... |
|         3 | Customer#000000003 |                   MG9kdTD2WBHm |           1 | 11-719-748-3364 |   7498.12 |   AUTOMOBILE |  deposits eat slyly ironic,... |
|        32 | Customer#000000032 | jD2xZzi UmId,DCtNBLXKj9q0Tl... |          15 | 25-430-914-2194 |   3471.53 |     BUILDING | cial ideas. final, furious ... |
+-----------+--------------------+--------------------------------+-------------+-----------------+-----------+--------------+--------------------------------+
4 rows in set
```
### 04 データクエリ

以下に示すように、Dorisクラスター内に`paimon`という名前のCatalogが作成されています（SHOW CATALOGSを使用して確認できます）。以下がこのCatalogを作成するためのステートメントです：

```
-- 已创建，无需执行
CREATE CATALOG `paimon` PROPERTIES (
    "type" = "paimon",
    "warehouse" = "s3://warehouse/wh/",
    "s3.endpoint"="http://minio:9000",
    "s3.access_key"="admin",
    "s3.secret_key"="password",
    "s3.region"="us-east-1"
);
```
DorisでPaimonのデータをクエリできます：

```
mysql> use paimon.db_paimon;
Reading table information for completion of table and column names
You can turn off this feature to get a quicker startup with -A

Database changed
mysql> show tables;
+---------------------+
| Tables_in_db_paimon |
+---------------------+
| customer            |
+---------------------+
1 row in set (0.00 sec)

mysql> select * from customer order by c_custkey limit 4;
+-----------+--------------------+---------------------------------------+-------------+-----------------+-----------+--------------+--------------------------------------------------------------------------------------------------------+
| c_custkey | c_name             | c_address                             | c_nationkey | c_phone         | c_acctbal | c_mktsegment | c_comment                                                                                              |
+-----------+--------------------+---------------------------------------+-------------+-----------------+-----------+--------------+--------------------------------------------------------------------------------------------------------+
|         1 | Customer#000000001 | IVhzIApeRb ot,c,E                     |          15 | 25-989-741-2988 |    711.56 | BUILDING     | to the even, regular platelets. regular, ironic epitaphs nag e                                         |
|         2 | Customer#000000002 | XSTf4,NCwDVaWNe6tEgvwfmRchLXak        |          13 | 23-768-687-3665 |    121.65 | AUTOMOBILE   | l accounts. blithely ironic theodolites integrate boldly: caref                                        |
|         3 | Customer#000000003 | MG9kdTD2WBHm                          |           1 | 11-719-748-3364 |   7498.12 | AUTOMOBILE   |  deposits eat slyly ironic, even instructions. express foxes detect slyly. blithely even accounts abov |
|        32 | Customer#000000032 | jD2xZzi UmId,DCtNBLXKj9q0Tlp2iQ6ZcO3J |          15 | 25-430-914-2194 |   3471.53 | BUILDING     | cial ideas. final, furious requests across the e                                                       |
+-----------+--------------------+---------------------------------------+-------------+-----------------+-----------+--------------+--------------------------------------------------------------------------------------------------------+
4 rows in set (1.89 sec)
```
### 05 増分データの読み取り

Flink SQLを使用してPaimonテーブルのデータを更新できます：

```
Flink SQL> update customer set c_address='c_address_update' where c_nationkey = 1;
[INFO] Submitting SQL update statement to the cluster...
[INFO] SQL update statement has been successfully submitted to the cluster:
Job ID: ff838b7b778a94396b332b0d93c8f7ac
```
Flink SQLの実行が完了した後、Dorisで最新のデータを直接確認できます：

```
mysql> select * from customer where c_nationkey=1 limit 2;
+-----------+--------------------+-----------------+-------------+-----------------+-----------+--------------+--------------------------------------------------------------------------------------------------------+
| c_custkey | c_name             | c_address       | c_nationkey | c_phone         | c_acctbal | c_mktsegment | c_comment                                                                                              |
+-----------+--------------------+-----------------+-------------+-----------------+-----------+--------------+--------------------------------------------------------------------------------------------------------+
|         3 | Customer#000000003 | c_address_update |           1 | 11-719-748-3364 |   7498.12 | AUTOMOBILE   |  deposits eat slyly ironic, even instructions. express foxes detect slyly. blithely even accounts abov |
|       513 | Customer#000000513 | c_address_update |           1 | 11-861-303-6887 |    955.37 | HOUSEHOLD    | press along the quickly regular instructions. regular requests against the carefully ironic s          |
+-----------+--------------------+-----------------+-------------+-----------------+-----------+--------------+--------------------------------------------------------------------------------------------------------+
2 rows in set (0.19 sec)
```
### ベンチマーク

Paimon（0.8）バージョンのTPCDS 1000データセットで簡単なテストを実施し、Apache Doris 2.1.5バージョンとTrino 422バージョンを使用し、両方でPrimary Key Table Read Optimized機能を有効にしました。

![](/images/quick-start/lakehouse-paimon-benchmark.PNG)

テスト結果から、標準的な静的テストセットにおけるDorisの平均クエリ性能はTrinoの3-5倍であることが確認できます。今後、実際のビジネスシナリオにおけるクエリ効率をさらに向上させるため、Deletion Vectorを最適化する予定です。

## クエリ最適化

ベースラインデータについて、Apache Paimonバージョン0.6でPrimary Key Table Read Optimized機能を導入した後、クエリエンジンは基盤となるParquet/ORCファイルに直接アクセスでき、ベースラインデータの読み取り効率が大幅に向上しました。未マージの増分データ（INSERT、UPDATE、またはDELETEによって生成されたデータ増分）については、Merge-on-Readを通じて読み取ることができます。さらに、Paimonはバージョン0.8でDeletion Vector機能を導入し、増分データの読み取りにおけるクエリエンジンの効率をさらに向上させました。
Apache DorisはネイティブReaderを通じてDeletion Vectorの読み取りをサポートし、Merge on Readを実行します。DorisのEXPLAIN文を使用したクエリにおけるベースラインデータと増分データのクエリ方法を実演します。

```
mysql> explain verbose select * from customer where c_nationkey < 3;
+------------------------------------------------------------------------------------------------------------------------------------------------+
| Explain String(Nereids Planner)                                                                                                                |
+------------------------------------------------------------------------------------------------------------------------------------------------+
| ...............                                                                                                                                |
|                                                                                                                                                |
|   0:VPAIMON_SCAN_NODE(68)                                                                                                                      |
|      table: customer                                                                                                                           |
|      predicates: (c_nationkey[#3] < 3)                                                                                                         |
|      inputSplitNum=4, totalFileSize=238324, scanRanges=4                                                                                       |
|      partition=3/0                                                                                                                             |
|      backends:                                                                                                                                 |
|        10002                                                                                                                                   |
|          s3://warehouse/wh/db_paimon.db/customer/c_nationkey=1/bucket-0/data-15cee5b7-1bd7-42ca-9314-56d92c62c03b-0.orc start: 0 length: 66600 |
|          s3://warehouse/wh/db_paimon.db/customer/c_nationkey=1/bucket-0/data-5d50255a-2215-4010-b976-d5dc656f3444-0.orc start: 0 length: 44501 |
|          s3://warehouse/wh/db_paimon.db/customer/c_nationkey=2/bucket-0/data-e98fb7ef-ec2b-4ad5-a496-713cb9481d56-0.orc start: 0 length: 64059 |
|          s3://warehouse/wh/db_paimon.db/customer/c_nationkey=0/bucket-0/data-431be05d-50fa-401f-9680-d646757d0f95-0.orc start: 0 length: 63164 |
|      cardinality=18751, numNodes=1                                                                                                             |
|      pushdown agg=NONE                                                                                                                         |
|      paimonNativeReadSplits=4/4                                                                                                                |
|      PaimonSplitStats:                                                                                                                         |
|        SplitStat [type=NATIVE, rowCount=1542, rawFileConvertable=true, hasDeletionVector=true]                                                 |
|        SplitStat [type=NATIVE, rowCount=750, rawFileConvertable=true, hasDeletionVector=false]                                                 |
|        SplitStat [type=NATIVE, rowCount=750, rawFileConvertable=true, hasDeletionVector=false]                                                 |
|      tuple ids: 0
| ...............                                                                                                           |                                                                                                  |
+------------------------------------------------------------------------------------------------------------------------------------------------+
67 rows in set (0.23 sec)
```
Flink SQLによって更新されたテーブルには4つのシャードが含まれており、すべてのシャードがNative Reader（paimonNativeReadSplits=4/4）を通じてアクセス可能であることが確認できます。さらに、最初のシャードのhasDeletionVectorプロパティがtrueになっており、このシャードに対応するDeletion Vectorが存在し、読み取り時にDeletion Vectorに従ってデータがフィルタリングされることを示しています。
