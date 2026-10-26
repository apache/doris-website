---
{
    "title": "OUTFILE",
    "language": "ja",
    "description": "SELECT INTO OUTFILE コマンドは、クエリ結果をファイルにエクスポートするために使用します。現在、HDFS、S3、BOS などのリモートストレージへのエクスポートをサポートしています。"
}
---

## 説明 {#description}

`SELECT INTO OUTFILE` コマンドは、クエリ結果をファイルにエクスポートするために使用します。現在、Broker プロセス、S3 プロトコル、または HDFS プロトコルを通じて、HDFS、S3、BOS、COS（Tencent Cloud）などのリモートストレージへのエクスポートをサポートしています。

## 構文: {#syntax}

```sql
<query_stmt>
INTO OUTFILE "<file_path>"
[ FORMAT AS <format_as> ]
[ <properties> ]
```

## 必須パラメータ {#required-parameters}

**1. `<query_stmt>`**

クエリ文。有効な SQL である必要があります。[クエリ文のドキュメント](../../data-query/SELECT.md)を参照してください。

**2. `<file_path>`**

ファイルの保存先パスとファイル名のプレフィックスを指定します。たとえば、`hdfs://path/to/my_file_` です。
最終的なファイル名は、`my_file_`、ファイルの連番、ファイル形式の拡張子で構成されます。ファイルの連番は 0 から始まり、その数は分割されたファイルの数に応じて決まります。例:
- my_file_abcdefg_0.csv
- my_file_abcdefg_1.csv
- my_file_abcdegf_2.csv

ファイル名のプレフィックスを省略し、`hdfs://path/to/` のようにディレクトリのみを指定することもできます。

## オプションパラメータ {#optional-parameters}

**1. `<format_as>`**

   エクスポート形式を指定します。現在、次の形式をサポートしています。
   - `CSV`（デフォルト）
   - `PARQUET`
   - `CSV_WITH_NAMES`
   - `CSV_WITH_NAMES_AND_TYPES`
   - `ORC`

   >   注: PARQUET、CSV_WITH_NAMES、CSV_WITH_NAMES_AND_TYPES、ORC はバージョン 1.2 以降でサポートされています。

**2. `<properties>`**

```sql
[ PROPERTIES ("<key>"="<value>" [, ... ]) ]
```

現在、Broker プロセス、または S3/HDFS プロトコルを通じたエクスポートをサポートしています。

**エクスポートファイル自体に関するプロパティ**
- `column_separator`: 列区切り文字。CSV 関連の形式でのみ使用します。バージョン 1.2 以降では、"\\x01" や "abc" などの複数バイトの区切り文字をサポートしています。
- `line_delimiter`: 行区切り文字。CSV 関連の形式でのみ使用します。バージョン 1.2 以降では、"\\x01" や "abc" などの複数バイトの区切り文字をサポートしています。
- `max_file_size`: 単一ファイルのサイズ上限。結果がこの値を超えると、複数のファイルに分割されます。`max_file_size` の設定範囲は [5MB, 2GB] で、デフォルトは `1GB` です。（エクスポート形式に ORC を指定した場合、実際の分割サイズは 64MB の倍数になります。たとえば、`max_file_size = 5MB` を指定すると実際には 64 MB ごとに分割され、`max_file_size = 65MB` を指定すると 128 MB ごとに分割されます）
- `delete_existing_files`: デフォルトは `false` です。`true` を指定すると、先に `file_path` で指定したディレクトリ配下のすべてのファイルを削除してから、そのディレクトリにデータをエクスポートします。たとえば、"file_path" = "/user/tmp" の場合は "/user/" 配下のすべてのファイルとディレクトリを削除し、"file_path" = "/user/tmp/" の場合は "/user/tmp/" 配下のすべてのファイルとディレクトリを削除します。
- `file_suffix`: エクスポートするファイルの拡張子を指定します。このパラメータを指定しない場合は、ファイル形式のデフォルトの拡張子が使用されます。
- `compress_type`: エクスポート形式に Parquet / ORC を指定した場合、Parquet / ORC ファイルで使用する圧縮方式を指定できます。Parquet ファイル形式では SNAPPY、GZIP、BROTLI、ZSTD、LZ4、PLAIN を指定でき、デフォルトは SNAPPY です。ORC ファイル形式では PLAIN、SNAPPY、ZLIB、ZSTD を指定でき、デフォルトは ZLIB です。このパラメータはバージョン 2.1.5 以降でサポートされています。（PLAIN は非圧縮を意味します）。バージョン 3.1.1 以降では CSV 形式の圧縮アルゴリズムも指定でき、現在は "plain"、"gz"、"bz2"、"snappyblock"、"lz4block"、"zstd" をサポートしています。

