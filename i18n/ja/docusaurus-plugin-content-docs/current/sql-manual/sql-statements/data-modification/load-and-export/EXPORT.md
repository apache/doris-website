---
{
    "title": "EXPORT | データロードとエクスポート",
    "language": "ja",
    "description": "EXPORT コマンドは、指定したテーブルのデータを指定した場所のファイルにエクスポートします。",
    "sidebar_label": "EXPORT"
}
---

# EXPORT {#export}

## 説明 {#description}

`EXPORT` コマンドは、指定したテーブルのデータを指定した場所のファイルにエクスポートします。現在、Broker プロセス、S3 プロトコル、または HDFS プロトコルを使用して、HDFS、S3、BOS、COS（Tencent Cloud）などのリモートストレージにエクスポートできます。

`EXPORT` は非同期処理です。このコマンドは `EXPORT JOB` を Doris に送信し、送信が成功すると直ちに結果を返します。実行後の進捗状況は、[SHOW EXPORT](./SHOW-EXPORT) コマンドで確認できます。

## 構文: {#syntax}

  ```sql
  EXPORT TABLE <table_name>
  [ PARTITION ( <partation_name> [ , ... ] ) ]
  [ <where_clause> ]
  TO <export_path>
  [ <properties> ]
  WITH <target_storage>
  [ <broker_properties> ];
  ```

## 必須パラメータ {#required-parameters}

**1. `<table_name>`**

  エクスポートするテーブルの名前です。Doris のローカルテーブル、ビュー、Catalog の外部テーブルからデータをエクスポートできます。

**2. `<export_path>`**

  エクスポート先のファイルパスです。ディレクトリ、または `hdfs://path/to/my_file_` のようにファイル名の接頭辞を含むパスを指定できます。

## 任意のパラメータ {#optional-parameters}

**1. `<where_clause>`**

  エクスポートするデータのフィルター条件を指定できます。

**2. `<partation_name>`**

  指定したテーブルの特定のパーティションだけをエクスポートできます。Doris のローカルテーブルでのみ有効です。

**3. `<properties>`**

  エクスポートに関するパラメータを指定します。

  ```sql
  [ PROPERTIES ("<key>"="<value>" [, ... ]) ]
  ```

  次のパラメータを指定できます。
  - `label`: このエクスポートタスクのラベルを指定する任意のパラメータです。指定しない場合、システムがラベルをランダムに生成します。

  - `column_separator`: エクスポート時の列区切り文字を指定します。デフォルトは `\t` で、マルチバイト文字に対応しています。このパラメータは CSV 形式でのみ使用します。

  - `line_delimiter`: エクスポート時の行区切り文字を指定します。デフォルトは `\n` で、マルチバイト文字に対応しています。このパラメータは CSV 形式でのみ使用します。

  - `columns`: エクスポートするテーブルの列を指定します。

  - `format`: エクスポートジョブのファイル形式を指定します。parquet、orc、csv、csv_with_names、csv_with_names_and_types に対応しています。デフォルトは CSV 形式です。

  - `enable_int96_timestamps`: Parquet のエクスポートで INT96 タイムスタンプを使用するかどうかを指定します。4.1.5 以降、EXPORT で明示的に設定できます。デフォルトは `false` で、論理型の INT64 タイムスタンプを使用します。INT96 が必要な読み取り側には `true` を設定してください。指定できる値は `true` と `false` のみです。

  - `max_file_size`: エクスポートジョブにおける単一ファイルのサイズ上限です。結果がこの値を超える場合、複数のファイルに分割されます。`max_file_size` の指定可能な範囲は [5MB, 2GB] で、デフォルトは 1GB です。（orc 形式でエクスポートする場合、実際の分割サイズは 64MB の倍数になります。たとえば、max_file_size = 5MB を指定すると実際には 64MB で、max_file_size = 65MB を指定すると実際には 128MB で分割されます）

  - `parallelism`: エクスポートジョブの並列実行数です。デフォルトは `1` です。エクスポートジョブは `parallelism` 個のスレッドを起動し、`select into outfile` 文を実行します。（Parallelism の値がテーブル内の Tablet 数より大きい場合、システムは Parallelism を Tablet 数に自動調整します。この場合、各 `select into outfile` 文がそれぞれの Tablet を担当します）

  - `delete_existing_files`: デフォルトは `false` です。`true` を指定すると、まず `export_path` で指定したパスに対応するディレクトリ内のすべてのファイルが削除され、その後データがエクスポートされます。たとえば、"export_path" = "/user/tmp" の場合は "/user/" 以下のすべてのファイルとディレクトリが削除され、"file_path" = "/user/tmp/" の場合は "/user/tmp/" 以下のすべてのファイルとディレクトリが削除されます。

  - `with_bom`: デフォルトは `false` です。`true` を指定すると、エクスポートファイルは BOM 付き UTF8 でエンコードされます（csv 関連のファイル形式でのみ有効です）。

  - `data_consistency`: `none` / `partition` を設定できます。デフォルトは `partition` です。エクスポートするテーブルを分割する単位を示し、`none` は Tablet 単位、`partition` は Partition 単位を表します。

  - `timeout`: エクスポートジョブのタイムアウトです。デフォルトは 2 時間で、単位は秒です。

  - `compress_type`: （2.1.5 以降でサポート）エクスポートするファイル形式に Parquet / ORC を指定した場合、使用する圧縮方式を指定できます。Parquet 形式では SNAPPY、GZIP、BROTLI、ZSTD、LZ4、PLAIN を指定でき、デフォルトは SNAPPY です。ORC 形式では PLAIN、SNAPPY、ZLIB、ZSTD を指定でき、デフォルトは ZLIB です。このパラメータはバージョン 2.1.5 以降でサポートされています。（PLAIN は圧縮なしを意味します。）バージョン 3.1.1 以降は CSV 形式にも圧縮アルゴリズムを指定でき、現在は "plain"、"gz"、"bz2"、"snappyblock"、"lz4block"、"zstd" に対応しています。

  :::caution 注意
  delete_existing_files パラメータを使用するには、fe.conf に設定 `enable_delete_existing_files = true` を追加して FE を再起動する必要があります。再起動後に delete_existing_files が有効になります。delete_existing_files = true は危険な操作のため、テスト環境でのみ使用することを推奨します。
  :::

