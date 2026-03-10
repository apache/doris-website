---
{
  "title": "Snowflake",
  "language": "ja",
  "description": "SnowflakeからDorisへの移行において、オブジェクトストレージが通常中間媒体として使用されます。コアプロセスは以下の通りです：まず、"
}
---
SnowflakeからDorisへの移行時には、オブジェクトストレージが中間媒体として一般的に使用されます。主要なプロセスは次の通りです。まず、Snowflakeの [COPY INTO](https://docs.snowflake.com/en/user-guide/data-unload-overview) 文を使用してオブジェクトストレージにデータをエクスポートします。次に、DorisのS3 Load機能を使用してオブジェクトストレージからデータを読み込み、Dorisにロードします。詳細については、[S3 Load](./amazon-s3.md) を参照してください。


## 考慮事項

移行前に、Snowflakeのテーブル構造に基づいて、Dorisの[データモデル](../../../table-design/data-model/overview.md)、[パーティショニング](../../../table-design/data-partitioning/dynamic-partitioning.md)、[バケット](../../../table-design/data-partitioning/data-bucketing.md)戦略を選択してください。より多くのテーブル作成戦略については、[Load Best Practices](../load-best-practices.md) を参照してください。

## データタイプマッピング

| Snowflake                                        | Doris          | Comment                                            |
| ------------------------------------------------ | -------------- | -------------------------------------------------- |
| NUMBER(p, s)/DECIMAL(p, s)/NUMERIC(p,s)          | DECIMAL(p, s)  |                                                    |
| INT/INTEGER                                      | INT            |                                                    |
| TINYINT/BYTEINT                                  | TINYINT        |                                                    |
| SMALLINT                                         | SMALLINT       |                                                    |
| BIGINT                                           | BIGINT         |                                                    |
| FLOAT/FLOAT4/FLOAT8/DOUBLE/DOUBLE PRECISION/REAL | DOUBLE         |                                                    |
| VARCHAR/STRING/TEXT                              | VARCHAR/STRING | VARCHAR maximum length is 65535                    |
| CHAR/CHARACTER/NCHAR                             | CHAR           |                                                    |
| BINARY/VARBINARY                                 | STRING         |                                                    |
| BOOLEAN                                          | BOOLEAN        |                                                    |
| DATE                                             | DATE           |                                                    |
| DATETIME/TIMESTAMP/TIMESTAMP_NTZ                 | DATETIME       | TIMESTAMP is a configurable alias (default: TIMESTAMP_NTZ) |
| TIME                                             | STRING         | Cast to String when exporting from Snowflake                |
| VARIANT                                          | VARIANT        |                                                    |
| ARRAY                                            | ARRAY<T>       |                                                    |
| OBJECT                                           | JSON           |                                                    |
| GEOGRAPHY/GEOMETRY                               | STRING         |                                                    |

## 1. テーブル作成

SnowflakeテーブルをDorisに移行するには、まずDorisテーブルを作成します。

Snowflakeに以下のテーブルとデータがあると仮定します：

```sql
CREATE OR REPLACE TABLE sales_data (
    order_id      INT PRIMARY KEY,
    customer_name VARCHAR(128),
    order_date    DATE,
    amount        DECIMAL(10,2),
    country       VARCHAR(48)
) 
CLUSTER BY (order_date);

INSERT INTO sales_data VALUES
(1, 'Alice', '2025-04-08', 99.99, 'USA'),
(2, 'Bob', '2025-04-08', 149.50, 'Canada'),
(3, 'Charlie', '2025-04-09', 75.00, 'UK'),
(4, 'Diana', '2025-04-10', 200.00, 'Australia');
```
この構造に基づいて、Snowflakeのclustering keyに合わせたDoris Primary Keyパーティションテーブルを、日別にパーティション分割して作成してください：

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
## 2. Snowflakeからデータをエクスポート

2.1. **COPY INTOを使用したS3 Parquetファイルへのエクスポート**

   Snowflakeは[AWS S3](https://docs.snowflake.com/en/user-guide/data-unload-s3)、[GCS](https://docs.snowflake.com/en/user-guide/data-unload-gcs)、[AZURE](https://docs.snowflake.com/en/user-guide/data-unload-azure)へのエクスポートをサポートしています。**Dorisのパーティションフィールドでパーティション化されたデータをエクスポートします**。AWS S3の例：

    ```sql
    CREATE FILE FORMAT my_parquet_format TYPE = parquet;

    CREATE OR REPLACE STAGE external_stage
    URL='s3://mybucket/sales_data'
    CREDENTIALS=(AWS_KEY_ID='<ak>' AWS_SECRET_KEY='<sk>')
    FILE_FORMAT = my_parquet_format;

    COPY INTO @external_stage from sales_data PARTITION BY (CAST(order_date AS VARCHAR)) header=true;
    ```
2.2. **S3上のエクスポートされたファイルの確認**

   エクスポートされたファイルは、S3上で**パーティション別のサブディレクトリ**に整理されます：

    ![snowflake_s3_out_en](/images/data-operate/snowflake_s3_out_en.png)

    ![snowflake_s3_out2_en](/images/data-operate/snowflake_s3_out2_en.png)

## 3. Dorisへのデータロード

S3 Loadは非同期データロード方式です。実行後、Dorisはデータソースからアクティブにデータを取得します。データソースはS3プロトコルに対応したオブジェクトストレージをサポートしており、これには（[AWS S3](./amazon-s3.md)、[GCS](./google-cloud-storage.md)、[AZURE](./azure-storage.md)など）が含まれます

この方式は、バックグラウンドでの非同期処理が必要な大容量データを扱うシナリオに適しています。同期的に処理する必要があるデータインポートについては、[TVF Load](./amazon-s3.md#load-with-tvf)を参照してください。

*注意：**複合型（Struct/Array/Map）を含むParquet/ORC形式のファイル**の場合、TVF Loadを使用する必要があります。*

3.1. **単一パーティションのロード**

   ```sql
   LOAD LABEL sales_data_2025_04_08
   (
       DATA INFILE("s3://mybucket/sales_data/2025_04_08/*")
       INTO TABLE sales_data
       FORMAT AS "parquet"
       (order_id, order_date, customer_name, amount, country)
   )
   WITH S3
   (
       "provider" = "S3",
       "s3.endpoint" = "s3.ap-southeast-1.amazonaws.com",
       "s3.access_key" = "<ak>",
       "s3.secret_key" = "<sk>",
       "s3.region" = "ap-southeast-1"
   );
   ```
3.2. **SHOW LOADによる読み込みステータスの確認**

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
3.3. **ロードエラーの処理**

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
上記の例で示されているように、この問題は**データ品質エラー**(ETL_QUALITY_UNSATISFIED)です。詳細なエラーを確認するには、結果に提供されたURLにアクセスする必要があります。例えば、データがテーブルスキーマのcountry列で定義された長さを超えた場合：

   ```python
   [root@VM-10-6-centos ~]$ curl "http://10.16.10.6:28747/api/_load_error_log?file=__shard_2/error_log_insert_stmt_7602ccd7c3a4854-95307efca7bfe342_7602ccd7c3a4854_95307efca7bfe342"
   Reason: column_name[country], the length of input is too long than schema. first 32 bytes of input str: [USA] schema length: 1; actual length: 3; . src line []; 
   Reason: column_name[country], the length of input is too long than schema. first 32 bytes of input str: [Canada] schema length: 1; actual length: 6; . src line []; 
   Reason: column_name[country], the length of input is too long than schema. first 32 bytes of input str: [UK] schema length: 1; actual length: 2; . src line []; 
   Reason: column_name[country], the length of input is too long than schema. first 32 bytes of input str: [Australia] schema length: 1; actual length: 9; . src line [];
   ```
データ品質エラーについては、エラーレコードのスキップを許可したい場合、S3 Loadタスクのプロパティセクションで障害許容率を設定できます。詳細については、[Import Configuration Parameters](../../import/import-way/broker-load-manual.md#related-configurations)を参照してください。

3.4. **複数パーティションのデータロード**

   大容量の履歴データを移行する場合、バッチロード戦略の使用を推奨します。各バッチはDorisの1つまたは少数のパーティションに対応します。システム負荷を軽減し、ロード失敗時の再試行コストを削減するため、バッチあたりのデータサイズは100GB未満に保つことを推奨します。

   スクリプト[s3_load_demo.sh](https://github.com/apache/doris/blob/master/samples/load/shell/s3_load_demo.sh)を参照できます。これはS3上のパーティションディレクトリをポーリングし、DorisにS3 Loadタスクを送信してバッチロードを実現できます。
