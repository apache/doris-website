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

`EXPORT`コマンドは、指定されたtableから指定された場所のファイルにデータをエクスポートするために使用されます。現在、Brokerプロセス、S3プロトコル、またはHDFSプロトコルを通じて、HDFS、S3、BOS、COS（Tencent Cloud）などのリモートストレージへのエクスポートをサポートしています。

`EXPORT`は非同期操作です。このコマンドは`EXPORT JOB`をDorisに送信し、送信が成功すると即座に戻ります。実行後の進捗状況を確認するには、[SHOW EXPORT](./SHOW-EXPORT)コマンドを使用できます。

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

  エクスポート対象のTable名。DorisローカルTable、ビュー、カタログ外部Tableからのデータエクスポートをサポートします。

**2. `<export_path>`**

  エクスポートファイルのパス。ディレクトリまたは`hdfs://path/to/my_file_`のようにファイル接頭辞を含むファイルディレクトリを指定できます。

## オプションパラメータ

**1. `<where_clause>`**

  エクスポートデータのフィルタ条件を指定できます。

**2. `<partation_name>`**

  指定されたTableの特定のパーティションのみをエクスポートできます。DorisローカルTableのみ有効です。

**3. `<properties>`**

  一部のエクスポートパラメータを指定するために使用されます。

  ```sql
  [ PROPERTIES ("<key>"="<value>" [, ... ]) ]
  ```
以下のパラメータを指定できます：
  - `label`: このExportタスクのLabelを指定するオプションパラメータ。指定されない場合、システムはランダムにLabelを生成します。

  - `column_separator`: エクスポート用の列区切り文字を指定します。デフォルトは `\t` で、マルチバイトをサポートします。このパラメータはCSVファイル形式でのみ使用されます。

  - `line_delimiter`: エクスポート用の行区切り文字を指定します。デフォルトは `\n` で、マルチバイトをサポートします。このパラメータはCSVファイル形式でのみ使用されます。

  - `columns`: エクスポートTableの特定の列を指定します。

  - `format`: エクスポートジョブのファイル形式を指定します。サポート形式：parquet、orc、csv、csv_with_names、csv_with_names_and_types。デフォルトはCSV形式です。

  - `max_file_size`: エクスポートジョブの単一ファイルサイズ制限。結果がこの値を超える場合、複数のファイルに分割されます。`max_file_size` の値の範囲は [5MB, 2GB] で、デフォルトは1GBです。（orcファイル形式へのエクスポートを指定した場合、実際の分割ファイルサイズは64MBの倍数になります。例：max_file_size = 5MB を指定すると実際には64MBで分割され、max_file_size = 65MB を指定すると実際には128MBで分割されます）

  - `parallelism`: エクスポートジョブの並行数。デフォルトは `1` です。エクスポートジョブは `parallelism` 数のスレッドを開始して `select into outfile` ステートメントを実行します。（Parallelismの数がTable内のTablets数より大きい場合、システムは自動的にParallelismをTablets数のサイズに設定します。つまり、各 `select into outfile` ステートメントが1つのTabletを担当します）

  - `delete_existing_files`: デフォルトは `false` です。`true` に指定した場合、`export_path` で指定されたディレクトリ内のすべてのファイルを最初に削除し、その後そのディレクトリにデータをエクスポートします。例："export_path" = "/user/tmp" の場合、"/user/" 配下のすべてのファイルとディレクトリを削除します。"file_path" = "/user/tmp/" の場合、"/user/tmp/" 配下のすべてのファイルとディレクトリを削除します。

  - `with_bom`: デフォルトは `false` です。`true` に指定した場合、エクスポートされるファイルのエンコーディングはBOM付きUTF8エンコーディングになります（csv関連のファイル形式でのみ有効）。

  - `data_consistency`: `none` / `partition` に設定できます。デフォルトは `partition` です。エクスポートTableをどの粒度で分割するかを示します。`none` はTabletsレベル、`partition` はPartitionレベルを表します。

  - `timeout`: エクスポートジョブのタイムアウト。デフォルトは2時間、単位は秒です。

  - `compress_type`: （2.1.5以降でサポート）エクスポートファイル形式をParquet / ORC ファイルに指定する場合、Parquet / ORC ファイルで使用される圧縮方法を指定できます。Parquetファイル形式では圧縮方法としてSNAPPY、GZIP、BROTLI、ZSTD、LZ4、PLAINを指定でき、デフォルト値はSNAPPYです。ORCファイル形式では圧縮方法としてPLAIN、SNAPPY、ZLIB、ZSTDを指定でき、デフォルト値はZLIBです。このパラメータはバージョン2.1.5から対応しています。（PLAINは無圧縮を意味します）バージョン3.1.1以降、CSV形式の圧縮アルゴリズムの指定をサポートし、現在"plain"、"gz"、"bz2"、"snappyblock"、"lz4block"、"zstd"をサポートしています。

  :::caution Note  
  delete_existing_files パラメータを使用するには、fe.confに設定 `enable_delete_existing_files = true` を追加してfeを再起動する必要があり、その後delete_existing_filesが有効になります。delete_existing_files = true は危険な操作であるため、テスト環境でのみ使用することを推奨します。  
  :::  