**Broker 関連のプロパティ**  _（プレフィックス `broker.` の追加が必要）_
- `broker.name: broker`: 名前
- `broker.hadoop.security.authentication`: 認証方式に kerberos を指定します
- `broker.kerberos_principal`: kerberos principal を指定します
- `broker.kerberos_keytab`: kerberos keytab ファイルのパスを指定します。このファイルは Broker プロセスが稼働するサーバー上のファイルで、絶対パスで指定する必要があります。また、Broker プロセスからアクセスできる必要があります

**HDFS 関連のプロパティ**
- `fs.defaultFS`: namenode のアドレスとポート
- `hadoop.username`: HDFS のユーザー名
- `dfs.nameservices`: ネームサービス名。hdfs-site.xml と一致させます
- `dfs.ha.namenodes.[nameservice ID]`: namenode ID の一覧。hdfs-site.xml と一致させます
- `dfs.namenode.rpc-address.[nameservice ID].[name node ID]`: Name node の RPC アドレス。namenode の数だけ指定し、hdfs-site.xml と一致させます
- `dfs.client.failover.proxy.provider.[nameservice ID]`: HDFS クライアントがアクティブな namenode に接続するための Java クラス。通常は "org.apache.hadoop.hdfs.server.namenode.ha.ConfiguredFailoverProxyProvider" です

**kerberos 認証が有効な Hadoop クラスターでは、次の PROPERTIES 属性も設定する必要があります:**
- `dfs.namenode.kerberos.principal`: HDFS namenode サービスの principal 名
- `hadoop.security.authentication`: 認証方式を kerberos に設定します
- `hadoop.kerberos.principal`: Doris が HDFS に接続する際に使用する Kerberos principal を設定します
- `hadoop.kerberos.keytab`: keytab のローカルファイルパスを設定します

S3 プロトコルを使用する場合は、S3 プロトコルの設定を直接指定します:
 - `s3.endpoint`
 - `s3.access_key`
 - `s3.secret_key`
 - `s3.region`
 - `use_path_style`: （任意）デフォルトは `false` です。S3 SDK はデフォルトで Virtual-hosted Style を使用します。ただし、一部のオブジェクトストレージシステムでは Virtual-hosted Style によるアクセスが有効になっていないか、サポートされていない場合があります。その場合は、`use_path_style` パラメータを追加して Path Style によるアクセスを強制できます。

> 注: `delete_existing_files` パラメータを使用するには、`fe.conf` に設定 `enable_delete_existing_files = true` を追加して FE を再起動する必要があります。再起動後に `delete_existing_files` が有効になります。delete_existing_files = true は危険な操作のため、テスト環境でのみ使用することを推奨します。

## 戻り値 {#return-value}

Outfile 文が返す結果の各列の意味は次のとおりです:

| 列名 | 型     | 説明                                     |
|-------------|----------|-------------------------------------------------|
| FileNumber  | int      | 最終的に生成されたファイルの数               |
| TotalRows   | int      | 結果セットの行数                    |
| FileSize    | int      | エクスポートされたファイルの合計サイズ。単位: バイト。     |
| URL         | string   | エクスポートされたファイルのパスのプレフィックス。複数のファイルには `_0`、`_1` のように順番に連番が付与されます。 |

