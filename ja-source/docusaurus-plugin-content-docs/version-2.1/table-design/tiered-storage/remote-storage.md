---
{
  "title": "リモートストレージ",
  "language": "ja",
  "description": "リモートストレージは、コールドデータを外部ストレージ（オブジェクトストレージ、HDFSなど）に配置することをサポートしています。"
}
---
## 概要

リモートストレージは、外部ストレージ（オブジェクトストレージやHDFSなど）へのコールドデータの配置をサポートしています。

:::warning 注意
リモートストレージ内のデータはコピーが1つのみであり、データの信頼性はリモートストレージの信頼性に依存します。データの信頼性を確保するために、リモートストレージにイレージャーコーディング（EC）またはマルチレプリカ技術があることを確認する必要があります。
:::

## 使用方法

### S3互換ストレージへのコールドデータの保存

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
S3 RESOURCEを作成する際、RESOURCEの作成が正しく行われることを確認するために、S3リモートへのリンク検証が実行されます。
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
*ステップ3:* テーブル作成時にSTORAGE POLICYを使用する。

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
:::warning Note
UNIQUE tableで `"enable_unique_key_merge_on_write" = "true"` が設定されている場合、この機能は使用できません。
:::

### コールドデータをHDFSに保存する

*ステップ 1:* HDFS RESOURCE を作成する：

```sql
CREATE RESOURCE "remote_hdfs" PROPERTIES (
        "type"="hdfs",
        "fs.defaultFS"="fs_host:default_fs_port",
        "hadoop.username"="hive",
        "hadoop.password"="hive",
        "root_path"="/my/root/path",
        "dfs.nameservices" = "my_ha",
        "dfs.ha.namenodes.my_ha" = "my_namenode1, my_namenode2",
        "dfs.namenode.rpc-address.my_ha.my_namenode1" = "nn1_host:rpc_port",
        "dfs.namenode.rpc-address.my_ha.my_namenode2" = "nn2_host:rpc_port",
        "dfs.client.failover.proxy.provider.my_ha" = "org.apache.hadoop.hdfs.server.namenode.ha.ConfiguredFailoverProxyProvider"
    );
```
*ステップ2:* STORAGE POLICYを作成します。

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
UNIQUE tableが `"enable_unique_key_merge_on_write" = "true"` に設定されている場合、この機能は使用できません。
:::

### 既存のテーブルをリモートストレージにCooling

新しいテーブルでリモートストレージの設定をサポートすることに加えて、Doris は既存のテーブルやPARTITIONに対してリモートストレージを設定することもサポートしています。

既存のテーブルに対しては、作成したSTORAGE POLICYをテーブルに関連付けることでリモートストレージを設定します：

```sql
ALTER TABLE create_table_not_have_policy set ("storage_policy" = "test_policy");
```
既存のPARTITIONに対して、作成したSTORAGE POLICYをPARTITIONに関連付けることでリモートストレージを設定します：

```sql
ALTER TABLE create_table_partition MODIFY PARTITION (*) SET("storage_policy"="test_policy");
```
:::tip
テーブル作成時にユーザーがテーブル全体と一部のパーティションに対して異なるStorage Policyを指定した場合、パーティションに設定されたStorage Policyは無視され、テーブルのすべてのパーティションはテーブルのPolicyを使用することに注意してください。パーティションのPolicyを他と異なるものにする必要がある場合は、既存のパーティションにStorage Policyを関連付ける上記の方法を使用して変更できます。

詳細については、[RESOURCE](../../sql-manual/sql-statements/cluster-management/compute-management/CREATE-RESOURCE)、[STORAGE POLICY](../../sql-manual/sql-statements/cluster-management/storage-management/CREATE-STORAGE-POLICY)、[CREATE TABLE](../../sql-manual/sql-statements/table-and-view/table/CREATE-TABLE)、[ALTER TABLE](../../sql-manual/sql-statements/table-and-view/table/ALTER-TABLE-COLUMN)などのDocsディレクトリを参照してください。
:::

### Compactionの設定

-   BEパラメータ`cold_data_compaction_thread_num`は、リモートストレージCompactionの実行並行性を設定できます。デフォルトは2です。

-   BEパラメータ`cold_data_compaction_interval_sec`は、リモートストレージCompactionの実行時間間隔を設定できます。デフォルトは1800秒（30分）です。

## 制限事項

-   リモートストレージを使用するテーブルはバックアップをサポートしていません。

-   endpoint、bucket、pathなどのリモートストレージの場所情報の変更はサポートされていません。

-   Merge-on-Writeが有効になっているUniqueモデルテーブルは、リモートストレージをサポートしていません。

-   Storage policyは作成、変更、削除をサポートしています。storage policyを削除する前に、それを参照しているテーブルがないことを確認してください。

-   storage policyが設定されると、設定を解除することはできません。

## コールドデータ容量

### 表示

方法1：`show proc '/backends'`を通じて、各BEによってオブジェクトにアップロードされたサイズをRemoteUsedCapacityアイテムで表示できます。この方法には若干の遅延があります。

方法2：`show tablets from tableName`を通じて、テーブルが占有する各tabletのサイズをRemoteDataSizeアイテムで表示できます。

### ガベージコレクション

リモートストレージ上でガベージデータが生成される状況があります：

1.  Rowsetのアップロードは失敗したが、一部のセグメントは正常にアップロードされた場合。

2.  アップロードされたrowsetが複数のレプリカで合意に達しなかった場合。

3.  compaction完了後にcompactionに参加したRowset。

ガベージデータは即座にクリーンアップされません。BEパラメータ`remove_unused_remote_files_interval_sec`は、リモートストレージのガベージコレクションの時間間隔を設定でき、デフォルトは21600秒（6時間）です。

## クエリとパフォーマンスの最適化

クエリパフォーマンスを最適化し、オブジェクトストレージリソースを節約するために、ローカルCacheが導入されています。リモートストレージから初回データをクエリする際、Dorisはリモートストレージからデータを読み込み、キャッシュのためにBEのローカルディスクに保存します。Cacheには以下の特徴があります：

-   CacheはBEのローカルディスクに実際に保存され、メモリ空間を占有しません。

-   CacheはLRUで管理され、TTLはサポートしていません。

具体的な設定については、(../../lakehouse/data-cache)を参照してください。

## FAQ

1.  `ERROR 1105 (HY000): errCode = 2, detailMessage = Failed to create repository: connect to s3 failed: Unable to marshall request to JSON: host must not be null.`

S3 SDKはデフォルトでvirtual-hosted styleメソッドを使用します。ただし、一部のオブジェクトストレージシステム（MinIOなど）では、virtual-hosted styleアクセスが有効になっていないかサポートされていない場合があります。この場合、`use_path_style`パラメータを追加してpath styleメソッドの使用を強制できます：

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
2. クールダウン時間に関連するパラメータを変更した後、何が起こりますか？

   クールダウン関連パラメータの変更は、まだリモートストレージにクールダウンされていないデータに対してのみ有効になります。すでにリモートストレージにクールダウンされているデータには、変更は適用されません。例えば、`cooldown_ttl`を21日から7日に変更した場合、すでにリモートストレージにあるデータはローカルストレージに戻されることはありません。