**4. `<target_storage>`**  
    ストレージメディア。オプション：BROKER、S3、HDFS。  

**5. `<broker_properties>`**  
    `<target_storage>` の異なるストレージメディアに応じて、異なるプロパティを指定する必要があります。  

- **BROKER**  
  Brokerプロセスを通じてリモートストレージにデータを書き込むことができます。ここでは、Brokerが使用する関連する接続情報を定義する必要があります。

  ```sql
  WITH BROKER "broker_name"
  ("<key>"="<value>" [,...])
  ```  
**Broker関連プロパティ:**  
  - `username`: ユーザー名
  - `password`: パスワード
  - `hadoop.security.authentication`: 認証方法としてkerberosを指定
  - `kerberos_principal`: kerberosプリンシパルを指定
  - `kerberos_keytab`: kerberosキータブファイルのパスを指定。このファイルはBrokerプロセスが配置されているサーバー上のファイルへの絶対パスであり、Brokerプロセスからアクセス可能である必要があります

- **HDFS**  

  データはリモートHDFSに直接書き込むことができます。

  ```sql
  WITH HDFS ("<key>"="<value>" [,...])
  ```  
**HDFS関連プロパティ：**  
  - `fs.defaultFS`: namenodeのアドレスとポート
  - `hadoop.username`: HDFSのユーザー名
  - `dfs.nameservices`: ネームサービス名、hdfs-site.xmlと一致させる
  - `dfs.ha.namenodes.[nameservice ID]`: namenodeのIDのリスト、hdfs-site.xmlと一致させる
  - `dfs.namenode.rpc-address.[nameservice ID].[name node ID]`: Name nodeのrpcアドレス、namenode数と同数、hdfs-site.xmlと一致させる   

  **kerberos認証が有効なHadoopクラスターの場合、以下の追加のPROPERTIES属性を設定する必要があります：**
  - `dfs.namenode.kerberos.principal`: HDFS namenodeサービスのプリンシパル名
  - `hadoop.security.authentication`: 認証方式をkerberosに設定
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
  - `use_path_style`: (オプション) デフォルトは`false`です。S3 SDKはデフォルトでVirtual-hosted Styleを使用します。ただし、一部のオブジェクトストレージシステムではVirtual-hosted Styleアクセスが有効化されていないか、サポートされていない場合があります。この場合、`use_path_style`パラメータを追加してPath Styleアクセスの使用を強制することができます。

## 戻り値

