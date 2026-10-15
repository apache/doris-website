---
{
    "title": "OUTFILE",
    "language": "ja",
    "description": "SELECT INTO OUTFILE コマンドは、クエリ結果をファイルにエクスポートするために使用します。現在、HDFS、S3、BOS などのリモートストレージへのエクスポートをサポートしています。",
}
---

## 説明

`SELECT INTO OUTFILE` コマンドは、クエリ結果をファイルにエクスポートするために使用します。現在、Broker プロセス、S3 プロトコル、または HDFS プロトコルを介して、HDFS、S3、BOS、COS（Tencent Cloud）などのリモートストレージへのエクスポートをサポートしています。

## 構文:

```sql
<query_stmt>
INTO OUTFILE "<file_path>"
[ FORMAT AS <format_as> ]
[ <properties> ]
```

## 必須パラメータ

**1. `<query_stmt>`**   

クエリ文。有効な SQL である必要があります。[クエリ文のドキュメント](../../data-query/SELECT.md)を参照してください。  

**2. `<file_path>`**

ファイルの保存先パスとファイル名のプレフィックスを指定します。たとえば、`hdfs://path/to/my_file_` です。  
最終的なファイル名は、`my_file_`、ファイルの連番、ファイル形式の拡張子で構成されます。連番は 0 から始まり、ファイルの分割数に応じて付けられます。例:  
- my_file_abcdefg_0.csv
- my_file_abcdefg_1.csv
- my_file_abcdegf_2.csv  

ファイル名のプレフィックスを省略し、`hdfs://path/to/` のようにディレクトリだけを指定することもできます。

## オプションパラメータ

**1. `<format_as>`**

   エクスポート形式を指定します。現在、次の形式をサポートしています。  
   - `CSV`（デフォルト）
   - `PARQUET`
   - `CSV_WITH_NAMES`
   - `CSV_WITH_NAMES_AND_TYPES`
   - `ORC`

   > 注: PARQUET、CSV_WITH_NAMES、CSV_WITH_NAMES_AND_TYPES、ORC はバージョン 1.2 以降でサポートされています。

**2. `<properties>`**  

```sql
[ PROPERTIES ("<key>"="<value>" [, ... ]) ]
```  

現在、Broker プロセスまたは S3/HDFS プロトコルを介したエクスポートをサポートしています。

**エクスポートするファイル自体に関するプロパティ**
- `column_separator`: 列区切り文字。CSV 系の形式でのみ使用します。バージョン 1.2 以降は、"\\x01" や "abc" などの複数バイトの区切り文字をサポートしています。
- `line_delimiter`: 行区切り文字。CSV 系の形式でのみ使用します。バージョン 1.2 以降は、"\\x01" や "abc" などの複数バイトの区切り文字をサポートしています。
- `max_file_size`: 単一ファイルのサイズ上限。結果がこの値を超えると、複数のファイルに分割されます。`max_file_size` の値の範囲は [5MB, 2GB] で、デフォルトは `1GB` です。（ORC ファイル形式でエクスポートする場合、実際の分割サイズは 64MB の倍数になります。たとえば `max_file_size = 5MB` を指定すると実際には 64 MB ごとに分割され、`max_file_size = 65MB` を指定すると実際には 128 MB ごとに分割されます。）
- `delete_existing_files`: デフォルトは `false` です。`true` を指定すると、最初に `file_path` で指定したディレクトリ配下のすべてのファイルを削除してから、そのディレクトリにデータをエクスポートします。たとえば、"file_path" = "/user/tmp" の場合は "/user/" 配下のすべてのファイルとディレクトリを削除し、"file_path" = "/user/tmp/" の場合は "/user/tmp/" 配下のすべてのファイルとディレクトリを削除します。
- `file_suffix`: エクスポートするファイルの拡張子を指定します。指定しない場合は、ファイル形式のデフォルトの拡張子を使用します。
- `compress_type`: Parquet / ORC ファイル形式でエクスポートする場合、使用する圧縮方式を指定できます。Parquet ファイル形式では SNAPPY、GZIP、BROTLI、ZSTD、LZ4、PLAIN を指定でき、デフォルトは SNAPPY です。ORC ファイル形式では PLAIN、SNAPPY、ZLIB、ZSTD を指定でき、デフォルトは ZLIB です。このパラメータはバージョン 2.1.5 以降でサポートされています。（PLAIN は圧縮しないことを意味します。）バージョン 3.1.1 以降は CSV 形式の圧縮アルゴリズムも指定でき、現在は "plain"、"gz"、"bz2"、"snappyblock"、"lz4block"、"zstd" をサポートしています。

**Broker に関するプロパティ**  _（プレフィックス `broker.` の追加が必要）_  
- `broker.name: broker`: 名前
- `broker.hadoop.security.authentication`: 認証方式として kerberos を指定します
- `broker.kerberos_principal`: kerberos プリンシパルを指定します
- `broker.kerberos_keytab`: kerberos keytab ファイルのパスを指定します。このファイルは Broker プロセスが動作するサーバー上のファイルの絶対パスであり、Broker プロセスからアクセスできる必要があります

