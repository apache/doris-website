---
{
  "title": "Paimon カタログ",
  "description": "Dorisは現在、様々なメタデータサービスを通じてPaimonTableメタデータへのアクセスと、Paimonデータのクエリをサポートしています。",
  "language": "ja"
}
---
# Paimon カタログ

Dorisは現在、様々なメタデータサービスを通じてPaimonTableメタデータへのアクセスと、Paimonデータのクエリをサポートしています。

現在、PaimonTableでは読み取り操作のみがサポートされています。PaimonTableへの書き込み操作は今後サポートされる予定です。

[Apache DorisとApache Paimonのクイックスタート](../best-practices/doris-paimon.md)

## 適用シナリオ

| シナリオ | 説明 |
| ------------ | ------------------------------------------------------------ |
| クエリ高速化 | Dorisの分散コンピューティングエンジンを使用してPaimonデータに直接アクセスし、クエリを高速化します。 |
| データ統合 | Paimonデータを読み取ってDoris内部tableに書き込むか、Dorisコンピューティングエンジンを使用してZeroETL操作を実行します。 |
| データ書き戻し | まだサポートされていません。 |

## カタログの設定

### 構文

```sql
CREATE CATALOG [IF NOT EXISTS] catalog_name PROPERTIES (
    'type' = 'paimon',
    'paimon.catalog.type' = '<paimon_catalog_type>',
    'warehouse' = '<paimon_warehouse>'
    {MetaStoreProperties},
    {StorageProperties},
    {CommonProperties}
);
```
* `<paimon_catalog_type>`

  Paimon Catalogのタイプで、以下をサポートします：

  * `filesystem`: デフォルト。ファイルシステムに保存されたメタデータに直接アクセスします。

  * `hms`: Hive Metastoreをメタデータサービスとして使用します。

  * `dlf`: Alibaba Cloud DLFをメタデータサービスとして使用します。

* `<paimon_warehouse>`

  Paimonのwarehouseパスです。`<paimon_catalog_type>`が`filesystem`の場合、このパラメータを指定する必要があります。

  `warehouse`パスは`Database`パスの一つ上のレベルを指している必要があります。例えば、Tableパスが`s3://bucket/path/to/db1/table1`の場合、`warehouse`は`s3://bucket/path/to/`にする必要があります。

* `{MetaStoreProperties}`

  MetaStorePropertiesセクションは、Metastoreメタデータサービスの接続と認証情報を入力するために使用されます。詳細は[Supported Metadata Services]セクションを参照してください。

* `{StorageProperties}`

  StoragePropertiesセクションは、ストレージシステムに関連する接続と認証情報を入力するために使用されます。詳細は[Supported Storage システム]セクションを参照してください。

* `{CommonProperties}`

  CommonPropertiesセクションは、共通のプロパティを入力するために使用されます。[Common Properties]については、[カタログ 概要](../catalog-overview.md)セクションを参照してください。
  
### サポートされるPaimonバージョン

現在依存しているPaimonバージョンは1.0.0です。

### サポートされるPaimonフォーマット

* Paimon Deletion Vectorの読み取りをサポート

### サポートされるメタデータサービス

* [Hive Metastore](../metastores/hive-metastore.md)

* [Aliyun DLF](../metastores/aliyun-dlf.md)

* [FileSystem](../metastores/filesystem.md)

### サポートされるストレージシステム

* [HDFS](../storages/hdfs.md)

* [AWS S3](../storages/s3.md)

* Google Cloud Storage

* [Alibaba Cloud OSS](../storages/aliyun-oss.md)

* [Tencent Cloud COS](../storages/tencent-cos.md)

* [Huawei Cloud OBS](../storages/huawei-obs.md)

* [MINIO](../storages/minio.md)

### サポートされるデータフォーマット

* [Parquet](../file-formats/parquet.md)

* [ORC](../file-formats/orc.md)

## カラム型マッピング

