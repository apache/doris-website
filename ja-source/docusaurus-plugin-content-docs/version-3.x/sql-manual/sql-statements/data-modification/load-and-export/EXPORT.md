---
{
  "title": "EXPORT | ロードとエクスポート",
  "sidebar_label": "EXPORT",
  "description": "EXPORT コマンドは、指定されたtableからデータを指定された場所のファイルにエクスポートするために使用されます。",
  "language": "ja"
}
---
# EXPORT

## 説明

`EXPORT`コマンドは、指定されたtableからデータを指定された場所のファイルにエクスポートするために使用されます。現在、Brokerプロセス、S3プロトコル、またはHDFSプロトコルを通じて、HDFS、S3、BOS、COS（Tencent Cloud）などのリモートストレージへのエクスポートをサポートしています。

`EXPORT`は非同期操作です。このコマンドは`EXPORT JOB`をDorisに送信し、送信が成功するとすぐに戻ります。実行後は[SHOW EXPORT](./SHOW-EXPORT)コマンドを使用して進行状況を確認できます。

## 構文：

  ```sql
  EXPORT TABLE <table_name>
  [ PARTITION ( <partation_name> [ , ... ] ) ]
  [ <where_clause> ]
  TO <export_path>
  [ <properties> ]
  WITH <target_storage>
  [ <broker_properties> ];
  ```
## 必須パラメータ

**1. `<table_name>`**

  エクスポートするTableの名前。DorisローカルTable、ビュー、およびカタログ外部Tableからのデータエクスポートをサポートします。

**2. `<export_path>`**

  エクスポートファイルのパス。ディレクトリまたは`hdfs://path/to/my_file_`のようなファイルプレフィックス付きのファイルディレクトリを指定できます。

## オプションパラメータ

**1. `<where_clause>`**

  エクスポートするデータのフィルタ条件を指定できます。

**2. `<partation_name>`**

  指定したTableの特定のパーティションのみをエクスポートできます。DorisローカルTableでのみ有効です。

**3. `<properties>`**

  一部のエクスポートパラメータを指定するために使用されます。

  ```sql
  [ PROPERTIES ("<key>"="<value>" [, ... ]) ]
  ```
以下のパラメータを指定できます：
  - `label`: このExportタスクのLabelを指定するオプションパラメータ。指定されていない場合、システムがランダムにLabelを生成します。

  - `column_separator`: エクスポート用の列区切り文字を指定します。デフォルトは`\t`で、マルチバイトをサポートします。このパラメータはCSVファイル形式でのみ使用されます。

  - `line_delimiter`: エクスポート用の行区切り文字を指定します。デフォルトは`\n`で、マルチバイトをサポートします。このパラメータはCSVファイル形式でのみ使用されます。

  - `columns`: エクスポートTableの特定の列を指定します。

  - `format`: エクスポートジョブのファイル形式を指定します。サポートされているのは: parquet、orc、csv、csv_with_names、csv_with_names_and_typesです。デフォルトはCSV形式です。

  - `max_file_size`: エクスポートジョブの単一ファイルサイズ制限。結果がこの値を超える場合、複数のファイルに分割されます。`max_file_size`の値の範囲は[5MB、2GB]で、デフォルトは1GBです。（orcファイル形式でのエクスポートを指定する場合、実際の分割ファイルサイズは64MBの倍数になります。例：max_file_size = 5MBを指定すると実際には64MBで分割され、max_file_size = 65MBを指定すると実際には128MBで分割されます）

  - `parallelism`: エクスポートジョブの並行性。デフォルトは`1`です。エクスポートジョブは`parallelism`数のスレッドを開始して`select into outfile`文を実行します。（Parallelismの数がTable内のTablets数より大きい場合、システムは自動的にParallelismをTablets数のサイズに設定します。つまり、各`select into outfile`文は一つのTabletを担当します）

  - `delete_existing_files`: デフォルトは`false`です。`true`に指定された場合、`export_path`で指定されたディレクトリ内のすべてのファイルが最初に削除され、その後そのディレクトリにデータがエクスポートされます。例：「export_path」= "/user/tmp"の場合、"/user/"以下のすべてのファイルとディレクトリが削除されます。「file_path」= "/user/tmp/"の場合、"/user/tmp/"以下のすべてのファイルとディレクトリが削除されます。

  - `with_bom`: デフォルトは`false`です。`true`に指定された場合、エクスポートファイルのエンコーディングはBOM付きUTF8エンコーディングになります（csv関連ファイル形式でのみ有効）。

  - `data_consistency`: `none` / `partition`に設定できます。デフォルトは`partition`です。エクスポートTableをどの粒度で分割するかを示します。`none`はTabletsレベル、`partition`はPartitionレベルを表します。

  - `timeout`: エクスポートジョブのタイムアウト。デフォルトは2時間、単位は秒です。

  - `compress_type`: （2.1.5以降サポート）エクスポートファイル形式をParquet / ORCファイルとして指定する場合、Parquet / ORCファイルで使用される圧縮方法を指定できます。Parquetファイル形式では、SNAPPY、GZIP、BROTLI、ZSTD、LZ4、PLAINの圧縮方法を指定でき、デフォルト値はSNAPPYです。ORCファイル形式では、PLAIN、SNAPPY、ZLIB、ZSTDの圧縮方法を指定でき、デフォルト値はZLIBです。このパラメータはバージョン2.1.5以降サポートされています。（PLAINは無圧縮を意味します）。バージョン3.1.1以降、CSV形式の圧縮アルゴリズムの指定をサポートし、現在「plain」、「gz」、「bz2」、「snappyblock」、「lz4block」、「zstd」をサポートしています。

  :::caution 注意  
  delete_existing_filesパラメータを使用するには、fe.confに設定`enable_delete_existing_files = true`を追加してfeを再起動する必要があり、その後delete_existing_filesが有効になります。delete_existing_files = trueは危険な操作なので、テスト環境でのみ使用することを推奨します。  
  :::  

