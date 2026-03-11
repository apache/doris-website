---
{
  "title": "Hudi カタログ",
  "description": "Hudi カタログはHive カタログを再利用します。Hive MetastoreまたはHive Metastoreと互換性のあるメタデータサービスに接続することで、",
  "language": "ja"
}
---
Hudi カタログはHive カタログを再利用します。Hive Metastoreまたは hive Metastore と互換性のあるメタデータサービスに接続することで、DorisはHudiのデータベースとtable情報を自動的に取得し、データクエリを実行できます。

[Apache DorisとApache Hudiのクイックスタート](../best-practices/doris-hudi.md)。

## 適用可能なシナリオ

| シナリオ | 説明 |
| -------- | ----------- |
| クエリアクセラレーション | Dorisの分散コンピューティングエンジンを使用してHudiデータに直接アクセスし、クエリを高速化します。 |
| データ統合 | Hudiデータを読み取ってDoris内部tableに書き込む、またはDorisコンピューティングエンジンを使用してZeroETL操作を実行します。 |
| データ書き戻し | サポートされていません。 |

## カタログの設定

### 構文

```sql
CREATE CATALOG [IF NOT EXISTS] catalog_name PROPERTIES (
    'type' = 'hms', -- required
    'hive.metastore.uris' = '<metastore_thrift_url>', -- required
    {MetaStoreProperties},
    {StorageProperties},
    {HudiProperties},
    {CommonProperties}
);
```
* `[MetaStoreProperties]`

  MetaStorePropertiesセクションは、Metastoreメタデータサービスの接続と認証情報を記入するために使用されます。詳細については、[Supported Metadata Services]セクションを参照してください。

* `[StorageProperties]`

  StoragePropertiesセクションは、ストレージシステムに関連する接続と認証情報を記入するために使用されます。詳細については、[Supported Storage システム]セクションを参照してください。

* `[CommonProperties]`

  CommonPropertiesセクションは、共通プロパティを記入するために使用されます。[Common Properties]については、[データカタログ 概要](../catalog-overview.md)セクションを参照してください。

* `{HudiProperties}`

  | パラメータ名                  | 旧称                | デスクリプション                                                                                                                                               | デフォルト値 |
  | ------------------------------- | -------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------- |
  | `hudi.use_hive_sync_partition`  | `use_hive_sync_partition`  | Hive Metastoreによって既に同期されたパーティション情報を使用するかどうか。trueの場合、パーティション情報はHive Metastoreから直接取得されます。そうでなければ、ファイルシステムのメタデータファイルから取得されます。Hive Metastoreから情報を取得する方が効率的ですが、ユーザーは最新のメタデータがHive Metastoreに同期されていることを確認する必要があります。 | false |

### Supported Hudi Versions

現在依存しているHudiバージョンは0.15です。Hudiデータバージョン0.14以降へのアクセスを推奨します。

### Supported Query Types

| Table タイプ    | Supported Query Types                                                    |
| ------------- | ------------------------------------------------------------------------ |
| Copy On Write | Snapshot Query、Time Travel、Incremental Read                            |
| Merge On Read | Snapshot Queries、Read Optimized Queries、Time Travel、Incremental Read  |

### Supported Metadata Services

* [Hive Metastore](../metastores/hive-metastore.md)

### Supported Storage システム

* [HDFS](../storages/hdfs.md)
* [AWS S3](../storages/s3.md)
* [Google Cloud Storage](../storages/gcs.md)
* [Alibaba Cloud OSS](../storages/aliyun-oss.md)
* [Tencent Cloud COS](../storages/tencent-cos.md)
* [Huawei Cloud OBS](../storages/huawei-obs.md)
* [MINIO](../storages/minio.md)

### Supported Data Formats

* [Parquet](../file-formats/parquet.md)
* [ORC](../file-formats/orc.md)

## Column タイプ Mapping

| Hudi タイプ     | Doris タイプ    | Comment                                                   |
| ------------- | ------------- | --------------------------------------------------------- |
| boolean       | boolean       |                                                           |
| int           | int           |                                                           |
| long          | bigint        |                                                           |
| float         | float         |                                                           |
| double        | double        |                                                           |
| decimal(P, S) | decimal(P, S) |                                                           |
| bytes         | string        |                                                           |
| string        | string        |                                                           |
| date          | date          |                                                           |
| timestamp     | datetime(N)   | 精度に基づいてdatetime(3)またはdatetime(6)に自動的にマップされます |
| array         | array         |                                                           |
| map           | map           |                                                           |
| struct        | struct        |                                                           |
| other         | UNSUPPORTED   |                                                           |

## Examples

Hudi Catalogの作成は、Hive Catalogと似ています。より多くの例については、[Hive カタログ](./hive-catalog.mdx)を参照してください。

```sql
CREATE CATALOG hudi_hms PROPERTIES (
    'type'='hms',
    'hive.metastore.uris' = 'thrift://172.21.0.1:7004',
    'hadoop.username' = 'hive',
    'dfs.nameservices'='your-nameservice',
    'dfs.ha.namenodes.your-nameservice'='nn1,nn2',
    'dfs.namenode.rpc-address.your-nameservice.nn1'='172.21.0.2:4007',
    'dfs.namenode.rpc-address.your-nameservice.nn2'='172.21.0.3:4007',
    'dfs.client.failover.proxy.provider.your-nameservice'='org.apache.hadoop.hdfs.server.namenode.ha.ConfiguredFailoverProxyProvider'
);
```
## Query 運用

