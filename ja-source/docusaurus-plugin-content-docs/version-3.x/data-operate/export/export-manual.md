---
{
  "title": "Export Manual | Export",
  "sidebar_label": "Export Manual",
  "description": "この文書では、EXPORTコマンドを使用してDorisに保存されているデータをエクスポートする方法について説明します。",
  "language": "ja"
}
---
# Export Manual

このドキュメントでは、Dorisに格納されたデータをエクスポートするための`EXPORT`コマンドの使用方法を紹介します。

`Export`は、データを非同期でエクスポートするためにDorisが提供する機能です。この機能では、ユーザーが指定したtableやパーティションのデータを、指定されたファイル形式でオブジェクトストレージ、HDFS、またはローカルファイルシステムを含む対象ストレージシステムにエクスポートできます。

`Export`は非同期で実行されるコマンドです。コマンドが正常に実行されると、即座に結果が返されます。ユーザーは`Show Export`コマンドを通じてExportタスクの詳細情報を確認できます。

`EXPORT`コマンドの詳細な説明については、EXPORTを参照してください。

`SELECT INTO OUTFILE`と`EXPORT`のどちらを選択するかについては、[Export 概要](../../data-operate/export/export-overview.md)を参照してください。

## 適用可能なシナリオ

`Export`は以下のシナリオに適用できます：

- 大量のデータを含む単一tableのエクスポートで、シンプルなフィルタリング条件のみが必要な場合
- タスクを非同期で投入する必要があるシナリオ

`Export`を使用する際は以下の制限事項に注意してください：

- 現在、圧縮されたテキストファイル形式でのエクスポートはサポートされていません。
- `Select`の結果セットのエクスポートはサポートされていません。`Select`結果セットをエクスポートする必要がある場合は、[OUTFILE Export](../../data-operate/export/outfile.md)を使用してください。

## クイックスタート
### table作成とデータインポート

```sql
CREATE TABLE IF NOT EXISTS tbl (
    `c1` int(11) NULL,
    `c2` string NULL,
    `c3` bigint NULL
)
DISTRIBUTED BY HASH(c1) BUCKETS 20
PROPERTIES("replication_num" = "1");


insert into tbl values
    (1, 'doris', 18),
    (2, 'nereids', 20),
    (3, 'pipelibe', 99999),
    (4, 'Apache', 122123455),
    (5, null, null);
```
### Export Jobの作成

#### HDFSへのエクスポート

`tbl`TableからすべてのデータをHDFSにエクスポートします。エクスポートジョブのファイル形式をcsv（デフォルト形式）に設定し、列区切り文字を`,`に設定します。

```sql
EXPORT TABLE tbl
TO "hdfs://host/path/to/export/" 
PROPERTIES
(
    "line_delimiter" = ","
)
with HDFS (
    "fs.defaultFS"="hdfs://hdfs_host:port",
    "hadoop.username" = "hadoop"
);
```
#### Object Storageへのエクスポート

`tbl`Table内のすべてのデータをオブジェクトストレージにエクスポートし、エクスポートジョブのファイル形式をcsv（デフォルト形式）に設定し、列区切り文字を`,`に設定します。

```sql
EXPORT TABLE tbl TO "s3://bucket/export/export_" 
PROPERTIES (
    "line_delimiter" = ","
) WITH s3 (
    "s3.endpoint" = "xxxxx",
    "s3.region" = "xxxxx",
    "s3.secret_key"="xxxx",
    "s3.access_key" = "xxxxx"
);
```
### Export ジョブの確認

ジョブを送信した後、SHOW EXPORT コマンドを使用してexportジョブのステータスを照会できます。結果の例は以下の通りです：

