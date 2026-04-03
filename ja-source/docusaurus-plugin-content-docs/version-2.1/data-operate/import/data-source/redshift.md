---
{
  "title": "Redshift",
  "language": "ja",
  "description": "Redshiftの移行プロセスにおいて、通常はオブジェクトストレージを中間メディアとして使用する必要があります。"
}
---
Redshiftの移行プロセスでは、通常、オブジェクトストレージを中間媒体として使用する必要があります。基本的なプロセスは以下の通りです：まず、RedshiftのUNLOAD文を使用してデータをオブジェクトストレージにエクスポートし、次にDorisのS3 Load機能を使用してオブジェクトストレージからデータを読み取り、Dorisにインポートします。詳細については、S3 Loadを参照してください。

## 注意事項

1. 移行前に、Redshiftのテーブル構造に応じてDorisのData Model、およびPartitioningとBucketingの戦略を選択する必要があります。その他のテーブル作成戦略については、Load Best Practicesを参照してください。
2. RedshiftがTime型のデータをエクスポートする場合、Varchar型にキャストしてからエクスポートする必要があります。


## データ型マッピング

| Redshift         | Doris          | コメント                 |
| ---------------- | -------------- | -------------------- |
| SMALLINT         | SMALLINT       |                      |
| INTEGER          | INT            |                      |
| BIGINT           | BIGINT         |                      |
| DECIMAL          | DECIMAL        |                      |
| REAL             | FLOAT          |                      |
| DOUBLE PRECISION | DOUBLE         |                      |
| BOOLEAN          | BOOLEAN        |                      |
| CHAR             | CHAR           |                      |
| VARCHAR          | VARCHAR/STRING | VARCHARの最大長は65535 |
| DATE             | DATE           |                      |
| TIMESTAMP        | DATETIME       |                      |
| TIME/TIMEZ       | STRING         |                      |
| SUPER            | VARIANT        |                      |
| OTHER            | UNSUPPORTED    |                      |

## 1. テーブル作成

RedshiftテーブルをDorisに移行するには、まずDorisテーブルを作成します。

Redshiftに以下のテーブルとデータがあると仮定します：

```SQL
CREATE TABLE sales_data (
    order_id      INTEGER,
    customer_name VARCHAR(128),
    order_date    DATE,
    amount        DECIMAL(10,2),
    country       VARCHAR(48)
)
DISTSTYLE AUTO

INSERT INTO sales_data VALUES
(1, 'Alice', '2025-04-08', 99.99, 'USA'),
(2, 'Bob', '2025-04-08', 149.50, 'Canada'),
(3, 'Charlie', '2025-04-09', 75.00, 'UK'),
(4, 'Diana', '2025-04-10', 200.00, 'Australia');
```
このテーブル構造に従って、Dorisプライマリキーパーティションテーブルを作成できます。パーティションフィールドはビジネスシナリオに応じて選択する必要があります。ここでは、パーティションフィールドは「order_date」で、日単位でパーティション化されています。

```sql
CREATE TABLE `sales_data` (
  order_id      INT,
  order_date    DATE NOT NULL,
  customer_name VARCHAR(128),
  amount        DECIMAL(10,2),
  country       VARCHAR(48)
) ENGINE=OLAP
UNIQUE KEY(`order_id`,`order_date`)
PARTITION BY RANGE(`order_date`) (
PARTITION p20250408 VALUES [('2025-04-08'), ('2025-04-09')),
PARTITION p20250409 VALUES [('2025-04-09'), ('2025-04-10')),
PARTITION p20250410 VALUES [('2025-04-10'), ('2025-04-11'))
)
DISTRIBUTED BY HASH(`order_id`) BUCKETS 16
PROPERTIES (
 "dynamic_partition.enable" = "true",
 "dynamic_partition.time_unit" = "DAY",
 "dynamic_partition.end" = "5",
 "dynamic_partition.prefix" = "p",
 "dynamic_partition.buckets" = "16",
 "replication_num" = "1"
);
```
## 2. Redshiftからのデータエクスポート

**2.1 UNLOADによるS3 Parquetファイルへのエクスポート**

S3にエクスポートする際は、**DorisのPartitionフィールド**に従ってエクスポートしてください。以下の通りです：

```sql
unload ('select * from sales_data')
to 's3://mybucket/redshift/sales_data/'
iam_role 'arn:aws:iam::0123456789012:role/MyRedshiftRole'
PARQUET
PARTITION BY (order_date) INCLUDE
```
**2.2 S3上のエクスポートファイルの確認**

エクスポートされたファイルは、S3上で**パーティション別のサブディレクトリ**に整理されます：

![redshift_out](/images/data-operate/redshift_out.png)

![redshift_out2](/images/data-operate/redshift_out2.png)

## 3. Dorisへのデータロード

S3 Loadは非同期のデータロード方式です。実行後、Dorisはデータソースからアクティブにデータを取得します。データソースはS3プロトコル互換のオブジェクトストレージをサポートしており、([AWS S3](./amazon-s3.md)、[GCS](./google-cloud-storage.md)、[AZURE](./azure-storage.md)など)が含まれます。