## 権限制御 {#permission-control}

この SQL コマンドを実行するユーザーには、少なくとも次の権限が必要です:

| 権限  | オブジェクト        | 説明                    |
|:------------|:-------------|:-------------------------------|
| SELECT_PRIV | データベース     | データベースとテーブルに対する読み取り権限が必要です。 |

4.1.5 以降、Parquet エクスポートでは `enable_int96_timestamps` のデフォルトが `false` となり、論理 `INT64` タイムスタンプを使用します。読み取り側で INT96 が必要な場合は、明示的に `true` を設定してください。このプロパティに指定できる値は `true` または `false` のみです。日付とタイムゾーンの扱いについては、[Parquet](../../../../lakehouse/file-formats/parquet.md) を参照してください。

## 注意事項 {#notes}

### データ型のマッピング {#data-type-mapping}

- すべてのファイル形式で基本データ型をエクスポートできます。一方、複合データ型（ARRAY/MAP/STRUCT）のエクスポートを現在サポートしているのは `csv`、`orc`、`csv_with_names`、`csv_with_names_and_types` のみで、ネストした複合データ型はサポートしていません。

- Parquet と ORC のファイル形式にはそれぞれ独自のデータ型があります。Doris のエクスポート機能は、Doris のデータ型を Parquet/ORC ファイル形式の対応するデータ型に自動的に変換できます。Apache Doris のデータ型と Parquet/ORC ファイル形式のデータ型の対応表を次に示します:

1. **Doris から ORC ファイル形式へのデータ型の対応表:**
   | Doris の型              | ORC の型  |
   |-------------------------|-----------|
   | boolean                 | boolean   |
   | tinyint                 | tinyint   |
   | smallint                | smallint  |
   | int                     | int       |
   | bigint                  | bigint    |
   | largeInt                | string    |
   | date                    | string    |
   | datev2                  | date      |
   | datetime                | string    |
   | datetimev2              | timestamp |
   | timestamptz | timestamp with local time zone（ORC TIMESTAMP_INSTANT。4.1.5 以降、時点を表す意味を保持） |
   | varbinary | binary |
   | float                   | float     |
   | double                  | double    |
   | char / varchar / string | string    |
   | uuid                    | binary    |
   | decimal                 | decimal   |
   | struct                  | struct    |
   | map                     | map       |
   | array                   | array     |

2. **Doris から Parquet ファイル形式へのデータ型の対応表:**

   Doris が Parquet ファイル形式にエクスポートする際は、まず Doris のメモリ上のデータを Arrow のメモリ上のデータ形式に変換し、その後 Arrow が Parquet ファイル形式に書き込みます。Doris のデータ型と Arrow のデータ型の対応関係は次のとおりです:
   | Doris の型              | Arrow の型 |
   |-------------------------|------------|
   | boolean                 | boolean    |
   | tinyint                 | int8       |
   | smallint                | int16      |
   | int                     | int32      |
   | bigint                  | int64      |
   | largeInt                | utf8       |
   | date                    | utf8       |
   | datev2                  | utf8       |
   | datetime                | utf8       |
   | datetimev2              | utf8       |
   | float                   | float32    |
   | double                  | float64    |
   | char / varchar / string | utf8       |
   | uuid                    | fixed_size_binary(16) |
   | decimal                 | decimal128 |
   | struct                  | struct     |
   | map                     | map        |
   | array                   | list       |

CSV は UUID 値を小文字の標準的なテキスト表現で書き込みます。Parquet は UUID の論理型注釈を付けた `FIXED_LEN_BYTE_ARRAY(16)` として書き込み、ORC は Doris 固有の `doris.logical_type=uuid` 属性を付けた `BINARY` として書き込みます。ARRAY、MAP、STRUCT にネストした UUID 要素も対象です。ORC の `schema` プロパティを明示的に指定する場合は、UUID 列を `binary` として宣言してください。`string` などの別の型を指定すると拒否されます。

