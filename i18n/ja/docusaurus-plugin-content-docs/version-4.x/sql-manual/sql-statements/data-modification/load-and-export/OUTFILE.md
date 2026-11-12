---
{
    "title": "OUTFILE",
    "language": "ja",
    "description": "SELECT INTO OUTFILE コマンドは、クエリ結果をファイルにエクスポートするために使用します。現在、Broker プロセス、S3 プロトコル、または HDFS プロトコルを介して、HDFS、S3、BOS、COS（Tencent Cloud）などのリモートストレージへのエクスポートをサポートしています。"
}
---

## 説明 {#description}

`SELECT INTO OUTFILE` コマンドは、クエリ結果をファイルにエクスポートするために使用します。現在、Broker プロセス、S3 プロトコル、または HDFS プロトコルを介して、HDFS、S3、BOS、COS（Tencent Cloud）などのリモートストレージへのエクスポートをサポートしています。

## 構文: {#syntax}

```sql
<query_stmt>
INTO OUTFILE "<file_path>"
[ FORMAT AS <format_as> ]
[ <properties> ]
```

## 必須パラメータ {#required-parameters}

**1. `<query_stmt>`**

クエリ文。正しい SQL である必要があります。[クエリ文のドキュメント](../../data-query/SELECT.md)を参照してください。

**2. `<file_path>`**

ファイルの保存先パスとファイルプレフィックス。ファイルの保存先パスとファイルプレフィックスを指定します。例: `hdfs://path/to/my_file_`。
最終的なファイル名は、`my_file_`、ファイルシーケンス番号、ファイル形式のサフィックスで構成されます。ファイルシーケンス番号は 0 から始まり、その数は分割されたファイル数です。例:
- my_file_abcdefg_0.csv
- my_file_abcdefg_1.csv
- my_file_abcdegf_2.csv

ファイルプレフィックスを省略して、ファイルディレクトリのみを指定することもできます。例: `hdfs://path/to/`

## 任意パラメータ {#optional-parameters}

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

現在、Broker プロセス、または S3/HDFS プロトコルを介したエクスポートをサポートしています。

**エクスポートファイル自体に関するプロパティ**
- `column_separator`: 列区切り文字。CSV 関連の形式でのみ使用します。バージョン 1.2 以降では、"\\x01"、"abc" などのマルチバイト区切り文字をサポートします。
- `line_delimiter`: 行区切り文字。CSV 関連の形式でのみ使用します。バージョン 1.2 以降では、"\\x01"、"abc" などのマルチバイト区切り文字をサポートします。
- `max_file_size`: 1 ファイルあたりのサイズ制限。結果がこの値を超えると、複数のファイルに分割されます。`max_file_size` の値の範囲は [5MB, 2GB] で、デフォルトは `1GB` です。（ORC ファイル形式としてエクスポートを指定した場合、実際の分割ファイルサイズは 64MB の倍数になります。例: `max_file_size = 5MB` を指定すると実際には 64 MB で分割され、`max_file_size = 65MB` を指定すると実際には 128 MB で分割されます）
- `delete_existing_files`: デフォルトは `false` です。`true` を指定すると、まず `file_path` で指定したディレクトリ下のすべてのファイルを削除してから、そのディレクトリにデータをエクスポートします。例: "file_path" = "/user/tmp" の場合は "/user/" 下のすべてのファイルとディレクトリを削除し、"file_path" = "/user/tmp/" の場合は "/user/tmp/" 下のすべてのファイルとディレクトリを削除します。
- `file_suffix`: エクスポートファイルのサフィックスを指定します。このパラメータを指定しない場合は、ファイル形式のデフォルトサフィックスが使用されます。
- `compress_type`: エクスポートするファイル形式として Parquet / ORC ファイルを指定した場合、Parquet / ORC ファイルで使用する圧縮方式を指定できます。Parquet ファイル形式では SNAPPY、GZIP、BROTLI、ZSTD、LZ4、PLAIN を指定でき、デフォルト値は SNAPPY です。ORC ファイル形式では PLAIN、SNAPPY、ZLIB、ZSTD を指定でき、デフォルト値は ZLIB です。このパラメータはバージョン 2.1.5 以降でサポートされています。（PLAIN は圧縮なしを意味します）。バージョン 3.1.1 以降では、CSV 形式の圧縮アルゴリズムを指定できます。現在、"plain"、"gz"、"bz2"、"snappyblock"、"lz4block"、"zstd" をサポートしています。