**4. `<target_storage>`**
    ストレージの種類です。BROKER、S3、HDFS を指定できます。

**5. `<broker_properties>`**
    `<target_storage>` で指定したストレージの種類に応じたプロパティを指定する必要があります。

- **BROKER**
  Broker プロセスを介してリモートストレージにデータを書き込めます。ここでは、Broker が使用する接続情報を指定します。

  ```sql
  WITH BROKER "broker_name"
  ("<key>"="<value>" [,...])
  ```

  **Broker 関連のプロパティ:**
  - `username`: ユーザー名
  - `password`: パスワード
  - `hadoop.security.authentication`: 認証方式に kerberos を指定します
  - `kerberos_principal`: kerberos principal を指定します
  - `kerberos_keytab`: kerberos keytab ファイルのパスを指定します。このファイルには、Broker プロセスが稼働するサーバー上にあり、そのプロセスからアクセスできるファイルの絶対パスを指定する必要があります

- **HDFS**

  リモート HDFS に直接データを書き込めます。

  ```sql
  WITH HDFS ("<key>"="<value>" [,...])
  ```

  **HDFS 関連のプロパティ:**
  - `fs.defaultFS`: namenode のアドレスとポート
  - `hadoop.username`: HDFS のユーザー名
  - `dfs.nameservices`: name service 名。hdfs-site.xml と一致させます
  - `dfs.ha.namenodes.[nameservice ID]`: namenode ID の一覧。hdfs-site.xml と一致させます
  - `dfs.namenode.rpc-address.[nameservice ID].[name node ID]`: Name node の rpc アドレス。namenode の数だけ指定し、hdfs-site.xml と一致させます

  **kerberos 認証が有効な Hadoop クラスターでは、次の PROPERTIES 属性も設定する必要があります:**
  - `dfs.namenode.kerberos.principal`: HDFS namenode サービスの Principal 名
  - `hadoop.security.authentication`: 認証方式を kerberos に設定します
  - `hadoop.kerberos.principal`: Doris が HDFS に接続するときに使用する Kerberos principal を設定します
  - `hadoop.kerberos.keytab`: keytab のローカルファイルパスを設定します

- **S3**

  リモートの S3 オブジェクトストレージに直接データを書き込めます。

  ```sql
  WITH S3 ("<key>"="<value>" [,...])
  ```

  **S3 関連のプロパティ:**
  - `s3.endpoint`
  - `s3.region`
  - `s3.secret_key`
  - `s3.access_key`
  - `use_path_style`: （任意）デフォルトは `false` です。S3 SDK はデフォルトで Virtual-hosted Style を使用します。ただし、オブジェクトストレージによっては Virtual-hosted Style によるアクセスが有効でないか、サポートされていない場合があります。その場合は `use_path_style` パラメータを追加し、Path Style によるアクセスを強制できます。