**4. `<target_storage>`**  
    ストレージメディア。オプションでBROKER、S3、HDFSがあります。  

**5. `<broker_properties>`**  
    `<target_storage>`の異なるストレージメディアに応じて、異なるプロパティを指定する必要があります。  

- **BROKER**  
  データはBrokerプロセスを通じてリモートストレージに書き込まれます。ここでBrokerが使用する関連接続情報を定義する必要があります。

  ```sql
  WITH BROKER "broker_name"
  ("<key>"="<value>" [,...])
  ```  
**Broker関連プロパティ:**  
  - `username`: ユーザー名
  - `password`: パスワード
  - `hadoop.security.authentication`: 認証方式をkerberosとして指定
  - `kerberos_principal`: kerberosプリンシパルを指定
  - `kerberos_keytab`: kerberosキータブファイルのパスを指定。このファイルはBrokerプロセスが配置されているサーバー上のファイルへの絶対パスである必要があり、Brokerプロセスからアクセス可能である必要があります

- **HDFS**  

  データはリモートHDFSに直接書き込むことができます。

  ```sql
  WITH HDFS ("<key>"="<value>" [,...])
  ```  
**HDFS関連プロパティ:**  
  - `fs.defaultFS`: namenodeアドレスとポート
  - `hadoop.username`: HDFSユーザー名
  - `dfs.nameservices`: ネームサービス名、hdfs-site.xmlと一致させる
  - `dfs.ha.namenodes.[nameservice ID]`: namenodeのIDリスト、hdfs-site.xmlと一致させる
  - `dfs.namenode.rpc-address.[nameservice ID].[name node ID]`: Name nodeのrpcアドレス、namenode数と同じ数、hdfs-site.xmlと一致させる   

  **kerberos認証が有効なHadoopクラスターの場合、以下の追加のPROPERTIES属性を設定する必要があります:**
  - `dfs.namenode.kerberos.principal`: HDFS namenodeサービスのプリンシパル名
  - `hadoop.security.authentication`: 認証方法をkerberosに設定
  - `hadoop.kerberos.principal`: DorisがHDFSに接続する際に使用するKerberosプリンシパルを設定
  - `hadoop.kerberos.keytab`: keytabのローカルファイルパスを設定  

- **S3**  

  データはリモートのS3オブジェクトストレージに直接書き込むことができます。

  ```sql
  WITH S3 ("<key>"="<value>" [,...])
  ```  
