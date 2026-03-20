---
{
  "title": "エクスポート | エクスポート",
  "language": "ja",
  "description": "この文書では、Dorisに格納されているデータをエクスポートするためのEXPORTコマンドの使用方法を紹介します。",
  "sidebar_label": "EXPORT"
}
---
# EXPORT

このドキュメントでは、Dorisに格納されたデータをエクスポートするための`EXPORT`コマンドの使用方法を紹介します。

`Export`はDorisが提供する非同期でデータをエクスポートする機能です。この機能により、ユーザーが指定したテーブルまたはパーティションのデータを、指定したファイル形式でオブジェクトストレージ、HDFS、またはローカルファイルシステムを含む対象ストレージシステムにエクスポートできます。

`Export`は非同期で実行されるコマンドです。コマンドが正常に実行されると、すぐに結果が返されます。ユーザーは`Show Export`コマンドを通じてExportタスクの詳細情報を確認できます。

`EXPORT`コマンドの詳細な説明については、以下を参照してください：[EXPORT](../../sql-manual/sql-statements/data-modification/load-and-export/EXPORT)

`SELECT INTO OUTFILE`と`EXPORT`の選択方法については、[Export 概要](../../data-operate/export/export-overview.md)を参照してください。

## 適用シナリオ

`Export`は以下のシナリオに適用されます：

- 大量のデータを含む単一テーブルのエクスポートで、簡単なフィルタリング条件のみが必要な場合。
- 非同期でタスクを送信する必要があるシナリオ。

`Export`を使用する際は、以下の制限事項に注意してください：

- 現在、圧縮されたテキストファイル形式でのエクスポートはサポートされていません。
- `Select`の結果セットのエクスポートはサポートされていません。`Select`結果セットをエクスポートする必要がある場合は、[OUTFILE Export](../../data-operate/export/outfile.md)を使用してください。

## クイックスタート
### テーブル作成とデータインポート

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

`tbl`テーブルからすべてのデータをHDFSにエクスポートします。エクスポートジョブのファイル形式をcsv（デフォルト形式）に設定し、列区切り文字を`,`に設定します。

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

`tbl`テーブル内のすべてのデータをobject storageにエクスポートし、エクスポートジョブのファイル形式をcsv（デフォルト形式）に設定し、列区切り文字を`,`に設定します。

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

ジョブを送信した後、[SHOW EXPORT](../../sql-manual/sql-statements/data-modification/load-and-export/SHOW-EXPORT) コマンドを使用してexportジョブのステータスを照会できます。結果の例は以下の通りです：

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
`show export`コマンドの詳細な使用方法と返される結果の各列の意味については、[SHOW EXPORT](../../sql-manual/sql-statements/data-modification/load-and-export/SHOW-EXPORT)を参照してください。

### エクスポートジョブのキャンセル

Exportジョブを送信した後、Exportタスクが成功または失敗する前に、[CANCEL EXPORT](../../sql-manual/sql-statements/data-modification/load-and-export/CANCEL-EXPORT)コマンドを使用してエクスポートジョブをキャンセルできます。キャンセルコマンドの例は以下の通りです：

```sql
CANCEL EXPORT FROM dbName WHERE LABEL like "%export_%";
```
## Export手順

### Export データソース

`EXPORT`は現在、以下のタイプのテーブルまたはビューのエクスポートをサポートしています：

- Doris内部テーブル
- Doris論理ビュー
- External Catalogのテーブル

### Exportデータ保存場所

`Export`は現在、以下の保存場所へのエクスポートをサポートしています：

- オブジェクトストレージ：Amazon S3、COS、OSS、OBS、Google GCS
- HDFS

### Exportファイルタイプ

`EXPORT`は現在、以下のファイル形式へのエクスポートをサポートしています：

* Parquet
* ORC
* csv
* csv\_with\_names
* csv\_with\_names\_and\_types

## 例

### 高可用性が有効化されたHDFSクラスターへのExport

HDFSで高可用性が有効化されている場合、HA情報を提供する必要があります。例えば：

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

HDFSクラスターで高可用性とKerberos認証の両方が有効化されている場合は、以下のSQL文を参照してください：

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
### エクスポート用のパーティション指定

エクスポートジョブは、Doris内部テーブルの一部のパーティションのみをエクスポートすることをサポートしています。例えば、`test`テーブルのパーティションp1とp2のみをエクスポートします。

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
### エクスポート中のデータフィルタリング

エクスポートジョブは、エクスポート処理中に述語条件に従ってデータをフィルタリングし、条件を満たすデータのみをエクスポートすることをサポートしています。例えば、`k1 < 50`という条件を満たすデータのみをエクスポートします。

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
### External Tableデータのエクスポート

