---
{
    "title": "EXPORT | ロードとエクスポート",
    "language": "ja",
    "description": "EXPORT コマンドは、指定したテーブルのデータを指定した場所のファイルにエクスポートするために使用します。",
    "sidebar_label": "EXPORT"
}
---

# EXPORT {#export}

## 説明 {#description}

`EXPORT` コマンドは、指定したテーブルのデータを指定した場所のファイルにエクスポートするために使用します。現在、Broker プロセス、S3 プロトコル、または HDFS プロトコルを介して、HDFS、S3、BOS、COS（Tencent Cloud）などのリモートストレージへのエクスポートをサポートしています。

`EXPORT` は非同期操作です。このコマンドは Doris に `EXPORT JOB` を送信し、送信が成功すると直ちに戻ります。実行後は [SHOW EXPORT](./SHOW-EXPORT) コマンドを使用して進行状況を確認できます。

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

  エクスポートするテーブルの名前です。Doris のローカルテーブル、ビュー、カタログ外部テーブルからのデータのエクスポートをサポートします。

**2. `<export_path>`**

  エクスポートファイルのパスです。ディレクトリ、またはファイルプレフィックスを含むファイルディレクトリを指定できます。例: `hdfs://path/to/my_file_`

## オプションパラメータ {#optional-parameters}

**1. `<where_clause>`**

  エクスポートするデータのフィルター条件を指定できます。

**2. `<partation_name>`**

  指定したテーブルの特定のパーティションだけをエクスポートできます。Doris のローカルテーブルでのみ有効です。

**3. `<properties>`**

  エクスポートパラメータを指定するために使用します。

  ```sql
  [ PROPERTIES ("<key>"="<value>" [, ... ]) ]
  ```

  次のパラメータを指定できます:
  - `label`: この Export タスクの Label を指定するオプションパラメータです。指定しない場合、システムが Label をランダムに生成します。

  - `column_separator`: エクスポート時の列区切り文字を指定します。デフォルトは `\t` で、マルチバイト文字をサポートします。このパラメータは CSV ファイル形式でのみ使用されます。

  - `line_delimiter`: エクスポート時の行区切り文字を指定します。デフォルトは `\n` で、マルチバイト文字をサポートします。このパラメータは CSV ファイル形式でのみ使用されます。

  - `columns`: エクスポートするテーブルの特定の列を指定します。

  - `format`: エクスポートジョブのファイル形式を指定します。parquet、orc、csv、csv_with_names、csv_with_names_and_types をサポートします。デフォルトは CSV 形式です。

  - `enable_int96_timestamps`: Parquet エクスポートで INT96 タイムスタンプを使用するかどうかを指定します。EXPORT での明示的な設定は 4.1.5 以降でサポートされています。デフォルトは `false` で、論理 INT64 タイムスタンプを使用します。INT96 を必要とするリーダーには `true` を設定してください。`true` と `false` のみを受け付けます。

  - `max_file_size`: エクスポートジョブの単一ファイルサイズ上限です。結果がこの値を超えると、複数のファイルに分割されます。`max_file_size` の値の範囲は [5MB, 2GB] で、デフォルトは 1GB です。（orc ファイル形式へのエクスポートを指定した場合、実際の分割ファイルサイズは 64MB の倍数になります。例: max_file_size = 5MB を指定すると実際には 64MB で分割され、max_file_size = 65MB を指定すると実際には 128MB で分割されます）

  - `parallelism`: エクスポートジョブの同時実行数です。デフォルトは `1` です。エクスポートジョブは `parallelism` 個のスレッドを開始して `select into outfile` ステートメントを実行します。（Parallelism の数がテーブル内の Tablet 数を超える場合、システムは Parallelism を Tablet 数に自動的に設定します。つまり、各 `select into outfile` ステートメントが 1 つの Tablet を担当します）

  - `delete_existing_files`: デフォルトは `false` です。`true` を指定すると、`export_path` で指定したディレクトリ内のすべてのファイルが先に削除され、その後データがそのディレクトリにエクスポートされます。例: "export_path" = "/user/tmp" の場合、"/user/" 配下のすべてのファイルとディレクトリが削除されます。"file_path" = "/user/tmp/" の場合、"/user/tmp/" 配下のすべてのファイルとディレクトリが削除されます。

  - `with_bom`: デフォルトは `false` です。`true` を指定すると、エクスポートファイルのエンコーディングは BOM 付き UTF8 エンコーディングになります（CSV 関連のファイル形式でのみ有効です）。

  - `data_consistency`: `none` / `partition` に設定でき、デフォルトは `partition` です。エクスポートテーブルを分割する粒度を示します。`none` は Tablets レベル、`partition` は Partition レベルを表します。

  - `timeout`: エクスポートジョブのタイムアウトです。デフォルトは 2 時間で、単位は秒です。

  - `compress_type`: （2.1.5 以降でサポート）エクスポートファイル形式に Parquet / ORC ファイルを指定した場合、Parquet / ORC ファイルで使用する圧縮方式を指定できます。Parquet ファイル形式では SNAPPY、GZIP、BROTLI、ZSTD、LZ4、PLAIN を指定でき、デフォルト値は SNAPPY です。ORC ファイル形式では PLAIN、SNAPPY、ZLIB、ZSTD を指定でき、デフォルト値は ZLIB です。このパラメータはバージョン 2.1.5 以降でサポートされています。（PLAIN は圧縮なしを意味します）。バージョン 3.1.1 以降、CSV 形式の圧縮アルゴリズムを指定でき、現在は "plain"、"gz"、"bz2"、"snappyblock"、"lz4block"、"zstd" をサポートしています。

  :::caution 注意
  delete_existing_files パラメータを使用するには、fe.conf に設定 `enable_delete_existing_files = true` も追加して fe を再起動する必要があります。その後、delete_existing_files が有効になります。delete_existing_files = true は危険な操作であるため、テスト環境でのみ使用することを推奨します。
  :::