**S3関連プロパティ:**
  - `s3.endpoint`
  - `s3.region`
  - `s3.secret_key`
  - `s3.access_key`
  - `use_path_style`: (オプション) デフォルトは`false`。S3 SDKはデフォルトでVirtual-hosted Styleを使用します。ただし、一部のオブジェクトストレージシステムではVirtual-hosted Styleアクセスが有効化されていない、またはサポートされていない場合があります。この場合、`use_path_style`パラメータを追加してPath Styleアクセスの使用を強制できます。

## 戻り値

| カラム名              | 型     | 説明                                                                |
|---------------------|--------|----------------------------------------------------------------------|
| jobId               | long   | エクスポートジョブの一意識別子。                                        |
| label               | string | エクスポートジョブのラベル。                                           |
| dbId                | long   | データベースの識別子。                                                |
| tableId             | long   | Tableの識別子。                                                   |
| state               | string | ジョブの現在の状態。                                                  |
| path                | string | エクスポートファイルのパス。                                           |
| partitions          | string | エクスポートされたパーティション名のリスト、複数のパーティション名はカンマで区切られます。|
| progress            | int    | エクスポートジョブの現在の進捗（パーセンテージ）。                        |
| createTimeMs        | string | ジョブ作成時刻のミリ秒値、日時形式でフォーマットされます。                 |
| exportStartTimeMs   | string | エクスポートジョブ開始時刻のミリ秒値、日時形式でフォーマットされます。       |
| exportFinishTimeMs  | string | エクスポートジョブ終了時刻のミリ秒値、日時形式でフォーマットされます。       |
| failMsg             | string | エクスポートジョブが失敗した際のエラーメッセージ。                        |


## アクセス制御

このSQLコマンドを実行するユーザーは、少なくとも以下の権限を持っている必要があります：

| 権限        | オブジェクト   | 説明                                   |
|:------------|:-------------|:--------------------------------------|
| SELECT_PRIV | Database     | データベースとTableの読み取り権限が必要です。|


## 注意事項

### 並行実行

Exportジョブは`parallelism`パラメータを設定してデータを並行してエクスポートできます。`parallelism`パラメータは実際にはEXPORTジョブを実行するスレッド数を指定します。`"data_consistency" = "none"`が設定されている場合、各スレッドはTableのTabletsの一部をエクスポートする責任を持ちます。

Exportジョブの基盤となる実行ロジックは実際には`SELECT INTO OUTFILE`文です。`parallelism`パラメータで設定された各スレッドは独立した`SELECT INTO OUTFILE`文を実行します。

Exportジョブを複数の`SELECT INTO OUTFILE`に分割する具体的なロジックは：Tableのすべてのtabletsをすべての並行スレッドに均等に配布することです。例：
- num(tablets) = 40, parallelism = 3の場合、これら3つのスレッドはそれぞれ14、13、13のtabletsを担当します。
- num(tablets) = 2, parallelism = 3の場合、Dorisは自動的にparallelismを2に設定し、各スレッドが1つのtabletを担当します。

スレッドが担当するtabletsが`maximum_tablets_of_outfile_in_export`値（デフォルトは10、fe.confに`maximum_tablets_of_outfile_in_export`パラメータを追加して変更可能）を超える場合、そのスレッドは複数の`SELECT INTO OUTFILE`文に分割されます。例：
- あるスレッドが14のtabletsを担当し、`maximum_tablets_of_outfile_in_export = 10`の場合、このスレッドは2つの`SELECT INTO OUTFILE`文を担当します。最初の`SELECT INTO OUTFILE`文は10のtabletsをエクスポートし、2番目の`SELECT INTO OUTFILE`文は4のtabletsをエクスポートします。この2つの`SELECT INTO OUTFILE`文はこのスレッドによって順次実行されます。

エクスポートするデータ量が非常に大きい場合、`parallelism`パラメータを適切に増やして並行エクスポートを増やすことを検討できます。マシンのコア数が不足していて`parallelism`を増やせない一方で、エクスポートTableに多くのTabletsがある場合、`maximum_tablets_of_outfile_in_export`を増やして1つの`SELECT INTO OUTFILE`文が担当するtablets数を増やすことを検討でき、これによってもエクスポートを高速化できます。