**Broker 関連プロパティ**  _（プレフィックス `broker.` を付ける必要があります）_
- `broker.name: broker`: 名前
- `broker.hadoop.security.authentication`: 認証方式として kerberos を指定します
- `broker.kerberos_principal`: kerberos の principal を指定します
- `broker.kerberos_keytab`: kerberos の keytab ファイルパスを指定します。このファイルは Broker プロセスが配置されているサーバー上の絶対パスである必要があります。また、Broker プロセスからアクセスできる必要があります

**HDFS 関連プロパティ**
- `fs.defaultFS`: namenode のアドレスとポート
- `hadoop.username`: hdfs ユーザー名
- `dfs.nameservices`: name service 名。hdfs-site.xml と一致している必要があります
- `dfs.ha.namenodes.[nameservice ID]`: namenode の ID リスト。hdfs-site.xml と一致している必要があります
- `dfs.namenode.rpc-address.[nameservice ID].[name node ID]`: Name node の RPC アドレス。namenode の数と同じ数を指定し、hdfs-site.xml と一致している必要があります
- `dfs.client.failover.proxy.provider.[nameservice ID]`: HDFS クライアントがアクティブな namenode に接続するための Java クラス。通常は "org.apache.hadoop.hdfs.server.namenode.ha.ConfiguredFailoverProxyProvider" です

**Kerberos 認証が有効な Hadoop クラスターでは、追加の PROPERTIES 属性を設定する必要があります:**
- `dfs.namenode.kerberos.principal`: HDFS namenode サービスの principal 名
- `hadoop.security.authentication`: 認証方式を kerberos に設定します
- `hadoop.kerberos.principal`: Doris が HDFS に接続するときに使用する Kerberos principal を設定します
- `hadoop.kerberos.keytab`: keytab のローカルファイルパスを設定します

S3 プロトコルの場合は、S3 プロトコルの設定を直接行います。
 - `s3.endpoint`
 - `s3.access_key`
 - `s3.secret_key`
 - `s3.region`
 - `use_path_style`: （任意）デフォルトは `false` です。S3 SDK はデフォルトで Virtual-hosted Style を使用します。ただし、一部のオブジェクトストレージシステムでは Virtual-hosted Style によるアクセスが有効になっていない、またはサポートされていない場合があります。その場合は、`use_path_style` パラメータを追加して Path Style によるアクセスを強制できます。

> 注: `delete_existing_files` パラメータを使用するには、`fe.conf` に設定 `enable_delete_existing_files = true` を追加して fe を再起動する必要があります。その後、delete_existing_files が有効になります。delete_existing_files = true は危険な操作であるため、テスト環境でのみ使用することを推奨します。

## 戻り値 {#return-value}

Outfile 文が返す結果。各列の意味は次のとおりです。

| 列名       | 型       | 説明                                                                                  |
|------------|----------|---------------------------------------------------------------------------------------|
| FileNumber | int      | 最終的に生成されたファイル数                                                          |
| TotalRows  | int      | 結果セットの行数                                                                      |
| FileSize   | int      | エクスポートされたファイルの合計サイズ。単位: bytes。                                 |
| URL        | string   | エクスポートされたファイルパスのプレフィックス。複数ファイルには `_0`、`_1` のサフィックスが順に付加されます。 |

## 権限制御 {#permission-control}

この SQL コマンドを実行するユーザーは、少なくとも次の権限を持っている必要があります。

| 権限        | オブジェクト   | 説明                                  |
|:------------|:---------------|:--------------------------------------|
| SELECT_PRIV | データベース   | データベースとテーブルへの読み取り権限が必要です。 |