### エクスポートするデータ量とエクスポート効率 {#export-data-volume-and-export-efficiency}

   この機能は、基本的には SQL クエリコマンドを実行します。最終結果の出力は単一スレッドで行われます。そのため、エクスポートの総所要時間には、クエリの実行時間と最終結果セットの書き込み時間が含まれます。クエリの規模が大きい場合は、セッション変数 `query_timeout` を設定し、クエリのタイムアウトを適切に延長する必要があります。

### エクスポートされたファイルの管理 {#exported-file-management}

   Doris はエクスポートされたファイルを管理しません。エクスポートに成功したファイルも、失敗後に残ったファイルも、すべてユーザー自身で管理する必要があります。

### ローカルファイルへのエクスポート {#export-to-local-files}
   ローカルファイルにエクスポートするには、まず `fe.conf` で `enable_outfile_to_local=true` を設定する必要があります。
   ```sql
   select * from tbl1 limit 10
   INTO OUTFILE "file:///home/work/path/result_";
   ```

   ローカルファイルへのエクスポート機能は、パブリッククラウドのユーザーには適しておらず、プライベート環境にデプロイしているユーザー向けです。また、ユーザーがクラスターノードを完全に制御できることを前提としています。Doris は、ユーザーが指定したエクスポート先のパスが有効かどうかを確認しません。Doris プロセスの実行ユーザーにそのパスへの書き込み権限がない場合や、パスが存在しない場合は、エラーが報告されます。また、セキュリティ上の理由から、そのパスに同じ名前のファイルがすでに存在する場合もエクスポートは失敗します。

   Doris はローカルにエクスポートしたファイルを管理せず、ディスク容量なども確認しません。これらのファイルの削除などは、ユーザー自身で行う必要があります。

### 結果の完全性の保証 {#result-integrity-guarantee}

   このコマンドは同期コマンドです。そのため、実行中にタスクの接続が切れると、データのエクスポートが正常に終了したか、結果が完全かを判断できない場合があります。この場合、`success_file_name` パラメータを使用すると、タスクの正常完了後に成功を示すファイルをディレクトリ内に生成できます。ユーザーはこのファイルを使って、エクスポートが正常に終了したかどうかを判断できます。

### 並列エクスポート {#concurrent-export}

   セッション変数 `set enable_parallel_outfile = true;` を設定すると、Outfile の並列エクスポートが有効になります。

## 例 {#examples}

- Broker 方式を使用して、単純なクエリ結果をファイル `hdfs://path/to/result.txt` にエクスポートします。エクスポート形式には CSV を指定します。`my_broker` を使用し、kerberos 認証情報を設定します。列区切り文字に `,`、行区切り文字に `\n` を指定します。

    ```sql
    SELECT * FROM tbl
    INTO OUTFILE "hdfs://path/to/result_"
    FORMAT AS CSV
    PROPERTIES
    (
        "broker.name" = "my_broker",
        "broker.hadoop.security.authentication" = "kerberos",
        "broker.kerberos_principal" = "doris@YOUR.COM",
        "broker.kerberos_keytab" = "/home/doris/my.keytab",
        "column_separator" = ",",
        "line_delimiter" = "\n",
        "max_file_size" = "100MB"
    );
    ```

   最終的に生成されるファイルは、100MB 以下であれば `result_0.csv` です。
   100MB を超える場合は、`result_0.csv, result_1.csv, ...` のようになります。

- 単純なクエリ結果をファイル `hdfs://path/to/result.parquet` にエクスポートします。エクスポート形式には PARQUET を指定します。`my_broker` を使用し、kerberos 認証情報を設定します。

    ```sql
    SELECT c1, c2, c3 FROM tbl
    INTO OUTFILE "hdfs://path/to/result_"
    FORMAT AS PARQUET
    PROPERTIES
    (
        "broker.name" = "my_broker",
        "broker.hadoop.security.authentication" = "kerberos",
        "broker.kerberos_principal" = "doris@YOUR.COM",
        "broker.kerberos_keytab" = "/home/doris/my.keytab"
    );
    ```

