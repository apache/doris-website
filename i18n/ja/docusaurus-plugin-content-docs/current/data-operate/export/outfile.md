---
{
  "title": "SELECT INTO OUTFILE",
  "language": "ja",
  "description": "このドキュメントでは、SELECT INTO OUTFILEコマンドを使用してクエリ結果のエクスポート操作を実行する方法を紹介します。"
}
---
このドキュメントでは、クエリ結果のエクスポート操作を実行するための`SELECT INTO OUTFILE`コマンドの使用方法を紹介します。

`SELECT INTO OUTFILE`コマンドは、`SELECT`部分の結果データを、オブジェクトストレージやHDFSを含む指定されたファイル形式でターゲットストレージシステムにエクスポートします。

`SELECT INTO OUTFILE`は同期コマンドで、コマンドの戻りはエクスポートが完了したことを意味します。エクスポートが成功した場合、エクスポートされたファイルの数、サイズ、パスなどの情報が返されます。エクスポートが失敗した場合は、エラー情報が返されます。

`SELECT INTO OUTFILE`と`EXPORT`の選択方法については、[Export 概要](./export-overview.md)を参照してください。

`SELECT INTO OUTFILE`コマンドの詳細な説明については、以下を参照してください：[SELECT INTO OUTFILE](../../sql-manual/sql-statements/data-modification/load-and-export/OUTFILE)

## 適用可能なシナリオ

`SELECT INTO OUTFILE`は以下のシナリオに適用されます：

- エクスポートされるデータがフィルタリング、集計、結合などの複雑な計算ロジックを通る必要がある場合。
- 同期タスクを実行する必要があるシナリオに適しています。

`SELECT INTO OUTFILE`を使用する際は、以下の制限事項に注意してください：

- テキストの圧縮形式はサポートされていません。
- バージョン2.1のpipelineエンジンは並行エクスポートをサポートしていません。

## クイックスタート
### テーブルの作成とデータのインポート

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
### HDFSへのエクスポート

クエリ結果を`hdfs://path/to/`ディレクトリにエクスポートし、エクスポート形式をParquetとして指定します：

```sql
SELECT c1, c2, c3 FROM tbl
INTO OUTFILE "hdfs://ip:port/path/to/result_"
FORMAT AS PARQUET
PROPERTIES
(
    "fs.defaultFS" = "hdfs://ip:port",
    "hadoop.username" = "hadoop"
);
```
### Object Storageへのエクスポート

クエリ結果を s3 ストレージの `s3://bucket/export/` ディレクトリにエクスポートし、エクスポート形式を ORC として指定します。`sk`（secret key）や `ak`（access key）などの情報を提供する必要があります。

```sql
SELECT * FROM tbl
INTO OUTFILE "s3://bucket/export/result_"
FORMAT AS ORC
PROPERTIES(
    "s3.endpoint" = "xxxxx",
    "s3.region" = "xxxxx",
    "s3.secret_key"="xxxx",
    "s3.access_key" = "xxxxx"
);
```
## エクスポート手順

### エクスポート先

`SELECT INTO OUTFILE`は現在、以下のストレージ場所へのエクスポートをサポートしています：

- Object Storage: Amazon S3, COS, OSS, OBS, Google GCS
- HDFS

### サポートされるファイル形式

`SELECT INTO OUTFILE`は現在、以下のファイル形式のエクスポートをサポートしています：

* Parquet
* ORC
* csv
* csv\_with\_names
* csv\_with\_names\_and\_types

### エクスポートの並行性

セッション変数`enable_parallel_outfile`を通じて並行エクスポートを有効にできます。

`SET enable_parallel_outfile=true;`

並行エクスポートは、マルチノードとマルチスレッドを使用して結果データをエクスポートし、全体的なエクスポートスループットを向上させます。ただし、並行エクスポートはより多くのファイルを生成する可能性があります。

この変数が有効になっていても、グローバルソートを含むクエリなど、一部のクエリは並行エクスポートを実行できないことに注意してください。エクスポートコマンドが返す行数が1より大きい場合、並行エクスポートが有効になっていることを意味します。

## エクスポート例

### 高可用性が有効なHDFSクラスターへのエクスポート

HDFSで高可用性が有効になっている場合、以下のようなHA（High Availability）情報を提供する必要があります：