| Paimon タイプ                        | Doris タイプ    | Comment                                                                 |
| ---------------------------------- | ------------- | ----------------------------------------------------------------------- |
| boolean                            | boolean       |                                                                         |
| tinyint                            | tinyint       |                                                                         |
| smallint                           | smallint      |                                                                         |
| integer                            | int           |                                                                         |
| bigint                             | bigint        |                                                                         |
| float                              | float         |                                                                         |
| double                             | double        |                                                                         |
| decimal(P, S)                      | decimal(P, S) |                                                                         |
| varchar                            | string        |                                                                         |
| char                               | string        |                                                                         |
| binary                             | string        |                                                                         |
| varbinary                          | string        |                                                                         |
| date                               | date          |                                                                         |
| timestamp\_without\_time\_zone     | datetime(N)   | 精度に応じてマッピングされます。精度が6より大きい場合、最大6にマッピングされます（精度が失われる可能性があります）。 |
| timestamp\_with\_local\_time\_zone | datetime(N)   | 精度に応じてマッピングされます。精度が6より大きい場合、最大6にマッピングされます（精度が失われる可能性があります）。 |
| array                              | array         |                                                                         |
| map                                | map           |                                                                         |
| row                                | struct        |                                                                         |
| other                              | UNSUPPORTED   |                                                                         |

## 例

### HDFS上のPaimon

```sql
CREATE CATALOG paimon_hdfs PROPERTIES (
    'type' = 'paimon',
    'warehouse' = 'hdfs://HDFS8000871/user/paimon',
    'dfs.nameservices' = 'HDFS8000871',
    'dfs.ha.namenodes.HDFS8000871' = 'nn1,nn2',
    'dfs.namenode.rpc-address.HDFS8000871.nn1' = '172.21.0.1:4007',
    'dfs.namenode.rpc-address.HDFS8000871.nn2' = '172.21.0.2:4007',
    'dfs.client.failover.proxy.provider.HDFS8000871' = 'org.apache.hadoop.hdfs.server.namenode.ha.ConfiguredFailoverProxyProvider',
    'hadoop.username' = 'hadoop'
);
```
### HMS上のPaimon

```sql
CREATE CATALOG paimon_hms PROPERTIES (
    'type' = 'paimon',
    'paimon.catalog.type' = 'hms',
    'warehouse' = 'hdfs://HDFS8000871/user/zhangdong/paimon2',
    'hive.metastore.uris' = 'thrift://172.21.0.44:7004',
    'dfs.nameservices' = 'HDFS8000871',
    'dfs.ha.namenodes.HDFS8000871' = 'nn1,nn2',
    'dfs.namenode.rpc-address.HDFS8000871.nn1' = '172.21.0.1:4007',
    'dfs.namenode.rpc-address.HDFS8000871.nn2' = '172.21.0.2:4007',
    'dfs.client.failover.proxy.provider.HDFS8000871' = 'org.apache.hadoop.hdfs.server.namenode.ha.ConfiguredFailoverProxyProvider',
    'hadoop.username' = 'hadoop'
);
```
### DLF上のPaimon

```sql
CREATE CATALOG paimon_dlf PROPERTIES (
    'type' = 'paimon',
    'paimon.catalog.type' = 'dlf',
    'warehouse' = 'oss://xx/yy/',
    'dlf.proxy.mode' = 'DLF_ONLY',
    'dlf.uid' = 'xxxxx',
    'dlf.region' = 'cn-beijing',
    'dlf.access_key' = 'ak',
    'dlf.secret_key' = 'sk'
);
```
### Google Dataproc Metastore上のPaimon

```sql
CREATE CATALOG `paimon_gms` PROPERTIES (
    "type" = "paimon",
    "paimon.catalog.type" = "hms",
    "hive.metastore.uris" = "thrift://ip:port",
    "warehouse" = "gs://bucket/warehouse",
    "s3.access_key" = "ak",
    "s3.secret_key" = "sk",
    "s3.region" = "region",
    "s3.endpoint" = "storage.googleapis.com"
);
```
### Google Cloud Storage 上の Paimon

