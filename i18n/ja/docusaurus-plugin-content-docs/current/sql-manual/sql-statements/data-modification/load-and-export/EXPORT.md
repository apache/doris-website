---
{
    "title": "EXPORT | ロードとエクスポート",
    "language": "ja",
    "description": "EXPORT コマンドは、指定したテーブルのデータを指定した場所のファイルにエクスポートします。",
    "sidebar_label": "EXPORT"
}
---

# EXPORT

## 説明

`EXPORT` コマンドは、指定したテーブルのデータを指定した場所のファイルにエクスポートします。現在、Broker プロセス、S3 プロトコル、または HDFS プロトコルを使用して、HDFS、S3、BOS、COS（Tencent Cloud）などのリモートストレージへのエクスポートをサポートしています。

`EXPORT` は非同期操作です。このコマンドは Doris に `EXPORT JOB` を送信し、送信に成功するとすぐに戻ります。実行後は [SHOW EXPORT](./SHOW-EXPORT) コマンドで進捗を確認できます。

## 構文:

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

  エクスポートするテーブルの名前です。Doris のローカルテーブル、ビュー、カタログ内の外部テーブルからのデータのエクスポートをサポートします。

**2. `<export_path>`**

  エクスポート先のファイルパスです。ディレクトリ、または `hdfs://path/to/my_file_` のようにファイル名のプレフィックスを含むパスを指定できます。

## オプションパラメータ  

**1. `<where_clause>`**

  エクスポートするデータのフィルター条件を指定できます。

**2. `<partation_name>`**

  指定したテーブルの特定のパーティションのみをエクスポートできます。Doris のローカルテーブルにのみ有効です。

**3. `<properties>`**

  エクスポートの各種パラメータを指定します。

  ```sql
  [ PROPERTIES ("<key>"="<value>" [, ... ]) ]
  ```

  次のパラメータを指定できます。  
  - `label`: このエクスポートジョブの Label を指定するオプションパラメータです。省略すると、システムがランダムに Label を生成します。

  - `column_separator`: エクスポート時の列区切り文字を指定します。デフォルトは `\t` で、複数バイトの文字列をサポートします。このパラメータは CSV 形式でのみ使用します。

  - `line_delimiter`: エクスポート時の行区切り文字を指定します。デフォルトは `\n` で、複数バイトの文字列をサポートします。このパラメータは CSV 形式でのみ使用します。

  - `columns`: エクスポートするテーブルの特定の列を指定します。

  - `format`: エクスポートジョブのファイル形式を指定します。parquet、orc、csv、csv_with_names、csv_with_names_and_types をサポートします。デフォルトは CSV 形式です。

  - `max_file_size`: エクスポートジョブの単一ファイルのサイズ上限です。結果がこの値を超える場合は複数のファイルに分割されます。`max_file_size` の指定可能な範囲は [5MB, 2GB]、デフォルトは 1GB です。（ORC 形式へのエクスポートでは、実際の分割サイズは 64MB の倍数になります。たとえば、max_file_size = 5MB を指定すると実際には 64MB で分割され、max_file_size = 65MB を指定すると 128MB で分割されます。）

  - `parallelism`: エクスポートジョブの並列度です。デフォルトは `1` です。エクスポートジョブは `parallelism` 個のスレッドを起動して `select into outfile` 文を実行します。（並列度がテーブル内の Tablet 数より大きい場合、システムは並列度を Tablet 数に自動調整します。つまり、各 `select into outfile` 文が一つの Tablet を担当します。）

  - `delete_existing_files`: デフォルトは `false` です。`true` に設定すると、最初に `export_path` で指定したディレクトリ内のすべてのファイルを削除してから、そのディレクトリにデータをエクスポートします。たとえば、"export_path" = "/user/tmp" の場合は "/user/" 以下のすべてのファイルとディレクトリを削除し、"file_path" = "/user/tmp/" の場合は "/user/tmp/" 以下のすべてのファイルとディレクトリを削除します。

  - `with_bom`: デフォルトは `false` です。`true` に設定すると、エクスポートするファイルは BOM 付き UTF8 でエンコードされます（CSV 関連のファイル形式でのみ有効です）。

  - `data_consistency`: `none` / `partition` を設定できます。デフォルトは `partition` です。エクスポート対象のテーブルを分割する粒度を示し、`none` は Tablet レベル、`partition` は Partition レベルです。

  - `timeout`: エクスポートジョブのタイムアウトです。デフォルトは 2 時間で、単位は秒です。

  - `compress_type`: （2.1.5 以降でサポート）エクスポート先のファイル形式を Parquet / ORC に指定した場合、使用する圧縮方式を指定できます。Parquet 形式では SNAPPY、GZIP、BROTLI、ZSTD、LZ4、PLAIN を指定でき、デフォルトは SNAPPY です。ORC 形式では PLAIN、SNAPPY、ZLIB、ZSTD を指定でき、デフォルトは ZLIB です。このパラメータはバージョン 2.1.5 以降でサポートされます（PLAIN は圧縮なしを意味します）。バージョン 3.1.1 以降は CSV 形式の圧縮アルゴリズムも指定でき、現在 "plain"、"gz"、"bz2"、"snappyblock"、"lz4block"、"zstd" をサポートしています。

  :::caution 注意  
  delete_existing_files パラメータを使用するには、fe.conf に `enable_delete_existing_files = true` を追加して FE を再起動する必要があります。これにより delete_existing_files が有効になります。delete_existing_files = true は危険な操作のため、テスト環境でのみ使用することを推奨します。  
  :::  