エクスポートジョブはExternal Catalog内のテーブルのデータをサポートします。

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
### エクスポート前にエクスポートディレクトリをクリアする

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

`delete_existing_files`パラメータを使用する場合は、`fe.conf`に設定`enable_delete_existing_files = true`も追加してFEを再起動する必要があります。そうして初めて`delete_existing_files`が有効になります。この操作は外部システムのデータを削除するものであり、高リスクな操作です。外部システムの権限とデータセキュリティについてはご自身で確保してください。

### エクスポートファイルのサイズ設定

エクスポートジョブは、エクスポートファイルのサイズ設定をサポートします。単一ファイルのサイズが設定値を超える場合、指定されたサイズに従って複数のファイルに分割してエクスポートされます。

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
`"max_file_size" = "512MB"`を設定することで、単一のエクスポートファイルの最大サイズを512MBにできます。

`max_file_size`は5MB未満にすることはできず、2GBを超えることもできません。

バージョン2.1.11および3.0.7では、2GBの最大制限が削除され、5MBの最小制限のみが残されています。

## 注意事項

* エクスポートデータ量

	一度に大量のデータをエクスポートすることは推奨されません。Exportジョブの推奨最大エクスポートデータ量は数十ギガバイトです。過度なエクスポートは、より多くのジャンクファイルとより高い再試行コストにつながります。テーブルデータ量が大きすぎる場合は、パーティション単位でエクスポートすることが推奨されます。

	また、Exportジョブはデータをスキャンし、IOリソースを占有するため、システムのクエリレイテンシに影響を与える可能性があります。

* エクスポートファイル管理

	Exportジョブが失敗した場合、既に生成されたファイルは削除されないため、ユーザーが手動で削除する必要があります。

* エクスポートタイムアウト

	エクスポートするデータ量が非常に大きく、エクスポートタイムアウト期間を超える場合、Exportタスクは失敗します。この場合、Exportコマンドで`timeout`パラメータを指定してタイムアウト期間を延長し、Exportコマンドを再試行できます。

* エクスポート失敗

	Exportジョブの実行中にFEが再起動またはマスターを切り替えると、Exportジョブは失敗し、ユーザーが再送信する必要があります。`show export`コマンドでExportタスクのステータスを確認できます。

* エクスポートパーティション数

	Export Jobでエクスポートが許可されるパーティションの最大数は2000です。fe.confで`maximum_number_of_export_partitions`パラメータを追加し、FEを再起動することでこの設定を変更できます。

* データ整合性

	エクスポート操作が完了した後は、エクスポートされたデータが完全で正確であるかを検証し、データの品質と整合性を確保することが推奨されます。

## 付録

### 基本原理

Exportタスクの基盤となるレイヤーは`SELECT INTO OUTFILE`SQL文を実行します。ユーザーがExportタスクを開始すると、DorisはExportでエクスポートするテーブルに応じて1つ以上の`SELECT INTO OUTFILE`実行プランを構築し、これらの`SELECT INTO OUTFILE`実行プランをDorisのJob Schedule タスクスケジューラーに送信します。Job Scheduleタスクスケジューラーは自動的にこれらのタスクをスケジュールして実行します。

### ローカルファイルシステムへのエクスポート

ローカルファイルシステムへのエクスポート機能は、デフォルトで無効になっています。この機能はローカルデバッグと開発にのみ使用され、本番環境では使用すべきではありません。

この機能を有効にしたい場合は、`fe.conf`に`enable_outfile_to_local=true`を追加し、FEを再起動してください。

例：`tbl`テーブルのすべてのデータをローカルファイルシステムにエクスポートし、エクスポートジョブのファイル形式をcsvに設定し（デフォルト形式）、列区切り文字を`,`に設定します。

```sql
EXPORT TABLE tbl TO "file:///path/to/result_"
PROPERTIES (
  "format" = "csv",
  "line_delimiter" = ","
);
```
この関数は、BEが配置されているノードのディスクにデータをエクスポートして書き込みます。複数のBEノードがある場合、データはエクスポートタスクの並行度に応じて異なるBEノードに分散され、各ノードがデータの一部を持つことになります。

この例では、最終的にBEノードの`/path/to/`の下に`result_7052bac522d840f5-972079771289e392_0.csv`のような一連のファイルが生成されます。

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
この関数は本番環境には適用できません。エクスポートディレクトリの権限とデータセキュリティについては、ご自身で確保してください。
:::