```sql
SELECT c1, c2, c3 FROM tbl
INTO OUTFILE "hdfs://HDFS8000871/path/to/result_"
FORMAT AS PARQUET
PROPERTIES
(
    "fs.defaultFS" = "hdfs://HDFS8000871",
    "hadoop.username" = "hadoop",
    "dfs.nameservices" = "your-nameservices",
    "dfs.ha.namenodes.your-nameservices" = "nn1,nn2",
    "dfs.namenode.rpc-address.HDFS8000871.nn1" = "ip:port",
    "dfs.namenode.rpc-address.HDFS8000871.nn2" = "ip:port",
    "dfs.client.failover.proxy.provider.HDFS8000871" = "org.apache.hadoop.hdfs.server.namenode.ha.ConfiguredFailoverProxyProvider"
);
```
### 高可用性とKerberos認証が有効なHDFSクラスターへのエクスポート

HDFSクラスターで高可用性が有効になっており、Kerberos認証が有効になっている場合は、以下のSQL文を参照してください：

```sql
SELECT * FROM tbl
INTO OUTFILE "hdfs://path/to/result_"
FORMAT AS PARQUET
PROPERTIES
(
    "fs.defaultFS"="hdfs://hacluster/",
    "hadoop.username" = "hadoop",
    "dfs.nameservices"="hacluster",
    "dfs.ha.namenodes.hacluster"="n1,n2",
    "dfs.namenode.rpc-address.hacluster.n1"="192.168.0.1:8020",
    "dfs.namenode.rpc-address.hacluster.n2"="192.168.0.2:8020",
    "dfs.client.failover.proxy.provider.hacluster"="org.apache.hadoop.hdfs.server.namenode.ha.ConfiguredFailoverProxyProvider",
    "dfs.namenode.kerberos.principal"="hadoop/_HOST@REALM.COM",
    "hadoop.security.authentication"="kerberos",
    "hadoop.kerberos.principal"="doris_test@REALM.COM",
    "hadoop.kerberos.keytab"="/path/to/doris_test.keytab"
);
```
### エクスポート成功インジケーターファイルの生成

`SELECT INTO OUTFILE`コマンドは同期コマンドです。そのため、SQLの実行中にタスク接続が切断される可能性があり、エクスポートされたデータが正常に終了したか、または完了しているかを知ることができない場合があります。このような場合、`success_file_name`パラメーターを使用して、エクスポートが成功した後にディレクトリ内にファイルインジケーターを生成することを要求できます。

Hiveと同様に、ユーザーはエクスポートディレクトリ内に`success_file_name`パラメーターで指定されたファイルが存在するかどうかを確認することで、エクスポートが正常に終了したか、およびエクスポートディレクトリ内のファイルが完全であるかを判断できます。

例：selectステートメントのクエリ結果をオブジェクトストレージ`s3://bucket/export/`にエクスポートします。エクスポート形式を`csv`として指定します。エクスポート成功インジケーターファイルの名前を`SUCCESS`として指定します。エクスポートが完了すると、インジケーターファイルが生成されます。

```sql
SELECT k1,k2,v1 FROM tbl1 LIMIT 100000
INTO OUTFILE "s3://bucket/export/result_"
FORMAT AS CSV
PROPERTIES
(
    "s3.endpoint" = "xxxxx",
    "s3.region" = "xxxxx",
    "s3.secret_key"="xxxx",
    "s3.access_key" = "xxxxx",
    "column_separator" = ",",
    "line_delimiter" = "\n",
    "success_file_name" = "SUCCESS"
);
```
エクスポートが完了すると、もう1つのファイルが書き込まれ、このファイルのファイル名は`SUCCESS`です。

### エクスポート前にエクスポートディレクトリをクリアする

```sql
SELECT * FROM tbl1
INTO OUTFILE "s3://bucket/export/result_"
FORMAT AS CSV
PROPERTIES
(
    "s3.endpoint" = "xxxxx",
    "s3.region" = "xxxxx",
    "s3.secret_key"="xxxx",
    "s3.access_key" = "xxxxx",
    "column_separator" = ",",
    "line_delimiter" = "\n",
    "delete_existing_files" = "true"
);
```
`"delete_existing_files" = "true"`が設定されている場合、エクスポートジョブはまず`s3://bucket/export/`ディレクトリ下のすべてのファイルとディレクトリを削除してから、このディレクトリにデータをエクスポートします。

`delete_existing_files`パラメータを使用する場合は、`fe.conf`に設定`enable_delete_existing_files = true`を追加してFEを再起動する必要もあります。その後、`delete_existing_files`パラメータが有効になります。この操作は外部システムのデータを削除するため、高リスクな操作です。外部システムの権限とデータセキュリティについてはご自身で確保してください。


### エクスポートファイルのサイズ設定