この方式は、大容量のデータでバックグラウンドでの非同期処理が必要なシナリオに適しています。同期的に処理する必要があるデータインポートについては、[TVF Load](./amazon-s3.md#load-with-tvf)を参照してください。

*注意：**複合型（Struct/Array/Map）を含むParquet/ORC形式のファイル**については、TVF Loadを使用する必要があります。*

**3.1 単一パーティションのロード**

```sql
LOAD LABEL sales_data_2025_04_08
(
    DATA INFILE("s3://mybucket/redshift/sales_data/order_date=2025-04-08/*")
    INTO TABLE sales_data
    FORMAT AS "parquet"
    (order_id, order_date, customer_name, amount, country)
)
WITH S3
(
    "provider" = "S3",
    "s3.endpoint" = "s3.ap-southeast-1.amazonaws.com",
    "s3.access_key" = "<ak>",
    "s3.secret_key"="<sk>",
    "s3.region" = "ap-southeast-1"
);
```
**3.2 SHOW LOADによる負荷状況の確認**

S3 Load importは非同期で送信されるため、SHOW LOADを使用して特定のラベルのステータスを確認できます：

```yaml
mysql> show load where label = "label_sales_data_2025_04_08"\G
*************************** 1. row ***************************
         JobId: 17956078
         Label: label_sales_data_2025_04_08
         State: FINISHED
      Progress: 100.00% (1/1)
          Type: BROKER
       EtlInfo: unselected.rows=0; dpp.abnorm.ALL=0; dpp.norm.ALL=2
      TaskInfo: cluster:s3.ap-southeast-1.amazonaws.com; timeout(s):3600; max_filter_ratio:0.0; priority:NORMAL
      ErrorMsg: NULL
    CreateTime: 2025-04-10 17:50:53
  EtlStartTime: 2025-04-10 17:50:54
 EtlFinishTime: 2025-04-10 17:50:54
 LoadStartTime: 2025-04-10 17:50:54
LoadFinishTime: 2025-04-10 17:50:54
           URL: NULL
    JobDetails: {"Unfinished backends":{"5eec1be8612d4872-91040ff1e7208a4f":[]},"ScannedRows":2,"TaskNumber":1,"LoadBytes":91,"All backends":{"5eec1be8612d4872-91040ff1e7208a4f":[10022]},"FileNumber":1,"FileSize":1620}
 TransactionId: 766228
  ErrorTablets: {}
          User: root
       Comment: 
1 row in set (0.00 sec)
```
**3.3 ロード エラーの処理**

複数のロードタスクがある場合、以下のステートメントを使用してデータロード失敗の日付と理由を照会できます。

```SQL
mysql> show load where state='CANCELLED' and label like "label_test%"\G
*************************** 1. row ***************************
         JobId: 18312384
         Label: label_test123
         State: CANCELLED
      Progress: 100.00% (3/3)
          Type: BROKER
       EtlInfo: unselected.rows=0; dpp.abnorm.ALL=4; dpp.norm.ALL=0
      TaskInfo: cluster:s3.ap-southeast-1.amazonaws.com; timeout(s):14400; max_filter_ratio:0.0; priority:NORMAL
      ErrorMsg: type:ETL_QUALITY_UNSATISFIED; msg:quality not good enough to cancel
    CreateTime: 2025-04-15 17:32:59
  EtlStartTime: 2025-04-15 17:33:02
 EtlFinishTime: 2025-04-15 17:33:02
 LoadStartTime: 2025-04-15 17:33:02
LoadFinishTime: 2025-04-15 17:33:02
           URL: http://10.16.10.6:28747/api/_load_error_log?file=__shard_2/error_log_insert_stmt_7602ccd7c3a4854-95307efca7bfe342_7602ccd7c3a4854_95307efca7bfe342
    JobDetails: {"Unfinished backends":{"7602ccd7c3a4854-95307efca7bfe341":[]},"ScannedRows":4,"TaskNumber":1,"LoadBytes":188,"All backends":{"7602ccd7c3a4854-95307efca7bfe341":[10022]},"FileNumber":3,"FileSize":4839}
 TransactionId: 769213
  ErrorTablets: {}
          User: root
       Comment: 
```
上記の例に示されているように、問題は**データ品質エラー**(ETL_QUALITY_UNSATISFIED)です。詳細なエラーを表示するには、結果で提供されたURLにアクセスする必要があります。例えば、データがテーブルスキーマのcountryカラムで定義された長さを超えていました:

```python
[root@VM-10-6-centos ~]$ curl "http://10.16.10.6:28747/api/_load_error_log?file=__shard_2/error_log_insert_stmt_7602ccd7c3a4854-95307efca7bfe342_7602ccd7c3a4854_95307efca7bfe342"
Reason: column_name[country], the length of input is too long than schema. first 32 bytes of input str: [USA] schema length: 1; actual length: 3; . src line []; 
Reason: column_name[country], the length of input is too long than schema. first 32 bytes of input str: [Canada] schema length: 1; actual length: 6; . src line []; 
Reason: column_name[country], the length of input is too long than schema. first 32 bytes of input str: [UK] schema length: 1; actual length: 2; . src line []; 
Reason: column_name[country], the length of input is too long than schema. first 32 bytes of input str: [Australia] schema length: 1; actual length: 9; . src line [];
```
データ品質エラーについて、エラーのあるレコードをスキップすることを許可したい場合は、S3 Loadタスクのプロパティセクションでフォルトトレランス率を設定できます。詳細については、[Import Configuration Parameters](../../import/import-way/broker-load-manual.md#related-configurations)を参照してください。

**3.4 複数パーティションのデータロード**

大量の履歴データを移行する場合は、バッチロード戦略を使用することをお勧めします。各バッチはDorisの1つまたは数個のパーティションに対応します。システム負荷を軽減し、ロード失敗時の再試行コストを下げるために、バッチあたりのデータサイズを100GB未満に抑えることをお勧めします。

スクリプト[s3_load_demo.sh](https://github.com/apache/doris/blob/master/samples/load/shell/s3_load_demo.sh)を参照できます。これはS3上のパーティションディレクトリをポーリングし、S3 LoadタスクをDorisに送信してバッチロードを実現できます。