**HDFS に関するプロパティ**
- `fs.defaultFS`: namenode のアドレスとポート
- `hadoop.username`: hdfs のユーザー名
- `dfs.nameservices`: ネームサービス名。hdfs-site.xml と一致させます
- `dfs.ha.namenodes.[nameservice ID]`: namenode ID の一覧。hdfs-site.xml と一致させます
- `dfs.namenode.rpc-address.[nameservice ID].[name node ID]`: NameNode の RPC アドレス。namenode の数と同じ数を指定し、hdfs-site.xml と一致させます
- `dfs.client.failover.proxy.provider.[nameservice ID]`: HDFS クライアントがアクティブな namenode に接続するための Java クラス。通常は "org.apache.hadoop.hdfs.server.namenode.ha.ConfiguredFailoverProxyProvider" です

**Kerberos 認証を有効にした Hadoop クラスターでは、追加の PROPERTIES 属性を設定する必要があります:**
- `dfs.namenode.kerberos.principal`: HDFS namenode サービスのプリンシパル名
- `hadoop.security.authentication`: 認証方式を kerberos に設定します
- `hadoop.kerberos.principal`: Doris が HDFS に接続するときに使用する Kerberos プリンシパルを設定します
- `hadoop.kerberos.keytab`: keytab のローカルファイルパスを設定します

S3 プロトコルを使用する場合は、S3 プロトコルの設定を直接指定します:
 - `s3.endpoint`
 - `s3.access_key`
 - `s3.secret_key`
 - `s3.region`
 - `use_path_style`: （オプション）デフォルトは `false` です。S3 SDK はデフォルトで Virtual-hosted Style を使用します。一部のオブジェクトストレージシステムでは Virtual-hosted Style によるアクセスが有効になっていないか、サポートされていない場合があります。その場合は `use_path_style` パラメータを追加して Path Style によるアクセスを強制できます。

> 注: `delete_existing_files` パラメータを使用するには、設定 `enable_delete_existing_files = true` を `fe.conf` に追加し、FE を再起動する必要があります。その後、delete_existing_files が有効になります。delete_existing_files = true は危険な操作のため、テスト環境でのみ使用することを推奨します。

## 戻り値

OUTFILE 文が返す結果の各列の意味は次のとおりです:

| 列名 | 型     | 説明                                     |
|-------------|----------|-------------------------------------------------|
| FileNumber  | int      | 最終的に生成されたファイル数               |
| TotalRows   | int      | 結果セットの行数                    |
| FileSize    | int      | エクスポートしたファイルの合計サイズ。単位: バイト。     |
| URL         | string   | エクスポートしたファイルパスのプレフィックス。複数のファイルには、末尾に `_0`、`_1` のように連番が付けられます。 |

## 権限管理

この SQL コマンドを実行するユーザーには、少なくとも次の権限が必要です:

| 権限  | 対象        | 説明                    |
|:------------|:-------------|:-------------------------------|
| SELECT_PRIV | Database     | データベースとテーブルに対する読み取り権限が必要です。 |

## 注意事項

### データ型の対応

- すべてのファイル形式で基本データ型のエクスポートをサポートしています。一方、複合データ型（ARRAY/MAP/STRUCT）のエクスポートをサポートしているのは、現在 `csv`、`orc`、`csv_with_names`、`csv_with_names_and_types` のみであり、入れ子になった複合データ型はサポートされていません。

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
   | datev2                  | string    |
   | datetime                | string    |
   | datetimev2              | timestamp |
   | float                   | float     |
   | double                  | double    |
   | char / varchar / string | string    |
   | uuid                    | binary    |
   | decimal                 | decimal   |
   | struct                  | struct    |
   | map                     | map       |
   | array                   | array     |

2. **Doris から Parquet ファイル形式へのデータ型の対応表:**

   Doris が Parquet ファイル形式にエクスポートするときは、まず Doris のメモリ上のデータを Arrow のメモリデータ形式に変換し、その後 Arrow が Parquet ファイル形式に書き込みます。Doris のデータ型と Arrow のデータ型の対応は次のとおりです:
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

CSV は UUID 値を小文字の標準形式のテキストとして書き込みます。Parquet は UUID の論理型アノテーションを付けた `FIXED_LEN_BYTE_ARRAY(16)` として書き込み、ORC は `BINARY` として書き込みます。ORC では、ARRAY、MAP、STRUCT 内の入れ子になった UUID 要素も含めて、Doris 固有の `doris.logical_type=uuid` 属性を付けます。ORC の `schema` プロパティを明示的に指定する場合、UUID 列は `binary` として宣言してください。`string` などの別の型は拒否されます。

### エクスポートするデータ量とエクスポート効率

   この機能は実質的に SQL クエリコマンドを実行します。最終結果は単一スレッドで出力されます。そのため、エクスポートの合計時間にはクエリの実行時間と最終結果セットの書き込み時間が含まれます。大規模なクエリの場合は、セッション変数 `query_timeout` を設定してクエリのタイムアウト時間を適切に延長する必要があります。

