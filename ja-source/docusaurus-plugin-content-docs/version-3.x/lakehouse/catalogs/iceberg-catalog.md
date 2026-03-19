---
{
  "title": "Iceberg カタログ",
  "description": "Dorisは、様々なメタデータサービスを通じてIcebergTableデータへのアクセスをサポートしています。",
  "language": "ja"
}
---
# Iceberg カタログ

Dorisは様々なメタデータサービスを通じてIcebergTableデータへのアクセスをサポートしています。データの読み取りに加えて、DorisはIcebergTableへの書き込みもサポートしています。

[Apache DorisとApache Icebergのクイックスタート](../best-practices/doris-iceberg.md)。

:::tip
ユーザーはHive MetastoreをメタデータとしてHive カタログを通じてIcebergTableにアクセスできます。ただし、互換性の問題を回避するため、Iceberg カタログを直接使用することを推奨します。
:::

## 適用シナリオ

| シナリオ    | 説明                                                                 |
| ----------- | --------------------------------------------------------------------------- |
| クエリ加速 | Dorisの分散計算エンジンを使用してIcebergデータに直接アクセスし、より高速なクエリを実現します。      |
| データ統合  | Icebergデータを読み取ってDoris内部tableに書き込むか、Doris計算エンジンを使用してZeroETL操作を実行します。 |
| データ書き戻し   | Dorisがサポートする任意のデータソースからデータを処理し、IcebergTableストレージに書き戻します。       |

## カタログの設定

### 構文

