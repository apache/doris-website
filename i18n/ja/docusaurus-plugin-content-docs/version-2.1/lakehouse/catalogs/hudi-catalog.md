---
{
  "title": "Hudi カタログ",
  "language": "ja",
  "description": "Hudi CatalogはHive Catalogを再利用します。Hive Metastoreに接続するか、Hive Metastoreと互換性のあるメタデータサービスに接続することで、"
}
---
Hudi CatalogはHive Catalogを再利用します。Hive Metastore、またはHive Metastoreと互換性のあるメタデータサービスに接続することで、DorisはHudiのデータベースとテーブル情報を自動的に取得し、データクエリを実行できます。

[Apache DorisとApache Hudiのクイックスタート](../best-practices/doris-hudi.md)

## 適用シナリオ

| シナリオ | 説明 |
| -------- | ----------- |
| Query Acceleration | Dorisの分散コンピューティングエンジンを使用してHudiデータに直接アクセスし、クエリアクセラレーションを行います。 |
| Data Integration | Hudiデータを読み取ってDoris内部テーブルに書き込む、またはDorisコンピューティングエンジンを使用してZeroETL操作を実行します。 |
| Data Write-back | サポートされていません。 |

## Catalogの設定

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

  MetaStorePropertiesセクションは、Metastoreメタデータサービスの接続と認証情報を入力するために使用されます。詳細は[Supported Metadata Services]セクションを参照してください。

* `[StorageProperties]`

  StoragePropertiesセクションは、ストレージシステムに関連する接続と認証情報を入力するために使用されます。詳細は[Supported Storage Systems]セクションを参照してください。

* `[CommonProperties]`

  CommonPropertiesセクションは、共通プロパティを入力するために使用されます。[Common Properties]については、[Data Catalog Overview](../catalog-overview.md)セクションを参照してください。

* `{HudiProperties}`

  | パラメータ名                      | 旧名                       | 説明                                                                                                                                               | デフォルト値 |
  | ------------------------------- | -------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------- |
  | `hudi.use_hive_sync_partition`  | `use_hive_sync_partition`  | Hive Metastoreによって既に同期されているパーティション情報を使用するかどうか。trueの場合、パーティション情報はHive Metastoreから直接取得されます。そうでない場合、ファイルシステムのメタデータファイルから取得されます。Hive Metastoreから情報を取得する方が効率的ですが、ユーザーは最新のメタデータがHive Metastoreに同期されていることを確認する必要があります。 | false |

### サポートされているHudiバージョン

現在の依存Hudiバージョンは0.15です。Hudiデータバージョン0.14以上にアクセスすることを推奨します。

### サポートされているクエリタイプ

| テーブルタイプ    | サポートされているクエリタイプ                                                    |
| ------------- | ------------------------------------------------------------------------ |
| Copy On Write | Snapshot Query、Time Travel、Incremental Read                            |
| Merge On Read | Snapshot Queries、Read Optimized Queries、Time Travel、Incremental Read  |

### サポートされているメタデータサービス

* [Hive Metastore](../metastores/hive-metastore.md)

### サポートされているストレージシステム

* [HDFS](../storages/hdfs.md)
* [AWS S3](../storages/s3.md)
* [Google Cloud Storage](../storages/gcs.md)
* [Alibaba Cloud OSS](../storages/aliyun-oss.md)
* [Tencent Cloud COS](../storages/tencent-cos.md)
* [Huawei Cloud OBS](../storages/huawei-obs.md)
* [MINIO](../storages/minio.md)

### サポートされているデータフォーマット

* [Parquet](../file-formats/parquet.md)
* [ORC](../file-formats/orc.md)

## カラムタイプマッピング

| Hudiタイプ     | Dorisタイプ    | コメント                                                   |
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

## 例

Hudi Catalogの作成はHive Catalogに似ています。より多くの例については、[Hive Catalog](./hive-catalog.mdx)を参照してください。

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
## Query Operations

### Basic Query

Catalogが設定されると、以下の方法を使用してCatalog内のテーブルをクエリできます：

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

Hudi テーブルへのすべての書き込み操作は新しいスナップショットを作成します。Doris は Hudi テーブルの指定されたスナップショットの読み取りをサポートしています。デフォルトでは、クエリリクエストは最新のスナップショットのみを読み取ります。

`hudi_meta()` テーブル関数を使用して、指定された Hudi テーブルのタイムラインをクエリできます：

このテーブル関数は 3.1.0 以降でサポートされています。

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
`FOR TIME AS OF`文を使用して、スナップショットのタイムスタンプに基づいてデータの履歴バージョンを読み取ることができます。時間形式はHudiドキュメントと一致しています。以下にいくつかの例を示します：

```sql
SELECT * FROM hudi_tbl FOR TIME AS OF "2022-10-07 17:20:37";
SELECT * FROM hudi_tbl FOR TIME AS OF "20221007172037";
SELECT * FROM hudi_tbl FOR TIME AS OF "2022-10-07";
```
Hudiテーブルは`FOR VERSION AS OF`文をサポートしていないことに注意してください。Hudiテーブルでこの構文を使用しようとするとエラーが発生します。

### Incremental Query

Incremental Readは指定された時間範囲内でのデータ変更をクエリし、その期間の終了時点でのデータの最終状態を返すことができます。

Dorisは Incremental Readをサポートするために`@incr`構文を提供しています：

```sql
SELECT * from hudi_table@incr('beginTime'='xxx', ['endTime'='xxx'], ['hoodie.read.timeline.holes.resolution.policy'='FAIL'], ...);
```
* `beginTime`

  必須。時刻フォーマットはHudi公式の[hudi\_table\_changes](https://hudi.apache.org/docs/0.14.0/quick-start-guide/#incremental-query)と一致している必要があり、"earliest"をサポートします。

* `endTime`

  オプション、デフォルトは最新のcommitTimeです。

`@incr`関数にはより多くのオプションを追加でき、[Spark Read Options](https://hudi.apache.org/docs/0.14.0/configurations#Read-Options)と互換性があります。

`desc`を使用して実行プランを表示すると、Dorisが`@incr`を`VHUDI_SCAN_NODE`にプッシュダウンされる述語に変換していることがわかります：

```text
|   0:VHUDI_SCAN_NODE(113)                                                                                            |
|      table: lineitem_mor                                                                                            |
|      predicates: (_hoodie_commit_time[#0] > '20240311151019723'), (_hoodie_commit_time[#0] <= '20240311151606605') |
|      inputSplitNum=1, totalFileSize=13099711, scanRanges=1              
```
## FAQ

1. JNIを通じてJava SKDを使用して増分データを読み取る際にクエリがブロックされる

    `be.conf`の`JAVA_OPTS_FOR_JDK_17`または`JAVA_OPTS`に`-Djol.skipHotspotSAAttach=true`を追加してください。

## 付録

### 変更ログ

| Dorisバージョン | 機能サポート                               |
| ------------- | ---------------------------------------------- |
| 2.1.8/3.0.4   | Hudi依存関係を0.15にアップグレード。Hadoop Hudi JNI Scannerを追加。 |