**4. `<target_storage>`**
    ストレージ媒体です。BROKER、S3、HDFS を選択できます。

**5. `<broker_properties>`**
    `<target_storage>` のストレージ媒体に応じて、異なるプロパティを指定する必要があります。

- **BROKER**
  Broker プロセスを介してリモートストレージにデータを書き込めます。ここでは、Broker が使用する関連接続情報を定義する必要があります。

  ```sql
  WITH BROKER "broker_name"
  ("<key>"="<value>" [,...])
  ```

  **Broker 関連プロパティ:**
  - `username`: ユーザー名
  - `password`: パスワード
  - `hadoop.security.authentication`: 認証方式を kerberos に指定します
  - `kerberos_principal`: kerberos principal を指定します
  - `kerberos_keytab`: kerberos keytab ファイルへのパスを指定します。このファイルは Broker プロセスが配置されているサーバー上の絶対パスであり、Broker プロセスからアクセスできる必要があります

- **HDFS**

  リモート HDFS にデータを直接書き込めます。

  ```sql
  WITH HDFS ("<key>"="<value>" [,...])
  ```

  **HDFS 関連プロパティ:**
  - `fs.defaultFS`: namenode のアドレスとポート
  - `hadoop.username`: HDFS ユーザー名
  - `dfs.nameservices`: name service 名。hdfs-site.xml と一致している必要があります
  - `dfs.ha.namenodes.[nameservice ID]`: namenode ID のリスト。hdfs-site.xml と一致している必要があります
  - `dfs.namenode.rpc-address.[nameservice ID].[name node ID]`: Name node の RPC アドレス。namenode 数と同じ数が必要で、hdfs-site.xml と一致している必要があります

  **Kerberos 認証が有効な Hadoop クラスターでは、次の PROPERTIES 属性も設定する必要があります:**
  - `dfs.namenode.kerberos.principal`: HDFS namenode サービスの Principal 名
  - `hadoop.security.authentication`: 認証方式を kerberos に設定します
  - `hadoop.kerberos.principal`: Doris が HDFS に接続するときに使用する Kerberos principal を設定します
  - `hadoop.kerberos.keytab`: keytab のローカルファイルパスを設定します

- **S3**

  リモート S3 オブジェクトストレージにデータを直接書き込めます。

  ```sql
  WITH S3 ("<key>"="<value>" [,...])
  ```

  **S3 関連プロパティ:**
  - `s3.endpoint`
  - `s3.region`
  - `s3.secret_key`
  - `s3.access_key`
  - `use_path_style`: （オプション）デフォルトは `false` です。S3 SDK はデフォルトで Virtual-hosted Style を使用します。ただし、一部のオブジェクトストレージシステムでは Virtual-hosted Style によるアクセスが有効になっていないか、サポートされていない場合があります。その場合は `use_path_style` パラメータを追加して、Path Style によるアクセスを強制できます。

## 戻り値 {#return-values}

