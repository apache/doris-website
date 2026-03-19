---
{
  "title": "リモートストレージ",
  "language": "ja",
  "description": "リモートストレージは、コールドデータを外部ストレージ（オブジェクトストレージ、HDFSなど）に配置することをサポートします。"
}
---
## 概要

リモートストレージは、コールドデータを外部ストレージ（オブジェクトストレージ、HDFSなど）に配置することをサポートします。

:::warning 注意
リモートストレージ内のデータはコピーが1つのみであり、データの信頼性はリモートストレージの信頼性に依存します。データの信頼性を確保するために、リモートストレージにerasure coding（EC）またはマルチレプリカ技術があることを確認する必要があります。
:::

## 使用方法

### コールドデータをS3互換ストレージに保存する

*ステップ1:* S3リソースを作成します。

```sql
CREATE RESOURCE "remote_s3"
PROPERTIES
(
    "type" = "s3",
    "s3.endpoint" = "bj.s3.com",
    "s3.region" = "bj",
    "s3.bucket" = "test-bucket",
    "s3.root.path" = "path/to/root",
    "s3.access_key" = "bbb",
    "s3.secret_key" = "aaaa",
    "s3.connection.maximum" = "50",
    "s3.connection.request.timeout" = "3000",
    "s3.connection.timeout" = "1000"
);
```
:::tip
S3 RESOURCEを作成する際、RESOURCEの作成が正しく行われることを確保するために、S3リモートへのリンク検証が実行されます。
:::

*ステップ2:* STORAGE POLICYを作成します。

次に、上記で作成したRESOURCEに関連付けられたSTORAGE POLICYを作成します：

```sql
CREATE STORAGE POLICY test_policy
PROPERTIES(
    "storage_resource" = "remote_s3",
    "cooldown_ttl" = "1d"
);
```
*Step 3:* テーブルを作成する際にSTORAGE POLICYを使用します。

```sql
CREATE TABLE IF NOT EXISTS create_table_use_created_policy 
(
    k1 BIGINT,
    k2 LARGEINT,
    v1 VARCHAR(2048)
)
UNIQUE KEY(k1)
DISTRIBUTED BY HASH (k1) BUCKETS 3
PROPERTIES(
    "enable_unique_key_merge_on_write" = "false",
    "storage_policy" = "test_policy"
);
```
:::warning 注意
UNIQUE テーブルで `"enable_unique_key_merge_on_write" = "true"` が設定されている場合、この機能は使用できません。
:::

### HDFS へのコールドデータの保存

*ステップ 1:* HDFS RESOURCE を作成する：

```sql
CREATE RESOURCE "remote_hdfs" PROPERTIES (
        "type"="hdfs",
        "fs.defaultFS"="fs_host:default_fs_port",
        "hadoop.username"="hive",
        "hadoop.password"="hive",
        "dfs.nameservices" = "my_ha",
        "dfs.ha.namenodes.my_ha" = "my_namenode1, my_namenode2",
        "dfs.namenode.rpc-address.my_ha.my_namenode1" = "nn1_host:rpc_port",
        "dfs.namenode.rpc-address.my_ha.my_namenode2" = "nn2_host:rpc_port",
        "dfs.client.failover.proxy.provider.my_ha" = "org.apache.hadoop.hdfs.server.namenode.ha.ConfiguredFailoverProxyProvider"
    );
```
*ステップ 2:* STORAGE POLICY を作成する。

```sql
CREATE STORAGE POLICY test_policy PROPERTIES (
    "storage_resource" = "remote_hdfs",
    "cooldown_ttl" = "300"
)
```
*ステップ3:* STORAGE POLICYを使用してテーブルを作成します。

```sql
CREATE TABLE IF NOT EXISTS create_table_use_created_policy (
    k1 BIGINT,
    k2 LARGEINT,
    v1 VARCHAR(2048)
)
UNIQUE KEY(k1)
DISTRIBUTED BY HASH (k1) BUCKETS 3
PROPERTIES(
"enable_unique_key_merge_on_write" = "false",
"storage_policy" = "test_policy"
);
```
:::warning Note
UNIQUEテーブルで`"enable_unique_key_merge_on_write" = "true"`が設定されている場合、この機能は使用できません。
:::

### 既存のテーブルのリモートストレージへのコールディング

新しいテーブルがリモートストレージの設定をサポートすることに加えて、DorisはPARTITIONまたは既存のテーブルに対してもリモートストレージの設定をサポートします。

既存のテーブルの場合、作成されたSTORAGE POLICYをテーブルに関連付けることでリモートストレージを設定します：

```sql
ALTER TABLE create_table_not_have_policy set ("storage_policy" = "test_policy");
```
既存のPARTITIONに対して、作成されたSTORAGE POLICYをPARTITIONに関連付けることで、リモートストレージを設定します：