Partition粒度でTableをエクスポートしたい場合、Exportプロパティ`"data_consistency" = "partition"`を設定できます。この場合、ExportタスクのConCurrentスレッドはPartition粒度で複数のOutfile文に分割されます。異なるOutfile文は異なるPartitionsをエクスポートし、同じOutfile文でエクスポートされるデータは同じPartitionに属している必要があります。例：`"data_consistency" = "partition"`を設定した後

- num(partition) = 40, parallelism = 3の場合、これら3つのスレッドはそれぞれ14、13、13のPartitionsを担当します。
- num(partition) = 2, parallelism = 3の場合、Dorisは自動的にParallelismを2に設定し、各スレッドが1つのPartitionを担当します。


### メモリ制限

通常、Exportジョブのクエリプランには`scan-export`の2つの部分のみがあり、過度なメモリを必要とする計算ロジックは含まれません。そのため、通常はデフォルトの2GBメモリ制限で要件を満たすことができます。

ただし、クエリプランが同じBE上で過度に多くのTabletsをスキャンする必要がある場合や、Tabletデータバージョンが多すぎる場合など、一部のシナリオではメモリ不足を引き起こす可能性があります。Session変数`exec_mem_limit`を調整してメモリ使用制限を増やすことができます。

### その他の注意事項

- 一度に大量のデータをエクスポートすることは推奨されません。1つのExportジョブで推奨される最大エクスポートデータ量は数十GBです。エクスポートが大きすぎると、より多くのガベージファイルと高い再試行コストが発生します。Tableデータ量が大きすぎる場合は、パーティション別にエクスポートすることを推奨します。

- Exportジョブが失敗した場合、すでに生成されたファイルは削除されず、ユーザーが手動で削除する必要があります。

- ExportジョブはデータをスキャンしてIOリソースを占有するため、システムのクエリレイテンシに影響する可能性があります。

- 現在Export中は、Tabletsバージョンが一致しているかどうかの簡単なチェックのみが実行されます。Export実行中はTableに対してデータインポート操作を実行しないことを推奨します。

- Export Jobでは最大2000パーティションのエクスポートが可能です。`fe.conf`にパラメータ`maximum_number_of_export_partitions`を追加してFEを再起動することでこの設定を変更できます。


## 例

### データのローカルエクスポート
> データをローカルファイルシステムにエクスポートするには、`fe.conf`に`enable_outfile_to_local=true`を追加してFEを再起動する必要があります。

- TestTableのすべてのデータをローカルストレージにエクスポート、デフォルトでCSV形式ファイルをエクスポート

```sql
EXPORT TABLE test TO "file:///home/user/tmp/";
```
- TestTableのK1、K2カラムをローカルストレージにエクスポートし、デフォルトでCSVファイル形式でエクスポートして、Labelを設定する

```sql
EXPORT TABLE test TO "file:///home/user/tmp/"
PROPERTIES (
  "label" = "label1",
  "columns" = "k1,k2"
);
```
- Test Tableで `k1 < 50` の行をローカルストレージにエクスポートし、デフォルトでは CSV 形式ファイルをエクスポートし、列区切り文字として `,` を使用する

```sql
EXPORT TABLE test WHERE k1 < 50 TO "file:///home/user/tmp/"
PROPERTIES (
  "columns" = "k1,k2",
  "column_separator"=","
);
```
- Test Tableのパーティション p1、p2 をローカルストレージにエクスポートし、デフォルトで csv 形式のファイルをエクスポートする

```sql
EXPORT TABLE test PARTITION (p1,p2) TO "file:///home/user/tmp/" 
PROPERTIES ("columns" = "k1,k2");
```
- Test Table内の全データをローカルストレージにエクスポートし、他の形式のファイルをエクスポートする