```sql
CREATE CATALOG [IF NOT EXISTS] catalog_name PROPERTIES (
    'type' = 'iceberg',
    'iceberg.catalog.type' = '<iceberg_catalog_type>',
    'warehouse' = '<warehouse>' --optional
    {MetaStoreProperties},
    {StorageProperties},
    {CommonProperties}
);
```
* `<iceberg_catalog_type>`

  Iceberg Catalogのタイプで、以下のオプションをサポートしています：

  * `hms`: Hive Metastoreをメタデータサービスとして使用します。

  * `rest`: Iceberg Rest Catalogインターフェースと互換性のあるメタデータサービスです。

  * `hadoop`: ファイルシステムに保存されたメタデータに直接アクセスします。

  * `glue`: AWS Glueをメタデータサービスとして使用します。

  * `dlf`: Alibaba Cloud DLFをメタデータサービスとして使用します。

  * `s3tables`: AWS S3 Tables Catalogを使用して[S3 Table バケット](https://aws.amazon.com/s3/features/tables/)にアクセスします。

* `<warehouse>`

  Icebergのwarehouseパスです。このパラメータは`<iceberg_catalog_type>`が`hadoop`の場合に指定する必要があります。

  `warehouse`パスは`Database`パスの1つ上のレベルを指す必要があります。例えば、Tableパスが`s3://bucket/path/to/db1/table1`の場合、`warehouse`は`s3://bucket/path/to/`にする必要があります。

* `{MetaStoreProperties}`

  MetaStorePropertiesセクションは、Metastoreメタデータサービスの接続と認証情報を入力するためのものです。[Supported Metadata Services]のセクションを参照してください。

* `{StorageProperties}`

  StoragePropertiesセクションは、ストレージシステムに関する接続と認証情報を入力するためのものです。[Supported Storage システム]のセクションを参照してください。

* `{CommonProperties}`

  CommonPropertiesセクションは、一般的なプロパティを入力するためのものです。共通プロパティの詳細については、[カタログ 概要](../catalog-overview.md)を参照してください。

### サポートされているIcebergバージョン

現在のIcebergの依存関係はバージョン1.6.1で、より高いバージョンのIcebergとの互換性があります。

### サポートされているIcebergフォーマット

* Iceberg V1/V2フォーマットをサポートしています。
* Position DeleteとEquality Deleteをサポートしています。

### サポートされているメタデータサービス

* [Hive Metastore](../metastores/hive-metastore.md)
* [AWS Glue](../metastores/aws-glue.md)
* [Aliyun DLF](../metastores/aliyun-dlf.md)
* [Iceberg Rest カタログ](../metastores/iceberg-rest.md)
* [FileSystem](../metastores/filesystem.md)

### サポートされているストレージシステム

* [HDFS](../storages/hdfs.md)
* [AWS S3](../storages/s3.md)
* Google Cloud Storage
* [Aliyun OSS](../storages/aliyun-oss.md)
* [Tencent COS](../storages/tencent-cos.md)
* [Huawei OBS](../storages/huawei-obs.md)
* [MINIO](../storages/minio.md)

### サポートされているデータフォーマット

* [Parquet](../file-formats/parquet.md)
* [ORC](../file-formats/orc.md)

## カラムタイプマッピング

| Iceberg タイプ                           | Doris タイプ           | Comment                                 |
| -------------------------------------- | -------------------- | --------------------------------------- |
| boolean                                | boolean              |                                         |
| integer                                | int                  |                                         |
| long                                   | bigint               |                                         |
| float                                  | float                |                                         |
| double                                 | double               |                                         |
| decimal(P, S)                          | decimal(P, S)        |                                         |
| date                                   | date                 |                                         |
| timestamp (Timestamp without timezone) | datetime(6)          | 精度6のdatetimeにマッピングされます     |
| timestamptz (Timestamp with timezone)  | datetime(6)          | 精度6のdatetimeにマッピングされます     |
| fixed(N)                               | char(N)              |                                         |
| string                                 | string               |                                         |
| binary                                 | string               |                                         |
| uuid                                   | string               |                                         |
| struct                                 | struct (バージョン2.1.3以降でサポート) |                                         |
| map                                    | map (バージョン2.1.3以降でサポート)    |                                         |
| list                                   | array                |                                         |
| other                                  | UNSUPPORTED          |                                         |

## 例

### Iceberg 上の Hive Metastore

```sql
CREATE CATALOG iceberg_hms PROPERTIES (
    'type' = 'iceberg',
    'iceberg.catalog.type' = 'hms',
    'hive.metastore.uris' = 'thrift://hms-host:7004',
    'hadoop.username' = 'hive',
    'dfs.nameservices' = 'your-nameservice',
    'dfs.ha.namenodes.your-nameservice' = 'nn1,nn2',
    'dfs.namenode.rpc-address.your-nameservice.nn1' = '172.21.0.2:4007',
    'dfs.namenode.rpc-address.your-nameservice.nn2' = '172.21.0.3:4007',
    'dfs.client.failover.proxy.provider.your-nameservice' = 'org.apache.hadoop.hdfs.server.namenode.ha.ConfiguredFailoverProxyProvider'
);
```
### Hadoop上のIceberg

```sql
CREATE CATALOG iceberg_hadoop PROPERTIES (
    'type' = 'iceberg',
    'iceberg.catalog.type' = 'hadoop',
    'warehouse' = 'hdfs://namenode:8020/dir/key'
);
```
### IcebergのS3上での利用

```sql
CREATE CATALOG iceberg_s3 PROPERTIES (
    'type' = 'iceberg',
    'iceberg.catalog.type' = 'hadoop',
    'warehouse' = 's3://bucket/dir/key',
    's3.endpoint' = 's3.us-east-1.amazonaws.com',
    's3.access_key' = 'ak',
    's3.secret_key' = 'sk'
);
```
### Iceberg 上の Glue

```sql
-- Using access key and secret key
CREATE CATALOG iceberg_glue PROPERTIES (
    'type' = 'iceberg',
    'iceberg.catalog.type' = 'glue',
    'glue.endpoint' = 'https://glue.us-east-1.amazonaws.com/',
    'client.credentials-provider' = 'com.amazonaws.glue.catalog.credentials.ConfigAWSProvider',
    'client.credentials-provider.glue.access_key' = 'ak',
    'client.credentials-provider.glue.secret_key' = 'sk'
);
```
### DLF上のIceberg

```sql
CREATE CATALOG iceberg_dlf PROPERTIES (
   'type' = 'hms',
   'hive.metastore.type' = 'dlf',
   'dlf.proxy.mode' = 'DLF_ONLY',
   'dlf.endpoint' = 'datalake-vpc.cn-beijing.aliyuncs.com',
   'dlf.region' = 'cn-beijing',
   'dlf.uid' = 'uid',
   'dlf.catalog.id' = 'catalog_id',
   'dlf.access_key' = 'ak',
   'dlf.secret_key' = 'sk'
);
```
### Iceberg上のRest

```sql
CREATE CATALOG iceberg_rest PROPERTIES (
    'type' = 'iceberg',
    'iceberg.catalog.type' = 'rest',
    'uri' = 'http://172.21.0.1:8181'
);
```
### Iceberg上のRest with MINIO

```sql
CREATE CATALOG iceberg_minio PROPERTIES (
    'type' = 'iceberg',
    'iceberg.catalog.type' = 'rest',
    'uri' = 'http://172.21.0.1:8181',
    's3.access_key' = 'ak',
    's3.secret_key' = 'sk',
    's3.endpoint' = 'http://10.0.0.1:9000',
    's3.region' = 'us-east-1'
);
```
### Google Dataproc Metastore上のIceberg

```sql
CREATE CATALOG iceberg_gdm PROPERTIES (
    'type' = 'iceberg',
    'iceberg.catalog.type' = 'hms',
    'hive.metastore.uris' = 'thrift://172.21.0.1:9083',
    'gs.endpoint' = 'https://storage.googleapis.com',
    'gs.region' = 'us-east-1',
    'gs.access_key' = 'ak',
    'gs.secret_key' = 'sk',
    'use_path_style' = 'true'
);
```
### S3上のIcebergTable

```sql
CREATE CATALOG iceberg_s3 PROPERTIES (
    'type' = 'iceberg',
    'iceberg.catalog.type' = 's3tables',
    'warehouse' = 'arn:aws:s3tables:us-east-1:169000000000:bucket/doris-s3-table-bucket',
    's3.region' = 'us-east-1',
    's3.endpoint' = 's3.us-east-1.amazonaws.com',
    's3.access_key' = 'ak',
    's3.secret_key' = 'sk'
);
```
[統合 with AWS S3 Tables](../best-practices/doris-aws-s3tables.md)を参照してください。

## クエリ操作

### 基本クエリ

```sql
-- 1. switch to catalog, use database and query
SWITCH iceberg;
USE iceberg_db;
SELECT * FROM iceberg_tbl LIMIT 10;

-- 2. use iceberg database directly
USE iceberg.iceberg_db;
SELECT * FROM iceberg_tbl LIMIT 10;

-- 3. use full qualified name to query
SELECT * FROM iceberg.iceberg_db.iceberg_tbl LIMIT 10;
```
### Time Travel

Iceberg Tableの特定のスナップショットを読み取ることができます。

デフォルトでは、読み取りリクエストは最新のスナップショットバージョンにアクセスします。

`iceberg_meta()` Table関数を使用して、Iceberg Tableの特定のスナップショットをクエリできます：

```sql
SELECT * FROM iceberg_meta(
    'table' = 'iceberg_ctl.iceberg_db.iceberg_tbl',
    'query_type' = 'snapshots'
)\G

*************************** 1. row ***************************
 committed_at: 2024-11-28 11:07:29
  snapshot_id: 8903826400153112036
    parent_id: -1
    operation: append
manifest_list: oss://path/to/metadata/snap-8903826400153112036-1-3835e66d-9a18-4cb0-b9b0-9ec80527ad8d.avro
      summary: {"added-data-files":"2","added-records":"3","added-files-size":"2742","changed-partition-count":"2","total-records":"3","total-files-size":"2742","total-data-files":"2","total-delete-files":"0","total-position-deletes":"0","total-equality-deletes":"0"}
*************************** 2. row ***************************
 committed_at: 2024-11-28 11:10:11
  snapshot_id: 6099853805930794326
    parent_id: 8903826400153112036
    operation: append
manifest_list: oss://path/to/metadata/snap-6099853805930794326-1-dd46a1bd-219b-4fb0-bb46-ac441d8b3105.avro
      summary: {"added-data-files":"1","added-records":"1","added-files-size":"1367","changed-partition-count":"1","total-records":"4","total-files-size":"4109","total-data-files":"3","total-delete-files":"0","total-position-deletes":"0","total-equality-deletes":"0"}
```
`FOR TIME AS OF` と `FOR VERSION AS OF` 句を使用して、スナップショットIDまたはスナップショットが作成された時刻に基づいて履歴データを読み取ることができます。以下にいくつかの例を示します：

```sql
-- Read data as of a specific timestamp
SELECT * FROM iceberg_table FOR TIME AS OF '2023-01-01 00:00:00';

-- Read data as of a specific snapshot ID
SELECT * FROM iceberg_table FOR VERSION AS OF 123456789;
```
### ブランチとタグ

> Since 3.1.0
>
> ブランチとタグの作成、削除、管理については、[Managing Branch & Tag]を参照してください

IcebergTableの特定のブランチとタグの読み取りがサポートされています。

Spark/Trinoなどのシステムとの互換性のため、複数の構文形式がサポートされています。

```sql
-- BRANCH
SELECT * FROM iceberg_tbl@brand(branch1);
SELECT * FROM iceberg_tbl@brand("name" = "branch1");
SELECT * FROM iceberg_tbl FOR VERSION AS OF 'branch1';

-- TAG
SELECT * FROM iceberg_tbl@tag(tag1);
SELECT * FROM iceberg_tbl@tag("name" = "tag1");
SELECT * FROM iceberg_tbl FOR VERSION AS OF 'tag1';
```
`FOR VERSION AS OF`構文において、DorisはパラメータがタイムスタンプかBranch/Tag名かを自動的に判定します。

## システム Tables

> 3.1.0以降

DorisはIceberg  tablesのクエリをサポートしており、Tableのメタデータ情報を取得できます。system tablesを使用して、スナップショット履歴、manifestファイル、データファイル、パーティション、その他のメタデータを表示できます。

IcebergTableのメタデータにアクセスするには、Table名の後に`$`記号とsystem table名を追加します：

```sql
SELECT * FROM iceberg_table$system_table_name;
```
例えば、Tableの履歴を表示するには、以下を実行します：

```sql
SELECT * FROM iceberg_table$history;
```
> 現在、`all_manifests`と`position_deletes`システムTableはまだサポートされておらず、将来のバージョンでサポートされる予定です。

### entries

Tableの現在のスナップショットのすべてのマニフェストエントリを表示します：

`all_entries`と`entries`は似ていますが、`all_entries`がすべてのスナップショットからのエントリを含むのに対し、`entries`は現在のスナップショットからのエントリのみを含むという違いがあります。

```sql
SELECT * FROM iceberg_table$entries;
```
結果：

```text
+--------+---------------------+-----------------+----------------------+-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
| status | snapshot_id         | sequence_number | file_sequence_number | data_file                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             | readable_metrics                                                                                                                                                                                                                                                   |
+--------+---------------------+-----------------+----------------------+-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
|      2 | 4890031351138056789 |               1 |                    1 | {"content":0, "file_path":"s3://.../iceberg_table/data/id=1/00000-16-79ef2fd7-9997-47eb-a91a-9f7af8201315-0-00001.parquet", "file_format":"PARQUET", "spec_id":0, "partition":{"id":1}, "record_count":1, "file_size_in_bytes":625, "column_sizes":{1:36, 2:41}, "value_counts":{1:1, 2:1}, "null_value_counts":{1:0, 2:0}, "nan_value_counts":{}, "lower_bounds":{1:"   ", 2:"Alice"}, "upper_bounds":{1:"   ", 2:"Alice"}, "key_metadata":null, "split_offsets":[4], "equality_ids":null, "sort_order_id":0, "first_row_id":null, "referenced_data_file":null, "content_offset":null, "content_size_in_bytes":null} | {"id":{"column_size":36, "value_count":1, "null_value_count":0, "nan_value_count":null, "lower_bound":1, "upper_bound":1}, "name":{"column_size":41, "value_count":1, "null_value_count":0, "nan_value_count":null, "lower_bound":"Alice", "upper_bound":"Alice"}} |
|      0 | 1851184769713369003 |               1 |                    1 | {"content":0, "file_path":"s3://.../iceberg_table/data/id=2/00000-16-79ef2fd7-9997-47eb-a91a-9f7af8201315-0-00002.parquet", "file_format":"PARQUET", "spec_id":0, "partition":{"id":2}, "record_count":1, "file_size_in_bytes":611, "column_sizes":{1:36, 2:39}, "value_counts":{1:1, 2:1}, "null_value_counts":{1:0, 2:0}, "nan_value_counts":{}, "lower_bounds":{1:"   ", 2:"Bob"}, "upper_bounds":{1:"   ", 2:"Bob"}, "key_metadata":null, "split_offsets":[4], "equality_ids":null, "sort_order_id":0, "first_row_id":null, "referenced_data_file":null, "content_offset":null, "content_size_in_bytes":null}     | {"id":{"column_size":36, "value_count":1, "null_value_count":0, "nan_value_count":null, "lower_bound":2, "upper_bound":2}, "name":{"column_size":39, "value_count":1, "null_value_count":0, "nan_value_count":null, "lower_bound":"Bob", "upper_bound":"Bob"}}     |
+--------+---------------------+-----------------+----------------------+-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
```
### files

Tableの現在のスナップショットのファイルリストを表示します：

```sql
SELECT * FROM iceberg_table$files;
```
結果:

```text
+---------+-------------------------------------------------------------------------------------------------------------------------------------------------------------------+-------------+---------+-----------+--------------+--------------------+--------------+--------------+-------------------+------------------+-----------------------+-----------------------+--------------+---------------+--------------+---------------+--------------+----------------------+----------------+-----------------------+--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
| content | file_path                                                                                       | file_format | spec_id | partition | record_count | file_size_in_bytes | column_sizes | value_counts | null_value_counts | nan_value_counts | lower_bounds          | upper_bounds          | key_metadata | split_offsets | equality_ids | sort_order_id | first_row_id | referenced_data_file | content_offset | content_size_in_bytes | readable_metrics                                                                                                                                                                                                                                                   |
+---------+-------------------------------------------------------------------------------------------------------------------------------------------------------------------+-------------+---------+-----------+--------------+--------------------+--------------+--------------+-------------------+------------------+-----------------------+-----------------------+--------------+---------------+--------------+---------------+--------------+----------------------+----------------+-----------------------+--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
|       0 | s3://.../iceberg_table/data/id=2/00000-16-79ef2fd7-9997-47eb-a91a-9f7af8201315-0-00002.parquet  | PARQUET     |       0 | {"id":2}  |            1 |                611 | {1:36, 2:39} | {1:1, 2:1}   | {1:0, 2:0}        | {}               | {1:"   ", 2:"Bob"}   | {1:"   ", 2:"Bob"}   | NULL         | [4]           | NULL         |             0 |         NULL | NULL                 |           NULL |                  NULL | {"id":{"column_size":36, "value_count":1, "null_value_count":0, "nan_value_count":null, "lower_bound":2, "upper_bound":2}, "name":{"column_size":39, "value_count":1, "null_value_count":0, "nan_value_count":null, "lower_bound":"Bob", "upper_bound":"Bob"}}     |
|       0 | s3://.../iceberg_table/data/id=4/00000-16-79ef2fd7-9997-47eb-a91a-9f7af8201315-0-00004.parquet  | PARQUET     |       0 | {"id":4}  |            1 |                618 | {1:36, 2:40} | {1:1, 2:1}   | {1:0, 2:0}        | {}               | {1:"   ", 2:"Dave"}  | {1:"   ", 2:"Dave"}  | NULL         | [4]           | NULL         |             0 |         NULL | NULL                 |           NULL |                  NULL | {"id":{"column_size":36, "value_count":1, "null_value_count":0, "nan_value_count":null, "lower_bound":4, "upper_bound":4}, "name":{"column_size":40, "value_count":1, "null_value_count":0, "nan_value_count":null, "lower_bound":"Dave", "upper_bound":"Dave"}}   |
|       0 | s3://.../iceberg_table/data/id=6/00000-16-79ef2fd7-9997-47eb-a91a-9f7af8201315-0-00006.parquet  | PARQUET     |       0 | {"id":6}  |            1 |                625 | {1:36, 2:41} | {1:1, 2:1}   | {1:0, 2:0}        | {}               | {1:"   ", 2:"Frank"} | {1:"   ", 2:"Frank"} | NULL         | [4]           | NULL         |             0 |         NULL | NULL                 |           NULL |                  NULL | {"id":{"column_size":36, "value_count":1, "null_value_count":0, "nan_value_count":null, "lower_bound":6, "upper_bound":6}, "name":{"column_size":41, "value_count":1, "null_value_count":0, "nan_value_count":null, "lower_bound":"Frank", "upper_bound":"Frank"}} |
|       0 | s3://.../iceberg_table/data/id=8/00000-16-79ef2fd7-9997-47eb-a91a-9f7af8201315-0-00008.parquet  | PARQUET     |       0 | {"id":8}  |            1 |                625 | {1:36, 2:41} | {1:1, 2:1}   | {1:0, 2:0}        | {}               | {1:"   ", 2:"Heidi"} | {1:"   ", 2:"Heidi"} | NULL         | [4]           | NULL         |             0 |         NULL | NULL                 |           NULL |                  NULL | {"id":{"column_size":36, "value_count":1, "null_value_count":0, "nan_value_count":null, "lower_bound":8, "upper_bound":8}, "name":{"column_size":41, "value_count":1, "null_value_count":0, "nan_value_count":null, "lower_bound":"Heidi", "upper_bound":"Heidi"}} |
|       0 | s3://.../iceberg_table/data/id=10/00000-16-79ef2fd7-9997-47eb-a91a-9f7af8201315-0-00010.parquet | PARQUET     |       0 | {"id":10} |            1 |                618 | {1:36, 2:40} | {1:1, 2:1}   | {1:0, 2:0}        | {}               | {1:"   ", 2:"Judy"}  | {1:"   ", 2:"Judy"}  | NULL         | [4]           | NULL         |             0 |         NULL | NULL                 |           NULL |                  NULL | {"id":{"column_size":36, "value_count":1, "null_value_count":0, "nan_value_count":null, "lower_bound":10, "upper_bound":10}, "name":{"column_size":40, "value_count":1, "null_value_count":0, "nan_value_count":null, "lower_bound":"Judy", "upper_bound":"Judy"}} |
+---------+-------------------------------------------------------------------------------------------------------------------------------------------------------------------+-------------+---------+-----------+--------------+--------------------+--------------+--------------+-------------------+------------------+-----------------------+-----------------------+--------------+---------------+--------------+---------------+--------------+----------------------+----------------+-----------------------+--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
```
`files`システムTableと同様に、以下のシステムTableを通じて特定のファイルタイプ情報を照会することもできます：

```sql
-- Query data files for the current snapshot
SELECT * FROM iceberg_table$data_files;

-- Query delete files for the current snapshot
SELECT * FROM iceberg_table$delete_files;

-- Query all files (including data and delete files) from all snapshots
SELECT * FROM iceberg_table$all_files;

-- Query data files from all snapshots
SELECT * FROM iceberg_table$all_data_files;

-- Query delete files from all snapshots
SELECT * FROM iceberg_table$all_delete_files;
```
これらのTableの結果フォーマットは`files`システムTableに似ていますが、それぞれデータファイルまたは削除ファイルに特化しています。`all_`プレフィックスを持つシステムTableには、現在のスナップショットのファイルだけでなく、すべてのスナップショットのファイルが含まれます。

注意：特定のタイプのファイルがTableに存在しない場合（例えば、Tableに削除ファイルが存在しないときに`delete_files`をクエリする場合）、クエリ結果は空になる可能性があります。

### history

Tableのすべての履歴を表示します：

```sql
SELECT * FROM iceberg_table$history;
```
結果:

```text
+----------------------------+---------------------+---------------------+---------------------+
| made_current_at            | snapshot_id         | parent_id           | is_current_ancestor |
+----------------------------+---------------------+---------------------+---------------------+
| 2025-06-12 22:29:16.357000 | 1851184769713369003 |                NULL |                   1 |
| 2025-06-12 22:29:39.922000 | 4890031351138056789 | 1851184769713369003 |                   1 |
+----------------------------+---------------------+---------------------+---------------------+
```
### manifests

Tableのマニフェストファイル情報を表示します：

```sql
SELECT * FROM iceberg_table$manifests;
```
結果:

```text
+---------+------------------------------------------------------------------------------------------------------------------------------------------------+--------+-------------------+---------------------+------------------------+---------------------------+--------------------------+--------------------------+-----------------------------+----------------------------+--------------------------------------------------------------------------------+
| content | path                                                                         | length | partition_spec_id | added_snapshot_id   | added_data_files_count | existing_data_files_count | deleted_data_files_count | added_delete_files_count | existing_delete_files_count | deleted_delete_files_count | partition_summaries                                                            |
+---------+------------------------------------------------------------------------------------------------------------------------------------------------+--------+-------------------+---------------------+------------------------+---------------------------+--------------------------+--------------------------+-----------------------------+----------------------------+--------------------------------------------------------------------------------+
|       0 | s3://.../iceberg_table/metadata/3194eb8b-5ea4-4cbe-95ba-073229458e7b-m0.avro |   7138 |                 0 | 4890031351138056789 |                      0 |                         5 |                        5 |                        0 |                           0 |                          0 | [{"contains_null":0, "contains_nan":0, "lower_bound":"1", "upper_bound":"10"}] |
+---------+------------------------------------------------------------------------------------------------------------------------------------------------+--------+-------------------+---------------------+------------------------+---------------------------+--------------------------+--------------------------+-----------------------------+----------------------------+--------------------------------------------------------------------------------+
```
### metadata_log_entries

Tableのメタログを表示します：

```sql
SELECT * FROM iceberg_table$metadata_log_entries;
```
結果:

```text
+----------------------------+------------------------------------------------------------------------------------------------------------------------------------------------------------+---------------------+------------------+------------------------+
| timestamp                  | file                                                                                     | latest_snapshot_id  | latest_schema_id | latest_sequence_number |
+----------------------------+------------------------------------------------------------------------------------------------------------------------------------------------------------+---------------------+------------------+------------------------+
| 2025-06-12 22:29:06.948000 | s3://.../iceberg_table/metadata/00000-e373aa16-15f1-4e69-ae7d-5ed64199cf9a.metadata.json |                NULL |             NULL |                   NULL |
| 2025-06-12 22:29:16.357000 | s3://.../iceberg_table/metadata/00001-bbc8e244-e41c-4958-92f4-63b8c3ee1196.metadata.json | 1851184769713369003 |                0 |                      1 |
| 2025-06-12 22:29:39.922000 | s3://.../iceberg_table/metadata/00002-7dc00d6a-6269-4200-9d28-5f8c1c6b9f99.metadata.json | 4890031351138056789 |                0 |                      2 |
+----------------------------+------------------------------------------------------------------------------------------------------------------------------------------------------------+---------------------+------------------+------------------------+
```
### partitions

Tableのパーティションを表示します：

```sql
SELECT * FROM iceberg_table$partitions;
```
結果:

```text
+-----------+---------+--------------+------------+-------------------------------+------------------------------+----------------------------+------------------------------+----------------------------+----------------------------+--------------------------+
| partition | spec_id | record_count | file_count | total_data_file_size_in_bytes | position_delete_record_count | position_delete_file_count | equality_delete_record_count | equality_delete_file_count | last_updated_at            | last_updated_snapshot_id |
+-----------+---------+--------------+------------+-------------------------------+------------------------------+----------------------------+------------------------------+----------------------------+----------------------------+--------------------------+
| {"id":8}  |       0 |            1 |          1 |                           625 |                            0 |                          0 |                            0 |                          0 | 2025-06-12 22:29:16.357000 |      1851184769713369003 |
| {"id":6}  |       0 |            1 |          1 |                           625 |                            0 |                          0 |                            0 |                          0 | 2025-06-12 22:29:16.357000 |      1851184769713369003 |
| {"id":10} |       0 |            1 |          1 |                           618 |                            0 |                          0 |                            0 |                          0 | 2025-06-12 22:29:16.357000 |      1851184769713369003 |
| {"id":4}  |       0 |            1 |          1 |                           618 |                            0 |                          0 |                            0 |                          0 | 2025-06-12 22:29:16.357000 |      1851184769713369003 |
| {"id":2}  |       0 |            1 |          1 |                           611 |                            0 |                          0 |                            0 |                          0 | 2025-06-12 22:29:16.357000 |      1851184769713369003 |
+-----------+---------+--------------+------------+-------------------------------+------------------------------+----------------------------+------------------------------+----------------------------+----------------------------+--------------------------+
```
注意：

1. 非パーティションTableの場合、`partitions`Tableには`partition`および`spec_id`フィールドが含まれません。
2. `partitions`Tableは、現在のスナップショットでデータファイルまたは削除ファイルを含むパーティションを表示します。ただし、削除ファイルは適用されないため、パーティション内のすべてのデータ行が削除ファイルによって削除済みとしてマークされている場合でも、パーティションが表示される場合があります。

### refs

Tableの既知のスナップショット参照（ブランチおよびタグ）をすべて表示します：

```sql
SELECT * FROM iceberg_table$refs;
```
結果:

```text
+------+--------+---------------------+-------------------------+-----------------------+------------------------+
| name | type   | snapshot_id         | max_reference_age_in_ms | min_snapshots_to_keep | max_snapshot_age_in_ms |
+------+--------+---------------------+-------------------------+-----------------------+------------------------+
| main | BRANCH | 4890031351138056789 |                    NULL |                  NULL |                   NULL |
+------+--------+---------------------+-------------------------+-----------------------+------------------------+
```
### snapshots

Tableのすべてのスナップショットを表示します：

```sql
SELECT * FROM iceberg_table$snapshots;
```
結果:

```text
+----------------------------+---------------------+---------------------+-----------+------------------------------------------------------------------------------------------------------------------------------------------------------------------------+------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
| committed_at               | snapshot_id         | parent_id           | operation | manifest_list                                                                                        | summary                                                                                                                                                                                                                                                                                                                      |
+----------------------------+---------------------+---------------------+-----------+------------------------------------------------------------------------------------------------------------------------------------------------------------------------+------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
| 2025-06-12 22:29:16.357000 | 1851184769713369003 |                NULL | append    | s3://.../iceberg_table/metadata/snap-1851184769713369003-1-82059f57-821a-4983-b083-002cc2cde313.avro | {"spark.app.id":"application_1738810850199_0472", "added-data-files":"10", "added-records":"10", "added-files-size":"6200", "changed-partition-count":"10", "total-records":"10", "total-files-size":"6200", "total-data-files":"10", "total-delete-files":"0", "total-position-deletes":"0", "total-equality-deletes":"0"}  |
| 2025-06-12 22:29:39.922000 | 4890031351138056789 | 1851184769713369003 | overwrite | s3://.../iceberg_table/metadata/snap-4890031351138056789-1-3194eb8b-5ea4-4cbe-95ba-073229458e7b.avro | {"spark.app.id":"application_1738810850199_0472", "deleted-data-files":"5", "deleted-records":"5", "removed-files-size":"3103", "changed-partition-count":"5", "total-records":"5", "total-files-size":"3097", "total-data-files":"5", "total-delete-files":"0", "total-position-deletes":"0", "total-equality-deletes":"0"} |
+----------------------------+---------------------+---------------------+-----------+------------------------------------------------------------------------------------------------------------------------------------------------------------------------+------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
```
## Write 運用

### INSERT INTO

INSERT操作は、対象Tableにデータを追加します。

例：

```sql
INSERT INTO iceberg_tbl VALUES (val1, val2, val3, val4);
INSERT INTO iceberg.iceberg_db.iceberg_tbl SELECT col1, col2 FROM internal.db1.tbl1;

INSERT INTO iceberg_tbl(col1, col2) VALUES (val1, val2);
INSERT INTO iceberg_tbl(col1, col2, partition_col1, partition_col2) VALUES (1, 2, 'beijing', '2023-12-12');
```
### INSERT OVERWRITE

INSERT OVERWRITE操作は、Table内の既存データを新しいデータで完全に置き換えます。

```sql
INSERT OVERWRITE TABLE iceberg_tbl VALUES (val1, val2, val3, val4);
INSERT OVERWRITE TABLE iceberg.iceberg_db.iceberg_tbl(col1, col2) SELECT col1, col2 FROM internal.db1.tbl1;
```
### CTAS

`CTAS`（Create Table As Select）ステートメントを使用してIcebergTableを作成し、データを書き込むことができます：

```sql
CREATE TABLE iceberg_ctas AS SELECT * FROM other_table;
```
CTASは、ファイル形式、パーティショニング、その他のプロパティの指定をサポートしています：

```sql
CREATE TABLE iceberg_ctas
PARTITION BY LIST (pt1, pt2) ()
AS SELECT col1, pt1, pt2 FROM part_ctas_src WHERE col1 > 0;

CREATE TABLE iceberg.iceberg_db.iceberg_ctas (col1, col2, pt1)
PARTITION BY LIST (pt1) ()
PROPERTIES (
    'write-format'='parquet',
    'compression-codec'='zstd'
)
AS SELECT col1, pt1 AS col2, pt2 AS pt1 FROM test_ctas.part_ctas_src WHERE col1 > 0;
```
### INSERT INTO BRANCH

> Since 3.1.0

```sql
INSERT INTO iceberg_table@branch(b1) SELECT * FROM other_table;
INSERT OVERWRITE TABLE iceberg_table@branch(b1) SELECT * FROM other_table;
```
### 関連パラメータ

* BE (Backend)

  | パラメータ名                                                               | デフォルト値 | 説明 |
  | ----------------------------------------------------------------------------- | ------------- | ----------- |
  | `iceberg_sink_max_file_size`                                                  | 1GB           | データファイルの最大サイズ。書き込まれるデータがこのサイズを超えると、現在のファイルが閉じられ、書き込みを継続するために新しいファイルが作成されます。 |
  | `table_sink_partition_write_max_partition_nums_per_writer`                    | 128           | BEノード上の各インスタンスが書き込み可能なパーティションの最大数。 |
  | `table_sink_non_partition_write_scaling_data_processed_threshold`             | 25MB          | 非パーティションTableでスケーリング書き込みを開始するためのデータ閾値。`table_sink_non_partition_write_scaling_data_processed_threshold` のデータが追加されるごとに新しいライター（インスタンス）が使用されます。このメカニズムは、データ量に基づいてライターの数を調整し、スループットを向上させる一方で、リソースを節約し、少量データでのファイル数を最小化します。 |
  | `table_sink_partition_write_min_data_processed_rebalance_threshold`           | 25MB          | パーティションTableでリバランシングをトリガーする最小データ量の閾値。`現在の累積データ量` - `前回のリバランシング以降のデータ量` >= `table_sink_partition_write_min_data_processed_rebalance_threshold` の場合にリバランシングが開始されます。この閾値を下げることで、ファイルサイズの差が大きい場合にバランスを改善できますが、リバランシングのコストが増加し、パフォーマンスに影響する可能性があります。 |
  | `table_sink_partition_write_min_partition_data_processed_rebalance_threshold` |               | リバランシングをトリガーする最小パーティションデータ量の閾値。`現在のパーティションデータ量` >= `閾値` \* `パーティションに既に割り当てられたタスク数` の場合にリバランシングが開始されます。この閾値を下げることで、ファイルサイズの差が大きい場合にバランスを改善できますが、リバランシングのコストが増加し、パフォーマンスに影響する可能性があります。 |
  
## データベースとTableの管理

### データベースの作成と削除

`SWITCH` 文を使用して目的のカタログに切り替え、`CREATE DATABASE` コマンドを実行できます：

```sql
SWITCH iceberg;
CREATE DATABASE [IF NOT EXISTS] iceberg_db;
```
完全修飾名を使用してデータベースを作成することも、場所を指定することもできます（現在、HMS-typeカタログのみが場所の指定をサポートしています）。例：

```sql
CREATE DATABASE [IF NOT EXISTS] iceberg.iceberg_db;

CREATE DATABASE [IF NOT EXISTS] iceberg.iceberg_db
PROPERTIES ('location'='hdfs://172.21.16.47:4007/path/to/db/');
```
`SHOW CREATE DATABASE`コマンドを使用して、データベースの場所情報を表示できます：

```sql
mysql> SHOW CREATE DATABASE iceberg_db;
+-------------+-------------------------------------------------------------------------------------------------+
| Database    | Create Database                                                                                 |
+-------------+-------------------------------------------------------------------------------------------------+
| iceberg_db  | CREATE DATABASE iceberg_db LOCATION 'hdfs://172.21.16.47:4007/usr/hive/warehouse/iceberg_db.db' |
+-------------+-------------------------------------------------------------------------------------------------+
```
データベースを削除するには：

```sql
DROP DATABASE [IF EXISTS] iceberg.iceberg_db;
```
:::caution
Iceberg Databaseの場合、データベース自体を削除する前に、データベース配下のすべてのTableを最初に削除する必要があります。そうしなければエラーが発生します。
:::

### Tableの作成と削除

* **Tableの作成**

  DorisはIcebergでパーティション分割されたTableとパーティション分割されていないTableの両方の作成をサポートしています。

  例：

  ```sql
  -- Create unpartitioned iceberg table
  CREATE TABLE unpartitioned_table (
    `col1` BOOLEAN COMMENT 'col1',
    `col2` INT COMMENT 'col2',
    `col3` BIGINT COMMENT 'col3',
    `col4` FLOAT COMMENT 'col4',
    `col5` DOUBLE COMMENT 'col5',
    `col6` DECIMAL(9,4) COMMENT 'col6',
    `col7` STRING COMMENT 'col7',
    `col8` DATE COMMENT 'col8',
    `col9` DATETIME COMMENT 'col9'
  )
  PROPERTIES (
    'write-format'='parquet'
  );

  -- Create partitioned iceberg table
  -- The partition columns must be in table's column definition list
  CREATE TABLE partition_table (
    `ts` DATETIME COMMENT 'ts',
    `col1` BOOLEAN COMMENT 'col1',
    `col2` INT COMMENT 'col2',
    `col3` BIGINT COMMENT 'col3',
    `col4` FLOAT COMMENT 'col4',
    `col5` DOUBLE COMMENT 'col5',
    `col6` DECIMAL(9,4) COMMENT 'col6',
    `col7` STRING COMMENT 'col7',
    `col8` DATE COMMENT 'col8',
    `col9` DATETIME COMMENT 'col9',
    `pt1` STRING COMMENT 'pt1',
    `pt2` STRING COMMENT 'pt2'
  )
  PARTITION BY LIST (day(ts), pt1, pt2) ()
  PROPERTIES (
    'write-format'='orc',
    'compression-codec'='zlib'
  );
  ```
作成後、`SHOW CREATE TABLE`コマンドを使用してIcebergTableの作成ステートメントを確認できます。パーティション関数の詳細については、[Partitioning](#)セクションを参照してください。

* **Tableの削除**

  `DROP TABLE`ステートメントを使用してIcebergTableを削除できます。Tableを削除すると、パーティションデータを含むそのデータも削除されます。

  例：

  ```sql
  DROP TABLE [IF EXISTS] iceberg_tbl;
  ```
* **Column タイプ Mapping**

  [Column タイプ Mapping](#)セクションを参照してください。

* **パーティショニング**

  IcebergのPartition typesはDorisのListパーティションに対応します。そのため、DorisでIcebergパーティションTableを作成する際は、Listパーティショニング構文を使用する必要がありますが、各パーティションを明示的に列挙する必要はありません。Dorisはデータ挿入時にデータ値に基づいて対応するIcebergパーティションを自動的に作成します。

  * 単一カラムまたは複数カラムのパーティションTableの作成をサポートします。

  * Icebergの暗黙的パーティショニングとパーティション進化を有効にするためのパーティション変換関数をサポートします。具体的なIcebergパーティション変換関数については、[Iceberg partition transforms](https://iceberg.apache.org/spec/#partition-transforms)を参照してください：

    * `year(ts)` または `years(ts)`

    * `month(ts)` または `months(ts)`

    * `day(ts)` または `days(ts)` または `date(ts)`

    * `hour(ts)` または `hours(ts)` または `date_hour(ts)`

    * `bucket(N, col)`

    * `truncate(L, col)`

* **ファイル形式**

  * Parquet (デフォルト)

    Dorisによって作成されたIcebergTableでは、Datetimeは`timestamp_ntz`型に対応することに注意してください。

    2.1.11および3.0.7以降のバージョンでは、Datetime型がParquetファイルに書き込まれる際、使用される物理型はINT96ではなくINT64です。
    
    また、IcebergTableが他のシステムによって作成された場合、`timestamp`型と`timestamp_ntz`型の両方がDoris Datetime型にマップされますが、書き込み時には実際の型に基づいてタイムゾーンの処理が必要かどうかを判断します。

  * ORC

* **圧縮形式**

  * Parquet: snappy、zstd (デフォルト)、plain (圧縮なし)。

  * ORC: snappy、zlib (デフォルト)、zstd、plain (圧縮なし)。

* **ストレージメディア**

  * HDFS

  * オブジェクトストレージ

### Schema Change

3.1.0以降、DorisはIcebergTableのスキーマ変更をサポートしており、`ALTER TABLE`文を使用して変更できます。

サポートされているスキーマ変更操作には以下があります：

* **カラムの名前変更**

`RENAME COLUMN`句を使用してカラムの名前を変更します。ネストされた型内のカラムの名前変更はサポートされていません。

```sql
ALTER TABLE iceberg_table RENAME COLUMN old_col_name TO new_col_name;
```
* **列の追加**

新しい列を追加するには`ADD COLUMN`を使用します。新しい列はTableの末尾に追加されます。ネストされた型への新しい列の追加はサポートされていません。

新しい列を追加する際、null許可属性、デフォルト値、およびコメントを指定できます。

```sql
ALTER TABLE iceberg_table ADD COLUMN col_name col_type [nullable, [default default_value, [comment 'comment']]];
```
例：

```sql
ALTER TABLE iceberg_table ADD COLUMN new_col STRING NOT NULL DEFAULT 'default_value' COMMENT 'This is a new col';
```
* **カラムの追加**

`ADD COLUMN`を使用して複数のカラムを追加することもできます。新しいカラムはTableの最後に追加されます。ネストした型への新しいカラムの追加はサポートされていません。

各カラムの構文は単一カラムを追加する場合と同じです。

```sql
ALTER TABLE iceberg_table ADD COLUMN (col_name1 col_type1 [nullable, [default default_value, [comment 'comment']]], col_name2 col_type2 [nullable, [default default_value, [comment 'comment']]] ...);
```
* **Drop Column**

`DROP COLUMN`を使用して列を削除します。ネストされた型内の列の削除はサポートされていません。

```sql
ALTER TABLE iceberg_table DROP COLUMN col_name;
```
* **列の変更**

`MODIFY COLUMN`文を使用して、型、null許可、デフォルト値、コメントを含む列の属性を変更します。

注意：列の属性を変更する際は、変更しない属性についても、元の値で明示的に指定する必要があります。

```sql
ALTER TABLE iceberg_table MODIFY COLUMN col_name col_type [nullable, [default default_value, [comment 'comment']]];
```

```sql
CREATE TABLE iceberg_table (
    id INT,
    name STRING
);
-- Modify the id column type to BIGINT, set as NOT NULL, default value to 0, and add comment
ALTER TABLE iceberg_table MODIFY COLUMN id BIGINT NOT NULL DEFAULT 0 COMMENT 'This is a modified id column';
```
* **列の並び替え**

`ORDER BY`を使用して、新しい列の順序を指定することで列を並び替えます。

```sql
ALTER TABLE iceberg_table ORDER BY (col_name1, col_name2, ...);
```
### Managing Branch & Tag

> Since 3.1.0

* **Create Branch**

  構文:

  ```sql
  ALTER TABLE [catalog.][database.]table_name
  CREATE [OR REPLACE] BRANCH [IF NOT EXISTS] <branch_name>
  [AS OF VERSION <snapshot_id>]
  [RETAIN <num> { DAYS | HOURS | MINUTES }]
  [WITH SNAPSHOT RETENTION { snapshotKeep | timeKeep }]

  snapshotKeep:
    <num> SNAPSHOTS [<num> { DAYS | HOURS | MINUTES }]

  timeKeep:
    <num> { DAYS | HOURS | MINUTES }
  ```
例:

  ```sql
  -- Create branch "b1".
  ALTER TABLE tbl CREATE BRANCH b1;
  ALTER TABLE tb1 CREATE BRANCH IF NOT EXISTS b1;
  -- Create or replace branch "b1".
  ALTER TABLE tb1 CREATE OR REPLACE BRANCH b1;
  -- Create or replace branch "b1" based on snapshot "123456".
  ALTER TABLE tb1 CREATE OR REPLACE BRANCH b1 AS OF VERSION 123456;
  -- Create or replace branch "b1" based on snapshot "123456", branch retained for 1 day.
  ALTER TABLE tb1 CREATE OR REPLACE BRANCH b1 AS OF VERSION 123456 RETAIN 1 DAYS;
  -- Create branch "b1" based on snapshot "123456", branch retained for 30 days. Keep the latest 3 snapshots in the branch.
  ALTER TABLE tb1 CREATE BRANCH b1 AS OF VERSION 123456 RETAIN 30 DAYS WITH SNAPSHOT RETENTION 3 SNAPSHOTS;
  -- Create branch "b1" based on snapshot "123456", branch retained for 30 days. Snapshots in the branch are retained for at most 2 days.
  ALTER TABLE tb1 CREATE BRANCH b1 AS OF VERSION 123456 RETAIN 30 DAYS WITH SNAPSHOT RETENTION 2 DAYS;
  -- Create branch "b1" based on snapshot "123456", branch retained for 30 days. Keep the latest 3 snapshots in the branch, and snapshots in the branch are retained for at most 2 days.
  ALTER TABLE tb1 CREATE BRANCH b1 AS OF VERSION 123456 RETAIN 30 DAYS WITH SNAPSHOT RETENTION 3 SNAPSHOTS 2 DAYS;
  ```
* **Drop Branch**

  構文:

  ```sql
  ALTER TABLE [catalog.][database.]table_name
  DROP BRANCH [IF EXISTS] <branch_name>;
  ```

  ```sql
  ALTER TABLE tbl DROP BRANCH b1;
  ```
* **Create Tag**

  構文:

  ```sql
  ALTER TABLE [catalog.][database.]table_name
  CREATE [OR REPLACE] TAG [IF NOT EXISTS] <tag_name>
  [AS OF VERSION <snapshot_id>]
  [RETAIN <num> { DAYS | HOURS | MINUTES }]
  ```
例:

  ```sql
  -- Create tag "t1".
  ALTER TABLE tbl CREATE TAG t1;
  ALTER TABLE tb1 CREATE TAG IF NOT EXISTS t1;
  -- Create or replace tag "t1".
  ALTER TABLE tb1 CREATE OR REPLACE TAG t1;
  -- Create or replace tag "t1" based on snapshot "123456".
  ALTER TABLE tb1 CREATE OR REPLACE TAG b1 AS OF VERSION 123456;
  -- Create or replace tag "b1" based on snapshot "123456", tag retained for 1 day.
  ALTER TABLE tb1 CREATE OR REPLACE TAG b1 AS OF VERSION 123456 RETAIN 1 DAYS;
  ```
* **Drop Tag**

  構文:

  ```sql
  ALTER TABLE [catalog.][database.]table_name
  DROP TAG [IF EXISTS] <tag_name>;
  ```

  ```sql
  ALTER TABLE tbl DROP TAG t1;
  ```
## Iceberg Table 最適化

### データファイル分散の確認

以下のSQLを使用してIcebergTableのデータ分散と削除ファイル数を分析し、Compactionなどの最適化が必要かどうかを判断することができます。

- データファイルサイズ分散を表示します。これにより、過剰に多くの

  ```sql
  SELECT
    CASE
      WHEN file_size_in_bytes BETWEEN 0 AND 8 * 1024 * 1024 THEN '0-8M'
      WHEN file_size_in_bytes BETWEEN 8 * 1024 * 1024 + 1 AND 32 * 1024 * 1024 THEN '8-32M'
      WHEN file_size_in_bytes BETWEEN 2 * 1024 * 1024 + 1 AND 128 * 1024 * 1024 THEN '32-128M'
      WHEN file_size_in_bytes BETWEEN 128 * 1024 * 1024 + 1 AND 512 * 1024 * 1024 THEN '128-512M'
      WHEN file_size_in_bytes > 512 * 1024 * 1024 THEN '> 512M'
      ELSE 'Unknown'
    END AS SizeRange,
    COUNT(*) AS FileNum
  FROM store_sales$data_files
  GROUP BY
    SizeRange;

  +-----------+---------+
  | SizeRange | FileNum |
  +-----------+---------+
  | 0-8M      |       8 |
  | 8-32M     |       6 |
  +-----------+---------+
  ```
- データファイル数と削除ファイル数を表示する

  ```sql
  SELECT
    CASE
      WHEN content = 0 THEN 'DataFile'
      WHEN content = 1 THEN 'PositionDeleteFile'
      WHEN content = 2 THEN 'EqualityDeleteFile'
      ELSE 'Unknown'
    END AS ContentType,
    COUNT(*) AS FileNum,
    SUM(file_size_in_bytes) AS SizeInBytes,
    SUM(record_count) AS Records
  FROM
    iceberg_table$files
  GROUP BY
    ContentType;

  +--------------------+---------+-------------+---------+
  | ContentType        | FileNum | SizeInBytes | Records |
  +--------------------+---------+-------------+---------+
  | EqualityDeleteFile |    2787 |     1432518 |   27870 |
  | DataFile           |    2787 |     4062416 |   38760 |
  | PositionDeleteFile |      11 |       36608 |   10890 |
  +--------------------+---------+-------------+---------+
  ```
### View Snapshot and Branch

```sql
SELECT
  refs_data.snapshot_id,
  snapshots.committed_at,
  snapshots.operation,
  ARRAY_SORT(refs_data.refs)
FROM (
  SELECT
    snapshot_id,
    ARRAY_AGG(CONCAT(type, ':', name)) AS refs
  FROM
    iceberg_table$refs
  GROUP BY
    snapshot_id
) AS refs_data
JOIN (
  SELECT
    snapshot_id,
    committed_at,
    operation
  FROM
    iceberg_table$snapshots
) AS snapshots
ON refs_data.snapshot_id = snapshots.snapshot_id
ORDER BY
  snapshots.committed_at;

+---------------------+----------------------------+-----------+-------------------------------------+
| snapshot_id         | committed_at               | operation | ARRAY_SORT(refs_data.refs)          |
+---------------------+----------------------------+-----------+-------------------------------------+
| 8272911997874079853 | 2025-07-10 15:27:07.177000 | append    | ["BRANCH:b1", "TAG:t1"]             |
| 1325777059626757917 | 2025-07-10 15:27:07.530000 | append    | ["BRANCH:b2", "TAG:t2"]             |
|   76492482642020578 | 2025-07-10 15:27:07.865000 | append    | ["BRANCH:b3", "TAG:t3"]             |
| 1788715857849070138 | 2025-07-12 04:15:19.626000 | append    | ["BRANCH:main", "TAG:t4", "TAG:t5"] |
+---------------------+----------------------------+-----------+-------------------------------------+
```