```sql
SELECT * FROM tbl
INTO OUTFILE "s3://path/to/result_"
FORMAT AS ORC
PROPERTIES(
    "s3.endpoint" = "xxxxx",
    "s3.region" = "xxxxx",
    "s3.secret_key"="xxxx",
    "s3.access_key" = "xxxxx",
    "max_file_size" = "2048MB"
);
```
`"max_file_size" = "2048MB"`が指定されているため、最終的に生成されるファイルが2GBを超えない場合は、ファイルは1つだけになります。2GBを超える場合は、複数のファイルになります。

## 注意

1. エクスポートデータ量とエクスポート効率

	`SELECT INTO OUTFILE`機能は本質的にSQLクエリコマンドを実行しています。並行エクスポートが有効でない場合、クエリ結果は単一のBEノードで単一スレッドによってエクスポートされます。そのため、全体のエクスポート時間には、クエリ自体が消費する時間と最終結果セットの書き出しが消費する時間が含まれます。並行エクスポートを有効にすることで、エクスポート時間を短縮できます。

2. エクスポートタイムアウト

	エクスポートコマンドのタイムアウト期間は、クエリのタイムアウト期間と同じです。大量のデータによりエクスポートデータがタイムアウトする場合、セッション変数`query_timeout`を設定してクエリタイムアウト期間を適切に延長できます。

3. エクスポートされたファイルの管理

	Dorisはエクスポートされたファイルを管理しません。ファイルが正常にエクスポートされたか、失敗したエクスポート後に残されたかにかかわらず、ユーザーが自分で処理する必要があります。

	さらに、`SELECT INTO OUTFILE`コマンドは、ファイルやファイルパスが存在するかどうかをチェックしません。`SELECT INTO OUTFILE`コマンドが自動的にパスを作成するか、既存のファイルを上書きするかは、完全にリモートストレージシステムのセマンティクスによって決定されます。

4. クエリ結果セットが空の場合

	結果セットが空のエクスポートの場合、空のファイルが生成されます。

5. ファイル分割

	ファイル分割により、1行のデータが完全に1つのファイルに格納されることが保証されます。そのため、ファイルのサイズは`max_file_size`と厳密に等しくありません。

6. 非可視文字を持つ関数

	BITMAPやHLL型などの出力が非可視文字である一部の関数では、CSVファイル形式にエクスポートする際、出力は`\N`になります。

## 付録

### ローカルファイルシステムへのエクスポート

ローカルファイルシステムへのエクスポート機能は、デフォルトでオフになっています。この機能はローカルでのデバッグと開発にのみ使用され、本番環境では使用すべきではありません。

この機能を有効にしたい場合は、`fe.conf`に`enable_outfile_to_local=true`を追加してFEを再起動してください。

例：tblテーブルのすべてのデータをローカルファイルシステムにエクスポートし、エクスポートジョブのファイル形式をcsv（デフォルト形式）に設定し、列区切り文字を`,`に設定します。

```sql
SELECT c1, c2 FROM db.tbl
INTO OUTFILE "file:///path/to/result_"
FORMAT AS CSV
PROPERTIES(
    "column_separator" = ","
);
```
この関数は、BEが配置されているノードのディスクにデータをエクスポートして書き込みます。複数のBEノードがある場合、データはエクスポートタスクの並行性に応じて異なるBEノード上に分散され、各ノードがデータの一部を持つことになります。

この例では、BEノードの `/path/to/` の下に `result_c6df5f01bd664dde-a2168b019b6c2b3f_0.csv` のようなファイルセットが最終的に生成されます。

具体的なBEノードのIPは、以下のように返される結果に表示されます：

```
+------------+-----------+----------+--------------------------------------------------------------------------+
| FileNumber | TotalRows | FileSize | URL                                                                      |
+------------+-----------+----------+--------------------------------------------------------------------------+
|          1 |   1195072 |  4780288 | file:///172.20.32.136/path/to/result_c6df5f01bd664dde-a2168b019b6c2b3f_* |
|          1 |   1202944 |  4811776 | file:///172.20.32.136/path/to/result_c6df5f01bd664dde-a2168b019b6c2b40_* |
|          1 |   1198880 |  4795520 | file:///172.20.32.137/path/to/result_c6df5f01bd664dde-a2168b019b6c2b43_* |
|          1 |   1198880 |  4795520 | file:///172.20.32.137/path/to/result_c6df5f01bd664dde-a2168b019b6c2b45_* |
+------------+-----------+----------+--------------------------------------------------------------------------+
```
:::caution
この機能は本番環境には適していません。エクスポートディレクトリの権限とデータセキュリティについては、ご自身で確保してください。
:::