```sql
-- parquet
EXPORT TABLE test TO "file:///home/user/tmp/"
PROPERTIES (
  "columns" = "k1,k2",
  "format" = "parquet"
);

-- orc
EXPORT TABLE test TO "file:///home/user/tmp/"
PROPERTIES (
  "columns" = "k1,k2",
  "format" = "orc"
);

-- csv(csv_with_names) , Use 'AA' as the column separator and 'zz' as the row separator
EXPORT TABLE test TO "file:///home/user/tmp/"
PROPERTIES (
  "format" = "csv_with_names",
  "column_separator"="AA",
  "line_delimiter" = "zz"
);

-- csv(csv_with_names_and_types) 
EXPORT TABLE test TO "file:///home/user/tmp/"
PROPERTIES (
  "format" = "csv_with_names_and_types"
);
```
- `max_file_sizes`プロパティを設定する  
   エクスポートされたファイルが5MBより大きい場合、データは複数のファイルに分割され、各ファイルは最大5MBになります。

```sql
-- When the exported file is larger than 5MB, the data will be split into multiple files, with each file having a maximum size of 5MB.
EXPORT TABLE test TO "file:///home/user/tmp/"
PROPERTIES (
  "format" = "parquet",
  "max_file_size" = "5MB"
);
```
- `parallelism`プロパティを設定する

```sql
EXPORT TABLE test TO "file:///home/user/tmp/"
PROPERTIES (
  "format" = "parquet",
  "max_file_size" = "5MB",
  "parallelism" = "5"
);
```
- `delete_existing_files`プロパティを設定する  
    Exportがデータをエクスポートする際、まず`/home/user/`ディレクトリ配下のすべてのファイルとディレクトリを削除し、その後このディレクトリにデータをエクスポートします。

```sql
-- When exporting data, all files and directories under the `/home/user/` directory will be deleted first, and then the data will be exported to this directory.
EXPORT TABLE test TO "file:///home/user/tmp"
PROPERTIES (
  "format" = "parquet",
  "max_file_size" = "5MB",
  "delete_existing_files" = "true"
);
```
### S3へのエクスポート

- s3_testTableの全データをS3にエクスポートします。列または行の区切り文字として不可視文字`\x07`を使用します。minioにデータをエクスポートする必要がある場合は、`use_path_style`=`true`を指定する必要もあります。

```sql
EXPORT TABLE s3_test TO "s3://bucket/a/b/c" 
PROPERTIES (
  "column_separator"="\\x07", 
  "line_delimiter" = "\\x07"
) WITH S3 (
  "s3.endpoint" = "xxxxx",
  "s3.region" = "xxxxx",
  "s3.secret_key"="xxxx",
  "s3.access_key" = "xxxxx"
)
```
### HDFSへのエクスポート

- TestTableの全データをHDFSにエクスポートし、エクスポートファイル形式はParquet、エクスポートジョブの単一ファイルサイズ制限は512MB、指定されたディレクトリ内に全ファイルを保持します。

```sql
EXPORT TABLE test TO "hdfs://hdfs_host:port/a/b/c/" 
PROPERTIES(
    "format" = "parquet",
    "max_file_size" = "512MB",
    "delete_existing_files" = "false"
)
with HDFS (
"fs.defaultFS"="hdfs://hdfs_host:port",
"hadoop.username" = "hadoop"
);
```
### Broker Node を通じたエクスポート
まず Broker プロセスを開始し、この Broker を FE に追加する必要があります。
- Test Tableのすべてのデータを HDFS にエクスポートする

```sql
EXPORT TABLE test TO "hdfs://hdfs_host:port/a/b/c" 
WITH BROKER "broker_name" 
(
  "username"="xxx",
  "password"="yyy"
);
```
- testTblTableのパーティションp1,p2をHDFSにエクスポートし、","を列区切り文字として使用し、Labelを指定する

```sql
EXPORT TABLE testTbl PARTITION (p1,p2) TO "hdfs://hdfs_host:port/a/b/c" 
PROPERTIES (
  "label" = "mylabel",
  "column_separator"=","
) 
WITH BROKER "broker_name" 
(
  "username"="xxx",
  "password"="yyy"
);
```
- testTblTableの全データをHDFSにエクスポートし、列または行の区切り文字として不可視文字`\x07`を使用する。

```sql
EXPORT TABLE testTbl TO "hdfs://hdfs_host:port/a/b/c" 
PROPERTIES (
  "column_separator"="\\x07", 
  "line_delimiter" = "\\x07"
) 
WITH BROKER "broker_name" 
(
  "username"="xxx", 
  "password"="yyy"
)
```