### Basic Query

Catalogが設定されると、以下の方法を使用してCatalog内のTableをクエリできます：

```sql
-- 1. switch to catalog, use database and query
SWITCH hudi_ctl;
USE hudi_db;
SELECT * FROM hudi_tbl LIMIT 10;

-- 2. use hudi database directly
USE hudi_ctl.hudi_db;
SELECT * FROM hudi_tbl LIMIT 10;

-- 3. use full qualified name to query
SELECT * FROM hudi_ctl.hudi_db.hudi_tbl LIMIT 10;
```
### Time Travel

Hudi Tableへのすべての書き込み操作は新しいスナップショットを作成します。Doris は Hudi Tableの指定されたスナップショットの読み取りをサポートしています。デフォルトでは、クエリリクエストは最新のスナップショットのみを読み取ります。

指定された Hudi Tableのタイムラインは `hudi_meta()` Table関数を使用してクエリできます：

このTable関数は 3.1.0 以降でサポートされています。

```sql
SELECT * FROM hudi_meta(
    'table' = 'hudi_ctl.hudi_db.hudi_tbl',
    'query_type' = 'timeline'
);

+-------------------+--------+--------------------------+-----------+-----------------------+
| timestamp         | action | file_name                | state     | state_transition_time |
+-------------------+--------+--------------------------+-----------+-----------------------+
| 20241202171214902 | commit | 20241202171214902.commit | COMPLETED | 20241202171215756     |
| 20241202171217258 | commit | 20241202171217258.commit | COMPLETED | 20241202171218127     |
| 20241202171219557 | commit | 20241202171219557.commit | COMPLETED | 20241202171220308     |
| 20241202171221769 | commit | 20241202171221769.commit | COMPLETED | 20241202171222541     |
| 20241202171224269 | commit | 20241202171224269.commit | COMPLETED | 20241202171224995     |
| 20241202171226401 | commit | 20241202171226401.commit | COMPLETED | 20241202171227155     |
| 20241202171228827 | commit | 20241202171228827.commit | COMPLETED | 20241202171229570     |
| 20241202171230907 | commit | 20241202171230907.commit | COMPLETED | 20241202171231686     |
| 20241202171233356 | commit | 20241202171233356.commit | COMPLETED | 20241202171234288     |
| 20241202171235940 | commit | 20241202171235940.commit | COMPLETED | 20241202171236757     |
+-------------------+--------+--------------------------+-----------+-----------------------+
```
`FOR TIME AS OF`文を使用して、スナップショットのタイムスタンプに基づいてデータの履歴バージョンを読み取ることができます。時刻形式はHudiドキュメントと一致しています。以下にいくつかの例を示します：

```sql
SELECT * FROM hudi_tbl FOR TIME AS OF "2022-10-07 17:20:37";
SELECT * FROM hudi_tbl FOR TIME AS OF "20221007172037";
SELECT * FROM hudi_tbl FOR TIME AS OF "2022-10-07";
```
HudiTableは`FOR VERSION AS OF`文をサポートしていないことに注意してください。HudiTableでこの構文を使用しようとするとエラーが発生します。

### Incremental Query

Incremental Readを使用すると、指定した時間範囲内のデータ変更をクエリでき、その期間の終了時点でのデータの最終状態を返します。

DorisはIncremental Readをサポートするために`@incr`構文を提供しています：

```sql
SELECT * from hudi_table@incr('beginTime'='xxx', ['endTime'='xxx'], ['hoodie.read.timeline.holes.resolution.policy'='FAIL'], ...);
```
* `beginTime`

  必須。時間形式はHudi公式の[hudi\_table\_changes](https://hudi.apache.org/docs/0.14.0/quick-start-guide/#incremental-query)と一致している必要があり、"earliest"をサポートしています。

* `endTime`

  オプション、デフォルトでは最新のcommitTimeになります。

`@incr`関数にはより多くのオプションを追加でき、[Spark Read Options](https://hudi.apache.org/docs/0.14.0/configurations#Read-Options)と互換性があります。

`desc`を使用して実行計画を表示すると、Dorisが`@incr`を`VHUDI_SCAN_NODE`にプッシュダウンされる述語に変換していることがわかります：

```text
|   0:VHUDI_SCAN_NODE(113)                                                                                            |
|      table: lineitem_mor                                                                                            |
|      predicates: (_hoodie_commit_time[#0] > '20240311151019723'), (_hoodie_commit_time[#0] <= '20240311151606605') |
|      inputSplitNum=1, totalFileSize=13099711, scanRanges=1              
```
## FAQ

1. JNIを使用してJava SKDで増分データを読み取る際にクエリがブロックされる

    `be.conf`内の`JAVA_OPTS_FOR_JDK_17`または`JAVA_OPTS`に`-Djol.skipHotspotSAAttach=true`を追加してください。

## 付録

### Change ログ

| Doris Version | Feature Support                               |
| ------------- | ---------------------------------------------- |
| 2.1.8/3.0.4   | Hudi依存関係を0.15にアップグレード。Hadoop Hudi JNI Scannerを追加。 |
