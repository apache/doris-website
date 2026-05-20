---
{
  "title": "BigQuery",
  "language": "ja",
  "description": "BigQueryの移行プロセスでは、通常、オブジェクトストレージを中間媒体として使用する必要があります。"
}
---
BigQueryの移行プロセスでは、通常オブジェクトストレージを中間媒体として使用する必要があります。コアプロセスは以下の通りです：まず、BigQueryの[Export](https://cloud.google.com/bigquery/docs/exporting-data)ステートメントを使用してデータをGCS (Google Cloud Storage)にエクスポートし、次にDorisのS3 Load機能を使用してオブジェクトストレージからデータを読み取り、Dorisにロードします。詳細については、[S3 Load](./amazon-s3.md)を参照してください。


## 注意事項

1. 移行前に、BigQueryのテーブル構造に応じてDorisの[Data Model](../../../table-design/data-model/overview.md)、および[Partitioning](../../../table-design/data-partitioning/dynamic-partitioning.md)と[Bucketing](../../../table-design/data-partitioning/data-bucketing.md)の戦略を選択する必要があります。その他のテーブル作成戦略については、[Load Best Practices](../load-best-practices.md)を参照してください。
2. BigQueryでJSON型のデータをエクスポートする場合、Parquet形式でのエクスポートはサポートされていません。代わりにJSON形式でエクスポートできます。
3. BigQueryでTime型のデータをエクスポートする場合、String型にキャストしてからエクスポートする必要があります。

## データ型マッピング

| BigQuery           | Doris          | コメント                 |
| ------------------ | -------------- | -------------------- |
| Array              | Array          |                      |
| BOOLEAN            | BOOLEAN        |                      |
| DATE               | DATE           |                      |
| DATETIME/TIMESTAMP | DATETIME       |                      |
| JSON               | JSON           |                      |
| INT64              | BIGINT         |                      |
| NUMERIC            | DECIMAL        |                      |
| FLOAT64            | DOUBLE         |                      |
| STRING             | VARCHAR/STRING | VARCHARの最大長は65535 |
| STRUCT             | STRUCT         |                      |
| TIME               | STRING         |                      |
| OTHER              | UNSUPPORTED    |                      |

## 1. テーブル作成

BigQueryのテーブルをDorisに移行する際は、まずDorisのテーブルを作成する必要があります。

BigQueryに以下のテーブルとデータがすでに存在するとします。

```SQL
CREATE OR REPLACE TABLE test.sales_data (
    order_id      INT64,
    customer_name STRING,
    order_date    DATE,
    amount        NUMERIC(10,2),
    country       STRING
)
PARTITION BY  order_date


INSERT INTO test.sales_data (order_id, customer_name, order_date, amount, country) VALUES
(1, 'Alice', '2025-04-08', 99.99, 'USA'),
(2, 'Bob', '2025-04-08', 149.50, 'Canada'),
(3, 'Charlie', '2025-04-09', 75.00, 'UK'),
(4, 'Diana', '2025-04-10', 200.00, 'Australia');
```
このテーブル構造に従って、Doris主キーパーティションテーブルを作成できます。パーティションフィールドはBigQueryのものと同じである必要があり、テーブルは日次ベースでパーティション化される必要があります。

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
## 2. BigQueryデータのエクスポート

2.1. **Exportメソッドを通じてGCS Parquet形式ファイルにエクスポート**

   ```sql
   EXPORT DATA
     OPTIONS (
       uri = 'gs://mybucket/export/sales_data/*.parquet',
       format = 'PARQUET')
   AS (
     SELECT *
     FROM test.sales_data 
   );
   ```
2.2. **GCS上のエクスポートファイルを表示する**

   上記のコマンドにより、sales_dataのデータがGCSにエクスポートされ、各パーティションは増分ファイル名を持つ1つ以上のファイルを生成します。詳細については、[exporting-data](https://cloud.google.com/bigquery/docs/exporting-data#exporting_data_into_one_or_more_files)を参照してください。以下の通りです：

   ![gcs_export](/images/data-operate/gcs_export.png)


## 3. Dorisへのデータロード

S3 Loadは非同期データロード方式です。実行後、Dorisは能動的にデータソースからデータを取得します。データソースは、S3プロトコルと互換性のあるオブジェクトストレージをサポートしており、これには（[AWS S3](./amazon-s3.md)，[GCS](./google-cloud-storage.md)，[AZURE](./azure-storage.md)，など）が含まれます。

この方式は、バックグラウンドでの非同期処理を必要とする大容量データのシナリオに適しています。同期的に処理する必要があるデータインポートについては、[TVF Load](./amazon-s3.md#load-with-tvf)を参照してください。

*注意：**複合型（Struct/Array/Map）を含むParquet/ORC形式ファイル**の場合、TVF Loadを使用する必要があります。*

3.1. **単一ファイルからのデータロード**

   ```sql
   LOAD LABEL sales_data_2025_04_08
   (
       DATA INFILE("s3://mybucket/export/sales_data/000000000000.parquet")
       INTO TABLE sales_data
       FORMAT AS "parquet"
       (order_id, order_date, customer_name, amount, country)
   )
   WITH S3
   (
       "provider" = "GCP",
       "s3.endpoint" = "storage.asia-southeast1.rep.googleapis.com",  
       "s3.region" = "asia-southeast1",
       "s3.access_key" = "<ak>",
       "s3.secret_key" = "<sk>"
   );
   ```
3.2. **SHOW LOADによる読み込みステータスの確認**

   S3 Load インポートは非同期で送信されるため、SHOW LOADを使用して特定のラベルのステータスを確認できます：

   ```yaml
   mysql> show load where label = "label_sales_data_2025_04_08"\G
   *************************** 1. row ***************************
           JobId: 17956078
           Label: label_sales_data_2025_04_08
           State: FINISHED
         Progress: 100.00% (1/1)
             Type: BROKER
         EtlInfo: unselected.rows=0; dpp.abnorm.ALL=0; dpp.norm.ALL=2
         TaskInfo: cluster:storage.asia-southeast1.rep.googleapis.com; timeout(s):3600; max_filter_ratio:0.0; priority:NORMAL
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
3.3. **ロード エラーの処理**

複数のロードタスクがある場合、以下のステートメントを使用してデータロードの失敗の日時と理由を照会できます。

   ```yaml
   mysql> show load where state='CANCELLED' and label like "label_test%"\G
   *************************** 1. row ***************************
           JobId: 18312384
           Label: label_test123
           State: CANCELLED
         Progress: 100.00% (3/3)
             Type: BROKER
         EtlInfo: unselected.rows=0; dpp.abnorm.ALL=4; dpp.norm.ALL=0
         TaskInfo: cluster:storage.asia-southeast1.rep.googleapis.com; timeout(s):14400; max_filter_ratio:0.0; priority:NORMAL
         ErrorMsg: type:ETL_QUALITY_UNSATISFIED; msg:quality not good enough to cancel
       CreateTime: 2025-04-15 17:32:59
     EtlStartTime: 2025-04-15 17:33:02
   EtlFinishTime: 2025-04-15 17:33:02
   LoadStartTime: 2025-04-15 17:33:02
   LoadFinishTime: 2025-04-15 17:33:02
             URL: http://10.16.10.6:28747/api/_load_error_log?file=__shard_2 error_log_insert_stmt_7602ccd7c3a4854-95307efca7bfe342_7602ccd7c3a4854_95307efca7bfe342
       JobDetails: {"Unfinished backends":{"7602ccd7c3a4854-95307efca7bfe341":[]},"ScannedRows":4,"TaskNumber":1,"LoadBytes":188,"All backends":{"7602ccd7c3a4854-95307efca7bfe341":[10022]},"FileNumber":3,"FileSize":4839}
   TransactionId: 769213
     ErrorTablets: {}
             User: root
         Comment: 
   ```
上記の例に示すように、この問題は**データ品質エラー**(ETL_QUALITY_UNSATISFIED)です。詳細なエラーを確認するには、結果に提供されたURLにアクセスする必要があります。例えば、データがテーブルスキーマのcountry列で定義された長さを超えた場合などです：

   ```python
   [root@VM-10-6-centos ~]$ curl "http://10.16.10.6:28747/api/_load_error_log?file=__shard_2/error_log_insert_stmt_7602ccd7c3a4854-95307efca7bfe342_7602ccd7c3a4854_95307efca7bfe342"
   Reason: column_name[country], the length of input is too long than schema. first 32 bytes of input str: [USA] schema length: 1; actual length: 3; . src line []; 
   Reason: column_name[country], the length of input is too long than schema. first 32 bytes of input str: [Canada] schema length: 1; actual length: 6; . src line []; 
   Reason: column_name[country], the length of input is too long than schema. first 32 bytes of input str: [UK] schema length: 1; actual length: 2; . src line []; 
   Reason: column_name[country], the length of input is too long than schema. first 32 bytes of input str: [Australia] schema length: 1; actual length: 9; . src line [];
   ```
データ品質エラーについて、エラーのあるレコードのスキップを許可したい場合は、S3 Loadタスクの Properties セクションで障害許容率を設定できます。詳細については、[Load Configuration Parameters](../../import/import-way/broker-load-manual.md#related-configurations)を参照してください。

3.4. **複数ファイルからのデータロード**

   大量の履歴データを移行する際は、バッチロード戦略の使用を推奨します。各バッチはDorisの1つまたは少数のパーティションに対応します。システム負荷を軽減し、ロード失敗時の再試行コストを下げるため、バッチあたりのデータサイズは100GB未満に保つことを推奨します。

   スクリプト[s3_load_file_demo.sh](https://github.com/apache/doris/blob/master/samples/load/shell/s3_load_file_demo.sh)を参照できます。このスクリプトは、オブジェクトストレージの指定ディレクトリ下のファイルリストを分割し、複数のS3 Loadタスクをバッチ単位でDorisに投入して、バッチロードの効果を実現できます。