```sql
ALTER TABLE create_table_partition MODIFY PARTITION (*) SET("storage_policy"="test_policy");
```
:::tip
テーブル作成時にユーザーがテーブル全体と一部のPartitionに対して異なるStorage Policyを指定した場合、Partitionに設定されたStorage Policyは無視され、テーブルのすべてのPartitionがテーブルのPolicyを使用することに注意してください。PartitionのPolicyを他と異ならせる必要がある場合は、既存のPartitionにStorage Policyを関連付ける上記の方法を使用して変更できます。

詳細については、[RESOURCE](../../sql-manual/sql-statements/cluster-management/compute-management/CREATE-RESOURCE)、[POLICY](../../sql-manual/sql-statements/cluster-management/storage-management/CREATE-STORAGE-POLICY)、[CREATE TABLE](../../sql-manual/sql-statements/table-and-view/table/CREATE-TABLE)、[ALTER TABLE](../../sql-manual/sql-statements/table-and-view/table/ALTER-TABLE-COLUMN)などのDocsディレクトリを参照してください。
:::

### Compactionの設定

-   BEパラメータ`cold_data_compaction_thread_num`では、リモートストレージCompactionを実行する際の並行性を設定でき、デフォルトは2です。

-   BEパラメータ`cold_data_compaction_interval_sec`では、リモートストレージCompactionを実行する時間間隔を設定でき、デフォルトは1800秒（30分）です。

## 制限事項

-   リモートストレージを使用するテーブルはbackupをサポートしていません。

-   endpoint、bucket、pathなどのリモートストレージの場所情報の変更はサポートされていません。

-   Merge-on-Writeが有効なUniqueモデルテーブルはリモートストレージをサポートしていません。

-   ストレージポリシーは作成、変更、削除をサポートしています。ストレージポリシーを削除する前に、それを参照しているテーブルがないことを確認してください。

-   ストレージポリシーが一度設定されると、設定を解除することはできません。

## Cold Dataスペース

### 表示

方法1：`show proc '/backends'`を通じて各BEがオブジェクトにアップロードしたサイズをRemoteUsedCapacityアイテムで確認できます。この方法には若干の遅延があります。

方法2：`show tablets from tableName`を通じてテーブルが占有する各tabletのサイズをRemoteDataSizeアイテムで確認できます。

### ガベージコレクション

リモートストレージでガベージデータが生成される可能性がある状況：

1.  Rowsetアップロードが失敗したが、一部のsegmentは正常にアップロードされた場合。

2.  アップロードされたrowsetが複数のレプリカでコンセンサスに達しなかった場合。

3.  compaction完了後にcompactionに参加したrowset。

ガベージデータはすぐにはクリーンアップされません。BEパラメータ`remove_unused_remote_files_interval_sec`では、リモートストレージでのガベージコレクションの時間間隔を設定でき、デフォルトは21600秒（6時間）です。

## クエリとパフォーマンス最適化

クエリパフォーマンスを最適化し、オブジェクトストレージリソースを節約するために、ローカルCacheが導入されました。リモートストレージからデータを初回クエリする際、DorisはリモートストレージからデータをBEのローカルディスクに読み込んでキャッシュします。Cacheには以下の特徴があります：

-   Cacheは実際にBEのローカルディスクに保存され、メモリ領域を占有しません。

-   CacheはLRUによって管理され、TTLはサポートしていません。

具体的な設定については、(../../lakehouse/data-cache)を参照してください。

## FAQ

1.  `ERROR 1105 (HY000): errCode = 2, detailMessage = Failed to create repository: connect to s3 failed: Unable to marshall request to JSON: host must not be null.`

S3 SDKはデフォルトでvirtual-hosted style方式を使用します。しかし、一部のオブジェクトストレージシステム（MinIOなど）では、virtual-hosted styleアクセスが有効化またはサポートされていない可能性があります。この場合、`use_path_style`パラメータを追加してpath style方式の使用を強制できます：

```sql
CREATE RESOURCE "remote_s3"
PROPERTIES
(
    "type" = "s3",
    "s3.endpoint" = "bj.s3.com",
    "s3.region" = "bj",
    "s3.bucket" = "test-bucket",
    "s3.root.path" = "path/to/root",
    "s3.access_key" = "bbb",
    "s3.secret_key" = "aaaa",
    "s3.connection.maximum" = "50",
    "s3.connection.request.timeout" = "3000",
    "s3.connection.timeout" = "1000",
    "use_path_style" = "true"
);
```
2. クールダウン時間に関連するパラメータを変更すると何が起こりますか？

   クールダウン関連パラメータの変更は、まだリモートストレージにクールされていないデータに対してのみ有効になります。既にリモートストレージにクールされたデータに対しては、変更は適用されません。例えば、`cooldown_ttl`を21日から7日に変更しても、既にリモートストレージにあるデータはローカルストレージに戻されることはありません。
