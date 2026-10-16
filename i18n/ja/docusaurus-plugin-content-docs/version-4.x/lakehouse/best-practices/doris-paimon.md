---
{
    "title": "Doris と Paimon の活用",
    "language": "ja",
    "description": "新しいオープンなデータ管理アーキテクチャであるデータレイクハウスは、データウェアハウスの高性能とリアルタイム処理能力を、"
}
---

データレイクハウスは、新しいオープンなデータ管理アーキテクチャとして、データウェアハウスの高性能とリアルタイム処理能力を、データレイクの低コストと柔軟性と組み合わせます。これにより、ユーザーはさまざまなデータ処理・分析のニーズに対応しやすくなります。企業のビッグデータシステムでも採用が進んでいます。

近年のバージョンで、Apache Doris はデータレイクとの連携を深め、成熟したデータレイクハウスソリューションへと発展してきました。

- バージョン 0.15 以降、Apache Doris は Hive と Iceberg の外部テーブルを導入し、データレイクにおける Apache Iceberg との連携の可能性を探ってきました。
- バージョン 1.2 から、Apache Doris は Multi-Catalog 機能を正式に導入しました。さまざまなデータソースのメタデータを自動的にマッピングしてデータにアクセスできるようになり、外部データの読み取りとクエリ実行にも多くの性能最適化が加わりました。これにより、高速で使いやすいレイクハウスアーキテクチャを構築できるようになりました。
- バージョン 2.1 では、Apache Doris のデータレイクハウスアーキテクチャが大幅に強化されました。主要なデータレイク形式（Hudi、Iceberg、Paimon など）の読み書き能力を高め、複数の SQL 方言との互換性を導入して、既存システムから Apache Doris へのシームレスな移行を可能にしました。データサイエンスや大規模なデータ読み取りの用途では、高速読み取りインターフェースの Arrow Flight を統合し、データ転送効率を 100 倍に向上させました。

![Doris と Paimon を使用したレイクハウスの構築](/images/lakehouse-architecture-for-doris-and-paimon.png)

## Apache Doris と Paimon

Apache Paimon は、データレイク形式と LSM 構造の利点を組み合わせたデータレイク形式です。データレイクアーキテクチャに効率的なリアルタイムのストリーミング更新機能をもたらします。これにより、Paimon はデータを効率的に管理してリアルタイムに分析でき、リアルタイムのデータレイクハウスアーキテクチャの構築を支えます。

Paimon の機能を十分に活用し、Paimon データのクエリ効率を高めるため、Apache Doris は Paimon の次の機能をネイティブにサポートしています。

- Hive Metastore や FileSystem など、さまざまな種類の Paimon Catalog をサポートします。
- Paimon 0.6 の Primary Key Table Read Optimized 機能をネイティブにサポートします。
- Paimon 0.8 の Primary Key Table Deletion Vector 機能をネイティブにサポートします。

Apache Doris の高性能なクエリエンジンと Apache Paimon の効率的なリアルタイムストリーミング更新機能を組み合わせることで、次のことが可能になります。

- リアルタイムのデータレイクへの取り込み：Paimon の LSM-Tree モデルを活用することで、データレイクへの取り込みの遅延を分単位に短縮できます。また、Paimon は集約、重複排除、列の部分更新など、さまざまなデータ更新機能をサポートしており、データフローをより柔軟かつ効率的にします。
- 高性能なデータ処理と分析：Paimon の Append Only Table、Read Optimized、Deletion Vector などの技術を Doris の強力なクエリエンジンとシームレスに統合し、データレイク内のデータに対するクエリと分析に高速に応答できます。

今後、Apache Doris は Time Travel や増分データの読み取りなど、Apache Paimon の高度な機能を段階的にサポートし、統一された高性能なリアルタイムレイクハウスプラットフォームの構築を進めます。

この記事では、Docker 環境に Apache Doris と Apache Paimon のテスト・デモ環境をすばやく構築する方法と、さまざまな機能の使い方を説明します。