### エクスポートしたファイルの管理

   Doris はエクスポートしたファイルを管理しません。正常にエクスポートされたファイルも、エクスポート失敗後に残ったファイルも、ユーザー自身で処理する必要があります。

### ローカルファイルへのエクスポート
   ローカルファイルにエクスポートするには、まず `enable_outfile_to_local=true` を `fe.conf` に設定する必要があります。  
   ```sql
   select * from tbl1 limit 10 
   INTO OUTFILE "file:///home/work/path/result_";
   ```

   ローカルファイルへのエクスポート機能はパブリッククラウドのユーザーには適さず、プライベート環境にデプロイしたユーザー向けです。また、ユーザーがクラスターノードを完全に管理できることを前提としています。Doris は、ユーザーが指定したエクスポート先パスの有効性を検査しません。Doris プロセスのユーザーにそのパスへの書き込み権限がない場合や、パスが存在しない場合はエラーになります。また、セキュリティ上の理由から、そのパスに同名のファイルがすでに存在する場合もエクスポートに失敗します。

   Doris はローカルにエクスポートしたファイルを管理せず、ディスク容量なども確認しません。これらのファイルの削除などはユーザー自身で管理する必要があります。

### 結果の完全性の保証

   このコマンドは同期コマンドです。そのため、実行中にタスクの接続が切断されると、データのエクスポートが正常に終了したか、完全かどうかが分からなくなる場合があります。このような場合は、`success_file_name` パラメータを使用して、タスクの正常終了後にディレクトリ内に成功を示すファイルを生成できます。ユーザーはこのファイルを使って、エクスポートが正常に終了したかどうかを判断できます。

### 並列エクスポート

   セッション変数を `set enable_parallel_outfile = true;` で設定すると、OUTFILE の並列エクスポートが有効になります。

## 例

- Broker 方式で簡単なクエリ結果をファイル `hdfs://path/to/result.txt` にエクスポートします。エクスポート形式に CSV を指定します。`my_broker` を使用して Kerberos 認証情報を設定します。列区切り文字に `,`、行区切り文字に `\n` を指定します。

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

   最終的に生成されるファイルは、100MB 以下なら `result_0.csv` です。
   100MB を超える場合は、`result_0.csv, result_1.csv, ...` のようになることがあります。

- 簡単なクエリ結果をファイル `hdfs://path/to/result.parquet` にエクスポートします。エクスポート形式に PARQUET を指定します。`my_broker` を使用して Kerberos 認証情報を設定します。

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

- CTE 文のクエリ結果をファイル `hdfs://path/to/result.txt` にエクスポートします。デフォルトのエクスポート形式は CSV です。`my_broker` を使用して HDFS の高可用性情報を設定します。行区切り文字と列区切り文字にはデフォルト値を使用します。

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

   最終的に生成されるファイルは、1GB 以下なら `result_0.csv` です。
   1GB を超える場合は、`result_0.csv, result_1.csv, ...` のようになることがあります。

- UNION 文のクエリ結果をファイル `bos://bucket/result.txt` にエクスポートします。エクスポート形式に PARQUET を指定します。`my_broker` を使用して HDFS の高可用性情報を設定します。PARQUET 形式では列区切り文字を指定する必要はありません。
   エクスポート完了後、識別子ファイルを生成します。

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

- SELECT 文のクエリ結果をファイル `s3a://${bucket_name}/path/result.txt` にエクスポートします。エクスポート形式に CSV を指定します。
   エクスポート完了後、識別子ファイルを生成します。

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

   最終的に生成されるファイルは、1GB 以下なら `my_file_0.csv` です。
   1GB を超える場合は、`my_file_0.csv, result_1.csv, ...` のようになることがあります。
   COS での確認事項:

        1. Non-existing paths will be automatically created
        2. access.key/secret.key/endpoint need to be confirmed with cos colleagues. Especially the endpoint value, no need to fill in bucket_name.

- S3 プロトコルを使用し、並列エクスポートを有効にして BOS にエクスポートします。

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

   最終的に生成されるファイル名のプレフィックスは `my_file_{fragment_instance_id}_` です。

- S3 プロトコルを使用し、並列エクスポートのセッション変数を有効にして BOS にエクスポートします。
   注: ただし、クエリ文に最上位のソートノードがあるため、このクエリでは並列エクスポートのセッション変数が有効でも並列エクスポートを使用できません。

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

- HDFS 方式で簡単なクエリ結果をファイル `hdfs://${host}:${fileSystem_port}/path/to/result.txt` にエクスポートします。エクスポート形式に CSV、ユーザー名に work を指定します。列区切り文字に `,`、行区切り文字に `\n` を指定します。

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

   Hadoop クラスターで高可用性が有効になっており、Kerberos 認証を使用している場合は、次の SQL 文を参照してください:

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

   最終的に生成されるファイルは、100 MB 以下なら `result_0.csv` です。
   100 MB を超える場合は、`result_0.csv, result_1.csv, ...` のようになることがあります。

- SELECT 文のクエリ結果を Tencent Cloud COS のファイル `cosn://${bucket_name}/path/result.txt` にエクスポートします。エクスポート形式に CSV を指定します。
   エクスポート完了後、識別子ファイルを生成します。

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