- CTE 文のクエリ結果をファイル `hdfs://path/to/result.txt` にエクスポートします。デフォルトのエクスポート形式は CSV です。`my_broker` を使用して HDFS の高可用性に関する情報を設定し、行と列の区切り文字にはデフォルト値を使用します。

    ```sql
    WITH
    x1 AS
    (SELECT k1, k2 FROM tbl1),
    x2 AS
    (SELECT k3 FROM tbl2)
    SELEC k1 FROM x1 UNION SELECT k3 FROM x2
    INTO OUTFILE "hdfs://path/to/result_"
    PROPERTIES
    (
        "broker.name" = "my_broker",
        "broker.username"="user",
        "broker.password"="passwd",
        "broker.dfs.nameservices" = "my_ha",
        "broker.dfs.ha.namenodes.my_ha" = "my_namenode1, my_namenode2",
        "broker.dfs.namenode.rpc-address.my_ha.my_namenode1" = "nn1_host:rpc_port",
        "broker.dfs.namenode.rpc-address.my_ha.my_namenode2" = "nn2_host:rpc_port",
        "broker.dfs.client.failover.proxy.provider" = "org.apache.hadoop.hdfs.server.namenode.ha.ConfiguredFailoverProxyProvider"
    );
    ```

   最終的に生成されるファイルは、1GB 以下であれば `result_0.csv` です。
   1GB を超える場合は、`result_0.csv, result_1.csv, ...` のようになります。

- UNION 文のクエリ結果をファイル `bos://bucket/result.txt` にエクスポートします。エクスポート形式には PARQUET を指定します。`my_broker` を使用し、HDFS の高可用性に関する情報を設定します。PARQUET 形式では列区切り文字を指定する必要はありません。
   エクスポートの完了後、識別用のファイルを生成します。

    ```sql
    SELECT k1 FROM tbl1 UNION SELECT k2 FROM tbl1
    INTO OUTFILE "bos://bucket/result_"
    FORMAT AS PARQUET
    PROPERTIES
    (
        "broker.name" = "my_broker",
        "broker.bos_endpoint" = "http://bj.bcebos.com",
        "broker.bos_accesskey" = "xxxxxxxxxxxxxxxxxxxxxxxxxx",
        "broker.bos_secret_accesskey" = "yyyyyyyyyyyyyyyyyyyyyyyyyy"
    );
    ```

- SELECT 文のクエリ結果をファイル `s3a://${bucket_name}/path/result.txt` にエクスポートします。エクスポート形式には CSV を指定します。
   エクスポートの完了後、識別用のファイルを生成します。

    ```sql
    select k1,k2,v1 from tbl1 limit 100000
    into outfile "s3a://my_bucket/export/my_file_"
    FORMAT AS CSV
    PROPERTIES
    (
        "broker.name" = "hdfs_broker",
        "broker.fs.s3a.access.key" = "xxx",
        "broker.fs.s3a.secret.key" = "xxxx",
        "broker.fs.s3a.endpoint" = "https://cos.xxxxxx.myqcloud.com/",
        "column_separator" = ",",
        "line_delimiter" = "\n",
        "max_file_size" = "1024MB",
        "success_file_name" = "SUCCESS"
    )
    ```

   最終的に生成されるファイルは、1GB 以下であれば `my_file_0.csv` です。
   1GB を超える場合は、`my_file_0.csv, result_1.csv, ...` のようになります。
   COS での確認事項:

        1. 存在しないパスは自動的に作成されます
        2. access.key/secret.key/endpoint は COS の担当者に確認する必要があります。特に endpoint の値に bucket_name を含める必要はありません。