| カラム名              | 型      | 説明                                                                 |
|---------------------|--------|----------------------------------------------------------------------|
| jobId               | long   | エクスポートジョブの一意識別子。                                        |
| label               | string | エクスポートジョブのラベル。                                           |
| dbId                | long   | データベースの識別子。                                                |
| tableId             | long   | Tableの識別子。                                                    |
| state               | string | ジョブの現在の状態。                                                  |
| path                | string | エクスポートファイルのパス。                                           |
| partitions          | string | エクスポートされたパーティション名のリスト、複数のパーティション名はカンマで区切られます。 |
| progress            | int    | エクスポートジョブの現在の進捗（パーセンテージ）。                       |
| createTimeMs        | string | ジョブ作成時刻のミリ秒値、日時形式でフォーマット。                       |
| exportStartTimeMs   | string | エクスポートジョブ開始時刻のミリ秒値、日時形式でフォーマット。            |
| exportFinishTimeMs  | string | エクスポートジョブ終了時刻のミリ秒値、日時形式でフォーマット。            |
| failMsg             | string | エクスポートジョブが失敗した際のエラーメッセージ。                        |


## アクセス制御

このSQLコマンドを実行するユーザーは、少なくとも以下の権限を持つ必要があります：

| 権限        | オブジェクト   | 説明                                     |
|:------------|:-------------|:--------------------------------------|
| SELECT_PRIV | Database     | データベースとTableの読み取り権限が必要。 |


## 注意事項

### 並行実行

Exportジョブは`parallelism`パラメータを設定してデータを並行してエクスポートできます。`parallelism`パラメータは実際にはEXPORTジョブを実行するスレッド数を指定します。`"data_consistency" = "none"`が設定された場合、各スレッドはTableのTabletsの一部をエクスポートする責任を持ちます。

Exportジョブの基盤となる実行ロジックは実際には`SELECT INTO OUTFILE`ステートメントです。`parallelism`パラメータで設定された各スレッドは独立した`SELECT INTO OUTFILE`ステートメントを実行します。

Exportジョブを複数の`SELECT INTO OUTFILE`に分割する具体的なロジックは：Tableのすべてのtabletを全並行スレッドに均等に分散することです。例えば：
- num(tablets) = 40, parallelism = 3の場合、これら3つのスレッドはそれぞれ14、13、13のtabletを担当します。
- num(tablets) = 2, parallelism = 3の場合、Dorisは自動的にparallelismを2に設定し、各スレッドが1つのtabletを担当します。

スレッドが担当するtabletが`maximum_tablets_of_outfile_in_export`値（デフォルトは10、fe.confに`maximum_tablets_of_outfile_in_export`パラメータを追加して修正可能）を超える場合、そのスレッドは複数の`SELECT INTO OUTFILE`ステートメントに分割されます。例えば：
- あるスレッドが14のtabletを担当し、`maximum_tablets_of_outfile_in_export = 10`の場合、このスレッドは2つの`SELECT INTO OUTFILE`ステートメントを担当します。最初の`SELECT INTO OUTFILE`ステートメントは10のtabletをエクスポートし、2番目の`SELECT INTO OUTFILE`ステートメントは4つのtabletをエクスポートします。これら2つの`SELECT INTO OUTFILE`ステートメントはこのスレッドによって順次実行されます。

エクスポートするデータ量が非常に大きい場合、`parallelism`パラメータを適切に増やして並行エクスポートを増やすことを検討できます。マシンのコアが不足しており`parallelism`を増やせない一方で、エクスポートTableに多くのTabletsがある場合、`maximum_tablets_of_outfile_in_export`を増やして1つの`SELECT INTO OUTFILE`ステートメントが担当するtablet数を増やすことを検討でき、これによりエクスポートを高速化することもできます。

Partition粒度でTableをエクスポートしたい場合、Exportプロパティ`"data_consistency" = "partition"`を設定できます。この場合、Exportタスクの並行スレッドはPartition粒度で複数のOutfileステートメントに分割されます。異なるOutfileステートメントは異なるPartitionをエクスポートし、同じOutfileステートメントによってエクスポートされるデータは同じPartitionに属する必要があります。例えば：`"data_consistency" = "partition"`設定後

- num(partition) = 40, parallelism = 3の場合、これら3つのスレッドはそれぞれ14、13、13のPartitionを担当します。
- num(partition) = 2, parallelism = 3の場合、DorisはParallelismを自動的に2に設定し、各スレッドが1つのPartitionを担当します。


### メモリ制限