| 列名                | 型     | 説明                                                                  |
|---------------------|--------|----------------------------------------------------------------------|
| jobId               | long   | エクスポートジョブの一意の識別子。                                |
| label               | string | エクスポートジョブの Label。                                             |
| dbId                | long   | データベースの識別子。                                          |
| tableId             | long   | テーブルの識別子。                                             |
| state               | string | ジョブの現在の状態。                                            |
| path                | string | エクスポートファイルのパス。                                            |
| partitions          | string | エクスポートされたパーティション名のリスト。複数のパーティション名はカンマで区切られます。 |
| progress            | int    | エクスポートジョブの現在の進行状況（パーセンテージ）。                     |
| createTimeMs        | string | ジョブ作成時刻のミリ秒値。日時としてフォーマットされます。      |
| exportStartTimeMs   | string | エクスポートジョブ開始時刻のミリ秒値。日時としてフォーマットされます。  |
| exportFinishTimeMs  | string | エクスポートジョブ終了時刻のミリ秒値。日時としてフォーマットされます。    |
| failMsg             | string | エクスポートジョブが失敗したときのエラーメッセージ。                                 |


## アクセス制御 {#access-control}

この SQL コマンドを実行するユーザーは、少なくとも次の権限を持っている必要があります:

| 権限        | オブジェクト       | 説明                           |
|:------------|:-------------|:--------------------------------------|
| SELECT_PRIV | データベース     | データベースとテーブルへの読み取り権限が必要です。 |


## 注意事項 {#notes}

### 同時実行 {#concurrent-execution}

Export ジョブでは、`parallelism` パラメータを設定してデータを同時にエクスポートできます。`parallelism` パラメータは、実際には EXPORT ジョブを実行するスレッド数を指定します。`"data_consistency" = "none"` を設定すると、各スレッドがテーブルの一部の Tablets を担当します。

Export ジョブの基盤となる実行ロジックは実際には `SELECT INTO OUTFILE` ステートメントです。`parallelism` パラメータで設定した各スレッドが、独立した `SELECT INTO OUTFILE` ステートメントを実行します。

Export ジョブを複数の `SELECT INTO OUTFILE` に分割する具体的なロジックは、テーブルのすべての Tablet をすべての並列スレッドに均等に割り当てることです。例:
- num(tablets) = 40、parallelism = 3 の場合、3 つのスレッドがそれぞれ 14、13、13 個の Tablet を担当します。
- num(tablets) = 2、parallelism = 3 の場合、Doris は parallelism を自動的に 2 に設定し、各スレッドが 1 つの Tablet を担当します。

スレッドが担当する Tablet 数が `maximum_tablets_of_outfile_in_export` の値（デフォルトは 10。fe.conf に `maximum_tablets_of_outfile_in_export` パラメータを追加して変更できます）を超える場合、そのスレッドは複数の `SELECT INTO OUTFILE` ステートメントに分割されます。例:
- 1 つのスレッドが 14 個の Tablet を担当し、`maximum_tablets_of_outfile_in_export = 10` の場合、このスレッドは 2 つの `SELECT INTO OUTFILE` ステートメントを担当します。最初の `SELECT INTO OUTFILE` ステートメントは 10 個の Tablet をエクスポートし、2 番目の `SELECT INTO OUTFILE` ステートメントは 4 個の Tablet をエクスポートします。2 つの `SELECT INTO OUTFILE` ステートメントは、このスレッドによって順番に実行されます。

エクスポートするデータ量が非常に大きい場合は、`parallelism` パラメータを適切に増やして同時エクスポート数を増やすことを検討できます。マシンのコア数に余裕がなく `parallelism` を増やせない一方で、エクスポート対象テーブルの Tablet 数が多い場合は、`maximum_tablets_of_outfile_in_export` を増やして 1 つの `SELECT INTO OUTFILE` ステートメントが担当する Tablet 数を増やすことを検討できます。これによってエクスポート速度も向上します。

Table を Partition 粒度でエクスポートする場合は、Export プロパティ `"data_consistency" = "partition"` を設定できます。この場合、Export タスクの同時実行スレッドは Partition 粒度で複数の Outfile ステートメントに分割されます。異なる Outfile ステートメントは異なる Partition をエクスポートし、同じ Outfile ステートメントがエクスポートするデータは同じ Partition に属します。例: `"data_consistency" = "partition"` を設定した後:

- num(partition) = 40、parallelism = 3 の場合、3 つのスレッドがそれぞれ 14、13、13 個の Partition を担当します。
- num(partition) = 2、parallelism = 3 の場合、Doris は Parallelism を自動的に 2 に設定し、各スレッドが 1 つの Partition を担当します。


### メモリ制限 {#memory-limits}

通常、Export ジョブのクエリプランには `scan-export` の 2 つの部分しかなく、多くのメモリを必要とする計算ロジックは含まれません。そのため、通常はデフォルトの 2GB メモリ制限で要件を満たせます。

ただし、クエリプランが同じ BE 上で非常に多くの Tablet をスキャンする場合や、Tablet データのバージョンが多すぎる場合など、一部のシナリオではメモリ不足が発生する可能性があります。Session 変数 `exec_mem_limit` を調整してメモリ使用量の上限を増やせます。