4.1.5 以降、Parquet エクスポートでは `enable_int96_timestamps` のデフォルトが `false` になり、論理 `INT64` タイムスタンプが使用されます。読み取り側で INT96 が必要な場合は、明示的に `true` に設定してください。このプロパティで指定できるのは `true` または `false` のみです。日付とタイムゾーンのセマンティクスについては、[Parquet](../../../../lakehouse/file-formats/parquet.md) を参照してください。

## 注意事項 {#notes}

### データ型のマッピング {#data-type-mapping}

- すべてのファイル形式で基本データ型のエクスポートをサポートしています。複雑なデータ型（ARRAY/MAP/STRUCT）については、現在 `csv`、`orc`、`csv_with_names`、`csv_with_names_and_types` のみが複雑型のエクスポートをサポートしており、ネストされた複雑型はサポートしていません。

- Parquet と ORC のファイル形式にはそれぞれ独自のデータ型があります。Doris のエクスポート機能は、Doris のデータ型を Parquet/ORC ファイル形式の対応するデータ型に自動的にエクスポートできます。以下に、Apache Doris のデータ型と Parquet/ORC ファイル形式のデータ型のマッピング表を示します。

1. **Doris から ORC ファイル形式へのデータ型マッピング表:**
   | Doris 型                 | Orc 型    |
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
   | timestamptz             | timestamp with local time zone (ORC TIMESTAMP_INSTANT; 4.1.5 以降は instant のセマンティクスを保持) |
   | varbinary               | binary    |
   | float                   | float     |
   | double                  | double    |
   | char / varchar / string | string    |
   | decimal                 | decimal   |
   | struct                  | struct    |
   | map                     | map       |
   | array                   | array     |

2. **Doris から Parquet ファイル形式へのデータ型マッピング表:**

   Doris が Parquet ファイル形式にエクスポートするときは、まず Doris のメモリデータを Arrow メモリデータ形式に変換し、その後 Arrow が Parquet ファイル形式に書き込みます。Doris のデータ型と Arrow のデータ型のマッピング関係は次のとおりです。
   | Doris 型                 | Arrow 型  |
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
   | decimal                 | decimal128 |
   | struct                  | struct     |
   | map                     | map        |
   | array                   | list       |

### エクスポートデータ量とエクスポート効率 {#export-data-volume-and-export-efficiency}

   この機能は本質的に SQL クエリコマンドを実行します。最終結果は単一スレッドで出力されます。そのため、エクスポート全体の所要時間には、クエリ実行時間と最終結果セットの書き込み時間が含まれます。クエリが大きい場合は、セッション変数 `query_timeout` を設定してクエリタイムアウトを適切に延長する必要があります。

### エクスポートファイルの管理 {#exported-file-management}

   Doris はエクスポートされたファイルを管理しません。正常にエクスポートされたファイルも、エクスポート失敗後に残ったファイルも、すべてユーザー自身で処理する必要があります。

### ローカルファイルへのエクスポート {#export-to-local-files}
   ローカルファイルにエクスポートするには、まず `fe.conf` で `enable_outfile_to_local=true` を設定します。
   ```sql
   select * from tbl1 limit 10
   INTO OUTFILE "file:///home/work/path/result_";
   ```

   ローカルファイルへのエクスポート機能はパブリッククラウドユーザーには適しておらず、プライベートデプロイメントのユーザーのみを対象としています。また、ユーザーがクラスター ノードを完全に制御できることを前提としています。Doris は、ユーザーが入力したエクスポートパスの有効性を検証しません。Doris プロセスのユーザーにそのパスへの書き込み権限がない場合、またはパスが存在しない場合は、エラーが報告されます。また、セキュリティ上の理由から、そのパスに同名のファイルがすでに存在する場合もエクスポートは失敗します。

   Doris はローカルにエクスポートされたファイルを管理せず、ディスク容量なども確認しません。これらのファイルは、クリーンアップなどを含め、ユーザー自身で管理する必要があります。