```sql
CREATE CATALOG `paimon_gcs` PROPERTIES (
    "type" = "paimon",
    "warehouse" = "gs://bucket/warehouse",
    "s3.access_key" = "ak",
    "s3.secret_key" = "sk",
    "s3.region" = "region",
    "s3.endpoint" = "storage.googleapis.com"
);
```
## Query 運用

### Basic Query

Catalogが設定されると、以下のようにCatalog内のTableデータをクエリできます：

```sql
-- 1. Switch to catalog, use database, and query
SWITCH paimon_ctl;
USE paimon_db;
SELECT * FROM paimon_tbl LIMIT 10;

-- 2. Use Paimon database directly
USE paimon_ctl.paimon_db;
SELECT * FROM paimon_tbl LIMIT 10;

-- 3. Use fully qualified name to query
SELECT * FROM paimon_ctl.paimon_db.paimon_tbl LIMIT 10;
```
### Batch Incremental Query

> この機能はバージョン3.1.0以降でサポートされています

Flinkと同様に、PaimonのBatch Incrementalクエリをサポートしています。

指定されたスナップショットまたはタイムスタンプの間隔内における増分データのクエリをサポートしています。間隔は左閉右開です。

```sql
-- read from snapshot 2
SELECT * FROM paimon_table@incr('startSnapshotId'='2');

-- between snapshots [0, 5)
SELECT * FROM paimon_table@incr('startSnapshotId'='0', 'endSnapshotId'='5');

-- between snapshots [0, 5) with specified scan mode
SELECT * FROM paimon_table@incr('startSnapshotId'='0', 'endSnapshotId'='5', 'incrementalBetweenScanMode'='diff');

-- read from start timestamp
SELECT * FROM paimon_table@incr('startTimestamp'='1750844949');

-- read between timestamp
SELECT * FROM paimon_table@incr('startTimestamp'='1750844949', 'endTimestamp'='1750944949');
```
パラメータ:

| Parameter | デスクリプション | Example |
| --- | --- | -- |
| `startSnapshotId` | 開始スナップショットID、0より大きい値である必要があります | `'startSnapshotId'='3'` |
| `endSnapshotId` | 終了スナップショットID、`startSnapshotId`より大きい値である必要があります。オプション、指定されていない場合は`startSnapshotId`から最新のスナップショットまで読み取ります | `'endSnapshotId'='10'` |
| `incrementalBetweenScanMode` | インクリメンタル読み取りモードを指定します、デフォルトは`auto`、`delta`、`changelog`、`diff`をサポートします |  `'incrementalBetweenScanMode'='delta'` |
| `startTimestamp` | 開始スナップショットタイムスタンプ、0以上である必要があります | `'startTimestamp'='1750844949'` |
| `endTimestamp` | 終了スナップショットタイムスタンプ、`startTimestamp`より大きい値である必要があります。オプション、指定されていない場合は`startTimestamp`から最新のスナップショットまで読み取ります | `'endTimestamp'='1750944949'` |

> 注意:

> - `startSnapshotId`と`endSnapshotId`はPaimonパラメータ`'incremental-between'='3,10'`を構成します

> - `startTimestamp`と`endTimestamp`はPaimonパラメータ`'incremental-between-timestamp'='1750844949,1750944949'`を構成します

> - `incrementalBetweenScanMode`はPaimonパラメータ`incremental-between-scan-mode`に対応します。