### その他の事項 {#other-matters}

- 一度に大量のデータをエクスポートすることは推奨されません。1 つの Export ジョブで推奨される最大エクスポートデータ量は数十 GB です。エクスポートが大きすぎると、不要なファイルが増え、再試行コストも高くなります。テーブルデータ量が大きすぎる場合は、パーティション単位でエクスポートすることを推奨します。

- Export ジョブが失敗した場合、すでに生成されたファイルは削除されないため、ユーザーが手動で削除する必要があります。

- Export ジョブはデータをスキャンして IO リソースを占有するため、システムのクエリレイテンシに影響する可能性があります。

- 現在、Export 中に Tablets のバージョンが一致しているかどうかは簡単なチェックのみが行われます。Export の実行中は、このテーブルに対してデータロード操作を実行しないことを推奨します。

- 1 つの Export Job でエクスポートできるパーティション数は最大 2000 です。`fe.conf` にパラメータ `maximum_number_of_export_partitions` を追加して FE を再起動すると、この設定を変更できます。


## 例 {#examples}

### ローカルへのデータエクスポート {#export-data-to-local}
> データをローカルファイルシステムにエクスポートするには、`fe.conf` に `enable_outfile_to_local=true` を追加して FE を再起動する必要があります。

- Test テーブルのすべてのデータをローカルストレージにエクスポートします。デフォルトでは CSV 形式のファイルにエクスポートされます
```sql
EXPORT TABLE test TO "file:///home/user/tmp/";
```

- Test テーブルの k1,k2 列をローカルストレージにエクスポートします。デフォルトの CSV ファイル形式を使用し、Label を設定します
```sql
EXPORT TABLE test TO "file:///home/user/tmp/"
PROPERTIES (
  "label" = "label1",
  "columns" = "k1,k2"
);
```

- Test テーブルで `k1 < 50` の行をローカルストレージにエクスポートします。デフォルトでは CSV 形式のファイルにエクスポートし、`,` を列区切り文字として使用します
```sql
EXPORT TABLE test WHERE k1 < 50 TO "file:///home/user/tmp/"
PROPERTIES (
  "columns" = "k1,k2",
  "column_separator"=","
);
```

- Test テーブルのパーティション p1,p2 をローカルストレージにエクスポートします。デフォルトでは csv 形式のファイルにエクスポートされます
```sql
EXPORT TABLE test PARTITION (p1,p2) TO "file:///home/user/tmp/"
PROPERTIES ("columns" = "k1,k2");
```

- Test テーブルのすべてのデータをローカルストレージにエクスポートし、別の形式のファイルにエクスポートします
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

- `max_file_sizes` プロパティを設定します
   エクスポートファイルが 5MB より大きい場合、データは複数のファイルに分割され、各ファイルの最大サイズは 5MB になります。

```sql
-- When the exported file is larger than 5MB, the data will be split into multiple files, with each file having a maximum size of 5MB.
EXPORT TABLE test TO "file:///home/user/tmp/"
PROPERTIES (
  "format" = "parquet",
  "max_file_size" = "5MB"
);
```

- `parallelism` プロパティを設定します
```sql
EXPORT TABLE test TO "file:///home/user/tmp/"
PROPERTIES (
  "format" = "parquet",
  "max_file_size" = "5MB",
  "parallelism" = "5"
);
```

- `delete_existing_files` プロパティを設定します
    Export がデータをエクスポートするとき、まず `/home/user/` ディレクトリ配下のすべてのファイルとディレクトリを削除し、その後このディレクトリにデータをエクスポートします。

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

- s3_test テーブルのすべてのデータを S3 にエクスポートし、不可視文字 `\x07` を列または行の区切り文字として使用します。データを minio にエクスポートする場合は、`use_path_style`=`true` も指定する必要があります。

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

- Test テーブルのすべてのデータを HDFS にエクスポートします。エクスポートファイル形式は Parquet、エクスポートジョブの単一ファイルサイズ上限は 512MB で、指定したディレクトリ内のすべてのファイルを保持します。

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

### Broker ノード経由でエクスポート {#export-through-broker-node}
最初に Broker プロセスを起動し、この Broker を FE に追加する必要があります。
- Test テーブルのすべてのデータを HDFS にエクスポートします
```sql
EXPORT TABLE test TO "hdfs://hdfs_host:port/a/b/c"
WITH BROKER "broker_name"
(
  "username"="xxx",
  "password"="yyy"
);
```

- testTbl テーブルのパーティション p1,p2 を HDFS にエクスポートし、"," を列区切り文字として使用して Label を指定します

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