通常、Exportジョブのクエリプランは`scan-export`の2つの部分のみで、過度なメモリを必要とする計算ロジックは含まれません。そのため、通常はデフォルトのメモリ制限である2GBで要件を満たすことができます。

ただし、クエリプランが同じBE上の過度に多くのTabletsをスキャンする必要がある場合や、Tabletデータバージョンが過度に多い場合など、一部のシナリオではメモリ不足を引き起こす可能性があります。セッション変数`exec_mem_limit`を調整してメモリ使用制限を増やすことができます。

### その他の事項

- 一度に大量のデータをエクスポートすることは推奨されません。1つのExportジョブの推奨最大エクスポートデータ量は数十GBです。過度に大きなエクスポートはより多くのガベージファイルと高い再試行コストを引き起こします。Tableデータ量が過度に大きい場合、パーティション単位でエクスポートすることが推奨されます。

- Exportジョブが失敗した場合、既に生成されたファイルは削除されず、ユーザーが手動で削除する必要があります。

- Exportジョブはデータをスキャンし、IOリソースを占有するため、システムクエリの遅延に影響を与える可能性があります。

- 現在Export中は、Tabletsバージョンが一致しているかの簡単なチェックのみが実行されます。Export実行中はTableに対してデータインポート操作を実行しないことが推奨されます。

- Export Jobは最大2000パーティションのエクスポートが可能です。`fe.conf`にパラメータ`maximum_number_of_export_partitions`を追加し、FEを再起動してこの設定を変更できます。


## 例

### ローカルへのデータエクスポート
> ローカルファイルシステムにデータをエクスポートするには、`fe.conf`に`enable_outfile_to_local=true`を追加し、FEを再起動する必要があります。

- TestTableのすべてのデータをローカルストレージにエクスポート、デフォルトでCSV形式ファイルをエクスポート

```sql
EXPORT TABLE test TO "file:///home/user/tmp/";
```
- Test表のk1,k2カラムをローカルストレージにエクスポートし、デフォルトでCSVファイル形式でエクスポートして、Labelを設定する

```sql
EXPORT TABLE test TO "file:///home/user/tmp/"
PROPERTIES (
  "label" = "label1",
  "columns" = "k1,k2"
);
```
- Test Tableで `k1 < 50` の行をローカルストレージにエクスポートし、デフォルトで CSV 形式ファイルをエクスポートし、列区切り文字として `,` を使用する

```sql
EXPORT TABLE test WHERE k1 < 50 TO "file:///home/user/tmp/"
PROPERTIES (
  "columns" = "k1,k2",
  "column_separator"=","
);
```
- TestTableのパーティションp1,p2をローカルストレージにエクスポートし、デフォルトでcsvフォーマットファイルを出力する

```sql
EXPORT TABLE test PARTITION (p1,p2) TO "file:///home/user/tmp/" 
PROPERTIES ("columns" = "k1,k2");
```
- Test Table内のすべてのデータをローカルストレージにエクスポートし、他の形式のファイルをエクスポートする

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
    Exportがデータをエクスポートする際、まず`/home/user/`ディレクトリ下のすべてのファイルとディレクトリを削除し、その後このディレクトリにデータをエクスポートします。

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

- s3_testTableの全データをS3にエクスポートします。列または行の区切り文字として非表示文字`\x07`を使用します。minioにデータをエクスポートする必要がある場合は、`use_path_style`=`true`も指定する必要があります。

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
### Broker Nodeを通じたエクスポート
まずBrokerプロセスを開始し、このBrokerをFEに追加する必要があります。
- TestTableのすべてのデータをHDFSにエクスポート

```sql
EXPORT TABLE test TO "hdfs://hdfs_host:port/a/b/c" 
WITH BROKER "broker_name" 
(
  "username"="xxx",
  "password"="yyy"
);
```
- testTblTableのパーティションp1、p2をHDFSにエクスポートし、列区切り文字として","を使用し、Labelを指定する

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
- testTblTableのすべてのデータをHDFSにエクスポートし、不可視文字`\x07`を列または行の区切り文字として使用する。

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