## 戻り値 {#return-values}

| 列名                | 型     | 説明                                                                 |
|---------------------|--------|----------------------------------------------------------------------|
| jobId               | long   | エクスポートジョブの一意の識別子。                                   |
| label               | string | エクスポートジョブのラベル。                                         |
| dbId                | long   | データベースの識別子。                                               |
| tableId             | long   | テーブルの識別子。                                                   |
| state               | string | ジョブの現在の状態。                                                 |
| path                | string | エクスポートファイルのパス。                                         |
| partitions          | string | エクスポートされたパーティション名の一覧。複数の名前はカンマで区切られます。 |
| progress            | int    | エクスポートジョブの現在の進捗率（パーセント）。                     |
| createTimeMs        | string | ジョブ作成時刻のミリ秒値。日時形式で表示されます。                   |
| exportStartTimeMs   | string | エクスポートジョブ開始時刻のミリ秒値。日時形式で表示されます。       |
| exportFinishTimeMs  | string | エクスポートジョブ終了時刻のミリ秒値。日時形式で表示されます。       |
| failMsg             | string | エクスポートジョブが失敗したときのエラーメッセージ。                 |


## アクセス制御 {#access-control}

この SQL コマンドを実行するユーザーには、少なくとも次の権限が必要です。

| 権限        | オブジェクト | 説明                                  |
|:------------|:-------------|:--------------------------------------|
| SELECT_PRIV | データベース | データベースとテーブルに対する読み取り権限が必要です。 |


## 注意事項 {#notes}

### 並列実行 {#concurrent-execution}

エクスポートジョブでは `parallelism` パラメータを設定して、データを並列にエクスポートできます。`parallelism` パラメータは、実際には EXPORT ジョブを実行するスレッド数を指定します。`"data_consistency" = "none"` を設定した場合、各スレッドがテーブル内の Tablet の一部をエクスポートします。

エクスポートジョブの内部処理では、`SELECT INTO OUTFILE` 文が実行されます。`parallelism` パラメータで設定された各スレッドは、それぞれ独立した `SELECT INTO OUTFILE` 文を実行します。

エクスポートジョブを複数の `SELECT INTO OUTFILE` 文に分割する際は、テーブル内のすべての Tablet を並列スレッドに均等に割り当てます。たとえば、次のようになります。
- num(tablets) = 40、parallelism = 3 の場合、各スレッドがそれぞれ 14、13、13 個の Tablet を担当します。
- num(tablets) = 2、parallelism = 3 の場合、Doris は parallelism を 2 に自動調整し、各スレッドがそれぞれの Tablet を担当します。

スレッドが担当する Tablet 数が `maximum_tablets_of_outfile_in_export` の値を超える場合（デフォルトは 10。fe.conf に `maximum_tablets_of_outfile_in_export` パラメータを追加して変更できます）、そのスレッドの処理は複数の `SELECT INTO OUTFILE` 文に分割されます。たとえば、次のようになります。
- あるスレッドが 14 個の Tablet を担当し、`maximum_tablets_of_outfile_in_export = 10` の場合、そのスレッドは 2 つの `SELECT INTO OUTFILE` 文を実行します。最初の `SELECT INTO OUTFILE` 文が 10 個の Tablet をエクスポートし、次の `SELECT INTO OUTFILE` 文が 4 個の Tablet をエクスポートします。このスレッドは 2 つの `SELECT INTO OUTFILE` 文を順番に実行します。

エクスポートするデータ量が非常に多い場合は、`parallelism` パラメータを適切に増やすことで、エクスポートの並列度を高められます。マシンのコア数に余裕がなく `parallelism` を増やせない一方で、エクスポートするテーブルに多くの Tablet がある場合は、`maximum_tablets_of_outfile_in_export` を増やすことも検討できます。これにより、`SELECT INTO OUTFILE` 文が担当する Tablet 数が増え、エクスポートが速くなる場合があります。

テーブルを Partition 単位でエクスポートするには、Export のプロパティ `"data_consistency" = "partition"` を設定します。この場合、エクスポートタスクの並列スレッドは、Partition 単位で複数の Outfile 文を実行します。異なる Outfile 文は異なる Partition をエクスポートし、同じ Outfile 文がエクスポートするデータは同じ Partition に属します。`"data_consistency" = "partition"` を設定した場合の例は次のとおりです。

- num(partition) = 40、parallelism = 3 の場合、各スレッドがそれぞれ 14、13、13 個の Partition を担当します。
- num(partition) = 2、parallelism = 3 の場合、Doris は Parallelism を 2 に自動調整し、各スレッドがそれぞれの Partition を担当します。