```sql
mysql> show export\G
*************************** 1. row ***************************
      JobId: 143265
      Label: export_0aa6c944-5a09-4d0b-80e1-cb09ea223f65
      State: FINISHED
   Progress: 100%
   TaskInfo: {"partitions":[],"parallelism":5,"data_consistency":"partition","format":"csv","broker":"S3","column_separator":"\t","line_delimiter":"\n","max_file_size":"2048MB","delete_existing_files":"","with_bom":"false","db":"tpch1","tbl":"lineitem"}
       Path: s3://bucket/export/export_
 CreateTime: 2024-06-11 18:01:18
  StartTime: 2024-06-11 18:01:18
 FinishTime: 2024-06-11 18:01:31
    Timeout: 7200
   ErrorMsg: NULL
OutfileInfo: [
  [
    {
      "fileNumber": "1",
      "totalRows": "6001215",
      "fileSize": "747503989",
      "url": "s3://bucket/export/export_6555cd33e7447c1-baa9568b5c4eb0ac_*"
    }
  ]
]
1 row in set (0.00 sec)
```
`show export` コマンドの詳細な使用方法と返される結果の各列の意味については、SHOW EXPORT を参照してください。

### Export ジョブのキャンセル

Export ジョブを送信した後、Export タスクが成功または失敗する前に、CANCEL EXPORT コマンドを使用してエクスポートジョブをキャンセルできます。キャンセルコマンドの例は以下のとおりです：

```sql
CANCEL EXPORT FROM dbName WHERE LABEL like "%export_%";
```
## エクスポート手順

### エクスポートデータソース

`EXPORT`は現在、以下の種類のTableまたはビューのエクスポートをサポートしています：

- Dorisの内部Table
- Dorisの論理ビュー
- 外部カタログのTable

### エクスポートデータ保存場所

`Export`は現在、以下の保存場所へのエクスポートをサポートしています：

- オブジェクトストレージ：Amazon S3、COS、OSS、OBS、Google GCS
- HDFS

### エクスポートファイル形式

`EXPORT`は現在、以下のファイル形式でのエクスポートをサポートしています：

* Parquet
* ORC
* csv
* csv\_with\_names
* csv\_with\_names\_and\_types

## 例

### 高可用性が有効化されたHDFSクラスターへのエクスポート

HDFSで高可用性が有効化されている場合は、HA情報を提供する必要があります。例：

```sql
EXPORT TABLE tbl 
TO "hdfs://HDFS8000871/path/to/export_" 
PROPERTIES
(
    "line_delimiter" = ","
)
with HDFS (
    "fs.defaultFS" = "hdfs://HDFS8000871",
    "hadoop.username" = "hadoop",
    "dfs.nameservices" = "your-nameservices",
    "dfs.ha.namenodes.your-nameservices" = "nn1,nn2",
    "dfs.namenode.rpc-address.HDFS8000871.nn1" = "ip:port",
    "dfs.namenode.rpc-address.HDFS8000871.nn2" = "ip:port",
    "dfs.client.failover.proxy.provider.HDFS8000871" = "org.apache.hadoop.hdfs.server.namenode.ha.ConfiguredFailoverProxyProvider"
);
```
### 高可用性とKerberos認証が有効化されたHDFSクラスターへのエクスポート

HDFSクラスターで高可用性とKerberos認証の両方が有効化されている場合、以下のSQLステートメントを参照してください：

```sql
EXPORT TABLE tbl 
TO "hdfs://HDFS8000871/path/to/export_" 
PROPERTIES
(
    "line_delimiter" = ","
)
with HDFS (
    "fs.defaultFS"="hdfs://hacluster/",
    "hadoop.username" = "hadoop",
    "dfs.nameservices"="hacluster",
    "dfs.ha.namenodes.hacluster"="n1,n2",
    "dfs.namenode.rpc-address.hacluster.n1"="192.168.0.1:8020",
    "dfs.namenode.rpc-address.hacluster.n2"="192.168.0.2:8020",
    "dfs.client.failover.proxy.provider.hacluster"="org.apache.hadoop.hdfs.server.namenode.ha.ConfiguredFailoverProxyProvider",
    "dfs.namenode.kerberos.principal"="hadoop/_HOST@REALM.COM"
    "hadoop.security.authentication"="kerberos",
    "hadoop.kerberos.principal"="doris_test@REALM.COM",
    "hadoop.kerberos.keytab"="/path/to/doris_test.keytab"
);
```
### エクスポート対象のパーティション指定