### 結果の完全性保証 {#result-integrity-guarantee}

   このコマンドは同期コマンドであるため、実行中にタスク接続が切断され、エクスポートされたデータが正常に終了したか、完全であるかを確認できなくなる可能性があります。この場合は、`success_file_name` パラメータを使用して、タスクが正常に完了した後にディレクトリ内へ成功ファイル識別子を生成するよう要求できます。ユーザーはこのファイルを使用して、エクスポートが正常に終了したかどうかを判断できます。

### 並行エクスポート {#concurrent-export}

   セッション変数 `set enable_parallel_outfile = true;` を設定すると、Outfile の並行エクスポートを有効にできます。

## 例 {#examples}

- Broker 方式を使用して、単純なクエリ結果をファイル `hdfs://path/to/result.txt` にエクスポートします。エクスポート形式として CSV を指定します。`my_broker` を使用し、kerberos 認証情報を設定します。列区切り文字を `,`、行区切り文字を `\n` に指定します。

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

   最終生成ファイルは、100MB 以下の場合は `result_0.csv` になります。
   100MB を超える場合は、`result_0.csv, result_1.csv, ...` になる可能性があります。

- 単純なクエリ結果をファイル `hdfs://path/to/result.parquet` にエクスポートします。エクスポート形式として PARQUET を指定します。`my_broker` を使用し、kerberos 認証情報を設定します。

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

- CTE 文のクエリ結果をファイル `hdfs://path/to/result.txt` にエクスポートします。デフォルトのエクスポート形式は CSV です。`my_broker` を使用し、HDFS の高可用性情報を設定します。デフォルトの行区切り文字と列区切り文字を使用します。

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

   最終生成ファイルは、1GB 以下の場合は `result_0.csv` になります。
   1GB を超える場合は、`result_0.csv, result_1.csv, ...` になる可能性があります。

- UNION 文のクエリ結果をファイル `bos://bucket/result.txt` にエクスポートします。エクスポート形式として PARQUET を指定します。`my_broker` を使用し、HDFS の高可用性情報を設定します。PARQUET 形式では列区切り文字を指定する必要はありません。
   エクスポート完了後、識別ファイルを生成します。

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

- Select 文のクエリ結果をファイル `s3a://${bucket_name}/path/result.txt` にエクスポートします。エクスポート形式として CSV を指定します。
   エクスポート完了後、識別ファイルを生成します。

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

   最終生成ファイルは、1GB 以下の場合は `my_file_0.csv` になります。
   1GB を超える場合は、`my_file_0.csv, result_1.csv, ...` になる可能性があります。
   cos での検証:

        1. 存在しないパスは自動的に作成されます
        2. access.key/secret.key/endpoint は cos の担当者に確認する必要があります。特に endpoint の値には bucket_name を入力する必要はありません。

- S3 プロトコルを使用して bos にエクスポートし、並行エクスポートを有効にします。

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

   最終生成ファイルのプレフィックスは `my_file_{fragment_instance_id}_` になります。

- S3 プロトコルを使用して bos にエクスポートし、並行エクスポートのセッション変数を有効にします。
   注: ただし、クエリ文にトップレベルのソートノードがあるため、並行エクスポートのセッション変数を有効にしていても、このクエリは並行エクスポートを使用できません。

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

- HDFS 方式を使用して、単純なクエリ結果をファイル `hdfs://${host}:${fileSystem_port}/path/to/result.txt` にエクスポートします。エクスポート形式を CSV、ユーザー名を work と指定します。列区切り文字を `,`、行区切り文字を `\n` に指定します。

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

   Hadoop クラスターで高可用性が有効になっており、Kerberos 認証を使用している場合は、次の SQL 文を参照してください。

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

   最終生成ファイルは、100 MB 以下の場合は `result_0.csv` になります。
   100 MB を超える場合は、`result_0.csv, result_1.csv, ...` になる可能性があります。

- Select 文のクエリ結果を Tencent Cloud cos のファイル `cosn://${bucket_name}/path/result.txt` にエクスポートします。エクスポート形式として CSV を指定します。
   エクスポート完了後、識別ファイルを生成します。

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