**4. `<target_storage>`**  
    ストレージの種類です。BROKER、S3、HDFS から選択できます。  

**5. `<broker_properties>`**  
    `<target_storage>` のストレージの種類に応じて、異なるプロパティを指定する必要があります。  

- **BROKER**  
  Broker プロセスを介してリモートストレージにデータを書き込めます。ここでは Broker が使用する接続情報を定義する必要があります。  

  ```sql
  WITH BROKER "broker_name"
  ("<key>"="<value>" [,...])
  ```  

  **Broker 関連のプロパティ:**  
  - `username`: ユーザー名
  - `password`: パスワード
  - `hadoop.security.authentication`: 認証方式に kerberos を指定します
  - `kerberos_principal`: Kerberos プリンシパルを指定します
  - `kerberos_keytab`: Kerberos keytab ファイルのパスを指定します。このファイルは Broker プロセスが動作するサーバー上の絶対パスにあり、Broker プロセスからアクセスできる必要があります  

- **HDFS**  

  リモート HDFS にデータを直接書き込めます。

  ```sql
  WITH HDFS ("<key>"="<value>" [,...])
  ```  

  **HDFS 関連のプロパティ:**  
  - `fs.defaultFS`: NameNode のアドレスとポート
  - `hadoop.username`: HDFS のユーザー名
  - `dfs.nameservices`: ネームサービス名。hdfs-site.xml と一致させます
  - `dfs.ha.namenodes.[nameservice ID]`: NameNode ID のリスト。hdfs-site.xml と一致させます
  - `dfs.namenode.rpc-address.[nameservice ID].[name node ID]`: NameNode の RPC アドレス。NameNode の数と同数を指定し、hdfs-site.xml と一致させます   

  **Kerberos 認証を有効にした Hadoop クラスターでは、次の PROPERTIES 属性も設定する必要があります:**
  - `dfs.namenode.kerberos.principal`: HDFS NameNode サービスのプリンシパル名
  - `hadoop.security.authentication`: 認証方式に kerberos を設定します
  - `hadoop.kerberos.principal`: Doris が HDFS に接続するときに使用する Kerberos プリンシパルを設定します
  - `hadoop.kerberos.keytab`: keytab のローカルファイルパスを設定します  

- **S3**  

  リモート S3 オブジェクトストレージにデータを直接書き込めます。

  ```sql
  WITH S3 ("<key>"="<value>" [,...])
  ```  

  **S3 関連のプロパティ:**
  - `s3.endpoint`
  - `s3.region`
  - `s3.secret_key`
  - `s3.access_key`
  - `use_path_style`: （オプション）デフォルトは `false` です。S3 SDK はデフォルトで Virtual-hosted Style を使用します。ただし、一部のオブジェクトストレージシステムでは Virtual-hosted Style によるアクセスが有効でない、またはサポートされない場合があります。その場合は `use_path_style` パラメータを追加して Path Style によるアクセスを強制できます。

## 戻り値

| 列名                | 型     | 説明                                                                 |
|---------------------|--------|----------------------------------------------------------------------|
| jobId               | long   | エクスポートジョブの一意の識別子。                                   |
| label               | string | エクスポートジョブの Label。                                         |
| dbId                | long   | データベースの識別子。                                               |
| tableId             | long   | テーブルの識別子。                                                   |
| state               | string | ジョブの現在の状態。                                                 |
| path                | string | エクスポートされたファイルのパス。                                   |
| partitions          | string | エクスポートされたパーティション名の一覧。複数の場合はカンマで区切られます。 |
| progress            | int    | エクスポートジョブの現在の進捗率（パーセント）。                     |
| createTimeMs        | string | ジョブの作成時刻を日時形式で表したミリ秒値。                         |
| exportStartTimeMs   | string | エクスポートジョブの開始時刻を日時形式で表したミリ秒値。             |
| exportFinishTimeMs  | string | エクスポートジョブの終了時刻を日時形式で表したミリ秒値。             |
| failMsg             | string | エクスポートジョブが失敗したときのエラーメッセージ。                 |