エクスポートジョブは、Dorisの内部Tableの一部のパーティションのみをエクスポートすることをサポートしています。例えば、`test`Tableのパーティションp1とp2のみをエクスポートします。

```sql
EXPORT TABLE test
PARTITION (p1,p2)
TO "s3://bucket/export/export_" 
PROPERTIES (
    "columns" = "k1,k2"
) WITH s3 (
    "s3.endpoint" = "xxxxx",
    "s3.region" = "xxxxx",
    "s3.secret_key"="xxxx",
    "s3.access_key" = "xxxxx"
);
```
### Export中のデータフィルタリング

exportジョブは、export処理中に述語条件に従ってデータをフィルタリングし、条件を満たすデータのみをexportすることをサポートしています。例えば、`k1 < 50`という条件を満たすデータのみをexportします。

```sql
EXPORT TABLE test
WHERE k1 < 50
TO "s3://bucket/export/export_"
PROPERTIES (
    "columns" = "k1,k2",
    "column_separator"=","
) WITH s3 (
    "s3.endpoint" = "xxxxx",
    "s3.region" = "xxxxx",
    "s3.secret_key"="xxxx",
    "s3.access_key" = "xxxxx"
);
```
### External Table データのエクスポート

エクスポートジョブは 外部カタログ 内のTableのデータをサポートします。

```sql
-- Create a hive catalog
CREATE CATALOG hive_catalog PROPERTIES (
    'type' = 'hms',
    'hive.metastore.uris' = 'thrift://172.0.0.1:9083'
);

-- Export hive table
EXPORT TABLE hive_catalog.sf1.lineitem TO "s3://bucket/export/export_"
PROPERTIES(
    "format" = "csv",
    "max_file_size" = "1024MB"
) WITH s3 (
    "s3.endpoint" = "xxxxx",
    "s3.region" = "xxxxx",
    "s3.secret_key"="xxxx",
    "s3.access_key" = "xxxxx"
);
```
### Export前にExportディレクトリをクリアする

```sql
EXPORT TABLE test TO "s3://bucket/export/export_"
PROPERTIES (
    "format" = "parquet",
    "max_file_size" = "512MB",
    "delete_existing_files" = "true"
) WITH s3 (
    "s3.endpoint" = "xxxxx",
    "s3.region" = "xxxxx",
    "s3.secret_key"="xxxx",
    "s3.access_key" = "xxxxx"
);
```
`"delete_existing_files" = "true"`が設定されている場合、エクスポートジョブは最初に`s3://bucket/export/`ディレクトリ下のすべてのファイルとディレクトリを削除し、その後このディレクトリにデータをエクスポートします。

`delete_existing_files`パラメータを使用したい場合は、`fe.conf`に設定`enable_delete_existing_files = true`を追加し、FEを再起動する必要もあります。そうして初めて`delete_existing_files`が有効になります。この操作は外部システムのデータを削除するため、高リスクな操作です。外部システムの権限とデータセキュリティについては、ご自身で確保してください。

### エクスポートファイルのサイズ設定

エクスポートジョブは、エクスポートファイルのサイズ設定をサポートしています。単一ファイルのサイズが設定値を超える場合、指定されたサイズに従って複数のファイルに分割してエクスポートされます。

```sql
EXPORT TABLE test TO "s3://bucket/export/export_"
PROPERTIES (
    "format" = "parquet",
    "max_file_size" = "512MB"
) WITH s3 (
    "s3.endpoint" = "xxxxx",
    "s3.region" = "xxxxx",
    "s3.secret_key"="xxxx",
    "s3.access_key" = "xxxxx"
);
```
`"max_file_size" = "512MB"`を設定することで、単一のエクスポートファイルの最大サイズは512MBになります。

`max_file_size`は5MB未満にすることはできず、2GBを超えることもできません。

バージョン2.1.11および3.0.7では、2GBの最大制限が削除され、5MBの最小制限のみが残されました。