### メモリ制限 {#memory-limits}

通常、エクスポートジョブのクエリプランは `scan-export` の 2 つの部分だけで構成され、大量のメモリを必要とする計算処理を含みません。そのため、通常はデフォルトのメモリ制限である 2GB で十分です。

ただし、クエリプランで同じ BE 上の非常に多くの Tablet をスキャンする場合や、Tablet データのバージョンが多すぎる場合などは、メモリが不足することがあります。セッション変数 `exec_mem_limit` を調整すると、メモリ使用量の上限を引き上げられます。

### その他の注意事項 {#other-matters}

- 一度に大量のデータをエクスポートすることは推奨しません。エクスポートジョブごとのデータ量は、最大でも数十 GB 程度を推奨します。データ量が大きすぎると、不要なファイルが増え、再試行のコストも高くなります。テーブルのデータ量が多い場合は、パーティションごとにエクスポートすることを推奨します。

- エクスポートジョブが失敗しても、生成済みのファイルは削除されません。ユーザーが手動で削除する必要があります。

- エクスポートジョブはデータをスキャンして IO リソースを使用するため、システムのクエリ遅延に影響する場合があります。

- 現在、エクスポート中の Tablet のバージョン整合性については、簡単なチェックのみ行われます。エクスポートの実行中は、そのテーブルへのデータロードを行わないことを推奨します。

- エクスポートジョブでエクスポートできるパーティションは最大 2000 個です。この設定を変更するには、`fe.conf` に `maximum_number_of_export_partitions` パラメータを追加して FE を再起動します。


## 例 {#examples}

### ローカルへのデータのエクスポート {#export-data-to-local}
> ローカルファイルシステムにデータをエクスポートするには、`fe.conf` に `enable_outfile_to_local=true` を追加して FE を再起動する必要があります。

- Test テーブルのすべてのデータをローカルストレージにエクスポートします。デフォルトの CSV 形式のファイルが出力されます。
```sql
EXPORT TABLE test TO "file:///home/user/tmp/";
```

- Test テーブルの k1,k2 列をローカルストレージにエクスポートします。デフォルトの CSV 形式を使用し、ラベルを設定します。
```sql
EXPORT TABLE test TO "file:///home/user/tmp/"
PROPERTIES (
  "label" = "label1",
  "columns" = "k1,k2"
);
```

- Test テーブルから `k1 < 50` を満たす行をローカルストレージにエクスポートします。デフォルトの CSV 形式を使用し、列区切り文字を `,` に設定します。
```sql
EXPORT TABLE test WHERE k1 < 50 TO "file:///home/user/tmp/"
PROPERTIES (
  "columns" = "k1,k2",
  "column_separator"=","
);
```

- Test テーブルのパーティション p1,p2 をローカルストレージにエクスポートします。デフォルトの csv 形式のファイルが出力されます。
```sql
EXPORT TABLE test PARTITION (p1,p2) TO "file:///home/user/tmp/"
PROPERTIES ("columns" = "k1,k2");
```

- Test テーブルのすべてのデータをローカルストレージに、ほかの形式のファイルとしてエクスポートします。
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
   エクスポートするファイルが 5MB を超えると、データは複数のファイルに分割され、各ファイルの最大サイズは 5MB になります。

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
    エクスポート時に、まず `/home/user/` ディレクトリ以下のすべてのファイルとディレクトリを削除し、その後このディレクトリにデータをエクスポートします。

```sql
-- When exporting data, all files and directories under the `/home/user/` directory will be deleted first, and then the data will be exported to this directory.
EXPORT TABLE test TO "file:///home/user/tmp"
PROPERTIES (
  "format" = "parquet",
  "max_file_size" = "5MB",
  "delete_existing_files" = "true"
);
```

### S3 へのエクスポート {#export-to-s3}

- s3_test テーブルのすべてのデータを S3 にエクスポートし、不可視文字 `\x07` を列または行の区切り文字として使用します。minio にデータをエクスポートする場合は、`use_path_style`=`true` も指定する必要があります。

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

### HDFS へのエクスポート {#export-to-hdfs}

- Test テーブルのすべてのデータを HDFS にエクスポートします。ファイル形式は Parquet、エクスポートジョブの単一ファイルのサイズ上限は 512MB とし、指定したディレクトリ内の既存ファイルは保持します。

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

### Broker ノード経由のエクスポート {#export-through-broker-node}
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

- testTbl テーブルのパーティション p1,p2 を HDFS にエクスポートします。列区切り文字に "," を使用し、ラベルを指定します。

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