詳しくは [Paimon Catalog](../catalogs/paimon-catalog.mdx) を参照してください。

## ユーザーガイド

この記事で使用するスクリプトとコードは、次の場所から入手できます。 [https://github.com/apache/doris/tree/master/samples/datalake/iceberg_and_paimon](https://github.com/apache/doris/tree/master/samples/datalake/iceberg_and_paimon)

### 01 環境の準備

この記事では Docker Compose を使用して、次のコンポーネントとバージョンをデプロイします。

| コンポーネント | バージョン |
| --- | --- |
| Apache Doris | デフォルトは 2.1.5（変更可能） |
| Apache Paimon | 0.8 |
| Apache Flink | 1.18 |
| MinIO | RELEASE.2024-04-29T09-56-05Z |

### 02 環境のデプロイ

1. すべてのコンポーネントを起動します

	`bash ./start_all.sh`

2. 起動後、次のスクリプトを使用して Flink または Doris のコマンドラインにログインできます。

	```
	-- login flink
	bash ./start_flink_client.sh
	
	-- login doris
	bash ./start_doris_client.sh
	```

### 03 データの準備

Flink のコマンドラインにログインすると、作成済みのテーブルを確認できます。このテーブルにはデータがすでに格納されており、Flink SQL で参照できます。

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

### 04 データのクエリ

Doris クラスターには、以下のように `paimon` という名前の Catalog が作成されています（SHOW CATALOGS で確認できます）。この Catalog を作成する SQL 文は次のとおりです。

```
-- Already created, no need to run
CREATE CATALOG `paimon` PROPERTIES (
    "type" = "paimon",
    "warehouse" = "s3://warehouse/wh/",
    "s3.endpoint"="http://minio:9000",
    "s3.access_key"="admin",
    "s3.secret_key"="password",
    "s3.region"="us-east-1"
);
```

Doris から Paimon のデータをクエリできます。

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

Flink SQL を使用して Paimon テーブルのデータを更新できます。

```
Flink SQL> update customer set c_address='c_address_update' where c_nationkey = 1;
[INFO] Submitting SQL update statement to the cluster...
[INFO] SQL update statement has been successfully submitted to the cluster:
Job ID: ff838b7b778a94396b332b0d93c8f7ac
```

Flink SQL の実行が完了すると、Doris から最新のデータを直接確認できます。

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

Paimon 0.8 の TPCDS 1000 データセットを使用し、Primary Key Table Read Optimized 機能を有効にした Apache Doris 2.1.5 と Trino 422 で簡単なテストを実施しました。

![](/images/quick-start/lakehouse-paimon-benchmark.PNG)

テスト結果では、標準的な静的テストセットにおける Doris の平均クエリ性能は、Trino の 3～5 倍でした。今後は Deletion Vector を最適化し、実際のビジネスシナリオでのクエリ効率をさらに高めていきます。

## クエリの最適化

Apache Paimon 0.6 で Primary Key Table Read Optimized 機能が導入され、クエリエンジンは基準データの Parquet/ORC ファイルに直接アクセスできるようになりました。これにより、基準データの読み取り効率が大幅に向上します。マージされていない増分データ（INSERT、UPDATE、DELETE によって生成されたデータの増分）は、Merge-on-Read で読み取れます。さらに、Paimon 0.8 で導入された Deletion Vector 機能は、増分データを読み取る際のクエリエンジンの効率を一段と高めます。
Apache Doris は、ネイティブ Reader による Deletion Vector の読み取りと Merge on Read をサポートしています。以下では Doris の EXPLAIN 文を使用し、クエリで基準データと増分データを読み取る方法を示します。

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

Flink SQL で更新したテーブルには 4 つのシャードがあり、すべて Native Reader からアクセスできます（paimonNativeReadSplits=4/4）。また、最初のシャードの hasDeletionVector プロパティは true で、このシャードに対応する Deletion Vector が存在することを示しています。読み取り時には、この Deletion Vector に従ってデータがフィルタリングされます。