## 注意事項

* エクスポートデータ量

	一度に大量のデータをエクスポートすることは推奨されません。Exportジョブの推奨最大エクスポートデータ量は数十ギガバイトです。過度なエクスポートは、より多くのジャンクファイルとより高い再試行コストを招きます。Tableのデータ量が大きすぎる場合は、パーティション単位でエクスポートすることを推奨します。

	また、Exportジョブはデータをスキャンし、IOリソースを占有するため、システムのクエリレイテンシに影響を与える可能性があります。

* エクスポートファイル管理

	Exportジョブが失敗した場合、すでに生成されたファイルは削除されないため、ユーザーが手動で削除する必要があります。

* エクスポートタイムアウト

	エクスポートされるデータ量が非常に大きく、エクスポートタイムアウト期間を超える場合、Exportタスクは失敗します。この場合、Exportコマンドで`timeout`パラメータを指定してタイムアウト期間を延長し、Exportコマンドを再試行できます。

* エクスポート失敗

	Exportジョブの動作中にFEが再起動するかマスターが切り替わると、Exportジョブは失敗し、ユーザーが再送信する必要があります。`show export`コマンドでExportタスクのステータスを確認できます。

* エクスポートされるパーティション数

	Export Jobでエクスポート可能なパーティションの最大数は2000です。fe.confで`maximum_number_of_export_partitions`パラメータを追加し、FEを再起動してこの設定を変更できます。

* データ整合性

	エクスポート操作の完了後、エクスポートされたデータが完全で正確であるかを検証し、データの品質と整合性を確保することを推奨します。

## 付録

### 基本原理

Exportタスクの基盤レイヤーは`SELECT INTO OUTFILE` SQLステートメントの実行です。ユーザーがExportタスクを開始すると、DorisはExportでエクスポートするTableに応じて1つ以上の`SELECT INTO OUTFILE`実行計画を構築し、これらの`SELECT INTO OUTFILE`実行計画をDorisのJob Scheduleタスクスケジューラに送信します。Job Scheduleタスクスケジューラはこれらのタスクを自動的にスケジュールして実行します。

### ローカルファイルシステムへのエクスポート

ローカルファイルシステムへのエクスポート機能は、デフォルトで無効になっています。この機能はローカルでのデバッグと開発にのみ使用され、本番環境では使用すべきではありません。

この機能を有効にしたい場合は、`fe.conf`に`enable_outfile_to_local=true`を追加し、FEを再起動してください。

例：`tbl`Tableのすべてのデータをローカルファイルシステムにエクスポートし、エクスポートジョブのファイル形式をcsv（デフォルト形式）に設定し、列区切り文字を`,`に設定します。

```sql
EXPORT TABLE tbl TO "file:///path/to/result_"
PROPERTIES (
  "format" = "csv",
  "line_delimiter" = ","
);
```
この関数は、BEが配置されているノードのディスクにデータをエクスポートして書き込みます。複数のBEノードがある場合、エクスポートタスクの並行度に応じてデータは異なるBEノードに分散され、各ノードがデータの一部を保持します。

この例のように、最終的にBEノードの`/path/to/`の下に`result_7052bac522d840f5-972079771289e392_0.csv`のようなファイルセットが生成されます。

具体的なBEノードのIPは、`SHOW EXPORT`結果の`OutfileInfo`列で確認できます。例えば：

```
[
    [
        {
            "fileNumber": "1", 
            "totalRows": "0", 
            "fileSize": "8388608", 
            "url": "file:///172.20.32.136/path/to/result_7052bac522d840f5-972079771289e392_*"
        }
    ], 
    [
        {
            "fileNumber": "1", 
            "totalRows": "0", 
            "fileSize": "8388608", 
            "url": "file:///172.20.32.137/path/to/result_22aba7ec933b4922-ba81e5eca12bf0c2_*"
        }
    ]
]
```
:::caution
この関数は本番環境には適用できません。エクスポートディレクトリの権限とデータセキュリティについては、ご自身で確認してください。
:::