- S3 プロトコルを使用して BOS にエクスポートし、並列エクスポートを有効にします。

    ```sql
    set enable_parallel_outfile = true;
    select k1 from tb1 limit 1000
    into outfile "s3://my_bucket/export/my_file_"
    format as csv
    properties
    (
        "s3.endpoint" = "http://s3.bd.bcebos.com",
        "s3.access_key" = "xxxx",
        "s3.secret_key" = "xxx",
        "s3.region" = "bd"
    )
    ```

   最終的に生成されるファイルのプレフィックスは `my_file_{fragment_instance_id}_` です。

- 並列エクスポートのセッション変数を有効にして、S3 プロトコルを使用して BOS にエクスポートします。
   注: このクエリ文にはトップレベルのソートノードがあるため、並列エクスポートのセッション変数が有効でも、このクエリでは並列エクスポートを使用できません。

    ```sql
    set enable_parallel_outfile = true;
    select k1 from tb1 order by k1 limit 1000
    into outfile "s3://my_bucket/export/my_file_"
    format as csv
    properties
    (
        "s3.endpoint" = "http://s3.bd.bcebos.com",
        "s3.access_key" = "xxxx",
        "s3.secret_key" = "xxx",
        "s3.region" = "bd"
    )
    ```

- HDFS 方式を使用して、単純なクエリ結果をファイル `hdfs://${host}:${fileSystem_port}/path/to/result.txt` にエクスポートします。エクスポート形式には CSV、ユーザー名には work を指定します。列区切り文字に `,`、行区切り文字に `\n` を指定します。

    ```sql
    -- fileSystem_port default value is 9000
    SELECT * FROM tbl
    INTO OUTFILE "hdfs://${host}:${fileSystem_port}/path/to/result_"
    FORMAT AS CSV
    PROPERTIES
    (
        "fs.defaultFS" = "hdfs://ip:port",
        "hadoop.username" = "work"
    );
    ```

   Hadoop クラスターで高可用性が有効になっており、Kerberos 認証を使用する場合は、次の SQL 文を参照してください:

    ```sql
    SELECT * FROM tbl
    INTO OUTFILE "hdfs://path/to/result_"
    FORMAT AS CSV
    PROPERTIES
    (
    'fs.defaultFS'='hdfs://hacluster/',
    'dfs.nameservices'='hacluster',
    'dfs.ha.namenodes.hacluster'='n1,n2',
    'dfs.namenode.rpc-address.hacluster.n1'='192.168.0.1:8020',
    'dfs.namenode.rpc-address.hacluster.n2'='192.168.0.2:8020',
    'dfs.client.failover.proxy.provider.hacluster'='org.apache.hadoop.hdfs.server.namenode.ha.ConfiguredFailoverProxyProvider',
    'dfs.namenode.kerberos.principal'='hadoop/_HOST@REALM.COM'
    'hadoop.security.authentication'='kerberos',
    'hadoop.kerberos.principal'='doris_test@REALM.COM',
    'hadoop.kerberos.keytab'='/path/to/doris_test.keytab'
    );
    ```

   最終的に生成されるファイルは、100 MB 以下であれば `result_0.csv` です。
   100 MB を超える場合は、`result_0.csv, result_1.csv, ...` のようになります。

- SELECT 文のクエリ結果を Tencent Cloud COS のファイル `cosn://${bucket_name}/path/result.txt` にエクスポートします。エクスポート形式には CSV を指定します。
   エクスポートの完了後、識別用のファイルを生成します。

    ```sql
    select k1,k2,v1 from tbl1 limit 100000
    into outfile "cosn://my_bucket/export/my_file_"
    FORMAT AS CSV
    PROPERTIES
    (
        "broker.name" = "broker_name",
        "broker.fs.cosn.userinfo.secretId" = "xxx",
        "broker.fs.cosn.userinfo.secretKey" = "xxxx",
        "broker.fs.cosn.bucket.endpoint_suffix" = "cos.xxxxxx.myqcloud.com",
        "column_separator" = ",",
        "line_delimiter" = "\n",
        "max_file_size" = "1024MB",
        "success_file_name" = "SUCCESS"
    )
    ```