## アクセス制御

この SQL コマンドを実行するユーザーには、少なくとも次の権限が必要です。

| 権限        | オブジェクト | 説明                                      |
|:------------|:-------------|:------------------------------------------|
| SELECT_PRIV | データベース | データベースとテーブルの読み取り権限が必要です。 |


## 注意事項

### 並列実行

エクスポートジョブでは、`parallelism` パラメータを設定してデータを並列にエクスポートできます。`parallelism` パラメータは、実際には EXPORT ジョブを実行するスレッド数を指定します。`"data_consistency" = "none"` を設定すると、各スレッドがテーブル内の一部の Tablet のエクスポートを担当します。

エクスポートジョブの内部的な実行処理は、実際には `SELECT INTO OUTFILE` 文によって行われます。`parallelism` パラメータで設定された各スレッドは、それぞれ独立した `SELECT INTO OUTFILE` 文を実行します。

エクスポートジョブを複数の `SELECT INTO OUTFILE` 文に分割する具体的な方法は、テーブル内のすべての Tablet を並列スレッドに均等に割り当てることです。例:

- num(tablets) = 40、parallelism = 3 の場合、3 つのスレッドはそれぞれ 14、13、13 個の Tablet を担当します。
- num(tablets) = 2、parallelism = 3 の場合、Doris は並列度を自動的に 2 に設定し、各スレッドがそれぞれ一つの Tablet を担当します。

スレッドが担当する Tablet 数が `maximum_tablets_of_outfile_in_export` の値を超える場合（デフォルトは 10。`maximum_tablets_of_outfile_in_export` パラメータを fe.conf に追加して変更できます）、そのスレッドの処理は複数の `SELECT INTO OUTFILE` 文に分割されます。例:

- あるスレッドが 14 個の Tablet を担当し、`maximum_tablets_of_outfile_in_export = 10` の場合、このスレッドは二つの `SELECT INTO OUTFILE` 文を実行します。最初の `SELECT INTO OUTFILE` 文で 10 個、二番目の `SELECT INTO OUTFILE` 文で 4 個の Tablet をエクスポートします。この二つの `SELECT INTO OUTFILE` 文は、同じスレッドで順番に実行されます。

エクスポートするデータ量が非常に多い場合は、`parallelism` パラメータを適切に増やして並列エクスポートを増やすことを検討できます。マシンの CPU コアに余裕がなく `parallelism` を増やせない場合でも、エクスポート対象のテーブルに多数の Tablet があれば、`maximum_tablets_of_outfile_in_export` を増やすことを検討できます。これにより、一つの `SELECT INTO OUTFILE` 文が担当する Tablet 数が増え、エクスポートが速くなる可能性があります。

パーティション単位でテーブルをエクスポートするには、Export プロパティ `"data_consistency" = "partition"` を設定できます。この場合、エクスポートタスクの並列スレッドはパーティション単位で複数の Outfile 文に分割されます。異なる Outfile 文は異なるパーティションをエクスポートし、同じ Outfile 文がエクスポートするデータは必ず同じパーティションに属します。`"data_consistency" = "partition"` を設定した場合の例:

- num(partition) = 40、parallelism = 3 の場合、3 つのスレッドはそれぞれ 14、13、13 個のパーティションを担当します。
- num(partition) = 2、parallelism = 3 の場合、Doris は並列度を自動的に 2 に設定し、各スレッドがそれぞれ一つのパーティションを担当します。


### メモリ制限

通常、エクスポートジョブのクエリプランは `scan-export` の二つの部分のみで構成され、大量のメモリを必要とする計算処理は含まれません。そのため、通常はデフォルトのメモリ制限である 2GB で要件を満たせます。

ただし、クエリプランが同じ BE 上で非常に多くの Tablet をスキャンする必要がある場合や、Tablet データのバージョンが多すぎる場合など、メモリ不足が発生することがあります。セッション変数 `exec_mem_limit` を調整すると、メモリ使用量の上限を増やせます。

### その他の注意事項

- 一度に大量のデータをエクスポートすることは推奨しません。一つのエクスポートジョブで推奨される最大データ量は数十 GB です。データ量が多すぎると不要なファイルが増え、再試行のコストも高くなります。テーブルのデータ量が多すぎる場合は、パーティションごとにエクスポートすることを推奨します。

- エクスポートジョブが失敗しても、生成済みのファイルは削除されません。ユーザーが手動で削除する必要があります。

- エクスポートジョブはデータをスキャンして I/O リソースを消費するため、システムのクエリレイテンシーに影響する場合があります。