これらのパラメータの詳細については、[Paimonドキュメント](https://paimon.apache.org/docs/master/maintenance/configurations/)を参照してください。


## システムTable

> この機能はバージョン3.1.0以降でサポートされています

DorisはPaimonシステムTableのクエリをサポートし、Table関連のメタデータを取得できます。システムTableは、スナップショット履歴、マニフェストファイル、データファイル、パーティション、その他の情報を表示するために使用できます。

PaimonTableのメタデータにアクセスするには、Table名の後に`$`記号を追加し、その後にシステムTable名を続けます:

```sql
SELECT * FROM my_table$system_table_name;
```
> 注意: DorisはPaimonのグローバルシステムTableの読み取りをサポートしておらず、これらはFlinkでのみサポートされています。

### schemas

Tableの現在および履歴のスキーマ情報を表示します。`ALTER TABLE`、`CREATE TABLE AS`、または`CREATE DATABASE AS`文を使用してTableスキーマを変更する際、各変更によりschemasTableにレコードが生成されます：

```sql
SELECT * FROM my_table$schemas;
```
結果:

```text
+-----------+--------------------------------------------------------------------------------------------------------------------+----------------+--------------+---------+---------+-------------------------+
| schema_id | fields                                                                                                             | partition_keys | primary_keys | options | comment | update_time             |
+-----------+--------------------------------------------------------------------------------------------------------------------+----------------+--------------+---------+---------+-------------------------+
|         0 | [{"id":0,"name":"k","type":"INT NOT NULL"},{"id":1,"name":"f0","type":"INT"},{"id":2,"name":"f1","type":"STRING"}] | []             | ["k"]        | {}      |         | 2025-03-04 22:48:41.666 |
+-----------+--------------------------------------------------------------------------------------------------------------------+----------------+--------------+---------+---------+-------------------------+
```
### snapshots

Tableの全ての有効なスナップショット情報を表示します。スナップショット作成時刻、コミットユーザー、操作タイプなどが含まれます：

```sql
SELECT * FROM my_table$snapshots;
```
結果:

```text
+-------------+-----------+--------------------------------------+---------------------+-------------+-------------------------+------------------------------------------------------+------------------------------------------------------+-------------------------+--------------------+--------------------+------------------------+----------------------+
| snapshot_id | schema_id | commit_user                          | commit_identifier   | commit_kind | commit_time             | base_manifest_list                                   | delta_manifest_list                                  | changelog_manifest_list | total_record_count | delta_record_count | changelog_record_count | watermark            |
+-------------+-----------+--------------------------------------+---------------------+-------------+-------------------------+------------------------------------------------------+------------------------------------------------------+-------------------------+--------------------+--------------------+------------------------+----------------------+
|           1 |         0 | d7ea4996-92c7-469f-b9ff-c76525954f1c | 9223372036854775807 | APPEND      | 2025-03-04 22:48:45.575 | manifest-list-dc5490ba-420c-445a-b6f7-6962d394935c-0 | manifest-list-dc5490ba-420c-445a-b6f7-6962d394935c-1 | NULL                    |                  1 |                  1 |                      0 | -9223372036854775808 |
|           2 |         0 | 34de47f6-31d1-4f06-b378-c85ef4fbca41 | 9223372036854775807 | APPEND      | 2025-07-01 23:11:35.406 | manifest-list-dca6aa5b-6fc6-4b4f-ac22-acfa15bbf171-0 | manifest-list-dca6aa5b-6fc6-4b4f-ac22-acfa15bbf171-1 | NULL                    |                  2 |                  1 |                      0 | -9223372036854775808 |
|           3 |         0 | 89f67183-a1f8-4ee9-b73c-3f7e992b79a7 | 9223372036854775807 | APPEND      | 2025-07-01 23:11:45.114 | manifest-list-6d624d1b-c774-4d95-905e-8258a7b89ecb-0 | manifest-list-6d624d1b-c774-4d95-905e-8258a7b89ecb-1 | NULL                    |                  3 |                  1 |                      0 | -9223372036854775808 |
|           4 |         0 | 31924a7c-1389-490c-adf1-3bb805b33cd7 | 9223372036854775807 | APPEND      | 2025-07-01 23:12:42.042 | manifest-list-09097a51-afde-485e-929b-d2cc39eb6eb2-0 | manifest-list-09097a51-afde-485e-929b-d2cc39eb6eb2-1 | NULL                    |                  5 |                  2 |                      0 | -9223372036854775808 |
|           5 |         0 | 1e90a80b-41cb-4242-b97c-889728f76810 | 9223372036854775807 | APPEND      | 2025-07-01 23:14:26.445 | manifest-list-b8471969-9c4d-41cd-b790-64f6efb2d142-0 | manifest-list-b8471969-9c4d-41cd-b790-64f6efb2d142-1 | NULL                    |                  6 |                  1 |                      0 | -9223372036854775808 |
|           6 |         0 | 1e90a80b-41cb-4242-b97c-889728f76810 | 9223372036854775807 | COMPACT     | 2025-07-01 23:14:29.317 | manifest-list-b8471969-9c4d-41cd-b790-64f6efb2d142-2 | manifest-list-b8471969-9c4d-41cd-b790-64f6efb2d142-3 | NULL                    |                  5 |                 -1 |                      0 | -9223372036854775808 |
+-------------+-----------+--------------------------------------+---------------------+-------------+-------------------------+------------------------------------------------------+------------------------------------------------------+-------------------------+--------------------+--------------------+------------------------+----------------------+
```
### options

Tableの現在の設定オプションを表示します。TableオプションがTableに含まれていない場合、そのオプションはデフォルト値に設定されています：

```sql
SELECT * FROM my_table$options;
```
結果:

```text
+------------------------+--------------------+
|         key            |        value       |
+------------------------+--------------------+
| snapshot.time-retained |         5 h        |
+------------------------+--------------------+
```
### files

現在のスナップショットによって参照されているすべてのデータファイルの情報を表示します。ファイル形式、レコード数、ファイルサイズなどが含まれます：

```sql
SELECT * FROM my_table$files;
```
結果:

```text
mysql> SELECT * FROM my_table$files;
+-----------+--------+------------------------------------------------------------------------------------------------------------------------+-------------+-----------+-------+--------------+--------------------+---------+---------+-------------------+---------------------+---------------------+---------------------+---------------------+-------------------------+-------------+
| partition | bucket | file_path                                                                                                              | file_format | schema_id | level | record_count | file_size_in_bytes | min_key | max_key | null_value_counts | min_value_stats     | max_value_stats     | min_sequence_number | max_sequence_number | creation_time           | file_source |
+-----------+--------+------------------------------------------------------------------------------------------------------------------------+-------------+-----------+-------+--------------+--------------------+---------+---------+-------------------+---------------------+---------------------+---------------------+---------------------+-------------------------+-------------+
| {}        |      0 | s3://paimon-warehouse-dev/test-flink/cookbook.db/my_table/bucket-0/data-b4a49c57-6ef6-4c04-8813-07a4960d987c-0.parquet | parquet     |         0 |     5 |            5 |               1321 | [1]     | [6]     | {f0=0, f1=0, k=0} | {f0=4, f1=111, k=1} | {f0=11, f1=k7, k=6} |                   0 |                   5 | 2025-07-01 23:14:23.967 | COMPACT     |
+-----------+--------+------------------------------------------------------------------------------------------------------------------------+-------------+-----------+-------+--------------+--------------------+---------+---------+-------------------+---------------------+---------------------+---------------------+---------------------+-------------------------+-------------+
```
### tags

Tableのすべてのタグ情報を表示します。タグ名と関連するスナップショットを含みます:

```sql
SELECT * FROM my_table$tags;
```
結果:

```text
+----------+-------------+-----------+-------------------------+--------------+--------------+
| tag_name | snapshot_id | schema_id |             commit_time | record_count |   branches   |
+----------+-------------+-----------+-------------------------+--------------+--------------+
|     tag1 |           1 |         0 | 2025-03-04 14:55:29.344 |            3 |      []      |
|     tag3 |           3 |         0 | 2025-03-04 14:58:24.691 |            7 |  [branch-1]  |
+----------+-------------+-----------+-------------------------+--------------+--------------+
```
### branches

Tableの既知のブランチ情報をすべて表示します：

```sql
SELECT * FROM my_table$branches;
```
結果:

```text
+----------------------+-------------------------+
|          branch_name |             create_time |
+----------------------+-------------------------+
|              branch1 | 2025-03-04 20:31:39.084 |
|              branch2 | 2025-03-04 21:11:14.373 |
+----------------------+-------------------------+
```
### consumers

Tableのコンシューマー情報を表示します。データ消費を追跡するために使用されます：

```sql
SELECT * FROM my_table$consumers;
```
結果:

```text
+-------------+------------------+
| consumer_id | next_snapshot_id |
+-------------+------------------+
|         id1 |                1 |
|         id2 |                3 |
+-------------+------------------+
```
### manifests

Tableの現在のスナップショットのマニフェストファイル情報を表示します：

```sql
SELECT * FROM my_table$manifests;
```
結果:

```text
+-------------------------------------------------+-----------+-----------------+-------------------+-----------+---------------------+---------------------+
| file_name                                       | file_size | num_added_files | num_deleted_files | schema_id | min_partition_stats | max_partition_stats |
+-------------------------------------------------+-----------+-----------------+-------------------+-----------+---------------------+---------------------+
| manifest-3df9bb64-5c11-4aef-994e-d8717fedfc70-0 |      1949 |               1 |                 0 |         0 | {}                  | {}                  |
| manifest-d7eb4ec4-7238-478a-9ae6-91a4ccebd561-0 |      1946 |               1 |                 0 |         0 | {}                  | {}                  |
| manifest-3b6f4079-c893-4413-aedc-1e8fbcea6db1-0 |      1948 |               1 |                 0 |         0 | {}                  | {}                  |
| manifest-abe5177f-82da-4e86-9864-40efffb391bd-0 |      1964 |               1 |                 0 |         0 | {}                  | {}                  |
| manifest-ee89dff3-a523-4655-a4b8-d7c9e471a1d6-0 |      1949 |               1 |                 0 |         0 | {}                  | {}                  |
| manifest-ee89dff3-a523-4655-a4b8-d7c9e471a1d6-1 |      2232 |               1 |                 5 |         0 | {}                  | {}                  |
+-------------------------------------------------+-----------+-----------------+-------------------+-----------+---------------------+---------------------+
```
### aggregation_fields

Tableの集約フィールド情報を表示します。集約Tableのフィールド設定に使用されます：

```sql
SELECT * FROM my_table$aggregation_fields;
```
結果:

```text
+------------+--------------+----------+------------------+---------+
| field_name | field_type   | function | function_options | comment |
+------------+--------------+----------+------------------+---------+
| k          | INT NOT NULL | []       | []               | NULL    |
| f0         | INT          | []       | []               | NULL    |
| f1         | STRING       | []       | []               | NULL    |
+------------+--------------+----------+------------------+---------+
```
### partitions

Tableのパーティション情報を表示します。各パーティションの総レコード数と総ファイルサイズを含みます：

```sql
SELECT * FROM my_table$partitions;
```
結果:

```text
+-----------+--------------+--------------------+------------+-------------------------+
| partition | record_count | file_size_in_bytes | file_count | last_update_time        |
+-----------+--------------+--------------------+------------+-------------------------+
| {}        |            5 |               1321 |          1 | 2025-07-01 23:14:23.967 |
+-----------+--------------+--------------------+------------+-------------------------+
```
### buckets

Tableのバケット情報を表示します。各バケットの統計情報も含まれます：

```sql
SELECT * FROM my_table$buckets;
```
結果:

```text
+-----------+--------+--------------+--------------------+------------+-------------------------+
| partition | bucket | record_count | file_size_in_bytes | file_count | last_update_time        |
+-----------+--------+--------------+--------------------+------------+-------------------------+
| {}        |      0 |            5 |               1321 |          1 | 2025-07-01 23:14:23.967 |
+-----------+--------+--------------+--------------------+------------+-------------------------+
```
### statistics

行数、データサイズ、およびその他の統計情報を含む、Tableの統計情報を表示します：

```sql
SELECT * FROM my_table$statistics;
```
結果:

```text
+--------------+------------+-----------------------+------------------+----------+
|  snapshot_id |  schema_id |     mergedRecordCount | mergedRecordSize |  colstat |
+--------------+------------+-----------------------+------------------+----------+
|            2 |          0 |              2        |         2        |    {}    |
+--------------+------------+-----------------------+------------------+----------+
```
### table_indexes

Tableのインデックス情報を表示します：

```sql
SELECT * FROM my_table$table_indexes;
```
結果:

```text
+--------------------------------+-------------+--------------------------------+--------------------------------+----------------------+----------------------+--------------------------------+
|                      partition |      bucket |                     index_type |                      file_name |            file_size |            row_count |                      dv_ranges |
+--------------------------------+-------------+--------------------------------+--------------------------------+----------------------+----------------------+--------------------------------+
|                   {2025-03-01} |           0 |                           HASH | index-70abfebf-149e-4796-9f... |                   12 |                    3 |                         <NULL> |
|                   {2025-04-01} |           0 |               DELETION_VECTORS | index-633857e7-cdce-47d2-87... |                   33 |                    1 | [(data-346cb9c8-4032-4d66-a... |
+--------------------------------+-------------+--------------------------------+--------------------------------+----------------------+----------------------+--------------------------------+
```
### システム Table Use Cases

システムTableを通じて、以下の操作および監視タスクを簡単に実行できます。

#### Tableの最新スナップショット情報を表示して現在の状態を把握する

```sql
SELECT snapshot_id, commit_time, commit_kind, total_record_count FROM catalog_sales$snapshots ORDER BY snapshot_id DESC;
```
結果:

```text
+-------------+-------------------------+-------------+--------------------+
| snapshot_id | commit_time             | commit_kind | total_record_count |
+-------------+-------------------------+-------------+--------------------+
|           1 | 2025-07-01 21:21:54.179 | APPEND      |           14329288 |
+-------------+-------------------------+-------------+--------------------+
```
#### スナップショットのTable情報を表示する

```sql
SELECT s.snapshot_id, t.schema_id, t.fields FROM store_sales$snapshots s JOIN store_sales$schemas t ON s.schema_id=t.schema_id;
```
結果:

```text
+-------------+-----------+----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
| snapshot_id | schema_id | fields                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
+-------------+-----------+----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
|           1 |         0 | [{"id":0,"name":"ss_sold_date_sk","type":"INT"},{"id":1,"name":"ss_item_sk","type":"INT NOT NULL"},{"id":2,"name":"ss_ticket_number","type":"INT NOT NULL"},{"id":3,"name":"ss_sold_time_sk","type":"INT"},{"id":4,"name":"ss_customer_sk","type":"INT"},{"id":5,"name":"ss_cdemo_sk","type":"INT"},{"id":6,"name":"ss_hdemo_sk","type":"INT"},{"id":7,"name":"ss_addr_sk","type":"INT"},{"id":8,"name":"ss_store_sk","type":"INT"},{"id":9,"name":"ss_promo_sk","type":"INT"},{"id":10,"name":"ss_quantity","type":"INT"},{"id":11,"name":"ss_wholesale_cost","type":"DECIMAL(7, 2)"},{"id":12,"name":"ss_list_price","type":"DECIMAL(7, 2)"},{"id":13,"name":"ss_sales_price","type":"DECIMAL(7, 2)"},{"id":14,"name":"ss_ext_discount_amt","type":"DECIMAL(7, 2)"},{"id":15,"name":"ss_ext_sales_price","type":"DECIMAL(7, 2)"},{"id":16,"name":"ss_ext_wholesale_cost","type":"DECIMAL(7, 2)"},{"id":17,"name":"ss_ext_list_price","type":"DECIMAL(7, 2)"},{"id":18,"name":"ss_ext_tax","type":"DECIMAL(7, 2)"},{"id":19,"name":"ss_coupon_amt","type":"DECIMAL(7, 2)"},{"id":20,"name":"ss_net_paid","type":"DECIMAL(7, 2)"},{"id":21,"name":"ss_net_paid_inc_tax","type":"DECIMAL(7, 2)"},{"id":22,"name":"ss_net_profit","type":"DECIMAL(7, 2)"}] |
|           2 |         0 | [{"id":0,"name":"ss_sold_date_sk","type":"INT"},{"id":1,"name":"ss_item_sk","type":"INT NOT NULL"},{"id":2,"name":"ss_ticket_number","type":"INT NOT NULL"},{"id":3,"name":"ss_sold_time_sk","type":"INT"},{"id":4,"name":"ss_customer_sk","type":"INT"},{"id":5,"name":"ss_cdemo_sk","type":"INT"},{"id":6,"name":"ss_hdemo_sk","type":"INT"},{"id":7,"name":"ss_addr_sk","type":"INT"},{"id":8,"name":"ss_store_sk","type":"INT"},{"id":9,"name":"ss_promo_sk","type":"INT"},{"id":10,"name":"ss_quantity","type":"INT"},{"id":11,"name":"ss_wholesale_cost","type":"DECIMAL(7, 2)"},{"id":12,"name":"ss_list_price","type":"DECIMAL(7, 2)"},{"id":13,"name":"ss_sales_price","type":"DECIMAL(7, 2)"},{"id":14,"name":"ss_ext_discount_amt","type":"DECIMAL(7, 2)"},{"id":15,"name":"ss_ext_sales_price","type":"DECIMAL(7, 2)"},{"id":16,"name":"ss_ext_wholesale_cost","type":"DECIMAL(7, 2)"},{"id":17,"name":"ss_ext_list_price","type":"DECIMAL(7, 2)"},{"id":18,"name":"ss_ext_tax","type":"DECIMAL(7, 2)"},{"id":19,"name":"ss_coupon_amt","type":"DECIMAL(7, 2)"},{"id":20,"name":"ss_net_paid","type":"DECIMAL(7, 2)"},{"id":21,"name":"ss_net_paid_inc_tax","type":"DECIMAL(7, 2)"},{"id":22,"name":"ss_net_profit","type":"DECIMAL(7, 2)"}] |
+-------------+-----------+----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
```
#### bucketのデータ分散を表示する

```sql
SELECT `bucket` , COUNT(*) as file_count, SUM(file_size_in_bytes)/1024/1024 as total_size_mb from paimon_s3.tpcds.catalog_sales$files GROUP BY `bucket`  ORDER BY total_size_mb;
```
> 注意：PaimonシステムTableの多くのフィールドはDorisのキーワードであるため、バッククォートで囲む必要があります。

```text
+--------+------------+--------------------+
| bucket | file_count | total_size_mb      |
+--------+------------+--------------------+
|     35 |          1 | 12.144722938537598 |
|     81 |          1 | 12.143454551696777 |
|     37 |          1 |  12.14071273803711 |
|     36 |          1 | 12.139023780822754 |
|     63 |          1 | 12.137332916259766 |
|      7 |          1 | 12.122495651245117 |
|     15 |          1 | 12.117934226989746 |
|     11 |          1 | 12.116133689880371 |
|     12 |          1 |  12.11155891418457 |
|     46 |          1 | 12.111005783081055 |
+--------+------------+--------------------+
```
## 付録