- 現在、エクスポート中の Tablet のバージョンの整合性については簡易チェックのみが行われます。エクスポートの実行中に対象テーブルへデータをインポートしないことを推奨します。

- エクスポートジョブでエクスポートできるパーティション数の上限は 2000 です。`maximum_number_of_export_partitions` パラメータを `fe.conf` に追加して FE を再起動すると、この設定を変更できます。


## 例

### ローカルへのエクスポート
> ローカルファイルシステムにデータをエクスポートするには、`enable_outfile_to_local=true` を `fe.conf` に追加し、FE を再起動する必要があります。

- Test テーブルのすべてのデータをローカルストレージにエクスポートします。デフォルトで CSV 形式のファイルになります。
```sql
EXPORT TABLE test TO "file:///home/user/tmp/";
```

- Test テーブルの k1、k2 列をローカルストレージにエクスポートします。デフォルトで CSV 形式のファイルになり、Label も設定します。
```sql
EXPORT TABLE test TO "file:///home/user/tmp/"
PROPERTIES (
  "label" = "label1",
  "columns" = "k1,k2"
);
```

- Test テーブルのうち `k1 < 50` の行をローカルストレージにエクスポートします。デフォルトで CSV 形式のファイルになり、列区切り文字には `,` を使用します。
```sql
EXPORT TABLE test WHERE k1 < 50 TO "file:///home/user/tmp/"
PROPERTIES (
  "columns" = "k1,k2",
  "column_separator"=","
);
```

- Test テーブルの p1、p2 パーティションをローカルストレージにエクスポートします。デフォルトで CSV 形式のファイルになります。
```sql
EXPORT TABLE test PARTITION (p1,p2) TO "file:///home/user/tmp/" 
PROPERTIES ("columns" = "k1,k2");
```

- Test テーブルのすべてのデータをローカルストレージにエクスポートし、ほかの形式のファイルを生成します。
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

- `max_file_sizes` プロパティを設定します。
   エクスポートしたファイルが 5MB を超えると、データは複数のファイルに分割され、各ファイルの最大サイズは 5MB になります。

```sql
-- When the exported file is larger than 5MB, the data will be split into multiple files, with each file having a maximum size of 5MB.
EXPORT TABLE test TO "file:///home/user/tmp/"
PROPERTIES (
  "format" = "parquet",
  "max_file_size" = "5MB"
);
```

- `parallelism` プロパティを設定します。
```sql
EXPORT TABLE test TO "file:///home/user/tmp/"
PROPERTIES (
  "format" = "parquet",
  "max_file_size" = "5MB",
  "parallelism" = "5"
);
```

- `delete_existing_files` プロパティを設定します。
    Export でデータをエクスポートするとき、最初に `/home/user/` ディレクトリ以下のすべてのファイルとディレクトリを削除してから、このディレクトリにデータをエクスポートします。

```sql
-- When exporting data, all files and directories under the `/home/user/` directory will be deleted first, and then the data will be exported to this directory.
EXPORT TABLE test TO "file:///home/user/tmp"
PROPERTIES (
  "format" = "parquet",
  "max_file_size" = "5MB",
  "delete_existing_files" = "true"
);
```

### S3 へのエクスポート

- s3_test テーブルのすべてのデータを S3 にエクスポートし、不可視文字 `\x07` を列または行の区切り文字として使用します。MinIO にデータをエクスポートする場合は、`use_path_style`=`true` も指定する必要があります。

```sql
EXPORT TABLE s3_test TO "s3://bucket/a/b/c" 
PROPERTIES (
  "column_separator"="\\x07", 
  "line_delimiter" = "\\x07"
) WITH S3 (
  "s3.endpoint" = "xxxxx",
  "s3.region" = "xxxxx",
  "s3.access_key" = "xxxxx",
  "s3.secret_key"="xxxx"
  
)
```

### HDFS へのエクスポート

- Test テーブルのすべてのデータを HDFS にエクスポートします。ファイル形式は Parquet、エクスポートジョブの単一ファイルのサイズ上限は 512MB とし、指定したディレクトリ内のすべてのファイルを保持します。

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

### Broker ノードを介したエクスポート
先に Broker プロセスを起動し、この Broker を FE に追加する必要があります。
- Test テーブルのすべてのデータを HDFS にエクスポートします。
```sql
EXPORT TABLE test TO "hdfs://hdfs_host:port/a/b/c" 
WITH BROKER "broker_name" 
(
  "username"="xxx",
  "password"="yyy"
);
```

- testTbl テーブルの p1、p2 パーティションを HDFS にエクスポートし、列区切り文字に "," を使用して Label を指定します。

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

- testTbl テーブルのすべてのデータを HDFS にエクスポートし、不可視文字 `\x07` を列または行の区切り文字として使用します。

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
